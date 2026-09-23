// Browse-Manifest-Schema (Rubrik V «Gesetze»): EIN Eintrag pro Erlass für die
// Übersicht — Identität/Taxonomie aus dem Register, ableitbare Felder aus den
// Snapshots (§5). Generiert von scripts/normtext/browse-manifest.ts nach
// public/normtext/register.json; lazy geladen (nie im Bundle, §3).

import type { Rechtsgebiet, Sprache, ErlassStatus } from './register';
import type { ErlassAufhebung } from './aufhebungen';

export interface BrowseErlass {
  key: string;
  ebene: 'bund' | 'kanton';
  kanton: string | null;
  kuerzel: string;
  titel: string;
  sr: string | null;
  rechtsgebiet: Rechtsgebiet;
  sprache: Sprache;
  rang: number;
  status: ErlassStatus;
  // ── abgeleitet aus dem Snapshot (NICHT im Register, §5) ──
  /** Pfad relativ zu public/normtext, z.B. 'bund/OR.json'; null bei nur-live-link. */
  datei: string | null;
  /** Anzahl Artikel-Einträge (eintraege.length); 0 bei nur-live-link. */
  artikelAnzahl: number;
  /** Spätestes Fassungs-/Standdatum der Einträge (ISO) oder Register-Stand. */
  stand: string;
  /** Amtliche Basis-URL ohne #-Anker. */
  quelleUrl: string;
  /** Drift-Token des ersten Eintrags (UI-Anzeige) oder ''. */
  fassungsToken: string;
  /** Nur status 'pdf-embed': Pfad zum gehosteten amtlichen PDF (z.B. 'pdf/EMRK.pdf'), sonst null. */
  pdfPfad: string | null;
  // ── U-PDF / A12: amtliches PDF der gepinnten Fassung (Download-Aktion) ──
  /** Nur status 'snapshot': absolute URL des AMTLICHEN PDF der gepinnten Fassung
   *  (Bund: Fedlex-Filestore pdf-a via SPARQL isExemplifiedBy; Kanton: LexWork
   *  pdf_link_tol). Projiziert aus public/normtext/pdf-quellen.json (§5). Fehlt sie
   *  (kein amtliches PDF ODER Kanton-Drift), wird die Download-Aktion weggelassen
   *  statt ein render-eigenes PDF anzubieten (§8, FAHRPLAN-GESETZES-UX §10.5). */
  pdfUrl?: string;
  /** Versionsdatum (ISO) des unter pdfUrl liegenden amtlichen PDF — der Generator
   *  garantiert pdfStand == der ausgelieferten gepinnten Fassung; ehrliche
   *  Beschriftung «Amtliches PDF (Fassung vom …)». */
  pdfStand?: string;
  // ── V2 / K-1: «in Kraft seit» (Ur-Inkrafttreten des Erlasses) ──
  /** Nur status 'snapshot' (Bund): das URSPRÜNGLICHE Inkrafttreten des Erlasses
   *  (ISO), aus Fedlex-SPARQL `jolux:dateEntryInForce` am Abstract-ELI. Projiziert
   *  aus public/normtext/inkrafttreten.json (§5). Distinkt vom «Stand»
   *  (Konsolidierungsdatum) und vom Erlassdatum «vom …». Kanton trägt es nicht
   *  (LexWork hat kein strukturelles Ur-Inkrafttreten) ⇒ Feld fehlt, §8. */
  inkraftSeit?: string;
  // ── §8-Ehrlichkeit: Ganz-Aufhebung des Erlasses ──
  /** Der Erlass ist von Fedlex GANZ aufgehoben (jolux:dateNoLongerInForce). Aus
   *  dem Register projiziert (SSoT aufhebungen.ts). Der Snapshot bleibt lesbar
   *  (historische Fassung), wird aber nie als geltend dargestellt: Reader zeigt
   *  ein Status-Banner, der Katalog ein «Aufgehoben»-Badge. Absenz = geltend. */
  aufgehoben?: ErlassAufhebung;
  // ── N0b: amtliche kantonale Systematik-Einordnung ──
  /** Nur kantonale Snapshots: die Stelle des Erlasses im amtlichen
   *  Systematik-Baum seines Kantons, deterministisch aus der Systematik-Nummer
   *  im Snapshot-key gejoint (public/normtext/kanton-systematik.json).
   *
   *  Das ist die AMTLICHE Ordnung des Kantons — nicht `rechtsgebiet`, das eine
   *  LexMetrik-eigene, korpusweite Grobachse ist. Beide bleiben nebeneinander
   *  stehen: die amtliche Einordnung ersetzt keine kantonsübergreifende
   *  Vergleichbarkeit, und die Grobachse ersetzt keine amtliche Herkunft.
   *
   *  Fehlt, wo der Kanton keinen erhobenen Baum hat oder die Nummer nicht
   *  ziffernhierarchisch ist (GL: römische Systematik) — ehrlich ohne Feld
   *  statt geraten (§8). */
  sachgebietKanton?: SachgebietKanton;
}

/** Ein bis zwei Ebenen des amtlichen kantonalen Systematik-Baums. Die Form
 *  spiegelt den Index-Eintrag `[top, sub]` aus kanton-systematik.json 1:1 —
 *  keine erfundene Zwischenstruktur (§5). */
export interface SachgebietKanton {
  /** Oberste Ebene, immer vorhanden. */
  wurzel: SystematikEbene;
  /** Zweite Ebene, wo der Baum sie führt und die Nummer sie trifft. */
  unter?: SystematikEbene;
}

interface SystematikEbene {
  /** Amtliche Gliederungsnummer ('1', '15', 'BeE'). */
  nummer: string;
  /** Amtliche Bezeichnung der Gliederungsstufe. */
  name: string;
}

export interface BrowseManifest {
  erzeugt: string;
  erlasse: BrowseErlass[];
}

/** Hat eine In-App-Lesesicht (Volltext-Snapshot ODER eingebettetes amtliches PDF).
 *  SSoT (§5): genutzt von ErlassKarte/ErlassZeile UND der Systematik-Zeile, damit
 *  pdf-embed-Erlasse (z. B. EMRK/NYUE) überall in den In-App-Reader führen statt
 *  extern. */
export function istLesbar(e: Pick<BrowseErlass, 'status'>): boolean {
  return e.status === 'snapshot' || e.status === 'pdf-embed';
}
