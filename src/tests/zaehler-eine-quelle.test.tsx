import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { parseHTML } from 'linkedom';
import { LocaleProvider } from '../components/locale';
import { Abdeckung } from '../pages/Abdeckung';
import { Gesetze } from '../pages/Gesetze';
import { Materialien } from '../pages/Materialien';
import { VorlagenUebersicht } from '../pages/VorlagenUebersicht';
import { Startseite } from '../pages/Startseite';
import { GesetzeBlatt } from '../components/start/GesetzeBlatt';
import { STARTSEITE_ZAEHLER as Z } from '../data/startseiteZaehler.generated';
import { INTERNATIONAL_GRUPPEN } from '../lib/normtext/international-rubriken';

// ─── W2·29-WERKBANK-KATALOGE K5 · EINE ZÄHLQUELLE (§5/§8) ───────────────────
//
// Gemessen 23.9.2026 (Register-Stand 21.9.): dieselbe Sache trug auf drei
// Seiten verschiedene Zahlen.
//   a · /abdeckung zählte zur Laufzeit aus drei Manifesten mit eigener Regel
//       — 6'345 «Entscheide» inkl. 1'252 Verweis-Einträge; /rechtsprechung
//       und die Startseite sagen 5'093 (Nicht-Verweise, `gen:zaehler`).
//   b · /gesetze-Kopf «231 Bundeserlasse · … · 28 Staatsverträge»: die 28
//       SR-0-Staatsverträge steckten in den 231 UND standen daneben — doppelt
//       gezählt; die Säule «Bundesrecht» (Kachel, Tab) schliesst sie aus (203).
//   c · /vorlagen: Kopf «26 Vorlagen», Filter-Fuss «27 verfügbar» — die 27
//       zählte den «Amtlichen Zitierer» (`gerichtszitat`, keine Vorlage) mit,
//       den die Seite gar nicht zeigt.
// ROT ZU BEKOMMEN: in `Abdeckung.tsx` die Manifest-Zählung zurückholen (a),
// im `Gesetze.tsx`-Kopf wieder `gesetzeBundVolltext` einsetzen (b) oder im
// Filter-Fuss von `Katalog.tsx` wieder `verfuegbar.length` zählen (c).

const nf = (n: number) => n.toLocaleString('de-CH');
const html = (url: string, el: React.ReactElement) =>
  renderToString(<MemoryRouter initialEntries={[url]}><LocaleProvider>{el}</LocaleProvider></MemoryRouter>);
const text = (h: string) => parseHTML(`<!doctype html><html><body>${h}</body></html>`).document.body.textContent ?? '';

describe('K5 · eine Zählquelle', () => {
  it('Zähler: Bundesrecht + International = alle Bundeserlasse im Volltext (keine Doppelzählung)', () => {
    expect(Z.gesetzeBundesrechtVolltext + Z.gesetzeInternationalVolltext).toBe(Z.gesetzeBundVolltext);
    expect(Z.gesetzeBundVolltext + Z.gesetzeKantonVolltext).toBe(Z.gesetzeVolltext);
  });

  it('a · /abdeckung zeigt die Zahlen aus STARTSEITE_ZAEHLER, Verweise getrennt', () => {
    const t = text(html('/abdeckung', <Abdeckung />));
    expect(t).toContain(`${nf(Z.rechtsprechungVolltext)} Entscheide`);
    expect(t).toContain(`${nf(Z.rechtsprechungLeitentscheide)} amtliche Leitentscheide (BGE)`);
    expect(t).toContain(`${nf(Z.rechtsprechungVollurteilVerweise)} Verweis-Einträge`);
    expect(t).toContain(`${nf(Z.gesetzeBundesrechtVolltext)} Bundeserlasse`);
    expect(t).toContain(`${nf(Z.gesetzeInternationalVolltext)} Staatsverträge`);
    expect(t).toContain(`${nf(Z.gesetzeKantonVolltext)} kantonalen Erlasse`);
    // REST S2 (25.9.2026, Fachänderung deklariert): Hausbegriffe statt
    // «amtliche Ressourcen» — die Summe steht als Zahl, die Gattungen je mit
    // ihrem Teilzähler (U12), die alte Mischbezeichnung nirgends mehr.
    expect(t).toContain(`${nf(Z.materialien)}Materialien und Erläuterungen`);
    expect(t).toContain(`${nf(Z.materialienGesetzgebung)} Materialien (Gesetzgebung)`);
    expect(t).toContain(`${nf(Z.materialienErlaeuterungen)} Erläuterungen (Verwaltungspraxis)`);
    expect(t).not.toContain('amtliche Ressourcen');
    // Die vermischte Summe (Entscheide + Verweise) steht nirgends mehr.
    expect(t).not.toContain(nf(Z.rechtsprechungVolltext + Z.rechtsprechungVollurteilVerweise));
  });

  it('b · /gesetze-Kopf zählt Bundesrecht, Kantone und Staatsverträge je einmal', () => {
    const t = text(html('/gesetze', <Gesetze />));
    expect(t).toContain(`${nf(Z.gesetzeBundesrechtVolltext)} Bundeserlasse · ${nf(Z.gesetzeKantonVolltext)} Kantonserlasse · ${nf(Z.gesetzeInternationalVolltext)} Staatsverträge im Volltext`);
  });

  // REST S2 (Posten «Materialien-Kopf», 25.9.2026): die Ausgabe-Zeile nannte
  // die Summe «Publikationen der Bundesbehörden» — falsch, der Bestand trägt
  // kantonale Parlamentsgeschäfte und die Materialien der Gesetzgebung.
  // ROT ZU BEKOMMEN: in `Materialien.tsx` die alte Ausgabe-Zeile zurückholen.
  it('b2 · /materialien-Kopf zählt Gesetzgebung und Verwaltungspraxis getrennt', () => {
    const { document } = parseHTML(`<!doctype html><html><body>${html('/materialien', <Materialien />)}</body></html>`);
    const ausgabe = document.querySelector('.ub-ausgabe')?.textContent ?? '';
    expect(ausgabe).toBe(`${nf(Z.materialienGesetzgebung)} Materialien (Gesetzgebung) · ${nf(Z.materialienErlaeuterungen)} Erläuterungen (Verwaltungspraxis), bibliografisch mit Live-Link`);
    expect(ausgabe).not.toContain('Bundesbehörden');
  });

  it('c · /vorlagen: Filter-Fuss zählt, was die Seite zeigt (= Kopf)', () => {
    const h = html('/vorlagen', <VorlagenUebersicht />);
    const { document } = parseHTML(`<!doctype html><html><body>${h}</body></html>`);
    const fuss = document.querySelector('#vorlagen-filter-scope-vorlagen')?.textContent ?? '';
    expect(fuss).toContain(`${Z.vorlagen} verfügbar`);
    expect(text(h)).toContain(`${Z.vorlagen} Vorlagen`);
    // Die Seite zeigt genau so viele verlinkte Vorlagen-Zeilen.
    const zeilen = new Set([...document.querySelectorAll('#register-vorlagen a[href^="/vorlagen/"]')]
      .map((a) => a.getAttribute('href')));
    expect(zeilen.size).toBe(Z.vorlagen);
  });
});

// ─── K7 · Startseite: vier Rubrik-Kacheln aus derselben Zählquelle ──────────
//
// Gemessen 23.9.2026 (K5-Nebenfund): der Fuss des Moduls «Bundesrecht,
// systematische Ordnung» sagte «erfasste Volltext (231 Erlasse)» — die 231
// schliessen die 28 SR-0-Staatsverträge ein (sechste Zeile «Internationales
// Recht»), die Überschrift sagt «Bundesrecht» (203). Dieselbe Mischung, die K5
// im /gesetze-Kopf behoben hat. ROT ZU BEKOMMEN: im Fuss von
// `start/SystematikListe.tsx` wieder `gesetzeBundVolltext` allein nennen, oder
// eine Kachel ihre Zahl anders als aus `STARTSEITE_ZAEHLER` beziehen.
describe('K7 · Startseite zählt aus derselben Quelle', () => {
  const h = html('/', <Startseite />);
  const { document } = parseHTML(`<!doctype html><html><body>${h}</body></html>`);

  // DEKLARIERTE ANPASSUNG (W2·29-WERKBANK-START S1–S3, §6.3): die Kacheln
  // klappen vor Ort auf und sind darum KNÖPFE (`aria-controls` aufs selbe
  // Blatt) — S1 Gesetze, S2 Werkzeuge (23.9.2026), S3 Materialien und
  // Rechtsprechung (23./24.9.2026, Entscheid David «Beim Öffnen laden»).
  // Zahl und Unterzeile werden unverändert an allen vier geprüft.
  it('d · vier Rubrik-Kacheln, Zahl und Unterzeile aus dem Zähler', () => {
    const nav = document.querySelector('nav[aria-label="Bereiche der Sammlung"]');
    const kacheln = [...(nav?.querySelectorAll('a, button') ?? [])];
    expect(kacheln.map((a) => a.getAttribute('href') ?? a.getAttribute('aria-controls')))
      .toEqual(['lm-start-blatt', 'lm-start-blatt', 'lm-start-blatt', 'lm-start-blatt']);
    const [g, r, m, w] = kacheln.map((a) => a.textContent ?? '');
    expect(g).toContain(nf(Z.gesetzeVolltext));
    expect(g).toContain(`${nf(Z.gesetzeBundesrechtVolltext)} Bundeserlasse · ${nf(Z.gesetzeKantonVolltext)} Kantonserlasse · ${nf(Z.gesetzeInternationalVolltext)} Staatsverträge`);
    expect(r).toContain(`${nf(Z.rechtsprechungVolltext)}Entscheide im Volltext`);
    // DEKLARIERTE ANPASSUNG U12 (David 24.9.2026, «materialien soll
    // erläuterungen und materialien enthalten», §6.3): die Einheit hiess
    // «amtliche Materialien erfasst» und mischte die Hausbegriffe; jetzt nennt
    // sie beide Gattungen, und die Teile schlüsseln die Zahl auf. Summe der
    // Teile = Kachelzahl (Zuordnung `lib/materialien/gattung.ts`). ROT ZU
    // BEKOMMEN: im Generator eine Gattung anders als über `gattungVon` zählen.
    expect(m).toContain(`${nf(Z.materialien)}Materialien und Erläuterungen erfasst`);
    expect(Z.materialienGesetzgebung + Z.materialienErlaeuterungen).toBe(Z.materialien);
    expect(Z.materialienGesetzgebung).toBeGreaterThan(0);
    expect(Z.materialienErlaeuterungen).toBeGreaterThan(0);
    expect(m).toContain(`${nf(Z.materialienGesetzgebung)} Materialien (Gesetzgebung) · ${nf(Z.materialienErlaeuterungen)} Erläuterungen (Verwaltungspraxis)`);
    expect(w).toContain(nf(Z.rechner + Z.vorlagen));
    expect(w).toContain(`${nf(Z.rechner)} Rechner · ${nf(Z.vorlagen)} Vorlagen`);
    // Kein Link im Link: die Kachel ist selbst der eine Link bzw. Knopf.
    for (const a of kacheln) expect(a.querySelector('a, button')).toBeNull();
  });

  // DEKLARIERTE ANPASSUNG (W2·29-WERKBANK-START S1, §6.3): der Systematik-Fuss
  // steht jetzt in der Stufe «Bund» der Gesetze-Kachel. Das internationale
  // Recht ist dort keine sechste Zeile mehr, sondern die dritte Wahl neben
  // Bund und Kantone (Auswahlfrage David 23.9.2026) — der Fuss nennt darum NUR
  // das Bundesrecht. Der Prüfpunkt (keine Mischzahl 231) bleibt scharf.
  it('e · Bund-Stufe: Fuss nennt das Bundesrecht, Summe = Zeilen, keine Mischzahl', () => {
    expect(Z.bundSystematik.reduce((s, k) => s + k.anzahl, 0)).toBe(Z.gesetzeBundesrechtVolltext);
    const t = text(html('/', <GesetzeBlatt ort={{ rubrik: 'gesetze', pfad: ['bund'] }} gehe={() => {}} />));
    expect(t).toContain(`erfasste Volltext (${nf(Z.gesetzeBundesrechtVolltext)} Erlasse des Bundesrechts)`);
    expect(t).not.toContain(`(${nf(Z.gesetzeBundVolltext)} Erlasse)`);
    for (const k of Z.bundSystematik) expect(t).toContain(k.titel);
  });

  // START-UEBERARBEITUNG U1 (David 24.9.2026, «Drei hohe Spalten»): die
  // Wahl-Stufe zeigt die nächste Stufe schon an — jede Zahl aus dem Zähler,
  // keine Rubrik vergessen, kein Knopf im Knopf. ROT ZU BEKOMMEN: eine Zeile
  // mit eigener Zahl statt `Z.bundSystematik[].anzahl`, eine International-
  // Rubrik aus der Liste nehmen, oder die Spalte selbst zum Knopf machen.
  it('f · Wahl-Stufe: drei Spalten, Zeilen aus dem Zähler, alle Rubriken, kein Knopf im Knopf', () => {
    const h = html('/', <GesetzeBlatt ort={{ rubrik: 'gesetze', pfad: [] }} gehe={() => {}} />);
    const { document } = parseHTML(`<!doctype html><html><body>${h}</body></html>`);
    const knoepfe = [...document.querySelectorAll('button')];
    for (const b of knoepfe) expect(b.querySelector('a, button')).toBeNull();
    const knopfText = knoepfe.map((b) => (b.textContent ?? '').replace(/\s+/g, ' ').trim());
    // S5c (§6.3, deklariert, Entscheid David 25.9.2026 «wie empfohlen»):
    // Einheit «Erlasse» statt «Bundeserlasse»/«kantonale Erlasse» — die Ebene
    // steht als Titel im selben Knopf. Vorher (bis S5b):
    // `…BundeserlasseBund`, `…kantonale ErlasseKantone`.
    expect(knopfText).toContain(`${nf(Z.gesetzeBundesrechtVolltext)}ErlasseBund`);
    expect(knopfText).toContain(`${nf(Z.gesetzeKantonVolltext)}ErlasseKantone`);
    expect(knopfText).toContain(`${nf(Z.gesetzeInternationalVolltext)}StaatsverträgeInternational`);
    const gebiete = document.querySelector('ul[aria-label="Rechtsgebiete des Bundes"]');
    const zeilen = [...(gebiete?.querySelectorAll('button') ?? [])].map((b) => b.textContent);
    expect(zeilen).toEqual(Z.bundSystematik.map((g) => `${g.nr}${g.titel}${nf(g.anzahl)}`));
    const rubriken = [...(document.querySelector('ul[aria-label="Rubriken des internationalen Rechts"]')?.querySelectorAll('button') ?? [])];
    expect(rubriken.map((b) => b.getAttribute('title') ?? b.textContent)).toEqual(INTERNATIONAL_GRUPPEN.map((g) => g.titel));
    // Die Karte ist da (Kantone direkt wählbar), plus der Weg zur Liste der 26.
    expect(document.querySelector('svg[aria-label^="Karte der Schweizer Kantone"]')).not.toBeNull();
    expect(knopfText.some((t) => t.startsWith('Alle 26 Kantone'))).toBe(true);
  });
});
