// Dossier: bibliothek/behoerden/notariate-kantone.md
import type { Kanton } from '../types/legal';

// ─── Notariats-Anlaufstellen je Kanton (Gründungs-Beurkundung GmbH/AG) ───────
//
// Stammdaten-Quelle: bibliothek/behoerden/notariate-kantone.md (Erstrecherche
// 7.6.2026, Auftrag David; URLs am Abrufdatum geprüft). Bundesrahmen: Art. 55
// SchlT ZGB — die Kantone bestimmen die Urkundspersonen. Für GRÜNDUNGEN gilt
// keine örtliche Ausschliesslichkeit (anders als bei Grundstücken): Die
// Beurkundung ist auch ausserkantonal zulässig — die UI zeigt das immer an.
//
// `urlBelegt: false` = Anlaufstelle nur eingeschränkt belegt (UR: kein
// Online-Verzeichnis · AI: keine Personenliste · BL: Abruf Bot-blockiert) —
// UI-Zusatz «Angabe ohne Gewähr». §8: Unsicherheit offenlegen. Feldname
// bewusst NICHT `verifiziert` (Integr.-Check N-1, 7.6.2026): keine
// Verwechslung mit dem §7-`verified`-Norm-Anker — hier geht es nur um
// «URL/Stelle beim Abruf bestätigt», nicht um fachliche Abnahme.
//
// `system` ist reines Stammdatum der Anlaufstelle und KEIN MwSt-Kriterium: Amts-
// und freie Notare rechnen MwSt (MWSTV Art. 14 Ziff. 13); die Behandlung je Kanton
// steht in src/data/tarif/mwst-notariat.ts (RL-33).

export type NotariatsSystem = 'amtsnotariat' | 'frei' | 'gemischt' | 'hregamt';

export interface NotariatsEintrag {
  system: NotariatsSystem;
  /** Anzeigename der Anlaufstelle (amtliches Verzeichnis bzw. Amtsstelle). */
  stelle: string;
  url: string;
  /** Besonderheit für die Hinweiszeile (z. B. SH: HRegA beurkundet selbst). */
  hinweis?: string;
  urlBelegt: boolean;
}

export const NOTARIAT_SYSTEM_LABEL: Record<NotariatsSystem, string> = {
  amtsnotariat: 'Amtsnotariat (staatliche Notariate)',
  frei: 'freies Notariat (selbständige Notarinnen und Notare)',
  gemischt: 'gemischtes System',
  hregamt: 'Beurkundung durch das Handelsregisteramt',
};

export const NOTARIATE: Record<Kanton, NotariatsEintrag> = {
  ZH: { system: 'amtsnotariat', stelle: 'Notariate Kanton Zürich', url: 'https://www.notariate-zh.ch/de/notariat/gesellschaftsrecht/gmbh/gruendung-einer-gmbh', urlBelegt: true },
  BE: { system: 'frei', stelle: 'Notariatsregister Kanton Bern', url: 'https://www.gba.dij.be.ch/de/start/notariat/notariatsregister.html', urlBelegt: true },
  LU: { system: 'frei', stelle: 'Notarenregister Kanton Luzern', url: 'https://gerichte.lu.ch/anwaelte_notare_sachwalter/notare/notarenregister_kanton_luzern', urlBelegt: true },
  // AG-7-Verifikation 7.6.2026: alter Link /dienstleistungen/3039 war die Apostillen-Seite.
  UR: { system: 'frei', stelle: 'Abteilung Justiz und Handelsregister Uri', url: 'https://www.ur.ch/unterinstanzen/879', hinweis: 'Freiberufliches Notariat (ausschliessliche Beurkundungsbefugnis); Personensuche über den Urner Anwalts- und Notarenverband (urilaw.ch).', urlBelegt: true },
  SZ: { system: 'gemischt', stelle: 'Urkundspersonen-Liste des Kantonsgerichts Schwyz', url: 'https://www.sz.ch/public/upload/assets/69540/Urkundspersonen_des_Kantons_Schwyz.pdf', urlBelegt: true },
  OW: { system: 'gemischt', stelle: 'Urkundspersonen-Liste Obwalden', url: 'https://www.ow.ch/publikationen/15380', urlBelegt: true },
  NW: { system: 'amtsnotariat', stelle: 'Abteilung Notariat Nidwalden', url: 'https://www.nw.ch/notariat/2497', urlBelegt: true },
  GL: { system: 'gemischt', stelle: 'Urkundspersonen Kanton Glarus (Beurkundungsgeschäfte)', url: 'https://www.gl.ch/rechtspflege/oeffentliche-beurkundung/alle-beurkundungsgeschaefte.html/288', urlBelegt: true },
  ZG: { system: 'gemischt', stelle: 'Urkundspersonen-Register (UPReg)', url: 'https://www.upreg.ch/', urlBelegt: true },
  FR: { system: 'frei', stelle: 'Registre du notariat (Service de la justice)', url: 'https://www.fr.ch/etat-et-droit/gouvernement-et-administration/registre-du-notariat', urlBelegt: true },
  SO: { system: 'gemischt', stelle: 'Notarenliste der Staatskanzlei Solothurn', url: 'https://so.ch/staatskanzlei/legistik-und-justiz/notare/', urlBelegt: true },
  BS: { system: 'frei', stelle: 'Notariatskammer Basel-Stadt', url: 'https://www.notariatskammerbasel.ch/', urlBelegt: true },
  // AG-7 7.6.2026: amtliche Seite bestätigt (Browser; WAF blockt Bots) — Verband als erreichbare Personensuche ergänzt.
  BL: { system: 'frei', stelle: 'Basellandschaftliches Notariat', url: 'https://www.baselland.ch/politik-und-behorden/direktionen/sicherheitsdirektion/zivilrechtsverwaltung/basellandschaftliches-notariat', hinweis: 'Freie Notare seit 2012 (Amtsnotariat abgeschafft); Notarliste auch beim Notariatsverband notariat-baselland.ch.', urlBelegt: true },
  SH: { system: 'hregamt', stelle: 'Handelsregisteramt Kanton Schaffhausen', url: 'https://sh.ch/CMS/Webseite/Kanton-Schaffhausen/Beh-rde/Verwaltung/Volkswirtschaftsdepartement/Handelsregisteramt-3872-DE.html', hinweis: 'Sonderregel SH: Das Handelsregisteramt beurkundet Gründungen selbst.', urlBelegt: true },
  AR: { system: 'gemischt', stelle: 'Verzeichnis öffentliche Urkundspersonen (Obergericht AR)', url: 'https://ar.ch/gerichte/obergericht/anwaltsregister-oeffentliche-urkundspersonen/', urlBelegt: true },
  // AG-7 7.6.2026: alte Seite deckte nur den Grundbuchbereich; für Gründungen beurkundet der Handelsregisterführer bzw. zugelassene Urkundspersonen.
  AI: { system: 'gemischt', stelle: 'Beglaubigungen/Notariat Appenzell Innerrhoden', url: 'https://www.ai.ch/themen/persoenliches/beglaubigungen-notariat', hinweis: 'Im Handelsregisterbereich beurkundet der Handelsregisterführer; keine öffentliche Personenliste — Anlaufstelle kontaktieren.', urlBelegt: true },
  SG: { system: 'gemischt', stelle: 'Amtsnotariate St. Gallen (Beurkundungen)', url: 'https://www.sg.ch/recht/handelsregister-notariate/amtsnotariate/beurkundungen/', urlBelegt: true },
  GR: { system: 'frei', stelle: 'Notariats-Register Justiz Graubünden', url: 'https://www.justiz-gr.ch/advokatur-und-notariat/register/', urlBelegt: true },
  AG: { system: 'frei', stelle: 'Register der Urkundspersonen (Notariatskommission AG)', url: 'https://www.ag.ch/de/themen/planen-bauen/grundbuch-vermessung/notariat/notariatskommission/register', urlBelegt: true },
  TG: { system: 'amtsnotariat', stelle: 'Grundbuchämter und Notariate Thurgau (Standorte)', url: 'https://gni.tg.ch/standorte.html/1776', urlBelegt: true },
  TI: { system: 'frei', stelle: 'Ordine dei Notai del Cantone Ticino', url: 'https://www.odnti.ch/', urlBelegt: true },
  VD: { system: 'frei', stelle: 'Annuaire — Association des Notaires Vaudois', url: 'https://notaires-vaudois.ch/annuaire/', urlBelegt: true },
  VS: { system: 'frei', stelle: 'Registre des notaires (Service de la justice VS)', url: 'https://www.vs.ch/web/sjsj/registe-notaires', urlBelegt: true },
  NE: { system: 'frei', stelle: 'Liste officielle des notaires (NE)', url: 'https://www.ne.ch/themes/etat-droit-et-finances/droits-et-justice/notaires', urlBelegt: true },
  GE: { system: 'frei', stelle: 'Liste des notaires du canton de Genève', url: 'https://www.ge.ch/document/liste-notaires-du-canton-geneve', urlBelegt: true },
  JU: { system: 'frei', stelle: 'Notaires — République et Canton du Jura', url: 'https://www.jura.ch/JUST/Notaires/Notaires.html', urlBelegt: true },
};

/** Immer gültiger Zusatz (keine örtliche Ausschliesslichkeit bei Gründungen). */
export const NOTARIAT_FREIZUEGIGKEIT =
  'Die Gründungs-Beurkundung ist auch bei einer Urkundsperson eines anderen Kantons zulässig ' +
  '(keine örtliche Ausschliesslichkeit wie bei Grundstücksgeschäften).';
