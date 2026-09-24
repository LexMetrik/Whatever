import { createContext, useContext } from 'react';

// ─── Startseite · «die Bewegung ist durch» (W2·29-WERKBANK-START-FEINSCHLIFF) ──
//
// Das Kachelfeld meldet hier, ob die Öffnungsbewegung des Blatts abgeschlossen
// ist. Blätter, die grosse Register laden (Rechtsprechung 9,4 MB, Materialien
// und Normtext je ~1,5 MB), starten den Abruf erst dann: Parsen und erstes
// Rendern kosten ein langes Bild, und mitten in der 450-ms-Bewegung ist das
// sichtbares Ruckeln (gemessen 24.9.2026 @1280: 83 ms bei Rechtsprechung).
// Vorgabe `true`: ausserhalb des Feldes (Tests, Deep-Link, reduzierte
// Bewegung) wird sofort geladen. §15 bleibt: geladen wird nie vor dem Öffnen.
export const BlattRuheKontext = createContext(true);

export const useBlattRuhe = () => useContext(BlattRuheKontext);
