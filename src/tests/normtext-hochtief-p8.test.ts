import { describe, it, expect } from 'vitest';
import { extrahiereArtikel, parseArtikelInner, entferneTags, entferneFussnotenSups } from '../../scripts/normtext/extrahiere-fedlex';
import { hochTiefUnicode } from '../../scripts/normtext/fedlex/text';

// ═══ W2·27-BUND-FERTIG P8 · Teil A — Hoch-/Tiefstellungen im Normtext ═══════════
//
// BEFUND (Messung 3.10.2026 über alle 231 gepinnten Bund-HTMLs, Kommando im PR): Fedlex setzt
// Exponenten, Indizes und Ladungen als <sup>/<sub>. `entferneTags` rahmte reine Ziffern mit
// Leerzeichen ein — «12 m 3», «m/s 2», «M 2 , M 3», «CO 2 -Ziele», «133 1 / 3» — und liess ein
// Vorzeichen im <sup> unter den Tisch fallen («10-9» las sich als Subtraktion). «m/s 2» ist
// nicht «m/s²» (§1). Jetzt: Ziffern/Vorzeichen, die an einem Buchstaben/einer Ziffer/Klammer
// HÄNGEN, werden Unicode (m³ m/s² M₂ CO₂ NO₃⁻ 10⁻⁹); alles andere (Absatz-Labels, Buchstaben-
// Indizes wie «vmax») bleibt bit-gleich wie vorher.
//
// Fixtures sind reale Fedlex-Ausschnitte (Pin je Erlass im Kommentar, Konsolidierung = /tmp-Cache
// vom 2./3.10.2026), nicht nachgebaut. Rot-Beweis gegen den alten Code: Ausgabe im PR-Text.

// ArGV 3 Art. 12 «Luftraum» — SR 822.113, Konsolidierung 20240901 (der ganze <article>).
const ARGV3_ART_12 =
  '<article id="art_12"><a name="a12"></a><h6 class="heading " role="heading"><span class="display-icon"></span><span class="external-link-icon"></span><a href="#art_12"><b>Art. 12</b><b></b> <b></b>Luftraum</a></h6><div class="collapseable">'
  + '<p class="absatz "><sup>1</sup>&nbsp;In Arbeitsräumen muss auf jeden darin beschäftigten Arbeitnehmer ein Luftraum von wenigstens 12&nbsp;m<sup>3</sup>, bei ausreichender künstlicher Lüftung von wenigstens 10&nbsp;m<sup>3</sup>, entfallen.</p>'
  + '<p class="absatz "><sup>2</sup>&nbsp;Die Behörde schreibt einen grösseren Luftraum vor, wenn es der Gesundheitsschutz erfordert.</p></div></article>';

const blockTexte = (inner: string): string[] => parseArtikelInner(inner).bloecke.map((b) => b.text);

describe('P8-A · Exponent/Index/Ladung als Unicode statt «m 2»', () => {
  it('ArGV 3 Art. 12: «12 m³» und «10 m³» statt «12 m 3» (Fixture: ganzer Fedlex-Artikel)', () => {
    const r = extrahiereArtikel(ARGV3_ART_12, '12');
    expect(r!.bloecke[0].absatz).toBe('1');
    expect(r!.bloecke[0].text).toBe(
      'In Arbeitsräumen muss auf jeden darin beschäftigten Arbeitnehmer ein Luftraum von wenigstens 12 m³, bei ausreichender künstlicher Lüftung von wenigstens 10 m³, entfallen.',
    );
  });

  it('VTS Anhang 7: «m/s²» statt «m/s 2» (Absatz-Fixture)', () => {
    // VTS SR 741.41, Anhang 7 Ziff. 1 — Konsolidierung 20261001.
    const p = '<p class="absatz man-space-before-4">Die mittlere Vollverzögerung ist die durchschnittliche Geschwindigkeitsminderung in m/s<sup>2</sup> auf der Strecke, die vom Einsetzen der höchsten Bremskraft am Ende der Schwellzeit bis zum Stillstand des Fahrzeugs zurückgelegt wird.</p>';
    expect(blockTexte(p)[0]).toContain('Geschwindigkeitsminderung in m/s² auf der Strecke');
    expect(blockTexte(p)[0]).not.toMatch(/m\/s 2/);
  });

  it('VTS Art. 11: Fahrzeugklasse «M₁ bis 3,50 t» im Listen-Item statt «M 1 bis …»', () => {
    // VTS SR 741.41 Art. 11 Abs. 2 lit. a/b — Konsolidierung 20261001.
    const dl = '<dl class="man-space-after-0"><dt class="man-space-before-4">a. </dt><dd class="man-space-before-4">«Personenwagen» sind leichte Motorwagen zum Personentransport mit höchstens neun Sitzplätzen einschliesslich Führer oder Führerin (Klasse M<sub>1</sub>&nbsp;bis 3,50&nbsp;t);</dd><dt class="man-space-before-4">b. </dt><dd class="man-space-before-4">Kleinbusse (Klasse M<sub>2</sub> über 3,50 t oder M<sub>3</sub>);</dd></dl>';
    const items = parseArtikelInner('<p class="absatz "><sup>2</sup>&nbsp;Arten:</p>' + dl).bloecke[0].items!;
    expect(items[0].text).toContain('(Klasse M₁ bis 3,50 t);');
    expect(items[1].text).toBe('Kleinbusse (Klasse M₂ über 3,50 t oder M₃);');
  });

  it('OR Art. 964b: «CO₂-Ziele» statt «CO 2 -Ziele» (Absatz-Fixture)', () => {
    // OR SR 220 Art. 964b Abs. 1 — Konsolidierung 20261001.
    const p = '<p class="absatz man-space-before-4"><sup>1</sup>&nbsp;Der Bericht über nichtfinanzielle Belange gibt Rechenschaft über Umweltbelange, insbesondere die CO<sub>2</sub>-Ziele, über Sozialbelange.</p>';
    expect(blockTexte(p)[0]).toContain('insbesondere die CO₂-Ziele, über');
  });

  it('Ladung im Tabellentext: «(NO₃⁻ - N)» — Index UND Vorzeichen-Hochstellung', () => {
    // GSCHV SR 814.201 Anhang 2 Tabelle — Konsolidierung 20251201.
    expect(entferneTags('Nitrat <i>(NO</i><i><sub>3</sub></i><i><sup>–</sup></i><i> </i><i>- N)</i>')).toBe('Nitrat (NO₃⁻ - N)');
  });

  it('Zehnerpotenz mit Vorzeichen: «10⁻⁹ m/s» — das Minus im <sup> geht nicht verloren', () => {
    // VVEA SR 814.600 Anhang 2 Ziff. 1.2.2 — Konsolidierung 20261001 (alt: «10-9» = Subtraktion).
    expect(entferneTags('mit einem mittleren k von 1,0 × 10<sup>-9</sup> m/s, welche')).toBe('mit einem mittleren k von 1,0 × 10⁻⁹ m/s, welche');
    // LRV SR 814.318.142.1 Anhang 4 Ziff. 3: geschützter Bindestrich U+2011 → ⁻.
    expect(entferneTags('0,15&nbsp;m<sup>‑1</sup> unterschreiten')).toBe('0,15 m⁻¹ unterschreiten');
  });

  it('Bruch «133¹/₃» (IVG Art. 37) und «²/₃» (BVV 2 Art. 1d): kein «1331», Zähler auch nach Leerraum', () => {
    // IVG SR 831.20 Art. 37 Abs. 2 — Konsolidierung 20260101.
    const ivg = '<p class="absatz man-space-before-4"><sup>2</sup>&nbsp;so betragen seine Invalidenrente mindestens 133<sup>1</sup>/<sub>3</sub> Prozent der Mindestansätze.</p>';
    expect(blockTexte(ivg)[0]).toContain('mindestens 133¹/₃ Prozent');
    // BVV 2 SR 831.441.1 Art. 1d — Konsolidierung 20260801: der Zähler steht NACH Leerraum.
    const bvv = '<p class="absatz man-space-before-4"><sup>1</sup>&nbsp;muss mit den niedrigsten Beitragsanteilen mindestens <sup>2</sup>/<sub>3</sub>&nbsp;der Beitragsanteile bestritten werden.</p>';
    expect(blockTexte(bvv)[0]).toContain('mindestens ²/₃ der Beitragsanteile');
  });

  it('Index mit angehängtem Komma «M₃, N₂» (VTS Art. 38: Tiefstellung inkl. Satzzeichen)', () => {
    expect(entferneTags('Klassen M<sub>2</sub><sub>,</sub>&nbsp;M<sub>3,</sub> N<sub>2,</sub> N<sub>3</sub> und O')).toBe('Klassen M₂, M₃, N₂, N₃ und O');
  });
});

describe('P8-A · was NICHT angefasst wird (Abstand/Verklebung wie vorher, §1/§7)', () => {
  it('Absatz-Label-Bereich «2 und 3 …» (Leerraum im <sup>): bleibt «2 und 3 …», nie «²und³»', () => {
    // OR SR 220 Art. 624 Abs. 2 und 3 (aufgehoben) — Konsolidierung 20261001.
    expect(entferneTags('<sup>2 </sup>und<sup> 3</sup>&nbsp;…')).toBe('2 und 3 …');
  });

  it('Absatz-Label nach Satzende («anwendbar. 3 Zuständig …», AIG Art. 64a): kein Exponent', () => {
    // AIG SR 142.20 Art. 64a — Konsolidierung 20260612; der Fussnoten-Marker fällt vorher weg.
    const roh = 'sinngemäss anwendbar.<sup><a href="#fn-d932736e5820" id="fnbck-d932736e5820">157</a></sup><sup>3</sup>&nbsp;Zuständig für den Vollzug';
    expect(entferneTags(entferneFussnotenSups(roh))).toBe('sinngemäss anwendbar. 3 Zuständig für den Vollzug');
  });

  it('Bereichs-Label am Textanfang («– 3 …», BankG Art. 15 Abs. 2–3): Ziffer nach Strich bleibt «– 3 …»', () => {
    // BankG SR 952.0 Art. 15 — Konsolidierung 20260701.
    expect(entferneTags('<sup>–</sup><sup>3</sup>&nbsp;…')).toBe('– 3 …');
  });

  it('Buchstaben-/Mehrzeichen-Index wird nicht erraten: «vmax», «2n+1» bleiben verklebt wie bisher', () => {
    // VTS SR 741.41 Anhang 7 Ziff. 1.1 (dt-Marke) / ChemRRV SR 814.81 Anhang 1.
    expect(entferneTags('v<sub>max</sub> bauartbedingte Höchstgeschwindigkeit')).toBe('vmax bauartbedingte Höchstgeschwindigkeit');
    expect(entferneTags('Formel CnF<sub>2n+1</sub> mit n')).toBe('Formel CnF2n+1 mit n');
  });

  it('Buchstaben-Suffix «1bis» im Fliesstext bleibt geklebt (N1-Fix unverändert)', () => {
    expect(entferneTags('Absatz 1<sup>bis</sup> und Artikel 66a<sup>bis</sup> StGB')).toBe('Absatz 1bis und Artikel 66abis StGB');
  });

  it('Quell-Verklebung bleibt Quell-Verklebung: «1000 m²vergrössert» (BGBB Art. 60 trägt kein Leerzeichen)', () => {
    // BGBB SR 211.412.11 Art. 60 Abs. 1 lit. d — Konsolidierung 20260101: die Quelle setzt kein Leerzeichen nach dem <sup>.
    expect(entferneTags('um 1000&nbsp;m<sup>2</sup>vergrössert werden;')).toBe('um 1000 m²vergrössert werden;');
  });

  it('LOSE Ziffer (Textanfang, Leerraum davor) behält den Abstand — nie zwei Ziffern zu einer Zahl (§1)', () => {
    expect(entferneTags('Frist von <sup>3</sup> Tagen')).toBe('Frist von 3 Tagen');
    expect(entferneTags('<sup>72</sup>3 Franken')).toBe('72 3 Franken');
  });
});

describe('P8-A · hochTiefUnicode (Tabelle)', () => {
  it('bildet nur Ziffern und Vorzeichen ab, alles andere ist null', () => {
    expect(hochTiefUnicode('sup', '0123456789')).toBe('⁰¹²³⁴⁵⁶⁷⁸⁹');
    expect(hochTiefUnicode('sub', '0123456789')).toBe('₀₁₂₃₄₅₆₇₈₉');
    expect(hochTiefUnicode('sup', '2+')).toBe('²⁺');
    expect(hochTiefUnicode('sup', '–')).toBe('⁻');
    expect(hochTiefUnicode('sub', '3,')).toBe('₃,');
    for (const t of ['a', 'max', '2n+1', '8–n', '2–3', '4-6', '*', '0,1 · Lr', '1bis']) {
      expect(hochTiefUnicode('sup', t), t).toBeNull();
      expect(hochTiefUnicode('sub', t), t).toBeNull();
    }
  });
});
