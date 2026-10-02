import { describe, it, expect } from 'vitest';
import { reiterKategorie, herkunftVon, stelleVonReiter, kantonVonPfad } from '../lib/tabGruppen';
import type { VerlaufManifeste } from '../lib/verlaufLabel';
import type { BrowseErlass } from '../lib/normtext/browse-typen';

// Reiter-Gruppierung (Auftrag David 26.6.2026, P3) — reine Funktionen (§2/§3).

const erlass = (p: Partial<BrowseErlass>): BrowseErlass => ({
  key: 'x', ebene: 'bund', kanton: null, kuerzel: 'X', titel: 'X', sr: null,
  rechtsgebiet: 'privat', sprache: 'de', rang: 0, status: 'snapshot',
  datei: null, artikelAnzahl: 0, stand: '2026-01-01', quelleUrl: '', fassungsToken: '', pdfPfad: null,
  ...p,
} as BrowseErlass);

const manifeste: VerlaufManifeste = {
  gesetze: {
    erzeugt: '2026-01-01',
    erlasse: [
      erlass({ key: 'or', ebene: 'bund', kuerzel: 'OR' }),
      erlass({ key: 'stg-zh', ebene: 'kanton', kanton: 'ZH', kuerzel: 'StG-ZH' }),
      erlass({ key: 'emrk', ebene: 'bund', kuerzel: 'EMRK', rechtsgebiet: 'international' }),
    ],
  },
  entscheide: null,
};

describe('reiterKategorie', () => {
  it('leitet die Kategorie aus dem Pfad-Präfix ab', () => {
    expect(reiterKategorie('/gesetze/bund/or')).toBe('gesetze');
    expect(reiterKategorie('/rechtsprechung/bge-123')).toBe('rechtsprechung');
    expect(reiterKategorie('/vorlagen/arbeitsvertrag')).toBe('vorlagen');
    expect(reiterKategorie('/rechner/tagerechner')).toBe('rechner');
    expect(reiterKategorie('/ueber-uns')).toBe('sonstiges');
  });
  it('ignoriert ?search und #hash', () => {
    expect(reiterKategorie('/gesetze/bund/or?r=2#art-41')).toBe('gesetze');
  });

  // ── Aus Fixer 1i (Prüfbefund 6.9.2026) · DIE ÜBERSICHT GEHÖRT IN IHRE GRUPPE
  // GEMESSEN: der Reiter `/gesetze` stand im Überlauf-Blatt (`layout/TabPanel`)
  // unter «Weitere» statt unter «Gesetze» — die Prüfung verlangte einen
  // Schrägstrich NACH dem Bereich, und den trägt die Übersicht nicht. Seit D7
  // ist sie ein Reiter wie jedes andere Dokument.
  // ROT ZU BEKOMMEN (§6.7, einmal gefahren): in `lib/tabGruppen.reiterKategorie`
  // das Glied `p === \`/${kat}\`` streichen ⇒ alle fünf Zeilen messen
  // «sonstiges».
  it('die Bereichs-Übersicht steht in ihrer eigenen Gruppe, nicht unter «Weitere»', () => {
    expect(reiterKategorie('/gesetze')).toBe('gesetze');
    expect(reiterKategorie('/rechtsprechung')).toBe('rechtsprechung');
    expect(reiterKategorie('/materialien')).toBe('materialien');
    expect(reiterKategorie('/vorlagen')).toBe('vorlagen');
    expect(reiterKategorie('/rechner')).toBe('rechner');
  });

  it('ein Präfix ist kein Bereich, wenn der Pfad nur so ANFÄNGT', () => {
    // «/gesetzestexte» ist kein Unterpfad von «/gesetze» — die Prüfung darf
    // nicht auf blosse Zeichenketten-Präsenz hereinfallen (§7).
    expect(reiterKategorie('/gesetzestexte')).toBe('sonstiges');
    expect(reiterKategorie('/rechnerei/x')).toBe('sonstiges');
  });

  it('die Übersicht behält Kategorie auch mit Query/Anker', () => {
    expect(reiterKategorie('/materialien?seite=2')).toBe('materialien');
  });
});

describe('herkunftVon', () => {
  it('Bund / Kanton / International korrekt aus dem aufgelösten Erlass', () => {
    expect(herkunftVon('/gesetze/bund/or', manifeste)).toBe('bund');
    expect(herkunftVon('/gesetze/kanton/stg-zh', manifeste)).toBe('kanton');
    expect(herkunftVon('/gesetze/bund/emrk', manifeste)).toBe('international'); // rechtsgebiet schlägt Ebene
  });
  it('null ohne Manifest / Nicht-Gesetz-Pfad', () => {
    expect(herkunftVon('/gesetze/bund/or')).toBeNull();
    expect(herkunftVon('/rechner/tagerechner', manifeste)).toBeNull();
  });
});

describe('kantonVonPfad', () => {
  it('liefert den Kanton nur für kantonale Gesetze', () => {
    expect(kantonVonPfad('/gesetze/kanton/stg-zh', manifeste)).toBe('ZH');
    expect(kantonVonPfad('/gesetze/bund/or', manifeste)).toBeNull();
  });
});

describe('stelleVonReiter (DFG-F01: Stelle aus dem Label, Rückfall aus dem Token)', () => {
  it('extrahiert «Art. N» aus dem #art-Anker (Unterstrich→Suffix)', () => {
    expect(stelleVonReiter({ path: '/gesetze/bund/or#art-41' })?.gelesen).toBe('Art. 41');
    expect(stelleVonReiter({ path: '/gesetze/bund/zgb?r=2#art-335_c' })?.gelesen).toBe('Art. 335c');
  });
  it('null ohne Anker und ausserhalb der Gesetze', () => {
    expect(stelleVonReiter({ path: '/gesetze/bund/or' })).toBeNull();
    expect(stelleVonReiter({ path: '/rechner/fristen#art-41' })).toBeNull();
  });
  it('M13: Schlusstitel-Token zeigt die Artikel-Nr. samt Gruppe, nicht das Token', () => {
    expect(stelleVonReiter({ path: '/gesetze/bund/ZGB#art-disp_u1_art_3' })).toMatchObject({ stelle: 'Art. 3', kern: 'SchlT ZGB' });
    expect(stelleVonReiter({ path: '/gesetze/bund/ZGB#art-disp_u1_art_31_32' })?.stelle).toBe('Art. 31–32');
    // Andere Gruppe als der ZGB-Schlusstitel: ohne Einträge steht die Zitierweise nicht fest ⇒ keine Stelle.
    expect(stelleVonReiter({ path: '/gesetze/bund/ZGB#art-disp_u2_art_178' })?.stelle).toBe('');
  });
});
