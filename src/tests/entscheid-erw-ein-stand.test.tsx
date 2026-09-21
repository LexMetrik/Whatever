/**
 * W2·17-UI-BEFUNDE — EIN Stand für die Entscheid-Suche (`ErwBereich` +
 * `ErwaegungsRail`), Fake-Timer-Render gegen den ECHTEN Baum (kein SSR-Abzug
 * wie `leser-landkarte-name-w228.test.tsx`, weil hier über Zeit — die
 * 200-ms-Entprellung — geprüft wird).
 *
 * ── DER BEFUND (Auftrag 21.9.2026) ───────────────────────────────────────────
 * Rail-Schranke, aria-live-Zähler, Schalter-Gate/-Anzeige und Landkarte hingen
 * teils am ROHEN `suche`, teils am entprellten `sucheGewertet` — zwei Stände
 * derselben Darstellungsseite. Folgen, hier je ein Test:
 *  (2) Verzeichnis sprang beim ersten Zeichen 219 → 0 → 201 (gemessen), weil
 *      die Schranke `suche.trim()!==''` sofort auf `treffer` umschaltete,
 *      während `treffer` selbst noch aus dem LEEREN `sucheGewertet` kam — für
 *      einen Tick also eine LEERE Liste statt der vollen Gliederung.
 *      Zusätzlich (§ Falle a): Schalter-Anzeige und Landkarte müssen beim
 *      Leeren des Feldes bei gesetztem Schalter im Gleichlauf bleiben.
 *  (3) Im selben Tick stand bis zu ~49 ms lang «Keine Treffer in dieser
 *      Fassung.» im `aria-live="polite"`-Bereich, obwohl der Begriff Treffer
 *      hat — eine Falschaussage für Screenreader (§8).
 *
 * ROT ZU BEKOMMEN (§6.7, Bericht 21.9.2026): die Rail-Gates (Datei
 * `ErwaegungsRail.tsx`) zurück auf das rohe `suche` — beide Tests fallen.
 */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { parseHTML } from 'linkedom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ErwBereich } from '../pages/entscheidErwBereich';
import { erwaegungsGliederung, erwaegungsWort } from '../lib/rechtsprechung/abschnitte';
import { trefferInErwaegungen, zaehleTreffer } from '../pages/entscheidLeserRegeln';
import type { EntscheidAbschnitt } from '../lib/rechtsprechung/typen';

// Fünf Erwägungen, «Beschwerde» in dreien davon — Vorbedingung unten geprüft,
// damit der Block nicht trivial grün würde (§6.7, wie im W228-Namenstest).
const ABSCHNITTE: EntscheidAbschnitt[] = [
  { typ: 'sachverhalt', bloecke: [{ marke: null, text: 'A. Ausgangslage ohne den Suchbegriff.' }] },
  {
    typ: 'erwaegung',
    bloecke: [
      { marke: 'E. 1', text: 'Eintreten ist unbestritten.' },
      { marke: 'E. 2', text: 'Die Beschwerde ist im Grundsatz begründet.' },
      { marke: 'E. 3', text: 'Die Beschwerde wird im Kostenpunkt abgewiesen.' },
      { marke: 'E. 4', text: 'Kostenfolgen gemäss Tarif.' },
      { marke: 'E. 5', text: 'Diese Beschwerde bleibt im Übrigen unbeurteilt.' },
    ],
  },
  { typ: 'dispositiv', bloecke: [{ marke: null, text: 'Die Beschwerde wird abgewiesen.' }] },
];
const BEGRIFF = 'Beschwerde';
const GLIEDERUNG = erwaegungsGliederung(ABSCHNITTE);
const TREFFER = trefferInErwaegungen(ABSCHNITTE, BEGRIFF);
const TREFFER_GESAMT = zaehleTreffer(ABSCHNITTE, BEGRIFF);

let root: Root | null = null;

function aufbauen(): HTMLElement {
  const { document } = parseHTML('<!doctype html><html><body><div id="app"></div></body></html>');
  vi.stubGlobal('window', {
    document,
    setTimeout: (...a: Parameters<typeof setTimeout>) => globalThis.setTimeout(...a),
    clearTimeout: (...a: Parameters<typeof clearTimeout>) => globalThis.clearTimeout(...a),
  });
  vi.stubGlobal('document', document);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  return document.getElementById('app') as unknown as HTMLElement;
}

type Props = { suche: string; markenAusRoh: boolean };

function baum({ suche, markenAusRoh }: Props) {
  return createElement(ErwBereich, {
    abschnitte: ABSCHNITTE,
    zitierteNormen: [],
    suche,
    onSuche: () => {},
    springe: () => {},
    markenAusRoh,
    onMarkenSchalten: () => {},
    landkarteSteht: true,
    aktivAnker: null,
  });
}

async function rendern(ziel: HTMLElement, props: Props) {
  if (!root) root = createRoot(ziel);
  await act(async () => { root!.render(baum(props)); });
}

async function abbauen() {
  if (!root) return;
  const r = root;
  root = null;
  await act(async () => r.unmount());
}

/** Zeilen des Verzeichnisses/der Trefferliste — egal ob Gliederung oder Suche. */
function listenEintraege(ziel: HTMLElement): number {
  return ziel.querySelectorAll('nav[aria-label="Erwägungen"] ul li').length;
}
function leerHinweisSteht(ziel: HTMLElement): boolean {
  return /Kein Treffer in den Erwägungen\./.test(ziel.textContent ?? '');
}
function ariaLiveText(ziel: HTMLElement): string | null {
  return ziel.querySelector('[data-erw-treffer]')?.textContent ?? null;
}
function schalterAusgeschaltet(ziel: HTMLElement): boolean | null {
  const btn = ziel.querySelector('[data-treffer-marken-schalter]');
  if (!btn) return null;
  return btn.getAttribute('aria-pressed') === 'false'; // aria-pressed = !aus
}
function landkarteSteht(ziel: HTMLElement): boolean {
  return ziel.querySelector('[data-treffer-landkarte]') != null;
}

describe('Vorbedingung: die Testdaten tragen den Befund', () => {
  it('Gliederung und Trefferliste sind unterschiedlich lang, es gibt Treffer', () => {
    expect(GLIEDERUNG.length, 'volle Gliederung').toBe(5);
    expect(TREFFER.length, 'Erwägungen mit Treffer').toBe(3);
    expect(TREFFER_GESAMT, 'Vorkommen gesamt (inkl. Dispositiv, ohne Sachverhalt)').toBe(4);
    expect(TREFFER.length).not.toBe(GLIEDERUNG.length);
    expect(TREFFER_GESAMT).toBeGreaterThan(0);
  });
});

describe('Test 2 · Rail-Schranke/Zähler/Schalter/Landkarte auf EINEM Stand', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(async () => {
    await abbauen();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('erstes Zeichen: kein Sprung auf eine LEERE Liste — die volle Gliederung bleibt stehen, bis sucheGewertet nachzieht', async () => {
    const ziel = aufbauen();
    await rendern(ziel, { suche: '', markenAusRoh: false });
    expect(listenEintraege(ziel), 'vorher: volle Gliederung').toBe(GLIEDERUNG.length);
    expect(leerHinweisSteht(ziel)).toBe(false);

    // Erstes Zeichen (ganzer Begriff auf einen Schlag, wie ein Einfügen/Paste
    // — die Zeitpunkte sind dieselben wie beim ersten Tastendruck) — OHNE
    // Timer-Fortschritt: der Effekt hat den 0-ms-Timer erst GEPLANT, noch
    // nicht ausgeführt. Genau hier lag der Sprung auf 0.
    await rendern(ziel, { suche: BEGRIFF, markenAusRoh: false });
    expect(listenEintraege(ziel), 'im Übergang: weiterhin die volle Gliederung, NICHT 0').toBe(GLIEDERUNG.length);
    expect(leerHinweisSteht(ziel), 'kein "Kein Treffer"-Hinweis während des Übergangs').toBe(false);

    // Jetzt läuft der 0-ms-Timer ab: sucheGewertet zieht nach.
    await act(async () => { vi.advanceTimersByTime(0); });
    expect(listenEintraege(ziel), 'nachher: die echte Trefferliste').toBe(TREFFER.length);
  });

  it('Verfeinern (200 ms): die Rail zeigt weiter die Trefferliste des VORIGEN Präfixes, kein leerer Zustand', async () => {
    const ziel = aufbauen();
    await rendern(ziel, { suche: '', markenAusRoh: false });
    await rendern(ziel, { suche: BEGRIFF, markenAusRoh: false });
    await act(async () => { vi.advanceTimersByTime(0); });
    expect(listenEintraege(ziel)).toBe(TREFFER.length);

    // Verfeinern auf einen Begriff ohne Treffer — 200 ms Entprellung.
    await rendern(ziel, { suche: `${BEGRIFF}Z`, markenAusRoh: false });
    await act(async () => { vi.advanceTimersByTime(199); });
    expect(listenEintraege(ziel), 'bei 199 ms: noch der alte Präfix, kein leerer Zustand').toBe(TREFFER.length);
    expect(leerHinweisSteht(ziel)).toBe(false);

    await act(async () => { vi.advanceTimersByTime(1); });
    expect(listenEintraege(ziel), 'nach 200 ms: der neue (leere) Stand').toBe(0);
    expect(leerHinweisSteht(ziel)).toBe(true);
  });

  it('§ Falle a: Feld leeren bei gesetztem Schalter — Schalter-Anzeige und Landkarte bleiben im Gleichlauf, kein Aufblitzen', async () => {
    const ziel = aufbauen();
    // Suche mit Treffern, Schalter EIN (Marken AN) — Landkarte steht, Schalter
    // zeigt «an». Das ist die reale Ausgangslage, in der ein Nutzer den
    // Schalter überhaupt erst auf «aus» stellen kann.
    await rendern(ziel, { suche: '', markenAusRoh: false });
    await rendern(ziel, { suche: BEGRIFF, markenAusRoh: false });
    await act(async () => { vi.advanceTimersByTime(0); });
    expect(landkarteSteht(ziel), 'Vorbedingung: Landkarte steht (Marken an)').toBe(true);
    expect(schalterAusgeschaltet(ziel)).toBe(false);

    // Nutzer stellt den Schalter auf «aus» (sofort, kein Debounce — eine
    // direkt kontrollierte Interaktion): Schalter UND Landkarte müssen im
    // SELBEN Render umschlagen.
    await rendern(ziel, { suche: BEGRIFF, markenAusRoh: true });
    expect(schalterAusgeschaltet(ziel), 'Schalter zeigt sofort «aus»').toBe(true);
    expect(landkarteSteht(ziel), 'Landkarte verschwindet im selben Render').toBe(false);

    // Jetzt wird das Feld geleert, bei WEITERHIN gesetztem Schalter — genau
    // die Falle-a-Abfolge («Feld leeren mit gesetztem Schalter»).
    await rendern(ziel, { suche: '', markenAusRoh: true });
    // Direkt NACH dem Render, VOR dem 0-ms-Timer: sucheGewertet ist noch der
    // alte, nicht-leere Stand. In diesem Tick darf die Landkarte NIE
    // aufblitzen — markenAusRoh war schon vorher true, also war sie auch
    // VORHER schon aus; Schalter und Landkarte müssen im GLEICHEN Tick
    // dieselbe Aussage machen.
    expect(landkarteSteht(ziel), 'kein Aufblitzen im Übergangs-Tick').toBe(false);
    expect(schalterAusgeschaltet(ziel), 'Schalter zeigt im selben Tick weiter «aus», nicht «an»').toBe(true);
    await act(async () => { vi.advanceTimersByTime(0); });
    expect(landkarteSteht(ziel), 'nach dem Leeren bleibt sie aus (keine Treffer mehr)').toBe(false);
  });

  it('§ Falle a: Landkarte und Schalter-Anzeige sind NIE im selben Tick widersprüchlich (Marken aus, Treffer vorhanden)', async () => {
    const ziel = aufbauen();
    await rendern(ziel, { suche: '', markenAusRoh: true }); // Schalter von Anfang an «aus»
    await rendern(ziel, { suche: BEGRIFF, markenAusRoh: true });
    // Übergangs-Tick vor dem 0-ms-Timer: Schalter zeigt «aus», Landkarte steht
    // NICHT — beide müssen im GLEICHEN Tick dieselbe Aussage machen.
    if (schalterAusgeschaltet(ziel) !== null) {
      expect(schalterAusgeschaltet(ziel)).toBe(true);
      expect(landkarteSteht(ziel)).toBe(false);
    } else {
      // Schalter noch nicht gerendert (kein Treffer bekannt) — dann darf auch
      // die Landkarte nicht stehen.
      expect(landkarteSteht(ziel)).toBe(false);
    }
    await act(async () => { vi.advanceTimersByTime(0); });
    expect(schalterAusgeschaltet(ziel)).toBe(true);
    expect(landkarteSteht(ziel)).toBe(false);
  });
});

describe('Test 3 · aria-live behauptet nie fälschlich "Keine Treffer" beim ersten Zeichen', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(async () => {
    await abbauen();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('Begriff MIT Treffern: zu keinem Zeitpunkt steht "Keine Treffer in dieser Fassung."', async () => {
    const ziel = aufbauen();
    await rendern(ziel, { suche: '', markenAusRoh: false });
    expect(ariaLiveText(ziel), 'vor der Suche: gar keine Zeile (reservierter Slot bleibt leer)').toBeNull();

    // Erstes Zeichen — VOR dem Timer-Fortschritt: entweder gar keine Zeile
    // (reservierter Slot bleibt leer, weil `sucheAktiv` noch am alten,
    // leeren `sucheGewertet` hängt) oder — nie — die Falschaussage.
    await rendern(ziel, { suche: BEGRIFF, markenAusRoh: false });
    expect(ariaLiveText(ziel)).not.toBe('Keine Treffer in dieser Fassung.');

    await act(async () => { vi.advanceTimersByTime(0); });
    expect(ariaLiveText(ziel), 'nach dem Timer: die echte Zahl').not.toBeNull();
    expect(ariaLiveText(ziel)).not.toBe('Keine Treffer in dieser Fassung.');
    expect(ariaLiveText(ziel)).toContain(erwaegungsWort(TREFFER.length));
  });

  it('auch bei jedem Zwischenschritt während der Verzögerung steht nie die Falschaussage', async () => {
    const ziel = aufbauen();
    await rendern(ziel, { suche: '', markenAusRoh: false });
    await rendern(ziel, { suche: BEGRIFF, markenAusRoh: false });
    for (let ms = 0; ms <= 200; ms += 20) {
      await act(async () => { vi.advanceTimersByTime(20); });
      expect(ariaLiveText(ziel), `bei t≈${ms + 20} ms`).not.toBe('Keine Treffer in dieser Fassung.');
    }
  });
});
