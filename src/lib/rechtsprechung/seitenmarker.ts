// ─── Seitenvermerk der amtlichen BGE-Sammlung ausserhalb des Normzitats (U-04) ──
//
// Die amtliche Sammlung (und mit ihr der OCL-/clir-Auszug) fügt an jedem Seitenwechsel den
// laufenden Kolumnentitel «BGE 147 III 218 S. 221» mitten in den Satz ein — auch MITTEN IN
// EIN NORMZITAT: «… von Art. 257d BGE 147 III 218 S. 221 Abs. 1 OR». Zwei Folgen (U-04,
// plan/FEHLERBESTAND.md):
//   · im Text liest jede Zitat-Erkennung «Art. 257d BGE» als Norm-Zitat (Phantom);
//   · die OCL-Roh-Extraktion `statutes[]` übernimmt das Phantom als Eintrag
//     «Art. 257d BGE» in `zitierteNormen` (Messung 11.10.2026, Stand vor U-04: 40× «Art. N BGE» und
//     14× «Art. N Abs. N BGE» = 54 Phantom-Einträge in 53 Dateien, alle unter public/rechtsprechung/bund/bge).
//
// Wurzel-Fix: der Vermerk wird VOR das Normzitat gestellt («… von BGE 147 III 218 S. 221
// Art. 257d Abs. 1 OR»), nicht gelöscht — die Seitenzahl bleibt erhalten (die Anzeige macht
// daraus den hochgestellten Marker, EntscheidBody.tsx/A1), der Wortbestand ist unverändert.
// Phantom-Einträge in `zitierteNormen` entfallen: sie nennen keinen Erlass, und das echte
// Zitat steht (jetzt zusammenhängend) im Text.

/** Laufender Kolumnentitel der amtlichen Sammlung, z.B. «BGE 147 III 218 S. 221» (DE). */
const MARKER = /\bBGE\s+\d{1,3}\s+[IVXLCDM]+[ab]?\s+\d+\s+S\.\s*\d+\b/g;

/**
 * Zitat-Kopf direkt vor dem Marker: «Art. 257d», «Abs. 2», «Ziff. 3», «lit. b», «Satz 1»,
 * «§ 12», «N. 13», «Rz. 5», auch «aArt. 47» (altes Recht). Endet am Marker-Anfang; der Kopf beginnt an einer Wortgrenze.
 */
const KOPF_VOR_MARKER = /(?<![\p{L}\p{N}])(?:(?:(?:a|n)?Art\.|Abs\.|Ziff\.|Satz|Bst\.|N\.|Rz\.|Anm\.|§)\s*\d+[a-z]{0,9}|lit\.\s*[a-z]{1,2})\s+$/u;

/**
 * Stellt jeden Kolumnentitel, der ein Normzitat zerreisst, vor das Zitat. Rein, deterministisch,
 * idempotent; Text ohne solchen Marker kommt zeichengleich zurück (§6). Zusammenhängende
 * Zitat-Köpfe («Art. 391 Abs. 2 Satz 1 BGE …») wandern gemeinsam; der Marker steht danach vor
 * dem ersten Kopf-Glied. Wortinvariante: ohne die Marker ist Vorher == Nachher.
 */
export function verlegeSeitenmarkerVorNormzitat(text: string): string {
  if (!text.includes('S.')) return text;
  let aktuell = text;
  // Pro Durchlauf wird höchstens EIN Marker verlegt; Neustart, weil sich die Indizes
  // verschieben. Abbruch garantiert: jede Verlegung verkürzt das Vorfeld des Markers.
  for (let schutz = 0; schutz < 10_000; schutz++) {
    let verlegt = false;
    for (const m of aktuell.matchAll(MARKER)) {
      const start = m.index!;
      let kopfStart = start;
      // Kopf-Glieder rückwärts einsammeln, solange sie unmittelbar (nur Leerraum) aneinanderstossen.
      for (;;) {
        const vor = aktuell.slice(0, kopfStart);
        const k = KOPF_VOR_MARKER.exec(vor);
        if (!k) break;
        kopfStart = k.index;
      }
      if (kopfStart === start) continue;
      const kopf = aktuell.slice(kopfStart, start).trimEnd();
      const ende = start + m[0].length;
      aktuell = aktuell.slice(0, kopfStart) + m[0] + ' ' + kopf + aktuell.slice(ende);
      verlegt = true;
      break;
    }
    if (!verlegt) return aktuell;
  }
  return aktuell;
}

/**
 * Phantom-Eintrag der OCL-Roh-Extraktion: ein Norm-Zitat, das statt mit einem Erlass-Kürzel
 * mit «BGE» endet («Art. 257d BGE», «Art. 2 Abs. 2 BGE»). «BGE» ist kein Erlass.
 */
export function istPhantomNormzitat(eintrag: string): boolean {
  return /^(?:Art\.|Abs\.|Ziff\.|§)\s*\d.*\s(?:BGE|ATF|DTF)$/u.test(eintrag.trim());
}

/** `zitierteNormen` ohne Phantom-Einträge (Reihenfolge und Rest unverändert, idempotent). */
export function bereinigeZitierteNormen(normen: readonly string[]): string[] {
  return normen.filter((n) => !istPhantomNormzitat(n));
}
