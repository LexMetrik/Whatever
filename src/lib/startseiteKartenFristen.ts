// ─── Rechner-Karten (RechnerCard) — Teilmodul Rubrik I (Fristen) ───
//
// H-10 (§6.6, B26): aus dem Katalog-Modul entlang der vorhandenen
// Rubrik-Blöcke ausgelagert — Einträge byte-identisch verschoben, im
// Stamm-Modul per Spread in Original-Key-Reihenfolge zusammengeführt.
import { fedlexUrl } from './fedlex';
import type { CalculatorCard } from './startseiteConfigTypen';

export const KARTEN_FRISTEN: Record<string, CalculatorCard> = {
  // ════ I – Fristen (geprüft) ════
  'zpo-fristen': {
    id: 'zpo-fristen', modus: 'rechner', art: 'frist', rechtsgebiet: 'Zivilprozess (ZPO) & Bundesgericht',
    rechtsbereich: 'privat',
    title: 'Verfahrens- & Rechtsmittelfristen',
    // M7: Kurzform für den Reiter (§5a Ziff. 2) — aus dem eigenen
    // Routen-Slug und dem Kürzel des massgeblichen Erlasses, nicht geraten.
    kurz: 'ZPO-Fristen',
    szenarien: [
      { label: 'Rechtsmittel, Schlichtung, Erstinstanz (Phasen-Auswahl)', status: 'entwurf' },
      { label: 'Klagebewilligung – Geltungsdauer (Schlichtungs-Preset)', status: 'entwurf' },
      { label: 'Fristwiederherstellung (Art. 148 ZPO)', status: 'geplant' },
    ],
    description: 'Verfahrens- und Rechtsmittelfristen mit Gerichtsferien und Stillstand.',
    status: 'entwurf',
    norms: [
      // Art. 142–147 ZPO – Fristenlauf (Spanne: Anker auf führenden Artikel)
      { label: 'Art. 142–147 ZPO', url: fedlexUrl('ZPO', '142'), verified: false },
    ],
    href: '/rechner/zpo-fristen',
    related: ['schlichtungsgesuch', 'klage-vereinfacht', 'tagerechner'],
    // Norm-Keywords nur für Fristen, die als Preset implementiert sind
    // (zpoPresets.ts: Art. 311/314/321/312/313/329/209/239/63; Art. 148 als
    // Wiederherstellungs-Warnung) — verifiziert 6.6.2026 (Katalog-UI 1.1).
    keywords: ['Frist', 'Gericht', 'Berufung', 'Beschwerde', 'Klage', 'Gerichtsferien', 'Stillstand', 'Zustellung',
      'Berufungsfrist', 'Beschwerdefrist', 'Rechtsmittelfrist', 'Klagebewilligung',
      // S-5c (Bug-Check §9, NIEDRIG): Begriffe des aufgelösten
      // Fristenspiegels — der Ereignis-Block lebt auf dieser Seite.
      'Fristenspiegel', 'parallele Fristen', 'Urteil erhalten', 'Fristenkontrolle',
      'Art. 311 ZPO', 'Art. 314 ZPO', 'Art. 321 ZPO', 'Art. 209 ZPO', 'Art. 145 ZPO', 'Art. 148 ZPO'],
    icon: 'clock',
  },
  'schkg-fristen': {
    id: 'schkg-fristen', modus: 'rechner', art: 'frist', rechtsgebiet: 'Betreibung & Konkurs (SchKG)',
    rechtsbereich: 'privat',
    title: 'Betreibungs- & Konkursfristen',
    // M7: Kurzform für den Reiter (§5a Ziff. 2) — aus dem eigenen
    // Routen-Slug und dem Kürzel des massgeblichen Erlasses, nicht geraten.
    kurz: 'SchKG-Fristen',
    szenarien: [
      { label: 'Einleitung bis Konkurs (Verfahrensphasen)', status: 'entwurf' },
      { label: 'Rechtsöffnung, Aberkennung, Kollokation', status: 'entwurf' },
      { label: 'Arrest – Prosequierung', status: 'entwurf' },
    ],
    description: 'Fristen im Betreibungs- und Konkursverfahren mit Betreibungsferien (Art. 63 SchKG) und ZPO-Stillstand für gerichtliche Klagen.',
    status: 'entwurf',
    norms: [
      // Art. 56 SchKG – Rechtsstillstand
      { label: 'Art. 56 SchKG', url: fedlexUrl('SchKG', '56'), verified: false },
      // Art. 63 SchKG – Betreibungsferien
      { label: 'Art. 63 SchKG', url: fedlexUrl('SchKG', '63'), verified: false },
      // Art. 145 ZPO – Stillstand (Querverweis: ZPO-Basis, nicht SchKG)
      { label: 'Art. 145 ZPO', url: fedlexUrl('ZPO', '145'), verified: false },
    ],
    href: '/rechner/schkg-fristen',
    // Norm-/Phasen-Keywords gemäss schkgPresets.ts (Art. 88/116/166:
    // Fortsetzung, Verwertung, Konkursandrohung) — verifiziert 6.6.2026.
    keywords: ['Betreibung', 'Zahlungsbefehl', 'Rechtsvorschlag', 'Konkurs', 'Pfändung', 'Betreibungsferien',
      'betreiben', 'Schulden', 'Fortsetzungsbegehren', 'Verwertungsbegehren', 'Konkursandrohung', 'Rechtsstillstand',
      // S-5c (Bug-Check §9, NIEDRIG): Begriff des aufgelösten Fristenspiegels
      'Zahlungsbefehl erhalten',
      'Art. 88 SchKG', 'Art. 116 SchKG', 'Art. 166 SchKG'],
    related: ['verzugszins', 'rechtsoeffnungsbegehren', 'tagerechner'],
    icon: 'clipboard',
  },
  betreibungskosten: {
    id: 'betreibungskosten', modus: 'rechner', art: 'betrag', rechtsgebiet: 'Betreibung & Konkurs (SchKG)',
    rechtsbereich: 'privat',
    title: 'Betreibungskosten (GebV SchKG)',
    description: 'Amtliche Gebühren je Betreibungsschritt nach der bundesrechtlich abschliessenden GebV SchKG (Stand 1.1.2026, Tarif Wert für Wert an der amtlichen Fassung verifiziert, fachlich nicht abgenommen): Zahlungsbefehl mit Ausfertigungen und Zustellversuchen, Pfändung (auch fruchtlos), Verwertung mit Erlös-Kappung, Einzahlung/Überweisung – als Beträge; gerichtliche Entscheidgebühren (z. B. Rechtsöffnung, Art. 48) ehrlich als Rahmen. Auslagen und die Überwälzung auf den Schuldner (Art. 68 SchKG) als Hinweis.',
    status: 'entwurf',
    norms: [
      { label: 'Art. 16 GebV SchKG', url: fedlexUrl('GebVSchKG', '16'), verified: false },
      { label: 'Art. 20 GebV SchKG', url: fedlexUrl('GebVSchKG', '20'), verified: false },
      { label: 'Art. 30 GebV SchKG', url: fedlexUrl('GebVSchKG', '30'), verified: false },
      { label: 'Art. 48 GebV SchKG', url: fedlexUrl('GebVSchKG', '48'), verified: false },
      { label: 'Art. 68 SchKG', url: fedlexUrl('SchKG', '68'), verified: false },
    ],
    href: '/rechner/betreibungskosten',
    related: ['schkg-fristen', 'zustaendigkeit', 'verzugszins'],
    keywords: ['Betreibungskosten', 'Gebühren', 'GebV', 'Zahlungsbefehl', 'Kosten Betreibung', 'Pfändungskosten', 'Rechtsöffnungsgebühr', 'Was kostet eine Betreibung', 'Art. 16', 'Art. 68'],
    icon: 'percent',
  },
  'kuendigung-sperrfristen': {
    id: 'kuendigung-sperrfristen', modus: 'rechner', art: 'frist', rechtsgebiet: 'Arbeit',
    rechtsbereich: 'privat',
    title: 'Kündigung & Fristen im Arbeitsverhältnis',
    // Themen-Einstieg (Konsolidierung 7.6.2026, E3): die beiden Schreiben-
    // Masken (AN/AG) haben keine eigenen Katalog-Karten mehr (imKatalog:false)
    // — diese Karte trägt ihre Auffindbarkeit, die Rechner-Seite verlinkt sie.
    szenarien: [
      { label: 'Kündigungs- & Sperrfristen (Art. 335c/336c OR)', status: 'entwurf' },
      { label: 'Kündigungsschreiben Arbeitnehmer:in (Vorlage)', status: 'entwurf' },
      { label: 'Kündigungsschreiben Arbeitgeber:in mit Sperrfristen-Gate (Vorlage)', status: 'entwurf' },
      { label: 'Anfechtung missbräuchlicher Kündigung', status: 'geplant' },
      { label: 'Massenentlassung – Konsultationsfristen', status: 'geplant' },
    ],
    description: 'Ordentliche Kündigungsfristen und Sperrfristen (Kündigung zur Unzeit) im Arbeitsverhältnis – mit Direkteinstieg zu den Kündigungsschreiben (Arbeitnehmer:in/Arbeitgeber:in).',
    status: 'entwurf',
    norms: [
      // Art. 335c OR – ordentliche Kündigungsfristen
      { label: 'Art. 335c OR', url: fedlexUrl('OR', '335c'), verified: false },
      // Art. 336c OR – Kündigung zur Unzeit (Sperrfristen)
      { label: 'Art. 336c OR', url: fedlexUrl('OR', '336c'), verified: false },
    ],
    href: '/rechner/kuendigung#kuendigung',
    // 'Art. 336c' auch als KEYWORD (nicht nur Norm-Pill): Rang-Parität mit
    // der Vorlage kuendigung-arbeitgeber — bei Gleichstand steht der RECHNER
    // zuoberst (Katalogposition; Logik-Check-Befund 6.6.2026).
    keywords: ['gekündigt', 'Kündigung', 'Kündigungsfrist', 'Probezeit', 'Sperrfrist', 'Krankheit', 'Unfall', 'Schwangerschaft', 'Militär',
      'Kündigung erhalten', 'Art. 336c', 'Art. 335c',
      // Schreiben-Masken (übernommen, E3)
      'Kündigungsschreiben', 'Beendigungsdatum', 'Freistellung', 'kündigen'],
    related: ['lohnfortzahlung', 'arbeitsvertrag'],
    icon: 'document',
  },
  mietrecht: {
    id: 'mietrecht', modus: 'rechner', art: 'frist', rechtsgebiet: 'Miete',
    rechtsbereich: 'privat',
    title: 'Kündigung & Fristen im Mietverhältnis',
    // Themen-Einstieg (Konsolidierung 7.6.2026, E3): Mieter-Schreiben und
    // Vermieter-Checkliste ohne eigene Katalog-Karten (imKatalog:false) —
    // diese Karte trägt ihre Auffindbarkeit, die Rechner-Seite verlinkt sie.
    szenarien: [
      { label: 'Kündigung, Termine & Zahlungsverzug', status: 'entwurf' },
      { label: 'Kündigungsschreiben Mieter:in (Vorlage)', status: 'entwurf' },
      { label: 'Vermieter-Kündigung: Checkliste amtliches Formular', status: 'entwurf' },
      // R5-07 (RL-12, 24.9.2026): war «geplant», obwohl gebaut — mietrecht.ts
      // abschluss() rechnet anfechtungBis/erstreckungBis (Art. 273/272a OR),
      // MietrechtForm zeigt «Anfechtung/Erstreckung bis» bei Vermieter-
      // Kündigung (Tests mietrecht.test.ts «Anfechtung und Erstreckung»).
      // Offenlegung des Baustands (§8), KEINE Abnahme (§7).
      { label: 'Anfechtung & Erstreckung', status: 'entwurf' },
    ],
    description: 'Kündigungstermine und -fristen für Wohn- und Geschäftsräume – mit Termin-Hierarchie, Formprüfung und ausserordentlichen Kündigungen; Direkteinstieg zum Kündigungsschreiben (Mieter:in) und zur Vermieter-Checkliste (amtliches Formular).',
    status: 'entwurf',
    norms: [
      // Art. 266a–o OR – Kündigungstermine/-fristen (Spanne: Anker auf führenden Artikel)
      { label: 'Art. 266a–o OR', url: fedlexUrl('OR', '266a'), verified: false },
      // Art. 257d OR – Zahlungsrückstand
      { label: 'Art. 257d OR', url: fedlexUrl('OR', '257d'), verified: false },
      // Art. 257f OR – Sorgfaltspflichtverletzung
      { label: 'Art. 257f OR', url: fedlexUrl('OR', '257f'), verified: false },
    ],
    href: '/rechner/mietrecht',
    // 'Zahlungsrückstand' = Art. 257d OR (Norm-Pill der Karte) — Laien-Synonym
    keywords: ['Mietwohnung', 'Wohnung kündigen', 'Kündigungsfrist', 'Kündigungstermin', 'Vermieter', 'Mieter', 'Geschäftsraum',
      'Zahlungsrückstand', 'Kündigung erhalten',
      // Schreiben-Maske + Vermieter-Checkliste (übernommen, E3)
      'Kündigungsschreiben', 'Familienwohnung', 'Nachmieter', 'ausziehen', 'Auszug',
      'amtliches Formular', 'Anfechtung', 'Erstreckung', 'Art. 266l', 'Art. 271'],
    related: ['mietvertrag-wohnen'],
    icon: 'house',
  },

  // ════ I – Fristen (in Vorbereitung) ════
  'beschwerde-verwaltung': {
    id: 'beschwerde-verwaltung', modus: 'rechner', art: 'frist', rechtsgebiet: 'Verwaltungsrecht',
    rechtsbereich: 'oeffentlich',
    title: 'Verwaltungs- & Steuerverfahren – Fristen',
    description: 'Einsprache- und Beschwerdefristen im Verwaltungs- und Steuerverfahren – nicht eidgenössisch vereinheitlicht; kantonale Vielfalt wird gekennzeichnet.',
    status: 'geplant', norms: [],
  },
  sozialversicherung: {
    id: 'sozialversicherung', modus: 'rechner', art: 'frist', rechtsgebiet: 'Sozialversicherungsrecht',
    rechtsbereich: 'oeffentlich',
    title: 'Sozialversicherung (ATSG) – Fristen',
    description: 'Einsprache- und Beschwerdefristen sowie Leistungsverwirkung und Nachzahlung – IV, AHV, Unfall- und Krankenversicherung.',
    status: 'geplant', norms: [],
  },
  verjaehrung: {
    id: 'verjaehrung', modus: 'rechner', art: 'frist', rechtsgebiet: 'Vertrag & Forderung (OR)',
    rechtsbereich: 'privat',
    title: 'Verjährung',
    description: 'Ordentliche und kurze Verjährung sowie deliktische und bereicherungsrechtliche Ansprüche – mit Stillstand, Unterbrechung und Einredeverzicht.',
    status: 'entwurf',
    norms: [
      // Art. 60 OR – unerlaubte Handlung (3/10 bzw. 3/20 Jahre)
      { label: 'Art. 60 OR', url: fedlexUrl('OR', '60'), verified: false },
      // Art. 67 OR – ungerechtfertigte Bereicherung (3/10 Jahre)
      { label: 'Art. 67 OR', url: fedlexUrl('OR', '67'), verified: false },
      // Art. 127–142 OR – Verjährungsordnung (Spanne: Anker auf führenden Artikel)
      { label: 'Art. 127–142 OR', url: fedlexUrl('OR', '127'), verified: false },
    ],
    href: '/rechner/verjaehrung',
    keywords: ['Verjährung', 'verjährt', 'Frist', 'Forderung', 'unerlaubte Handlung', 'Bereicherung', 'Unterbrechung', 'Verzicht', 'Einrede',
      'Art. 127 OR', 'Art. 128 OR'],
    related: ['verzugszins', 'rechtsoeffnungsbegehren', 'verjaehrungsverzicht'],
    icon: 'clock',
  },
  gewaehrleistung: {
    id: 'gewaehrleistung', modus: 'rechner', art: 'frist', rechtsgebiet: 'Vertrag & Forderung (OR)',
    rechtsbereich: 'privat',
    title: 'Gewährleistung & Mängelrüge',
    description: 'Rüge- und Verjährungsfristen bei Kauf, Werkvertrag und Grundstückkauf – mit Zwei-Regime-Weiche zur Baumängel-Revision 2026.',
    status: 'entwurf',
    norms: [
      // Art. 201 OR – Prüf-/Rügeobliegenheit (inkl. Abs. 4 neu)
      { label: 'Art. 201 OR', url: fedlexUrl('OR', '201'), verified: false },
      // Art. 210 OR – Verjährung Kauf
      { label: 'Art. 210 OR', url: fedlexUrl('OR', '210'), verified: false },
      // Art. 219a OR – Grundstückkauf (neu, in Kraft 1.1.2026)
      { label: 'Art. 219a OR', url: fedlexUrl('OR', '219a'), verified: false },
      // Art. 367 OR – Prüfung/Rüge Werkvertrag (inkl. Abs. 1bis neu)
      { label: 'Art. 367 OR', url: fedlexUrl('OR', '367'), verified: false },
      // Art. 371 OR – Verjährung Werkvertrag (inkl. Abs. 3 neu)
      { label: 'Art. 371 OR', url: fedlexUrl('OR', '371'), verified: false },
    ],
    href: '/rechner/gewaehrleistung',
    keywords: ['Mangel', 'Mängelrüge', 'Garantie', 'Gewährleistung', 'Kauf', 'Werkvertrag', 'Baumängel', 'Rüge', 'Abnahme', 'SIA'],
    related: ['verjaehrung', 'kaufvertrag'],
    icon: 'house',
  },
  // Verjährungs-/Gewährleistungs-Board (Verzahnungs-Klinge, ROADMAP W2·7):
  // Regime-Matrix (verjaehrung.ts) + Gewährleistungs-Sonderfall + AT-Brücke;
  // CISG nur Link. Reine Darstellung auf bestehenden Engines.
  'verjaehrung-board': {
    id: 'verjaehrung-board', modus: 'rechner', art: 'frist', rechtsgebiet: 'Vertrag & Forderung (OR)',
    rechtsbereich: 'privat',
    title: 'Verjährungs- & Gewährleistungs-Board',
    description: 'Die sechs Verjährungs-Regime auf einen Blick, der Gewährleistungs-Sonderfall (Rüge- und Verjährungsfristen bei Kauf/Werkvertrag) und die Brücke zur AT-Mechanik – internationaler Warenkauf (CISG) verlinkt.',
    status: 'entwurf',
    norms: [
      { label: 'Art. 127 OR', url: fedlexUrl('OR', '127'), verified: false },
      { label: 'Art. 128 OR', url: fedlexUrl('OR', '128'), verified: false },
      { label: 'Art. 210 OR', url: fedlexUrl('OR', '210'), verified: false },
      { label: 'Art. 371 OR', url: fedlexUrl('OR', '371'), verified: false },
    ],
    href: '/rechner/verjaehrung-board',
    keywords: ['Verjährung', 'Gewährleistung', 'Board', 'Regime', 'Frist', 'Mängelrüge', 'CISG', 'Verwirkung'],
    related: ['verjaehrung', 'gewaehrleistung'],
    icon: 'clock',
  },
  'erbrecht-fristen': {
    id: 'erbrecht-fristen', modus: 'rechner', art: 'frist', rechtsgebiet: 'Erbrecht',
    rechtsbereich: 'privat',
    title: 'Erbrecht – Fristen',
    description: 'Ausschlagung, öffentliches Inventar sowie Ungültigkeits-, Herabsetzungs- und Erbschaftsklage – 15 Tatbestände mit dem gesetzlichen Fristbeginn je Tatbestand (Art. 521/533/567 ff. ZGB).',
    // Quick-Win 1 (bibliothek/recherche/erbrecht-ausbau.md), gebaut 6.6.2026;
    // Engine src/lib/erbFristen.ts, Normen am ZGB-Cache verifiziert.
    status: 'entwurf',
    norms: [
      { label: 'Art. 567 ZGB', url: fedlexUrl('ZGB', '567'), verified: false },
      { label: 'Art. 580 ZGB', url: fedlexUrl('ZGB', '580'), verified: false },
      { label: 'Art. 521 ZGB', url: fedlexUrl('ZGB', '521'), verified: false },
      { label: 'Art. 533 ZGB', url: fedlexUrl('ZGB', '533'), verified: false },
      { label: 'Art. 600 ZGB', url: fedlexUrl('ZGB', '600'), verified: false },
    ],
    href: '/rechner/erb-fristen',
    keywords: ['Ausschlagung', 'Erbschaft ausschlagen', 'öffentliches Inventar', 'Herabsetzung', 'Ungültigkeitsklage', 'Erbschaftsklage', 'Vermächtnis', 'Pflichtteil', 'Frist'],
    related: ['erbteilung', 'eigenhaendiges-testament'],
    icon: 'clock',
  },
  'familie-fristen': {
    id: 'familie-fristen', modus: 'rechner', art: 'frist', rechtsgebiet: 'Familienrecht',
    rechtsbereich: 'privat',
    title: 'Familienrechtliche Fristen',
    description: 'Fristen bei Scheidung und Anfechtung des Kindesverhältnisses.',
    status: 'geplant', norms: [],
  },
  'gesellschaftsrecht-fristen': {
    id: 'gesellschaftsrecht-fristen', modus: 'rechner', art: 'frist', rechtsgebiet: 'Gesellschaftsrecht',
    rechtsbereich: 'privat',
    title: 'Gesellschaftsrechtliche Fristen',
    description: 'Einberufungs- und Traktandierungsfristen sowie Verjährung der Verantwortlichkeitsklage.',
    status: 'geplant', norms: [],
  },
  'bgg-fristen': {
    id: 'bgg-fristen', modus: 'rechner', art: 'frist', rechtsgebiet: 'Zivilprozess (ZPO) & Bundesgericht',
    rechtsbereich: 'uebergreifend',
    title: 'Beschwerde ans Bundesgericht (BGG)',
    // M7: Kurzform für den Reiter (§5a Ziff. 2) — aus dem eigenen
    // Routen-Slug und dem Kürzel des massgeblichen Erlasses, nicht geraten.
    kurz: 'BGG-Beschwerde', // Gegenprüfung 6.9.2026: «BGG-Fristen» verengte Art. 74/113 BGG + Art. 33 BGerR
    description: 'Weiterzug ans Bundesgericht für alle vier Beschwerdewege: Zulässigkeit (Streitwertgrenzen mit Ausnahmen), Frist 30/10/5/3 Tage mit Stillstand und konkretem Fristende, zuständige Abteilung – inkl. subsidiärer Verfassungsbeschwerde.',
    status: 'entwurf',
    norms: [
      // Art. 74 BGG – Streitwertgrenzen + Ausnahmen (Wortlaut verifiziert 11.6.2026)
      { label: 'Art. 74 BGG', url: fedlexUrl('BGG', '74'), verified: false },
      // Art. 100 BGG – Beschwerdefristen inkl. Sonderfristen (Wortlaut verifiziert 11.6.2026)
      { label: 'Art. 100 BGG', url: fedlexUrl('BGG', '100'), verified: false },
      // Art. 46 BGG – Fristenstillstand + Ausnahmen (Wortlaut verifiziert 11.6.2026)
      { label: 'Art. 46 BGG', url: fedlexUrl('BGG', '46'), verified: false },
      // Art. 113 BGG – subsidiäre Verfassungsbeschwerde (Wortlaut verifiziert 11.6.2026)
      { label: 'Art. 113 BGG', url: fedlexUrl('BGG', '113'), verified: false },
      // Art. 33 BGerR – Abteilungs-Zuteilung (zeichengenau verifiziert 7.6./11.6.2026)
      { label: 'Art. 33 BGerR', url: fedlexUrl('BGerR', '33'), verified: false },
    ],
    href: '/rechner/bgg-fristen',
    related: ['zustaendigkeit', 'streitwert', 'tagerechner', 'schkg-fristen'],
    keywords: ['Bundesgericht', 'BGer', 'Beschwerde', 'BGG', 'Streitwertgrenze', 'Verfassungsbeschwerde', 'Rechtsöffnung', 'Abteilung', 'Frist 30 Tage'],
  },
  'straf-verjaehrung': {
    id: 'straf-verjaehrung', modus: 'rechner', art: 'frist', rechtsgebiet: 'Strafrecht & Strafprozess',
    rechtsbereich: 'straf',
    title: 'Strafrechtliche Verjährung',
    description: 'Verfolgungs- und Vollstreckungsverjährung nach Strafrahmen.',
    status: 'geplant', norms: [],
  },
};
