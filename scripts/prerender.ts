// ─── Build-Zeit-Prerender: dist/ → statisches HTML je Route (SSG-E3) ───────
//
// Dossier: docs/ssg-diagnose.md
//
// Läuft als DRITTER Build-Schritt (tsc -b && vite build && vite-node …) und
// schreibt für jede öffentliche Route dist/<pfad>/index.html: gerendertes
// HTML im #root plus routen-individuelle Meta-Tags aus lib/seo.ts (§5).
// Browser-Verhalten unverändert: main.tsx ersetzt den Inhalt per
// createRoot().render() (render-then-replace, Entscheid Freigabe 11.6.2026 —
// KEIN hydrateRoot, Begründung in docs/ssg-diagnose.md §5).
//
// Drift-Tore (brechen den Build):
//  – Route rendert den 404-Marker → Pfad fehlt in App.tsx
//  – HTML < 500 Zeichen (Smoke-Konvention) → Seite leer/kaputt
//  – Routenzahl ≠ deklarierter Zähler → Katalog und Zähler nachführen
//
// Aufruf: npm run prerender (setzt frisches `vite build` voraus)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { jsonLdFuerPfad, metaFuerPfad, prerenderRouten, SITE_URL } from '../src/lib/seo';
import {
  entscheidHatVolltext,
  entscheidVolltextHtml,
  erlassAltDetailPfad,
  erlassDetailPfad,
  erlassHatVolltext,
  erlassVolltextHtml,
  esc,
  jsonLdFuerEntscheid,
  jsonLdFuerErlass,
  KEY_UNSICHER,
  metaFuerEntscheid,
  metaFuerErlass,
  metaFuerMaterial,
  jsonLdFuerMaterial,
  materialDetailHtml,
} from '../src/lib/seo-detail';
import { routenEbene } from '../src/lib/normtext/erlassAdresse';
import { normtextDateiUrl } from '../src/lib/normtext/dateiUrl';
import type { BrowseErlass } from '../src/lib/normtext/browse-typen';
import type { NormSnapshotDatei } from '../src/lib/normtext/typen';
import type { BrowseEntscheid } from '../src/lib/rechtsprechung/register';
import type { EntscheidSnapshotDatei } from '../src/lib/rechtsprechung/typen';
import type { BrowseMaterial } from '../src/lib/materialien/typen';
import { renderRoute } from '../src/entry-server';
import { GRUSS_DATEN_JSON, GRUSS_SKRIPT } from '../src/components/start/Begruessung';

// Deklarierter Routen-Zähler (wie die Katalog-Zähler in den Tests): bei neuen
// Karten/Seiten bewusst im selben Commit nachführen.
// 12.6.2026 (FAHRPLAN-VORLAGEN-AUSBAU V2): +/vorlagen/verjaehrungsverzicht.
// 12.6.2026 (Musterklagen): +/vorlagen/scheidungsklage,
// +/vorlagen/scheidungsbegehren-gemeinsam, +/vorlagen/eheschutzgesuch.
// 13.6.2026 (V2-Rest): +/vorlagen/forderungsabtretung,
// +/vorlagen/fristerstreckung, +/vorlagen/nichtbekanntgabe-betreibung.
// 13.6.2026 (V3): +/vorlagen/auftrag, +/vorlagen/werkvertrag, +/vorlagen/nda,
// +/vorlagen/konkubinat.
// Seit FUNDAMENT-UMBAU Thema B: Die Karten-Routen-EXISTENZ ist primär durch
// src/tests/routenManifest.test.ts gegated (Manifest === katalogRouten()).
// Dieser Zähler bleibt als sekundärer Drift-Backstop (fängt auch statische
// Seiten) — bei neuen Karten/Seiten weiter im selben Commit nachführen.
const ERWARTETE_ROUTEN = 64; // +1: /gesetze (17.6.2026); +1: /rechtsprechung (23.6.2026); +1: /international (24.6.2026); +1: /materialien (27.6.2026); UI-Welle: −/recherche, +/rechner +/vorlagen (netto +1); +4: W2·7 Verzahnungs-Klingen (/rechner/gerichtszitat, /rechner/verjaehrung-board, /rechner/inkasso-strecke, /vorlagen/rubrum); +1: /abdeckung (UI-NAV S3/E1, 11.7.2026); +1: /suche (UI-NAV S5, 11.7.2026); −1: /international (IA-6 Stufe 2, 3.8.2026 — Alias aufgelöst, jetzt 308 auf /gesetze?ebene=international; eine Redirect-Quelle wird weder prerendert noch gesitemappt); +1: /einstellungen (QS-UI B14 #670, 5.9.2026 — fehlte im Register, erbte Startseiten-Meta); +1: /materialien/deckung (W2·6c-DECKUNGS-SEITE, 12.9.2026 — «was wir nicht haben»)
const NOT_FOUND_MARKER = '404 · Nicht gefunden'; // src/pages/NotFound.tsx
// Stub-Tor (Bug-Check 11.6.2026): /rechner/:slug fängt Katalog-hrefs ohne
// dedizierte Route VOR der 404-Seite ab — eine «in Vorbereitung»-Stub-Seite
// darf nie prerendert/gesitemappt werden.
const STUB_MARKER = 'Dieser Rechner ist noch nicht verfügbar'; // src/pages/RechnerStub.tsx
const MIN_ZEICHEN = 500; // Smoke-Konvention (scripts/smoke-render.tsx)

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const ROOT_MARKER = '<div id="root"></div>';
// Die zwei erlaubten Gruss-Skripte der Startseite, exakt so, wie React sie
// rendert (Ausnahme am `<script`-Tor unten).
const GRUSS_SKRIPTE = [
  `<script type="application/json" data-gruss="pools">${GRUSS_DATEN_JSON}</script>`,
  `<script data-gruss="wahl">${GRUSS_SKRIPT}</script>`,
];
const ohneGrussSkripte = (html: string) => GRUSS_SKRIPTE.reduce((h, s) => h.split(s).join(''), html);

const template = readFileSync(join(DIST, 'index.html'), 'utf8');
if (!template.includes(ROOT_MARKER)) {
  throw new Error(
    'dist/index.html enthält keinen leeren #root — erst frisch `vite build` laufen lassen (Prerender nie doppelt anwenden).',
  );
}

// esc kommt aus lib/seo-detail (eine Quelle, §5).

// Unbefüllte Hülle als SPA-Fallback (vercel.json-Rewrite-Ziel): Stub-Routen
// für geplante Rechner und unbekannte Pfade — noindex, weil dünner Inhalt.
writeFileSync(
  join(DIST, 'app.html'),
  template.replace('</head>', '    <meta name="robots" content="noindex" />\n  </head>'),
);
console.log('OK  app.html (unbefüllte Hülle, noindex)');

// Template-Erzeugung aus fertigen Meta/JSON-LD/Inhalt. Single Source für die
// Katalog-Routen (seitenHtml) UND die Detail-Seiten (W1.1, aus den Manifesten).
function rendereTemplate(
  meta: { titel: string; beschreibung: string; ogBeschreibung?: string; canonical: string },
  jsonLd: object | null,
  inhalt: string,
  kontext: string,
  preloads: string[] = [],
): string {
  let out = template;
  out = out.replace(/<title>[^<]*<\/title>/, () => `<title>${esc(meta.titel)}</title>`);
  for (const [re, wert] of [
    [/(<meta name="description" content=")[^"]*(" \/>)/, meta.beschreibung],
    [/(<meta property="og:title" content=")[^"]*(" \/>)/, meta.titel],
    [/(<meta property="og:description" content=")[^"]*(" \/>)/, meta.ogBeschreibung ?? meta.beschreibung],
    [/(<meta property="og:url" content=")[^"]*(" \/>)/, meta.canonical],
    [/(<meta name="twitter:title" content=")[^"]*(" \/>)/, meta.titel],
    [/(<meta name="twitter:description" content=")[^"]*(" \/>)/, meta.ogBeschreibung ?? meta.beschreibung],
  ] as const) {
    if (!re.test(out)) throw new Error(`Meta-Tag-Muster nicht gefunden (${kontext}): ${re}`);
    out = out.replace(re, (_, vor: string, nach: string) => vor + esc(wert) + nach);
  }
  // JSON-LD (E4): nicht-ausführbarer Data-Block, von der CSP (script-src
  // 'self') nicht erfasst; «<» escapen, damit kein </script> im JSON-Inhalt
  // den Block beenden kann.
  const ldTag = jsonLd
    ? `    <script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>\n`
    : '';
  // Vorab-Anforderung der Nutzlast, die diese Seite mit Sicherheit braucht
  // (QS-PERF, 1.9.2026 — Kandidat K2 des Kanton-Reader-Profils in der Variante
  // OHNE zweite Wahrheit). Der Prerender kennt die Pfade zur BAUZEIT aus
  // demselben Manifest, das auch der Client liest; im Client bleibt das
  // Register die einzige Quelle des Dateinamens (§5) — der Preload ist reines
  // Cache-Vorwärmen und beeinflusst KEINE Auswahl. Ein falscher Preload wäre
  // ein 404 im Netzpanel, nie ein falscher Inhalt.
  // WELCHE Dateien vorgeladen werden (und welche bewusst nicht), steht an der
  // Aufrufstelle bei den Erlass-Detailseiten.
  //
  // `as="fetch" crossorigin="anonymous"` ist Absicht: der Client holt die
  // Dateien mit `fetch()` (mode cors, credentials same-origin). Ohne
  // `crossorigin` legte der Preload eine no-cors-Anforderung an, die der
  // spaetere `fetch()` NICHT wiederverwenden koennte — die Datei kaeme zweimal.
  const preloadTags = preloads
    .map((href) => `    <link rel="preload" as="fetch" crossorigin="anonymous" href="${esc(href)}" />\n`)
    .join('');
  out = out.replace(
    '</head>',
    `${preloadTags}    <link rel="canonical" href="${meta.canonical}" />\n${ldTag}  </head>`,
  );
  return out.replace(ROOT_MARKER, () => `<div id="root">${inhalt}</div>`);
}

function seitenHtml(pfad: string, inhalt: string): string {
  const meta = metaFuerPfad(pfad);
  if (!meta) throw new Error(`keine Metadaten für ${pfad} (lib/seo.ts)`);
  return rendereTemplate(meta, jsonLdFuerPfad(pfad), inhalt, pfad);
}

const routen = prerenderRouten();
if (routen.length !== ERWARTETE_ROUTEN) {
  throw new Error(
    `Routenzahl ${routen.length} ≠ deklariert ${ERWARTETE_ROUTEN} — Katalog geändert? Zähler hier im selben Commit nachführen.`,
  );
}

let fehler = 0;
for (const pfad of routen) {
  try {
    const inhalt = await renderRoute(pfad);
    if (inhalt.length < MIN_ZEICHEN) {
      throw new Error(`verdächtig kurzes HTML (${inhalt.length} Zeichen)`);
    }
    if (inhalt.includes(NOT_FOUND_MARKER)) {
      throw new Error('rendert die 404-Seite — Route fehlt in App.tsx');
    }
    if (inhalt.includes(STUB_MARKER)) {
      throw new Error('rendert die Stub-Seite — Katalog-href zeigt auf keinen gebauten Rechner');
    }
    // Prod-Befund 11.6.2026: Suspense-Reste im Prerender-Output (Fallback +
    // <div hidden>-Segment + $RC-Inline-Script) bleiben unter der CSP als
    // sichtbares «Wird geladen …» stehen — der Zwei-Pass-Render in
    // entry-server muss sauberes, script-freies HTML liefern.
    // AUSNAHME, eng (16.9.2026, QS-PERF «Gruss pro Besuch»): die Startseite
    // trägt GENAU zwei bekannte <script> hinter der Gruss-h1 — den JSON-
    // Datenblock und das konstante, per sha256 in der CSP freigegebene
    // Wahl-Skript (`components/start/Begruessung.tsx`). Nur diese beiden,
    // Zeichen für Zeichen, werden vor der Prüfung herausgenommen; jedes andere
    // <script> (etwa ein $RC-Suspense-Rest) schlägt weiterhin an.
    if (ohneGrussSkripte(inhalt).includes('<script')) {
      throw new Error('Inline-Script im gerenderten HTML — Suspense-Segment statt synchronem Render (entry-server-Zwei-Pass prüfen)');
    }
    if (inhalt.includes('Wird geladen')) {
      throw new Error('Suspense-Fallback im gerenderten HTML — eine lazy()-Grenze hat nicht aufgelöst');
    }
    // Flache <pfad>.html-Dateien (nicht <pfad>/index.html): vite preview
    // (sirv) löst extensionslose URLs über die .html-Erweiterung auf,
    // Vercel über "cleanUrls": true — lokal und prod dasselbe Verhalten,
    // empirisch geprüft 11.6.2026 (Verzeichnis-Index löste sirv NICHT auf).
    const ziel = pfad === '/' ? join(DIST, 'index.html') : join(DIST, `${pfad}.html`);
    mkdirSync(dirname(ziel), { recursive: true });
    writeFileSync(ziel, seitenHtml(pfad, inhalt));
    console.log(`OK  ${pfad} (${inhalt.length} Zeichen)`);
  } catch (e) {
    fehler++;
    console.error(`FEHLER  ${pfad}:`, e);
  }
}
if (fehler > 0) {
  console.error(`\n${fehler} Route(n) mit Prerender-Fehler`);
  process.exit(1);
}

// ─── Detail-Seiten (W1.1): /gesetze/:ebene/:key + /rechtsprechung/:key ──────
// Indexierbares Volltext-HTML aus den Manifesten + Snapshots (dieselbe Quelle,
// die der Reader fetcht — §7); React ersetzt es clientseitig (render-then-
// replace). Bund + kantonale Erlasse (Keys mit Leerzeichen: Datei am ROHEN Key,
// URL prozentkodiert → Vercel decodiert beim Filesystem-Match) + alle Entscheide.
const PUBLIC = join(ROOT, 'public');
const erlassManifest = (
  JSON.parse(readFileSync(join(PUBLIC, 'normtext', 'register.json'), 'utf8')) as { erlasse: BrowseErlass[] }
).erlasse;
const entscheidManifest = (
  JSON.parse(readFileSync(join(PUBLIC, 'rechtsprechung', 'register.json'), 'utf8')) as { entscheide: BrowseEntscheid[] }
).entscheide;
const materialManifest = (
  JSON.parse(readFileSync(join(PUBLIC, 'materialien', 'register.json'), 'utf8')) as { materialien: BrowseMaterial[] }
).materialien;
// P1-d: Currency-Sidecar für die prerenderten Kopf-Chips (fehlt sie, kein Chip).
const currencyMap = ((): Record<string, { geprueftAm?: string; naechsteFassungAb?: string }> => {
  try {
    return JSON.parse(readFileSync(join(PUBLIC, 'normtext', 'currency.json'), 'utf8'));
  } catch {
    return {};
  }
})();

const snapshotErlasse = erlassManifest.filter((e) => e.status === 'snapshot');
// Verweis-Einträge (vollständiges Urteil zu einem BGE) haben kein eigenes File —
// sie sind Deep-Links auf die BGE-Detailseite, KEINE eigene prerenderte Seite.
const snapshotEntscheide = entscheidManifest.filter((e) => e.bestand === 'snapshot' && !e.verweis);

// Absoluter Floor: fängt stilles Schrumpfen des Input-Manifests (eine fehlerhafte
// Regenerierung), das der relative geschrieben+übersprungen===total-Check allein
// NICHT sieht. Bei gewolltem grossem Datenabbau bewusst senken (wie ERWARTETE_ROUTEN).
const ERLASS_FLOOR = 1400; // aktuell 1458 snapshot (227 Bund + 1231 Kanton; nachgeführt 29.8.2026)
// Bewusst gesenkt 26.6.2026: «Leitentscheid» strikt auf amtliche BGE eingeengt (§8) →
// der aufgeblähte 610er-Korpus (96 % falsch etikettiert) wich 327 ehrlichen Einträgen
// (272 amtliche BGE + 55 routine). Floor unter dem neuen Ist, fängt weiter echte Verluste.
const ENTSCHEID_FLOOR = 300; // aktuell 327 snapshot (272 BGE + 25 bger + 30 kantonal)
// Materialien (27.6.2026): jeder Eintrag bekommt eine Metadaten-/Live-Link-Detailseite
// (kein Volltext, §7). Floor unter dem Ist, fängt stilles Register-Schrumpfen.
const MATERIAL_FLOOR = 20; // aktuell 28 (7 Behörden)
if (
  snapshotErlasse.length < ERLASS_FLOOR ||
  snapshotEntscheide.length < ENTSCHEID_FLOOR ||
  materialManifest.length < MATERIAL_FLOOR
) {
  console.error(
    `\nManifest-Schrumpfung: Erlasse ${snapshotErlasse.length} (Floor ${ERLASS_FLOOR}), ` +
      `Entscheide ${snapshotEntscheide.length} (Floor ${ENTSCHEID_FLOOR}), ` +
      `Materialien ${materialManifest.length} (Floor ${MATERIAL_FLOOR}) — Register prüfen.`,
  );
  process.exit(1);
}

// Distinkte Zielpfade: ein doppelter Key würde sonst still die erste Datei
// überschreiben, während die URL-Zählung weiter stimmt.
const geschriebeneZiele = new Set<string>();
function schreibeDetail(ziel: string, html: string): void {
  if (geschriebeneZiele.has(ziel)) throw new Error(`doppelter Zielpfad ${ziel} (doppelter Key im Manifest?)`);
  geschriebeneZiele.add(ziel);
  mkdirSync(dirname(ziel), { recursive: true });
  writeFileSync(ziel, html);
}

/**
 * Redirect-Stub für eine umgezogene Alt-Adresse (Befund 45, Entscheid David
 * 29.8.2026 «ja, mit Weiterleitungen»).
 *
 * WARUM KEIN `meta refresh` — gemessen, nicht überlegt. Die erste Fassung war
 * genau das: ein minimales Dokument mit `<meta http-equiv="refresh">`. Der
 * e2e-Wächter `international-adresse-b45.e2e.ts` wies sie zurück, weil der
 * Fragment-Teil dabei VERLOREN geht: `…/bund/CISG#art-35` landete auf
 * `…/international/CISG` — ohne Artikel, also am Erlass-Anfang. Der Browser
 * hängt den ursprünglichen Hash nur dann an, wenn er einer echten HTTP-Location
 * folgt; einem `meta refresh` auf eine hash-lose URL folgt er wörtlich. Genau
 * solche Deep-Links stehen in versendeten Rechtsschriften (§1).
 *
 * Der Stub ist deshalb die normale App-Hülle: sie bootet, und der
 * Client-Redirect (`gesetz-leser/adressUmzug.ts`) springt MIT Anker und Query.
 * Was den Stub von einer echten Seite unterscheidet, sind drei Dinge — er trägt
 * `canonical` auf die NEUE Adresse, `robots noindex,follow` (der Link zählt,
 * die Seite nicht) und statt des Volltexts nur einen sichtbaren Link. Kein
 * zweiter Gesetzestext unter einer zweiten URL (§5), und ohne JavaScript bleibt
 * die Seite trotzdem benutzbar.
 */
function umzugsStub(altPfad: string, canonical: string, titel: string): string {
  const hinweis =
    `<p>Diese Adresse (<code>${esc(altPfad)}</code>) ist umgezogen.` +
    ` <a href="${esc(canonical)}">Weiter zur geltenden Adresse</a>.</p>`;
  const html = rendereTemplate(
    {
      titel,
      beschreibung: 'Diese Adresse ist umgezogen — weiter zur geltenden Adresse des Erlasses.',
      canonical,
    },
    null,
    hinweis,
    altPfad,
  );
  return html.replace('</head>', '    <meta name="robots" content="noindex, follow" />\n  </head>');
}

const gesetzeUrls: string[] = [];
const rechtsprechungUrls: string[] = [];
const materialienUrls: string[] = [];
let erlassUebersprungen = 0;
let entscheidUebersprungen = 0;
let materialUebersprungen = 0;
let detailFehler = 0;

for (const e of snapshotErlasse) {
  try {
    if (KEY_UNSICHER.test(e.key)) {
      console.warn(`SKIP  /gesetze: Key pfad-/URL-unsicher: ${JSON.stringify(e.key)}`);
      erlassUebersprungen++;
      continue;
    }
    if (!e.datei) {
      console.warn(`SKIP  ${erlassDetailPfad(e)}: status snapshot ohne datei`);
      erlassUebersprungen++;
      continue;
    }
    const datei = JSON.parse(readFileSync(join(PUBLIC, 'normtext', e.datei), 'utf8')) as NormSnapshotDatei;
    if (!erlassHatVolltext(datei)) {
      // header-only «Volltext» wäre irreführend (§8) und thin content (W1.5) → nicht indexieren
      console.warn(`SKIP  ${erlassDetailPfad(e)}: kein Artikel-Volltext`);
      erlassUebersprungen++;
      continue;
    }
    const inhalt = erlassVolltextHtml(e, datei, currencyMap[e.key]);
    if (inhalt.includes('<script')) throw new Error('Inline-Script im Erlass-Volltext — Builder prüfen');
    const meta = metaFuerErlass(e);
    // Register und Struktur-Sidecar in den Kopf vorziehen. Ohne sie laufen sie
    // erst nach den seriellen Chunk-Wellen an (CDP-Wasserfall 1.9.2026,
    // /gesetze/bund/OR @4× CPU + langsames 4G: Register ab 2672 ms, Struktur ab
    // 3923 ms von 10 009 ms).
    // `e.ebene` ist die DATEN-Ebene (die Route kann abweichen, Befund 45) —
    // genau die, die `datenEbeneVonRoute()` im Client herstellt.
    //
    // ── WARUM DER SNAPSHOT SELBST NICHT DABEI IST (Messbefund 1.9.2026) ───────
    // `/normtext/${e.datei}` ist der grösste Posten (OR: 344 KB gzip) und wurde
    // am spätesten angefordert (ab 5215 ms) — er wäre der lohnendste Preload.
    // Er ist bewusst NICHT hier: mit ihm im Kopf fallen **20 Leser-Specs** in 8
    // Dateien (Scroll-Spy, TOC-Ruhe, Weiterlesen-Chip, Kopf-Geometrie,
    // Ortsangabe, Split-View-Faltung). Isoliert und dreifach belegt, je 49 Tests
    // desselben Satzes, lokal, nichts sonst laufend:
    //   Basis-Stand cd4dc65cb                          49 passed
    //   + Shell-Fix, ohne Preload                      49 passed
    //   + Preload Register/Struktur (dieser Stand)     49 passed
    //   + Preload Register/Struktur/SNAPSHOT           29 passed, 20 failed
    // Symptome u. a.: der Scroll-Spy schreibt die gelesene Stelle nie
    // (`localStorage` bleibt null, Timeout 20 s) und der Abstand Kopf→Artikel
    // wandert um 44 px. Der Preload verschiebt damit nicht nur das WANN, er
    // ändert die Reihenfolge, in der der Leser Daten und Rahmen bekommt — und
    // der Leser hängt daran. §15/§1: dort gewinnt die Treue, nicht das Tempo,
    // und §6.3 verbietet, die Specs stattdessen anzupassen.
    // Der eigentliche Fund ist die Reihenfolge-Abhängigkeit im Leser selbst;
    // sie ist als eigener Posten in `fahrplaene/FAHRPLAN-PERFORMANCE.md` §1-N3
    // hinterlegt. Wer sie behebt, kann diesen Preload nachziehen — mit genau
    // diesem Spec-Satz als Beweis.
    const strukturRel = `struktur/${e.ebene}/${e.key}.json`;
    const preloads = ['/normtext/register.json'];
    // Das Struktur-Sidecar ist optional (404 = Leser ohne Gliederung, kein
    // Fehler). Nur vorladen, wenn es existiert — ein Preload auf eine fehlende
    // Datei wäre eine Konsolenwarnung ohne Nutzen.
    // Die URL des Preloads folgt derselben Adress-Regel wie der Fetch im Leser
    // (`normtextDateiUrl`, §5) — sonst zeigte der Preload für die drei
    // Schlüssel mit «%» in der Kanonik auf eine Datei, die es nicht gibt, und
    // der Leser lüde dieselbe Datei ein zweites Mal unter der richtigen
    // Adresse. Der Existenz-Test bleibt am ROHEN Pfad: er fragt das
    // Dateisystem, nicht die Auslieferung.
    if (existsSync(join(PUBLIC, 'normtext', strukturRel))) preloads.push(normtextDateiUrl(strukturRel));
    const html = rendereTemplate(meta, jsonLdFuerErlass(e), inhalt, meta.pfad, preloads);
    // Die Datei liegt unter der ROUTEN-Ebene, nicht unter der Daten-Ebene — sonst
    // stünde die Seite nicht an ihrer eigenen canonical-URL (Befund 45).
    schreibeDetail(join(DIST, 'gesetze', routenEbene(e), `${e.key}.html`), html);
    gesetzeUrls.push(meta.canonical);
    // Alt-Adresse als Redirect-Stub: erreichbar (kein 404), aber nicht in der
    // Sitemap — eine gesitemappte URL, die auf eine andere kanonisiert, ist ein
    // Widerspruch in sich (dieselbe Regel wie bei /international, s. seo.ts).
    // Dateiname am ROHEN Key (wie oben), Adresse im Text prozentkodiert — die
    // beiden Formen fallen bei Bund-Keys zusammen, aber nur eine ist der Pfad.
    const alt = erlassAltDetailPfad(e);
    if (alt) {
      schreibeDetail(join(DIST, 'gesetze', e.ebene, `${e.key}.html`), umzugsStub(alt, meta.canonical, meta.titel));
    }
  } catch (err) {
    detailFehler++;
    console.error(`FEHLER  ${erlassDetailPfad(e)}:`, err);
  }
}
console.log(`OK  ${gesetzeUrls.length} Erlass-Detailseiten (${erlassUebersprungen} übersprungen)`);

for (const e of snapshotEntscheide) {
  try {
    if (KEY_UNSICHER.test(e.key)) {
      console.warn(`SKIP  /rechtsprechung: Key pfad-/URL-unsicher: ${JSON.stringify(e.key)}`);
      entscheidUebersprungen++;
      continue;
    }
    if (!e.datei) {
      console.warn(`SKIP  /rechtsprechung/${e.key}: bestand snapshot ohne datei`);
      entscheidUebersprungen++;
      continue;
    }
    const snap = JSON.parse(
      readFileSync(join(PUBLIC, 'rechtsprechung', e.datei), 'utf8'),
    ) as EntscheidSnapshotDatei;
    const eintrag = snap.eintraege[0];
    if (!eintrag) {
      console.warn(`SKIP  /rechtsprechung/${e.key}: Snapshot ohne eintraege`);
      entscheidUebersprungen++;
      continue;
    }
    if (!entscheidHatVolltext(eintrag)) {
      console.warn(`SKIP  /rechtsprechung/${e.key}: kein Volltext/Regeste`);
      entscheidUebersprungen++;
      continue;
    }
    const inhalt = entscheidVolltextHtml(e, eintrag);
    if (inhalt.includes('<script')) throw new Error('Inline-Script im Entscheid-Volltext — Builder prüfen');
    const meta = metaFuerEntscheid(e);
    const html = rendereTemplate(meta, jsonLdFuerEntscheid(e), inhalt, meta.pfad);
    schreibeDetail(join(DIST, 'rechtsprechung', `${e.key}.html`), html);
    rechtsprechungUrls.push(meta.canonical);
  } catch (err) {
    detailFehler++;
    console.error(`FEHLER  /rechtsprechung/${e.key}:`, err);
  }
}
console.log(`OK  ${rechtsprechungUrls.length} Entscheid-Detailseiten (${entscheidUebersprungen} übersprungen)`);

// Materialien-Detailseiten (Metadaten + Live-Link, KEIN Normtext §7). Jeder Eintrag
// hat einen Live-Link (Pflicht im Register/check) → kein thin-content-Skip nötig.
for (const m of materialManifest) {
  try {
    if (KEY_UNSICHER.test(m.key)) {
      console.warn(`SKIP  /materialien: Key pfad-/URL-unsicher: ${JSON.stringify(m.key)}`);
      materialUebersprungen++;
      continue;
    }
    const inhalt = materialDetailHtml(m);
    if (inhalt.includes('<script')) throw new Error('Inline-Script im Material-HTML — Builder prüfen');
    const meta = metaFuerMaterial(m);
    const html = rendereTemplate(meta, jsonLdFuerMaterial(m), inhalt, meta.pfad);
    schreibeDetail(join(DIST, 'materialien', `${m.key}.html`), html);
    materialienUrls.push(meta.canonical);
  } catch (err) {
    detailFehler++;
    console.error(`FEHLER  /materialien/${m.key}:`, err);
  }
}
console.log(`OK  ${materialienUrls.length} Material-Detailseiten (${materialUebersprungen} übersprungen)`);

// Tore (FAHRPLAN W1.1): (1) unerwartete Exceptions brechen; (2) Vollständigkeit
// — jeder Eintrag ist entweder geschrieben oder BEWUSST übersprungen (kein
// stiller Verlust). Der absolute Floor oben fängt zusätzlich Input-Schrumpfung.
if (detailFehler > 0) {
  console.error(`\n${detailFehler} Detailseite(n) mit unerwartetem Fehler`);
  process.exit(1);
}
if (
  gesetzeUrls.length + erlassUebersprungen !== snapshotErlasse.length ||
  rechtsprechungUrls.length + entscheidUebersprungen !== snapshotEntscheide.length ||
  materialienUrls.length + materialUebersprungen !== materialManifest.length
) {
  console.error('\nVollständigkeits-Drift: geschrieben + übersprungen ≠ Manifest-Menge.');
  process.exit(1);
}

// ─── Sitemaps (W1.1): Index + Teil-Sitemaps ─────────────────────────────────
// sitemap.xml ist jetzt ein Sitemap-INDEX (skaliert auf >1800 URLs). Bewusst
// ohne lastmod (deterministischer Build; kein Datum erfinden — `stand` ist das
// uniforme Fedlex-Konsolidierungsdatum, nicht die echte Änderungszeit, W1.4).
const xmlEsc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
function schreibeUrlset(datei: string, urls: string[]): void {
  writeFileSync(
    join(DIST, datei),
    [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...urls.map((u) => `  <url><loc>${xmlEsc(u)}</loc></url>`),
      '</urlset>',
      '',
    ].join('\n'),
  );
}

const seitenUrls = routen.map((p) => `${SITE_URL}${p === '/' ? '/' : p}`);
const teilSitemaps: Array<{ datei: string; urls: string[] }> = [
  { datei: 'sitemap-seiten.xml', urls: seitenUrls },
  { datei: 'sitemap-gesetze.xml', urls: gesetzeUrls },
  { datei: 'sitemap-rechtsprechung.xml', urls: rechtsprechungUrls },
  { datei: 'sitemap-materialien.xml', urls: materialienUrls },
];
const aktiveSitemaps = teilSitemaps.filter((s) => s.urls.length > 0);
for (const s of aktiveSitemaps) schreibeUrlset(s.datei, s.urls);

writeFileSync(
  join(DIST, 'sitemap.xml'),
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...aktiveSitemaps.map((s) => `  <sitemap><loc>${SITE_URL}/${s.datei}</loc></sitemap>`),
    '</sitemapindex>',
    '',
  ].join('\n'),
);
const gesamtUrls = aktiveSitemaps.reduce((n, s) => n + s.urls.length, 0);
console.log(`OK  sitemap.xml (Index → ${aktiveSitemaps.length} Teil-Sitemaps, ${gesamtUrls} URLs)`);

// robots.txt: Sitemap-Zeile aus SITE_URL anhängen (§5: Domain nur in seo.ts;
// public/robots.txt bleibt domainfrei).
const robots = readFileSync(join(DIST, 'robots.txt'), 'utf8');
writeFileSync(join(DIST, 'robots.txt'), `${robots.trimEnd()}\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
console.log('OK  robots.txt (+Sitemap-Verweis)');

console.log(`\nAlle ${routen.length} Routen prerendered.`);
