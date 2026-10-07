// Client-Schicht der Rubrik V «Gesetze»: lädt das Browse-Manifest
// (public/normtext/register.json) und die Volltext-Dateien lazy, plus reine
// Gruppier-/Filter-Helfer. Reine Ladeschicht (§3) — kein Normtext erzeugt.

import type { BrowseManifest, BrowseErlass } from './browse-typen';
import type { NormSnapshot, NormSnapshotDatei } from './typen';
import type { KantonSystematik } from './systematik';
import { randtitelKnoten } from './darstellung';
import { normtextDateiUrl } from './dateiUrl';
import { ladeJson, ladeJsonStreng, pruefeFelder } from '../ladeJson';

const MANIFEST_PRUEFER = pruefeFelder('normtext/register.json', { erlasse: 'array' });
const DATEI_PRUEFER = pruefeFelder('normtext/<Erlass>.json', { eintraege: 'array' });
const STRUKTUR_PRUEFER = pruefeFelder('normtext/struktur/<Ebene>/<Erlass>.json', {});
/** Die Struktur-Datei fehlt, wenn `vite dev`/`vite preview` statt eines 404 die index.html (200 text/html) liefern. */
const IST_HTML = (res: Response) => /\btext\/html\b/i.test(res.headers?.get?.('content-type') ?? '');

// ── Manifest (einmal, gecacht als laufende Promise; Fehlschläge nicht, s. u.) ─
let manifestPromise: Promise<BrowseManifest> | null = null;

/** Ein JSON-Sidecar, einmal geladen und gecacht — STRENG (W2·17-UI-BEFUNDE
 *  BG-02/BG-03, 2.10.2026): Netz-, 5xx-, 404- und Parse-Fehler WERFEN und
 *  fallen aus dem Cache, der nächste Aufruf holt neu (wie Register und Datei,
 *  O-1.7). Vorher wurde der Fehlschlag als LEERES Ergebnis gecacht: «nächste
 *  Fassung ab …», das Prüfdatum und der Lücken-Hinweis eines Kantonserlasses
 *  verschwanden nach einem einzigen Netz-Aussetzer für die ganze Sitzung, ohne
 *  Spur (§8: eine Unvollständigkeit darf nicht vom Netz abhängen). Ob und wie
 *  der Ausfall gezeigt wird, entscheidet der Aufrufer (`useLeserDaten`). */
function sidecarStreng<T>(url: string, auswerten: (roh: unknown) => T): () => Promise<T> {
  let gecacht: Promise<T> | null = null;
  return () => {
    if (!gecacht) {
      const p = ladeJsonStreng<unknown>(url, pruefeFelder(url, {})).then(auswerten);
      p.catch(() => { if (gecacht === p) gecacht = null; });
      gecacht = p;
    }
    return gecacht;
  };
}

const kantonSystematikStreng = sidecarStreng<Record<string, KantonSystematik>>(
  '/normtext/kanton-systematik.json',
  (roh) => roh as Record<string, KantonSystematik>,
);

/** Lädt die Kanton-Systematik einmal (gecacht). Ein Fehlschlag liefert `{}`, wird
 *  aber NICHT gecacht: der nächste Aufruf versucht neu (BG-02-Muster). */
export async function ladeKantonSystematik(): Promise<Record<string, KantonSystematik>> {
  try {
    return await kantonSystematikStreng();
  } catch {
    return {};
  }
}

// ── Kanton-Lücken-Sidecar (§8-Nachzug, Auflage PR #614) — bewusst ausgelassene
// Teile eines kantonalen Erlasses (Anhänge, Übergangs-/Schlussbestimmungen),
// die der §-Parser NICHT erfasst (`public/normtext/kanton-luecken.json`,
// erzeugt von `scripts/normtext-snapshot.ts`). Nur Kantone — der Bund trägt
// keine Einträge; kein Zusatz-Fetch dort (§15, Aufrufer prüft `daten==='kanton'`).
export interface KantonLueckeEintrag {
  quelleUrl: string;
  erlass: string;
  /** Klartext-Sätze aus dem Generator — unverändert, nichts umformuliert (§8). */
  hinweise: string[];
}
export type KantonLueckenMap = Record<string, KantonLueckeEintrag>;

/** Lädt kanton-luecken.json einmal (gecacht). WIRFT bei jedem Ladefehler (s.
 *  `sidecarStreng`); eine Datei ohne Einträge ist `{}` (kein Hinweis, gültig). */
export const ladeKantonLuecken = sidecarStreng<KantonLueckenMap>(
  '/normtext/kanton-luecken.json',
  (roh) => (roh as { erlasse?: KantonLueckenMap }).erlasse ?? {},
);

// ── Currency-Sidecar (P1-d): geltend-geprüft-Datum + angekündigte Fassung ────
/** Ein Currency-Eintrag je Erlass-Key (public/normtext/currency.json). */
export interface CurrencyEintrag {
  /** Laufdatum des letzten maschinellen Fedlex-Currency-Abgleichs (ISO). */
  geprueftAm: string;
  /** Falls Fedlex eine künftige Konsolidierung angekündigt hat (ISO). */
  naechsteFassungAb?: string;
}
export type CurrencyMap = Record<string, CurrencyEintrag>;

/** Lädt currency.json einmal (gecacht). WIRFT bei jedem Ladefehler (s.
 *  `sidecarStreng`) — «Fassungsangaben fehlen» ist nicht «es gibt keine». */
export const ladeCurrency = sidecarStreng<CurrencyMap>('/normtext/currency.json', (roh) => roh as CurrencyMap);

/** Das Register, STRENG: wirft bei jedem Ladefehler (Netz, 5xx, 404, Parse).
 *  W2·17-UI-BEFUNDE PA-3-B02: ein gescheiterter Abruf wird NICHT gecacht — der
 *  Cache-Eintrag fällt, der nächste Zugriff holt neu (wie `ladeErlassDatei`,
 *  O-1.7). Vorher hielt `manifestPromise` das `null` bis zum Neuladen des Tabs,
 *  und jede Erlass-Adresse hiess danach «nicht im Bestand». Das Register selbst
 *  zu vermissen (404) ist kein «nicht vorhanden» im Sinne einer Auskunft über
 *  einen Erlass, sondern eine kaputte Auslieferung — ebenfalls Ladefehler. */
function ladeBrowseManifestStreng(): Promise<BrowseManifest> {
  if (!manifestPromise) {
    const p = ladeJsonStreng<BrowseManifest>('/normtext/register.json', MANIFEST_PRUEFER);
    p.catch(() => {
      if (manifestPromise === p) manifestPromise = null;
    });
    manifestPromise = p;
  }
  return manifestPromise;
}

/** Das Register oder `null`, wenn es nicht geladen werden konnte. `null` heisst
 *  hier NUR «kein Register da» — wer zwischen «Erlass nicht im Register» und
 *  «Register nicht erreichbar» unterscheiden muss, nimmt `ladeErlassStreng`. */
export async function ladeBrowseManifest(): Promise<BrowseManifest | null> {
  try {
    return await ladeBrowseManifestStreng();
  } catch {
    return null;
  }
}

/** Findet den Erlass-Eintrag eines Schlüssels (key) im Register: `null` = der
 *  Schlüssel steht NICHT im Register (gültige Auskunft); WIRFT, wenn das
 *  Register nicht geladen werden konnte (Ladefehler, PA-3-B01). */
export async function ladeErlassStreng(key: string): Promise<BrowseErlass | null> {
  const m = await ladeBrowseManifestStreng();
  return m.erlasse.find((e) => e.key === key) ?? null;
}

/** Wie `ladeErlassStreng`, aber ohne Unterscheidung: `null` auch bei Ladefehler. */
export async function ladeErlass(key: string): Promise<BrowseErlass | null> {
  try {
    return await ladeErlassStreng(key);
  } catch {
    return null;
  }
}

// ── Volltext-Datei eines Erlasses (lazy, gecacht) ────────────────────────────
const dateiCache = new Map<string, Promise<NormSnapshotDatei | null>>();

/** Lädt die Snapshot-Datei eines Erlasses (BrowseErlass.datei, z.B. 'bund/OR.json'),
 *  STRENG: `null` = die Datei existiert nicht (echte 404, bleibt als null
 *  gecacht); WIRFT bei jedem anderen Fehler (5xx/Netz/Parse) — W2·17-UI-BEFUNDE
 *  PA-3-B01: der Leser behauptete bei einem Funkloch «nicht im Bestand».
 *  Transiente Fehler werden NICHT gecacht (O-1.7): der Cache-Eintrag wird bei
 *  Fehlschlag verworfen, der nächste Zugriff versucht neu. */
export function ladeErlassDateiStreng(datei: string): Promise<NormSnapshotDatei | null> {
  let p = dateiCache.get(datei);
  if (!p) {
    const url = normtextDateiUrl(datei);
    p = ladeJson<NormSnapshotDatei>(url, DATEI_PRUEFER);
    p.catch(() => {
      if (dateiCache.get(datei) === p) dateiCache.delete(datei);
    });
    dateiCache.set(datei, p);
  }
  return p;
}

/** Wie `ladeErlassDateiStreng`, aber ohne Unterscheidung: `null` auch bei
 *  Ladefehler (O-1.7: der Fehler wird dennoch nicht gecacht). */
export function ladeErlassDatei(datei: string): Promise<NormSnapshotDatei | null> {
  return ladeErlassDateiStreng(datei).then((x) => x, () => null);
}

// ── Gruppieren / Filtern (rein, testbar) ─────────────────────────────────────
export interface KantonGruppe { kanton: string; erlasse: BrowseErlass[] }

/** Kanton-Erlasse nach Kantonskürzel (alphabetisch). */
export function gruppiereNachKanton(erlasse: BrowseErlass[]): KantonGruppe[] {
  const map = new Map<string, BrowseErlass[]>();
  for (const e of erlasse) {
    const k = e.kanton ?? '?';
    const liste = map.get(k);
    if (liste) liste.push(e);
    else map.set(k, [e]);
  }
  return [...map.keys()].sort().map((k) => ({ kanton: k, erlasse: map.get(k)! }));
}

/** Volltext-Filter über Kürzel/Titel/SR/Kanton. Leerer Term → alles. */
export function filtern(erlasse: BrowseErlass[], term: string): BrowseErlass[] {
  const s = term.trim().toLowerCase();
  if (!s) return erlasse;
  return erlasse.filter((e) =>
    e.kuerzel.toLowerCase().includes(s)
    || e.titel.toLowerCase().includes(s)
    || (e.sr ?? '').toLowerCase().includes(s)
    || (e.kanton ?? '').toLowerCase().includes(s));
}

// ── Amtliche Gliederung + Marginalien (Struktur-Sidecar, Rubrik V Richtung A) ──
export interface FnLink {
  label: string;
  url: string;
  /** A42: interner Reader-Verweis, wenn wir den zitierten Erlass im Volltext
   *  halten (vom Kanton-Generator aufgelöst). Fehlt er, ist `url` der amtliche
   *  Fallback (§8). Bund-Fussnoten tragen ihn nicht (dort löst der SR-Label-
   *  Resolver zur Laufzeit auf) → Bund-Rendering unverändert. */
  intern?: { ebene: 'bund' | 'kanton'; key: string };
  /** G-REF: SR-Nummer eines amtlich verlinkten SR-Verweises (Zielidentität).
   *  `url` ist dann der amtliche ELI-Deep-Link (eli/cc) zum Ziel-Erlass. Der
   *  Reader nutzt `rs` als robuste SR-Erkennung (statt nur das Label zu parsen)
   *  und fällt sonst auf den amtlichen ELI-Link (§8) zurück. */
  rs?: string;
}
export interface Fussnote {
  nr: string; text: string; links: FnLink[];
  absatz?: string | null; item?: string | null;
  /** G11: Label der Überschrift/des Randtitels, zu der/dem diese section-heading-
   *  Fussnote gehört (Marker am Sektions-/Randtitel-Kopf statt auf Artikelebene). */
  sektion?: string;
  /** A31a: 0-basierter Index in `bloecke` für einen Marker in einem ABSATZLOSEN
   *  Fliesstext-Absatz (fn 667 in ZGB 798a) — `absatz`/`item` reichen dort nicht,
   *  weil mehrere absatzlose Blöcke alle absatz=null tragen. Marker rendert am
   *  Ende dieses Blocks statt auf der Artikelebene. */
  absatzIndex?: number;
  /** FN-5/M14: wortgenaue Marker-Position — `b` = Block-Index in `bloecke`,
   *  optional `it` = Item-Index, `o` = Zeichen-Offset im finalen Text, `l` =
   *  Textlänge zur Generationszeit (Drift-Riegel: bei Längen-Mismatch verwirft
   *  der Reader den Offset). Nur vom Generator gesetzt, wenn die Position
   *  zeichengenau bewiesen ist (fussnoten-offsets.ts); fehlt `pos`, rendert
   *  der Marker wie bisher am Absatz-/Item-Ende. */
  pos?: { b: number; it?: number; o: number; l: number };
  /** W2·5i-HIST-ANSICHT: build-seitig berechnete Fussnoten-KLASSE (H0-Auflage 3 —
   *  EINMAL im Generator, `scripts/normtext/fussnoten-klassifikation.ts`, nie zur
   *  Laufzeit). `A` = reine Änderungshistorie (die EINZIGE Klasse, welche die
   *  Ansicht «Änderungshistorie: aus» dämpfen darf, H0-Auflage 1) · `V` = Verweis/
   *  Substanz · `G` = Grauzone (Revisionsvermerk MIT Leser-Redirect) · `Z` = reiner
   *  Publikationsnachweis · `U` = unklar.
   *
   *  FEHLT das Feld (alle Kanton-Sidecars — dort sind nur 11 % der Fussnoten
   *  Historie, der Nutzen des Umschalters liegt auf der Bund-Fläche), gilt die
   *  Fussnote als unklassifiziert und bleibt in JEDER Ansicht sichtbar. Das ist
   *  die konservative Richtung (§8): eine fehlende Klasse blendet nie etwas aus. */
  kl?: 'A' | 'V' | 'G' | 'Z' | 'U';
}
export interface ArtikelStruktur {
  /** EID-1 (W2·5d §12): optionale Fedlex-Container-eId je Ebene — reine, bei jeder
   *  Regeneration neu erzeugte Outbound-Daten (ELI-Deep-Link `quelleUrl#<eId>`),
   *  NIE eigene persistente Anker (§12.1/§12.4, K2/R8). */
  gliederung: Array<{ ebene: number; label: string; eId?: string }>;
  marginalie: string[];
  /** Amtliche Fussnoten (Änderungs-/AS/BBl-Historie), falls vorhanden. */
  fussnoten?: Fussnote[];
}
export type StrukturMap = Record<string, ArtikelStruktur>;

/** M5: Erlass-Kopf (Vorspann VOR dem ersten Artikel) — SR-Nr, amtlicher Titel,
 *  Erlassdatum, Ingress/Erlassformel bzw. materielle Präambel + Kopf-Fussnoten.
 *  Spiegelt das Schema aus scripts/normtext/kopf-extrahiere.ts (Sidecar). */
export interface KopfZeile { rolle: 'autor' | 'ingress' | 'praeambel' | 'verb'; text: string; fnNrs?: string[] }
export interface ErlassKopf {
  srNummer?: string;
  titel?: string;
  erlassdatum?: string;
  praeambelTitel?: string;
  praeambel?: KopfZeile[];
  fussnoten?: Fussnote[];
}

/** Bezüge-Zähler je Artikel-Token: `[Entscheide, Materialien]`.
 *  W2·26-FUNKTIONSZEILE-ZAEHLER — buildseitig von `scripts/gen-bezuege-zaehler.ts`
 *  in DIESES Sidecar geschrieben, damit die Funktionszeile am Artikelende ihre
 *  Zahlen ohne eigenen Fetch und ohne zweite Render-Runde hat. Herleitung und
 *  die Wahl gerade dieser Datei stehen im Kopf des Generators. */
export type ZaehlBlock = Record<string, [entscheide: number, materialien: number]>;

interface StrukturDoc { artikel?: StrukturMap; kopf?: ErlassKopf; zaehler?: ZaehlBlock }
const strukturCache = new Map<string, Promise<StrukturDoc | null>>();

/** Lädt das Struktur-Sidecar-Dokument (Gliederung/Marginalien + Erlass-Kopf), lazy/gecacht,
 *  STRENG: `null` = echte 404 (bleibt gecacht); WIRFT bei Netz-/5xx-/Parse-Fehler
 *  und verwirft den Cache-Eintrag (O-1.7: der nächste Zugriff holt neu). */
function ladeStrukturDocStreng(ebene: string, key: string): Promise<StrukturDoc | null> {
  const url = normtextDateiUrl(`struktur/${ebene}/${key}.json`);
  let p = strukturCache.get(url);
  if (!p) {
    // `vite preview`/`vite dev` beantworten eine FEHLENDE Datei mit der index.html
    // (SPA-Fallback, 200, text/html) statt mit 404 (Prod: echter 404). Das ist
    // «Datei fehlt» wie ein 404 — nicht «Ausfall» (BG-04-Nachzug, Gegenprüfung
    // PR #1282: falsche Ausfallzeile bei PRHG/DSGVO/NYUE lokal). Mocks ohne
    // Header-Objekt gelten als JSON.
    p = ladeJson<StrukturDoc>(url, STRUKTUR_PRUEFER, { alsFehlend: IST_HTML });
    p.catch(() => {
      if (strukturCache.get(url) === p) strukturCache.delete(url);
    });
    strukturCache.set(url, p);
  }
  return p;
}

/** Wie `ladeStrukturDocStreng`, aber `null` auch bei Ladefehler (Gliederung/Kopf
 *  fehlen dann sichtbar; nichts wird gecacht). */
function ladeStrukturDoc(ebene: string, key: string): Promise<StrukturDoc | null> {
  return ladeStrukturDocStreng(ebene, key).then((x) => x, () => null);
}

/** Lädt die Struktur-Sidecar (Gliederung+Marginalien je Artikel-Token), lazy/gecacht. */
export function ladeStruktur(ebene: string, key: string): Promise<StrukturMap | null> {
  return ladeStrukturDoc(ebene, key).then((d) => d?.artikel ?? null);
}

/** Gliederung UND Erlass-Kopf (M5) aus demselben Sidecar (geteilter Cache, ein
 *  Fetch) — STRENG (W2·17-UI-BEFUNDE BG-04, 2.10.2026): `null` je Teil = das
 *  Sidecar fehlt (404) bzw. trägt den Teil nicht (gültige Auskunft); WIRFT bei
 *  Netz-/5xx-/Parse-Fehler, damit der Leser den Ausfall ausweisen und neu laden
 *  kann statt Gliederung und Überschriften still verschwinden zu lassen. Der
 *  Erlass-Kopf, vorher als eigene Funktion `ladeErlassKopf` (null bei Fehler),
 *  hat keinen anderen Verbraucher. */
export function ladeStrukturDokumentStreng(ebene: string, key: string): Promise<{ artikel: StrukturMap | null; kopf: ErlassKopf | null }> {
  return ladeStrukturDocStreng(ebene, key).then((d) => ({ artikel: d?.artikel ?? null, kopf: d?.kopf ?? null }));
}

/** Lädt die Bezüge-Zähler aus demselben Sidecar (geteilter Cache, KEIN eigener
 *  Fetch — genau das ist der Punkt von W2·26-FUNKTIONSZEILE-ZAEHLER).
 *  STRENG (W2·17-UI-BEFUNDE PE-E7-B02): `null` = kein Sidecar bzw. keine Zähler
 *  (gültige Auskunft); WIRFT bei Netz-/5xx-Fehler, damit der Aufrufer den
 *  Ladefehler nicht mit «keine Zähler» verwechselt und neu laden kann. */
export function ladeBezuegeZaehler(ebene: string, key: string): Promise<ZaehlBlock | null> {
  return ladeStrukturDocStreng(ebene, key).then((d) => d?.zaehler ?? null);
}

/** Ein Knoten der amtlichen Gliederung (Teil → Titel → Abschnitt …). */
export interface Sektion {
  id: string;
  ebene: number;
  label: string;
  kinder: Sektion[];
  artikel: NormSnapshot[];
  /** true, wenn der Knoten aus einer Randtitel-/Buchstaben-Ebene (Marginalie)
   *  promotet wurde — nicht aus der amtlichen Teil/Titel/Abschnitt-Gliederung
   *  (Auftrag 6b). Steuert die ruhigere, eingerückte Darstellung im Reader. */
  randtitel?: boolean;
  /** G11: Fussnoten-Marker, die an DIESER Überschrift hängen (section-heading-
   *  footnote) — `artikel`+`nr` zeigen aufs Fussnoten-Ziel im Trägerartikel. */
  fussnoten?: Array<{ artikel: string; nr: string }>;
  /** EID-2 (W2·5d §12): Fedlex-Container-eId dieser amtlichen Gliederungsstufe
   *  (aus dem EID-1-Sidecar `gliederung[].eId` durchgereicht) — reines OUTBOUND-
   *  Ziel für den Verifizier-Deep-Link `quelleUrl#<eId>`, NIE ein eigener Anker
   *  (§12.1/§12.4; die Sektion-`id` bleibt das ephemere `sek-N`). Randtitel-
   *  promotete Knoten und Alt-Sidecars tragen keine (§7: nichts fabrizieren). */
  eId?: string;
}

/**
 * Baut aus den Artikeln + ihrer Gliederung einen Sektions-Baum. Artikel ohne
 * amtliche Gliederung UND ohne geteilte Randtitel-Gruppierungen landen in
 * `ohneGliederung` (flach). Reine Darstellungs-Vorstufe (§3).
 *
 * 6b (Auftrag David 26.6.2026): Die Randtitel-/Buchstaben-Ebenen («A. … → II. …»)
 * werden — analog Fedlex — als zusätzliche, einklappbare Knoten UNTER die amtliche
 * Gliederung promotet. Nur die von mehreren Artikeln GETEILTEN Ahnen-Stufen werden
 * Knoten (randtitelKnoten.ahnen); die artikel-eigene Sachüberschrift (blatt) bleibt
 * die Überschrift des Artikels selbst. Die Ebene der promoteten Knoten setzt direkt
 * unter der tiefsten amtlichen Gliederungsstufe an, sodass sie sich darunter
 * einreihen (und der Reader sie kleiner/eingerückt darstellt). Rein abgeleitet zur
 * Laufzeit — die struktur-Sidecars bleiben unangetastet (§7).
 */
export function baueGliederungsbaum(
  eintraege: NormSnapshot[],
  struktur: StrukturMap | null,
): { sektionen: Sektion[]; ohneGliederung: NormSnapshot[] } {
  const sektionen: Sektion[] = [];
  const ohneGliederung: NormSnapshot[] = [];
  let nr = 0;

  for (const e of eintraege) {
    const st = struktur?.[e.artikel];
    const gliederung = st?.gliederung ?? [];
    const { ahnen } = randtitelKnoten(st?.marginalie ?? []);
    // G11: section-heading-Fussnoten dieses (Träger-)Artikels je Überschrift-Label.
    const sektFn = (st?.fussnoten ?? []).filter((f) => f.sektion && f.nr);
    // Promotete Randtitel-Knoten reihen sich direkt unter der tiefsten amtlichen
    // Gliederungsstufe ein. Ohne amtliche Gliederung beginnen sie bei 0 (dann
    // tragen sie selbst die Haupt-Hierarchie, z. B. kantonale Erlasse).
    const basis = gliederung.length ? Math.max(...gliederung.map((g) => g.ebene)) + 1 : 0;
    // EID-2: die Container-eId der amtlichen Stufen mitführen (Randtitel-Knoten
    // sind keine Fedlex-Container und bleiben eId-frei).
    const pfad: Array<{ ebene: number; label: string; randtitel: boolean; eId?: string }> = [
      ...gliederung.map((g) => ({ ebene: g.ebene, label: g.label, randtitel: false, eId: g.eId })),
      ...ahnen.map((label, i) => ({ ebene: basis + i, label, randtitel: true })),
    ];
    if (pfad.length === 0) { ohneGliederung.push(e); continue; }
    let ebeneListe = sektionen;
    let knoten: Sektion | null = null;
    for (const stufe of pfad) {
      let treffer = ebeneListe[ebeneListe.length - 1];
      // Gleicher Knoten nur, wenn er der letzte auf dieser Ebene ist UND Label
      // passt (Gliederung ist dokumentlinear, daher genügt der letzte).
      if (!treffer || treffer.label !== stufe.label || treffer.ebene !== stufe.ebene) {
        treffer = { id: `sek-${nr++}`, ebene: stufe.ebene, label: stufe.label, kinder: [], artikel: [], randtitel: stufe.randtitel };
        ebeneListe.push(treffer);
      }
      // EID-2: erste vorhandene Sidecar-eId am Knoten festhalten (dokumentlinear
      // tragen alle Artikel derselben Stufe dieselbe eId; nie überschreiben).
      if (stufe.eId && !treffer.eId) treffer.eId = stufe.eId;
      // G11: Marker für section-heading-Fussnoten, deren Label diese Stufe trifft,
      // an den Knoten heften (Träger = der aktuelle, erste Artikel darunter).
      const treffFn = sektFn.filter((f) => f.sektion === stufe.label);
      if (treffFn.length) {
        treffer.fussnoten = [...(treffer.fussnoten ?? []), ...treffFn.map((f) => ({ artikel: e.artikel, nr: f.nr }))];
      }
      knoten = treffer;
      ebeneListe = treffer.kinder;
    }
    knoten?.artikel.push(e);
  }
  return { sektionen, ohneGliederung };
}
