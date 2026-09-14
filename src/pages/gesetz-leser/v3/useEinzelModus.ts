import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { setzeLeserAnsicht, useLeserAnsicht } from '../leserOptionen';
import {
  einzelAdresse, modusAusSuche, modusEntscheid, nachbarToken, sucheMitModus, tokenAusHash,
  type LeserModus,
} from './einzelModus';

// ═══ W2·5m · DER ZUSTAND DES EINZELMODUS (Kap. 15.6) ════════════════════════
//
// Diese Datei verdrahtet die reinen Regeln aus `./einzelModus.ts` mit Adresse,
// Browser-Verlauf und Präferenz. Sie entscheidet NICHTS selbst (§3): welcher
// Modus gilt, wie die Adresse aussieht und welcher Artikel der nächste ist,
// steht dort und ist ohne Browser geprüft.
//
// ── DIE ADRESSE FÜHRT, NICHT EIN ZWEITER ZUSTAND ───────────────────────────
// Im Einzelmodus IST `#art-…` die Auskunft «welcher Artikel steht hier». Ein
// zweiter React-Zustand daneben wäre genau die zweite Wahrheit, die §5
// verbietet — und sie liefe beim ersten «Zurück» auseinander. Der lokale State
// unten ist darum kein Gegenspieler der Adresse, sondern ihr Abbild: er wird
// von ihr gesetzt (Effekt) und setzt sie (Blättern), und im SEKUNDÄREN Pane
// trägt er sie allein, weil das Pane nicht die adressierte Seite ist (dieselbe
// Grenze, die `leserV3Modell.springeZuArtikel` mit `!istSekundaer` zieht).
//
// ── `pushState` BEIM BLÄTTERN — DIE REGEL WIRD PRÄZISIERT, NICHT GEBROCHEN ──
// Im Leser gilt «`replaceState`, nie `pushState`» (`./leserV3Modell.ts`
// Z. 287–288/317). Die Begründung dort ist der SCROLL-SPY: er führt die Adresse
// beim Scrollen, und ein History-Eintrag je gescrolltem Artikel machte den
// Zurück-Knopf unbrauchbar. Im Einzelmodus gibt es keinen Scroll-Spy — die
// Adresse ändert sich ausschliesslich auf eine ausdrückliche Nutzer-Geste
// (Pfeil, Taste). Genau dann ist `pushState` das erwartete Verhalten, und
// «Zurück» blättert einen Artikel zurück. Der Kommentar an `leserV3Modell.ts`
// ist im selben PR um diesen Modus ergänzt worden (§0 Ziff. 2b: die alte
// Begründung bleibt stehen, sie wird nur um die Bedingung erweitert).
//
// DER MODUSWECHSEL SELBST IST `replaceState` (react-router `replace`). Er ist
// keine Ortsveränderung, sondern eine Einstellung: wer die Lesart umstellt und
// danach «Zurück» drückt, will zur vorigen SEITE, nicht in die vorige Lesart.

export interface EinzelModus {
  /** Welche Lesart gilt — Adresse vor Präferenz (`modusEntscheid`). */
  modus: LeserModus;
  /** Der angezeigte Artikel im Einzelmodus (`null`, solange keiner feststeht). */
  token: string | null;
  /** Blättern auf einen bestimmten Artikel (Pfeil, Vorschau-Zeile). */
  gehZu: (ziel: string) => void;
  /** Blättern um einen Schritt — `null`, wo es keinen Nachbarn gibt (§8: ein
   *  Pfeil ohne Ziel wird gar nicht erst gerendert, Kap. 15.3). */
  vor: string | null;
  nach: string | null;
  /** Die Lesart wechseln: merken UND die Adresse nachziehen. */
  waehleModus: (m: LeserModus) => void;
}

export function useEinzelModus({ basisPfad, artTokens, aktivToken, istSekundaer }: {
  basisPfad: string;
  /** Die Artikel in amtlicher Reihung — DIESELBE Liste, die j/k benutzt (§5).
   *  Aufgehobene sind darin enthalten und werden nicht übersprungen (§8). */
  artTokens: readonly string[];
  /** Der Artikel, an dem der Leser gerade steht (Scroll-Spy der Gesamtansicht).
   *  Er macht den Wechsel VERLUSTFREI: wer beim Lesen von Art. 337b umschaltet,
   *  sieht Art. 337b — nicht den ersten Artikel des Erlasses. */
  aktivToken: string | null;
  istSekundaer: boolean;
}): EinzelModus {
  const location = useLocation();
  const navigate = useNavigate();
  const gemerkt = useLeserAnsicht();
  const modus = modusEntscheid(modusAusSuche(location.search), gemerkt);

  // Der angezeigte Artikel. Anfangswert in dieser Reihenfolge: die Adresse (ein
  // geteilter Tieflink), dann die Lesestellung, dann der erste Artikel. Der
  // letzte Fall ist der Leser, der den Modus ohne Anker betritt — dort ist der
  // Anfang des Erlasses die einzige Stelle, die niemanden überrascht.
  const [token, setToken] = useState<string | null>(
    () => tokenAusHash(location.hash) ?? aktivToken ?? artTokens[0] ?? null,
  );

  // DIE ADRESSE ZIEHT DEN ZUSTAND NACH — das ist der «Zurück»-Knopf (Kap. 15.6).
  // Er schreibt keinen State, er ändert die Adresse; ohne diesen Effekt bliebe
  // die Karte stehen und der Browser zeigte einen Artikel, der nicht da ist.
  useEffect(() => {
    const t = tokenAusHash(location.hash);
    if (t) setToken(t);
  }, [location.hash]);

  // Steht der Erlass erst später (Shard noch unterwegs), gibt es beim ersten
  // Lauf keinen Token. Sobald die Liste da ist, bekommt der Modus seinen
  // Anfang — aber nur, wenn keiner gesetzt ist: ein späterer Lauf darf eine
  // getroffene Wahl nicht überschreiben.
  useEffect(() => {
    setToken((t) => t ?? aktivToken ?? artTokens[0] ?? null);
  }, [artTokens, aktivToken]);

  const gehZu = useCallback((ziel: string) => {
    setToken(ziel);
    // Im sekundären Pane bleibt die Adresse unberührt (s. Datei-Kopf) — dort
    // trägt der lokale Zustand allein, und der Verlauf des Fensters gehört der
    // primären Seite.
    if (!istSekundaer) {
      navigate(einzelAdresse(basisPfad, location.search, ziel, 'artikel'));
    }
  }, [basisPfad, istSekundaer, location.search, navigate]);

  const waehleModus = useCallback((m: LeserModus) => {
    setzeLeserAnsicht(m);
    if (istSekundaer) return;
    // VERLUSTFREI in beide Richtungen: die Adresse behält den Anker des
    // Artikels, an dem der Leser steht. Nach «Ganzer Erlass» springt die
    // Gesamtansicht damit an genau diese Stelle, nach «Einzelner Artikel»
    // erscheint genau diese Bestimmung.
    const ziel = tokenAusHash(location.hash) ?? aktivToken ?? token;
    const adresse = ziel
      ? einzelAdresse(basisPfad, location.search, ziel, m)
      : `${basisPfad}${sucheMitModus(location.search, m)}`;
    navigate(adresse, { replace: true });
  }, [aktivToken, basisPfad, istSekundaer, location.hash, location.search, navigate, token]);

  return {
    modus,
    token,
    gehZu,
    vor: nachbarToken(artTokens, token, -1),
    nach: nachbarToken(artTokens, token, 1),
    waehleModus,
  };
}
