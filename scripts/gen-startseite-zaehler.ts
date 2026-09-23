// ─── Generator: Register/Manifeste → Startseiten-Zähler ─────────────────────
//
// Berechnet die substanziellen Bestandszahlen der Rubrik-Kacheln (Startseite V3,
// FAHRPLAN §3 #4) EINMAL zur Buildzeit und schreibt sie nach
// src/data/startseiteZaehler.generated.ts. Die Startseite importiert NUR diese
// Mini-Datei (Zahlen + Stand) — kein Register/Manifest landet im Startseiten-
// Chunk, kein Client-Fetch. Niemals von Hand editieren.
//
//   npm run gen:zaehler       erzeugt/aktualisiert die Datei
//   npm run check:zaehler     prüft Drift (Datei ≠ Register) → exit 1
//
// Vorbild: gen:verfall / check:verfall-ui (verfall-generieren.ts). Quellen (SSoT
// §5): public/normtext/register.json (Gesetze-Volltext), public/rechtsprechung/
// register.json (Entscheide-Volltext) und der Katalog startseiteConfig.ts
// (verfügbare Rechner/Vorlagen). Gezählt wird NUR echter Volltext (status
// 'snapshot' bzw. Nicht-Verweis-Entscheide) — dünne Bestände bleiben ohne Zahl.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { KATALOG_KARTEN, istVerfuegbar } from '../src/lib/startseiteConfig.ts';
import { istVorlage } from '../src/lib/vorlagenKategorie.ts';
// W2·24-R3: die Startseite zeigt die Systematik des Bundesrechts und die
// Behörden der Materialien als Listen MIT Zahlen. Beide Ordnungen bleiben ihre
// eigene SSoT (§5) — `SYSTEMATIK` (Anzeige-Ordnung des Bundesrechts) und
// `BEHOERDEN` (Herausgeber der Materialien); hier werden sie NUR mit dem
// Register verschnitten und die Zahl daraus GEZÄHLT. Beide Module wandern damit
// nicht in den Startseiten-Chunk (§15, `check:perf-budget`).
import { SYSTEMATIK } from '../src/lib/normtext/systematik.ts';
import { BEHOERDEN } from '../src/lib/materialien/register.ts';
// W2·24-D26: die Seitenleiste zeigt die Sachgebiete der Rechtsprechung mit Zahl.
// Ordnung + Beschriftung bleiben `GEBIETE` (SSoT der Sach-Achse); gezählt wird
// hier gegen das Entscheid-Register, nach DERSELBEN Regel wie `zaehleSachgebiete`
// in `src/lib/rechtsprechung/browse.ts` (Verweise raus) — die Zahl in der Leiste
// ist damit exakt die Zahl auf der Sachgebiets-Kachel der Übersicht (§5/§8).
import { GEBIETE } from '../src/lib/normtext/register.ts';
// #691 (FAHRPLAN-OFFENE-BEFUNDE §1): der Stand der Rechtsprechung braucht das
// jüngste ABRUFDATUM der Inhalte, nicht `register.json`s `erzeugt` (ein
// Bau-Zeitstempel). Kern in einem Helfer OHNE Top-Level-Seiteneffekte, damit
// er isoliert testbar bleibt (src/tests/startseite-zaehler-stand-rechtsprechung.test.ts).
import { juengstes, berechneStandRechtsprechung } from './startseite-zaehler-stand.ts';

const wurzel = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const GESETZE_REGISTER = resolve(wurzel, 'public/normtext/register.json');
const RSPR_REGISTER = resolve(wurzel, 'public/rechtsprechung/register.json');
const MATERIALIEN_REGISTER = resolve(wurzel, 'public/materialien/register.json');
const ZIEL = resolve(wurzel, 'src/data/startseiteZaehler.generated.ts');

interface ErlassEintrag {
  key: string; ebene: 'bund' | 'kanton'; status: string; kanton?: string;
  kuerzel: string; rechtsgebiet: string;
  /** Konsolidierungsstand des Snapshots (ISO) — D8: Quelle des Inhaltsalters. */
  stand?: string | null;
}
interface EntscheidEintrag {
  verweis?: unknown;
  /** Entscheiddatum (ISO) — D8. */
  datum?: string | null;
  /** Sach-Achse (GEBIETE-id) — D26. */
  sachgebiet?: string;
  /** 'leitentscheid' | 'routine' … — D26. */
  leitcharakter?: string;
  /** Pfad zur eigenen Snapshot-Datei, relativ zu `public/rechtsprechung/`
   *  (`null` bei Verweisen) — #691: Quelle des Abrufdatums je Entscheid. */
  datei?: string | null;
}
interface MaterialEintrag {
  key: string; behoerde: string;
  /** Publikations-/Fassungsstand der Materialie (ISO) — D8. */
  stand?: string | null;
}

// ─── D8 (David 6.9.2026) · JÜNGSTER EINTRAG STATT BUILD-DATUM ────────────────
//
// «Register erzeugt: Gesetze 05.09.2026 · …» nannte das Datum des BUILD-LAUFS
// und las sich wie das Alter der Inhalte — David: irreführend. Die drei Register
// tragen das echte Alter selbst mit (`stand` am Erlass, `datum` am Entscheid,
// `stand` an der Materialie); hier wird je Sammlung das JÜNGSTE davon gezogen.
//
// ZWEI REGELN, beide §8:
//  · Nur ISO-Datumswerte `JJJJ-MM-TT` zählen; alles andere (null, leer, ein
//    Freitext-Stand) fällt weg, statt still als «1970» oder als Zeichenkette
//    mitsortiert zu werden. Lexikografischer Vergleich ist bei diesem Format
//    identisch mit dem chronologischen — kein Date-Objekt, kein Zeitzonen-Risiko
//    (§2, das Artefakt muss deterministisch sein).
//  · Gibt es keinen einzigen gültigen Wert, ist das Feld `null` und die Zeile
//    entfällt in der Anzeige — nie ein erfundenes Datum.
//
// `juengstes` sitzt seit #691 im Helfer `startseite-zaehler-stand.ts` (Import
// oben) — dieselbe Funktion, jetzt geteilt mit `berechneStandRechtsprechung`.

/** Wie viele Kürzel je Systematik-Zeile als Beispiel-Zeile mitlaufen. */
const KUERZEL_PRO_ZEILE = 4;

function zaehle() {
  // Gesetze: nur echter Volltext (status 'snapshot'); nach Ebene getrennt, damit
  // die Anzeige die Scope-Wahl behält (nur-live-link/pdf-embed zählen NICHT).
  const g = JSON.parse(readFileSync(GESETZE_REGISTER, 'utf8')) as { erzeugt: string; erlasse: ErlassEintrag[] };
  const bund = g.erlasse.filter((e) => e.ebene === 'bund' && e.status === 'snapshot').length;
  const kanton = g.erlasse.filter((e) => e.ebene === 'kanton' && e.status === 'snapshot').length;

  // IA-7 (W2·5d §11.5): erfasste Erlass-Zahl JE Kanton für die Sidebar-Badges —
  // DIESELBE Zählregel wie die IA-2-UI (`kantonAnzahl` in Gesetze.tsx): ALLE
  // Manifest-Einträge der Ebene «kanton», nicht nur status 'snapshot' (heute
  // deckungsgleich, da alle kantonalen Einträge Snapshots sind — das Tor
  // src/tests/navigation-ia7-badges.test.ts meldet ein Auseinanderlaufen).
  // Schlüssel alphabetisch sortiert → deterministisches Artefakt (§2/§5).
  const proKanton: Record<string, number> = {};
  for (const e of g.erlasse) {
    if (e.ebene === 'kanton' && e.kanton) proKanton[e.kanton] = (proKanton[e.kanton] ?? 0) + 1;
  }
  const kantonErlassZahlen = Object.fromEntries(
    Object.keys(proKanton).sort().map((k) => [k, proKanton[k]]),
  );

  // ── Systematik des Bundesrechts (W2·24-R3) ────────────────────────────────
  // Die Startseite listet die Ordnung, nach der `/gesetze?ebene=bund` gliedert
  // (Anker `#sys-<id>`). Gezählt wird, was in DIESER Kategorie als Volltext
  // vorliegt — nie eine erfundene oder aus der Schlüssel-Liste geschätzte Zahl
  // (§8): ein in SYSTEMATIK gelisteter Key ohne Snapshot zählt nicht mit.
  const bundVolltext = g.erlasse.filter((e) => e.ebene === 'bund' && e.status === 'snapshot');
  const nachKey = new Map(bundVolltext.map((e) => [e.key.toUpperCase(), e]));
  const bundSystematik = SYSTEMATIK.map((k) => {
    const treffer: ErlassEintrag[] = [];
    for (const gruppe of k.gruppen) {
      for (const key of gruppe.keys) {
        const e = nachKey.get(key.toUpperCase());
        if (e) treffer.push(e);
      }
    }
    return {
      nr: k.nr, id: k.id, titel: k.titel,
      kuerzel: treffer.slice(0, KUERZEL_PRO_ZEILE).map((e) => e.kuerzel),
      anzahl: treffer.length,
    };
  });
  // Die Säule «International» ist seit IA-6 KEINE Systematik-Kategorie mehr
  // (systematik.ts, Kommentar am Listenende) — sie steht als eigene Zeile, mit
  // ihrer eigenen Zahl aus derselben Regel.
  const international = bundVolltext.filter((e) => e.rechtsgebiet === 'international');
  // K5 (W2·29-WERKBANK-KATALOGE, 23.9.2026): die Säule «Bundesrecht» — Bund OHNE
  // International, dieselbe Menge wie Kachel und Tab «Bundesrecht» in /gesetze.
  // Der /gesetze-Kopf zählte die 28 Staatsverträge sonst in den Bundeserlassen
  // UND daneben (231 + 28). Bundesrecht + International = gesetzeBundVolltext.
  const bundesrecht = bundVolltext.length - international.length;

  // Rechtsprechung: Nicht-Verweis-Entscheide = echte Volltext-Snapshots (Verweise
  // sind Redirect-Stubs auf ein anderes Urteil, s. NewsHeader/Rechtsprechung.tsx).
  const r = JSON.parse(readFileSync(RSPR_REGISTER, 'utf8')) as { erzeugt: string; entscheide: EntscheidEintrag[] };
  const echteEntscheide = r.entscheide.filter((e) => !e.verweis);
  const entscheide = echteEntscheide.length;
  // K5: Verweis-Einträge (das vollständige Urteil zu einem BGE, eigener Eintrag
  // mit Deep-Link in den Leitentscheid) — getrennt ausgewiesen, nie in die
  // Entscheid-Zahl gemischt (/abdeckung zählte bis K5 beides zusammen).
  const vollurteilVerweise = r.entscheide.length - entscheide;
  // D26 · je Sachgebiet + Leitentscheide. Sachgebiete ohne Entscheid fallen weg
  // (nie eine 0-Zeile behaupten, §8 — dieselbe Regel wie bei den Behörden und
  // wie in `zaehleSachgebiete`, das die Kacheln der Übersicht speist).
  const proGebiet: Record<string, number> = {};
  for (const e of echteEntscheide) {
    if (e.sachgebiet) proGebiet[e.sachgebiet] = (proGebiet[e.sachgebiet] ?? 0) + 1;
  }
  const rechtsprechungSachgebiete = GEBIETE
    .filter((gb) => (proGebiet[gb.id] ?? 0) > 0)
    .map((gb) => ({ id: gb.id, label: gb.label, anzahl: proGebiet[gb.id] }));
  const rechtsprechungLeitentscheide = echteEntscheide
    .filter((e) => e.leitcharakter === 'leitentscheid').length;

  // Rechner/Vorlagen: verfügbare Katalog-Karten MIT eigener Seite (aus dem Katalog
  // abgeleitet, §5 — nicht zweitgepflegt).
  const rechner = KATALOG_KARTEN.filter((k) => istVerfuegbar(k) && !!k.href && !istVorlage(k)).length;
  const vorlagen = KATALOG_KARTEN.filter((k) => istVerfuegbar(k) && !!k.href && istVorlage(k)).length;

  // Materialien (E6a·M5, §0/B10a): erfasste amtliche Behördenpublikationen aus dem
  // Browse-Manifest (kuratiert + gelistete DB-Dokumente). Alle sind bibliografische
  // Verweise (nur-live-link) — der Zähler nennt ehrlich «erfasste», nie Volltext.
  const m = JSON.parse(readFileSync(MATERIALIEN_REGISTER, 'utf8')) as { erzeugt: string; materialien: MaterialEintrag[] };
  const materialien = m.materialien.length;
  // Je Behörde, in der Anzeige-Reihenfolge BEHOERDEN (rang = Praxisrelevanz).
  // Behörden ohne Eintrag fallen weg — nie eine 0-Zeile behaupten (§8).
  const proBehoerde: Record<string, number> = {};
  for (const x of m.materialien) proBehoerde[x.behoerde] = (proBehoerde[x.behoerde] ?? 0) + 1;
  const materialienBehoerden = BEHOERDEN
    .filter((b) => (proBehoerde[b.id] ?? 0) > 0)
    .map((b) => ({ id: b.id, kuerzel: b.kuerzel, name: b.name, anzahl: proBehoerde[b.id] }));

  // D8: das Alter der INHALTE je Sammlung (nicht des Builds).
  //  · Gesetze — jüngster Konsolidierungsstand über die Volltext-Snapshots.
  //    `status !== 'snapshot'`-Einträge tragen keinen eigenen Stand und blieben
  //    sonst als Fremdwert in der Zahl (dieselbe Zählmenge wie `gesetzeVolltext`).
  //  · Rechtsprechung — jüngstes Entscheiddatum über die NICHT-Verweise
  //    (ein Verweis ist ein Redirect-Stub, kein eigener Entscheid).
  //  · Materialien — jüngster `stand`; existiert das Feld nirgends, bleibt es
  //    null und die Zeile fehlt in der Anzeige, statt etwas zu behaupten.
  const juengsterGesetzStand = juengstes(
    g.erlasse.filter((e) => e.status === 'snapshot').map((e) => e.stand));
  const juengsterEntscheid = juengstes(
    r.entscheide.filter((e) => !e.verweis).map((e) => e.datum));
  const juengsteMaterialie = juengstes(m.materialien.map((x) => x.stand));

  // #691: Stand der Rechtsprechung = jüngstes ABRUFDATUM über den echten
  // Bestand — NICHT `r.erzeugt` (Bau-Zeitstempel des letzten Registerlaufs,
  // sprang bei jedem Teil-Lauf auf «heute», egal ob neue Entscheide dazukamen).
  // Jede Snapshot-Datei trägt ihr eigenes `erzeugt` == Abrufdatum des Inhalts
  // (entscheide-schreiben.ts). §2: rein/deterministisch — kein Date.now().
  // Fallback auf `r.erzeugt` NUR falls der Bestand keinen einzigen gültigen
  // Wert liefert (leeres/degeneriertes Register) — das Feld bleibt `string`
  // (kein API-Bruch für Konsumenten), und ein solcher Bestand reisst ohnehin
  // `check:entscheide`s Mindestzahl-Tor.
  const standRechtsprechung = berechneStandRechtsprechung(r.entscheide, (datei) => {
    const snap = JSON.parse(readFileSync(resolve(dirname(RSPR_REGISTER), datei), 'utf8')) as { erzeugt?: string };
    return snap.erzeugt ?? null;
  }) ?? r.erzeugt;

  return {
    gesetzeBundVolltext: bund,
    gesetzeKantonVolltext: kanton,
    gesetzeVolltext: bund + kanton,
    kantonErlassZahlen,
    bundSystematik,
    gesetzeBundesrechtVolltext: bundesrecht,
    gesetzeInternationalVolltext: international.length,
    internationalKuerzel: international.slice(0, KUERZEL_PRO_ZEILE).map((e) => e.kuerzel),
    rechtsprechungVolltext: entscheide,
    rechtsprechungVollurteilVerweise: vollurteilVerweise,
    rechtsprechungSachgebiete,
    rechtsprechungLeitentscheide,
    materialien,
    materialienBehoerden,
    rechner,
    vorlagen,
    standGesetze: g.erzeugt,
    standRechtsprechung,
    standMaterialien: m.erzeugt,
    juengsterGesetzStand,
    juengsterEntscheid,
    juengsteMaterialie,
  };
}

function baue(): string {
  const z = zaehle();
  return (
    '// ─── GENERIERT via `npm run gen:zaehler` ────────────────────────────────\n' +
    '// NICHT von Hand editieren. Quellen (SSoT §5): public/normtext/register.json,\n' +
    '// public/rechtsprechung/register.json und der Katalog (startseiteConfig.ts).\n' +
    '// Drift-Tor: `npm run check:zaehler`. Nur echter Volltext ist gezählt\n' +
    '// (Gesetze/Entscheide: status snapshot bzw. Nicht-Verweise).\n\n' +
    'export interface StartseiteZaehler {\n' +
    '  /** Bundeserlasse im Volltext (status snapshot). */\n' +
    '  gesetzeBundVolltext: number;\n' +
    '  /** Kantonserlasse im Volltext (status snapshot). */\n' +
    '  gesetzeKantonVolltext: number;\n' +
    '  /** Bund + Kanton im Volltext. */\n' +
    '  gesetzeVolltext: number;\n' +
    '  /** IA-7: erfasste Erlasse JE Kanton (alle Manifest-Einträge der Ebene kanton —\n' +
    '   *  dieselbe Zählregel wie die IA-2-Badges/`kantonAnzahl` in Gesetze.tsx). */\n' +
    '  kantonErlassZahlen: Record<string, number>;\n' +
    '  /** W2·24-R3: Systematik des Bundesrechts (Ordnung + Titel aus\n' +
    '   *  `lib/normtext/systematik.ts`, Anker `/gesetze?ebene=bund#sys-<id>`),\n' +
    '   *  je Kategorie die Zahl der VOLLTEXT-Erlasse und bis zu vier Kürzel. */\n' +
    '  bundSystematik: Array<{ nr: string; id: string; titel: string; kuerzel: string[]; anzahl: number }>;\n' +
    '  /** K5: Bundeserlasse der Säule «Bundesrecht» im Volltext (ohne International) —\n' +
    '   *  Bundesrecht + International = gesetzeBundVolltext. */\n' +
    '  gesetzeBundesrechtVolltext: number;\n' +
    '  /** Bundeserlasse der Säule «International» im Volltext (rechtsgebiet international). */\n' +
    '  gesetzeInternationalVolltext: number;\n' +
    '  /** Bis zu vier Kürzel der Säule «International» (Register-Reihenfolge). */\n' +
    '  internationalKuerzel: string[];\n' +
    '  /** Gerichtsentscheide im Volltext (Nicht-Verweise). */\n' +
    '  rechtsprechungVolltext: number;\n' +
    '  /** K5: Verweis-Einträge (vollständiges Urteil zu einem BGE, Deep-Link in den\n' +
    '   *  Leitentscheid) — getrennt von `rechtsprechungVolltext`, nie addiert. */\n' +
    '  rechtsprechungVollurteilVerweise: number;\n' +
    '  /** W2·24-D26: Entscheide je Sachgebiet (Ordnung/Label aus `GEBIETE`),\n' +
    '   *  Zählregel identisch zu `zaehleSachgebiete` (Verweise raus); Sachgebiete\n' +
    '   *  ohne Entscheid fehlen (§8). Ziel je Zeile: `/rechtsprechung?rg=<id>`. */\n' +
    '  rechtsprechungSachgebiete: Array<{ id: string; label: string; anzahl: number }>;\n' +
    '  /** W2·24-D26: amtliche Leitentscheide (Nicht-Verweise, leitcharakter\n' +
    '   *  `leitentscheid`) — Ziel `/rechtsprechung?leit=1`. */\n' +
    '  rechtsprechungLeitentscheide: number;\n' +
    '  /** Erfasste amtliche Materialien (Behördenpublikationen, nur-live-link). */\n' +
    '  materialien: number;\n' +
    '  /** W2·24-R3: erfasste Materialien je Behörde, Reihenfolge BEHOERDEN (rang);\n' +
    '   *  Behörden ohne Eintrag fehlen (nie eine 0-Zeile behaupten, §8). */\n' +
    '  materialienBehoerden: Array<{ id: string; kuerzel: string; name: string; anzahl: number }>;\n' +
    '  /** Verfügbare Rechner (eigene Seite). */\n' +
    '  rechner: number;\n' +
    '  /** Verfügbare Vorlagen (eigene Seite). */\n' +
    '  vorlagen: number;\n' +
    '  /** Stand der Gesetzes-Register-Erzeugung (ISO). */\n' +
    '  standGesetze: string;\n' +
    '  /** Fix #691 (12.9.2026): jüngstes ABRUFDATUM über den echten Rechtsprechungs-\n' +
    '   *  Bestand (ISO) — zuvor stand hier das Erzeugungsdatum des Registers\n' +
    '   *  (`register.json`s `erzeugt`, ein Bau-Zeitstempel), der bei jedem\n' +
    '   *  Teil-Lauf auf «heute» sprang, unabhängig davon ob neue Entscheide\n' +
    '   *  dazukamen. Andere Bedeutung als `standGesetze`/`standMaterialien`\n' +
    '   *  (die bleiben Bau-Zeitstempel) — bewusst, weil hier ein echtes\n' +
    '   *  Abrufdatum je Snapshot vorliegt (§8). */\n' +
    '  standRechtsprechung: string;\n' +
    '  /** Stand der Materialien-Register-Erzeugung (ISO). */\n' +
    '  standMaterialien: string;\n' +
    '  /** D8: jüngster Konsolidierungsstand über alle Volltext-Erlasse (ISO)\n' +
    '   *  — das Alter der INHALTE, nicht des Builds. null = kein gültiges Datum. */\n' +
    '  juengsterGesetzStand: string | null;\n' +
    '  /** D8: jüngstes Entscheiddatum (Nicht-Verweise, ISO) oder null. */\n' +
    '  juengsterEntscheid: string | null;\n' +
    '  /** D8: jüngster Materialien-Stand (ISO) oder null — fehlt das Feld im\n' +
    '   *  Register durchgehend, bleibt die Zeile in der Anzeige weg (§8). */\n' +
    '  juengsteMaterialie: string | null;\n' +
    '}\n\n' +
    'export const STARTSEITE_ZAEHLER: StartseiteZaehler = ' + JSON.stringify(z, null, 2) + ';\n'
  );
}

const istCheck = process.argv.includes('--check');
const neu = baue();

if (istCheck) {
  let alt = '';
  try {
    alt = readFileSync(ZIEL, 'utf8');
  } catch {
    console.error('check:zaehler: ' + ZIEL + ' fehlt — `npm run gen:zaehler` ausführen.');
    process.exit(1);
  }
  if (alt !== neu) {
    console.error('check:zaehler: src/data/startseiteZaehler.generated.ts ist VERALTET gegenüber den Registern (§5) — `npm run gen:zaehler` ausführen und committen.');
    process.exit(1);
  }
  console.log('check:zaehler: Startseiten-Zähler synchron mit den Registern.');
} else {
  writeFileSync(ZIEL, neu, 'utf8');
  const z = zaehle();
  console.log(`gen:zaehler: Gesetze ${z.gesetzeVolltext} (Bund ${z.gesetzeBundVolltext}/Kanton ${z.gesetzeKantonVolltext}) · Entscheide ${z.rechtsprechungVolltext} · Materialien ${z.materialien} · Rechner ${z.rechner} · Vorlagen ${z.vorlagen} → src/data/startseiteZaehler.generated.ts` +
    `\n           jüngster Eintrag: Gesetze ${z.juengsterGesetzStand ?? '—'} · Entscheide ${z.juengsterEntscheid ?? '—'} · Materialien ${z.juengsteMaterialie ?? '—'}`);
}
