/**
 * Fedlex-Extraktor — geteilte Typen (Split aus `extrahiere-fedlex.ts`, W2·27-BUND-FERTIG
 * PR 0, 2.10.2026: verhaltensneutral, Wortlaut der Interfaces unverändert verschoben).
 * `extrahiere-fedlex.ts` bleibt Fassade und re-exportiert diese Typen.
 */

export interface ArtikelText {
  /** G-AUFH-ART (W2·27) — GANZER Artikel amtlich aufgehoben. Regel + Belege + die Grenze «kein Signal ≠ gilt» (§7): `aufhebung-signal.ts`. */
  aufgehoben?: true;
  /** Amtlich «Gegenstandslos» (eigene Kategorie, NICHT «aufgehoben»): `aufhebung-signal.ts`. */
  gegenstandslos?: true;
  /** G23 (M8): Delegationsnorm-Verweis «(Art. N ArG)» aus
   *  <p class="man-template-referenz"> — die Trägergesetz-Grundlage, auf der eine
   *  Verordnungsbestimmung beruht. Steht in Fedlex direkt unter der Überschrift;
   *  wurde bisher von keiner Block-Alternative erfasst und stumm verworfen. */
  grundlage?: string;
  bloecke: Array<{
    absatz: string | null;
    text: string;
    /** Unter-Überschrift: Anhang-Ziffer-Titel (M13, h2–h6, Wert = Tiefe 2–6) und seit P6 die
     *  Ziffer-Überschrift im Artikel (Tiefe 3, `ziffer-ebene.ts`). Render-Hinweis, nicht im sha —
     *  der Titel-Text steht in `text` und ist dort abgedeckt. */
    titel?: number;
    /** Ziffer-Ebene (P6): Ziffer-Marke, zu der dieser Block gehört; nicht im sha. */
    ziffer?: string;
    items?: Array<{ marke: string; text: string; tiefe?: number; trenner?: string }>;
    /** Anhang-Zwischennotiz (P4, W2·27-BUND-FERTIG): Ebene (`tiefe`, 0 = Wurzelliste) der marke-losen Zeile,
     *  die diesen Block ausmacht — `text` ist die Zeile, `items` ihre Unterliste. Render-Hinweis wie `titel`/
     *  `ziffer`, nicht im sha: Einrückung der Zeile auf die Ebene ihres Eltern-Punkts und Kette des Zitats
     *  über die Blockgrenze (ArtikelBody.helfer.ts `anhangVorKette`). Nur Anhang-Einträge tragen das Feld. */
    einzug?: number;
    /** Fedlex-<table> als Mehrspalten-Block (Bug-Fix 23.6.2026: Tabellen wurden
     *  zuvor komplett gedroppt — z.B. IVG art_28b Rententabelle, AHVG art_34bis).
     *  M10: kanonisches `spalten`-Modell (T-B1) statt rohem `{kopf,zeilen}`. */
    mehrspaltig?: {
      spalten?: Array<{ typ: 'bereich' | 'zahl' | 'text' | 'betrag'; titel: string }>;
      kopf?: string[];
      zeilen: string[][];
    };
    /** Bilder/Formeln (Bündel «Bilder & Formeln», 1.7.2026): Fedlex liefert
     *  Piktogramme (SSV/VTS/chem. Warnzeichen) UND Formeln als `<img>`. `entferneTags`
     *  verwarf sie bisher stumm. `bild` = EIN Standalone-Bild/Formel (`<p class="bild">
     *  <img>`); `bildKacheln` = flaches Karten-Raster aus einem reinen Piktogramm-Katalog
     *  (SSV Anhang 2). `datei` trägt nach der Extraktion die RELATIVE Quell-src
     *  («image/imageN.png»); der Generator (normtext-snapshot) rechnet sie zur amtlichen
     *  Filestore-URL, lädt herunter, setzt `datei` auf den lokalen Pfad + `sha`. */
    bild?: BildRef;
    bildKacheln?: Array<{ bild?: BildRef; nummer?: string; name?: string }>;
  }>;
}

export interface BildRef {
  /** Nach Extraktion: relative Quell-src («image/imageN.png»). Nach Generator-
   *  Lauf: lokaler Pfad («bilder/<erlass>/imageN.png»). */
  datei: string;
  alt: string;
  formel?: boolean;
  breite?: number;
  hoehe?: number;
  /** sha256 über die Bild-Bytes (§7-Drift) — vom Generator gesetzt. */
  sha?: string;
}

export interface AnhangText {
  /** Echter Fedlex-Titel des Anhangs («Anhang 1», «Anhang 1.1», «Anhang 4a»),
   *  aus der ersten <hN class="heading"> der Sektion. */
  titel: string;
  bloecke: ArtikelText['bloecke'];
  /** Leerer Körper + amtlicher Kopf-Vermerk (W2·27, `anhangAmtlichesSignal`). */
  aufgehoben?: true;
  gegenstandslos?: true;
}
