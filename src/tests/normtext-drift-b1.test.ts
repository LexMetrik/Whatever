// Drift-Riegel B1-Ausdehnung (W2·27-BUND-FERTIG, Posten 30.9.2026): je Klasse der 997
// nicht-«art_N»-ids (annex, art-Bereich, disp, scope, decl) eine grüne Zusicherung und
// ein Rot-Beweis (manipulierter Eintrag ⇒ Befund), dazu B2-Schärfung, B4-Mehrheit,
// Deckungs-Ausweis und Bestandsprobe gegen public/normtext/bund (25 601 Einträge).
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import {
  LABEL_AUSNAHMEN,
  klassifiziere,
  labelDeckungText,
  pruefeLabelUrl,
  pruefeLabelUrlMitDeckung,
} from '../../scripts/normtext/drift-logik.ts';
import type { NormSnapshot } from '../../scripts/normtext/drift-logik.ts';

const B = 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de';
const snap = (id: string, artikelLabel: string, quelleUrl: string): NormSnapshot => ({
  id,
  quelle: 'OR',
  fassungsToken: '20260101',
  artikelLabel,
  quelleUrl,
});
const regeln = (s: NormSnapshot[]) => pruefeLabelUrl(s).map((b) => `${b.regel}${b.klasse ? `:${b.klasse}` : ''}`);

describe('B1-Ausdehnung — je Klasse grün + rot', () => {
  it('annex: Label «Anhang n[.m|x]», Anker == id-Token', () => {
    const gruen = [
      snap('bund/OR/annex_1', 'Anhang 1', `${B}#annex_1`),
      snap('bund/OR/annex_1_12', 'Anhang 1.12', `${B}#annex_1_12`),
      snap('bund/OR/annex_4_a', 'Anhang 4a', `${B}#annex_4_a`),
      snap('bund/OR/annex_II', 'Anhang II', `${B}#annex_II`),
    ];
    expect(regeln(gruen)).toEqual([]);
    expect(regeln([snap('bund/OR/annex_1', 'Anhang 2', `${B}#annex_1`)])).toEqual(['B1-label:annex']);
    expect(regeln([snap('bund/OR/annex_1_12', 'Anhang 1.12', `${B}#annex_1_2`)])).toEqual(['B1-anker:annex']);
    expect(regeln([snap('bund/OR/annex_4_a', 'Anhang 4', `${B}#annex_4_a`)])).toEqual(['B1-label:annex']);
  });

  it('annex_u (frei): Label nur nichtleer, Anker == id-Token', () => {
    expect(regeln([snap('bund/OR/annex_u1', 'Anlage', `${B}#annex_u1`)])).toEqual([]);
    expect(regeln([snap('bund/OR/annex_u1', '', `${B}#annex_u1`)])).toEqual(['B1-label:annex-frei']);
    expect(regeln([snap('bund/OR/annex_u1', 'Anhang', `${B}#annex_u2`)])).toEqual(['B1-anker:annex-frei']);
  });

  it('art-Bereich: Label «Art. T1–T2», Anker == id-Token', () => {
    const gruen = [
      snap('bund/OR/art_26_28', 'Art. 26–28', `${B}#art_26_28`),
      snap('bund/OR/art_48_bis_48_sexies', 'Art. 48bis–48sexies', `${B}#art_48_bis_48_sexies`),
      snap('bund/OR/art_50_d_50_g', 'Art. 50d–50g', `${B}#art_50_d_50_g`),
    ];
    expect(regeln(gruen)).toEqual([]);
    expect(regeln([snap('bund/OR/art_26_28', 'Art. 26–29', `${B}#art_26_28`)])).toEqual(['B1-label:art-bereich']);
    expect(regeln([snap('bund/OR/art_26_28', 'Art. 26–28', `${B}#art_26_27`)])).toEqual(['B1-anker:art-bereich']);
    expect(regeln([snap('bund/OR/art_50_d_50_g', 'Art. 50–50g', `${B}#art_50_d_50_g`)])).toEqual(['B1-label:art-bereich']);
  });

  it('disp: Label aus dem art-Rest, Anker mit amtlichem «/» (disp_uK/art_…)', () => {
    const gruen = [
      snap('bund/OR/disp_u2_art_1', 'Art. 1', `${B}#disp_u2/art_1`),
      snap('bund/OR/disp_u2_art_5_a', 'Art. 5a', `${B}#disp_u2/art_5_a`),
      snap('bund/OR/disp_u2_art_7_9', 'Art. 7–9', `${B}#disp_u2/art_7_9`),
    ];
    expect(regeln(gruen)).toEqual([]);
    expect(regeln([snap('bund/OR/disp_u2_art_1', 'Art. 2', `${B}#disp_u2/art_1`)])).toEqual(['B1-label:disp']);
    expect(regeln([snap('bund/OR/disp_u2_art_1', 'Art. 1', `${B}#disp_u2_art_1`)])).toEqual(['B1-anker:disp']);
    expect(regeln([snap('bund/OR/disp_u2_art_1', 'Art. 1', `${B}#disp_u2/art_2`)])).toEqual(['B1-anker:disp']);
    expect(regeln([snap('bund/OR/disp_u2_art_7_9', 'Art. 7', `${B}#disp_u2/art_7_9`)])).toEqual(['B1-label:disp']);
  });

  it('scope: Label-Format «Geltungsbereich [des|der X] am T. Monat J», Anker == id-Token', () => {
    const gruen = [
      snap('bund/CISG/scope_u1', 'Geltungsbereich am 22. Mai 2026', `${B}#scope_u1`),
      snap('bund/X/scope_u1', 'Geltungsbereich des Übereinkommes am 7. Mai 2026', `${B}#scope_u1`),
      snap('bund/Y/scope_u1', 'Geltungsbereich der Änderung am 4. Juni 2014', `${B}#scope_u1`),
    ];
    expect(regeln(gruen)).toEqual([]);
    expect(regeln([snap('bund/CISG/scope_u1', 'Vorbehalte am 22. Mai 2026', `${B}#scope_u1`)])).toEqual(['B1-label:scope']);
    expect(regeln([snap('bund/CISG/scope_u1', '', `${B}#scope_u1`)])).toEqual(['B1-label:scope']);
    expect(regeln([snap('bund/CISG/scope_u1', 'Geltungsbereich am 22. Mai 2026', `${B}#scope_u2`)])).toEqual(['B1-anker:scope']);
  });

  it('decl: Label nur nichtleer, Anker == id-Token', () => {
    expect(regeln([snap('bund/EAUE/decl_u2', 'Vorbehalte und Erklärungen', `${B}#decl_u2`)])).toEqual([]);
    expect(regeln([snap('bund/EAUE/decl_u2', ' ', `${B}#decl_u2`)])).toEqual(['B1-label:decl']);
    expect(regeln([snap('bund/EAUE/decl_u2', 'Erklärung', `${B}#decl_u3`)])).toEqual(['B1-anker:decl']);
  });

  it('unbekannte id-Klasse: nur «/»→«_»-Regel, und als «sonstig» ausgewiesen', () => {
    const r = pruefeLabelUrlMitDeckung([
      snap('bund/OR/praeambel', 'Präambel', `${B}#praeambel`),
      snap('bund/OR/vorwort_1', 'Vorwort', `${B}#vorwort_2`),
    ]);
    expect(r.deckung.sonstig).toBe(2);
    expect(r.befunde.map((b) => `${b.regel}:${b.klasse}`)).toEqual(['B1-anker:sonstig']);
  });

  it('klassifiziere(): Klassen-Zuordnung und Synthese-Token bleibt unklassifiziert (B2-Pfad)', () => {
    expect(klassifiziere('art_41')?.klasse).toBe('art');
    expect(klassifiziere('art_26_28')?.klasse).toBe('art-bereich');
    expect(klassifiziere('annex_u1')?.klasse).toBe('annex-frei');
    expect(klassifiziere('annex_1_2')?.label).toBe('Anhang 1.2');
    expect(klassifiziere('disp_u2_art_5_a')?.anker).toBe('disp_u2/art_5_a');
    expect(klassifiziere('scope_u1')?.klasse).toBe('scope');
    expect(klassifiziere('decl_u3')?.klasse).toBe('decl');
    expect(klassifiziere('art_126_z__2')).toBeNull();
  });
});

describe('Festgenagelte Label-Ausnahme (VRV-Anhang II)', () => {
  it('exakt das Ist-Label ist grün und ausgewiesen; jede andere Änderung rot; überholte Ausnahme rot', () => {
    expect(LABEL_AUSNAHMEN['bund/VRV/annex_II']).toBe('+Anhang II');
    const ok = pruefeLabelUrlMitDeckung([snap('bund/VRV/annex_II', '+Anhang II', `${B}#annex_II`)]);
    expect(ok.befunde).toEqual([]);
    expect(ok.deckung.ausnahmen).toEqual(['bund/VRV/annex_II']);
    expect(regeln([snap('bund/VRV/annex_II', '+Anhang III', `${B}#annex_II`)])).toEqual(['B1-label:annex']);
    expect(regeln([snap('bund/VRV/annex_II', 'Anhang II', `${B}#annex_II`)])).toEqual(['B1-label:annex']);
  });
});

describe('B2-Schärfung — «Label länger» reicht nicht mehr', () => {
  const basis = snap('bund/KKV/art_126_z', 'Art. 126z', `${B}#art_126_z`);
  const syn = (label: string) => snap('bund/KKV/art_126_z__2', label, `${B}#ta126z`);

  it('Wiederholungs-Adverb ist grün; «Art. 126zX» und beliebiger Zusatz sind rot', () => {
    expect(regeln([basis, syn('Art. 126ztredecies')])).toEqual([]);
    expect(regeln([basis, syn('Art. 126zX')])).toEqual(['B2-label']);
    expect(regeln([basis, syn('Art. 126z (neu)')])).toEqual(['B2-label']);
    expect(regeln([basis, syn('Art. 127tredecies')])).toEqual(['B2-label']);
  });

  it('Label kommt im Erlass schon vor → rot', () => {
    const bis = snap('bund/KKV/art_126_z_tredecies', 'Art. 126ztredecies', `${B}#art_126_z_tredecies`);
    expect(pruefeLabelUrl([basis, bis, syn('Art. 126ztredecies')]).map((b) => b.regel)).toEqual(['B2-label']);
  });
});

describe('B4 — Referenz = Mehrheits-Basis, nicht der erste Eintrag', () => {
  it('falscher ERSTER Eintrag: nur er wird gemeldet, nicht alle übrigen', () => {
    const r = pruefeLabelUrl([
      snap('bund/OR/art_1', 'Art. 1', 'https://anderswo.example/de#art_1'),
      snap('bund/OR/art_2', 'Art. 2', `${B}#art_2`),
      snap('bund/OR/art_3', 'Art. 3', `${B}#art_3`),
      snap('bund/OR/art_4', 'Art. 4', `${B}#art_4`),
    ]);
    expect(r.map((b) => `${b.regel}:${b.id}`)).toEqual(['B4-basis-url:bund/OR/art_1']);
  });
});

describe('Deckungs-Ausweis (§8)', () => {
  it('nennt abgeleitet / nur-Format je Klasse / Kanton UNGEPRÜFT', () => {
    const { deckung } = pruefeLabelUrlMitDeckung([
      snap('bund/OR/art_1', 'Art. 1', `${B}#art_1`),
      snap('bund/OR/annex_u1', 'Anhang', `${B}#annex_u1`),
      snap('bund/OR/decl_u2', 'Erklärung', `${B}#decl_u2`),
    ]);
    const t = labelDeckungText(deckung, 34907);
    expect(t).toContain('Label aus id geprüft: 1');
    expect(t).toContain('nicht ableitbar): 2 (annex-frei 1, decl 1)');
    expect(t).toContain('Kanton-Labels UNGEPRÜFT: 34907 Einträge');
  });
});

describe('Bestandsprobe gegen public/normtext/bund', () => {
  it('alle Bund-Snapshots grün; 997 nicht-art_N-ids sind klassifiziert (keine «sonstig»)', () => {
    const dir = 'public/normtext/bund';
    const alle: NormSnapshot[] = [];
    for (const f of readdirSync(dir)) {
      if (!f.endsWith('.json')) continue;
      const j = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8')) as { eintraege?: NormSnapshot[] };
      alle.push(...(j.eintraege ?? []));
    }
    const { befunde, deckung } = pruefeLabelUrlMitDeckung(alle);
    expect(befunde).toEqual([]);
    expect(deckung.sonstig).toBe(0);
    // Klassen-Anzahl: Label exakt abgeleitet = alles ausser annex_u/decl/scope und dem einen __n-Eintrag.
    expect(deckung.labelAbgeleitet + deckung.labelNurFormat + 1).toBe(alle.length);
  });
});
