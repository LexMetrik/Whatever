// RL-16b Nachzug (Gegenprüfung Runde 2, 25.9.2026, Befund hoch): Die Vorlage
// «Kündigung durch Arbeitgeber:in» erfasste Krankheiten, aber keine
// Arbeitstage — kagEngineInput() verwarf arbeitstageWoche. Bei Teilzeit waren
// Beendigungsdatum und Probezeit-Satz im Brief falsch (nur Warnung).
//
// Prüferfall, von Hand nach der Engine-Regel (kuendigungsfristProbezeit.ts,
// BGE 148 III 126 E. 5.2.4/5.2.6/5.2.7; Probezeitende am gleichnamigen Tag,
// BGE 144 III 152 E. 4.4.3):
//   Antritt Mo 1.6.2026, vereinbarte Probezeit 3 Monate → unverlängertes Ende
//   Di 1.9.2026. Krank Do 27.8. – Mo 31.8.2026. Zugang Do 3.9.2026.
//   Mo–Fr: Ausfall Do 27., Fr 28., Mo 31.8. = 3 Arbeitstage; abarbeiten ab
//     Mi 2.9.: 2., 3., 4.9. → Ende Fr 4.9.2026. Zugang 3.9. IN der Probezeit
//     → 7 Tage (Art. 335b Abs. 1 OR) → Beendigung 10.9.2026, Probezeit-Satz.
//   Mo–Mi: Do/Fr sind arbeitsfrei → Ausfall nur Mo 31.8. = 1 Arbeitstag;
//     abarbeiten ab Mi 2.9. → Ende Mi 2.9.2026. Zugang 3.9. AUSSERHALB →
//     1. Dienstjahr 1 Monat auf Monatsende (Art. 335c Abs. 1 OR): 3.10. →
//     31.10.2026; kein Probezeit-Satz. Krankheit vor dem Zugang → weder
//     nichtig noch gehemmt (Art. 336c Abs. 2 OR).
//   Gegenprobe BGE 144 III 152 (Ende am Vortag 31.8.): Mo–Fr Ende 3.9. (drin),
//   Mo–Mi Ende 1.9. (draussen) — kippt in keinem Muster, keine Warnung.
import { describe, it, expect, afterEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { LocaleProvider } from '../components/locale';
import {
  KAG_DEFAULTS, kagEngine, kagIstProbezeit, kagZusammenstellen, pruefeKagGates,
  type KagAntworten,
} from '../lib/vorlagen/kuendigungArbeitgeber';
import { dokumentAlsText } from '../lib/vorlagen/vorlagenText';
import { docxAbsaetze } from '../lib/vorlagen/vorlagenDocx';
import { vorlagenPdfDokument } from '../lib/vorlagen/vorlagenPdf';

type MitArbeitstagen = Partial<KagAntworten> & { arbeitstageWoche?: number[] };

const fall = (over: MitArbeitstagen = {}): KagAntworten => ({
  ...KAG_DEFAULTS,
  absenderName: 'Muster AG', absenderAdresse: 'Industriestrasse 9, 4053 Basel',
  unterzeichner: 'P. Muster, Geschäftsführer',
  adressatName: 'Anna Beispiel', adressatAdresse: 'Beispielweg 1, 4051 Basel',
  vertragsbeginn: '2026-06-01', zugangKuendigung: '2026-09-03',
  probezeit: 'vereinbart', probezeitMonate: 3,
  sperrereignisse: [{ typ: 'krankheit_unfall', von: '2026-08-27', bis: '2026-08-31' }],
  ort: 'Basel', datum: '2026-09-02',
  ...over,
}) as KagAntworten;

const PZ_SATZ = 'Die Kündigung erfolgt während der Probezeit';
const WARN_NICHT_ANGEGEBEN = 'Arbeitstage pro Woche nicht angegeben';

describe('RL-16b Vorlage Arbeitgeber: Teilzeit-Arbeitstage fliessen in Brief und Maske', () => {
  it('Mo–Fr (Soll von Hand): Probezeit bis 4.9.2026, Beendigung 10.9.2026, Probezeit-Satz', () => {
    const a = fall({ arbeitstageWoche: [1, 2, 3, 4, 5] });
    expect(kagEngine(a)?.beendigungISO).toBe('2026-09-10');
    expect(kagIstProbezeit(a)).toBe(true);
    expect(dokumentAlsText(kagZusammenstellen(a).ergebnis)).toContain(PZ_SATZ);
  });

  it('Mo–Mi (Soll von Hand): Probezeit bis 2.9.2026, Zugang ausserhalb → Beendigung 31.10.2026, kein Probezeit-Satz', () => {
    const a = fall({ arbeitstageWoche: [1, 2, 3] });
    const { ergebnis, engine } = kagZusammenstellen(a);
    expect(engine?.status).not.toBe('nichtig');
    expect(engine?.beendigungISO).toBe('2026-10-31');
    expect(kagIstProbezeit(a)).toBe(false);
    const text = dokumentAlsText(ergebnis);
    expect(text).toContain('per 31.10.2026');
    expect(text).not.toContain(PZ_SATZ);
    // Angegeben → keine «nicht angegeben»-Warnung in den Gates.
    expect(pruefeKagGates(a, engine).warnungen.join(' ')).not.toContain(WARN_NICHT_ANGEGEBEN);
  });

  it('PDF und DOCX rendern aus demselben Assemble-Ergebnis dasselbe Datum (§5)', () => {
    const { ergebnis } = kagZusammenstellen(fall({ arbeitstageWoche: [1, 2, 3] }));
    const docx = JSON.stringify(docxAbsaetze(ergebnis));
    expect(docx).toContain('31.10.2026');
    expect(docx).not.toContain('10.09.2026');
    const pdf = vorlagenPdfDokument(ergebnis, {}).output();
    expect(pdf).toContain('31.10.2026');
    expect(pdf).not.toContain(PZ_SATZ);
  });

  it('Antworten ohne Feld (alter Entwurf / Link): unverändert Mo–Fr samt offengelegter Annahme', () => {
    const a = fall();
    delete (a as MitArbeitstagen).arbeitstageWoche;
    const { engine } = kagZusammenstellen(a);
    expect(engine?.beendigungISO).toBe('2026-09-10');
    expect(kagIstProbezeit(a)).toBe(true);
    expect(pruefeKagGates(a, engine).warnungen.join(' ')).toContain(WARN_NICHT_ANGEGEBEN);
  });
});

// Maske: ein gespeicherter Entwurf mit Mo–Mi (Speicherschlüssel der Seite,
// useWizardState) muss dasselbe Datum in die Vorschau tragen wie die Engine.
describe('RL-16b Vorlage Arbeitgeber: Entwurf mit Arbeitstagen', () => {
  const KEY = 'lexmetrik.vorlage.kuendigung-arbeitgeber.v1';
  const original = (globalThis as { localStorage?: Storage }).localStorage;
  afterEach(() => { (globalThis as { localStorage?: Storage }).localStorage = original; });
  const stub = (inhalt: Record<string, string>) => {
    const m = new Map(Object.entries(inhalt));
    return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v); }, removeItem: (k: string) => { m.delete(k); } } as Storage;
  };
  const rendern = async (entwurf: object) => {
    (globalThis as { localStorage?: Storage }).localStorage = stub({ [KEY]: JSON.stringify(entwurf) });
    const { VorlageKuendigungArbeitgeber } = await import('../pages/VorlageKuendigungArbeitgeber');
    return renderToString(
      <MemoryRouter initialEntries={['/vorlagen/kuendigung-arbeitgeber']}>
        <LocaleProvider><VorlageKuendigungArbeitgeber /></LocaleProvider>
      </MemoryRouter>,
    );
  };

  it('Mo–Mi im Entwurf → Vorschau «per 31.10.2026», nicht 10.09.2026', async () => {
    const html = await rendern(fall({ arbeitstageWoche: [1, 2, 3] }));
    expect(html).toContain('31.10.2026');
    expect(html).not.toContain('10.09.2026');
  });

  it('Entwurf ohne Feld (vor RL-16b gespeichert) → Mo–Fr, Vorschau 10.09.2026', async () => {
    const alt = { ...fall() } as MitArbeitstagen;
    delete alt.arbeitstageWoche;
    const html = await rendern(alt);
    expect(html).toContain('10.09.2026');
  });
});
