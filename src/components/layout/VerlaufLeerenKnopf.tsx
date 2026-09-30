import { leereZuletzt } from '../../lib/zuletztVerwendet';

// ─── «Verlauf leeren» — EIN Knopf für beide Orte (W2·31 P3, 30.9.2026) ─────
//
// Der Verlauf hat zwei Zugänge (§5: dieselbe Quelle `useZuletzt` /
// `lib/zuletztVerwendet`): das Topbar-Flyout (`VerlaufUebersicht`) und den
// Such-Leerzustand (`suche/SucheLeerzustand`). Das Flyout-Werkzeug fehlt, wo der
// Streifen es nicht trägt (unter 481 px; bei grosser Schrift bis ~570 px, index.css
// `.lc-topbar-verlauf`) — dort war «Verlauf leeren» unerreichbar, obwohl die Liste
// über die leere Suche sichtbar blieb. Darum steht derselbe Knopf an beiden Orten;
// die Lösch-LOGIK ist und bleibt `leereZuletzt()` (keine zweite). `onGeleert` ist
// Sache des Aufrufers (Flyout schliessen / Fokus ins Suchfeld zurückgeben).
//
// Form: `lc-btn-outline lc-btn-sm` — dieselbe Handlungsklasse wie «Alle
// schliessen» im Reiter-Panel (LM-088, B17).
export function VerlaufLeerenKnopf({ onGeleert }: { onGeleert?: () => void }) {
  return (
    <button
      type="button"
      onClick={() => { leereZuletzt(); onGeleert?.(); }}
      className="lc-btn-outline lc-btn-sm shrink-0"
    >
      Verlauf leeren
    </button>
  );
}
