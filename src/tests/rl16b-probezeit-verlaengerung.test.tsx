// RL-16b (W2·30-RL-W2A) — Probezeit Stufe 2: Verlängerung nach Art. 335b
// Abs. 3 OR wird GERECHNET (Entscheid David W-08 (b), 24.9.2026), mit neuem
// Eingabefeld «Arbeitstage pro Woche» (Standard Mo–Fr).
//
// Norm (Fedlex SR 220, Filestore-HTML Konsolidierung 20260101 — Stand laut
// bibliothek/register/quellen-register.md —, Wortlaut in 20261001 unverändert,
// abgerufen 25.9.2026):
//   Art. 335b Abs. 3 OR — «Bei einer effektiven Verkürzung der Probezeit
//   infolge Krankheit, Unfall oder Erfüllung einer nicht freiwillig
//   übernommenen gesetzlichen Pflicht erfolgt eine entsprechende Verlängerung
//   der Probezeit.»
// Art. 110 Abs. 3 BV (SR 101, Konsolidierung 20240303, in Kraft bis 31.12.2028
// laut SPARQL): Der 1. August ist «arbeitsrechtlich den Sonntagen gleichgestellt».
//
// Rechtsprechung: BGE 148 III 126 (Volltext über entscheidsuche.ch,
// https://entscheidsuche.ch/docs/CH_BGE/CH_BGE_005_BGE-148-III-126_2022.html,
// abgerufen 25.9.2026; bger.ch 503):
//   E. 5.2.6 — die Verlängerung berechnet sich «nicht einfach nach
//   Kalendertagen», sondern nach der Anzahl ganzer ARBEITstage, an denen der
//   Arbeitnehmer effektiv verhindert war; Verhinderung an ohnehin arbeitsfreien
//   Tagen verlängert nicht.
//   E. 5.2.4/5.2.7 — die Tage sind real «abzuarbeiten»: arbeitsfreie Tage
//   (Sa/So) zählen in der Verlängerung nicht mit, und solange die Verhinderung
//   über das unverlängerte Ende hinaus andauert, wird nicht abgearbeitet.
//
// Befund F4-02 / S3c-b (Prüfung 23.9.2026, Zweitprüfung bestätigt):
//   VB 1.1.2025, Probezeit 1 Monat (Ende 31.1.), krank 10.–19.1.2025, Zugang
//   5.2.2025. Ist (Stufe 1): ordentliche Frist, Ende 31.3.2025 + Warnung.
//   Soll: 6 Arbeitstage Mo–Fr (10., 13.–17.1.) → Probezeit bis Mo 10.2.2025 →
//   Zugang in der Probezeit → 7 Tage → Beendigung 12.2.2025.
import { describe, it, expect } from 'vitest';
import { format } from 'date-fns';
import { renderToString } from 'react-dom/server';
import { berechneKuendigungsfrist } from '../lib/kuendigungsfrist';
import { berechneSperrfristen } from '../lib/sperrfristen';
import { KAG_DEFAULTS, kagIstProbezeit, kagEngine, type KagAntworten } from '../lib/vorlagen/kuendigungArbeitgeber';
import { permalinkKodieren, permalinkLesen } from '../lib/permalink';
import { KSP_LINK_SPEC } from '../lib/rechnerPermalinks';
import { KombinierteAnsicht } from '../components/forms/KombinierteAnsicht';
import { KuendigungSperrForm } from '../components/forms/KuendigungSperrForm';
import type { SperrfristenInput } from '../types/legal';

const ds = (d: Date | undefined) => (d ? format(d, 'yyyy-MM-dd') : undefined);
const MO_FR = [1, 2, 3, 4, 5];

const BEFUND: SperrfristenInput = {
  vertragsbeginn: '2025-01-01',
  zugangKuendigung: '2025-02-05',
  kuendigendePartei: 'arbeitgeber',
  probezeitMonate: 1,
  kuendigungsterminMonatsende: true,
  arbeitstageWoche: MO_FR,
  sperrereignisse: [{ typ: 'krankheit_unfall', von: '2025-01-10', bis: '2025-01-19' }],
};

const rechenwegText = (r: { rechenweg: { zwischenergebnis: string }[] }) =>
  r.rechenweg.map((s) => s.zwischenergebnis).join(' | ');

describe('RL-16b Befund F4-02 — Soll-Fall 5.2.2025 → 12.2.2025', () => {
  it('Kündigungsfrist: Zugang in der verlängerten Probezeit (bis 10.02.2025) → 7 Tage → 12.02.2025', () => {
    const r = berechneKuendigungsfrist(BEFUND);
    expect(r.istProbezeit).toBe(true);
    expect(ds(r.beendigungsdatum)).toBe('2025-02-12');
    const rw = rechenwegText(r.ergebnis);
    expect(rw).toContain('6 Arbeitstag');
    expect(rw).toContain('10.02.2025');
    const schritt = r.ergebnis.rechenweg.find((s) => s.normen?.some((n) => n.artikel === 'Art. 335b Abs. 3 OR'));
    expect(schritt).toBeDefined();
    expect(schritt!.rechtsprechung?.some((x) => x.aktenzeichen === 'BGE 148 III 126')).toBe(true);
  });

  it('Sperrfristen-Rechner (Formular-Engine): Beendigung 12.02.2025, keine Sperrfrist (Art. 336c gilt nicht in der Probezeit)', () => {
    const r = berechneSperrfristen(BEFUND);
    expect(r.beendigungISO).toBe('2025-02-12');
    expect(r.status).not.toBe('nichtig');
    expect(r.gehemmtTage ?? 0).toBe(0);
    // Stufe-1-Warnung «nicht gerechnet» entfällt, wo gerechnet wird.
    expect(r.warnungen.some((w) => w.includes('nicht gerechnet'))).toBe(false);
  });

  it('Arbeitnehmerkündigung: ebenfalls 7-Tage-Frist in der verlängerten Probezeit', () => {
    const r = berechneSperrfristen({ ...BEFUND, kuendigendePartei: 'arbeitnehmer' });
    expect(r.beendigungISO).toBe('2025-02-12');
  });

  it('Feld fehlt (z. B. Vorlage ohne Feld): Standard Mo–Fr, gleiches Ergebnis + offengelegte Annahme', () => {
    const { arbeitstageWoche: _weg, ...ohneFeld } = BEFUND;
    const r = berechneKuendigungsfrist(ohneFeld);
    expect(ds(r.beendigungsdatum)).toBe('2025-02-12');
    expect(r.ergebnis.warnungen.some((w) => w.includes('Montag bis Freitag'))).toBe(true);
  });

  it('Militär-/Zivildienst (gesetzliche Pflicht) verlängert ebenso', () => {
    const r = berechneKuendigungsfrist({
      ...BEFUND, sperrereignisse: [{ typ: 'militaer_zivil', von: '2025-01-10', bis: '2025-01-19' }],
    });
    expect(ds(r.beendigungsdatum)).toBe('2025-02-12');
  });

  it('Schwangerschaft ist kein Verlängerungsgrund nach Abs. 3 → ordentliche Frist', () => {
    const r = berechneKuendigungsfrist({
      ...BEFUND, sperrereignisse: [{ typ: 'schwangerschaft', von: '2025-01-10', bis: '2025-09-30' }],
    });
    expect(r.istProbezeit).toBe(false);
  });
});

describe('RL-16b Gegenproben ohne Verlängerung', () => {
  it('ohne Verhinderung: ordentliche Frist (1. DJ, 1 Monat, Monatsende) → 31.03.2025', () => {
    const r = berechneKuendigungsfrist({ ...BEFUND, sperrereignisse: [] });
    expect(r.istProbezeit).toBe(false);
    expect(ds(r.beendigungsdatum)).toBe('2025-03-31');
    expect(rechenwegText(r.ergebnis)).not.toContain('Art. 335b Abs. 3');
  });

  it('Zugang am Tag nach dem verlängerten Ende (11.2.2025) → ordentliche Frist 31.03.2025', () => {
    const r = berechneKuendigungsfrist({ ...BEFUND, zugangKuendigung: '2025-02-11' });
    expect(r.istProbezeit).toBe(false);
    expect(ds(r.beendigungsdatum)).toBe('2025-03-31');
  });

  it('Zugang am letzten Tag der verlängerten Probezeit (10.2.2025) → 17.02.2025', () => {
    const r = berechneKuendigungsfrist({ ...BEFUND, zugangKuendigung: '2025-02-10' });
    expect(r.istProbezeit).toBe(true);
    expect(ds(r.beendigungsdatum)).toBe('2025-02-17');
  });

  it('Verhinderung nur an arbeitsfreien Tagen (Sa/So 18./19.1.) verlängert nicht (E. 5.2.6)', () => {
    const r = berechneKuendigungsfrist({
      ...BEFUND, sperrereignisse: [{ typ: 'krankheit_unfall', von: '2025-01-18', bis: '2025-01-19' }],
    });
    expect(r.istProbezeit).toBe(false);
  });
});

describe('RL-16b Teilzeit mit festen Arbeitstagen', () => {
  it('Mo–Mi: 3 Ausfalltage (13.–15.1.) → Probezeit bis Mi 05.02.2025; Zugang 6.2. ausserhalb', () => {
    const r = berechneKuendigungsfrist({ ...BEFUND, arbeitstageWoche: [1, 2, 3], zugangKuendigung: '2025-02-06' });
    expect(r.istProbezeit).toBe(false);
    expect(rechenwegText(r.ergebnis)).toContain('05.02.2025');
  });

  it('Mo–Mi: Zugang 5.2. (letzter Tag) → in der Probezeit → 12.02.2025', () => {
    const r = berechneKuendigungsfrist({ ...BEFUND, arbeitstageWoche: [1, 2, 3] });
    expect(r.istProbezeit).toBe(true);
    expect(ds(r.beendigungsdatum)).toBe('2025-02-12');
  });

  it('Vergleich Mo–Fr: Zugang 6.2. liegt noch in der Probezeit (bis 10.2.) → 13.02.2025', () => {
    const r = berechneKuendigungsfrist({ ...BEFUND, zugangKuendigung: '2025-02-06' });
    expect(r.istProbezeit).toBe(true);
    expect(ds(r.beendigungsdatum)).toBe('2025-02-13');
  });
});

describe('RL-16b Verhinderung über das Probezeitende hinaus (E. 5.2.7)', () => {
  // krank Mo 27.1.–Fr 7.2.2025: 5 Ausfalltage in der Probezeit (27.–31.1.);
  // abgearbeitet erst ab Genesung: 10.–14.2. → Ende Fr 14.2.2025.
  const lang = { ...BEFUND, sperrereignisse: [{ typ: 'krankheit_unfall' as const, von: '2025-01-27', bis: '2025-02-07' }] };

  it('Zugang 14.2.2025 → in der Probezeit → 21.02.2025', () => {
    const r = berechneKuendigungsfrist({ ...lang, zugangKuendigung: '2025-02-14' });
    expect(r.istProbezeit).toBe(true);
    expect(ds(r.beendigungsdatum)).toBe('2025-02-21');
    expect(rechenwegText(r.ergebnis)).toContain('14.02.2025');
  });

  it('Zugang 17.2.2025 → ausserhalb → ordentliche Frist 31.03.2025', () => {
    const r = berechneKuendigungsfrist({ ...lang, zugangKuendigung: '2025-02-17' });
    expect(r.istProbezeit).toBe(false);
    expect(ds(r.beendigungsdatum)).toBe('2025-03-31');
  });
});

describe('RL-16b Verhinderung IN der Verlängerung (iterativ, offengelegt)', () => {
  // Befund + neue Krankheit Di 4.–Mi 5.2.2025: abgearbeitet 3.2., 6.–7.2.,
  // 10.–12.2. → Ende Mi 12.2.2025 (ohne erneute Verlängerung: 10.2.).
  const iter = {
    ...BEFUND,
    zugangKuendigung: '2025-02-11',
    sperrereignisse: [
      ...BEFUND.sperrereignisse!,
      { typ: 'krankheit_unfall' as const, von: '2025-02-04', bis: '2025-02-05' },
    ],
  };

  it('Zugang 11.2.2025 → in der Probezeit (bis 12.2.) → 18.02.2025', () => {
    const r = berechneKuendigungsfrist(iter);
    expect(r.istProbezeit).toBe(true);
    expect(ds(r.beendigungsdatum)).toBe('2025-02-18');
  });

  it('die Lesart wird offengelegt: Warnung nennt das Ende ohne erneute Verlängerung (10.02.2025)', () => {
    const r = berechneKuendigungsfrist(iter);
    const w = r.ergebnis.warnungen.find((x) => x.includes('Art. 335b Abs. 3 OR') && x.includes('10.02.2025'));
    expect(w).toBeDefined();
  });
});

describe('RL-16b Feiertage', () => {
  // 1. August (Art. 110 Abs. 3 BV, den Sonntagen gleichgestellt): VB 1.7.2025,
  // krank Mo 28.–Do 31.7. = 4 Ausfalltage; Fr 1.8. arbeitsfrei → 4.–7.8. → Ende Do 7.8.2025.
  const aug = {
    ...BEFUND, vertragsbeginn: '2025-07-01', zugangKuendigung: '2025-08-07',
    sperrereignisse: [{ typ: 'krankheit_unfall' as const, von: '2025-07-28', bis: '2025-07-31' }],
  };

  it('1. August in der Verlängerung zählt nicht (Mo–Fr): Zugang 7.8. → in der Probezeit → 14.08.2025', () => {
    const r = berechneKuendigungsfrist(aug);
    expect(r.istProbezeit).toBe(true);
    expect(ds(r.beendigungsdatum)).toBe('2025-08-14');
  });

  it('wer sonntags arbeitet, arbeitet auch am 1. August: Mo–So → Ende 4.8. → Zugang 7.8. ausserhalb', () => {
    const r = berechneKuendigungsfrist({ ...aug, arbeitstageWoche: [0, 1, 2, 3, 4, 5, 6] });
    expect(r.istProbezeit).toBe(false);
  });

  // Kantonaler Feiertag (Pfingstmontag 9.6.2025): VB 1.5.2025, krank 12.–23.5.
  // = 10 Ausfalltage; Hauptergebnis zählt 9.6. als Arbeitstag (Wochentags-
  // Muster) → Ende Fr 13.6.2025; ist der Tag arbeitsfrei → Mo 16.6.2025.
  const pfingsten = {
    ...BEFUND, vertragsbeginn: '2025-05-01', zugangKuendigung: '2025-06-16',
    sperrereignisse: [{ typ: 'krankheit_unfall' as const, von: '2025-05-12', bis: '2025-05-23' }],
  };

  it('kantonaler Feiertag in der Verlängerung: Warnung nennt Tag und abweichendes Ende', () => {
    const r = berechneKuendigungsfrist(pfingsten);
    expect(r.istProbezeit).toBe(false);
    const w = r.ergebnis.warnungen.find((x) => x.includes('09.06.2025'));
    expect(w).toBeDefined();
    expect(w).toContain('16.06.2025');
  });

  it('Zugang 13.6.2025 (letzter Tag nach Hauptrechnung) → in der Probezeit → 20.06.2025', () => {
    const r = berechneKuendigungsfrist({ ...pfingsten, zugangKuendigung: '2025-06-13' });
    expect(r.istProbezeit).toBe(true);
    expect(ds(r.beendigungsdatum)).toBe('2025-06-20');
  });
});

describe('RL-16b Vorlage «Kündigung durch Arbeitgeber:in» — dieselbe Engine', () => {
  const kag = (over: Partial<KagAntworten> = {}): KagAntworten => ({
    ...KAG_DEFAULTS,
    vertragsbeginn: '2025-01-01', zugangKuendigung: '2025-02-05',
    probezeit: 'gesetzlich',
    sperrereignisse: [{ typ: 'krankheit_unfall', von: '2025-01-10', bis: '2025-01-19' }],
    ...over,
  });

  it('kagIstProbezeit folgt der Verlängerung (Probezeit-Satz im Brief)', () => {
    expect(kagIstProbezeit(kag())).toBe(true);
    expect(kagEngine(kag())?.beendigungISO).toBe('2025-02-12');
  });
});

describe('RL-16b Teilen-Link (KSP_LINK_SPEC): Arbeitstage überleben den Roundtrip', () => {
  it('Mo–Mi hin und zurück', () => {
    const q = permalinkKodieren(KSP_LINK_SPEC, { ...BEFUND, arbeitstageWoche: [1, 2, 3] } as SperrfristenInput & Record<string, unknown>);
    expect(permalinkLesen(KSP_LINK_SPEC, q).arbeitstageWoche).toEqual([1, 2, 3]);
  });

  it('ungültige Werte fallen weg (Wochentag 7, leer, doppelt)', () => {
    for (const roh of ['[7]', '[]', '[1,1]', '"x"']) {
      const q = '?at=' + encodeURIComponent(roh);
      expect(permalinkLesen(KSP_LINK_SPEC, q).arbeitstageWoche).toBeUndefined();
    }
  });
});

describe('RL-16b Formulare zeigen das Feld «Arbeitstage»', () => {
  const text = (html: string) => html.replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

  it('Kündigungs-/Sperrfristen-Rechner: Wochentags-Gruppe mit sieben Ankreuzfeldern', () => {
    const html = renderToString(<KuendigungSperrForm />);
    expect(text(html)).toContain('Arbeitstage');
    expect(html).toMatch(/role="group"[^>]*aria-labelledby/);
    expect((html.match(/data-wochentag=/g) ?? []).length).toBe(7);
  });

  it('Kombinierte Ansicht: Feld vorhanden, Befund rechnet 12.02.2025', () => {
    const html = renderToString(<KombinierteAnsicht startwerte={{ ...BEFUND, verhinderungBeginn: '2025-01-10' }} />);
    const t = text(html);
    expect(t).toContain('Arbeitstage');
    expect(t).toContain('12.02.2025');
  });
});
