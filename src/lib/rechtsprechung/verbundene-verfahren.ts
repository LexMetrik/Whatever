// ─── Verbundene Verfahren: das amtliche Aktenzeichen trägt alle Nummern (U-25) ────────
//
// OCL führt bei einem Entscheid über mehrere vereinigte Verfahren nur die ERSTE Nummer
// (`docket_number` «RR.2025.198»); das Urteil selbst nennt im Kopf alle («Numéros de dossiers:
// RR.2025.198-199», Bundesstrafgericht, Urteil vom 26. August 2026, bstger.weblaw.ch, abgerufen
// 11.10.2026; ebenso BV.2026.10-11: «Numero dell'incarto: BV.2026.10-11»). Zitiert wird das
// Aktenzeichen des Kopfes. Rein, deterministisch (§2); ohne ausdrücklichen Kopf-Beleg bleibt die
// OCL-Nummer stehen (§7, nichts raten).

const LABEL = String.raw`(?:Num[ée]ros?\s+de\s+dossiers?|Numeri?\s+dell['’]incarto|Numero\s+dell['’]incarto|Numeri\s+degli\s+incarti|Geschäftsnummern?|Verfahrensnummern?)`;

/** Bundesstrafgericht-/BVGer-Form «RR.2025.198»; andere Formen werden nie erweitert. */
const BSTGER_FORM = /^[A-Z]{2}\.\d{4}\.\d+$/;

/**
 * Das im Urteilskopf ausgewiesene Aktenzeichen verbundener Verfahren («RR.2025.198-199»), wenn
 * der Kopf (erste 4000 Zeichen) hinter dem Etikett «Numéros de dossiers:» o. ä. die OCL-Nummer
 * mit «-<Zahl>» erweitert nennt; sonst die OCL-Nummer unverändert.
 */
export function verbundenesAktenzeichen(docket: string, fullText: string | null | undefined): string {
  if (!BSTGER_FORM.test(docket) || !fullText) return docket;
  const kopf = fullText.slice(0, 4000);
  const re = new RegExp(`${LABEL}\\s*:\\s*(${docket.replace(/\./g, '\\.')}-\\d{1,4})(?![\\d.])`, 'i');
  return re.exec(kopf)?.[1] ?? docket;
}

/** Erste Nummer eines verbundenen Aktenzeichens («RR.2025.198-199» → «RR.2025.198»), sonst unverändert. */
export function erstesAktenzeichen(nummer: string): string {
  return nummer.replace(/^([A-Z]{2}\.\d{4}\.\d+)-\d{1,4}$/, '$1');
}

/** Zitierung mit der erweiterten Nummer, wenn sie die alte Nummer als ganzes Wort enthält (sonst unverändert). */
export function zitierungMitVerbundenemAz(zitierung: string, alt: string, neu: string): string {
  if (neu === alt) return zitierung;
  const i = zitierung.indexOf(alt);
  return i >= 0 && !/[\w.-]/.test(zitierung[i + alt.length] ?? ' ') ? zitierung.slice(0, i) + neu + zitierung.slice(i + alt.length) : zitierung;
}
