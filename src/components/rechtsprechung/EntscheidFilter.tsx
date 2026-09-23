import { useMemo } from 'react';
import type { EntscheidFilterWerte, SortModus } from '../../lib/rechtsprechung/browse';
import { normLabel, filterEntscheide, richterHaeufigkeit, INSTANZ_ORDNUNG } from '../../lib/rechtsprechung/browse';
import type { BrowseEntscheid, RichterRegister } from '../../lib/rechtsprechung/register';
import { RichterFilter } from './RichterFilter';
import { FacettenGruppe } from '../ui/FacettenGruppe';
import { SORT_LABEL } from './zustand';
import { Checkbox } from '../vorlagen/ui';

// Schlanke Steuerleiste der Übersicht /rechtsprechung (ersetzt den schweren
// Filterblock): EINE Toolbar-Zeile (Suche + Sortierung + Dichte) + eine sichtbare
// Facetten-Leiste (Gemeinwesen, Sprache) als Toggle-Chips mit Trefferzahl + ein
// zugeklapptes <details> für die Langläufer (Gericht/Datum/«nur Leitentscheide»)
// + eine Reihe entfernbarer Aktiv-Filter-Chips, damit nichts unsichtbar filtert.
// Das Sachgebiet steuert die Rail (Entdoppelung) — hier kein Sachgebiet-Select.
// Reine Darstellung (§3); Filterung macht filterEntscheide() im Eltern.

const SPRACH_LABEL: Record<string, string> = { de: 'Deutsch', fr: 'Französisch', it: 'Italienisch', rm: 'Rätoromanisch' };

function einzigartig<T>(werte: T[]): T[] {
  return [...new Set(werte)];
}

// Die Facetten-Achse (Auftrag 4/8: Toggle-Chips mit Trefferzahl, R15) lag hier
// als lokale Komponente und war die zweite Kopie derselben Anatomie. Sie liegt
// seit Runde 2 in `components/ui/FacettenGruppe` — dort steht auch ihre
// vollständige Herleitung (LM-040/044/051). Die primären Achsen bleiben sichtbar
// in der Ergebnis-Spalte statt im zugeklappten <details>.

export function EntscheidFilter({
  werte, onChange, bestand, richterRegister, sort, onSort, dichte, onDichte, klappeOffen, onKlappe,
}: {
  werte: EntscheidFilterWerte;
  onChange: (w: EntscheidFilterWerte) => void;
  /** Voller Bestand (vor Filter) — für die Auswahllisten/Zähler. */
  bestand: BrowseEntscheid[];
  /** Slug → Anzeigename der Richter:innen; null solange die Projektion lädt (§8: dann Slug). */
  richterRegister: RichterRegister | null;
  sort: SortModus;
  onSort: (s: SortModus) => void;
  dichte: 'liste' | 'karten';
  onDichte: (d: 'liste' | 'karten') => void;
  /** Klappe «Erweiterte Filter» — Darstellungs-Zustand, gehalten im Eltern (zustand.ts). */
  klappeOffen: boolean;
  onKlappe: (offen: boolean) => void;
}) {
  const setze = (teil: Partial<EntscheidFilterWerte>) => onChange({ ...werte, ...teil });

  const gerichte = einzigartig(bestand.map((e) => JSON.stringify({ id: e.gericht, name: e.gerichtName })))
    .map((s) => JSON.parse(s) as { id: string; name: string })
    .sort((a, b) => a.name.localeCompare(b.name, 'de'));
  // ── LM-069 (B12, 4.9.2026) · ZWEI EINTRÄGE, EINE BESCHRIFTUNG ───────────────
  // GEMESSEN am gebauten Stand (`/rechtsprechung` @1440, «Erweiterte Filter» →
  // «Gericht»): die Liste führte «Bundesgericht (24)» UND «Bundesgericht (1259)»
  // — zwei Werte, an ihrer Beschriftung nicht unterscheidbar. Die Zahlen sind
  // richtig (§8), mehrdeutig ist nur der Name: der Bestand trägt für die
  // Gerichts-IDs `bge` und `bger` denselben `gerichtName`.
  // KEIN Sonderfall auf die IDs — die Unterscheidung wird aus dem BESTAND
  // abgeleitet und steht darum auch dann richtig, wenn morgen zwei andere
  // Gerichte denselben Namen tragen: nachgezählt im Artefakt
  // `public/rechtsprechung/register.json` sind alle 1'259 `bge`-Einträge
  // `leitcharakter: 'leitentscheid'` mit BGE-Fundstelle, alle 24 echten
  // `bger`-Einträge `routine` ohne. Der Zusatz erscheint NUR bei mehrdeutigem
  // Namen und benutzt die Hausformel dieser Datei («Leitentscheid == amtlicher
  // BGE», Häkchen F4 weiter unten), erfindet also keine zweite Wahrheit (§5).
  const nameMehrdeutig = new Set(
    gerichte.map((g) => g.name).filter((n, i, arr) => arr.indexOf(n) !== i),
  );
  const nurLeitentscheide = (id: string) => {
    const echte = bestand.filter((e) => !e.verweis && e.gericht === id);
    return echte.length > 0 && echte.every((e) => e.leitcharakter === 'leitentscheid');
  };
  const gerichtLabel = (g: { id: string; name: string }) =>
    (nameMehrdeutig.has(g.name)
      ? `${g.name} — ${nurLeitentscheide(g.id) ? 'amtliche Sammlung (BGE)' : 'übrige Urteile'}`
      : g.name);
  const kantone = einzigartig(bestand.map((e) => e.kanton)).sort();
  const sprachen = einzigartig(bestand.map((e) => e.sprache)).sort();
  // Verweis-Einträge (vollständige Urteile zu einem BGE) NICHT mitzählen — sonst
  // widerspricht der Dropdown-Zähler dem Ergebnis-Counter (echtAnzahl, !e.verweis),
  // symmetrisch zur hausweiten Verweis-Ausnahme (zaehleSachgebiete/normHaeufigkeit).
  const gerichtN = (id: string) => bestand.filter((e) => !e.verweis && e.gericht === id).length;
  // Cross-gefilterte Facetten-Zähler (konsistent mit der Sachgebiets-Rail, R15): je
  // Achse die Resttreffer-Zahl über den Bestand MIT allen anderen aktiven Filtern, aber
  // OHNE die eigene Achse — so zeigt jeder Chip seine echte Menge, und Null-Optionen
  // werden ausgeblendet (kein Null-Treffer-Klick). Verweis-Einträge nie mitzählen.
  const zaehle = (basis: BrowseEntscheid[], pred: (e: BrowseEntscheid) => boolean) =>
    basis.filter((e) => !e.verweis && pred(e)).length;
  const gwBasis = filterEntscheide(bestand, { ...werte, ebene: null, kanton: null });
  const sprBasis = filterEntscheide(bestand, { ...werte, sprache: null });

  // ── Gemeinwesen-Achse (Auftrag 4): Bund/Kanton + Kanton-Drilldown als sichtbare
  //    Toggle-Chips. Ersetzt das frühere Ebene-Segment UND den Kanton-Select — EINE
  //    kohärente Achse statt zweier konkurrierender Controls. «Bund»/«Kantone» laufen
  //    über die `ebene`-Achse, einzelne Kantone über `kanton`; ein aktiver Chip schaltet
  //    auf «Alle» zurück (Toggle). Instanz (gerichtstyp) ist heute deckungsgleich mit
  //    Bund/Kanton (nur 2 Werte) → erst mit Batch 3 (BVGer/BStGer/BPatGer) eigene Achse.
  const echteKantone = kantone.filter((k) => k !== 'CH');
  const hatKantonal = echteKantone.length > 0;
  const gwAlle = () => setze({ ebene: null, kanton: null });
  const gemeinwesenOpt = [
    { id: 'alle', text: 'Alle', n: zaehle(gwBasis, () => true), aktiv: !werte.ebene && !werte.kanton, waehle: gwAlle },
    { id: 'bund', text: 'Bund', n: zaehle(gwBasis, (e) => e.kanton === 'CH'),
      aktiv: werte.ebene === 'bund',
      waehle: () => (werte.ebene === 'bund' ? gwAlle() : setze({ ebene: 'bund', kanton: null })) },
    ...(hatKantonal ? [
      { id: 'kantone', text: 'Kantone', n: zaehle(gwBasis, (e) => e.kanton !== 'CH'),
        aktiv: werte.ebene === 'kanton',
        waehle: () => (werte.ebene === 'kanton' ? gwAlle() : setze({ ebene: 'kanton', kanton: null })) },
      ...echteKantone.map((k) => ({
        id: k, text: k, n: zaehle(gwBasis, (e) => e.kanton === k), aktiv: werte.kanton === k,
        waehle: () => (werte.kanton === k ? gwAlle() : setze({ kanton: k, ebene: null })),
      })),
    ] : []),
  ].filter((o) => o.id === 'alle' || o.n > 0 || o.aktiv); // Null-Optionen aus (ausser aktiv)

  // ── Instanz-Achse (Batch 3): seit BVGer/BStGer/BPatGer dazu sind, hat der
  //    gerichtstyp >2 reale Werte → eigene Achse mit Mehrwert (vorher deckungs-
  //    gleich mit Bund/Kanton). Feinere Auflösung als «Gemeinwesen»: zeigt die
  //    konkreten eidg. Gerichte einzeln. Toggle + cross-gefilterte Zähler + Null-
  //    Prune wie die anderen Achsen (R15). Chips als Abkürzung (BGer/BVGer/…),
  //    volle Bezeichnung in aria-label/title (F2/F3). Reine Anzeige (§3).
  const instBasis = filterEntscheide(bestand, { ...werte, gerichtstyp: null });
  const vorhandeneInstanzen = INSTANZ_ORDNUNG.filter((i) => bestand.some((e) => !e.verweis && e.gerichtstyp === i.typ));
  const hatMehrereInstanzen = vorhandeneInstanzen.length > 1;
  const instanzOpt = [
    { id: 'alle', text: 'Alle', n: zaehle(instBasis, () => true), aktiv: !werte.gerichtstyp, waehle: () => setze({ gerichtstyp: null }) },
    ...vorhandeneInstanzen.map((i) => ({
      id: i.typ, text: i.kurz, voll: i.label, n: zaehle(instBasis, (e) => e.gerichtstyp === i.typ),
      aktiv: werte.gerichtstyp === i.typ,
      waehle: () => (werte.gerichtstyp === i.typ ? setze({ gerichtstyp: null }) : setze({ gerichtstyp: i.typ })),
    })),
  ].filter((o) => o.id === 'alle' || o.n > 0 || o.aktiv);

  // ── Sprache-Achse (Auftrag 8): seit A2 gibt es echte FR-Entscheide → die Sprache
  //    aus dem vergrabenen <details>-Select in dieselbe Facetten-Leiste hochgezogen
  //    (eine kohärente Leiste, nicht zwei konkurrierende). Toggle + Null-Prune wie oben.
  const hatMehrsprachig = sprachen.length > 1;
  const spracheOpt = [
    { id: 'alle', text: 'Alle', n: zaehle(sprBasis, () => true), aktiv: !werte.sprache, waehle: () => setze({ sprache: null }) },
    ...sprachen.map((s) => ({
      id: s, text: SPRACH_LABEL[s] ?? s, n: zaehle(sprBasis, (e) => e.sprache === s), aktiv: werte.sprache === s,
      waehle: () => (werte.sprache === s ? setze({ sprache: null }) : setze({ sprache: s })),
    })),
  ].filter((o) => o.id === 'alle' || o.n > 0 || o.aktiv);

  // ── Spruchkörper-Achse (R-RICHTER): cross-gefilterte Optionen wie jede andere
  //    Achse (R15) — die Zahl am Namen ist die ECHTE Resttreffer-Zahl im aktuellen
  //    Filterzustand, nicht der Korpus-Wert.
  //    useMemo ist Pflicht (§15.4, React Compiler AUS), hält den Pass aber NUR bei
  //    Re-Renders ohne Filterwechsel (Sortierung/Dichte) zurück — ändert sich `werte`,
  //    wird sehr wohl neu gerechnet, auch je Tastendruck der Freitext-Suche. Das ist
  //    vertretbar und gemessen: voller Bestand (6'341) median 0.9–2.0 ms, p90 4.7 ms
  //    (20.7.2026) — deutlich unter einem 16-ms-Frame, also nicht merklich langsamer.
  const richterOpt = useMemo(
    () => richterHaeufigkeit(filterEntscheide(bestand, { ...werte, richter: null }), richterRegister),
    [bestand, werte, richterRegister],
  );
  const richterName = werte.richter ? richterRegister?.richter[werte.richter]?.name ?? null : null;

  // Aktive Sekundärfilter (ohne Sachgebiet — das zeigt die Rail) als entfernbare Chips.
  const aktiveChips: { key: string; label: string; loesche: () => void }[] = [];
  // Gemeinwesen (kanton/ebene) steht als sichtbare Facetten-Leiste mit Toggle —
  // darum KEIN zusätzlicher Aktiv-Chip dafür (sonst doppelte Repräsentation).
  if (werte.norm) aktiveChips.push({ key: 'norm', label: `Norm: ${normLabel(werte.norm)}`, loesche: () => setze({ norm: null }) });
  if (werte.gericht) aktiveChips.push({ key: 'gericht', label: `Gericht: ${bestand.find((e) => e.gericht === werte.gericht)?.gerichtName ?? werte.gericht}`, loesche: () => setze({ gericht: null }) });
  // F4 (JETZT-MACHEN §5): «nur Leitentscheide» und «nur BGE» wählten exakt dieselbe
  // Menge (am Korpus geprüft 272=272, 0 Divergenz) → zu EINEM sichtbaren Filter
  // zusammengeführt. Semantik trägt `leitcharakter`; der `nurBge`-Prädikat bleibt in
  // browse.ts erhalten (spätere Trennung amtliche-BGE ⟂ Leitentscheid bleibt möglich).
  if (werte.nurLeitentscheide) aktiveChips.push({ key: 'leit', label: 'Nur Leitentscheide (amtliche BGE)', loesche: () => setze({ nurLeitentscheide: false }) });
  // Achsen MIT eigener sichtbarer Darstellung (Facetten-Leiste bzw. Richter-Feld)
  // bekommen hier bewusst keinen zweiten Chip — sie zählen nur mit, damit die
  // «zurücksetzen»-Zeile erscheint. Seit die Facetten in der URL stehen, ist das
  // zwingend: ein geteilter Link kann jede dieser Achsen allein tragen (z. B.
  // `?kanton=BS`), und im Leerzustand verwiese der Text sonst auf ein
  // «zurücksetzen», das gar nicht gerendert wird (Fehlermuster der Gegenprüfung
  // 20.7.2026, damals nur für `?richter=` behoben).
  const facettenAktiv = !!werte.richter || !!werte.ebene || !!werte.kanton
    || !!werte.gerichtstyp || !!werte.sprache;
  if (werte.datumVon) aktiveChips.push({ key: 'von', label: `ab ${werte.datumVon}`, loesche: () => setze({ datumVon: null }) });
  if (werte.datumBis) aktiveChips.push({ key: 'bis', label: `bis ${werte.datumBis}`, loesche: () => setze({ datumBis: null }) });
  const suchAktiv = !!werte.q?.trim();
  // Beim Zurücksetzen das Sachgebiet (Rail/URL) bewahren — nur Sekundärfilter+Suche leeren.
  const zuruecksetzen = () => onChange({ sachgebiet: werte.sachgebiet ?? null });

  // D22-Anatomie: Text-Schalter mit Registerstrich statt Kasten-Segment.
  const dichteBtn = (d: 'liste' | 'karten', label: string) => (
    <button type="button" onClick={() => onDichte(d)} aria-pressed={dichte === d} className="ub-schalter">
      {label}
    </button>
  );

  return (
    <div className="space-y-2.5">
      {/* ── D22 Ziff. 2 (Nachzug D24, 6.9.2026) · EIN FILTERFELD, VOLLE BREITE ─
          /gesetze, /materialien und /rechner tragen diese Anatomie seit R12A;
          /rechtsprechung und /vorlagen standen noch aussen vor (R12A §4: «beide
          ausserhalb der Whitelist dieses Auftrags»). Hier stand das Feld in
          einer `flex-wrap`-Toolbar, die es sich mit Sortierung und Ansichts-
          Umschalter teilte — es bekam den Rest der Zeile, und die beiden
          Nachbarn standen als Kästen daneben.
          Neu: Label «Filtern» über dem Feld (`.ub-filter`), Feld über die volle
          Inhaltsbreite, Umfang in der Fuss-Zeile (`aria-describedby`), und die
          Ansichts-Wahl als Text-Schalter (`.ub-schalter`) statt als
          Kasten-Gruppe. Die SORTIERUNG bleibt ein <select>: sie führt fünf
          Optionen, und fünf Text-Schalter wären genau die Kasten-Wand, die D22
          abräumt (dieselbe Begründung wie bei den Materialien-Facetten).
          Der sichtbare Text IST der zugängliche Name (WCAG 2.5.3) — das frühere
          `aria-label` («Rechtsprechung durchsuchen») sagte etwas anderes als
          das, was auf dem Bild steht. */}
      <div className="ub-filter">
        <label htmlFor="rechtsprechung-filter" className="lc-overline">Filtern</label>
        <input
          id="rechtsprechung-filter"
          type="search"
          value={werte.q ?? ''}
          onChange={(e) => setze({ q: e.target.value })}
          placeholder="Thema, Aktenzeichen, Norm, Gericht …"
          aria-describedby="rechtsprechung-filter-scope"
          className="lc-input h-11 py-0 text-body-s w-full"
        />
        <p id="rechtsprechung-filter-scope" className="ub-filter-fuss min-h-5">
          <span>Thema, Aktenzeichen, Norm und Gericht dieser Auswahl · Gesetzestext über die Suche oben</span>
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-2">
          <label className="flex items-center gap-2 text-body-s text-ink-600">
            <span>Sortierung</span>
            {/* min-w: sonst wird der Select gestaucht und das längste Label
                («Leitentscheide zuerst») abgeschnitten. */}
            <select className="lc-select lc-input-sm w-auto min-w-[13.75rem]" value={sort} onChange={(e) => onSort(e.target.value as SortModus)}
              aria-label="Sortierung">
              {(Object.keys(SORT_LABEL) as SortModus[]).map((s) => <option key={s} value={s}>{SORT_LABEL[s]}</option>)}
            </select>
          </label>
          <div className="flex items-center gap-x-4" role="group" aria-label="Ansicht">
            {dichteBtn('liste', 'Liste')}
            {dichteBtn('karten', 'Karten')}
          </div>
        </div>
      </div>

      {/* Facetten-Leiste — die primären Achsen sichtbar (Auftrag 4 «Gemeinwesen»,
          Auftrag 8 «Sprache»), statt im <details> vergraben. Trefferzahl je Chip (R15). */}
      {/* register="r": Registerfarbe «Rechtsprechung» am gewählten Text-Schalter
          (D24-Nachzug, `ui/FacettenGruppe`) — dieselbe Marke wie die Seitenleiste
          für diese Domäne führt. */}
      {hatKantonal && gemeinwesenOpt.length > 1 && <FacettenGruppe label="Gemeinwesen" optionen={gemeinwesenOpt} register="r" />}
      {hatMehrereInstanzen && instanzOpt.length > 1 && <FacettenGruppe label="Instanz" optionen={instanzOpt} register="r" />}
      {hatMehrsprachig && spracheOpt.length > 1 && <FacettenGruppe label="Sprache" optionen={spracheOpt} register="r" />}
      {/* Spruchkörper: Autocomplete statt Chip-Leiste (~180 Namen, s. RichterFilter).
          Die Achse erscheint nur, wenn der Ausschnitt überhaupt erfasste Besetzungen
          trägt — ein leeres Suchfeld über nichts wäre eine Fehlversprechung (§8).
          Der Aktiv-Chip lebt in der Komponente selbst (wie «Gemeinwesen» kein
          zusätzlicher Chip unten — sonst doppelte Repräsentation). */}
      {(richterOpt.length > 0 || werte.richter) && (
        <RichterFilter
          aktiv={werte.richter ?? null}
          aktivName={richterName}
          registerGeladen={!!richterRegister}
          optionen={richterOpt}
          onWaehle={(slug) => setze({ richter: slug })}
        />
      )}

      {/* Sekundärfilter — standardmässig zu (Inhalt steht oben, nicht der Filter).
          Ob sie offen bleibt, ist ein Darstellungs-Zustand und überlebt darum das
          Neuladen wie Dichte und Sortierung (LM-206: keine stille Teil-Wieder-
          herstellung mehr). Gesteuert, nicht `defaultOpen`: sonst liefe der
          gespeicherte Wert dem DOM-Zustand hinterher. */}
      {/* K3: Haarlinien-Rahmen, Beschriftung in Tinte statt Messing. */}
      <details className="border border-rule-soft px-4 py-2.5" open={klappeOffen}
        onToggle={(e) => onKlappe((e.currentTarget as HTMLDetailsElement).open)}>
        <summary className="cursor-pointer select-none text-body-s font-medium text-ink-700 hover:text-ink-900">Erweiterte Filter</summary>
        {/* Kanton/Bund («Gemeinwesen») und Sprache stehen jetzt als Facetten-Leiste
            oben — hier nur die Langläufer (Gericht, Datum). */}
        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {gerichte.length > 1 && (
            <label className="flex flex-col gap-1 text-xs text-ink-500">
              <span>Gericht</span>
              <select className="lc-input h-9 py-0 text-body-s" value={werte.gericht ?? ''}
                onChange={(e) => setze({ gericht: e.target.value || null })}>
                <option value="">Alle</option>
                {gerichte.map((g) => <option key={g.id} value={g.id}>{gerichtLabel(g)} ({gerichtN(g.id)})</option>)}
              </select>
            </label>
          )}
          {/* R2-E/F1-1-AUSNAHME (R3-α, 31.8.2026): Filter, kein fristauslösendes Feld.
              F1-1 verbietet `type="date"` dort, wo der Wert ein fristauslösendes
              Ereignis trägt — auf einem us-englischen Profil steht dann MM/DD/YYYY
              an einem Datum, an dem eine Frist hängt. Diese zwei Felder grenzen
              eine TREFFERLISTE ein: kein Wert erreicht eine Engine, ein Vertippen
              zeigt eine andere Liste und sonst nichts. Dazu passt das Haus-
              `DatumsFeld` hier nicht: es bringt Kalender-Popover und `pr-11`-
              Reserve mit, die Filterzeile ist `h-9 py-0`. */}
          <label className="flex flex-col gap-1 text-xs text-ink-500">
            <span>Entscheid ab</span>
            <input type="date" lang="de-CH" className="lc-input h-9 py-0 text-body-s"
              value={werte.datumVon ?? ''} onChange={(e) => setze({ datumVon: e.target.value || null })} />
          </label>
          <label className="flex flex-col gap-1 text-xs text-ink-500">
            <span>Entscheid bis</span>
            <input type="date" lang="de-CH" className="lc-input h-9 py-0 text-body-s"
              value={werte.datumBis ?? ''} onChange={(e) => setze({ datumBis: e.target.value || null })} />
          </label>
          {/* F4: EIN zusammengeführter Filter (Leitentscheid == amtlicher BGE, deckungs-
              gleiche Menge) statt zweier redundanter Häkchen. */}
          {/* ── LM-076 (B12, 4.9.2026) · DAS KÄSTCHEN WAR NICHT QUADRATISCH ───────────
              GEMESSEN am gebauten Stand (`/rechtsprechung` @1440): 13.6 × 17.6 px —
              der Befund hatte 13 × 15.8 px gesehen, der Defekt ist derselbe.
              Die `h-4 w-4` standen längst da; sie trugen nur nicht: als Flex-Kind
              OHNE `shrink-0` wurde die BREITE vom Umbruch der zweizeiligen
              Beschriftung zusammengedrückt (17.6 → 13.6 px), die Höhe blieb. Darum
              `shrink-0` statt einer grösseren Zahl — die Wurzel ist das Schrumpfen,
              nicht das Mass; die Rüge «Browser-Standard» traf nicht zu (`accent-
              brass-600` färbt es seit je ein).
              NICHT geändert, weil am gebauten Stand nicht reproduzierbar: «das
              Kästchen sitzt an der ersten [Zeile]». Gemessen sitzt es MITTIG zur
              zweizeiligen Beschriftung (Oberkante 12.2 px in einem 46 px hohen
              Label), und `self-end pb-1` setzt es bewusst auf die Höhe der
              Eingabefelder der Nachbarspalten, die über sich noch eine Kopfzeile
              tragen — diese Ausrichtung wird nicht gekippt (§0.2).
              NICHT gebaut: die 24-px-Zielfläche aus WCAG 2.5.8 — sie sprengte die
              36-px-Filterzeile; bedienbar ist ohnehin das ganze <label> (46 px). */}
          <Checkbox
            checked={!!werte.nurLeitentscheide}
            onChange={(v) => setze({ nurLeitentscheide: v })}
            label="Nur Leitentscheide (amtliche BGE)"
            className="self-end pb-1"
          />
        </div>
      </details>

      {/* Aktiv-Filter-Chips (immer sichtbar, auch bei zugeklapptem Disclosure). */}
      {/* lc-chip-zeile (LM-044/N1): Chip-Grammatik — die entfernbaren Filter sind
          <button>, bekommen also den geschlossenen Hairline-Rahmen und sehen damit
          gleich aus wie die Facetten-Knöpfe darüber und die Norm-Chips der Karten. */}
      {(aktiveChips.length > 0 || suchAktiv || facettenAktiv) && (
        <div className="lc-chip-zeile flex flex-wrap items-center gap-1.5">
          {aktiveChips.map((c) => (
            <button key={c.key} type="button" onClick={c.loesche}
              className="lc-chip inline-flex items-center gap-1 border-l-reg-r hover:text-ink-900"
              title="Filter entfernen">
              {c.label}<span aria-hidden>×</span>
            </button>
          ))}
          {/* LM-086 (W2·17-UI-BEFUNDE B10, 4.9.2026). Die ERSTE Hälfte des
              Befunds ist überholt: dass die Zeile nur bei gesetzter
              Richter-Auswahl erschien, hat `facettenAktiv` oben behoben —
              nachgemessen an `?kanton=BS` und `?sprache=de`, beide zeigen die
              Zeile. Die ZWEITE Hälfte war offen: der Knopf mass 76×17 px, ohne
              Fläche und ohne Rahmen, in derselben Farbe wie ein Fliesstext-Link
              — also unter der AA-Untergrenze (WCAG 2.5.8, 24 px) und ohne
              Knopf-Anmutung. `.lc-btn-mini` gibt ihm Fläche, Haarlinie und
              `--tap-ziel` als Mindesthöhe, ohne die Chip-Zeile zu sprengen;
              die leise Stimme (text-xs, Messing) bleibt. */}
          <button type="button" onClick={zuruecksetzen}
            className="lc-btn-mini text-xs font-medium text-ink-700 hover:border-line-strong hover:bg-well hover:text-ink-900">
            zurücksetzen
          </button>
        </div>
      )}
    </div>
  );
}
