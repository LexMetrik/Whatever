/**
 * W2·17-UI-BEFUNDE · Gliederung (Leser-Inventur 1.–2.10.2026): Wächter für die
 * Befunde der Gliederungs-Leiste. Jeder Fall ist gegen den Stand VOR seinem Fix
 * rot gesehen (§6.7); der Rot-Beweis steht im Commit-Body.
 *
 * Alles läuft auf den ECHTEN Snapshots (Muster: gliederung-sichtbarkeit.test.ts)
 * und ohne Zeit- oder Warte-Logik.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { baueGliederungsbaum } from '../lib/normtext/browse';
import { ladeNormFixture } from './fixtures/normtext-fixture';
import { kuratiereTocSektionen } from '../pages/gesetz-leser/berechnungen';
import { istAnhangEintrag } from '../pages/gesetz-leser/gliederungsArtikel';
import {
  baueGliederungsModell, flacheZeilen, zeilenAnsicht, type GliederungsModell, type GliederungsKnoten,
} from '../pages/gesetz-leser/gliederungsModell';
import { leistenKlappIds, alleKlappIds } from '../pages/gesetz-leser/klappKarte';
import { vollText } from '../pages/gesetz-leser/parts/klappNamen';
import type { NormSnapshot } from '../lib/normtext/typen';

type Ebene = 'bund' | 'kanton';

function lade(ebene: Ebene, key: string): GliederungsModell & { eintraege: NormSnapshot[] } {
  const { eintraege, struktur } = ladeNormFixture(ebene, key);
  const roh = baueGliederungsbaum(eintraege, struktur);
  const sektionen = kuratiereTocSektionen(roh.sektionen);
  // `startSichtbarGo: true` = der Leser (leserV3Modell.ts).
  const m = baueGliederungsModell({
    sektionen, ohneGliederung: roh.ohneGliederung, eintraege, struktur, startSichtbarGo: true,
  });
  return { ...m, eintraege };
}

/** Der ganze Korpus (Register = die eine Wahrheit, §5), einmal gebaut. */
const REGISTER = (() => {
  const roh = JSON.parse(readFileSync('public/normtext/register.json', 'utf8')) as
    { erlasse?: Array<{ key: string; ebene: string }> } | Array<{ key: string; ebene: string }>;
  return (Array.isArray(roh) ? roh : (roh.erlasse ?? [])).filter((e) => e.ebene === 'bund' || e.ebene === 'kanton');
})();
const KORPUS = new Map<string, ReturnType<typeof lade>>();
function korpus(): Array<[string, ReturnType<typeof lade>]> {
  if (KORPUS.size === 0) {
    for (const e of REGISTER) {
      try { KORPUS.set(`${e.ebene}/${e.key}`, lade(e.ebene as Ebene, e.key)); } catch { /* ohne Snapshot-Datei */ }
    }
  }
  return [...KORPUS.entries()];
}

// ═══ B7 · Der Artikel-Index folgt der amtlichen Reihenfolge ══════════════════
describe('B7 — Artikel-Index (B2/B4) in Dokumentreihenfolge', () => {
  const flach = (m: GliederungsModell) => m.artikelIndex.flatMap((g) => g.zeilen.map((z) => z.token));
  const dok = (m: { eintraege: NormSnapshot[] }) => m.eintraege.filter((e) => !istAnhangEintrag(e)).map((e) => e.artikel);

  it('NHG: Art. 1–11 stehen VOR Art. 12–12f, Art. 12g danach (vorher: Art. 12–12f zuerst, freie Artikel am Ende)', () => {
    const m = lade('bund', 'NHG');
    expect(m.modus).toBe('b2-index');
    const t = flach(m);
    expect(t.slice(0, 3)).toEqual(['1', '2', '3']);
    expect(t.indexOf('11')).toBeLessThan(t.indexOf('12'));
    expect(t.indexOf('12_f')).toBeLessThan(t.indexOf('12_g'));
    expect(t).toEqual(dok(m));
  });

  it('EMRK: Art. 1 («freier» Artikel vor Abschnitt I) steht ZUERST (vorher: als letzter)', () => {
    const m = lade('bund', 'EMRK');
    expect(m.modus).toBe('b2-index');
    expect(flach(m)[0]).toBe('1');
    expect(flach(m)).toEqual(dok(m));
  });

  it('ganzer Korpus: in jedem Index-Modus ist die Index-Folge die Dokumentfolge (Anhang-Einträge ausgenommen)', () => {
    const abweichend: string[] = [];
    let geprueft = 0;
    for (const [schluessel, m] of korpus()) {
      if (m.modus !== 'b2-index' && m.modus !== 'b4-mini') continue;
      geprueft++;
      const soll = dok(m);
      const ist = flach(m);
      if (ist.length !== soll.length || ist.some((t, i) => t !== soll[i])) abweichend.push(schluessel);
    }
    expect(geprueft).toBeGreaterThan(500);
    expect(abweichend, `Index ≠ Dokumentfolge: ${abweichend.join(', ')}`).toEqual([]);
  });
});

// ═══ B1-B01 · «alles auf/zu» wirkt auf das, was die Leiste zeigt ═════════════
describe('B1-B01 — «alles auf/zu» im Index-Modus', () => {
  it('B2-Index (VwVG): die Leiste rendert KEINEN Sektionsbaum — «alles auf/zu» hat dort nichts zu klappen', () => {
    const m = lade('bund', 'VWVG');
    expect(m.modus).toBe('b2-index');
    // vorher: 31 Zeilen-Ids eines Baums, den die Leiste gar nicht zeigt.
    expect(alleKlappIds(m.knoten).length).toBeGreaterThan(0);
    expect(leistenKlappIds(m)).toEqual([]);
  });

  it('B2-Index mit Anhang-Ast (EMRK): nur der gerenderte Anhang-Ast zählt', () => {
    const m = lade('bund', 'EMRK');
    const anhang = m.knoten.filter((k) => k.art === 'anhang');
    expect(anhang.length).toBeGreaterThan(0);
    expect(leistenKlappIds(m)).toEqual(alleKlappIds(anhang));
    expect(leistenKlappIds(m).length).toBeGreaterThan(0);
  });

  it('B1 (OR): alle Zeilen mit Kindern, unverändert', () => {
    const m = lade('bund', 'OR');
    expect(m.modus).toBe('b1-kompakt');
    expect(leistenKlappIds(m)).toEqual(alleKlappIds(m.knoten));
  });

  it('ganzer Korpus: jede Id, die «alles auf/zu» anfasst, gehört zu einer gerenderten Zeile', () => {
    const fremd: string[] = [];
    for (const [schluessel, m] of korpus()) {
      const gerendert = new Set<string>();
      const sammle = (ks: readonly GliederungsKnoten[]) => ks.forEach((k) => { k.ids.forEach((i) => gerendert.add(i)); sammle(k.kinder); });
      const baum = m.modus === 'b3-leer' ? []
        : (m.modus === 'b2-index' || m.modus === 'b4-mini') ? m.knoten.filter((k) => k.art === 'anhang') : m.knoten;
      sammle(baum);
      if (leistenKlappIds(m).some((id) => !gerendert.has(id))) fremd.push(schluessel);
    }
    expect(fremd).toEqual([]);
  });
});

// ═══ B6-B01 · Vorlese-Reihenfolge = Seh-Reihenfolge ══════════════════════════
describe('B6-B01 — der zugängliche Name folgt der sichtbaren Reihenfolge', () => {
  /** Was SektionBaumTOC zeigt: Blatt-Label, dann die übersprungenen Stufen in Klammern. */
  const sichtbar = (k: GliederungsKnoten): string => {
    const blatt = k.labelKette[k.labelKette.length - 1];
    return k.labelKette.length > 1 ? `${blatt} (${k.labelKette.slice(0, -1).join(' › ')})` : blatt;
  };

  it('ZGB «1. Übernahme (IV. Grundstücke)»: der Name beginnt mit dem sichtbaren Wort, nicht mit dem Eltern-Glied', () => {
    const m = lade('bund', 'ZGB');
    const z = flacheZeilen(m.knoten).find((k) => k.labelKette.length > 1 && k.labelKette[k.labelKette.length - 1] === '1. Übernahme');
    expect(z, 'Kettenzeile «1. Übernahme» fehlt im ZGB-Modell').toBeDefined();
    // vorher: «IV. Grundstücke › 1. Übernahme» (Eltern zuerst, Zeichen › statt Klammer).
    expect(vollText(z!)).toBe('1. Übernahme (IV. Grundstücke)');
  });

  it('ganzer Korpus: bei jeder verdichteten Zeile ist der Name der sichtbare Text (plus Zustandswort)', () => {
    const falsch: string[] = [];
    let ketten = 0;
    for (const [schluessel, m] of korpus()) {
      for (const k of flacheZeilen(m.knoten)) {
        if (k.labelKette.length < 2) continue;
        ketten++;
        const wort = k.aufgehoben ? ' — aufgehoben' : k.gegenstandslos ? ' — gegenstandslos' : '';
        if (vollText(k) !== sichtbar(k) + wort) falsch.push(`${schluessel}: ${k.label}`);
      }
    }
    expect(ketten).toBeGreaterThan(0);
    expect(falsch.slice(0, 5)).toEqual([]);
  });
});

// ═══ b1-offen · Entscheid David 2.10.2026 → der Entscheid vom 19.9. gilt ════
//
// Zwei Entscheide widersprachen sich: 13.8.2026 «Artikel-Ebene nur beim
// Aufklappen, nie beim Start» (David, W2·18-FEHLERBUCH) und 19.9.2026 «am
// gemischten Knoten folgen die Artikel der Zeile» (David, «bei svg art. 26
// nicht ersichtlich», PR #924, `artikelKinderOffen`). Gemessen 2.10.2026:
// 8 von 852 b1-offen-Erlassen starten mit > 40 Zeilen (max. 70, ZH-232.3).
// David 2.10.2026: dem NEUEREN Entscheid folgen — so lassen. Dieser Wächter
// hält fest, WORAUS der Überstand besteht: ausschliesslich aus Artikel-Zeilen
// gemischter Knoten. Eine Artikel-Zeile unter einer reinen Artikel-Zeile
// (13.8.) erscheint beim Start weiterhin nie.
describe('b1-offen — Startzustand nach dem Entscheid vom 19.9.2026', () => {
  const OFFEN_MAX = 40;
  const sichtbarBeimStart = (m: GliederungsModell): GliederungsKnoten[] => {
    const geh = (ks: readonly GliederungsKnoten[]): GliederungsKnoten[] =>
      ks.flatMap((k) => [k, ...geh(zeilenAnsicht(k, {}, m.startOffeneTiefe).sichtbareKinder)]);
    return geh(m.knoten);
  };

  it('Start-Zeilen = Sektions-Zeilen + Artikel-Zeilen gemischter Knoten; reine Artikel-Äste bleiben beim Start zu', () => {
    const ueber: string[] = [];
    let b1 = 0;
    for (const [schluessel, m] of korpus()) {
      if (m.modus !== 'b1-offen') continue;
      b1++;
      const start = sichtbarBeimStart(m);
      const artikel = start.filter((k) => k.art === 'artikel');
      // Jede sichtbare Artikel-Zeile hängt an einem GEMISCHTEN Knoten (19.9.) —
      // nie an einem, der nur Artikel trägt (13.8.).
      const eltern = (a: GliederungsKnoten) => flacheZeilen(m.knoten).find((k) => k.kinder.includes(a))!;
      for (const a of artikel) {
        expect(eltern(a).kinder.some((kk) => kk.art !== 'artikel'), `${schluessel}: ${a.label}`).toBe(true);
      }
      const sektionen = start.length - artikel.length;
      expect(sektionen, `${schluessel}: Sektions-Zeilen beim Start`).toBeLessThanOrEqual(OFFEN_MAX);
      if (start.length > OFFEN_MAX) ueber.push(schluessel.split('/')[1]);
    }
    expect(b1).toBeGreaterThan(500);
    // Der Überstand existiert (Messung 2.10.2026: 8 von 852, max. 70 Zeilen an ZH-232.3) und
    // wird bewusst hingenommen — die Prüfung oben stellt nur sicher, WORAUS er besteht.
    expect(ueber).toContain('ZH-232.3');
  });
});
