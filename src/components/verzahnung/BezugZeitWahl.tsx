// ─── B5: Zeitstrahl + Von-Bis-Datum — Zeit-STEUERUNG der Bezüge ─────────────
//
// W2·7-BEZUG/B5 (FAHRPLAN-VERZAHNUNG-UI §9 B5). David 28.7.2026: «zeitstrahl und
// datumseingabe anstatt 5 jahre 10 jahre usw. menu soll interaktiv und innovativ
// nützlich sein» — zugleich gilt seine Minimalismus-Vorgabe desselben Tages
// («optik des gesetzes nicht überladen»). Beides zusammen ergibt EIN kompaktes
// Element: ein Histogramm-Streifen mit Zieh-Auswahl, darunter zwei Datumsfelder.
// Keine zweite Achse, keine Legende, kein Dashboard.
//
// ── WARUM DAS HISTOGRAMM UND NICHT NUR ZWEI FELDER ─────────────────────────
// Zwei leere Datumsfelder verlangen vom Leser eine Zahl, die er nicht hat: er
// weiss nicht, ob es zu diesem Erlass Praxis vor 2015 überhaupt gibt. Der
// Streifen beantwortet das, BEVOR er tippt — und macht sichtbar, dass die
// Verteilung schief ist (die Bezugs-Korpora reichen nur bis 2007 zurück). Das
// ist der ehrliche Teil (§8): der Strahl zeigt, was da ist, nicht was man sich
// wünscht. Die Felder bleiben trotzdem, weil eine gezogene Auswahl nie «ab dem
// Tag der Revision» treffen kann.
//
// ── KEINE CHART-LIBRARY (§15) ──────────────────────────────────────────────
// Handgebaute DIV-Balken. Eine Diagramm-Bibliothek für zwanzig Rechtecke wäre
// ein Bundle-Zuwachs, den kein Nutzer je sieht; DIVs erben ausserdem die
// Farb-Token und den Dunkelmodus ohne eine Zeile Konfiguration.
//
// ── BEDIENBARKEIT OHNE ZEIGEGERÄT (WCAG 2.1.1) ─────────────────────────────
// Die Zieh-Auswahl ist eine ABKÜRZUNG, nie der einzige Weg: alles, was sie
// kann, können die zwei Datumsfelder auch — sie sind tab-erreichbar, nehmen
// Tastatur-Eingabe und decken zusätzlich den tagesgenauen Fall ab, den der
// Strahl gar nicht ausdrücken kann. Darum sind die Balken bewusst KEINE 20
// einzelnen Tab-Stationen (das wäre eine Tab-Wüste vor den eigentlichen
// Steuerelementen), sondern eine aria-hidden Grafik mit einer gesprochenen
// Zusammenfassung daneben.
//
// VOLLSTÄNDIG GESTEUERT wie `BezugFacettenWahl`: kein Store-Zugriff, keine
// Kenntnis des Menüs. Wer sie mountet, hält den Zustand.

import { useRef, useState } from 'react';
import { zahlGruppiert } from '../typografie';
import {
  bereichAusJahren, bereichLabel, istBereichOffen, jahrImBereich,
  type Histogramm, type Zeitbereich,
} from '../../pages/gesetz-leser/bezugZeit';

/** Höhe des Streifens. Fest, damit das Panel beim Laden der Verteilung nicht
 *  nachwächst — der Strahl steht in einem offenen Dropdown, ein Nachwachsen
 *  verschöbe die Datumsfelder unter dem Zeigefinger (§15/CLS). */
const STRAHL_HOEHE = 'h-9';

/** Ein Jahr mit Kanten bekommt IMMER sichtbare Höhe. Ein Balken, der auf 0 px
 *  rundet, behauptet «in diesem Jahr nichts» — das wäre eine Aussage über die
 *  Rechtsprechung, die die Daten nicht decken (§8). */
const MIN_ANTEIL = 8;

export function BezugZeitWahl({ bereich, histogramm, onBereich }: {
  /** Aktiver Von-Bis-Bereich; beide Enden '' = offen. */
  bereich: Zeitbereich;
  /** Verteilung, AUS DER gewählt wird (ohne Zeitfilter — siehe bezuegeLaden.ts). */
  histogramm: Histogramm;
  onBereich: (von: string, bis: string) => void;
}) {
  const streifenRef = useRef<HTMLDivElement>(null);
  // Laufende Zieh-Geste: [Anker, aktuell] als Balken-Indizes. null = keine Geste.
  const [zug, setZug] = useState<[number, number] | null>(null);
  const { balken, ohneJahr } = histogramm;
  const aktiv = !istBereichOffen(bereich);
  const label = bereichLabel(bereich);

  const gesamt = balken.reduce((s, b) => s + b.anzahl, 0) + ohneJahr;
  const hoechster = balken.reduce((m, b) => Math.max(m, b.anzahl), 0);

  function indexAusX(clientX: number): number {
    const el = streifenRef.current;
    if (!el || balken.length === 0) return 0;
    const r = el.getBoundingClientRect();
    const i = Math.floor(((clientX - r.left) / r.width) * balken.length);
    return Math.min(balken.length - 1, Math.max(0, i));
  }

  // Ein Klick IST eine Zieh-Geste der Länge 1 — dieselbe Rechnung, kein zweiter
  // Pfad (§5). Deshalb wird erst beim Loslassen übernommen: so kann man eine
  // begonnene Auswahl noch korrigieren, ohne dass zwischendurch schon gefiltert
  // wird (und die Liste unter dem Artikel bei jedem Pixel neu rechnet).
  function beiDown(e: React.PointerEvent<HTMLDivElement>): void {
    if (balken.length === 0) return;
    const i = indexAusX(e.clientX);
    setZug([i, i]);
    // Capture, damit die Geste auch dann noch beim Streifen landet, wenn der
    // Zeiger ihn seitlich verlässt — sonst bliebe `zug` beim Loslassen daneben
    // hängen und die Auswahl käme nie an. Der `catch` ist kein Zieren: der
    // Browser wirft, wenn der Zeiger zwischen down und diesem Aufruf schon
    // wieder weg ist; ohne ihn stürbe das Rendern an einer Randbedingung, die
    // die Bedienung gar nicht betrifft.
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ohne Capture bedienbar */ }
  }
  function beiMove(e: React.PointerEvent<HTMLDivElement>): void {
    if (!zug) return;
    const i = indexAusX(e.clientX);
    if (i !== zug[1]) setZug([zug[0], i]);
  }
  function beiUp(e: React.PointerEvent<HTMLDivElement>): void {
    if (!zug) return;
    const [a, b] = zug;
    setZug(null);
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* nie gefangen */ }
    const neu = bereichAusJahren(balken[a].jahr, balken[b].jahr);
    // Deckt die Geste den GANZEN Strahl ab, ist «alles» gemeint — und «alles»
    // heisst offener Bereich, nicht ein Bereich mit den Rändern der heutigen
    // Daten. Sonst schnitte die Auswahl still jeden künftig ergänzten Entscheid
    // ausserhalb dieser Ränder weg (§8).
    const ganz = Math.min(a, b) === 0 && Math.max(a, b) === balken.length - 1;
    if (ganz) onBereich('', '');
    else onBereich(neu.von, neu.bis);
  }

  // Vorschau während des Ziehens: die Einfärbung folgt der Geste, nicht dem noch
  // unveränderten Bereich — sonst zöge man ins Leere.
  const zugVon = zug ? Math.min(zug[0], zug[1]) : -1;
  const zugBis = zug ? Math.max(zug[0], zug[1]) : -1;
  // Ein Auswahl-BAND gibt es nur, wenn wirklich eine Spanne gemeint ist: während
  // einer Geste oder bei aktivem Bereich. Sonst wäre «alles gewählt» optisch
  // dasselbe wie «alles markiert» — und der Streifen zeigte keine Verteilung mehr.
  const bandSichtbar = zug !== null || aktiv;

  return (
    <div className="px-2.5 pt-1.5 pb-0.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="lc-overline">Zeitraum</span>
        {aktiv && (
          <button
            type="button"
            onClick={() => onBereich('', '')}
            className="rounded px-1.5 py-0.5 text-micro text-ink-500 lc-hover-akzent hover:text-brass-700"
            title="Zeitraum aufheben — wieder alle Entscheide zeigen"
          >
            {label} ×
          </button>
        )}
      </div>

      {balken.length === 0 ? (
        // §8: kein leerer Streifen, der eine Verteilung vortäuscht. Entweder ist
        // der Shard noch nicht da oder dieser Erlass hat keine datierten Kanten —
        // beides wird gesagt, statt eine Grafik ohne Inhalt zu zeigen.
        <p className="pt-1 text-micro leading-snug text-ink-500">
          Für diesen Erlass ist noch keine Verteilung geladen. Die Datumsfelder wirken trotzdem.
        </p>
      ) : (
        <>
          <div
            ref={streifenRef}
            onPointerDown={beiDown}
            onPointerMove={beiMove}
            onPointerUp={beiUp}
            onPointerCancel={() => setZug(null)}
            role="img"
            aria-label={`Verteilung der Entscheide von ${balken[0].jahr} bis ${balken[balken.length - 1].jahr}. Ziehen wählt einen Bereich; dieselbe Auswahl gelingt über die Datumsfelder darunter.`}
            data-zeitstrahl
            // `touch-action:none`, damit eine Zieh-Geste auf dem Streifen nicht
            // als Seiten-Scroll durchgereicht wird (mobil sonst unbedienbar).
            className={`mt-1 flex ${STRAHL_HOEHE} cursor-ew-resize touch-none select-none items-end gap-px rounded border border-line bg-paper-sunken p-px`}
          >
            {balken.map((b, i) => {
              const gewaehlt = zug
                ? i >= zugVon && i <= zugBis
                : jahrImBereich(b.jahr, bereich);
              const anteil = hoechster === 0 ? 0
                : Math.max(b.anzahl === 0 ? 0 : MIN_ANTEIL, Math.round((b.anzahl / hoechster) * 100));
              return (
                <div
                  key={b.jahr}
                  data-zeitstrahl-jahr={b.jahr}
                  title={`${b.jahr}: ${b.anzahl} ${b.anzahl === 1 ? 'Verknüpfung' : 'Verknüpfungen'}`}
                  // Das BAND (volle Zellenhöhe) markiert die gezogene Spanne —
                  // aber NUR, wenn eine Spanne existiert. Befund an den
                  // Screenshots 28.7.2026: im offenen Grundzustand gilt jedes
                  // Jahr als «gewählt», also lag das Band über allen Balken und
                  // die Verteilung war nicht mehr ablesbar — eine Grafik, die
                  // genau das verdeckt, wofür sie da ist. Ohne Auswahl kein Band.
                  // `rounded-[1px]` bleibt bewusst unter dem kleinsten Radius-
                  // Token (4px, DESIGN-REGLEMENT.md F7b, C4 5.9.2026): die
                  // Balkenhöhe an MIN_ANTEIL ist selbst nur ~2–3px, ein
                  // Token-Radius würde den Balken zum Punkt verformen.
                  className={`flex h-full flex-1 items-end rounded-[1px] transition-colors ${
                    bandSichtbar && gewaehlt ? 'bg-slate-bg' : ''
                  }`}
                >
                  <div
                    aria-hidden
                    style={{ height: `${anteil}%` }}
                    className={`w-full rounded-[1px] transition-colors ${
                      gewaehlt ? 'bg-slate-solid' : 'bg-line-strong'
                    }`}
                  />
                </div>
              );
            })}
          </div>
          {/* ── LM-024 (B8, 31.8.2026) · DIE BEDIENBARKEIT STEHT JETZT DA ──────
              Befund: «sechs Balken ohne Werte, ohne Achsenbeschriftung, ohne
              Einheit; ob es anklickbar ist, ist nicht erkennbar.» Am gebauten
              Stand nachgeprüft (OR @1440): Werte je Balken gibt es (`title`
              «Jahr: N Verknüpfungen»), Einheit und Grundgesamtheit stehen
              sichtbar im Fusssatz («889 Verknüpfungen in diesem Erlass») — der
              einzige Teil, der wirklich fehlte, war die BEDIENBARKEIT: sie
              lebte nur im `aria-label` und im `cursor-ew-resize`, für Sehende
              also erst NACH dem Hinfahren mit der Maus, auf Touch gar nicht.
              Der Hinweis kostet keine Zeile: er teilt sich die Achsenzeile mit
              den beiden Jahreszahlen und wiederholt WORTGLEICH die Formulierung
              des `aria-label` darüber (§5 — eine Handlung, ein Wortlaut).
              `num tabular-nums` wandert dabei von der Zeile auf die
              Jahreszahlen: die Mono-Stimme gehört den Ziffern, nicht dem Satz.
              NICHT GEBAUT und bewusst nicht: Achsenbeschriftung, Werte am
              Balken, Legende — das ist Davids Minimalismus-Vorgabe vom
              28.7.2026 («keine zweite Achse, keine Legende, kein Dashboard»),
              und sie zu kippen wäre eine Entscheid-Änderung, kein Bugfix
              (§0.2 des Fahrplans). */}
          <div className="flex items-baseline justify-between gap-2 pt-0.5 text-micro text-ink-500">
            <span className="num">{balken[0].jahr}</span>
            <span className="min-w-0 truncate">Ziehen wählt einen Bereich</span>
            <span className="num">{balken[balken.length - 1].jahr}</span>
          </div>
        </>
      )}

      {/* Zwei Zeilen statt einer: nebeneinander drängten sich zwei native
          Datumsfelder im 17-rem-Panel auf je gut 120 px und schnitten die
          Jahreszahl ab. Untereinander bleibt jedes lesbar — und die Zeile «von»
          über «bis» ist ohnehin die Leserichtung eines Bereichs. */}
      <div className="mt-1.5 flex flex-col gap-1">
        <DatumsFeld
          label="von"
          wert={bereich.von}
          titel="Frühestes Entscheiddatum — leer lassen für offenes Ende"
          onWert={(v) => onBereich(v, bereich.bis)}
        />
        <DatumsFeld
          label="bis"
          wert={bereich.bis}
          titel="Spätestes Entscheiddatum — leer lassen für offenes Ende"
          onWert={(v) => onBereich(bereich.von, v)}
        />
      </div>

      {/* §8: woraus die Verteilung stammt und was sie NICHT ist. Der Strahl zeigt
          diesen EINEN Erlass, nicht den Korpus — eine korpusweite Verteilung gäbe
          es nur mit einer neuen Projektion, und die wäre eine Datenschicht, die
          hier nichts zu suchen hat (§3/§5). Das wird gesagt, nicht unterschlagen. */}
      <p className="pt-1 pb-0.5 text-micro leading-snug text-ink-500">
        {gesamt > 0 && (
          <>
            {/* B13/LM-108: vierstellige Zählwerte tausendergruppiert wie überall
                sonst («1'465 Verknüpfungen», nicht «1465»); SSoT für das
                Trennzeichen ist src/lib/konventionen.ts. Klasse `num` ohne
                `tabular-nums` (R4-C, 5.9.2026: die Utility nahm lining-nums weg). */}
            <span className="num">{zahlGruppiert(gesamt)}</span>
            {gesamt === 1 ? ' Verknüpfung' : ' Verknüpfungen'} in diesem Erlass
            {ohneJahr > 0 && <> · <span className="num">{zahlGruppiert(ohneJahr)}</span> ohne Datum (bleiben immer sichtbar)</>}
            {'. '}
          </>
        )}
        Der Zeitraum wirkt auf alle eingeschalteten Instanzen. Die Zahl an der Gruppe nennt weiterhin den gesamten Bestand am Artikel.
      </p>
    </div>
  );
}

/** Ein Datumsfeld mit vorangestelltem Label. Nativ `type="date"`.
 *
 *  R2-E/F1-1-AUSNAHME (R3-α, 31.8.2026): Filter, kein fristauslösendes Feld.
 *  Der frühere Satz hier («es bringt Tastatur-Eingabe, LANDES-FORMAT und
 *  Kalender mit») ist von F1-1 widerlegt und bleibt als Beleg stehen (§2b):
 *  gemessen rendert `type="date"` in der Locale des BROWSERS, auf einem
 *  us-englischen Profil also MM/DD/YYYY. Tragend ist er hier trotzdem nicht:
 *  die beiden Felder grenzen eine BEZUGS-Liste zeitlich ein — kein Wert läuft
 *  in eine Frist- oder Verjährungsrechnung, und die Zeile ist mit `text-xs`
 *  und `py-0.5` zu schmal für das Kalender-Popover des Haus-Felds. */
function DatumsFeld({ label, wert, titel, onWert }: {
  label: string;
  wert: string;
  titel: string;
  onWert: (neu: string) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-ink-600" title={titel}>
      <span className="w-6 shrink-0">{label}</span>
      <input
        type="date"
        value={wert}
        data-zeit-feld={label}
        onChange={(e) => onWert(e.target.value)}
        /* QS-UI 8a (F3): `focus:outline-none` entfernt. Tailwind setzt darunter
           `outline:2px solid transparent` — gemessen 3.8.2026 hatte das Feld im
           Tastatur-Fokus einen 2-px-Perimeter in Alpha 0, also KEINEN sichtbaren
           Ring; erkennbar war der Fokus allein am 1-px-Rahmenwechsel
           (border-line → brass-400). F3 verlangt ≥2 px Perimeter und verbietet
           einen Fokus, der nur die Farbe wechselt. Ohne die Utility greift die
           Basis-Regel `:focus-visible { outline:2px solid var(--focus) }`
           (index.css) — der Maus-Fokus bleibt still, weil
           `:focus:not(:focus-visible)` die Outline dort weiterhin abräumt. */
        className="num min-w-0 flex-1 rounded border border-line bg-paper px-1.5 py-0.5 text-xs text-ink-900 focus:border-brass-400"
      />
    </label>
  );
}
