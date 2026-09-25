import { useEffect, useMemo, useState } from 'react';
import { KontextGruppe } from '../kontext/KontextPanel';
import { KantenChip } from '../verzahnung/KantenChip';
import { StatusBadge } from '../verzahnung/StatusBadge';
import { usePaneSteuerung } from '../layout/usePaneLayout';
import { fundstellenFuerNormen } from '../../lib/rechtsprechung/abschnitte';
import { aufloeseZitierteEntscheide } from '../../lib/verzahnung/entscheid-kanten';
import {
  klassifiziereFassungsBezug, revisionFuerToken, revisionDetailText, ladeRevisionShards,
  type RevisionShard, type ArtikelRevision,
} from '../../lib/verzahnung/artikel-revisionen';
import type { Datumspraezision } from '../../lib/verzahnung/typen';
import { ladeEntscheidManifest } from '../../lib/rechtsprechung/browse';
import { bundSnapshotRef } from '../../lib/normtext/bundRef';
import type { BrowseEntscheid } from '../../lib/rechtsprechung/register';
import type { EntscheidSnapshot } from '../../lib/rechtsprechung/typen';
import { erlassPfadVonKey } from '../../lib/normtext/erlassAdresse';

// ─── EntscheidLeser: beide Verzahnungs-Richtungen am Dokumentfuss (V1.3) ─────
//
// FAHRPLAN-VERZAHNUNG-UI §2.2 (W2·7-VZUI): die vorwärtige «Zitierte Normen»-
// Gruppe (artikelscharf, Sprung zur Erwägungs-Fundstelle) und die rückwärtige
// «Zitierte Entscheide»-Gruppe (Zähler + NUR aufgelöste Treffer als Chips +
// ehrlicher Hinweissatz) leben am Panel/Dokumentfuss — die Regeste bleibt oben
// ungestört (§0-1d). Beide rendern in der geteilten KontextGruppe-Hülle (§5).
// Reine Darstellung (§3); Auflösung in lib/verzahnung/entscheid-kanten.ts bzw.
// lib/rechtsprechung/abschnitte.ts.

// Anker «e-2-3» → Anzeige «E. 2.3» (reine Formatierung der Anker-Konvention).
function ankerLabel(anker: string): string {
  return `E. ${anker.slice(2).split('-').join('.')}`;
}

// Sprung + kurzes Ziel-Blinken — dieselbe Mechanik wie der EntscheidLeser
// (lc-ziel-blink-Token, reduced-motion respektiert). Klein gehalten und lokal,
// weil nur aus Klick-Handlern aufgerufen (kein SSR-Pfad).
function springeZuAnker(id: string): boolean {
  if (typeof document === 'undefined') return false;
  const el = document.getElementById(id);
  if (!el) return false;
  const reduziert = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ block: 'start', behavior: reduziert ? 'auto' : 'smooth' });
  el.classList.add('lc-ziel-blink');
  window.setTimeout(() => el.classList.remove('lc-ziel-blink'), 2400);
  return true;
}

// ── «Zitierte Normen» (vorwärts, artikelscharf) ──────────────────────────────
//
// Ersetzt im Entscheid-Panel die grobe Erlass-Gruppe (keine Doppel-Darstellung).
// Chip-Klick springt zur ERSTEN Erwägung, die die Norm zitiert (dieselbe
// Ketten-/Normalisierungs-Logik wie die Inline-Verlinkung, `ersteFundstelle`);
// ohne Text-Fundstelle zur Regeste. ⧉ öffnet den Erlass am zitierten Artikel im
// Split-View-Pane (nur wo ein Bund-Snapshot auflösbar ist; Pane-Gating).
export function ZitierteNormenGruppe({ abschnitte, zitierteNormen, regesteAnker, entscheidDatum }: {
  abschnitte: EntscheidSnapshot['abschnitte'];
  zitierteNormen: string[];
  /** Anker der Regeste-Box, falls sichtbar — sonst null (kein Fallback-Ziel). */
  regesteAnker: string | null;
  /** Datum + Präzision DIESES Entscheids (§V1c): hat sich eine zitierte Norm SEIT
   *  dem Entscheid revidiert? Q1-sicher (Bandjahr-Platzhalter ⇒ strikter Jahresvergleich). */
  entscheidDatum: { iso: string; praezision: Datumspraezision };
}) {
  const fundstellen = useMemo(
    () => fundstellenFuerNormen(abschnitte, zitierteNormen),
    [abschnitte, zitierteNormen],
  );
  const { oeffneDaneben, kannOeffnen, istOffen } = usePaneSteuerung();
  const [ziel, setZiel] = useState('');

  // §V1c: Revisions-Shards der zitierten Erlasse lazy laden (Muster wie ZitiertGruppe:
  // still einwachsend am Dokumentfuss, kein reservierter Leerraum §15.2). Die
  // zitierten Normen streuen über mehrere Erlasse (bundSnapshotRef → quelle/token).
  const erlassKeys = useMemo(() => {
    const s = new Set<string>();
    for (const norm of zitierteNormen) {
      const ref = bundSnapshotRef(norm);
      if (ref) s.add(ref.quelle);
    }
    return [...s];
  }, [zitierteNormen]);
  const erlassSignatur = erlassKeys.join(',');
  const [revShards, setRevShards] = useState<Map<string, RevisionShard | null>>(new Map());
  useEffect(() => {
    if (erlassKeys.length === 0) return;
    let lebt = true;
    void ladeRevisionShards(erlassKeys).then((m) => { if (lebt) setRevShards(m); });
    return () => { lebt = false; };
    // erlassSignatur ist der stabile Schlüssel über die Erlass-Menge (Array-Identität
    // wechselt sonst je Render); erlassKeys wird daraus abgeleitet.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [erlassSignatur]);

  // Revision r(a) einer zitierten Norm (undefined = Erlass nicht abgedeckt/lädt ⇒
  // 'unbekannt'; null = Urfassung ⇒ 'gleich'; Objekt = letzte Textänderung).
  const revidiertFuer = (norm: string): ArtikelRevision | null => {
    const ref = bundSnapshotRef(norm);
    if (!ref) return null;
    const rev = revisionFuerToken(revShards.get(ref.quelle), ref.token);
    return klassifiziereFassungsBezug(entscheidDatum, rev) === 'revidiert' ? (rev ?? null) : null;
  };

  if (zitierteNormen.length === 0) return null;

  const springe = (norm: string) => {
    const anker = fundstellen.get(norm) ?? null;
    const gesprungen = anker ? springeZuAnker(anker) : (regesteAnker ? springeZuAnker(regesteAnker) : false);
    setZiel(gesprungen
      ? (anker ? `${norm}: zur Fundstelle gesprungen` : `${norm}: keine Textstelle — zur Regeste gesprungen`)
      : `${norm}: keine Fundstelle im Text`);
  };

  return (
    <KontextGruppe titel="Zitierte Normen" richtung="Wendet an" punkt="norm" anzahl={zitierteNormen.length}
      hinweis={<><span className="num">{zitierteNormen.length}</span> erfasste Normen — aus der Quelle übernommen, maschinell und ohne redaktionelle Durchsicht. Klick springt zur Fundstelle im Urteilstext.</>}>
      <div className="flex flex-wrap gap-2">
        {zitierteNormen.map((norm) => {
          const hatFundstelle = !!fundstellen.get(norm);
          // Erlass-Brücke: nur wo ein Bund-Snapshot auflösbar ist (nie ein toter
          // Link, §8) — öffnet den Artikel im Pane, der Entscheid bleibt offen.
          const ref = bundSnapshotRef(norm);
          const readerLink = ref ? `${erlassPfadVonKey(ref.quelle)}#art-${ref.token}` : null;
          const revidiert = revidiertFuer(norm);
          return (
            <span key={norm} className="inline-flex items-center">
              <button type="button" onClick={() => springe(norm)}
                className="lc-chip num no-underline hover:border-accent-line hover:text-accent-text transition-colors"
                title={hatFundstelle
                  ? `Zur Fundstelle von ${norm} im Urteilstext springen`
                  : `${norm} — keine Textstelle in den Erwägungen; springt zur Regeste`}>
                {norm}
                {!hatFundstelle && <span aria-hidden className="ml-1 text-ink-400">·</span>}
                {revidiert && <StatusBadge praedikat="revidiert" variant="glyph" detail={revisionDetailText(revidiert)} className="ml-1" />}
              </button>
              {readerLink && kannOeffnen && !istOffen(readerLink) && (
                <button type="button" onClick={() => oeffneDaneben(readerLink)}
                  title={`${norm} nebeneinander öffnen`} aria-label={`${norm} nebeneinander öffnen`}
                  className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-md border border-line text-ink-500 hover:text-accent-text hover:border-accent-line transition-colors">
                  <span aria-hidden className="lc-griff-glyph">⧉</span>
                </button>
              )}
            </span>
          );
        })}
      </div>
      <p aria-live="polite" className="sr-only">{ziel}</p>
    </KontextGruppe>
  );
}

// ── «Zitierte Entscheide» (rückwärts im Text: was DIESER Entscheid zitiert) ──
//
// Rausch-frei (§0-1c): Zähler («n erfasste Zitate, davon k im Korpus») + NUR die
// aufgelösten Treffer als Link-Chips + EIN Hinweissatz für den Rest — keine
// grauen Nicht-Link-Chips. Jede aufgelöste Kante trägt zusätzlich den Sprung
// zur zitierenden Erwägung im AKTUELLEN Text («E. 2.3», Auftrag David 3.7.2026).
export function ZitiertGruppe({ zitierteEntscheide, abschnitte, selbstKey }: {
  zitierteEntscheide: string[];
  abschnitte: EntscheidSnapshot['abschnitte'];
  selbstKey: string;
}) {
  const { oeffneDaneben, kannOeffnen, istOffen } = usePaneSteuerung();
  const [manifest, setManifest] = useState<BrowseEntscheid[] | null>(null);
  useEffect(() => {
    if (zitierteEntscheide.length === 0) return;
    let lebt = true;
    void ladeEntscheidManifest().then((m) => { if (lebt) setManifest(m?.entscheide ?? []); });
    return () => { lebt = false; };
  }, [zitierteEntscheide.length]);

  const daten = useMemo(
    () => (manifest ? aufloeseZitierteEntscheide(zitierteEntscheide, manifest, abschnitte, selbstKey) : null),
    [manifest, zitierteEntscheide, abschnitte, selbstKey],
  );

  if (zitierteEntscheide.length === 0) return null;
  // Lädt still — die Gruppe wächst am unteren Dokumentfuss ein (dieselbe
  // async-Klasse wie die Panel-Entscheide; kein reservierter Leerraum §15.2).
  if (!daten) return null;

  const aufgeloest = daten.kanten.filter((k) => k.ziel);
  return (
    <KontextGruppe titel="Zitierte Entscheide" richtung="Zitiert" punkt="entscheid" anzahl={daten.gesamt}
      hinweis={<>
        Zitiert <span className="num">{daten.gesamt}</span> erfasste Entscheide, davon <span className="num">{daten.imKorpus}</span> im
        Korpus. Übrige Zitate maschinell aus dem Urteilstext gelesen — im Korpus (noch) nicht erfasst.
        Entscheide beziehen sich auf die im Entscheidzeitpunkt geltende Fassung.
      </>}>
      {aufgeloest.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {aufgeloest.map((k) => {
            const ziel = `/rechtsprechung/${encodeURIComponent(k.ziel!.key)}`;
            return (
              <li key={k.zitat} className="inline-flex items-center">
                <KantenChip to={ziel} label={k.zitat} kategorie="entscheid"
                  leitentscheid={k.ziel!.leitcharakter === 'leitentscheid'}
                  titel={k.ziel!.zitierung} />
                {/* Fundstelle des Zitats im AKTUELLEN Text (in-Text-Sprung). */}
                {k.fundstelleAnker && (
                  <button type="button" onClick={() => springeZuAnker(k.fundstelleAnker!)}
                    title={`Zur zitierenden Stelle ${ankerLabel(k.fundstelleAnker)} springen`}
                    aria-label={`Zur zitierenden Stelle ${ankerLabel(k.fundstelleAnker)} springen`}
                    className="ml-1 text-micro num text-ink-500 hover:text-accent-text">
                    ↳ {ankerLabel(k.fundstelleAnker)}
                  </button>
                )}
                {kannOeffnen && !istOffen(ziel) && (
                  <button type="button" onClick={() => oeffneDaneben(ziel)}
                    title={`${k.zitat} nebeneinander öffnen`} aria-label={`${k.zitat} nebeneinander öffnen`}
                    className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-md border border-line text-ink-500 hover:text-accent-text hover:border-accent-line transition-colors">
                    <span aria-hidden className="lc-griff-glyph">⧉</span>
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </KontextGruppe>
  );
}
