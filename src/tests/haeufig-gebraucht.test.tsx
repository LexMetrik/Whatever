import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { HaeufigGebraucht } from '../components/start/HaeufigGebraucht';
import { HAEUFIG_KUERZEL, haeufigeErlasse } from '../components/start/haeufigAuswahl';
import { ERLASS_REGISTER } from '../lib/normtext/register';
import { erlassPfad } from '../lib/normtext/erlassAdresse';

// ─── Startseite · «Häufig gebraucht» (W2·29-WERKBANK-START-UEBERARBEITUNG U4) ──
//
// David 24.9.2026 (FAHRPLAN-WERKBANK-UMBAU §5d-bis U4): direkte Links
// BV · ZGB · OR · StGB · ZPO · StPO · SchKG in den Leser, Ziele aus dem
// Erlass-Register (§5, keine handgeschriebenen URLs).

const html = () => renderToString(<MemoryRouter><HaeufigGebraucht /></MemoryRouter>);

describe('Häufig gebraucht', () => {
  it('jedes der sieben Kürzel steht genau einmal als Bundeserlass im Register', () => {
    for (const k of HAEUFIG_KUERZEL) {
      const treffer = ERLASS_REGISTER.filter((e) => e.ebene === 'bund' && e.kuerzel === k);
      expect(treffer, k).toHaveLength(1);
    }
    expect(haeufigeErlasse().map((e) => e.kuerzel)).toEqual([...HAEUFIG_KUERZEL]);
  });

  it('rendert sieben Links in Davids Reihenfolge, Ziel = erlassPfad des Registers', () => {
    const s = html();
    const hrefs = [...s.matchAll(/<a [^>]*href="([^"]+)"/g)].map((m) => m[1]);
    expect(hrefs).toEqual(haeufigeErlasse().map((e) => erlassPfad(e)));
    // Stichprobe gegen die kanonische Adresse (Schlüssel ≠ Kürzel).
    expect(hrefs).toContain('/gesetze/bund/STGB');
    expect(hrefs).toContain('/gesetze/bund/SCHKG');
  });

  it('Kürzel sichtbar, voller Titel als Tooltip und im zugänglichen Namen (Kürzel vorn)', () => {
    const s = html();
    const zgb = ERLASS_REGISTER.find((e) => e.key === 'ZGB')!;
    expect(s).toContain(`title="${zgb.titel}"`);
    expect(s).toContain(`aria-label="ZGB – ${zgb.titel}"`);
    expect(s).toMatch(/>ZGB<\/a>/);
    expect(s).toContain('Häufig gebraucht</h2>');
  });
});
