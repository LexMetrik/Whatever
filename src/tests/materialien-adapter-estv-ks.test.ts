import { describe, it, expect } from 'vitest';
import {
  parseDateiname,
  dokIdVon,
  doktypVon,
  erlasseAusArt,
  erlasseAusBeschreibung,
  titelDatumNachIso,
  beschreibungDatumNachIso,
  versionsJahrAusTitel,
  anzeigeNummer,
  dokRang,
  damTokenAusUrl,
  driftToken,
  parseIndexSeite,
  baueDokUndKanten,
  verarbeiteIndexSeiten,
  ESTV_KS_SEITEN,
  ESTV_KURIERT_BEKANNT,
  type RohEstvItem,
} from '../../scripts/materialien/adapter-estv-ks';

// E6a M4: reine Extraktions-/Gate-Funktionen des ESTV-KS-Adapters (§3 Q4). Kein Netz.

describe('parseDateiname (alle live beobachteten Muster, 4.7.2026)', () => {
  it('Standard-KS mit Serien-Block', () => {
    expect(parseDateiname('dbst-ks-2020-1-050a-d-de.pdf')).toEqual({ familie: 'ks', nummer: '50a', art: 'd', beilage: null, stem: null });
    expect(parseDateiname('dbst-ks-2020-1-049-dv-de.pdf')).toEqual({ familie: 'ks', nummer: '49', art: 'dv', beilage: null, stem: null });
  });
  it('KS ohne Serien-Block (neuere Systematik, KS 6a)', () => {
    expect(parseDateiname('dbst-ks-2024-006a-dvs-de.pdf')).toEqual({ familie: 'ks', nummer: '6a', art: 'dvs', beilage: null, stem: null });
  });
  it('2026er-Systematik `1-NNNa[-Anhang]-ART-JJJJ` (KS 11a)', () => {
    expect(parseDateiname('1-011a-D-2026-de.pdf')).toEqual({ familie: 'ks', nummer: '11a', art: 'd', beilage: null, stem: null });
    expect(parseDateiname('1-011a-Anhang-D-2026-de.pdf')).toEqual({ familie: 'ks', nummer: '11a', art: 'd', beilage: 'anhang', stem: null });
  });
  it('Beilagen: Anhang/FAQ/Schema/Fragebogen', () => {
    expect(parseDateiname('dbst-ks-2019-1-045-d-anhang1-1-de.pdf')?.beilage).toBe('anhang1-1');
    expect(parseDateiname('dbst-ks-2022-1-045-d-faq-de.pdf')?.beilage).toBe('faq');
    expect(parseDateiname('dbst-ks-2011-1-012-s-schema-de.pdf')).toMatchObject({ nummer: '12', art: 's', beilage: 'schema' });
    expect(parseDateiname('dbst-ks-2005-1-011-d-fragebogen-de.pdf')?.beilage).toBe('fragebogen');
  });
  it('W-Serie (alte Weisungen), inkl. Jahres-Variante', () => {
    expect(parseDateiname('dbst-ks-w95-002-de.pdf')).toEqual({ familie: 'w', nummer: null, art: null, beilage: null, stem: 'w95-002' });
    expect(parseDateiname('dbst-ks-w95-003-2024-de.pdf')?.stem).toBe('w95-003-2024');
  });
  it('Mitteilung + Merkblatt-Beilage', () => {
    expect(parseDateiname('estv-mitteilung-020-dvs-checkliste-de.pdf')).toMatchObject({ familie: 'mitteilung', nummer: '020', art: 'dvs' });
    expect(parseDateiname('vst-mb-s-02-122-1b-de.pdf')).toMatchObject({ familie: 'mb', stem: 's-02-122-1b' });
  });
  it('POSITIONsbindung: das `s` in vst-mb-s-… ist SERIEN-Kürzel, NIE Steuerart', () => {
    expect(parseDateiname('vst-mb-s-02-122-1b-de.pdf').art).toBeNull();
  });
});

describe('erlasseAusArt (d→DBG, v→VSTG, s→STG, kanonische Reihenfolge)', () => {
  it('einzeln + kombiniert', () => {
    expect(erlasseAusArt('d')).toEqual(['DBG']);
    expect(erlasseAusArt('dv')).toEqual(['DBG', 'VSTG']);
    expect(erlasseAusArt('dvs')).toEqual(['DBG', 'VSTG', 'STG']);
    expect(erlasseAusArt('vs')).toEqual(['VSTG', 'STG']);
  });
});

describe('dokIdVon (§2.6, deckungsgleich mit kuratierten Registerkeys)', () => {
  it('KS regulär: primäre Steuerart + Nummer', () => {
    expect(dokIdVon(parseDateiname('dbst-ks-2020-1-050a-d-de.pdf'), 'dbst')).toBe('ESTV-KS-DBG-50A');
    expect(dokIdVon(parseDateiname('dbst-ks-2011-1-012-s-de.pdf'), 'stempel')).toBe('ESTV-KS-STG-12');
    expect(dokIdVon(parseDateiname('dbst-ks-2024-006a-dvs-de.pdf'), 'dbst')).toBe('ESTV-KS-DBG-6A');
  });
  it('kuratierter Key deckungsgleich (Skip greift, §2.6)', () => {
    expect(ESTV_KURIERT_BEKANNT.has(dokIdVon(parseDateiname('dbst-ks-2024-006a-dvs-de.pdf'), 'dbst'))).toBe(true);
  });
  it('Versions-Ko-Listung: «Version vom …» im Titel → -V<JAHR> (KS 26 doppelt live)', () => {
    const b = parseDateiname('dbst-ks-2024-1-026-d-de.pdf');
    expect(dokIdVon(b, 'dbst', versionsJahrAusTitel('Kreisschreiben Nr. 26; Version vom 6. Februar 2024: Neues …'))).toBe('ESTV-KS-DBG-26-V2024');
    expect(dokIdVon(parseDateiname('dbst-ks-2009-1-026-d-de.pdf'), 'dbst', null)).toBe('ESTV-KS-DBG-26');
  });
  it('Beilagen/W/Mitteilung/MB', () => {
    expect(dokIdVon(parseDateiname('dbst-ks-2019-1-045-d-anhang1-1-de.pdf'), 'dbst')).toBe('ESTV-KS-DBG-45-ANHANG1-1');
    expect(dokIdVon(parseDateiname('dbst-ks-w95-002-de.pdf'), 'dbst')).toBe('ESTV-KS-W95-002');
    expect(dokIdVon(parseDateiname('estv-mitteilung-020-dvs-checkliste-de.pdf'), 'dbst')).toBe('ESTV-MITTEILUNG-020-DVS-CHECKLISTE');
    expect(dokIdVon(parseDateiname('vst-mb-s-02-122-1b-de.pdf'), 'vst')).toBe('ESTV-MB-S-02-122-1B');
  });
  it('IDs sind pfadsicher (KEY_UNSICHER)', () => {
    for (const fn of ['dbst-ks-2020-1-050a-d-de.pdf', 'dbst-ks-w95-002-de.pdf', 'vst-mb-s-02-122-1b-de.pdf']) {
      expect(dokIdVon(parseDateiname(fn), 'dbst')).toMatch(/^[A-Z0-9-]+$/);
    }
  });
});

describe('doktypVon (§0/B6 registrierte Doktypen)', () => {
  it('KS / Beilage / W-Serie / Mitteilung / MB', () => {
    expect(doktypVon(parseDateiname('dbst-ks-2020-1-050a-d-de.pdf'), 'Kreisschreiben Nr. 50a')).toBe('kreisschreiben');
    expect(doktypVon(parseDateiname('dbst-ks-2022-1-045-d-faq-de.pdf'), 'Kreisschreiben Nr. 45: Fragen und Antworten')).toBe('ks-anhang');
    expect(doktypVon(parseDateiname('dbst-ks-w95-002-de.pdf'), 'W95-002D vom 12.11.1992')).toBe('weisung');
    expect(doktypVon(parseDateiname('estv-mitteilung-020-dvs-checkliste-de.pdf'), 'Mitteilung-020…')).toBe('mitteilung');
    expect(doktypVon(parseDateiname('vst-mb-s-02-122-1b-de.pdf'), 'S-02.122.1b')).toBe('merkblatt');
  });
  it('W-Datei mit «Kreisschreiben»-Titel (revidierte Version) → kreisschreiben', () => {
    expect(doktypVon(parseDateiname('dbst-ks-w95-003-2024-de.pdf'), 'Kreisschreiben Nr. 3; Version vom 7. Februar 2024: …')).toBe('kreisschreiben');
  });
});

describe('Beschreibungs-Kaskade + Titel-Datum', () => {
  it('erlasseAusBeschreibung nennt die Steuer explizit', () => {
    expect(erlasseAusBeschreibung('… bei der direkten Bundessteuer …')).toEqual(['DBG']);
    expect(erlasseAusBeschreibung('… Verrechnungssteuer und Stempelabgaben …')).toEqual(['VSTG', 'STG']);
    expect(erlasseAusBeschreibung('Beilage: Schema «Mittelbeschaffung inländischer Schuldner»')).toEqual([]);
  });
  it('titelDatumNachIso: «vom DD.MM.YYYY» (W-Serie/Mitteilung)', () => {
    expect(titelDatumNachIso('W95-002D vom 12.11.1992')).toBe('1992-11-12');
    expect(titelDatumNachIso('Mitteilung-020-DVS-2024-d vom 18.09.2024 - Checkliste')).toBe('2024-09-18');
    expect(titelDatumNachIso('Kreisschreiben Nr. 50a: …')).toBeNull();
  });
  it('versionsJahrAusTitel', () => {
    expect(versionsJahrAusTitel('Kreisschreiben Nr. 26; Version vom 6. Februar 2024: …')).toBe('2024');
    expect(versionsJahrAusTitel('Kreisschreiben Nr. 26: Neues …')).toBeNull();
  });
});

describe('anzeigeNummer + dokRang + Tokens', () => {
  it('Anzeige-Nummern je Familie', () => {
    expect(anzeigeNummer(parseDateiname('dbst-ks-2020-1-050a-d-de.pdf'))).toBe('Nr. 50a');
    expect(anzeigeNummer(parseDateiname('dbst-ks-w95-002-de.pdf'))).toBe('W95-002');
    expect(anzeigeNummer(parseDateiname('vst-mb-s-02-122-1b-de.pdf'))).toBeNull();
  });
  it('dokRang: d-Serie < v-Serie < s-Serie < W < MB < Mitteilung; Beilage direkt hinter KS', () => {
    const ks45 = dokRang(parseDateiname('dbst-ks-2019-1-045-d-de.pdf'));
    const ks45a = dokRang(parseDateiname('dbst-ks-2019-1-045-d-anhang1-1-de.pdf'));
    expect(ks45a).toBe(ks45 + 1);
    expect(dokRang(parseDateiname('dbst-ks-2020-1-050a-d-de.pdf'))).toBeLessThan(dokRang(parseDateiname('dbst-ks-2011-1-012-s-de.pdf')));
    expect(dokRang(parseDateiname('dbst-ks-2011-1-012-s-de.pdf'))).toBeLessThan(dokRang(parseDateiname('dbst-ks-w95-002-de.pdf')));
  });
  it('damTokenAusUrl + driftToken', () => {
    const url = 'https://www.estv.admin.ch/dam/de/sd-web/ueIUB1Kh5VCK/dbst-ks-2020-1-050a-d-de.pdf';
    expect(damTokenAusUrl(url)).toBe('ueIUB1Kh5VCK');
    const a = driftToken('T', '5. Dezember 2023', url);
    expect(a).toBe(driftToken('T', '5. Dezember 2023', url));
    expect(a).not.toBe(driftToken('T', '6. Dezember 2023', url));
    expect(a.length).toBe(16);
  });
});

// ── HTML-Parsing + Kaskade Ende-zu-Ende ───────────────────────────────────────
const ANKER = (href: string, titel: string, datum: string, desc = ''): string =>
  `<a class="download-item" href="${href}"><div><h4 class="download-item__title">${titel}</h4>${desc ? `<p class="download-item__description">${desc}</p>` : ''}<p class="download-item__meta-info"><span class="meta-info__item">PDF</span><span class="meta-info__item">100 kB</span><span class="meta-info__item">${datum}</span></p></div></a>`;

describe('parseAnkerInhalt + parseIndexSeite', () => {
  it('extrahiert Titel/Beschreibung/Datumslabel; nur PDF', () => {
    const html =
      ANKER('https://x/dam/de/sd-web/T1/dbst-ks-2020-1-050-d-de.pdf', 'Kreisschreiben Nr. 50: X', '10. Oktober 2023', 'Unzulässigkeit …') +
      '<a class="download-item" href="https://x/dam/de/sd-web/T2/etwas.docx"><h4 class="download-item__title">Word</h4><span class="meta-info__item">1. Januar 2020</span></a>';
    const items = parseIndexSeite(html);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ titel: 'Kreisschreiben Nr. 50: X', beschreibung: 'Unzulässigkeit …', datumLabel: '10. Oktober 2023' });
  });
  it('AN-13: Beschreibung behält die Zeilen (erste Zeile = Gegenstand), innerhalb der Zeile normalisiert', () => {
    const html = ANKER('https://x/dam/de/sd-web/T/dbst-ks-w03-001-de.pdf', 'W03-001D vom 03.10.2002', '10. Oktober 2023',
      'Die  Abgangsentschädigung resp. Kapitalabfindung des Arbeitgebers\n  - Anhang Beispiele 1 - 6');
    const items = parseIndexSeite(html);
    expect(items[0].beschreibung).toBe('Die Abgangsentschädigung resp. Kapitalabfindung des Arbeitgebers\n- Anhang Beispiele 1 - 6');
    const { dok } = baueDokUndKanten(items[0], [ESTV_KS_SEITEN[0]], '2026-09-25');
    expect(dok.titel).toBe('W03-001D vom 03.10.2002: Die Abgangsentschädigung resp. Kapitalabfindung des Arbeitgebers');
  });
});

describe('baueDokUndKanten (Kaskade ehrlich, §0/A3)', () => {
  const dbst = ESTV_KS_SEITEN[0];
  const vst = ESTV_KS_SEITEN[1];
  it('Suffix dv → 2 Kanten amtlich (DBG+VSTG), Quer-Listung als EIN Dokument', () => {
    const roh: RohEstvItem = {
      href: 'https://x/dam/de/sd-web/T/dbst-ks-2020-1-049-dv-de.pdf',
      titel: 'Kreisschreiben Nr. 49: Aufwand bei Ausland-Ausland-Geschäften',
      beschreibung: '', datumLabel: '10. Oktober 2023', dateiname: 'dbst-ks-2020-1-049-dv-de.pdf',
    };
    const { dok, kanten } = baueDokUndKanten(roh, [dbst, vst], '2026-07-04');
    expect(dok.id).toBe('ESTV-KS-DBG-49');
    expect(dok.normKeys).toEqual(['DBG', 'VSTG']);
    expect(kanten).toHaveLength(2);
    expect(kanten.every((k) => k.quelle === 'amtlich' && k.artikel === '')).toBe(true);
    expect((dok.quell_ids as { seiten: string[] }).seiten).toEqual(['dbst', 'vst']);
  });
  it('kein Suffix + Beschreibung nennt Steuer → amtlich (Stufe 2)', () => {
    const roh: RohEstvItem = {
      href: 'https://x/dam/de/sd-web/T/vst-mb-x-de.pdf',
      titel: 'S-99', beschreibung: 'Merkblatt zur Verrechnungssteuer', datumLabel: '9. Oktober 2023', dateiname: 'vst-mb-x-de.pdf',
    };
    const { kanten } = baueDokUndKanten(roh, [vst], '2026-07-04');
    expect(kanten).toHaveLength(1);
    expect(kanten[0]).toMatchObject({ erlass_key: 'VSTG', quelle: 'amtlich' });
  });
  it('kein Suffix + stumme Beschreibung → Seiten-Kontext quelle=maschinell (Stufe 3, ehrlich)', () => {
    const roh: RohEstvItem = {
      href: 'https://x/dam/de/sd-web/T/dbst-ks-w95-002-de.pdf',
      titel: 'W95-002D vom 12.11.1992', beschreibung: '', datumLabel: '10. Oktober 2023', dateiname: 'dbst-ks-w95-002-de.pdf',
    };
    const { dok, kanten } = baueDokUndKanten(roh, [dbst], '2026-07-04');
    expect(kanten).toHaveLength(1);
    expect(kanten[0]).toMatchObject({ erlass_key: 'DBG', quelle: 'maschinell', konfidenz: 'regex-niedrig' });
    expect(dok.hinweis).toContain('maschinell');
    expect(dok.stand).toBe('1992-11-12'); // Titel-Datum vor Upload-Label
  });
  it('artikelscharf, wo der amtliche Titel den Artikel nennt', () => {
    const roh: RohEstvItem = {
      href: 'https://x/dam/de/sd-web/T/dbst-ks-2024-1-099-d-de.pdf',
      titel: 'Kreisschreiben Nr. 99: Beispiel (Art. 58 DBG)',
      beschreibung: '', datumLabel: '1. Januar 2026', dateiname: 'dbst-ks-2024-1-099-d-de.pdf',
    };
    const { kanten } = baueDokUndKanten(roh, [dbst], '2026-07-04');
    expect(kanten).toHaveLength(1);
    expect(kanten[0]).toMatchObject({ erlass_key: 'DBG', artikel: '58', quelle: 'amtlich', konfidenz: 'regex-hoch' });
  });
});

// W2·29-WERKBANK-LESER, Erlass-Blatt Welle 2 Daten-Rest (25.9.2026). Reproduktion am main
// 59078ae8c (register.json): 50 von 70 ESTV-KS/-Weisungen trugen stand 2023-10-10 = das
// Upload-Label der Indexseite (z. B. KS Nr. 11 vom 31.08.2005). Die amtliche Beschreibung
// derselben Indexseite nennt das Dokumentdatum («… vom 31.08.2005 (Direkte Bundessteuer)»,
// live https://www.estv.admin.ch/de/kreisschreiben-direkten-bundessteuer, 25.9.2026).
describe('AN-2 — Dokumentdatum aus der amtlichen Beschreibung statt Upload-Label', () => {
  const dbst = ESTV_KS_SEITEN[0];
  it('Haupt-KS: «vom DD.MM.YYYY» der Beschreibung schlägt das Upload-Label', () => {
    const roh: RohEstvItem = {
      href: 'https://x/dam/de/sd-web/T/dbst-ks-2005-1-011-d-de.pdf',
      titel: 'Kreisschreiben Nr. 11: Krankheits- und Unfallkosten',
      beschreibung: 'Abzug von Krankheits- und Unfallkosten sowie von behinderungsbedingten Kosten vom 31.08.2005 (Direkte Bundessteuer)\nZu diesem Kreisschreiben gehört der folgende Anhang:',
      datumLabel: '10. Oktober 2023', dateiname: 'dbst-ks-2005-1-011-d-de.pdf',
    };
    const { dok } = baueDokUndKanten(roh, [dbst], '2026-09-25');
    expect(dok.stand).toBe('2005-08-31');
    expect(dok.stand_quelle).toBe('hub-beschreibung');
  });
  it('Beilage: das Datum der Beschreibung ist das des Haupt-KS → Upload-Label bleibt (keine Aussage)', () => {
    const roh: RohEstvItem = {
      href: 'https://x/dam/de/sd-web/T/dbst-ks-2008-1-023-d-schema-de.pdf',
      titel: 'Kreisschreiben Nr. 23 Beilage: Spartenrechnung',
      beschreibung: 'Spartenrechnung gemäss Kreisschreiben Nr. 23 vom 17.12.2008 (Direkte Bundessteuer)',
      datumLabel: '10. Oktober 2023', dateiname: 'dbst-ks-2008-1-023-d-schema-de.pdf',
    };
    const { dok } = baueDokUndKanten(roh, [dbst], '2026-09-25');
    expect(dok.stand).toBe('2023-10-10');
    expect(dok.stand_quelle).toBe('hub-label');
  });
  it('nur das erste Datum der ersten Zeile zählt (Anhang-Zeilen nennen fremde Daten)', () => {
    expect(beschreibungDatumNachIso('Besteuerung von Trusts vom 27.03.2008 (Direkte Bundessteuer)\nDieses Kreisschreiben enthält folgenden Anhang:\n- Kreisschreiben Nr. 30 der SSK vom 22. August 2007')).toBe('2008-03-27');
    expect(beschreibungDatumNachIso('Fragen und Antworten zum Kreisschreiben Nr. 45')).toBeNull();
    expect(beschreibungDatumNachIso('Kapitaleinlageprinzip\nvom 09.12.2010')).toBeNull();
  });
});

// AN-13 — Reproduktion am main 59078ae8c: ESTV-KS-W03-006 zeigt nummer «W03-006» (aus dem
// Dateinamen dbst-ks-w03-006) unter dem amtlichen Titel «W01-006D vom 06.06.2001»; die 15
// Weisungen der W-Serie tragen als Titel nur Signatur + Datum, der Gegenstand steht allein in
// der amtlichen Beschreibung (live 25.9.2026: «W01-006D vom 06.06.2001 | Verordnung über die
// pauschale Steueranrechnung»).
describe('AN-13 — W-Serie: Signatur aus dem amtlichen Titel, Gegenstand aus der Beschreibung', () => {
  const dbst = ESTV_KS_SEITEN[0];
  const roh: RohEstvItem = {
    href: 'https://x/dam/de/sd-web/T/dbst-ks-w03-006-de.pdf',
    titel: 'W01-006D vom 06.06.2001',
    beschreibung: 'Verordnung über die pauschale Steueranrechnung\n- Verordnung über die pauschale Steueranrechnung / Änderung vom 9. März 2001',
    datumLabel: '10. Oktober 2023', dateiname: 'dbst-ks-w03-006-de.pdf',
  };
  it('nummer = Signatur des Titels (ohne Sprach-D), Key bleibt dateinamen-stabil', () => {
    const { dok } = baueDokUndKanten(roh, [dbst], '2026-09-25');
    expect(dok.id).toBe('ESTV-KS-W03-006');
    expect(dok.nummer).toBe('W01-006');
  });
  it('titel = amtlicher Titel + «: » + erste Zeile der amtlichen Beschreibung (beide wörtlich)', () => {
    const { dok } = baueDokUndKanten(roh, [dbst], '2026-09-25');
    expect(dok.titel).toBe('W01-006D vom 06.06.2001: Verordnung über die pauschale Steueranrechnung');
    expect(dok.stand).toBe('2001-06-06');
  });
  it('Titel mit eigenem Gegenstand bleibt unverändert; leere Beschreibung ändert nichts', () => {
    const ks = baueDokUndKanten({ ...roh, titel: 'Kreisschreiben Nr. 3; Version vom 7. Februar 2024: Anzuwendende Prinzipien', dateiname: 'dbst-ks-w95-003-2024-de.pdf' }, [dbst], '2026-09-25').dok;
    expect(ks.titel).toBe('Kreisschreiben Nr. 3; Version vom 7. Februar 2024: Anzuwendende Prinzipien');
    const leer = baueDokUndKanten({ ...roh, beschreibung: '' }, [dbst], '2026-09-25').dok;
    expect(leer.titel).toBe('W01-006D vom 06.06.2001');
  });
});

describe('verarbeiteIndexSeiten (Count-Gates + Dedupe + Skip)', () => {
  it('wirft bei Unterschreitung des Count-Gates (< min)', () => {
    const html = ANKER('https://x/dam/de/sd-web/T/dbst-ks-2020-1-050-d-de.pdf', 'Kreisschreiben Nr. 50', '10. Oktober 2023');
    expect(() =>
      verarbeiteIndexSeiten([{ def: ESTV_KS_SEITEN[0], html }], '2026-07-04'),
    ).toThrow(/< 70/);
  });
});
