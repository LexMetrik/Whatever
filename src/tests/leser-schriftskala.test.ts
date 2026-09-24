// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// ─── LESER-SCHRIFTSKALA (David-Anmerkung 16.8.2026, Punkt 4) ─────────────────
//
// Geprüft wird der VERTRAG des Stufen-Feldes im geteilten Leser-Store, nicht die
// Darstellung: Persistenz, Whitelist beim Laden, Round-Trip und das Attribut am
// <html>. Dass die Stufe wirklich NUR den Normtext vergrössert und Kopfzeile wie
// Seitenleiste stehen lässt, beweist die Browser-Spec
// `e2e/leser-v3-schriftskala.e2e.ts` — das kann ohne echtes CSS niemand messen.
//
// Kein jsdom im Projekt (vite.config.ts: environment 'node'), darum werden
// `localStorage`/`window`/`document` minimal nachgebaut. Der Store liest den
// Speicher beim MODUL-Laden (`const start = … lade()`), deshalb steht vor jedem
// Fall ein `vi.resetModules()` + frischer dynamischer Import — sonst prüfte man
// den Zustand des vorherigen Falls.
//
// ROT ZU BEKOMMEN (§6.7): in `leserOptionen.ts` die Whitelist-Prüfung durch
// `const schrift = o.schrift as LeserSchrift` ersetzen (Fall «unbekannter Wert»
// und «Zahl» werden rot), `schrift: aktuellSchrift` aus `speichere()` entfernen
// (Round-Trip rot), oder in `index.css` einen der drei rem-Werte ändern
// (Spiegel-Fall rot).

interface FakeEl { attrs: Record<string, string>; setAttribute(k: string, v: string): void }

function baueUmgebung(gespeichert: string | null): { el: FakeEl; speicher: Map<string, string> } {
  const speicher = new Map<string, string>();
  if (gespeichert !== null) speicher.set('lm.leser.optionen', gespeichert);
  const ls = {
    getItem: (k: string) => speicher.get(k) ?? null,
    setItem: (k: string, v: string) => { speicher.set(k, v); },
    removeItem: (k: string) => { speicher.delete(k); },
  };
  const el: FakeEl = { attrs: {}, setAttribute(k, v) { this.attrs[k] = v; } };
  vi.stubGlobal('localStorage', ls);
  vi.stubGlobal('window', { localStorage: ls, addEventListener: () => {} });
  vi.stubGlobal('document', { documentElement: el });
  return { el, speicher };
}

async function ladeStore(gespeichert: string | null) {
  vi.resetModules();
  const umgebung = baueUmgebung(gespeichert);
  const optionen = await import('../pages/gesetz-leser/leserOptionen');
  const schrift = await import('../pages/gesetz-leser/leserSchrift');
  return { ...umgebung, optionen, schrift };
}

beforeEach(() => { vi.unstubAllGlobals(); });

describe('Leser-Schriftskala — Persistenz und Migration', () => {
  it('fehlendes Feld ⇒ Vorgabestufe «normal» (Bestands-Speicher vor dieser Änderung)', async () => {
    // Genau der Speicher, den jeder heutige Nutzer hat: Toggles und Bezugs-
    // Felder, aber kein `schrift`. Er darf weder werfen noch eine Stufe erfinden.
    const alt = JSON.stringify({ fussnoten: 'aus', verweise: 'an', leitfaelle: 'an', hist: 'chronologie' });
    const { optionen, el } = await ladeStore(alt);
    optionen.wendeLeserOptionenAn();
    expect(el.attrs['data-leserschrift']).toBe('normal');
    // Die anderen Felder desselben Speichers bleiben unberührt — der neue
    // Schlüssel darf keinen Alt-Zustand überschreiben (§8).
    // S1 (deklarierte fachliche Änderung, §6.3): 'chronologie' bedeutete
    // «Vermerke sichtbar» und migriert darum nie auf «aus» — der Nutzer hatte
    // sie ausdrücklich bestellt (§8).
    // D35-F3 (deklarierte fachliche Änderung, §6.3, Entscheid David 7.9.2026):
    // `data-fussnoten`/`data-histansicht` sind zu EINEM `data-vermerke`
    // geworden. «Vermerke sichtbar» ist dort die Stellung «fassung»; das
    // abgewählte `fussnoten` spielt in diesem Zweig keine Rolle mehr, weil es
    // den Apparat-Schalter nicht mehr gibt. Die Migrations-Regeln selbst stehen
    // unter `src/tests/leser-optionen-migration.test.ts`; hier zählt nur, dass
    // der Schrift-Schlüssel sie nicht stört.
    // §6.3-DEKLARATION (S6 W1f, 24.9.2026): die Stellung «fassung» ist gefallen
    // (Entscheid David 24.9.2026, Funktionszeile aufgelöst) und migriert auf
    // «aus» — dieselbe Fussnoten-Sicht (`leserOptionen.aufZweiwertig`).
    expect(el.attrs['data-vermerke']).toBe('aus');
  });

  it('unbekannter Wert ⇒ Vorgabestufe (nicht durchgereicht)', async () => {
    // Der gefährliche Fall: ein Wort, das es NIE gab (Alt-Skala, fremder Tab,
    // manipulierter Speicher). Durchgereicht landete es als
    // `data-leserschrift="riesig"` am <html>, wo keine Regel greift — der Nutzer
    // sähe eine Stufe, die es nicht gibt, und der Regler stünde falsch.
    const { optionen, el } = await ladeStore(JSON.stringify({ schrift: 'riesig' }));
    optionen.wendeLeserOptionenAn();
    expect(el.attrs['data-leserschrift']).toBe('normal');
  });

  it('falscher Typ und kaputter Speicher ⇒ Vorgabestufe, kein Wurf', async () => {
    for (const roh of [JSON.stringify({ schrift: 1.25 }), JSON.stringify({ schrift: null }), '{kein json']) {
      const { optionen, el } = await ladeStore(roh);
      expect(() => optionen.wendeLeserOptionenAn()).not.toThrow();
      expect(el.attrs['data-leserschrift'], `Speicher: ${roh}`).toBe('normal');
    }
  });

  it('jede der vier Stufen wird gelesen und ans <html> geschrieben', async () => {
    for (const stufe of ['normal', 'mittel', 'gross', 'sehr-gross'] as const) {
      const { optionen, el } = await ladeStore(JSON.stringify({ schrift: stufe }));
      optionen.wendeLeserOptionenAn();
      expect(el.attrs['data-leserschrift']).toBe(stufe);
    }
  });

  it('Round-Trip: setzen ⇒ speichern ⇒ neu laden ergibt dieselbe Stufe', async () => {
    const a = await ladeStore(null);
    a.optionen.setzeLeserSchrift('gross');
    expect(a.el.attrs['data-leserschrift']).toBe('gross');
    const geschrieben = a.speicher.get('lm.leser.optionen');
    expect(geschrieben, 'nichts geschrieben').toBeTruthy();
    expect(JSON.parse(geschrieben!).schrift).toBe('gross');

    const b = await ladeStore(geschrieben!);
    b.optionen.wendeLeserOptionenAn();
    expect(b.el.attrs['data-leserschrift']).toBe('gross');
  });

  it('Setzen lässt die übrigen Store-Felder unangetastet (EIN Speicher, §5)', async () => {
    const vorher = JSON.stringify({ fussnoten: 'aus', verweise: 'aus', leitfaelle: 'an', hist: 'aus', bezugKantone: ['BS'] });
    const { optionen, speicher } = await ladeStore(vorher);
    optionen.setzeLeserSchrift('sehr-gross');
    const o = JSON.parse(speicher.get('lm.leser.optionen')!);
    expect(o.schrift).toBe('sehr-gross');
    // §6.3-DEKLARATION (D35-F2, 7.9.2026): hier stand `o.leitfaelle === 'an'`.
    // Das Feld ist ersatzlos gestrichen (`leserOptionen.ts`) und wird beim
    // Schreiben abgeräumt wie jeder Alt-Schlüssel. Die Aussage des Falls — der
    // Schrift-Setzer rührt die FREMDEN Felder desselben Speichers nicht an —
    // steht unverändert, jetzt am nachgerückten Feld.
    // §6.3-DEKLARATION (D40, 7.9.2026): der Grundzustand trägt die sechste
    // Rubrik `f` (Fassung in der Funktionszeile). Die Aussage bleibt: der
    // Schrift-Setzer rührt das fremde Feld nicht an.
    // §6.3-DEKLARATION (S6 W1f, 24.9.2026): `fussRubriken` ist gestrichen
    // (Funktionszeile aufgelöst) — es wird beim Schreiben abgeräumt wie jeder
    // Alt-Schlüssel; die Aussage des Falls trägt `bezugKantone` darunter.
    expect(o).not.toHaveProperty('fussRubriken');
    expect(o.bezugKantone).toEqual(['BS']);
    // S1 (deklarierte fachliche Änderung, §6.3): `hist: 'aus'` stand als
    // `histansicht: 'aus'` im neuen Speicher — die Nutzerwahl erhalten, nur
    // unter neuem Schlüssel.
    // D35-F3 (deklarierte fachliche Änderung, §6.3, Entscheid David 7.9.2026):
    // dieselbe Wahl trägt jetzt EIN Feld. `fussnoten:'aus'` + `hist:'aus'` ist
    // Zeile 4 der Entscheid-Tabelle und landet auf «aus» — die Nutzerwahl bleibt
    // erhalten, sie heisst nur anders (Tabelle in `leserOptionen.ts`).
    expect(o.vermerke).toBe('aus');
    // Die gestrichenen Schlüssel werden beim Schreiben ABGERÄUMT (dieselbe
    // Mechanik wie `linien` und `zeitraum`): ein weitergeschleppter Alt-Wert
    // liesse die Migration bei jedem Laden neu greifen.
    expect(o.hist).toBeUndefined();
    expect(o.verweise).toBeUndefined();
    expect(o.fussnoten).toBeUndefined();
    expect(o.histansicht).toBeUndefined();
  });

  it('dieselbe Stufe noch einmal setzen weckt die Hörer NICHT (§15)', async () => {
    const { optionen } = await ladeStore(JSON.stringify({ schrift: 'mittel' }));
    // `setzeLeserSchrift` steigt bei Gleichheit früh aus; ein Re-Render der
    // Regler-Knöpfe bei einem Klick, der nichts ändert, wäre der Anfang genau
    // der Rendering-Kaskade, die der Store vermeidet.
    const el = (globalThis as unknown as { document: { documentElement: FakeEl } }).document.documentElement;
    el.attrs['data-leserschrift'] = 'MARKE';
    optionen.setzeLeserSchrift('mittel');
    expect(el.attrs['data-leserschrift']).toBe('MARKE');
  });
});

describe('Leser-Schriftskala — Regler', () => {
  it('Anschläge: «normal» kann nicht kleiner, «sehr-gross» nicht grösser', async () => {
    const { schrift } = await ladeStore(null);
    expect(schrift.nachbarStufe('normal', -1)).toBe('normal');
    expect(schrift.nachbarStufe('sehr-gross', 1)).toBe('sehr-gross');
    expect(schrift.nachbarStufe('normal', 1)).toBe('mittel');
    expect(schrift.nachbarStufe('sehr-gross', -1)).toBe('gross');
  });

  it('Hoch und wieder runter landet exakt auf der Ausgangsstufe', async () => {
    const { schrift, optionen } = await ladeStore(null);
    for (const s of optionen.SCHRIFT_STUFEN) {
      expect(schrift.nachbarStufe(schrift.nachbarStufe(s, 1), -1)).toBe(s === 'sehr-gross' ? 'gross' : s);
    }
  });

  it('Anzeigewert: die Vorgabestufe zeigt 100 %, die Skala steigt streng monoton', async () => {
    const { schrift, optionen } = await ladeStore(null);
    expect(schrift.schriftProzent('normal')).toBe(100);
    const werte = optionen.SCHRIFT_STUFEN.map((s) => schrift.schriftProzent(s));
    // S2 · A-1 (DEKLARIERTE fachliche Änderung, §6.3 — kein Refactoring): die
    // Skala lief auf [100, 111, 122, 133] (absolute rem-Werte 1.125/1.25/1.375/
    // 1.5). Sie liegt jetzt auf den FAKTOREN der Design-Grundlage Kap. 2.3
    // ([1.0, 1.08, 1.18, 1.3], Entscheid D-A), was erst mit S2 möglich wurde:
    // bis dahin hing die Vorgabestufe am site-weiten `body-l`, und H1/H2 mussten
    // den Normtext byte-gleich halten. Mit der eigenen Leser-Stufe `leser-text`
    // (F3 = V2, David 17.8.2026) hat der Regler eine eigene Basis.
    expect(werte).toEqual([100, 108, 118, 130]);
    for (let i = 1; i < werte.length; i++) expect(werte[i]).toBeGreaterThan(werte[i - 1]);
  });
});

describe('Leser-Schriftskala — Treue-Grenze und §5-Spiegel', () => {
  it('die Vorgabestufe ist die Fliesstext-Stufe selbst — aus tailwind.config.js gelesen, nicht abgeschrieben', async () => {
    const { schrift } = await ladeStore(null);
    // S2 (DEKLARIERTE fachliche Änderung, §6.3): der Wert war 1.125 rem
    // (`text-body-l`); F3 = V2 (David 17.8.2026) setzt den Leser-Fliesstext auf
    // `leser-text` = 1.0625 rem.
    //
    // VERSCHÄRFUNG statt bloss neuer Zahl: bisher stand hier eine ABGESCHRIEBENE
    // Konstante — der Test hätte nicht gemerkt, wenn `leser-text` in
    // tailwind.config.js wandert und der Regler auf der alten Basis sitzenbleibt
    // (die Vorgabestufe zeigte dann «100 %», während der Normtext eine andere
    // Grösse trägt). Der Wert wird darum aus der Config GELESEN. §5: eine Quelle.
    const cfg = readFileSync(fileURLToPath(new URL('../../tailwind.config.js', import.meta.url)), 'utf8');
    const stufe = /'leser-text':\s*\[\s*'([0-9.]+)rem'/.exec(cfg);
    expect(stufe, 'Stufe «leser-text» steht nicht mehr in tailwind.config.js').not.toBeNull();
    expect(schrift.SCHRIFT_REM.normal, 'Regler-Basis und Fliesstext-Stufe laufen auseinander (§5)')
      .toBe(Number(stufe![1]));
    // W2·24-R6c (6.9.2026): 1.0625 → 1.125 — DEKLARIERTE fachliche Änderung
    // (§6.3) nach D20 (c) «Lesetext 18 px». Die Verschärfung darüber (Wert aus
    // der Config GELESEN statt abgeschrieben) bleibt unberührt; diese Zeile ist
    // die zweite Klammer, die verhindert, dass beide Orte GEMEINSAM wandern.
    expect(schrift.SCHRIFT_REM.normal).toBe(1.125);
  });

  it('«normal» ist aus dem CSS-Selektor ausgenommen ⇒ keine Regel im Grundzustand (R6)', () => {
    const css = readFileSync(fileURLToPath(new URL('../index.css', import.meta.url)), 'utf8');
    // Der Selektor MUSS die Vorgabestufe ausschliessen. Ohne das `:not()` würde
    // auch im Grundzustand eine font-size-Deklaration emittiert — rechnerisch
    // derselbe Wert, aber die Zusage «Vorgabestufe rührt den Normtext nicht an»
    // wäre nur noch behauptet statt konstruktiv erzwungen (§6).
    expect(css).toContain('html[data-leserschrift]:not([data-leserschrift="normal"]) .lc-leser[data-leser-v3="rahmen"] .nt-art-cv [data-lese]');
    expect(css).not.toMatch(/html\[data-leserschrift="normal"\]\s*\{[^}]*--lm-leser-schrift/);
  });

  it('S2-WURZELFIX: der Selektor hängt an einem Daten-Attribut, nie an einem Grössen-Utility', () => {
    const css = readFileSync(fileURLToPath(new URL('../index.css', import.meta.url)), 'utf8');
    // DER BEFUND (S2, 17.8.2026): der Selektor endete auf `.text-body-l` — den
    // Utility-Klassennamen der DAMALIGEN Fliesstext-Stufe. S2 tauscht die Stufe
    // auf `text-leser-text`; die Regel hätte danach STILL nichts mehr getroffen,
    // der Schriftgrössen-Regler wäre wirkungslos geworden, und KEIN Tor hätte es
    // gemeldet — genau die Klasse «Tor, das nicht scheitern kann» (§6.7). Ein
    // Utility-Name ist kein Vertrag: er wechselt mit jeder Grössen-Entscheidung.
    // Der Selektor hängt darum an `[data-lese]`, dem Attribut, das `ArtikelBody`
    // auf DEMSELBEN Element setzt, das die Grössen-Klasse trägt.
    //
    // Dieser Fall bewacht die Lehre gegen die Rückkehr: er scheitert, sobald ein
    // Grössen-Utility zurück in den Selektor wandert — auch unter einem anderen
    // Namen als dem alten.
    const cssOhneKommentare = css.replace(/\/\*[\s\S]*?\*\//g, '');
    const eintrag = [...cssOhneKommentare.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      .find(([, sel, koerper]) => sel.includes('data-leserschrift') && /font-size/.test(koerper));
    expect(eintrag, 'keine font-size-Regel der Schriftskala gefunden').toBeTruthy();
    const selektorZeile = eintrag![1].split('\n').pop()!.trim();
    expect(selektorZeile, 'Schriftskala hängt wieder an einem text-*-Utility statt an [data-lese]')
      .not.toMatch(/\.text-[a-z0-9-]/);
    expect(selektorZeile).toContain('[data-lese]');
  });

  it('die rem-Werte in index.css und SCHRIFT_REM stimmen überein', async () => {
    const { schrift } = await ladeStore(null);
    const css = readFileSync(fileURLToPath(new URL('../index.css', import.meta.url)), 'utf8');
    for (const stufe of ['mittel', 'gross', 'sehr-gross'] as const) {
      const treffer = new RegExp(`html\\[data-leserschrift="${stufe}"\\][^{]*\\{[^}]*--lm-leser-schrift:\\s*([0-9.]+)rem`)
        .exec(css);
      expect(treffer, `keine CSS-Regel für Stufe «${stufe}»`).not.toBeNull();
      expect(Number(treffer![1]), `Stufe «${stufe}»: CSS und SCHRIFT_REM laufen auseinander`)
        .toBe(schrift.SCHRIFT_REM[stufe]);
    }
  });

  it('die Regel ist auf den Normtext gescopt — nicht auf <html> und nicht auf die Hülle', () => {
    const css = readFileSync(fileURLToPath(new URL('../index.css', import.meta.url)), 'utf8');
    // DER Befund vom 16.8.2026: der alte Regler setzte `font-size` am <html>,
    // worauf die Kopfzeile mitwuchs (gemessen 16 px → 20.8 px). Genau das darf
    // hier nicht zurückkommen: JEDE Regel dieser Skala, die eine Schriftgrösse
    // setzt, muss bis in die Artikel-Hülle `.nt-art-cv` hinein gescopt sein.
    // Ohne Vorkommen wäre der Fall stumm grün — darum wird auch gezählt.
    let gepruefte = 0;
    for (const [, selektor, koerper] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (!selektor.includes('data-leserschrift')) continue;
      if (!/font-size/.test(koerper)) continue;
      gepruefte++;
      expect(selektor.trim(), 'Schriftskala setzt font-size ausserhalb des Normtext-Scopes')
        .toContain('.nt-art-cv');
    }
    expect(gepruefte, 'keine font-size-Regel der Schriftskala gefunden').toBe(1);
  });

  it('FL-4-NACHZUG (Pruefer-Befund PR #539): die Regel ist konstruktiv auf die V3-Huelle beschraenkt — .lc-leser allein (V1) darf NIE treffen', () => {
    const css = readFileSync(fileURLToPath(new URL('../index.css', import.meta.url)), 'utf8');
    // Befund: `data-leserschrift` wird global am <html> gesetzt, unabhaengig von
    // der aktiven Huelle. `.lc-leser` traegt sowohl V1 als auch V3 — ohne
    // zusaetzlichen Scope waere die vergroesserte Stufe in V1 sichtbar UND dort
    // nicht zurueckstellbar (V1 hat keinen Regler). Der Selektor muss darum das
    // V3-Root-Attribut `data-leser-v3="rahmen"` tragen — direkt auf `.lc-leser`
    // (LeserRahmenV3.tsx setzt beide Attribute auf demselben Element, nicht auf
    // Vorfahre/Nachfahre getrennt).
    // Kommentare zuerst raus — sonst faengt der Selektor-Scan versehentlich
    // erlaeuternden Kommentartext vor der Regel mit ein (der auch das gesuchte
    // Attribut als Prosa erwaehnen darf, ohne dass die Regel es tatsaechlich hat).
    const cssOhneKommentare = css.replace(/\/\*[\s\S]*?\*\//g, '');
    const eintrag = [...cssOhneKommentare.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      .find(([, sel, koerper]) => sel.includes('data-leserschrift') && /font-size/.test(koerper));
    const treffer = eintrag?.[1].trim();
    expect(treffer, 'keine font-size-Regel der Schriftskala gefunden').toBeTruthy();
    // Die letzte Zeile (unmittelbar vor `{`) ist der tatsaechliche Selektor —
    // vorangehende Regeln derselben Fund-Passage (leere Zeilen, andere Deklarationen
    // im gleichen Kommentar-freien Block) faellen sonst mit ins `sel.includes`.
    const selektorZeile = treffer!.split('\n').pop()!.trim();
    expect(selektorZeile, 'Regel fehlt der V3-Scope [data-leser-v3="rahmen"] — sie traefe auch V1')
      .toContain('[data-leser-v3="rahmen"]');
    // Die Regel muss den Scope UNMITTELBAR an `.lc-leser` haengen (kombiniert,
    // kein Nachfahre-Leerzeichen dazwischen) — sonst gaebe es einen zweiten Weg,
    // ueber den ein `.lc-leser`-Element OHNE das V3-Attribut doch getroffen wird.
    expect(selektorZeile, 'Scope muss direkt an .lc-leser haengen, nicht als Nachfahre')
      .toContain('.lc-leser[data-leser-v3="rahmen"]');
  });
});
