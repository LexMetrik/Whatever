import { useCallback, useState } from 'react';

// ── W2·29-WERKBANK-REST S1 · ZUSTAND DER ENTSCHEID-SUCHE ─────────────────────
//
// Suchbegriff und Marken-Schalter «Hervorhebung» (W2·28 · L-2) des
// Entscheid-Lesers. Eigene Datei, damit die Zusage testbar ist, ohne den
// ganzen Leser zu montieren (`react-refresh/only-export-components`: ein Hook
// neben einer Komponente bricht Fast Refresh).
//
// DIE ZUSAGE (Posten «Marken-Schalter setzt sich nach Leeren der Suche nie
// zurück», 21.9.2026): der Kommentar im Leser versprach «Wer das Feld leert,
// findet beim nächsten Suchen wieder Farbe vor» — tatsächlich setzte nur der
// Schalter-Klick den Zustand, und das Leeren MASKIERTE ihn bloss, solange das
// Feld leer war. Nach Leeren + Neu-Tippen war die Hervorhebung wieder aus (§8:
// ein stumm fortwirkender Schalter lässt Treffer verschwinden, ohne dass
// jemand ihn gesetzt zu haben glaubt). Jetzt setzt das LEEREN ihn zurück, im
// selben Handler wie die Eingabe — kein Effekt, kein Zwischen-Render.
// Nur der Entscheid-Leser; der Gesetzes-Leser (`useMarkenSchalter`) zieht in
// NACHLAUF N2 nach.
export function useEntscheidSuche() {
  // V5: komponenten-lokal, bewusst NICHT in der URL (kein Verlaufseintrag je
  // Tastendruck, §Z Ziff. 7).
  const [suche, setSuche] = useState('');
  const [markenAusRoh, setzeMarkenAus] = useState(false);
  const setzeSuche = useCallback((wert: string) => {
    setSuche(wert);
    if (wert.trim() === '') setzeMarkenAus(false);
  }, []);
  return { suche, setzeSuche, markenAusRoh, setzeMarkenAus };
}
