// ─── ECLI-Minting (European Case Law Identifier) ────────────────────────────
//
// Reine, deterministische Ableitung des ECLI aus einem Entscheid-Snapshot
// (§2: kein Date.now, kein I/O, keine Heuristik). Der ECLI ist der
// Interop-Schlüssel, über den unser Korpus mit europäischen Resolvern und mit
// OpenCaseLaw verknüpfbar wird.
//
//   Council of the EU 2011/C 127/01:  ECLI:<Land>:<Gericht>:<Jahr>:<ID>
//
// Portiert aus OpenCaseLaw `ecli.py` (MIT), aber an UNSERE reale Datenform
// angepasst: `bgeReferenz`/`nummer` tragen die BGE-Fundstelle OHNE «BGE»-Präfix
// («150 I 17»), kantonale `gericht`-Codes sind unterstrich-getrennt
// («zh_obergericht», «ag_gerichte»). Wo `ecli.py`-Docstring-Beispiele von der
// dortigen Implementierung abweichen (z.B. «ZHOG»), folgen wir dem CODE-Verhalten
// (erster Buchstabe je Unterstrich-Wort nach dem Kanton) — bewusst, treu zur
// deterministischen Regel, nicht zur Prosa.
//
// Der ECLI identifiziert den ENTSCHEID, nicht die Sprachfassung — trilinguale
// BGE teilen einen ECLI (Sprache separat über `sprache`/Schema.org inLanguage).

import type { EntscheidSnapshot } from './typen';
import { oclAktenzeichen } from './kantonale-gerichte';

/** Interne Gerichtscodes → ECLI-Gerichtskomponente (Bundesebene + Regulatoren). */
const GERICHT_ZU_ECLI: Record<string, string> = {
  // Bund — oberste
  bger: 'BGER',
  bge: 'BGE',
  bge_egmr: 'BGE', // BGE-formatige EGMR-Querverweise teilen den BGE-Namespace
  bge_historical: 'BGE',
  bvger: 'BVGER',
  bstger: 'BSTGER',
  bpatger: 'BPATGER',
  ch_bundesrat: 'BR',
  // Bund — Regulatoren
  finma: 'FINMA',
  finma_versicherungsrecht: 'FINMAV',
  weko: 'WEKO',
  edoeb: 'EDOEB',
  ubi: 'UBI',
  elcom: 'ELCOM',
  postcom: 'POSTCOM',
  comcom: 'COMCOM',
  // Bund — Militär
  mkg: 'MKG',
  // Bund — Zoll/Steuer
  bazg: 'BAZG',
  // Bund — international / Alt
  ecthr: 'ECHR',
  hudoc_ch: 'ECHR',
  emark: 'EMARK',
  ta_sst: 'TASST',
  // Kanton-präfigierte Codes werden dynamisch abgeleitet (kantonalesEcliGericht).
};

/** ECLI-ID-Zeichensatz laut Spec: a-z A-Z 0-9 . _ - (kein «/», keine Leerzeichen). */
const ECLI_ID_UNSICHER = /[^A-Za-z0-9._-]/g;

/**
 * BGE-Fundstelle, mit ODER ohne «BGE»-Präfix (unsere Daten führen sie ohne):
 * «150 I 17» bzw. «BGE 140 III 86» → vol / div / page.
 * Abteilung = römische Zahl (I–VI; BGE geht nie über VI, darum KEIN L/C/D/M)
 * plus optionaler Kleinbuchstabe für die historischen Abteilungen «Ia»/«Ib»/«Va».
 */
const BGE_FUNDSTELLE = /^(?:BGE\s+)?(\d+)\s+([IVX]+[ab]?)\s+(\d+)$/i;

/** Docket ECLI-ID-tauglich machen: «/»→«.», Leerraum→«.», Fremdzeichen weg. */
function normalisiereDocket(docket: string): string {
  let s = docket.trim();
  s = s.replace(/\//g, '.');
  s = s.replace(/\s+/g, '.');
  s = s.replace(ECLI_ID_UNSICHER, '');
  s = s.replace(/\.{2,}/g, '.');
  s = s.replace(/^\.+|\.+$/g, '');
  // Bewusste Abweichung von ecli.py (dort «unknown»-Fallback): normalisiert sich
  // ein Docket zu leer, gibt minteEcli null zurück statt eine bedeutungslose,
  // nicht-eindeutige ECLI zu prägen (§8: kein Schein-Identifier).
  return s;
}

/** 4-stelliges Jahr aus dem Datum (YYYY-Präfix) oder aus «/YYYY» im Docket. */
function jahrAus(datum: string | null | undefined, nummer: string | null | undefined): number | null {
  if (datum) {
    const m = /^(\d{4})/.exec(datum);
    if (m) return Number(m[1]);
  }
  if (nummer) {
    const m = /\/(\d{4})\b/.exec(nummer);
    if (m) return Number(m[1]);
  }
  return null;
}

/**
 * ECLI-Gerichtskomponente für einen kantonalen Gerichtscode: Kanton-Präfix
 * gross + Akronym aus den ersten Buchstaben der Unterstrich-Wörter danach.
 *   zh_obergericht  → ZHO      (ein Wort «obergericht» → «O»)
 *   ag_gerichte     → AGG
 *   be_zivil_straf  → BEZS
 */
function kantonalesEcliGericht(code: string): string {
  const trenn = code.indexOf('_');
  if (trenn === -1) return code.toUpperCase();
  const kanton = code.slice(0, trenn).toUpperCase();
  const rest = code.slice(trenn + 1);
  const akronym = rest
    .split('_')
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .join('');
  return kanton + (akronym || 'G');
}

/** Minimale Eingabe fürs Minten (testbar ohne vollen Snapshot). */
export interface EcliQuelle {
  gericht: string;
  nummer?: string | null;
  datum?: string | null;
  bgeReferenz?: string | null;
  /** Fallback-Quelle für die ID, falls kein Docket vorhanden ist. */
  id?: string | null;
}

/**
 * Mintet den ECLI. Gibt `null` zurück, wenn kein Jahr ableitbar ist (Jahr ist
 * laut Spec Pflichtkomponente) oder das Gericht fehlt — nie werfen, nie raten.
 */
export function minteEcli(q: EcliQuelle): string | null {
  const gericht = q.gericht?.trim();
  if (!gericht) return null;

  const jahr = jahrAus(q.datum, q.nummer);
  if (jahr === null) return null;

  // Gerichtskomponente
  const gerichtLc = gericht.toLowerCase();
  let ecliGericht: string;
  if (gerichtLc in GERICHT_ZU_ECLI) {
    ecliGericht = GERICHT_ZU_ECLI[gerichtLc];
  } else if (gerichtLc.includes('_')) {
    ecliGericht = kantonalesEcliGericht(gerichtLc);
  } else {
    ecliGericht = gerichtLc.toUpperCase();
  }

  // BGE: kanonische Form aus der Fundstelle (bgeReferenz bevorzugt, sonst nummer)
  if (ecliGericht === 'BGE') {
    const fundstelle = (q.bgeReferenz || q.nummer || '').trim();
    const m = BGE_FUNDSTELLE.exec(fundstelle);
    if (m) {
      const [, vol, div, page] = m;
      return `ECLI:CH:BGE:${jahr}:${vol}.${div.toUpperCase()}.${page}`;
    }
    // Kein kanonisches BGE-Format → generische Docket-Normalisierung unten.
  }

  // ID-Komponente
  let ecliId: string;
  if (q.nummer && q.nummer.trim()) {
    ecliId = normalisiereDocket(q.nummer);
  } else if (q.id && q.id.trim()) {
    // Kein Docket → stabile ID aus dem Snapshot-Key-Ende (Gerichts-Präfix strippen).
    let tail = q.id.trim();
    const praefix = gerichtLc + '_';
    if (tail.toLowerCase().startsWith(praefix)) tail = tail.slice(praefix.length);
    ecliId = normalisiereDocket(tail);
  } else {
    return null;
  }

  if (!ecliId) return null;
  return `ECLI:CH:${ecliGericht}:${jahr}:${ecliId}`;
}

/** Bequemlichkeit: ECLI direkt aus einem Entscheid-Snapshot minten. */
export function minteEcliFuerSnapshot(e: EntscheidSnapshot): string | null {
  return minteEcli({
    gericht: e.gericht,
    // Persistenter Identifikator: die ECLI bleibt aus der OCL-Form des Aktenzeichens gebildet
    // (GR: «SBK 2026 88»), auch wenn der Korpus seit U-16 die amtliche Form «SBK 26 88» zeigt.
    nummer: oclAktenzeichen(e.gericht, e.nummer),
    datum: e.datum,
    bgeReferenz: e.bgeReferenz,
    id: e.id,
  });
}
