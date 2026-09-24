// ─── BS-Parser: raw-HTML → EntscheidSnapshot (Bauplan §3, offline) ───────────
//
// Struktur-Parse (linkedom-DOM), nie Regex über Fliesstext wo Struktur existiert:
//  · Metadaten-Kopf (Geschäftsnummer/Instanz/Entscheiddatum/Erstpublikation/
//    Aktualisierung/Titel) aus der METADATA-Tabelle.
//  · Body aus ALLEN div.WordSection*-Sektionen (Dispositive/Anhänge stehen real
//    auch in WordSection2/3); zwei real vorkommende Dokument-Vokabulare:
//    (a) semantische aa*-Klassen (aaTatsachen/aaEntscheidungsgrnde/aaDispositiv/
//        aaRmisch*/aaArabisch1*) — v.a. Sozialversicherungsgericht;
//    (b) Word-Klassen (MsoNormal/T1TextAG…) mit strukturellen Marker-Absätzen
//        («Sachverhalt»/«Erwägungen»/«Demgemäss erkennt …») und Erwägungsnummern
//        als FÜHRENDES <b>-Element — v.a. Appellationsgericht/Zivilgericht.
//    Beide sind Absatz-strukturell (Marker = eigener Absatz bzw. Klassen-/
//    Bold-Signal), kein Raten im Fliesstext. Ehrlicher Fallback (§3.5): ohne
//    jeden Marker wird der GANZE Inhalt EIN flacher erwaegung-Abschnitt.
//  · Typographie verbatim (NBSP/U+202F/«»/–/Soft-Hyphen); nur ASCII-Whitespace
//    wird gemäss HTML-Semantik kollabiert. Fidelity-Gates pro Dokument (§3.6).

import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseHTML } from 'linkedom';
import { dekodiereBs, dokumentUrl } from './bs-client';
import { rawPfad, BS_DATEN } from './bs-fetch';
import { extrahiereBesetzung } from './bs-besetzung';
import { gnJahr, type Inventar, type InventarZeile } from './bs-inventar';
import { sha256EntscheidBloecke } from '../normtext/sha-entscheide';
import { gerichtAnzeigename, kantonalSachgebiet, fmtDatumDe } from '../normtext/entscheide-mapping';
import { schreibeKorpus, ladeBestandSnapshots } from '../normtext/entscheide-schreiben';
import type { EntscheidSnapshot, EntscheidAbschnitt, EntscheidBlock } from '../../src/lib/rechtsprechung/typen';
import type { Rechtsgebiet } from '../../src/lib/normtext/register';

// ─── Instanz (Dokumentkopf, ausgeschrieben) → court-Code (§3.1) ──────────────
// Wortlaute aus echten Dokumenten übernommen (Kopffeld «Instanz:»); ein
// unbekannter Wortlaut ist ein harter Parse-Fehler (nie raten, §1).
const INSTANZ_COURT: Array<[RegExp, string]> = [
  [/^Appellationsgericht/i, 'bs_appellationsgericht'],
  [/^Sozialversicherungsgericht/i, 'bs_sozialversicherungsgericht'],
  [/^Zivilgericht/i, 'bs_zivilgericht'],
  [/^Aufsichtskommission/i, 'bs_aufsichtskommission'],
];

// ─── Text-Utilities (Typographie-Treue §3.6) ─────────────────────────────────

/** NUR ASCII-Whitespace kollabieren (HTML-Semantik); NBSP/U+202F/Soft-Hyphen bleiben. */
export function normAsciiWs(s: string): string {
  return s.replace(/[ \t\r\n\f]+/g, ' ').replace(/^ +| +$/g, '');
}

/** Leer = nur Whitespace inkl. NBSP-Filler (JS \\s matcht U+00A0/U+202F). */
const istLeer = (s: string): boolean => s.replace(/\s+/g, '') === '';

/**
 * Quell-Debris-Bereinigung (Fidelity-Befund 19.7.2026): einzelne Portal-Dokumente
 * tragen C0-Steuerzeichen VERBATIM im HTML (Raw==Live verifiziert, Quelle defekt).
 * Zwei Klassen, beide deterministisch behandelt (kein Raten, §1):
 *  (a) UTF-16BE-High-Byte-Drop: das Original-Zeichen U+20xx steht als Byte-Paar
 *      0x00 0xXX im 1252-Strom. Empirisch verifiziert (alle 3 Vorkommen einzeln
 *      geprüft): «CHF 32␀␙370.60» → «32’370.60» (74208), «727.␀␓ zielenden» →
 *      «727.– …» (74434), «2023 ␀␓ und somit» → Gedankenstrich (75135).
 *      Nur diese belegten Paare werden auf ihr Original abgebildet.
 *  (b) Rest-Debris (␀-/␂-Läufe im Dispositiv-Padding, ␀ mitten im Wort mit
 *      unrekonstruierbarem Zeichenverlust): Steuerzeichen tragen im Quell-HTML
 *      keinen Glyph — sie werden ENTFERNT (Parität zum Browser-Rendering der
 *      amtlichen Seite); der Zeichenverlust ist quellseitig, nicht rekonstruierbar.
 * Das Fidelity-Gate (unten) hält dagegen: kein C0 darf den Snapshot erreichen.
 */
export function bereinigeQuellDebris(html: string): string {
  /* eslint-disable no-control-regex -- C0-Steuerzeichen sind hier der PRÜFGEGENSTAND */
  return html
    .replace(/\u0000\u0013/g, '\u2013')
    .replace(/\u0000\u0019/g, '\u2019')
    .replace(/[\u0000-\u0008\u000b\u000e-\u001f]/g, '');
  /* eslint-enable no-control-regex */
}

/**
 * Zähl-Basis des Einheiten↔Blöcke-Fidelity-Gates: Inhalts-Zeichen (Umlaute +
 * Guillemets), die keine legitime Trim-/Gliederungs-Transformation je berührt.
 * NBSP wird hier bewusst NICHT auf Gleichheit gezählt: reine NBSP-Filler-Absätze
 * und das NBSP-Padding direkt hinter Gliederungsnummern werden deklariert
 * entfernt (Layout, kein Inhalt); die NBSP-Treue IM Text sichert die
 * Präsenz-Quote in check:bs-entscheide + die 10-Dokumente-Stichprobe (§8.2).
 */
export const FIDELITY_ZEICHEN = ['ä', 'ö', 'ü', '«', '»'] as const;
export function fidelityZaehlung(s: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const ch of FIDELITY_ZEICHEN) out[ch] = 0;
  for (const ch of s) if (ch in out) out[ch]++;
  return out;
}

// ─── Body-Einheiten (Absatz-strukturell) ─────────────────────────────────────

interface Einheit {
  text: string;
  klasse: string;
  /** Nummern-Text eines FÜHRENDEN <b>/<strong>-Elements (AG-Vokabular), sonst null. */
  boldLead: string | null;
  istTabelle: boolean;
}

// LI gehört dazu (Fidelity-Befund 19.7.2026): zwei Dokumente (AUS.2023.4/74636,
// AUS.2023.18/75037) tragen Vorstrafenlisten als direkte <li>-Texte — ohne LI
// wurden deren Textknoten beim Rekursieren stumm verworfen. Ein <li> wird wie
// ein Absatz behandelt (textContent inkl. allfälliger Kind-Blöcke, kein Doppelzug).
const BLOCK_TAGS = new Set(['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI']);

function tabelleZuText(tbl: Element): string {
  const zeilen: string[] = [];
  for (const tr of tbl.querySelectorAll('tr')) {
    const zellen = [...tr.children]
      .filter((c) => c.tagName === 'TD' || c.tagName === 'TH')
      .map((td) => normAsciiWs(td.textContent ?? ''))
      .filter((t) => !istLeer(t));
    if (zellen.length) zeilen.push(zellen.join(' | '));
  }
  return zeilen.join('\n');
}

/** Body-Container in Dokument-Reihenfolge zu flachen Einheiten (p, h1-h6, table). */
function sammleEinheiten(root: Element): Einheit[] {
  const out: Einheit[] = [];
  const walk = (el: Element): void => {
    for (const kind of el.children) {
      const tag = kind.tagName;
      if (tag === 'TABLE') {
        const t = tabelleZuText(kind);
        if (!istLeer(t)) out.push({ text: t, klasse: kind.getAttribute('class') ?? '', boldLead: null, istTabelle: true });
        continue;   // nie in Tabellen rekursieren (eine Tabelle = eine Einheit)
      }
      if (BLOCK_TAGS.has(tag)) {
        const text = normAsciiWs(kind.textContent ?? '');
        if (istLeer(text)) continue;
        // Führendes <b>/<strong> mit reiner Nummer (AG-Erwägungsmarken: «<b>1.2</b> Text…»).
        let boldLead: string | null = null;
        const erst = kind.firstElementChild;
        if (erst && (erst.tagName === 'B' || erst.tagName === 'STRONG')) {
          // nur wenn vor dem Element kein nennenswerter Text steht
          const vorText = (kind.firstChild !== erst && kind.firstChild?.nodeType === 3)
            ? String(kind.firstChild.textContent ?? '') : '';
          if (istLeer(vorText)) boldLead = normAsciiWs(erst.textContent ?? '');
        }
        out.push({ text, klasse: kind.getAttribute('class') ?? '', boldLead, istTabelle: false });
        continue;
      }
      walk(kind);   // div/span-Wrapper durchsteigen
    }
  };
  walk(root);
  return out;
}

// ─── Abschnitts-Segmentierung ────────────────────────────────────────────────

type SektionsTyp = 'sachverhalt' | 'erwaegung' | 'dispositiv';

const NUM_RE = /^(\d+(?:\.\d+)*)\.?$/;
const ROEM_RE = /^([IVX]{1,6})\.$/;

/** Marker-Absatz? (ganzer Absatztext = Sektions-Überschrift bzw. Dispositiv-Einleitung) */
function sektionsMarker(e: Einheit): SektionsTyp | null {
  const k = e.klasse;
  const t = e.text.replace(/\u00a0/g, ' ').replace(/ +/g, ' ').trim();
  // Dispositiv-Einleitung «<Spruchkörper> erkennt:» VOR den Klassen-Regeln:
  // das SVG-Template klebt vereinzelt aaTatsachen an genau diese Zeile
  // (IV.2022.64/75372) — der Text ist hier das verlässlichere Struktursignal.
  // Korpus-Scan 19.7.2026: exakt 4 Absatz-Wortlaute, alle echte Dispositiv-Intros
  // («Das Appellationsgericht (Dreiergericht/Einzelgericht/Kammer) erkennt:»,
  // «Die Präsidentin des Sozialversicherungsgerichts erkennt:»).
  if (/^(Der|Die|Das)\b/.test(t) && /\berkennt\s*:$/.test(t) && t.length < 120) return 'dispositiv';
  // Auch die «Demgemäss …»-Einleitung schlägt die Klassen: das SVG-Template klebt
  // aaTatsachen real an «Demgemäss erkennt das Sozialversicherungsgericht:»
  // (UV.2025.50/79639, EL.2025.5/79724) — sonst entstünde ein zweiter, falscher
  // sachverhalt-Abschnitt mitten im Dispositiv.
  if (/^(Demgemäss|Demnach|Demzufolge)\b.{0,120}\berk(e|a)nnt\b/i.test(t) && t.length < 160) return 'dispositiv';
  if (/\baaTatsachen\b/.test(k)) return 'sachverhalt';
  if (/\baaEntscheidungsgrnde\b/.test(k)) return 'erwaegung';
  if (/\baaDispositiv\b/.test(k)) return 'dispositiv';
  if (/^(Tatsachen|Sachverhalt)$/i.test(t)) return 'sachverhalt';
  // «Entscheidgründe» (ohne -ungs-): reale SVG-Variante (IV.2022.64/75372) —
  // ohne sie fielen deren nummerierte Erwägungen komplett vor den ersten Marker.
  if (/^(Entscheidungsgründe|Entscheidgründe|Erwägungen|Aus den Erwägungen|Erwägung|Gründe)$/i.test(t)) return 'erwaegung';
  if (/^Es wird erkannt\s*:?$/i.test(t)) return 'dispositiv';
  if (t.startsWith('://:')) return 'dispositiv';   // erste Dispositiv-Ziffer ohne Einleitungssatz
  return null;
}

/** Erwägungs-/Gliederungs-Marke einer Einheit (strukturell: Klasse bzw. Bold-Lead). */
function markeVon(e: Einheit, sektion: SektionsTyp): { marke: string; tiefe: number; rest: string } | null {
  if (sektion === 'dispositiv') return null;
  const t = e.text;
  // (a) aa*-Klassen: Nummer steht am Absatzanfang (Klasse deklariert die Ebene).
  if (/\baaRmisch(1|fortlaufend)\b/.test(e.klasse)) {
    const m = /^([IVX]{1,6})\.(?=\s|$)/.exec(t);
    if (m) return { marke: `${m[1]}.`, tiefe: 1, rest: t.slice(m[0].length) };
  }
  if (/\baaArabisch1(Unterziffer)?\b/.test(e.klasse)) {
    const m = /^(\d+(?:\.\d+)*)\.?(?=\s|$)/.exec(t);
    if (m) return { marke: m[1], tiefe: m[1].split('.').length, rest: t.slice(m[0].length) };
  }
  // (b) führendes <b>/<strong> mit reiner Nummer (AG/ZG-Vokabular).
  if (e.boldLead) {
    const b = e.boldLead.replace(/\s+$/g, '');
    let m = NUM_RE.exec(b);
    if (m) return { marke: m[1], tiefe: m[1].split('.').length, rest: t.slice(e.boldLead.length ? t.indexOf(b) + b.length : 0) };
    m = ROEM_RE.exec(b) as RegExpExecArray | null;
    if (m) return { marke: `${m[1]}.`, tiefe: 1, rest: t.slice(t.indexOf(b) + b.length) };
  }
  return null;
}

const trimFuehrend = (s: string): string => s.replace(/^\s+/, '');

export interface ParseErgebnis {
  gn: string;
  gnSekundaer: string | null;
  instanz: string;
  court: string;
  datum: string | null;          // ISO
  /**
   * Entscheiddatum aus dem Deckblatt («URTEIL» / «vom 15. September 2025»), ISO —
   * nur Lückenfüller für ein fehlendes Metadaten-Datum (`kopfDatum`, B-1).
   * Optional, damit handgebaute Test-Ergebnisse ohne das Feld gültig bleiben.
   */
  datumKopf?: string | null;
  erstpublikation: string | null;
  aktualisiert: string | null;
  titel: string;
  abschnitte: EntscheidAbschnitt[];
  dispositivOrders: string[];
  /** 'klassen' | 'marker' | 'flach' — Ausweis der Parser-Qualität (Report). */
  strukturQuelle: 'klassen' | 'marker' | 'flach';
  /** Fidelity: Zeichen-Zählung über die aufgenommenen Einheiten (Gate §3.6). */
  zaehlungEinheiten: Record<string, number>;
  /** Amtlicher Spruchkörper-Freitext aus dem Rubrum (null, wenn nicht schneidbar). */
  besetzung: string | null;
  /** Woher der Besetzungs-Block stammt — Ausweis fürs Tor/Report. */
  besetzungQuelle: 'mitwirkende' | 'signatur' | 'keine';
}

function metaWert(document: Document, label: string): string | null {
  for (const tr of document.querySelectorAll('tr')) {
    const tds = [...tr.children].filter((c) => c.tagName === 'TD');
    if (tds.length < 2) continue;
    // Exakter Label-Match der INNERSTEN Zelle («Geschäftsnummer:») — startsWith
    // träfe sonst zuerst die äussere Wrapper-Zelle (deren textContent alles enthält).
    const l = normAsciiWs(tds[0].textContent ?? '').replace(/\u00a0/g, ' ').trim();
    if (l === label + ':' || l === label) {
      return normAsciiWs(tds[1].textContent ?? '');
    }
  }
  return null;
}

const dIso = (s: string | null): string | null => {
  const m = /(\d{2})\.(\d{2})\.(\d{4})/.exec(s ?? '');
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
};

// ─── Kopf-Datum: das Entscheiddatum aus dem Deckblatt (W2·29-WERKBANK-LESER D2/B-1) ──
//
// BEFUND (Prüfrunde 1, reproduziert 23.9.2026): 42 der 3'765 BS-Dokumente haben im
// Metadaten-Kopf des Portals KEIN «Entscheiddatum» (Inventar `datum: null`). Der
// Import führte sie darum als `datumUnbekannt` mit dem Platzhalter <GN-Jahr>-01-01
// — und dieser Platzhalter wanderte ohne das Flag in die Bezugs-Shards, wo er als
// echtes Datum «01.01.2024» erschien und das «revidiert»-Warnzeichen auslöste.
// Das Datum steht aber im amtlichen Dokument selbst: das Deckblatt trägt unter der
// Titelzeile «ENTSCHEID»/«URTEIL»/«Urteil der Präsidentin» einen eigenen Absatz
// «vom 15. September 2025» (BES.2024.88, nF30_KEY 78827).
//
// DIE REGEL ist strukturell, kein Fliesstext-Raten (§1/§2): ein Absatz, der
// VOLLSTÄNDIG aus «vom <T>. <Monat> <JJJJ>» besteht UND unmittelbar auf einen
// Absatz folgt, der VOLLSTÄNDIG eine Entscheid-Titelzeile ist, innerhalb der
// ersten KOPF_FENSTER Einheiten (Briefkopf-Tabelle, GN, Titel, Datum stehen real
// an Position 3–6). Ein «vom …» im Sachverhalt ist nie ein ganzer Absatz direkt
// nach «URTEIL» und trifft darum nicht.
//
// GEMESSEN 23.9.2026 (Rohdokumente frisch vom Portal): 42/42 datumlose Dokumente
// tragen genau einen solchen Kopf; Gegenprobe an 42 Dokumenten MIT Metadaten-
// Datum (jedes 90. des Inventars): Kopf-Datum == Metadaten-Datum in allen Fällen,
// in denen die Regel greift (Zahl im PR-Bericht). Das Metadaten-Datum bleibt die
// erste Quelle; das Kopf-Datum füllt nur die Lücke (`baueSnapshot`).
const KOPF_FENSTER = 12;
const MONATE: Record<string, string> = {
  Januar: '01', Februar: '02', März: '03', April: '04', Mai: '05', Juni: '06',
  Juli: '07', August: '08', September: '09', Oktober: '10', November: '11', Dezember: '12',
};
const KOPF_TITEL_RE = /^(?:ENTSCHEID|URTEIL|BESCHLUSS|VERFÜGUNG|(?:Entscheid|Urteil|Beschluss|Verfügung) de[rs] [A-ZÄÖÜ][a-zäöüß]+)$/;
const KOPF_DATUM_RE = new RegExp(`^vom (\\d{1,2})\\. (${Object.keys(MONATE).join('|')}) (\\d{4})$`);

/** Ganzabsatz-Text für den Kopf-Vergleich: NBSP/U+202F → Leerzeichen, kollabiert. */
const kopfText = (s: string): string => s.replace(/[\u00a0\u202f]/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * Entscheiddatum aus dem Deckblatt (ISO) oder null. Rein (§2). Exportiert für den
 * Regressionstest; die Anwendung (nur als Lückenfüller) steht in `baueSnapshot`.
 */
export function kopfDatum(einheiten: ReadonlyArray<{ text: string }>): string | null {
  const n = Math.min(einheiten.length, KOPF_FENSTER);
  for (let i = 1; i < n; i++) {
    const m = KOPF_DATUM_RE.exec(kopfText(einheiten[i].text));
    if (!m || !KOPF_TITEL_RE.test(kopfText(einheiten[i - 1].text))) continue;
    const tag = m[1].padStart(2, '0');
    const iso = `${m[3]}-${MONATE[m[2]]}-${tag}`;
    // Kalender-Gegenprobe: «vom 31. April» ist kein Datum (nie raten, §1).
    const d = new Date(`${iso}T00:00:00Z`);
    if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== iso) return null;
    return iso;
  }
  return null;
}

/**
 * Plausibilitäts-Riegel für das Kopf-Datum: nicht vor dem Jahr der Geschäftsnummer
 * (Eingang), nicht nach der Erstpublikation. Scheitert er, bleibt das Datum
 * ehrlich unbekannt (Platzhalter + `datumUnbekannt`) statt geraten.
 */
export function plausiblesKopfDatum(kopf: string | null | undefined, gnJahrZahl: number | null, erstpublikation: string | null): string | null {
  if (!kopf) return null;
  if (gnJahrZahl !== null && Number(kopf.slice(0, 4)) < gnJahrZahl) return null;
  if (erstpublikation && kopf > erstpublikation) return null;
  return kopf;
}

/** Ein rohes BS-Dokument (windows-1252-Bytes) strukturell parsen. */
export function parseBsDokument(bytes: Buffer): ParseErgebnis {
  const html = bereinigeQuellDebris(dekodiereBs(bytes));
  const { document } = parseHTML(html);

  // ── Metadaten-Kopf ──
  const gnRoh = metaWert(document, 'Geschäftsnummer');
  if (!gnRoh) throw new Error('Metadaten: Geschäftsnummer fehlt');
  // GN-Präfix kann Ziffern tragen (real: «K5.2023.13», Zivilgericht Kammer 5).
  const gnM = /([A-Za-z][A-Za-z0-9]*\.\d{4}\.\d+)/.exec(gnRoh);
  if (!gnM) throw new Error(`Metadaten: Geschäftsnummer unparsebar: «${gnRoh}»`);
  const gn = gnM[1];
  const sekM = /\(([A-Za-z][A-Za-z0-9]*\.\d{4}\.\d+)\)/.exec(gnRoh);
  const instanz = metaWert(document, 'Instanz') ?? '';
  const courtEintrag = INSTANZ_COURT.find(([re]) => re.test(instanz));
  if (!courtEintrag) throw new Error(`Instanz unbekannt: «${instanz}» (nie raten, §1)`);
  const titel = metaWert(document, 'Titel') ?? '';

  // ── Body ──
  // ALLE WordSection-Divs in Dokument-Reihenfolge (Fidelity-Befund 19.7.2026):
  // Word bricht bei Sektionswechseln in WordSection2/3 um — dort stehen real
  // Dispositive und Anhänge (KE.2023.37/76512: ganzes Dispositiv in WordSection2;
  // ZB.2023.62/77467: Erwägungs-Fortsetzung + Dispositiv + Unterhalts-Anhang in
  // WordSection2+3; SB.2020.87/75885: Zivilforderungs-Anhang). Nur WordSection1
  // zu lesen, verwarf diese Inhalte vollständig. Verschachtelte Treffer werden
  // dedupliziert (nur Wurzeln sammeln — kein Doppelzug).
  const wsAlle = [...document.querySelectorAll('div')]
    .filter((d) => /^WordSection\d+$/.test(d.getAttribute('class') ?? ''));
  const roots = wsAlle.filter((d) => !wsAlle.some((o) => o !== d && o.contains(d)));
  if (!roots.length) throw new Error('Body: div.WordSection1 fehlt');
  const einheiten = roots.flatMap((r) => sammleEinheiten(r));
  if (!einheiten.length) throw new Error('Body: keine Inhalts-Einheiten');

  // Spruchkörper aus dem Deckblatt-/Signatur-Block (eigener Pass, siehe unten).
  const besetzungRoh = extrahiereBesetzung(document);

  const hatAaKlassen = einheiten.some((e) => /\baa(Tatsachen|Entscheidungsgrnde|Dispositiv)\b/.test(e.klasse));
  const ersterMarker = einheiten.findIndex((e) => sektionsMarker(e) !== null);
  const ersterInhaltsMarker = einheiten.findIndex((e) => {
    const s = sektionsMarker(e);
    return s === 'sachverhalt' || s === 'erwaegung';
  });

  // Deckblatt (Briefkopf/Mitwirkende/Parteien — Rubrum-Vertiefung = Folge-Einheit F3)
  // wird nur übersprungen, wenn ein Sachverhalt-/Erwägungs-Marker existiert; beginnt
  // das Dokument direkt mit dem Dispositiv-Marker, bleibt alles davor als Erwägung.
  //
  // Deckblatt-ENDE zusätzlich quantitativ begrenzt (Fidelity-Befund 19.7.2026):
  // 26 Dokumente tragen SUBSTANZIELLE Prosa VOR dem ersten Marker (Sachverhalts-
  // Geschichte ohne «Sachverhalt»-Überschrift, SVG-Zusammenfassungen, Anklage-
  // Betreffs; Extremfall SB.2018.45/74624: ~52k Zeichen Verfahrensgeschichte).
  // Struktursignal: echte Rubrum-/Briefkopf-Absätze sind kurz (Korpus-Scan: in
  // 3739/3765 Dokumenten ALLE Vor-Marker-Einheiten < 300 Zeichen). Der Skip endet
  // darum am ersten Absatz ≥ 300 Zeichen — ab dort ist es Inhalt und wird als
  // Sachverhalt geführt (alles zwischen Rubrum und Erwägungen ist funktional
  // Sachverhalt/Verfahrensgeschichte; folgt ein «Sachverhalt»-Marker, fliesst er
  // in DENSELBEN Abschnitt).
  const DECKBLATT_MAX_ZEICHEN = 300;
  const ersterInhaltsAbsatz = einheiten.findIndex((e) => e.text.length >= DECKBLATT_MAX_ZEICHEN);
  const start = ersterInhaltsMarker >= 0
    ? (ersterInhaltsAbsatz >= 0 && ersterInhaltsAbsatz < ersterInhaltsMarker ? ersterInhaltsAbsatz : ersterInhaltsMarker)
    : 0;
  const strukturQuelle: ParseErgebnis['strukturQuelle'] =
    ersterMarker < 0 ? 'flach' : hatAaKlassen ? 'klassen' : 'marker';

  // ── Segmentieren + Blöcke gruppieren ──
  const abschnitte: EntscheidAbschnitt[] = [];
  // Fallback-Sektion: flach (§3.5) = erwaegung; beginnt der Inhalt VOR dem ersten
  // Marker (Deckblatt-Ende-Signal), ist er Sachverhalts-Stoff (siehe oben).
  let sektion: SektionsTyp = ersterInhaltsMarker >= 0 && start < ersterInhaltsMarker
    ? 'sachverhalt' : 'erwaegung';
  let bloecke: EntscheidBlock[] = [];
  let aktuellerBlock: EntscheidBlock | null = null;
  const zaehlung = fidelityZaehlung('');

  const schliesseAbschnitt = (): void => {
    if (aktuellerBlock) { bloecke.push(aktuellerBlock); aktuellerBlock = null; }
    if (bloecke.length) abschnitte.push({ typ: sektion, bloecke });
    bloecke = [];
  };

  for (let i = start; i < einheiten.length; i++) {
    const e = einheiten[i];
    for (const [ch, n] of Object.entries(fidelityZaehlung(e.text))) zaehlung[ch] += n;
    const marker = sektionsMarker(e);
    // Kein Rückfall aus dem Dispositiv: nach «Demgemäss erkennt …» folgt amtlich
    // nur noch Mitteilung/Rechtsmittelbelehrung. Das SVG-Template klassiert deren
    // Überschrift vereinzelt als aaTatsachen (UV.2024.30/78316, UV.2024.40/78868)
    // — ein später «sachverhalt»-Marker wäre ein falscher zweiter Abschnitt.
    const abschnitteHattenDispositiv = sektion === 'dispositiv';
    if (marker && marker !== sektion && !(abschnitteHattenDispositiv && marker !== 'dispositiv')) {
      schliesseAbschnitt(); sektion = marker;
    }
    // Reine Überschrift-Absätze («Tatsachen», «Erwägungen») tragen keinen Inhalt —
    // ABER: aaDispositiv-/Demgemäss-/«://:»-Einheiten SIND Inhalt.
    const istReineUeberschrift = marker !== null && marker !== 'dispositiv'
      && /^(Tatsachen|Sachverhalt|Entscheidungsgründe|Entscheidgründe|Erwägungen|Aus den Erwägungen|Erwägung|Gründe)$/i
        .test(e.text.replace(/\u00a0/g, ' ').trim());
    if (istReineUeberschrift) {
      // Überschrift zählt zur Fidelity-Basis der Einheiten NICHT (nicht aufgenommen).
      for (const [ch, n] of Object.entries(fidelityZaehlung(e.text))) zaehlung[ch] -= n;
      continue;
    }

    if (sektion === 'dispositiv') {
      // Dispositiv: jede Einheit ein eigener Block (Ziffern/Mitteilung/Rechtsmittel).
      if (aktuellerBlock) { bloecke.push(aktuellerBlock); aktuellerBlock = null; }
      bloecke.push({ marke: null, text: e.text });
      continue;
    }

    const m = markeVon(e, sektion);
    if (m) {
      if (aktuellerBlock) bloecke.push(aktuellerBlock);
      const marke = sektion === 'erwaegung' && /^\d/.test(m.marke) ? `E. ${m.marke}` : m.marke;
      aktuellerBlock = { marke, tiefe: m.tiefe, text: trimFuehrend(m.rest) };
    } else if (aktuellerBlock) {
      aktuellerBlock.text = aktuellerBlock.text ? `${aktuellerBlock.text}\n\n${e.text}` : e.text;
    } else {
      aktuellerBlock = { marke: null, text: e.text };
    }
  }
  schliesseAbschnitt();

  if (!abschnitte.length) throw new Error('Parse: keine Abschnitte mit Inhalt');

  // ── Dispositiv-Ziffern (dispositivOrders) ──
  const dispositivOrders: string[] = [];
  const disp = abschnitte.find((a) => a.typ === 'dispositiv');
  if (disp) {
    let inOrders = false;
    for (const b of disp.bloecke) {
      const t = b.text;
      if (/^(Mitteilung an|Rechtsmittelbelehrung|Gegen diesen Entscheid|Gegen dieses Urteil|Im Namen)/i.test(t)
        || /^(Die|Der) (Präsident|Gerichtsschreib|Vorsitzende)/i.test(t)) { inOrders = false; continue; }
      if (t.startsWith('://:')) {
        inOrders = true;
        dispositivOrders.push(trimFuehrend(t.slice(4)));
        continue;
      }
      if (/^(Demgemäss|Demnach|Demzufolge|Es wird erkannt)/i.test(t)) { inOrders = true; continue; }
      if (inOrders && !/BASEL-STADT/.test(t)) dispositivOrders.push(t);
      else inOrders = inOrders && !/BASEL-STADT/.test(t);
    }
  }

  // ── Fidelity-Gates (§3.6, pro Dokument hart) ──
  const alleTexte = abschnitte.flatMap((a) => a.bloecke.map((b) => b.text)).join('\n');
  if (alleTexte.includes('�')) throw new Error('Fidelity: U+FFFD im Text');
  // C0-Steuerzeichen dürfen den Snapshot nie erreichen (Quell-Debris-Bereinigung
  // oben deckt die bekannten Muster; neue Varianten sollen HART scheitern statt
  // still in Rendering/Suche/Downstream zu wandern).
  // eslint-disable-next-line no-control-regex -- C0-Steuerzeichen sind der Prüfgegenstand
  if (/[\u0000-\u0008\u000b\u000e-\u001f]/.test(alleTexte)) throw new Error('Fidelity: C0-Steuerzeichen im Text');
  if (/&nbsp;|&auml;|&ouml;|&uuml;|&amp;/.test(alleTexte)) throw new Error('Fidelity: HTML-Entity-Literal im Text');
  // Nur ECHTE HTML-Tag-Namen flaggen — Urteilstexte können legitime «<Wort»-Zitate
  // tragen (real: «&lt;Versprecher» in 73471, entity-dekodiert korrekt).
  if (/<\/?(p|b|i|u|em|strong|span|div|td|tr|th|table|br|hr|h[1-6]|img|a|ul|ol|li)\b[^>]*>/i.test(alleTexte)) throw new Error('Fidelity: HTML-Tag-Rest im Text');
  const zaehlBloecke = fidelityZaehlung(alleTexte);
  for (const ch of Object.keys(zaehlung)) {
    if (zaehlung[ch] !== zaehlBloecke[ch]) {
      throw new Error(`Fidelity: Zeichen ${JSON.stringify(ch)} Einheiten=${zaehlung[ch]} ≠ Blöcke=${zaehlBloecke[ch]}`);
    }
  }

  return {
    gn, gnSekundaer: sekM ? sekM[1] : null, instanz, court: courtEintrag[1],
    datum: dIso(metaWert(document, 'Entscheiddatum')),
    datumKopf: kopfDatum(einheiten),
    erstpublikation: dIso(metaWert(document, 'Erstpublikationsdatum')),
    aktualisiert: dIso(metaWert(document, 'Aktualisierungsdatum')),
    titel, abschnitte, dispositivOrders, strukturQuelle,
    zaehlungEinheiten: zaehlung,
    // Eigener Lese-Pass über das DOM: `sammleEinheiten` verwirft die Anker- und
    // Label-Struktur (nur textContent), und das Deckblatt wird für `abschnitte`
    // ohnehin übersprungen. Der Besetzungs-Block wird darum separat geschnitten —
    // das lässt `abschnitte`/`sha` unverändert (§6).
    besetzung: besetzungRoh.text,
    besetzungQuelle: besetzungRoh.quelle,
  };
}

// ─── Snapshot-Assemblierung (§3.4) + Korpus schreiben ────────────────────────

export function docketSafeVergabe(gruppe: Array<{ p: ParseErgebnis; z: InventarZeile }>): Map<number, string> {
  // Kollisionsregel §3.2: erstes Dokument (Datum↑, dann key↑) behält die blanke GN;
  // weitere erhalten '-YYYYMMDD' (Entscheiddatum) bzw. zusätzlich '-<nF30_KEY>'.
  const out = new Map<number, string>();
  const sortiert = [...gruppe].sort((a, b) =>
    (a.p.datum ?? '9999') < (b.p.datum ?? '9999') ? -1 : (a.p.datum ?? '9999') > (b.p.datum ?? '9999') ? 1 : a.z.key - b.z.key);
  const vergeben = new Set<string>();
  for (let i = 0; i < sortiert.length; i++) {
    const { p, z } = sortiert[i];
    let safe = p.gn;
    if (i > 0) {
      safe = p.datum ? `${p.gn}-${p.datum.replace(/-/g, '')}` : `${p.gn}-${z.key}`;
      if (vergeben.has(safe)) safe = `${p.gn}-${p.datum?.replace(/-/g, '') ?? ''}-${z.key}`;
    }
    vergeben.add(safe);
    out.set(z.key, safe);
  }
  return out;
}

export function baueSnapshot(p: ParseErgebnis, z: InventarZeile, docketSafe: string, abgerufen: string): EntscheidSnapshot {
  const gerichtName = gerichtAnzeigename(p.court, 'BS');
  const jahr = gnJahr(p.gn);
  // Metadaten-Datum zuerst; fehlt es, das Deckblatt-Datum (B-1), sofern plausibel.
  // Erst wenn beide fehlen, bleibt das Datum ehrlich unbekannt (Platzhalter + Flag).
  const kopf = p.datum ? null : plausiblesKopfDatum(p.datumKopf, jahr, p.erstpublikation);
  const datumlos = !p.datum && !kopf;
  if (datumlos && !jahr) throw new Error(`${p.gn}: weder Entscheiddatum noch GN-Jahr`);
  const datum = p.datum ?? kopf ?? `${jahr}-01-01`;
  const sachgebiet: Rechtsgebiet = kantonalSachgebiet(p.gn) ?? 'oeffentlich';
  const snap: EntscheidSnapshot = {
    id: `kanton/BS/${p.court}/${docketSafe}`,
    gericht: p.court,
    gerichtName,
    gerichtstyp: 'kantonal',
    kanton: 'BS',
    abteilung: null,
    nummer: p.gn,
    bgeReferenz: null,
    zitierung: datumlos ? `${gerichtName} ${p.gn}` : `${gerichtName} ${p.gn} vom ${fmtDatumDe(datum)}`,
    datum,
    sprache: 'de',
    leitcharakter: 'routine',
    sachgebiet,
    legalArea: null,
    // besetzung: amtlicher Freitext des Spruchkörpers (Richter + Gerichtsschreiber),
    // geschnitten aus dem abgegrenzten Rubrum-Block. Anonymisierte Parteien stehen
    // NIE darin (Schnitt endet vor «Beteiligte»/«Parteien», zusätzlich ____-Bremse).
    // Additiv: `abschnitte` und damit `sha` bleiben davon unberührt (§6).
    rubrum: { gegenstand: p.titel || null, parteien: null, vorinstanz: null, besetzung: p.besetzung },
    regeste: null,             // Titel ist Betreff, KEINE Regeste (SG-Fehletikett-Lektion)
    regesteAmtlich: false,
    abschnitte: p.abschnitte,
    dispositivOrders: p.dispositivOrders,
    zitierteNormen: [],        // Folge-Einheit F2 (Normzitat-Extraktion)
    normKeys: [],
    zitierteEntscheide: [],
    bestand: 'snapshot',
    kuratierung: 'maschinell', // nie 'geprueft' (Abnahme-Zeitsperre)
    quelle: 'gerichte-bs',
    quelleUrl: dokumentUrl(z.key),
    abgerufen,
    fassungsToken: p.aktualisiert ?? p.erstpublikation ?? abgerufen,
    sha: sha256EntscheidBloecke(p.abschnitte),
  };
  if (datumlos) snap.datumUnbekannt = true;
  if (p.erstpublikation) snap.erstpublikation = p.erstpublikation;
  if (p.aktualisiert) snap.aktualisiert = p.aktualisiert;
  if (p.gnSekundaer) snap.nummerSekundaer = p.gnSekundaer;
  return snap;
}

export async function parseUndSchreibe(inventar: Inventar, datum: string, limit = 0): Promise<void> {
  const cpPfad = join(BS_DATEN, 'checkpoint.json');
  const cp: Record<string, { abgerufen: string }> = existsSync(cpPfad)
    ? JSON.parse(readFileSync(cpPfad, 'utf8')) : {};

  const geparst: Array<{ p: ParseErgebnis; z: InventarZeile }> = [];
  const fehler: Array<{ key: number; gn: string; grund: string }> = [];
  const eintraege = limit > 0 ? inventar.eintraege.slice(0, limit) : inventar.eintraege;
  for (const z of eintraege) {
    const pfad = rawPfad(z.key);
    if (!existsSync(pfad)) { fehler.push({ key: z.key, gn: z.gn, grund: 'Rohdatei fehlt (fetch unvollständig)' }); continue; }
    try {
      const p = parseBsDokument(readFileSync(pfad));
      // Identitäts-Gegenprobe Inventar ↔ Dokumentkopf (Dedupe-Schlüssel GN, §3.2).
      if (p.gn !== z.gn) throw new Error(`GN-Drift: Kopf «${p.gn}» ≠ Inventar «${z.gn}»`);
      if (p.datum !== z.datum) throw new Error(`Datums-Drift: Kopf «${p.datum}» ≠ Inventar «${z.datum}»`);
      geparst.push({ p, z });
    } catch (e) {
      fehler.push({ key: z.key, gn: z.gn, grund: e instanceof Error ? e.message : String(e) });
    }
  }

  // Parser-Report (§3.5): Erfolgsquote + Struktur-Verteilung.
  const quellen = { klassen: 0, marker: 0, flach: 0 };
  for (const { p } of geparst) quellen[p.strukturQuelle]++;
  console.log(`[bs-parse] ${geparst.length}/${eintraege.length} geparst — Struktur: klassen ${quellen.klassen} · marker ${quellen.marker} · flach ${quellen.flach} · Fehler ${fehler.length}`);
  if (fehler.length) {
    writeFileSync(join(BS_DATEN, 'parse-fehler.json'), JSON.stringify(fehler, null, 1) + '\n', 'utf8');
    for (const f of fehler.slice(0, 15)) console.error(`[bs-parse]   ${f.gn} (key ${f.key}): ${f.grund}`);
    throw new Error(`[bs-parse] ${fehler.length} Dokumente unparsebar — daten/bs-fiw/parse-fehler.json (Count-Gate G1 wäre rot).`);
  }

  // docketSafe-Vergabe je (court, GN)-Gruppe (Kollisionsregel §3.2).
  const gruppen = new Map<string, Array<{ p: ParseErgebnis; z: InventarZeile }>>();
  for (const g of geparst) {
    const k = `${g.p.court}/${g.p.gn}`;
    (gruppen.get(k) ?? (gruppen.set(k, []), gruppen.get(k)!)).push(g);
  }
  let mehrfach = 0;
  const snaps: EntscheidSnapshot[] = [];
  for (const gruppe of gruppen.values()) {
    if (gruppe.length > 1) mehrfach++;
    const safes = docketSafeVergabe(gruppe);
    for (const { p, z } of gruppe) {
      snaps.push(baueSnapshot(p, z, safes.get(z.key)!, cp[String(z.key)]?.abgerufen ?? datum));
    }
  }
  console.log(`[bs-parse] ${snaps.length} Snapshots (davon ${mehrfach} GNs mit Mehrfach-Dokumenten)`);

  // Deterministische Ordnung (§2): id aufsteigend.
  snaps.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  // Leer-Guard (§6): nie den Bestand durch einen leeren Lauf entwerten.
  if (!snaps.length) { console.log('[bs-parse] 0 Snapshots — Korpus unberührt.'); return; }

  // Bestand additiv: alle Nicht-BS-Snapshots byte-treu von der Platte + BS neu.
  // (Frühere BS-Einträge werden ersetzt/entfernt — Delta-/Takedown-Semantik §5.4.)
  // Gegenprüfungs-Auflage PR #818: ein legitimer Takedown (BS zieht einen Entscheid
  // zurück, `snaps.length` < vorherige BS-Zahl) lässt `[...bestand, ...snaps]` unter
  // den committeten Bestand fallen — die Bestandszahl-Sperre in `schreibeKorpus`
  // wirft dann bewusst (mit Abgangs-Liste im Log) und braucht `LEXMETRIK_ERLAUBE_
  // ABGANG=1`, das kein Workflow automatisch setzt. Gewollter manueller Stolperstein
  // (keine stille Löschung mehr), kein Deadlock: den Lauf mit dem Flag wiederholen.
  const bestand = ladeBestandSnapshots().filter((s) => s.quelle !== 'gerichte-bs');
  const res = schreibeKorpus([...bestand, ...snaps], datum);
  const proGericht = snaps.reduce((m, s) => ((m[s.gericht] = (m[s.gericht] ?? 0) + 1), m), {} as Record<string, number>);
  console.log(`[bs-parse] geschrieben: ${res.anzahl} Manifest-Einträge (Bestand ${bestand.length} + BS ${snaps.length}: ${Object.entries(proGericht).map(([k, v]) => `${k}:${v}`).join(' ')})`);
}

// ─── Nachtrag Kopf-Datum (B-1): nur die datumlosen Dokumente, gezielt ────────
//
// WARUM EIN EIGENER LAUF und kein Vollimport: `daten/bs-fiw/raw/` ist nicht
// eingecheckt; ein Voll-Reparse hinge am Abruf aller 3'765 Rohdokumente. Der
// Nachtrag braucht nur die Rohdateien der Inventar-Einträge OHNE Metadaten-Datum
// (bs-import holt genau diese vorher, `--kopfdatum-nachtrag`).
//
// WAS ER ÄNDERT — und was er beweist, bevor er es tut (§6/§7): je Dokument wird
// der Snapshot mit derselben Regel wie im Vollimport neu gebaut (`baueSnapshot`,
// gleicher docketSafe wie im Bestand). Übernommen werden AUSSCHLIESSLICH `datum`,
// `zitierung`, `datumUnbekannt` und `abgerufen`. Harte Vorbedingung: identische
// id und identischer Text-`sha` — ist das Portal-Dokument inzwischen ein anderes,
// bricht der Lauf ab, statt ein neues Datum auf einen alten Text zu setzen.
// Alle übrigen Felder (normKeys, Besetzung, …) bleiben byte-treu.
export function nachtragKopfdatum(inventar: Inventar, datum: string): { datiert: string[]; weiterUnbekannt: string[] } {
  const bestand = ladeBestandSnapshots();
  const proKey = new Map<number, number>();
  bestand.forEach((s, i) => {
    if (s.quelle !== 'gerichte-bs') return;
    const m = /nF30_KEY=(\d+)/.exec(s.quelleUrl);
    if (m) proKey.set(Number(m[1]), i);
  });
  const datiert: string[] = [];
  const weiterUnbekannt: string[] = [];
  for (const z of inventar.eintraege) {
    if (z.datum) continue;
    const pfad = rawPfad(z.key);
    if (!existsSync(pfad)) throw new Error(`[kopfdatum] Rohdatei fehlt: ${z.gn} (key ${z.key}) — zuerst holen.`);
    const p = parseBsDokument(readFileSync(pfad));
    if (p.gn !== z.gn) throw new Error(`[kopfdatum] GN-Drift: Kopf «${p.gn}» ≠ Inventar «${z.gn}»`);
    if (p.datum !== z.datum) throw new Error(`[kopfdatum] ${z.gn}: Portal trägt jetzt ein Metadaten-Datum (${p.datum}) — Vollimport statt Nachtrag.`);
    const i = proKey.get(z.key);
    if (i === undefined) throw new Error(`[kopfdatum] ${z.gn} (key ${z.key}) nicht im Bestand.`);
    const alt = bestand[i];
    const neu = baueSnapshot(p, z, alt.id.slice(alt.id.lastIndexOf('/') + 1), datum);
    if (neu.id !== alt.id) throw new Error(`[kopfdatum] ${z.gn}: id-Drift ${alt.id} → ${neu.id}`);
    if (neu.sha !== alt.sha) throw new Error(`[kopfdatum] ${z.gn}: Text-sha weicht vom Bestand ab — Dokument geändert, Vollimport statt Nachtrag.`);
    if (neu.datumUnbekannt) { weiterUnbekannt.push(alt.id); continue; }
    const patch: EntscheidSnapshot = { ...alt, zitierung: neu.zitierung, datum: neu.datum, abgerufen: neu.abgerufen };
    delete patch.datumUnbekannt;
    bestand[i] = patch;
    datiert.push(`${alt.id} ${neu.datum}`);
  }
  if (datiert.length) schreibeKorpus(bestand, datum);
  console.log(`[kopfdatum] ${datiert.length} datiert, ${weiterUnbekannt.length} weiterhin ohne Datum (ehrlich datumUnbekannt).`);
  for (const d of datiert) console.log(`[kopfdatum]   ${d}`);
  return { datiert, weiterUnbekannt };
}
