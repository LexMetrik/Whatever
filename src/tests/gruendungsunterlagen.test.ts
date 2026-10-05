import { describe, it, expect } from 'vitest';
import {
  gmbhGruendungsunterlagen,
  agGruendungsunterlagen,
  emissionsabgabe,
  EMISSIONSABGABE_FREIBETRAG_CHF,
  type GmbhGruendungEingaben,
  type AgGruendungEingaben,
} from '../lib/gruendungsunterlagen';

// Akzeptanztests Gründungsunterlagen GmbH/AG — prüfen die abschliessenden
// HRegV-Beleglisten (Art. 71 bzw. 43) deterministisch je Weiche.
// Normgrundlagen verbatim am Fedlex-Cache verifiziert:
// bibliothek/recherche/gesellschaftsgruendung.md / gmbh-gruendung.md /
// ag-gruendung.md (alle 6.6.2026).

const gmbhBasis = (patch: Partial<GmbhGruendungEingaben> = {}): GmbhGruendungEingaben => ({
  einlageArt: 'bar',
  besondereVorteile: false,
  gfGewaehlt: true,
  mehrereGeschaeftsfuehrer: false,
  weitereVertretungsberechtigte: false,
  optingOut: true,
  eigeneBueros: true,
  immobilienHauptzweck: false,
  auslJurPersonGesellschafter: false,
  fremdwaehrung: false,
  bankInUrkundeGenannt: true,
  chWohnsitzVertretung: true,
  statutKlauseln: [],
  ...patch,
});

const agBasis = (patch: Partial<AgGruendungEingaben> = {}): AgGruendungEingaben => ({
  einlageArt: 'bar',
  besondereVorteile: false,
  optingOut: true,
  eigeneBueros: true,
  immobilienHauptzweck: false,
  inhaberaktien: false,
  fremdwaehrung: false,
  bankInUrkundeGenannt: true,
  chWohnsitzVertretung: true,
  ...patch,
});

const ids = (r: { unterlagen: { id: string }[] }) => r.unterlagen.map((u) => u.id);

describe('GmbH-Gründungsunterlagen (Art. 71/72 HRegV)', () => {
  it('einfache Bargründung: Kernbestand ohne bedingte Belege', () => {
    const r = gmbhGruendungsunterlagen(gmbhBasis());
    expect(ids(r)).toEqual([
      'statutenentwurf', 'kapitaleinlagekonto', 'ausweise',
      'errichtungsakt', 'statuten', 'wahlannahme-gf',
      'hr-anmeldung',
      'freigabe-einlagen', 'anteilbuch', 'wb-verzeichnis',
    ]);
    expect(r.blocker).toEqual([]);
    expect(r.emissionsabgabeChf).toBeNull();
  });

  it('Bank nicht in der Urkunde genannt → separate Bankbescheinigung (lit. g)', () => {
    const r = gmbhGruendungsunterlagen(gmbhBasis({ bankInUrkundeGenannt: false }));
    const beleg = r.unterlagen.find((u) => u.id === 'bankbescheinigung');
    expect(beleg?.norm).toBe('Art. 71 Abs. 1 lit. g HRegV');
    // Umkehrschluss: bei genannter Bank kein separater Beleg
    expect(ids(gmbhGruendungsunterlagen(gmbhBasis()))).not.toContain('bankbescheinigung');
  });

  it('Sacheinlage → qualifizierte Belege (Vertrag, Bericht, Prüfungsbestätigung) + Statuten-Hinweis 634 IV', () => {
    const r = gmbhGruendungsunterlagen(gmbhBasis({ einlageArt: 'sacheinlage' }));
    expect(ids(r)).toEqual(expect.arrayContaining(['sacheinlagevertrag', 'gruendungsbericht', 'pruefungsbestaetigung']));
    // reine Sacheinlage: kein Sperrkonto, keine Bankbescheinigung, keine Freigabe
    expect(ids(r)).not.toContain('kapitaleinlagekonto');
    expect(ids(r)).not.toContain('freigabe-einlagen');
    expect(r.hinweise.join(' ')).toContain('Art. 634 Abs. 4 OR');
  });

  it('Verrechnung → Gründungsbericht + Prüfungsbestätigung, aber KEIN Sacheinlagevertrag', () => {
    const r = gmbhGruendungsunterlagen(gmbhBasis({ einlageArt: 'verrechnung' }));
    expect(ids(r)).toEqual(expect.arrayContaining(['gruendungsbericht', 'pruefungsbestaetigung']));
    expect(ids(r)).not.toContain('sacheinlagevertrag');
    expect(r.hinweise.join(' ')).toContain('Art. 634a Abs. 3 OR');
  });

  it('besondere Vorteile allein machen die Gründung qualifiziert', () => {
    const r = gmbhGruendungsunterlagen(gmbhBasis({ besondereVorteile: true }));
    expect(ids(r)).toEqual(expect.arrayContaining(['gruendungsbericht', 'pruefungsbestaetigung']));
    expect(ids(r)).not.toContain('sacheinlagevertrag');
  });

  it('Revisionsstelle bestellt (kein Opting-out) → Wahlannahme RS (lit. d); Opting-out → Feststellungen in der Urkunde', () => {
    const mitRs = gmbhGruendungsunterlagen(gmbhBasis({ optingOut: false }));
    expect(ids(mitRs)).toContain('wahlannahme-rs');
    const ohneRs = gmbhGruendungsunterlagen(gmbhBasis());
    expect(ids(ohneRs)).not.toContain('wahlannahme-rs');
    const urkunde = ohneRs.unterlagen.find((u) => u.id === 'errichtungsakt');
    expect(urkunde?.hinweis).toContain('Art. 727a Abs. 2 OR');
  });

  it('statutarische GF-Einsetzung → kein Wahlannahme-Beleg (lit. c: «falls … auf einer Wahl beruht»)', () => {
    const r = gmbhGruendungsunterlagen(gmbhBasis({ gfGewaehlt: false }));
    expect(ids(r)).not.toContain('wahlannahme-gf');
  });

  it('mehrere Geschäftsführer → Vorsitz-Beschluss (lit. e; Art. 809 Abs. 3 OR)', () => {
    const r = gmbhGruendungsunterlagen(gmbhBasis({ mehrereGeschaeftsfuehrer: true }));
    const z = r.unterlagen.find((u) => u.id === 'vorsitz-beschluss');
    expect(z?.norm).toBe('Art. 71 Abs. 1 lit. e HRegV');
  });

  it('weitere Vertretungsberechtigte → Ernennungs-Beschluss (lit. f; Review-Befund M-2)', () => {
    const r = gmbhGruendungsunterlagen(gmbhBasis({ weitereVertretungsberechtigte: true }));
    const z = r.unterlagen.find((u) => u.id === 'vertretungs-beschluss');
    expect(z?.norm).toBe('Art. 71 Abs. 1 lit. f HRegV');
    expect(ids(gmbhGruendungsunterlagen(gmbhBasis()))).not.toContain('vertretungs-beschluss');
  });

  it('c/o-Adresse → Domizilannahmeerklärung (lit. h); Immobilien-Hauptzweck → Lex-Koller-Zeile', () => {
    const r = gmbhGruendungsunterlagen(gmbhBasis({ eigeneBueros: false, immobilienHauptzweck: true }));
    expect(ids(r)).toEqual(expect.arrayContaining(['domizilannahme', 'lex-koller']));
  });

  it('ausländische juristische Person → beglaubigter HR-Auszug mit Apostille', () => {
    const r = gmbhGruendungsunterlagen(gmbhBasis({ auslJurPersonGesellschafter: true }));
    expect(ids(r)).toContain('ausl-hr-auszug');
  });

  it('keine CH-Wohnsitz-Vertretung → Blocker mit Art. 814 Abs. 3 OR', () => {
    const r = gmbhGruendungsunterlagen(gmbhBasis({ chWohnsitzVertretung: false }));
    expect(r.blocker).toHaveLength(1);
    expect(r.blocker[0]).toContain('Art. 814 Abs. 3 OR');
  });

  it('Fremdwährung → Hinweis (Anhang 3, Gegenwert 20 000) + Urkunden-Hinweis Umrechnungskurse (72 lit. j)', () => {
    const r = gmbhGruendungsunterlagen(gmbhBasis({ fremdwaehrung: true }));
    expect(r.hinweise.join(' ')).toContain('Anhang 3 HRegV');
    expect(r.hinweise.join(' ')).toContain('20 000');
    expect(r.unterlagen.find((u) => u.id === 'errichtungsakt')?.hinweis).toContain('Art. 72 lit. j HRegV');
  });

  it('Statuten-Klauseln → Pflichtklausel-Zeilen mit Sachnorm-Ankern (776a ist aufgehoben)', () => {
    const r = gmbhGruendungsunterlagen(gmbhBasis({ statutKlauseln: ['nachschuss', 'vetorecht'] }));
    expect(r.statutenKlauseln.map((k) => k.norm)).toEqual(['Art. 795 OR', 'Art. 807 OR']);
    expect(r.hinweise.join(' ')).toContain('Art. 777a Abs. 2 OR');
  });

  it('Stampa-Aufklärung erscheint immer (Beleg seit 1.1.2021 gestrichen)', () => {
    expect(gmbhGruendungsunterlagen(gmbhBasis()).hinweise[0]).toContain('Stampa');
  });
});

describe('AG-Gründungsunterlagen (Art. 43/44 HRegV)', () => {
  it('einfache Bargründung: Kernbestand inkl. VR-Konstituierungsprotokoll (Pflichtbeleg, lit. e)', () => {
    const r = agGruendungsunterlagen(agBasis());
    expect(ids(r)).toEqual([
      'statutenentwurf', 'kapitaleinlagekonto', 'ausweise',
      'errichtungsakt', 'statuten', 'wahlannahme-vr', 'vr-konstituierung',
      'hr-anmeldung',
      'freigabe-einlagen', 'aktienbuch', 'wb-verzeichnis',
    ]);
    expect(r.unterlagen.find((u) => u.id === 'vr-konstituierung')?.norm).toBe('Art. 43 Abs. 1 lit. e HRegV');
    expect(r.blocker).toEqual([]);
  });

  it('GmbH/AG-Kontrast: Konstituierungsprotokoll nur bei der AG Pflicht-Kernbestand', () => {
    expect(ids(gmbhGruendungsunterlagen(gmbhBasis()))).not.toContain('vr-konstituierung');
    expect(ids(agGruendungsunterlagen(agBasis()))).toContain('vr-konstituierung');
  });

  it('Inhaberaktien → Kotierungs-/Bucheffekten-Nachweis (lit. i; Gate 622 Abs. 1bis)', () => {
    const r = agGruendungsunterlagen(agBasis({ inhaberaktien: true }));
    const z = r.unterlagen.find((u) => u.id === 'inhaberaktien-nachweis');
    expect(z?.norm).toBe('Art. 43 Abs. 1 lit. i HRegV');
    expect(z?.hinweis).toContain('Art. 622 Abs. 1bis OR');
    expect(ids(agGruendungsunterlagen(agBasis()))).not.toContain('inhaberaktien-nachweis');
  });

  it('qualifizierte Gründung → Belege nach Art. 43 Abs. 3 mit OR-Ankern 635/635a', () => {
    const r = agGruendungsunterlagen(agBasis({ einlageArt: 'gemischt' }));
    expect(ids(r)).toEqual(expect.arrayContaining(['sacheinlagevertrag', 'gruendungsbericht', 'pruefungsbestaetigung']));
    // gemischt: Sperrkonto + Freigabe bleiben (Bar-Anteil)
    expect(ids(r)).toEqual(expect.arrayContaining(['kapitaleinlagekonto', 'freigabe-einlagen']));
  });

  it('keine CH-Wohnsitz-Vertretung → Blocker mit Art. 718 Abs. 4 OR', () => {
    const r = agGruendungsunterlagen(agBasis({ chWohnsitzVertretung: false }));
    expect(r.blocker[0]).toContain('Art. 718 Abs. 4 OR');
  });

  it('Fremdwährung → Hinweis mit 100 000-Gegenwert und 50 000-Einlagen-Gegenwert (621 II / 632 II)', () => {
    const r = agGruendungsunterlagen(agBasis({ fremdwaehrung: true }));
    const txt = r.hinweise.join(' ');
    expect(txt).toContain('100 000');
    expect(txt).toContain('50 000');
  });

  // Fachliche Änderung (§6.3, RECHTSLOGIK 5.10.2026): Art. 697j, 697l und 697m OR
  // aufgehoben und Art. 718 Abs. 4 dritter Satz OR neu gefasst durch Anhang Ziff. 2
  // TJPG vom 26.9.2025, in Kraft seit 1.10.2026 (AS 2026 323; SR 955.3). Die
  // Pflichten liegen seither bei der Gesellschaft (Identifikation, Dokumentation,
  // Meldung an das Transparenzregister, Art. 7–9 TJPG) und den Aktionär:innen
  // (Meldung an die Gesellschaft, Art. 13 TJPG). Vorher: «697l-Verzeichnis mit
  // 697j-Meldepflicht» (Fassung OR 20260101).
  it('Nach Eintrag: Aktienbuch (686) und wirtschaftlich Berechtigte nach TJPG (Transparenzregister)', () => {
    const r = agGruendungsunterlagen(agBasis());
    expect(r.unterlagen.find((u) => u.id === 'aktienbuch')?.norm).toBe('Art. 686 OR');
    const wb = r.unterlagen.find((u) => u.id === 'wb-verzeichnis');
    expect(wb?.norm).toBe('Art. 9 TJPG');
    expect(wb?.hinweis).toContain('Art. 9 Abs. 4 TJPG');
    expect(wb?.hinweis).toContain('Art. 13 Abs. 3 TJPG');
    expect(wb?.hinweis).toContain('Art. 3 TJPG');
  });

  it('CH-Vertretung: Zugang zum Aktienbuch (718 IV OR) und zu den WB-Angaben (Art. 8 Abs. 4 TJPG), kein 697l mehr', () => {
    const r = agGruendungsunterlagen(agBasis({ chWohnsitzVertretung: false }));
    expect(r.blocker[0]).toContain('Art. 8 Abs. 4 TJPG');
    expect(r.blocker[0]).not.toMatch(/\b697l\b/);
  });
});

// Wächter (RECHTSLOGIK 5.10.2026): seit 1.10.2026 aufgehobene Artikel dürfen in
// keiner Ausgabe der Gründungs-Engine mehr zitiert werden — Art. 697j/697l/697m
// und 790a OR (Anhang Ziff. 2 TJPG, AS 2026 323). Identitäts-Treffer mit
// Wortgrenze (§7), über die Maximal-Kombination beider Rechtsformen.
describe('Aufgehobene OR-Artikel (TJPG, AS 2026 323) nicht mehr zitiert', () => {
  const AUFGEHOBEN = /\bArt(?:\.|ikel)\s*(?:697[jlm]|790a)\b|\b(?:697[jlm]|790a)\s+OR\b|nach\s+Art\.\s*697l\b/;
  const ausgabe = (r: { unterlagen: unknown; blocker: unknown; hinweise: unknown }) =>
    JSON.stringify([r.unterlagen, r.blocker, r.hinweise]);

  it('Sonde ist scharf (Rot-Beweis gegen die Altfassung)', () => {
    expect(AUFGEHOBEN.test('Meldepflicht innert Monatsfrist (Art. 697j OR, nicht kotiert)')).toBe(true);
    expect(AUFGEHOBEN.test('Verzeichnis nach Art. 697l (Art. 718 Abs. 4 OR)')).toBe(true);
    expect(AUFGEHOBEN.test('Art. 790a OR')).toBe(true);
    expect(AUFGEHOBEN.test('Art. 697n OR')).toBe(false);
  });

  it('GmbH: weder Art. 790a noch 697l; WB-Pflichten nach TJPG', () => {
    const r = gmbhGruendungsunterlagen(gmbhBasis({ chWohnsitzVertretung: false }));
    expect(ausgabe(r)).not.toMatch(AUFGEHOBEN);
    const wb = r.unterlagen.find((u) => u.id === 'wb-verzeichnis');
    expect(wb?.norm).toBe('Art. 9 TJPG');
    expect(wb?.hinweis).toContain('Art. 11 TJPG');
    expect(wb?.hinweis).toContain('Art. 13 Abs. 3 TJPG');
    expect(r.blocker[0]).toContain('Art. 8 Abs. 4 TJPG');
  });

  it('AG: weder Art. 697j noch 697l/697m', () => {
    const r = agGruendungsunterlagen(agBasis({ chWohnsitzVertretung: false }));
    expect(ausgabe(r)).not.toMatch(AUFGEHOBEN);
  });
});

describe('Emissionsabgabe (Art. 8 Abs. 1 / Art. 6 Abs. 1 lit. h StG)', () => {
  it('Freibetrag: bis CHF 1 Mio. keine Abgabe (Grenzwert inklusive — «soweit … nicht übersteigen»)', () => {
    expect(emissionsabgabe(undefined)).toBeNull();
    expect(emissionsabgabe(20_000)).toBeNull();
    expect(emissionsabgabe(EMISSIONSABGABE_FREIBETRAG_CHF)).toBeNull();
  });

  it('über dem Freibetrag: 1 % des übersteigenden Teils', () => {
    expect(emissionsabgabe(1_000_001)).toBeCloseTo(0.01, 10);
    expect(emissionsabgabe(2_000_000)).toBe(10_000);
    expect(emissionsabgabe(5_500_000)).toBe(45_000);
  });

  it('Handrechnung AG-Beispiel: AK 3 Mio. voll liberiert → (3 Mio. − 1 Mio.) × 1 % = CHF 20 000', () => {
    const r = agGruendungsunterlagen(agBasis({ leistungenChf: 3_000_000 }));
    expect(r.emissionsabgabeChf).toBe(20_000);
  });
});
