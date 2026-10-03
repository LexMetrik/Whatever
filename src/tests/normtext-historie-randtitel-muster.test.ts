/**
 * W2·27-BUND-FERTIG — Nachzug 2 (Delta-Gegenprüfung #1298, Auflage 2, §6.7): Erkennung der Randtitel-«Ausdruck»-Ausnahme.
 *
 * `ausdruckFussnote` (src/lib/normtext/historie-randtitel.ts) entscheidet, ob eine Fussnote an einem Randtitel mit
 * Gliederungszeichen ein Ersatz von Ausdrücken ist (Körper mit angefasst ⇒ «Gilt seit» bleibt). Vorher gab es drei Muster
 * («^Ausdruck gemäss» und zwei «Diese Änd. …»-Zusätze); jedes einzelne liess sich streichen, ohne dass ein Test rot wurde.
 * Messung 3.10.2026 (`npm run historie:vergleich -- --muster`, 31 394 Fussnoten): die Zusätze stehen an Randtiteln mit
 * Gliederungszeichen 5- bzw. 6-mal, jedes Mal hinter «Ausdruck gemäss» — kein Fall, in dem ein Zusatz allein trägt. Beide
 * Zusatz-Muster sind darum gestrichen (§17 Rückbau); der Korpus-Test unten ist der Tripwire, der sie bei Bedarf zurückruft.
 *
 * Fixture-Wortlaut ist wörtlich aus den Struktur-Sidecars (`public/normtext/struktur/bund/<ERLASS>.json`, Artikel-Token,
 * Fussnote mit `sektion` = Randtitel/Überschrift) — der Test prüft die Identität gegen die committete Datei.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { ausdruckFussnote, randtitelMitAufzaehler, randtitelNurRandtitel } from '../lib/normtext/historie-randtitel';

const STRUKTUR = 'public/normtext/struktur/bund';

interface SidecarFn { nr?: string; text?: string; sektion?: string | null; links?: Array<{ url: string }> }
const sidecar = (erlass: string) => JSON.parse(readFileSync(`${STRUKTUR}/${erlass}.json`, 'utf8')) as { artikel: Record<string, { fussnoten?: SidecarFn[] }> };
const ohneTags = (s: string) => s.replace(/<[^>]+>/g, '').trim();
/** Echte Fussnote aus dem Sidecar (Erlass, Artikel-Token, Sektion/Randtitel) — wirft, wenn sie fehlt. */
function echt(erlass: string, token: string, sektion: string): SidecarFn {
  const f = (sidecar(erlass).artikel[token]?.fussnoten ?? []).find((x) => x.sektion === sektion);
  if (!f) throw new Error(`Fussnote fehlt: ${erlass} ${token} «${sektion}»`);
  return f;
}

// Fundstelle je Fixture: Struktur-Sidecar, Artikel, Randtitel/Überschrift.
const FIXTURES = [
  { name: 'ZGB 124 (Zusatz «in der AS genannten Bestimmungen»)', erlass: 'ZGB', token: '124', sektion: 'III. Ausgleich bei Invalidenrenten vor dem reglementarischen Referenzalter',
    text: 'Ausdruck gemäss Anhang Ziff. 1 des BG vom 17. Dez. 2021 (AHV 21), in Kraft seit 1. Jan. 2024 (AS 2023 92; BBl 2019 6305). Diese Änd. wurde in den in der AS genannten Bestimmungen vorgenommen.' },
  { name: 'ZGB 4 (Zusatz «im ganzen Erlass berücksichtigt»)', erlass: 'ZGB', token: '4', sektion: 'III. Gerichtliches Ermessen',
    text: 'Ausdruck gemäss Ziff. I 1 des BG vom 26. Juni 1998, in Kraft seit 1. Jan. 2000 (AS 1999 1118; BBl 1996 I 1). Diese Änd. ist im ganzen Erlass berücksichtigt.' },
  { name: 'IVG 1 (Zusatz «wurde im ganzen Erlass berücksichtigt» — Wortlaut-Variante, die keiner der früheren Zusatz-Regexe traf)', erlass: 'IVG', token: '1', sektion: '1. Teil: Die Versicherung',
    text: 'Ausdruck gemäss Ziff. I des BG vom 19. Juni 2020 (Weiterentwicklung der IV), in Kraft seit 1. Jan. 2022 (AS 2021 705; BBl 2017 2535). Diese Änd. wurde im ganzen Erlass berücksichtigt.' },
] as const;

describe('ausdruckFussnote · Erkennung am Anfang «Ausdruck gemäss» (echter Fedlex-Wortlaut)', () => {
  for (const f of FIXTURES) {
    it(`${f.name}: Fixture = Sidecar-Wortlaut, wird als Ausdruck-Fussnote erkannt`, () => {
      const echteFn = echt(f.erlass, f.token, f.sektion);
      expect(ohneTags(echteFn.text ?? '')).toBe(f.text); // Identität gegen die committete Amtsquelle-Projektion
      expect(ausdruckFussnote({ text: echteFn.text, sektion: f.sektion })).toBe(true);
    });
  }

  it('Randtitel mit Gliederungszeichen + echte Ausdruck-Fussnote ⇒ keine reine Randtitel-Änderung; echte «Fassung gemäss»-Fussnote ⇒ reine', () => {
    const z = FIXTURES[0];
    expect(randtitelMitAufzaehler(z.sektion)).toBe(true);
    expect(randtitelNurRandtitel([{ text: z.text, sektion: z.sektion }], z.sektion)).toBe(false);
    const fassung = echt('ZGB', '299', 'Asexies. Stiefeltern'); // «Fassung gemäss … (AS 2017 3699)» am Randtitel (Entscheid David 3.10.2026)
    expect(ohneTags(fassung.text ?? '')).toMatch(/^Fassung gemäss .*AS 2017 3699/);
    expect(ausdruckFussnote({ text: fassung.text, sektion: fassung.sektion })).toBe(false);
    expect(randtitelNurRandtitel([{ text: fassung.text, sektion: fassung.sektion }], 'Asexies. Stiefeltern')).toBe(true);
  });

  it('der Zusatz allein («Diese Änd. …» ohne «Ausdruck gemäss»-Anfang) ist kein Erkennungsmuster mehr (Rückbau, kein Korpus-Fall)', () => {
    expect(ausdruckFussnote({ text: 'Fassung gemäss Ziff. I des BG vom 19. Juni 2020, in Kraft seit 1. Jan. 2022 (AS 2021 705). Diese Änd. ist im ganzen Erlass berücksichtigt.' })).toBe(false);
    expect(ausdruckFussnote({ text: 'Eingefügt durch Ziff. I des BG vom 18. März 2011, in Kraft seit 1. Jan. 2012 (AS 2011 4909).' })).toBe(false);
  });
});

describe('Korpus · Tripwire der Ausdruck-Erkennung (committete Struktur-Sidecars aller Bund-Erlasse)', () => {
  it('jede Fussnote an einem Randtitel mit Gliederungszeichen, die einen «Diese/Die Änd.»-Zusatz trägt, beginnt mit «Ausdruck gemäss» (sonst fehlt der Erkennung ein Muster)', () => {
    let zusatz = 0;
    let ausdruck = 0;
    const luecken: string[] = [];
    for (const datei of readdirSync(STRUKTUR).filter((f) => f.endsWith('.json'))) {
      const s = JSON.parse(readFileSync(`${STRUKTUR}/${datei}`, 'utf8')) as { artikel?: Record<string, { fussnoten?: SidecarFn[] }> };
      for (const [token, a] of Object.entries(s.artikel ?? {})) {
        for (const f of a.fussnoten ?? []) {
          if (!f.sektion || !randtitelMitAufzaehler(f.sektion)) continue;
          if (ausdruckFussnote(f)) ausdruck++;
          if (!/(?:Diese|Die) Änd\./.test(ohneTags(f.text ?? ''))) continue;
          zusatz++;
          if (!ausdruckFussnote(f)) luecken.push(`${datei} ${token} «${f.sektion}»`);
        }
      }
    }
    expect(luecken).toEqual([]);
    expect(zusatz).toBeGreaterThanOrEqual(10); // 3.10.2026: 15 an Randtiteln mit Gliederungszeichen (Zähler: --muster)
    expect(ausdruck).toBeGreaterThanOrEqual(10); // 3.10.2026: 16
  });
});
