import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { SucheLeerzustand } from '../components/suche/SucheLeerzustand';
import type { ZuletztEintrag } from '../lib/zuletztVerwendet';

// «Verlauf leeren» im Such-Leerzustand (W2·31 P3, 30.9.2026).
//
// Der Topbar-Verlauf fehlt unter 481 px und bei grosser Schrift bis ~570 px
// (`.lc-topbar-verlauf`, index.css); die Liste blieb über die leere Suche sichtbar,
// das Leeren war dort unerreichbar. Der Knopf (`layout/VerlaufLeerenKnopf`) steht
// jetzt auch im Leerzustand. Geprüft wird die STRUKTUR, die ein Browser-Test nur
// indirekt sieht: (1) mit Verlauf ist der Knopf da, ohne Verlauf nicht («Noch nichts
// geöffnet» hat nichts zu leeren); (2) der Knopf ist GESCHWISTER der Listbox, nicht
// ihr Kind — ein Knopf in `role="listbox"` ist kein erlaubtes Kind (axe
// `aria-required-children`) und stünde in der Scroll-Kappung; (3) es gibt genau
// EINE Lösch-Logik: die Komponente ruft `leereZuletzt` nicht selbst auf, sie nimmt
// den Baustein (Quellsonde). Das Klick-Verhalten samt Fokus-Rückgabe prüft
// `e2e/verlauf-o1.e2e.ts`.

const EINTRAG: ZuletztEintrag = { route: '/rechner/verjaehrung', titel: 'Verjährung', typ: 'rechner', zeit: 1 };

const render = (verlauf: ZuletztEintrag[]) =>
  renderToString(<SucheLeerzustand verlauf={verlauf} listboxId="lb" onNavigate={() => {}} />);

describe('SucheLeerzustand — «Verlauf leeren» (W2·31 P3)', () => {
  it('mit Verlauf: Knopf da, als Geschwister der Listbox (nicht in ihr)', () => {
    const html = render([EINTRAG]);
    expect(html).toContain('Verlauf leeren');
    const ulEnde = html.indexOf('</ul>');
    const knopf = html.indexOf('Verlauf leeren');
    expect(ulEnde).toBeGreaterThan(-1);
    expect(knopf).toBeGreaterThan(ulEnde);
    // Zwischen dem Listenende und dem Knopf schliesst die Listbox (`</div>`).
    expect(html.slice(ulEnde, knopf)).toContain('</div>');
    // …und das Etikett «Nur auf diesem Gerät» (§8) steht weiter daneben.
    expect(html).toContain('Nur auf diesem Gerät');
  });

  it('ohne Verlauf: «Noch nichts geöffnet», kein Knopf, keine Fussnote', () => {
    const html = render([]);
    expect(html).toContain('Noch nichts geöffnet.');
    expect(html).not.toContain('Verlauf leeren');
    expect(html).not.toContain('Nur auf diesem Gerät');
  });

  it('eine Lösch-Logik: Leerzustand UND Flyout nehmen den Baustein, keiner ruft leereZuletzt selbst', () => {
    for (const datei of ['src/components/suche/SucheLeerzustand.tsx', 'src/components/layout/VerlaufUebersicht.tsx']) {
      const quelle = readFileSync(datei, 'utf8');
      expect(quelle, `${datei} nimmt VerlaufLeerenKnopf`).toMatch(/<VerlaufLeerenKnopf\b/);
      expect(quelle, `${datei} ruft leereZuletzt nicht selbst auf`).not.toMatch(/\bleereZuletzt\b/);
    }
    expect(readFileSync('src/components/layout/VerlaufLeerenKnopf.tsx', 'utf8')).toMatch(/\bleereZuletzt\(\)/);
  });
});
