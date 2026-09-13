import { describe, it, expect, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { LocaleProvider } from '../components/locale';
import { Reiterleiste } from '../components/layout/Reiterleiste';
import { reiterKurzformTeile, reiterKurzformText, type TabEintrag } from '../lib/tabs';

// ── W2·18 Punkt 5 (Fahrplan §4.R) · GESTUTZTE BESCHRIFTUNGEN ────────────────
//
// GEMESSEN 13.9.2026 (Chromium, Dev-Server, 1024 px, sieben Reiter, davon drei
// Instanzen desselben Rechners) — sichtbare Zeichen je Reiter VOR dem Fix:
//   Gebührenverordnung d… · Art. 181 … · ZPO-… · ZPO-Fr… · ZPO-Fr… ·
//   … 146 III 1 · Art. 311 …
// «StGB» und «ZPO» standen auf Breite 0 (der 60-px-Slot der Lesestellung hatte
// das Polster aufgezehrt), und die beiden Instanzen «(2)»/«(3)» waren als
// «ZPO-Fr…» nicht mehr auseinanderzuhalten. NACH dem Fix stehen fünf Reiter
// ungekürzt (ZPO-Fristen · ZPO-Fristen (2) · ZPO-Fristen (3) · BGE 146 III 1 ·
// Art. 311 ZPO), die beiden übrigen im «+2»-Blatt.
//
// Hier gepinnt wird, was ohne Browser prüfbar ist: die Zerlegung (die Nummer
// ist ein eigener, unkürzbarer Teil) und die Klassen im Markup, die den Boden
// tragen. Die Pixelmessung selbst steht im Commit-Text (Screenshots vor/nach).
//
// ROT ZU BEKOMMEN (§6.7, so gefahren): in `lib/tabs.reiterKurzformTeile` die
// Nummer wieder an den Kern hängen (`kern: nr > 1 ? \`${kern} (${nr})\` : kern`,
// ohne `instanz`) und in `reiterleiste/Reiter.tsx` die Aufschrift auf
// `min-w-0` und den Knopf auf `flex min-w-0` zurückstellen.

beforeEach(() => {
  const speicher = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (k: string) => speicher.get(k) ?? null,
    setItem: (k: string, v: string) => void speicher.set(k, v),
    removeItem: (k: string) => void speicher.delete(k),
    clear: () => speicher.clear(),
    key: () => null,
    length: 0,
  } as unknown as Storage;
});

const html = (pfade: string[], url = '/') => {
  localStorage.setItem('lexmetrik-tabs', JSON.stringify(pfade.map((path) => ({ path }))));
  return renderToString(
    <MemoryRouter initialEntries={[url]}>
      <LocaleProvider><Reiterleiste /></LocaleProvider>
    </MemoryRouter>,
  );
};

const t = (path: string): TabEintrag => ({ path });

describe('Reiter-Beschriftung — nichts Unterscheidendes fällt weg (W2·18 Punkt 5)', () => {
  it('die Instanz-Nummer ist ein eigener Teil, nicht das Ende des Kerns', () => {
    const teile = reiterKurzformTeile(t('/rechner/zpo-fristen?r=2'), {});
    expect(teile.kern).not.toContain('(2)');
    expect(teile.instanz).toBe('(2)');
    // Die erste Instanz trägt keine Nummer — und auch kein leeres Feld.
    expect(reiterKurzformTeile(t('/rechner/zpo-fristen'), {}).instanz).toBeUndefined();
  });

  it('der Einzeiler bleibt Zeichen für Zeichen derselbe', () => {
    expect(reiterKurzformText(t('/rechner/zpo-fristen?r=2'), {})).toBe('ZPO-Fristen (2)');
    expect(reiterKurzformText(t('/rechner/zpo-fristen?r=3'), {})).toBe('ZPO-Fristen (3)');
    expect(reiterKurzformText(t('/rechner/zpo-fristen'), {})).toBe('ZPO-Fristen');
  });

  it('zwei Instanzen tragen im Markup zwei verschiedene, unkürzbare Nummern', () => {
    const m = html(['/rechner/zpo-fristen', '/rechner/zpo-fristen?r=2', '/rechner/zpo-fristen?r=3']);
    // DEKLARIERTE SONDEN-ÄNDERUNG (§6.3), W2·18 Welle 3 Punkt 6, 13.9.2026:
    // die Nummer trägt seit diesem Schritt ihren Anker `data-reiter-teil`
    // (Sonden sollen nicht an Tailwind-Deckeln hängen). Rein mechanisch —
    // dieselbe Zusage, dasselbe Element, nur der Markup-Schnipsel wächst um
    // das Attribut.
    expect(m).toContain('<span data-reiter-teil="nummer" class="shrink-0 num">(2)</span>');
    expect(m).toContain('<span data-reiter-teil="nummer" class="shrink-0 num">(3)</span>');
    // Der Accessible Name (Schliess-Knopf) trägt sie unverändert mit.
    expect(m).toContain('Reiter «ZPO-Fristen (2)» schliessen');
    expect(m).toContain('Reiter «ZPO-Fristen (3)» schliessen');
  });

  it('die Aufschrift hat einen Boden, der Knopf gibt ihn weiter', () => {
    const m = html(['/gesetze/bund/OR', '/rechner/zpo-fristen']);
    // Der kürzbare Name darf nicht mehr auf Breite 0 fallen …
    expect(m).toContain('min-w-[6ch] truncate max-w-[15rem]');
    expect(m).not.toContain('min-w-0 truncate max-w-[15rem]');
    // … und der Knopf darf den Boden nicht verschlucken.
    expect(m).not.toContain('flex min-w-0 items-baseline');
    // Der KOPF (das ohnehin gekürzte Gericht) behält sein `min-w-0` und darf
    // weiter ganz weichen (F6) — er steht nur an Entscheid-Reitern und
    // erscheint im SSR ohne Manifest gar nicht, wird hier also nicht gemessen.
  });
});
