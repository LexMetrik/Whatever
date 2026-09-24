import { describe, it, expect } from 'vitest';
import {
  KM_DEFAULTS, KM_SCHEMA, kmZusammenstellen, kmEngine, pruefeKmGates,
  type KmAntworten,
} from '../lib/vorlagen/kuendigungMieter';
import { berechneMietkuendigung } from '../lib/mietrecht';
import { dokumentAlsText } from '../lib/vorlagen/vorlagenText';

// Akzeptanztests Maske 2a (Spez. bibliothek/recherche/kuendigungs-masken.md):
// Mietengine LIVE (§5), Familienwohnung-Blocker hart (Art. 266m/266o OR).

const basis = (over: Partial<KmAntworten> = {}): KmAntworten => ({
  ...KM_DEFAULTS,
  absenderName: 'Anna Muster', absenderAdresse: 'Beispielweg 1, 4051 Basel',
  adressatName: 'Immo AG', adressatAdresse: 'Hausweg 2, 4053 Basel',
  mietobjektAdresse: 'Beispielweg 1, 4051 Basel, 3. OG',
  objekt: 'wohnung', kanton: 'ZH',
  zugang: '2025-05-20',
  ort: 'Zürich', datum: '2026-06-06',
  ...over,
});

describe('Vorlage Kündigung Mieter:in (Maske 2a)', () => {
  it('Endtermin stammt 1:1 aus der Mietengine (§5): Wohnung ZH ortsüblich → 30.09.2025', () => {
    const a = basis();
    const { ergebnis, engine } = kmZusammenstellen(a);
    const direkt = berechneMietkuendigung({
      kuendigungsart: 'ordentlich', objekt: 'wohnung', zugang: '2025-05-20',
      kanton: 'ZH', partei: 'mieter', terminQuelle: 'ortsueblich', familienwohnung: false,
    });
    expect(engine!.endtermin).toBe(direkt.endtermin);
    expect(dokumentAlsText(ergebnis)).toContain(`per ${direkt.endtermin}`);
  });

  it('G-FAMILIENWOHNUNG: ohne Zustimmung → Engine nichtig, harter Blocker, kein Datum im Brief (§8)', () => {
    const a = basis({ familienwohnung: true, zustimmungEhegatte: false, ehegatteName: 'Beat Muster' });
    const { ergebnis, engine } = kmZusammenstellen(a);
    expect(engine!.status).toBe('nichtig');
    const gates = pruefeKmGates(a, engine);
    expect(gates.blocker.length).toBe(1);
    expect(gates.blocker[0]).toContain('266m');
    expect(dokumentAlsText(ergebnis)).toContain('per ________');
    expect(ergebnis.aufgenommen).not.toContain('M_unterschrift_ehegatte');
  });

  it('Familienwohnung MIT Zustimmung: Zustimmungs-Baustein + zweite Unterschriftslinie', () => {
    const a = basis({ familienwohnung: true, zustimmungEhegatte: true, ehegatteName: 'Beat Muster' });
    const { ergebnis, engine } = kmZusammenstellen(a);
    expect(engine!.status).toBe('ok');
    expect(ergebnis.aufgenommen).toContain('M_familienwohnung_zustimmung');
    expect(ergebnis.aufgenommen).toContain('M_unterschrift_ehegatte');
    expect(dokumentAlsText(ergebnis)).toContain('Beat Muster (Zustimmung nach Art. 266m OR)');
  });

  it('Art.-264-Pfad: Baustein nur mit Namen; unbestätigte Trias → Warnung', () => {
    const ohneName = kmZusammenstellen(basis({ ausserterminlich: true }));
    expect(ohneName.ergebnis.aufgenommen).not.toContain('M_ausserterminlich_264');
    const a = basis({ ausserterminlich: true, nachmieterName: 'Carla Neu' });
    const { ergebnis, engine } = kmZusammenstellen(a);
    expect(ergebnis.aufgenommen).toContain('M_ausserterminlich_264');
    const gates = pruefeKmGates(a, engine);
    expect(gates.warnungen.some((w) => w.includes('zahlungsfähig'))).toBe(true);
    const ok = pruefeKmGates(basis({ ausserterminlich: true, nachmieterName: 'Carla Neu', nachmieterZahlungsfaehig: true, uebernahmeGleicheBedingungen: true }), engine);
    expect(ok.warnungen.some((w) => w.includes('zahlungsfähig') && w.includes('Befreiungsrisiko'))).toBe(false);
  });

  it('Mitmieter: Satz in der Erklärung + eigene Unterschriftslinien', () => {
    const { ergebnis } = kmZusammenstellen(basis({ mitmieter: ['Beat Bewohner', 'Cora Co'] }));
    const text = dokumentAlsText(ergebnis);
    expect(text).toContain('gemeinsam mit Beat Bewohner, Cora Co.');
    expect(text).toContain('Beat Bewohner');
    expect(text.match(/_{6,}/g)!.length).toBeGreaterThanOrEqual(3); // Haupt + 2 Mitmieter
  });

  it('verfehlter Termin: Hinweis (kein Blocker) — Geschäftsraum ZH, Zugang 20.5. → 31.03.2026', () => {
    const a = basis({ objekt: 'geschaeftsraum' });
    const { engine } = kmZusammenstellen(a);
    expect(engine!.endtermin).toBe('31.03.2026');
    const gates = pruefeKmGates(a, engine);
    expect(gates.blocker).toEqual([]);
    expect(gates.hinweise.some((h) => h.includes('266a Abs. 2'))).toBe(true);
  });

  // F4-01 (W2·30-RL-W1): späteste Zustellung am Sonntag 31.8.2025 wird nicht
  // auf Mo 1.9. verschoben (Art. 78 OR erfasst den Zugangstag vor Fristbeginn
  // nicht) → Zugang 1.9. verfehlt den 30.11.2025, Brief nennt 31.12.2025.
  it('F4-01: Zugang Mo 1.9.2025, jedes Monatsende → Brief per 31.12.2025, nicht 30.11.2025', () => {
    const a = basis({ zugang: '2025-09-01', terminQuelle: 'jedes_monatsende' });
    const { ergebnis, engine } = kmZusammenstellen(a);
    expect(engine!.endtermin).toBe('31.12.2025');
    expect(dokumentAlsText(ergebnis)).toContain('per 31.12.2025');
    expect(dokumentAlsText(ergebnis)).not.toContain('per 30.11.2025');
  });

  it('Guards: möbliertes Zimmer braucht Mietbeginn; bewegliche Sache nicht; Kanton Pflicht', () => {
    expect(kmEngine(basis({ objekt: 'moebliertes_zimmer', mietbeginn: '' }))).toBeNull();
    expect(kmEngine(basis({ objekt: 'moebliertes_zimmer', mietbeginn: '2025-03-01' }))).not.toBeNull();
    expect(kmEngine(basis({ objekt: 'bewegliche_sache' }))).not.toBeNull();
    expect(kmEngine(basis({ kanton: '' }))).toBeNull();
  });

  it('Schema-Konventionen: Eingabe-Format, fertig, Schriftform-Hinweis nur Wohn-/Geschäftsraum', () => {
    expect(KM_SCHEMA.format).toBe('eingabe');
    expect(KM_SCHEMA.ausgabeArt).toBe('fertig');
    const wohnung = pruefeKmGates(basis(), kmEngine(basis()));
    expect(wohnung.hinweise.some((h) => h.includes('266l'))).toBe(true);
    const beweglich = basis({ objekt: 'bewegliche_sache' });
    expect(pruefeKmGates(beweglich, kmEngine(beweglich)).hinweise.some((h) => h.includes('266l'))).toBe(false);
  });
});

describe('Bug-Check-Fix 10.6.2026: keine Fragment-Striche in der Unterschriftszeile', () => {
  it('Standardfall ohne Mitmieter: Unterschriftsblock endet mit dem Namen (vorher «Name________»)', () => {
    const { ergebnis } = kmZusammenstellen({ ...KM_DEFAULTS, absenderName: 'Max Muster', kanton: 'BS', zugang: '2026-06-12', mietbeginn: '2024-01-01' });
    const u = ergebnis.dokument.absaetze.map((a) => a.text).join('\n');
    expect(u).not.toContain('Max Muster________');
    expect(u).toContain('Max Muster');
  });
});
