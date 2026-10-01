/**
 * W2·27-BUND-FERTIG · P7 #11 (1.10.2026) — Hochstellungen im FUSSNOTEN-TEXT bleiben erhalten.
 *
 * Befund beim Bau von `frueher` (Ursprünglich-Bezeichnung): `clean()` in fussnoten-extrahiere.ts warf JEDES <sup> aus dem
 * Fussnotentext — auch die Hochstellung «bis/ter/quater» an Artikel-Nummern. Die Fussnote «Ursprünglich Art. 29<sup>bis</sup>.»
 * (AHVG 29ter) stand im Struktur-Sidecar und im Leser als «Ursprünglich Art. 29.» — eine falsche Norm-Angabe. Gemessen
 * 1.10.2026 an den gepinnten Fedlex-Caches: 83 von 33'709 Fussnoten tragen Hochstellungen im Text, 31 davon in
 * «Ursprünglich»-Segmenten. Die Marker-<sup> (Nummer im <a>, leere <sup>, führende Nummer älterer Aspose-Dumps) fallen
 * weiterhin aus dem Text.
 * Ergänzung 1.10.2026 (Gegenprüfung #1249): Nachzählung = 80 geänderte Fussnotentexte in den Sidecars (origin/main ↔ Branch,
 * alle 231); Sternchen- (BV) und «¶h»-Hochstellungen (AVG) fallen weiterhin, siehe unten.
 *
 * Fixtures: WÖRTLICH aus dem Fedlex-Filestore-HTML (AHVG cc/63/837_843_843 / 20260101 html-1; OR cc/27/317_321_377 /
 * 20261001 html-2, Abruf der Caches 1.10.2026).
 */
import { describe, it, expect } from 'vitest';
import { fnDefinitionen } from '../../scripts/normtext/fussnoten-extrahiere';

const AHVG_29TER =
  '<p id="fn-d610120e3948"><sup><a href="#fnbck-d610120e3948">134</a></sup><sup></sup><sup> </sup>Ursprünglich Art. 29<sup>bis</sup>. Eingefügt durch Ziff. I des BG vom 21. Dez. 1956  (<a href="https://fedlex.data.admin.ch/eli/oc/1957/262_264_275" target="_blank">AS <b>1957</b> 262</a>).</p>';
const OR_336C =
  '<p id="fn-d1265042e14829"><sup><a href="#fnbck-d1265042e14829">210</a></sup><sup></sup> Ursprünglich: Bst. c<sup>bis</sup>, dann c<sup>ter</sup>. Eingefügt durch Ziff. II 1 des BG vom 20. Dez. 2019 (<a href="https://fedlex.data.admin.ch/eli/oc/2020/799" target="_blank">AS <b>2020</b> 4525</a>).</p>';
// Ältere Aspose-Dumps (VZG, ENTG, KOV …): kein fnbck, die Nummer steht als nacktes <sup>N</sup> vor dem Text.
const ASPOSE = '<p id="fn-a1"><sup>12</sup>Aufgehoben durch Ziff. I des BG vom 1. Jan. 2000 (AS 2000 1).</p>';

describe('P7 #11 · fnDefinitionen: Hochstellungen im Text bleiben, Marker-Hochstellungen fallen', () => {
  it('AHVG 29ter: «Art. 29bis», nicht «Art. 29» (die Norm-Angabe darf nicht verstümmelt werden)', () => {
    const d = fnDefinitionen(AHVG_29TER).get('fn-d610120e3948');
    expect(d?.nr).toBe('134');
    expect(d?.text).toBe('Ursprünglich Art. 29bis. Eingefügt durch Ziff. I des BG vom 21. Dez. 1956 (AS <b>1957</b> 262).');
  });

  it('OR 336c: mehrere Hochstellungen im selben Satz («Bst. cbis, dann cter»)', () => {
    expect(fnDefinitionen(OR_336C).get('fn-d1265042e14829')?.text).toBe(
      'Ursprünglich: Bst. cbis, dann cter. Eingefügt durch Ziff. II 1 des BG vom 20. Dez. 2019 (AS <b>2020</b> 4525).',
    );
  });

  it('Marker bleiben draussen: leere <sup>, <sup> mit Leerzeichen, führende nackte Nummer (Aspose), Link-Marker mitten im Text', () => {
    expect(fnDefinitionen(ASPOSE).get('fn-a1')?.text).toBe('Aufgehoben durch Ziff. I des BG vom 1. Jan. 2000 (AS 2000 1).');
    const mitte = '<p id="fn-a2"><sup><a href="#fnbck-a2">7</a></sup> Siehe Art. 5<sup>ter</sup> und Art. 9<sup><a href="#fn-zz">8</a></sup>.</p>';
    expect(fnDefinitionen(mitte).get('fn-a2')?.text).toBe('Siehe Art. 5ter und Art. 9.');
  });

  it('Links und ihre Label bleiben unverändert (Hochstellung im Label zählt zum Label)', () => {
    const d = fnDefinitionen(AHVG_29TER).get('fn-d610120e3948');
    expect(d?.links).toEqual([{ label: 'AS <b>1957</b> 262', url: 'https://fedlex.data.admin.ch/eli/oc/1957/262_264_275' }]);
  });
});

// P7-Nachzug T1/T2 (1.10.2026, Gegenprüfung #1249): Hochstellungen, die KEIN Text sind, fallen wie bisher — BV: «<sup>*</sup>»
// vor «Mit Übergangsbestimmung.» (25×, Sternchen-Marker), AVG Art. 2: Fedlex-Satzzeichen-Artefakt «<sup>¶h</sup>hh».
const BV_STERN = '<p id="fn-b1"><sup><a href="#fnbck-b1">12</a></sup><sup></sup><sup>*</sup> Mit Übergangsbestimmung.</p>';
const AVG_ARTEFAKT =
  '<p id="fn-v1"><sup><a href="#fnbck-v1">3</a></sup> Diese Änd. ist im ganzen Erlass berücksichtigt.<sup>¶h</sup>hh</p>';

describe('P7-Nachzug · Marker- und Artefakt-Hochstellungen fallen wie vor P7', () => {
  it('BV: «<sup>*</sup>» erzeugt kein führendes Sternchen (^-verankerte Muster bleiben gültig)', () => {
    expect(fnDefinitionen(BV_STERN).get('fn-b1')?.text).toBe('Mit Übergangsbestimmung.');
  });

  it('AVG Art. 2: «<sup>¶h</sup>» bleibt draussen (alte Behandlung: nur die Hochstellung fällt)', () => {
    expect(fnDefinitionen(AVG_ARTEFAKT).get('fn-v1')?.text).toBe('Diese Änd. ist im ganzen Erlass berücksichtigt.hh');
  });

  it('Gegenprobe: Text-Hochstellungen daneben bleiben (BVG Fn 327 «BBl 2018 5813»)', () => {
    const bbl =
      '<p id="fn-c1"><sup><a href="#fnbck-c1">9</a></sup> (<a href="https://fedlex.data.admin.ch/eli/fga/2018/2131">BBl <sup><b><inl>2018</inl></b></sup><sup><inl> 5813</inl></sup></a>).</p>';
    expect(fnDefinitionen(bbl).get('fn-c1')?.text).toBe('(BBl <b>2018</b> 5813).');
  });
});
