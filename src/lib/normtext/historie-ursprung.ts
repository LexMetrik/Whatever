/**
 * W2·27-BUND-FERTIG (3.10.2026): «Ursprünglich …»-Vorsatz an Überschrift-Fussnoten.
 *
 * Fedlex vermerkt an einer Gliederungsüberschrift oft zuerst deren Ur-Bezeichnung und erst danach die Fassung:
 * «Ursprünglich vor Art. 56. Fassung gemäss Ziff. II 13 des BG vom 20. März 2009 …» (EBG 59), «Ursprünglich Bst. D, danach
 * Bst. E. Eingefügt durch … Fassung gemäss …» (AHVV 66bis). Der B1-Anker (`ganzeFassung`, historie-parse.ts) verlangt, dass
 * die Fussnote mit «Fassung gemäss»/«Eingefügt durch»/«Fassung des <Ordnungszahl> Titels …» BEGINNT — der Vorsatz liess ihn
 * ins Leere laufen, und die Artikel unter der Überschrift zeigten «nichts erfasst».
 *
 * Dieses Modul liefert nur die Kandidaten für den Schnitt: jede Satzgrenze («. »), hinter der ein Rest beginnt, samt dem
 * abgetrennten Vorsatz. Ob der Rest ein gültiger B1-Anker ist und ob der Vorsatz reine Ur-Bezeichnung ist (kein weiteres
 * Ereignis-Verb), entscheidet der Aufrufer — damit die Anker-Grammatik EINE Quelle bleibt (§5).
 */

/** «Ursprünglich» als GANZES Wort am Text-Anfang (nach optionaler Fussnoten-Ordnungsnummer), Doppelpunkt optional. */
const URSPRUNG_VORSATZ_RE = /^\s*(?:\d+[a-z]*\s+)?Ursprünglich(?::|(?=\s|$))/;

/** Satzgrenze: Punkt, Leerraum, dann Grossbuchstabe (Abkürzungen wie «Bst. D,» oder «Abschn. a.» kommen als Kandidat vor,
 *  scheitern aber am Anker des Aufrufers — gewählt wird der ERSTE Kandidat mit gültigem Anker). */
const SATZGRENZE_RE = /\.\s+(?=[A-ZÄÖÜ])/g;

/** Kandidaten (Vorsatz, Rest) für den Schnitt, in Textreihenfolge; leer, wenn der Text nicht mit «Ursprünglich» beginnt. */
export function ursprungVorsatzSchnitte(text: string): Array<{ vorsatz: string; rest: string }> {
  if (!URSPRUNG_VORSATZ_RE.test(text)) return [];
  const aus: Array<{ vorsatz: string; rest: string }> = [];
  const re = new RegExp(SATZGRENZE_RE.source, 'g');
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    aus.push({ vorsatz: text.slice(0, m.index + 1), rest: text.slice(m.index + m[0].length) });
  }
  return aus;
}
