// Wiederaufnahme SG/AG/GR/BE in den Wochenlauf (QS-KORPUS, 26.9.2026) — nach
// Kopfdatum #1126/#1138. Stichprobe vor der Freigabe: n = 58 (SG 17, AG 17,
// GR 12, BE 12) gegen das amtliche PDF; 45 Datum = amtlicher Kopf, 13 vom
// Generator zurückgehalten, 0 falsch (Beleg: PR-Beschreibung).
import { describe, it, expect } from 'vitest';
import {
  amtlichesDatum, pruefeText, erkenneGuardBefunde, erkenneAusfaelle, aktiveGerichte, AUSGENOMMEN, DATUM_VOLLPRUEFUNG,
  KANTONS_GERICHTE, uebrigeAufruf, type RegEintrag,
} from '../../scripts/rechtsprechung/wochenlauf-kern';
import { pdfText } from '../../scripts/rechtsprechung/wochenlauf-pdf';
import { zurueckhalteZeile } from '../../scripts/normtext/entscheide-additiv';

const e = (key: string, gericht: string, datum: string, nummer: string) => ({ key, gericht, datum, nummer, titel: '' }) as unknown as RegEintrag;
const fueller = ' Erwägung'.repeat(80);

/** Mehrseitiges Minimal-PDF (eine Zeile je Seite, Helvetica). */
function pdfSeiten(seiten: string[]): Uint8Array {
  const esc = (t: string) => t.replace(/[()\\]/g, '\\$&');
  const objs = ['<< /Type /Catalog /Pages 2 0 R >>', `<< /Type /Pages /Kids [${seiten.map((_, i) => `${4 + 2 * i} 0 R`).join(' ')}] /Count ${seiten.length} >>`, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
  seiten.forEach((s, i) => {
    const inhalt = `BT /F1 12 Tf 72 720 Td (${esc(s)}) Tj ET`;
    objs.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${5 + 2 * i} 0 R /Resources << /Font << /F1 3 0 R >> >> >>`);
    objs.push(`<< /Length ${inhalt.length} >>\nstream\n${inhalt}\nendstream`);
  });
  let pdf = '%PDF-1.4\n';
  const off: number[] = [];
  objs.forEach((o, i) => { off.push(pdf.length); pdf += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const x = pdf.length;
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${off.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}`;
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${x}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}

describe('SG-Deckblatt: Plattform-Etikett ist NICHT der amtliche Kopf (Stichprobe 26.9.2026)', () => {
  // Reale Köpfe (publikationen.sg.ch): S. 1 Plattform «Entscheiddatum: 23.10.2025»,
  // S. 2 amtlicher Kopf «Entscheid vom 21. Oktober 2025» (UV 2025/14); ebenso
  // B 2024/150 (21.08. vs. 22.8.2025) und BV 2024/21 (04.07. vs. 4.8.2025). Vor dem
  // Fix meldete die Stichprobe alle drei als Fehltreffer (Rot-Beweis im PR).
  const deckblatt = 'Fall-Nr.: UV 2025/14\nStelle: Versicherungsgericht\nPublikationsdatum: 30.10.2025\nEntscheiddatum: 23.10.2025\nEntscheid Versicherungsgericht, 23.10.2025\nRegeste … mit Urteil vom 14. Januar 2026 abgewiesen';
  const kopf = 'Kanton St.Gallen Gerichte 1/16 Versicherungsgericht Abteilung III Entscheid vom 21. Oktober 2025 Besetzung Versicherungsrichter … Geschäftsnr. UV 2025/14';
  const az = /UV 2025\/14/;
  it('Titel im Seitenkopf einer Folgeseite MIT eigenem Aktenzeichen schlägt das Etikett', () => {
    // Mutation: Folgeseiten-Vorrang in amtlichesDatum entfernen ⇒ 2025-10-23.
    expect(amtlichesDatum(`${deckblatt}\f${kopf}`, az)).toBe('2025-10-21');
    expect(amtlichesDatum(`${deckblatt}\f${kopf}`)).toBe('2025-10-23'); // ohne Aktenzeichen kein Vorrang
    expect(pruefeText(`${deckblatt}\f${kopf}${fueller}`, e('k', 'sg_gerichte', '2025-10-21', 'UV 2025/14'), 'pdf').treffer).toBe(true);
  });
  it('ohne Titel im Folgeseiten-Kopf (altes Format 2024) bleibt das Etikett; Zitate weiter unten zählen nicht', () => {
    // B 2023/207 (26.9.2026): Seitenkopf S. 3 «Urteil 1C_486/2019 vom 16. Oktober 2020», ohne eigenes Aktenzeichen.
    // Mutation: Identitätsfilter (eigenesAz.test) entfernen ⇒ 2020-10-16.
    expect(amtlichesDatum(`${deckblatt}\fPublikationsplattform St.Galler Gerichte Vorinstanz\fUrteil 1C_486/2019 vom 16. Oktober 2020`, az)).toBe('2025-10-23');
    expect(amtlichesDatum(deckblatt)).toBe('2025-10-23'); // eine Seite: wie bisher
  });
  it('ohne Etikett ändert sich nichts (BE/GR/AG: Titel auf S. 1)', () => {
    expect(amtlichesDatum('Urteil vom 25. April 2026\nmitgeteilt am 5. Mai 2026\fUrteil vom 1. Januar 2020')).toBe('2026-04-25');
  });
  it('pdfText trennt Seiten mit Seitenvorschub — sonst fände amtlichesDatum keine Folgeseite', async () => {
    // Mutation: seiten.join('\n') in wochenlauf-pdf.ts ⇒ kein \f, Datum 2025-10-23.
    const t = await pdfText(pdfSeiten(['Entscheiddatum: 23.10.2025', 'Entscheid vom 21. Oktober 2025 UV 2025/14']));
    expect(t.split('\f')).toHaveLength(2);
    expect(amtlichesDatum(t, /UV 2025\/14/)).toBe('2025-10-21');
  });
});

describe('Guard: zurückgehaltene kantonale Neuabrufe erscheinen als Befund', () => {
  const zeile = zurueckhalteZeile('sg_gerichte', [{ decisionId: 'sg_b', court: 'sg_gerichte', nummer: 'B 2023/207', grund: 'plattform-ohne-kopf 2024-06-18: …' }], 0);
  it('die echte Generator-Zeile trifft das Muster; «gewählt» nicht', () => {
    // Mutation: Muster «zurückgehalten» aus GUARD_MUSTER entfernen ⇒ [].
    const log = [zeile, '[kanton] sg_gerichte: 24 de → 6 gewählt (Regeste: 2; Datum 2025-01-08…2025-10-21)'].join('\n');
    expect(erkenneGuardBefunde(log).map((g) => g.zeile)).toEqual([zeile]);
    expect(erkenneAusfaelle(log)).toEqual([]); // Befund, kein Ausfall
  });
});

describe('Freigabe: SG/AG/GR/BE im Wochenlauf, erster Lauf mit Datums-Vollprüfung', () => {
  it('nichts mehr ausgenommen; alle Kantone im Aufruf', () => {
    expect(AUSGENOMMEN).toEqual({});
    expect(aktiveGerichte(KANTONS_GERICHTE)).toEqual(KANTONS_GERICHTE);
    expect(uebrigeAufruf('2026-09-28').args).toContain(`--courts=${KANTONS_GERICHTE.join(',')}`);
  });
  it('Vollprüfung: SG, AG, GR, BE — jeder neue Eintrag gegen den amtlichen Kopf', () => {
    expect([...DATUM_VOLLPRUEFUNG].sort()).toEqual(['ag_gerichte', 'be_verwaltungsgericht', 'gr_gerichte', 'sg_gerichte']);
  });
});
