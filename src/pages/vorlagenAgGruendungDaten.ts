import type { EinlageArt, Phase } from '../lib/gruendungsunterlagen';
import type { PdfBanner } from '../lib/vorlagen/banner';
import {
  AG_DOK_DEFAULTS, AG_FREMDWAEHRUNGEN,
  type AgBereich, type AgDokAntworten, type AgVrZeichnungsArt, type AgVertretungsZeichnungsArt,
  type AgGruenderZeile, type AgVrZeile, type AgVertretungsZeile, type AgSacheinlageZeile,
  type AgVerrechnungZeile, type AgVorteilZeile, type AgWaehrung,
} from '../lib/vorlagen/gruendungAgDokumente';
import { KANTONE } from '../lib/kantone';

// §6-Datei-Schlankheit (19.6.2026): module-level Konstanten, Hydrations-Helfer und
// Leer-Defaults aus VorlageAgGruendung.tsx ausgelagert (verhaltensneutral).

export const SCHRITTE = [
  { id: 'konstellation', label: 'Konstellation' },
  { id: 'gesellschaft', label: 'Gesellschaft & Statuten' },
  { id: 'kapital', label: 'Kapital & Einlagen' },
  { id: 'personen', label: 'Personen & Organe' },
  { id: 'weiteres', label: 'Domizil & Optionen' },
  { id: 'dokumente', label: 'Checkliste & Dokumente' },
] as const;

export const PHASEN: { id: Phase; titel: string; lead: string }[] = [
  { id: 'vorbereitung', titel: '1 · Vor dem Notariatstermin', lead: 'Beschaffen bzw. erstellen — die Urkundsperson muss diese Belege beim Termin vorliegen haben (Art. 631 OR).' },
  { id: 'beurkundung', titel: '2 · Beurkundung', lead: 'Entsteht beim Notariat; Wahlannahmen können direkt in der Urkunde erklärt werden.' },
  { id: 'anmeldung', titel: '3 · Handelsregister-Anmeldung', lead: 'Einreichung aller Belege nach Art. 43 HRegV.' },
  { id: 'nachEintrag', titel: '4 · Nach dem Eintrag', lead: 'Pflichten ab Rechtspersönlichkeit (Art. 643 OR).' },
];

export const ERSTELLER_LABEL = { gruender: 'Gründer:innen', notariat: 'Notariat', bank: 'Bank', revisor: 'Revisor:in' } as const;

export const CHF = new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 0 });

// Praxis-Runde (Auftrag David): Blocker sind klickbar und führen zum
// Schritt, in dem die Eingabe liegt (Bereichs-Tag aus der Engine, §3).
export const BEREICH_SCHRITT: Record<AgBereich, number> = {
  konstellation: 0, gesellschaft: 1, kapital: 2, personen: 3, weiteres: 4,
};

export const BANNER_ENTWURF: PdfBanner = {
  titel: 'ENTWURF – KEIN GÜLTIGES DOKUMENT',
  // Praxis-Runde: Text deckt ALLE Entwurfs-Dokumente der Mappe (auch
  // Nachtrag und Sacheinlagevertrag mit Grundstück), nicht nur
  // Statuten/Errichtungsakt.
  text: 'Vorbereitung für die Urkundsperson: Statuten werden notariell beglaubigt (Art. 22 Abs. 4 HRegV); Errichtungsakt, Nachtrag und Sacheinlageverträge mit Grundstücken bedürfen der öffentlichen Beurkundung (Art. 629 Abs. 1 und Art. 634 Abs. 2 OR).',
};

// D14: VR-Mitglieder können «ohne Zeichnungsberechtigung» sein (Gate: mind.
// eines vertretungsbefugt, Art. 718 Abs. 3 OR); weitere Zeichnungsberechtigte
// zusätzlich mit Kollektivprokura (ZH-Muster-Protokoll).
export const VR_ZEICHNUNGS_OPTIONEN: { id: AgVrZeichnungsArt; label: string }[] = [
  { id: 'einzelunterschrift', label: 'Einzelunterschrift' },
  { id: 'kollektivzuzweien', label: 'Kollektivunterschrift zu zweien' },
  { id: 'ohne', label: 'ohne Zeichnungsberechtigung' },
];
export const VERTRETUNGS_ZEICHNUNGS_OPTIONEN: { id: AgVertretungsZeichnungsArt; label: string }[] = [
  { id: 'einzelunterschrift', label: 'Einzelunterschrift' },
  { id: 'kollektivzuzweien', label: 'Kollektivunterschrift zu zweien' },
  { id: 'kollektivprokura', label: 'Kollektivprokura zu zweien' },
];

// ─── Punkt 7 (Perfektion): lokale Zwischenspeicherung ────────────────────────
// Versioniertes JSON unter EINEM Schlüssel; Hydration mit Normalisieren-
// Guards je Feld (Wizard-PFLICHT-Konvention: je Zeile fehlende Felder mit
// Defaults auffüllen, falsche Typen verwerfen — nie ungeprüft in den State).
export const STORAGE_KEY = 'lexmetrik:ag-gruendung:v1';

const txt = (v: unknown, def: string) => (typeof v === 'string' ? v : def);
const bool = (v: unknown, def: boolean) => (typeof v === 'boolean' ? v : def);
const wahl = <T extends string>(v: unknown, erlaubt: readonly T[], def: T): T =>
  typeof v === 'string' && (erlaubt as readonly string[]).includes(v) ? (v as T) : def;

/** Array-Hydration: nur Objekt-Zeilen übernehmen, je Feld der Vorlage den
 *  gespeicherten Wert nur bei passendem Typ (Wahl-Felder nur bei erlaubtem
 *  Wert) — sonst Default; keys werden NEU vergeben (1…n je Liste). */
function zeilenGuard<T extends Record<string, string | boolean | undefined>>(
  roh: unknown,
  vorlage: Required<T>,
  wahlFelder: Partial<Record<keyof T, readonly string[]>> = {},
): (T & { key: number })[] {
  if (!Array.isArray(roh)) return [];
  return roh
    .filter((z): z is Record<string, unknown> => z !== null && typeof z === 'object' && !Array.isArray(z))
    .map((z, i) => {
      const zeile: Record<string, string | boolean | number | undefined> = { ...vorlage, key: i + 1 };
      for (const feld of Object.keys(vorlage)) {
        const wert = z[feld];
        const erlaubt = wahlFelder[feld];
        if (erlaubt) {
          if (typeof wert === 'string' && (erlaubt as readonly string[]).includes(wert)) zeile[feld] = wert;
        } else if ((typeof wert === 'string' || typeof wert === 'boolean') && typeof wert === typeof vorlage[feld]) {
          zeile[feld] = wert;
        }
      }
      return zeile as unknown as T & { key: number };
    });
}

// ─── D6 (QS-CODE-ENTDOPPLUNG, 4.8.2026): EIN Zustands-Objekt statt 70 useState ─
// Die Maske hängt an useWizardState (geteilter Rahmen von 24 anderen Seiten);
// AgStand ist ihr vollständiger persistierter Zustand. migriereAgStand ist die
// Hydrations-Wahrheit: sie liest das ALTE Speicherformat {v:1, stand:{…}}
// verlustfrei weiter (Entwürfe bleiben erhalten), verwirft fremde Versionen
// (v ≠ 1 → Defaults, wie ladeStand zuvor) und wendet je Feld dieselben
// Typ-Guards an wie die früheren Einzel-Initializer. Neu geschrieben wird
// flach (useWizardState-Format). Orakel: agGruendungHydration.test.tsx.

export interface AgStand {
  einlageArt: EinlageArt; besondereVorteile: boolean; optingOut: boolean;
  eigeneBueros: boolean; immobilienHauptzweck: boolean; inhaberaktien: boolean;
  fremdwaehrung: boolean; bankInUrkunde: boolean; chVertretung: boolean; leistungen: string;
  firma: string; sitz: string; kanton: string; zweck: string; zweckErweiterung: boolean;
  statutenUmfang: AgDokAntworten['statutenUmfang']; vinkulierung: boolean; virtuelleGv: boolean;
  inhaberKotiert: boolean; verwahrungsstelle: string;
  schiedsklausel: boolean; schiedsOrt: string; kapitalband: boolean;
  kbUntergrenze: string; kbObergrenze: string; kbEndeDatum: string;
  kbRichtung: AgDokAntworten['kbRichtung']; bedingtesKapital: boolean; bkBetrag: string; bkKreis: string;
  stichentscheidGv: boolean; gjErstesEnde: string; gjBeginn: string; gjEnde: string;
  ak: string; anzahl: string; nennwert: string; liberierung: string; ausgabebetrag: string;
  waehrung: AgWaehrung; kursChf: string; kursQuelle: string; bankName: string; bankOrt: string;
  sacheinlagen: (AgSacheinlageZeile & { key: number })[];
  verrechnungen: (AgVerrechnungZeile & { key: number })[];
  vorteile: (AgVorteilZeile & { key: number })[];
  revisorName: string;
  gruender: (AgGruenderZeile & { key: number })[];
  vr: (AgVrZeile & { key: number })[];
  vertretungen: (AgVertretungsZeile & { key: number })[];
  protokollfuehrer: string; sitzungBeginn: string; sitzungEnde: string; rsName: string; rsSitz: string;
  rechtsdomizil: string; domizilhalterName: string; domizilhalterAdresse: string;
  konstituierungInUrkunde: boolean; domizilNurAnmeldung: boolean; nachtragsbevollmaechtigter: string;
  lkAusland: boolean; lkNeuerwerb: boolean; lkGrundstueck: boolean;
  nachtragAktiv: boolean; ntGruendungsdatum: string; ntUrkundeZiffer: string; ntUrkundeText: string;
  ntStatutenArtikel: string; ntStatutenAbsatz: string; ntStatutenText: string;
  ort: string; datum: string;
}

/** Frische Defaults — identisch zu den früheren useState-Initialwerten.
 *  Datum: «heute» in LOKALER Zeit (E2-1, toLocaleDateString 'sv-SE'). */
export function agStandDefaults(): AgStand {
  return {
    einlageArt: 'bar', besondereVorteile: false, optingOut: true,
    eigeneBueros: true, immobilienHauptzweck: false, inhaberaktien: false,
    fremdwaehrung: false, bankInUrkunde: true, chVertretung: true, leistungen: '',
    firma: '', sitz: '', kanton: 'ZH', zweck: '', zweckErweiterung: true,
    statutenUmfang: 'kurz', vinkulierung: false, virtuelleGv: false,
    inhaberKotiert: false, verwahrungsstelle: '',
    schiedsklausel: false, schiedsOrt: '', kapitalband: false,
    kbUntergrenze: '', kbObergrenze: '', kbEndeDatum: '',
    kbRichtung: 'erhoehen', bedingtesKapital: false, bkBetrag: '', bkKreis: '',
    stichentscheidGv: true, gjErstesEnde: '', gjBeginn: AG_DOK_DEFAULTS.gjBeginn, gjEnde: AG_DOK_DEFAULTS.gjEnde,
    ak: AG_DOK_DEFAULTS.aktienkapitalChf, anzahl: AG_DOK_DEFAULTS.anzahlAktien,
    nennwert: AG_DOK_DEFAULTS.nennwertChf, liberierung: AG_DOK_DEFAULTS.liberierungProzent,
    ausgabebetrag: '', waehrung: 'EUR', kursChf: '', kursQuelle: '', bankName: '', bankOrt: '',
    sacheinlagen: [], verrechnungen: [], vorteile: [], revisorName: '',
    gruender: [], vr: [], vertretungen: [],
    protokollfuehrer: '', sitzungBeginn: '', sitzungEnde: '', rsName: '', rsSitz: '',
    rechtsdomizil: '', domizilhalterName: '', domizilhalterAdresse: '',
    konstituierungInUrkunde: false, domizilNurAnmeldung: false, nachtragsbevollmaechtigter: '',
    lkAusland: false, lkNeuerwerb: false, lkGrundstueck: false,
    nachtragAktiv: false, ntGruendungsdatum: '', ntUrkundeZiffer: '', ntUrkundeText: '',
    ntStatutenArtikel: '', ntStatutenAbsatz: '', ntStatutenText: '',
    ort: '', datum: new Date().toLocaleDateString('sv-SE'),
  };
}

/** Hydrations-/Migrations-Guard für useWizardState (siehe Kopfkommentar). */
export function migriereAgStand(geladen: AgStand): AgStand {
  const roh = geladen as unknown as Record<string, unknown>;
  let q: Record<string, unknown>;
  if ('stand' in roh || 'v' in roh) {
    // Alt-Format: nur v === 1 mit Objekt-stand wird übernommen (wie ladeStand).
    q = roh.v === 1 && roh.stand !== null && typeof roh.stand === 'object' && !Array.isArray(roh.stand)
      ? (roh.stand as Record<string, unknown>)
      : {};
  } else {
    q = roh; // flaches useWizardState-Format (bereits mit Defaults gemerged)
  }
  const d = agStandDefaults();
  return {
    einlageArt: wahl(q.einlageArt, ['bar', 'sacheinlage', 'verrechnung', 'gemischt'], d.einlageArt),
    besondereVorteile: bool(q.besondereVorteile, d.besondereVorteile),
    optingOut: bool(q.optingOut, d.optingOut),
    eigeneBueros: bool(q.eigeneBueros, d.eigeneBueros),
    immobilienHauptzweck: bool(q.immobilienHauptzweck, d.immobilienHauptzweck),
    inhaberaktien: bool(q.inhaberaktien, d.inhaberaktien),
    fremdwaehrung: bool(q.fremdwaehrung, d.fremdwaehrung),
    bankInUrkunde: bool(q.bankInUrkunde, d.bankInUrkunde),
    chVertretung: bool(q.chVertretung, d.chVertretung),
    leistungen: txt(q.leistungen, d.leistungen),
    firma: txt(q.firma, d.firma), sitz: txt(q.sitz, d.sitz),
    kanton: wahl(q.kanton, KANTONE, 'ZH'),
    zweck: txt(q.zweck, d.zweck), zweckErweiterung: bool(q.zweckErweiterung, d.zweckErweiterung),
    statutenUmfang: wahl(q.statutenUmfang, ['kurz', 'lang'], d.statutenUmfang),
    vinkulierung: bool(q.vinkulierung, d.vinkulierung), virtuelleGv: bool(q.virtuelleGv, d.virtuelleGv),
    inhaberKotiert: bool(q.inhaberKotiert, d.inhaberKotiert),
    verwahrungsstelle: txt(q.verwahrungsstelle, d.verwahrungsstelle),
    schiedsklausel: bool(q.schiedsklausel, d.schiedsklausel), schiedsOrt: txt(q.schiedsOrt, d.schiedsOrt),
    kapitalband: bool(q.kapitalband, d.kapitalband),
    kbUntergrenze: txt(q.kbUntergrenze, d.kbUntergrenze), kbObergrenze: txt(q.kbObergrenze, d.kbObergrenze),
    kbEndeDatum: txt(q.kbEndeDatum, d.kbEndeDatum),
    kbRichtung: wahl(q.kbRichtung, ['erhoehen', 'beide'], d.kbRichtung),
    bedingtesKapital: bool(q.bedingtesKapital, d.bedingtesKapital),
    bkBetrag: txt(q.bkBetrag, d.bkBetrag), bkKreis: txt(q.bkKreis, d.bkKreis),
    stichentscheidGv: bool(q.stichentscheidGv, d.stichentscheidGv),
    gjErstesEnde: txt(q.gjErstesEnde, d.gjErstesEnde),
    gjBeginn: txt(q.gjBeginn, d.gjBeginn), gjEnde: txt(q.gjEnde, d.gjEnde),
    ak: txt(q.ak, d.ak), anzahl: txt(q.anzahl, d.anzahl), nennwert: txt(q.nennwert, d.nennwert),
    liberierung: txt(q.liberierung, d.liberierung), ausgabebetrag: txt(q.ausgabebetrag, d.ausgabebetrag),
    waehrung: wahl(q.waehrung, AG_FREMDWAEHRUNGEN, 'EUR'),
    kursChf: txt(q.kursChf, d.kursChf), kursQuelle: txt(q.kursQuelle, d.kursQuelle),
    bankName: txt(q.bankName, d.bankName), bankOrt: txt(q.bankOrt, d.bankOrt),
    sacheinlagen: zeilenGuard<AgSacheinlageZeile>(q.sacheinlagen, SACHEINLAGE_LEER, { typ: ['sachgesamtheit', 'geschaeft'] }),
    verrechnungen: zeilenGuard<AgVerrechnungZeile>(q.verrechnungen, VERRECHNUNG_LEER),
    vorteile: zeilenGuard<AgVorteilZeile>(q.vorteile, VORTEIL_LEER),
    revisorName: txt(q.revisorName, d.revisorName),
    gruender: zeilenGuard<AgGruenderZeile>(q.gruender, GRUENDER_LEER),
    vr: zeilenGuard<AgVrZeile>(q.vr, VR_LEER, { zeichnungsArt: VR_ZEICHNUNGS_OPTIONEN.map((o) => o.id) }),
    vertretungen: zeilenGuard<AgVertretungsZeile>(q.vertretungen, VERTRETUNG_LEER, { zeichnungsArt: VERTRETUNGS_ZEICHNUNGS_OPTIONEN.map((o) => o.id) }),
    protokollfuehrer: txt(q.protokollfuehrer, d.protokollfuehrer),
    sitzungBeginn: txt(q.sitzungBeginn, d.sitzungBeginn), sitzungEnde: txt(q.sitzungEnde, d.sitzungEnde),
    rsName: txt(q.rsName, d.rsName), rsSitz: txt(q.rsSitz, d.rsSitz),
    rechtsdomizil: txt(q.rechtsdomizil, d.rechtsdomizil),
    domizilhalterName: txt(q.domizilhalterName, d.domizilhalterName),
    domizilhalterAdresse: txt(q.domizilhalterAdresse, d.domizilhalterAdresse),
    konstituierungInUrkunde: bool(q.konstituierungInUrkunde, d.konstituierungInUrkunde),
    domizilNurAnmeldung: bool(q.domizilNurAnmeldung, d.domizilNurAnmeldung),
    nachtragsbevollmaechtigter: txt(q.nachtragsbevollmaechtigter, d.nachtragsbevollmaechtigter),
    lkAusland: bool(q.lkAusland, d.lkAusland), lkNeuerwerb: bool(q.lkNeuerwerb, d.lkNeuerwerb),
    lkGrundstueck: bool(q.lkGrundstueck, d.lkGrundstueck),
    nachtragAktiv: bool(q.nachtragAktiv, d.nachtragAktiv),
    ntGruendungsdatum: txt(q.ntGruendungsdatum, d.ntGruendungsdatum),
    ntUrkundeZiffer: txt(q.ntUrkundeZiffer, d.ntUrkundeZiffer),
    ntUrkundeText: txt(q.ntUrkundeText, d.ntUrkundeText),
    ntStatutenArtikel: txt(q.ntStatutenArtikel, d.ntStatutenArtikel),
    ntStatutenAbsatz: txt(q.ntStatutenAbsatz, d.ntStatutenAbsatz),
    ntStatutenText: txt(q.ntStatutenText, d.ntStatutenText),
    ort: txt(q.ort, d.ort),
    // Punkt 7: Datum-Default «heute» NUR, wenn kein gespeicherter Wert vorliegt
    // (leerer String zählt wie zuvor als «kein Wert»).
    datum: txt(q.datum, '') || d.datum,
  };
}

const GRUENDER_LEER: Required<AgGruenderZeile> = { name: '', angaben: '', anzahl: '', liberierung: '' };
const VR_LEER: Required<AgVrZeile> = {
  name: '', herkunft: '', wohnort: '', adresse: '', praesident: false,
  zeichnungsArt: 'einzelunterschrift', annahmeInUrkunde: false,
};
const VERTRETUNG_LEER: Required<AgVertretungsZeile> = { name: '', funktion: '', zeichnungsArt: 'kollektivzuzweien' };
const SACHEINLAGE_LEER: Required<AgSacheinlageZeile> = {
  typ: 'sachgesamtheit', bezeichnung: '', belegDatum: '', wertChf: '', grundstueck: false,
  einlegerName: '', aktienAnzahl: '', gutschriftChf: '', zustand: '',
  imHrEingetragen: false, cheNr: '', aktivenChf: '', passivenChf: '', rueckwirkungDatum: '',
};
const VERRECHNUNG_LEER: Required<AgVerrechnungZeile> = { glaeubigerName: '', forderungChf: '', aktienAnzahl: '', begruendungTxt: '' };
const VORTEIL_LEER: Required<AgVorteilZeile> = { beguenstigter: '', inhalt: '', wertChf: '', begruendungTxt: '' };
