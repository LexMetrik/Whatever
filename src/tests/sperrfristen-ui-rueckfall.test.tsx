import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { berechneSperrfristen } from '../lib/sperrfristen';
import { SperrtageZaehler } from '../components/SperrtageZaehler';
import { SperrereignisseEditor } from '../components/forms/SperrereignisseEditor';
import { KombinierteAnsicht } from '../components/forms/KombinierteAnsicht';
import { ErgebnisAnzeige } from '../components/ErgebnisAnzeige';
import * as shared from '../components/forms/sperrereignisseShared';
import type { Sperrereignis, SperrfristenInput } from '../types/legal';

// RL-13 PR 2 (W2·30-RL-W1, UI-05/UI-06): Anzeige zur Rückfall-Rechnung aus dem
// Restkontingent (Entscheid David W-04, 24.9.2026). renderToString-Muster wie im
// Repo üblich (node-Env, kein jsdom); Interaktion über die reinen Helfer.

/** Sichtbarer Text: React-Textknoten-Trenner und Tags entfernen. */
const text = (html: string) =>
  html.replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, "'").replace(/\s+/g, ' ');

// UI-06-Beispiel (sperrfristen-rueckfall.test.ts): 6. DJ, E1 1.–20.4., Rückfall 10.5.–10.6.2025.
const RUECKFALL_INPUT: SperrfristenInput = {
  vertragsbeginn: '2020-01-01', zugangKuendigung: '2025-04-15', kuendigendePartei: 'arbeitgeber',
  probezeitMonate: 1, kuendigungsterminMonatsende: true,
  sperrereignisse: [
    { typ: 'krankheit_unfall', von: '2025-04-01', bis: '2025-04-20' },
    { typ: 'krankheit_unfall', von: '2025-05-10', bis: '2025-06-10', gleicheUrsacheWieEreignis: 0 },
  ],
};

describe('SperrtageZaehler — Rückfall zeigt den Rest des Kontingents (UI-06)', () => {
  it('Rückfall: «x / K Tage aus dem Rest» und «y verbleibend» aus dem Engine-Ergebnis', () => {
    const r = berechneSperrfristen(RUECKFALL_INPUT);
    expect(r.sperrtage![1]).toMatchObject({ rueckfall: true, beansprucht: 32, kontingent: 180, verbleibend: 129 });
    const t = text(renderToString(<SperrtageZaehler sperrtage={r.sperrtage!} />));
    expect(t).toContain('32 / 180 Tage aus dem Rest');
    expect(t).toContain('129 verbleibend');
    expect(t).not.toContain('Rückfall – kein neues Kontingent');
  });

  it('Rückfall mit aufgebrauchtem Rest: «Kontingent ausgeschöpft»', () => {
    const t = text(renderToString(<SperrtageZaehler sperrtage={[
      { ereignis: 2, typ: 'krankheit_unfall', vonISO: '2025-09-01', bisISO: '2025-09-10', beansprucht: 0, kontingent: 30, verbleibend: 0, rueckfall: true },
    ]} />));
    expect(t).toContain('0 / 30 Tage aus dem Rest');
    expect(t).toContain('Kontingent ausgeschöpft');
  });
});

describe('SperrereignisseEditor — Rückfall-Bezug (UI-05)', () => {
  const liste: Sperrereignis[] = [
    { typ: 'krankheit_unfall', von: '2025-04-01', bis: '2025-04-20' },
    { typ: 'schwangerschaft', von: '2025-04-01', bis: '2025-12-31' },
    { typ: 'krankheit_unfall', von: '2025-05-10', bis: '2025-06-10', gleicheUrsacheWieEreignis: 0 },
  ];

  it('Option-Label nennt den Rest des Kontingents, nicht «keine neue Sperrfrist»', () => {
    const t = text(renderToString(<SperrereignisseEditor wert={liste} onChange={() => {}} />));
    expect(t).toContain('Rückfall wie Ereignis 1 (Rest des Kontingents)');
    expect(t).not.toContain('keine neue Sperrfrist');
  });

  it('Bezug nur auf frühere Krankheit/Unfall-Ereignisse (keine Schwangerschaft)', () => {
    const t = text(renderToString(<SperrereignisseEditor wert={liste} onChange={() => {}} />));
    expect(t).not.toContain('Rückfall wie Ereignis 2');
  });

  it('kein Rückfall-Feld, wenn kein früheres Krankheit/Unfall-Ereignis besteht', () => {
    const t = text(renderToString(<SperrereignisseEditor wert={[
      { typ: 'schwangerschaft', von: '2025-04-01', bis: '2025-12-31' },
      { typ: 'krankheit_unfall', von: '2025-05-10', bis: '2025-06-10' },
    ]} onChange={() => {}} />));
    expect(t).not.toContain('Rückfall derselben Ursache');
  });

  it('Typwechsel löscht den eigenen Bezug und Bezüge, die auf das Ereignis zeigen', () => {
    const setzen = (shared as Record<string, unknown>).sperrereignisTypSetzen as
      ((l: Sperrereignis[], i: number, typ: Sperrereignis['typ']) => Sperrereignis[]) | undefined;
    expect(typeof setzen).toBe('function');
    // Eigenes Ereignis wird Schwangerschaft → sein Bezug fällt weg.
    const a = setzen!(liste, 2, 'schwangerschaft');
    expect(a[2].typ).toBe('schwangerschaft');
    expect(a[2].gleicheUrsacheWieEreignis ?? null).toBeNull();
    // Das Bezugsereignis wird Militärdienst → der Rückfall darauf verliert den Bezug.
    const b = setzen!(liste, 0, 'militaer_zivil');
    expect(b[0].typ).toBe('militaer_zivil');
    expect(b[2].gleicheUrsacheWieEreignis ?? null).toBeNull();
    // Wechsel innerhalb Krankheit/Unfall lässt den Bezug stehen.
    const c = setzen!(liste, 2, 'krankheit_unfall');
    expect(c[2].gleicheUrsacheWieEreignis).toBe(0);
    // Eingabe unverändert (rein).
    expect(liste[2].gleicheUrsacheWieEreignis).toBe(0);
  });
});

describe('KombinierteAnsicht — reicht alle Eingaben durch (UI-05, §5)', () => {
  it('nicht bezogene Tage Art. 329g: 10 Resttage → Beendigung 10.06.2025', () => {
    const t = text(renderToString(
      <KombinierteAnsicht startwerte={{ vertragsbeginn: '2024-06-01', vaterschaftsurlaubResttage: 10 }} />,
    ));
    expect(t).toContain('10.06.2025');
  });

  it('Kündigungstermin frei → Beendigung 15.05.2025 (statt Monatsende 31.05.2025)', () => {
    const t = text(renderToString(
      <KombinierteAnsicht startwerte={{ vertragsbeginn: '2024-06-01', kuendigungsterminMonatsende: false }} />,
    ));
    expect(t).toContain('15.05.2025');
  });

  it('abweichende Frist 3 Monate → Beendigung 31.07.2025', () => {
    const t = text(renderToString(
      <KombinierteAnsicht startwerte={{ vertragsbeginn: '2024-06-01', abweichendeFristMonate: 3, abweichendeFristFormGueltig: true }} />,
    ));
    expect(t).toContain('Beendigungsdatum: 31.07.2025');
  });

  it('Eingabefelder für Kündigungstermin, abweichende Frist und nicht bezogene Tage vorhanden', () => {
    const t = text(renderToString(<KombinierteAnsicht />));
    expect(t).toContain('Kündigungstermin');
    expect(t).toContain('Abweichende Frist (Monate)');
    expect(t).toContain('nicht bezogene Tage');
  });

  it('Rückfall-Bezug: geteilter Editor + Zähler aus dem Rest', () => {
    const t = text(renderToString(<KombinierteAnsicht startwerte={{ sperrereignisse: RUECKFALL_INPUT.sperrereignisse }} />));
    // Typen-Katalog aus sperrereignisseShared.ts (keine Kopie mehr)
    expect(t).toContain('Krankheit / Unfall (Art. 336c Abs. 1 lit. b)');
    expect(t).toContain('Rückfall wie Ereignis 1 (Rest des Kontingents)');
    expect(t).toContain('32 / 180 Tage aus dem Rest');
  });
});

describe('Offenlegung der Rückfall-Lesart (W-04)', () => {
  it('Hinweis nennt die Zählweise: Anfangstag nur beim Ersteintritt ausgenommen', () => {
    const r = berechneSperrfristen(RUECKFALL_INPUT);
    const w = r.warnungen.find((x) => x.startsWith('Rückfall (Ereignis 2'));
    expect(w).toBeDefined();
    expect(w).toContain('gerichtlich bestätigt');
    expect(w).toMatch(/Anfangstag[^.]*nur beim Ersteintritt/);
  });

  it('KuendigungSperrForm-Ergebnisanzeige zeigt den Vorbehalt aus dem Engine-Ergebnis', () => {
    const r = berechneSperrfristen(RUECKFALL_INPUT);
    const t = text(renderToString(<ErgebnisAnzeige titel="Kündigung & Sperrfristen" ergebnis={r} />));
    expect(t).toContain('Lesart ist nicht gerichtlich bestätigt');
  });
});
