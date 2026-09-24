import type { VorlageSchema, Antworten } from './engine';
import { assemble } from './engine';
import type { Kanton } from '../../types/legal';
import { BEHOERDEN, behoerdeFuer, behoerdeAlsBlock, behoerdeManuellVollstaendig, type BehoerdeManuell } from './behoerden';
import { fmtDatumLang, fmtDatum, fmtCHF } from './datum';
import { ZPO_SCHWELLEN } from '../zustaendigkeit';
// LEBENDER Re-Export, kein Totcode: VorlageSchlichtungsgesuchBs.tsx bezieht
// fmtCHF zusammen mit den sg*-Funktionen aus GENAU diesem Modul (ein Import-
// Block statt zwei). Eine Totcode-Sichtung am 3.8.2026 hielt die Zeile für
// verwaist, weil sie nur die 15 Importe von './datum' zählte — die Seite
// importiert aber von hier. Vor dem Entfernen: `grep -rnE "\bfmtCHF\b" src/`.
export { fmtCHF } from './datum';

// ─── Schlichtungsgesuch nach Art. 202 ZPO – Kanton Basel-Stadt (Pilot) ──────
//
// Normverifizierte Implementierungs-Anweisung (Stand Juni 2026, ZPO-Fassung
// seit 1.1.2025). Alle zitierten ZPO-/OR-Anker wurden beim Build einmalig
// gegen das Fedlex-Filestore-HTML geprüft (artikelgenau auflösbar).
// Terminologie der Revision 2025: «Entscheidvorschlag» (nicht Urteilsvorschlag).
//
// Kein LLM, keine Text-API: reines regelbasiertes Zusammensetzen fester
// Bausteine über die generische Engine (assemble ist rein/deterministisch).

// ── Behörden-Stammdaten (Quelle: offizielle bs.ch-Seiten, Stand 2025/2026) ──
// PLZ-Vorbehalt Zivilgericht (Postfach 4001 vs. Paketpost 4051): siehe
// OFFENE_VERIFIKATIONEN – massgeblich sind die aktuellen bs.ch-Angaben.
const SCHLICHTUNGSBEHOERDEN_BS = {
  zivilgericht: {
    name: 'Schlichtungsbehörde des Zivilgerichts Basel-Stadt',
    // VOLLSTÄNDIGE Anschrift inkl. Hausnummer (Vorgabe 5.6.2026); amtlich
    // verifiziert am Staatskalender BS (Kanzlei Schlichtungsbehörde,
    // staatskalender.bs.ch, Stand 5.6.2026) – damit ist der frühere
    // PLZ-/Postfach-Vorbehalt aufgelöst.
    postadresse: ['Zivilgericht Basel-Stadt', 'Schlichtungsbehörde', 'Bäumleingasse 5', '4001 Basel'],
    schalterMuendlich: ['St. Alban-Vorstadt 25', '4052 Basel'], // Ausweichstandort (zu verifizieren)
    tel: '+41 61 267 81 81',
    adresseVerifiziert: true, // Staatskalender BS (≠ NormRef.verified — fachliche Norm-Abnahme)
  },
  miete: {
    name: 'Staatliche Schlichtungsstelle für Mietstreitigkeiten',
    // SSoT: Registry lib/vorlagen/behoerden.ts (Staatskalender BS, 5.6.2026)
    postadresse: [BEHOERDEN.schlichtungsstelle_miete.BS!.strasse, BEHOERDEN.schlichtungsstelle_miete.BS!.plzOrt],
    tel: '+41 61 267 85 21',
    email: 'ssm@bs.ch',
    paritaetisch: true, // Art. 200 Abs. 1 ZPO
    adresseVerifiziert: true, // Staatskalender BS (≠ NormRef.verified — fachliche Norm-Abnahme)
  },
  diskriminierung: {
    name: 'Kantonale Schlichtungsstelle für Diskriminierungsfragen',
    postadresse: [BEHOERDEN.schlichtungsstelle_diskriminierung.BS!.strasse, BEHOERDEN.schlichtungsstelle_diskriminierung.BS!.plzOrt], // SSoT-Registry (Altadresse Utengasse 36 überholt)
    tel: '+41 61 267 85 22',
    email: 'ksd@bs.ch',
    paritaetisch: true, // Art. 200 Abs. 2 ZPO
    kostenlos: true,
    adresseVerifiziert: true, // Staatskalender BS (≠ NormRef.verified — fachliche Norm-Abnahme)
  },
} as const;

// ── Schwellen (je mit Norm) ─────────────────────────────────────────────────
// Die ZUSTÄNDIGKEITS-Schwellen kommen aus der Engine (ZPO_SCHWELLEN, §5 SSoT —
// Konsolidierung gemäss ZUSTAENDIGKEIT-AUFTRAG.md §7; Werte unverändert,
// golden-bewiesen). SG-spezifische Schwellen (Kosten/Verfahrensablauf, andere
// Normen!) bleiben bewusst lokal — keine Fusion rechtlich verschiedener Regeln (§1).
export const SG_SCHWELLEN = {
  ENTSCHEID_AUF_ANTRAG: ZPO_SCHWELLEN.ENTSCHEID_AUF_ANTRAG,   // Art. 212 ZPO – Entscheid der Behörde (vermögensrechtlich)
  ENTSCHEIDVORSCHLAG: ZPO_SCHWELLEN.ENTSCHEIDVORSCHLAG,       // Art. 210 Abs. 1 lit. c ZPO (Revision 2025: vorher 5'000)
  VERZICHT_GEMEINSAM: ZPO_SCHWELLEN.VERZICHT_GEMEINSAM,       // Art. 199 Abs. 1 ZPO
  ARBEITSRECHT_KOSTENLOS: 30000,     // Art. 113 Abs. 2 lit. d / 114 lit. c ZPO; Dispens Art. 204 Abs. 3 — NICHT Art. 243 (zufällig gleicher Wert)
  ORDNUNGSBUSSE_MAX: 1000,           // Art. 206 Abs. 4 ZPO (neu; Androhung nötig)
  KLAGEBEWILLIGUNG_MONATE: 3,        // Art. 209 Abs. 3 ZPO
  KLAGEBEWILLIGUNG_MIETE_TAGE: 30,   // Art. 209 Abs. 4 ZPO (Miete/Pacht Wohn-/Geschäftsräume)
  ENTSCHEIDVORSCHLAG_ABLEHNUNG_TAGE: 20, // Art. 211 ZPO
} as const;

// Offene Verifikationen (in UI offenlegen, nicht raten) – Abschnitt 18 der Anweisung
export const SG_OFFENE_VERIFIKATIONEN: string[] = [
  'Kantonale Verweise (GOG BS SG 154.100, EG ZPO SG 221.100, GGR SG 154.810): §-Nummern noch nicht an der amtlichen Fassung bestätigt – verlinkt wird nur die Erlass-Seite.',
  'Behördenadressen: am Staatskalender BS nachgeprüft (Stand 5.6.2026) – bei Umzug/Sanierung nachführen; andere Kantone sind noch nicht hinterlegt (Registry lib/vorlagen/behoerden.ts).',
  'Randtitel «Art. 135 Ziff. 2 OR» vs. «Abs. 2»: Bezeichnung in amtlichen Formularen uneinheitlich.',
  'Bezifferung bereits im Schlichtungsstadium ist vertretbare Auslegung (streng erst für die Klage); unbezifferte Begehren nur über den Art.-85-Pfad.',
];

// Kantonale Erlass-Seiten (verifizierte Links; KEINE §-Anker – verified: false)
export const SG_KANTONALE_ERLASSE = [
  { label: 'GOG BS (SG 154.100)', url: 'https://www.gesetzessammlung.bs.ch/app/de/texts_of_law/154.100' },
  { label: 'EG ZPO BS (SG 221.100)', url: 'https://www.gesetzessammlung.bs.ch/app/de/texts_of_law/221.100' },
  { label: 'GGR BS (SG 154.810)', url: 'https://www.gesetzessammlung.bs.ch/app/de/texts_of_law/154.810' },
] as const;

// ── Eingabe-Datentypen ──────────────────────────────────────────────────────
export type PersonNatuerlich = { typ: 'natuerlich'; vorname: string; name: string; co?: string; strasse: string; plz: string; ort: string; land?: string };
type PersonJuristisch = { typ: 'juristisch'; firma: string; rechtsform?: string; uid?: string; sitzStrasse: string; sitzPlz: string; sitzOrt: string; zeichnungsberechtigt?: { name: string; funktion: string } };
export type SgPartei = PersonNatuerlich | PersonJuristisch;

type SgVertretung = { bezeichnung: string; zusatz?: string; strasse: string; plz: string; ort: string; mwstPflichtig?: boolean; vollmachtDatum?: string };
type SgBetreibung = { nummer: string; betreibungsamt: string; rechtsvorschlagErhoben: boolean; rechtsvorschlagBetrag?: string };

export type SgTyp = 'geldforderung' | 'uebrige_zivilsache' | 'arbeitsrecht' | 'miete_pacht' | 'gleichstellung_glg';

export type SgAnswers = {
  // Behörden-Grundgerüst (5.6.2026): Kanton zuerst – die Registry löst die
  // vollständige Adresse auf (Pilot: BS); Handeingabe als Override.
  gerichtsKanton: Kanton;
  behoerdeManuellAktiv?: boolean;
  behoerdeManuell?: BehoerdeManuell;
  /** Kantonsübergreifender Ausbau 5.6.2026 (Anordnung David): aus den
   *  zweifach geprüften Datenschichten (schlichtungsstellen/amtAufloesung)
   *  aufgelöste Behörde — Rang NACH Handeingabe und NACH der abgenommenen
   *  Registry (BS), VOR dem Platzhalter. */
  behoerdeAufgeloest?: { zeilen: string[]; url?: string };
  // Schritt 0 – Routing & Vorprüfung
  streitgegenstandTyp: SgTyp | '';
  ausnahmeArt198: boolean;
  /** @deprecated entfällt seit 5.6.2026 – ersetzt durch die Kantonsauswahl (gerichtsKanton); bleibt nur für alte Speicherstände/Tests tolerant. */
  baselForumBestaetigt?: boolean;
  streitwert?: string;             // manuell (übrige Zivilsache); sonst abgeleitet
  // Schritt 1 – klagende Partei(en) + Vertretung
  klaeger: SgPartei[];
  vertretung?: SgVertretung;
  // Schritt 2 – beklagte Partei(en)
  beklagte: SgPartei[];
  betreibung?: SgBetreibung;
  // Schritt 3 – Rechtsbegehren
  geld?: { betrag: string; zins?: { satz: string; abDatum: string }; rechtsoeffnung?: boolean };
  unbeziffert?: { mindestbetrag: string; zins?: { satz: string; abDatum: string }; grund: string };
  freieRechtsbegehren: string[];
  weitereRechtsbegehren: string[];
  // Schritt 4 – Streitgegenstand
  streitgegenstand: string;        // Pflicht (Art. 202 Abs. 2 ZPO)
  begruendung?: string;            // möglich, nicht erforderlich
  /** Auftrag David 11.6.2026: statt Masken-Text einen PLATZHALTER-Block
   *  im Gesuch lassen («wird später ausgefüllt»); übersteuert begruendung. */
  begruendungPlatzhalter?: boolean;
  // Schritt 5 – Anträge, Beilagen, Ort/Datum
  antragMediation: boolean;        // Art. 213 ZPO
  antragEntscheid: boolean;        // Art. 212 ZPO – nur vermögensrechtlich ≤ 2'000
  beilagen: { bezeichnung: string }[];
  ort: string;
  datum: string;                   // ISO
};

export const SG_PERSON_NATUERLICH: PersonNatuerlich = { typ: 'natuerlich', vorname: '', name: '', strasse: '', plz: '', ort: '' };

export const SG_DEFAULTS: SgAnswers = {
  gerichtsKanton: 'BS',
  streitgegenstandTyp: '',
  ausnahmeArt198: false,
  klaeger: [{ ...SG_PERSON_NATUERLICH }],
  beklagte: [{ ...SG_PERSON_NATUERLICH }],
  freieRechtsbegehren: [],
  weitereRechtsbegehren: [],
  streitgegenstand: '',
  antragMediation: false,
  antragEntscheid: false,
  beilagen: [],
  ort: 'Basel',
  datum: '',
};

// ── Helfer: Schweizer Formatierung ──────────────────────────────────────────

export function sgStreitwert(a: SgAnswers): number | null {
  // Geldforderung: Streitwert = Begehren (Art. 91 ZPO); unbeziffert: Mindest-
  // betrag als vorläufiger Streitwert (Art. 85 ZPO); sonst manuelle Angabe.
  const roh = a.geld?.betrag ?? a.unbeziffert?.mindestbetrag ?? a.streitwert;
  if (roh == null || roh === '') return null;
  // gleiche Normalisierung wie fmtCHF (Apostroph, Leerzeichen, Dezimal-Komma).
  // Bewusst lokal (B15/§1): Randsemantik (leer→0 ohne Trim-Guard) verschieden
  // von `vorlagen/datum.zahl` (leer→null) — leer ist hier oben schon abgefangen.
  const n = Number(String(roh).replace(/['’\s]/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

// ── Prefill-Codec (Phase 4 Zuständigkeitsengine, Auftrag §8) ─────────────────
// Query-Vorbelegung nach dem Muster fristQueryKodieren (Tagerechner): die
// Zuständigkeits-Seite übergibt Typ/Streitwert/Kanton, dieser Wizard übernimmt
// sie als voll editierbare Defaults. Rein & deterministisch; unbekannte oder
// unplausible Werte werden verworfen (kein Raten).

const SG_TYPEN: readonly SgTyp[] = ['geldforderung', 'uebrige_zivilsache', 'arbeitsrecht', 'miete_pacht', 'gleichstellung_glg'];

export function sgPrefillKodieren(p: {
  typ: SgTyp; betragCHF?: number | null; kanton?: Kanton;
  /** S-4 (Auftrag David 10.6.2026): Ort der Zuständigkeits-Ermittlung —
   *  die Behörden-Wahl der Vorlage löst daraus die KONKRETE Stelle samt
   *  Adresse auf (§5: Schlüssel statt Roh-Adresse in der URL). */
  plz?: string; gemeinde?: string;
}): string {
  const q = new URLSearchParams();
  q.set('typ', p.typ);
  if (p.betragCHF != null && Number.isFinite(p.betragCHF) && p.betragCHF >= 0) q.set('betrag', String(p.betragCHF));
  if (p.kanton) q.set('kanton', p.kanton);
  if (p.plz && /^\d{4}$/.test(p.plz)) q.set('plz', p.plz);
  if (p.gemeinde && p.gemeinde.trim() !== '') q.set('gemeinde', p.gemeinde.trim().slice(0, 60));
  return q.toString();
}

/** Orts-Vorgabe für die Behörden-Auflösung (getrennt von den Antworten —
 *  PLZ/Gemeinde sind Auflösungs-Hilfen, keine Dokument-Inhalte). */
export function sgPrefillOrt(search: string): { plz: string; gemeinde: string } {
  const q = new URLSearchParams(search);
  const plz = q.get('plz') ?? '';
  const gemeinde = q.get('gemeinde') ?? '';
  return {
    plz: /^\d{4}$/.test(plz) ? plz : '',
    gemeinde: gemeinde.trim().slice(0, 60),
  };
}

export function sgPrefillLesen(search: string): Partial<SgAnswers> | null {
  const q = new URLSearchParams(search);
  const typ = q.get('typ') as SgTyp | null;
  if (!typ || !SG_TYPEN.includes(typ)) return null;
  const aus: Partial<SgAnswers> = { streitgegenstandTyp: typ };
  const kanton = q.get('kanton');
  if (kanton && kanton === kanton.toUpperCase() && kanton.length === 2) aus.gerichtsKanton = kanton as Kanton;
  const betrag = q.get('betrag');
  if (betrag && /^\d+(\.\d{1,2})?$/.test(betrag)) {
    if (typ === 'geldforderung') aus.geld = { betrag };
    else aus.streitwert = betrag;
  }
  return aus;
}

// ── Routing (Art. 200 ZPO: paritätische Behörden → eigene Stellen) ──────────
export type SgBehoerdeTyp = 'ordentlich' | 'paritaetisch_miete' | 'paritaetisch_glg';

export type SgRouting =
  | { dokument: true; behoerdeTyp: SgBehoerdeTyp;
      behoerde: typeof SCHLICHTUNGSBEHOERDEN_BS.zivilgericht | typeof SCHLICHTUNGSBEHOERDEN_BS.miete | typeof SCHLICHTUNGSBEHOERDEN_BS.diskriminierung;
      arbeitsrecht: boolean }
  | { dokument: false; stopp: 'art198' };

// Umbau 10.6.2026 (Auftrag David «bei miete pacht/glg gleich die adressen in
// der vorlage übernehmen»): Miete/Pacht und GlG STOPPEN nicht mehr — das
// Gesuch wird erstellt und an die PARITÄTISCHE Stelle adressiert (Art. 200
// Abs. 1/2 ZPO); die behoerde-Felder hier sind die abgenommenen BS-Stammdaten,
// ausserhalb BS löst die Adressat-Kaskade kantonsrichtig auf.
export function sgRouting(a: SgAnswers): SgRouting | null {
  if (!a.streitgegenstandTyp) return null;
  if (a.ausnahmeArt198) return { dokument: false, stopp: 'art198' }; // Art. 198 ZPO
  if (a.streitgegenstandTyp === 'miete_pacht') return { dokument: true, behoerdeTyp: 'paritaetisch_miete', behoerde: SCHLICHTUNGSBEHOERDEN_BS.miete, arbeitsrecht: false };
  if (a.streitgegenstandTyp === 'gleichstellung_glg') return { dokument: true, behoerdeTyp: 'paritaetisch_glg', behoerde: SCHLICHTUNGSBEHOERDEN_BS.diskriminierung, arbeitsrecht: false };
  return { dokument: true, behoerdeTyp: 'ordentlich', behoerde: SCHLICHTUNGSBEHOERDEN_BS.zivilgericht, arbeitsrecht: a.streitgegenstandTyp === 'arbeitsrecht' };
}

/** Registry-EingabeArt je Behördentyp (BS-Stammdaten, §5). */
export function sgEingabeArt(typ: SgBehoerdeTyp): 'schlichtungsbehoerde_zivil' | 'schlichtungsstelle_miete' | 'schlichtungsstelle_diskriminierung' {
  return typ === 'paritaetisch_miete' ? 'schlichtungsstelle_miete'
    : typ === 'paritaetisch_glg' ? 'schlichtungsstelle_diskriminierung'
    : 'schlichtungsbehoerde_zivil';
}

// ── Validierung / Mängelliste (deterministisch; Download-Gate) ──────────────
export type SgMangel = { schritt: number; text: string };

export function parteiVollstaendig(p: SgPartei): boolean {
  return p.typ === 'natuerlich'
    ? !!(p.vorname.trim() && p.name.trim() && p.strasse.trim() && /^\d{4}$/.test(p.plz) && p.ort.trim())
    : !!(p.firma.trim() && p.sitzStrasse.trim() && /^\d{4}$/.test(p.sitzPlz) && p.sitzOrt.trim());
}

/** Aufgelöste Behörde gilt als vollständig mit Name + PLZ/Ort (mindestens
 *  zwei nichtleere Zeilen) — einzelne Ämter führen amtlich KEINE Strasse
 *  (z. B. TI: Circoli Breno und Onsernone; Bug-Check 11.6.2026). */
const aufgeloestVollstaendig = (zeilen?: string[]): boolean =>
  (zeilen?.filter((z) => z.trim() !== '').length ?? 0) >= 2;

export function sgMaengel(a: SgAnswers): SgMangel[] {
  const m0: SgMangel[] = [];
  // Behörden-Gate (Schritt 0): ausserhalb BS nur mit vollständiger Handadresse
  if (a.behoerdeManuellAktiv && !behoerdeManuellVollstaendig(a.behoerdeManuell)) {
    m0.push({ schritt: 0, text: 'Behördenadresse von Hand: Name, Strasse mit Hausnummer und PLZ/Ort vollständig erfassen.' });
  }
  if (a.gerichtsKanton !== 'BS'
      && !(a.behoerdeManuellAktiv && behoerdeManuellVollstaendig(a.behoerdeManuell))
      && !aufgeloestVollstaendig(a.behoerdeAufgeloest?.zeilen)) {
    m0.push({ schritt: 0, text: `Zuständige Schlichtungsbehörde für den Kanton ${a.gerichtsKanton} bestimmen (PLZ/Gemeinde eingeben bzw. Stelle wählen) — oder die Adresse von Hand erfassen.` });
  }
  const m: SgMangel[] = [...m0];
  // wie fmtCHF; bewusst lokal (B15/§1): liefert die Roh-Zahl (leer→0, ungültig→NaN),
  // NICHT `null` wie `vorlagen/datum.zahl` — Aufrufer prüfen unten selbst. Nicht mergen.
  const num = (s?: string) => Number(String(s ?? '').replace(/['’\s]/g, '').replace(',', '.'));
  if (!a.streitgegenstandTyp) m.push({ schritt: 0, text: 'Art des Streitgegenstands wählen.' });
  if (a.klaeger.length < 1 || !a.klaeger.every(parteiVollstaendig)) m.push({ schritt: 1, text: 'Klagende Partei(en) vollständig erfassen (Name, Strasse, 4-stellige PLZ, Ort).' });
  if (a.beklagte.length < 1 || !a.beklagte.every(parteiVollstaendig)) m.push({ schritt: 2, text: 'Beklagte Partei(en) vollständig erfassen (Art. 202 Abs. 2 ZPO).' });
  if (a.streitgegenstandTyp === 'geldforderung' || a.streitgegenstandTyp === 'arbeitsrecht') {
    if (a.unbeziffert) {
      if (!(num(a.unbeziffert.mindestbetrag) > 0)) m.push({ schritt: 3, text: 'Mindestbetrag der unbezifferten Forderung angeben (Art. 85 ZPO).' });
      if (!a.unbeziffert.grund.trim()) m.push({ schritt: 3, text: 'Begründen, warum die Bezifferung nicht möglich/zumutbar ist (Art. 85 ZPO).' });
    } else if (!(num(a.geld?.betrag) > 0)) {
      m.push({ schritt: 3, text: 'Geldforderung beziffern (Art. 84 Abs. 2 ZPO) – oder den Art.-85-Pfad wählen.' });
    }
    if (a.geld?.zins && (!(num(a.geld.zins.satz) > 0) || !a.geld.zins.abDatum)) {
      m.push({ schritt: 3, text: 'Zins: Satz und Beginndatum angeben.' });
    }
    if (a.geld?.rechtsoeffnung && !a.betreibung?.rechtsvorschlagErhoben) {
      m.push({ schritt: 3, text: 'Beseitigung des Rechtsvorschlags setzt eine Betreibung mit erhobenem Rechtsvorschlag voraus (Schritt 2).' });
    }
  }
  // Bug-Check 10.6.2026 (HOCH): gilt für ALLE nicht-vermögensrechtlichen
  // Typen — Miete/GlG liefen nach Aufhebung des Stopps sonst ohne
  // Rechtsbegehren durch (Art. 202 Abs. 2 lit. b ZPO).
  if ((a.streitgegenstandTyp === 'uebrige_zivilsache' || a.streitgegenstandTyp === 'miete_pacht' || a.streitgegenstandTyp === 'gleichstellung_glg')
      && a.freieRechtsbegehren.filter((r) => r.trim()).length === 0) {
    m.push({ schritt: 3, text: 'Mindestens ein Rechtsbegehren formulieren.' });
  }
  if (!a.streitgegenstand.trim()) m.push({ schritt: 4, text: 'Streitgegenstand kurz umschreiben (Pflicht, Art. 202 Abs. 2 ZPO).' });
  const sw = sgStreitwert(a);
  const verm = a.streitgegenstandTyp === 'geldforderung' || a.streitgegenstandTyp === 'arbeitsrecht';
  // Art. 212 ZPO: nur vermögensrechtlich UND ≤ 2'000 – gleiche Bedingung wie sgZusammenstellen
  if (a.antragEntscheid && !(verm && sw !== null && sw <= SG_SCHWELLEN.ENTSCHEID_AUF_ANTRAG)) {
    m.push({ schritt: 5, text: `Antrag auf Entscheid nur bei Streitwert bis CHF ${fmtCHF(String(SG_SCHWELLEN.ENTSCHEID_AUF_ANTRAG))} (Art. 212 ZPO).` });
  }
  if (!a.datum) m.push({ schritt: 5, text: 'Datum angeben.' });
  return m;
}

// Informative Hinweise (blockieren nicht)
export function sgHinweise(a: SgAnswers): string[] {
  const h: string[] = [];
  const sw = sgStreitwert(a);
  // Bug-Check 10.6.2026: Hinweise für die neuen paritätischen Pfade.
  if (a.streitgegenstandTyp === 'miete_pacht') {
    h.push('Das Schlichtungsverfahren ist bei Miete/Pacht von Wohn- und Geschäftsräumen gerichtskostenfrei (Art. 113 Abs. 2 lit. c ZPO).');
    h.push('Die Schlichtungsbehörde kann streitwertunabhängig einen Entscheidvorschlag unterbreiten (Art. 210 Abs. 1 lit. b ZPO); bei Ablehnung wird die Klagebewilligung der ablehnenden Partei zugestellt (Art. 211 Abs. 2 lit. a ZPO).');
  }
  if (a.streitgegenstandTyp === 'gleichstellung_glg') {
    h.push('Das Schlichtungsverfahren ist bei Streitigkeiten nach dem Gleichstellungsgesetz gerichtskostenfrei (Art. 113 Abs. 2 lit. a ZPO).');
    h.push('Die Schlichtungsbehörde kann streitwertunabhängig einen Entscheidvorschlag unterbreiten (Art. 210 Abs. 1 lit. a ZPO).');
  }
  if (sw !== null && sw >= SG_SCHWELLEN.VERZICHT_GEMEINSAM) {
    h.push('Streitwert ≥ CHF 100\'000: Die Parteien könnten gemeinsam auf die Schlichtung verzichten (Art. 199 Abs. 1 ZPO).'); // Art. 199 Abs. 1 ZPO
  }
  if (sw !== null && sw <= SG_SCHWELLEN.ENTSCHEIDVORSCHLAG && (a.streitgegenstandTyp === 'geldforderung' || a.streitgegenstandTyp === 'arbeitsrecht')) {
    h.push('Streitwert bis CHF 10\'000: Die Behörde kann den Parteien einen Entscheidvorschlag unterbreiten (Art. 210 Abs. 1 lit. c ZPO); Ablehnung innert 20 Tagen (Art. 211 ZPO).');
  }
  if (a.streitgegenstandTyp === 'arbeitsrecht' && sw !== null && sw <= SG_SCHWELLEN.ARBEITSRECHT_KOSTENLOS) {
    h.push('Arbeitsrechtliche Streitigkeit bis CHF 30\'000: Das Schlichtungsverfahren ist kostenlos (Art. 113 f. ZPO); Dispens vom persönlichen Erscheinen möglich (Art. 204 Abs. 3 ZPO).');
  }
  if (a.unbeziffert) {
    h.push('Vertretbare Auslegung: Die Engine verlangt bei Geldforderungen grundsätzlich Bezifferung (Art. 84 Abs. 2 ZPO); der unbezifferte Pfad stützt sich auf Art. 85 ZPO – die strenge Bezifferungs-Rechtsprechung betrifft primär die Klage.');
  }
  h.push('Rechtsbegehren und Streitgegenstand sorgfältig fassen: Sie fixieren den Streitgegenstand (Art. 62/64 ZPO) und rahmen die spätere Klage (BGer 4A_413/2012 – zu verifizieren).');
  return h;
}

// ── Bausteine / Dokumentaufbau ──────────────────────────────────────────────
// Parteibezeichnung nach ZPO-Terminologie: «klagende Partei» / «beklagte Partei».

export function parteiZeilen(p: SgPartei): string[] {
  if (p.typ === 'natuerlich') {
    return [
      `${p.vorname} ${p.name}`.trim(),
      ...(p.co ? [`c/o ${p.co}`] : []),
      p.strasse,
      `${p.plz} ${p.ort}${p.land ? `, ${p.land}` : ''}`,
    ].filter(Boolean);
  }
  return [
    `${p.firma}${p.rechtsform ? ` (${p.rechtsform})` : ''}`,
    ...(p.uid ? [`UID ${p.uid}`] : []),
    p.sitzStrasse,
    `${p.sitzPlz} ${p.sitzOrt}`,
  ].filter(Boolean);
}

export const parteiKurz = (p: SgPartei) => (p.typ === 'natuerlich' ? `${p.vorname} ${p.name}`.trim() : p.firma);

export const SG_SCHEMA: VorlageSchema = {
  id: 'schlichtungsgesuch-bs',
  format: 'eingabe',
  version: '1.0.0 (ZPO-Fassung seit 1.1.2025; Behörden-Stammdaten BS Stand 2025/2026)',
  titel: 'Schlichtungsgesuch nach Art. 202 ZPO',
  disclaimer:
    'Entwurf – erstellt mit LexMetrik. Orientierungsdokument, keine Rechtsberatung. Massgeblich sind ' +
    'Gesetz, Vertrag und der konkrete Sachverhalt; für Fristwahrung, Formgültigkeit und inhaltliche ' +
    'Richtigkeit ist die nutzende Person verantwortlich. Die örtliche und sachliche Zuständigkeit der ' +
    'angeschriebenen Behörde ist selbst zu prüfen.',
  bausteine: [
    // 'absender'-Baustein ENTFERNT (Entscheid David 11.6.2026 «Gericht
    // zuoberst», Abnahme-Delta zur Abnahme der BS-Vorlage): Parteien samt
    // Adressen und Vertretung stehen vollständig im Rubrum.
    { id: 'adressat', rolle: 'adressat', text: '{{adressatBlock}}',
      begruendung: 'Zuständige Behörde gemäss sachlichem Routing (Pilot: Zivilgericht BS).',
      norm: 'Art. 200 ZPO' },
    { id: 'ortDatum', rolle: 'datumzeile', text: '{{ort}}, {{datumFmt}}',
      begruendung: 'Ort und Datum – immer enthalten.', norm: 'Art. 130 ZPO' },
    { id: 'betreff', rolle: 'betreff', text: 'Schlichtungsgesuch nach Art. 202 ZPO',
      begruendung: 'Betreff mit Parteien und Streitgegenstand-Stichwort – immer enthalten.',
      norm: 'Art. 202 ZPO' },
    { id: 'rubrum', rolle: 'rubrum', text: '{{rubrumText}}',
      begruendung: 'Rubrum: Bezeichnung der Parteien (Pflichtinhalt).',
      norm: 'Art. 202 Abs. 2 ZPO' },
    { id: 'anrede', rolle: 'anrede',
      text: 'Sehr geehrte Damen und Herren\n\n{{einleitungSatz}}',
      begruendung: 'Anrede und Einleitungsformel (anwaltliche Usanz, kein Pflichtinhalt); Numerus/Vertretung dynamisch.',
      norm: 'Art. 202 ZPO' },
    { id: 'rechtsbegehren', ueberschrift: 'Rechtsbegehren', text: '{{item.text}}',
      wiederholeUeber: 'rbListe', includeIf: { feld: 'rbListe', nichtLeer: true },
      begruendung: 'Rechtsbegehren (Pflichtinhalt), fortlaufend nummeriert; Kostenfolge als letztes Begehren.',
      norm: 'Art. 202 Abs. 2 ZPO' },
    { id: 'antrag_entscheid', ueberschrift: 'Antrag auf Entscheid',
      text: 'Die klagende Partei beantragt, dass die Schlichtungsbehörde gestützt auf Art. 212 ZPO in der Sache entscheidet.',
      includeIf: { feld: 'antragEntscheidZulaessig', eq: true },
      begruendung: 'Aufgenommen, weil beantragt und Streitwert ≤ CHF 2\'000 (vermögensrechtlich).',
      norm: 'Art. 212 ZPO' },
    { id: 'antrag_mediation', ueberschrift: 'Antrag auf Mediation',
      text: 'Die Parteien beantragen, anstelle des Schlichtungsverfahrens eine Mediation durchzuführen (Art. 213 ZPO).\n\n___________________________\n(klagende Partei)\n\n___________________________\n(beklagte Partei)',
      includeIf: { feld: 'antragMediation', eq: true },
      begruendung: 'Aufgenommen, weil Mediation beantragt – setzt Zustimmung der Gegenpartei voraus.',
      norm: 'Art. 213 ZPO',
      hinweis: 'Kann auch erst an der Schlichtungsverhandlung gestellt werden; Unterschrift beider Parteien.' },
    { id: 'streitgegenstand_text', ueberschrift: 'Streitgegenstand', text: '{{streitgegenstand}}',
      begruendung: 'Kurze Umschreibung des Streitgegenstands (Pflichtinhalt).',
      norm: 'Art. 202 Abs. 2 ZPO' },
    { id: 'begruendung_text', ueberschrift: 'Begründung', text: '{{begruendung}}',
      includeIf: { feld: 'begruendung', nichtLeer: true },
      begruendung: 'Aufgenommen, weil eine (freiwillige) Begründung erfasst wurde – nicht erforderlich.',
      norm: 'Art. 202 Abs. 2 ZPO' },
    { id: 'schlussformel', rolle: 'schlussformel',
      text: 'Mit freundlichen Grüssen',
      begruendung: 'Schlussformel (anwaltliche Usanz).',
      norm: 'Art. 202 ZPO' },
    { id: 'unterschrift', rolle: 'unterschrift', text: '{{ort}}, {{datumFmt}}\n\n\n___________________________\n{{unterschriftZeile}}',
      begruendung: 'Unterschriftsblock: Papierform mit eigenhändiger Unterschrift.',
      norm: 'Art. 130 ZPO' },
    { id: 'beilagenverzeichnis', ueberschrift: 'Beilagen', text: '{{item.text}}',
      wiederholeUeber: 'beilagenListe', includeIf: { feld: 'beilagenListe', nichtLeer: true },
      begruendung: 'Beilagenverzeichnis (inkl. automatischer Vollmacht bei Vertretung).',
      norm: 'Art. 131 ZPO' },
    // Bug-Check 10.6.2026 (NIEDRIG, deklarierte fachliche Änderung): Vermerk
    // folgt der Exemplar-Rechnung (1 + Beklagtenzahl) – bei Mehrparteien
    // stand vorher fix «im Doppel», obwohl 3+ Exemplare nötig sind.
    { id: 'doppel_vermerk',
      text: 'Diese Eingabe und ihre Beilagen werden {{exemplareWort}} eingereicht.',
      begruendung: 'Exemplar-Vermerk (Art. 131 ZPO: je ein Exemplar für Behörde und Gegenpartei) – Usanz-Baustein.',
      norm: 'Art. 131 ZPO' },
  ],
};

type SgProtokollAusschluss = { label: string; grund: string };

export function sgZusammenstellen(a: SgAnswers) {
  const sw = sgStreitwert(a);
  const verm = a.streitgegenstandTyp === 'geldforderung' || a.streitgegenstandTyp === 'arbeitsrecht';
  const antragEntscheidZulaessig = a.antragEntscheid && verm && sw !== null && sw <= SG_SCHWELLEN.ENTSCHEID_AUF_ANTRAG;

  // Rechtsbegehren fortlaufend nummerieren (Kostenfolge immer als letztes)
  const rb: string[] = [];
  if ((a.streitgegenstandTyp === 'geldforderung' || a.streitgegenstandTyp === 'arbeitsrecht') && !a.unbeziffert && a.geld?.betrag) {
    // Art. 84 Abs. 2 ZPO (Bezifferung); Zins: Art. 104 OR (5 % Verzugszins)
    rb.push(a.geld.zins
      ? `Die beklagte Partei sei zu verpflichten, der klagenden Partei CHF ${fmtCHF(a.geld.betrag)} nebst Zins zu ${a.geld.zins.satz} % seit ${fmtDatumLang(a.geld.zins.abDatum)} zu bezahlen.`
      : `Die beklagte Partei sei zu verpflichten, der klagenden Partei CHF ${fmtCHF(a.geld.betrag)} zu bezahlen.`);
  }
  if (a.geld?.rechtsoeffnung && a.betreibung?.rechtsvorschlagErhoben) {
    // BS-Formular-Variante: «aufzuheben» – hier «zu beseitigen» (gleichbedeutend)
    rb.push(a.betreibung.rechtsvorschlagBetrag
      ? `In der Betreibung Nr. ${a.betreibung.nummer} des Betreibungsamtes ${a.betreibung.betreibungsamt} sei der Rechtsvorschlag im Umfang von CHF ${fmtCHF(a.betreibung.rechtsvorschlagBetrag)} zu beseitigen.`
      : `In der Betreibung Nr. ${a.betreibung.nummer} des Betreibungsamtes ${a.betreibung.betreibungsamt} sei der Rechtsvorschlag zu beseitigen.`);
  }
  if (a.unbeziffert) {
    // Art. 85 ZPO – unbezifferte Forderungsklage (Mindestwert als vorläufiger Streitwert)
    const zins = a.unbeziffert.zins ? `, nebst Zins zu ${a.unbeziffert.zins.satz} % seit ${fmtDatumLang(a.unbeziffert.zins.abDatum)}` : '';
    rb.push(`Die beklagte Partei sei zu verpflichten, der klagenden Partei einen nach Durchführung des Beweisverfahrens zu beziffernden Betrag, mindestens jedoch CHF ${fmtCHF(a.unbeziffert.mindestbetrag)}${zins}, zu bezahlen.`);
  }
  if (a.streitgegenstandTyp === 'uebrige_zivilsache' || a.streitgegenstandTyp === 'miete_pacht' || a.streitgegenstandTyp === 'gleichstellung_glg') {
    // Bug-Check 10.6.2026 (HOCH): auch Miete/GlG — 1:1, kein generierter Text
    a.freieRechtsbegehren.filter((r) => r.trim()).forEach((r) => rb.push(r.trim()));
  }
  a.weitereRechtsbegehren.filter((r) => r.trim()).forEach((r) => rb.push(r.trim()));
  // Kostenfolge – immer letztes Begehren
  rb.push(a.vertretung?.bezeichnung
    ? `Unter Kosten- und Entschädigungsfolgen${a.vertretung.mwstPflichtig ? ' (zzgl. MwSt.)' : ''} zulasten der beklagten Partei.`
    : 'Unter Kosten- und Entschädigungsfolgen zulasten der beklagten Partei.');
  const rbListe = rb.map((text, i) => ({ text: `${i + 1}. ${text}` }));

  // Rubrum
  const klaegerBlock = a.klaeger.map((p, i) => `${a.klaeger.length > 1 ? `${i + 1}. ` : ''}${parteiZeilen(p).join(', ')}`).join('\n');
  const beklagteBlock = a.beklagte.map((p, i) => `${a.beklagte.length > 1 ? `${i + 1}. ` : ''}${parteiZeilen(p).join(', ')}`).join('\n');
  const rubrumText = [
    'in Sachen',
    '',
    klaegerBlock,
    ...(a.vertretung?.bezeichnung ? [`vertreten durch ${a.vertretung.bezeichnung}${a.vertretung.zusatz ? `, ${a.vertretung.zusatz}` : ''}, ${a.vertretung.strasse}, ${a.vertretung.plz} ${a.vertretung.ort}`] : []),
    '— klagende Partei —',
    '',
    'gegen',
    '',
    beklagteBlock,
    '— beklagte Partei —',
    '',
    `betreffend ${stichwortVon(a)}`,
  ].join('\n');

  // Beilagen (Vollmacht automatisch; HR-Auszug als Vorschlag bei juristischer, unvertretener Klägerschaft)
  const beilagen: string[] = [];
  if (a.vertretung?.bezeichnung) beilagen.push(`Vollmacht${a.vertretung.vollmachtDatum ? ` vom ${fmtDatum(a.vertretung.vollmachtDatum)}` : ''}`);
  if (!a.vertretung?.bezeichnung && a.klaeger.some((p) => p.typ === 'juristisch')) beilagen.push('Handelsregisterauszug (Zeichnungsberechtigung)');
  a.beilagen.filter((b) => b.bezeichnung.trim()).forEach((b) => beilagen.push(b.bezeichnung.trim()));
  const beilagenListe = beilagen.map((text, i) => ({ text: `${i + 1}. ${text}` }));

  // Unterschriftszeile
  const ersteKlagende = a.klaeger[0];
  const unterschriftZeile = a.vertretung?.bezeichnung
    ? a.vertretung.bezeichnung
    : ersteKlagende?.typ === 'juristisch'
      ? `${ersteKlagende.firma}${ersteKlagende.zeichnungsberechtigt ? ` – ${ersteKlagende.zeichnungsberechtigt.name}, ${ersteKlagende.zeichnungsberechtigt.funktion}` : ''}`
      : parteiKurz(ersteKlagende ?? { ...SG_PERSON_NATUERLICH });

  // Adressat: Handeingabe vor Registry; ausserhalb BS ohne Handadresse
  // bleibt der Block leer-markiert (Mängelliste blockiert den Export).
  // Umbau 10.6.2026: Registry-Art folgt dem sachlichen Routing (ordentlich/
  // Miete/GlG) — in BS damit automatisch die paritätische Stelle.
  const routingFuerAdressat = sgRouting(a);
  const registryAdresse = behoerdeFuer(
    sgEingabeArt(routingFuerAdressat?.dokument ? routingFuerAdressat.behoerdeTyp : 'ordentlich'),
    a.gerichtsKanton,
  );
  const aufgeloestOk = aufgeloestVollstaendig(a.behoerdeAufgeloest?.zeilen);
  const adressatBlock = a.behoerdeManuellAktiv && behoerdeManuellVollstaendig(a.behoerdeManuell)
    ? behoerdeAlsBlock(a.behoerdeManuell!)
    : registryAdresse
      ? behoerdeAlsBlock(registryAdresse)
      : aufgeloestOk
        ? a.behoerdeAufgeloest!.zeilen.filter((z) => z.trim() !== '').join('\n')
        : '________\n________\n________';
  const antworten: Antworten = {
    ...a,
    // Platzhalter-Modus (Auftrag David 11.6.2026): Leer-Block zum
    // Handausfüllen — übersteuert einen allfälligen Masken-Text.
    begruendung: a.begruendungPlatzhalter ? '________\n\n________' : a.begruendung,
    absenderBlock: a.vertretung?.bezeichnung
      ? [a.vertretung.bezeichnung, a.vertretung.zusatz, a.vertretung.strasse, `${a.vertretung.plz} ${a.vertretung.ort}`].filter(Boolean).join('\n')
      : parteiZeilen(a.klaeger[0] ?? { ...SG_PERSON_NATUERLICH }).join('\n'),
    adressatBlock,
    datumFmt: fmtDatumLang(a.datum),
    // 1 Behörden- + je 1 Gegenpartei-Exemplar (Art. 131 ZPO), identisch zur
    // exemplare-Rechnung unten (Bug-Check 10.6.2026).
    exemplareWort: a.beklagte.length <= 1 ? 'im Doppel' : `in ${1 + a.beklagte.length} Exemplaren`,
    rubrumText,
    rbListe,
    antragEntscheidZulaessig,
    beilagenListe,
    unterschriftZeile,
    // Einleitungsformel nach Usanz: Vertretung → «namens und im Auftrag»,
    // mehrere Kläger in eigener Sache → «stellen wir» (Review 5.6.2026)
    einleitungSatz: a.vertretung?.bezeichnung?.trim()
      ? 'Namens und im Auftrag der klagenden Partei stelle ich folgende'
      : a.klaeger.length > 1
        ? 'Hiermit stellen wir folgende'
        : 'Hiermit stelle ich folgende',
  };

  const ergebnis = assemble(SG_SCHEMA, antworten);

  // Bausteinprotokoll: auch NICHT aufgenommene optionale Bausteine begründen
  const nichtAufgenommen: SgProtokollAusschluss[] = [];
  if (!antragEntscheidZulaessig) {
    nichtAufgenommen.push({
      label: 'Antrag auf Entscheid (Art. 212 ZPO)',
      grund: !a.antragEntscheid ? 'nicht beantragt'
        : !verm ? 'nur in vermögensrechtlichen Streitigkeiten'
        : `nicht aufgenommen: Streitwert > CHF ${fmtCHF(String(SG_SCHWELLEN.ENTSCHEID_AUF_ANTRAG))}`,
    });
  }
  if (!a.antragMediation) nichtAufgenommen.push({ label: 'Antrag auf Mediation (Art. 213 ZPO)', grund: 'nicht beantragt' });
  if (!(a.geld?.rechtsoeffnung && a.betreibung?.rechtsvorschlagErhoben)) {
    nichtAufgenommen.push({ label: 'Beseitigung des Rechtsvorschlags', grund: a.geld?.rechtsoeffnung ? 'kein Rechtsvorschlag erhoben' : 'nicht beantragt' });
  }
  if (!a.begruendungPlatzhalter && !a.begruendung?.trim()) nichtAufgenommen.push({ label: 'Begründung', grund: 'keine erfasst – nicht erforderlich (Art. 202 ZPO)' });

  return { ...ergebnis, nichtAufgenommen, exemplare: 1 + a.beklagte.length /* Art. 131 ZPO */ };
}

function stichwortVon(a: SgAnswers): string {
  const TYP_LABEL: Record<SgTyp, string> = {
    geldforderung: 'Forderung',
    uebrige_zivilsache: 'Zivilsache',
    arbeitsrecht: 'Forderung aus Arbeitsverhältnis',
    miete_pacht: 'Miete/Pacht',
    gleichstellung_glg: 'Gleichstellung',
  };
  const erste = a.streitgegenstand.trim().split('\n')[0];
  if (erste && erste.length <= 80) return erste;
  if (erste) return erste.slice(0, 77) + '…';
  return a.streitgegenstandTyp ? TYP_LABEL[a.streitgegenstandTyp] : '________';
}
