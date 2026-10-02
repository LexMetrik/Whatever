// Tarif-TEXT-Aufbereitung des Normtext-Artikels: reine Zeichenketten-Funktionen
// ohne JSX. Eigenes Modul, weil eine Datei nicht Komponenten UND Hilfsfunktionen
// exportieren darf (eslint react-refresh/only-export-components) — Muster wie
// wortverbinder.ts. Aus ArtikelBody.tsx ausgelagert (verhaltensneutral, §6);
// reine Darstellung (§3), der Wortlaut wird nie erzeugt oder geaendert.

import { gruppiereTausender } from '../../lib/normtext/darstellung';

// Eigene Gliederungsabschnitte im Fliesstext: « — ab) …», « — 2. …» (Tabellenzeilen,
// die der Adapter als « — »-getrennte Abschnitte abgelegt hat, BS-952.200 § 22).
const EIGENE_GLIEDERUNG = /\s—\s(?:\p{Ll}{1,2}\)|\d{1,2}\.)\s/u;
const BAND_ANFANG = /^(?:vom Mehrbetrag über|plus \d)/;
// Schnitt vor «plus N» / «vom Mehrbetrag über» — ausser «vom Mehrbetrag über» steht
// direkt hinter «plus N ‰/%»: dann ist es ein Band und wird wieder angehängt.
function bandStuecke(text: string): string[] {
  const aus: string[] = [];
  for (const t of text.split(/(?=vom Mehrbetrag über|plus \d)/)) {
    if (t.startsWith('vom Mehrbetrag über') && aus.length > 0 && /plus \d[\d.,']*\s?[‰%]\s$/.test(aus[aus.length - 1])) aus[aus.length - 1] += t;
    else aus.push(t);
  }
  return aus;
}

// Tarif-Staffel-Tabelle (z. B. ZH GebV OG § 4) landet aus dem PDF-Snapshot als
// EIN Fliesstext-Block («… bis 1000 25 % … über 1000 bis 5000 250 …»), weil die
// PDF-Spalten beim Extrahieren verschmelzen. Rein für die DARSTELLUNG (§3, Text
// unverändert) zerlegen wir solche Staffeln in Zeilen je Streitwert-Band —
// deutlich lesbarer als der eine Blob. Bewusst ENG getriggert (Fee-Table-Marker
// + mindestens zwei «über N»-Bänder), damit normale Absätze nie zerschnitten
// werden. Bandgrenze: «über <Zahl>» — das nachfolgende « <Ziffer>» grenzt sauber
// gegen «übersteigenden» ab (dort folgt kein « Ziffer»). KEINE \b-Wortgrenze:
// Umlaute zählen in JS-Regex nicht als \w, «\büber» würde nie matchen. Die erste
// Zeile (Kopf + erstes Band) wird vor «bis <Zahl>» getrennt.
export function staffelZeilen(text: string): string[] | null {
  // (1) Gerichtsgebühren-Staffel «über N …» (ZH GebV OG § 4-Stil).
  //     W2·17 E-D4-B01: NICHT bei Texten, die ihre Zeilen schon selbst gliedern
  //     («… CHF: 300 — ab) über 30,00 m · … — ac) vorderer Überhang über 3,00 m»,
  //     BS-952.200 § 22: Tabellenzeilen als « — »-getrennte Gliederungsabschnitte).
  //     Ein Schnitt vor «über N» schöbe dort die Litera + Bezeichnung der NÄCHSTEN
  //     Position ans Ende der VORIGEN Zeile — falsch zugeordnete Gliederung (§1).
  //     Solche Texte bleiben Fliesstext (Wortlaut unverändert).
  if (/zuzügl\.|Grundgebühr|betragen/.test(text) && !EIGENE_GLIEDERUNG.test(text) && (text.match(/über \d/g) ?? []).length >= 2) {
    const zeilen = text
      .split(/(?=über \d)/)
      .flatMap((s, i) => (i === 0 ? s.split(/(?=bis \d)/) : [s]))
      .map((s) => s.trim())
      .filter(Boolean);
    if (zeilen.length >= 3) return zeilen;
  }
  // (2) Anhang-Tarif-Staffel mit «–»-Bändern (ZH NotGebV-Anhang-Stil:
  //     «… –höchstens 1 Jahr im Rahmen von 100–1000 –mehr als 1 Jahr …»). Mehrere
  //     « –<Wort>»-Bänder mit Gebühren-Marke (‰ / «im Rahmen von» / Fr.). Jedes
  //     Band auf eine eigene Zeile; der Teil vor dem ersten «–» bleibt Kopf.
  //     ENG getriggert (≥2 Bänder + Marke), damit normale Absätze nie zerschnitten
  //     werden. Rein Darstellung (§3) — der Text bleibt unverändert.
  const baender = text.match(/ –\p{L}/gu) ?? [];
  if (baender.length >= 2 && /‰|im Rahmen von|Fr\./.test(text)) {
    const zeilen = text.split(/(?= –\p{L})/u).map((s) => s.trim()).filter(Boolean);
    if (zeilen.length >= 3) return zeilen;
  }
  // (3) Prozent-/Promille-Staffel mit «vom Mehrbetrag über …» (Notariats-/
  //     Grundbuchtarife, z. B. BS Notariatstarif: «… bis CHF 2 Mio. 0,25%, vom
  //     Mehrbetrag über CHF 2 Mio. 0,2%, vom Mehrbetrag über 5 Mio. 0,1% …»).
  //     NUR Zeilenumbrüche an den Band-Markern «vom Mehrbetrag über» bzw.
  //     «plus N ‰/%» — der WORTLAUT bleibt unverändert (kein Ziffern-Trennen,
  //     §1), darum risikolos. ENG: Tarif-Marke (‰/Promille/Mehrbetrag) + ≥2 Bänder.
  //     W2·17 E-D4-B02: «plus N ‰ vom Mehrbetrag über …» ist EIN Band — der Schnitt
  //     liegt vor «plus», nicht zusätzlich vor dem direkt folgenden «vom Mehrbetrag»
  //     (OW-213.61 § 6: sonst «plus 1 ‰» allein in einer Zeile; LU-3870 § 29 lit. d
  //     tabelliert, die gleich gebauten lit. b/c nicht).
  if (/‰|promille|mehrbetrag/i.test(text)) {
    const baender = bandStuecke(text);
    if (baender.filter((s) => BAND_ANFANG.test(s)).length >= 2) {
      const zeilen = baender.map((s) => s.trim()).filter(Boolean);
      if (zeilen.length >= 3) return zeilen;
    }
  }
  return null;
}

// Tarif-/Anhang-Text aus PDF-Spalten verschmilzt Wort und Zahl ohne das Trenn-
// Leerzeichen («Allgemeinen1.1.1», «Verkehrswert1‰», «mindestens100», «1‰4.1»).
// Rein für die DARSTELLUNG (§3): das vom PDF verschluckte Leerzeichen zwischen
// Buchstabe↔Ziffer bzw. ‰↔Ziffer wieder einfügen. Der WORTLAUT bleibt unangetastet
// — es wird NUR ein fehlendes Trenn-Leerzeichen ergänzt, kein Zeichen geändert,
// entfernt oder umgestellt (Freigabe David 17.6.2026: Darstellung darf normalisiert
// werden, solange der Wortlaut nicht angefasst wird).
export function normalisiereTarifText(text: string): string {
  // W2·17 E-D1-B03/E-D4-B05: Formeln/Einheiten bleiben wortgleich — «CO2», «PM10»,
  // «NO2» (1–2 Versalien + Ziffer), «m2»/«cm2»/«km2». «CO2-Emissionsrechte»
  // (BS-786.310 § 4.2.2) wurde sonst zu «CO 2-Emissionsrechte» (Zeichen verschoben, §1).
  // Die PDF-Verschmelzungen des Tarif-Textes («Allgemeinen1.1.1», «mindestens100»)
  // haben Kleinbuchstaben-Wörter vor der Ziffer und werden weiter getrennt.
  return text
    .replace(/(\p{L}+)(\d)/gu, (m, wort: string, z: string) =>
      /^(?:\p{Lu}{1,2}|[ck]?m)$/u.test(wort) ? m : `${wort} ${z}`)
    .replace(/(‰)(\d)/gu, '$1 $2')
    .replace(/ {2,}/g, ' ')
    .trim();
}

// ─── TABELLENZELLEN: Tausender-Apostroph nur auf Mengen, nie auf Jahre/Daten ───
// W2·17-UI-BEFUNDE E-D4-B03/B04 (1.10.2026). `gruppiereTausender` setzt auf JEDEN
// ≥4-stelligen Ziffernlauf einen Apostroph — in Tabellenzellen entstanden so
// «31.01.2'022» (ERV Anh. 1, Spalte Referenzdatum), «1'994» (EAUE), «2'003 B»
// (Geltungsbereich-Tabellen), «8. März 1'960» (UVPV), «2'003/37/EG» (VTS) und
// «0,192'963 %» (BL-331 § 27ter, Nachkommastellen). Die Typisierung der Spalten
// (`zahl`) ist Sache der Extraktion; die Darstellung schützt die erkennbaren
// Fälle. Gruppierung ist reine Anzeige — ein ausgelassener Apostroph verfälscht
// nie den Wortlaut, ein erfundener schon.
const MONAT =
  '(?:Jan(?:uar)?|Feb(?:ruar)?|M(?:ä|ae)rz|Apr(?:il)?|Mai|Juni?|Juli?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Okt(?:ober)?|Nov(?:ember)?|Dez(?:ember)?|' +
  'janvier|f[ée]vrier|mars|avril|juin|juillet|ao[uû]t|septembre|octobre|novembre|d[ée]cembre|' +
  'gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|dicembre)';
const JAHR = '(?:1[5-9]\\d\\d|20\\d\\d)';
// Jede Regel hat zwei Gruppen: (Vorlauf, geschützter Lauf); der Vorlauf bleibt stehen.
const GESCHUETZT: RegExp[] = [
  new RegExp(`(\\d{1,2}\\.\\d{1,2}\\.)(${JAHR})(?!\\d)`, 'g'), // 31.01.2022
  new RegExp(`((?:^|[^\\p{L}])${MONAT}\\.?\\s+)(${JAHR})(?!\\d)`, 'giu'), // 8. März 1960 · 5 octobre 1961
  new RegExp(`()(${JAHR})(?=/\\d)`, 'g'), // 2003/37/EG
  new RegExp(`(\\d/)(${JAHR})(?!\\d)`, 'g'), // Nr. 167/2013
  new RegExp('(\\d,)(\\d{4,})', 'g'), // 0,192963 % — Nachkommastellen werden nie gruppiert
];
const PRIVAT = 0xe000; // Private-Use-Ziffern: für gruppiereTausender keine Ziffern
const maskiere = (s: string): string => s.replace(/\d/g, (d) => String.fromCharCode(PRIVAT + Number(d)));
const entmaskiere = (s: string): string => s.replace(/[-]/g, (c) => String(c.charCodeAt(0) - PRIVAT));

/** `gruppiereTausender` für Tabellenzellen: Jahre in Datumsangaben, Rechtsakt-
 *  Nummern («2003/37/EG») und Nachkommastellen bleiben unberührt. */
export function gruppiereZelle(zelle: string): string {
  let s = zelle;
  for (const re of GESCHUETZT) s = s.replace(re, (_m, vor: string, lauf: string) => vor + maskiere(lauf));
  return entmaskiere(gruppiereTausender(s));
}

const JAHR_ZELLE = new RegExp(`^${JAHR}(?:\\s?\\p{L}{1,2}|\\*)?$`, 'u');
/** Spalte aus Jahreszahlen («1994», «2003 B»): mindestens zwei nicht leere Zellen,
 *  alle ein Jahr (optional mit Kürzel-Suffix) — dann wird nichts gruppiert. */
export function istJahrSpalte(zellen: string[]): boolean {
  const belegt = zellen.map((z) => z.trim()).filter((z) => z !== '');
  return belegt.length >= 2 && belegt.every((z) => JAHR_ZELLE.test(z));
}

/** Kopf einer Kennzahl-Spalte («Code», «Nr.»): Ziffern sind Bezeichner, keine Mengen. */
export const KENNZAHL_TITEL = /(?:^|\s)(?:code|codice|nr\.?|nummer|numéro|numero|n°)(?:\s|$)/i;

/** Ab dieser Länge ist eine Tabellenzelle Fliesstext und darf umbrechen (W2·17
 *  DFG-D01/D02, 2.10.2026). Darunter stehen Zahlen, Beträge, Daten, Bereiche und
 *  Kurzwörter («bis 1 000», «über 10 000 bis 100 000», «8. März 1960»), die nie
 *  mitten im Wert brechen (§N-4a). Reine Darstellung — kein Zellwortlaut ändert sich. */
export const PROSA_AB = 24;
export const istProsaZelle = (zelle: string): boolean => zelle.trim().length >= PROSA_AB;
