// ─── SEO-/Prerender-Metadaten (SSG-Auftrag David 11.6.2026) ────────────────
//
// Dossier: docs/ssg-diagnose.md
//
// Eine Quelle für alles Routen-SEO (§5): das Prerender-Skript
// (scripts/prerender.tsx) injiziert diese Werte beim Build ins statische
// HTML, RouteMeta.tsx führt sie bei Client-Navigation im Browser nach.
// Titel und Beschreibungen kommen WÖRTLICH aus startseiteConfig.ts
// (geprüfte Karten-Inhalte) — hier wird kein Rechtstext formuliert
// (Auftrags-Regel 2: fehlender Text → TODO(David), nie selbst verfassen).

import { ALLE_KARTEN, istVerfuegbar, type CatalogItem } from './startseiteConfig';

/** Kanonischer Ursprung OHNE Slash am Ende. Der spätere Wechsel auf eine
 *  eigene Domain ist GENAU dieser eine Konfigurationswert (Auftrag Phase 3
 *  Ziff. 6) — Canonical, og:url und sitemap.xml leiten alle hieraus ab. */
export const SITE_URL = 'https://lexmetrik.vercel.app';

// ─── I2-Messaging: die EINE Wortlaut-Quelle (FAHRPLAN-STARTSEITE-V3 §6) ──────
// Ab W2·5c ist seo.ts die SSoT für das Startseiten-/Marken-Messaging; index.html,
// KatalogHinweis, Methodik und scripts/og-bild.ts sind Projektionen (Build
// injiziert bzw. importiert). Das Tor check:seo-index erzwingt die Parität
// seo.ts ↔ index.html. Wortlaut VERBINDLICH aus §6; Council-Auflagen 1/2: kein
// Absolutum, der Status-Terminus «geprüft» ist für Inhalte reserviert (nie
// «geprüfte Bausteine»), «Ohne KI» nie als Siegel — nur der gescopte Satz.

// ─── SPRACH-DIÄT (W2·24-DESIGN-IDENTITAET R3, Fahrplan §6 (h)) ──────────────
// Weg sind die beiden SICHTBAREN Nutzenversprechen der Startseite: die H1
// «Schweizer Recht an einem Ort» und die Subline «… miteinander verzahnt …».
// Beide behaupteten eine Eigenschaft, statt den Bestand zu bezeichnen; «an einem
// Ort» und «verzahnt» sind genau die Wendungen, die §5 des Fahrplans als
// Slogan-Sprache benennt. An ihrer Stelle steht der Titelblatt-Begriff und eine
// AUFZÄHLUNG. Die SEO-Träger unten (`SITE_TITEL`/`SITE_DESCRIPTION`) sind
// gekürzt, nicht getilgt — sie sind an `check:seo-index` und an index.html
// gebunden, und eine Seite ohne Suchbegriffe im Titel findet niemand.

// SAMMLUNG_TITEL («Sammlung», Titelblatt-Begriff/H1) ist mit D39 (David
// 7.9.2026: «entferne oberhalb der begrüssung das wort Sammlung») ENTFALLEN
// — die BEGRÜSSUNG ist jetzt die H1 (`start/SuchBlock.tsx`), kein zweites
// Wort trägt den Rang. Kein anderer Konsument blieb übrig (Minimalismus,
// `.claude/rules/schichtentrennung.md`): die Konstante ist gestrichen statt
// unbenutzt bewacht. `SAMMLUNG_BESTAND` (Aufzählung im Seitenfuss) ist davon
// unberührt.
/** Was in der Sammlung steht, als Aufzählung (Bezeichnung, kein Versprechen). */
export const SAMMLUNG_BESTAND =
  'Gesetze, Entscheide, Materialien, Rechner, Vorlagen.';
/** Vertrauens-Fuss, erster Satz — gescopter Anti-KI-Satz (§6, Auflage 1). */
export const VERTRAUENS_SATZ =
  'Kein Sprachmodell schätzt Ergebnisse: gerechnet wird nach festen Regeln, der Rechenweg ist offengelegt, Normen sind mit der amtlichen Sammlung verlinkt.';
/** Vertrauens-Fuss, zweiter Satz — ehrlicher Status ohne «geprüft»-Absolutum (§6). */
export const STATUS_SATZ =
  'Der Prüfstand jedes Eintrags ist ausgewiesen; noch nicht fachlich Abgenommenes ist als Entwurf gekennzeichnet.';
/** Kompakte, gescopte Methodik-Zeile (KatalogHinweis, og-Claim) — enthält den
 *  stabilen Kern «nach festen Regeln». */
export const SITE_KURZFORM = 'Gerechnet wird nach festen Regeln, mit offengelegtem Rechenweg.';

/** Globaler Titel/Description — aus dem I2-Material (§6) abgeleitet; index.html
 *  spiegelt genau diese Werte (Tor check:seo-index). */
// Der Seitentitel ist NICHT aus der H1 abgeleitet: ein <title> braucht die
// Suchbegriffe, unter denen die Seite gefunden wird. Darum hier literal — der
// Titel bleibt trotzdem EINE Quelle (index.html spiegelt ihn, Tor
// check:seo-index). W2·24-R3: der Slogan-Teil «Schweizer Recht an einem Ort»
// ist gestrichen, die Suchbegriffe stehen unverändert.
export const SITE_TITEL = 'LexMetrik — Schweizer Gesetze, Rechtsprechung, Materialien, Rechner';
export const SITE_DESCRIPTION =
  'Gesetze von Bund und Kantonen, Bundesgerichtsentscheide und amtliche Materialien der Schweiz, mit Stand und Link zur amtlichen Quelle. Dazu Rechner und Vorlagen.';
/** Kuratierter Social-Share-Text der Startseite (og:description) — bewusst mit
 *  dem gescopten Rechen-Satz statt Marketing-Claim. */
export const SITE_OG_DESCRIPTION =
  'Gesetze von Bund und Kantonen, Bundesgerichtsentscheide und amtliche Materialien der Schweiz, dazu Rechner und Vorlagen. Gerechnet wird nach festen Regeln, mit Norm, Link und Stand.';

export interface RouteMetadaten {
  pfad: string;          // z. B. '/rechner/verzugszins'
  titel: string;         // kompletter <title>-Inhalt
  beschreibung: string;  // meta description; auch og:description, wenn kein eigener og-Text
  /** Eigener Social-Share-Text (og:description), wo einer GEPFLEGT ist —
   *  Bug-Check 11.6.2026: die Startseite hat in index.html einen kuratierten,
   *  kürzeren og-Text, den das Prerender nicht überschreiben darf. */
  ogBeschreibung?: string;
  canonical: string;     // absolute URL (SITE_URL + pfad)
  /** Karte, aus der Titel/Beschreibung stammen (statische Seiten: undefined). */
  karte?: CatalogItem;
}

// Mehrere Karten teilen sich eine Route (Hash-Sprungmarken). Gewinner ist die
// Karte OHNE Hash im href; wo alle Karten einen Hash tragen, entscheidet
// dieser Override. TODO(David): Titelwahl der Doppelkarte /rechner/kuendigung
// abnehmen (Alternative: Karte 'lohnfortzahlung').
const DOPPELKARTEN_OVERRIDE: Record<string, string> = {
  '/rechner/kuendigung': 'kuendigung-sperrfristen',
};

// Statische Seiten: Titel nach EINEM Schema «… — LexMetrik». Beschreibungen je
// Seite individuell (Freigabe David 15.6.2026) — faktisch aus dem vorhandenen
// Seitentext destilliert, keine neuen Rechtsaussagen; Datenschutz bleibt ehrlich
// als Entwurf gekennzeichnet.
// Alias-Kanonik (`kanonischerPfad`, IA-6 Stufe 1) ist mit Stufe 2 ENTFALLEN:
// /international ist keine Seite mehr, sondern ein echter Redirect
// (vercel.json 308 + src/pages/InternationalRedirect.tsx, §11.8 Y-C). Damit
// gilt hier wieder ausnahmslos Self-Canonical — jede prerenderte Route
// kanonisiert auf sich selbst, keine Route ist zugleich Redirect-Quelle
// (Tor: src/tests/international-redirect.test.ts). Die Canonical-Kette der
// Query-Säule endet in EINEM Schritt: /international --308--> /gesetze
// ?ebene=international, dessen Seite self-canonical auf /gesetze zeigt
// (die Säule ist eine Sicht DIESER Seite, keine eigene URL-Wahrheit, §5).
const STATISCHE_SEITEN: Record<string, { titel: string; beschreibung: string; ogBeschreibung?: string }> = {
  '/': { titel: SITE_TITEL, beschreibung: SITE_DESCRIPTION, ogBeschreibung: SITE_OG_DESCRIPTION },
  '/rechner': { titel: 'Rechner & Werkzeuge — LexMetrik', beschreibung: 'Alle Rechner von LexMetrik nach Aufgabe gegliedert — Zuständigkeiten, Fristen und Gebühren. Feste Rechenregeln, jede Norm direkt verlinkt, Ergebnisse sofort im Browser.' },
  '/vorlagen': { titel: 'Vorlagen & Dokumente — LexMetrik', beschreibung: 'Rechtsdokumente von LexMetrik aus festen Textbausteinen mit Normbezug — Verträge, Eingaben, Erklärungen und Dokumentmappen, regelbasiert aufgesetzt mit ehrlichen Form-Grenzen.' },
  '/gesetze': { titel: 'Schweizer Gesetzessammlung — LexMetrik', beschreibung: 'Volltext der in LexMetrik verwendeten Bundesgesetze und kantonalen Erlasse — geltende Fassung, mit Stand und amtlichem Live-Link. Schnelle Navigation zwischen und innerhalb der Gesetze.' },
  '/rechtsprechung': { titel: 'Rechtsprechung — LexMetrik', beschreibung: 'Ausgewählte Bundesgerichtsentscheide im Volltext, nach Sachgebiet erschlossen und mit den Gesetzen verzahnt. Daten: OpenCaseLaw — massgeblich bleibt die amtliche Fassung. Keine Rechtsberatung.' },
  // IA-6 Stufe 2 (§11.4 Ziff. 3 / §11.8 Y-C, David-Go 3.8.2026): '/international'
  // steht hier NICHT mehr — die Route ist ein Redirect auf die Säule und darf
  // deshalb weder prerendert noch gesitemappt werden (eine Sitemap-URL, die
  // 308 antwortet, ist ein Widerspruch in sich).
  '/materialien': { titel: 'Amtliche Ressourcen / Materialien — LexMetrik', beschreibung: 'Materialien der Gesetzgebung (Botschaften, Vernehmlassungen, kantonale Parlamentsgeschäfte) und Erläuterungen der Verwaltungspraxis (Kreisschreiben, Wegleitungen, Leitfäden, Rundschreiben) — bibliografisch, je mit Live-Link zur amtlichen Fassung und mit den Gesetzen verzahnt. Erläuterungen sind faktisches Soft-Law ohne Gesetzesrang.' },
  '/methodik': { titel: 'Wie LexMetrik rechnet — LexMetrik', beschreibung: 'Wie LexMetrik Fristen, Beträge und Quoten herleitet: gerechnet wird nach festen Regeln, jeder Schritt nachvollziehbar, jede Norm mit der amtlichen Sammlung verlinkt.' },
  '/ueber': { titel: 'Über — LexMetrik', beschreibung: 'Warum es LexMetrik gibt — entstanden bei der Vorbereitung auf die Anwaltsprüfung: überprüfbare, normtreue Rechtsberechnung statt Black Box.' },
  '/kontakt': { titel: 'Kontakt aufnehmen — LexMetrik', beschreibung: 'Fragen, Korrekturen zu einer Berechnung oder einem Baustein, Vorschläge für neue Rechner und Vorlagen — Hinweise auf Fehler sind besonders willkommen.' },
  '/datenschutz': { titel: 'Datenschutzerklärung — LexMetrik', beschreibung: 'Datenschutzerklärung von LexMetrik (Entwurf). Die Eingaben verlassen den Browser nicht — Berechnung und Dokumenterstellung laufen lokal im Gerät.' },
  // QS-UI B14 #670 (5.9.2026): erbte bisher Titel/Canonical der Startseite
  // (kein STATISCHE_SEITEN-Eintrag → metaFuerPfad fiel auf «/» durch). Kein
  // noindex (Muster /abdeckung, /datenschutz: kein Feld dafür im Register).
  '/einstellungen': { titel: 'Einstellungen — LexMetrik', beschreibung: 'Persönliche Vorgaben für LexMetrik — Standard-Kanton, Vorlagen-Detailgrad, Design und Ausgabestil. Bleiben lokal im Browser gespeichert, nichts wird an einen Server übermittelt.' },
  // W2·6c-DECKUNGS-SEITE (§11.5, 12.9.2026): Gegenstück zu /abdeckung — dort
  // «was die Suche durchsucht», hier «wie weit die Entstehungsgeschichte
  // hinterlegt ist». Zwei Seiten, zwei Bestände, kein Doppel-Canonical.
  '/materialien/deckung': { titel: 'Was wir nicht haben — LexMetrik', beschreibung: 'Wie weit die Entstehungsgeschichte der erfassten Erlasse hinterlegt ist — und wo nicht: Fussnoten-Deckung, erfasste Botschaften, Fassungsvergleich ab 2021, Parlamentsverfahren, je Erlass mit Zahl, Stand und amtlicher Quelle.' },
  '/abdeckung': { titel: 'Was ist durchsuchbar — LexMetrik', beschreibung: 'Was die LexMetrik-Suche wirklich durchsucht: Bundeserlasse im Volltext, kantonale Erlasse nach Titel, Bundesgerichts-Leitentscheide und amtliche Materialien — ehrlich offengelegt, mit Live-Link zur amtlichen Fassung.' },
  '/suche': { titel: 'Suche — LexMetrik', beschreibung: 'Volltextsuche über LexMetrik: Gesetzestext, Gesetze, Bundesgerichtsentscheide, amtliche Materialien sowie Rechner und Vorlagen — alle Treffer auf einer Seite, nach Inhaltstyp filterbar, mit teilbarem Deep-Link.' },
};

/** href → Pfad ohne Hash-Sprungmarke. */
function pfadOhneHash(href: string): string {
  const i = href.indexOf('#');
  return i === -1 ? href : href.slice(0, i);
}

/** Routen-Pfad → Karte, deren Titel/Beschreibung die Seite vertritt.
 *  Reihenfolge: Override → hash-loser href → Katalogreihenfolge. */
function kartenProPfad(): Map<string, CatalogItem> {
  const proPfad = new Map<string, CatalogItem>();
  for (const k of ALLE_KARTEN.filter(istVerfuegbar)) {
    if (!k.href) continue; // verfügbar, aber ohne eigene Seite (defensiv)
    const pfad = pfadOhneHash(k.href);
    const override = DOPPELKARTEN_OVERRIDE[pfad];
    if (override) {
      // Override-Karte gewinnt; bis sie kommt, hält ein Platzhalter den Pfad
      if (k.id === override) proPfad.set(pfad, k);
      else if (!proPfad.has(pfad)) proPfad.set(pfad, k);
      continue;
    }
    const bisher = proPfad.get(pfad);
    if (!bisher) { proPfad.set(pfad, k); continue; }
    // hash-loser href schlägt Hash-Karte; sonst bleibt die erste (Katalogreihenfolge)
    if (bisher.href !== pfad && k.href === pfad) proPfad.set(pfad, k);
  }
  return proPfad;
}

/** Alle Prerender-Routen: statische Seiten + ein Pfad je verfügbarer Karte.
 *  Geplante Karten (kein href), Redirect-Routen (/pro, /fachpersonen,
 *  /rechner, /rechner/fristenspiegel) und der Stub /rechner/:slug stehen nie
 *  im Katalog und sind damit automatisch ausgeschlossen. */
/** Katalog-gestützte Routen: ein hash-loser Pfad je verfügbarer Karte.
 *  Single Source (§5) für das Routen-Manifest (src/routesManifest.tsx) und
 *  dessen Gating-Test — App.tsx leitet seine Karten-<Route>s daraus ab, statt
 *  die Pfad-Existenz ein zweites Mal von Hand zu führen. */
export function katalogRouten(): string[] {
  return [...kartenProPfad().keys()];
}

/** Die Karte, die einen Routen-Pfad vertritt — DIESELBE Zuordnung wie Titel,
 *  Beschreibung und Canonical (`kartenProPfad`). RL-12 PR 2 (Befund R3-06):
 *  der Werkzeug-Kopf liest hieraus den Prüfstand, statt einen zweiten Status
 *  zu führen (§5). Ein Schrägstrich am Ende zählt nicht; unbekannter Pfad →
 *  `undefined` (der Kopf rät dann keinen Status). Die Zuordnung ist statisch
 *  (Katalog), darum einmal gebaut und gehalten. */
let kartenCache: Map<string, CatalogItem> | undefined;
export function karteFuerPfad(pfad: string): CatalogItem | undefined {
  const ohneSlash = pfad.length > 1 && pfad.endsWith('/') ? pfad.slice(0, -1) : pfad;
  kartenCache ??= kartenProPfad();
  return kartenCache.get(ohneSlash);
}

export function prerenderRouten(): string[] {
  return [...Object.keys(STATISCHE_SEITEN), ...katalogRouten()];
}

/** Metadaten für einen Routen-Pfad; unbekannte Pfade → null (Aufrufer
 *  entscheidet: Prerender bricht ab, RouteMeta lässt den Head unverändert). */
export function metaFuerPfad(pfad: string): RouteMetadaten | null {
  const statisch = STATISCHE_SEITEN[pfad];
  const canonical = SITE_URL + pfad;
  if (statisch) return { pfad, ...statisch, canonical };
  const karte = kartenProPfad().get(pfad);
  if (!karte) return null;
  return {
    pfad,
    titel: `${karte.title} — LexMetrik`,
    beschreibung: karte.description,
    canonical,
    karte,
  };
}

// ─── JSON-LD (SSG-Etappe E4) ───────────────────────────────────────────────
// Pro Karten-Route ein WebApplication-Objekt — Felder NUR aus Vorhandenem
// (Karte + SITE_URL); isAccessibleForFree ist faktisch korrekt (Free/Pro-
// Zweiteilung aufgehoben, s. startseiteConfig.ts). KEINE FAQPage: im Repo
// existieren keine FAQ-Inhalte (nichts erfinden). Kein aggregateRating/
// offers — keine Daten erfinden, auch wenn Google dann kein Rich Result
// zeigt. Startseite: WebSite + Organization.

export function jsonLdFuerPfad(pfad: string): object | null {
  if (pfad === '/') {
    return {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          name: 'LexMetrik',
          url: `${SITE_URL}/`,
          description: SITE_DESCRIPTION,
          inLanguage: 'de-CH',
        },
        { '@type': 'Organization', name: 'LexMetrik', url: `${SITE_URL}/` },
      ],
    };
  }
  const meta = metaFuerPfad(pfad);
  if (!meta?.karte) return null; // statische Seiten ausser «/»: kein JSON-LD
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: meta.karte.title,
    description: meta.beschreibung,
    url: meta.canonical,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    isAccessibleForFree: true,
    inLanguage: 'de-CH',
    publisher: { '@type': 'Organization', name: 'LexMetrik', url: `${SITE_URL}/` },
  };
}
