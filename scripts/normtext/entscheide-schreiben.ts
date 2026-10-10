// ─── Korpus schreiben (geteilt: Live-Generator, Offline-Seed, Tests) ─────────
//
// Schreibt aus einer Auswahl EntscheidSnapshots die public/rechtsprechung-Dateien:
// je Entscheid eine Datei + register.json (Manifest) + norm-index.json +
// norm-index-erlasse.json (schlanke Laufzeit-Projektion der Erlass-Ebene) +
// erfasste-keys.generated.ts (interne Verlinkung). Eine Stelle, kein Duplikat (§5).

import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { kuerzeRegeste, normalisiereRegeste } from '../../src/lib/rechtsprechung/register';
import type { EntscheidSnapshot, EntscheidSnapshotDatei } from '../../src/lib/rechtsprechung/typen';
import type { BrowseEntscheidVoll, EntscheidManifest, RichterRef, RichterRegister } from '../../src/lib/rechtsprechung/register';
import { teileRegister } from './register-teilen';
import { parseBesetzung, kanonisiere, bereinigeBesetzungsFreitext, type KanonEintrag } from '../../src/lib/rechtsprechung/besetzung';
import type { EntscheidRef, LeitfallRef, LeitfallShard } from '../../src/lib/rechtsprechung/norm-index';
import { minteEcliFuerSnapshot } from '../../src/lib/rechtsprechung/ecli';
import { artikelSchluesselMitBefund, AUSGESCHLOSSENE_KEYS } from './entscheide-mapping';
import { vergleiche } from './vergleich';
import {
  baueBezugsBilanz, baueBezugsIndex, baueBezugsShards, ladeBestaende, projiziereBundesgericht,
  serialisiereShard, type BezugsIndex,
} from './bezuege-bauen';
import { kantoneOhneResolver } from './kanton-norm-resolver';

// Identitäts-Primitive (keyVon/kanonZitat/selbstTokens) leben seit W2·7-BEZUG in
// entscheide-identitaet.ts — der generische Bezugs-Bau braucht sie, darf diesen
// Schreiber aber nicht importieren (Zyklus). Re-Export unverändert, damit die
// Bestands-Aufrufer (check-besetzung, check-rangliste-oracle, Tests) unberührt
// bleiben (§5: EINE Stelle, zwei Konsumenten).
import { keyVon, kanonZitat } from './entscheide-identitaet';
export { keyVon, kanonZitat };

/** Gekürzte Regeste aus dem geglätteten Text (normalisiereRegeste strippt u.a. die Überschrift). */
function regesteKurzVon(snap: EntscheidSnapshot): string | null {
  return snap.regeste ? kuerzeRegeste(normalisiereRegeste(snap.regeste.text)) : null;
}

/**
 * DIE Regel für `regesteKurz` in ALLEN Projektionen (register.json, proNorm,
 * proNormArtikel, Shards) — §5, EINE Stelle.
 *
 * Zwei Quellen, in dieser Reihenfolge:
 *   1. die amtliche Regeste, geglättet und gekürzt;
 *   2. NUR für die BS-Tranche (Bauplan §4): das Portal publiziert keine Regeste,
 *      aber einen amtlichen Betreff-Titel (`rubrum.gegenstand`) → Karten-Kurzzeile
 *      ≤ 120 Zeichen. `regesteVorhanden` bleibt dabei false: der Titel ist Betreff,
 *      keine Regeste (§8 — nicht als amtliche Regeste ausgeben, was keine ist).
 *
 * ALS FUNKTION HERAUSGEZOGEN 28.7.2026 (Linse 4). Stufe 2 stand vorher nur inline
 * in `schreibeKorpus`; `regeste-kurz-refresh.ts` rechnete daneben mit Stufe 1
 * allein. GEMESSEN: ein `--schreiben`-Refresh hätte die Kurzzeile bei ALLEN 3765
 * BS-Entscheiden auf null gesetzt — ein stiller Inhaltsverlust auf der Browse-Seite,
 * ausgelöst von einem Skript, das nur «auffrischen» sollte. Genau die zweite
 * Wahrheit, gegen die §5 steht.
 */
export function manifestRegesteKurz(snap: EntscheidSnapshot): string | null {
  return regesteKurzVon(snap)
    ?? (snap.quelle === 'gerichte-bs' && snap.rubrum?.gegenstand
      ? kuerzeRegeste(snap.rubrum.gegenstand, 120) : null);
}

// `refVon` (Snapshot → EntscheidRef) ist mit W2·7-BEZUG entfallen: die Artikel-
// Ebene baut jetzt der generische Bezugs-Bau (bezuege-bauen.ts) und setzt die
// Kurzzeile über die hereingereichte `manifestRegesteKurz` — dieselbe Regel,
// eine Stelle weniger (§5). Die Erlass-Ebene (proNorm) füllt schreibeKorpus
// weiterhin inline; ihre Felder stehen dort im Klartext.

// Deckel je Artikel: «Leitfälle», keine Vollliste — bremst die Artikel-Fan-out des
// norm-index.json (Budget-Tor in check-entscheide.ts). Bewusst kleiner als der
// Erlass-Deckel (12), weil eine Artikel-Ansicht die wenigen zentralen Fälle zeigt.
const LEITFAELLE_PRO_ARTIKEL = 8;

/**
 * BESTANDSZAHL-SPERRE (§17-Wurzel-Fix, Fund fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md:35,
 * #691). `schreibeKorpus` ist die EINE Schreibstelle (§5) für JEDEN additiven Aufruf
 * in scripts/normtext-entscheide.ts (additiv/bge-refresh/regeste-refresh/rubrum-
 * refresh/remap/bge-baender) — jeder Aufrufer schützt nur mit `if (!basis.length)`,
 * das verhindert einen KOMPLETT leeren Lauf, nicht eine stumm GESCHRUMPFTE Teilmenge
 * (ein fehlender Shard auf der Platte, ein falscher cwd bei relativer `root`, ein
 * halber Checkout — `ladeBestandSnapshots` übersprang bisher unauffindbare Dateien
 * mit einem blossen `continue`).
 *
 * KEINE PROZENT-TOLERANZ (korrigiert, Gegenprüfungs-Runde 2, PR #818 — hier stand
 * vorher 0.95/5 %). Analyse aller additiven Aufrufer: Refresh-Pfade (regeste-/
 * rubrum-refresh, remap) mutieren nur Felder AUF derselben Bestandsliste, Länge
 * unverändert; additive Pfade (additiv, bge-baender) fügen ausschliesslich hinzu
 * oder ersetzen entfernte Routine-Einträge durch MINDESTENS ebenso viele neue BGE
 * (`neueAzaIds`-Filterung und `neuUniq`-Zugang sind in `normtext-entscheide.ts`
 * gekoppelt). Bei korrektem Ablauf ist die neue Eingabe also NIE kleiner als der
 * committete Bestand — jede Reduktion, und sei es nur um 1 von 5000+ Snapshots, ist
 * ein Befund (fehlender Shard, falscher cwd, Quellen-Ausfall), nie normales Rauschen.
 * `BESTANDSZAHL_MINDESTANTEIL = 1` heisst darum: kein unbegründeter Abgang ohne
 * explizites Flag (`LEXMETRIK_ERLAUBE_ABGANG=1`), auch nicht ein kleiner.
 *
 * BEKANNTE, GEWOLLTE AUSNAHME (Delta-Prüfung PR #818): `scripts/rechtsprechung/
 * bs-parse.ts` ist kein additiver Aufrufer im obigen Sinn, sondern ersetzt den
 * GESAMTEN BS-Anteil des Bestands bei jedem Lauf (Delta-/Takedown-Semantik §5.4,
 * Kommentar dort). Zieht das Portal einen BS-Entscheid zurück, liefert dieser Lauf
 * legitim WENIGER Einträge als vorher committet — die Sperre wirft dann bewusst
 * (mit Abgangs-Liste) und braucht `LEXMETRIK_ERLAUBE_ABGANG=1`; kein Workflow setzt
 * das automatisch, ist also ein gewollter manueller Stolperstein, kein Deadlock.
 *
 * GRENZFALL `altZahl` vs. `ladeBestandSnapshots` (Delta-Prüfung PR #818): `altZahl`
 * zählt jeden Nicht-Verweis-Manifest-Eintrag, AUCH einen ohne `datei` (derzeit gibt
 * es keinen — Ist 12.9.2026 stimmen 5093 Snapshots mit 5093 Nicht-Verweis-Einträgen
 * exakt überein); `ladeBestandSnapshots` liest dagegen NUR Einträge MIT `datei` (sie
 * überspringt `!e.datei` wie `e.verweis`, Zeile ~590). Entstünde künftig ein
 * datei-loser, nicht-verweis Manifest-Eintrag, zählte `altZahl` ihn mit, während ein
 * additiver Lauf ihn nie in seine Eingabe laden könnte — die Sperre würfe dann
 * DAUERHAFT, auch bei unverändertem Bestand. Bisher kein solcher Eintragstyp
 * vorgesehen; träte einer hinzu, müsste `altZahl` denselben Filter wie
 * `ladeBestandSnapshots` tragen (`!e.verweis && e.datei`).
 */
const BESTANDSZAHL_MINDESTANTEIL = 1;

/**
 * Totale Ordnung der Leitfälle je Artikel (§2-deterministisch): gewicht ↓, dann
 * Leitentscheid vor Routine, dann Datum ↓, dann key (totaler Tiebreaker) — build-
 * pfad-unabhängig stabil. EINE Quelle (§5): sowohl baueArtikelIndex als auch die
 * V1b-Shard-Regeneration (backe-rangliste-shards.ts) sortieren damit, sonst driftete
 * die E4-Neusortierung von der Ur-Ordnung ab.
 */
export function vergleicheLeitfaelle(a: LeitfallRef, b: LeitfallRef): number {
  return b.gewicht - a.gewicht
    || (a.leitcharakter === 'leitentscheid' ? 0 : 1) - (b.leitcharakter === 'leitentscheid' ? 0 : 1)
    || (a.datum < b.datum ? 1 : a.datum > b.datum ? -1 : 0)
    || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0);
}

/**
 * Totale Ordnung der Erlass-Ebene (`proNorm`), §2-deterministisch: Leitentscheid vor
 * Routine, dann Datum ↓, dann key (totaler Tiebreaker).
 *
 * BESTANDSFEHLER, gefixt 28.7.2026 (Linse 4). Der Datums-Term lautete hier
 * `(a.datum < b.datum ? 1 : -1)` — bei GLEICHEM Datum liefert das −1 statt 0, also
 * `cmp(x,y) === cmp(y,x) === -1`. Das ist keine Ordnung, sondern eine Behauptung:
 *   · die `||`-Kette bricht bei −1 ab, der key-Tiebreaker war TOTER CODE;
 *   · das Ergebnis hing damit genau an dem, was der Tiebreaker ausschliessen
 *     sollte — der Eingabefolge (gemessen: `[A,B]` → `B,A`, `[B,A]` → `A,B`).
 * Der Kommentar an der Aufrufstelle behauptete trotzdem Totalität; er ist mit
 * korrigiert. Dieselbe Form trug schon `vergleicheLeitfaelle` oben — die war
 * richtig und dient hier als Referenz (§5: eine Form, zwei Ebenen).
 */
export function vergleicheEntscheidRefs(a: EntscheidRef, b: EntscheidRef): number {
  return (a.leitcharakter === 'leitentscheid' ? 0 : 1) - (b.leitcharakter === 'leitentscheid' ? 0 : 1)
    || (a.datum < b.datum ? 1 : a.datum > b.datum ? -1 : 0)
    || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0);
}

/**
 * Serialisierung ALLER Rechtsprechungs-Artefakte (§5): 2-Space-Einrückung +
 * abschliessender Newline. EINE Stelle, weil `check:entscheide` die Gleichheit von
 * Monolith und schlanker Projektion BYTE-scharf prüft — und weil Nachpflege-Skripte
 * (regeste-kurz-refresh) dieselben Dateien schreiben wie `schreibeKorpus`.
 */
export function serialisiere(o: unknown): string {
  return JSON.stringify(o, null, 2) + '\n';
}

// Die (Register-key, Artikel)-Paare eines Snapshots rechnet jetzt
// `artikelSchluesselVonSnapshot` (entscheide-mapping.ts) — inkl. der
// Fliesstext-Erkennung (W2·6-NKEY Baustein d) und des Ausschlusses föderal/
// kantonal mehrdeutiger Kürzel («StG»). Die frühere lokale Kopie samt
// AMBIGE_BUND_KANTON_KUERZEL ist dorthin umgezogen (§5: eine Stelle — auch das
// Oracle-Tor check-rangliste-oracle rechnet nun mit derselben Funktion); die
// Begründung des StG-Ausschlusses steht dort als ABK_AUSSCHLUSS-Eintrag.

/**
 * Artikel-Ebene des Norm-Index (W3), deterministisch (§2). Nur Bundesgerichts-
 * Entscheide (wie proNorm — die Panel-Überschrift lautet «Bundesgerichtsentscheide
 * zu Art. X»; eidg./kantonale Gerichte gehören nicht darunter, §8). Für jeden
 * Artikel A ist die «topische Menge» S_A = {Bundesgerichtsentscheide, die A zitieren};
 * `gewicht` eines Falls d = Anzahl ANDERER Fälle aus S_A, die d nennen (In-degree
 * INNERHALB von S_A). Rang: gewicht ↓, dann Leitentscheid vor Routine, dann Datum ↓,
 * dann key (totaler Tiebreaker) — build-pfad-unabhängig stabil.
 */
/**
 * LITERATUR-VERWURF-STATISTIK (Gegenprüfung R3; löst die frühere Singleton-Zählung
 * der zurückgebauten Korroborations-Schwelle ab). Ein Filter, dessen Wirkung niemand
 * sieht, ist ein Tor, das nicht scheitern kann (§6.7): der `--remap`-Lauf weist die
 * Zahlen aus, damit ein Sprung nach oben («die Marker greifen zu weit») oder nach
 * unten («die Regel ist entschärft») im Lauf-Protokoll auffällt — nicht erst im
 * Artefakt. Modulweit, weil `baueArtikelIndex` seine Signatur behält (Aufrufer im Tor).
 *
 * `paare` zählt (Snapshot, Artikel)-Paare, die AUSSCHLIESSLICH aus einer entfernten
 * Zitier-Apparat-Spanne stammten; `nennungen` die Roh-Vorkommen in diesen Spannen;
 * `spannen` die Spannen selbst.
 */
let literaturVerwurf = { paare: 0, nennungen: 0, spannen: 0 };
export function letzterLiteraturVerwurf(): { paare: number; nennungen: number; spannen: number } {
  return { ...literaturVerwurf };
}

/**
 * Der generische Bau des LETZTEN Laufs (W2·7-BEZUG). `baueArtikelIndex` behält
 * seine Signatur (Aufrufer im Oracle-Tor und in den Tests), rechnet aber nicht
 * mehr selbst — es projiziert. Der volle Bau bleibt hier greifbar, damit
 * `schreibeKorpus` daraus zusätzlich die Bezugs-Shards schreibt, OHNE die
 * (teure) Extraktion ein zweites Mal zu fahren.
 */
let letzterBezugsIndex: BezugsIndex | null = null;
export function letzterBezugsBau(): BezugsIndex | null {
  return letzterBezugsIndex;
}

/**
 * Artikel-Ebene des Norm-Index (W3), deterministisch (§2) — jetzt als
 * PROJEKTION des generischen Bezugs-Baus (W2·7-BEZUG/B1, §5: ein Rechenweg,
 * zwei Artefakte).
 *
 * Inhaltlich unverändert und byte-gleich: nur Bundesgerichts-Entscheide (die
 * Panel-Überschrift lautet «Bundesgerichtsentscheide zu Art. X»; eidg./kantonale
 * Gerichte gehören nicht darunter, §8), `gewicht` = topische In-degree innerhalb
 * S_A = {Bundesgerichtsentscheide, die A zitieren}, Rang gewicht ↓ / Leitentscheid
 * vor Routine / Datum ↓ / key, Deckel LEITFAELLE_PRO_ARTIKEL.
 *
 * Was der generische Bau ZUSÄTZLICH rechnet (kantonale Kanten, Facetten), fällt
 * für dieses Artefakt in der Projektion wieder weg — der Beweis dafür ist der
 * byte-gleiche Regen von norm-index.json plus die eigene Prüfung in
 * check:bezuege (§6.7).
 */
export function baueArtikelIndex(auswahl: EntscheidSnapshot[], root = process.cwd()): Record<string, LeitfallRef[]> {
  const bg = auswahl.filter((s) => s.gerichtstyp === 'bundesgericht');
  literaturVerwurf = { paare: 0, nennungen: 0, spannen: 0 };
  for (const s of bg) {
    const befund = artikelSchluesselMitBefund(s);
    literaturVerwurf.paare += befund.literaturVerworfen.length;
    literaturVerwurf.nennungen += befund.literaturNennungen;
    literaturVerwurf.spannen += befund.literaturSpannenZahl;
  }

  const kantone = new Set(auswahl.map((s) => s.kanton));
  const index = baueBezugsIndex(
    auswahl,
    ladeBestaende(root, kantone),
    vergleicheLeitfaelle,
    manifestRegesteKurz,
    root,
  );
  index.befund.kantoneOhneResolver = kantoneOhneResolver(kantone);
  letzterBezugsIndex = index;

  return projiziereBundesgericht(index, vergleicheLeitfaelle, LEITFAELLE_PRO_ARTIKEL);
}

/**
 * Schaufenster-Shards (Weiche B, §10(6)/§11.2): proNormArtikel je Erlass in eine
 * eigene Projektion splitten. EINE Quelle (proNormArtikel), Shards = zusätzliche
 * Projektion — das grosse norm-index.json bleibt unverändert (kein Bruch bestehender
 * Konsumenten). Nur Erlasse MIT Artikel-Treffern bekommen einen Shard. Der Schlüssel
 * im Shard ist das blosse Artikel-Token (der 'REGISTERKEY/'-Präfix steckt im Dateinamen).
 * Deterministisch (§2): Token-Schlüssel sortiert, refs unverändert aus baueArtikelIndex.
 */
export function baueShards(proNormArtikel: Record<string, LeitfallRef[]>, datum: string): Map<string, LeitfallShard> {
  const proErlass = new Map<string, Record<string, LeitfallRef[]>>();
  for (const [ak, refs] of Object.entries(proNormArtikel)) {
    const schraeg = ak.indexOf('/');           // 'OR/41' → erlass 'OR', token '41'
    const erlass = ak.slice(0, schraeg);
    const token = ak.slice(schraeg + 1);
    (proErlass.get(erlass) ?? (proErlass.set(erlass, {}), proErlass.get(erlass)!))[token] = refs;
  }
  const out = new Map<string, LeitfallShard>();
  for (const erlass of [...proErlass.keys()].sort()) {
    const roh = proErlass.get(erlass)!;
    const proArtikel: Record<string, LeitfallRef[]> = {};
    for (const t of Object.keys(roh).sort()) proArtikel[t] = roh[t];   // stabile Token-Folge
    // gewichtQuelle:'alt' = un-gebackene, kuratierte In-degree. Die V1b-Regeneration
    // (backe-rangliste-shards.ts, braucht masse.db) hebt qualifizierende Erlasse auf
    // 'e4' — nach einem norm-index-Vollbau daher erneut fahren (wie V1c-Revisionen).
    out.set(erlass, { erzeugt: datum, erlass, gewichtQuelle: 'alt', proArtikel });
  }
  return out;
}

export function schreibeKorpus(auswahl: EntscheidSnapshot[], datum: string, root = process.cwd()): {
  anzahl: number; normBuckets: number; artikelBuckets: number; shards: number;
  bezugsShards: number; bezugsBefund: BezugsIndex['befund'] | null;
  literaturVerwurf: { paare: number; nennungen: number; spannen: number };
} {
  // Absolute Pfadauflösung (§17-Wurzel-Fix #694/#691): eine relative `root` würde
  // sich sonst gegen den AKTUELLEN cwd auflösen — läuft der Aufrufer aus einem
  // anderen Verzeichnis (Sub-Shell, CI-Step-Wechsel), zeigen `PUB`/`GENKEYS` auf
  // einen unerwarteten Ort, ohne dass irgendein Fehler das meldet (fail-open).
  // `resolve` fixiert die Wurzel EINMAL, hier, für alle Konsumenten unten.
  root = resolve(root);
  const PUB = join(root, 'public', 'rechtsprechung');
  const GENKEYS = join(root, 'src', 'lib', 'rechtsprechung', 'erfasste-keys.generated.ts');

  // Bestandszahl-Sperre — MUSS vor dem `rmSync` unten laufen: danach ist der
  // committete Vergleichswert bereits weg.
  const regPfadAlt = join(PUB, 'register.json');
  if (existsSync(regPfadAlt)) {
    const altManifest = JSON.parse(readFileSync(regPfadAlt, 'utf8')) as EntscheidManifest;
    // `auswahl` sind rohe EntscheidSnapshots (Eingabe VOR diesem Lauf) — die
    // `__voll`-Verweis-Einträge (Deep-Link-Karte je BGE mit azaUrteil+
    // auszugAbschnitte, oben im Schleifenkörper erzeugt) entstehen ERST WEITER
    // UNTEN, aus genau dieser Eingabe. `altManifest.entscheide.length` zählt sie
    // mit (Ist 12.9.2026: 6341 = 5093 Snapshots + 1248 Verweise) — ein Vergleich
    // dagegen liesse die Sperre auf jedem VOLLSTÄNDIGEN Lauf fälschlich feuern
    // (5093 < 6341·0.95, Gegenprüfungs-Befund PR #818). Vergleichbar ist nur die
    // Snapshot-Menge OHNE die abgeleiteten Verweise.
    const altZahl = altManifest.entscheide.filter((e) => !e.verweis).length;
    const neuZahl = auswahl.length;
    const erlaubeAbgang = process.env.LEXMETRIK_ERLAUBE_ABGANG === '1';
    if (!erlaubeAbgang && altZahl > 0 && neuZahl < altZahl * BESTANDSZAHL_MINDESTANTEIL) {
      const neuKeys = new Set(auswahl.map((s) => keyVon(s).key));
      const abgang = altManifest.entscheide
        .filter((e) => !e.verweis && !neuKeys.has(e.key))
        .map((e) => e.key);
      console.error(
        `[schreibeKorpus] BESTANDSZAHL-SPERRE: neue Eingabe ${neuZahl} Snapshot(s) < `
        + `${(BESTANDSZAHL_MINDESTANTEIL * 100).toFixed(0)}% des committeten Bestands ${altZahl} `
        + `(Wurzel ${root}). Abgänge (${abgang.length}): `
        + `${abgang.slice(0, 30).join(', ')}${abgang.length > 30 ? ' …' : ''}`,
      );
      throw new Error(
        `Bestandszahl-Sperre: ${neuZahl} < ${Math.ceil(altZahl * BESTANDSZAHL_MINDESTANTEIL)} `
        + `(${(BESTANDSZAHL_MINDESTANTEIL * 100).toFixed(0)}% von ${altZahl} committeten Einträgen). `
        + `Bei ABSICHTLICHEM Abgang erneut mit LEXMETRIK_ERLAUBE_ABGANG=1 ausführen.`,
      );
    }
  }

  if (existsSync(PUB)) rmSync(PUB, { recursive: true, force: true });
  mkdirSync(PUB, { recursive: true });

  const manifest: BrowseEntscheidVoll[] = [];
  const proNorm: Record<string, EntscheidRef[]> = {};

  // ── Richter-Projektion, Durchgang 1: Besetzungs-Freitexte korpusweit parsen ──
  // Die Kanonisierung («P. Schmid» → Patrizia oder Patrick?) ist nur mit Blick auf
  // den GANZEN Korpus entscheidbar, darum zwei Durchgänge (§2: deterministisch,
  // kein Raten). Der Snapshot bleibt unberührt — `rubrum.besetzung` ist und bleibt
  // der amtliche Freitext (SSoT); `richter[]` ist eine reine Projektion daraus.
  // Rubrum-Grenze säubern, BEVOR irgendetwas den Freitext liest oder schreibt.
  // Der Crawl hat in Einzelfällen über die Rubrum-Grenze hinaus eingesammelt —
  // BGE 151 IV 175 trug ein Aktenzeichen im Besetzungs-Feld («… Greffière: Mme
  // Kropf. 7B_950/2024et»). Folge war nicht bloss Rauschen: das ziffernhaltige
  // Segment fiel in den «kein sicherer Name»-Zweig, und die amtlich genannte
  // Gerichtsschreiberin fehlte vollständig. Das Aktenzeichen ist nie Teil der
  // Besetzung, der Schnitt also kein Informationsverlust (§5). Idempotent (§2) —
  // ein erneuter Lauf über bereits gesäuberte Snapshots ändert nichts.
  for (const snap of auswahl) {
    const ft = snap.rubrum?.besetzung;
    if (!ft) continue;
    const sauber = bereinigeBesetzungsFreitext(ft);
    if (sauber !== ft) snap.rubrum!.besetzung = sauber;
  }

  const besetzungRoh = new Map<string, ReturnType<typeof parseBesetzung>['richter']>();
  const kanonInput: KanonEintrag[] = [];
  for (const snap of auswahl) {
    const freitext = snap.rubrum?.besetzung ?? null;
    if (!freitext) continue;
    const res = parseBesetzung(freitext, { gericht: snap.gericht });
    if (!res.richter.length) continue;
    besetzungRoh.set(keyVon(snap).key, res.richter);
    for (const r of res.richter) {
      kanonInput.push({ slug: r.slug, nachSlug: r.nachSlug, givenSlug: r.givenSlug, givenAbk: r.givenAbk, name: r.name, raum: snap.kanton });
    }
  }
  const kanon = kanonisiere(kanonInput);
  const raumVon = new Map<string, string>(auswahl.map((s2) => [keyVon(s2).key, s2.kanton]));
  const richterCount = new Map<string, number>();

  for (const snap of auswahl) {
    const { key, datei } = keyVon(snap);
    const ziel = join(PUB, datei);
    mkdirSync(join(ziel, '..'), { recursive: true });
    // §7-Provenienz / additiver Build (Batch 3): jede Datei trägt das Abrufdatum
    // IHRES Inhalts (snap.abgerufen), nicht das globale Build-Datum. So bleibt ein
    // additiver Lauf (neue Gerichte ergänzen) für unveränderte Bestands-Snapshots
    // byte-gleich (kein Drift der 272 BGE, §6), während neue Einträge ihr echtes
    // Abrufdatum behalten. Für einen Vollbau (alle abgerufen==datum) verhaltensneutral.
    // ECLI deterministisch aus Gericht/Nummer/Datum minten (W0/R1 — schliesst die
    // Interop-Lücke; additives Identitätsfeld, lässt die abschnitte-`sha` unberührt).
    snap.ecli = minteEcliFuerSnapshot(snap);
    const wrap: EntscheidSnapshotDatei = { erzeugt: snap.abgerufen || datum, eintraege: [snap] };
    writeFileSync(ziel, serialisiere(wrap), 'utf8');

    // Regel + Begründung stehen an `manifestRegesteKurz` (§5: EINE Stelle — auch
    // regeste-kurz-refresh.ts rechnet damit, sonst löschte ein Refresh die
    // BS-Betreff-Kurzzeilen).
    const regesteKurz = manifestRegesteKurz(snap);
    manifest.push({
      key, gericht: snap.gericht, gerichtName: snap.gerichtName, gerichtstyp: snap.gerichtstyp,
      kanton: snap.kanton, nummer: snap.nummer, bgeReferenz: snap.bgeReferenz, datum: snap.datum,
      // datumUnbekannt/quarantaene nur projizieren, wenn gesetzt (Bestand bleibt byte-gleich, §6).
      ...(snap.datumUnbekannt ? { datumUnbekannt: true as const } : {}),
      ...(snap.quarantaene ? { quarantaene: snap.quarantaene } : {}),
      zitierung: snap.zitierung, leitcharakter: snap.leitcharakter,
      regesteVorhanden: !!snap.regeste, regesteKurz, sachgebiet: snap.sachgebiet, sprache: snap.sprache,
      normKeys: snap.normKeys, bestand: snap.bestand, kuratierung: snap.kuratierung,
      datei, quelle: snap.quelle, quelleUrl: snap.quelleUrl, fassungsToken: snap.fassungsToken,
      ...(() => {
        const roh = besetzungRoh.get(key);
        if (!roh?.length) return {};
        const raum = raumVon.get(key) ?? snap.kanton;
        const richter: RichterRef[] = roh.map((r) => ({
          s: kanon.map.get(`${raum}|${r.slug}`) ?? r.slug,
          r: r.rolle,
        }));
        // Jeder Slug kommt ins Register (damit Block B IMMER einen Anzeigenamen
        // auflösen kann — auch für reine Gerichtsschreiber:innen). Gezählt wird
        // aber nur die RICHTER-Mitwirkung: die Facette in Block B führt
        // Gerichtsschreiber:innen nicht als Richter (eigene Achse, später).
        for (const x of richter) {
          if (!richterCount.has(x.s)) richterCount.set(x.s, 0);
          if (x.r === 'gerichtsschreiber') continue;
          richterCount.set(x.s, richterCount.get(x.s)! + 1);
        }
        return { richter };
      })(),
    });

    // Getrennter Übersichts-Eintrag (Auftrag David 26.6.): das vollständige Urteil zu
    // einem BGE als EIGENE Karte, per Deep-Link auf die BGE-Detailseite mit Voll-Ansicht
    // — KEIN Daten-/Datei-Duplikat (datei:null), keine BGE-/Norm-Doppelzählung.
    if (snap.gericht === 'bge' && snap.azaUrteil && snap.auszugAbschnitte?.length) {
      manifest.push({
        key: `${key}__voll`, gericht: 'bger', gerichtName: snap.gerichtName, gerichtstyp: 'bundesgericht',
        kanton: 'CH', nummer: snap.azaUrteil.aktenzeichen, bgeReferenz: null, datum: snap.datum,
        zitierung: `BGer ${snap.azaUrteil.aktenzeichen}`, leitcharakter: 'routine',
        regesteVorhanden: false, regesteKurz: null, sachgebiet: snap.sachgebiet, sprache: snap.sprache,
        normKeys: [], bestand: snap.bestand, kuratierung: snap.kuratierung,
        datei: null, quelle: snap.quelle, quelleUrl: snap.azaUrteil.quelleUrl ?? snap.quelleUrl,
        fassungsToken: snap.fassungsToken,
        verweis: { zielKey: key, ansicht: 'voll', bgeReferenz: snap.bgeReferenz! },
      });
    }

    // C2-4 (präzisiert Batch 3): Der Norm→Entscheid-Index speist im UI die Liste
    // «Bundesgerichtsentscheide zu diesem Erlass» (norm-index.ts → GesetzLeser).
    // Darum NUR echte Bundesgerichts-Entscheide (gerichtstyp 'bundesgericht' =
    // bge/bger). Die neuen eidg. Gerichte (BVGer/BStGer/BPatGer) sind zwar canton
    // 'CH', aber NICHT das Bundesgericht → sie würden sonst fälschlich unter dieser
    // Überschrift erscheinen (§8). Für den Bestand identisch (alle CH-Einträge sind
    // bundesgericht). Kantonale/eidg. Entscheide bleiben über die Rubrik auffindbar.
    if (snap.gerichtstyp === 'bundesgericht') {
      for (const nk of snap.normKeys) {
        // Föderal/kantonal mehrdeutige Kürzel (StG) auch erlass-eben ausschliessen
        // (gleiche OCL-orientierte Entscheidung wie Artikel-Ebene; Gegenprüfung W3 #12).
        // Der Filter greift hier auf den KEY (nicht die Abkürzung), weil ALT-Bestands-
        // Snapshots den ausgeschlossenen Key noch in `normKeys` tragen können — die
        // Erzeugerseite (normKeysVonSnapshot) lässt ihn seit W2·6-NKEY gar nicht mehr
        // entstehen, der Schutz muss aber auch ohne Backfill wirken (§1).
        if (AUSGESCHLOSSENE_KEYS.has(nk)) continue;
        (proNorm[nk] ??= []).push({
          key, zitierung: snap.zitierung, regesteKurz, datum: snap.datum,
          leitcharakter: snap.leitcharakter, gericht: snap.gericht, kanton: snap.kanton,
        });
      }
    }
  }

  for (const nk of Object.keys(proNorm)) {
    // §2-Determinismus: `key` als TOTALER Tiebreaker — sonst hängt die Reihenfolge bei
    // Gleichstand (gleicher leitcharakter + gleiches Datum) von der Build-Eingabe-
    // reihenfolge ab (Vollbau [bge,bund,kanton] vs. additiver Lauf [Register-Reihen-
    // folge] erzeugten sonst denselben Inhalt in anderer Folge). Der Komparator steht
    // benannt oben (`vergleicheEntscheidRefs`) und ist dort auf Totalität getestet —
    // hier stand er inline und war es NICHT (Bestandsfehler, Begründung dort).
    proNorm[nk].sort(vergleicheEntscheidRefs);
    proNorm[nk] = proNorm[nk].slice(0, 12);
  }

  // Stabil (V8 TimSort): bei Datums-Gleichstand bleibt die Eingangsreihenfolge —
  // im additiven Lauf die committete Register-Folge, also kein Reorder des Bestands.
  //
  // ABGRENZUNG zum K1-Fix oben (gemessen 28.7.2026): dieser Komparator ist TOTAL
  // (Gleichstand → 0), also kein Fall der dortigen Fehlerklasse. Er ist aber
  // ABSICHTLICH build-pfad-ABHÄNGIG: mit umgekehrter Eingabe entsteht dasselbe
  // register.json mit identischer Menge UND identischer Datums-Folge, aber anderer
  // Reihenfolge INNERHALB eines Datums (erste Abweichung: AUS.2026.52/53, beide
  // 2026-07-01). Die Build-Pfad-Unabhängigkeit, die dieser Branch erklärt, gilt
  // damit für norm-index.json, norm-index-erlasse.json, richter.json und alle 157
  // Shards (empirisch byte-gleich über 5093 Snapshots), NICHT für register.json.
  // Das ist gewollt: ein key-Tiebreaker hier würde den ganzen Bestand umsortieren,
  // also genau das, was diese Zeile vermeiden soll. Wer die Unabhängigkeit auch
  // hier will, entscheidet damit über einen Voll-Reorder — eigener Schritt (§14).
  manifest.sort((a, b) => (a.datum < b.datum ? 1 : a.datum > b.datum ? -1 : 0));
  // E0-REGISTER (10.10.2026): Kern (Browser) + Provenienz (nur Build/Prüftore) aus
  // EINEM Vollregister — `teileRegister` ist die einzige Stelle, die trennt (§5).
  const { kern, provenienz } = teileRegister({ erzeugt: datum, entscheide: manifest });
  writeFileSync(join(PUB, 'register.json'), serialisiere(kern), 'utf8');
  writeFileSync(join(PUB, 'register-provenienz.json'), serialisiere(provenienz), 'utf8');
  // ── Richter-Register (Slug → Anzeigename + Trefferzahl) ──
  // Eigene, schlanke Projektion: die Facette in Block B lädt sie lazy für Labels
  // und Zähler, damit das grosse register.json slug-schlank bleibt (§15).
  // Enthält ALLE Spruchkörper-Slugs (Namensauflösung ist total); `count` zählt nur
  // die Mitwirkung als RICHTER — ein Slug mit count 0 ist reine:r Gerichtsschreiber:in
  // und gehört nicht in die Richter-Facette (§8: keine falsche Rollen-Zuschreibung).
  // Deterministisch sortiert (Slug alphabetisch), damit Re-Läufe byte-gleich sind.
  const richterEintraege: RichterRegister['richter'] = {};
  for (const slug of [...richterCount.keys()].sort()) {
    richterEintraege[slug] = {
      name: kanon.anzeige.get(slug) ?? slug,
      count: richterCount.get(slug)!,
    };
  }
  const richterObj: RichterRegister = { erzeugt: datum, richter: richterEintraege };
  writeFileSync(join(PUB, 'richter.json'), serialisiere(richterObj), 'utf8');

  // Artikel-Ebene (W3) zusätzlich zur Erlass-Ebene — proNorm bleibt inhaltlich unverändert.
  const proNormArtikel = baueArtikelIndex(auswahl, root);
  // §2 (Linse 3, 28.7.2026): Die SCHLÜSSELFOLGE von `proNorm` war die Einfüge-
  // reihenfolge, also die Reihenfolge der Bau-Eingabe (157 Buckets, 63 unsortierte
  // Übergänge). Vollbau und `--remap` erzeugten damit inhaltsgleiche, aber
  // BYTE-VERSCHIEDENE Dateien — genau die Abhängigkeit vom Build-Pfad, die die
  // Sortierung INNERHALB der Buckets (key als totaler Tiebreaker, oben) längst
  // ausschliesst. Die Artikel-Ebene war bereits sortiert (`baueArtikelIndex`);
  // hier wird die Erlass-Ebene nachgezogen. Codepoint-Ordnung wie überall in der
  // Kette (scripts/normtext/vergleich.ts), nicht locale-abhängig.
  const proNormSortiert: Record<string, EntscheidRef[]> = {};
  for (const nk of Object.keys(proNorm).sort(vergleiche)) proNormSortiert[nk] = proNorm[nk];
  writeFileSync(join(PUB, 'norm-index.json'), serialisiere({ erzeugt: datum, proNorm: proNormSortiert, proNormArtikel }), 'utf8');
  // ── Schlanke Laufzeit-Projektion der ERLASS-Ebene (W2·6-NKEY §15) ───────────
  // Dasselbe `proNorm`-Objekt, nur ohne die Artikel-Ebene. Grund: `kontextEntscheide()`
  // (src/lib/kontext.ts) braucht fürs Verweis-Popover NUR proNorm, zog dafür aber das
  // Gesamt-JSON über die Leitung — nach dem Backfill 731 KB gzip statt 93 KB, also das
  // ~7.8-fache an Nutzlast für unveränderte Information. §5 bleibt gewahrt: EINE Quelle
  // (proNormSortiert), zwei Projektionen; die Byte-Gleichheit der Schnittmenge prüft
  // check:entscheide. Serialisierung identisch (2-Space, Trailing-Newline, sortierte
  // Schlüssel) — sonst wäre der Konsistenz-Beweis dort nicht byte-scharf führbar.
  writeFileSync(join(PUB, 'norm-index-erlasse.json'), serialisiere({ erzeugt: datum, proNorm: proNormSortiert }), 'utf8');
  // Schaufenster-Shards je Erlass (Weiche B): zusätzliche Projektion, damit der
  // ArtikelLeser nur den Shard seines Erlasses lädt (§15.3). Trailing-Newline +
  // 2-Space wie norm-index.json/register.json (Rechtsprechungs-Serialisierung).
  const shards = baueShards(proNormArtikel, datum);
  const shardDir = join(PUB, 'norm-index');
  mkdirSync(shardDir, { recursive: true });
  for (const [erlass, shard] of shards) {
    writeFileSync(join(shardDir, `${erlass}.json`), serialisiere(shard), 'utf8');
  }

  // ── Bezugs-Shards je Erlass (W2·7-BEZUG/B1–B3) ─────────────────────────────
  // DRITTE Projektion desselben Baus: alle Facetten-Klassen (BGE · übriges
  // BGer-Urteil · eidg. Gerichte · kantonale Entscheide), je Klasse gedeckelt,
  // mit ehrlicher Grundgesamtheit. Auch für KANTONALE Erlasse ('BS-154.100'),
  // die im Bundes-Register gar nicht vorkommen.
  //
  // EIGENE Dateien statt eines erweiterten norm-index-Shards, und zwar aus einem
  // Laufzeit-Grund (§15): der ArtikelLeser lädt `norm-index/<Erlass>.json` heute
  // für JEDEN geöffneten Artikel. Hinge die Facetten-Ladung daran, würde jeder
  // Leser die kantonale Zusatzlast tragen — auch der, der die Filter (B4) nie
  // einschaltet. So bleibt der Bestands-Shard byte- und gewichtsgleich, und die
  // neue Datei kostet erst etwas, wenn sie jemand abruft.
  const bezugsBau = letzterBezugsBau();
  const bezuege = bezugsBau ? baueBezugsShards(bezugsBau, datum) : new Map();
  const bezugDir = join(PUB, 'bezuege');
  mkdirSync(bezugDir, { recursive: true });
  for (const [erlass, shard] of bezuege) {
    // `serialisiereShard` statt `serialisiere`: eine Zeile je Dokument/Artikel
    // statt eingerückter Felder (§15, Begründung und Messung dort). Die
    // Bestands-Artefakte oben nutzen weiter `serialisiere` und bleiben
    // byte-gleich (§6).
    writeFileSync(join(bezugDir, `${erlass}.json`), serialisiereShard(shard), 'utf8');
  }
  // B7/c: korpusweite Facetten-Bilanz NEBEN dem Shard-Verzeichnis, nicht darin —
  // `check:bezuege` liest `bezuege/*.json` als Shards ein, eine Fremddatei im
  // selben Ordner liefe dort als kaputter Shard auf (Lehre #404: Pfad-Literale
  // gegen die tatsächliche Verzeichnis-Lesung prüfen, nicht gegen die Absicht).
  if (bezugsBau) {
    writeFileSync(join(PUB, 'bezuege-bilanz.json'), serialisiere(baueBezugsBilanz(bezuege, datum)), 'utf8');
  }

  // ── N0a: kantonale normKeys als EIGENE Projektion ──────────────────────────
  //
  // Die Zitat-Brücke Entscheid → kantonaler Erlass. `register.json` führt
  // `normKeys` je Entscheid, aber ausschliesslich mit BUNDES-Register-keys; für
  // die kantonale Ebene stand dort bis hierher nichts (gemessen 31.8.2026:
  // 0 von 6341 Einträgen mit einem Kantons-key).
  //
  // Sie wird NICHT in `register.json` nachgetragen, sondern liegt daneben — die
  // Begründung samt Messung steht an `BezugsIndex.kantonNormKeys`. Die Datei
  // liegt NEBEN dem Shard-Verzeichnis, nicht darin (dieselbe Lehre #404 wie
  // bezuege-bilanz.json eine Zeile höher).
  //
  // Serialisierung: `serialisiere` (2-Space) wie die übrigen Bestands-Artefakte
  // — die Datei ist ein Manifest, kein Shard, und wird als Ganzes gelesen.
  if (bezugsBau) {
    const eintraege: Record<string, string[]> = {};
    for (const k of [...bezugsBau.kantonNormKeys.keys()].sort()) {
      eintraege[k] = bezugsBau.kantonNormKeys.get(k)!;
    }
    writeFileSync(
      join(PUB, 'normkeys-kanton.json'),
      serialisiere({ erzeugt: datum, eintraege }),
      'utf8',
    );
  }

  const keys = manifest.map((m) => m.key).sort();
  writeFileSync(
    GENKEYS,
    `// AUTO-GENERIERT von scripts/normtext-entscheide.ts — nicht von Hand editieren.\n`
    + `// Erfasste Rechtsprechungs-Keys (interne Verlinkung, synchron konsultiert, Fahrplan 8.5).\n`
    + `export const ERFASST: ReadonlySet<string> = new Set([\n`
    + keys.map((k) => `  ${JSON.stringify(k)},`).join('\n')
    + (keys.length ? '\n' : '')
    + `]);\n`,
    'utf8',
  );

  return {
    anzahl: manifest.length, normBuckets: Object.keys(proNorm).length,
    artikelBuckets: Object.keys(proNormArtikel).length, shards: shards.size,
    bezugsShards: bezuege.size,
    bezugsBefund: bezugsBau?.befund ?? null,
    literaturVerwurf: letzterLiteraturVerwurf(),
  };
}

/**
 * Bezugs-Bilanz eines Laufs ins Protokoll — GEZÄHLT, nicht behauptet (§6.7/§8).
 *
 * Die vier Blöcke beantworten je eine Frage, die man einem Artefakt sonst nicht
 * ansieht: Wie viele Kanten je Klasse gibt es überhaupt? Über welchen Kanal kam
 * die kantonale Auflösung? Was ist bewusst NICHT gemappt worden? Und wo klafft
 * eine benannte Lücke? Springt eine dieser Zahlen zwischen zwei Läufen, ist
 * entweder der Korpus, die Extraktion oder eine Ausschlussregel gewandert — und
 * das soll im Protokoll auffallen, nicht erst im ausgelieferten Index.
 */
export function berichteBezuege(shards: number, befund: BezugsIndex['befund'] | null): void {
  if (!befund) return;
  const j = (o: Record<string, number>): string =>
    Object.keys(o).sort().map((k) => `${k} ${o[k]}`).join(' · ') || '–';
  console.log(`[bezuege] ${shards} Erlass-Shards geschrieben.`);
  console.log(`[bezuege] Snapshots je Status: ${j(befund.snapshotsJeStatus)}`);
  // B7: «VOR Deckel» ist entfallen, weil der Deckel entfallen ist — diese Zahl
  // IST seither die ausgelieferte Menge. Der Klammerzusatz stehen zu lassen wäre
  // ein Hinweis auf einen Mechanismus, den es nicht mehr gibt (§8).
  console.log(`[bezuege] Kanten je Status (= ausgeliefert, ohne Deckel): ${j(befund.kantenJeStatus)}`);
  console.log(`[bezuege] kantonale Zitate je Kanal: ${j(befund.kantonalJeKanal)} · §-Gruppen ohne Erlass-Seite: ${befund.kantonalOhneErlass}`);
  console.log(`[bezuege] Ausschluss-Bilanz — Abkürzungen mit Bundes-Namensvetter NICHT gebunden (${befund.abkAusgeschlossen.length}): ${befund.abkAusgeschlossen.join(', ') || '–'}`);
  console.log(`[bezuege] Systematik-Nummern ohne Normtext-Snapshot (${befund.nummerOhneBestand.length}): ${befund.nummerOhneBestand.join(', ') || '–'}`);
  console.log(`[bezuege] Kantone ohne deklarierten Systematik-Präfix: ${befund.kantoneOhneResolver.join(', ') || '–'}`);
  // Die zwei Riegel aus der Gegenprüfung Runde 1 — beide zählen, was sie
  // verhindert haben. Ein Riegel ohne Zahl ist einer, dessen Ausfall niemand
  // bemerkt (§6.7).
  console.log(`[bezuege] B1-Riegel — Keys, die das Dokument selbst anders definiert (${befund.fremdVerworfen.length}): ${befund.fremdVerworfen.join(' · ') || '–'}`);
  console.log(`[bezuege] B2-Riegel — als Quell-Tippfehler verworfene Nummern (${befund.nummerMinderheit.length}): ${befund.nummerMinderheit.join(' · ') || '–'}`);
  const lu = befund.literaturVerwurfUebrige;
  console.log(`[bezuege] Literatur-Kontext-Regel auf NICHT-bundesgerichtlichen Snapshots: ${lu.spannen} Spannen, ${lu.nennungen} Roh-Nennungen, ${lu.paare} verworfene (Snapshot, Artikel)-Paare.`);
}

/**
 * Bestehenden Korpus von der Platte laden (additiver Build, Batch 3): liest das
 * committete register.json + jede zugehörige Snapshot-Datei (nicht-Verweis) IN
 * REGISTER-REIHENFOLGE. Damit kann ein Lauf neue Gerichte ergänzen, ohne den
 * Bestand über die Live-API neu zu ziehen — die 272 BGE + 4 FR bleiben byte-gleich
 * (§2/§6, kein Drift). Verweis-Einträge werden NICHT geladen (kein File; sie werden
 * in schreibeKorpus aus azaUrteil rekonstruiert). Die Reihenfolge wird bewahrt, damit
 * schreibeKorpus den stabil sortierten Manifest unverändert reproduziert.
 */
export function ladeBestandSnapshots(root = process.cwd()): EntscheidSnapshot[] {
  // Absolute Pfadauflösung (§17-Wurzel-Fix #694/#691) — wie in `schreibeKorpus`:
  // eine relative `root` löst sonst fail-open gegen den jeweiligen cwd auf.
  root = resolve(root);
  const PUB = join(root, 'public', 'rechtsprechung');
  const regPfad = join(PUB, 'register.json');
  if (!existsSync(regPfad)) return [];
  const manifest = JSON.parse(readFileSync(regPfad, 'utf8')) as EntscheidManifest;
  const out: EntscheidSnapshot[] = [];
  const gesehen = new Set<string>();
  // Im Register geführte, aber auf der Platte fehlende Dateien (#691): früher ein
  // stummes `continue` — der Aufrufer erfuhr nie, dass die geladene Basis kleiner
  // war als das Register verspricht. Jetzt gezählt UND gemeldet; die eigentliche
  // Schutzwirkung gegen einen daraus folgenden Datenverlust liefert die
  // Bestandszahl-Sperre in `schreibeKorpus` (dort, wo sonst `rmSync` griffe).
  const fehlend: string[] = [];
  for (const e of manifest.entscheide) {
    if (e.verweis || !e.datei) continue;
    const fp = join(PUB, e.datei);
    if (!existsSync(fp)) { fehlend.push(e.key); continue; }
    const d = JSON.parse(readFileSync(fp, 'utf8')) as EntscheidSnapshotDatei;
    const snap = d.eintraege?.[0];
    if (snap && !gesehen.has(snap.id)) { gesehen.add(snap.id); out.push(snap); }
  }
  if (fehlend.length) {
    const erwartet = manifest.entscheide.filter((e) => !e.verweis && e.datei).length;
    console.error(
      `[ladeBestandSnapshots] ${fehlend.length} im Register geführte Entscheid-Datei(en) `
      + `fehlen auf der Platte (Wurzel ${root}) — NICHT stumm übersprungen: `
      + `${fehlend.slice(0, 20).join(', ')}${fehlend.length > 20 ? ` … (+${fehlend.length - 20} weitere)` : ''}. `
      + `Geladen: ${out.length}/${erwartet}.`,
    );
  }
  return out;
}
