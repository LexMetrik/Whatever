import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Schnellwerkzeug } from '../components/start/Schnellwerkzeug';
import {
  leseSchnellWahl, speichereSchnellWahl, SCHNELL_WAHL_KEY, SCHNELL_WAHL_STANDARD, SCHNELL_WAHLEN,
} from '../components/start/schnellwerkzeugWahl';
import { VerzugszinsSchnellForm } from '../components/forms/VerzugszinsSchnellForm';
import { VerjaehrungSchnellForm } from '../components/forms/VerjaehrungSchnellForm';
import { VerzugszinsForm } from '../components/forms/VerzugszinsForm';
import { VerjaehrungForm } from '../components/forms/VerjaehrungForm';
import { DEFAULTS } from '../components/forms/verzugszinsTexte';
import { VJ_BEGINN_DEFAULT } from '../components/forms/verjaehrungTexte';
import { teileWahl } from '../components/forms/schnellFormTexte';
import { berechneVerzugszins } from '../lib/verzugszins';
import { berechneVerjaehrung } from '../lib/verjaehrung';
import { berechneFrist } from '../lib/zpoFristen';
import { datumOderStrich } from '../components/ui/datumText';

// ─── Schnellwerkzeug der Startseite, wählbar (W2·29-WERKBANK-START-UEBERARBEITUNG U2) ──
//
// David 24.9.2026: «ich möchte dass man bei den schnellwerkzeugen auswählen
// kann» (Frist · Verzugszins · Verjährung, Wahl merkt sich der Browser).
// Geprüft: (1) Speichern/Lesen samt Rückfall bei fehlendem, kaputtem oder
// gesperrtem Speicher; (2) der Prerender-/Erst-Render zeigt die gespeicherte
// Wahl; (3) jede Schnellform zeigt das Ergebnis DERSELBEN Engine mit denselben
// Eingaben wie der volle Rechner (§1/§2 — keine vereinfachte Rechtslogik).

/** Server-Markup ohne Reacts Text-Trenner und mit entschlüsseltem Apostroph (10'501.37). */
const html = (el: ReactNode) => renderToString(<MemoryRouter initialEntries={['/']}>{el}</MemoryRouter>)
  .replaceAll('<!-- -->', '').replaceAll('&#x27;', "'");

/** Minimaler Speicher-Ersatz; `kaputt` wirft bei jedem Zugriff (privater Modus). */
function speicher(start: Record<string, string> = {}, kaputt = false) {
  const daten = new Map(Object.entries(start));
  return {
    getItem: (k: string) => { if (kaputt) throw new Error('SecurityError'); return daten.get(k) ?? null; },
    setItem: (k: string, v: string) => { if (kaputt) throw new Error('QuotaExceededError'); daten.set(k, v); },
    removeItem: (k: string) => { daten.delete(k); },
    daten,
  };
}

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('Wahl: Speichern und Lesen', () => {
  it('ohne Speicher (Prerender/Node) gilt der Standard «frist»', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(leseSchnellWahl()).toBe('frist');
    expect(SCHNELL_WAHL_STANDARD).toBe('frist');
  });

  it('speichert und liest jede der drei Varianten', () => {
    const s = speicher();
    vi.stubGlobal('localStorage', s);
    for (const w of SCHNELL_WAHLEN) {
      speichereSchnellWahl(w.code);
      expect(s.daten.get(SCHNELL_WAHL_KEY)).toBe(w.code);
      expect(leseSchnellWahl()).toBe(w.code);
    }
  });

  it('unbekannter oder alter Wert → «frist»', () => {
    vi.stubGlobal('localStorage', speicher({ [SCHNELL_WAHL_KEY]: 'streitwert' }));
    expect(leseSchnellWahl()).toBe('frist');
    vi.stubGlobal('localStorage', speicher({ [SCHNELL_WAHL_KEY]: '' }));
    expect(leseSchnellWahl()).toBe('frist');
  });

  it('gesperrter Speicher: Lesen fällt auf «frist», Speichern wirft nicht', () => {
    vi.stubGlobal('localStorage', speicher({}, true));
    expect(leseSchnellWahl()).toBe('frist');
    expect(() => speichereSchnellWahl('verjaehrung')).not.toThrow();
  });

  it('die drei Reiter in Davids Reihenfolge: Frist · Verzugszins · Verjährung', () => {
    expect(SCHNELL_WAHLEN.map((w) => w.label)).toEqual(['Frist', 'Verzugszins', 'Verjährung']);
  });
});

describe('Fläche Schnellwerkzeug: Reiter und Überschrift folgen der Wahl', () => {
  it('ohne Speicher: Frist gewählt, Fristenrechner eingebettet, Verweis in den Voll-Rechner', () => {
    vi.stubGlobal('localStorage', undefined);
    const h = html(<Schnellwerkzeug />);
    expect(h).toContain('Schnellwerkzeug · Frist berechnen');
    expect(h).toMatch(/aria-selected="true"[^>]*data-schnell="frist"/);
    expect(h.match(/aria-selected="false"/g) ?? []).toHaveLength(2);
    expect(h).toContain('href="/rechner/tagerechner"');
  });

  it('gespeichert «verzugszins»: Überschrift und Reiter folgen, die Form lädt nach (Platzhalter)', () => {
    vi.stubGlobal('localStorage', speicher({ [SCHNELL_WAHL_KEY]: 'verzugszins' }));
    const h = html(<Schnellwerkzeug />);
    expect(h).toContain('Schnellwerkzeug · Verzugszins berechnen');
    expect(h).toMatch(/aria-selected="true"[^>]*data-schnell="verzugszins"/);
    expect(h).toContain('data-schnell-panel="verzugszins"');
    // Die Bühne reserviert die Höhe auch für den Ladeplatzhalter (§15).
    expect(h).toMatch(/data-schnell-panel="verzugszins"[^>]*min-h-start-schnell/);
    expect(h).not.toContain('href="/rechner/tagerechner"');
  });

  it('gespeichert «verjaehrung»: Überschrift «Verjährung prüfen»', () => {
    vi.stubGlobal('localStorage', speicher({ [SCHNELL_WAHL_KEY]: 'verjaehrung' }));
    expect(html(<Schnellwerkzeug />)).toContain('Schnellwerkzeug · Verjährung prüfen');
  });
});

describe('Rechenergebnis = Engine (je Variante mindestens ein Fall)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-09-24T10:00:00'));
    vi.stubGlobal('localStorage', undefined); // Standardkanton ZH
  });

  it('Frist: 10 Tage ab heute, ZPO-Gerichtsferien — Fristende aus berechneFrist', () => {
    const r = berechneFrist({ ereignis: '2026-09-24', einheit: 'tage', laenge: 10, verfahren: 'ordentlich', kanton: 'ZH', fristnatur: 'gesetzlich' });
    expect(html(<Schnellwerkzeug />)).toContain(r.diesAdQuem);
  });

  it('Verzugszins: Default-Fall — Zins und Total aus berechneVerzugszins, gleich wie im vollen Rechner', () => {
    const r = berechneVerzugszins({ ...DEFAULTS, ereignisse: [], rueckstaendigeZinsforderung: false });
    expect(r.status).toBe('ok');
    const schnell = html(<VerzugszinsSchnellForm />);
    expect(schnell).toContain(`CHF ${r.zinsTotalCHF}`);
    expect(schnell).toContain(`Total offen CHF ${r.totalOffenCHF}`);
    // Derselbe Wert steht im vollen Rechner mit denselben Defaults (keine zweite Rechenregel).
    expect(html(<VerzugszinsForm />)).toContain(`CHF ${r.zinsTotalCHF}`);
    // Normbezüge der Engine vollständig, als Fedlex-Links (§7 c).
    for (const n of r.normverweise) expect(schnell).toContain(n.artikel);
    expect(schnell).toMatch(/<a [^>]*href="https:\/\/www\.fedlex\.admin\.ch[^"]*"[^>]*>Art\. 104 Abs\. 1 OR<\/a>/);
    // Offengelegte Annahmen + Weiterweg mit den Werten (Permalink).
    expect(schnell).toContain('Angenommen: Tageszählung');
    expect(schnell).toMatch(/href="\/rechner\/verzugszins\?[^"]*c=10000/);
  });

  it('Verjährung: ordentliche Forderung ab Default-Fälligkeit — Eintritt aus berechneVerjaehrung, gleich wie im vollen Rechner', () => {
    const r = berechneVerjaehrung({
      regime: 'ordentlich', beginnRelativ: VJ_BEGINN_DEFAULT, stichtag: '2026-09-24', kanton: 'ZH',
      stillstaende: [], unterbrechungen: [],
    });
    expect(r.verjaehrungISO).toBeTruthy();
    const erwartet = `${datumOderStrich(r.verjaehrungISO)} · 24.00 Uhr`;
    const schnell = html(<VerjaehrungSchnellForm />);
    expect(schnell).toContain(erwartet);
    expect(schnell).toContain('Am Stichtag nicht verjährt');
    expect(html(<VerjaehrungForm />)).toContain(erwartet);
    for (const n of r.normverweise) expect(schnell).toContain(n.artikel);
    // Anspruchstyp bleibt in der Schnellform wählbar, alle sechs Regime.
    expect(schnell.match(/<option /g)?.length).toBeGreaterThanOrEqual(6 + 26);
  });
});

describe('teileWahl: Name + Detail sind wörtliche Stücke derselben Beschriftung (§5)', () => {
  it.each([
    ['Ordentliche Forderung – 10 Jahre (Art. 127 OR)', 'Ordentliche Forderung', '10 Jahre (Art. 127 OR)'],
    ['Vertraglich höher (Art. 104 Abs. 2)', 'Vertraglich höher', 'Art. 104 Abs. 2'],
    ['Klage/Betreibung – ab Zustellung', 'Klage/Betreibung', 'ab Zustellung'],
    ['Ohne Detail', 'Ohne Detail', ''],
  ])('%s', (label, name, detail) => {
    expect(teileWahl(label)).toEqual({ name, detail });
  });
});
