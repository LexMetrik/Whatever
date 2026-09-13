import { describe, it, expect } from 'vitest';
import { reiterKarteTeile, reiterTitel, type TabEintrag } from '../lib/tabs';
import type { VerlaufManifeste } from '../lib/verlaufLabel';
import type { BrowseErlass } from '../lib/normtext/browse-typen';

// ── W2·18 Welle 3 Punkt 4 (Fahrplan §4.R3) · EINE QUELLE, ZWEI FORMEN ───────
//
// Die Hover-Karte zeigt dieselbe Auskunft wie der `title` — nur zerlegt und
// beschriftet statt mit «—»-Fugen zusammengeklebt. Zwei Ableitungen wären zwei
// Wahrheiten (§5); darum kommt der Einzeiler seit diesem Schritt AUS den
// Kartenteilen. Diese Sonde pinnt beides: dass die Zerlegung stimmt und dass
// der Einzeiler dabei Zeichen für Zeichen derselbe geblieben ist (§6,
// Verhaltensneutralität).
//
// ROT ZU BEKOMMEN (§6.7, so gefahren): in `lib/tabs.reiterTitel` die
// Zusammensetzung ändern — etwa `Stand ${k.stand}` auf `${k.stand}` kürzen
// oder die Lesestellung vor die Beschreibung ziehen.

const erlass = (p: Partial<BrowseErlass>): BrowseErlass => ({
  key: 'x', ebene: 'bund', kanton: null, kuerzel: 'X', titel: 'X', sr: null,
  rechtsgebiet: 'privat', sprache: 'de', rang: 0, status: 'snapshot',
  datei: null, artikelAnzahl: 0, stand: '2026-01-01', quelleUrl: '', fassungsToken: '', pdfPfad: null,
  ...p,
} as BrowseErlass);

const M: VerlaufManifeste = {
  gesetze: {
    erzeugt: '2026-01-01',
    erlasse: [erlass({ key: 'OR', kuerzel: 'OR', titel: 'Obligationenrecht', stand: '2026-09-02' })],
  },
  entscheide: null,
};

const t = (path: string): TabEintrag => ({ path });

describe('reiterKarteTeile — die Auskunft eines Reiters, zerlegt', () => {
  it('ein Rechner: Volltitel, Kurzform, Art und Kurzbeschreibung — kein Stand', () => {
    const k = reiterKarteTeile(t('/rechner/zpo-fristen'), {});
    expect(k.volltitel).toBe('Verfahrens- & Rechtsmittelfristen');
    expect(k.kurzform).toBe('ZPO-Fristen');
    expect(k.kategorie).toEqual({ label: 'Rechner', pikto: '∑' });
    expect(k.beschreibung).toBe('Verfahrens- und Rechtsmittelfristen mit Gerichtsferien und Stillstand.');
    // Nichts wird geraten (§7): ein Rechner hat weder Stand noch Lesestellung.
    expect(k.stand).toBe(null);
    expect(k.datum).toBe(null);
    expect(k.gelesen).toBe(null);
  });

  it('ein Gesetz mit Lesestellung: Stand aus dem Manifest, Artikel aus der Adresse', () => {
    const k = reiterKarteTeile(t('/gesetze/bund/OR#art-336_c'), M);
    expect(k.kategorie.label).toBe('Gesetze');
    expect(k.stand, 'TT.MM.JJJJ aus dem ISO-Stand des Manifests').toBe('02.09.2026');
    expect(k.gelesen).toBe('Art. 336c');
  });

  it('der ausgeschriebene Erlasstitel steht als eigener Teil daneben', () => {
    // Der Verlaufstitel eines Gesetzes IST das Kürzel («OR») — die Karte soll
    // genau dieses Kürzel auflösen, der Einzeiler darf davon nichts merken.
    const k = reiterKarteTeile(t('/gesetze/bund/OR'), M);
    expect(k.volltitel).toBe('OR');
    expect(k.langtitel).toBe('Obligationenrecht');
    expect(reiterTitel(t('/gesetze/bund/OR'), M)).toBe('OR — Stand 02.09.2026');
  });

  it('ein Rechner hat keinen Langtitel — nichts wird erfunden', () => {
    expect(reiterKarteTeile(t('/rechner/zpo-fristen'), {}).langtitel).toBe(null);
  });

  it('ohne Manifest bleibt der Stand leer statt geraten', () => {
    expect(reiterKarteTeile(t('/gesetze/bund/OR'), {}).stand).toBe(null);
  });
});

describe('reiterTitel — derselbe Einzeiler wie vor der Zerlegung', () => {
  // Die drei Fälle decken alle vier optionalen Glieder ab; die Erwartungen sind
  // die GEMESSENEN Zeichenketten des Standes vor dem Umbau (13.9.2026).
  it('Rechner: Volltitel — Kurzbeschreibung', () => {
    expect(reiterTitel(t('/rechner/zpo-fristen'), {})).toBe(
      'Verfahrens- & Rechtsmittelfristen — Verfahrens- und Rechtsmittelfristen mit Gerichtsferien und Stillstand.');
  });

  it('Gesetz ohne Manifest: Platzhalter — gelesen bis Art. 336c', () => {
    expect(reiterTitel(t('/gesetze/bund/OR#art-336_c'), {})).toBe(
      'Gesetz öffnen — gelesen bis Art. 336c');
  });

  it('Gesetz mit Manifest: Kürzel — Stand — gelesen bis', () => {
    expect(reiterTitel(t('/gesetze/bund/OR#art-336_c'), M)).toBe(
      'OR — Stand 02.09.2026 — gelesen bis Art. 336c');
  });

  it('der Einzeiler ist die Verkettung der Kartenteile, nichts daneben', () => {
    for (const p of ['/rechner/zpo-fristen', '/gesetze/bund/OR#art-336_c', '/vorlagen/nda']) {
      const k = reiterKarteTeile(t(p), M);
      expect(reiterTitel(t(p), M)).toBe([
        k.volltitel,
        k.stand ? `Stand ${k.stand}` : null,
        k.datum ? `vom ${k.datum}` : null,
        k.beschreibung,
        k.gelesen ? `gelesen bis ${k.gelesen}` : null,
      ].filter(Boolean).join(' — '));
    }
  });
});
