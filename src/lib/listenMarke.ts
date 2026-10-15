// Marke-lose Listenzeilen — EINE Stelle (§5) für die Lese-Hülle (ArtikelBody.helfer) und
// das Prerender-HTML (seo-detail). Reine Funktion, keine UI-Abhängigkeit (§3).

/** Marke-lose Zeile: `''` (W2·27) ODER der literale Fedlex-Abstandshalter «[tab]».
 *  Fedlex serialisiert einen leeren Listen-Abstandshalter als Text «[tab]»; 23 Bund-
 *  Snapshots tragen ihn noch als Marke (Sanierung = deferierter [tab]-Batch der
 *  Extraktion, B-63). Anzeige und Zitat behandeln ihn wie `''` — keine Marke, kein
 *  Zitierknopf (LESER-NAV/O-34c: sonst «Art. 41 Abs. 1 lit. [tab] ASYLV 2»). Die
 *  Daten bleiben unberührt. EINE Stelle (§5). */
export function istLeerMarke(marke: string): boolean {
  return marke === '' || marke.trim() === '[tab]';
}
