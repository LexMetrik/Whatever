import { usePaneKontext } from '../../../components/layout/PaneKontext';
import { useKopieren } from '../../../components/useKopieren';
import { NEUER_TAB } from '../../../lib/benennung';
import { zitatMitAusweis, heuteIso } from '../../../lib/format';
import { urlMitHash } from '../../../lib/liveUrlSync';

// ═══ DIE AKTIONEN DES ARTIKELS (Inventar 2.3.10) ═════════════════════════════
//
// «Zitat · Link · Amtliche Fassung ↗» am rechten Ende der Funktionszeile
// (`./Funktionszeile.tsx`, D35-F1, David 7.9.2026) — EIN Ort; die frühere
// Kopf-Variante unter `opacity-0` ist ersatzlos gelöscht (§5). D44: die
// vierte Aktion «⧉ Artikel daneben» ist gestrichen. Funktion, aria und title
// sind seit D35-F1 unverändert, ebenso die LM-202-Regel: nur «Link» schreibt
// den Anker in die Adresse, und im SEKUNDÄREN Pane keiner von beiden.
// @390 (oder sobald die Rubriken die Breite füllen) rutscht die Gruppe auf die
// nächste Zeile; `ml-auto` schiebt sie dort nicht aus dem Bild.
//
// S6 W1f (Entscheid David 24.9.2026, «Klein am Artikel»): die Funktionszeile
// ist gefallen, die Aktionen bleiben am Artikel — in der Gesamtansicht als
// RUHIGE TEXTZEILE (`ruhig`), keine Knopfreihe (Nachtrag 24.9.2026: «nicht zu
// viele infos resp. darauf achten dass es übersichtlich erscheint»). Sie stehen
// IMMER, nicht erst bei Hover: der Hover-Riegel Z6 hing an der Zeile, deren
// Griffe den Fokus-Weg trugen — ohne sie erreichte die Tastatur die Aktionen
// sonst nie (WCAG 2.1.1). Im Einzelmodus (Dossier) bleibt die Knopf-Gestalt
// unverändert (D-E4).
//
// LEISTE 24.9.2026 (Wunsch David, Bild ArG Art. 5/6 dunkel @~740: «vorallem
// diese leiste muss überarbeitet werden»): die Textzeile stand RECHTSBÜNDIG
// (`ml-auto`) unter dem Fussnoten-Apparat, hing weder am Artikel noch an den
// Fussnoten und wiederholte sich blass unter jedem Artikel. Jetzt: LINKSBÜNDIG
// an der Artikelkante (dieselbe Flucht wie «Art. N» und der Apparat — der
// Artikelfuss liest sich als EIN Block), und auf Geräten mit Maus erst voll
// sichtbar, wenn der Artikel Hover oder Fokus hat
// (`src/index.css`, Block «ARTIKEL-AKTIONEN»). Tastatur: `opacity`, nicht
// `display`/`visibility` — die Knöpfe bleiben im Fokus-Weg und erscheinen,
// sobald einer den Fokus hat (WCAG 2.1.1/2.4.7; der Einwand gegen den alten
// Riegel Z6 war der fehlende Fokus-Weg, nicht das Ausblenden an sich). Touch
// (`pointer: coarse`, kein Hover): immer sichtbar. Druck: die Hülle ist
// `print:hidden` (`ArtikelLeser.tsx`). Funktion, Namen und data-Hooks
// unverändert (Inventar 2.3.10).
//
// KEIN NEGATIVER RAND (Wurzelfix R8-Timeout, PR #1062, 24.9.2026): die
// optische Flucht-Korrektur für den ersten Knopf (dessen `px-1` sonst 4 px
// Luft vor «Art. N» liesse) sitzt bewusst NICHT als `-ml-1` am Container,
// sondern als `padding-left: 0` am ersten `.lc-btn-mini` in
// `src/index.css` (Block «ARTIKEL-AKTIONEN», `[data-aktionen-ruhig] >
// .lc-btn-mini:first-child`). Sichtbar macht das keinen Unterschied — beide
// Knöpfe tragen `border-transparent`/`bg-transparent`, nur der Text zählt.
// Ein negativer Rand an ~1'700 Zeilen im OR liess aber R8s
// Blutungs-Erkennung (`abschnittMessung.ts`, für JEDES Element im Dokument
// gegen JEDE Blutung geprüft, O(Knoten×Blutungen)) auf ~66–72 s statt ~27–30 s
// anschwellen — CI riss beim 90-s-Timeout (Läufe 36035202296). Gemessen: mit
// `-ml-1` reproduzierbar 66–72 s (drei saubere Neubauten), ohne wieder
// 27–30 s wie auf main. Kein Mess-Werkzeug-Fix — die Zeile bleibt für Nutzer
// unverändert, nur ihre DOM-Kosten für den Sweep sinken.

/** Ruhige Textzeile (S6 W1f): derselbe Knopf-Baustein (`.lc-btn-mini`: Höhe
 *  `--tap-ziel`, WCAG 2.5.8; Hover-Fläche als Zustandsauskunft), aber OHNE
 *  sichtbare Haarlinie — so liest sich die Gruppe als eine Textzeile
 *  «Zitat · Link · Amtliche Fassung ↗», nicht als Knopfreihe. */
const RUHIG = 'border-transparent px-1 text-micro text-ink-500 hover:text-ink-900';
const KNOPF = 'text-micro text-ink-500 hover:text-ink-900';

export function ArtikelAktionen({ artikel, basisPfad, zitat, zitatVoll, amtlich, ruhig = false }: {
  /** Artikel-Token (`e.artikel`) — der Anker `#art-<token>`. */
  artikel: string;
  /** Pfad des Erlasses ohne Anker (`/gesetze/bund/OR`). */
  basisPfad: string;
  /** KURZ-Zitat («Art. 336c OR») — für die Namen der Aktionen. */
  zitat: string;
  /** VOLL-Zitat mit SR und Stand (§7 a–d) — der Text, der kopiert wird. */
  zitatVoll: string;
  /** EID-2 · amtlicher Deep-Link an genau diese Stelle, oder null (§8). */
  amtlich: string | null;
  /** S6 W1f · Textzeile statt Knöpfe (Gesamtansicht). */
  ruhig?: boolean;
}) {
  const k = ruhig ? RUHIG : KNOPF;
  const trenner = ruhig ? <span aria-hidden>·</span> : null;
  // R4-D (5.9.2026): ZWEI Kopier-Knöpfe in einer Zeile ⇒ der geteilte Hook mit
  // MARKE, damit nur der geklickte sein Häkchen zeigt.
  const { marke: kopiert, kopieren } = useKopieren();
  // LM-202: der Teilen-Knopf schreibt die Adresse — im SEKUNDÄREN Pane nicht.
  // Massgeblich ist die ROLLE, nicht `imPane`: `Shell.tsx` montiert auch das
  // primäre Pane mit `imPane: true`; nur die Rolle unterscheidet die beiden.
  const { rolle } = usePaneKontext();
  const istSekundaer = rolle === 'sekundaer';

  /** §5 — EINE Kodierung für Kopie und Adresse (`urlMitHash`).
   *  Handgebaute Strings gerieten bei 54 Artikel-Token mit Leerzeichen oder
   *  Halbgeviert («22 a», «36–42», «10. 1») auseinander; ein Leerzeichen im
   *  Permalink bricht zusätzlich die Auto-Verlinkung in Mail und Chat. */
  const ursprung = typeof window !== 'undefined' ? window.location.origin : 'https://lexmetrik.ch';
  const permalink = urlMitHash(`${ursprung}${basisPfad}`, `art-${artikel}`);

  const kopiere = (was: 'zitat' | 'link') => {
    // B-6 (QS-BASIS): die Zitat-Kopie trägt den Stand-Ausweis (§7 a–d) —
    // `zitatVoll` liefert bereits «… (Stand …)», der Baustein ergänzt
    // Abrufdatum + Permalink (kein doppeltes Standdatum, §5). W2·10-UI-NAV/R3:
    // dazu der amtliche Deep-Link — derselbe Wert, den der Knopf «Amtliche
    // Fassung ↗» daneben ansteuert (EINE Quelle: `verifizierLinkArtikel`).
    // `?? undefined`: ohne validierten Link bleibt die Zeile ohne amtliche
    // Quelle statt mit einer geratenen (§8).
    const text = was === 'zitat'
      ? zitatMitAusweis(zitatVoll, { abruf: heuteIso(new Date()), permalink, amtlich: amtlich ?? undefined })
      : permalink;
    kopieren({ text, marke: was });
    // ── LM-202 (David-Entscheid 3.8.2026) ────────────────────────────────
    // «Die URL ändert sich NUR bei explizitem Klick auf einen Artikel-Anker
    // bzw. bei der Teilen-Aktion.» Der «Link»-Knopf IST die Teilen-Aktion; wer
    // ihn drückte und danach die Adresse las, sah bis LM-202 zwei verschiedene
    // Fundstellen. `replaceState`, damit das Kopieren keinen «Zurück»-Schritt
    // erzeugt. NUR beim Link: ein Zitat wandert in einen Schriftsatz, es ist
    // kein Ortswechsel. Und nur im primären Pane — das sekundäre ist nicht die
    // adressierte Seite (dieselbe Grenze wie `springeZuArtikel`).
    if (was === 'link' && !istSekundaer && typeof window !== 'undefined' && window.history) {
      window.history.replaceState(window.history.state, '', urlMitHash(window.location.href, `art-${artikel}`));
    }
  };

  return (
    <span data-aktionen-ruhig={ruhig ? '' : undefined}
      className={`lr7-bez-aktionen inline-flex flex-wrap items-center ${ruhig ? 'gap-0.5 text-micro text-ink-500' : 'ml-auto gap-2'}`}>
      <button type="button" onClick={() => kopiere('zitat')}
        className={`lc-btn-mini ${k}`}
        aria-label={`Zitat kopieren: ${zitatVoll}`}>{kopiert === 'zitat' ? '✓ kopiert' : 'Zitat'}</button>
      {trenner}
      <button type="button" onClick={() => kopiere('link')}
        className={`lc-btn-mini ${k}`}
        aria-label="Permalink kopieren">{kopiert === 'link' ? '✓' : 'Link'}</button>
      {/* EID-2: Outbound zur amtlichen Fassung AN DIESER STELLE (ELI-Form,
          target/rel wie die übrigen amtlichen Links, §12.4). Ä110: EINE
          Schreibung für EIN Ziel — sichtbarer Text = aria-label = title. */}
      {amtlich && trenner}
      {amtlich && (
        <a href={amtlich} target="_blank" rel="noopener noreferrer"
          className={`lc-btn-mini ${k} no-underline whitespace-nowrap`}
          aria-label={`Amtliche Fassung von ${zitat} auf Fedlex öffnen ${NEUER_TAB}`}
          title="Amtliche Fassung an genau dieser Stelle (Fedlex)">Amtliche Fassung ↗</a>
      )}
    </span>
  );
}
