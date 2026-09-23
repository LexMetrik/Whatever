// ─── Gliederungs-Umschalter + Relevanz-/Rechtsgebiet-Sichten der Übersichten ──
//    (A14 + A15, W2·5d) ──────────────────────────────────────────────────────
//
// REINE DARSTELLUNG (§3): drei austauschbare Ordnungen je Säule (Bund / Kantone /
// International). «Systematisch» (amtliche Systematik) und «Rechtsgebiet» (G6-
// Grundgerüst) bestehen bereits im Gesetze-Orchestrator; DIESE Datei liefert die
// NEUE «Relevanz»-Ordnung (A14/A15) + die für den Rechtsgebiet-Modus je Säule
// nötigen Gruppierungen (Kanton nach `rechtsgebiet`, International nach SR-0.*-
// Sachklasse) + den gemeinsamen Umschalter. Kriterium/Beleg: relevanz.ts.

import type { BrowseErlass } from '../../lib/normtext/browse-typen';
import { GEBIETE } from '../../lib/normtext/register';
import type { KantonSystematik } from '../../lib/normtext/systematik';
import {
  nachRelevanz, nachKantonRelevanz, SR0_KLASSEN, intlSachziffer,
} from '../../lib/normtext/relevanz';
import { GLIEDERUNGEN, type Gliederung } from '../../lib/normtext/gliederung';
import { ErlassTabelle } from './ErlassKarte';
import { GruppenKopf } from '../ui/GruppenKopf';
import { Leerzustand } from '../ui/Leerzustand';

// ── Der gemeinsame Umschalter (ein Interaktions-Vokabular, A15/A4) ────────────

// D24 (David 6.9.2026, Sprach-Diät): der dreizeilige Erklärabsatz über der
// Kanton-Relevanz-Liste ist entfallen. Was er sagte, sagt jetzt der Reiter
// selbst — als `title` am Schalter, dort wo die Frage «was ordnet das?»
// entsteht, statt als Fliesstext über der Liste (D24: «als Tooltip am Reiter
// ‹Relevanz› oder weg»). Die §8-Vorbehalte der beiden anderen Sichten
// (kantonale Sach-Achse meist Default, EU-Recht ohne SR-Nummer) bleiben als
// sichtbarer Text stehen: sie berichten eine Lücke, das ist keine Erklärung,
// die man wegkürzt.
const GLIEDERUNG_HINWEIS: Record<Gliederung, string> = {
  relevanz: 'Die Kern-Erlasse zuerst — Verfassung, Einführungs- und Organisationsgesetze, Steuer- und Gebührenrecht; danach die amtliche Ordnung.',
  systematisch: 'Die amtliche Systematik der Sammlung.',
  rechtsgebiet: 'Nach Rechtsgebiet gruppiert (Sach-Achse des Registers).',
};

/** Gruppe gedrückter TEXT-Schalter (`.ub-schalter`, D22 «keine Kästen»):
 *  `role=group` + `aria-pressed` (F3/F4). EIN Bild für Ebene, Gliederung,
 *  Karte/Liste und Sortierung auf /gesetze (K2, vorher drei Pill-Kopien mit
 *  Messing-Fläche). `etikett` = sichtbare Beschriftung vor den Optionen. */
export function SchalterGruppe<T extends string | null>({ name, etikett, optionen, wert, onWahl, className }: {
  name: string; etikett?: string;
  optionen: readonly { id: T; label: string; title?: string }[];
  wert: T; onWahl: (id: T) => void; className?: string;
}) {
  return (
    <div role="group" aria-label={name} className={`flex flex-wrap items-baseline gap-x-5 gap-y-1${className ? ` ${className}` : ''}`}>
      {/* LM-055 (B15, 4.9.2026): das Etikett darf sich nicht als weitere Option
          lesen — eigene Stimme (Overline) und ein Schritt mehr Abstand. */}
      {etikett && <span className="lc-overline mr-1">{etikett}</span>}
      {optionen.map((o) => (
        <button key={o.id ?? 'alle'} type="button" className="ub-schalter" aria-pressed={wert === o.id}
          title={o.title} onClick={() => onWahl(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** 3-Wege-Umschalter Relevanz · Systematisch · Rechtsgebiet — gilt für alle
 *  drei Säulen gleich (A15). */
export function GliederungUmschalter({ wert, onWahl }: {
  wert: Gliederung; onWahl: (g: Gliederung) => void;
}) {
  return (
    <SchalterGruppe name="Gliederung" etikett="Gliederung" wert={wert} onWahl={onWahl}
      optionen={GLIEDERUNGEN.map((g) => ({ id: g.id, label: g.label, title: GLIEDERUNG_HINWEIS[g.id] }))} />
  );
}

// ── Relevanz-Sichten ─────────────────────────────────────────────────────────

function RelevanzHinweis({ children }: { children: React.ReactNode }) {
  return <p className="text-body-s text-ink-500 max-w-reading">{children}</p>;
}

/** Bund/International: flaches Karten-Gitter nach kuratiertem Leitgesetz-Rang
 *  (relevanz.ts). Die relevantesten Erlasse zuerst (A15). */
export function RelevanzGitter({ erlasse }: { erlasse: BrowseErlass[] }) {
  const sortiert = nachRelevanz(erlasse);
  if (sortiert.length === 0) return <Leerzustand art="bestand" text="Kein Erlass gefunden." />;
  return (
    <div className="space-y-4">
      <RelevanzHinweis>
        Die relevantesten Erlasse zuerst — nach dem kuratierten Leitgesetz-Rang des
        Registers (Verfassung und Kern-Kodifikationen zuoberst), dann nach Sach-Achse.
        Für die amtliche Ordnung «Systematisch» wählen.
      </RelevanzHinweis>
      <ErlassTabelle erlasse={sortiert} voll beschriftung="Erlasse nach Relevanz — Kürzel, Titel, Angaben" />
    </div>
  );
}

/** Kanton: flache, überlaufsichere Liste nach Kern-Erlass-Kategorie, dann
 *  Systematik (A14). Kern-Erlasse (Verfassung / EG / GOG / Steuer) zuerst. */
export function KantonRelevanzListe({ erlasse, sys }: {
  erlasse: BrowseErlass[]; sys?: KantonSystematik;
}) {
  const sortiert = nachKantonRelevanz(erlasse, sys);
  if (sortiert.length === 0) return <Leerzustand art="bestand" text="Kein Erlass gefunden." />;
  // D24: EIN Raster über beide Spalten (s. `ui/ListenTabelle`); der frühere
  // Erklärabsatz steht als `title` am Reiter «Relevanz» (GLIEDERUNG_HINWEIS).
  return (
    <ErlassTabelle
      erlasse={sortiert}
      beschriftung="Erlasse nach Relevanz — Nummer, Titel, Umfang"
    />
  );
}

// ── Rechtsgebiet-Modus je Säule (die G6-Achse in den anderen Säulen) ──────────

/** Kanton: die Erlasse eines Kantons nach der Register-Sach-Achse `rechtsgebiet`
 *  (A15 «Rechtsgebiet» in der Kanton-Säule). Ehrlich (§8): kantonale Erlasse
 *  tragen das Rechtsgebiet meist als Default ('öffentlich') — die feinere
 *  amtliche Ordnung liefert «Systematisch». */
export function KantonGebietGruppen({ erlasse }: { erlasse: BrowseErlass[] }) {
  const proGebiet = new Map<string, BrowseErlass[]>();
  for (const e of erlasse) {
    const arr = proGebiet.get(e.rechtsgebiet) ?? [];
    arr.push(e);
    proGebiet.set(e.rechtsgebiet, arr);
  }
  const gruppen = GEBIETE
    .map((g) => ({ ...g, items: (proGebiet.get(g.id) ?? []).sort((a, b) => a.titel.localeCompare(b.titel, 'de')) }))
    .filter((g) => g.items.length > 0);
  if (gruppen.length === 0) return <Leerzustand art="bestand" text="Kein Erlass gefunden." />;
  return (
    <div className="space-y-6">
      <RelevanzHinweis>
        Nach Rechtsgebiet gruppiert. Kantonale Erlasse tragen die Sach-Achse meist
        als Default — die feinere amtliche Ordnung liefert «Systematisch».
      </RelevanzHinweis>
      {gruppen.map((g) => (
        <section key={g.id} className="space-y-2.5">
          {/* C-2 (31.8.2026): Anatomie und Haarlinie liegen jetzt im
              geteilten `GruppenKopf` — mitsamt dem DESIGN-D0-Befund
              (unsuffixiertes `bg-line`, weil Tailwinds Deckkraft-Suffix auf
              dem color-mix-Token `--line` keine CSS-Regel erzeugt). */}
          <GruppenKopf titel={g.label} zahl={g.items.length} />
          <ErlassTabelle erlasse={g.items}
            beschriftung={`${g.label} — Nummer, Titel, Umfang`} />
        </section>
      ))}
    </div>
  );
}

/** International: nach SR-0.*-Sachklasse gruppiert (A15 «Rechtsgebiet» in der
 *  International-Säule) — die amtliche Völkerrechts-Sachachse (Fedlex SR 0.1–0.9);
 *  EU-Verordnungen ohne SR-Nummer bilden ehrlich eine eigene Gruppe (§8). */
export function IntlRechtsgebietSicht({ erlasse }: { erlasse: BrowseErlass[] }) {
  const proZiffer = new Map<string, BrowseErlass[]>();
  const euRecht: BrowseErlass[] = [];
  for (const e of erlasse) {
    const z = intlSachziffer(e.sr);
    if (z == null) { euRecht.push(e); continue; }
    const arr = proZiffer.get(z) ?? [];
    arr.push(e);
    proZiffer.set(z, arr);
  }
  const gruppen = SR0_KLASSEN
    .map((k) => ({ ...k, items: (proZiffer.get(k.ziffer) ?? []).sort((a, b) => (a.sr ?? '').localeCompare(b.sr ?? '', 'de', { numeric: true })) }))
    .filter((k) => k.items.length > 0);
  if (gruppen.length === 0 && euRecht.length === 0) {
    return <Leerzustand art="bestand" text="Kein Eintrag gefunden." />;
  }
  return (
    <div className="space-y-10">
      <RelevanzHinweis>
        Nach der amtlichen Völkerrechts-Sachachse der Systematischen Rechtssammlung
        (SR 0.1–0.9); EU-Verordnungen ohne SR-Nummer bilden eine eigene Gruppe.
      </RelevanzHinweis>
      {gruppen.map((g) => (
        <section key={g.ziffer} className="space-y-3">
          <GruppenKopf stufe={2} titel={g.label} zahl={g.items.length}
            marke={<span aria-hidden className="num font-display text-h3 leading-none text-reg-g">0.{g.ziffer}</span>} />
          <ErlassTabelle erlasse={g.items} voll beschriftung={`${g.label} — Kürzel, Titel, Angaben`} />
        </section>
      ))}
      {euRecht.length > 0 && (
        <section className="space-y-3">
          <GruppenKopf stufe={2} titel="EU-Recht (EUR-Lex)" zahl={euRecht.length} />
          <ErlassTabelle erlasse={euRecht} voll beschriftung="EU-Recht — Kürzel, Titel, Angaben" />
        </section>
      )}
    </div>
  );
}
