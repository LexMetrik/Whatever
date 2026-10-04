// ─── Rechtsprechungs-Snapshot — Pendant zu normtext/typen.ts ────────────────
//
// Ein Entscheid ist narrativer als ein Gesetzesartikel → eigener, schlanker Typ
// (NormSnapshot wird NICHT überladen). Eigener Baum public/rechtsprechung/ — die
// Gesetzes-Snapshots/-Typen bleiben dadurch byte-gleich (golden-neutral, §5/§6).
// §7-Provenienz: stand/quelleUrl/abgerufen/fassungsToken sind Pflicht.

import type { Rechtsgebiet } from '../normtext/register';

export type EntscheidSprache = 'de' | 'fr' | 'it' | 'rm';
// 'gerichte-bs' = amtliches Rechtsprechungs-Portal der Gerichte Basel-Stadt
// (rechtsprechung.gerichte.bs.ch, Findinfo/Omnis-CGI — BS-Tranche, Bauplan §3.3).
export type Entscheidquelle = 'opencaselaw' | 'entscheidsuche' | 'gerichte-bs';

/** Zwei orthogonale Status-Achsen (Fahrplan Strang-0). */
export type Bestandstatus = 'snapshot' | 'nur-live-link';     // technisch: gespiegelt vs. nur Verweis
export type Kuratierungsstatus = 'maschinell' | 'geprueft';   // fachlich; 'geprueft' NUR via Abnahme (§7)

export type Leitcharakter = 'leitentscheid' | 'routine';
export type Gerichtstyp =
  | 'bundesgericht' | 'bundesverwaltungsgericht' | 'bundesstrafgericht'
  | 'bundespatentgericht' | 'kantonal';

/** Abschnitts-Achse folgt der amtlichen Gliederung (OCL /structure). */
export type Abschnittstyp = 'regeste' | 'sachverhalt' | 'erwaegung' | 'dispositiv';

/** Block formähnlich zu NormSnapshot.bloecke (text), aber 'marke' = Erwägungsziffer. */
export interface EntscheidBlock {
  /** 'E. 1', 'E. 3.2.1'; null bei Sachverhalt/Dispositiv-Fliesstext. */
  marke: string | null;
  /** Einrückungstiefe der Erwägung (OCL depth), für die Darstellung. */
  tiefe?: number;
  text: string;
}

export interface EntscheidAbschnitt {
  typ: Abschnittstyp;
  /** false ⇒ Inhalt ist nur ein Auszug (z.B. Sachverhalt-Kappung); UI labelt „Auszug". */
  vollstaendig?: boolean;
  bloecke: EntscheidBlock[];
}

/**
 * Eine Sprachfassung der amtlich publizierten BGE-Regeste (W2·6-B B2 + A18).
 * Amtlich dreisprachig (DE/FR/IT); die Fassungen werden aus der bger.ch-clir-
 * Struktur (`<div id="regeste" lang="…">`) getrennt — strukturbasiert, keine
 * Wortraten-Heuristik (§2). `kopf` = Regestenkopf (massgebliche Artikel +
 * Regestentitel; in der amtlichen Sammlung fett). `absaetze` = die Textabsätze.
 */
/**
 * Ein Teil einer mehrteiligen amtlichen Regeste («Regeste a / b / c»; Bug-Fix A29).
 * `label` = Teil-Buchstabe der amtlichen Sammlung.
 */
interface RegesteTeil {
  label: string | null;
  kopf: string;
  absaetze: string[];
}

export interface RegesteSprachfassung {
  sprache: EntscheidSprache;   // 'de' | 'fr' | 'it'
  kopf: string;                // Regestenkopf des ERSTEN Teils (Rückwärtskompat/Fallback)
  absaetze: string[];          // Textabsätze des ERSTEN Teils
  /**
   * Mehrteilige Regeste (amtl. «Regeste a / b / c»): ALLE Teile inkl. a, mit Label,
   * in amtlicher Reihenfolge. NUR gesetzt, wenn die Quelle >1 Regeste-Block trägt
   * (Bug-Fix A29). Fehlt das Feld ⇒ Einfach-Regeste (kopf/absaetze tragen alles).
   */
  weitereRegesten?: RegesteTeil[];
  quelleUrl: string;           // amtliche clir-URL DIESER Sprachfassung (§7)
}

/** Regeste/Leitsatz — redaktioneller Teil (Lizenz-Graustufe Art. 5 URG), getrennt. */
export interface EntscheidRegeste {
  /** Flacher Text (Entscheidsprache) — Rückwärtskompat, Suche, SEO, Fallback. */
  text: string;
  quelle: Entscheidquelle;
  /**
   * Amtlich nachextrahierte, strukturierte Regeste je Sprache, sortiert DE→FR→IT
   * (A18). NUR amtliche BGE (Quelle bger.ch clir). Fehlt eine Sprachfassung in der
   * Quelle, ist sie NICHT enthalten — nie geraten (§1). Fehlt das Feld ganz, gibt
   * es keine strukturierte Fassung → die UI zeigt `text`.
   */
  sprachfassungen?: RegesteSprachfassung[];
}

/**
 * Rubrum/Kopf eines Entscheids (Art. 112 Abs. 1 BGG): Spruchkörper, Parteien,
 * Gegenstand, Vorinstanz. Aus dem full_text extrahiert; Felder optional (best-effort).
 */
export interface EntscheidRubrum {
  besetzung?: string | null;   // „Bundesrichter Bovey, Präsident, Gerichtsschreiber Zingg"
  parteien?: string | null;    // „A. … (Beschwerdeführer) gegen B. … (Beschwerdegegner)"
  gegenstand?: string | null;  // „Konkurseröffnung"
  vorinstanz?: string | null;  // „Obergericht Appenzell Ausserrhoden, Urteil vom 7. Mai 2026"
}

// Ein Snapshot = genau EIN Entscheid, mit Provenienz.
export interface EntscheidSnapshot {
  /** Stabiler, dateisicherer Key, z.B. 'bund/bger/5A_1100_2025'. */
  id: string;

  // ── Identität (selbsttragend; §7-Provenienz) ──
  gericht: string;          // OCL court ('bger')
  gerichtName: string;      // OCL court_name ('Bundesgericht')
  gerichtstyp: Gerichtstyp;
  kanton: string;           // OCL canton ('CH' für Bund — NICHT leer)
  abteilung: string | null; // OCL chamber
  nummer: string;           // OCL docket_number ('5A_1100/2025')
  bgeReferenz: string | null;
  /**
   * Nur bei amtlichen BGE: das zugrunde liegende bger-Urteil (aza-Aktenzeichen
   * + Snapshot-key), aus dessen Volltext der Body dieses Leitentscheids stammt.
   * null, wenn kein aza-Az. eindeutig auflösbar war (dann trägt der Body nur den
   * Sammlungs-Auszug; UI zeigt ehrlich «Auszug» + Live-Link, §8).
   */
  azaUrteil?: { aktenzeichen: string; key: string; quelleUrl: string } | null;
  zitierung: string;        // OCL citation_string_de
  /**
   * ECLI (European Case Law Identifier), deterministisch aus Gericht/Nummer/
   * Datum gemintet (`ecli.ts`). Interop-Schlüssel zu europäischen Resolvern +
   * OpenCaseLaw. Optional/additiv; null, wenn kein Jahr ableitbar war.
   */
  ecli?: string | null;
  datum: string;            // OCL decision_date ('YYYY-MM-DD')
  /**
   * true ⇒ die amtliche Quelle publiziert KEIN Entscheiddatum; `datum` trägt dann
   * einen deterministischen Platzhalter (<GN-Jahr>-01-01, Muster BGE-Bandjahr).
   * Die UI zeigt den Platzhalter nie als echtes Datum (§8). BS-Tranche §3.3/§3.4.
   */
  datumUnbekannt?: true;
  /**
   * Das Datum, das die ANGEBENDE QUELLE (BS: Metadatum «Entscheiddatum» des
   * Gerichtsportals; kantonale OCL-Gerichte: OCL `decision_date`) für denselben
   * Entscheid nennt, WENN es vom amtlichen Urteilskopf-Datum in `datum` abweicht
   * (Variante A, Entscheid David 25.9./4.10.2026: der Kopf gewinnt). Fehlt das
   * Feld, stimmen beide überein oder die Quelle nannte keines. Rein
   * Provenienz/§8-Hinweis («das Portal nennt den …») — nie Rechenwert.
   */
  datumPortal?: string;
  /** Erstpublikationsdatum der amtlichen Quelle (ISO), falls publiziert (BS §3.3). */
  erstpublikation?: string;
  /** Aktualisierungsdatum der amtlichen Quelle (ISO) — Drift-/Delta-Token (BS §3.3). */
  aktualisiert?: string;
  /** Parallele Zweit-Geschäftsnummer (z.B. AK.2025.27 «(AG.2025.604)», BS §3.3). */
  nummerSekundaer?: string;
  sprache: EntscheidSprache;
  leitcharakter: Leitcharakter;
  /** Kuratierte Sach-Achse (deklariert, nie geraten — Verzahnung mit den Gesetzen). */
  sachgebiet: Rechtsgebiet;
  /**
   * Rohes OCL-Feld `legal_area` (Provenienz, NICHT verifiziert). Persistiert,
   * damit die Sachgebiet-Klassierung der mehrdeutigen II. öff.-rechtl. Abteilung
   * (2A/2C/2D) OFFLINE reproduzierbar bleibt (§2) — sie fällt ohne Norm-Signal
   * auf diese legal_area zurück. null, wenn OCL keine liefert (z.B. kantonal).
   */
  legalArea: string | null;

  // ── Inhalt ──
  rubrum: EntscheidRubrum | null;    // Spruchkörper/Parteien/Gegenstand/Vorinstanz (Art. 112 BGG)
  regeste: EntscheidRegeste | null;  // null bei Urteilen ohne (amtliche) Regeste
  /** true nur beim amtlich publizierten BGE; sonst maschinelle Zusammenfassung. */
  regesteAmtlich: boolean;
  abschnitte: EntscheidAbschnitt[];  // sachverhalt / erwaegung / dispositiv
  /**
   * Nur bei BGE mit aufgelöstem Volltext: der amtliche BGE-Sammlungstext (der
   * publizierte «Auszug aus dem Urteil»). `abschnitte` trägt dann das VOLLSTÄNDIGE
   * unterliegende Urteil, `auszugAbschnitte` den kuratierten Sammlungs-Auszug — die
   * UI bietet einen Umschalter zwischen beiden. null/leer ⇒ kein separater Auszug.
   */
  auszugAbschnitte?: EntscheidAbschnitt[];
  dispositivOrders: string[];
  /**
   * Nur gesetzt, wenn die amtliche QUELLE selbst (nicht nur eine aza-Auswahl)
   * nachweislich kontaminiert ist — `abschnitte`/`rubrum`/`zitierteNormen` gehören
   * dann NICHT zu diesem Entscheid und werden leer/null gehalten (§8, nie ein
   * fremder Body unter der eigenen Fundstelle). `regeste` bleibt unberührt, wenn
   * sie separat verifiziert amtlich ist. Format `<grund>:<fremdeFundstelle>`
   * (z.B. `ocl-konflation:152 V 20`) — die UI (`EntscheidBody.tsx`) zeigt bei
   * gesetztem Feld einen präzisierten Hinweis statt des generischen «kein
   * erfasster Text» (§8, D1-Auflage 12.9.2026). Anlassfall `bge_152_V_2`
   * (PR #816): OCLs Basis-Record für «152 V 2» liefert vollständig den Text von
   * «152 V 20» (live geprüft — Kopf-Provenienz erkennbar am laufenden Seitenkopf
   * «BGE 152 V 20 S. …» im Fliesstext).
   */
  quarantaene?: string;

  // ── Verzahnung ──
  zitierteNormen: string[];   // OCL statutes[] (Roh-Drittextraktion, NICHT verifiziert)
  normKeys: string[];         // normalisiert auf Register-key (build-time)
  zitierteEntscheide: string[];

  // ── Status (zwei Achsen) ──
  bestand: Bestandstatus;
  kuratierung: Kuratierungsstatus;  // Default 'maschinell' bis Abnahme

  // ── Provenienz / Drift ──
  quelle: Entscheidquelle;
  quelleUrl: string;          // amtliche Live-URL (bger.ch)
  abgerufen: string;          // ISO
  fassungsToken: string;      // OCL content_hash (Inhalts-/Verfügbarkeits-Fingerabdruck)
  sha: string;                // sha256EntscheidBloecke(abschnitte) — Regressions-/Drift-Anker
}

/** Eine Snapshot-Datei pro Entscheid (eintraege[0]). */
export interface EntscheidSnapshotDatei {
  erzeugt: string;
  eintraege: EntscheidSnapshot[];
}
