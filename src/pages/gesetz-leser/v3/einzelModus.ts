import type { Sektion } from '../../../lib/normtext/browse';
import { pfadZu } from '../helpers';

// ═══ W2·5m · DIE EINZELARTIKEL-ANSICHT — DIE REINE SEITE ════════════════════
//
// Konzept: FAHRPLAN-LESER-V3 Kap. 15 (14.9.2026), Entscheide D-E1…D-E6 von
// David. Diese Datei trägt alles, was der Einzelmodus OHNE DOM entscheidet:
// welchen Modus die Adresse meint, wie die Adresse dazu aussieht, welcher
// Gliederungspfad über dem Artikel steht und welcher Artikel der nächste ist.
//
// Rein und deterministisch (§2): kein DOM, kein Speicher, keine Uhr. Genau
// darum ist jede Regel hier ohne Browser prüfbar
// (`src/tests/leser-einzelmodus.test.ts`) — und nicht erst in einer e2e-Sonde,
// die sie mitträgt.
//
// ── WARUM DER QUERY-PARAMETER EINE EINZIGE LESESTELLE HAT (Kap. 15.6) ───────
// Im ganzen `gesetz-leser/`-Baum kam bis hierher KEIN `searchParams.get` vor
// (geprüft 14.9.2026, Konzept-Stand `d61193dbe`). Der Modus ist damit der erste
// Query-Parameter des Lesers. Verstreute Abfragen wären genau die zweite
// Wahrheit, gegen die §5 steht: eine Stelle liest, eine Stelle schreibt, beide
// stehen hier nebeneinander und sind gegeneinander getestet (Hin- und Rückweg).

/** Die zwei Lesarten des Erlasses (D-E2: eine OPTION, kein zweiter Leser). */
export type LeserModus = 'erlass' | 'artikel';

/** Der Query-Schlüssel. Ein Wort, kleingeschrieben, wie die Adressen des Hauses. */
export const MODUS_PARAM = 'ansicht';

/**
 * F-E3 (entschieden David 14.9.2026: «ja») · «Ganzer Erlass» bleibt der
 * Vorgabewert für alle, die nichts umstellen — wer einen Link auf ein Gesetz
 * öffnet, erwartet das Gesetz. Der Wert wird darum NIE in die Adresse
 * geschrieben (`?ansicht=erlass` gibt es nicht): eine Adresse, die den
 * Grundzustand ausschreibt, macht aus jedem geteilten Link zwei Schreibweisen
 * für dieselbe Seite.
 */
export const MODUS_VORGABE: LeserModus = 'erlass';

/**
 * Was die Adresse über den Modus sagt — `null`, wenn sie nichts dazu sagt.
 *
 * `null` ist NICHT dasselbe wie «erlass»: nur eine Adresse, die schweigt, lässt
 * die gemerkte Präferenz zu Wort kommen (`modusEntscheid` unten). Ein
 * unbekannter Wert (`?ansicht=xyz`) schweigt ebenfalls — dieselbe
 * Whitelist-Sicherung wie bei `vermerke` und der Schriftstufe in
 * `../leserOptionen`: was nicht im Vokabular steht, darf nie durchrutschen.
 */
export function modusAusSuche(search: string): LeserModus | null {
  const wert = new URLSearchParams(search).get(MODUS_PARAM);
  if (wert === 'artikel') return 'artikel';
  if (wert === 'erlass') return 'erlass';
  return null;
}

/**
 * VORRANG (Kap. 15.6): die Adresse schlägt die Präferenz.
 *
 * Ein geteilter Link zeigt, was der Absender meinte — sonst bräche das Teilen
 * für jeden Empfänger, der die andere Lesart gewählt hat. Schweigt die Adresse,
 * gilt die gemerkte Wahl; hat der Leser nie gewählt, gilt `MODUS_VORGABE`.
 */
export function modusEntscheid(ausAdresse: LeserModus | null, gemerkt: LeserModus): LeserModus {
  return ausAdresse ?? gemerkt;
}

/**
 * Der Query-Teil einer Adresse im gegebenen Modus — alle übrigen Parameter
 * bleiben unangetastet.
 *
 * Sie bleiben, weil der Leser sie nicht kennt: der Suchlauf der App, eine
 * Kampagnen-Kennung oder ein künftiger Parameter dürfen an einem Moduswechsel
 * nicht verloren gehen. Ergebnis ist ein Wert mit führendem `?` oder die leere
 * Zeichenkette — dieselbe Form, die `window.location.search` liefert, damit der
 * Aufrufer nichts nachbauen muss.
 */
export function sucheMitModus(search: string, modus: LeserModus): string {
  const p = new URLSearchParams(search);
  if (modus === MODUS_VORGABE) p.delete(MODUS_PARAM);
  else p.set(MODUS_PARAM, modus);
  const s = p.toString();
  return s ? `?${s}` : '';
}

/**
 * Die vollständige Adresse eines Artikels im Einzelmodus:
 * `/gesetze/bund/OR?ansicht=artikel#art-336_c`.
 *
 * Der Anker bleibt `#art-…` — DERSELBE, den die Gesamtansicht schreibt und den
 * jeder bestehende Tieflink trägt (`../scrollAnker`, `springeZuArtikel`). Ein
 * eigener Anker für den Einzelmodus hiesse, dass ein bestehender Link je nach
 * Modus auf zwei verschiedene Stellen zeigt (§5) — und dass die 39 gemessenen
 * Anker-Rückfälle aus W2·22 Z6c ein zweites Mal gebaut werden müssten.
 */
export function einzelAdresse(basisPfad: string, search: string, token: string, modus: LeserModus): string {
  return `${basisPfad}${sucheMitModus(search, modus)}#art-${token}`;
}

/**
 * Der Artikel-Token aus einem Anker `#art-336_c` — `null`, wenn der Hash keiner
 * ist (leer, `#oben`, ein Sektions-Anker).
 *
 * DIESELBE Ableitung, die `./tiefLinkZweig.ts` (Z. 73–74) für den Tieflink
 * benutzt, samt `decodeURIComponent`: 54 Artikel-Token des Korpus tragen
 * Leerzeichen oder Halbgeviert («22 a», «36–42», «10. 1»), und ein ungeprüftes
 * `slice` liefert dort einen Token, den kein Eintrag kennt. Zwei Schreibweisen
 * für einen Anker wären §5 — hier steht die Lesestelle des Einzelmodus, die
 * gegen dieselbe Erwartung getestet ist.
 */
export function tokenAusHash(hash: string): string | null {
  if (!hash.startsWith('#art-')) return null;
  const roh = hash.slice('#art-'.length);
  if (!roh) return null;
  try {
    return decodeURIComponent(roh);
  } catch {
    // Ein kaputtes Prozent-Escape ist kein Artikel, sondern Müll in der
    // Adresse — dann lieber kein Token als ein falscher (§8).
    return null;
  }
}

/** Eine Stufe des Gliederungspfads über dem Artikel. */
export interface PfadStufe {
  /** Sektions-Id (`sek-N`) — die Marke der Stufe im Gliederungsbaum. */
  id: string;
  /** Amtliche Beschriftung der Stufe («Zweiter Titel: Die Entstehung …»). */
  label: string;
  /**
   * Der ERSTE Artikel dieser Stufe — das Sprungziel des Rückwegs (B4).
   *
   * WARUM EIN ARTIKEL-ANKER UND KEIN SEKTIONS-SPRUNG: der Rückweg wechselt
   * zugleich den Modus. Ein Sektions-Sprung müsste nach dem Moduswechsel
   * ausgeführt werden, also in einem zweiten Takt — und ein Sprung, der auf
   * einen Render wartet, ist die Bauart, an der schon der Tieflink-Zweig einmal
   * gescheitert ist. `#art-…` dagegen löst der bestehende, erprobte Weg auf
   * (`./tiefLinkZweig.ts`): er klappt die Sektionen des Ziels auf und scrollt
   * hin — genau der Rückweg, den B4 verlangt, ohne eine zweite Mechanik (§5).
   *
   * `null` an einer Stufe, die selbst keinen Artikel führt (reiner Buch-Knoten
   * ohne eigene Bestimmungen) — dann ist das Glied Text, kein Griff (§8: kein
   * Bedienelement ohne Ziel).
   */
  ersterArtikel: string | null;
}

/** Der erste Artikel-Token im Teilbaum einer Sektion — dokumentlinear, ohne
 *  Sortierung: die amtliche Reihung steht im Snapshot (§5, `./nachbarArtikel`). */
function ersterArtikelIn(s: Sektion): string | null {
  if (s.artikel.length > 0) return s.artikel[0].artikel;
  for (const k of s.kinder) {
    const t = ersterArtikelIn(k);
    if (t) return t;
  }
  return null;
}

/**
 * Buch › Titel › Abschnitt für EINEN Artikel (Kap. 15.3).
 *
 * Er ist im Einzelmodus **trivial wahr**: genau ein Artikel ist sichtbar, es
 * gibt also keine Scroll-Stellung, die von der Krume abweichen könnte — der
 * §7-Wahrheitsfall der Scroll-Spy-Krume (Ä1, H2b) entfällt hier baulich.
 *
 * KEINE zweite Baumsuche: die Kette kommt aus `pfadZu` (`../helpers`),
 * derselben Funktion, mit der `leserV3Modell.springeZuArtikel` die Sektionen
 * eines Sprungziels aufklappt (§5). Ein Artikel ohne amtliche Gliederung
 * (`ohneGliederung`) hat keinen Pfad — dann steht dort nichts, statt einer
 * erfundenen Stufe (§8).
 */
export function gliederungsPfad(sektionen: Sektion[], token: string): PfadStufe[] {
  const ids = pfadZu(sektionen, (s) => s.artikel.some((e) => e.artikel === token));
  if (!ids) return [];
  const stufen: PfadStufe[] = [];
  let ebene = sektionen;
  for (const id of ids) {
    const treffer = ebene.find((s) => s.id === id);
    if (!treffer) break;
    stufen.push({ id: treffer.id, label: treffer.label, ersterArtikel: ersterArtikelIn(treffer) });
    ebene = treffer.kinder;
  }
  return stufen;
}

/**
 * Der nächste bzw. vorige Artikel-Token — oder `null` am Rand des Erlasses.
 *
 * AUFGEHOBENE ARTIKEL WERDEN NICHT ÜBERSPRUNGEN (§8). Die Liste ist die
 * amtliche Reihung (`m.artTokens`, dieselbe, die j/k benutzt); hier wird
 * gezählt, nicht sortiert und nicht gefiltert. Ein Pfeil, der still über eine
 * Lücke springt, verschwiege dem Leser, DASS eine Bestimmung aufgehoben wurde —
 * die Herleitung steht ausführlich in `./nachbarArtikel.ts` und gilt für die
 * Tastatur und die Pfeile des Einzelmodus wortgleich.
 *
 * Ein unbekannter Token liefert `null` statt des ersten Artikels: «ich kenne
 * deine Stellung nicht» ist die ehrliche Antwort, ein stiller Sprung an den
 * Anfang wäre eine Ortsveränderung, die niemand ausgelöst hat.
 */
export function nachbarToken(
  tokens: readonly string[],
  aktuell: string | null,
  richtung: -1 | 1,
): string | null {
  if (aktuell === null) return null;
  const i = tokens.indexOf(aktuell);
  if (i < 0) return null;
  const ziel = i + richtung;
  return ziel >= 0 && ziel < tokens.length ? tokens[ziel] : null;
}

/** Ein Vorschau-Ziel: Nummer, Randtitel, Zustand — alles aus dem geladenen
 *  Snapshot, kein zusätzlicher Abruf (Kap. 15.5, Zeile 6). */
export interface VorschauZiel {
  token: string;
  label: string;
  /** Der Randtitel, soweit der Eintrag einen trägt — sonst `null`. */
  marginalie: string | null;
  aufgehoben: boolean;
}

/**
 * F-E2 (entschieden David 14.9.2026: «ja, aber erst in E2») · die Vorschau auf
 * den Nachbarn.
 *
 * `marginalieVon` kommt als Funktion herein und wird hier nicht gesucht: die
 * Randtitel-Anzeige ist eine Ableitung des Modells (`margAnzeige`), und diese
 * Datei bleibt frei von DOM, Speicher und Modell (§2/§3). Trägt der Nachbar
 * keinen Randtitel, steht in der Vorschau nichts — keine aus dem Wortlaut
 * gebastelte Kurzfassung (§8).
 */
export function vorschauZiel(
  ziel: { token: string; label: string; aufgehoben: boolean } | null | undefined,
  marginalieVon: (token: string) => string | null,
): VorschauZiel | null {
  if (!ziel) return null;
  return {
    token: ziel.token,
    label: ziel.label,
    marginalie: marginalieVon(ziel.token),
    aufgehoben: ziel.aufgehoben,
  };
}
