import { useContext, useMemo, type ReactNode } from 'react';
import { BEKANNTER_FEHLER_SATZ, BEKANNTER_FEHLER_TITEL, bekannterFehlerZeile } from '../lib/bekannteFehler';
import { BekannteFehlerKontext, useBekannteFehler } from './bekannteFehlerKontext';

// ─── «Bekannter Fehler – Ergebnis nicht verwenden» (§8, ROADMAP JETZT 3) ─────
// Rahmen: legt fest, für welches Werkzeug (Karten-id) die Ergebnisse darunter
// gelten. Hinweis: steht im Ergebnisblock (`ErgebnisBlock`) vor dem Verdikt —
// Danger-Ton (§R-11 «Blocker»), `role="status"` (Zustand ohne Behebungsauftrag,
// Sonde design-r9), kein Icon/SVG (e2e qsui-hierarchie: nichts Abgeleitetes
// über dem Verdikt). Ohne Eintrag rendert er nichts.
export function BekannteFehlerRahmen({ werkzeug, children }: { werkzeug: string; children: ReactNode }) {
  const aussen = useContext(BekannteFehlerKontext);
  const wert = useMemo(() => [...aussen, werkzeug], [aussen, werkzeug]);
  return <BekannteFehlerKontext.Provider value={wert}>{children}</BekannteFehlerKontext.Provider>;
}

export function BekannterFehlerHinweis() {
  const fehler = useBekannteFehler();
  if (fehler.length === 0) return null;
  return (
    <div role="status" className="lc-notice-danger space-y-2 text-body-s" data-bekannter-fehler="">
      <p className="font-semibold">{BEKANNTER_FEHLER_TITEL}</p>
      <p className="max-w-reading-s">{BEKANNTER_FEHLER_SATZ}</p>
      <ul className="list-disc space-y-1 pl-5 max-w-reading-s">
        {fehler.map((f) => <li key={`${f.fb}-${f.text}`}>{bekannterFehlerZeile(f)}</li>)}
      </ul>
    </div>
  );
}
