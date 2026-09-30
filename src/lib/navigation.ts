// ─── Navigations-SSoT der App-Shell (Build-Plan App-Shell, Phase 2) ─────────
//
// EINE Quelle für die linke Seitenleiste (Sidebar.tsx) und das mobile
// Schubladen-Menü. REINES, typisiertes Datenmodul: kein JSX, KEINE Rechtslogik
// (CLAUDE.md §3) — nur die Navigations-Topologie.
//
// SSoT / «ableiten statt duplizieren» (Build-Plan Leitplanke 4): kein Eintrag
// wird hier hartcodiert, alle leiten sich aus der bestehenden Fachkonfiguration
// ab — seit D26 (6.9.2026) aus diesen Quellen:
//   · Gesetze        ← kernerlasse.ts (Schlüssel) + Erlass-Register · KANTONE
//                      · INTERNATIONAL_RUBRIKEN
//   · Rechtsprechung ← startseiteZaehler.generated (Sachgebiete + Zahlen)
//   · Materialien    ← startseiteZaehler.generated (Behörden + Zahlen)
//   · Rechner        ← KATALOG_KARTEN (fünf geführte IDs, aufgelöst)
//   · Vorlagen       ← VORLAGE_SEKTIONEN (startseiteConfig.ts)
// — sodass ein neuer Erlass, ein neues Sachgebiet, eine neue Behörde oder
// Vorlagen-Sektion automatisch erscheint und nichts an zwei Stellen gepflegt
// wird (§5). Bis D26 spiegelten Rechner und Gesetze stattdessen OBERKATEGORIEN
// bzw. SYSTEMATIK; beide Ordnungen leben unverändert auf ihren Übersichtsseiten.
//
// Nur die echten App-Texte (Start, «Alle …») und die Meta-Ziele sind aus keiner
// Fachkonfiguration ableitbar und stehen darum literal.

import { KATALOG_KARTEN, VORLAGE_SEKTIONEN, istVerfuegbar } from './startseiteConfig';
import { istVorlage } from './vorlagenKategorie';
import { INTERNATIONAL_RUBRIK_IDS } from './normtext/international-rubriken';
import { KANTONE, KANTON_NAMEN } from '../data/tarif/typen';
// D26 · die Kernerlass-Liste der Übersicht /gesetze (R12A) trägt jetzt AUCH die
// Seitenleiste. Bewusst dieselbe Datei und keine zweite Liste (§5): dort stehen
// nur die SCHLÜSSEL, Kürzel/Titel/Adresse kommen aus dem Erlass-Register. Das
// Modul ist reine Daten («Daten, kein JSX», s. Kopf dort) — der Import aus
// `components/` bringt darum kein JSX und keine Rechtslogik in die Landkarte (§3).
import { kernerlasse } from '../components/gesetze/kernerlasse';
// IA-7 (W2·5d §11.5): Erlass-Zahl-Badges an den 26 Kantonslinks — Zahl aus dem
// generierten Zähler-SSoT (register.json → gen:zaehler, Drift-Tor check:zaehler;
// build-time, KEIN Client-Fetch, §15.3), Zustands-Wort aus der IA-2-SSoT
// erfassungsgrad.ts (KEINE zweite Zähl-Wahrheit, §5).
import { STARTSEITE_ZAEHLER } from '../data/startseiteZaehler.generated';
import { erfassungsgrad, STUFE_WORT, type ErfassungsStufe } from './normtext/erfassungsgrad';

/** Blatt: ein Navigationsziel (Route, ggf. mit Query/Hash für eine Teilsicht). */
export interface NavLink {
  art: 'link';
  label: string;
  /** Voller Pfad inkl. ?query/#hash — wird unverändert an react-router <Link to> gegeben. */
  ziel: string;
  /** IA-7: kleine Erlass-Zahl rechts am Eintrag (heute nur Kantonslinks) —
   *  reine Anzeige, von Anfang an im Markup (§15.2, kein CLS). */
  zahl?: number;
  /** IA-7: vollständiger Accessible Name (Name + Zahl + Zustands-Wort,
   *  O4-Muster — nie nur Farbe/Zahl, §11.6.8). Nur gesetzt, wenn `zahl` gesetzt ist. */
  ariaLabel?: string;
  /** Zustands-Wort zur `zahl` (Erfassungsgrad des Kantons), damit die Seitenleiste
   *  dieselbe Einordnung SICHTBAR zeigt, die `ariaLabel` schon ansagt.
   *
   *  Fehlerbuch-Befund 44 (auf Prod reproduziert 29.8.2026): In der Seitenleiste
   *  standen «Basel-Stadt 859» und «Aargau 4» nebeneinander als blosse Zahlen.
   *  Ohne Einordnung liest sich die 4 wie «dieser Kanton hat vier Gesetze» statt
   *  «wir haben vier davon erfasst» — die Mengen-Asymmetrie wird zur stillen
   *  Falschaussage (§8). Kachel, Karten-Bildunterschrift und Kantons-Kopf trugen
   *  das Wort längst; die Seitenleiste hatte es nur im aria-label, also für
   *  Screenreader sichtbar und für Sehende nicht.
   *
   *  Der Wert kommt aus DERSELBEN `erfassungsgrad()`-Ableitung, die zwei Zeilen
   *  weiter unten schon das aria-label speist — keine zweite Zähl-/Einstufungs-
   *  Wahrheit (§5), nur ein zweiter Konsument. */
  stufe?: ErfassungsStufe;
}

/** Knoten mit Kindern: entweder ein Abschnitt mit Überschrift oder eine
 *  aufklappbare Untergruppe (<details>). */
export interface NavGruppe {
  art: 'gruppe';
  label: string;
  /** Optional: macht die Gruppen-Überschrift klickbar → Übersicht (z.B. Bund/
   *  Kantone → /gesetze?ebene=…); der Chevron klappt die Kinder weiterhin auf. */
  ziel?: string;
  /** true → als natives <details> rendern (aufklappbar, tastaturzugänglich). */
  aufklappbar?: boolean;
  /** Bei aufklappbar: Anfangszustand. Bund startet eingeklappt (Build-Plan). */
  standardOffen?: boolean;
  kinder: NavKnoten[];
}

export type NavKnoten = NavLink | NavGruppe;

/** Ein Abschnitt der Hauptnavigation; titel === null bei den kopflosen
 *  Top-Einträgen (Start/Recherche) über den ersten Gruppentitel. */
interface NavAbschnitt {
  titel: string | null;
  /** Optional: macht die Abschnitts-Überschrift selbst klickbar → Gesamtübersicht
   *  (Auftrag David 20.6.2026: Klick auf Rechner/Vorlagen/Gesetze öffnet die
   *  jeweilige Übersicht). */
  ziel?: string;
  kinder: NavKnoten[];
}

const link = (label: string, ziel: string): NavLink => ({ art: 'link', label, ziel });

// ─── Abgeleitete Einträge (SSoT) ────────────────────────────────────────────
//
// Die echten Werkzeuge (Engines/Vorlagen) hängen DIREKT unter ihrer Kategorie
// (Auftrag David 19.6.2026): jede Rechner-Oberkategorie und jede Vorlagen-Gruppe
// ist eine aufklappbare Untergruppe, deren Kinder die SOFORT verfügbaren Karten
// (mit eigener Seite) als Direktlinks sind — abgeleitet aus dem Katalog (§5),
// nicht zweitgepflegt. Klicktiefe 1 von der Seitenleiste ins Werkzeug.

// Verfügbare Karten EINER Kategorie als Werkzeug-Direktlinks (Katalog-Reihenfolge).
const werkzeugeFuer = (pruefen: (k: typeof KATALOG_KARTEN[number]) => boolean): NavLink[] =>
  KATALOG_KARTEN.filter((k) => istVerfuegbar(k) && !!k.href && pruefen(k)).map((k) => link(k.title, k.href!));

const werkzeugGruppe = (label: string, kinder: NavLink[], ziel?: string): NavGruppe =>
  ({ art: 'gruppe', label, ziel, aufklappbar: true, standardOffen: false, kinder });

// O2 (W2·10-UI-NAV-O · Sidebar-Konsistenz): die Vorlagen-Gruppen tragen ein
// `ziel` — wie Kantone/International. Das Gruppen-Label navigiert damit ÜBERALL,
// der Chevron klappt überall. Sprungziel ist der Übersichtsanker der Rubrikseite:
//   · `vorlage-<sektion.id>` — Katalog.tsx `VorlagenRegister` (scroll-mt-24;
//     der Kommentar dort nennt die Seitenleiste als Absender)
// Den Sprung führt ScrollZuHash (App.tsx) aus — kein neuer Mechanismus (§5).
// Das Gegenstück `RECHNER_ANKER` (`/rechner#register-<kat.id>`) ist mit den
// Rechner-Kategorie-Gruppen entfallen (D26); die Anker selbst rendert
// `/rechner` unverändert.
const VORLAGEN_ANKER = (sektionId: string) => `/vorlagen#vorlage-${sektionId}`;

// ─── D26 (David 6.9.2026) · DIE LEISTE ZEIGT ZIELE, KEINE KATEGORIEN ────────
//
// «die seitenleiste, also die einklappbare, nochmals überarbeiten, was sie
// anzeigt». Bis hierher war sie eine Kopie der Kategorien-Ordnung: unter
// «Rechner» drei Oberkategorien, unter «Gesetze» die zwölf Systematik-Titel,
// unter «Rechtsprechung»/«Materialien» je eine einzige Klapp-Zeile. Wer etwas
// aufschlagen wollte, klappte erst auf und las dann eine Rubrik — die Leiste
// wiederholte die Übersichtsseiten, statt an ihnen vorbeizuführen.
//
// NEU steht in jeder Rubrik das, was man täglich aufschlägt, als DIREKTES Ziel,
// darunter genau eine Zeile «Alle …» in die Übersicht. Die Ordnungen selbst
// (Systematik, Oberkategorien) verschwinden nicht — sie leben auf ihren
// Übersichtsseiten weiter, wo sie hingehören und wo der Filter sie bedient.
//
// KEINE HANDPFLEGE (§5): jede Zeile leitet sich ab — Kernerlasse aus
// `kernerlasse.ts`, Sachgebiete/Behörden/Zahlen aus dem Zähler-Generat, Rechner
// und Vorlagen aus dem Katalog. Ein Schlüssel, den seine Quelle nicht kennt,
// verschwindet still, statt ins Leere zu verlinken (§8).

/** Rechner: die fünf meistgebrauchten (D26) — als KATALOG-IDs geführt, aufgelöst
 *  über `KATALOG_KARTEN`. Nur die Auswahl steht hier, nie Titel oder Adresse. */
const RECHNER_TOP_IDS = ['zpo-fristen', 'prozesskosten', 'verjaehrung', 'zustaendigkeit', 'verzugszins'] as const;

const RECHNER_KINDER: NavKnoten[] = [
  ...RECHNER_TOP_IDS.flatMap((id) => {
    const k = KATALOG_KARTEN.find((x) => x.id === id);
    return k && istVerfuegbar(k) && k.href ? [link(k.title, k.href)] : [];
  }),
  link('Alle Rechner', '/rechner'),
];

// Vorlagen: die fünf Dokument-Gruppen — je als aufklappbare Gruppe mit ihren
// Vorlagen (nach Dokument-Typ `art`).
const VORLAGEN_KINDER: NavKnoten[] = VORLAGE_SEKTIONEN
  .map((s) => werkzeugGruppe(
    s.title,
    werkzeugeFuer((k) => istVorlage(k) && k.art === s.art),
    VORLAGEN_ANKER(s.id),
  ));

// ─── International: Kanonik + Anker-Abbildung (IA-6 Stufe 2, §11.8 Y-C) ─────
//
// EINE Quelle (§5) für alles, was die frühere Alias-Seite /international
// betraf: die kanonische Säulen-URL, die fünf Sach-Anker und ihre Abbildung
// auf die Ziel-Sektionen der Säule. Konsumenten: die Sidebar-Gruppe hier,
// der Redirect (src/pages/InternationalRedirect.tsx) und die Tore
// (src/tests/international-redirect.test.ts).
//
// Die Abbildung ist heute die IDENTITÄT — die Ziel-Sektionen der Säule werden
// von derselben Komponente gerendert wie zuvor die Alias-Seite
// (InternationalRubriken, §5) und tragen dieselben ids. Sie steht trotzdem
// explizit da: eine spätere Rubrik-Umbenennung hat damit GENAU EINE Stelle,
// und der Test prüft jedes Ziel gegen die real gerenderten ids statt gegen
// eine Annahme (§7 «verifizieren, nicht vertrauen»).

/** Kanonische Säulen-URL der International-Rubrik (Ziel des /international-Redirects). */
export const INTERNATIONAL_SAEULE = '/gesetze?ebene=international';

/** Alt-Pfad, dessen Link-Erbe der Redirect übernimmt. */
export const INTERNATIONAL_ALIAS = '/international';

/** Die fünf Sach-Anker der Sidebar samt Ziel-Anker auf der Säule. */
export const INTERNATIONAL_RUBRIKEN: { label: string; anker: string; zielAnker: string }[] = [
  { label: 'Menschenrechte', anker: 'menschenrechte', zielAnker: 'menschenrechte' },
  { label: 'Int. Privat- & Zivilrecht', anker: 'privat-zivil', zielAnker: 'privat-zivil' },
  { label: 'Rechtshilfe (Haager)', anker: 'rechtshilfe', zielAnker: 'rechtshilfe' },
  { label: 'Schweiz–EU', anker: 'schweiz-eu', zielAnker: 'schweiz-eu' },
  { label: 'EU-Verordnungen (DSGVO u. a.)', anker: 'eu-verordnungen', zielAnker: 'eu-verordnungen' },
];

/** Säulen-URL mit Sach-Anker (leerer Anker → nackte Säule). */
export function saeulenZiel(zielAnker: string): string {
  return zielAnker ? `${INTERNATIONAL_SAEULE}#${zielAnker}` : INTERNATIONAL_SAEULE;
}

/**
 * Hash eines Alt-Links `/international#<anker>` → Hash auf der Säule.
 * Massstab sind ALLE real gerenderten Sektions-ids der Säule
 * (INTERNATIONAL_RUBRIK_IDS, 7 Stück), nicht nur die 5 Sidebar-Rubriken —
 * sonst verliert der Client-Pfad funktionierende Anker, die der Server-308
 * (Browser hängt das Fragment selbst an) erhält (Bug-Check #424, B-1).
 * Unbekannte Anker (Tippfehler, Fremdlinks) verlieren den Hash, statt einen
 * toten Anker weiterzureichen: die Säule ist dann der ehrliche Landeplatz
 * (§8 — kein stiller Sprung ins Leere). Ohne Hash bleibt es ohne Hash.
 */
export function internationalAnkerAbbildung(hash: string): string {
  const roh = decodeURIComponent(hash.replace(/^#/, ''));
  if (!roh) return '';
  return INTERNATIONAL_RUBRIK_IDS.includes(roh) ? roh : '';
}

// Gesetze: «Bund» nach der funktionalen Systematik (systematik.ts) UND «Kantone»
// nach Kanton — beide als gleichartige aufklappbare Untergruppen (Auftrag David
// 20.6.2026: Kantone gleich wie Bund, aufklappbar in die Kantone). Ziel = /gesetze
// mit ?ebene= (Tab-Vorwahl) und Kategorie-Anker «sys-<id>» bzw. ?kt=<KT> (Vorwahl).
const GESETZE_KINDER: NavKnoten[] = [
  // D26 · Kernerlasse als DIREKTE Ziele, ohne Zwischenklick. Beschriftet mit dem
  // Kürzel (so schlägt man sie nach); der volle Titel steht im Accessible Name
  // und im `title` — die Sicht-Beschriftung bleibt darin enthalten (WCAG 2.5.3).
  // Die zwölf Systematik-Titel sind damit aus der Leiste raus: sie sind die
  // Gliederung der Bund-Säule und werden dort gezeigt, nicht zweitgeführt.
  ...kernerlasse().map((e) => ({ ...link(e.kuerzel, e.pfad), ariaLabel: `${e.kuerzel} — ${e.titel}` })),
  link('Alle Bundeserlasse', '/gesetze?ebene=bund'),
  {
    art: 'gruppe',
    label: 'Kantone',
    ziel: '/gesetze?ebene=kanton',
    aufklappbar: true,
    standardOffen: false,
    // Ordnung vereinheitlichen (Gesetzes-UX G5 · §4.3.4): die Kantone erscheinen
    // ALPHABETISCH nach Vollnamen — dieselbe Ordnung wie das Kantonsraster der
    // Übersicht, statt der früheren föderalen Standesordnung (BV Art. 1), die der
    // alphabetischen Raster-/Pill-Ordnung widersprach. Vollname statt Code, damit
    // die Liste scannbar ist (David: «sehr unübersichtlich»).
    // IA-7 (§11.5): Erlass-Zahl-Badge an JEDEM Kantonslink — dieselbe Mengen-
    // Ehrlichkeit wie die IA-2-Pills/-Karten (§8): Zahl = Zähler-SSoT,
    // Zustands-Wort = erfassungsgrad.ts (nur konsumiert). 0-Fall: Badge «0»,
    // aria «keine Erlasse» (Wortlaut wie SchweizKarte/AzRegister, O4).
    // Skalierungs-Invariante (§11.0): kein «if kanton === …», nur Ableitung.
    kinder: [...KANTONE]
      .sort((a, b) => KANTON_NAMEN[a].localeCompare(KANTON_NAMEN[b], 'de'))
      .map((kt) => {
        const n = STARTSEITE_ZAEHLER.kantonErlassZahlen[kt] ?? 0;
        const grad = erfassungsgrad(kt, n);
        const wort = STUFE_WORT[grad.stufe];
        const mengen = n === 0 ? 'keine Erlasse' : `${n} ${n === 1 ? 'Erlass' : 'Erlasse'}`;
        return {
          ...link(KANTON_NAMEN[kt], `/gesetze?ebene=kanton&kt=${kt}`),
          zahl: n,
          // Dieselbe Ableitung wie das aria-label darunter — ein Aufruf, zwei
          // Konsumenten (§5). Fehlerbuch-Befund 44: bis hierher war das
          // Zustands-Wort AUSSCHLIESSLICH im Accessible Name, die Seitenleiste
          // zeigte Sehenden nur die nackte Zahl.
          stufe: grad.stufe,
          ariaLabel: `${KANTON_NAMEN[kt]} — ${mengen}, ${wort}`,
        };
      }),
  },
  // International unter «Gesetze» subsumiert (Auftrag David 25.6.2026) — eigene
  // einklappbare Gruppe wie Bund/Kantone. IA-6 Stufe 2 (FAHRPLAN-GESETZES-UX
  // §11.4 Ziff. 3, §11.8 Y-C, W2·5d): Kopf UND Kinder zeigen jetzt auf die
  // KANONISCHE Säule — die Kinder auf `?ebene=international#<anker>`. Damit
  // läuft keine interne Navigation mehr über den Alias (R-SCOPE-4: geteilte Nav
  // ausserhalb Gesetze.tsx); /international selbst bleibt als Alt-Link-Erbe
  // auflösbar, aber nur noch als Redirect (vercel.json 308 + InternationalRedirect).
  {
    art: 'gruppe',
    label: 'International',
    ziel: INTERNATIONAL_SAEULE,
    aufklappbar: true,
    standardOffen: false,
    kinder: INTERNATIONAL_RUBRIKEN.map((r) => link(r.label, saeulenZiel(r.anker))),
  },
];

// Rechtsprechung (D26): die Sachgebiete stehen DIREKT in der Leiste, jedes mit
// seiner Entscheid-Zahl, dazu die Leitentscheide. Ordnung, Beschriftung und Zahl
// kommen aus dem Zähler-Generat (`gen:zaehler`, Drift-Tor `check:zaehler`), das
// nach derselben Regel zählt wie die Sachgebiets-Kacheln der Übersicht
// (`zaehleSachgebiete`, Verweise raus) — es gibt keine zweite Zähl-Wahrheit (§5)
// und keine Zahl ohne Einheit im Accessible Name (§8/O4).
// 'international' ist die Sach-Achse der Staatsverträge, nicht der Rechtsprechung;
// kein Entscheid trägt es, und das Generat lässt leere Sachgebiete darum weg.
const RECHTSPRECHUNG_KINDER: NavKnoten[] = [
  ...STARTSEITE_ZAEHLER.rechtsprechungSachgebiete.map((g) => ({
    ...link(g.label, `/rechtsprechung?rg=${g.id}`),
    zahl: g.anzahl,
    ariaLabel: `${g.label} — ${g.anzahl} ${g.anzahl === 1 ? 'Entscheid' : 'Entscheide'}`,
  })),
  {
    ...link('Leitentscheide', '/rechtsprechung?leit=1'),
    zahl: STARTSEITE_ZAEHLER.rechtsprechungLeitentscheide,
    ariaLabel: `Leitentscheide — ${STARTSEITE_ZAEHLER.rechtsprechungLeitentscheide} Entscheide`,
  },
];

// Materialien (D26): die Behörden direkt, mit ihrer erfassten Zahl, dazu «Alle
// Materialien». Reihenfolge/Zahl aus demselben Zähler-Generat wie die
// Behörden-Liste der Startseite (§5); Behörden ohne Eintrag fehlen dort schon,
// erscheinen hier also gar nicht erst (§8 — nie eine 0-Zeile behaupten).
// Ziel je Behörde bleibt der Sprung-Anker der Übersicht: /materialien#b-<id>.
const MATERIALIEN_KINDER: NavKnoten[] = [
  ...STARTSEITE_ZAEHLER.materialienBehoerden.map((b) => ({
    ...link(b.kuerzel, `/materialien#b-${b.id}`),
    zahl: b.anzahl,
    ariaLabel: `${b.kuerzel} — ${b.name}, ${b.anzahl} ${b.anzahl === 1 ? 'Materialie' : 'Materialien'}`,
  })),
  link('Alle Materialien', '/materialien'),
];

// ─── Hauptnavigation ─────────────────────────────────────────────────────────

export const NAVIGATION: NavAbschnitt[] = [
  // «Recherche» bewusst entfernt (Auftrag David 19.6.2026): das Browsen läuft
  // über die Kategorie-Drilldowns (Fristen · Gebühren & Beträge · Vorlagen).
  //
  // Reihenfolge (Startseite V3, I1 — FAHRPLAN §7): Nachschlagen zuerst
  // (Gesetze · Rechtsprechung · Materialien), dann die aktiven Werkzeuge
  // (Rechner · Vorlagen). Rubrik-Kacheln der Startseite iterieren über dasselbe
  // Array (ohne «Start») — eine Landkarte, eine Ordnung.
  { titel: null, kinder: [link('Start', '/')] },
  { titel: 'Gesetze', ziel: '/gesetze', kinder: GESETZE_KINDER },
  { titel: 'Rechtsprechung', ziel: '/rechtsprechung', kinder: RECHTSPRECHUNG_KINDER },
  { titel: 'Materialien', ziel: '/materialien', kinder: MATERIALIEN_KINDER },
  { titel: 'Rechner', ziel: '/rechner', kinder: RECHNER_KINDER },
  { titel: 'Vorlagen', ziel: '/vorlagen', kinder: VORLAGEN_KINDER },
];

// Utility/Meta unten in der Seitenleiste — echte, indexierbare Routen.
export const NAVIGATION_META: NavLink[] = [
  link('Einstellungen', '/einstellungen'),
  link('Methodik', '/methodik'),
  link('Über', '/ueber'),
  link('Kontakt', '/kontakt'),
  link('Datenschutz', '/datenschutz'),
];

/** Alle Blatt-Ziele (flach) — für Tests/Abgleich (keine toten Links). */
export function alleNavLinks(knoten: NavKnoten[] = [
  ...NAVIGATION.flatMap((a) => a.kinder),
  ...NAVIGATION_META,
]): NavLink[] {
  return knoten.flatMap((k) => (k.art === 'link' ? [k] : alleNavLinks(k.kinder)));
}
