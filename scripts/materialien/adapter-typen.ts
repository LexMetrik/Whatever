// scripts/materialien/adapter-typen.ts
// E6a Stufe 1: gemeinsame Ergebnis-Typen der browserlosen Soft-Law-Adapter (§3). Der SECO-Adapter
// (M2) trägt seine eigenen, engeren Literale (behoerde:'SECO' …); ab M3 (EDÖB) brauchen mehrere
// Behörden/Doktypen EINE gemeinsame, weitere Form, die der Orchestrator (soft-law-snapshot.ts)
// generisch materialisiert. Die engeren SECO-Typen sind strukturell zuweisbar (BehoerdeId ⊇ 'SECO').

import type { BehoerdeId, DoktypId, Rechtsgebiet, Sprache } from '../../src/lib/materialien/typen.ts';

/** Ein Soft-Law-Dokument, §7-a–d-fähig; trägt alle Karten-Felder für Browse (§0/B6) +
 *  JSONL-Rekonstruktion (dokZeileVon im Orchestrator). Weiter als der SECO-eigene Typ. */
export interface SoftLawDok {
  id: string;
  behoerde: BehoerdeId;
  doktyp: DoktypId;
  titel: string;
  nummer: string | null; // Anzeige-Nummer oder null (EDÖB: keine Nummern-Systematik)
  rechtsgebiet: Rechtsgebiet;
  sprache: Sprache;
  rang: number;
  normKeys: string[];
  hinweis: string | null;
  quelle_url: string; // §7 b (amtliche PDF-URL)
  stand: string; // ISO, §7 a
  stand_quelle: 'hub-label' | 'hub-beschreibung' | 'pdf-text' | 'pdf-meta' | 'payload' | 'toc' | 'ziffer-datum';
  abgerufen: string;
  drift_token: string; // §0/A8: Insert muss liefern
  quell_ids: Record<string, unknown>;
  sha: string;
}

/** Eine Norm-Referenz-Kante (soft_law → Erlass[-Artikel]). Weiter als der SECO-eigene Typ. */
export interface NormRefKante {
  quelldok_id: string;
  erlass_key: string;
  artikel: string; // Korpus-Token oder '' (Erlass-Ebene)
  zitat_key: string;
  roh_zitat: string;
  konfidenz: string; // 'regex-hoch' | 'regex-niedrig' | 'unresolved'
  quelle: string; // 'amtlich' | 'kuratiert' | 'maschinell'
  fundstelle: string;
  fundstelle_url: string | null;
  stand: string;
  abgerufen: string;
}

/** Ergebnisvertrag §3. */
export interface AdapterErgebnis {
  dokumente: SoftLawDok[];
  kanten: NormRefKante[];
  indexSha: string;
  abgerufen: string;
}

// ─── Rechtsgebiet je Absender — EINE Quelle (§5) ──────────────────────────────
//
// ANLASS: Gegenprüfung 29.8.2026, Befund F5. Nach der W2-Trennung trugen 138
// ausgelieferte Materialien weiterhin das abgelöste Rechtsgebiet
// 'sozial-abgaben'. Die Adapter waren umgestellt, der PERSISTIERTE Bestand in
// `bibliothek/register/soft-law-zustand.jsonl` nicht — und nichts verglich die
// beiden. Die Regel selbst stand bis dahin dreimal als Literal in den Adaptern
// und ein viertes Mal als Sonderfall im Nachzieh-Skript; es gab keinen Ort, an
// dem sie prüfbar formuliert war.
//
// Die Regel ist deterministisch und braucht keine Einzelfall-Kenntnis: der
// ABSENDER entscheidet. Die ESTV ist die Eidgenössische STEUERverwaltung —
// ihre Kreisschreiben, Rundschreiben und MWST-Infos sind ausnahmslos
// Steuerdokumente. SECO (Arbeitsmarkt/Wirtschaft) und EDÖB (Datenschutz)
// produzieren Verwaltungsrecht.
//
// Wer eine neue Soft-Law-Quelle anschliesst, trägt sie hier ein; sonst meldet
// das Tor in materialien-register.test.ts die unbekannte Behörde, statt sie
// still durchzulassen.
export const BEHOERDE_RECHTSGEBIET: Readonly<Record<string, Rechtsgebiet>> = {
  ESTV: 'steuern',
  SECO: 'oeffentlich',
  EDOEB: 'oeffentlich',
};
