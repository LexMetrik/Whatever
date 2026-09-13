import { useRef, useState } from 'react';
import { SchliessKnopf } from '../ui/SchliessKnopf';
import { ordneTabsUm, tabSchluessel, type TabEintrag, reiterKurzformText, reiterTitel } from '../../lib/tabs';
import { type VerlaufManifeste } from '../../lib/verlaufLabel';
import {
  reiterKategorie, herkunftVon, artikelLabelVonPfad, gleicheReiterGruppe,
  KAT_META, KAT_ORDER, HERKUNFT_ORDER, HERKUNFT_LABEL,
  type Herkunft,
} from '../../lib/tabGruppen';
import { RegisterMarke } from '../suche/RegisterMarke';

// ─── Vertikales Reiter-Panel (Auftrag David 26.6.2026, P3) ──────────────────
//
// ALLE offenen Reiter UNTEREINANDER, nach Rubrik gruppiert und auf-/zuklappbar
// (Akkordeon). Top-Gruppen = Kategorie (Gesetze, Rechtsprechung, Vorlagen,
// Rechner, Weitere) in fester Reihenfolge; die Gesetze-Gruppe gliedert sich
// darunter nach HERKUNFT (Bund → Kanton → International) — «geht nochmals auf».
// Jede Gesetz-Zeile dreispaltig: Herkunft-Icon · Name/Abkürzung · aktueller
// Artikel. Reine Darstellung/Navigation (§3): die Reiter-Liste lebt in
// lib/tabs.ts, die Gruppierung in lib/tabGruppen.ts (SSoT §5).

export function TabPanel({ tabs, manifeste, aktivSchluessel, onNavigate, onSchliessen, onDaneben, paneOffen }: {
  tabs: TabEintrag[];
  manifeste: VerlaufManifeste;
  aktivSchluessel: string;
  onNavigate: (path: string) => void;
  onSchliessen: (path: string) => void;
  /** Split-View: Reiter NEBEN dem aktuellen Inhalt öffnen (nur ab lg + Kapazität). */
  onDaneben?: (path: string) => void;
  /** true, wenn der Pfad bereits offen ist → ⧉ ausblenden (kein Doppel). */
  paneOffen?: (path: string) => boolean;
}) {
  // Eingeklappte Gruppen-IDs (Default: alles offen → der Nutzer sieht direkt
  // alle Reiter; «geht nochmals auf»). Klick auf den Kopf klappt zu/auf.
  const [zu, setZu] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setZu((o) => ({ ...o, [id]: !o[id] }));
  const offen = (id: string) => !zu[id];

  // Drag&Drop-Umsortieren (#F): gezogener Pfad in einer Ref (überlebt Re-Render
  // während des Ziehens), der gerade überfahrene Pfad als Drop-Indikator im State.
  const gezogenRef = useRef<string | null>(null);
  const [ueberPath, setUeberPath] = useState<string | null>(null);

  // ── W2·25 · DIE ANGEHEFTETEN SIND IM BLATT EINE EIGENE ZONE ──────────────
  //
  // In der LEISTE stehen sie vorn, weil der Speicher sie vorn führt (D16: eine
  // Ordnung). Im Blatt ordnet ohnehin schon die Art, und dort ist «angeheftet»
  // die stärkere Auskunft: es sind die Reiter, die keine Schliess-Geste
  // erwischt. Sie stehen darum als erste Gruppe und NICHT zusätzlich unter
  // ihrer Art — sonst führte dasselbe Verzeichnis denselben Reiter zweimal.
  // Nebeneffekt, der kein Zufall ist: ▲/▼ und das Ziehen bewegen einen Reiter
  // nur INNERHALB seiner Blatt-Liste — die Zonengrenze aus `lib/tabs` wird
  // hier damit gar nicht erst berührt, statt bewacht zu werden.
  const festeItems = tabs.filter((t) => t.fest);
  const freie = tabs.filter((t) => !t.fest);
  const FEST_ID = 'zone:fest';
  /** Ziehen nur innerhalb derselben Zone (zusätzlich zum Same-Group-Guard):
   *  `lib/tabs.ordneTabsUm` wiese den Zug ohnehin ab — hier bleibt schon die
   *  Einfügemarke aus, statt eine Landung zu versprechen (§8). */
  const zoneVon = (p: string) => !!tabs.find((t) => tabSchluessel(t.path) === tabSchluessel(p))?.fest;
  const gleicheZone = (a: string, b: string) => zoneVon(a) === zoneVon(b);

  const gruppen = KAT_ORDER
    .map((kat) => ({ kat, items: freie.filter((t) => reiterKategorie(t.path) === kat) }))
    .filter((g) => g.items.length > 0);

  // Verwaiste Klapp-Zustände beim Render abgleichen (React «adjust state when
  // inputs change»): schliesst man alle Reiter einer Gruppe/Untergruppe, fällt
  // deren ID weg → ihr eingeklappt-Zustand wird verworfen, damit ein später neu
  // geöffneter Reiter wieder im Default «offen» erscheint statt im alten «zu».
  const aktiveIds = new Set<string>();
  if (festeItems.length > 0) aktiveIds.add(FEST_ID);
  for (const { kat, items } of gruppen) {
    aktiveIds.add(`kat:${kat}`);
    if (kat === 'gesetze') for (const t of items) {
      const h = herkunftVon(t.path, manifeste);
      if (h) aktiveIds.add(`herk:${h}`);
    }
  }
  const idSchluessel = [...aktiveIds].sort().join('|');
  const [letzteIds, setLetzteIds] = useState('');
  if (idSchluessel !== letzteIds) {
    setLetzteIds(idSchluessel);
    setZu((o) => {
      const behalten = Object.keys(o).filter((k) => aktiveIds.has(k));
      if (behalten.length === Object.keys(o).length) return o;
      return Object.fromEntries(behalten.map((k) => [k, o[k]]));
    });
  }

  if (gruppen.length === 0 && festeItems.length === 0) return null;

  // Eine Reiter-Zeile: dreispaltig (Icon · Name · Artikel) + Schliessen-Knopf.
  // `liste`/`idx` sind die Blatt-Liste dieser Zeile und ihre Position darin —
  // daraus leiten sich die Nachbarn für die ▲/▼-Tasten ab (immer dieselbe Gruppe).
  const zeile = (t: TabEintrag, alsGesetz: boolean, liste: TabEintrag[], idx: number) => {
    const aktiv = tabSchluessel(t.path) === aktivSchluessel;
    // ── R3 (Prüfbefund R11, 6.9.2026) · DIESELBE BESCHRIFTUNG WIE DIE LEISTE ─
    // GEMESSEN @390: das Blatt baute seine Namen selbst (`verlaufLabel`) und
    // zeigte darum den Volltitel, wo die Leiste die Kurzform trägt —
    // «Verfahrens- & Rechtsmittelfristen» statt «Fristenrechner», und für
    // Entscheide die volle Zitierung samt Urteilsdatum. Zwei Beschriftungen
    // für dieselbe Sache sind eine zweite Wahrheit (§5). Beide Flächen lesen
    // jetzt `lib/tabs` — Kurzform in der Zeile, Volltitel im `title`.
    const name = reiterKurzformText(t, manifeste);
    const titel = reiterTitel(t, manifeste);
    const art = alsGesetz ? artikelLabelVonPfad(t.path) : null;
    const ueber = ueberPath === t.path;
    const vorher = liste[idx - 1];
    const nachher = liste[idx + 1];
    return (
      <li key={tabSchluessel(t.path)}
        draggable
        onDragStart={(ev) => { gezogenRef.current = t.path; ev.dataTransfer.setData('text/plain', t.path); ev.dataTransfer.effectAllowed = 'move'; }}
        onDragOver={(ev) => {
          const von = gezogenRef.current;
          // Drop nur innerhalb derselben Blatt-Liste zulassen (Same-Group-Guard).
          // W2·25: zusätzlich zur Blatt-Gruppe zählt die ZONE — angeheftet
          // oder frei. Beides zusammen ist genau die Liste, die diese Zeile
          // gerade führt.
          if (von && von !== t.path && gleicheZone(von, t.path) && gleicheReiterGruppe(von, t.path, manifeste)) {
            ev.preventDefault();
            if (ueberPath !== t.path) setUeberPath(t.path);
          }
        }}
        onDrop={(ev) => {
          ev.preventDefault();
          const von = gezogenRef.current ?? ev.dataTransfer.getData('text/plain');
          if (von && von !== t.path && gleicheZone(von, t.path) && gleicheReiterGruppe(von, t.path, manifeste)) ordneTabsUm(von, t.path);
          gezogenRef.current = null;
          setUeberPath(null);
        }}
        onDragEnd={() => { gezogenRef.current = null; setUeberPath(null); }}
        className={`flex items-center rounded-md ${ueber ? 'border-t-2 border-brass-400' : ''} ${aktiv ? 'bg-brass-100/50' : 'hover:bg-brass-100/30'}`}>
        <button type="button" aria-current={aktiv ? 'page' : undefined}
          onClick={() => onNavigate(t.path)} title={titel}
          className={`grid flex-1 min-w-0 grid-cols-[3px_1fr_auto] items-center gap-2 text-left px-2 py-1.5 text-body-s ${aktiv ? 'text-brass-800 font-medium' : 'text-ink-700'}`}>
          {/* ── R4 · SPALTE 1 IST DER REGISTERSTRICH, KEIN BILD ──────────────
              GEMESSEN @390: die Zeile führte ein Kantonswappen als <img>, sonst
              ein Kategorie-Piktogramm (⚖ ✎ ∑) — zwei Bildsprachen in einer
              Spalte, und die Wappen zogen als einzige Farbflächen der ganzen
              Liste den Blick auf sich. Der Registerstrich ist dasselbe Zeichen
              wie in der Leiste darüber und im Such-Panel: EINE Marke, EINE
              Quelle (`layout/bereiche`, §5). Die HERKUNFT geht nicht verloren —
              sie ist die Untergruppe, unter der die Zeile steht («Bund»,
              «Kanton», «International»), und steht im `title`. */}
          <RegisterMarke route={t.path} />
          {/* Spalte 2 — Kurzform */}
          <span className="truncate">{name}</span>
          {/* Spalte 3 — aktueller Artikel (nur Gesetze) */}
          {art ? <span className="num shrink-0 text-micro text-ink-500">{art}</span> : <span />}
        </button>
        {/* ▲/▼ — Umsortieren per Tastatur/Touch (Alternative zu Drag&Drop, a11y).
            Bewegt den Reiter an die Position des Nachbarn IN DERSELBEN Gruppe. */}
        {/* LM-090 (W2·17-UI-BEFUNDE B10, 4.9.2026). Die GRÖSSEN-Hälfte des
            Befunds ist widerlegt: die «rund 14 px» sind die Glyphengrösse, die
            Zielflächen messen nachgemessen 24×28 (▲▼⧉) und 28×28 (✕) — über
            der AA-Untergrenze (WCAG 2.5.8, 24 px). Das Komfortmass 44 px ist
            für DIESE Zeile datiert verworfen (SchliessKnopf `komfort={false}`,
            A3-1): das Pseudo-Element läge über den Nachbarknöpfen und den
            Zeilen darüber/darunter und nähme denen die Klicks.
            REPRODUZIERT war die BESCHRIFTUNGS-Hälfte, aber nur halb: die drei
            Sortier-/Öffnen-Knöpfe trugen ein sprechendes `aria-label` und
            damit KEIN `title` — am Zeiger blieben sie stumm, während das ✕
            daneben (via `SchliessKnopf`) seit je beides führt. Sie bekommen
            denselben Namen als `title`; eine sichtbare Textbeschriftung
            scheidet in einer 28-px-Zeile aus. */}
        <button type="button" disabled={!vorher}
          onClick={() => vorher && ordneTabsUm(t.path, vorher.path)}
          aria-label={`Reiter «${name}» nach oben`}
          title={`Reiter «${name}» nach oben`}
          className="inline-flex items-center justify-center w-6 h-7 shrink-0 rounded text-ink-500 hover:text-brass-700 disabled:opacity-30 disabled:hover:text-ink-500 transition-colors">
          <span aria-hidden className="lc-griff-glyph">▲</span>
        </button>
        <button type="button" disabled={!nachher}
          onClick={() => nachher && ordneTabsUm(t.path, nachher.path)}
          aria-label={`Reiter «${name}» nach unten`}
          title={`Reiter «${name}» nach unten`}
          className="inline-flex items-center justify-center w-6 h-7 shrink-0 rounded text-ink-500 hover:text-brass-700 disabled:opacity-30 disabled:hover:text-ink-500 transition-colors">
          <span aria-hidden className="lc-griff-glyph">▼</span>
        </button>
        {/* ⧉ — nebeneinander öffnen (Split-View): nur ab lg + freier Kapazität. */}
        {onDaneben && !paneOffen?.(t.path) && (
          <button type="button" onClick={() => onDaneben(t.path)}
            aria-label={`Reiter «${name}» nebeneinander öffnen`}
            title={`Reiter «${name}» nebeneinander öffnen`}
            className="hidden lg:inline-flex items-center justify-center w-6 h-7 shrink-0 rounded text-ink-500 hover:text-brass-700 transition-colors">
            <span aria-hidden className="lc-griff-glyph">⧉</span>
          </button>
        )}
        {/* A3-1 (R3-β): EIN Schliess-✕ der App. Der danger-Hover ist keine
            Farbwahl mehr, sondern eine DEKLARIERTE Aussage über die Handlung
            (`ton="destruktiv"`): der Klick wirft den Reiter samt Verlauf weg.
            Die Box (w-7 h-7) bleibt die der Reiter-Zeile — 44 px hätten dort
            keinen Platz; die Trefferfläche holt der Baustein per `::after`. */}
        <SchliessKnopf name={`Reiter «${name}» schliessen`} ton="destruktiv"
          /* `komfort={false}`: 44 px lägen hier über dem ⧉-Nachbarn und über den
             Reiter-Zeilen darüber/darunter — die Fläche nähme denen die Klicks.
             Die Zeile hält die AA-Untergrenze (24 px) aus der Grundklasse. */
          komfort={false}
          onClick={() => onSchliessen(t.path)} klasse="w-7 h-7 mr-0.5" />
      </li>
    );
  };

  // Klappbarer Gruppen-/Untergruppen-Kopf.
  const kopf = (id: string, label: string, anzahl: number, tief: boolean) => (
    <button type="button" onClick={() => toggle(id)} aria-expanded={offen(id)}
      className={`flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left transition-colors lc-hover-flaeche ${tief ? 'text-xs pl-3' : 'lc-overline'}`}>
      <span aria-hidden className={`text-micro text-ink-400 transition-transform ${offen(id) ? '' : '-rotate-90'}`}>▾</span>
      {/* R3 · «kein Abschnitt ohne title»: der Gruppenname wird gekappt, sobald
          das Blatt schmal wird — der Tooltip gibt ihn ganz zurück (§8). */}
      <span className="flex-1 truncate" title={label}>{label}</span>
      <span className="num text-micro text-ink-400">{anzahl}</span>
    </button>
  );

  return (
    <div className="space-y-2">
      {/* W2·25 · die feste Zone zuerst — dieselbe Reihenfolge wie in der
          Leiste, damit Blatt und Streifen nicht widersprechen (§5). Das
          Gesetzes-Format der Zeile (Herkunfts-Strich + Artikel-Spalte) hängt
          an der ART des einzelnen Reiters, nicht an der Gruppe. */}
      {festeItems.length > 0 && (
        <div>
          {kopf(FEST_ID, 'Angeheftet', festeItems.length, false)}
          {offen(FEST_ID) && (
            <ul className="mt-0.5 space-y-0.5 pl-2">
              {festeItems.map((t, i) => zeile(t, reiterKategorie(t.path) === 'gesetze', festeItems, i))}
            </ul>
          )}
        </div>
      )}
      {gruppen.map(({ kat, items }) => {
        const katId = `kat:${kat}`;
        return (
          <div key={kat}>
            {kopf(katId, KAT_META[kat].label, items.length, false)}
            {offen(katId) && (
              kat === 'gesetze'
                // Gesetze-Gruppe gliedert sich nach Herkunft (Bund→Kanton→International);
                // Reiter ohne auflösbare Herkunft (Manifest noch nicht geladen) hängen
                // wir ans Ende (ohne Untertitel), damit nichts verschwindet.
                ? (() => {
                    const proHerkunft = new Map<Herkunft, TabEintrag[]>();
                    const ungeklaert: TabEintrag[] = [];
                    for (const t of items) {
                      const h = herkunftVon(t.path, manifeste);
                      if (h) (proHerkunft.get(h) ?? proHerkunft.set(h, []).get(h)!).push(t);
                      else ungeklaert.push(t);
                    }
                    return (
                      <div className="mt-0.5 space-y-1 pl-2">
                        {HERKUNFT_ORDER.filter((h) => (proHerkunft.get(h)?.length ?? 0) > 0).map((h) => {
                          const subId = `herk:${h}`;
                          const subItems = proHerkunft.get(h)!;
                          return (
                            <div key={h}>
                              {kopf(subId, HERKUNFT_LABEL[h], subItems.length, true)}
                              {offen(subId) && <ul className="mt-0.5 space-y-0.5">{subItems.map((t, i) => zeile(t, true, subItems, i))}</ul>}
                            </div>
                          );
                        })}
                        {ungeklaert.length > 0 && <ul className="mt-0.5 space-y-0.5">{ungeklaert.map((t, i) => zeile(t, true, ungeklaert, i))}</ul>}
                      </div>
                    );
                  })()
                : <ul className="mt-0.5 space-y-0.5 pl-2">{items.map((t, i) => zeile(t, false, items, i))}</ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
