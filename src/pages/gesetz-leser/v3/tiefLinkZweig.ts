import { useLayoutEffect, useRef, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import { pfadZu } from '../helpers';
import type { Sektion } from '../../../lib/normtext/browse';
import { oeffneSprungZiel, sprungZielOffen } from '../klappKarte';

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
  setTocBaum: Dispatch<SetStateAction<Record<string, boolean>>>;
  autoOffenRef: MutableRefObject<Set<string>>;
  autoTickRef: MutableRefObject<Map<string, number>>;
  autoTickNowRef: MutableRefObject<number>;
  manuellOffenRef: MutableRefObject<Set<string>>;
  manuellZuRef: MutableRefObject<Set<string>>;
}): void {
  const {
    hash, sektionen, erlassMarke, setTocBaum,
    autoOffenRef, autoTickRef, autoTickNowRef, manuellOffenRef, manuellZuRef,
  } = opts;
  const pfadRef = useRef<string | null>(null);
  useLayoutEffect(() => {
    if (!hash.startsWith('#art-') || sektionen.length === 0) return;
    const token = decodeURIComponent(hash.slice('#art-'.length));
    if (!token) return;
    const marke = `${erlassMarke}#${token}`;
    if (pfadRef.current === marke) return;
    const ids = pfadZu(sektionen, (s) => s.artikel.some((e) => e.artikel === token)) ?? [];
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
  }, [hash, sektionen, erlassMarke,
      autoOffenRef, autoTickRef, autoTickNowRef, manuellOffenRef, manuellZuRef, setTocBaum]);
}
