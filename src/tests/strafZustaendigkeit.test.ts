import { describe, it, expect } from 'vitest';
import { bestimmeStrafZustaendigkeit, type StrafInput } from '../lib/strafZustaendigkeit';

// Akzeptanztests Straf-Engine (Task 7b, 6.6.2026). Grundlage: StPO-Regelwerk
// (Decision Tree + 22-Zeilen-Konstellationstabelle, verbatim Stand 1.1.2024);
// Art. 301 StPO / Art. 31 StGB am 6.6.2026 verbatim verifiziert.

const basis = (extra: Partial<StrafInput> = {}): StrafInput => ({
  anliegen: 'anzeige', tatort: 'bekannt', ...extra,
});

describe('Forum-Kaskade (Art. 31–37)', () => {
  it('Grundsatz Tatort · nur Erfolgsort · Prioritätsprinzip · Art.-32-Kaskade', () => {
    expect(bestimmeStrafZustaendigkeit(basis()).forum.normen[0].artikel).toBe('Art. 31 Abs. 1 StPO');
    expect(bestimmeStrafZustaendigkeit(basis({ tatort: 'nur_erfolgsort' })).forum.text).toContain('ERFOLGSORTES');
    expect(bestimmeStrafZustaendigkeit(basis({ tatort: 'mehrere_orte' })).forum.text).toContain('ERSTEN VERFOLGUNGSHANDLUNGEN');
    const k = bestimmeStrafZustaendigkeit(basis({ tatort: 'ausland_oder_ungewiss', kaskade32: 'ergreifungsort' }));
    expect(k.forum.text).toContain('ERGREIFUNG');
    expect(k.forum.normen[0].artikel).toBe('Art. 32 StPO');
  });
  it('Spezialforen gehen vor: Medien 35 · SchKG-Delikt 36 I · Unternehmen 36 II · Einziehung 37', () => {
    expect(bestimmeStrafZustaendigkeit(basis({ spezialforum: 'medien' })).forum.normen[0].artikel).toBe('Art. 35 StPO');
    expect(bestimmeStrafZustaendigkeit(basis({ spezialforum: 'schkg_delikt' })).forum.text).toMatch(/Schuldner/);
    expect(bestimmeStrafZustaendigkeit(basis({ spezialforum: 'unternehmen' })).forum.text).toContain('SITZ DES UNTERNEHMENS');
    expect(bestimmeStrafZustaendigkeit(basis({ spezialforum: 'einziehung', tatort: 'ausland_oder_ungewiss' })).forum.normen[0].artikel).toBe('Art. 37 StPO');
  });
  it('Beteiligung (33) und Tatmehrheit (34: abstrakt schwerste Strafdrohung) als Weichen', () => {
    expect(bestimmeStrafZustaendigkeit(basis({ beteiligung: 'teilnehmer' })).weichen.some((w) => w.includes('Täterschaft'))).toBe(true);
    const m = bestimmeStrafZustaendigkeit(basis({ mehrereTatenVerschOrte: true }));
    expect(m.weichen.some((w) => w.includes('SCHWERSTEN STRAFE'))).toBe(true);
    expect(m.weichen.some((w) => w.includes('GETRENNT'))).toBe(true);
  });
});

describe('Verfahrens-Weichen + Fahrplan + Fristen', () => {
  it('38/40/41/42 immer offengelegt; interkantonaler Konflikt → BStGer-Beschwerdekammer', () => {
    const r = bestimmeStrafZustaendigkeit(basis());
    expect(r.weichen.some((w) => w.includes('Art. 38 Abs. 1'))).toBe(true);
    expect(r.weichen.some((w) => w.includes('10 Tagen'))).toBe(true);
    expect(r.weichen.some((w) => w.includes('perpetuatio fori'))).toBe(true);
    const g = bestimmeStrafZustaendigkeit(basis({ anliegen: 'gerichtsstand' }));
    expect(g.fahrplan.some((s) => s.text.includes('Bundesstrafgerichts'))).toBe(true);
  });
  it('Anzeige: formfrei bei jeder Behörde (301/39); Antragsdelikt → 3-Monats-Frist (Art. 31 StGB, kritisch)', () => {
    const r = bestimmeStrafZustaendigkeit(basis({ antragsdelikt: true }));
    expect(r.fahrplan[0].text).toContain('schriftlich oder mündlich');
    expect(r.fahrplan.some((s) => s.text.includes('Art. 39'))).toBe(true);
    expect(r.fristen[0]).toMatchObject({ norm: 'Art. 31 StGB', kritisch: true });
    expect(r.fristen[0].frist).toContain('3 Monate');
    expect(bestimmeStrafZustaendigkeit(basis()).fristen.length).toBe(0);
  });
  it('Gerichtsstand: 10-Tage-Beschwerdefrist als kritisches Frist-Objekt, nicht nur Prosa (M-6-Fix Bug-Check 6.6.2026)', () => {
    const g = bestimmeStrafZustaendigkeit(basis({ anliegen: 'gerichtsstand' }));
    const f = g.fristen.find((x) => x.norm === 'Art. 41 Abs. 2 StPO');
    expect(f).toBeDefined();
    expect(f!.kritisch).toBe(true);
    expect(f!.frist).toContain('10 Tage');
    // Anzeige-Pfad bleibt fokussiert: dort weiterhin nur die Strafantragsfrist.
    expect(bestimmeStrafZustaendigkeit(basis({ antragsdelikt: true })).fristen.every((x) => x.norm === 'Art. 31 StGB')).toBe(true);
  });
  it('Übertretung → Übertretungsstrafbehörde (17/357); Bund-Weiche → BA-Warnung (23/24)', () => {
    expect(bestimmeStrafZustaendigkeit(basis({ uebertretung: true })).behoerdeTyp).toContain('ÜBERTRETUNGSSTRAFBEHÖRDE');
    const b = bestimmeStrafZustaendigkeit(basis({ moeglichesBundesdelikt: true }));
    expect(b.warnungen.some((w) => w.includes('BUNDESGERICHTSBARKEIT'))).toBe(true);
  });
});

describe('Staatsanwaltschaften-Datenschicht', () => {
  it('alle 26 Kantone + BA; Doppelcheck-Korrekturen drin (SZ Schmiedgasse, AG Frey-Herosé, VD Renens)', async () => {
    const { STAATSANWALTSCHAFTEN, BUNDESANWALTSCHAFT } = await import('../data/staatsanwaltschaften');
    const { KANTONE } = await import('../lib/kantone');
    for (const k of KANTONE) {
      expect(STAATSANWALTSCHAFTEN[k], k).toBeDefined();
      expect(STAATSANWALTSCHAFTEN[k].plzOrt, k).toMatch(/^\d{4} /);
    }
    expect(STAATSANWALTSCHAFTEN.SZ.strasse).toContain('Schmiedgasse 21');
    expect(STAATSANWALTSCHAFTEN.AG.strasse).toContain('Frey-Herosé');
    expect(STAATSANWALTSCHAFTEN.VD.plzOrt).toContain('Renens');
    expect(STAATSANWALTSCHAFTEN.BL.plzOrt).toContain('Muttenz');
    expect(BUNDESANWALTSCHAFT.strasse).toBe('Guisanplatz 1');
  });
});

describe('Art.-32-Kaskade vollständig (Abschluss-Review-Fix 6.6.2026)', () => {
  it('gewöhnlicher Aufenthalt ist eigene Abs.-1-Stufe vor dem Heimatort', () => {
    const a = bestimmeStrafZustaendigkeit({ anliegen: 'gerichtsstand', tatort: 'ausland_oder_ungewiss', kaskade32: 'aufenthalt' });
    expect(a.forum.text).toContain('GEWÖHNLICHEN AUFENTHALTS');
    const h = bestimmeStrafZustaendigkeit({ anliegen: 'gerichtsstand', tatort: 'ausland_oder_ungewiss', kaskade32: 'heimatort' });
    expect(h.forum.text).toContain('weder Wohnsitz noch gewöhnlicher Aufenthalt');
  });
});

describe('Art.-32-Kaskade — Stufen Wohnsitz/Default/Auslieferung (Testlücken-Schliessung 7.6.2026)', () => {
  // Herleitung am Fedlex-Cache /tmp/stpo.html (Stand 1.1.2024):
  // Art. 32 Abs. 1: «Ist eine Straftat im Ausland verübt worden oder kann der
  //   Tatort nicht ermittelt werden, so sind … die Behörden des Ortes
  //   zuständig, an dem die beschuldigte Person ihren Wohnsitz oder ihren
  //   gewöhnlichen Aufenthalt hat.» → Wohnsitz = Abs.-1-Stufe.
  // Art. 32 Abs. 2: weder Wohnsitz noch gewöhnlicher Aufenthalt → Heimatort;
  //   fehlt auch dieser → Ort, «an dem die beschuldigte Person angetroffen
  //   worden ist» (Ergreifungsort).
  // Art. 32 Abs. 3: «Fehlt ein Gerichtsstand nach den Absätzen 1 und 2, so
  //   sind die Behörden des Kantons zuständig, der die Auslieferung verlangt
  //   hat.» → Auslieferungskanton = Abs.-3-Stufe (am Cache verifiziert; der
  //   Befund nannte Abs. 3 — bestätigt).
  it('Stufe Wohnsitz: Abs.-1-Stufe, Norm Art. 32 StPO, nur bei Tatort im Ausland/ungewiss', () => {
    const w = bestimmeStrafZustaendigkeit(basis({ anliegen: 'gerichtsstand', tatort: 'ausland_oder_ungewiss', kaskade32: 'wohnsitz' }));
    expect(w.forum.text).toContain('WOHNSITZ der beschuldigten Person');
    expect(w.forum.text).toContain('Abs. 1');
    expect(w.forum.normen[0].artikel).toBe('Art. 32 StPO');
    // Greift NICHT, wenn der Tatort bekannt ist (dann Grundsatz Art. 31).
    const bekannt = bestimmeStrafZustaendigkeit(basis({ anliegen: 'gerichtsstand', tatort: 'bekannt', kaskade32: 'wohnsitz' }));
    expect(bekannt.forum.normen[0].artikel).toBe('Art. 31 Abs. 1 StPO');
    expect(bekannt.forum.text).not.toContain('Art. 32');
  });
  it('Default-Fallback der Kaskade: ohne kaskade32-Angabe greift die Abs.-1-Stufe Wohnsitz', () => {
    const def = bestimmeStrafZustaendigkeit(basis({ anliegen: 'gerichtsstand', tatort: 'ausland_oder_ungewiss' }));
    expect(def.forum.normen[0].artikel).toBe('Art. 32 StPO');
    expect(def.forum.text).toContain('Abs. 1');
    expect(def.forum.text).toContain('WOHNSITZ der beschuldigten Person');
  });
  it('Stufe Auslieferung: Abs. 3 (Ergreifung im Ausland), Norm Art. 32 StPO', () => {
    const a = bestimmeStrafZustaendigkeit(basis({ anliegen: 'gerichtsstand', tatort: 'ausland_oder_ungewiss', kaskade32: 'auslieferung' }));
    expect(a.forum.text).toContain('AUSLIEFERUNGSKANTON');
    expect(a.forum.text).toContain('Abs. 3');
    expect(a.forum.normen[0].artikel).toBe('Art. 32 StPO');
  });
  it('Kaskade vollständig differenziert: jede Stufe trägt ihren korrekten Absatz (Abs. 1 / Abs. 2 / Abs. 3)', () => {
    const stufe = (k: NonNullable<StrafInput['kaskade32']>) =>
      bestimmeStrafZustaendigkeit(basis({ anliegen: 'gerichtsstand', tatort: 'ausland_oder_ungewiss', kaskade32: k })).forum.text;
    expect(stufe('wohnsitz')).toContain('Abs. 1');
    expect(stufe('aufenthalt')).toContain('Abs. 1');     // gleichrangig zum Wohnsitz
    expect(stufe('heimatort')).toContain('Abs. 2');
    expect(stufe('ergreifungsort')).toContain('Abs. 2'); // «angetroffen worden ist»
    expect(stufe('auslieferung')).toContain('Abs. 3');
  });
});

describe('Oberholzer-Vertiefung 6.6.2026 (N 239–330)', () => {
  it('Mittäter+Tatmehrheit kombiniert 33 II + 34 I; Verfahrenseinheits-Weiche 29/30; JStPO-Warnung', () => {
    const k = bestimmeStrafZustaendigkeit({ anliegen: 'gerichtsstand', tatort: 'bekannt', beteiligung: 'mittaeter', mehrereTatenVerschOrte: true });
    expect(k.weichen.some((w) => w.includes('Art. 33 Abs. 2 und Art. 34 Abs. 1'))).toBe(true);
    expect(k.weichen.some((w) => w.includes('VERFAHRENSEINHEIT'))).toBe(true);
    // Z1-07 / §6.3 Nr. 23 (RL-42, deklarierte Fachänderung): vorher prüfte
    // der Test nur die EXISTENZ einer Warnung — das falsche Hauptergebnis
    // «Tatort, Art. 31 StPO» + Staatsanwaltschaft (Z1-01) blieb grün. Jetzt
    // Forum und Behörde: Art. 10 Abs. 1 Satz 1 JStPO (gewöhnlicher Aufenthalt
    // bei Eröffnung), Untersuchungsbehörde nach Art. 6 Abs. 2 JStPO.
    const j = bestimmeStrafZustaendigkeit({ anliegen: 'anzeige', tatort: 'bekannt', beschuldigteMinderjaehrig: true });
    expect(j.forum.normen[0].artikel).toBe('Art. 10 Abs. 1 JStPO');
    expect(j.forum.text).toContain('GEWÖHNLICHEN AUFENTHALT');
    expect(j.forum.normen.some((n) => n.artikel.startsWith('Art. 31'))).toBe(false);
    expect(j.behoerdeTyp).toContain('Art. 6 Abs. 2 JStPO');
    expect(j.behoerdeTyp).not.toMatch(/^Staatsanwaltschaft/);
    expect(j.normverweise.some((n) => n.artikel === 'Art. 10 JStPO')).toBe(true);
  });
  it('Medien-Antragsdelikt-Wahlrecht (35 II); Gesamtstrafe 34 III; BStGer abschliessend', () => {
    const m = bestimmeStrafZustaendigkeit({ anliegen: 'anzeige', tatort: 'bekannt', spezialforum: 'medien', antragsdelikt: true });
    expect(m.weichen.some((w) => w.includes('WAHL') && w.includes('Art. 35 Abs. 2'))).toBe(true);
    const g = bestimmeStrafZustaendigkeit({ anliegen: 'gerichtsstand', tatort: 'bekannt', mehrereTatenVerschOrte: true });
    expect(g.weichen.some((w) => w.includes('GESAMTSTRAFE'))).toBe(true);
    expect(g.fahrplan.some((s) => s.text.includes('ABSCHLIESSEND'))).toBe(true);
    expect(g.fahrplan.some((s) => s.text.includes('in dubio pro duriore'))).toBe(true);
  });
});

// RL-42 (Prüfung Rechtslogik 23.9.2026, Z1-01/Z1-02): Jugendstrafverfahren.
// Wortlaute JStPO (SR 312.1, Fassung 1.7.2025, Fedlex-Filestore
// eli/cc/2010/226/20250701 de-xml-3, abgerufen 25.9.2026):
// Art. 10 Abs. 1: «Für die Strafverfolgung ist die Behörde des Ortes
// zuständig, an dem die oder der beschuldigte Jugendliche bei Eröffnung des
// Verfahrens den gewöhnlichen Aufenthalt hat. Für die Strafverfolgung im
// Bereich des Ordnungsbussenverfahrens ist die Behörde des Ortes zuständig,
// an dem die Straftat begangen worden ist.»
// Art. 3 Abs. 2: nicht anwendbar sind die StPO-Bestimmungen über lit. a die
// Übertretungsstrafbehörden (Art. 17 und 357), lit. b die Bundesgerichtsbarkeit
// (Art. 23–28), lit. c den Gerichtsstand (Art. 31–34).
describe('Jugendstrafverfahren (Art. 10 JStPO) — RL-42', () => {
  const jugend = (extra: Partial<StrafInput> = {}) =>
    bestimmeStrafZustaendigkeit({ anliegen: 'gerichtsstand', tatort: 'bekannt', beschuldigteMinderjaehrig: true, ...extra });

  it('Minderjähriger, Tatort BE, gewöhnlicher Aufenthalt ZH → Forum am Aufenthaltsort (ZH), nicht am Tatort', () => {
    // Die Engine ist kantonsneutral (Forum als Anknüpfung, der Kanton wird im
    // UI gewählt): Soll ist die Anknüpfung «gewöhnlicher Aufenthalt» — mit
    // Tatort BE und Aufenthalt ZH führt sie nach ZH. Der Tatort-Grundsatz
    // (Art. 31 StPO), der nach BE führen würde, darf nicht das Hauptergebnis sein.
    for (const tatort of ['bekannt', 'nur_erfolgsort', 'mehrere_orte', 'ausland_oder_ungewiss'] as const) {
      const r = jugend({ tatort });
      expect(r.forum.normen[0].artikel).toBe('Art. 10 Abs. 1 JStPO');
      expect(r.forum.text).toMatch(/^JUGENDSTRAFVERFAHREN/);
      expect(r.forum.text).toContain('bei ERÖFFNUNG des Verfahrens');
      expect(r.forum.text).not.toContain('GRUNDSATZ TATORT');
      expect(r.normverweise.some((n) => /^Art\. 3[12] /.test(n.artikel))).toBe(false);
    }
    // Erwachsene unverändert: Tatort-Grundsatz.
    expect(bestimmeStrafZustaendigkeit({ anliegen: 'gerichtsstand', tatort: 'bekannt' }).forum.normen[0].artikel).toBe('Art. 31 Abs. 1 StPO');
  });

  it('Z1-02: Tatort nur im ORDNUNGSBUSSENVERFAHREN (Art. 10 Abs. 1 Satz 2), nicht bei allen Übertretungen', () => {
    const alle = (r: ReturnType<typeof jugend>) => [r.forum.text, r.behoerdeTyp, ...r.warnungen, ...r.weichen].join(' | ');
    expect(alle(jugend())).not.toContain('Übertretungen: Begehungsort');
    expect(jugend().forum.text).toContain('ORDNUNGSBUSSENVERFAHREN');
    // Übertretung (Busse) ausserhalb des Ordnungsbussenverfahrens: gewöhnlicher Aufenthalt bleibt massgeblich.
    const u = jugend({ uebertretung: true });
    expect(u.forum.normen[0].artikel).toBe('Art. 10 Abs. 1 JStPO');
    // Art. 17/357 StPO (Übertretungsstrafbehörden) gelten nicht (Art. 3 Abs. 2 lit. a JStPO).
    expect(u.behoerdeTyp).not.toContain('ÜBERTRETUNGSSTRAFBEHÖRDE');
    expect(u.normverweise.some((n) => n.artikel === 'Art. 17 StPO' || n.artikel === 'Art. 357 StPO')).toBe(false);
  });

  it('Behörde: Untersuchungsbehörde nach kantonaler Wahl (Jugendrichter ODER Jugendanwalt, Art. 6 Abs. 2 JStPO)', () => {
    const r = jugend();
    expect(r.behoerdeTyp).toContain('Jugendrichterin');
    expect(r.behoerdeTyp).toContain('Jugendanwältin');
    expect(r.normverweise.some((n) => n.artikel === 'Art. 6 JStPO')).toBe(true);
  });

  it('Art. 33/34 StPO und Bundesgerichtsbarkeit gelten nicht (Art. 3 Abs. 2 lit. b/c JStPO); Trennung Art. 11 JStPO mit Ausnahme', () => {
    const r = jugend({ beteiligung: 'mittaeter', mehrereTatenVerschOrte: true, moeglichesBundesdelikt: true });
    expect(r.weichen.some((w) => w.includes('SCHWERSTEN STRAFE'))).toBe(false);
    expect(r.weichen.some((w) => w.includes('Art. 33 Abs. 2'))).toBe(false);
    expect(r.warnungen.some((w) => w.includes('Art. 3 Abs. 2 lit. b JStPO'))).toBe(true);
    expect(r.warnungen.some((w) => w.includes('BUNDESGERICHTSBARKEIT: Art. 23 StPO') )).toBe(false);
    expect(r.weichen.some((w) => w.includes('Art. 11 JStPO') && w.includes('ausnahmsweise'))).toBe(true);
  });

  it('Spezialforum bei Minderjährigen: Forum nach Art. 35–37 StPO bleibt, Verhältnis zu Art. 10 JStPO offengelegt', () => {
    const r = jugend({ spezialforum: 'medien' });
    expect(r.forum.normen[0].artikel).toBe('Art. 35 StPO');
    expect(r.warnungen.some((w) => w.includes('Art. 3 Abs. 2 lit. c JStPO') && w.includes('Art. 35–37 StPO'))).toBe(true);
  });
});
