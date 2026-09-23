import { useLocation } from 'react-router-dom';
import { usePaneSteuerung } from '../../../components/layout/usePaneLayout';
import { naechsteInstanz } from '../../../lib/tabs';

// ─── «⧉ Daneben öffnen» — Aktion des Erlass-Kopfs ───────────────────────────
//
// Herausgelöst aus `LeserRahmenV3.tsx` (H2b, §6.6): der Rahmen soll sagen, WO
// etwas steht, nicht was beim Klick auf einen einzelnen Knopf geschieht.
//
// §3: keine Rechtslogik. Der Knopf ruft die geteilte Pane-Steuerung
// (`components/layout/usePaneLayout`) — dieselbe, die die Arbeitsleiste für
// ihr ⧉ und das Überlauf-Blatt benutzen.
//
// ── Ä118 (Live-Ästhetik-Prüfung 18.8.2026) · EIN FEATURE, EIN WORT ───────────
//
// GEMESSEN am Accessible-Name-Inventar hiess DIESELBE Sache — die zweite
// Lesefläche neben der ersten — an fünf Stellen anders: «In neuem Reiter»
// (hier), «Alle geöffneten Reiter»/«Reiter & Split-View» (Topbar),
// «Hauptfenster schliessen»/«zum Hauptfenster machen» (Griffleiste),
// «Pane-Breite anpassen» (Trenner), «Layout-Link kopieren» (Menü). Und
// «Reiter» bezeichnete zugleich die REITER DES PANELS — dasselbe Wort für zwei
// verschiedene Sachen in derselben Ansicht. Der Glossar-Entscheid von damals
// («Reiter» bleibt dem Panel, die Split-Sache heisst «Fenster») gilt für seinen
// Stand unverändert weiter; das Wort «In neuem Reiter» bleibt hier verboten.
//
// ── M8 (Prüfbefund R11 #28, 6.9.2026) · DAS WORT SAGTE, WAS NICHT GESCHAH ───
//
// GEMESSEN am Stand `2a18f97bb` (Messung H3, Screen `pruef-r11-09`): der Klick
// auf «⧉ In neuem Fenster» ergab `panes: []` und **keine** `[data-pane]`-Spalte
// — er legte einen zweiten REITER `/gesetze/bund/OR?r=2` an. Der Tooltip
// versprach dabei ausdrücklich, «in einem zweiten Fenster» zu öffnen.
// Seit dem R2-Nachzug trägt die Arbeitsleiste messbar `title="Fenster links"`
// bzw. `"Fenster rechts"` für die Panes: das Wort «Fenster» ist seither belegt,
// und derselbe Knopf öffnete keines. Ä118 hat den Namen entschieden, als es
// noch keine Reiterleiste und keine Marken gab — der Beleg von damals bleibt
// richtig für damals, er wird hier nicht nachgeführt, sondern ergänzt.
//
// DER ENTSCHEID: der Knopf tut jetzt, was er sagt — er öffnet das zweite
// Fenster (`oeffneDaneben`), und er heisst wie überall sonst in der App, wo
// dasselbe geschieht: «Daneben öffnen» (Arbeitsleiste ⧉, Überlauf-Blatt,
// Reiter-Kontextmenü). Ein Wort, eine Wirkung, eine Stelle.
//
// DIE ZWEITE INSTANZ IST NICHT VERLOREN, SIE IST DER INHALT DES FENSTERS
// (§17-Gegengewicht, «keine Funktion verloren»): geöffnet wird nicht der
// AKTUELLE Pfad, sondern `naechsteInstanz(pfad)` — «…/OR?r=2». Zwei Gründe,
// beide zwingend:
//   (a) FACHLICH: der Knopf hiess immer «denselben Erlass NOCH EINMAL» — zwei
//       Stellen desselben Gesetzes nebeneinander lesen (Art. 336c neben
//       Art. 335c). Genau das ist die Instanz-Semantik von `?r=<n>`.
//   (b) TECHNISCH: `paneSteuerung.oeffneDaneben` weist einen Pfad ab, der schon
//       offen ist (`istOffen`, «kein Doppel») — und die eigene Adresse IST
//       immer offen. Ohne den Instanz-Diskriminator täte der Knopf nichts.
// Zusätzlich legt seit M4 der Eintrag «Duplizieren» im Kontextmenü JEDES
// Reiters denselben Doppelreiter an; `lib/useErlassOeffnen.ts` nutzt
// `naechsteInstanz` unverändert weiter.
//
// SICHTBAR NUR, WENN ES AUFGEHT — dieselbe Regel wie beim ⧉ der Arbeitsleiste:
// `kannOeffnen` ist erst ab lg und mit freier Kapazität wahr. Ein Knopf, der
// nichts bewirkt, wäre wieder eine Zusage, die nicht gilt (§8).

export function ReiterAktion({ kuerzel, onGeoeffnet }: {
  /** Kurzform des Erlasses — was im Accessible Name stehen soll. */
  kuerzel: string;
  /** Bestätigung anstossen (Toast an, Timer im Modell zurücksetzen). */
  onGeoeffnet: () => void;
}) {
  const { oeffneDaneben, kannOeffnen } = usePaneSteuerung();
  const { pathname, search, hash } = useLocation();
  if (!kannOeffnen) return null;
  return (
    <button type="button"
      onClick={() => { oeffneDaneben(naechsteInstanz(pathname + search + hash)); onGeoeffnet(); }}
      className="lc-chip hover:border-ink-900 hover:text-ink-900"
      aria-label={`«${kuerzel}» daneben öffnen`}
      title="Diesen Erlass zusätzlich im zweiten Fenster daneben öffnen">⧉ Daneben öffnen</button>
  );
}
