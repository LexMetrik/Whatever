/**
 * Browse-Manifest-Generator (Rubrik V «Gesetze»): scannt
 * public/normtext/{bund,kanton}/*.json, joint sie mit dem ERLASS_REGISTER und
 * schreibt das deterministisch sortierte public/normtext/register.json.
 *
 * §5 SSoT: Identität/Taxonomie kommt aus dem Register; ableitbare Felder
 * (Artikelzahl, Stand, quelleUrl, fassungsToken) aus den Snapshots — NIE doppelt
 * gepflegt. §2: kein Date.now() in der Logik (erzeugt-Datum kommt via Argument).
 * §6: schreibt NUR register.json, nie in bund/ oder kanton/ (Golden unberührt).
 *
 * Bund: jeder Snapshot MUSS einen Register-Eintrag haben (sonst Fehler → Tor).
 * Kanton: Kürzel/Titel/SR/Sprache werden aus Snapshot + Dateiname abgeleitet,
 * das Rechtsgebiet aus dem Register (kantonGebiet, Default öffentlich).
 *
 * Aufruf: npx vite-node scripts/normtext/browse-manifest.ts -- --datum=YYYY-MM-DD
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { NormSnapshotDatei } from '../../src/lib/normtext/typen.ts';
import type { BrowseErlass, BrowseManifest, SachgebietKanton } from '../../src/lib/normtext/browse-typen.ts';
import {
  ERLASS_REGISTER, GEBIET_RANG, kantonGebiet,
  type ErlassRegistereintrag, type Sprache,
} from '../../src/lib/normtext/register.ts';

const NORMTEXT_DIR = 'public/normtext';

/** U-PDF/A12: amtliche PDF-URLs je Snapshot-Key (aus pdf-quellen.json, §5-Projektion). */
type PdfQuelle = { url: string; stand: string; quelle: string };
function ladePdfQuellen(basis: string): Record<string, PdfQuelle> {
  try {
    return JSON.parse(readFileSync(join(basis, 'pdf-quellen.json'), 'utf8')) as Record<string, PdfQuelle>;
  } catch {
    return {};
  }
}

/** V2/K-1: Ur-Inkrafttreten je Snapshot-Key (aus inkrafttreten.json, §5-Projektion). */
type InkraftQuelle = { datum?: string; quelle: string; gestaffelt?: boolean };
function ladeInkrafttreten(basis: string): Record<string, InkraftQuelle> {
  try {
    return JSON.parse(readFileSync(join(basis, 'inkrafttreten.json'), 'utf8')) as Record<string, InkraftQuelle>;
  } catch {
    return {};
  }
}

// ─── N0b: Join Snapshot-key → amtlicher kantonaler Systematik-Baum ──────────
//
// Die Systematik-Nummer steckt bereits im Snapshot-key ('AR-146.1' → '146.1');
// `kanton-systematik.json` führt je Kanton einen `index`, der eine Nummer auf
// ihren Pfad `[wurzel, unter]` abbildet. Der Join ist damit reines Nachschlagen
// — es wird KEIN Baum zweitgebaut und keine Zuordnung geraten (§2/§5).
//
// LÄNGSTER PRÄFIX, und zwar auf der GANZZAHL vor dem ersten Punkt. '146.1' steht
// nicht im Index, '146' schon → ['1','14']. Die Kürzung läuft nur über die
// führende Ganzzahl, weil genau sie die Hierarchie trägt (1 → 14 → 146); ein
// Präfix über den Punkt hinweg ('146.1' → '146.') wäre keine Gliederungsstufe.
//
// STRIKT ZIFFERNHIERARCHISCH, sonst kein Feld. Glarus ordnet römisch
// ('GL-III-C.1', 'GL-III B/7/1'); ein Ziffern-Filter darüber ergäbe '1' bzw.
// '71' und damit eine FALSCHE Wurzel — ein stiller Fehlgriff wäre schlimmer als
// die fehlende Angabe (§7/§8). Gemessen 31.8.2026: 5 GL-Erlasse bleiben so
// ehrlich ohne Feld.
//
// GEMEINDE-PRÄFIX zuerst: Basel-Stadt führt Bettingen/Riehen als eigene
// Teilsammlungen ('BS-BeE 786.100'), und 'BeE' IST der Wurzelknoten. Er wird vor
// der Ziffern-Kürzung probiert, sonst zöge '786' eine kantonale Wurzel, die für
// einen Gemeindeerlass nicht gilt.
type SystematikBaum = {
  roots: { nummer: string; name: string; kinder?: { nummer: string; name: string }[] }[];
  index: Record<string, [string, string]>;
};
function ladeSystematik(basis: string): Record<string, SystematikBaum> {
  try {
    return JSON.parse(readFileSync(join(basis, 'kanton-systematik.json'), 'utf8')) as Record<string, SystematikBaum>;
  } catch {
    return {};
  }
}

/** Sprach-Suffix kantonaler Zweisprachen-Keys ('FR-130.11-de'). Es gehört zur
 *  Datei-Identität, nicht zur Systematik-Nummer, und muss vor dem Join weg. */
const SPRACH_SUFFIX = /-(?:de|fr|it|rm)$/;

export function sachgebietKantonFuer(
  baum: SystematikBaum | undefined,
  kanton: string,
  stamm: string,
): SachgebietKanton | undefined {
  if (!baum) return undefined;
  const nummer = decodeURIComponent(stamm.slice(kanton.length + 1)).replace(SPRACH_SUFFIX, '').trim();

  const benenne = (top: string, sub: string): SachgebietKanton | undefined => {
    const wurzel = baum.roots.find((r) => r.nummer === top);
    if (!wurzel) return undefined;                       // Index ohne Wurzel = defekter Baum
    const unter = sub ? wurzel.kinder?.find((k) => k.nummer === sub) : undefined;
    return {
      wurzel: { nummer: wurzel.nummer, name: wurzel.name },
      ...(unter ? { unter: { nummer: unter.nummer, name: unter.name } } : {}),
    };
  };

  // (1) Gemeinde-Teilsammlung ('BeE 786.100'). Diese Wurzeln stehen in `roots`,
  //     aber NICHT im `index` (der führt nur die kantonalen Ziffern-Knoten) —
  //     darum hier direkt gegen den Baum, nicht gegen die Index-Tabelle. Ihre
  //     Unterknoten tragen den Präfix mit ('BeE 7'), die Kürzung läuft also über
  //     'BeE ' + führende Ganzzahl.
  const gem = nummer.match(/^([A-Za-z]+)\s+([0-9]+)/);
  if (gem) {
    const wurzel = baum.roots.find((r) => r.nummer === gem[1]);
    if (!wurzel) return undefined;
    for (let l = gem[2].length; l >= 1; l--) {
      const unter = wurzel.kinder?.find((k) => k.nummer === `${gem[1]} ${gem[2].slice(0, l)}`);
      if (unter) {
        return {
          wurzel: { nummer: wurzel.nummer, name: wurzel.name },
          unter: { nummer: unter.nummer, name: unter.name },
        };
      }
    }
    return { wurzel: { nummer: wurzel.nummer, name: wurzel.name } };
  }

  // (2) Ziffernhierarchische Nummer.
  if (!/^[0-9]+(\.[0-9]+)*$/.test(nummer)) return undefined;
  const ganz = nummer.split('.')[0];

  // (2a) DIREKTER Treffer — der Index führt genau diese Nummer. Er ist die
  //      amtliche Zuordnung des Kantons und wird unbesehen übernommen (§5):
  //      der Pfad eines Blattes zeigt auf seine VORFAHREN ('842' → ['8','84']),
  //      der Schlüssel ist also normalerweise NICHT gleich dem Knoten.
  if (baum.index[ganz]) return benenne(baum.index[ganz][0], baum.index[ganz][1]);

  // (2b) GEKÜRZTER Treffer — hier fragt der Code etwas, was der Index nie
  //      behauptet hat, und muss die Antwort deshalb prüfen. Zulässig ist sie
  //      nur, wenn der zurückgegebene Pfad zum angefragten Schlüssel PASST:
  //      beide Stufen müssen Präfixe von ihm sein ('66' → ['6','66'] ✓).
  //
  //      WAS DAS ABFÄNGT — gemessen 31.8.2026, nicht vermutet: Luzern gliedert
  //      in 'Band 1…9' mit Buchstaben-Unterstufen, und sein Index trägt als
  //      Ziffern-Schlüssel ORDINALZAHLEN, keine Systematik-Nummern. Ohne diese
  //      Prüfung kürzte 'LU-258' auf '2' und landete auf ['Band 1','E'] —
  //      fünf lautlose Fehleinordnungen, die im UI amtlich ausgesehen hätten.
  //      Mit ihr trägt LU kein Feld: die richtige Antwort, solange sein Index
  //      keine Erlass-Nummern kennt (§7/§8).
  for (let l = ganz.length - 1; l >= 1; l--) {
    const k = ganz.slice(0, l);
    const treffer = baum.index[k];
    if (!treffer) continue;
    const passt = k.startsWith(treffer[0]) && (!treffer[1] || k.startsWith(treffer[1]));
    return passt ? benenne(treffer[0], treffer[1]) : undefined;   // erster Treffer entscheidet
  }

  // (2c) BAND-ZWEIG (ZH, N0b-Nachtrag 1.9.2026, LU-Klasse — eine defensive
  //      Zusatzprüfung wie (2b), kein Rateweg): ZH hat keine clex-Systematik
  //      mit sparsamen Knoten-Nummern, sondern 14 ORDNER-BÄNDER (Nummernband
  //      '101'–'176' → Ordner '1', …, s. zh-systematik.ts). Ihr Index ist
  //      darum dicht auf jede Hauptnummer ('LS#101' … 'LS#954') vorgerechnet,
  //      und zwar unter dem Namensraum 'LS#' — demselben, den
  //      `systematikSchluessel()` (src/lib/normtext/systematik.ts) aus dem
  //      Register-Feld `sr` ('LS 131.1') für den GLEICHEN Baum ableitet (§5
  //      SSoT: ein Baum, zwei Konsumenten). Der Snapshot-`stamm` ('ZH-131.1')
  //      trägt dieses 'LS'-Präfix nie, darum griffen (2a)/(2b) für ZH bisher
  //      NIE (Befund 1.9.2026: 0/24). Reiner Zusatz-Zweig, additiv — ändert
  //      nichts an (1)/(2a)/(2b) und damit nichts am Verhalten anderer
  //      Kantone; die Hauptnummer ist bei ZH immer dreistellig, ein direkter
  //      Treffer genügt (keine Kürzungs-Schleife nötig).
  if (kanton === 'ZH') {
    const treffer = baum.index[`LS#${ganz}`];
    if (treffer) return benenne(treffer[0], treffer[1]);
  }
  return undefined;
}

function jsonDateien(verzeichnis: string): string[] {
  return readdirSync(verzeichnis)
    .filter((f) => f.endsWith('.json') && f !== 'index.json' && f !== 'register.json')
    .sort();
}

function ladeDatei(pfad: string): NormSnapshotDatei | null {
  try {
    const d = JSON.parse(readFileSync(pfad, 'utf8')) as NormSnapshotDatei;
    return Array.isArray(d.eintraege) ? d : null;
  } catch {
    return null;
  }
}

/** Spätestes Stand-Datum der Einträge (ISO-Strings lexikographisch vergleichbar). */
function spaetesterStand(datei: NormSnapshotDatei): string {
  return datei.eintraege.reduce((max, e) => (e.stand > max ? e.stand : max), datei.eintraege[0]?.stand ?? '');
}

/** Sprache aus dem Datei-Stamm-Suffix ('-de'|'-fr'|'-it'), Default 'de'. */
export function spracheAusStamm(stamm: string): Sprache {
  if (stamm.endsWith('-fr')) return 'fr';
  if (stamm.endsWith('-it')) return 'it';
  return 'de';
}

// T2/S2 (BS-Audit 23.6.2026) — Erlassform-Endungen, die einen Mehrwort-/lowercase-
// Tail als ECHTES Kürzel ausweisen («ad personam-Verordnung», «Registratur- und
// Archivierungsverordnung», «Abfallvereinbarung BS - BL»). Endet ein Tail-Wort auf
// eine dieser Formen, ist es kein Satzfragment, sondern ein Kurztitel.
const KUERZEL_FORM_RE =
  /(gesetz|verordnung|reglement|ordnung|vertrag|vereinbarung|übereinkommen|uebereinkommen|konkordat|abkommen|statut|verfassung|beschluss|dekret|weisung|richtlinie|tarif|programm|prämie|preis|fonds|verbund|gelübde|gesetzessammlung)$/i;

/**
 * T2/S2 — Ist der Teil NACH dem letzten Komma ein Satzfragment statt eines
 * Kürzels/Kurztitels? Der naive Last-Comma-Split machte aus «Vertrag …, b) den
 * Betrieb der Hafenbahn …» einen mid-sentence-Fragment-Titel (H1/Breadcrumb/Tab
 * kaputt). Konservativ: nur klar fragmentartige Tails ablehnen; die ~318 echten
 * Komma-Kürzel (StG, EnG, AVO Inland, EG StPO, Abfallvereinbarung BS - BL, …)
 * bleiben unberührt (kein Regress des Vorzustands).
 *
 * Fragment, wenn:
 *  (a) Aufzählungs-Buchstabe «x) …» (BS-954.420 «b) den Betrieb …»);
 *  (b) klein-beginnend OHNE Erlassform-Wort («betreffend …», «über die …»,
 *      «nachstehend …», «abgeschlossen …», «handelnd …») — «ad personam-
 *      Verordnung» wird durch die Form-Ausnahme gerettet;
 *  (c) GROSSGESCHRIEBENES Mehrwort-Fragment: ≥3 Wörter, keine Erlassform-Endung,
 *      und (≥4 Wörter ODER kein Akronym) — deckt BS-955.700/952.820/428.100
 *      («Basel-Landschaft und Aargau …», «… über die Fachhochschule … (FHNW)»)
 *      sowie kurze Listen-Fragmente «Basel-Landschaft und Aargau» ab, ohne kurze
 *      akronym-dominierte Kürzel («VO EG BGS», «NAV Haushalt BS») zu treffen.
 */
export function istKuerzelFragment(tail: string): boolean {
  const t = tail.trim();
  if (!t) return false;
  const hatForm = t.split(/\s+/).some((w) => KUERZEL_FORM_RE.test(w));
  if (/^[A-Za-zÄÖÜäöü]\)\s/.test(t)) return true;
  if (/^[a-zäöü]/.test(t) && !hatForm) return true;
  const woerter = t.split(/\s+/);
  if (woerter.length >= 3 && !hatForm) {
    const hatAkronym = woerter.some((w) => /[A-ZÄÖÜ]{2,}/.test(w));
    if (woerter.length >= 4 || !hatAkronym) return true;
  }
  return false;
}

/** Kürzel + Titel + SR aus dem Snapshot-erlass-Feld (z.B. 'Verfahrenskostendekret, VKD (BSG 161.12)'). */
export function identitaetAusErlass(erlass: string): { kuerzel: string; titel: string; sr: string | null } {
  const klammer = erlass.match(/\(([^)]*)\)\s*$/);
  const sr = klammer ? klammer[1].trim() : null;
  const vor = erlass.replace(/\s*\([^)]*\)\s*$/, '').trim();
  if (vor.includes(',')) {
    const idx = vor.lastIndexOf(',');
    const kuerzel = vor.slice(idx + 1).trim();
    const titel = vor.slice(0, idx).trim();
    // T2/S2: Last-Comma-Split nur akzeptieren, wenn der Tail kürzel-typisch ist.
    // Ist er ein Satzfragment, ist der ganze (klammerlose) String Kürzel UND Titel —
    // der Reader-Kopf zeigt dann den vollen Erlassnamen statt eines Fragmentsatzes.
    if (kuerzel && titel && !istKuerzelFragment(kuerzel)) {
      return { kuerzel, titel, sr };
    }
    return { kuerzel: vor, titel: vor, sr };
  }
  // Kein Komma: das Kürzel steht allein vor der Klammer; voller String als Titel
  // (sonst wäre Titel == Kürzel und nichtssagend).
  return { kuerzel: vor, titel: erlass.trim(), sr };
}

function ohneAnker(url: string): string {
  return url.split('#')[0];
}

/** U-PDF/A12: amtliches-PDF-Felder aus dem Sidecar (§8: nur wenn vorhanden). */
function pdfFelder(pq: PdfQuelle | undefined): { pdfUrl?: string; pdfStand?: string } {
  return pq ? { pdfUrl: pq.url, pdfStand: pq.stand } : {};
}

/** V2/K-1: «in Kraft seit»-Feld aus dem Sidecar (§8: nur wenn vorhanden = Bund). */
function inkraftFelder(iq: InkraftQuelle | undefined): { inkraftSeit?: string; inkraftGestaffelt?: boolean } {
  return {
    ...(iq?.datum ? { inkraftSeit: iq.datum } : {}),
    // W2·27-BUND-FERTIG: Staffel-Kennzeichen durchreichen (der Generator setzt es
    // fail-closed für JEDEN Bund-Erlass); fehlt es im Sidecar, fehlt es auch hier.
    ...(typeof iq?.gestaffelt === 'boolean' ? { inkraftGestaffelt: iq.gestaffelt } : {}),
  };
}

/** §8-Ehrlichkeit: Aufhebungs-Vermerk aus dem Register durchreichen (nur wenn
 *  deklariert; SSoT aufhebungen.ts → register.ts:mitAufhebung). */
function aufhebungFelder(reg: ErlassRegistereintrag): { aufgehoben?: ErlassRegistereintrag['aufgehoben'] } {
  return reg.aufgehoben ? { aufgehoben: reg.aufgehoben } : {};
}

function bundEintrag(reg: ErlassRegistereintrag, datei: NormSnapshotDatei, pq?: PdfQuelle, iq?: InkraftQuelle): BrowseErlass {
  return {
    key: reg.key, ebene: 'bund', kanton: null,
    kuerzel: reg.kuerzel, titel: reg.titel, sr: reg.sr ?? null,
    rechtsgebiet: reg.rechtsgebiet, sprache: reg.sprache, rang: reg.rang, status: 'snapshot',
    datei: `bund/${reg.key}.json`,
    artikelAnzahl: datei.eintraege.length,
    stand: spaetesterStand(datei),
    quelleUrl: ohneAnker(datei.eintraege[0]?.quelleUrl ?? ''),
    fassungsToken: datei.eintraege[0]?.fassungsToken ?? '',
    pdfPfad: null,
    ...pdfFelder(pq),
    ...inkraftFelder(iq),
    ...aufhebungFelder(reg),
  };
}

function kantonEintrag(
  stamm: string,
  datei: NormSnapshotDatei,
  pq?: PdfQuelle,
  baum?: SystematikBaum,
): BrowseErlass {
  const kanton = stamm.split('-')[0];
  const erstes = datei.eintraege[0];
  const { kuerzel, titel, sr } = identitaetAusErlass(erstes?.erlass ?? stamm);
  return {
    key: stamm, ebene: 'kanton', kanton,
    kuerzel, titel, sr,
    rechtsgebiet: kantonGebiet(stamm), sprache: spracheAusStamm(stamm), rang: 0, status: 'snapshot',
    datei: `kanton/${stamm}.json`,
    artikelAnzahl: datei.eintraege.length,
    stand: spaetesterStand(datei),
    quelleUrl: ohneAnker(erstes?.quelleUrl ?? ''),
    fassungsToken: erstes?.fassungsToken ?? '',
    pdfPfad: null,
    ...pdfFelder(pq),
    ...sachgebietFelder(sachgebietKantonFuer(baum, kanton, stamm)),
  };
}

/** Additiv wie `pdfFelder`: kein Treffer ⇒ kein Feld (§8), nie `undefined` im JSON. */
function sachgebietFelder(s: SachgebietKanton | undefined): { sachgebietKanton?: SachgebietKanton } {
  return s ? { sachgebietKanton: s } : {};
}

function liveLinkEintrag(reg: ErlassRegistereintrag): BrowseErlass {
  return {
    key: reg.key, ebene: reg.ebene, kanton: reg.kanton ?? null,
    kuerzel: reg.kuerzel, titel: reg.titel, sr: reg.sr ?? null,
    rechtsgebiet: reg.rechtsgebiet, sprache: reg.sprache, rang: reg.rang, status: 'nur-live-link',
    datei: null, artikelAnzahl: 0,
    stand: reg.stand ?? '', quelleUrl: reg.quelleUrl ?? '', fassungsToken: '',
    pdfPfad: null,
  };
}

// pdf-embed: amtliches PDF in-app (kein Snapshot-JSON). datei=null; pdfPfad trägt
// den gehosteten PDF-Pfad. Stand/quelleUrl aus dem Register (pdf-embed.ts).
function pdfEmbedEintrag(reg: ErlassRegistereintrag): BrowseErlass {
  return {
    key: reg.key, ebene: reg.ebene, kanton: reg.kanton ?? null,
    kuerzel: reg.kuerzel, titel: reg.titel, sr: reg.sr ?? null,
    rechtsgebiet: reg.rechtsgebiet, sprache: reg.sprache, rang: reg.rang, status: 'pdf-embed',
    datei: null, artikelAnzahl: 0,
    stand: reg.stand ?? '', quelleUrl: reg.quelleUrl ?? '', fassungsToken: '',
    pdfPfad: reg.pdfPfad ?? null,
  };
}

/** Deterministische Sortierung: Bund vor Kanton; Bund nach Gebiet→Rang→Key;
 *  Kanton nach Kanton→Gebiet→Kürzel→Key. */
function vergleiche(a: BrowseErlass, b: BrowseErlass): number {
  if (a.ebene !== b.ebene) return a.ebene === 'bund' ? -1 : 1;
  if (a.ebene === 'bund') {
    return GEBIET_RANG[a.rechtsgebiet] - GEBIET_RANG[b.rechtsgebiet]
      || a.rang - b.rang || a.key.localeCompare(b.key);
  }
  return (a.kanton ?? '').localeCompare(b.kanton ?? '')
    || GEBIET_RANG[a.rechtsgebiet] - GEBIET_RANG[b.rechtsgebiet]
    || a.kuerzel.localeCompare(b.kuerzel) || a.key.localeCompare(b.key);
}

/** Baut das Browse-Manifest aus Register + Snapshot-Dateien (rein, testbar). */
export function baueBrowseManifest(erzeugt: string, basis = NORMTEXT_DIR): BrowseManifest {
  const bundReg = new Map(ERLASS_REGISTER.filter((r) => r.ebene === 'bund').map((r) => [r.key, r]));
  const pdfQuellen = ladePdfQuellen(basis);
  const inkrafttreten = ladeInkrafttreten(basis);
  const systematik = ladeSystematik(basis);
  const erlasse: BrowseErlass[] = [];

  // Bund: jeder Snapshot MUSS einen Register-Eintrag haben (Orphan-Tor).
  for (const f of jsonDateien(join(basis, 'bund'))) {
    const stamm = f.replace(/\.json$/, '');
    const datei = ladeDatei(join(basis, 'bund', f));
    if (!datei) continue;
    const reg = bundReg.get(stamm);
    if (!reg) throw new Error(`browse-manifest: Bund-Snapshot ${stamm}.json ohne Register-Eintrag (ERLASS_REGISTER ergänzen).`);
    erlasse.push(bundEintrag(reg, datei, pdfQuellen[stamm], inkrafttreten[stamm]));
  }

  // Kanton: Identität aus Snapshot/Dateiname abgeleitet, Gebiet aus Register.
  for (const f of jsonDateien(join(basis, 'kanton'))) {
    const stamm = f.replace(/\.json$/, '');
    const datei = ladeDatei(join(basis, 'kanton', f));
    if (!datei) continue;
    erlasse.push(kantonEintrag(stamm, datei, pdfQuellen[stamm], systematik[stamm.split('-')[0]]));
  }

  // Register-Einträge ohne Snapshot ergänzen: 'nur-live-link' (externer Link) und
  // 'pdf-embed' (amtliches PDF in-app).
  for (const reg of ERLASS_REGISTER) {
    if (reg.status === 'nur-live-link') erlasse.push(liveLinkEintrag(reg));
    else if (reg.status === 'pdf-embed') erlasse.push(pdfEmbedEintrag(reg));
  }

  erlasse.sort(vergleiche);
  return { erzeugt, erlasse };
}

/** Schreibpfad des Browse-Manifests (relativ zur Repo-Wurzel). */
export const REGISTER_PFAD = join(NORMTEXT_DIR, 'register.json');
