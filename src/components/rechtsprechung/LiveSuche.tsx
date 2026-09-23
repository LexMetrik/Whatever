import { useEffect, useRef, useState } from 'react';
import {
  sucheLive, LIVE_QUELLE, type LiveTreffer, type LiveSortierung, type LiveSuchErgebnis,
} from '../../lib/rechtsprechung/livesuche';
import { kantonLabel } from './format';
import { Datum } from '../ui/Datum';
import { TrefferZeile, TREFFER_ZEILE_RAHMEN } from '../ui/TrefferZeile';

// Opt-in Live-Volltextsuche über den GESAMTEN Schweizer Korpus (entscheidsuche.ch),
// weit über die kuratierte LexMetrik-Auswahl hinaus. DISCOVERY, keine Engine (§2):
// externe, NICHT geprüfte Treffer, klar als solche markiert; massgeblich bleibt die
// amtliche Fassung (Link je Treffer). Standardmässig eingeklappt — der Suchbegriff
// verlässt die App erst auf bewusste Aktion (Berufsgeheimnis, §8). Reine Darstellung (§3).

// A3-3 (R3-β, 31.8.2026): die Zeile lief über den geteilten `ui/TrefferZeile`
// — bis dahin war sie die DRITTE Bauform derselben Inhaltsklasse («anklickbare
// Zeile mit Titel, zweiter Zeile, Marke und Pfeil») neben Katalog und Suche,
// die Runde 2 bereits zusammengeführt hatte. Die lokale Kopie ist gelöscht,
// nicht angeglichen (§5/§10). Damit folgt sie auch dem Kanon der Zeile:
// Untertitel in `body-s` statt `xs`, zwei Zeilen statt harter Kappung (§8),
// Titel-Hover über den Gruppen-Namen des Rahmens. Additiv am Baustein waren
// zwei Dinge, die diese Fläche mitbringt und die anderen nicht hatten: der
// `meta`-Slot (Kanton · Datum · Aktenzeichen) und die Pfeil-Glyphe «↗» für
// «führt aus der App hinaus».
function LiveTrefferZeile({ t }: { t: LiveTreffer }) {
  const inner = (
    <TrefferZeile
      titel={t.titel}
      untertitel={t.thema}
      pfeil={t.quelleUrl ? '↗' : null}
      meta={<>
        <span>{kantonLabel(t.kanton)}</span>
        {/* B-3-NACHZUG (R2-A, 31.8.2026): das Datum stand in der MONO-Stimme
            (`.num`) — die bleibt SR-Nummer und Aktenzeichen vorbehalten
            (Design-Grundlage Kap. 2.1). Format und Auszeichnung kommen jetzt
            aus dem einen Baustein; das Aktenzeichen daneben behält `.num`. */}
        {t.datum && <><span aria-hidden>·</span><Datum iso={t.datum} /></>}
        {t.aktenzeichen && <><span aria-hidden>·</span><span className="num">{t.aktenzeichen}</span></>}
      </>}
    />
  );
  return t.quelleUrl ? (
    <a href={t.quelleUrl} target="_blank" rel="noopener noreferrer"
      className={`${TREFFER_ZEILE_RAHMEN} px-4 py-2.5 no-underline lc-hover-flaeche`}
      title="Amtliches Dokument bei entscheidsuche.ch öffnen">
      {inner}
    </a>
  ) : (
    <div className={`${TREFFER_ZEILE_RAHMEN} px-4 py-2.5`}>{inner}</div>
  );
}

export function LiveSuche({ initialQ = '' }: { initialQ?: string }) {
  const [offen, setOffen] = useState(false);
  const [q, setQ] = useState(initialQ);
  const [sortNach, setSortNach] = useState<LiveSortierung>('relevanz');
  const [laden, setLaden] = useState(false);
  const [fehler, setFehler] = useState(false);
  const [erg, setErg] = useState<LiveSuchErgebnis | null>(null);
  const abbruch = useRef<AbortController | null>(null);

  useEffect(() => () => abbruch.current?.abort(), []);

  const fuehreAus = (sortierung: LiveSortierung) => {
    const begriff = q.trim();
    if (!begriff) return;
    abbruch.current?.abort();
    const ctrl = new AbortController();
    abbruch.current = ctrl;
    setLaden(true); setFehler(false);
    sucheLive(begriff, { size: 20, sortNach: sortierung, signal: ctrl.signal })
      .then((r) => { if (!ctrl.signal.aborted) { setErg(r); setLaden(false); } })
      .catch((e) => { if (!ctrl.signal.aborted && e?.name !== 'AbortError') { setFehler(true); setLaden(false); } });
  };

  const onSubmit = (e: React.FormEvent) => { e.preventDefault(); fuehreAus(sortNach); };
  const setzeSort = (s: LiveSortierung) => { setSortNach(s); if (erg || laden) fuehreAus(s); };

  if (!offen) {
    return (
      <div className="border-t border-rule-soft pt-4">
        <button type="button" onClick={() => { setOffen(true); setQ((cur) => cur || initialQ); }}
          className="text-body-s text-ink-700 underline underline-offset-4 hover:text-ink-900">
          Nicht dabei? Im gesamten Schweizer Korpus suchen (entscheidsuche.ch) →
        </button>
      </div>
    );
  }

  return (
    <section aria-label="Live-Suche entscheidsuche.ch" className="border-t border-rule-soft pt-4 space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="lc-overline text-reg-r">Live-Suche · gesamter CH-Korpus</h2>
        <button type="button" onClick={() => setOffen(false)} className="text-xs text-ink-500 hover:text-ink-700">einklappen</button>
      </div>

      <p className="text-micro text-ink-500 leading-relaxed">
        Durchsucht <span className="text-ink-600">{LIVE_QUELLE}</span> (Bund + alle Kantone, alle Sprachen) — weit über die
        kuratierte Auswahl hinaus. Die Treffer sind <span className="text-ink-600">extern und nicht von LexMetrik geprüft</span>;
        massgeblich ist die amtliche Fassung (Link je Treffer). Der Suchbegriff wird an {LIVE_QUELLE} übermittelt.
      </p>

      <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-2">
        <input
          type="search" value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Begriff, Norm oder Aktenzeichen …" aria-label="Live-Suchbegriff"
          className="lc-input lc-input-sm w-auto min-w-0 flex-1"
        />
        {/* K3: Text-Schalter (`.ub-schalter`, D22) statt Kasten-Segment. */}
        <div className="flex items-baseline gap-x-4" role="group" aria-label="Sortierung">
          {(['relevanz', 'datum'] as const).map((s) => (
            <button key={s} type="button" onClick={() => setzeSort(s)} aria-pressed={sortNach === s}
              className="ub-schalter">
              {s === 'relevanz' ? 'Relevanz' : 'Neueste'}
            </button>
          ))}
        </div>
        <button type="submit" disabled={!q.trim() || laden}
          className="lc-btn-mini px-3 text-xs font-medium text-ink-700 hover:border-line-strong hover:bg-transparent hover:text-ink-900 disabled:opacity-40">
          {laden ? 'sucht …' : 'Suchen'}
        </button>
      </form>

      {fehler && (
        <div className="lc-notice lc-notice-warn text-body-s">
          Die Live-Suche bei {LIVE_QUELLE} ist gerade nicht erreichbar. Die kuratierte Auswahl oben funktioniert unabhängig davon.
        </div>
      )}

      {erg && !laden && !fehler && (
        erg.treffer.length === 0 ? (
          <div className="lc-notice text-body-s">Keine externen Treffer für «{q.trim()}».</div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-ink-500">
              <span className="num text-ink-700">{erg.totalIstMindestens ? `${erg.total}+` : erg.total}</span> Treffer bei {LIVE_QUELLE}
              {' '}· angezeigt {erg.treffer.length}
            </p>
            <div className="divide-y divide-rule-soft border-y border-rule-soft">
              {erg.treffer.map((t) => <LiveTrefferZeile key={t.id} t={t} />)}
            </div>
          </div>
        )
      )}
    </section>
  );
}
