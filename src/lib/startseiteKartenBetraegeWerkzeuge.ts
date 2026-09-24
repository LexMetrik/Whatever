// ─── Rechner-Karten (RechnerCard) — Teilmodul Rubriken II–IV (Beträge & Quoten · Zuständigkeit · Werkzeuge) ───
//
// H-10 (§6.6, B26): aus dem Katalog-Modul entlang der vorhandenen
// Rubrik-Blöcke ausgelagert — Einträge byte-identisch verschoben, im
// Stamm-Modul per Spread in Original-Key-Reihenfolge zusammengeführt.
import { fedlexUrl } from './fedlex';
import type { CalculatorCard } from './startseiteConfigTypen';

export const KARTEN_BETRAEGE_WERKZEUGE: Record<string, CalculatorCard> = {
  // ════ II – Beträge & Quoten (geprüft) ════
  verzugszins: {
    id: 'verzugszins', modus: 'rechner', art: 'betrag', rechtsgebiet: 'Vertrag & Forderung (OR)',
    rechtsbereich: 'privat',
    title: 'Verzugszins',
    description: 'Verzugszins bei Schuldnerverzug – Zeitraum, Satz und Betrag.',
    status: 'entwurf',
    norms: [
      // Art. 104 OR – Verzugszins
      { label: 'Art. 104 OR', url: fedlexUrl('OR', '104'), verified: false },
    ],
    href: '/rechner/verzugszins',
    keywords: ['Rechnung', 'Verzug', 'Zins', 'Mahnung', 'offene Forderung', '5 Prozent'],
    related: ['schkg-fristen', 'darlehensvertrag', 'mahnung'],
    icon: 'percent',
  },
  // Forderungs-/Inkasso-Strecke (Verzahnungs-Klinge, ROADMAP W2·7): stateless
  // Reverse-Reader Verzug → Verzugszins → Mahnung → Betreibung → Fristen.
  'inkasso-strecke': {
    id: 'inkasso-strecke', modus: 'rechner', art: 'betrag', rechtsgebiet: 'Vertrag & Forderung (OR)',
    rechtsbereich: 'privat',
    title: 'Forderungs- & Inkasso-Strecke',
    description: 'Die Schritte der Geldforderungs-Durchsetzung als stateless Strecke: Verzug (Art. 102 OR), Verzugszins (Art. 104 OR), Mahnung, Betreibung und Fristen – jeder Schritt mit dem zuständigen Werkzeug.',
    status: 'entwurf',
    norms: [
      { label: 'Art. 102 OR', url: fedlexUrl('OR', '102'), verified: false },
      { label: 'Art. 104 OR', url: fedlexUrl('OR', '104'), verified: false },
      { label: 'Art. 67 SchKG', url: fedlexUrl('SchKG', '67'), verified: false },
    ],
    href: '/rechner/inkasso-strecke',
    keywords: ['Inkasso', 'Forderung', 'Verzug', 'Verzugszins', 'Mahnung', 'Betreibung', 'Strecke', 'Durchsetzung'],
    related: ['verzugszins', 'mahnung', 'betreibungskosten'],
    icon: 'clipboard',
  },
  lohnfortzahlung: {
    id: 'lohnfortzahlung', modus: 'rechner', art: 'betrag', rechtsgebiet: 'Arbeit',
    rechtsbereich: 'privat',
    title: 'Lohnfortzahlung (kantonale Skala)',
    description: 'Lohnfortzahlung bei unverschuldeter Verhinderung nach kantonaler Skala (Basel/Bern/Zürich).',
    status: 'entwurf',
    norms: [
      // Art. 324a OR – Lohnfortzahlung bei Verhinderung
      { label: 'Art. 324a OR', url: fedlexUrl('OR', '324a'), verified: false },
    ],
    href: '/rechner/kuendigung#lohnfortzahlung',
    keywords: ['krank', 'Lohnfortzahlung', 'Arztzeugnis', 'Arbeitsunfähigkeit', 'Taggeld', 'Skala'],
    related: ['kuendigung-sperrfristen', 'arbeitsvertrag'],
    icon: 'document',
  },
  erbteilung: {
    id: 'erbteilung', modus: 'rechner', art: 'betrag', rechtsgebiet: 'Erbrecht',
    rechtsbereich: 'privat',
    title: 'Pflichtteil & verfügbare Quote',
    description: 'Gesetzliche Erbteile, Pflichtteile und verfügbare Quote – mit Todesdatum-Weiche für die Revision 2023 und güterrechtlicher Vorstufe.',
    status: 'entwurf',
    norms: [
      // Art. 457 ff. ZGB – gesetzliche Erben (Folgeverweis: Anker auf führenden Artikel)
      { label: 'Art. 457 ff. ZGB', url: fedlexUrl('ZGB', '457'), verified: false },
      // Art. 470 f. ZGB – verfügbare Quote / Pflichtteil
      { label: 'Art. 470 f. ZGB', url: fedlexUrl('ZGB', '470'), verified: false },
    ],
    href: '/rechner/erbteilung',
    keywords: ['Erbe', 'Pflichtteil', 'Testament', 'Erbteilung', 'verfügbare Quote', 'Todesfall', 'Ehegatte'],
    related: ['eigenhaendiges-testament', 'erbvertrag'],
    icon: 'scale',
  },

  // ════ II – Beträge & Quoten (in Vorbereitung) ════
  prozesskosten: {
    id: 'prozesskosten', modus: 'rechner', art: 'betrag', rechtsgebiet: 'Zivilprozess (ZPO) & Bundesgericht',
    rechtsbereich: 'privat',
    title: 'Prozesskosten (Gerichts- & Parteikosten)',
    description: 'Gerichtskosten (Entscheidgebühr) und Parteientschädigung im erstinstanzlichen Zivilprozess nach Streitwert – Tarife aller 26 Kantone mit amtlicher Quelle, doppelt verifiziert (drei Parteientschädigungs-Tarife erst recherchiert), nicht abgenommen; mit interkantonaler Vergleichstabelle. Kostenlose Verfahren (Art. 113/114 ZPO) und Schlichtung/Entscheid berücksichtigt; Ermessenstarife als Spanne.',
    status: 'entwurf',
    norms: [
      { label: 'Art. 95 ZPO', url: fedlexUrl('ZPO', '95'), verified: false },
      { label: 'Art. 96 ZPO', url: fedlexUrl('ZPO', '96'), verified: false },
      { label: 'Art. 98 ZPO', url: fedlexUrl('ZPO', '98'), verified: false },
      { label: 'Art. 113 ZPO', url: fedlexUrl('ZPO', '113'), verified: false },
      { label: 'Art. 114 ZPO', url: fedlexUrl('ZPO', '114'), verified: false },
    ],
    href: '/rechner/prozesskosten',
    related: ['streitwert', 'zustaendigkeit', 'betreibungskosten', 'bgg-fristen', 'klage-vereinfacht', 'klage-ordentlich'],
    keywords: ['Prozesskosten', 'Gerichtskosten', 'Gerichtsgebühr', 'Parteientschädigung', 'Anwaltskosten', 'Was kostet ein Prozess', 'Kostenrisiko', 'Entscheidgebühr', 'Honorar', 'kantonaler Tarif', 'Streitwert'],
    icon: 'percent',
  },
  'notariat-grundbuch': {
    id: 'notariat-grundbuch', modus: 'rechner', art: 'betrag', rechtsgebiet: 'Immobilien & Beurkundung',
    rechtsbereich: 'privat',
    title: 'Notariats- & Grundbuchkosten',
    description: 'Beurkundungs- und Grundbuchkosten aller 26 Kantone in drei Bereichen: Grundstückkauf (Beurkundung + Grundbuch + Grundpfand + Handänderungssteuer), Beurkundung (Notariat) je Geschäftsart (Testament, Erbvertrag, Ehevertrag, Schenkung, Vorsorgeauftrag, Vollmacht, Gründungen AG/GmbH, Stiftung, Bürgschaft, Dienstbarkeiten u. a.) und Grundbuch je Eintragungsart (Grundpfand, Dienstbarkeit, Vormerkung, Mutation u. a.) – kantonale Tarife mit amtlicher Quelle, interkantonaler Vergleich. Rahmen-/Aufwandtarife (freies Notariat) ehrlich als Spanne. Doppelt verifiziert, nicht abgenommen.',
    status: 'entwurf',
    norms: [
      { label: 'Art. 216 OR', url: fedlexUrl('OR', '216'), verified: false },
      { label: 'Art. 499 ZGB', url: fedlexUrl('ZGB', '499'), verified: false },
      { label: 'Art. 629 OR', url: fedlexUrl('OR', '629'), verified: false },
    ],
    href: '/rechner/notariat-grundbuch',
    related: ['prozesskosten', 'betreibungskosten'],
    keywords: ['Notariatskosten', 'Beurkundung', 'Beurkundungsgebühr', 'Grundbuchgebühr', 'Handänderungssteuer', 'Grundstückkauf', 'Liegenschaftskauf', 'Testament', 'Erbvertrag', 'Ehevertrag', 'Schenkung', 'AG-Gründung', 'GmbH-Gründung', 'Stiftung', 'Bürgschaft', 'Vorsorgeauftrag', 'Dienstbarkeit', 'Schuldbrief', 'Notar', 'Grundpfand', 'Vormerkung', 'Eigentumsübertragung'],
    icon: 'percent',
  },
  streitwert: {
    id: 'streitwert', modus: 'rechner', art: 'betrag', rechtsgebiet: 'Zivilprozess (ZPO) & Bundesgericht',
    rechtsbereich: 'privat',
    title: 'Streitwert (ZPO)',
    description: 'Streitwert aus den Rechtsbegehren nach Art. 91–94a ZPO: Kapitalisierung wiederkehrender Leistungen (× 20, Leibrenten-Barwert als Weiche), Klagenhäufung mit Ausschliesslichkeits-Schalter, Widerklage mit getrennter Kosten-Bemessungsgrundlage und Teilklage-Sonderregel (Revision 2025). Ermessens-Konstellationen (nicht beziffert, Verbandsklage) werden offengelegt, nie geschätzt.',
    status: 'entwurf',
    norms: [
      { label: 'Art. 91 ZPO', url: fedlexUrl('ZPO', '91'), verified: false },
      { label: 'Art. 92 ZPO', url: fedlexUrl('ZPO', '92'), verified: false },
      { label: 'Art. 93 ZPO', url: fedlexUrl('ZPO', '93'), verified: false },
      { label: 'Art. 94 ZPO', url: fedlexUrl('ZPO', '94'), verified: false },
    ],
    href: '/rechner/streitwert',
    related: ['zustaendigkeit', 'zpo-fristen', 'kostenvorschuss', 'klage-vereinfacht', 'klage-ordentlich', 'prozesskosten'],
    keywords: ['Streitwert', 'Rechtsbegehren', 'Kapitalisierung', 'Widerklage', 'Teilklage', 'Klagenhäufung', 'wiederkehrende Leistung', 'Art. 92', 'Verbandsklage'],
  },
  'arbeit-entschaedigung': {
    id: 'arbeit-entschaedigung', modus: 'rechner', art: 'betrag', rechtsgebiet: 'Arbeit',
    rechtsbereich: 'privat',
    title: 'Arbeitsrechtliche Entschädigungen & Zuschläge',
    description: 'Überstunden, Ferienlohn, 13. Monatslohn pro rata sowie Entschädigung bei missbräuchlicher oder fristloser Kündigung.',
    status: 'geplant', norms: [],
  },
  'erb-ausgleichung': {
    id: 'erb-ausgleichung', modus: 'rechner', art: 'betrag', rechtsgebiet: 'Erbrecht',
    rechtsbereich: 'privat',
    title: 'Erbrechtliche Ausgleichung & Güterrecht',
    description: 'Ausgleichung und Hinzurechnung sowie güterrechtliche Auseinandersetzung als Vorstufe.',
    status: 'geplant', norms: [],
  },
  mietzinsanpassung: {
    id: 'mietzinsanpassung', modus: 'rechner', art: 'betrag', rechtsgebiet: 'Miete',
    rechtsbereich: 'privat',
    title: 'Mietzinsanpassung (Referenzzinssatz)',
    description: 'Anpassung des Mietzinses nach Referenzzinssatz, Teuerung und Kostensteigerung.',
    status: 'geplant', norms: [],
  },
  vorsorgeausgleich: {
    id: 'vorsorgeausgleich', modus: 'rechner', art: 'betrag', rechtsgebiet: 'Familienrecht',
    rechtsbereich: 'privat',
    title: 'Vorsorgeausgleich (BVG) bei Scheidung',
    description: 'Teilung der während der Ehe geäufneten Austrittsleistungen der beruflichen Vorsorge.',
    status: 'geplant', norms: [],
  },
  existenzminimum: {
    id: 'existenzminimum', modus: 'rechner', art: 'betrag', rechtsgebiet: 'Betreibung & Konkurs (SchKG)',
    rechtsbereich: 'privat',
    title: 'Existenzminimum & Pfändungsquote',
    description: 'Ermittlung des pfändbaren Betrags; Richtlinien- und kantonsabhängig.',
    status: 'geplant', norms: [],
  },

  // ════ III – Zuständigkeit & Einordnung ════
  // EINE Zuständigkeits-Karte statt der drei Einzelkarten gerichtsstand/
  // verfahrensart/schlichtung (Konsolidierung 5.6.2026): die Engine
  // beantwortet alle drei Fragen in einem Durchlauf (ZUSTAENDIGKEIT-AUFTRAG.md).
  // S-3 STRUKTUR-UMBAU (Auftrag David 10.6.2026 abends): Die Zuständigkeit
  // ist wieder VIERTEILIG sichtbar — Zivilprozess · Vollstreckung ·
  // Strafverfahren · Verwaltungsverfahren erhalten je ein eigenes Feld in
  // der Kategorie-Ansicht (übersteuert die E2-Konsolidierung vom 7.6. für
  // diese Kategorie). Dieselbe Rechner-Seite trägt weiterhin die Weiche
  // (#schkg/#straf); Verwaltungsverfahren ist ehrlich «geplant» (keine
  // Engine). Reihenfolge: lib/zustaendigkeitKategorie.ts.
  zustaendigkeit: {
    id: 'zustaendigkeit', modus: 'rechner', art: 'zuordnung', rechtsgebiet: 'Zivilprozess (ZPO) & Bundesgericht',
    rechtsbereich: 'privat',
    title: 'Zuständigkeit Zivilprozess',
    szenarien: [
      { label: 'Einleitung: Verfahrensart · Schlichtung · Gerichtsstand', status: 'entwurf' },
      { label: 'Rechtsmittel: Berufung/Beschwerde mit Fristen', status: 'entwurf' },
    ],
    description: 'Welches Gericht und welches Verfahren im Zivilprozess: Verfahrensart, Schlichtungspflicht und -behörde, örtlicher Gerichtsstand nach ZPO sowie die Rechtsmittel-Strecke (Berufung/Beschwerde samt Fristen); konkrete Stelle mit Adresse für erfasste Kantone.',
    status: 'entwurf',
    norms: [
      // Schlichtung: Grundsatz, Verzicht, paritätische Behörden
      { label: 'Art. 197 ZPO', url: fedlexUrl('ZPO', '197'), verified: false },
      { label: 'Art. 199 ZPO', url: fedlexUrl('ZPO', '199'), verified: false },
      { label: 'Art. 200 ZPO', url: fedlexUrl('ZPO', '200'), verified: false },
      // Entscheidvorschlag (Revision 2025: bis CHF 10'000)
      { label: 'Art. 210 ZPO', url: fedlexUrl('ZPO', '210'), verified: false },
      // Verfahrensart
      { label: 'Art. 243 ZPO', url: fedlexUrl('ZPO', '243'), verified: false },
    ],
    href: '/rechner/zustaendigkeit',
    keywords: ['Zuständigkeit', 'Gerichtsstand', 'Verfahrensart', 'Schlichtung', 'Schlichtungsbehörde', 'Streitwert', 'Handelsgericht',
      'Urteil', 'Urteil erhalten', 'Entscheid', 'Rechtsmittel', 'Berufung', 'Beschwerde', 'Scheidung',
      'Gerichtskosten', 'örtliche Zuständigkeit', 'sachliche Zuständigkeit'],
    related: ['zpo-fristen', 'schlichtungsgesuch', 'schkg-zustaendigkeit', 'straf-zustaendigkeit'],
    icon: 'scale',
  },
  'schkg-zustaendigkeit': {
    id: 'schkg-zustaendigkeit', modus: 'rechner', art: 'zuordnung', rechtsgebiet: 'Betreibung & Konkurs (SchKG)',
    rechtsbereich: 'privat',
    title: 'Zuständigkeit Vollstreckung (SchKG)',
    description: 'Betreibungsort (Art. 46–55 SchKG), zuständige Stelle (Betreibungsamt, Gericht oder Aufsichtsbehörde) und Fristen je Anliegen – von der Einleitung der Betreibung bis zur Beschwerde gegen das Amt; konkrete Amtsadresse für erfasste Kantone.',
    status: 'entwurf',
    norms: [
      { label: 'Art. 46 SchKG', url: fedlexUrl('SchKG', '46'), verified: false },
      { label: 'Art. 84 SchKG', url: fedlexUrl('SchKG', '84'), verified: false },
      { label: 'Art. 17 SchKG', url: fedlexUrl('SchKG', '17'), verified: false },
    ],
    href: '/rechner/zustaendigkeit#schkg',
    keywords: ['Zuständigkeit', 'Vollstreckung', 'Betreibungsort', 'Betreibungsamt', 'Rechtsöffnung', 'Arrest', 'Aufsichtsbeschwerde', 'Konkursgericht',
      'betreiben', 'Betreibung einleiten', 'Schuldner', 'Wohnsitz'],
    related: ['schkg-fristen', 'betreibungskosten', 'zustaendigkeit'],
    icon: 'scale',
  },
  'straf-zustaendigkeit': {
    id: 'straf-zustaendigkeit', modus: 'rechner', art: 'zuordnung', rechtsgebiet: 'Strafrecht & Strafprozess',
    rechtsbereich: 'straf',
    title: 'Zuständigkeit Strafverfahren',
    description: 'Örtlicher Gerichtsstand und zuständige Strafbehörde (Art. 31–42 StPO), Anzeige-Fahrplan sowie das statthafte Rechtsmittel mit Fristen (Art. 379 ff. StPO); Staatsanwaltschafts-Adresse für erfasste Kantone.',
    status: 'entwurf',
    norms: [
      { label: 'Art. 31 StPO', url: fedlexUrl('StPO', '31'), verified: false },
      { label: 'Art. 301 StPO', url: fedlexUrl('StPO', '301'), verified: false },
    ],
    href: '/rechner/zustaendigkeit#straf',
    keywords: ['Zuständigkeit', 'Strafverfahren', 'Tatort', 'Staatsanwaltschaft', 'Strafanzeige', 'Strafantrag', 'Einsprache', 'Gerichtsstand'],
    related: ['strafanzeige', 'strafantrag-vorlage', 'zustaendigkeit'],
    icon: 'scale',
  },
  'verwaltung-zustaendigkeit': {
    id: 'verwaltung-zustaendigkeit', modus: 'rechner', art: 'zuordnung', rechtsgebiet: 'Verwaltungsrecht',
    rechtsbereich: 'oeffentlich',
    title: 'Zuständigkeit Verwaltungsverfahren',
    description: 'Zuständige Behörde und Beschwerdeinstanz im Verwaltungsverfahren (VwVG/kantonal) – Einsprache, Beschwerde und Rechtsmittelweg.',
    status: 'geplant', norms: [],
    keywords: ['Zuständigkeit', 'Verwaltungsverfahren', 'Verfügung', 'Einsprache', 'Beschwerde', 'Beschwerdeinstanz', 'VwVG'],
    related: ['zustaendigkeit'],
  },
  iprg: {
    id: 'iprg', modus: 'rechner', art: 'zuordnung', rechtsgebiet: 'Weitere Rechtsgebiete',
    rechtsbereich: 'uebergreifend',
    title: 'Anwendbares Recht (IPRG)',
    description: 'Anwendbares Recht und Gerichtsstand bei internationalem Bezug.',
    status: 'geplant', norms: [],
  },

  // ════ IV – Werkzeuge (in Vorbereitung) ════
  tagerechner: {
    id: 'tagerechner', modus: 'rechner', art: 'werkzeug', rechtsgebiet: 'Übergreifende Werkzeuge',
    rechtsbereich: 'uebergreifend',
    title: 'Fristenrechner (Tage · ZPO · SchKG)',
    description: 'EIN Fristenrechner für die meisten Verfahren: allgemeine Vertrags- und Verwirkungsfristen (Ereignistag zählt nicht, Monatsfristen, Werktag-Verschiebung kantonal nach EJPD-Verzeichnis, Rückwärtsrechnung, Zustell-Helfer, Kalenderexport), Zivilprozess mit Stillstand nach Art. 145 ZPO sowie Betreibungsferien und Rechtsstillstand nach SchKG – getrennt gerechnete Engines, ein Einstieg.',
    status: 'entwurf',
    norms: [
      { label: 'Art. 77 OR', url: fedlexUrl('OR', '77'), verified: false },
      { label: 'Art. 78 OR', url: fedlexUrl('OR', '78'), verified: false },
      // BG über den Fristenlauf an Samstagen – ELI via Fedlex-SPARQL verifiziert (5.6.2026)
      { label: 'SR 173.110.3', url: 'https://www.fedlex.admin.ch/eli/cc/1963/819_815_843/de', verified: false },
      { label: 'Art. 145 ZPO', url: fedlexUrl('ZPO', '145'), verified: false },
      { label: 'Art. 56 SchKG', url: fedlexUrl('SchKG', '56'), verified: false },
    ],
    href: '/rechner/tagerechner',
    related: ['zpo-fristen', 'schkg-fristen'],
    // FE-6: Vaterschaft/KESB am Preset-Code verifiziert (famStatusPresets —
    // Vaterschaftsklage Art. 263, Anfechtung Art. 256c, KESB 450b/445 ZGB).
    keywords: ['Frist', 'Fristende', 'Tagerechner', 'Art. 77', 'Art. 78', 'Feiertag', 'dies a quo',
      'Vaterschaft', 'KESB'],
    icon: 'clock',
  },
  // S-5c STRUKTUR-UMBAU 10.6.2026 abends (Auftrag David): Die Karte
  // «Fristenspiegel» ist AUFGELÖST — die sechs Ereignisse leben als
  // Ereignis-Block in den Fach-Rechnern (ZPO: Zivilentscheid +
  // Klagebewilligung · SchKG: Zahlungsbefehl · Erbrecht: Erbgang ·
  // Kündigung: 336b · Mietrecht: zeigt Anfechtung/Erstreckung selbst);
  // /rechner/fristenspiegel ist ein Redirect mit Query-Weiterreichung.
  'ferien-checker': {
    id: 'ferien-checker', modus: 'rechner', art: 'werkzeug', rechtsgebiet: 'Übergreifende Werkzeuge',
    rechtsbereich: 'uebergreifend',
    title: 'Gerichts- & Betreibungsferien-Checker',
    description: 'Prüft, ob ein Datum in Gerichts- oder Betreibungsferien fällt.',
    status: 'geplant', norms: [],
  },
  teuerungsrechner: {
    id: 'teuerungsrechner', modus: 'rechner', art: 'werkzeug', rechtsgebiet: 'Übergreifende Werkzeuge',
    rechtsbereich: 'uebergreifend',
    title: 'Teuerungsrechner (LIK-Indexierung)',
    description: 'Indexierung nach dem Landesindex der Konsumentenpreise mit amtlicher BFS-Reihe (Originalbasen, automatische Basis-Wahl): Indexmiete mit 100-%-Weitergabe und Senkungspflicht, Unterhaltsbeiträge nach Urteilsklausel, generische Wertsicherung – Rechenweg und Quelle vollständig offengelegt.',
    status: 'entwurf',
    norms: [
      { label: 'Art. 269b OR', url: fedlexUrl('OR', '269b'), verified: false },
      { label: 'Art. 17 VMWG', url: fedlexUrl('VMWG', '17'), verified: false },
      { label: 'Art. 286 ZGB', url: fedlexUrl('ZGB', '286'), verified: false },
      { label: 'Art. 128 ZGB', url: fedlexUrl('ZGB', '128'), verified: false },
    ],
    href: '/rechner/teuerung',
    related: ['mietzinsanpassung', 'verzugszins'],
    keywords: ['Teuerung', 'LIK', 'Index', 'Indexmiete', 'Unterhalt', 'Indexierung', 'BFS'],
    icon: 'percent',
  },
  // Amtlicher Gerichts-Zitierer (Gerichts-Baustein-Set, ROADMAP W2·7):
  // Fundstellen-Formatierer BGE/BGer nach der Plattform-Zitierkonvention.
  // Art. 112 BGG live gegen Fedlex verifiziert 2026-07-05 (eli/cc/2006/218).
  gerichtszitat: {
    id: 'gerichtszitat', modus: 'rechner', art: 'werkzeug', rechtsgebiet: 'Übergreifende Werkzeuge',
    rechtsbereich: 'uebergreifend',
    title: 'Gerichts-Zitierer (BGE/BGer)',
    description: 'Fundstellen bundesgerichtlicher Entscheide nach der Zitierkonvention formatieren: BGE (Band · Teil · Seite) und nicht publizierte Urteile (Geschäftsnummer · Datum), mit Erwägungsangabe. Reine Zitierhilfe – prüft nicht, ob der Entscheid existiert.',
    status: 'entwurf',
    norms: [
      { label: 'Art. 112 BGG', url: fedlexUrl('BGG', '112'), verified: false },
    ],
    href: '/rechner/gerichtszitat',
    related: ['rubrum'],
    keywords: ['Zitat', 'Zitierweise', 'BGE', 'BGer', 'Fundstelle', 'Erwägung', 'Aktenzeichen', 'Bundesgericht'],
    icon: 'court',
  },
  'ferien-assistent': {
    id: 'ferien-assistent', modus: 'rechner', art: 'werkzeug', rechtsgebiet: 'Übergreifende Werkzeuge',
    rechtsbereich: 'uebergreifend',
    title: 'Friststillstand- & Ferien-Assistent (alle Verfahren)',
    description: 'Stillstand und Gerichts-/Betreibungsferien über ZPO, StPO, BGG und Verwaltungsverfahren.',
    status: 'geplant', norms: [],
  },
};
