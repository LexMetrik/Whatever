// Ein Snapshot-Eintrag = genau EIN Artikel eines Erlasses, mit Provenienz.
// §7-Zitat-Ausnahme: stand + quelleUrl + abgerufen sind PFLICHT (kein Default).
export interface NormSnapshot {
  /** Stabiler Schlüssel, z.B. 'bund/OR/art_335_c' oder 'kanton/BE/161.12/art_4'. */
  id: string;
  ebene: 'bund' | 'kanton';
  /** Bund: FedlexGesetz-Key ('OR'). Kanton: Kantonskürzel ('BE'). */
  quelle: string;
  /** Erlass-Bezeichnung wie zitiert ('OR', 'GebV OG / LS 211.11'). */
  erlass: string;
  /** Artikel-Token wie im Anker ('335_c', '4'); Paragraf-Erlasse: '4'. */
  artikel: string;
  /** Menschliche Artikel-Bezeichnung ('Art. 335c', '§ 4'). */
  artikelLabel: string;
  /**
   * N1 (BS-Audit 23.6.2026) — amtlicher Randtitel (Sachtitel) des Artikels, falls
   * die Quelle einen trägt (LexWork article_title). Fehlt er oder ist er nur der
   * Aufhebungs-Platzhalter «…», bleibt das Feld weg (§7: nichts fabrizieren). Wird
   * in der Lesesicht als Randtitel angezeigt.
   */
  titel?: string;
  /**
   * G-AUFH-ART (W2·5j/W2·27) — ARTIKEL-genau aufgehoben (nicht zu verwechseln mit
   * `ErlassAufhebung`/register-typen.ts, das den GANZEN Erlass betrifft).
   *
   * BUND (W2·27, seit 14.9.2026): gesetzt aus dem AMTLICHEN Aufhebungs-Vermerk
   * der Fedlex-Fussnote — Kopf-Marker des Artikels oder Marker jedes «…»-Absatzes
   * bzw. der amtliche Wortlaut «Aufgehoben» selbst. Regel, Belege und die drei
   * bewusst NICHT markierten Klassen: `scripts/normtext/aufhebung-signal.ts`.
   *
   * KANTON: vom LexWork-Adapter NUR gesetzt, wenn das Artikel-Segment nach vollständiger
   * Extraktion buchstäblich KEINEN Body-Block liefert (kein paragraph, keine
   * enumeration_item/enumeration_tabular, kein paragraph_post-Inhalt) — ein rein
   * STRUKTURELLES Signal aus der Quelle (Numerierungs-Slot ohne jeden Wortlaut),
   * NICHT eine Ableitung aus «Text ist zufällig leer» (§7: Adapter-Regel in
   * adapter-lexwork.ts, extrahiereAlleLexWorkArtikel/parseSegment). Trägt der
   * Artikel einen `titel`, bleibt er erhalten (aufgehobene Artikel behalten ihren
   * amtlichen Randtitel als historische Marginalie, z.B. BS 132.100 §76a/§76b).
   * Fehlt das Feld, ist NICHTS über den Aufhebungsstatus bekannt (§7: nichts
   * fabrizieren) — die Lesesicht fällt dann auf die ältere Text-Heuristik
   * (`artikelGanzAufgehoben`) zurück, die aus dem historischen Bund-Bestand ohne
   * dieses Feld entstand. Diese Restmenge ist seit W2·27 gezählt und gedeckelt:
   * `npm run check:leerstellen` (Basislinie 14.9.2026: Bund 98, Kanton 481).
   */
  aufgehoben?: true;
  /**
   * G23 (M8) — Delegationsnorm-Verweis «(Art. N ArG)» aus Fedlex
   * (<p class="man-template-referenz">): das Trägergesetz-Fundament einer
   * Verordnungsbestimmung. Artikel-level Metadatum wie titel (NICHT im Block-sha,
   * golden-neutral); fehlt, wenn die Quelle keinen Verweis trägt (§7: nichts
   * fabrizieren). Wird in der Lesesicht als dezente Grundlagen-Zeile angezeigt.
   */
  grundlage?: string;
  /**
   * Absatz-/Marginalie-Blöcke in Reihenfolge; absatz: '1','2','a','bis' …
   * - text: Einleitungstext des Absatzes OHNE die Listenpunkte.
   * - items (optional): lit./Ziff.-Aufzählungspunkte des Absatzes. marke ist
   *   die nackte Marke ('a','b','17','5a','20a') ohne Punkt/Klammer; text der
   *   Punkttext. Fehlt items, hat der Absatz keine Aufzählung (rückwärtskompat.).
   *   tiefe (optional): explizite Verschachtelungsstufe (0 = direkte Liste des
   *   Absatzes, weggelassen; 1+ = in eine Eltern-lit/Ziff. verschachtelt). Die
   *   Lesesicht zitiert damit korrekt, ohne die Stufe aus dem Markentyp zu raten
   *   (§1, M6). Fehlt tiefe, ist das Item auf Stufe 0 (oder Kanton-Daten ohne
   *   Stufeninfo → Lesesicht-Heuristik).
   */
  bloecke: Array<{
    absatz: string | null;
    text: string;
    /** M13-Annex: Unter-Überschrift innerhalb eines Anhangs (Ziffer-Titel, h2–h6).
     *  Wert = Heading-Tiefe (2–6). Nur Anhang-Einträge tragen das Feld; der
     *  Renderer (ArtikelBody) zeigt den `text` dann als Zwischenüberschrift. */
    titel?: number;
    /** `trenner` (#679, 12.9.2026): der AMTLICHE Trenner hinter der <dt>-Marke
     *  der Quelle — ':' (Label/Kategorie, «BE:»), ')' (Ordinalmarke «a)»), '.'
     *  (Punkt bei nicht-kanonischer Marke) oder '' (kein Trenner, «BAS»).
     *  FEHLT das Feld, ist es der Normalfall «kanonische Ordinalmarke + Punkt»
     *  ODER eine Quelle, die den Trenner nicht mitführt (Kanton-Adapter) — die
     *  Lesesicht fällt dann auf ihre Marken-Heuristik zurück
     *  (ArtikelBody.helfer.ts `markenArt`). */
    items?: Array<{ marke: string; text: string; tiefe?: number; trenner?: string }>;
    /** Stufe 1: Füllpunkt-Tarifzeilen (Beschreibung | Betrag). */
    tabelle?: Array<{ beschreibung: string; betrag: string }>;
    /**
     * VERWEIS-Spalte einer Tarif-Zeile, quellgetreu getrennt (ZH-243, A2 der
     * ZH-Fix-Runde 3). `etikett` ist der am amtlichen Spaltenkopf GELESENE Titel
     * («Grundbuchgebühren siehe Ziff.:» bzw. «Beurkundungsgebühren siehe
     * Ziff.:»), `ziffern` sind die Zellen-Werte. Vorher hängte der Generator
     * daraus ein «(vgl. Ziff. …)» an den Zitattext — ein Zusatz, den kein
     * amtliches PDF trägt (§7), und beide Spalten kollabierten dabei auf
     * denselben Wortlaut. Optional; nur Anhang-Tarif-Einträge tragen das Feld.
     */
    verweis?: { etikett: string; ziffern: string };
    /**
     * Stufe 2: Mehrspalten-Tabelle (Streitwert/Grundgebühr/Zuschlag u.ä.).
     *
     * KANONISCHES MODELL (T-B1, M10): `spalten` ist der explizite Spalten-Vektor
     * und die EINZIGE Quelle der Spaltenzahl N. Harte Invariante (T-B2): für jeden
     * emittierten Block gilt `spalten.length === N` und `∀i: zeilen[i].length === N`.
     * `typ` steuert Ausrichtung + Format (T-B4): `bereich`/`text` links; `zahl`/
     * `betrag` rechts mit Tausender; `bereich` trägt die generatorseitig verdichtete
     * Staffel-Spanne (T-A6, verlustfreie Konkatenation amtlicher Token, T-E2).
     *
     * ABWÄRTSKOMPAT (L0/§7): `kopf?` ist das Alt-Schema — noch nicht migrierte
     * KANTON-Snapshots tragen `{kopf,zeilen}` ohne `spalten`. Der Renderer rendert
     * beide; neue Bund-Snapshots tragen IMMER `spalten`. Genau EINES von beiden ist
     * massgeblich: `spalten` hat Vorrang, `kopf` ist Legacy-Fallback.
     */
    mehrspaltig?: {
      spalten?: Array<{ typ: 'bereich' | 'zahl' | 'text' | 'betrag'; titel: string }>;
      /** Legacy (Kanton/Alt-Bund): Spaltenköpfe ohne Typ. Vom Renderer als Fallback gerendert. */
      kopf?: string[];
      zeilen: string[][];
    };
  }>;
  /** Konsolidierungs-/Fassungsdatum der Quelle (ISO 'YYYY-MM-DD'). */
  stand: string;
  /** Amtliche Live-URL (mit Anker, wenn vorhanden). */
  quelleUrl: string;
  /** Abrufdatum des Snapshots (ISO). */
  abgerufen: string;
  /**
   * Drift-Token (§7 d): Bund=Konsolidierung 'YYYYMMDD'; LexWork=version_uid
   * (MD5); HTM/ZH=quelleHash (sha256 des extrahierten Volltexts).
   */
  fassungsToken: string;
  /** sha256 des extrahierten Volltexts — Regressions-/Drift-Anker. */
  sha: string;
}

/** Eine Snapshot-Datei pro Erlass/Kanton. */
export interface NormSnapshotDatei {
  erzeugt: string;
  eintraege: NormSnapshot[];
}
