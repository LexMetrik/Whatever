import { useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import { sitzungsSpeicher } from '../../../lib/sichererSpeicher';
import { setzeLeserAnsicht, useLeserAnsicht } from '../leserOptionen';
import {
  einzelAdresse, lesestelle, loeseEinzelToken, modusAusSuche, modusEntscheid, nachbarToken, sucheMitModus,
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
// ── DIE ADRESSE FÜHRT, UND SONST NICHTS ────────────────────────────────────
// Im Einzelmodus IST `#art-…` die Auskunft «welcher Artikel steht hier». Der
// gezeigte Artikel ist darum eine reine ABLEITUNG aus der Adresse, kein
// React-Zustand daneben: ein zweiter Zustand wäre die zweite Wahrheit, die §5
// verbietet, und er liefe beim ersten «Zurück» auseinander.
//
// Der erste Wurf hatte ihn (`useState` + zwei Effekte, die ihn aus dem Hash
// nachzogen). Die Lint-Regel `react-hooks/set-state-in-effect` hat das am
// 14.9.2026 gefangen — zu Recht: jeder dieser Effekte war ein zusätzlicher
// Render-Durchgang für eine Auskunft, die schon dasteht. Ohne ihn ist «Zurück»
// kein Sonderfall mehr, sondern derselbe Weg wie jeder andere Adress-Wechsel.
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
//
// LESER-NAV (FB O-27 BG-07, 15.10.2026): `replace` allein hielt das nicht — die
// Einträge DAVOR (jedes Blättern ist ein `pushState` mit `?ansicht=artikel`) tragen
// die alte Lesart in der Adresse, und die Adresse schlägt die Präferenz: «Zurück»
// nach «Ganzer Erlass» zeigte wieder einen einzelnen Artikel. Darum merkt sich der
// Hook, welche Einträge VOR dem Wechsel entstanden sind, und zieht einen «Zurück»
// auf einen solchen Eintrag per `replace` in die gewählte Lesart (derselbe Artikel,
// keine neue Verlaufsstelle). Einträge NACH dem Wechsel bleiben unberührt.
//
// LESER-NAV (FB O-27 BG-07-Rest, 15.10.2026): dieses Gedächtnis lebte nur im Ref und war nach einem
// Reload oder einem Erlasswechsel (`LeserRahmenV3 key={schluessel}`) leer — «Zurück» auf einen Eintrag
// von davor kippte dann wieder in dessen Lesart. Es liegt jetzt im Sitzungsspeicher des Tabs
// (`lm.leser.lesart-wechsel`): `location.key` ist je Verlaufseintrag eindeutig, auch über Erlasse und
// Reloads hinweg. REGEL (gesetzt, nicht neu erfunden): die Lesart ist eine Einstellung des Nutzers, keine
// Eigenschaft eines Erlasses — nach der letzten Umstellung zeigt ein «Zurück» auf jeden Eintrag von davor,
// gleich in welchem Erlass, diese Lesart. Eine frühere Umstellung wird von einer späteren abgelöst.

/** Sitzungsspeicher-Schlüssel des Lesart-Gedächtnisses (Datei-Kopf, BG-07-Rest). */
const GEDAECHTNIS_KEY = 'lm.leser.lesart-wechsel';
/** Obergrenze der gemerkten Verlaufseinträge — die Länge des Browser-Verlaufs ist ohnehin begrenzt. */
const MAX_BESUCHT = 200;

interface Gedaechtnis {
  besucht: string[];
  wechsel: { modus: LeserModus; davor: string[] } | null;
}

/** Kennung des Verlaufseintrags. Der erste Eintrag eines Dokuments trägt immer den Schlüssel «default» —
 *  nach einem Reload oder einer Adresszeilen-Eingabe ist das ein ANDERER Eintrag und darf nicht als der
 *  frühere gelten (sonst überschriebe die letzte Umstellung die Lesart eines frisch geöffneten Links).
 *  Darum trägt «default» den Start des Dokuments mit. */
const eintragsKennung = (key: string): string => (key === 'default' ? `default@${Math.round(performance.timeOrigin)}` : key);

const istSchluesselListe = (x: unknown): x is string[] => Array.isArray(x) && x.every((k) => typeof k === 'string');

function ladeGedaechtnis(): Gedaechtnis {
  try {
    const roh: unknown = JSON.parse(sitzungsSpeicher.lies(GEDAECHTNIS_KEY) ?? 'null');
    const o = (roh ?? {}) as { besucht?: unknown; wechsel?: { modus?: unknown; davor?: unknown } | null };
    const w = o.wechsel;
    return {
      besucht: istSchluesselListe(o.besucht) ? o.besucht : [],
      wechsel: w && (w.modus === 'erlass' || w.modus === 'artikel') && istSchluesselListe(w.davor)
        ? { modus: w.modus, davor: w.davor } : null,
    };
  } catch { return { besucht: [], wechsel: null }; }
}

/** Gesperrt oder voll ⇒ das Gedächtnis gilt nur für diese Seite (wie vor dem Rest-Fix). */
function speichereGedaechtnis(g: Gedaechtnis): void {
  sitzungsSpeicher.schreib(GEDAECHTNIS_KEY, JSON.stringify(g));
}

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
  const navTyp = useNavigationType();
  // BG-07: besuchte Einträge (location.key) und die zuletzt gewählte Lesart samt Einträgen davor —
  // im Sitzungsspeicher des Tabs, damit Reload und Erlasswechsel sie nicht leeren (Herleitung im
  // Datei-Kopf). Gelesen wird lazy beim ersten Gebrauch (nie im Render, nie im Prerender).
  const gedaechtnisRef = useRef<Gedaechtnis | null>(null);
  const gedaechtnis = () => (gedaechtnisRef.current ??= ladeGedaechtnis());
  // ── DER EINZELMODUS GILT NUR IN DER PRIMÄREN ANSICHT ──────────────────────
  // Im sekundären Pane bleibt es bei der Gesamtansicht, und das ist kein
  // Rückstand, sondern die Grenze aus Kap. 15.6 («Split-View unverändert»):
  // das zweite Fenster ist die VERGLEICHSFLÄCHE — man stellt einen Artikel
  // neben den Erlass, in dem man liest. Wäre dort ebenfalls nur eine
  // Bestimmung zu sehen, ginge genau der Kontext verloren, für den man das
  // Fenster geöffnet hat. Dazu kommt die Adress-Grenze: das Pane ist nicht die
  // adressierte Seite (`leserV3Modell.springeZuArtikel`, `!istSekundaer`).
  const modus = fuehrtAdresse ? modusEntscheid(modusAusSuche(location.search), gemerkt) : 'erlass';

  // Der angezeigte Artikel, in dieser Reihenfolge: die Adresse (ein geteilter
  // Tieflink), dann die Lesestellung des Scroll-Spy (der Wechsel ist dadurch
  // verlustfrei), dann der erste Artikel. Der letzte Fall ist der Leser, der
  // den Modus ohne Anker betritt — dort ist der Anfang des Erlasses die
  // einzige Stelle, die niemanden überrascht. Steht der Erlass noch nicht
  // (Shard unterwegs), ist das Ergebnis `null` und die Ansicht wartet.
  //
  // Runde 2 (24.9.2026, gemessen): `?ansicht=artikel#art-336c` fiel auf die
  // Gesamtansicht zurück (scrollY 220'968 statt 504 @390), weil der Token des
  // Erlasses `336_c` heisst. Die Gesamtansicht bildete die Schreibweise seit
  // S6-W1a schon ab (`../inhalt-hooks-tieflink`), der Einzelmodus nicht —
  // jetzt über DIESELBE Abbildung (`kanonischerAnkerToken`, §5): exakt vor
  // unscharf, unscharf nur bei eindeutigem Treffer (§8: kein Rate-Sprung).
  //
  // W2·17-UI-BEFUNDE (1.10.2026): zwei Nachträge, beide in `./einzelModus`. (1) Ein Anker, den der
  // Erlass nicht führt, liefert keinen Token mehr (`unbekannt`) — davor lief die obige Kette ins
  // Leere, und der Leser sah still den ganzen Erlass; jetzt zeigt der Einzelmodus die Lesestelle und
  // sagt, was fehlt (`./LeserEinzelAnsicht`, dieselbe Auflösung `loeseEinzelToken`). (2) In der GESAMTANSICHT ist der Hash nur der
  // Einstiegsanker, die Lesestellung gewinnt (`lesestelle`) — das macht den Wechsel erst verlustfrei.
  const { token: ausAdresse } = loeseEinzelToken(location.hash, artTokens);
  const token = lesestelle(modus, ausAdresse, aktivToken, artTokens[0] ?? null);

  useEffect(() => {
    const g = gedaechtnis();
    const w = g.wechsel;
    const kennung = eintragsKennung(location.key);
    if (fuehrtAdresse && navTyp === 'POP' && w?.davor.includes(kennung)
      && modusEntscheid(modusAusSuche(location.search), gemerkt) !== w.modus) {
      navigate(`${basisPfad}${sucheMitModus(location.search, w.modus)}${location.hash}`, { replace: true });
    }
    if (!g.besucht.includes(kennung)) { g.besucht = [...g.besucht, kennung].slice(-MAX_BESUCHT); speichereGedaechtnis(g); }
  }, [basisPfad, fuehrtAdresse, gemerkt, location.hash, location.key, location.search, navTyp, navigate]);

  const gehZu = useCallback((ziel: string) => {
    // `pushState` (react-router `navigate` ohne `replace`) — die Begründung
    // steht im Datei-Kopf. Der gezeigte Artikel folgt der Adresse von selbst.
    if (fuehrtAdresse) {
      navigate(einzelAdresse(basisPfad, location.search, ziel, 'artikel'));
    }
  }, [basisPfad, fuehrtAdresse, location.search, navigate]);

  const waehleModus = useCallback((m: LeserModus) => {
    setzeLeserAnsicht(m);
    // Die schon geltende Lesart noch einmal zu wählen ist ein No-op (`LeserModusWahl` sagt es zu) —
    // PA-15-B02: die Adresse wurde neu geschrieben und die Gesamtansicht sprang zum Einstiegsanker zurück.
    if (!fuehrtAdresse || m === modus) return;
    const g = gedaechtnis();
    g.wechsel = { modus: m, davor: [...g.besucht] };
    speichereGedaechtnis(g);
    // VERLUSTFREI in beide Richtungen: die Adresse behält den Anker des
    // Artikels, an dem der Leser steht. Nach «Ganzer Erlass» springt die
    // Gesamtansicht damit an genau diese Stelle, nach «Einzelner Artikel»
    // erscheint genau diese Bestimmung.
    const ziel = token;
    const adresse = ziel
      ? einzelAdresse(basisPfad, location.search, ziel, m)
      : `${basisPfad}${sucheMitModus(location.search, m)}`;
    navigate(adresse, { replace: true });
  }, [basisPfad, fuehrtAdresse, location.search, modus, navigate, token]);

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
