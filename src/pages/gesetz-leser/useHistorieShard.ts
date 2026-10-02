import { useCallback, useEffect, useMemo, useState } from 'react';
import { beiLeerlauf } from '../../lib/leerlauf';
import { ladeHistorieShardErgebnis, historieFuerArtikel, type ArtikelHistorie, type HistorieShard } from '../../lib/normtext/historie-laden';

// ─── G-HIST-UI · Historie-Shard des Lesers, mit Ladefehler und Neuversuch ───────
//
// Aus `inhalt-zustand.tsx` herausgelöst (W2·17-UI-BEFUNDE PE-F10-B01, 1.10.2026): EIN
// idle-Fetch auf Reader-Ebene (wie Leitfall-/Revisions-Shard), der Artikel-Eintrag wird
// als Prop durchgereicht (die `ArtikelHistorieZeile` ist ein reiner Renderer). An den
// Erlass-Key gebunden — ein Pane-/Erlass-Wechsel liefert nie fremde Historie.
//
// NEU: der Stand trennt «kein Shard» (404 — Kanton, Staatsvertrag ohne Fussnoten) von
// «nicht erreichbar» (`fehler`). Vorher blieb beides `wert: null`, und das Blatt sagte
// bei einem Netzfehler «Zu Art. N nichts erfasst.» und bei Staatsverträgen zusätzlich
// «Erlass in Kraft seit …» (§8). `erneut` zählt `versuch` hoch und lässt den Abruf noch
// einmal laufen; der Lader cacht den Fehlschlag nicht.

export interface HistorieStand {
  wert: HistorieShard | null;
  /** Der Abruf ist durch (Shard da, «kein Shard» ODER gescheitert — dann `fehler`). */
  fertig: boolean;
  /** `fertig` und gescheitert: `wert: null` ist dann KEINE Auskunft über den Erlass. */
  fehler?: boolean;
  erneut?: () => void;
}

const NICHT_FERTIG: HistorieStand = { wert: null, fertig: false };

export function useHistorieShard(erlassKey: string | undefined): {
  historieFuer: (artikel: string) => ArtikelHistorie | undefined;
  historieStand: HistorieStand;
} {
  const [shard, setShard] = useState<{ key: string; shard: HistorieShard | null; fehler: boolean; versuch: number } | null>(null);
  const [versuch, setVersuch] = useState(0);
  useEffect(() => {
    if (!erlassKey) return;
    let lebt = true;
    const abbrechen = beiLeerlauf(() => {
      // G-HIST-UI: Historie-Shard (Bund; Kanton 404 → kein Shard → still kein Badge, §8).
      void ladeHistorieShardErgebnis(erlassKey).then((r) => {
        if (lebt) setShard({ key: erlassKey, shard: r.shard, fehler: r.fehler, versuch });
      });
    });
    return () => { lebt = false; abbrechen(); };
  }, [erlassKey, versuch]);
  const erneut = useCallback(() => setVersuch((v) => v + 1), []);
  // Artikel-Token → Fassungshistorie des AKTUELLEN Erlasses (sonst undefined = kein Badge).
  // Direkter Roh-Token-Lookup (Snapshot/Shard gleiche Extraktion).
  const historieFuer = useCallback((artikel: string) => (
    erlassKey && shard?.key === erlassKey ? historieFuerArtikel(shard.shard, artikel) : undefined
  ), [erlassKey, shard]);
  // P5 · B1 (1.10.2026): WANN der Shard da ist — dieselbe Quelle wie `historieFuer`
  // (Leerlauf-Fetch, rIC-Timeout 1200 ms), an Erlass-Key UND Versuch gebunden (während
  // eines Neuversuchs steht wieder «lädt», nie der alte Fehler). Das Panel sperrt
  // «Erlass in Kraft seit»/«nichts erfasst» darauf, nicht auf einen eigenen Lader.
  const historieStand = useMemo<HistorieStand>(() => (
    erlassKey && shard?.key === erlassKey && shard.versuch === versuch
      ? { wert: shard.shard, fertig: true, ...(shard.fehler ? { fehler: true } : {}), erneut }
      : NICHT_FERTIG
  ), [erlassKey, shard, versuch, erneut]);
  return { historieFuer, historieStand };
}
