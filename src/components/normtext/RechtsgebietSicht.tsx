import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { BrowseErlass } from '../../lib/normtext/browse-typen';
import { GEBIETE, GEBIET_LABEL } from '../../lib/normtext/register';
import {
  RECHTSGEBIET_THEMEN, themaMitgliedKeys,
  type RechtsgebietThema, type ThemaMitglied,
} from '../../lib/normtext/rechtsgebiet-thema';
import { getCalculator } from '../../lib/calculators';
import { ErlassTabelle } from './ErlassKarte';
import { usePaneKlasse } from '../layout/PaneKontext';
import { GruppenKopf } from '../ui/GruppenKopf';
import { erlassPfadVonKey } from '../../lib/normtext/erlassAdresse';

// ─── Rechtsgebiets-Sicht (zweite Gliederung, «Gerüst» — G6/§4.4) ─────────────
//
// Reine Darstellung (§3): schneidet den BUND-Korpus quer zur funktionalen
// Systematik neu — oben das kuratierte Querschnitts-Delta (6–8 Praxisfelder,
// status entwurf/§8), darunter das Auto-Grundgerüst (die vorhandene
// `rechtsgebiet`-Achse). Kantonale Erlasse bleiben über den Kantone-Einstieg
// (amtliche kantonale Systematik) erschlossen — ihr rechtsgebiet ist Default,
// nicht deklariert (§8: nicht als zweite Klassifikation vortäuschen).
//
// Toleranz (§4.4): «unzugeordnet» ist zulässig — das Grundgerüst deckt jeden
// Erlass; die Themen sind ein Overlay, kein Pflichtraster. Die Abdeckung wird
// ehrlich beziffert, nie erzwungen.

/** Deep-Link in den Reader; enger Bereich springt auf seinen ersten Artikel
 *  (#art-<ankerVon> — der Reader-Anker bleibt `art-<token>`, K2/R8). */
function mitgliedPfad(m: ThemaMitglied): string {
  const base = erlassPfadVonKey(m.key);
  return m.ankerVon ? `${base}#art-${m.ankerVon}` : base;
}

function ThemaMitgliedZeile({ e, m }: { e: BrowseErlass; m: ThemaMitglied }) {
  return (
    <Link
      to={mitgliedPfad(m)}
      title={m.beleg}
      className="flex items-baseline gap-2 text-body-s no-underline px-2 py-1 lc-hover-flaeche hover:[&>span:first-child]:underline min-w-0"
    >
      <span className="font-medium text-ink-700 shrink-0">{e.kuerzel}</span>
      {m.spanne
        ? <span className="num text-xs text-reg-g shrink-0">{m.spanne}</span>
        : <span className="text-ink-500 truncate">{e.titel}</span>}
      {m.spanne && <span className="text-ink-500 truncate">{e.titel}</span>}
    </Link>
  );
}

// Ein Querschnitts-Thema als Karte: Label + Kurzbeschrieb + Entwurf-Marke,
// darunter die Mitglieds-Erlasse (Deep-Link) und die Verzahnung (Werkzeuge +
// Rechtsprechung). Fehlende Mitglieder (Erlass nicht im Manifest) werden still
// übersprungen — nie eine tote Zeile.
function ThemaKarte({ t, proKey }: { t: RechtsgebietThema; proKey: Map<string, BrowseErlass> }) {
  const pk = usePaneKlasse();
  const mitglieder = t.mitglieder
    .map((m) => ({ m, e: proKey.get(m.key) }))
    .filter((x): x is { m: ThemaMitglied; e: BrowseErlass } => !!x.e);
  const werkzeuge = (t.werkzeuge ?? [])
    .map((slug) => getCalculator(slug))
    .filter((c): c is NonNullable<ReturnType<typeof getCalculator>> => !!c);
  return (
    <section className="lc-card p-5 space-y-3.5">
      <div className="space-y-1.5">
        <div className="flex items-baseline gap-2.5 flex-wrap">
          <h3 className="font-sans font-semibold text-ink-900 text-h3 tracking-tight">{t.label}</h3>
          {/* §8: das Querschnitts-Delta ist Entwurf bis zur fachlichen Abnahme.
              W2·19-DESIGN-KONSISTENZ · D-4: die Marke trug `lc-badge-soft` und
              damit den SLATE-Ton. Das Farb-Wörterbuch schliesst genau das aus —
              slate bedeutet ausschliesslich «neutrale, maschinell-prozedurale
              Referenzinformation ohne Wertung» und ausdrücklich NICHT
              «ungeprüft/in Vorbereitung» (DESIGN-REGLEMENT.md §N-4b-B,
              aufgelöste slate-Doppelbelegung). Der Prüfstands-Zustand «Entwurf»
              hat seine eigene, hausweit einzige Marke: `lc-badge-entwurf`
              (index.css:1482 — sie @applyt `lc-badge` bereits selbst, darum hier
              KEINE zweite Klasse). Der WORTLAUT bleibt unverändert «Entwurf»:
              §8 wird nicht abgeschwächt, nur richtig eingefärbt. */}
          <span className="lc-badge-entwurf">Entwurf</span>
        </div>
        <p className="text-body-s text-ink-600 max-w-reading">{t.kurz}</p>
      </div>

      <div className={pk('grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-2', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-x-5 gap-y-2')}>
        {mitglieder.map(({ m, e }) => <ThemaMitgliedZeile key={m.key + (m.spanne ?? '')} e={e} m={m} />)}
      </div>

      {/* Verzahnung (Burggraben Norm ↔ Werkzeug ↔ Entscheid, §4.4): passende
          Werkzeuge (wo vorhanden) + die Rechtsprechung des Grundgerüst-Gebiets. */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-line/70">
        <span className="lc-overline mr-1">Verzahnt</span>
        {werkzeuge.map((c) => (
          <Link key={c.slug} to={`/rechner/${c.slug}`}
            className="lc-chip no-underline hover:text-ink-900">
            {c.titel}
          </Link>
        ))}
        <Link to={`/rechtsprechung?rg=${t.gebiet}`}
          className="lc-chip no-underline hover:text-ink-900">
          Rechtsprechung · {GEBIET_LABEL[t.gebiet]}
        </Link>
      </div>
    </section>
  );
}

// Das Auto-Grundgerüst: der Bund-Korpus nach der vorhandenen `rechtsgebiet`-Achse,
// je Gebiet aufklappbar (Übersicht zuerst, wie die Systematik-Sicht). Deckt
// JEDEN Bund-Erlass — auch die keinem Querschnitts-Thema zugeordneten.
function Grundgeruest({ erlasse }: { erlasse: BrowseErlass[] }) {
  const proGebiet = useMemo(() => {
    const m = new Map<string, BrowseErlass[]>();
    for (const e of erlasse) {
      const arr = m.get(e.rechtsgebiet) ?? [];
      arr.push(e);
      m.set(e.rechtsgebiet, arr);
    }
    for (const arr of m.values()) arr.sort((a, b) => a.rang - b.rang || a.kuerzel.localeCompare(b.kuerzel, 'de'));
    return m;
  }, [erlasse]);
  const [offen, setOffen] = useState<Set<string>>(() => new Set());
  const toggle = (id: string) => setOffen((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  return (
    <div className="space-y-2.5">
      {GEBIETE.map((g) => {
        const items = proGebiet.get(g.id) ?? [];
        if (items.length === 0) return null;
        return (
          <details key={g.id} open={offen.has(g.id)}
            onToggle={(e) => { if ((e.currentTarget as HTMLDetailsElement).open !== offen.has(g.id)) toggle(g.id); }}
            className="group border border-rule-soft">
            <summary className="flex items-baseline gap-3 cursor-pointer select-none px-4 py-3 lc-hover-flaeche after:content-none">
              <span aria-hidden className="text-ink-500 transition-transform group-open:rotate-90">›</span>
              <span className="font-sans font-semibold text-ink-900 text-body-l tracking-tight">{g.label}</span>
              <span className="num text-body-s text-ink-600 ml-auto">{items.length}</span>
            </summary>
            <div className="px-4 pb-4 pt-3 border-t border-rule-soft">
              <ErlassTabelle erlasse={items}
                beschriftung={`${g.label} — Kürzel, Titel, SR-Nummer`} />
            </div>
          </details>
        );
      })}
    </div>
  );
}

// Y-A (§11.8, David 16.7.2026 Auswahl-Dialog: JA): der frühere Landeplatz-
// Einstieg `RechtsgebietEinstieg` (4. Kachel) ist entfernt — die Sicht ist ein
// reiner Gliederungs-Modus im A15-Umschalter; `?ansicht=rechtsgebiet` bleibt
// auflösbarer Alias auf `?gliederung=rechtsgebiet` (IA-5, §11.4 Ziff. 2).

export function RechtsgebietSicht({ erlasse }: { erlasse: BrowseErlass[] }) {
  // Querschnitt = Bund (dort ist rechtsgebiet je Erlass deklariert, §7); Kanton
  // bleibt über die kantonale Systematik erschlossen (§8).
  const bund = useMemo(() => erlasse.filter((e) => e.ebene === 'bund'), [erlasse]);
  const proKey = useMemo(() => new Map(bund.map((e) => [e.key, e])), [bund]);

  // Abdeckung ehrlich beziffern (tolerant, §4.4): wie viele Bund-Erlasse trägt
  // (mind.) ein Querschnitts-Thema — der Rest ist über das Grundgerüst erschlossen.
  const { kategorisiert, gesamt } = useMemo(() => {
    const keys = themaMitgliedKeys();
    const k = bund.filter((e) => keys.has(e.key)).length;
    return { kategorisiert: k, gesamt: bund.length };
  }, [bund]);

  const themen = [...RECHTSGEBIET_THEMEN].sort((a, b) => a.reihenfolge - b.reihenfolge);
  const pk = usePaneKlasse();

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-body-s text-ink-500 max-w-reading">
          Eine zweite Gliederung quer zur amtlichen Systematik: oben die
          kanzleirelevanten Praxisfelder, die mehrere Erlasse zusammenziehen —
          darunter das vollständige Grundgerüst nach Rechtsgebiet. Die
          Querschnitts-Themen sind ein kuratierter <span className="whitespace-nowrap">Entwurf</span> (§8) und
          werden fachlich noch belegt; jeder Erlass ist auch ohne Thema über das
          Grundgerüst erreichbar. Kantonale Erlasse werden über den
          Kantone-Einstieg nach der amtlichen kantonalen Systematik erschlossen.
        </p>
      </div>

      <section className="space-y-3">
        <GruppenKopf stufe={2} titel="Querschnitts-Themen" />
        <div className={pk('grid grid-cols-1 lg:grid-cols-2 gap-4', 'grid grid-cols-1 @3xl/pane:grid-cols-2 gap-4')}>
          {themen.map((t) => <ThemaKarte key={t.id} t={t} proKey={proKey} />)}
        </div>
      </section>

      <section className="space-y-3">
        <GruppenKopf stufe={2} titel="Grundgerüst nach Rechtsgebiet" />
        <p className="text-body-s text-ink-500 max-w-reading">
          Das ganze Bundesrecht nach seiner Sach-Achse — <span className="num">{kategorisiert}</span> von{' '}
          <span className="num">{gesamt}</span> Erlassen sind zusätzlich einem Querschnitts-Thema
          zugeordnet, die übrigen bleiben hier erschlossen.
        </p>
        <Grundgeruest erlasse={bund} />
      </section>
    </div>
  );
}
