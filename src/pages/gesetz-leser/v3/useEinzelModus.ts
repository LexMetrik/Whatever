import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { setzeLeserAnsicht, useLeserAnsicht } from '../leserOptionen';
import {
  einzelAdresse, modusAusSuche, modusEntscheid, nachbarToken, sucheMitModus, tokenAusHash,
  type LeserModus,
} from './einzelModus';
import type { LeserV3Modell } from './leserV3Modell';

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
  /** Einen Schritt blättern — am Rand des Erlasses ein No-op (§8: der Pfeil
   *  steht dort gar nicht, und die Taste soll nicht im Kreis springen). */
  blaettere: (richtung: -1 | 1) => void;
  /** Die Lesart wechseln: merken UND die Adresse nachziehen. */
  waehleModus: (m: LeserModus) => void;
  /** Der Query-Teil der aktuellen Adresse — beim Blättern mitgeführt. */
  search: string;
}

/**
 * @param m  Das Leser-Modell. Gebraucht werden drei Felder: `basisPfad`,
 *   `artTokens` (die amtliche Reihung — DIESELBE Liste, die j/k benutzt, §5;
 *   aufgehobene Artikel stehen darin und werden nicht übersprungen, §8) und
 *   `aktivToken` (die Lesestellung des Scroll-Spy, die den Moduswechsel
 *   VERLUSTFREI macht: wer beim Lesen von Art. 337b umschaltet, sieht 337b).
 */
export function useEinzelModus(
  m: Pick<LeserV3Modell, 'basisPfad' | 'artTokens' | 'aktivToken'>,
  /**
   * Führt DIESE Fläche die Adresse der Seite?
   *
   * Die Prop heisst NICHT `istSekundaer`, und das ist kein Kosmetik-Entscheid:
   * die Fundament-Sonde (`src/tests/leser-v3-fundament.test.ts`) lässt den
   * Hüllen-Zustand `imPane`/`istSekundaer` nur in den Wurzel-Dateien zu — eine
   * Datei, die ihn selbst liest, verzweigt auf ihn. Dieser Hook verzweigt auf
   * eine EIGENSCHAFT DER FLÄCHE, die ihm der Rahmen mitteilt; dieselbe Bauform
   * wie `LeserLeseZeile.vollflaechig` (dort die ausführliche Herleitung).
   */
  fuehrtAdresse: boolean,
): EinzelModus {
  const { basisPfad, artTokens, aktivToken } = m;
  const location = useLocation();
  const navigate = useNavigate();
  const gemerkt = useLeserAnsicht();
  // ── DER EINZELMODUS GILT NUR IN DER PRIMÄREN ANSICHT ──────────────────────
  // Im sekundären Pane bleibt es bei der Gesamtansicht, und das ist kein
  // Rückstand, sondern die Grenze aus Kap. 15.6 («Split-View unverändert»):
  // das zweite Fenster ist die VERGLEICHSFLÄCHE — man stellt einen Artikel
  // neben den Erlass, in dem man liest. Wäre dort ebenfalls nur eine
  // Bestimmung zu sehen, ginge genau der Kontext verloren, für den man das
  // Fenster geöffnet hat. Dazu kommt die Adress-Grenze: das Pane ist nicht die
  // adressierte Seite (`leserV3Modell.springeZuArtikel`, `!istSekundaer`).
  const modus = fuehrtAdresse ? modusEntscheid(modusAusSuche(location.search), gemerkt) : 'erlass';

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
    if (fuehrtAdresse) {
      navigate(einzelAdresse(basisPfad, location.search, ziel, 'artikel'));
    }
  }, [basisPfad, fuehrtAdresse, location.search, navigate]);

  const waehleModus = useCallback((m: LeserModus) => {
    setzeLeserAnsicht(m);
    if (!fuehrtAdresse) return;
    // VERLUSTFREI in beide Richtungen: die Adresse behält den Anker des
    // Artikels, an dem der Leser steht. Nach «Ganzer Erlass» springt die
    // Gesamtansicht damit an genau diese Stelle, nach «Einzelner Artikel»
    // erscheint genau diese Bestimmung.
    const ziel = tokenAusHash(location.hash) ?? aktivToken ?? token;
    const adresse = ziel
      ? einzelAdresse(basisPfad, location.search, ziel, m)
      : `${basisPfad}${sucheMitModus(location.search, m)}`;
    navigate(adresse, { replace: true });
  }, [aktivToken, basisPfad, fuehrtAdresse, location.hash, location.search, navigate, token]);

  const vor = nachbarToken(artTokens, token, -1);
  const nach = nachbarToken(artTokens, token, 1);

  return {
    modus,
    token,
    gehZu,
    blaettere: (richtung) => {
      const ziel = richtung === -1 ? vor : nach;
      if (ziel) gehZu(ziel);
    },
    vor,
    nach,
    waehleModus,
    search: location.search,
  };
}
