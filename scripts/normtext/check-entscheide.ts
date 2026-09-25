// ─── Tor: Integrität des Rechtsprechungs-Korpus (offline) ───────────────────
//
// Pendant zu check-drift.ts (Gesetze), eigener Namespace → berührt die Gesetzes-
// Tore nie. Prüft: Manifest ⊇ Snapshots, Provenienz vollständig (§7), sha
// konsistent, Norm-Index-Refs ⊆ Manifest, ERFASST == Manifest-Keys, Mengen-
// Budget, Anonymisierungs-Heuristik (Warnung). Harte Verstösse → exit 1.

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { sha256EntscheidBloecke } from './sha-entscheide';
import { vergleicheLeitfaelle } from './entscheide-schreiben';
import { bandjahrDiffPlausibel } from './bge-bandjahr';
import { findeFremdeFundstelleImBody } from './entscheide-koerper-konflation';
import type { EntscheidSnapshotDatei } from '../../src/lib/rechtsprechung/typen';
import type { EntscheidManifest } from '../../src/lib/rechtsprechung/register';
import type { LeitfallRef, NormEntscheidIndex, LeitfallShard } from '../../src/lib/rechtsprechung/norm-index';

const ROOT = process.cwd();
const PUB = join(ROOT, 'public', 'rechtsprechung');
// Mengen-Budget (empirisch nachgezogen): 23.6.2026 8 → 20 MB; 26.6.2026 20 → 35 MB, weil
// jeder BGE-Leitentscheid nun ZWEI Texte trägt (voller Urteils-Body + amtlicher
// Sammlungs-Auszug) für den UI-Umschalter. Bewusst angehoben (Entscheid David 26.6.):
// der Browse-Index register.json bleibt klein (Metadaten); die Bodies sind lazy geladene
// statische Assets. Bleibt Deckel gegen unbeabsichtigte Massen-Importe, auf realem Niveau.
// Freigabe David 26.6.2026: dieser Deckel wird pro Aufgabe FLIESSEND gesetzt (Ist +
// grosszügige Reserve) und bei Bedarf deliberat angehoben — er bremst Unfälle, limitiert
// aber nicht künstlich. Bei Korpus-Ausbau bewusst nachziehen.
// 12.7.2026 (W2·6 BGE-Band-Nachzug 146–149): 35 → 100 MB. Der Korpus wächst von 272 auf
// 1060 amtliche BGE (Bände 146–149 VOLLSTÄNDIG = 788 neu, alle Sprachen — der frühere
// de-Filter hätte 247 fr/it-BGE still fehlen lassen; je ~70 KB Volltext+Auszug) ⇒ Ist
// nach Vollausbau ~78 MB. Deckel mit Reserve (fliessend, bremst Unfälle, Freigabe-Logik
// David 26.6.2026).
// 18.7.2026: 100 → 200 MB — David-Entscheid 18.7.2026; Bände 148–151 = 98,3 MB, deckt
// ~10+ weitere Jahrgänge; langfristig wandert der Korpus in die QS-DATA-DB-Auslieferung
// (FAHRPLAN-DATENHALTUNG).
// 19.7.2026: 200 → 1024 MB — David-Entscheid 19.7.2026 («1 GB für Kantons-Vollimporte»):
// BS-Rechtsprechungs-Vollimport seit 2022 (~3'765 Dokumente, amtliches Portal
// rechtsprechung.gerichte.bs.ch) + Luft für weitere Kantons-Tranchen (~+30 MB/Jahr BS).
const BUDGET_MB = 1024;
// Eigenes Budget für die eine Datei norm-index.json (W3): die neue Artikel-Ebene
// (proNormArtikel, keyed 'LAW/ART') fächert breit auf — ein Deckel verhindert, dass
// der Fan-out still ballooniert. Ist 2.7.2026 ≈ 0.53 MB (Erlass- + Artikel-Ebene);
// Deckel bewusst fliessend (Ist + grosszügige Reserve, bei Korpus-Ausbau nachziehen),
// bremst Unfälle, limitiert nicht künstlich (analog BUDGET_MB).
// 28.7.2026 (W2·6-NKEY Backfill): 3 → 8 MB. Ursache ist der Artikel-Fan-out der
// Fliesstext-Erkennung: der Backfill leitet die normKeys über ALLE 5093 Snapshots ab
// (vorher 1114), wodurch die Artikel-Ebene von 355 auf 4473 Buckets wächst — das Dekret
// («vollständig erkennen») ist genau dieser Fan-out, nicht ein Unfall. Ist 28.7.2026 =
// 6.13 MB, Deckel = Ist + ~25 % Reserve.
//
// WAS DIESER DECKEL IST — und was er NICHT ist (Linse 3, 28.7.2026, korrigiert die
// §15-Bewertung von ccde5187). Hier stand, die Auslieferung erfolge «bereits über die
// 157 Shards», die Anhebung sei also laufzeit-neutral. Das war NACHGEPRÜFT FALSCH:
// `ladeNormIndex()` fetchte norm-index.json zur LAUFZEIT, und `kontextEntscheide()`
// (src/lib/kontext.ts) rief darüber `rechtsprechungFuerErlass()` für das Verweis-
// Popover auf (KontextPanel.tsx). Die Shards sind die Artikel-, nicht die Erlass-Ebene
// und ersetzten ihn nicht.
// AUFGELÖST (W2·6-NKEY, 28.7.2026) nicht durch Anheben der gzip-Schranke, sondern
// durch eine schlanke Laufzeit-Projektion: schreibeKorpus schreibt zusätzlich
// `norm-index-erlasse.json` = { erzeugt, proNorm } aus DERSELBEN Quelle (§5, Byte-
// Gleichheit unten geprüft), und `rechtsprechungFuerErlass()` lädt nur noch die
// (93 statt 731 KB gzip). Damit trägt norm-index.json keinen Laufzeitpfad mehr —
// übrig bleibt `rechtsprechungFuerArtikel()` für Tests/Gegenprüfung.
// Dieser Deckel misst darum die DATEI AUF DER PLATTE (Unfall-Bremse gegen still
// ballonierenden Fan-out), NICHT die Nutzlast auf dem kritischen Pfad. Dafür
// zuständig ist check:perf-budget (scripts/check-perf-budget.ts) — und dort steht
// die gzip-Schranke jetzt auf norm-index-erlasse.json, mit derselben Begründung.
// §15-Logikverlust-Bewertung unverändert: keiner — reine Index-Grösse ohne
// Regeländerung, identische Rückgabewerte.
const NORM_INDEX_BUDGET_MB = 8;
// Per-Shard-Deckel (Linse 3, 28.7.2026, §15). Der Monolith-Deckel oben sagt NICHTS
// über die je Seite tatsächlich geladene Menge: der Leser (gesetz-leser/
// artikelKontext.ts, KontextPanel.tsx) zieht über `ladeLeitfallShard` genau EINEN Shard
// je Erlass. Der Backfill hat die grossen Shards ~3.5× wachsen lassen (Ist
// 28.7.2026, KiB wie unten gemessen: STPO 584, STGB 437, ZPO 426, OR 419,
// ZGB 398), und für sie gab es bis jetzt gar keinen Deckel: ein weiterer
// Fan-out-Schritt wäre auf der Leseseite still angekommen. 1024 KB = grösster
// Ist-Wert + ~75 % Reserve, fliessend nachzuziehen wie BUDGET_MB (Freigabe-Logik
// David 26.6.2026) — er bremst Unfälle, limitiert nicht künstlich.
// §6.7-Sabotage-Probe 28.7.2026: mit Deckel 400 KB meldet das Tor genau STPO,
// STGB, ZPO und OR rot — es kann scheitern, und zwar an den richtigen Dateien.
// Die eigentliche Lade-Optimierung (Shard-Staffelung/Artikel-Fenster) ist
// W2·7-VZUI-Thema, nicht diese Bau-Einheit.
const SHARD_BUDGET_KB = 1024;
// Mindestzahl-Ast (§17-Wurzel-Fix, Fund fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md:35,
// #691): zweite, unabhängige Schranke NEBEN der Bestandszahl-Sperre in
// `schreibeKorpus` (entscheide-schreiben.ts) — die dortige Sperre wirkt nur beim
// SCHREIBEN und nur gegen die 5 %-Toleranz eines einzelnen Laufs; dieses Tor liest
// den fertigen, committeten Bestand und fängt zusätzlich: einen Schreiber, der an
// `schreibeKorpus` vorbei direkt in `public/rechtsprechung` schreibt, einen bewusst
// mit `LEXMETRIK_ERLAUBE_ABGANG=1` durchgesetzten Abgang, der über eine sinnvolle
// Grösse hinausschiesst, oder einen Checkout, dem committete Dateien fehlen, ohne
// dass je ein Generator lief. Ist 12.9.2026 = 6341 Entscheide (inkl. `__voll`-
// Verweis-Einträge); Deckel = Ist − ~5 % Reserve, fliessend nachzuziehen wie
// BUDGET_MB (Freigabe-Logik David 26.6.2026) — bremst einen Unfall, limitiert das
// Wachstum nicht künstlich.
const MINDESTZAHL_ENTSCHEIDE = 6000;
const AHV = /\b756\.\d{4}\.\d{4}\.\d{2}\b/;   // CH-Sozialversicherungsnummer (darf nicht vorkommen)

const fehler: string[] = [];
const warn: string[] = [];

function dirGroesseMB(dir: string): number {
  let total = 0;
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop()!;
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) stack.push(p);
      else total += statSync(p).size;
    }
  }
  return total / (1024 * 1024);
}

type Abschnitte = EntscheidSnapshotDatei['eintraege'][number]['abschnitte'];
const fliesstext = (abs: Abschnitte | undefined) =>
  (abs ?? []).flatMap((a) => a.bloecke.map((b) => b.text)).join('\n');

/**
 * Wächter (Gegenprüfungs-Auflage C1, 12.9.2026, PR #816): ein Text trägt den
 * laufenden Seitenkopf eines ANDEREN BGE desselben Bandes — er gehört dann nicht
 * zur eigenen Fundstelle (OCL-Basis-Record-Konflation, Anlassfall bge_152_V_2 ←
 * 152 V 20). Legitime Zitierungen ÄLTERER Bände bleiben unberührt (siehe
 * entscheide-koerper-konflation.ts).
 * Seit 25.9.2026 AUCH auf dem amtlichen Sammlungs-Auszug (`auszugAbschnitte`):
 * dort steht seit #1099 der Sammlungstext, und 1300/1332 Auszüge tragen einen
 * Seitenkopf desselben Bandes (Messung 25.9.2026, main 4153b7361; Volltext
 * dagegen 6/1259) — ohne diese Prüfung lag der Hauptteil der Abdeckung
 * ausserhalb des Tors. Nullprobe main: 0 Befunde auf beiden Feldern.
 */
export function konflationsBefunde(
  key: string,
  bgeReferenz: string | null | undefined,
  snap: { abschnitte: Abschnitte; auszugAbschnitte?: Abschnitte },
): string[] {
  if (!bgeReferenz) return [];
  const out: string[] = [];
  const body = findeFremdeFundstelleImBody(fliesstext(snap.abschnitte), bgeReferenz);
  if (body) out.push(`${key}: Body trägt den laufenden Kopf von BGE ${body} (eigene Fundstelle ${bgeReferenz}) — Basis-Record-Konflation (§8, W2·18-FEHLERBUCH-Muster)`);
  const auszug = findeFremdeFundstelleImBody(fliesstext(snap.auszugAbschnitte), bgeReferenz);
  if (auszug) out.push(`${key}: Sammlungs-Auszug trägt den laufenden Kopf von BGE ${auszug} (eigene Fundstelle ${bgeReferenz}) — Auszug-Konflation (§8, W2·18-FEHLERBUCH-Muster)`);
  return out;
}

function main() {
  if (!existsSync(PUB) || !existsSync(join(PUB, 'register.json'))) {
    console.error('[check:entscheide] public/rechtsprechung/register.json fehlt — Korpus nicht gebaut.');
    process.exit(1);
  }
  const manifest = JSON.parse(readFileSync(join(PUB, 'register.json'), 'utf8')) as EntscheidManifest;
  const keys = new Set(manifest.entscheide.map((e) => e.key));
  const azaKeys: Record<string, string[]> = {};   // aza-Key → BGE-Keys (Kollisions-Backstop)

  // Mindestzahl-Ast: siehe Begründung an MINDESTZAHL_ENTSCHEIDE oben.
  if (manifest.entscheide.length < MINDESTZAHL_ENTSCHEIDE) {
    fehler.push(
      `Mindestzahl unterschritten: ${manifest.entscheide.length} Entscheide < ${MINDESTZAHL_ENTSCHEIDE} `
      + `(Bestandszahl-Sperre in schreibeKorpus umgangen oder Checkout unvollständig — #691).`,
    );
  }

  for (const e of manifest.entscheide) {
    // Verweis-Eintrag (vollständiges Urteil zu einem BGE, Deep-Link): KEIN eigenes
    // Snapshot-File; eigene Invarianten, dann überspringen (keine Datei-/sha-Prüfung).
    if (e.verweis) {
      if (e.datei) fehler.push(`${e.key}: Verweis-Eintrag darf keine datei haben`);
      if (e.bgeReferenz) fehler.push(`${e.key}: Verweis-Eintrag mit bgeReferenz (Doppelzählung §8)`);
      if (e.leitcharakter !== 'routine') fehler.push(`${e.key}: Verweis-Eintrag muss 'routine' sein`);
      if (!/^https?:\/\//.test(e.quelleUrl)) fehler.push(`${e.key}: Verweis-quelleUrl nicht http(s)`);
      if (!keys.has(e.verweis.zielKey)) fehler.push(`${e.key}: Verweis-zielKey ${e.verweis.zielKey} unbekannt`);
      continue;
    }
    // Provenienz (§7)
    for (const f of ['datum', 'quelleUrl', 'quelle', 'fassungsToken'] as const) {
      if (!e[f]) fehler.push(`${e.key}: Provenienz-Feld '${f}' fehlt`);
    }
    // §8-Invariante: 'leitentscheid' ⟺ amtlicher BGE (bgeReferenz). Eine maschinelle/
    // kantonale Regeste begründet KEINEN Leitstatus (Befund 26.6.2026: verriegelt gegen
    // ein versehentliches Wiedereinführen des '!!regeste'-Glieds in der Klassifizierung).
    if (e.leitcharakter === 'leitentscheid' && !e.bgeReferenz) {
      fehler.push(`${e.key}: 'leitentscheid' ohne bgeReferenz — kein amtlicher BGE (§8)`);
    }
    if (e.bgeReferenz && e.leitcharakter !== 'leitentscheid') {
      fehler.push(`${e.key}: bgeReferenz ohne 'leitentscheid' — Invariante verletzt (§8)`);
    }
    if (e.kuratierung === 'geprueft') warn.push(`${e.key}: kuratierung 'geprueft' ohne Abnahme? (P0 erwartet 'maschinell')`);
    // Bandjahr-Plausibilität (Register-Sweep, Fund 12.9.2026, W2·18-FEHLERBUCH):
    // ein BGE-Band deckt genau einen Jahrgang (Band+1874 = Publikationsjahr, §2, seit
    // 1875) — das OCL-`decision_date` ist bei einzelnen BGE ein Platzhalter/Fehlwert
    // (Anlassfall bge_151_II_475: persistiertes Datum 1999-06-21 = das in der Regeste
    // zitierte Luftverkehrsabkommen, nicht das Urteil; amtlich 2C_64/2023 vom
    // 26.11.2024). Fenster wie im aza-Resolver (adapter-entscheide.ts, §8): ein
    // Urteil datiert nie nach dem Bandjahr und praktisch nie mehr als 5 Jahre davor.
    if (e.bgeReferenz && e.datum) {
      const { ok, diff, bandJahr } = bandjahrDiffPlausibel(e.bgeReferenz, e.datum);
      if (!ok) {
        fehler.push(`${e.key}: Entscheiddatum ${e.datum} liegt ${diff} Jahre vor dem BGE-Bandjahr ${bandJahr} (bgeReferenz ${e.bgeReferenz}) — Band+1874 ist die kanonische Jahresquelle (§2); OCL-decision_date-Fehlwert prüfen (W2·18-FEHLERBUCH-Muster).`);
      }
    }
    if (e.datum && manifest.erzeugt && e.datum > manifest.erzeugt) {
      warn.push(`${e.key}: Entscheiddatum ${e.datum} liegt nach dem Erzeugungsdatum ${manifest.erzeugt} (OCL-Publikations-/Datumsartefakt prüfen)`);
    }
    // Datei + sha + Anonymisierung
    if (!e.datei) { if (e.bestand === 'snapshot') fehler.push(`${e.key}: bestand 'snapshot' ohne datei`); continue; }
    const fp = join(PUB, e.datei);
    if (!existsSync(fp)) { fehler.push(`${e.key}: Datei ${e.datei} fehlt`); continue; }
    const d = JSON.parse(readFileSync(fp, 'utf8')) as EntscheidSnapshotDatei;
    const snap = d.eintraege?.[0];
    if (!snap) { fehler.push(`${e.key}: keine eintraege in ${e.datei}`); continue; }
    const erwartet = sha256EntscheidBloecke(snap.abschnitte);
    if (snap.sha !== erwartet) fehler.push(`${e.key}: sha-Drift (Datei ${snap.sha?.slice(0, 8)} ≠ erwartet ${erwartet.slice(0, 8)})`);
    const volltext = snap.abschnitte.flatMap((a) => a.bloecke.map((b) => b.text)).join('\n');
    if (AHV.test(volltext) || AHV.test(snap.regeste?.text ?? '')) warn.push(`${e.key}: mögliche AHV-Nummer im Text (Anonymisierung prüfen)`);
    fehler.push(...konflationsBefunde(e.key, e.bgeReferenz, snap));
    // Wächter (Gegenprüfungs-Auflage B2, 12.9.2026, PR #816): ein amtlicher BGE
    // (regesteAmtlich, leitcharakter==='leitentscheid') mit Regeste-Text MUSS die
    // dreisprachige Struktur (A18) tragen — 1258/1259 taten das, bis der B1-Refresh
    // sie bei 6 BGE durch reines Überschreiben verlor (mergeB1Ergebnis behebt die
    // Wurzel). Einzige bekannte, datiert begründete Ausnahme: `bge_149_IV_1` — die
    // amtliche DE-clir-Seite rendert für diesen BGE nur Regeste-Teil a (Sterneintrag),
    // Teil b liegt nur auf fr/it-clir + im OCL-Flachtext vor (`deClirDegradiert` in
    // normtext-entscheide.ts hängt darum bewusst KEINE unvollständige DE-Fassung an,
    // sonst A29-Tor rot) — dokumentiert seit W2·6-B (5.7.2026).
    const SPRACHFASSUNGEN_AUSNAHME = new Set<string>(['bge_149_IV_1']);
    if (e.leitcharakter === 'leitentscheid' && snap.regesteAmtlich && snap.regeste?.text
        && !snap.regeste.sprachfassungen?.length && !SPRACHFASSUNGEN_AUSNAHME.has(e.key)) {
      fehler.push(`${e.key}: amtlicher BGE mit Regeste, aber OHNE sprachfassungen (A18-Struktur fehlt — B1-Merge-Verlust? W2·18-FEHLERBUCH-Muster)`);
    }
    // W2·6-B B2+A18: strukturierte, dreisprachige Regeste (bger.ch clir). Invarianten
    // (§1/§2, hart): nur amtliche BGE tragen sie · Reihenfolge STRIKT DE→FR→IT · jede
    // Fassung hat einen nicht-leeren Kopf + amtliche clir-quelleUrl · keine Sprach-
    // Dublette. So ist «nach Sprachen sortiert» (A18) maschinell garantiert.
    const sf = snap.regeste?.sprachfassungen;
    if (sf?.length) {
      if (!snap.regesteAmtlich) fehler.push(`${e.key}: sprachfassungen an nicht-amtlicher Regeste (§8)`);
      const RANG: Record<string, number> = { de: 0, fr: 1, it: 2, rm: 3 };
      for (let i = 0; i < sf.length; i++) {
        const f = sf[i];
        if (!f.kopf?.trim()) fehler.push(`${e.key}: sprachfassung[${f.sprache}] ohne Kopf`);
        if (!/^https?:\/\/(?:www|search)\.bger\.ch\//.test(f.quelleUrl ?? '')) {
          fehler.push(`${e.key}: sprachfassung[${f.sprache}] ohne amtliche clir-quelleUrl`);
        }
        if (i > 0 && RANG[sf[i - 1].sprache] >= RANG[f.sprache]) {
          fehler.push(`${e.key}: sprachfassungen nicht DE→FR→IT sortiert (${sf.map((x) => x.sprache).join('→')})`);
        }
        // A29: mehrteilige Regeste ist strukturell konsistent — >1 Teil, jeder mit
        // Kopf, erster Teil trägt Label 'a' (amtliche Enumeration), keine Lücke.
        const wr = f.weitereRegesten;
        if (wr) {
          if (wr.length < 2) fehler.push(`${e.key}: sprachfassung[${f.sprache}] weitereRegesten mit <2 Teilen (nur bei Mehrteiligkeit setzen)`);
          if (wr[0] && wr[0].label !== 'a') fehler.push(`${e.key}: sprachfassung[${f.sprache}] erster Regeste-Teil hat Label '${wr[0]?.label}' statt 'a'`);
          if (wr[0] && (wr[0].kopf !== f.kopf || JSON.stringify(wr[0].absaetze) !== JSON.stringify(f.absaetze))) {
            fehler.push(`${e.key}: sprachfassung[${f.sprache}] weitereRegesten[0] ≠ kopf/absaetze (Fallback-Projektion inkonsistent, §5)`);
          }
          for (const t of wr) if (!t.kopf?.trim()) fehler.push(`${e.key}: sprachfassung[${f.sprache}] Regeste-Teil '${t.label}' ohne Kopf`);
        }
      }
      // A29 Anti-Regression: trägt die amtliche Quelle (flacher OCL-Regestetext) einen
      // zweiten Regeste-Block («Regeste b»/«Regesto b»…), MUSS die DE-Fassung diesen als
      // weitereRegesten strukturiert führen — sonst ist ein Regeste-Teil verloren
      // (genau der Bug von BGE 147 III 121). Marker nur am Zeilenanfang → keine Zitat-Treffer.
      const marker = /\n\s*Regest[eo]\s+([b-z])\s*\n/.exec(snap.regeste?.text ?? '');
      if (marker) {
        const de = sf.find((x) => x.sprache === 'de');
        if (!de?.weitereRegesten || de.weitereRegesten.length < 2) {
          fehler.push(`${e.key}: Quelle trägt «Regeste ${marker[1]}», aber DE-Fassung ohne weitereRegesten (A29 — Regeste-Teil verloren)`);
        }
      }
    }
    // BGE-Umschalter-Integrität (§8, Bug-Check 26.6.): auszugAbschnitte ⟹ azaUrteil; und
    // der Volltext darf nicht deutlich kürzer sein als der Auszug (Inversion = falscher aza).
    if (snap.auszugAbschnitte?.length && !snap.azaUrteil) {
      fehler.push(`${e.key}: auszugAbschnitte ohne azaUrteil — Umschalter-Invariante verletzt (§8)`);
    }
    if (snap.azaUrteil) {
      (azaKeys[snap.azaUrteil.key] ??= []).push(e.key);
      // §7/§8-Tor: aufgelöstes Urteil MUSS eine http(s)-Live-Quelle (massgebliche Fassung)
      // tragen — sonst zeigt die Voll-Ansicht/Übersichts-Karte still auf den BGE statt aufs Urteil.
      if (!/^https?:\/\//.test(snap.azaUrteil.quelleUrl ?? '')) {
        fehler.push(`${e.key}: azaUrteil ohne http(s)-quelleUrl (massgebliche Fassung fehlt)`);
      }
      const len = (a?: typeof snap.abschnitte) => (a ?? []).reduce((n, ab) => n + ab.bloecke.reduce((m, b) => m + b.text.length, 0), 0);
      if (snap.auszugAbschnitte?.length && len(snap.abschnitte) < len(snap.auszugAbschnitte) * 0.85) {
        warn.push(`${e.key}: Volltext kürzer als Auszug (mögliche aza-Fehlzuordnung/Inversion)`);
      }
    }
    // Vollständigkeits-/Plausibilitäts-Warnungen (P4, nicht-blockierend).
    const sv = snap.abschnitte.find((a) => a.typ === 'sachverhalt');
    if (sv && sv.vollstaendig === false) warn.push(`${e.key}: Sachverhalt nur Auszug (full_text-Schnitt fehlgeschlagen?)`);
    // W2·6-BGE Schutz-Tor: ein Block, der auf U+2026 (…) endet, ist ein gekapptes OCL-Excerpt
    // (Abbruch am 5000-Boundary, egal ob davor Buchstabe/Space/Punkt/Ziffer steht). Einzige
    // Ausnahme: das amtliche «(…)»-Auslassungszeichen (Lookbehind `(?<!\()`). Hart blockierend
    // (§8: kein still unvollständiger Entscheidtext).
    // BS-Tranche (19.7.2026): NUR für Excerpt-Risiko-Quellen (OCL/entscheidsuche) — die
    // gerichte-bs-Pipeline kennt keinen Kappungs-Mechanismus (raw-golden, Vollständigkeit
    // sichern Count-/Fidelity-Gates in check:bs-entscheide); reale BS-Urteile enden z.T.
    // verbatim amtlich auf «.…» (AUS.2026.4 E. 2.2.3, nF30_KEY 79253) — kein Kappungs-Indiz.
    for (const [feld, abs] of snap.quelle === 'gerichte-bs' ? [] as const : [['abschnitte', snap.abschnitte], ['auszugAbschnitte', snap.auszugAbschnitte ?? []]] as const) {
      for (const a of abs) for (const b of a.bloecke) {
        if (/(?<!\()…\s*$/u.test(b.text)) {
          fehler.push(`${e.key}: ${feld} bricht mitten im Wort ab (U+2026, gekapptes Excerpt): «…${b.text.trimEnd().slice(-40)}»`);
        }
      }
    }
    for (const a of snap.abschnitte) for (const b of a.bloecke) {
      if (a.typ === 'dispositiv' && b.text.length > 4000) warn.push(`${e.key}: Dispositiv-Block ${b.text.length} Z. (>4000 — Korruption?)`);
    }
    const tops = (snap.abschnitte.find((a) => a.typ === 'erwaegung')?.bloecke ?? [])
      .map((b) => Number(/(\d+)/.exec(b.marke ?? '')?.[1] ?? NaN)).filter(Number.isFinite);
    for (let i = 1; i < tops.length; i++) if (tops[i] - tops[i - 1] >= 3) { warn.push(`${e.key}: Erwägungs-Top-Sprung ${tops[i - 1]}→${tops[i]}`); break; }
  }

  // aza-Kollision (§8-Backstop, Bug-Check 26.6.): kein aza-Urteil darf von ZWEI BGE als
  // Volltext beansprucht werden — sonst ist mindestens eine Zuordnung falsch.
  for (const [k, refs] of Object.entries(azaKeys)) {
    if (refs.length > 1) fehler.push(`aza-Kollision: ${k} von mehreren BGE beansprucht (${refs.join(', ')}) — Fehlzuordnung (§8)`);
  }

  // Norm-Index: jede referenzierte key ⊆ Manifest (Erlass- UND Artikel-Ebene) + Grössen-Budget.
  const niPfad = join(PUB, 'norm-index.json');
  if (existsSync(niPfad)) {
    const idx = JSON.parse(readFileSync(niPfad, 'utf8')) as NormEntscheidIndex;
    for (const [nk, refs] of Object.entries(idx.proNorm)) {
      for (const r of refs) if (!keys.has(r.key)) fehler.push(`norm-index[${nk}]: unbekannter key ${r.key}`);
    }
    for (const [ak, refs] of Object.entries(idx.proNormArtikel ?? {})) {
      // Schlüssel 'LAW/ART': genau ein '/' als Trenner (ART-Token kann Buchstaben tragen).
      if (!/^[^/]+\/[^/]+$/.test(ak)) fehler.push(`norm-index-artikel: ungültiger Schlüssel '${ak}' (erwartet 'LAW/ART')`);
      for (const r of refs) {
        if (!keys.has(r.key)) fehler.push(`norm-index-artikel[${ak}]: unbekannter key ${r.key}`);
        if (typeof r.gewicht !== 'number' || r.gewicht < 0) fehler.push(`norm-index-artikel[${ak}] ${r.key}: ungültiges gewicht ${r.gewicht}`);
      }
    }
    const niMb = statSync(niPfad).size / (1024 * 1024);
    if (niMb > NORM_INDEX_BUDGET_MB) fehler.push(`norm-index.json-Budget überschritten: ${niMb.toFixed(2)} MB > ${NORM_INDEX_BUDGET_MB} MB (Artikel-Fan-out?)`);

    // ── Schlanke Laufzeit-Projektion ≡ Monolith (W2·6-NKEY §5/§15) ─────────────
    // norm-index-erlasse.json trägt dieselbe Erlass-Ebene wie norm-index.json und ist
    // die Datei, die `rechtsprechungFuerErlass()` zur Laufzeit zieht. Zwei Dateien mit
    // demselben Inhalt sind nur so lange EINE Quelle, wie das jemand nachprüft — sonst
    // entsteht genau die zweite Wahrheit, die §5 verbietet (ein Nachpflege-Skript, das
    // nur den Monolithen anfasst, würde die UI still auf Altstand servieren).
    // Der Beweis ist BYTE-scharf, nicht bloss strukturell: erwartet wird exakt die
    // Serialisierung, die schreibeKorpus() erzeugt (2-Space, Trailing-Newline, dieselbe
    // Schlüsselfolge) — damit fällt auch eine blosse Umsortierung auf.
    const erlPfad = join(PUB, 'norm-index-erlasse.json');
    if (!existsSync(erlPfad)) {
      fehler.push('norm-index-erlasse.json fehlt — der Laufzeitpfad (rechtsprechungFuerErlass) lädt diese Datei; Korpus neu schreiben.');
    } else {
      const soll = JSON.stringify({ erzeugt: idx.erzeugt, proNorm: idx.proNorm }, null, 2) + '\n';
      const ist = readFileSync(erlPfad, 'utf8');
      if (ist !== soll) {
        const istObj = JSON.parse(ist) as { erzeugt: string; proNorm: Record<string, unknown[]> };
        const istKeys = Object.keys(istObj.proNorm ?? {});
        const sollKeys = Object.keys(idx.proNorm);
        const fehlend = sollKeys.filter((k) => !istKeys.includes(k));
        const zuviel = istKeys.filter((k) => !sollKeys.includes(k));
        fehler.push(
          `norm-index-erlasse.json ≠ norm-index.json (proNorm/erzeugt) — zweite Wahrheit auf dem Laufzeitpfad (§5). `
          + `Buckets ist ${istKeys.length} / soll ${sollKeys.length}`
          + (fehlend.length ? `, fehlend: ${fehlend.slice(0, 5).join(', ')}` : '')
          + (zuviel.length ? `, überzählig: ${zuviel.slice(0, 5).join(', ')}` : '')
          + (istObj.erzeugt !== idx.erzeugt ? `, erzeugt ${istObj.erzeugt} ≠ ${idx.erzeugt}` : '')
          + '. Korpus neu schreiben (npm run entscheide -- --remap).',
        );
      }
    }

    // Schaufenster-Shards (Weiche B): jeder Shard MUSS die Artikel-Ebene des Gesamt-JSON
    // reproduzieren — MEMBERSHIP (welche Leitfälle je Artikel) zeichengleich, damit der
    // ArtikelLeser dieselben Chips zeigt wie rechtsprechungFuerArtikel() (keine Daten-
    // spaltung, §5). Das `gewicht` darf V1b-provenienziert abweichen (§3): ein 'alt'-Shard
    // ist byte-gleich zur Alt-In-degree; ein 'e4'-Shard trägt die Massen-Rangliste, dann
    // gilt gewicht ≥ Alt (monoton, grösserer Korpus) + Neusortierung nach vergleicheLeitfaelle.
    // masse.db-frei (committet-vs-committet) — der volle Vintage/Recall-Beweis ist das
    // lokale Oracle-Tor `datenhaltung:rangliste-oracle`.
    const shardDir = join(PUB, 'norm-index');
    if (existsSync(shardDir)) {
      const proArtikelSoll = idx.proNormArtikel ?? {};
      const erlasseSoll = new Set(Object.keys(proArtikelSoll).map((k) => k.slice(0, k.indexOf('/'))));
      const shardDateien = readdirSync(shardDir).filter((f) => f.endsWith('.json')).sort();
      // Grösster Shard sichtbar machen: ein Deckel, dessen Abstand niemand sieht,
      // wird erst beim Reissen bemerkt (§8).
      const groesster = shardDateien
        .map((f) => ({ f, kb: statSync(join(shardDir, f)).size / 1024 }))
        .sort((a, b) => b.kb - a.kb || (a.f < b.f ? -1 : 1))[0];
      if (groesster) {
        console.log(
          `[check:entscheide] Shards: ${shardDateien.length}, grösster ${groesster.f} `
          + `${groesster.kb.toFixed(0)} KB (Budget ${SHARD_BUDGET_KB} KB).`,
        );
      }
      const erlasseIst = new Set(shardDateien.map((f) => f.slice(0, -5)));
      for (const e of erlasseSoll) if (!erlasseIst.has(e)) fehler.push(`Shard fehlt für Erlass '${e}' (hat Artikel-Treffer im norm-index)`);
      for (const e of erlasseIst) if (!erlasseSoll.has(e)) fehler.push(`Shard '${e}.json' ohne Artikel-Treffer im norm-index (verwaist)`);
      // Ein Leitfall ist bis auf `gewicht` (V1b) identisch — alle übrigen Felder byte-gleich.
      const ohneGewicht = (r: LeitfallRef): string => JSON.stringify({ ...r, gewicht: 0 });
      const gesehen = new Set<string>();
      for (const f of shardDateien) {
        const shardPfad = join(shardDir, f);
        // Per-Shard-Deckel (§15): dies ist die Menge, die eine EINZELNE Leserseite
        // wirklich zieht — der Monolith-Deckel oben sieht sie nicht.
        const shardKb = statSync(shardPfad).size / 1024;
        if (shardKb > SHARD_BUDGET_KB) {
          fehler.push(
            `Shard '${f}' überschreitet das Per-Shard-Budget: ${shardKb.toFixed(0)} KB > `
            + `${SHARD_BUDGET_KB} KB. Das ist die Nutzlast EINER Erlass-Leserseite `
            + `(ladeLeitfallShard) — entweder den Fan-out prüfen oder den Deckel `
            + `deliberat nachziehen (§15; Lade-Optimierung → W2·7-VZUI).`,
          );
        }
        const s = JSON.parse(readFileSync(shardPfad, 'utf8')) as LeitfallShard;
        const erlass = f.slice(0, -5);
        if (s.erlass !== erlass) fehler.push(`Shard '${f}': erlass-Feld '${s.erlass}' ≠ Dateiname '${erlass}'`);
        if (s.gewichtQuelle !== 'alt' && s.gewichtQuelle !== 'e4') fehler.push(`Shard '${f}': gewichtQuelle '${String(s.gewichtQuelle)}' ∉ {alt,e4}`);
        for (const [tok, refs] of Object.entries(s.proArtikel)) {
          const ak = `${erlass}/${tok}`;
          gesehen.add(ak);
          const soll = proArtikelSoll[ak];
          if (!soll) { fehler.push(`Shard '${f}': Artikel '${tok}' fehlt in proNormArtikel (verwaiste Membership)`); continue; }
          // Membership + Nicht-gewicht-Felder zeichengleich (Reihenfolge darf V1b-sortiert abweichen).
          const sollByKey = new Map(soll.map((r) => [r.key, r]));
          if (refs.length !== soll.length) fehler.push(`Shard '${f}' [${tok}]: ${refs.length} Leitfälle ≠ ${soll.length} im norm-index (Membership-Drift)`);
          for (const r of refs) {
            const sr = sollByKey.get(r.key);
            if (!sr) { fehler.push(`Shard '${f}' [${tok}]: Leitfall '${r.key}' nicht im norm-index (Membership-Drift)`); continue; }
            if (ohneGewicht(r) !== ohneGewicht(sr)) fehler.push(`Shard '${f}' [${tok}] ${r.key}: Nicht-gewicht-Feld weicht vom norm-index ab`);
            if (s.gewichtQuelle === 'alt' && r.gewicht !== sr.gewicht) fehler.push(`Shard '${f}' [${tok}] ${r.key}: 'alt' aber gewicht ${r.gewicht} ≠ ${sr.gewicht}`);
            if (s.gewichtQuelle === 'e4' && r.gewicht < sr.gewicht) fehler.push(`Shard '${f}' [${tok}] ${r.key}: 'e4' aber gewicht ${r.gewicht} < Alt ${sr.gewicht} (nicht monoton)`);
          }
          // Sortierung: absteigend nach der EINEN Ordnung (gewicht ↓, Leitentscheid, Datum ↓, key).
          for (let i = 1; i < refs.length; i++) if (vergleicheLeitfaelle(refs[i - 1], refs[i]) > 0) fehler.push(`Shard '${f}' [${tok}]: Leitfälle nicht nach vergleicheLeitfaelle sortiert (Position ${i})`);
        }
      }
      for (const ak of Object.keys(proArtikelSoll)) if (!gesehen.has(ak)) fehler.push(`proNormArtikel '${ak}' fehlt in den Shards (Projektion unvollständig)`);
    }
  } else {
    // §6.7 — ein Tor, das nicht scheitern kann, ist gefährlicher als keines.
    // ALLES oberhalb hängt an diesem einen `existsSync`: Key-Integrität beider
    // Index-Ebenen, das norm-index-Budget, die BYTE-Gleichheit der Laufzeit-
    // Projektion norm-index-erlasse.json und die komplette Shard-Membership.
    // Ohne diesen Zweig verschwände die Deckung STILL, sobald der Monolith fehlt:
    // das Tor meldete grün, ohne irgendetwas davon geprüft zu haben — und gerade
    // die Laufzeit-Datei bliebe ungeprüft, obwohl sie die ist, die der Nutzer lädt.
    // Ein fehlender Monolith ist kein zulässiger Zustand: schreibeKorpus schreibt
    // ihn bei JEDEM Lauf.
    fehler.push(
      'norm-index.json fehlt — damit entfiele die gesamte Norm-Index-Deckung '
      + '(Key-Integrität, Grössen-Budget, Byte-Gleichheit von norm-index-erlasse.json '
      + 'auf dem Laufzeitpfad, Shard-Membership). Korpus neu schreiben '
      + '(npm run entscheide -- --remap).',
    );
  }

  // ERFASST == Manifest-Keys
  const genPfad = join(ROOT, 'src', 'lib', 'rechtsprechung', 'erfasste-keys.generated.ts');
  if (existsSync(genPfad)) {
    const gen = readFileSync(genPfad, 'utf8');
    const inSet = new Set([...gen.matchAll(/"([^"]+)"/g)].map((m) => m[1]));
    for (const k of keys) if (!inSet.has(k)) fehler.push(`ERFASST fehlt key ${k}`);
    for (const k of inSet) if (!keys.has(k)) fehler.push(`ERFASST hat verwaisten key ${k}`);
  }

  // Mengen-Budget
  const mb = dirGroesseMB(PUB);
  if (mb > BUDGET_MB) fehler.push(`Mengen-Budget überschritten: ${mb.toFixed(1)} MB > ${BUDGET_MB} MB`);

  for (const w of warn) console.warn(`[check:entscheide] WARN ${w}`);
  if (fehler.length) {
    for (const f of fehler) console.error(`[check:entscheide] FEHLER ${f}`);
    process.exit(1);
  }
  console.log(`[check:entscheide] OK — ${manifest.entscheide.length} Entscheide, ${mb.toFixed(2)} MB, ${warn.length} Warnung(en).`);
}

// Entry-Erkennung über `VITEST` (Repo-Muster check-e2e-flake.ts): der Test
// importiert `konflationsBefunde` und darf keinen Lauf/Exit auslösen.
if (!process.env.VITEST) main();
