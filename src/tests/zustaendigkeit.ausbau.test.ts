import { describe, it, expect } from 'vitest';
import {
  bestimmeZustaendigkeit,
  type ZustaendigkeitInput,
} from '../lib/zustaendigkeit';
import { geld } from './zustaendigkeit.helfer';

// ─── Ausbau 5.6.2026 (Regelwerk bibliothek/normen/zpo-zustaendigkeit-regelwerk.md) ───

describe('Zuständigkeit — Ausbau: Delikt (Art. 36–38 ZPO)', () => {
  const delikt = (patch: Partial<ZustaendigkeitInput> = {}): ZustaendigkeitInput => ({
    streitsache: 'delikt', vermoegensrechtlich: true, streitwertCHF: 20_000, ...patch,
  });
  it('allgemein: vier Anknüpfungen inkl. Geschädigtenforum (Art. 36)', () => {
    const r = bestimmeZustaendigkeit(delikt());
    expect(r.oertlich.gerichtsstand).toContain('geschädigten');
    expect(r.oertlich.gerichtsstand).toContain('Erfolgsort');
    expect(r.oertlich.bindung).toBe('dispositiv');
  });
  it('Verkehrsunfall: Beklagtensitz oder Unfallort (Art. 38)', () => {
    const r = bestimmeZustaendigkeit(delikt({ deliktUnterfall: 'verkehrsunfall' }));
    expect(r.oertlich.gerichtsstand).toContain('Unfallort');
  });
  it('ungerechtfertigte vM: Anordnungsort (Art. 37)', () => {
    const r = bestimmeZustaendigkeit(delikt({ deliktUnterfall: 'ungerechtfertigte_massnahme' }));
    expect(r.oertlich.gerichtsstand).toContain('vorsorgliche Massnahme angeordnet');
  });
  it('Spezialforen-Warnung nur beim allgemeinen Unterfall', () => {
    expect(bestimmeZustaendigkeit(delikt()).warnungen.some((w) => w.includes('Art. 38a'))).toBe(true);
    expect(bestimmeZustaendigkeit(delikt({ deliktUnterfall: 'verkehrsunfall' })).warnungen.some((w) => w.includes('Art. 38a'))).toBe(false);
  });
});

describe('Zuständigkeit — Ausbau: Persönlichkeit/Gewaltschutz (Art. 20 ZPO; 198 lit. abis)', () => {
  it('Persönlichkeitsverletzung: Wahlforum, Schlichtung obligatorisch', () => {
    const r = bestimmeZustaendigkeit({ streitsache: 'persoenlichkeit', vermoegensrechtlich: false, streitwertCHF: null, persoenlichkeitUnterfall: 'verletzung' });
    expect(r.oertlich.gerichtsstand).toContain('einer der Parteien');
    expect(r.schlichtung.obligatorisch).toBe(true);
  });
  it('Gewaltschutz: Schlichtung entfällt (lit. abis), vereinfacht streitwertunabhängig, Kostenfreiheits-Hinweis (114 lit. f)', () => {
    const r = bestimmeZustaendigkeit({ streitsache: 'persoenlichkeit', vermoegensrechtlich: false, streitwertCHF: null, persoenlichkeitUnterfall: 'gewaltschutz' });
    expect(r.schlichtung.obligatorisch).toBe(false);
    expect(r.schlichtung.entfaelltGrund).toContain('abis');
    expect(r.verfahrensart).toBe('vereinfacht');
    expect(r.eingabeArt).toBe('klage_direkt');
    expect(r.warnungen.some((w) => w.includes('Art. 114 lit. f'))).toBe(true);
  });
});

describe('Zuständigkeit — Ausbau: Gesellschaft (Art. 40) und Art.-5-Materie', () => {
  it('Verantwortlichkeitsklage: Beklagtensitz oder Sitz der Gesellschaft; HG-Weiche möglich', () => {
    const r = bestimmeZustaendigkeit({ streitsache: 'gesellschaft', vermoegensrechtlich: true, streitwertCHF: 200_000, geschaeftlicheTaetigkeit: true, beklagteImHR: true, klaegerImHR: true });
    expect(r.oertlich.gerichtsstand).toContain('Sitz der Gesellschaft');
    expect(r.weichen.some((w) => w.includes('Handelsgericht'))).toBe(true);
  });
  it('ip_wettbewerb: einzige kantonale Instanz — Schlichtung entfällt (199 III), ordentlich (243 III), Klage direkt, KEINE Direktklage-Weiche', () => {
    const r = bestimmeZustaendigkeit({ streitsache: 'ip_wettbewerb', vermoegensrechtlich: true, streitwertCHF: 500_000 });
    expect(r.schlichtung.obligatorisch).toBe(false);
    expect(r.schlichtung.entfaelltGrund).toContain('Art. 5');
    expect(r.verfahrensart).toBe('ordentlich');
    expect(r.eingabeArt).toBe('klage_direkt');
    expect(r.weichen.some((w) => w.includes('obere Gericht'))).toBe(false);
    expect(r.rechenweg.some((s) => s.beschreibung.includes('EINZIGE kantonale Instanz'))).toBe(true);
  });
});

describe('Zuständigkeit — Ausbau: Vertrag (Art. 31), AVG (Art. 34 II), GSV (Art. 9/17/35), IPRG (Art. 2)', () => {
  it('Forderung aus Vertrag: zusätzlich Ort der charakteristischen Leistung', () => {
    const r = bestimmeZustaendigkeit(geld({ ausVertrag: true }));
    expect(r.oertlich.gerichtsstand).toContain('charakteristische Leistung');
    // ohne Flag: unverändert nur Beklagtensitz (Bestandsschutz)
    expect(bestimmeZustaendigkeit(geld()).oertlich.gerichtsstand).toBe('Gericht am Wohnsitz/Sitz der beklagten Partei');
  });
  it('Personalverleih: Zusatzforum am Ort der Niederlassung des Verleihers', () => {
    const r = bestimmeZustaendigkeit({ streitsache: 'arbeit', vermoegensrechtlich: true, streitwertCHF: 8_000, avgVerleih: true });
    expect(r.oertlich.gerichtsstand).toContain('Art. 34 Abs. 2');
  });
  it('GSV bei zwingendem Forum (Scheidung) → Unwirksamkeits-Warnung', () => {
    const r = bestimmeZustaendigkeit({ streitsache: 'scheidung', vermoegensrechtlich: false, streitwertCHF: null, gerichtsstandsvereinbarung: true });
    expect(r.warnungen.some((w) => w.includes('UNWIRKSAM'))).toBe(true);
  });
  it('GSV bei teilzwingendem Forum (Miete) → nur-nach-Streitentstehung-Warnung', () => {
    const r = bestimmeZustaendigkeit({ streitsache: 'miete_wohn_geschaeft', vermoegensrechtlich: true, streitwertCHF: 5_000, mieteUnterfall: 'sonstige', gerichtsstandsvereinbarung: true });
    expect(r.warnungen.some((w) => w.includes('NACH Entstehung'))).toBe(true);
  });
  it('dispositives Forum ohne GSV → Art.-17/18-Weiche; mit GSV → Ausschliesslichkeits-Hinweis', () => {
    expect(bestimmeZustaendigkeit(geld()).weichen.some((w) => w.includes('Art. 18'))).toBe(true);
    expect(bestimmeZustaendigkeit(geld({ gerichtsstandsvereinbarung: true })).weichen.some((w) => w.includes('AUSSCHLIESSLICH'))).toBe(true);
  });
  it('Auslandsbezug → IPRG/LugÜ-Warnung (Art. 2)', () => {
    const r = bestimmeZustaendigkeit(geld({ beklagteAuslandOderUnbekannt: true }));
    expect(r.warnungen.some((w) => w.includes('LugÜ'))).toBe(true);
  });
  it('perpetuatio fori überall; Art.-63-Hinweis nur bei offenen Weichen', () => {
    expect(bestimmeZustaendigkeit(geld()).weichen.some((w) => w.includes('perpetuatio'))).toBe(true);
    expect(bestimmeZustaendigkeit(geld()).weichen.some((w) => w.includes('Art. 63'))).toBe(false);
    expect(bestimmeZustaendigkeit(geld({ streitwertCHF: 150_000 })).weichen.some((w) => w.includes('Art. 63'))).toBe(true);
  });
});

describe('Zuständigkeit — Praxis-Umbau: Kostenfreiheit (Art. 113 Abs. 2) + Fahrplan + Kosten-Daten', () => {
  it('Schlichtung kostenlos: Miete ✓, GlG ✓, Arbeit ≤30k ✓; Arbeit >30k ✗; Arbeit ohne SW ✗ (nicht subsumierbar); Geldforderung ✗', () => {
    const miete = bestimmeZustaendigkeit({ streitsache: 'miete_wohn_geschaeft', vermoegensrechtlich: true, streitwertCHF: 80_000, mieteUnterfall: 'sonstige' });
    expect(miete.schlichtung.kostenlos).toBe(true);
    expect(miete.schlichtung.kostenlosGrund).toContain('lit. c');
    const glg = bestimmeZustaendigkeit({ streitsache: 'arbeit', vermoegensrechtlich: true, streitwertCHF: 50_000, glgBetroffen: true });
    expect(glg.schlichtung.kostenlosGrund).toContain('lit. a');
    expect(bestimmeZustaendigkeit({ streitsache: 'arbeit', vermoegensrechtlich: true, streitwertCHF: 30_000 }).schlichtung.kostenlos).toBe(true);
    expect(bestimmeZustaendigkeit({ streitsache: 'arbeit', vermoegensrechtlich: true, streitwertCHF: 30_001 }).schlichtung.kostenlos).toBe(false);
    expect(bestimmeZustaendigkeit({ streitsache: 'arbeit', vermoegensrechtlich: false, streitwertCHF: null }).schlichtung.kostenlos).toBe(false);
    expect(bestimmeZustaendigkeit(geld()).schlichtung.kostenlos).toBe(false);
  });
  it('Schlichtung kostenlos: Datenschutz ✓ (Art. 113 Abs. 2 lit. g — Befund B-1, 6.6.2026); übrige Persönlichkeits-Unterfälle ✗; Gewaltschutz ohne Schlichtung', () => {
    const dsg = bestimmeZustaendigkeit({ streitsache: 'persoenlichkeit', vermoegensrechtlich: false, streitwertCHF: null, persoenlichkeitUnterfall: 'datenschutz' });
    expect(dsg.schlichtung.obligatorisch).toBe(true);
    expect(dsg.schlichtung.kostenlos).toBe(true);
    expect(dsg.schlichtung.kostenlosGrund).toContain('lit. g');
    // Spiegelbild Art. 114 lit. g (Entscheidverfahren) bleibt unverändert ausgewiesen:
    expect(dsg.warnungen.some((w) => w.includes('Art. 114 lit. g'))).toBe(true);
    const verletzung = bestimmeZustaendigkeit({ streitsache: 'persoenlichkeit', vermoegensrechtlich: false, streitwertCHF: null, persoenlichkeitUnterfall: 'verletzung' });
    expect(verletzung.schlichtung.kostenlos).toBe(false);
    const gegendarstellung = bestimmeZustaendigkeit({ streitsache: 'persoenlichkeit', vermoegensrechtlich: false, streitwertCHF: null, persoenlichkeitUnterfall: 'gegendarstellung' });
    expect(gegendarstellung.schlichtung.kostenlos).toBe(false);
    // Gewaltschutz: Schlichtung entfällt (198 lit. abis) → lit.-g-Frage stellt sich nicht.
    const gewalt = bestimmeZustaendigkeit({ streitsache: 'persoenlichkeit', vermoegensrechtlich: false, streitwertCHF: null, persoenlichkeitUnterfall: 'gewaltschutz' });
    expect(gewalt.schlichtung.obligatorisch).toBe(false);
    expect(gewalt.schlichtung.kostenlos).toBe(false);
  });
  it('Art. 6 Abs. 4 lit. c (internationale Handelsstreitigkeit, Befund B-2): Weiche bei geschäftl. Tätigkeit + Auslandsbezug + SW ≥ 100k — auch OHNE HR-Eintrag; Gegenproben SW/Ausland/Tätigkeit/Streitsache', () => {
    const litC = (over: Record<string, unknown> = {}) => bestimmeZustaendigkeit({
      streitsache: 'geldforderung', vermoegensrechtlich: true, streitwertCHF: 150_000,
      geschaeftlicheTaetigkeit: true, beklagteAuslandOderUnbekannt: true, ...over,
    }).weichen.some((w) => w.includes('Art. 6 Abs. 4 lit. c'));
    expect(litC()).toBe(true);                                          // Kernfall — kein HR-Eintrag nötig
    expect(litC({ streitwertCHF: 100_000 })).toBe(true);                // Schwelle «mindestens» einschliesslich
    expect(litC({ streitwertCHF: 99_999 })).toBe(false);                // unter der Ziff.-2-Schwelle
    expect(litC({ beklagteAuslandOderUnbekannt: false })).toBe(false);  // kein Auslandsbezug
    expect(litC({ geschaeftlicheTaetigkeit: false })).toBe(false);      // Ziff. 1 fehlt
    expect(litC({ streitsache: 'arbeit' })).toBe(false);                // Schutzmaterie: bewusst keine Behauptung (§1)
    // Abs.-2-Weiche bleibt unabhängig bestehen (beide nebeneinander möglich):
    const beide = bestimmeZustaendigkeit({
      streitsache: 'geldforderung', vermoegensrechtlich: true, streitwertCHF: 150_000,
      geschaeftlicheTaetigkeit: true, beklagteAuslandOderUnbekannt: true, beklagteImHR: true, klaegerImHR: true,
    });
    expect(beide.weichen.some((w) => w.includes('Art. 6 ZPO') && w.includes('handelsrechtliche Streitigkeit'))).toBe(true);
    expect(beide.weichen.some((w) => w.includes('Art. 6 Abs. 4 lit. c'))).toBe(true);
  });
  it('Fahrplan: Schlichtungsweg hat 4 Schritte inkl. Klagebewilligungs-Frist; Direktklage 3; Scheidung eigener Pfad', async () => {
    const { fahrplanSchritte } = await import('../lib/zustaendigkeitFahrplan');
    const sgWeg = fahrplanSchritte(bestimmeZustaendigkeit(geld()), { vorlageVerfuegbar: true, stelleBekannt: true });
    expect(sgWeg.length).toBe(4);
    expect(sgWeg[2].text).toContain('3 Monaten');
    expect(sgWeg[2].text).toContain('30 Tage');
    const direkt = fahrplanSchritte(bestimmeZustaendigkeit({ streitsache: 'ip_wettbewerb', vermoegensrechtlich: true, streitwertCHF: 100_000 }), { vorlageVerfuegbar: false, stelleBekannt: false });
    expect(direkt.length).toBe(3);
    expect(direkt[0].titel).toContain('Klage verfassen');
    const scheidung = fahrplanSchritte(bestimmeZustaendigkeit({ streitsache: 'scheidung', vermoegensrechtlich: false, streitwertCHF: null }), { vorlageVerfuegbar: false, stelleBekannt: false });
    expect(scheidung[0].titel).toContain('Scheidungsbegehren');
  });
  it('Kosten-Daten: alle 26 Kantone mit Schlichtungs- UND Gerichtsrahmen samt Erlass', async () => {
    const { ZUSTAENDIGKEIT_KOSTEN } = await import('../data/zustaendigkeitKosten');
    const { KANTONE } = await import('../lib/kantone');
    for (const k of KANTONE) {
      const e = ZUSTAENDIGKEIT_KOSTEN[k];
      expect(e, k).toBeDefined();
      expect(e.schlichtung.text.length, k).toBeGreaterThan(3);
      expect(e.schlichtung.erlass, k).toMatch(/§|Art\./);
      expect(e.gericht.erlass, k).toMatch(/§|Art\./);
    }
    // Stichproben gegen die zweifach geprüften Dossiers
    expect(ZUSTAENDIGKEIT_KOSTEN.SZ.schlichtung.text).toContain("100–1'000");
    expect(ZUSTAENDIGKEIT_KOSTEN.AG.schlichtung.erlass).toContain('662.110'); // GebührD, NICHT aufgehobenes VKD
    expect(ZUSTAENDIGKEIT_KOSTEN.SG.schlichtung.hinweis).toContain('1.7.2026'); // QS-GP 2.7.2026: SG-GKV-Sunset abgelaufen → Nachfolgefassung v3863 in Vollzug
    expect(ZUSTAENDIGKEIT_KOSTEN.JU.schlichtung.text).toContain('Punktwert'); // Tarif in Punkten, CHF mit Punktwert 1.05 eingerechnet (RL-36)
  });
  it('Nicht vermögensrechtlich: alle 26 Kantone haben Rahmen ODER Auffang-Klausel samt Erlass-§ (Dossier 6.6.2026)', async () => {
    const { ZUSTAENDIGKEIT_KOSTEN } = await import('../data/zustaendigkeitKosten');
    const { KANTONE } = await import('../lib/kantone');
    // 26/26 tragen das Feld; die 7 Auffang-Kantone mit Klausel-Text statt erfundenem Rahmen
    const auffang = ['SZ', 'FR', 'SH', 'AR', 'AI', 'SG', 'GR'] as const;
    for (const k of KANTONE) {
      const e = ZUSTAENDIGKEIT_KOSTEN[k].nichtVermoegensrechtlich;
      expect(e, k).toBeDefined();
      expect(e!.text.length, k).toBeGreaterThan(3);
      expect(e!.erlass, k).toMatch(/§|Art\./);
      if ((auffang as readonly string[]).includes(k)) {
        // §8: kein erfundener Zahlenrahmen, sondern Bemessungs-/Auffang-Klausel
        expect(e!.text, k).toContain('kein');
      }
    }
    // Stichproben wörtlich gegen das Dossier
    expect(ZUSTAENDIGKEIT_KOSTEN.ZH.nichtVermoegensrechtlich!.text).toContain("300–13'000");
    expect(ZUSTAENDIGKEIT_KOSTEN.BE.nichtVermoegensrechtlich!.text).toContain("200–10'000");
    expect(ZUSTAENDIGKEIT_KOSTEN.AG.nichtVermoegensrechtlich!.text).toContain("500–10'000");
    expect(ZUSTAENDIGKEIT_KOSTEN.BS.nichtVermoegensrechtlich!.text).toContain("200–250'000");
    expect(ZUSTAENDIGKEIT_KOSTEN.GL.nichtVermoegensrechtlich!.text).toContain("20'000");
    expect(ZUSTAENDIGKEIT_KOSTEN.NE.nichtVermoegensrechtlich!.text).toContain("500–50'000");
    // Auffang-Kantone: Klausel, kein Zahlenrahmen suggeriert
    expect(ZUSTAENDIGKEIT_KOSTEN.SZ.nichtVermoegensrechtlich!.text).toContain('kein eigener Rahmen');
    expect(ZUSTAENDIGKEIT_KOSTEN.SG.nichtVermoegensrechtlich!.hinweis).toContain('1.7.2026'); // QS-GP 2.7.2026: SG-GKV-Sunset abgelaufen → Nachfolgefassung v3863 in Vollzug
  });
  it('Familie/Scheidung: eigener Rahmen nur wo das Dossier ihn ausweist; NE als Formel-Text mit %', async () => {
    const { ZUSTAENDIGKEIT_KOSTEN } = await import('../data/zustaendigkeitKosten');
    const { KANTONE } = await import('../lib/kantone');
    // genau die Kantone mit eigenem Familien-/Scheidungsrahmen laut Dossier
    const mitFamilie = ['ZH', 'BE', 'LU', 'UR', 'OW', 'NW', 'ZG', 'BS', 'BL', 'AR', 'GR', 'TI', 'VS', 'NE'] as const;
    for (const k of KANTONE) {
      const hat = ZUSTAENDIGKEIT_KOSTEN[k].familie !== undefined;
      expect(hat, k).toBe((mitFamilie as readonly string[]).includes(k));
      if (hat) expect(ZUSTAENDIGKEIT_KOSTEN[k].familie!.erlass, k).toMatch(/§|Art\./);
    }
    // Stichproben wörtlich
    expect(ZUSTAENDIGKEIT_KOSTEN.BL.familie!.text).toContain("200–15'000"); // Scheidung lit. i
    expect(ZUSTAENDIGKEIT_KOSTEN.NW.familie!.text).toContain("800–4'000"); // Scheidung Art. 7 Abs. 3
    expect(ZUSTAENDIGKEIT_KOSTEN.BE.familie!.text).toContain("600–12'000"); // Art. 41
    expect(ZUSTAENDIGKEIT_KOSTEN.ZG.familie!.text).toContain("1'600–12'000"); // § 13
    expect(ZUSTAENDIGKEIT_KOSTEN.AR.familie!.text).toContain("500–6'000"); // Scheidung Art. 14/16
    // NE: Formel-Text (kein Rahmen — enthält Prozent)
    expect(ZUSTAENDIGKEIT_KOSTEN.NE.familie!.text).toContain('%');
    expect(ZUSTAENDIGKEIT_KOSTEN.NE.familie!.hinweis).toContain('Formel');
  });
});
