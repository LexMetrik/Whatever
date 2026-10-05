/**
 * Tests für die Offline-Prüf-Logik aus check-drift.ts.
 * TDD: reine Funktionen (pruefeBundFassung, pruefeBundVollstaendigkeit) ohne Netz/FS.
 * §2: kein Date.now/Math.random.
 */

import { describe, it, expect } from 'vitest';
import {
  pruefeBundFassung,
  pruefeBundVollstaendigkeit,
  pruefeCoverage,
  fedlexEliAusUrl,
  pruefeLabelUrl,
  verbindeExits,
} from '../../scripts/normtext/drift-logik.ts';
import type { NormSnapshot, RegisterEintragLite } from '../../scripts/normtext/drift-logik.ts';

// ─── pruefeBundFassung ────────────────────────────────────────────────────────

describe('pruefeBundFassung', () => {
  const cacheMap = new Map<string, string>([
    ['or', '20260101'],
    ['zgb', '20260101'],
    ['schkg', '20260101'],
  ]);

  it('liefert leere Liste wenn alle Tokens übereinstimmen', () => {
    const snapshots: NormSnapshot[] = [
      { id: 'bund/OR/art_11', quelle: 'OR', fassungsToken: '20260101' },
      { id: 'bund/ZGB/art_360', quelle: 'ZGB', fassungsToken: '20260101' },
      { id: 'bund/SCHKG/art_17', quelle: 'SCHKG', fassungsToken: '20260101' },
    ];
    const mismatches = pruefeBundFassung(snapshots, cacheMap);
    expect(mismatches).toHaveLength(0);
  });

  it('erkennt einen Mismatch', () => {
    const snapshots: NormSnapshot[] = [
      { id: 'bund/OR/art_11', quelle: 'OR', fassungsToken: '20250101' }, // veraltet!
      { id: 'bund/ZGB/art_360', quelle: 'ZGB', fassungsToken: '20260101' },
    ];
    const mismatches = pruefeBundFassung(snapshots, cacheMap);
    expect(mismatches).toHaveLength(1);
    expect(mismatches[0].id).toBe('bund/OR/art_11');
    expect(mismatches[0].snapshotToken).toBe('20250101');
    expect(mismatches[0].cacheToken).toBe('20260101');
  });

  it('erkennt mehrere Mismatches', () => {
    const snapshots: NormSnapshot[] = [
      { id: 'bund/OR/art_11', quelle: 'OR', fassungsToken: '20240101' },
      { id: 'bund/ZGB/art_360', quelle: 'ZGB', fassungsToken: '20240101' },
      { id: 'bund/SCHKG/art_17', quelle: 'SCHKG', fassungsToken: '20260101' },
    ];
    const mismatches = pruefeBundFassung(snapshots, cacheMap);
    expect(mismatches).toHaveLength(2);
    const ids = mismatches.map((m) => m.id);
    expect(ids).toContain('bund/OR/art_11');
    expect(ids).toContain('bund/ZGB/art_360');
  });

  it('ignoriert Einträge ohne passenden Cache-Eintrag', () => {
    const snapshots: NormSnapshot[] = [
      { id: 'bund/UNBEKANNT/art_1', quelle: 'UNBEKANNT', fassungsToken: 'irgendwas' },
    ];
    const mismatches = pruefeBundFassung(snapshots, cacheMap);
    expect(mismatches).toHaveLength(0);
  });

  it('ignoriert Nicht-Bund-Einträge', () => {
    const snapshots: NormSnapshot[] = [
      { id: 'kanton/ZG/161.7/art_11', quelle: 'ZG', fassungsToken: 'abc123' },
    ];
    const mismatches = pruefeBundFassung(snapshots, cacheMap);
    expect(mismatches).toHaveLength(0);
  });

  it('ist case-insensitiv beim Gesetz-Namen (OR vs or)', () => {
    // cacheMap hat Schlüssel lowercase; id hat uppercase
    const snapshots: NormSnapshot[] = [
      { id: 'bund/OR/art_11', quelle: 'OR', fassungsToken: '20260101' },
    ];
    const map = new Map([['or', '20260101']]);
    const mismatches = pruefeBundFassung(snapshots, map);
    expect(mismatches).toHaveLength(0);
  });
});

// ─── pruefeBundVollstaendigkeit ───────────────────────────────────────────────

describe('pruefeBundVollstaendigkeit', () => {
  it('liefert leere Liste wenn alle Anker vorhanden', () => {
    const snapshotIds = new Set([
      'bund/OR/art_11',
      'bund/OR/art_32',
      'bund/ZGB/art_360',
    ]);
    const ankerMap = new Map([
      ['or', ['art_11', 'art_32']],
      ['zgb', ['art_360']],
    ]);
    const fehlend = pruefeBundVollstaendigkeit(snapshotIds, ankerMap);
    expect(fehlend).toHaveLength(0);
  });

  it('meldet fehlenden Pflicht-Anker', () => {
    const snapshotIds = new Set([
      'bund/OR/art_11',
      // art_32 fehlt!
    ]);
    const ankerMap = new Map([['or', ['art_11', 'art_32']]]);
    const fehlend = pruefeBundVollstaendigkeit(snapshotIds, ankerMap);
    expect(fehlend).toHaveLength(1);
    expect(fehlend[0]).toBe('bund/OR/art_32');
  });

  it('meldet mehrere fehlende Anker aus verschiedenen Gesetzen', () => {
    const snapshotIds = new Set<string>(); // leer
    const ankerMap = new Map([
      ['or', ['art_11']],
      ['zgb', ['art_360']],
    ]);
    const fehlend = pruefeBundVollstaendigkeit(snapshotIds, ankerMap);
    expect(fehlend).toHaveLength(2);
    expect(fehlend).toContain('bund/OR/art_11');
    expect(fehlend).toContain('bund/ZGB/art_360');
  });

  it('liefert leere Liste bei leerer ankerMap', () => {
    const snapshotIds = new Set(['bund/OR/art_11']);
    const ankerMap = new Map<string, string[]>();
    const fehlend = pruefeBundVollstaendigkeit(snapshotIds, ankerMap);
    expect(fehlend).toHaveLength(0);
  });
});

// ─── fedlexEliAusUrl (P1-b Coverage) ──────────────────────────────────────────

describe('fedlexEliAusUrl', () => {
  it('strippt Domain, /de-Suffix und Anker', () => {
    expect(fedlexEliAusUrl('https://www.fedlex.admin.ch/eli/cc/24/233_245_233/de')).toBe('cc/24/233_245_233');
    expect(fedlexEliAusUrl('https://www.fedlex.admin.ch/eli/cc/2010/262/de#art_4')).toBe('cc/2010/262');
    expect(fedlexEliAusUrl('https://www.fedlex.admin.ch/eli/cc/1999/359/fr')).toBe('cc/1999/359');
  });
  it('gibt null für Nicht-Fedlex-URLs', () => {
    expect(fedlexEliAusUrl('https://eur-lex.europa.eu/eli/reg/2016/679/oj')).toBeNull();
    expect(fedlexEliAusUrl(null)).toBeNull();
    expect(fedlexEliAusUrl('')).toBeNull();
  });
});

// ─── pruefeCoverage (P1-b) ────────────────────────────────────────────────────

describe('pruefeCoverage', () => {
  const pinEliSet = new Set(['cc/24/233_245_233', 'cc/1999/359']);
  const pdfEmbedKeys = new Set(['EMRK', 'NYUE']);
  const reg = (p: Partial<RegisterEintragLite>): RegisterEintragLite => ({
    key: 'X', ebene: 'bund', status: 'snapshot', quelleUrl: null, ...p,
  });

  it('grün, wenn jeder Bund-Volltext einen Pin und jedes pdf-embed eine Quelle hat', () => {
    const luecken = pruefeCoverage(
      [
        reg({ key: 'ZGB', quelleUrl: 'https://www.fedlex.admin.ch/eli/cc/24/233_245_233/de' }),
        reg({ key: 'ASYLV1', quelleUrl: 'https://www.fedlex.admin.ch/eli/cc/1999/359/de' }),
        reg({ key: 'EMRK', status: 'pdf-embed', quelleUrl: 'https://www.fedlex.admin.ch/eli/cc/1974/2151_2151_2151/de' }),
      ],
      pinEliSet,
      pdfEmbedKeys,
    );
    expect(luecken).toHaveLength(0);
  });

  it('rot, wenn ein Fedlex-Bund-Volltext keinen Pin hat (parser-blindes Loch)', () => {
    const luecken = pruefeCoverage(
      [reg({ key: 'GEHEIM', quelleUrl: 'https://www.fedlex.admin.ch/eli/cc/9/9/de' })],
      pinEliSet,
      pdfEmbedKeys,
    );
    expect(luecken).toEqual([{ key: 'GEHEIM', grund: expect.stringContaining('ohne cache.sh-Pin') }]);
  });

  it('rot, wenn ein pdf-embed keine PDF_EMBED_QUELLE hat', () => {
    const luecken = pruefeCoverage(
      [reg({ key: 'FREMD', status: 'pdf-embed', quelleUrl: 'https://www.fedlex.admin.ch/eli/cc/9/9/de' })],
      pinEliSet,
      pdfEmbedKeys,
    );
    expect(luecken).toEqual([{ key: 'FREMD', grund: 'pdf-embed ohne PDF_EMBED_QUELLE' }]);
  });

  it('nimmt Kanton, nur-live-link und Nicht-Fedlex-Bund aus', () => {
    const luecken = pruefeCoverage(
      [
        reg({ key: 'KAN', ebene: 'kanton', quelleUrl: 'https://www.lexfind.ch/x' }),
        reg({ key: 'STUB', status: 'nur-live-link', quelleUrl: 'https://www.fedlex.admin.ch/eli/cc/9/9/de' }),
        reg({ key: 'EUVO', quelleUrl: 'https://eur-lex.europa.eu/eli/reg/2016/679/oj' }),
      ],
      pinEliSet,
      pdfEmbedKeys,
    );
    expect(luecken).toHaveLength(0);
  });
});

// ─── pruefeLabelUrl (W2·27-BUND-FERTIG: Label-/Anker-Riegel) ─────────────────

describe('pruefeLabelUrl', () => {
  const B = 'https://www.fedlex.admin.ch/eli/cc/2006/859/de';
  const snap = (id: string, artikelLabel: string, quelleUrl: string): NormSnapshot => ({
    id,
    quelle: 'KKV',
    fassungsToken: '20251125',
    artikelLabel,
    quelleUrl,
  });
  const regeln = (s: NormSnapshot[]) => pruefeLabelUrl(s).map((b) => b.regel);

  it('sauberer Bestand (Basis, Ordinal-Suffix, __N mit Ordinal-Label) ist grün', () => {
    expect(
      regeln([
        snap('bund/KKV/art_126_z', 'Art. 126z', `${B}#art_126_z`),
        snap('bund/KKV/art_126_z_bis', 'Art. 126zbis', `${B}#art_126_z_bis`),
        snap('bund/KKV/art_126_z__2', 'Art. 126ztredecies', `${B}#ta126z`),
        snap('bund/KKV/disp_u2_art_1', 'Art. 1', `${B}#disp_u2/art_1`),
      ]),
    ).toEqual([]);
  });

  it('B1: Label weicht von der id ab / Anker weicht vom id-Token ab', () => {
    expect(regeln([snap('bund/KKV/art_41', 'Art. 42', `${B}#art_41`)])).toEqual(['B1-label']);
    expect(regeln([snap('bund/KKV/art_41', 'Art. 41', `${B}#art_42`)])).toEqual(['B1-anker']);
  });

  it('B2: __N-Rückfall — Label == Basis-Label (PR #890) und Anker mit Synthese-Suffix', () => {
    const r = regeln([
      snap('bund/KKV/art_126_z', 'Art. 126z', `${B}#art_126_z`),
      snap('bund/KKV/art_126_z__2', 'Art. 126z', `${B}#art_126_z__2`),
    ]);
    expect(r).toContain('B2-label');
    expect(r).toContain('B2-anker-synthese');
  });

  it('B3: zwei Artikel desselben Erlasses mit derselben quelleUrl', () => {
    expect(
      regeln([
        snap('bund/KKV/art_126_z', 'Art. 126z', `${B}#art_126_z`),
        snap('bund/KKV/art_126_z__2', 'Art. 126ztredecies', `${B}#art_126_z`),
      ]),
    ).toEqual(['B3-url-doppelt']);
  });

  it('B4: fehlender Anker; abweichende Basis-URL im selben Erlass', () => {
    expect(regeln([snap('bund/KKV/disp_u2_art_1', 'Art. 1', B)])).toEqual(['B4-ohne-anker']);
    expect(
      regeln([
        snap('bund/KKV/art_1', 'Art. 1', `${B}#art_1`),
        snap('bund/KKV/art_2', 'Art. 2', 'https://anderswo.example/de#art_2'),
      ]),
    ).toEqual(['B4-basis-url']);
  });

  it('gleiche URL in VERSCHIEDENEN Erlassen ist kein B3; Nicht-Bund-ids werden übersprungen', () => {
    expect(
      regeln([
        snap('bund/OR/art_1', 'Art. 1', `${B}#art_1`),
        snap('bund/ZGB/art_1', 'Art. 1', `${B}#art_1`),
        snap('kanton/AG/291.150/art_4', '§ 4', ''),
      ]),
    ).toEqual([]);
  });
});

// Gegenprüfung 5.10.2026 (MONITOR-Rückbau, Nebenbefund): Netzfehler einer Kanton-/HTM-/ZH-/
// PDF-Gruppe endeten als console.warn mit Exit 0 — ein dauerhaft blindes Netz-Glied blieb
// grün. Jetzt Exit 2 («keine Aussage»), echte Drift (1) hat Vorrang.
describe('verbindeExits', () => {
  it('alles grün ⇒ 0', () => expect(verbindeExits([0, 0])).toBe(0));
  it('Netzfehler ohne Drift ⇒ 2', () => expect(verbindeExits([0, 2])).toBe(2));
  it('echte Drift hat Vorrang vor Netzfehler ⇒ 1', () => {
    expect(verbindeExits([2, 1])).toBe(1);
    expect(verbindeExits([1, 2])).toBe(1);
  });
  it('unerwarteter Exit (Absturz, 127) ist rot ⇒ 1', () => expect(verbindeExits([2, 127])).toBe(1));
  it('leere Liste ⇒ 0', () => expect(verbindeExits([])).toBe(0));
});
