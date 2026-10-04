import { useLayoutEffect, useRef, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import { pfadZu } from '../helpers';
import type { Sektion } from '../../../lib/normtext/browse';
import { oeffneSprungZiel, sprungZielOffen } from '../klappKarte';
import { uebersetzeRohPfad, findeSynthPfad } from '../gliederungsModell';
import type { GliederungsKnoten } from '../gliederungsTypen';
import { sammleArtikel } from '../gliederungsArtikel';
import { kanonischerAnkerToken } from '../suchTreffer';
import { sicherDekodiert } from '../../../lib/sicherDekodieren';
import { zerlegeZifferAnker } from '../../../lib/normtext/zifferAnker';

// ── D21-NEBENFUND (W2·24-R6c) · DER TIEFLINK ÖFFNET SEINEN GLIEDERUNGSZWEIG
//    VOR DEM ERSTEN BILD ────────────────────────────────────────────────────
//
// BEFUND (David 6.9.2026 am Dev-Server 84eea666e, hier reproduziert): beim
// Laden von `/gesetze/bund/OR#art-336_c` verschieben sich die
// Gliederungs-Einträge («Dritte Abteilung», «Vierte Abteilung»,
// «Übergangsbestimmungen», «Schlussbestimmungen») rund 1.8–2.0 s nach dem
// Laden. GEMESSEN (Preview-Build, 3/3 Läufe bitgleich): CLS 0.0746, davon
// 0.0741 in EINEM Shift bei t ≈ 1.84 s, Quelle `li` im `[data-toc]`.
//
// URSACHE, gemessen statt vermutet (Zustand des Baums über die Zeit):
//   t = 600 ms · 18 Zeilen, Scrollhöhe 1042 px, aktiv «Zweite Abteilung»
//   t = 1400 ms · 62 Zeilen, Scrollhöhe 2285 px, aktiv «a. durch den Arbeitgeber»
// Der AKTIVE PFAD klappt also erst gut eine Sekunde nach dem ersten Bild auf,
// und das Wachstum von 1'243 px schiebt die sichtbaren Geschwister-Zeilen aus
// dem Sichtband. Getan hat das der Scroll-Spy: er meldet den Zielartikel erst,
// wenn der Anker-Sprung eingeschwungen ist (`data-lr6-anker-warten`, Deckel
// 600 ms) und danach die 200-ms-Nachlauf-Entprellung abgelaufen ist
// (`inhalt-hooks`, F3/RC2). Zu diesem Zeitpunkt liegt kein Nutzer-Eingriff
// vor — der Browser verbucht das Wachstum als unerwartete Verschiebung.
// Der Verdacht aus dem Befund («tocAutoZuklappen.ts») trifft NICHT zu: kein
// Ast wird geschlossen, es wird einer geöffnet.
//
// DIE ANTWORT: was ohnehin passieren wird, passiert VOR dem ersten Bild. Der
// Zielartikel steht in der Adresse und braucht keinen Spy; sobald die
// Sektionen da sind (also in genau dem Render, in dem der Baum zum ersten Mal
// erscheint), öffnet ein LAYOUT-Effekt den Pfad dorthin — synchron, vor dem
// Paint. Der Baum wird damit gar nicht erst zugeklappt gezeigt, und es gibt
// nichts zu verschieben. Der Spy setzt später dieselben Ids ein zweites Mal;
// das ist ein Re-Render ohne Layout-Änderung.
//
// VERHALTENSNEUTRAL für alles Weitere: die Ids landen im AUTO-Set mit dem
// laufenden Tick — genau dort, wo der Spy sie hingelegt hätte. Das
// Auto-Zuklappen behält damit seine Regel und seinen Takt (K, W2·19/S5); ein
// MANUELL-Vermerk hätte den Zweig dauerhaft offen gehalten und wäre eine
// stille Verhaltensänderung gewesen.
// `setAktivIds` bleibt bewusst AUS: die Marke ist nicht die Ursache des
// Shifts, und der Spy ist ihr einziger Schreiber (§5).
//
// WÄCHTER: `e2e/leser-kopf-cls-s3.e2e.ts`, Fall «Tieflink @1440 — die
// Gliederung wächst nicht nach dem ersten Bild».

/**
 * Öffnet den Gliederungspfad zum Anker-Artikel, sobald die Sektionen da sind.
 *
 * Herausgelöst aus `leserV3Modell.ts`, weil die Datei sonst über die
 * §6.6-Schwelle (420 Zeilen) gewachsen wäre — und weil die Regel damit ohne das
 * ganze Modell prüfbar bleibt.
 */
export function useTiefLinkZweig(opts: {
  /** `location.hash` — die Adresse, aus der das Ziel kommt. */
  hash: string;
  sektionen: Sektion[];
  /** Ebene + Schlüssel des Erlasses, damit ein Wechsel neu greift. */
  erlassMarke: string;
  /** Rohpfad→Modellpfad (`GliederungsModell.umhaengPraefix`) — wie im Spy (B4). */
  umhaengPraefix: Record<string, string[]>;
  /** Zeilenbaum des Modells — für Artikel OHNE amtliche Sektion («Ohne Abschnitt», Anhang; B7). */
  knoten?: GliederungsKnoten[];
  /** Token → Dokumentposition ALLER Einträge (`useArtikelAbleitungen`) — die Liste, gegen die auch der Seed-Sprung kanonisiert. */
  artIndex?: ReadonlyMap<string, number>;
  setTocBaum: Dispatch<SetStateAction<Record<string, boolean>>>;
  autoOffenRef: MutableRefObject<Set<string>>;
  autoTickRef: MutableRefObject<Map<string, number>>;
  autoTickNowRef: MutableRefObject<number>;
  manuellOffenRef: MutableRefObject<Set<string>>;
  manuellZuRef: MutableRefObject<Set<string>>;
}): void {
  const {
    hash, sektionen, erlassMarke, umhaengPraefix, knoten, artIndex, setTocBaum,
    autoOffenRef, autoTickRef, autoTickNowRef, manuellOffenRef, manuellZuRef,
  } = opts;
  const pfadRef = useRef<string | null>(null);
  useLayoutEffect(() => {
    if (!hash.startsWith('#art-') || sektionen.length === 0) return;
    const anker = sicherDekodiert(hash.slice('#art-'.length)); // PA-1-B01
    if (!anker) return;
    // E2 (Ziffer-Fragment): «197-ziff-12» ist kein Artikel-Token — das Suffix MUSS vor der Abbildung
    // auf die Token-Liste ab, sonst trifft nichts und der Zweig bleibt zu (früherer Bug bei #art-1a).
    const { artikel: roh } = zerlegeZifferAnker(anker);
    // PA-4-B02 (W2·17-UI-BEFUNDE): «#art-336c» trifft den Token «336_c». Der Seed-
    // Sprung kanonisiert (`kanonischerAnkerToken`, Nebenfund S6), dieser Zweig las
    // den Rohtoken, fand keinen Pfad und öffnete die Gliederung erst nach dem
    // Sprung — gemessen @1440 auf OR: CLS 0.0975 (336c) gegen 0.0004 (336_c).
    // EINE Kanonisierung, dieselbe Funktion UND dieselbe Token-Liste wie der Seed-
    // Sprung (§5): alle Einträge, nicht nur die der Sektionen. Nachzug PR #1267:
    // gegen die Sektions-Tokens allein wurde «#art-1.1» (Anhang Ziff. 1.1, kein
    // Sektions-Token) zu «11» und öffnete in ZH-211.17 den Zweig von § 11, während
    // der Sprung auf 1.1 ging (Korpus: 8 Hashes). `artIndex` fehlt nur in Tests
    // ohne Modell — dann bleibt es bei den Sektions-Tokens.
    const token = kanonischerAnkerToken(
      roh, artIndex ? [...artIndex.keys()] : sektionen.flatMap((s) => sammleArtikel(s).map((a) => a.artikel)),
    );
    const marke = `${erlassMarke}#${token}`;
    if (pfadRef.current === marke) return;
    const rohPfad = pfadZu(sektionen, (s) => s.artikel.some((e) => e.artikel === token)) ?? [];
    // B7 (W2·17-UI-BEFUNDE): ein Artikel ohne amtliche Sektion (vor dem ersten
    // Abschnitt, dahinter, mittendrin, im Anhang) steht in einer synthetischen
    // Zeile — «Ohne Abschnitt», «Anhänge». Ohne diese Auflösung blieb die Zeile
    // bei ZH-230#art-5 zu, obwohl der Leser mitten in ihr stand. Welche Zeile den
    // Artikel deckt, weiss allein das Modell (`findeSynthPfad`, §5) — dieselbe
    // Frage beantwortet der Scroll-Spy ebenso.
    const ids = rohPfad.length > 0
      ? uebersetzeRohPfad(umhaengPraefix, rohPfad)
      : (knoten ? findeSynthPfad(knoten, token) ?? [] : []);
    if (ids.length === 0) return;
    pfadRef.current = marke;
    const tick = autoTickNowRef.current;
    for (const id of ids) {
      if (manuellOffenRef.current.has(id) || manuellZuRef.current.has(id)) continue;
      autoOffenRef.current.add(id);
      autoTickRef.current.set(id, tick);
    }
    setTocBaum((o) => {
      if (sprungZielOffen(o, ids, ids.slice(-1))) return o; // schon offen ⇒ kein Re-Render
      return oeffneSprungZiel(o, ids, ids.slice(-1));
    });
  }, [hash, sektionen, erlassMarke, umhaengPraefix, knoten, artIndex,
      autoOffenRef, autoTickRef, autoTickNowRef, manuellOffenRef, manuellZuRef, setTocBaum]);
}
