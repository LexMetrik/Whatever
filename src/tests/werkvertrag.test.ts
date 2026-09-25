import { describe, it, expect } from 'vitest';
import {
  WV_DEFAULTS, wvZusammenstellen, pruefeWvGates, type WvAntworten,
} from '../lib/vorlagen/werkvertrag';
import { docxAbsaetze } from '../lib/vorlagen/vorlagenDocx';
import { vorlagenPdfText } from '../lib/vorlagen/vorlagenPdf';
import type { Detailgrad } from '../lib/vorlagen/detailgrad';

// Normgeführte Klausel-Tests Werkvertrag (RL-39, Befunde VC-01/VC-02/VC-07,
// Prüfung Rechtslogik 23.9.2026). Bisher prüfte nur der Golden-Snapshot den
// Vertragstext — deshalb blieb VC-01 («verdeckte Mängel sofort» beim
// unbeweglichen Werk) unbemerkt.
//
// Wortlaute (Fedlex-Filestore, OR SR 220, Konsolidierung 20260101, in Kraft
// 1.1.2026–30.9.2026, abgerufen 25.9.2026):
// - Art. 367 Abs. 1bis: «Die Frist für die Mängelrüge beträgt bei einem
//   unbeweglichen Werk 60 Tage. Die Vereinbarung einer kürzeren Frist ist
//   unwirksam. Dasselbe gilt für die folgenden Mängel eines Werks, die die
//   Mangelhaftigkeit eines unbeweglichen Werks verursacht haben: a. Mängel
//   eines beweglichen Werks, das bestimmungsgemäss in das unbewegliche Werk
//   integriert worden ist; b. Mängel eines Werks, das von einem Architekten
//   oder Ingenieur erstellt und bestimmungsgemäss als Grundlage für die
//   Erstellung des unbeweglichen Werks verwendet worden ist.»
// - Art. 370 Abs. 3: verdeckte Mängel — «so muss die Anzeige sofort nach der
//   Entdeckung erfolgen».
// - Art. 370 Abs. 4: «Mängel eines unbeweglichen Werks, die bei der Abnahme
//   und ordnungsmässigen Prüfung nicht erkennbar waren, sind innert 60 Tagen
//   nach ihrer Entdeckung anzuzeigen. Die Vereinbarung kürzerer Fristen ist
//   unwirksam.» + dieselben lit. a/b wie Art. 367 Abs. 1bis.
// - Art. 368 Abs. 3: Werke auf dem Grund und Boden des Bestellers, nur mit
//   unverhältnismässigen Nachteilen entfernbar → «nur die im zweiten Absatz
//   dieses Artikels genannten Rechte» (keine Annahmeverweigerung).
// - Art. 368 Abs. 2bis: Einschränkung/Ausschluss der unentgeltlichen
//   Verbesserung zum Voraus «ist ungültig, wenn der Mangel eine Baute betrifft».

const DETAILGRADE: Detailgrad[] = ['einfach', 'standard', 'experte'];

const basis = (patch: Partial<WvAntworten> = {}): WvAntworten => ({
  ...WV_DEFAULTS,
  bestellerName: 'Muster AG', unternehmerName: 'Bau Beispiel GmbH',
  werkBeschrieb: 'Einbau einer Küche', preis: 'pauschal', pauschalCHF: '12000',
  ort: 'Zürich', datum: '2026-06-15',
  ...patch,
});

const absatz = (a: WvAntworten, id: string): string => {
  const abs = wvZusammenstellen(a).ergebnis.dokument.absaetze.find((x) => x.bausteinId === id);
  if (!abs) throw new Error(`Baustein ${id} fehlt`);
  return abs.text;
};
const hinweise = (a: WvAntworten): string => pruefeWvGates(a).hinweise.join('\n');

describe('Werkvertrag — Mängelrüge verdeckter Mängel (VC-01, Art. 370 Abs. 3/4 OR)', () => {
  it.each(DETAILGRADE)('unbewegliches Werk (%s): 60 Tage ab Entdeckung, kein «sofort»', (detailgrad) => {
    const t = absatz(basis({ detailgrad, werkArt: 'unbeweglich' }), 'WV05_abnahme');
    expect(t).toContain('innert 60 Tagen nach ihrer Entdeckung');
    expect(t).toContain('Art. 370 Abs. 4 OR');
    expect(t).toMatch(/kürzerer? Frist(en)? ist unwirksam/);
    expect(t).not.toMatch(/\bsofort\b/);
    // offene Mängel: 60-Tage-Rügefrist bleibt (Art. 367 Abs. 1bis OR)
    expect(t).toContain('Art. 367 Abs. 1bis OR');
  });

  it.each(DETAILGRADE)('bewegliches Werk mit Bauwerk-Bezug (%s): 60 Tage für bauwerkskausale Mängel (lit. a/b)', (detailgrad) => {
    const a = basis({ detailgrad, werkArt: 'beweglich', bauwerkBezug: true });
    const t = absatz(a, 'WV05_abnahme');
    expect(t).toContain('Art. 367 Abs. 1bis OR');
    expect(t).toContain('Art. 370 Abs. 4 OR');
    expect(t).toContain('innert 60 Tagen nach ihrer Entdeckung');
    expect(t).toContain('Mangelhaftigkeit des unbeweglichen Werks verursacht');
    // der Vertrag hält den Bezug als Sachverhalt fest (Grundlage der 60 Tage)
    expect(absatz(a, 'WV02_werk')).toMatch(/bestimmungsgemäss in ein unbewegliches Werk integriert/);
  });

  it.each(DETAILGRADE)('rein bewegliches Werk (%s): «sofort» bleibt (Art. 370 Abs. 3 OR), keine 60 Tage', (detailgrad) => {
    const t = absatz(basis({ detailgrad, werkArt: 'beweglich' }), 'WV05_abnahme');
    expect(t).toContain('Verdeckte Mängel sind sofort nach ihrer Entdeckung anzuzeigen');
    expect(t).toContain('Art. 370 Abs. 2 und 3 OR');
    expect(t).not.toMatch(/60 Tage/);
    expect(t).not.toContain('Art. 370 Abs. 4');
  });

  it('unbewegliches Werk geht dem Bauwerk-Bezug vor (Feld bleibt ohne Wirkung)', () => {
    const mit = wvZusammenstellen(basis({ werkArt: 'unbeweglich', bauwerkBezug: true }));
    const ohne = wvZusammenstellen(basis({ werkArt: 'unbeweglich', bauwerkBezug: false }));
    expect(JSON.stringify(mit)).toBe(JSON.stringify(ohne));
  });

  it('Hinweise: unbeweglich nennt Art. 370 Abs. 4 statt «sofort»; rein beweglich nicht', () => {
    const u = hinweise(basis({ werkArt: 'unbeweglich' }));
    expect(u).toContain('Art. 370 Abs. 4 OR');
    expect(u).not.toMatch(/\bsofort\b/);
    const b = hinweise(basis({ werkArt: 'beweglich' }));
    expect(b).toContain('sofort nach ihrer Entdeckung');
    expect(b).not.toContain('Art. 370 Abs. 4');
    const bb = hinweise(basis({ werkArt: 'beweglich', bauwerkBezug: true }));
    expect(bb).toContain('Art. 367 Abs. 1bis');
    expect(bb).toContain('Art. 370 Abs. 4 OR');
  });

  it('PDF und DOCX tragen denselben Rügesatz (eine Quelle: assemble-Ergebnis)', () => {
    const e = wvZusammenstellen(basis({ werkArt: 'unbeweglich' })).ergebnis;
    const t = e.dokument.absaetze.find((x) => x.bausteinId === 'WV05_abnahme')!.text;
    const docx = docxAbsaetze(e).map((x) => x.text).join('\n');
    expect(docx).toContain(t);
    const pdf = vorlagenPdfText(t);
    expect(pdf).toContain('innert 60 Tagen nach ihrer Entdeckung');
    expect(pdf).toContain('Art. 370 Abs. 4 OR');
  });
});

describe('Werkvertrag — Mängelrechte bei Bauten (VC-02, Art. 368 Abs. 2bis/3 OR)', () => {
  it.each(DETAILGRADE)('unbewegliches Werk (%s): Annahmeverweigerung unter Vorbehalt Art. 368 Abs. 3', (detailgrad) => {
    const t = absatz(basis({ detailgrad, werkArt: 'unbeweglich' }), 'WV06_maengelrechte');
    expect(t).toContain('Art. 368 Abs. 3 OR');
    expect(t).toContain('Grund und Boden des Bestellers');
    expect(t).toContain('Art. 368 Abs. 2bis OR');
  });

  it('bewegliches Werk: kein Bauten-Vorbehalt', () => {
    const t = absatz(basis({ werkArt: 'beweglich' }), 'WV06_maengelrechte');
    expect(t).not.toContain('Art. 368 Abs. 3');
    expect(t).not.toContain('Art. 368 Abs. 2bis');
  });
});

describe('Werkvertrag — zwingende Klauseln in allen Detailgraden (VC-07)', () => {
  it.each(DETAILGRADE)('%s: Rücktritt Art. 377, Rügefrist 367 Abs. 1bis, Verjährung 371', (detailgrad) => {
    // Art. 377 OR: Rücktrittsrecht nicht wegbedungen
    for (const werkArt of ['beweglich', 'unbeweglich'] as const) {
      const r = absatz(basis({ detailgrad, werkArt }), 'WV08_ruecktritt');
      expect(r).toContain('jederzeit vom Vertrag');
      expect(r).toContain('Art. 377 OR');
    }
    // Art. 367 Abs. 1bis OR: 60 Tage, kürzere Frist unwirksam (unbeweglich)
    const u = absatz(basis({ detailgrad, werkArt: 'unbeweglich' }), 'WV05_abnahme');
    expect(u).toContain('Frist für die Mängelrüge 60 Tage');
    expect(u).toContain('einer kürzeren Frist ist unwirksam (Art. 367 Abs. 1bis OR)');
    // Art. 371 Abs. 2 / Abs. 1 OR: 5 bzw. 2 Jahre ab Abnahme
    expect(absatz(basis({ detailgrad, werkArt: 'unbeweglich' }), 'WV07_verjaehrung'))
      .toMatch(/fünf Jahren nach der Abnahme des Werkes \(Art\. 371 Abs\. 2 OR\)/);
    expect(absatz(basis({ detailgrad, werkArt: 'beweglich' }), 'WV07_verjaehrung'))
      .toMatch(/zwei Jahren nach der Abnahme des Werkes;.*fünf Jahre \(Art\. 371 Abs\. 1 OR\)/);
  });

  it.each(DETAILGRADE)('%s: kein Haftungs- oder Gewährleistungsausschluss im Vertragstext', (detailgrad) => {
    for (const werkArt of ['beweglich', 'unbeweglich'] as const) {
      const alles = wvZusammenstellen(basis({ detailgrad, werkArt })).ergebnis.dokument.absaetze.map((x) => x.text).join('\n');
      expect(alles).not.toMatch(/\b(wegbedungen|ausgeschlossen|Haftungsausschluss|Gewährleistungsausschluss)\b/);
    }
  });
});
