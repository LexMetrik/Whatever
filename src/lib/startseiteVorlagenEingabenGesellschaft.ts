// ─── Vorlagen-Karten (VorlageCard) — Teilmodul Rubriken III–IV (Eingaben · Gesellschaftsdokumente) ───
//
// H-10 (§6.6, B26): aus dem Katalog-Modul entlang der vorhandenen
// Rubrik-Blöcke ausgelagert — Einträge byte-identisch verschoben, im
// Stamm-Modul per Spread in Original-Key-Reihenfolge zusammengeführt.
import { fedlexUrl } from './fedlex';
import type { VorlageCard } from './startseiteConfigTypen';

export const VORLAGEN_EINGABEN_GESELLSCHAFT: Record<string, VorlageCard> = {
  // ════ III – Eingaben ════
  schlichtungsgesuch: {
    id: 'schlichtungsgesuch', modus: 'vorlage', art: 'eingabe', eingabeRubrik: 'klage_allgemein', rechtsgebiet: 'Zivilprozess (ZPO) & Bundesgericht',
    formGate: 'fertig',
    rechtsbereich: 'privat',
    title: 'Schlichtungsgesuch (alle Kantone)',
    description: 'Stellt ein Schlichtungsgesuch nach Art. 202 ZPO zusammen – Parteien, Rechtsbegehren, Streitgegenstand, Beilagen. Behördenadresse automatisch für alle 26 Kantone (PLZ/Gemeinde-genau in ZH/AG/SG/TG/FR/ZG/AI); sachliches Spezial-Routing für Basel-Stadt (Adressen nach Staatskalender BS; fachliche Abnahme ausstehend).',
    // Abweichung von der Auftrags-Anweisung (status: 'geplant') offengelegt:
    // Nach dem neueren Status-Modell-Auftrag erhalten GEBAUTE, fachlich noch
    // nicht geprüfte Einträge 'entwurf' (orange, verified: false) – als
    // 'geplant' wäre die Vorlage im Katalog nicht erreichbar.
    status: 'entwurf',
    norms: [
      // Art. 202 ZPO – Schlichtungsgesuch (Pflichtinhalt) – Anker build-verifiziert, fachlich offen
      { label: 'Art. 202 ZPO', url: fedlexUrl('ZPO', '202'), verified: false },
      // Art. 130 ZPO – Form (Papier/Signatur)
      { label: 'Art. 130 ZPO', url: fedlexUrl('ZPO', '130'), verified: false },
      // Art. 209 ZPO – Klagebewilligung
      { label: 'Art. 209 ZPO', url: fedlexUrl('ZPO', '209'), verified: false },
      // Art. 212 ZPO – Entscheid der Schlichtungsbehörde
      { label: 'Art. 212 ZPO', url: fedlexUrl('ZPO', '212'), verified: false },
    ],
    href: '/vorlagen/schlichtungsgesuch-bs',
    schemaId: 'schlichtungsgesuch-bs',
    formvorschrift: 'Schriftlich in Papierform, eigenhändig zu unterzeichnen',
    output: ['pdf', 'docx'],
    keywords: ['Schlichtung', 'Schlichtungsgesuch', 'Vermittlung', 'Klagebewilligung', 'Art. 202 ZPO', 'Basel', 'Rechtsbegehren'],
    related: ['zpo-fristen', 'verjaehrung', 'ferien-assistent'],
    icon: 'clipboard',
  },
  'klage-vereinfacht': {
    id: 'klage-vereinfacht', modus: 'vorlage', art: 'eingabe', eingabeRubrik: 'klage_allgemein', rechtsgebiet: 'Zivilprozess (ZPO) & Bundesgericht',
    formGate: 'fertig',
    rechtsbereich: 'privat',
    title: 'Klage (vereinfachtes Verfahren)',
    description: 'Klage nach Art. 244 ZPO aus festen Bausteinen: Rechtsbegehren (beziffert/unbeziffert), Streitgegenstand, freiwillige strukturierte Begründung mit Beweismitteln, Beilagen mit Klagebewilligung – Gerichts-Adressat für alle 26 Kantone (Spruchkörper-Routing für Basel-Stadt nach GOG BS, fachliche Abnahme ausstehend), Kostenfreiheits-Prüfung und Klagefrist mit Gerichtsferien.',
    status: 'entwurf',
    norms: [
      // Geltungsbereich vereinfachtes Verfahren
      { label: 'Art. 243 ZPO', url: fedlexUrl('ZPO', '243'), verified: false },
      // Form und Inhalt der Klage
      { label: 'Art. 244 ZPO', url: fedlexUrl('ZPO', '244'), verified: false },
      // Klagebewilligung und Klagefrist
      { label: 'Art. 209 ZPO', url: fedlexUrl('ZPO', '209'), verified: false },
      // Kostenfreiheit im Entscheidverfahren
      { label: 'Art. 114 ZPO', url: fedlexUrl('ZPO', '114'), verified: false },
      // Gerichtsferien (Klagefrist-Berechnung)
      { label: 'Art. 145 ZPO', url: fedlexUrl('ZPO', '145'), verified: false },
    ],
    href: '/vorlagen/klage-vereinfacht',
    schemaId: 'klage-vereinfacht-bs',
    formvorschrift: 'Unterschreiben und im Doppel einreichen (Art. 131 ZPO)',
    output: ['pdf', 'docx'],
    keywords: ['Klage', 'vereinfachtes Verfahren', 'Art. 244 ZPO', 'Klagebewilligung', 'Arbeitsgericht', 'Rechtsbegehren', 'Basel'],
    related: ['schlichtungsgesuch', 'zustaendigkeit', 'zpo-fristen', 'streitwert', 'prozesskosten'],
    icon: 'document',
  },
  'klage-ordentlich': {
    // S-2 (Auftrag David 10.6.2026: «Klage einmal allgemein in Schlichtungs-
    // gesuch, einfache [vereinfachte], ordentliche Klage») — Platzhalter der
    // Rubrik «Klagen – allgemein»; Bau folgt nach Roadmap-Priorisierung.
    id: 'klage-ordentlich', modus: 'vorlage', art: 'eingabe', eingabeRubrik: 'klage_allgemein', rechtsgebiet: 'Zivilprozess (ZPO) & Bundesgericht',
    formGate: 'fertig',
    rechtsbereich: 'privat',
    title: 'Klage (ordentliches Verfahren)',
    description: 'Klageschrift nach Art. 221 ZPO aus festen Bausteinen: Rechtsbegehren, Streitwertangabe, Tatsachenbehauptungen mit Beweisofferte je Ziffer (Pflicht), fakultative rechtliche Begründung, Beweismittel- und Beilagenverzeichnis – Gerichts-Adressat für alle 26 Kantone, Klagefrist mit Gerichtsferien.',
    status: 'entwurf',
    output: ['pdf', 'docx'],
    schemaId: 'klage-ordentlich',
    href: '/vorlagen/klage-ordentlich',
    norms: [
      { label: 'Art. 220 ZPO', url: fedlexUrl('ZPO', '220'), verified: false },
      { label: 'Art. 221 ZPO', url: fedlexUrl('ZPO', '221'), verified: false },
      { label: 'Art. 209 ZPO', url: fedlexUrl('ZPO', '209'), verified: false },
    ],
    keywords: ['Klage', 'ordentliches Verfahren', 'Klageschrift', 'Rechtsbegehren'],
    related: ['klage-vereinfacht', 'schlichtungsgesuch', 'zustaendigkeit', 'streitwert', 'prozesskosten'],
    icon: 'document',
  },
  einsprache: {
    id: 'einsprache', modus: 'vorlage', art: 'eingabe', eingabeRubrik: 'gesuch_sonstige', rechtsgebiet: 'Strafrecht & Strafprozess',
    rechtsbereich: 'straf',
    title: 'Einsprache (Straf-/Verwaltungsbefehl)',
    description: 'Fristgerechte Einsprache mit Antrag und Begründungsgerüst.',
    status: 'geplant', norms: [],
    icon: 'document',
  },
  beschwerde: {
    id: 'beschwerde', modus: 'vorlage', art: 'eingabe', eingabeRubrik: 'gesuch_sonstige', rechtsgebiet: 'Verwaltungsrecht',
    rechtsbereich: 'oeffentlich',
    title: 'Beschwerde',
    description: 'Verwaltungsbeschwerde mit Anträgen, Begründung und Beilagen.',
    status: 'geplant', norms: [],
    icon: 'document',
  },
  rechtsoeffnungsbegehren: {
    id: 'rechtsoeffnungsbegehren', modus: 'vorlage', art: 'eingabe', eingabeRubrik: 'gesuch_sonstige', rechtsgebiet: 'Betreibung & Konkurs (SchKG)',
    rechtsbereich: 'privat',
    title: 'Rechtsöffnungsbegehren',
    description: 'Begehren um provisorische oder definitive Rechtsöffnung mit Forderungsnachweis.',
    status: 'geplant', norms: [], related: ['schkg-fristen', 'verzugszins', 'schuldanerkennung'],
    icon: 'clipboard',
  },

  // ════ IV – Gesellschaftsdokumente ════
  // Gründungs-Masken (Spez. recherche/gmbh-gruendung.md Teil 5 bzw.
  // ag-gruendung.md, gebaut 6.6.2026; GmbH-AUSBAUSTUFE 9b 7.6.2026:
  // Volldokumente aus recherche/gruendungsdokumente-wortlaute.md).
  // Der Errichtungsakt ist öffentlich zu beurkunden (Art. 777/629 OR) —
  // Urkunde/Statuten darum nur als ENTWURF-Export (§8-Gate), Erklärungen/
  // Beschlüsse/Anmeldung druckfertig. Unterlagenliste + Dokument-Auslöser
  // deterministisch aus lib/gruendungsunterlagen.ts (HRegV abschliessend).
  'gmbh-gruendung': {
    id: 'gmbh-gruendung', modus: 'vorlage', art: 'gesellschaft', rechtsgebiet: 'Gesellschaftsrecht',
    formGate: 'gemischt',
    rechtsbereich: 'privat',
    title: 'GmbH-Gründung (Checkliste + Dokumentmappe)',
    description: 'Unterlagenliste UND Volldokumente für die GmbH-Gründung nach Konstellation (Opting-out, c/o-Domizil, Lex Koller, Statuten-Klauseln): Bei der Bargründung entstehen Statuten und Errichtungsakt als Entwurf für die Urkundsperson (die öffentliche Beurkundung bleibt zwingend) sowie Wahlannahme- und Domizilerklärungen, Beschlüsse und die Handelsregister-Anmeldung druckfertig – mit Notariats-Anlaufstelle je Kanton und Emissionsabgabe-Hinweis.',
    status: 'entwurf',
    output: ['pdf', 'docx'],
    // Mappe aus mehreren Schemas (gmbh-statuten · gmbh-errichtungsakt · …) —
    // schemaId nennt die Mappe (lib/vorlagen/gruendungGmbhDokumente.ts).
    schemaId: 'gmbh-gruendungsmappe',
    norms: [
      // Art. 777 OR – Errichtung durch öffentliche Urkunde
      { label: 'Art. 777 OR', url: fedlexUrl('OR', '777'), verified: false },
      // Art. 776 OR – Statuten-Mindestinhalt (rev. 2023, 4 Ziffern)
      { label: 'Art. 776 OR', url: fedlexUrl('OR', '776'), verified: false },
      // Art. 777c OR – Volliberierung + Einlagen-Regeln
      { label: 'Art. 777c OR', url: fedlexUrl('OR', '777c'), verified: false },
      // Art. 71 HRegV – abschliessende Belegliste der Anmeldung
      { label: 'Art. 71 HRegV', url: fedlexUrl('HRegV', '71'), verified: false },
    ],
    href: '/vorlagen/gmbh-gruendung',
    formvorschrift: 'Errichtungsakt nur als öffentliche Urkunde (Art. 777 Abs. 1 OR) – Statuten und Urkunde darum ausschliesslich als ENTWURF mit Wasserzeichen; gültig wird nur die beurkundete Fassung. Beurkundungsfreie Erklärungen und die HR-Anmeldung sind druckfertig.',
    related: ['ag-gruendung', 'statuten', 'gesellschaftsrecht-fristen'],
    keywords: ['GmbH', 'Gründung', 'Errichtungsakt', 'Statuten', 'Handelsregister', 'Stammkapital', 'Beurkundung', 'Opting-out', 'Lex Koller', 'Art. 777', 'HRegV'],
  },
  'ag-gruendung': {
    id: 'ag-gruendung', modus: 'vorlage', art: 'gesellschaft', rechtsgebiet: 'Gesellschaftsrecht',
    formGate: 'gemischt',
    rechtsbereich: 'privat',
    title: 'AG-Gründung (Checkliste + Dokumentmappe)',
    description: 'Unterlagenliste UND Volldokumente für die AG-Gründung nach Konstellation (Opting-out, Inhaberaktien, c/o-Domizil, Lex Koller): Bei der Bargründung mit Namenaktien entstehen Statuten und Errichtungsakt als Entwurf für die Urkundsperson (die öffentliche Beurkundung bleibt zwingend) sowie Wahlannahmen, VR-Konstituierungsprotokoll und die Handelsregister-Anmeldung druckfertig – mit Notariats-Anlaufstelle je Kanton, Teilliberierungs-Prüfung (Art. 632 OR) und Emissionsabgabe-Hinweis.',
    status: 'entwurf',
    output: ['pdf', 'docx'],
    // Mappe aus mehreren Schemas (lib/vorlagen/gruendungAgDokumente.ts).
    schemaId: 'ag-gruendungsmappe',
    norms: [
      // Art. 629 OR – Errichtung durch öffentliche Urkunde
      { label: 'Art. 629 OR', url: fedlexUrl('OR', '629'), verified: false },
      // Art. 626 OR – Statuten-Mindestinhalt (rev. 2023)
      { label: 'Art. 626 OR', url: fedlexUrl('OR', '626'), verified: false },
      // Art. 632 OR – Mindesteinlage (20 % je Aktie, mind. CHF 50 000)
      { label: 'Art. 632 OR', url: fedlexUrl('OR', '632'), verified: false },
      // Art. 43 HRegV – abschliessende Belegliste der Anmeldung
      { label: 'Art. 43 HRegV', url: fedlexUrl('HRegV', '43'), verified: false },
    ],
    href: '/vorlagen/ag-gruendung',
    formvorschrift: 'Errichtungsakt nur als öffentliche Urkunde (Art. 629 Abs. 1 OR) – Statuten und Urkunde darum ausschliesslich als ENTWURF mit Wasserzeichen; gültig wird nur die beurkundete Fassung. Beurkundungsfreie Erklärungen, VR-Protokoll und HR-Anmeldung sind druckfertig.',
    related: ['gmbh-gruendung', 'statuten', 'gesellschaftsrecht-fristen'],
    keywords: ['AG', 'Aktiengesellschaft', 'Gründung', 'Errichtungsakt', 'Statuten', 'Handelsregister', 'Aktienkapital', 'Beurkundung', 'Verwaltungsrat', 'Inhaberaktien', 'Emissionsabgabe', 'Art. 629', 'HRegV'],
  },
  statuten: {
    id: 'statuten', modus: 'vorlage', art: 'gesellschaft', rechtsgebiet: 'Gesellschaftsrecht',
    rechtsbereich: 'privat',
    title: 'Statuten',
    description: 'Statuten für GmbH oder AG mit den üblichen Wahlbestimmungen.',
    status: 'geplant', norms: [],
    icon: 'scale',
  },
  'gv-vr-beschluss': {
    id: 'gv-vr-beschluss', modus: 'vorlage', art: 'gesellschaft', rechtsgebiet: 'Gesellschaftsrecht',
    rechtsbereich: 'privat',
    title: 'GV-/VR-Beschluss',
    description: 'Beschlussprotokoll für Generalversammlung oder Verwaltungsrat.',
    status: 'geplant', norms: [],
    icon: 'scale',
  },
};
