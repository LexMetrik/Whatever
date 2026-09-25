/**
 * scripts/normtext/check-segmente.ts — CLI für `check:segmente` (QS-KORPUS).
 *
 * Siehe scripts/normtext/segmente-logik.ts für die reine Logik und die
 * Architektur-Begründung (Herz-und-Nieren-Prüfung 24.9.2026, Befund
 * normtext-treue-11; NACHTRAG 25.9.2026 «eingefrorenes Soll»).
 *
 * ZWEI MODI (NACHTRAG Punkte B/C):
 *  - Modus B (KEIN /tmp-Cache — der Normalfall in PR-CI/Merge-Queue): prüft
 *    die committete Projektion `public/normtext/bund/<KEY>.json` GEGEN das
 *    committete Soll `scripts/normtext/segmente-soll/<name>.json` — scharf,
 *    kein Hinweis-Grün mehr. Das ist der eigentliche PR-Schutz (Rot-Beweis R9).
 *  - Modus C (VOLLER, pin-gültiger /tmp-Cache — lokal nach `fedlex-cache.sh`
 *    oder im Frische-Arm mit `--cache-pflicht`): leitet das Soll frisch aus
 *    der HTML ab, vergleicht es mit dem committeten (Abweichung ⇒ rot, «Soll
 *    veraltet»), prüft danach wie B — mit den frischen (garantiert aktuellen)
 *    Fingerabdrücken. `--schreiben` aktualisiert die committeten Soll-Dateien.
 *
 * Cache-Semantik ausserhalb der Moduswahl (unverändert ggü. `check:p-klassen`,
 * Zeilen ~105/175–205 dort): Teilbestand (0 < vorhanden < alle) ⇒ FEHLER;
 * `--cache-pflicht`/`LEXMETRIK_CACHE_PFLICHT=1` ohne Cache ⇒ FEHLER;
 * pin-ungültiger Cache (bei vollem Bestand) ⇒ FEHLER.
 *
 * PRÜFUMFANG — bekannte Lücke (G10, Gegenprüfung 2): geprüft wird Text IN den
 * Ankern (art_*, disp_uN/art_*, Anhang-/scope-/decl-Sektionen). Rund 260–290
 * `disp_uN`-Abschnitte (Schluss-/Übergangsbestimmungen; GP 2 per lxml-
 * Textknoten: 261 in 56 Erlassen; dieses Tor 25.9.2026: 289 in 59 — Abschnitt
 * mit Text ausserhalb article ohne h1–h6/Fussnoten, s. dispTextAusserhalbArtikel)
 * tragen AUCH Text ausserhalb ihrer <article> (z.B. «Übergangs-
 * bestimmungen zur Änderung vom …»); er steht in keinem Anker, ist darum nicht
 * im Soll und wird von diesem Tor nicht geprüft — bekannt als M13, Behebung im
 * Schritt W2·5l-NORMTEXT-B2. Modus C zählt diese Abschnitte in jedem Lauf.
 *
 * `LEXMETRIK_FEDLEX_CACHE_DIR` (Default `/tmp`): NUR für die eigenen Rot-Beweise
 * (R6–R9, s. Bericht) — ein Test-Cache-Verzeichnis statt des mit anderen
 * Sessions GETEILTEN `/tmp`, damit die Rot-Proben den echten Cache nie anfassen.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { parseFedlexCacheEintraege, type FedlexCacheEintrag } from './inventar-bund.ts';
import { pinBefund, pinIdentitaet } from './cache-pin-befund.ts';
import {
  addiereZeilenStatistik,
  BELEG_DATEINAME,
  alleAnhangEids,
  alleArtikelEids,
  ankerIdVonEid,
  dispTextAusserhalbArtikel,
  fehlendeIndizes,
  fingerabdrueckeZuSoll,
  gleicheBasislinieAb,
  leereZeilenStatistik,
  parseErlassHtml,
  pinIdentGleich,
  projektionsBlob,
  segmentiereAnker,
  segmenteZuFingerabdruecken,
  SEGMENTER_VERSION,
  sollAktualitaet,
  sollInhaltGleich,
  sollZuFingerabdruecke,
  zeilenStatistikGleich,
  type BasislinienEintrag,
  type Fingerabdruck,
  type ProjektionsEintrag,
  type SollDatei,
  type SollPin,
  type ZeilenStatistik,
} from './segmente-logik.ts';
import {
  B6_BASIS_REF,
  B6_KOPF_REF,
  pruefeB6,
  pruefeBelegAufPlatte,
  schreibeBeleg,
  SOLL_VERZEICHNIS,
} from './segmente-beleg-io.ts';

// B1 (dokumentierte Ausnahme, s. u.): KKV art_126_z__2 ist der Synthese-
// Schlüssel für das ZWEITE physische `<article id="art_126_z">` in der HTML
// (Fedlex-Quellfehler, s. artikel-vorkommen.ts) — `getElementById` liefert für
// diesen Namen NIE ein Element (kein Attribut dieses Wortlauts existiert),
// `getElementById('art_126_z')` liefert stattdessen IMMER das ERSTE Vorkommen.
// Jede WEITERE Ausklammerung ist ein echter Befund, kein bekannter Fall.
const AUSKLAMMERUNG_AUSNAHME = 'KKV\u0000art_126_z__2';

// G3 (Runde 3): Anker, die die HTML trägt, die Projektion aber bewusst bzw.
// bekanntermassen NICHT als Eintrag führt — geprüft gegen HTML UND AKN-XML
// (25.9.2026). Jede weitere solche Lücke ist ein Rückschritt (rot); eine
// Ausnahme, die nicht mehr eintritt, ist veraltet (rot).
const OHNE_PROJEKTION_BEKANNT: ReadonlyMap<string, string> = new Map([
  // Deckblatt «Anhänge» — reine Inhaltsübersicht der nummerierten Anhänge,
  // kein eigener Anhang (dieselbe Regel wie der Extraktor, dort `alleAnhangAnker`).
  ['CHEMRRV\u0000annex_u1', 'Deckblatt-Inhaltsübersicht, kein eigener Eintrag'],
  // ECHTER VERLUST, neue Verlust-Klasse: die «Beilage — Beschreibung der
  // Führerausweiskategorien» (VZV, SR 741.51, Stand 1.1.2026) steht in HTML und
  // AKN-XML (eId annex_u1/lvl_u1), fehlt in der Projektion; der Extraktor
  // verwirft unnummerierte annex_uN als Deckblatt, sobald nummerierte Anhänge
  // existieren. Befund zur Behebung gemeldet (Bau-Bericht Runde 3).
  ['VZV\u0000annex_u1', 'normtext-treue-deckblatt: Beilage vom Extraktor als Deckblatt verworfen (echter Verlust)'],
]);

const STANDARD_CACHE_DIR = '/tmp';
const cacheDir = process.env.LEXMETRIK_FEDLEX_CACHE_DIR || STANDARD_CACHE_DIR;
const cachePflicht = process.argv.includes('--cache-pflicht') || process.env.LEXMETRIK_CACHE_PFLICHT === '1';
const schreibenModus = process.argv.includes('--schreiben');

const BASISLINIEN_PFAD = 'scripts/normtext/segmente-basislinie.json';
const PROJEKTIONS_VERZEICHNIS = 'public/normtext/bund';

// Kollaps-Sperre (wie `check:p-klassen`s `MINDEST_ARTIKELZAHL`): der reale
// Bestand hat ~24'900 `art_`-Einträge + ~700 weitere (`annex_`/`disp_`/`scope_`/
// `decl_`) — ein Einbruch auf (nahe) 0 darf nie als "✓ keine Verluste" durchgehen.
const MINDEST_ARTIKELZAHL = 20_000;

type Fund = { erlass: string; eId: string; hash: string; laenge: number; auszug?: string };

function fehlerUndExit(zeilen: string[]): never {
  for (const z of zeilen) console.error(z);
  process.exit(1);
}

// ── Cache-Zustand ───────────────────────────────────────────────────────────

/**
 * Pin-Prüfung: der Produktionspfad (`/tmp`) nutzt die geteilte Sonde 1:1
 * (§ Architektur Ziff. 1); ein Test-Verzeichnis (`LEXMETRIK_FEDLEX_CACHE_DIR`)
 * prüft denselben Identitäts-String (`pinIdentitaet` — reine Formatierung ohne
 * Pfad) selbst nach, weil `pinBefund` `/tmp` fest verdrahtet liest.
 */
function liesPinBefund(e: FedlexCacheEintrag): { ok: boolean; grund?: string } {
  if (cacheDir === STANDARD_CACHE_DIR) return pinBefund(e.name, e.eli, e.konsolidierung, e.htmlN);
  const pinPfad = `${cacheDir}/${e.name}.html.pin`;
  if (!existsSync(pinPfad)) return { ok: false, grund: 'Pin-Marker fehlt (Testverzeichnis)' };
  const inhalt = readFileSync(pinPfad, 'utf8').trim();
  const erwartet = pinIdentitaet(e.eli, e.konsolidierung, e.htmlN);
  return inhalt === erwartet
    ? { ok: true }
    : { ok: false, grund: `Pin weicht ab (Testverzeichnis): ${inhalt} ≠ ${erwartet}` };
}

function ermittleCacheZustand(eintraege: FedlexCacheEintrag[]): { vorhanden: number; pinFehler: string[] } {
  let vorhanden = 0;
  const pinFehler: string[] = [];
  for (const e of eintraege) {
    if (!existsSync(`${cacheDir}/${e.name}.html`)) continue;
    vorhanden++;
    const pin = liesPinBefund(e);
    if (!pin.ok) pinFehler.push(`  FEHLER ${e.name}: ${pin.grund}`);
  }
  return { vorhanden, pinFehler };
}

// ── Soll-/Projektions-/Basislinien-I/O ─────────────────────────────────────

function liesSollDatei(name: string): SollDatei | null {
  const pfad = `${SOLL_VERZEICHNIS}/${name}.json`;
  if (!existsSync(pfad)) return null;
  return JSON.parse(readFileSync(pfad, 'utf8')) as SollDatei;
}

function ladeProjektion(key: string): Map<string, ProjektionsEintrag> | null {
  const pfad = `${PROJEKTIONS_VERZEICHNIS}/${key}.json`;
  if (!existsSync(pfad)) return null;
  const daten = JSON.parse(readFileSync(pfad, 'utf8')) as { eintraege: ProjektionsEintrag[] };
  const map = new Map<string, ProjektionsEintrag>();
  for (const e of daten.eintraege) map.set(e.id, e);
  return map;
}

function ladeBasislinie(): BasislinienEintrag[] {
  if (!existsSync(BASISLINIEN_PFAD)) return [];
  return JSON.parse(readFileSync(BASISLINIEN_PFAD, 'utf8')) as BasislinienEintrag[];
}

// ── Frische Ableitung aus HTML (Modus C / --schreiben) ─────────────────────

interface FrischesSoll {
  pin: SollPin;
  artikel: Record<string, Fingerabdruck[]>;
  zeilenStatistik: ZeilenStatistik; // G1: Zeilen ohne Zeilen-Fingerabdruck je Grund (landet im Soll)
  dispAusserhalb: number; // G10: disp_uN-Abschnitte mit Text ausserhalb <article> (M13, nicht im Soll)
  auszuegeJeEid: Map<string, Map<string, string>>; // eId -> hash -> Auszug (≤80 Zeichen, NUR Report/Basislinie)
  keinAnkerLokalisierbar: string[];
  restmeldungen: string[]; // B2/G5: unklassifizierter Text nach der Zerlegung — ROT (s. segmente-logik.ts restmenge)
}

/**
 * B1+B5+G3: die zu prüfende Artikelmenge = HTML-Anker (art_*, disp_uN/art_*,
 * Anhang-/scope-/decl-Sektionen) VEREINIGT mit den Projektions-eIds — nur HTML
 * verlöre die KKV-Ausnahme (Synthese-Schlüssel art_126_z__2), nur Projektion
 * einen ganz gelöschten Artikel (B5). Jede eId wird per `ankerIdVonEid`
 * (disp_uN_x → disp_uN/x) gegen die HTML aufgelöst. Der Zeilen-Fingerabdruck
 * hängt seit G1/G6 (Runde 3) nicht mehr von der Projektion ab.
 */
function leiteFrischesSollAb(e: FedlexCacheEintrag): FrischesSoll {
  const html = readFileSync(`${cacheDir}/${e.name}.html`, 'utf8');
  const dokument = parseErlassHtml(html);
  const key = e.name.toUpperCase();
  const praefix = `bund/${key}/`;
  const projektion = ladeProjektion(key);
  const eIdsAusProjektion = [...(projektion?.values() ?? [])]
    .filter((eintrag) => eintrag.id.startsWith(praefix)) // sollte laut Schema nie vorkommen (empirisch geprüft, 25601/25601)
    .map((eintrag) => eintrag.id.slice(praefix.length));
  const alleEids = [
    ...new Set([...alleArtikelEids(dokument), ...alleAnhangEids(dokument), ...eIdsAusProjektion]),
  ].sort();

  const artikel: Record<string, Fingerabdruck[]> = {};
  const auszuegeJeEid = new Map<string, Map<string, string>>();
  const keinAnkerLokalisierbar: string[] = [];
  const restmeldungen: string[] = [];
  const zeilenStatistik = leereZeilenStatistik();

  for (const eId of alleEids) {
    const rest: string[] = [];
    const rohSegmente = segmentiereAnker(dokument, ankerIdVonEid(eId), rest, zeilenStatistik);
    for (const m of rest) restmeldungen.push(`${key} ${eId}: ${m}`); // G5: Meldung nennt Erlass und eId
    if (rohSegmente === null) {
      keinAnkerLokalisierbar.push(eId);
      continue;
    }
    const fps: Fingerabdruck[] = [];
    const auszuege = new Map<string, string>();
    for (const { roh, fp } of segmenteZuFingerabdruecken(rohSegmente)) {
      fps.push(fp);
      if (!auszuege.has(fp.hash)) auszuege.set(fp.hash, roh.text.trim().replace(/\s+/g, ' ').slice(0, 80));
    }
    artikel[eId] = fps;
    if (auszuege.size) auszuegeJeEid.set(eId, auszuege);
  }

  return {
    pin: { eli: e.eli, konsolidierung: e.konsolidierung, htmlN: e.htmlN },
    artikel,
    zeilenStatistik,
    dispAusserhalb: dispTextAusserhalbArtikel(dokument),
    auszuegeJeEid,
    keinAnkerLokalisierbar,
    restmeldungen,
  };
}

// ── Enthaltensein je Erlass (EINE Logik für Modus B und C, § Architektur Ziff. 6) ─

function pruefeErlassGegenProjektion(
  key: string,
  artikelSoll: Record<string, [number, string][]>,
  auszuegeJeEid?: Map<string, Map<string, string>>,
): { funde: Fund[]; keinProjektionsEintrag: string[]; geprueftArtikel: number } {
  const projektion = ladeProjektion(key);
  const funde: Fund[] = [];
  const keinProjektionsEintrag: string[] = [];
  let geprueftArtikel = 0;

  for (const [eId, paare] of Object.entries(artikelSoll)) {
    const eintrag = projektion?.get(`bund/${key}/${eId}`);
    if (!eintrag) {
      keinProjektionsEintrag.push(eId);
      continue;
    }
    geprueftArtikel++;
    const fps = sollZuFingerabdruecke(paare);
    const blob = projektionsBlob(eintrag);
    for (const i of fehlendeIndizes(blob, fps)) {
      const fp = fps[i];
      funde.push({ erlass: key, eId, hash: fp.hash, laenge: fp.laenge, auszug: auszuegeJeEid?.get(eId)?.get(fp.hash) });
    }
  }
  return { funde, keinProjektionsEintrag, geprueftArtikel };
}

// ── B1: Ausklammerungen (Anker nicht in der HTML lokalisierbar) ────────────
//
// JEDER Lauf, der frisch aus der HTML ableitet (--schreiben, Modus C), zählt
// UND meldet sie — zulässig ist NUR die dokumentierte Ausnahme KKV
// art_126_z__2 (s. AUSKLAMMERUNG_AUSNAHME oben); jede weitere ist ein
// unentdeckter Verlust-Kandidat wie das früher unbemerkte PatG Art. 149 und
// macht den Lauf ROT statt eine stille Lücke zu bleiben.
function unerwarteteAusklammerungen(anzeige: ReadonlyArray<{ erlass: string; eId: string }>): string[] {
  return anzeige
    .filter((a) => `${a.erlass}\u0000${a.eId}` !== AUSKLAMMERUNG_AUSNAHME)
    .map((a) => `${a.erlass} ${a.eId}`);
}

// G5 (Runde 3): Text, den kein Segmenttyp erfasst (unbekannter Block wie
// <ul>/<li>), ist ROT — heute 0 Treffer, ein neuer Fall hält den Lauf an.
function restmengenFehler(meldungen: readonly string[]): string[] {
  return [
    `❌ FEHLER (G5): ${meldungen.length} Text-Rest(e) ohne Segment — unbekannter Block-Typ, Zerlegung erweitern:`,
    ...meldungen.slice(0, 20).map((m) => `   · ${m}`),
  ];
}

// ── --schreiben ─────────────────────────────────────────────────────────────

// G9 (Runde 3): ERST alles ableiten und prüfen (unerwartete Ausklammerungen,
// Restmengen), DANN schreiben — bei einem Fehler bleibt kein halb
// geschriebener Soll-Bestand zurück (vorher: alle Dateien geschrieben, dann rot).
function schreibeSoll(eintraege: FedlexCacheEintrag[]): void {
  let gesamtArtikel = 0;
  let gesamtSegmente = 0;
  const ausklammerungen: Array<{ erlass: string; eId: string }> = [];
  const restmeldungen: string[] = [];
  const dateien: Array<{ name: string; inhalt: string }> = [];
  for (const e of eintraege) {
    const frisch = leiteFrischesSollAb(e);
    const sollDatei: SollDatei = {
      pin: frisch.pin,
      segmenterVersion: SEGMENTER_VERSION,
      zeilenStatistik: frisch.zeilenStatistik,
      artikel: Object.fromEntries(
        Object.entries(frisch.artikel).map(([eId, fps]) => [eId, fingerabdrueckeZuSoll(fps)]),
      ),
    };
    dateien.push({ name: `${e.name}.json`, inhalt: JSON.stringify(sollDatei) + '\n' });
    gesamtArtikel += Object.keys(frisch.artikel).length;
    for (const fps of Object.values(frisch.artikel)) gesamtSegmente += fps.length;
    for (const eId of frisch.keinAnkerLokalisierbar) ausklammerungen.push({ erlass: e.name.toUpperCase(), eId });
    restmeldungen.push(...frisch.restmeldungen);
  }
  const unerwartet = unerwarteteAusklammerungen(ausklammerungen);
  if (unerwartet.length > 0) {
    fehlerUndExit([
      `❌ FEHLER: --schreiben fand ${unerwartet.length} unerwartete Ausklammerung(en) ` +
        `(Anker nicht in der HTML lokalisierbar, ausser der dokumentierten Ausnahme ${AUSKLAMMERUNG_AUSNAHME.replace('\u0000', ' ')}):`,
      ...unerwartet.slice(0, 30).map((a) => `   · ${a}`),
      '   → NICHTS geschrieben (G9).',
    ]);
  }
  if (restmeldungen.length > 0) fehlerUndExit([...restmengenFehler(restmeldungen), '   → NICHTS geschrieben (G9).']);

  mkdirSync(SOLL_VERZEICHNIS, { recursive: true });
  for (const d of dateien) writeFileSync(`${SOLL_VERZEICHNIS}/${d.name}`, d.inhalt, 'utf8');
  schreibeBeleg(); // G4: Modus-C-Beleg — Hash über alle Soll-Dateien, wie sie jetzt auf der Platte liegen
  console.log(
    `✓ --schreiben: ${eintraege.length} Soll-Dateien in ${SOLL_VERZEICHNIS}/ geschrieben ` +
      `(${gesamtArtikel} Artikel, ${gesamtSegmente} Segmente, ${ausklammerungen.length} ausgeklammert ` +
      `[davon ${ausklammerungen.length - unerwartet.length} dokumentierte Ausnahme]).`,
  );
}
// ── Modus B / Modus C ────────────────────────────────────────────────────────

interface Zwischenergebnis {
  modus: 'B' | 'C';
  eintraege: FedlexCacheEintrag[];
  alleFunde: Fund[];
  sollVeraltet: string[];
  keinSoll: string[];
  keinProjektionsEintragGesamt: Array<{ erlass: string; eId: string }>;
  geprueftArtikelGesamt: number;
  geprueftErlasse: Set<string>; // B10: welche Erlass-KEYs diesen Lauf TATSÄCHLICH geprüft wurden (nicht keinSoll/sollVeraltet)
  keinAnkerLokalisierbarGesamt: Array<{ erlass: string; eId: string }>; // B1: nur Modus C (Modus B rührt die HTML nie an)
  restmeldungenGesamt: string[]; // B2: nur Modus C
  zeilenStatistik: ZeilenStatistik; // G1: B aus den Soll-Dateien, C frisch aus der HTML
  dispAusserhalb?: { abschnitte: number; erlasse: number }; // G10: nur Modus C
}

function pruefeModusB(eintraege: FedlexCacheEintrag[]): Zwischenergebnis {
  const alleFunde: Fund[] = [];
  const sollVeraltet: string[] = [];
  const keinSoll: string[] = [];
  const keinProjektionsEintragGesamt: Array<{ erlass: string; eId: string }> = [];
  const geprueftErlasse = new Set<string>();
  const zeilenStatistik = leereZeilenStatistik();
  let geprueftArtikelGesamt = 0;

  for (const e of eintraege) {
    const committedSoll = liesSollDatei(e.name);
    if (!committedSoll) {
      keinSoll.push(e.name);
      continue;
    }
    const aktuellerPin: SollPin = { eli: e.eli, konsolidierung: e.konsolidierung, htmlN: e.htmlN };
    if (!pinIdentGleich(committedSoll.pin, aktuellerPin) || committedSoll.segmenterVersion !== SEGMENTER_VERSION) {
      sollVeraltet.push(e.name);
      continue; // ein ungültiges Soll für Enthaltensein zu nutzen wäre wertlos.
    }
    const key = e.name.toUpperCase();
    geprueftErlasse.add(key);
    if (committedSoll.zeilenStatistik) addiereZeilenStatistik(zeilenStatistik, committedSoll.zeilenStatistik);
    const { funde, keinProjektionsEintrag, geprueftArtikel } = pruefeErlassGegenProjektion(key, committedSoll.artikel);
    alleFunde.push(...funde);
    for (const eId of keinProjektionsEintrag) keinProjektionsEintragGesamt.push({ erlass: key, eId });
    geprueftArtikelGesamt += geprueftArtikel;
  }
  return {
    modus: 'B',
    eintraege,
    alleFunde,
    sollVeraltet,
    keinSoll,
    keinProjektionsEintragGesamt,
    geprueftArtikelGesamt,
    geprueftErlasse,
    keinAnkerLokalisierbarGesamt: [],
    restmeldungenGesamt: [],
    zeilenStatistik,
  };
}

function pruefeModusC(eintraege: FedlexCacheEintrag[]): Zwischenergebnis {
  const alleFunde: Fund[] = [];
  const sollVeraltet: string[] = [];
  const keinSoll: string[] = [];
  const keinProjektionsEintragGesamt: Array<{ erlass: string; eId: string }> = [];
  const geprueftErlasse = new Set<string>();
  const keinAnkerLokalisierbarGesamt: Array<{ erlass: string; eId: string }> = [];
  const restmeldungenGesamt: string[] = [];
  const zeilenStatistik = leereZeilenStatistik();
  let geprueftArtikelGesamt = 0;
  let dispAbschnitte = 0;
  let dispErlasse = 0;

  for (const e of eintraege) {
    const frisch = leiteFrischesSollAb(e);
    const key = e.name.toUpperCase();
    addiereZeilenStatistik(zeilenStatistik, frisch.zeilenStatistik);
    dispAbschnitte += frisch.dispAusserhalb;
    if (frisch.dispAusserhalb > 0) dispErlasse++;
    for (const eId of frisch.keinAnkerLokalisierbar) keinAnkerLokalisierbarGesamt.push({ erlass: key, eId });
    restmeldungenGesamt.push(...frisch.restmeldungen);
    const kompaktesSoll = Object.fromEntries(
      Object.entries(frisch.artikel).map(([eId, fps]) => [eId, fingerabdrueckeZuSoll(fps)]),
    );
    const committedSoll = liesSollDatei(e.name);
    if (!committedSoll) {
      keinSoll.push(e.name);
    } else {
      const pinGleich = pinIdentGleich(committedSoll.pin, frisch.pin) && committedSoll.segmenterVersion === SEGMENTER_VERSION;
      const inhaltGleich =
        pinGleich &&
        sollInhaltGleich(committedSoll.artikel, kompaktesSoll) &&
        zeilenStatistikGleich(committedSoll.zeilenStatistik, frisch.zeilenStatistik);
      if (!pinGleich || !inhaltGleich) sollVeraltet.push(e.name);
    }

    geprueftErlasse.add(key);
    const { funde, keinProjektionsEintrag, geprueftArtikel } = pruefeErlassGegenProjektion(
      key,
      kompaktesSoll,
      frisch.auszuegeJeEid,
    );
    alleFunde.push(...funde);
    for (const eId of keinProjektionsEintrag) keinProjektionsEintragGesamt.push({ erlass: key, eId });
    geprueftArtikelGesamt += geprueftArtikel;
  }
  return {
    modus: 'C',
    eintraege,
    alleFunde,
    sollVeraltet,
    keinSoll,
    keinProjektionsEintragGesamt,
    geprueftArtikelGesamt,
    geprueftErlasse,
    keinAnkerLokalisierbarGesamt,
    restmeldungenGesamt,
    zeilenStatistik,
    dispAusserhalb: { abschnitte: dispAbschnitte, erlasse: dispErlasse },
  };
}

// ── Bericht + Urteil ─────────────────────────────────────────────────────────

function berichteUndBewerte(z: Zwischenergebnis): void {
  const basislinie = ladeBasislinie();
  // G7: Artikel ohne Projektions-Eintrag wurden nicht geprüft — ihre
  // Basislinien-Einträge sind «übersprungen», nicht «veraltet» (P10).
  const ungepruefteArtikel = new Set(z.keinProjektionsEintragGesamt.map((a) => `${a.erlass}\u0000${a.eId}`));
  const abgleich = gleicheBasislinieAb(z.alleFunde, basislinie, z.geprueftErlasse, ungepruefteArtikel);
  let fehler = false;

  console.log(`[check:segmente] Modus ${z.modus} — ${z.eintraege.length} Erlasse, ${z.geprueftArtikelGesamt} Artikel geprüft.`);
  // G1: in JEDEM Lauf — Tabellen/Zeilen und die Zeilen OHNE Zeilen-Fingerabdruck je Grund.
  const zs = z.zeilenStatistik;
  const ohneFp = zs.ohne.kopf + zs.ohne.einzelzelle + zs.ohne.marken + zs.ohne.bild;
  console.log(
    `ℹ  Tabellen ${zs.tabellen} (${zs.tabellenOhneZeilenFp} ganz ohne Zeilen-Fingerabdruck), Zeilen ${zs.zeilen}: ` +
      `${zs.mitFingerabdruck} mit Zeilen-Fingerabdruck, ${ohneFp} ohne, davon ${zs.ungeschuetzt} ganz ungeprüft (keine Zelle ≥ 8 Zeichen) ` +
      `(Kopfzeile ${zs.ohne.kopf} · eine Zelle ${zs.ohne.einzelzelle} · durch Listenmarken getrennt ${zs.ohne.marken} · durch Bildzellen getrennt ${zs.ohne.bild}).`,
  );

  // B1: Ausklammerungen JEDEN Lauf zählen/ausgeben (nur Modus C — Modus B
  // rührt die HTML nie an, s. Zwischenergebnis). Zulässig nur die
  // dokumentierte Ausnahme (AUSKLAMMERUNG_AUSNAHME); jede weitere ⇒ rot.
  if (z.keinAnkerLokalisierbarGesamt.length > 0) {
    console.log(
      `ℹ  ${z.keinAnkerLokalisierbarGesamt.length} Ausklammerung(en) (Anker nicht in der HTML lokalisierbar):`,
    );
    const unerwartet = unerwarteteAusklammerungen(z.keinAnkerLokalisierbarGesamt);
    if (unerwartet.length > 0) {
      fehler = true;
      console.error(
        `❌ FEHLER: ${unerwartet.length} davon UNERWARTET (nicht die dokumentierte Ausnahme ` +
          `${AUSKLAMMERUNG_AUSNAHME.replace('\u0000', ' ')}):`,
      );
      for (const a of unerwartet.slice(0, 30)) console.error(`   · ${a}`);
    }
  }
  // G10: bekannte Lücke des Prüfumfangs sichtbar halten (nur C — braucht die HTML).
  if (z.dispAusserhalb) {
    console.log(
      `ℹ  ${z.dispAusserhalb.abschnitte} disp_uN-Abschnitt(e) in ${z.dispAusserhalb.erlasse} Erlass(en) tragen Text ` +
        `ausserhalb von <article> — nicht im Soll (M13, W2·5l-NORMTEXT-B2; s. Dateikopf).`,
    );
  }
  // B2/G5: Restmenge (Text ohne Segment) ist ROT (s. segmente-logik.ts `restmenge`).
  if (z.restmeldungenGesamt.length > 0) {
    fehler = true;
    for (const zeile of restmengenFehler(z.restmeldungenGesamt)) console.error(zeile);
  }

  // B6: nur Modus B (Modus C ist durch die frische HTML-Ableitung geschützt,
  // prüft aber den Modus-C-Beleg mit, s. `berichteBeleg`).
  if (z.modus === 'B') {
    const b6 = pruefeB6();
    if ('basisFehler' in b6) {
      fehler = true;
      console.error(`❌ FEHLER (B6): ${b6.basisFehler}`);
    } else {
      if (b6.belegPflicht) {
        console.log(
          `ℹ  B6: ${b6.ohneBasisNeu.length + b6.ohneBasisVersion.length} Soll-Datei(en) ohne Vergleichsbasis (neu ${b6.ohneBasisNeu.length} / ` +
            `Versionswechsel ${b6.ohneBasisVersion.length}), Pin-Wechsel ${b6.pinwechsel.length} — Modus-C-Beleg ${b6.belegFehler ? 'UNGÜLTIG' : 'gültig'}.`,
        );
      }
      if (b6.belegFehler) {
        fehler = true;
        console.error(
          `❌ FEHLER (B6/G4/R3-4): Soll-Dateien ohne Vergleichsbasis oder mit Pin-Wechsel verlangen einen gültigen ${BELEG_DATEINAME} — ${b6.belegFehler}`,
        );
        console.error('   → mit vollständigem Cache: npm run check:segmente -- --schreiben (schreibt Soll UND Beleg)');
      }
      if (b6.verstoss.length > 0) {
        fehler = true;
        console.error(
          `❌ FEHLER (B6): Soll-Datei(en) im committeten Bereich (${B6_BASIS_REF}..${B6_KOPF_REF}) geändert ` +
            `OHNE Pin-/Versionswechsel — unbelegter Inhaltswechsel: ${b6.verstoss.join(', ')}`,
        );
      }
    }
  } else {
    const beleg = pruefeBelegAufPlatte();
    if (!beleg.ok) {
      fehler = true;
      console.error(`❌ FEHLER (G4): ${BELEG_DATEINAME} passt nicht — ${beleg.grund} → npm run check:segmente -- --schreiben`);
    }
  }

  if (z.keinSoll.length > 0) {
    fehler = true;
    console.error(`❌ FEHLER: kein Soll für ${z.keinSoll.length} gepinnte(n) Erlass(e): ${z.keinSoll.join(', ')}`);
    console.error('   → mit vollständigem Cache: npm run check:segmente -- --schreiben');
  }
  if (z.sollVeraltet.length > 0) {
    fehler = true;
    console.error(
      `❌ FEHLER: Soll veraltet (Pin/Segmenter-Version/Inhalt weicht vom aktuellen Stand ab) ` +
        `für ${z.sollVeraltet.length} Erlass(e): ${z.sollVeraltet.join(', ')}`,
    );
    console.error('   → mit vollständigem Cache: npm run check:segmente -- --schreiben');
  }
  if (z.geprueftArtikelGesamt < MINDEST_ARTIKELZAHL) {
    fehler = true;
    console.error(
      `❌ FEHLER: nur ${z.geprueftArtikelGesamt} Artikel geprüft (Mindestzahl ${MINDEST_ARTIKELZAHL}) — Prüfung unzuverlässig statt grün.`,
    );
  }
  // G3: dokumentierte Anker ohne Projektions-Eintrag (OHNE_PROJEKTION_BEKANNT)
  // melden statt rot; jede andere Lücke ist ein Rückschritt; eine Ausnahme, die
  // in einem geprüften Erlass nicht mehr eintritt, ist veraltet.
  const schluessel = (a: { erlass: string; eId: string }): string => `${a.erlass}\u0000${a.eId}`;
  const bekanntOhne = z.keinProjektionsEintragGesamt.filter((a) => OHNE_PROJEKTION_BEKANNT.has(schluessel(a)));
  const rueckschritt = z.keinProjektionsEintragGesamt.filter((a) => !OHNE_PROJEKTION_BEKANNT.has(schluessel(a)));
  const getroffen = new Set(bekanntOhne.map(schluessel));
  const ausnahmeVeraltet = [...OHNE_PROJEKTION_BEKANNT.keys()].filter(
    (k) => z.geprueftErlasse.has(k.split('\u0000')[0]) && !getroffen.has(k),
  );
  if (bekanntOhne.length > 0) {
    console.log(`ℹ  ${bekanntOhne.length} dokumentierte(r) Anker ohne Projektions-Eintrag (G3):`);
    for (const a of bekanntOhne) console.log(`   · ${a.erlass} ${a.eId} — ${OHNE_PROJEKTION_BEKANNT.get(schluessel(a))}`);
  }
  if (ausnahmeVeraltet.length > 0) {
    fehler = true;
    console.error(`❌ FEHLER: OHNE_PROJEKTION_BEKANNT veraltet (Anker hat jetzt einen Eintrag oder fehlt in der HTML) — Ausnahme entfernen:`);
    for (const k of ausnahmeVeraltet) console.error(`   · ${k.replace('\u0000', ' ')}`);
  }
  if (rueckschritt.length > 0) {
    fehler = true;
    console.error(
      `❌ FEHLER: ${rueckschritt.length} im Soll bekannte Artikel haben KEINEN Projektions-Eintrag mehr (Rückschritt):`,
    );
    for (const { erlass, eId } of rueckschritt.slice(0, 20)) console.error(`   · ${erlass} ${eId}`);
  }
  if (abgleich.neu.length > 0) {
    fehler = true;
    console.error(`❌ NEUE fehlende Segmente (nicht in der Basislinie), ${abgleich.neu.length}:`);
    for (const f of abgleich.neu) {
      console.error(`   · ${f.erlass} ${f.eId} (Länge ${f.laenge}, Hash ${f.hash})${f.auszug ? `: "${f.auszug}"` : ''}`);
    }
  }
  if (abgleich.veraltet.length > 0) {
    fehler = true;
    console.error(`❌ VERALTETE Basislinien-Einträge (heute nicht mehr fehlend — Eintrag entfernen), ${abgleich.veraltet.length}:`);
    for (const e of abgleich.veraltet) console.error(`   · ${e.erlass} ${e.eId} (${e.befund}): "${e.auszug}"`);
  }
  // B10: ein Basislinien-Eintrag eines Erlasses, das dieser Lauf gar nicht
  // geprüft hat (kein/veraltetes Soll), ist NICHT «veraltet» (das riete
  // fälschlich «Eintrag entfernen») — nur eine Information, kein Fehler.
  if (abgleich.uebersprungen.length > 0) {
    const orte = new Set(
      abgleich.uebersprungen.map((e) =>
        ungepruefteArtikel.has(`${e.erlass}\u0000${e.eId}`) ? `${e.erlass} ${e.eId}` : e.erlass,
      ),
    );
    console.log(
      `ℹ  ${abgleich.uebersprungen.length} Basislinien-Eintrag/Einträge NICHT geprüft ` +
        `(Erlass übersprungen: kein/veraltetes Soll, bzw. Artikel ohne Projektions-Eintrag — ${[...orte].join(', ')}).`,
    );
  }
  if (abgleich.bekannt.length > 0) {
    const nachBefund = new Map<string, number>();
    for (const e of abgleich.bekannt) nachBefund.set(e.befund, (nachBefund.get(e.befund) ?? 0) + 1);
    console.log(`ℹ  ${abgleich.bekannt.length} bekannte, in der Basislinie erfasste Lücke(n):`);
    for (const [befund, n] of [...nachBefund].sort()) console.log(`   · ${befund}: ${n}`);
  }

  if (fehler) process.exit(1);
  console.log(
    `✓ check:segmente grün — Modus ${z.modus}, ${z.geprueftArtikelGesamt} Artikel, ` +
      `${abgleich.bekannt.length} bekannte Lücke(n), 0 neue.`,
  );
}

// B9 (Gegenprüfung 25.9.2026): --schreiben ohne vollständigen/pin-gültigen
// Cache überspringt NUR, wenn alle committeten Soll-Dateien schon zum
// deklarierten Pin (fedlex-cache.sh) + heutiger Segmenter-Version passen
// (reiner String-Vergleich, `sollAktualitaet`); sonst FEHLER — kein stilles
// Weiterlaufen mit veraltetem Soll (§6.7). Hier statt in
// normtext-repin-kaskade.sh, damit jeder Aufrufer profitiert (§5).
function schreibenPfad(eintraege: FedlexCacheEintrag[], vorhanden: number, pinFehler: string[]): void {
  if (vorhanden === eintraege.length && pinFehler.length === 0) {
    schreibeSoll(eintraege);
    return;
  }
  const { fehlend, veraltet } = sollAktualitaet(eintraege, liesSollDatei, SEGMENTER_VERSION);
  if (fehlend.length === 0 && veraltet.length === 0) {
    console.log(
      `ℹ  --schreiben übersprungen (B9): kein vollständiger Cache in ${cacheDir} ` +
        `(${vorhanden}/${eintraege.length} vorhanden, ${pinFehler.length} pin-ungültig) — ` +
        `alle ${eintraege.length} Soll-Pins sind bereits aktuell, nichts zu tun.`,
    );
    return;
  }
  fehlerUndExit([
    `❌ FEHLER: --schreiben verlangt einen VOLLSTÄNDIGEN, pin-gültigen Cache ` +
      `(${vorhanden}/${eintraege.length} in ${cacheDir} vorhanden, ${pinFehler.length} pin-ungültig) — ` +
      `und ${fehlend.length + veraltet.length} Soll-Datei(en) sind nicht aktuell, ein Überspringen ist nicht sicher (B9).`,
    ...(fehlend.length ? [`   fehlend: ${fehlend.join(', ')}`] : []),
    ...(veraltet.length ? [`   veraltet: ${veraltet.join(', ')}`] : []),
  ]);
}
// ── Haupt ────────────────────────────────────────────────────────────────

function main(): void {
  const shell = readFileSync('scripts/fedlex-cache.sh', 'utf8');
  const eintraege = parseFedlexCacheEintraege(shell);
  const { vorhanden, pinFehler } = ermittleCacheZustand(eintraege);

  if (schreibenModus) {
    schreibenPfad(eintraege, vorhanden, pinFehler);
    return;
  }

  // Linse 9 (Orchestrator-Entscheid 25.9.2026, nach Empfehlung der
  // Gegenprüfung 25.9.2026): Modus B (eingefrorenes Soll, ohne Cache) ist
  // STANDARD, AUCH LOKAL — ein zufällig voller /tmp-Cache schaltet NICHT mehr
  // automatisch auf Modus C um (das widersprach zuvor "Modus C nur mit
  // --cache-pflicht"). Nur --cache-pflicht/LEXMETRIK_CACHE_PFLICHT=1 (oder
  // --schreiben, oben bereits behandelt) verlangt Modus C.
  if (!cachePflicht) {
    berichteUndBewerte(pruefeModusB(eintraege));
    return;
  }

  // Ab hier: Modus C angefordert — jetzt zählt der Cache-Zustand. Der
  // Teilbestand-Fehler feuert damit NUR NOCH im C-Pfad (Linse 9: der geteilte
  // /tmp, in den andere Sessions schreiben, soll den B-Standardlauf nicht
  // mehr rot machen können).
  if (vorhanden > 0 && vorhanden < eintraege.length) {
    fehlerUndExit([
      `❌ FEHLER: --cache-pflicht verlangt ALLE Caches, aber nur ${vorhanden}/${eintraege.length} Bund-Erlasse haben ` +
        `einen Cache in ${cacheDir} (Teilbestand)`,
      "   — entweder ALLE Caches bereitstellen ('bash scripts/fedlex-cache.sh') oder OHNE --cache-pflicht laufen lassen (Modus B).",
    ]);
  }
  if (vorhanden === 0) {
    fehlerUndExit([
      `❌ FEHLER: --cache-pflicht/LEXMETRIK_CACHE_PFLICHT verlangt Bund-Caches, aber 0/${eintraege.length} in ${cacheDir} vorhanden.`,
    ]);
  }
  if (pinFehler.length > 0) {
    fehlerUndExit([...pinFehler, `❌ FEHLER: ${pinFehler.length} Cache(s) pin-ungültig — Prüfung unzuverlässig statt grün.`]);
  }
  berichteUndBewerte(pruefeModusC(eintraege));
}

main();
