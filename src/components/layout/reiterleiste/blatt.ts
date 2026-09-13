// ═══ W2·18 Punkt 6 · DER ZUSTAND DES «+N»-BLATTS ════════════════════════════
//
// BELEG 13.9.2026 (Fahrplan §4.R Ziff. 6): das Suchfeld des Überlauf-Blatts
// behielt seinen Wert über das Schliessen hinweg. Wer «zpo» eingab, einen
// Reiter wählte und das Blatt später wieder öffnete, sah eine Liste, in der
// Reiter «fehlten» — ohne dass die Ursache im Bild stand.
//
// DIE URSACHE WAR DIE FORM, NICHT DAS VERGESSEN: «Blatt offen?» und «Filter»
// lagen als ZWEI Zustände nebeneinander, und das Blatt hat ACHT Schliess-Wege
// (✕, Esc, Klick daneben, Navigation, «daneben öffnen», «Neuer Reiter»,
// «Wieder öffnen», «Alle schliessen»). Jeder einzelne hätte an den zweiten
// Zustand denken müssen. Als EIN Zustand kann der Fall nicht mehr eintreten:
// zu ist `BLATT_ZU`, und `BLATT_ZU` trägt keinen Filter.

/** Blatt-Zustand: offen oder nicht, und der Filtertext des Suchfelds. */
export interface BlattZustand { offen: boolean; suche: string }

/** Der geschlossene Zustand — immer ohne Filter. Eine Konstante, kein
 *  Literal je Aufrufer: ein achter Schliess-Weg kann sie nicht anders
 *  schreiben, als die sieben anderen es tun (§5). */
export const BLATT_ZU: BlattZustand = { offen: false, suche: '' };
