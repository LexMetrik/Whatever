import { tabSchluessel, reiterKurzformText } from '../../lib/tabs';
import type { VerlaufManifeste } from '../../lib/verlaufLabel';
import { useTabs } from './useTabs';
import { useStelleDaten } from './useStelleDaten';

// ─── L6 (Entscheid David 7.9.2026) · DER NAME EINES FENSTERS ─────────────────
//
// Zeichnet die kanonische Kurzform des Dokuments, das in einem Pane liegt —
// «OR», «Art. 336c OR», «OGer AG HOR.2024.19», «Fristenrechner». Steht im
// `PaneKopf`, sobald dessen Identitäts-Teil an die Inhaltsseite abgegeben ist
// (A-2 `nurSteuerung`); die Herleitung des Befunds steht dort am Fundort.
//
// ── §5 · DIESELBE QUELLE WIE DER REITER, NICHT NUR DIESELBE ABSICHT ─────────
// Gesucht wird der OFFENE REITER mit derselben Identität (`tabSchluessel`) und
// durch DIESELBE Funktion geschickt, die die Reiterleiste benutzt
// (`reiterKurzformText`). Nur der Reiter-Eintrag trägt die Lesestellung, die
// der Scroll-Spy laufend hineinlegt (D27) — ohne ihn stünde «OR» statt
// «Art. 336c OR». Ist kein Reiter (mehr) offen, steht der Pfad selbst Modell;
// dann fehlt die Stellung, nie der Name. Diese Datei leitet keine einzige
// Zeichenkette selbst ab.
//
// ── WARUM EIGENE KOMPONENTE UND NICHT `Shell.titelVon` (§15) ────────────────
// Die Lesestellung ist REAKTIV: `aktualisiereTabArtikel` schreibt sie bei jedem
// Artikelwechsel und schickt `TABS_EVENT`. Ein `useTabs()` in der `Shell` hätte
// dieses Ereignis an die GANZE App-Hülle gehängt — Topbar, Seitenleiste,
// Reiterleiste, Fusszeile und der komplette Teilbaum jedes sekundären Panes
// (`SekundaerPane` bekommt bei jedem Shell-Render neue Props und rendert seinen
// `RouteSwitch` nach) hätten beim Scrollen durch einen Erlass mitgerendert.
// Heute trägt das Abonnement allein die `Reiterleiste`; diese Komponente hält
// es genauso klein — betroffen ist der eine Text-Knoten, der sich ändert.
// Logikverlust: keiner, die Anzeige ist dieselbe.
export function PaneName({ pfad, manifeste }: { pfad: string; manifeste: VerlaufManifeste }) {
  const tabs = useTabs();
  const teil = tabSchluessel(pfad);
  const tab = tabs.find((t) => tabSchluessel(t.path) === teil) ?? { path: pfad };
  // DFG-F01: die Stelle («§ 4», «Art. 12 SchlT ZGB») aus denselben Einträgen wie die Leiste.
  const text = reiterKurzformText(tab, useStelleDaten([tab], manifeste));
  // R8 (7.9.2026): die Beschriftung kappt per `truncate` — dann MUSS der volle
  // Wortlaut per `title` erreichbar bleiben (kein stiller Anschnitt). Anatomie
  // wie die Blatt-Krume der `OrtsAngabe` daneben (text-xs · font-medium ·
  // ink-800): der Pane-Kopf spricht in beiden Zuständen dieselbe Sprache.
  // `data-pane-name` ist der Testanker (`e2e/w224-l6-panekopf.e2e.ts`), wie
  // `data-pane-kopf` und `data-ort-artikel` daneben.
  return (
    <span data-pane-name title={text} className="min-w-0 truncate text-xs font-medium text-ink-800">{text}</span>
  );
}
