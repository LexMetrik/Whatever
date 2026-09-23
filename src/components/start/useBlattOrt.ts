import { useMemo, useSyncExternalStore } from 'react';
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
// und React 19 verwirft die Hydration. Darum ist der Ort im Hydrations-Render
// `null` (`useSyncExternalStore`, Server-Schnappschuss `false`); ein Deep-Link öffnet danach — ohne Animation (s. Kachelfeld).

interface BlattState { blattTiefe?: number; blattVonZu?: boolean }
const ohneAbo = () => () => {};

export function useBlattOrt() {
  const loc = useLocation();
  const nav = useNavigate();
  // Server- und Hydrations-Render sehen `false`, danach rendert React mit `true`
  // nach — ohne Effekt-setState (Muster wie `pages/Startseite` bis R10).
  const hydriert = useSyncExternalStore(ohneAbo, () => true, () => false);

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

  /** Hinauf zu einem VORFAHREN (`null` = die Rubrik zu): über den Verlauf, so
   *  viele Einträge, wie Stufen dazwischen liegen — jeder `gehe`-Eintrag ist
   *  genau eine Stufe tiefer. Wo der eigene Verlauf nicht so weit reicht
   *  (Deep-Link), wird der Eintrag ersetzt. Gegenprüfung S1 23.9.2026: der
   *  Pfad-Klick «Gesetze» aus `bund/02` pushte zuvor einen NEUEN Eintrag, und
   *  Browser-Zurück führte danach wieder in die Tiefe. */
  const hoch = (vorfahr: BlattOrt | null) => {
    if (!ort) return;
    const stufen = ort.pfad.length - (vorfahr ? vorfahr.pfad.length : -1);
    // Einträge dieser Kette oberhalb des Einstiegs: bei «von zu» ist der erste
    // Eintrag die Rubrik selbst (Tiefe 1), beim Deep-Link der Einstieg (Tiefe 0).
    const reicht = tiefe - (vonZu ? 1 : 0);
    if (stufen > 0 && stufen <= reicht) { nav(-stufen); return; }
    if (!vorfahr && vonZu && tiefe > 0) { nav(-tiefe); return; }
    nav(ziel(vorfahr), { replace: true, state: { blattTiefe: 0, blattVonZu: false } satisfies BlattState });
  };

  /** «← Zurück»: eine Stufe höher. */
  const zurueck = () => { if (ort) hoch(elternOrt(ort)); };

  /** ✕ / Escape: ganz zu. */
  const schliessen = () => {
    if (!ort) return;
    if (vonZu && tiefe > 0) { nav(-tiefe); return; }
    nav(ziel(null), { replace: true });
  };

  return { ort, hydriert, gehe, hoch, zurueck, schliessen };
}
