/**
 * Form-Erkennung von Überschrift-Fussnoten (aus historie-parse.ts ausgelagert, §6.6; reine Textfunktionen ohne Abhängigkeit,
 * von historie-parse.ts wieder ausgeführt — Importe bleiben unverändert).
 */

/**
 * B1 (Nachzug 2.10.2026): eine GANZE Fassung — die Fussnote beginnt (nach führendem Marker/Leerraum) mit «Fassung gemäss …»,
 * «Eingefügt durch …» oder «Fassung des <Ordnungszahl> Titels/Abschnitts/Kapitels …». Nur sie gilt für den ganzen Bereich unter
 * der Überschrift. Teil-Formeln — «Fassung dieses Wortes gemäss …» (ZGB 457–460), «Fassung des Randtit. …» (ZGB 20/21),
 * «Fassung des Tit. …» (AHVG 42/43), «Titel eingefügt durch …» — nennen die Überschrift
 * selbst oder einen Teil und werden nicht vererbt; Satzfragmente («… in der Fassung des BG …») erst recht nicht (B5).
 * Ein «Ursprünglich …»-VORSATZ vor dem Anker schneidet `ohneUrsprungVorsatz` vorher ab.
 */
export function ganzeFassung(text: string): boolean {
  return /^\s*(?:\d+[a-z]*\s+)?(?:Fassung gemäss|[Ee]ingefügt durch|Fassung des [^\s]+ (?:Titels|Abschnitts|Kapitels))/.test(text);
}

/**
 * W2·32: alle Inkrafttretens-Daten der Fussnote hängen an einer Teil-Klausel (Abschn./Art./Abs. …); unmittelbar nach dem
 * Erlass-Kopf («… des BG vom 15. Juni 2012, Abschn. 2 in Kraft seit …») steht kein unqualifiziertes Haupt-Datum.
 * Beispiel SVG 89a–89c: Abschn. 2 → 2013, Abschn. 3 → 2014, Abschn. 1 → 2019. Gegenbeispiel AHVG 39 («… (AHV 21), in Kraft
 * seit 1. Jan. 2024, Art. 40c in Kraft vom …»): das Haupt-Datum gilt für den Träger.
 */
export function nurTeilDaten(text: string): boolean {
  return /\bvom\s+\d{1,2}\.\s+\p{L}+\.?\s+\d{4}(?:\s*\([^)]*\))?\s*,\s*(?:Art|Abschn|Abs|Bst|Kap|Ziff|Tit)\.\s*\d/u.test(text);
}
