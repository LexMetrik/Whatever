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

/**
 * W2·32 (Nachzug 5.10.2026, I1): ein Anweisungs-Ereignis, das Fedlex am Artikel schon selbst als Fussnote trägt («Ausdruck gemäss …
 * im ganzen Erlass berücksichtigt», ZGB 1/4/25, OR 545, StGB 1), steht nicht zweimal in der Chronik. Gleich = Typ (eine In-Kraft-Klausel
 * ohne Verb, `inkraft`, deckt jeden Typ), Datum, Amtsblatt-Fundstelle und Absatz (eine Fussnote ohne Absatz gilt für den ganzen Artikel).
 * Nie gegen Überschrift-Ereignisse (`ueberschrift`): sie zählen nicht in «Gilt seit», die Anweisung muss dort tragen; nie gegen andere
 * Anweisungs-Ereignisse (`anweisung`): zwei Anweisungen am selben Artikel sind zwei Ereignisse.
 */
export function schonAlsFussnote(
  vorhanden: ReadonlyArray<{ typ: string; datum: string | null; absatz: string | null; ueberschrift?: string; anweisung?: string; quellen: ReadonlyArray<{ label: string }> }>,
  a: { typ: string; datum: string | null; absatz: string | null; quellen: ReadonlyArray<{ label: string }> },
): boolean {
  const as = a.quellen[0]?.label;
  return vorhanden.some(
    (e) =>
      !e.ueberschrift && !e.anweisung && e.datum === a.datum && (e.typ === a.typ || e.typ === 'inkraft') && (e.absatz === null || e.absatz === a.absatz) &&
      e.quellen.some((q) => q.label === as || q.label.startsWith(`${as} `)),
  );
}
