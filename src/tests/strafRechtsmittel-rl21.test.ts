import { describe, it, expect } from 'vitest';
import { bestimmeStrafRechtsmittel, type StrafRmInput } from '../lib/strafRechtsmittel';

// RL-21 «StPO-Texte» (Prüfung Rechtslogik 23.9.2026, Befunde F3-01, F3-02,
// F3-03, F3-09). Soll-Fälle aus soll-und-laeufe/F3/soll.md (B16/B17) und
// berichte/F3.md. Wortlaute: StPO SR 312.0, Fedlex-Konsolidierung 1.4.2025
// (https://fedlex.data.admin.ch/eli/cc/2010/267/20250401/de), BGG SR 173.110,
// Konsolidierung 1.4.2026 (https://fedlex.data.admin.ch/eli/cc/2006/218/20260401/de),
// BGE 133 I 270 E. 1.2 (1B_154/2007 vom 14.9.2007). Abruf 24.9.2026.

const base = (over: Partial<StrafRmInput>): StrafRmInput => ({
  entscheidTyp: 'urteil_erstinstanz', werFichtAn: 'beschuldigte_person', ...over,
});

const alleTexte = (r: ReturnType<typeof bestimmeStrafRechtsmittel>) =>
  [r.text, r.kognition ?? '', ...r.warnungen, ...r.weichen, ...r.fristen.map((f) => f.label + ' ' + f.frist)].join('\n');

const hatNorm = (r: ReturnType<typeof bestimmeStrafRechtsmittel>, artikel: string) =>
  r.normverweise.some((n) => n.artikel === artikel);

describe('F3-01 — Berufung nur im Zivilpunkt: Kognition nach Art. 398 Abs. 5 StPO', () => {
  it('B16: Privatklägerschaft, nur Zivilpunkt → Überprüfung nur soweit das Zivilprozessrecht am Gerichtsstand es vorsähe', () => {
    const r = bestimmeStrafRechtsmittel(base({ werFichtAn: 'privatklaegerschaft', anfechtungsziel: 'nur_zivilpunkt' }));
    expect(r.statthaft).toBe('berufung');
    expect(r.kognition).toMatch(/\(Art\. 398 Abs\. 5 StPO\)/);
    expect(r.kognition).toMatch(/am Gerichtsstand anwendbare Zivilprozessrecht/);
    expect(r.kognition).not.toMatch(/umfassend in allen angefochtenen Punkten/);
    expect(r.kognition).not.toMatch(/Art\. 398 Abs\. 2\/3 StPO/);
    expect(hatNorm(r, 'Art. 398 Abs. 5 StPO')).toBe(true);
  });

  it('beschuldigte Person, nur Zivilpunkt → ebenfalls Abs. 5', () => {
    const r = bestimmeStrafRechtsmittel(base({ anfechtungsziel: 'nur_zivilpunkt' }));
    expect(r.kognition).toMatch(/\(Art\. 398 Abs\. 5 StPO\)/);
  });

  it('nur Zivilpunkt → Weiche Anschlussberufung beschränkt (Art. 401 Abs. 2 StPO)', () => {
    const r = bestimmeStrafRechtsmittel(base({ werFichtAn: 'privatklaegerschaft', anfechtungsziel: 'nur_zivilpunkt' }));
    const w = r.weichen.find((x) => /\(Art\. 401 Abs\. 2 StPO\)/.test(x));
    expect(w).toBeDefined();
    expect(w).toMatch(/ausschliesslich auf den Zivilpunkt/);
    expect(hatNorm(r, 'Art. 401 Abs. 2 StPO')).toBe(true);
  });

  it('nur Zivilpunkt geht der Übertretungs-Beschränkung (Abs. 4) vor', () => {
    const r = bestimmeStrafRechtsmittel(base({ anfechtungsziel: 'nur_zivilpunkt', uebertretung: true }));
    expect(r.kognition).toMatch(/\(Art\. 398 Abs\. 5 StPO\)/);
    expect(r.kognition).not.toMatch(/Art\. 398 Abs\. 4 StPO/);
  });

  it('Gegenprobe: umfassende Berufung bleibt bei Abs. 2/3, ohne 401-II-Weiche', () => {
    const r = bestimmeStrafRechtsmittel(base({ werFichtAn: 'privatklaegerschaft' }));
    expect(r.kognition).toMatch(/Art\. 398 Abs\. 2\/3 StPO/);
    expect(r.kognition).not.toMatch(/Art\. 398 Abs\. 5 StPO/);
    expect(r.weichen.some((x) => /Art\. 401 Abs\. 2 StPO/.test(x))).toBe(false);
    expect(hatNorm(r, 'Art. 398 Abs. 5 StPO')).toBe(false);
  });
});

describe('F3-02 — Einsprache der Staatsanwaltschaft nur «soweit vorgesehen» (Art. 354 Abs. 1 lit. c StPO)', () => {
  it('B17: Strafbefehl, Staatsanwaltschaft → Weiche Ober-/Generalstaatsanwaltschaft soweit vorgesehen', () => {
    const r = bestimmeStrafRechtsmittel({ entscheidTyp: 'strafbefehl', werFichtAn: 'staatsanwaltschaft' });
    const w = r.weichen.find((x) => /\(Art\. 354 Abs\. 1 lit\. c StPO\)/.test(x));
    expect(w).toBeDefined();
    expect(w).toMatch(/SOWEIT VORGESEHEN/);
    expect(w).toMatch(/Ober- oder Generalstaatsanwaltschaft/);
    expect(hatNorm(r, 'Art. 354 Abs. 1 lit. c StPO')).toBe(true);
  });

  it('Gegenprobe: beschuldigte Person erhält die StA-Weiche nicht', () => {
    const r = bestimmeStrafRechtsmittel({ entscheidTyp: 'strafbefehl', werFichtAn: 'beschuldigte_person' });
    expect(alleTexte(r)).not.toMatch(/Generalstaatsanwaltschaft/);
    expect(hatNorm(r, 'Art. 354 Abs. 1 lit. c StPO')).toBe(false);
  });
});

describe('F3-03 — Haftsachen ohne BGG-Stillstand: Anker BGE 133 I 270 E. 1.2 statt Art. 46 Abs. 2 BGG', () => {
  it('BGer-Hinweis stützt den fehlenden Stillstand in Haftsachen auf BGE 133 I 270 E. 1.2 (Beschleunigungsgebot)', () => {
    const r = bestimmeStrafRechtsmittel(base({}));
    expect(r.bger.text).toMatch(/BGE 133 I 270 E\. 1\.2\b/);
    expect(r.bger.text).toMatch(/Beschleunigungsgebot/);
    expect(r.bger.text).not.toMatch(/Art\. 46 Abs\. 2 lit\. a BGG/);
  });

  it('Haftentscheid im Berufungsverfahren: Warnung mit BGE-Anker, nicht mit Art. 46 Abs. 2 BGG als Grundlage', () => {
    const r = bestimmeStrafRechtsmittel({ entscheidTyp: 'haftentscheid_berufungsverfahren', werFichtAn: 'beschuldigte_person' });
    const w = r.warnungen.find((x) => /Fristenstillstand/.test(x));
    expect(w).toBeDefined();
    expect(w).toMatch(/BGE 133 I 270 E\. 1\.2\b/);
    expect(w).not.toMatch(/NICHT \(Art\. 46 Abs\. 2 BGG\)/);
  });
});

describe('F3-09 — Anschlussberufung: 20 Tage seit EMPFANG der Berufungserklärung (Art. 400 Abs. 3 StPO)', () => {
  it('Fristtext folgt dem Wortlaut', () => {
    const r = bestimmeStrafRechtsmittel(base({}));
    const f = r.fristen.find((x) => x.label === 'Anschlussberufung der Gegenpartei');
    expect(f).toBeDefined();
    expect(f!.frist).toMatch(/^20 Tage seit Empfang der Berufungserklärung\b/);
    expect(f!.frist).not.toMatch(/Mitteilung/);
  });
});
