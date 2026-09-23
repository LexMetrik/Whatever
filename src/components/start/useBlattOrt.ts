import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BLATT_PARAM, elternOrt, leseBlatt, schreibeBlatt, type BlattOrt } from '../../lib/startBlatt';

// ─── Startseite · Blatt-Adresse ↔ Browser-Verlauf (W2·29-WERKBANK-START S1) ──
//
// Jede Stufe ist ein eigener Verlaufs-Eintrag (`/?blatt=…`), damit
// Browser-Zurück genau eine Stufe zurückgeht (David 23.9.2026). «← Zurück» und
// ✕ im Blatt benutzen DENSELBEN Verlauf, statt neue Einträge anzuhängen —
// sonst führte Browser-Zurück nach einem «← Zurück» wieder in die Tiefe.
//
// Dafür trägt jeder Eintrag im Router-State zwei Angaben:
//   · `blattTiefe` — wie viele Blatt-Einträge seit dem Einstieg gestapelt sind;
//   · `blattVonZu` — ob die Kette auf der ZUGEKLAPPTEN Startseite begann.
// Ein Deep-Link (`/?blatt=gesetze/bund/02` direkt geöffnet) hat Tiefe 0: dort
// ersetzt «← Zurück» den Eintrag durch die Elternstufe, und ✕ ersetzt ihn durch
// die zugeklappte Seite — es gibt keinen eigenen Verlauf, den man zurückgehen
// könnte, und die Seite davor gehört jemand anderem.
//
// HYDRATION: der Prerender kennt keine Query und liefert «/» zugeklappt. Liest
// der erste Client-Render den Parameter, weicht sein Baum vom Server-HTML ab,
// und React 19 verwirft die Hydration. Darum ist der Ort bis nach dem ersten
// Effekt `null`; ein Deep-Link öffnet danach — ohne Animation (s. Kachelfeld).

interface BlattState { blattTiefe?: number; blattVonZu?: boolean }

export function useBlattOrt() {
  const loc = useLocation();
  const nav = useNavigate();
  const [hydriert, setHydriert] = useState(false);
  useEffect(() => setHydriert(true), []);

  // Über den ROHWERT memoisiert: ein neues Objekt je Render liesse die Phasen-
  // Logik im Kachelfeld (Effekt auf `ort`) endlos nachlaufen.
  const wert = new URLSearchParams(loc.search).get(BLATT_PARAM);
  const ort = useMemo(() => (hydriert ? leseBlatt(wert) : null), [hydriert, wert]);
  const st = (loc.state as BlattState | null) ?? {};
  const tiefe = st.blattTiefe ?? 0;
  const vonZu = st.blattVonZu ?? false;

  const ziel = (o: BlattOrt | null) => {
    const p = new URLSearchParams(loc.search);
    if (o) p.set(BLATT_PARAM, schreibeBlatt(o));
    else p.delete(BLATT_PARAM);
    // Lesbare Adresse `?blatt=gesetze/bund/02`: der Schrägstrich ist in einer
    // Query zulässig (RFC 3986 §3.4), `URLSearchParams` kodiert ihn nur vorsorglich.
    const qs = p.toString().replace(/%2F/gi, '/');
    return { pathname: loc.pathname, search: qs ? `?${qs}` : '', hash: '' };
  };

  /** Eine Stufe tiefer (oder die Kachel öffnen): neuer Verlaufs-Eintrag. */
  const gehe = (o: BlattOrt) => {
    nav(ziel(o), { state: { blattTiefe: tiefe + 1, blattVonZu: ort ? vonZu : true } satisfies BlattState });
  };

  /** «← Zurück»: eine Stufe höher — über den Verlauf, wo es einen gibt. */
  const zurueck = () => {
    if (!ort) return;
    if (tiefe > 0) { nav(-1); return; }
    const eltern = elternOrt(ort);
    nav(ziel(eltern), { replace: true, state: { blattTiefe: 0, blattVonZu: false } satisfies BlattState });
  };

  /** ✕ / Escape: ganz zu. */
  const schliessen = () => {
    if (!ort) return;
    if (vonZu && tiefe > 0) { nav(-tiefe); return; }
    nav(ziel(null), { replace: true });
  };

  return { ort, hydriert, gehe, zurueck, schliessen };
}
