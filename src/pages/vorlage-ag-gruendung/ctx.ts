import type { Dispatch, ReactNode, SetStateAction } from 'react';
import type { EinlageArt } from '../../lib/gruendungsunterlagen';
import { agGruendungsunterlagen } from '../../lib/gruendungsunterlagen';
import type {
  AgDokAntworten,
  AgGruenderZeile,
  AgVrZeile,
  AgVertretungsZeile,
  AgSacheinlageZeile,
  AgVerrechnungZeile,
  AgVorteilZeile,
  AgWaehrung,
} from '../../lib/vorlagen/gruendungAgDokumente';
import { agDokumentmappe } from '../../lib/vorlagen/gruendungAgDokumente';
import { karte } from '../../lib/startseiteConfig';

// Verhaltensneutraler Datei-Split (§6 Ziff. 6): die Schritt-Renderer der
// AG-Gründungsmaske leben in Geschwister-Dateien. Damit die JSX-Bodies
// byte-identisch bleiben, bündelt dieses Ctx-Objekt ALLE Werte/Setter/Helfer
// aus dem Komponenten-Scope; jede Render-Funktion destrukturiert oben, was sie
// braucht — der JSX-Körper selbst ändert sich nicht. Reine Darstellung (§3).
export interface AgSchrittCtx {
  // ── Konstellation ──
  einlageArt: EinlageArt; setEinlageArt: Dispatch<SetStateAction<EinlageArt>>;
  besondereVorteile: boolean; setBesondereVorteile: Dispatch<SetStateAction<boolean>>;
  optingOut: boolean; setOptingOut: Dispatch<SetStateAction<boolean>>;
  eigeneBueros: boolean; setEigeneBueros: Dispatch<SetStateAction<boolean>>;
  immobilienHauptzweck: boolean; setImmobilienHauptzweck: Dispatch<SetStateAction<boolean>>;
  inhaberaktien: boolean; setInhaberaktien: Dispatch<SetStateAction<boolean>>;
  fremdwaehrung: boolean; setFremdwaehrung: Dispatch<SetStateAction<boolean>>;
  bankInUrkunde: boolean; setBankInUrkunde: Dispatch<SetStateAction<boolean>>;
  chVertretung: boolean; setChVertretung: Dispatch<SetStateAction<boolean>>;
  leistungen: string; setLeistungen: Dispatch<SetStateAction<string>>;

  // ── Gesellschaft & Statuten ──
  firma: string; setFirma: Dispatch<SetStateAction<string>>;
  sitz: string; setSitz: Dispatch<SetStateAction<string>>;
  kanton: string; setKanton: Dispatch<SetStateAction<string>>;
  zweck: string; setZweck: Dispatch<SetStateAction<string>>;
  zweckErweiterung: boolean; setZweckErweiterung: Dispatch<SetStateAction<boolean>>;
  statutenUmfang: AgDokAntworten['statutenUmfang']; setStatutenUmfang: Dispatch<SetStateAction<AgDokAntworten['statutenUmfang']>>;
  vinkulierung: boolean; setVinkulierung: Dispatch<SetStateAction<boolean>>;
  virtuelleGv: boolean; setVirtuelleGv: Dispatch<SetStateAction<boolean>>;
  inhaberKotiert: boolean; setInhaberKotiert: Dispatch<SetStateAction<boolean>>;
  verwahrungsstelle: string; setVerwahrungsstelle: Dispatch<SetStateAction<string>>;
  schiedsklausel: boolean; setSchiedsklausel: Dispatch<SetStateAction<boolean>>;
  schiedsOrt: string; setSchiedsOrt: Dispatch<SetStateAction<string>>;
  kapitalband: boolean; setKapitalband: Dispatch<SetStateAction<boolean>>;
  kbUntergrenze: string; setKbUntergrenze: Dispatch<SetStateAction<string>>;
  kbObergrenze: string; setKbObergrenze: Dispatch<SetStateAction<string>>;
  kbEndeDatum: string; setKbEndeDatum: Dispatch<SetStateAction<string>>;
  kbRichtung: AgDokAntworten['kbRichtung']; setKbRichtung: Dispatch<SetStateAction<AgDokAntworten['kbRichtung']>>;
  bedingtesKapital: boolean; setBedingtesKapital: Dispatch<SetStateAction<boolean>>;
  bkBetrag: string; setBkBetrag: Dispatch<SetStateAction<string>>;
  bkKreis: string; setBkKreis: Dispatch<SetStateAction<string>>;
  stichentscheidGv: boolean; setStichentscheidGv: Dispatch<SetStateAction<boolean>>;
  gjErstesEnde: string; setGjErstesEnde: Dispatch<SetStateAction<string>>;
  gjBeginn: string; setGjBeginn: Dispatch<SetStateAction<string>>;
  gjEnde: string; setGjEnde: Dispatch<SetStateAction<string>>;

  // ── Kapital & Einlagen ──
  ak: string; setAk: Dispatch<SetStateAction<string>>;
  anzahl: string; setAnzahl: Dispatch<SetStateAction<string>>;
  nennwert: string; setNennwert: Dispatch<SetStateAction<string>>;
  liberierung: string; setLiberierung: Dispatch<SetStateAction<string>>;
  ausgabebetrag: string; setAusgabebetrag: Dispatch<SetStateAction<string>>;
  waehrung: AgWaehrung; setWaehrung: Dispatch<SetStateAction<AgWaehrung>>;
  kursChf: string; setKursChf: Dispatch<SetStateAction<string>>;
  kursQuelle: string; setKursQuelle: Dispatch<SetStateAction<string>>;
  bankName: string; setBankName: Dispatch<SetStateAction<string>>;
  bankOrt: string; setBankOrt: Dispatch<SetStateAction<string>>;
  sacheinlagen: (AgSacheinlageZeile & { key: number })[]; setSacheinlagen: Dispatch<SetStateAction<(AgSacheinlageZeile & { key: number })[]>>;
  verrechnungen: (AgVerrechnungZeile & { key: number })[]; setVerrechnungen: Dispatch<SetStateAction<(AgVerrechnungZeile & { key: number })[]>>;
  vorteile: (AgVorteilZeile & { key: number })[]; setVorteile: Dispatch<SetStateAction<(AgVorteilZeile & { key: number })[]>>;
  revisorName: string; setRevisorName: Dispatch<SetStateAction<string>>;

  // ── Personen & Organe ──
  gruender: (AgGruenderZeile & { key: number })[]; setGruender: Dispatch<SetStateAction<(AgGruenderZeile & { key: number })[]>>;
  vr: (AgVrZeile & { key: number })[]; setVr: Dispatch<SetStateAction<(AgVrZeile & { key: number })[]>>;
  vertretungen: (AgVertretungsZeile & { key: number })[]; setVertretungen: Dispatch<SetStateAction<(AgVertretungsZeile & { key: number })[]>>;
  protokollfuehrer: string; setProtokollfuehrer: Dispatch<SetStateAction<string>>;
  sitzungBeginn: string; setSitzungBeginn: Dispatch<SetStateAction<string>>;
  sitzungEnde: string; setSitzungEnde: Dispatch<SetStateAction<string>>;
  rsName: string; setRsName: Dispatch<SetStateAction<string>>;
  rsSitz: string; setRsSitz: Dispatch<SetStateAction<string>>;

  // ── Domizil & Optionen ──
  rechtsdomizil: string; setRechtsdomizil: Dispatch<SetStateAction<string>>;
  domizilhalterName: string; setDomizilhalterName: Dispatch<SetStateAction<string>>;
  domizilhalterAdresse: string; setDomizilhalterAdresse: Dispatch<SetStateAction<string>>;
  konstituierungInUrkunde: boolean; setKonstituierungInUrkunde: Dispatch<SetStateAction<boolean>>;
  domizilNurAnmeldung: boolean; setDomizilNurAnmeldung: Dispatch<SetStateAction<boolean>>;
  nachtragsbevollmaechtigter: string; setNachtragsbevollmaechtigter: Dispatch<SetStateAction<string>>;
  lkAusland: boolean; setLkAusland: Dispatch<SetStateAction<boolean>>;
  lkNeuerwerb: boolean; setLkNeuerwerb: Dispatch<SetStateAction<boolean>>;
  lkGrundstueck: boolean; setLkGrundstueck: Dispatch<SetStateAction<boolean>>;
  nachtragAktiv: boolean; setNachtragAktiv: Dispatch<SetStateAction<boolean>>;
  ntGruendungsdatum: string; setNtGruendungsdatum: Dispatch<SetStateAction<string>>;
  ntUrkundeZiffer: string; setNtUrkundeZiffer: Dispatch<SetStateAction<string>>;
  ntUrkundeText: string; setNtUrkundeText: Dispatch<SetStateAction<string>>;
  ntStatutenArtikel: string; setNtStatutenArtikel: Dispatch<SetStateAction<string>>;
  ntStatutenAbsatz: string; setNtStatutenAbsatz: Dispatch<SetStateAction<string>>;
  ntStatutenText: string; setNtStatutenText: Dispatch<SetStateAction<string>>;
  ort: string; setOrt: Dispatch<SetStateAction<string>>;
  datum: string; setDatum: Dispatch<SetStateAction<string>>;

  // ── Abgeleitete Werte / Helfer (Komponenten-Scope) ──
  wc: string;
  finmaTreffer: string[];
  checkliste: ReturnType<typeof agGruendungsunterlagen>;
  mappe: ReturnType<typeof agDokumentmappe>;
  card: ReturnType<typeof karte>;
  neuerKey: () => number;
  blockerKlickbar: (titel: string) => ReactNode;
  alleHerunterladen: () => Promise<void>;
  batchLaeuft: boolean;
  batchMeldung: string | null;
}
