import { Link } from 'react-router-dom';
import type { ArtikelKontextAnsicht } from '../../lib/kontext';
import { revisionDetailText } from '../../lib/verzahnung/artikel-revisionen';
import { richText, ohneMarkup } from '../../pages/gesetz-leser/helpers';

// ─── S7 · Artikel-Kontext «Zu Art. X» (W2·19-GLIEDERUNG, Bau-Spec §5.2) ──────
//
// Der WEGWEISER zur Leseposition im Gesetzes-Leser: vier Rollen — Praxis,
// ausgehende Verweise, letzte Textänderung, Werkzeuge. Reiner Renderer (§3): die
// Ansicht baut der Leser (`src/pages/gesetz-leser/artikelKontext.ts`), hier wird
// nur gezeigt. Das DETAIL bleibt, wo es schon steht (Artikelfuss, Werkzeug-
// Gruppe weiter unten im Panel) — diese Zeile springt dorthin, statt dieselbe
// Liste ein zweites Mal zu führen (§5 SSoT).
//
// Eigene Datei, weil `KontextPanel.tsx` mit diesem Block über die
// 800-Zeilen-Schwelle des §6.6-Tors `check:schlankheit` lief.
//
// §15.2 — die tragende Regel dieser Datei: KEINE bedingte Zeilenzahl. Der
// Inhalt wechselt beim SCROLLEN, also ohne Nutzer-Input, also CLS-pflichtig.
// Jede Rolle sagt darum entweder ihre Zahl oder ehrlich, dass nichts erfasst
// ist (§8). Sind ALLE vier leer — der Normalfall bei den ~88 % Kantonserlassen
// ohne Verzahnung —, steht EIN Satz statt vier Verneinungen; die Höhe hält
// dann `lc-artikelkontext` am Eltern-Element, nicht die Zeilenzahl.
// Beweis: e2e/leser-kontext-e4.e2e.ts, Prüfschritt «S7» (Höhe konstant über
// vier gelesene Artikel + CLS 0 im Kontextfenster).

export function ArtikelKontextZeilen({ k, werkzeugZielBereit = true }: {
  k: ArtikelKontextAnsicht;
  /**
   * Steht die Werkzeug-Gruppe, auf die der Sprung zielt, schon im DOM?
   *
   * CI-Befund 9.8.2026 (PR #479, Shard 7/8): der Wegweiser rendert seit dem
   * Produkt-Fix VOR dem Lade-Gating der Querverweis-Gruppen — sein Sprungziel
   * `#kontext-werkzeuge` entsteht aber erst MIT ihnen. Ohne diese Prop böte die
   * Zeile in genau dem Fenster einen Knopf an, dessen Ziel es nicht gibt: ein
   * toter Knopf (§13/F4), und dieselbe Klasse Versprechen-ins-Leere, die der
   * Bug-Check als B4 gerügt hat.
   * Der Text der Zeile bleibt in beiden Zuständen einzeilig — die Höhe des
   * Blocks ändert sich also nicht (§15.2).
   */
  werkzeugZielBereit?: boolean;
}) {
  // ── B5 (Bug-Check 9.8.2026): «lädt» ist nicht «nichts» ─────────────────────
  // `undefined` heisst laut `lib/kontext.ts` ausdrücklich «Shard nicht geladen»,
  // `0` heisst «nichts erfasst». Beides fiel hier zusammen, und weil das
  // Lade-Gating des Panels (`laedtNoch`) die zwei S7-Shards gar nicht kennt —
  // und die Lesespalten-Variante überhaupt kein Gating hat —, stand nach JEDEM
  // Erlasswechsel für gut eine Sekunde eine falsche Negativaussage da. §8: was
  // wir noch nicht wissen, behaupten wir nicht.
  const laedt = k.leitentscheide === undefined || k.materialien === undefined;
  const praxis: string[] = [];
  // B7 (Bug-Check): der Shard führt Leitentscheide UND Routine-Entscheide; die
  // frühere Beschriftung «N Leitentscheide» war für 49 Artikel falsch (12 davon
  // ohne einen einzigen echten Leitentscheid). Der Wortlaut folgt jetzt dem, was
  // gezählt wird — und deckt sich mit der Formel des Panels weiter unten
  // («n erfasste Entscheide», §5 eine Sprache).
  if (k.leitentscheide) praxis.push(`${k.leitentscheide} erfasste${k.leitentscheide === 1 ? 'r' : ''} Entscheid${k.leitentscheide === 1 ? '' : 'e'}`);
  if (k.materialien) praxis.push(`${k.materialien} Material${k.materialien === 1 ? '' : 'ien'}`);
  const alleLeer = !laedt && praxis.length === 0 && k.verweise.length === 0
    && !k.revision && !k.werkzeugGruppe;
  if (alleLeer) {
    return <p className="truncate">Kein artikelbezogener Kontext erfasst.</p>;
  }
  return (
    <>
      {/* Praxis — die ZAHL hier, die Liste am Artikelfuss (§5).
          B4 (Entscheid 9.8.2026, delegierte Technik): die Zeile trägt BEWUSST
          keine Sprung-Affordanz mehr. Der frühere «→»-Knopf sprang über
          `springeZuArtikel` an den Artikel-ANFANG, während die Praxis-Liste am
          Artikelfuss steht — und im Default-Facettenzustand rendert dort seit
          W2·7-BEZUG/B4 gar keine Liste. Ein Knopf, der ein Ziel verspricht, das
          im Regelfall leer ist, ist ein Versprechen ins Leere (§8); eine reine
          Zahl ist die ehrliche Auskunft.
          WIEDERKOMMEN DARF ER, sobald ein Fuss-Ziel real Inhalt zeigt: dann
          `onSprung` in `ArtikelKontextAnsicht` reaktivieren (dort dokumentiert)
          und auf den Fuss-Anker statt den Artikel-Anfang zielen. */}
      <p className="truncate">
        <span className="text-ink-500">Praxis: </span>
        {laedt ? 'wird geladen …' : praxis.length === 0 ? 'keine erfasst' : praxis.join(' · ')}
      </p>
      {/* Ausgehende Verweise — laut Jury-Richter «jurist» der wertvollste
          Einzel-Handgriff: von der Verordnungsbestimmung ins Trägergesetz, von
          der Fussnote in den zitierten Erlass. Intern verlinkt NUR, wo wir den
          Erlass wirklich halten; sonst der amtliche Link (§8, kein toter Pfad).
          B2 (Bug-Check): die amtlichen Labels tragen Auszeichnung («SR
          <b>281.1</b>» — 100 % der rs-Fussnoten im Bund-Korpus). Als Text-Kind
          rendert React sie ESCAPED, der Nutzer las also die Tags. `richText`
          (§5, dieselbe Auflösung wie der Fussnoten-Fliesstext) macht daraus
          wieder Auszeichnung; das `title`-Attribut kann kein Markup und bekommt
          darum die tag-freie Fassung. */}
      <p className="truncate" title={k.verweise.map((v) => ohneMarkup(v.label)).join(' · ')}>
        <span className="text-ink-500">Verweist auf: </span>
        {k.verweise.length === 0 ? 'kein Erlassverweis erfasst' : k.verweise.map((v, i) => (
          <span key={v.label}>
            {i > 0 && <span aria-hidden className="text-ink-300"> · </span>}
            {v.pfad
              ? <Link to={v.pfad} className="lc-link text-brass-700 hover:text-brass-800">{richText(v.label, `vw${i}`)}</Link>
              : v.url
                ? <a href={v.url} target="_blank" rel="noopener noreferrer" className="lc-link text-brass-700 hover:text-brass-800">{richText(v.label, `vw${i}`)} ↗</a>
                : richText(v.label, `vw${i}`)}
          </span>
        ))}
      </p>
      {/* Letzte Textänderung. Drei unterscheidbare Zustände (§8): belegt ·
          Urfassung (`null`) · gar nicht erfasst (`undefined`, Shard fehlt oder
          lädt). Der Wortlaut kommt aus `revisionDetailText` (§5, dieselbe Formel
          wie das «revidiert»-Badge); das führende «in Kraft seit» entfällt, weil
          das Rollen-Label es schon sagt. */}
      <p className="truncate">
        <span className="text-ink-500">Letzte Änderung: </span>
        {k.revision
          ? revisionDetailText(k.revision).replace(/^in Kraft seit /, '')
          : k.revision === null ? 'keine belegt (Urfassung)' : 'nicht erfasst'}
      </p>
      {/* Werkzeuge: SPRUNG zur bestehenden Gruppe weiter unten im selben Panel
          (Promotion), nie eine zweite Werkzeugliste — die eine Liste bleibt die
          eine (§5).
          B1 (Bug-Check 9.8.2026): hier stand ein NACKTES `<a href="#kontext-
          werkzeuge">`. Das wirkte dreifach schädlich: (a) jeder Klick pushte
          browsernativ einen Verlaufseintrag — exakt das als LM-209 behobene
          Muster; (b) der Fragment-Wechsel überschrieb den `#art-…`-Deeplink, den
          LM-202 als teilbare Adresse schützt; (c) im Split-View löst der Browser
          das Fragment DOKUMENTWEIT auf und sprang damit ins falsche Pane — der
          frühere Eindeutigkeits-Kommentar berief sich auf a32, und a32 ist eine
          Pro-Leser-, keine Dokument-Invariante.
          Darum ein `<button>`: keine Adresse, kein Verlauf, kein dokumentweites
          Fragment. Das Ziel wird PANE-LOKAL über den umschliessenden
          Panel-Abschnitt gesucht — dieselbe Instanz, in der der Knopf steht,
          und sonst gar keine (§8: lieber nicht springen als falsch springen). */}
      <p className="truncate">
        <span className="text-ink-500">Werkzeuge: </span>
        {!k.werkzeugGruppe ? 'keines zu diesem Artikel'
          : werkzeugZielBereit ? (
            <button type="button"
              onClick={(e) => {
                const panel = e.currentTarget.closest('section[aria-labelledby="kontext-titel"]');
                panel?.querySelector('#kontext-werkzeuge')?.scrollIntoView({ block: 'start', behavior: 'auto' });
              }}
              className="text-brass-700 hover:underline">
              Rechner/Vorlagen zu {k.werkzeugGruppe} ↓
            </button>
          )
          // Ziel noch nicht im DOM: die Auskunft steht, die Affordanz nicht.
          : <>Rechner/Vorlagen zu {k.werkzeugGruppe}</>}
      </p>
    </>
  );
}
