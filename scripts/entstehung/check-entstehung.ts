// scripts/entstehung/check-entstehung.ts — Tor `check:entstehung` (CLAUDE.md §6.7,
// FAHRPLAN-MATERIALIEN-VERZAHNUNG §11.6). VOLLSTÄNDIG OFFLINE, in `check:seriell`.
//
// Fünf Zusicherungen, jede einmal rot gezeigt (§6.7 — Rot-Beweise im PR-Body):
//  (1) DECKEL je Klasse, mit Ist-Wert in der Ausgabe (nie nur «ok»).
//  (2) ANKER-sha gegen das Quell-Register: jedes ausgelieferte Sidecar steht im Register,
//      trägt dessen HTML-sha und lässt sich byte-gleich rekonstruieren.
//  (3) CURIA-Zustandsträger ohne Verlust (E4) — Geschäfte verschwinden nie still.
//  (4) DECKUNGS-DIAGNOSE je Erlass gegen den gebuchten Stand; Rückgang ohne benannten
//      `grund` ⇒ rot (Kritik A7/C11: Korpus-Summe verdeckt den Erlass-Rückgang, und ein
//      Offline-Tor kann keinen PR-Trailer lesen — der Stand lebt im Register).
//  (7) SYNOPSE-SHARDS (E5): Deckel gesamt UND je Erlass mit Ist-Wert, Zitat-Merkmale
//      §7 a–d je ausgewertetem Stand (Stand, Filestore-URL, Live-Link, Quell-sha),
//      kanonische Serialisierung, Normalisierungs-Profil, und derselbe Determinismus-
//      Wächter wie bei den Ankern: Shard geändert ohne Quell-Hash-Änderung ⇒ rot.
//  (5) DETERMINISMUS-WÄCHTER: ein Sidecar darf sich nie ändern, ohne dass sich der
//      Quell-Hash der amtlichen Manifestation geändert hat (§7d — Parser-Drift darf nie
//      wie eine Gesetzesänderung aussehen; Muster Lex/SFHAJJI). Durchgesetzt in zwei
//      Hälften: der Generator verweigert die stille Parser-Änderung (anker-run.ts),
//      dieses Tor verweigert das von Hand geänderte Artefakt.
//
// --schreibe bucht neue Erlasse und HÖHERE Quoten; eine Senkung schreibt es NIE von
// selbst — die verlangt einen von Hand eingetragenen `grund` (Mensch-Entscheid, §8).
//
// LEER-DIFF-AUSNAHMELISTE (Auftrag Koordinator, Nachtrag 11.9.2026, Muster
// Flacker-Wächter #779 `scripts/check-e2e-flake.ts`): eine Verletzung des
// Leer-Diff-Wächters ist ROT, ausser der Fall steht mit Datum und Grund in
// `bibliothek/register/entstehung-leerdiff-ausnahmen.json`; jeder Eintrag verfällt
// nach höchstens 30 Tagen (Fang-Vermerk, keine Amnestie) — NIE das Tor selbst
// abschwächen, nur einzelne, benannte, befristete Fälle.
//
// DIE LISTE IST SEIT 12.9.2026 LEER (`[]`), und das ist der Punkt: ihre 11 Einträge
// nannten zwei Wurzeln, und beide sind mit W2·6c-ENTSTEHUNG-QUELLLUECKE behoben —
// die Quelllücke (10 × CHEMRRV, jetzt `zustand: 'quelle_unvollstaendig'`) und die
// Token-Kontinuität in `neuNach()` (AVIV 57b, jetzt Lineage-Regel). Die MECHANIK
// bleibt trotzdem stehen: sie ist der einzige Weg, einen künftigen Einzelfall
// benannt und befristet durchzulassen, statt am Tor zu drehen (Muster #779).
import { readFileSync, existsSync, readdirSync, writeFileSync, statSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { ANKER_DIR, type AnkerSidecar } from '../../src/lib/entstehung/anker.ts';
import { shaSidecar, serialisiereSidecar } from './anker-sidecars.ts';
import { ANKER_REGISTER_PFAD, type AnkerRegister } from './anker-register.ts';
import { pruefeVerfahrensEreignisse, groesse, kb } from './deckel.ts';
import {
  misseDeckung, serialisiereDeckung, DECKUNG_REGISTER_PFAD,
  type DeckungRegister, type DeckungErlass,
} from './deckung.ts';
import { CURIA_DIR, leseCuriaZustand } from './curia-zustand.ts';
import {
  pruefeCuriaBestand, pruefeCuriaSchrumpf, bestimmeCuriaVorstand, leseCuriaSchrumpfAusnahmen,
} from './curia-tor.ts';
import {
  SYNOPSE_DIR, NORM_PROFIL, SynopseBlockIndex, type SynopseShard, type SynopseBlock,
} from '../../src/lib/entstehung/synopse.ts';
import {
  serialisiereShard as serialisiereSynopse, shaShard as shaSynopse, QUELLLUECKE_STAENDE_MAX,
} from './synopse.ts';
import { geltendeBloecke, leerDiffVerletzungen, phantomVerletzungen } from '../../src/lib/entstehung/synopse-diff.ts';
import { SYNOPSE_REGISTER_PFAD, type SynopseRegister } from './synopse-register.ts';
import { ENTWURF_DIR, type EntwurfShard } from '../../src/lib/entstehung/synopse-entwurf.ts';
import { serialisiereEntwurfShard, shaEntwurfShard } from './synopse-entwurf.ts';
import { ENTWURF_REGISTER_PFAD, type EntwurfRegister } from './synopse-entwurf-register.ts';
import {
  baueProjektion, serialisiereProjektion, PROJEKTION_DIR,
  type BotschaftQuelle, type HistorieQuelle, type RevisionsQuelle,
} from './entstehung-projektion.ts';
import { BOTSCHAFTEN } from '../../src/lib/materialien/botschaften.generated.ts';
import {
  pruefeDeckungsSicht, DECKUNG_PROJEKTION_PFAD, DECKUNG_DECKEL,
} from './deckung-projektion-quellen.ts';

const schreibe = process.argv.includes('--schreibe');
const datumArg = process.argv.find((a) => a.startsWith('--datum='));
const heute = datumArg ? datumArg.slice('--datum='.length) : '';
if (schreibe && !/^\d{4}-\d{2}-\d{2}$/.test(heute)) {
  console.error('check:entstehung --schreibe verlangt --datum=YYYY-MM-DD (§2: kein Date.now).');
  process.exit(1);
}
// Nur für die Ausnahmelisten-Verfallsprüfung (Betriebslogik der CLI-Hülle, nicht die reine
// Kernlogik oben) — `--datum` hat Vorrang, sonst der Kalendertag des Laufs (Muster
// `scripts/check-e2e-flake.ts`: `new Date()` nur am imperativen Rand, nie in einer reinen Funktion).
const heuteAusnahme = /^\d{4}-\d{2}-\d{2}$/.test(heute) ? heute : new Date().toISOString().slice(0, 10);

const fehler: string[] = [];
const zeilen: string[] = [];

// ── Leer-Diff-Ausnahmeliste (Muster Flacker-Wächter #779) ─────────────────────
interface LeerDiffAusnahme {
  erlass: string; token: string; stand: string; zustand: string;
  seit: string; grund: string; ablauf: string;
}
const LEERDIFF_AUSNAHME_PFAD = 'bibliothek/register/entstehung-leerdiff-ausnahmen.json';
const LEERDIFF_AUSNAHME_TAGE_MAX = 30;
const TAG_MS = 86_400_000;
/** ISO-Tag → UTC-Zeitstempel; `null` bei falscher Form oder Kalenderwert (`2026-02-30`). */
function isoTagMs(wert: unknown): number | null {
  if (typeof wert !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(wert)) return null;
  const ms = Date.parse(`${wert}T00:00:00Z`);
  if (Number.isNaN(ms)) return null;
  return new Date(ms).toISOString().slice(0, 10) === wert ? ms : null;
}
/** Greift eine Ausnahme für `(erlass, token, stand, zustand)` am Kalendertag `heuteIso`? */
function leerDiffAusnahmeGueltig(
  liste: readonly LeerDiffAusnahme[],
  eintrag: { erlass: string; token: string; stand: string; zustand: string },
  heuteIso: string,
): boolean {
  const heuteMs = isoTagMs(heuteIso);
  if (heuteMs === null) return false;
  return liste.some((a) => {
    if (a.erlass !== eintrag.erlass || a.token !== eintrag.token || a.stand !== eintrag.stand
      || a.zustand !== eintrag.zustand) return false;
    if (typeof a.grund !== 'string' || a.grund.trim() === '') return false;
    const seitMs = isoTagMs(a.seit);
    const ablaufMs = isoTagMs(a.ablauf);
    if (seitMs === null || ablaufMs === null) return false;
    if (ablaufMs < seitMs) return false;
    if (ablaufMs - seitMs > LEERDIFF_AUSNAHME_TAGE_MAX * TAG_MS) return false;
    return heuteMs <= ablaufMs;
  });
}
const leerDiffAusnahmen: LeerDiffAusnahme[] = existsSync(LEERDIFF_AUSNAHME_PFAD)
  ? (JSON.parse(readFileSync(LEERDIFF_AUSNAHME_PFAD, 'utf8')) as LeerDiffAusnahme[])
  : [];

// ── (1) Deckel je Klasse, immer mit Ist-Wert ───────────────────────────────────
/** [Bezeichnung, Pfad, Deckel in Bytes, gzip?] — Deckel aus §11.6, Ist-Werte gemessen 11.9.2026. */
const DECKEL: readonly (readonly [string, string, number, boolean])[] = [
  // §11.6: Anker-Sidecars < 0,5 MB (Ist 11.9.2026: 45 KB über 4 Sidecars).
  ['Anker-Sidecars        ', ANKER_DIR, 512 * 1024, false],
  // §11.6/A16: der Historie-Baum bleibt UNANGETASTET; der Deckel ist reiner Wächter
  // (Ist 9,5 MB) — reisst er, hat jemand am Ein-Quellen-Artefakt gearbeitet.
  ['Historie-Shards       ', 'public/normtext/historie', 11 * 1024 * 1024, false],
  // §11.6: Parlaments-Shards ~2 KB je Geschäft über 385 Geschäfte ⇒ ~0,8 MB.
  ['Curia-Shards          ', CURIA_DIR, 2 * 1024 * 1024, false],
  // Materialien-Register, drei Projektionen (12.9.2026; Herleitung, Verbraucher und
  // verworfene Entwürfe: bibliothek/materialien/2026-09-12-register-deckel-messung.md).
  // Kern = einziger Browser-Kanal im Normalfall, lädt auf JEDER Leserseite; Deckel
  // GESENKT 400 → 280 KB (Präzedenz K3), Ist 118,3 (vorher 331,8 = 83 %), ZH 135,9 = 49 %.
  ['Materialien-Kern      ', 'public/materialien/register.json', 280 * 1024, true],
  // FR/IT-Titel: nur bei locale fr/it geholt (browse.ts), nie im deutschen Lesepfad.
  // Ist 83,7 KB; Kantone tragen keine, Wachstum nur aus Bundes-Material. ZH: +0.
  ['Materialien-FR/IT     ', 'public/materialien/register-i18n.json', 140 * 1024, true],
  // Provenienz (sha + Verfahrens-/Join-Felder): KEIN Browser-Kanal (kein fetch() im
  // src-Baum, Grep 12.9.2026), Mengen-Wächter. Ist 92,9 KB, ZH-Prognose 113,5 = 47 %.
  ['Materialien-Provenienz', 'public/materialien/register-provenienz.json', 240 * 1024, true],
  // §11.6/A6: Synopse-Alt-Blöcke 8 MB gesamt. Ist-Prognose aus der Vor-Messung E5.0
  // (11.9.2026): ~4,9 MB roh über 1006 Schritte in 187 Erlassen.
  ['Synopse-Shards        ', SYNOPSE_DIR, 8 * 1024 * 1024, false],
  // §11.6: Entwurf/Beschluss-Diff < 3 MB.
  ['Entwurf-Beschluss     ', ENTWURF_DIR, 3 * 1024 * 1024, false],
  // E3 (§11.6): die Entstehungs-Projektion ist der Ladekanal der Karte am Artikel —
  // sie existiert nur, WEIL das Register als Kanal zu schwer ist. Ohne eigenen Deckel
  // könnte sie unbemerkt dorthin zurückwachsen (Ist 11.9.2026: 692 KB über 185 Erlasse,
  // ø 3,7 KB; grösste Datei AIG 43,6 KB — je Datei bewacht die Zeile darunter).
  ['Entstehungs-Projektion', PROJEKTION_DIR, 1536 * 1024, false],
  // Deckungs-Sicht (W2·6c, 12.9.2026): EINZIGER Ladekanal von /materialien/deckung.
  // Sie ersetzt dort 8 MB Artefakte durch eine Datei — ohne eigenen Deckel wüchse
  // sie unbemerkt dorthin zurück (Ist: 78,5 KB roh / 10,8 KB gzip, 219 Erlasse).
  ['Deckungs-Sicht        ', DECKUNG_PROJEKTION_PFAD, DECKUNG_DECKEL, false],
];

/** §15/§11.6 · Deckel JE ERLASS für die Projektion: die Karte lädt genau EINE
 *  dieser Dateien je Klick, und die Summe verdeckt einen Ausreisser (Kritik A7 —
 *  dieselbe Denkart wie bei der Deckung: Korpus-Summe ist keine Diagnose). */
const PROJEKTION_DECKEL_DATEI = 96 * 1024;

zeilen.push('check:entstehung — Deckel je Klasse (Ist / Deckel):');
for (const [name, pfad, max, gzip] of DECKEL) {
  const ist = groesse(pfad, gzip);
  if (ist === null) { zeilen.push(`  ${name} —          (noch nicht gebaut)   Deckel ${kb(max)}`); continue; }
  const anteil = ((ist / max) * 100).toFixed(0);
  zeilen.push(`  ${name} ${kb(ist).padStart(10)} / ${kb(max).padStart(10)}  (${anteil} %)${gzip ? ' gzip' : ''}`);
  if (ist > max) fehler.push(`Deckel gerissen: ${pfad} ${kb(ist)} > ${kb(max)} — nie den Deckel anheben, sondern die Nutzlast (§8/§15).`);
}

// ── Verfahrens-Ereignisse (E1): eigene Klasse; Herleitung in ./deckel-ereignisse.ts ──
{
  const { zeile, fehler: f } = pruefeVerfahrensEreignisse();
  if (zeile) zeilen.push(zeile);
  fehler.push(...f);
}

// ── (2) + (5) Anker-Sidecars gegen das Quell-Register ──────────────────────────
{
  const register: AnkerRegister | null = existsSync(ANKER_REGISTER_PFAD)
    ? (JSON.parse(readFileSync(ANKER_REGISTER_PFAD, 'utf8')) as AnkerRegister)
    : null;
  const dateien = existsSync(ANKER_DIR) ? readdirSync(ANKER_DIR).filter((f) => f.endsWith('.json')).sort() : [];
  if (dateien.length && !register) {
    fehler.push(`${ANKER_DIR} ist befüllt, aber ${ANKER_REGISTER_PFAD} fehlt — ohne Quell-Register ist kein Sidecar belegbar (§7d).`);
  }
  let geprueft = 0;
  if (register) {
    for (const f of dateien) {
      const key = f.slice(0, -'.json'.length);
      const roh = readFileSync(join(ANKER_DIR, f), 'utf8');
      const sidecar = JSON.parse(roh) as AnkerSidecar;
      const eintrag = register.quellen[key];
      if (!eintrag) { fehler.push(`Anker-Sidecar ${f} steht nicht im Quell-Register — Herkunft unbelegt (§7).`); continue; }
      if (sidecar.sha !== eintrag.sha) {
        fehler.push(`Anker-Sidecar ${f}: sha ${sidecar.sha.slice(0, 12)}… ≠ Register ${eintrag.sha.slice(0, 12)}… — Quell-Hash weicht ab.`);
      }
      const neu = shaSidecar(sidecar);
      if (eintrag.sidecarSha && neu !== eintrag.sidecarSha) {
        fehler.push(
          `Anker-Sidecar ${f}: Inhalt geändert, ohne dass der Quell-Hash der amtlichen Manifestation `
          + 'sich geändert hat (Determinismus-Wächter §11.6 (5)) — Parser-Drift darf nie wie eine '
          + 'Gesetzesänderung aussehen. Generator neu laufen (npm run materialien:anker -- --datum=…).',
        );
      }
      if (roh !== serialisiereSidecar(sidecar)) {
        fehler.push(`Anker-Sidecar ${f} ist nicht kanonisch serialisiert — von Hand editiert? (Generator neu laufen.)`);
      }
      if (sidecar.anker.some((a) => sidecar.mehrdeutig.includes(a.eId))) {
        fehler.push(`Anker-Sidecar ${f} liefert eine mehrdeutige eId als Anker aus — falscher Sprung möglich (§1).`);
      }
      geprueft += 1;
    }
    for (const [key, e] of Object.entries(register.quellen)) {
      if (e.sidecarSha && !dateien.includes(`${key}.json`)) {
        fehler.push(`Quell-Register nennt einen Sidecar ${key}.json, der in ${ANKER_DIR} fehlt — stiller Verlust.`);
      }
    }
  }
  zeilen.push(`check:entstehung — Anker: ${geprueft} Sidecar(s) gegen ${register ? Object.keys(register.quellen).length : 0} Register-Einträge geprüft (sha + Determinismus-Wächter).`);
}

// ── (3) Curia-Zustandsträger ohne Verlust (E4) + Schrumpf-Schwelle gegen den Vorstand ───
// Kernlogik in curia-tor.ts (reine Funktionen, rot gezeigt in
// src/tests/entstehung-curia-zustand-tor.test.ts); hier nur der imperative Rand.
{
  const zustand = leseCuriaZustand();
  const bestand = pruefeCuriaBestand(CURIA_DIR, zustand);
  fehler.push(...bestand.fehler);
  zeilen.push(...bestand.zeilen);
  // Immer, auch ohne Ist-Zustandsträger (Nachzug PR #963, Auflage 2): fehlt die JSONL, entscheidet
  // der Vorstand zwischen Erstfall (grün) und Totalverlust (ROT) — vorher schwieg das Tor hier.
  const schrumpf = pruefeCuriaSchrumpf(bestimmeCuriaVorstand(), zustand, leseCuriaSchrumpfAusnahmen());
  fehler.push(...schrumpf.fehler);
  zeilen.push(...schrumpf.zeilen);
}

// ── (7) Synopse-Shards: Deckel je Erlass, Zitat-Merkmale, Determinismus (E5) ───
{
  const register: SynopseRegister | null = existsSync(SYNOPSE_REGISTER_PFAD)
    ? (JSON.parse(readFileSync(SYNOPSE_REGISTER_PFAD, 'utf8')) as SynopseRegister)
    : null;
  const dateien = existsSync(SYNOPSE_DIR)
    ? readdirSync(SYNOPSE_DIR).filter((f) => f.endsWith('.json')).sort()
    : [];
  if (dateien.length && !register) {
    fehler.push(`${SYNOPSE_DIR} ist befüllt, aber ${SYNOPSE_REGISTER_PFAD} fehlt — ohne Quell-Register ist kein Alt-Block belegbar (§7d).`);
  }
  // §11.6: 2 MB JE ERLASS. Der Gesamt-Deckel oben verdeckt einen einzelnen Ausreisser
  // (Kritik A7: die Korpus-Summe verdeckt den Erlass-Wert) — deshalb beide.
  const JE_ERLASS = 2 * 1024 * 1024;
  let groesster: [string, number] = ['—', 0];
  let bloecke = 0;
  let schritte = 0;
  let ohneEreignis = 0;
  let konflikte = 0;
  let staende = 0;
  let quellLuecken = 0;
  let quellLueckenBelegt = 0;
  let quellLueckenOhneBeleg = 0;
  let leerDiffGeprueft = 0;
  let leerDiffAusgenommen = 0;
  let phantomAusgenommen = 0;
  if (register) {
    for (const f of dateien) {
      const key = f.slice(0, -'.json'.length);
      const roh = readFileSync(join(SYNOPSE_DIR, f), 'utf8');
      const bytes = Buffer.byteLength(roh, 'utf8');
      if (bytes > groesster[1]) groesster = [key, bytes];
      if (bytes > JE_ERLASS) {
        fehler.push(`Deckel gerissen: Synopse ${f} ${kb(bytes)} > ${kb(JE_ERLASS)} je Erlass — nie den Deckel anheben, sondern das Fenster (§8/§15).`);
      }
      const eintrag = register.erlasse[key];
      if (!eintrag) { fehler.push(`Synopse-Shard ${f} steht nicht im Quell-Register — Herkunft unbelegt (§7).`); continue; }
      const shard = JSON.parse(roh) as SynopseShard;
      if (roh !== serialisiereSynopse(shard)) {
        fehler.push(`Synopse-Shard ${f} ist nicht kanonisch serialisiert — von Hand editiert? (Generator neu laufen.)`);
      }
      if (shaSynopse(shard) !== eintrag.shardSha) {
        fehler.push(
          `Synopse-Shard ${f}: sha weicht vom Quell-Register ab — der Alt-Wortlaut hat sich `
          + 'geändert, ohne dass der Lauf ihn gebucht hätte (Determinismus-Wächter §11.6 (5)). '
          + 'Generator neu laufen (npm run entstehung:synopse -- --datum=…).',
        );
      }
      if (shard.normProfil !== NORM_PROFIL) {
        fehler.push(
          `Synopse-Shard ${f}: Normalisierungs-Profil «${shard.normProfil}» ≠ «${NORM_PROFIL}» — `
          + 'ein gewechseltes Profil entwertet jede gespeicherte Prüfsumme; das Profil wird nie '
          + 'editiert, ein besseres entsteht als /2 DANEBEN (soufien-lex.md).',
        );
      }
      // ZITAT-MERKMALE §7 a–d je ausgewertetem Stand: ohne sie ist der gespeicherte
      // Gesetzestext kein Zitat, sondern eine zweite Wahrheit (§5).
      const registerStand = new Map(eintrag.staende.map((x) => [x.datum, x]));
      for (const st of shard.staende) {
        staende += 1;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(st.datum)) fehler.push(`Synopse ${f}: Stand «${st.datum}» ist kein ISO-Datum (§7a).`);
        if (!st.xmlUrl.startsWith('https://fedlex.data.admin.ch/filestore/')) {
          fehler.push(`Synopse ${f} Stand ${st.datum}: Quelle «${st.xmlUrl}» ist keine Filestore-URL — URLs werden nie konstruiert (§7b).`);
        }
        // PROVENIENZ-PFAD statt «-N»-Regel. R2 §6d belegt, dass die KONSTRUIERTE Alias-URL
        // ohne «-N» ein Phantom ist (OR 1.7.2021: 1187 von 1528 eIds inhaltlich verschieden).
        // Daraus folgt NICHT, dass jede suffixlose URL ein Phantom wäre: gemessen 11.9.2026
        // liefert der Endpunkt für AHVG Stand 2027-01-01 ALS EINZIGE Manifestation
        // `…-20270101-de-xml.xml` (449 896 B, 169 Artikel) — 63 der 1193 Stände sind so.
        // Die Regel lautet «nie konstruieren, immer auflösen»; offline prüfbar ist davon
        // der Pfad: ELI und Stand-Datum der URL müssen zum Shard und zum Stand passen.
        const erwartet = `/eli/${shard.eli}/${st.datum.replace(/-/g, '')}/de/xml/`;
        if (!st.xmlUrl.includes(erwartet)) {
          fehler.push(
            `Synopse ${f} Stand ${st.datum}: Quell-URL passt nicht zu «${erwartet}» — die `
            + `Manifestation gehört zu einem anderen Erlass oder Stand (${st.xmlUrl}).`,
          );
        }
        if (!st.liveUrl.startsWith('https://www.fedlex.admin.ch/eli/')) {
          fehler.push(`Synopse ${f} Stand ${st.datum}: kein Live-Link zur geltenden amtlichen Fassung (§7c).`);
        }
        if (!/^[0-9a-f]{64}$/.test(st.sha)) fehler.push(`Synopse ${f} Stand ${st.datum}: Quell-sha fehlt oder ist kein sha256 (§7d).`);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(st.abgerufen)) fehler.push(`Synopse ${f} Stand ${st.datum}: Abrufdatum fehlt (§7a).`);
        if (st.artikelZahl <= 0) fehler.push(`Synopse ${f} Stand ${st.datum}: 0 Artikel — Extraktion gescheitert, nie als «nichts geändert» buchen.`);
        const rs = registerStand.get(st.datum);
        if (!rs) fehler.push(`Synopse ${f} Stand ${st.datum}: steht nicht im Quell-Register (§7).`);
        else if (rs.sha !== st.sha) fehler.push(`Synopse ${f} Stand ${st.datum}: Quell-sha weicht vom Register ab.`);
      }
      for (const sch of shard.schritte) {
        schritte += 1;
        konflikte += sch.ereignisOhneAenderung?.length ?? 0;
        for (const a of sch.artikel) {
          bloecke += 1;
          if (a.zustand === 'ohne_ereignis') ohneEreignis += 1;
          const leer = a.alt.length === 0 || a.alt.every((b) => b[SynopseBlockIndex.text].trim() === '');
          if (a.zustand === 'quelle_unvollstaendig') {
            quellLuecken += 1;
            // UMGEKEHRTE RICHTUNG, gleiche Strenge: eine Quelllücke hat keinen Wortlaut zu
            // zeigen — über sie hinweg ist er derselbe. Stünde hier Text, behauptete der
            // Shard eine Fassung, die es so nie gab (§1).
            if (!leer) {
              fehler.push(
                `Synopse ${f} Schritt ${sch.von}→${sch.bis}: Alt-Block ${a.eId} ist als `
                + '«Quelle unvollständig» gebucht und trägt trotzdem Wortlaut — über eine '
                + 'Lücke hinweg ist der Wortlaut derselbe, es gibt nichts gegenüberzustellen.',
              );
            }
          } else if (leer) {
            // Ein Alt-Block ohne Wortlaut wäre eine Synopse gegen nichts (E5.0: angekündigte,
            // textlose Hülsen gehören in die Klasse «nur im neuen Stand», nicht hierher).
            fehler.push(`Synopse ${f} Schritt ${sch.von}→${sch.bis}: Alt-Block ${a.eId} ohne Wortlaut.`);
          }
          if (!/^[0-9a-f]{64}$/.test(a.shaNorm)) {
            fehler.push(`Synopse ${f} Schritt ${sch.von}→${sch.bis}: Alt-Block ${a.eId} ohne shaNorm (§7d).`);
          }
        }
      }
      // ── QUELLLÜCKEN-WÄCHTER (W2·6c-ENTSTEHUNG-QUELLLUECKE, 12.9.2026) ──────────
      //
      // «Quelle unvollständig» ist die schonendste Buchung des ganzen Shards: sie sagt,
      // dass an einem Stand NICHTS geschehen ist, und nimmt damit 22 Aufhebungen und 22
      // Neueinfügungen zurück (CHEMRRV Art. 4–24). Genau deshalb muss sie am engsten
      // bewacht sein — eine falsch gesetzte Quelllücke VERSTECKT eine echte Aufhebung.
      //
      // Geprüft wird, was der Shard selbst belegen kann (offline, ohne Netz):
      //  (a) die Lücke ist ein LÜCKENLOSER Lauf von 1 … QUELLLUECKE_STAENDE_MAX Ständen
      //      zwischen `schritt.bis` und `zurueckAb`, und beide sind Stände DIESES Shards;
      //  (b) in der Lücke steht kein zweiter Alt-Block derselben eId (sie ist ja gar
      //      nicht da), und der Rückkehr-Schritt bucht sie NICHT als «neu eingefügt» —
      //      sonst stünde die zurückgenommene Behauptung immer noch da;
      //  (c) DIE RÜCKKEHR IST BYTE-GLEICH: der erste Alt-Block derselben eId NACH der
      //      Rückkehr trägt den Wortlaut, der bei der Rückkehr galt — seine Prüfsumme
      //      muss die der Lücke sein. Das ist der einzige Weg, die Kernbedingung der
      //      Erkennungsregel im Artefakt selbst nachzurechnen; wo es keinen späteren
      //      Alt-Block gibt, sagt die Schluss-Zeile, wie viele Fälle belegt sind.
      {
        const staendeDaten = shard.staende.map((x) => x.datum);
        for (const sch of shard.schritte) {
          for (const a of sch.artikel) {
            if (a.zustand !== 'quelle_unvollstaendig') continue;
            const kopf = `Synopse ${f} Schritt ${sch.von}→${sch.bis}: Alt-Block ${a.eId} («Quelle unvollständig»)`;
            // (d) DER ANHANG-BELEG IST BEDINGUNG, NICHT VERMERK (Auflage Gegenprüfung
            // PR #801): ohne ihn ist die Lücke von einer echten Aufhebung mit späterer,
            // wortgleicher Wiedereinführung nicht zu unterscheiden — und eine getarnte
            // Aufhebung ist die schwerere Falschaussage (§1). Offline nachprüfbar ist
            // davon das Feld: der Generator setzt es nur, wenn er den Artikel in JEDEM
            // Lücken-Stand als `<mod>`/`<quotedStructure>` gefunden hat.
            if (a.imAnhang !== true) {
              fehler.push(
                `${kopf} ohne Anhang-Beleg («imAnhang») — eine Quelllücke wird nur gebucht, `
                + 'wenn der Artikel in JEDEM Lücken-Stand im Änderungsanhang derselben Datei '
                + 'steht. Ohne diesen Beleg bleibt es bei «entfallen» + «neu eingefügt».',
              );
            }
            const zurueckAb = a.zurueckAb;
            if (!zurueckAb || !/^\d{4}-\d{2}-\d{2}$/.test(zurueckAb)) {
              fehler.push(`${kopf} ohne «zurueckAb» — ohne Rückkehr-Stand ist die Lücke nicht belegbar (§7).`);
              continue;
            }
            if (!staendeDaten.includes(zurueckAb) || !staendeDaten.includes(sch.bis)) {
              fehler.push(`${kopf}: «zurueckAb» ${zurueckAb} oder der Lücken-Stand ${sch.bis} ist kein ausgewerteter Stand dieses Erlasses.`);
              continue;
            }
            const luecke = staendeDaten.filter((d) => d >= sch.bis && d < zurueckAb);
            if (luecke.length < 1 || luecke.length > QUELLLUECKE_STAENDE_MAX) {
              fehler.push(
                `${kopf}: die Lücke umfasst ${luecke.length} Stand/Stände (erlaubt 1 … `
                + `${QUELLLUECKE_STAENDE_MAX}). Je länger die Lücke, desto eher ist sie eine `
                + 'echte Aufhebung mit späterem, wortgleichem Wiedererlass — und die als '
                + 'Lücke zu buchen wäre die schlimmere Falschaussage (§1).',
              );
            }
            for (const s2 of shard.schritte) {
              if (s2.bis > sch.bis && s2.bis <= zurueckAb && (s2.neuEIds ?? []).includes(a.eId)) {
                fehler.push(`${kopf}: der Schritt ${s2.von}→${s2.bis} bucht dieselbe eId weiterhin als «neu eingefügt» — die Gegenbuchung fehlt.`);
              }
              if (s2.bis > sch.bis && s2.bis < zurueckAb && s2.artikel.some((x) => x.eId === a.eId)) {
                fehler.push(`${kopf}: der Schritt ${s2.von}→${s2.bis} liegt IN der Lücke und bucht trotzdem einen Alt-Block derselben eId.`);
              }
            }
            const danach = shard.schritte
              .filter((s2) => s2.von >= zurueckAb)
              .sort((x, y) => (x.bis < y.bis ? -1 : 1))
              .flatMap((s2) => s2.artikel.filter((x) => x.eId === a.eId))[0];
            if (danach) {
              quellLueckenBelegt += 1;
              if (danach.shaNorm !== a.shaNorm) {
                fehler.push(
                  `${kopf}: der Wortlaut nach der Rückkehr (${zurueckAb}) ist NICHT derselbe `
                  + `wie vor der Lücke (shaNorm ${danach.shaNorm.slice(0, 12)}… ≠ `
                  + `${a.shaNorm.slice(0, 12)}…). Dann ist es keine Lücke der Quelle, sondern `
                  + 'eine Aufhebung mit Neuerlass — «entfallen» + «neu» ist dort richtig (§1).',
                );
              }
            }
          }
        }
      }
      // WARNUNG (nie rot): wortgleiche Rückkehr OHNE Anhang-Beleg. Der Generator hat
      // sie vorsichtig als «entfallen» + «neu eingefügt» stehen lassen — richtig, aber
      // sehenswert: entweder ist es eine echte Aufhebung mit wortgleicher Wiederkehr
      // (dann stimmt die Buchung), oder eine Konversions-Panne ohne Anhang (dann fehlt
      // dem Leser die ehrliche Auskunft). Beides entscheidet ein Mensch, nicht ein Tor.
      for (const o of eintrag.quellLueckeOhneBeleg ?? []) {
        quellLueckenOhneBeleg += 1;
        zeilen.push(
          `check:entstehung — HINWEIS: ${key} ${o.eId} fehlt ab ${o.stand} und kehrt am `
          + `${o.zurueckAb} wortgleich zurück, steht aber in keinem Lücken-Stand im `
          + 'Änderungsanhang — bleibt «entfallen» + «neu eingefügt» (§1), von Hand ansehen.',
        );
      }
      // LEER-DIFF-WÄCHTER (Befund Bauer #796, 11.9.2026, §5/§1): kein gespeicherter
      // Alt-Block darf nach der Leser-Vergleichsform (`vergleichsform`/`synopseZeilen`,
      // DIESELBE Funktion wie hier im Generator seit Profil `entstehung-norm/3`, Scope seit `/4`) «kein
      // Unterschied» zeigen — sonst speichert der Generator eine «Änderung», die der
      // Leser nie sehen kann (zwei Normalisierungen wären zwei Wahrheiten).
      //
      // OHNE Korpus-Snapshot (`pdf-embed`-Erlasse wie EMRK/NYUE — Register-Status,
      // `artikelAnzahl: 0`, kein `public/normtext/bund/<key>.json`) fällt `geltend` auf
      // ein leeres Array zurück: harmlos, weil `neuNach` es nur erreicht, wenn ein
      // Alt-Block art `geaendert` ohne Folgeschritt ist — dann zeigt der Vergleich gegen
      // «nichts» IMMER einen Unterschied (jeder Wortlaut ≠ leer), nie fälschlich «gleich».
      const normtextPfad = `public/normtext/bund/${key}.json`;
      const snap = existsSync(normtextPfad)
        ? (JSON.parse(readFileSync(normtextPfad, 'utf8')) as { eintraege: { artikel: string; bloecke: unknown }[] })
        : null;
      const geltendCache = new Map<string, SynopseBlock[]>();
      const geltendFuerToken = (token: string): SynopseBlock[] => {
        const cached = geltendCache.get(token);
        if (cached) return cached;
        const eintrag = snap?.eintraege.find((e) => e.artikel === token);
        const g = geltendeBloecke(eintrag?.bloecke as Parameters<typeof geltendeBloecke>[0]);
        geltendCache.set(token, g);
        return g;
      };
      for (const v of leerDiffVerletzungen(shard, geltendFuerToken)) {
        const eintrag = { erlass: key, token: v.token, stand: v.stand, zustand: v.zustand };
        if (leerDiffAusnahmeGueltig(leerDiffAusnahmen, eintrag, heuteAusnahme)) {
          leerDiffAusgenommen += 1;
          zeilen.push(
            `check:entstehung — Leer-Diff-Ausnahme (befristet, Muster #779): ${key} Token `
            + `${v.token} @${v.stand} (${v.zustand}) — siehe ${LEERDIFF_AUSNAHME_PFAD}.`,
          );
          continue;
        }
        fehler.push(
          `Synopse ${f}: Alt-Block Token ${v.token} @${v.stand} (${v.zustand}) ist nach der `
          + 'Leser-Vergleichsform OHNE Unterschied zu seinem «Neu» — zwei Normalisierungen, '
          + 'zwei Wahrheiten (§5/§1). Generator neu laufen (npm run entstehung:synopse -- '
          + '--datum=… --parser-neu="<Grund>"), oder befristete Ausnahme in '
          + `${LEERDIFF_AUSNAHME_PFAD} eintragen (max. ${LEERDIFF_AUSNAHME_TAGE_MAX} Tage, Muster #779).`,
        );
      }
      // ZWEITER AST (Auflage A5): der ERFUNDENE Unterschied — Alt und Neu sind nach der
      // gemeinsamen Vergleichsform identisch, das Titel-Paar gleich, und der Block steht
      // trotzdem im Shard. Dieselbe Ausnahmeliste, dieselbe Frist.
      for (const v of phantomVerletzungen(shard, geltendFuerToken)) {
        const eintrag = { erlass: key, token: v.token, stand: v.stand, zustand: v.zustand };
        if (leerDiffAusnahmeGueltig(leerDiffAusnahmen, eintrag, heuteAusnahme)) {
          phantomAusgenommen += 1;
          zeilen.push(
            `check:entstehung — Phantom-Ausnahme (befristet, Muster #779): ${key} Token `
            + `${v.token} @${v.stand} (${v.zustand}) — siehe ${LEERDIFF_AUSNAHME_PFAD}.`,
          );
          continue;
        }
        fehler.push(
          `Synopse ${f}: Alt-Block Token ${v.token} @${v.stand} (${v.zustand}) ist nach der `
          + 'gemeinsamen Vergleichsform IDENTISCH mit seinem «Neu» (Titel-Paar gleich) — der '
          + 'Shard behauptet eine Änderung, die es amtlich nicht gibt (§1/§8: erfundene '
          + 'Änderung). Ursache ist in aller Regel eine wandernde Elementgrenze (Ordnungs-'
          + 'Suffix «bis»/«quater», Absatz-Etikett im Text statt im <num>). Generator neu '
          + 'laufen (npm run entstehung:synopse -- --datum=… --parser-neu="<Grund>"), oder '
          + `befristete Ausnahme in ${LEERDIFF_AUSNAHME_PFAD} (max. ${LEERDIFF_AUSNAHME_TAGE_MAX} Tage).`,
        );
      }
      leerDiffGeprueft += 1;
    }
    for (const key of Object.keys(register.erlasse)) {
      if (!dateien.includes(`${key}.json`)) {
        fehler.push(`Quell-Register nennt einen Synopse-Shard ${key}.json, der in ${SYNOPSE_DIR} fehlt — stiller Verlust.`);
      }
    }
  }
  zeilen.push(
    `check:entstehung — Synopse: ${dateien.length} Erlass-Shard(s), ${staende} Stände, ${schritte} Schritte, `
    + `${bloecke} Alt-Blöcke (${ohneEreignis} ohne Fussnoten-Ereignis, ${konflikte} Fussnoten-Ereignisse ohne `
    + `beobachtete Textänderung — beides angezeigt, nie aufgelöst); grösster Erlass ${groesster[0]} `
    + `${kb(groesster[1])} / ${kb(JE_ERLASS)} (${((groesster[1] / JE_ERLASS) * 100).toFixed(0)} %); `
    + `Leer-Diff- UND Phantom-Wächter (§5/§1, Profil ${NORM_PROFIL}) gegen ${leerDiffGeprueft} Erlass-Korpora `
    + `geprüft, ${leerDiffAusgenommen} + ${phantomAusgenommen} befristete Ausnahme(n) `
    + `(Muster #779, ${LEERDIFF_AUSNAHME_PFAD}); ${quellLuecken} Quelllücke(n) statt «entfallen» `
    + `+ «neu eingefügt», davon ${quellLueckenBelegt} mit byte-gleicher Rückkehr im Artefakt `
    + `nachgerechnet, alle mit Anhang-Beleg (Lücken-Deckel ${QUELLLUECKE_STAENDE_MAX} Stände); `
    + `${quellLueckenOhneBeleg} wortgleiche Rückkehr(en) ohne Anhang-Beleg blieben «entfallen».`,
  );
}

// ── (8) Entwurf↔Beschluss-Shards: Provenienz, Join-Regel, Determinismus (E6) ───
{
  const register: EntwurfRegister | null = existsSync(ENTWURF_REGISTER_PFAD)
    ? (JSON.parse(readFileSync(ENTWURF_REGISTER_PFAD, 'utf8')) as EntwurfRegister)
    : null;
  const dateien = existsSync(ENTWURF_DIR)
    ? readdirSync(ENTWURF_DIR).filter((f) => f.endsWith('.json')).sort()
    : [];
  if (dateien.length && !register) {
    fehler.push(`${ENTWURF_DIR} ist befüllt, aber ${ENTWURF_REGISTER_PFAD} fehlt — ohne Quell-Register ist kein Entwurfs-Wortlaut belegbar (§7d).`);
  }
  let artikel = 0;
  let unveraendert = 0;
  if (register) {
    for (const f of dateien) {
      const key = f.slice(0, -'.json'.length);
      const roh = readFileSync(join(ENTWURF_DIR, f), 'utf8');
      const eintrag = register.vorlagen[key];
      if (!eintrag) { fehler.push(`Entwurf-Shard ${f} steht nicht im Quell-Register — Herkunft unbelegt (§7).`); continue; }
      const shard = JSON.parse(roh) as EntwurfShard;
      if (roh !== serialisiereEntwurfShard(shard)) {
        fehler.push(`Entwurf-Shard ${f} ist nicht kanonisch serialisiert — von Hand editiert? (Generator neu laufen.)`);
      }
      if (shaEntwurfShard(shard) !== eintrag.shardSha) {
        fehler.push(
          `Entwurf-Shard ${f}: sha weicht vom Quell-Register ab — der Entwurfs-Wortlaut hat sich `
          + 'geändert, ohne dass der Lauf ihn gebucht hätte (Determinismus-Wächter §11.6 (5)).',
        );
      }
      if (shard.normProfil !== NORM_PROFIL) {
        fehler.push(`Entwurf-Shard ${f}: Normalisierungs-Profil «${shard.normProfil}» ≠ «${NORM_PROFIL}».`);
      }
      for (const [rolle, dok, sha] of [
        ['Entwurf', shard.entwurfDok, eintrag.entwurfSha],
        ['Beschluss', shard.beschlussDok, eintrag.beschlussSha],
      ] as const) {
        if (!dok.htmlUrl.startsWith('https://fedlex.data.admin.ch/filestore/')) {
          fehler.push(`Entwurf-Shard ${f} (${rolle}): Quelle «${dok.htmlUrl}» ist keine Filestore-URL — URLs werden nie konstruiert (§7b).`);
        }
        if (!dok.liveUrl.startsWith('https://www.fedlex.admin.ch/eli/')) {
          fehler.push(`Entwurf-Shard ${f} (${rolle}): kein Live-Link zur amtlichen Fassung (§7c).`);
        }
        if (!/^[0-9a-f]{64}$/.test(dok.sha) || dok.sha !== sha) {
          fehler.push(`Entwurf-Shard ${f} (${rolle}): Quell-sha fehlt oder weicht vom Register ab (§7d).`);
        }
        if (dok.bloecke <= 0) fehler.push(`Entwurf-Shard ${f} (${rolle}): 0 Änderungsblöcke — Extraktion gescheitert.`);
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(shard.abgerufen)) fehler.push(`Entwurf-Shard ${f}: Abrufdatum fehlt (§7a).`);
      for (const a of shard.artikel) {
        artikel += 1;
        if (a.entwurf.trim() === '') fehler.push(`Entwurf-Shard ${f}: Artikel ${a.id} ohne Entwurfs-Wortlaut.`);
        if (!/^[0-9a-f]{64}$/.test(a.shaNorm)) fehler.push(`Entwurf-Shard ${f}: Artikel ${a.id} ohne shaNorm (§7d).`);
        // JOIN-REGEL (R3): der Schlüssel ist das normalisierte LABEL, nie die sequenzielle
        // `mod_uN`-id — ein id-Join ordnete gemessen 17 % der Artikel falsch zu.
        if (/^mod_u\d+$/.test(a.schluessel)) {
          fehler.push(`Entwurf-Shard ${f}: Artikel ${a.id} ist über die id gejoint statt über das Label (§11.4, R3: 7/41 falsch).`);
        }
      }
      unveraendert += shard.unveraendert;
    }
    for (const key of Object.keys(register.vorlagen)) {
      if (!dateien.includes(`${key}.json`)) {
        fehler.push(`Quell-Register nennt einen Entwurf-Shard ${key}.json, der in ${ENTWURF_DIR} fehlt — stiller Verlust.`);
      }
    }
  }
  zeilen.push(
    `check:entstehung — Entwurf↔Beschluss: ${dateien.length} Vorlage(n), ${artikel} im Parlament `
    + `veränderte oder gestrichene Entwurfs-Artikel, ${unveraendert} unverändert übernommen.`,
  );
}

// ── (4) Deckungs-Diagnose je Erlass ────────────────────────────────────────────
{
  const messung = misseDeckung();
  const gebucht: DeckungRegister = existsSync(DECKUNG_REGISTER_PFAD)
    ? (JSON.parse(readFileSync(DECKUNG_REGISTER_PFAD, 'utf8')) as DeckungRegister)
    : { erzeugt: heute, erlasse: {} };
  const neu: Record<string, DeckungErlass> = { ...gebucht.erlasse };
  let gesunken = 0;
  let neuGebucht = 0;
  for (const m of messung) {
    const alt = gebucht.erlasse[m.erlass];
    if (!alt) {
      if (schreibe) {
        neu[m.erlass] = { quote: m.quote, ocFussnoten: m.ocFussnoten, ocGetroffen: m.ocGetroffen, datum: heute };
        neuGebucht += 1;
      } else {
        fehler.push(`Deckung ${m.erlass}: nicht gebucht (Ist ${(m.quote * 100).toFixed(1)} %) — 'npm run entstehung:deckung -- --datum=$(date +%F)'.`);
      }
      continue;
    }
    if (m.quote < alt.quote) {
      gesunken += 1;
      if (!alt.grund) {
        fehler.push(
          `Deckung ${m.erlass}: ${(alt.quote * 100).toFixed(1)} % → ${(m.quote * 100).toFixed(1)} % gesunken `
          + `(${alt.ocGetroffen}/${alt.ocFussnoten} → ${m.ocGetroffen}/${m.ocFussnoten} oc) — eine Extraktion hat `
          + 'Fundstellen verloren. Ursache beheben, oder den gebuchten Stand mit Feld `grund` senken (§8).',
        );
      }
    } else if (schreibe && m.quote > alt.quote) {
      neu[m.erlass] = { quote: m.quote, ocFussnoten: m.ocFussnoten, ocGetroffen: m.ocGetroffen, datum: heute };
    }
  }
  if (schreibe) {
    mkdirSync('bibliothek/register', { recursive: true });
    writeFileSync(DECKUNG_REGISTER_PFAD, serialisiereDeckung({ erzeugt: heute, erlasse: neu }), 'utf8');
    console.log(`check:entstehung --schreibe: ${DECKUNG_REGISTER_PFAD} geschrieben (${neuGebucht} neu gebucht).`);
  }
  const summe = messung.reduce((n, m) => n + m.ocFussnoten, 0);
  const treffer = messung.reduce((n, m) => n + m.ocGetroffen, 0);
  const min = messung.length ? messung.reduce((a, m) => (m.quote < a.quote ? m : a)) : null;
  const max = messung.length ? messung.reduce((a, m) => (m.quote > a.quote ? m : a)) : null;
  zeilen.push(
    `check:entstehung — Deckung: ${messung.length} Erlasse, ${treffer}/${summe} Fussnoten-oc in der Fedlex-Änderungsliste `
    + `(${summe ? ((treffer / summe) * 100).toFixed(1) : '0.0'} % gesamt; Spanne ${min ? `${min.erlass} ${(min.quote * 100).toFixed(1)} %` : '—'} … `
    + `${max ? `${max.erlass} ${(max.quote * 100).toFixed(1)} %` : '—'}; ${gesunken} gesunken).`,
  );
}

// ── (6) Entstehungs-Projektion: je-Erlass-Deckel + Determinismus (E3) ──────────
// Die Projektion ist eine SICHT auf Bestehendes (Historie-Shard, Revisions-Sidecar,
// Botschaften-Quelle). Sie darf deshalb niemals etwas anderes sagen als ihre Quellen —
// dieselbe Zusicherung wie bei den Anker-Sidecars (§11.6 (5)), nur offline vollständig
// nachrechenbar: das Tor baut die Datei neu und vergleicht Byte für Byte.
{
  const HIST = 'public/normtext/historie';
  const REV = 'public/normtext/revisionen';
  if (!existsSync(PROJEKTION_DIR)) {
    zeilen.push('check:entstehung — Projektion: keine Dateien (Etappe E3 noch nicht gelaufen).');
  } else {
    const botschaften = new Map<string, BotschaftQuelle>();
    for (const b of BOTSCHAFTEN) {
      if (b.doktyp !== 'botschaft') continue;
      botschaften.set(b.key, {
        key: b.key, titel: b.titel, nummer: b.nummer, quelleUrl: b.quelleUrl,
        stand: b.stand, ereignisse: b.ereignisse,
      });
    }
    const ankerKeys = new Set<string>(
      existsSync(ANKER_DIR)
        ? readdirSync(ANKER_DIR).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5))
        : [],
    );
    const dateien = readdirSync(PROJEKTION_DIR).filter((f) => f.endsWith('.json')).sort();
    let groesste = 0;
    let groessteDatei = '\u2014';
    let abweichend = 0;
    for (const datei of dateien) {
      const ziel = join(PROJEKTION_DIR, datei);
      const ist = statSync(ziel).size;
      if (ist > groesste) { groesste = ist; groessteDatei = datei; }
      if (ist > PROJEKTION_DECKEL_DATEI) {
        fehler.push(`Projektion zu gross: ${ziel} ${kb(ist)} > ${kb(PROJEKTION_DECKEL_DATEI)} je Erlass (§15).`);
      }
      const erlass = decodeURIComponent(datei.slice(0, -5));
      const histPfad = join(HIST, datei);
      if (!existsSync(histPfad)) {
        fehler.push(`Projektion ohne Quelle: ${ziel} — kein Historie-Shard ${histPfad} (§8).`);
        continue;
      }
      const historie = JSON.parse(readFileSync(histPfad, 'utf8')) as HistorieQuelle;
      const revPfad = join(REV, datei);
      const revisionen = existsSync(revPfad)
        ? JSON.parse(readFileSync(revPfad, 'utf8')) as RevisionsQuelle
        : null;
      const neuGebaut = baueProjektion(erlass, historie, revisionen, botschaften, ankerKeys);
      const soll = neuGebaut ? serialisiereProjektion(neuGebaut) : null;
      if (soll !== readFileSync(ziel, 'utf8')) abweichend += 1;
    }
    if (abweichend > 0) {
      fehler.push(
        `${abweichend} Projektions-Datei(en) decken sich nicht mit der Neuberechnung aus ihren Quellen — `
        + 'entweder von Hand geändert oder die Quelle bewegte sich ohne Generator-Lauf. '
        + '«npm run gen:entstehung-projektion» ausführen und den Diff prüfen (§2/§5).',
      );
    }
    zeilen.push(
      `check:entstehung — Projektion: ${dateien.length} Erlasse, grösste ${groessteDatei} ${kb(groesste)} `
      + `/ ${kb(PROJEKTION_DECKEL_DATEI)} je Erlass; ${abweichend} Abweichung(en) zur Neuberechnung.`,
    );
  }
}

// ── (7) Deckungs-Sicht (W2·6c): Herleitung in ./deckung-projektion-quellen.ts,
// Muster ./deckel.ts — eingebaut stand das Tor bei 824 > 800 Zeilen (§6.6).
{
  const { zeile, fehler: f } = pruefeDeckungsSicht();
  if (zeile) zeilen.push(zeile);
  fehler.push(...f);
}

for (const z of zeilen) console.log(z);
if (fehler.length) {
  console.error(`\ncheck:entstehung ROT (${fehler.length}):`);
  for (const f of fehler) console.error(`  - ${f}`);
  process.exit(1);
}
console.log('\ncheck:entstehung GRÜN — Deckel, Anker-Provenienz, Curia-Zustand und Deckungs-Diagnose eingehalten.');
