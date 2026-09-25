import { describe, it, expect } from 'vitest';
import {
  parseBesetzung, fold, kanonSlug, istAnonymisiert, kanonisiere, type KanonEintrag,
} from '../lib/rechtsprechung/besetzung';

// SLUG-KONTRAKT (fachliche Änderung 20.7.2026, §6.3 deklariert — kein Refactoring):
// Der Slug trägt den VOLLEN Vornamen (`wullschleger-stephan`), nicht mehr nur das
// Initial (`wullschleger-s`). Grund: am Appellationsgericht BS amten «Patrizia
// Schmid» (150 Entscheide) UND «Patrick Schmid» (37) — ein Initial-Slug `schmid-p`
// verschmilzt zwei reale Richterinnen/Richter zu einer Filter-Person (§1). Nennt die
// Quelle nur ein Initial (SVG-Stil «Dr. G. Thomi»), bleibt es beim Initial-Slug;
// `kanonisiere()` führt ihn korpusweit NUR bei Eindeutigkeit auf den Vollnamen.

// Alle Fixtures sind REALE Besetzungs-Freitexte aus dem Korpus (BS-«Mitwirkende»
// bzw. Bund-«Besetzung»), damit der Parser gegen die echten Muster prüft.

const slugs = (t: string, gericht: string) =>
  parseBesetzung(t, { gericht }).richter.map((r) => `${r.slug}:${r.rolle}`);
const namen = (t: string, gericht: string) =>
  parseBesetzung(t, { gericht }).richter
    .filter((r) => r.rolle !== 'gerichtsschreiber')
    .map((r) => r.name);

describe('fold (Kanon-Faltung)', () => {
  it('Diakritika/Ligaturen/ß deterministisch falten', () => {
    expect(fold('Wullschleger')).toBe('wullschleger');
    expect(fold('Garré')).toBe('garre');
    expect(fold('Hänni')).toBe('hanni');
    expect(fold('Strauss')).toBe('strauss');
    expect(fold('Aubry Girardin')).toBe('aubry-girardin');
    expect(fold("Jacquemoud-Rossari")).toBe('jacquemoud-rossari');
  });
});

describe('istAnonymisiert (harter Guard)', () => {
  it('fängt anonymisierte Partei-/Gutachter-Token', () => {
    expect(istAnonymisiert('C____')).toBe(true);
    expect(istAnonymisiert('A.________')).toBe(true);
    expect(istAnonymisiert('Dr. med. X.____')).toBe(true);
    expect(istAnonymisiert('B._______')).toBe(true);
  });
  it('lässt echte Namen (auch Dr. med.) durch', () => {
    expect(istAnonymisiert('Dr. med. W. Rühl')).toBe(false);
    expect(istAnonymisiert('lic. iur. Marc Oser')).toBe(false);
    expect(istAnonymisiert('Aubry Girardin')).toBe(false);
  });
});

describe('BS Appellationsgericht — Vollnamen + (Vorsitz)', () => {
  const t = 'Dr. Stephan Wullschleger (Vorsitz), Dr. Jacqueline Frossard, Dr. Annatina Wirz und Gerichtsschreiber MLaw Martin Manyoki';
  it('drei Richter + ein GS, Vorsitz korrekt', () => {
    const res = parseBesetzung(t, { gericht: 'bs_appellationsgericht' });
    expect(res.unstrukturiert).toBe(false);
    expect(res.leakErkannt).toBe(false);
    expect(res.richter.map((r) => `${r.slug}:${r.rolle}`)).toEqual([
      'wullschleger-stephan:vorsitz',
      'frossard-jacqueline:mitglied',
      'wirz-annatina:mitglied',
      'manyoki-martin:gerichtsschreiber',
    ]);
  });
  it('Anzeigename = Vorname + Nachname', () => {
    expect(namen(t, 'bs_appellationsgericht')).toEqual([
      'Stephan Wullschleger', 'Jacqueline Frossard', 'Annatina Wirz',
    ]);
  });
});

describe('BS — Vorsitz-Default (kein expliziter Marker) = erster Richter', () => {
  const t = 'Dr. Stephan Wullschleger, lic. iur. André Equey, lic. iur. Mia Fuchs und Gerichtsschreiberin Dr. Michèle Guth';
  it('erster Richter wird Vorsitz', () => {
    expect(slugs(t, 'bs_appellationsgericht')).toEqual([
      'wullschleger-stephan:vorsitz', 'equey-andre:mitglied', 'fuchs-mia:mitglied', 'guth-michele:gerichtsschreiber',
    ]);
  });
});

describe('BS Sozialversicherungsgericht — Initialen + Dr. med. Fachrichter', () => {
  const t = 'Dr. G. Thomi (Vorsitz), Dr. med. W. Rühl, S. Schenker und Gerichtsschreiberin lic. iur. S. Dreyer';
  it('Dr. med. ist Richter (nicht ausgeschlossen), Initial-Slugs', () => {
    const res = parseBesetzung(t, { gericht: 'bs_sozialversicherungsgericht' });
    expect(res.leakErkannt).toBe(false);
    expect(res.richter.map((r) => `${r.slug}:${r.rolle}`)).toEqual([
      'thomi-g:vorsitz', 'ruhl-w:mitglied', 'schenker-s:mitglied', 'dreyer-s:gerichtsschreiber',
    ]);
  });
});

describe('Anonymisierter Gutachter darf NIE Richter werden', () => {
  it('«Dr. med. X____» wird verworfen + Leak gemeldet', () => {
    const t = 'Dr. G. Thomi (Vorsitz), Dr. med. X____, lic. iur. A. Meier und Gerichtsschreiberin S. Dreyer';
    const res = parseBesetzung(t, { gericht: 'bs_sozialversicherungsgericht' });
    expect(res.leakErkannt).toBe(true);
    expect(res.richter.map((r) => r.slug)).toEqual(['thomi-g', 'meier-a', 'dreyer-s']);
    expect(res.richter.every((r) => !r.slug.includes('_') && !r.name.includes('_'))).toBe(true);
  });
});

describe('BGer DE — Nur-Nachnamen, Präsident als eigenes Segment', () => {
  it('«Bundesrichter Bovey, Präsident, Bundesrichter Hartmann, Josi, Gerichtsschreiber Levante»', () => {
    const t = 'Bundesrichter Bovey, Präsident, Bundesrichter Hartmann, Josi, Gerichtsschreiber Levante';
    expect(slugs(t, 'bger')).toEqual([
      'bovey:vorsitz', 'hartmann:mitglied', 'josi:mitglied', 'levante:gerichtsschreiber',
    ]);
  });
  it('mehrteilige Nachnamen bleiben zusammen (Aubry Girardin)', () => {
    const t = 'Bundesrichterin Aubry Girardin, Präsidentin, Bundesrichterin Hänni, Bundesrichter Kradolfer, Gerichtsschreiber Hongler';
    expect(slugs(t, 'bge')).toEqual([
      'aubry-girardin:vorsitz', 'hanni:mitglied', 'kradolfer:mitglied', 'hongler:gerichtsschreiber',
    ]);
  });
  it('präsidierendes Mitglied = Vorsitz', () => {
    const t = 'Bundesrichter Müller, präsidierendes Mitglied, Bundesrichter Merz, Kölz, Gerichtsschreiber Hahn';
    expect(slugs(t, 'bger')).toEqual([
      'muller:vorsitz', 'merz:mitglied', 'kolz:mitglied', 'hahn:gerichtsschreiber',
    ]);
  });
});

describe('BGE — Seiler als Richter UND (anderer) Gerichtsschreiber im selben Entscheid', () => {
  // Rollen-Trennung: derselbe Nachname kann in beiden Rollen auftreten (verschiedene Personen);
  // die Rolle muss den Unterschied tragen, nicht der Slug allein.
  it('Rolle trennt Vorsitz-Richter von GS', () => {
    const t = 'Bundesrichter Seiler, Präsident, Bundesrichter Zünd, Bundesrichterin Aubry Girardin, Gerichtsschreiber Seiler';
    const res = parseBesetzung(t, { gericht: 'bge' });
    expect(res.richter).toContainEqual(expect.objectContaining({ slug: 'seiler', rolle: 'vorsitz' }));
    expect(res.richter).toContainEqual(expect.objectContaining({ slug: 'seiler', rolle: 'gerichtsschreiber' }));
  });
});

describe('BVGer DE — Vorsitzende + Rollen-Nomen je Segment', () => {
  it('«Richterin Andrea Blum, Vorsitzende Richter Olivier Thormann und Richterin Brigitte Stump Wendt Gerichtsschreiberin Chiara Rossi»', () => {
    const t = 'Richterin Andrea Blum, Vorsitzende Richter Olivier Thormann und Richterin Brigitte Stump Wendt Gerichtsschreiberin Chiara Rossi';
    const res = parseBesetzung(t, { gericht: 'bvger' });
    const rr = res.richter.filter((r) => r.rolle !== 'gerichtsschreiber');
    expect(rr.map((r) => r.slug)).toEqual(['blum-andrea', 'thormann-olivier', 'stump-wendt-brigitte']);
    expect(rr.find((r) => r.slug === 'blum-andrea')?.rolle).toBe('vorsitz');
    expect(res.richter.find((r) => r.rolle === 'gerichtsschreiber')?.slug).toBe('rossi-chiara');
  });
});

describe('BStGer — Einzelrichter + GS ohne Komma', () => {
  it('«Bundesstrafrichter Alberto Fabbri, Einzelrichter Gerichtsschreiberin Fiona Krummenacher»', () => {
    const t = 'Bundesstrafrichter Alberto Fabbri, Einzelrichter Gerichtsschreiberin Fiona Krummenacher';
    const res = parseBesetzung(t, { gericht: 'bstger' });
    expect(res.richter.filter((r) => r.rolle !== 'gerichtsschreiber').map((r) => `${r.slug}:${r.rolle}`))
      .toEqual(['fabbri-alberto:vorsitz']);
    expect(res.richter.find((r) => r.rolle === 'gerichtsschreiber')?.slug).toBe('krummenacher-fiona');
  });
});

describe('BGE FR — Greffier mit Doppelpunkt, surname-only', () => {
  it('«MM. les Juges fédéraux Chaix, Président, Merkli, Fonjallaz, Haag et Muschietti. Greffière: Mme Kropf»', () => {
    const t = 'MM. les Juges fédéraux Chaix, Président, Merkli, Fonjallaz, Haag et Muschietti. Greffière: Mme Kropf';
    const res = parseBesetzung(t, { gericht: 'bge' });
    const rr = res.richter.filter((r) => r.rolle !== 'gerichtsschreiber');
    expect(rr.map((r) => r.slug)).toEqual(['chaix', 'merkli', 'fonjallaz', 'haag', 'muschietti']);
    expect(rr[0].rolle).toBe('vorsitz');
    expect(res.richter.find((r) => r.rolle === 'gerichtsschreiber')?.slug).toBe('kropf');
  });
});

describe('Leerer/kein Freitext → leer, nicht unstrukturiert', () => {
  it('null/leer', () => {
    expect(parseBesetzung(null, { gericht: 'bger' })).toEqual({ richter: [], leakErkannt: false, unstrukturiert: false });
    expect(parseBesetzung('   ', { gericht: 'bger' }).richter).toEqual([]);
  });
});

describe('Alias-Tabelle', () => {
  it('kanonSlug bildet identisch ab, wenn kein Alias (Default)', () => {
    expect(kanonSlug('thurnherr')).toBe('thurnherr');
  });
});

describe('Namenspartikel bleiben am Nachnamen', () => {
  it('«de Sépibus» wird nicht in given=de / surname=Sépibus zerlegt', () => {
    const r = parseBesetzung('Bundespatentrichter de Sépibus und Gerichtsschreiber X Y', { gericht: 'bpatger' }).richter;
    expect(r[0].slug).toBe('de-sepibus');
  });
  it('«Mme la Juge fédérale de Werra» — Rollenphrase weg, Partikel bleibt', () => {
    const r = parseBesetzung('Mme la Juge fédérale de Werra, Présidente. Greffier: M. Dyens', { gericht: 'bge' }).richter;
    expect(r[0].slug).toBe('de-werra');
    expect(r[0].rolle).toBe('vorsitz');
  });
});

describe('Rollen-/Titel-Rauschen wird nie ein Richter', () => {
  it('nachgestelltes «LL.M.» erzeugt keinen Phantom-Gerichtsschreiber', () => {
    const r = parseBesetzung('Dr. Patrizia Schmid und Gerichtsschreiber MLaw Martin Seelmann, LL.M.', { gericht: 'bs_appellationsgericht' }).richter;
    expect(r.map((x) => x.slug)).toEqual(['schmid-patrizia', 'seelmann-martin']);
  });
  it('«suppléante» ist eine Funktion, kein Nachname', () => {
    const r = parseBesetzung('M. le Juge fédéral Denys, Président, Mme la Juge fédérale van de Graaf, suppléante. Greffier: M. Dyens', { gericht: 'bge' }).richter;
    expect(r.map((x) => x.slug)).toEqual(['denys', 'van-de-graaf', 'dyens']);
  });
  it('Schluss-Satzpunkt verfälscht den Anzeigenamen nicht', () => {
    const r = parseBesetzung('Bundesrichter Chaix, Präsident, Bundesrichter Haag et Muschietti.', { gericht: 'bge' }).richter;
    expect(r.map((x) => x.name)).toEqual(['Chaix', 'Haag', 'Muschietti']);
  });
  it('«lic iur.» / «lic .iur» (reale Tippfehler) ergeben denselben Slug', () => {
    const a = parseBesetzung('lic iur. André Equey und Gerichtsschreiberin Dr. Noémi Biro', { gericht: 'bs_appellationsgericht' }).richter;
    const b = parseBesetzung('lic .iur André Equey und Gerichtsschreiberin Dr. Noémi Biro', { gericht: 'bs_appellationsgericht' }).richter;
    expect(a[0].slug).toBe('equey-andre');
    expect(b[0].slug).toBe('equey-andre');
  });
});

describe('kanonisiere — Initial→Vollname nur bei Eindeutigkeit', () => {
  // `givenAbk` wird — wie in der Produktion — aus der Schreibweise des Namens
  // abgeleitet: «K. Zimmermann» trägt eine Abkürzung, «Katharina Zimmermann» nicht.
  const e = (slug: string, nachSlug: string, givenSlug: string | null, name: string, raum = 'BS'): KanonEintrag =>
    ({ slug, nachSlug, givenSlug, givenAbk: /^[A-ZÄÖÜ][a-zäöüA-ZÄÖÜ]{0,2}\.(?=\s|$)/.test(name), name, raum });

  it('eindeutiges Initial wird auf den Vollnamen gezogen', () => {
    const k = kanonisiere([
      e('zimmermann-katharina', 'zimmermann', 'katharina', 'Katharina Zimmermann'),
      e('zimmermann-k', 'zimmermann', 'k', 'K. Zimmermann'),
    ]);
    expect(k.map.get('BS|zimmermann-k')).toBe('zimmermann-katharina');
    expect(k.anzeige.get('zimmermann-katharina')).toBe('Katharina Zimmermann');
  });

  it('MEHRDEUTIGES Initial bleibt getrennt und wird berichtet (Patrizia/Patrick Schmid)', () => {
    const k = kanonisiere([
      e('schmid-patrizia', 'schmid', 'patrizia', 'Patrizia Schmid'),
      e('schmid-patrick', 'schmid', 'patrick', 'Patrick Schmid'),
      e('schmid-p', 'schmid', 'p', 'P. Schmid'),
    ]);
    expect(k.map.get('BS|schmid-p')).toBe('schmid-p');           // NICHT zugeordnet
    expect(k.map.get('BS|schmid-patrizia')).toBe('schmid-patrizia');
    expect(k.map.get('BS|schmid-patrick')).toBe('schmid-patrick');
    expect(k.kollisionen.some((z) => z.includes('MEHRDEUTIGES INITIAL') && z.includes('schmid-p'))).toBe(true);
  });

  it('verschiedene Räume verschmelzen nie (Bundesrichter ≠ Basler Richter)', () => {
    const k = kanonisiere([
      e('muller-markus', 'muller', 'markus', 'Markus Müller', 'BS'),
      e('muller-m', 'muller', 'm', 'M. Müller', 'CH'),
    ]);
    expect(k.map.get('CH|muller-m')).toBe('muller-m');
  });

  it('Alias-Tabelle greift im Kanon-Pass (OCR-Variante)', () => {
    const k = kanonisiere([e('hoenen-christan', 'hoenen', 'christan', 'Christan Hoenen')]);
    expect(k.map.get('BS|hoenen-christan')).toBe('hoenen-christian');
  });

  it('deterministisch: gleiche Eingabe → gleiche Ausgabe', () => {
    const inp = [e('a-b', 'a', 'b', 'B A'), e('a-bernhard', 'a', 'bernhard', 'Bernhard A')];
    expect(JSON.stringify([...kanonisiere(inp).map])).toBe(JSON.stringify([...kanonisiere(inp).map]));
  });
});

// ─── Regressionen 20.7.2026: Absatz-Naht + Deckblatt-Labels + gesperrtes «a. o.» ──
// Alle vier Fälle stammen aus dem Fidelity-/Anomalie-Durchgang über die 3765
// BS-Rohdokumente. Sie betreffen den SCHNITT (bs-besetzung.ts) bzw. den STRIP
// (besetzung.ts); die Fixtures hier sind die Freitexte, wie der Schnitt sie nach
// der Korrektur liefert — sie halten fest, dass der Parser sie richtig zerlegt.

describe('Absatz-Naht: getrennte <p> sind Segment-Trenner, kein Namens-Kleber', () => {
  it('ZS.2025.2 — «(Vorsitz)»-Absatz + Folgeabsatz ergeben ZWEI Richter', () => {
    // Vorher (join mit Leerzeichen): ein erfundener Richter «Oser Dr. iur. Manuel
    // Kreis», Manuel Kreis verschwand ganz.
    expect(
      slugs(
        'lic. iur. Marc Oser (Vorsitz), Dr. iur. Manuel Kreis, Dr. Katharina Zimmermann '
        + 'und a.o. Gerichtsschreiberin MLaw Lorena Christ',
        'bs_appellationsgericht',
      ),
    ).toEqual([
      'oser-marc:vorsitz',
      'kreis-manuel:mitglied',
      'zimmermann-katharina:mitglied',
      'christ-lorena:gerichtsschreiber',
    ]);
  });

  it('VD.2022.39 — zwei Namen aus zwei Absätzen bleiben getrennt', () => {
    expect(namen(
      'Dr. Patrizia Schmid, lic. iur. Christian Hoenen, Dr. Heidrun Gutmannsbauer',
      'bs_appellationsgericht',
    )).toEqual(['Patrizia Schmid', 'Christian Hoenen', 'Heidrun Gutmannsbauer']);
  });
});

describe('Deckblatt-Label darf nie ein Richter werden', () => {
  it('SB.2021.88 — «Privatklägerschaft» ist kein Nachname', () => {
    // Der Schnitt bricht am Label ab; käme es doch durch, dürfte der Parser es
    // nicht als Person führen.
    const s = slugs(
      'lic. iur. Eva Christ, Dr. Annatina Wirz, lic. iur. Mia Fuchs '
      + 'und Gerichtsschreiberin lic. iur. Barbara Grange',
      'bs_appellationsgericht',
    );
    expect(s).toEqual([
      'christ-eva:vorsitz',
      'wirz-annatina:mitglied',
      'fuchs-mia:mitglied',
      'grange-barbara:gerichtsschreiber',
    ]);
    expect(s.join()).not.toMatch(/privatkl/i);
  });
});

describe('gesperrt gesetztes «a. o.» erzeugt keinen Phantom-Nachnamen «o»', () => {
  it('BES.2022.50 — «a. o. Gerichtsschreiber» wird als Rolle erkannt', () => {
    expect(slugs(
      'lic. iur. Christian Hoenen und a. o. Gerichtsschreiber BLaw Janick Dettwiler',
      'bs_appellationsgericht',
    )).toEqual(['hoenen-christian:vorsitz', 'dettwiler-janick:gerichtsschreiber']);
  });

  it('BES.2022.50-Variante ohne Sperrung bleibt gleich', () => {
    expect(slugs(
      'lic. iur. Christian Hoenen und a.o. Gerichtsschreiber BLaw Janick Dettwiler',
      'bs_appellationsgericht',
    )).toEqual(['hoenen-christian:vorsitz', 'dettwiler-janick:gerichtsschreiber']);
  });
});

// ─── Befunde der Gegenprüfung 20.7.2026 (blinde Stichprobe gegen das amtliche
//     BS-Portal). Beide betrafen die PERSONEN-IDENTITÄT und hätten den Filter
//     stillschweigend falsche Treffer liefern lassen. ────────────────────────────

describe('mehrere Vornamen-Initialen («F. W. Eymann»)', () => {
  it('bindet den Nachnamen korrekt, nicht «W. Eymann»', () => {
    // Vorher: slug `w-eymann-f`, Nachname «W. Eymann» — eine Suche nach «Eymann»
    // fand den medizinischen Fachrichter des SVG nicht mehr.
    const r = parseBesetzung('Dr. med. F. W. Eymann', { gericht: 'bs_sozialversicherungsgericht' }).richter;
    expect(r).toHaveLength(1);
    expect(r[0].nachSlug).toBe('eymann');
    expect(r[0].name).toBe('F. W. Eymann');
    // Slug bindet an die ERSTE Initiale, damit die Initial-Semantik (Länge 1)
    // für kanonisiere() erhalten bleibt.
    expect(r[0].slug).toBe('eymann-f');
    expect(r[0].givenSlug).toBe('f');
  });
});

describe('«M.» ist im deutschen Kantonstext ein Initial, keine Anrede', () => {
  it('BS: «M. Prack Hoenen» behält Initial UND zweiteiligen Nachnamen', () => {
    // Vorher: «M.» wurde als französisches «Monsieur» gestrippt → `hoenen-prack`
    // (Vorname weg, Nachname zerlegt) = eine andere, erfundene Person.
    const r = parseBesetzung('lic. iur. M. Prack Hoenen', { gericht: 'bs_sozialversicherungsgericht' }).richter;
    expect(r[0].slug).toBe('prack-hoenen-m');
    expect(r[0].nachSlug).toBe('prack-hoenen');
    expect(r[0].name).toBe('M. Prack Hoenen');
  });

  it('BS: «M. Meier» verliert das Initial nicht', () => {
    expect(slugs('Dr. M. Meier', 'bs_sozialversicherungsgericht')).toEqual(['meier-m:vorsitz']);
  });

  it('Bund FR: «M.»/«Mme» bleiben Anreden und werden gestrippt', () => {
    expect(slugs('M. le Juge fédéral Denys, Président. Greffier: M. Dyens', 'bge'))
      .toEqual(['denys:vorsitz', 'dyens:gerichtsschreiber']);
    expect(slugs('MM. les Juges fédéraux Chaix, Président, Haag. Greffière: Mme Kropf', 'bge'))
      .toEqual(['chaix:vorsitz', 'haag:mitglied', 'kropf:gerichtsschreiber']);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Regressionen der Gegenprüfung 20.7.2026 (Phantom-Richter, Fusionen, Rollen).
// Jeder Fall ist ein belegter Amtstext aus dem Korpus, nicht konstruiert.
// ─────────────────────────────────────────────────────────────────────────────
describe('Gegenprüfung 20.7.2026 — erfundene Amtsträger:innen', () => {
  it('«Juge présidant» ist ein Rollenwort, kein Nachname (BGE 151 IV 98)', () => {
    const r = slugs('MM. et Mme les Juges fédéraux Denys, Juge présidant, Muschietti, Abrecht et von Felten', 'bge');
    expect(r).not.toContain('presidant:mitglied');
    // Der Vorsitz gehört Denys — der Marker hatte ihn zuvor konsumiert.
    expect(r[0]).toBe('denys:vorsitz');
  });

  it('«giudice unica» (feminin) erzeugt keinen Richter «unica» (BVGer F-4218/2026)', () => {
    const r = slugs('Giudice Regula Schenker Senn, giudice unica, con l’approvazione della giudice Aileen Truttmann', 'bvger');
    expect(r).toEqual(['schenker-senn-regula:vorsitz', 'truttmann-aileen:mitglied']);
  });

  it('ZWEI Rollen-Qualifikatoren werden gestrippt — ein Richter, ein Slug (BStGer)', () => {
    const fr = slugs('Les juges pénaux fédéraux Patrick Robert-Nicoud, président, Roy Garré', 'bstger');
    const it = slugs('Giudici penali federali Patrick Robert-Nicoud, Presidente, Roy Garré', 'bstger');
    expect(fr[0]).toBe('robert-nicoud-patrick:vorsitz');
    // Beide Sprachfassungen MÜSSEN denselben Eimer treffen.
    expect(it[0]).toBe(fr[0]);
  });

  it('blosses «de» der Zustimmungsformel klebt nicht am Namen (BVGer E-165/2026)', () => {
    const r = slugs('Grégory Sauder, juge unique, avec l’approbation de Yanick Felley, juge', 'bvger');
    expect(r).toEqual(['sauder-gregory:vorsitz', 'felley-yanick:mitglied']);
  });

  it('«Dr. phil. II» ist ein Grad, kein Richter «II» (bpatger O2024_002)', () => {
    const r = slugs('Richter Dr. phil. II, Dipl. Biochem. Andreas Schöllhorn Savary', 'bpatger');
    expect(r).toEqual(['schollhorn-savary-andreas:vorsitz']);
  });

  it('«Referent» ist NICHT der Vorsitz — höchstens ein Vorsitz je Spruchkörper', () => {
    const r = parseBesetzung(
      'Präsident Dr. iur. Mark Schweizer (Vorsitz), Richter Dr. chem. Michael Kaufmann (Referent)',
      { gericht: 'bpatger' },
    ).richter;
    expect(r.filter((x) => x.rolle === 'vorsitz')).toHaveLength(1);
    expect(r.find((x) => x.slug === 'kaufmann-michael')!.rolle).toBe('mitglied');
  });
});

describe('Gegenprüfung 20.7.2026 — Fusionen, Spaltungen, Kontamination', () => {
  it('fehlendes amtliches Komma verschmilzt zwei Bundesrichter nicht (BGE 147 II 454)', () => {
    const r = slugs('MM. et Mme les Juges fédéraux Seiler, Président, Aubry Girardin, Donzallaz Beusch et Hartmann', 'bge');
    expect(r).toContain('donzallaz:mitglied');
    expect(r).toContain('beusch:mitglied');
    expect(r.join()).not.toContain('donzallaz-beusch');
  });

  it('echte zweiteilige Nachnamen werden NICHT gespalten', () => {
    expect(slugs('MM. les Juges fédéraux Aubry Girardin, van de Graaf et Kistler Vianin', 'bge'))
      .toEqual(['aubry-girardin:vorsitz', 'van-de-graaf:mitglied', 'kistler-vianin:mitglied']);
  });

  it('Aktenzeichen im Rubrum-Feld kostet die Gerichtsschreiberin nicht (BGE 151 IV 175)', () => {
    const r = slugs('MM. et Mme les Juges fédéraux Abrecht, Président, Koch et Hofmann. Greffière: Mme Kropf. 7B_950/2024et', 'bge');
    expect(r).toContain('kropf:gerichtsschreiber');
  });

  it('Bund-Gerichtsschreiberin: zweiteiliger Nachname bleibt Nachname', () => {
    const r = parseBesetzung('Bundesrichter Parrino, Präsident, Gerichtsschreiberin Keel Baumann', { gericht: 'bge' }).richter;
    const gs = r.find((x) => x.rolle === 'gerichtsschreiber')!;
    expect(gs.slug).toBe('keel-baumann');
    expect(gs.nachSlug).toBe('keel-baumann');
    expect(gs.givenSlug).toBeNull();   // sonst würde «keel» als Vollname registriert
  });

  it('führende Abkürzung «Th.» ist Vorname, nicht Nachnamensbestandteil', () => {
    const r = parseBesetzung('Bundesrichter Haag, Th. Müller, Merz', { gericht: 'bge' }).richter;
    const m = r.find((x) => x.nachSlug === 'muller')!;
    expect(m.slug).toBe('muller-th');
    expect(m.givenAbk).toBe(true);
    expect(m.name).toBe('Th. Müller');
  });

  it('«Müller Th.» und «Th. Müller» landen im SELBEN Eimer (Wortstellung egal)', () => {
    const a = parseBesetzung('Bundesrichter Th. Müller', { gericht: 'bge' }).richter[0];
    const b = parseBesetzung('Bundesrichter Müller Th.', { gericht: 'bge' }).richter[0];
    // Der Parser lässt die Schreibweise stehen (er stellt Namen nie um) — beide
    // falten aber auf denselben Slug, sind also EINE Person in der Facette.
    expect(a.slug).toBe('muller-th');
    expect(b.slug).toBe('muller-th');
    // Den Anzeigenamen entscheidet der Kanon-Pass: die häufigere, korrekt
    // gestellte Form gewinnt — «Müller Th» darf nicht zum Facetten-Label werden.
    const k = kanonisiere([
      { slug: a.slug, nachSlug: a.nachSlug, givenSlug: a.givenSlug, givenAbk: a.givenAbk, name: a.name, raum: 'CH' },
      { slug: a.slug, nachSlug: a.nachSlug, givenSlug: a.givenSlug, givenAbk: a.givenAbk, name: a.name, raum: 'CH' },
      { slug: b.slug, nachSlug: b.nachSlug, givenSlug: b.givenSlug, givenAbk: b.givenAbk, name: b.name, raum: 'CH' },
    ]);
    expect(k.anzeige.get('muller-th')).toBe('Th. Müller');
  });

  it('nachgestellte EINZEL-Initiale bleibt Rauschen («Stadelmann T.» → stadelmann)', () => {
    expect(slugs('Bundesrichter Stadelmann T., Präsident', 'bge')).toEqual(['stadelmann:vorsitz']);
  });
});

describe('Gegenprüfung 20.7.2026 — Kanon: Abkürzung ist kein Vollname', () => {
  const k = (slug: string, nachSlug: string, givenSlug: string | null, givenAbk: boolean, name: string): KanonEintrag =>
    ({ slug, nachSlug, givenSlug, givenAbk, name, raum: 'BS' });

  it('«Ph.» zieht den Initial-Eimer NICHT auf sich (waegeli-p bleibt Kanon)', () => {
    const r = kanonisiere([
      ...Array.from({ length: 97 }, () => k('waegeli-p', 'waegeli', 'p', true, 'P. Waegeli')),
      k('waegeli-ph', 'waegeli', 'ph', true, 'Ph. Waegeli'),
    ]);
    expect(r.map.get('BS|waegeli-p')).toBe('waegeli-p');
    expect(r.anzeige.get('waegeli-p')).toBe('P. Waegeli');
    expect(r.kollisionen.some((z) => z.startsWith('ABKÜRZUNGS-VARIANTEN'))).toBe(true);
  });

  it('Anzeigename: HÄUFIGKEIT schlägt Länge — der Tippfehler gewinnt nicht mehr', () => {
    const r = kanonisiere([
      ...Array.from({ length: 167 }, () => k('t-k-d', 'tk', 'daniela', false, 'Daniela Thurnherr Keller')),
      k('t-k-d', 'tk', 'daniela', false, 'Daniela Thurnherrr Keller'),
    ]);
    expect(r.anzeige.get('t-k-d')).toBe('Daniela Thurnherr Keller');
  });

  it('Anzeigename: ausgeschriebener Vorname schlägt die häufigere Abkürzung', () => {
    const r = kanonisiere([
      ...Array.from({ length: 288 }, () => k('pfleiderer-andrea', 'pfleiderer', 'a', true, 'A. Pfleiderer')),
      ...Array.from({ length: 2 }, () => k('pfleiderer-andrea', 'pfleiderer', 'andrea', false, 'Andrea Pfleiderer')),
    ]);
    expect(r.anzeige.get('pfleiderer-andrea')).toBe('Andrea Pfleiderer');
  });
});

// Nachzug eidg./kantonal 25.9.2026 (QS-KORPUS): BStGer BG.2026.62 (fr) — der Rollen-
// Zusatz «vice-présidente» hinterliess das Präfix «vice-» als Phantom-Richter mit
// Rolle vorsitz (check:besetzung G1b/G5 rot), Miriam Forni verlor den Vorsitz.
describe('Nachzug 25.9.2026 — «vice-présidente» ist ein Rollenwort', () => {
  it('BStGer BG.2026.62: kein Richter «vice», Vorsitz bei Forni', () => {
    const r = slugs('Les juges pénaux fédéraux Miriam Forni, vice-présidente, Roy Garré et Nathalie Zufferey, la greffière Salomé Jaques', 'bstger');
    expect(r).toEqual([
      'forni-miriam:vorsitz', 'garre-roy:mitglied', 'zufferey-nathalie:mitglied', 'jaques-salome:gerichtsschreiber',
    ]);
  });
});
