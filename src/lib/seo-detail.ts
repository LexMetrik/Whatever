// ─── SEO-Metadaten + Volltext-HTML für Detail-Seiten (W1.1, 25.6.2026) ──────
//
// Dossier: docs/ssg-diagnose.md
// Auftrag: FAHRPLAN-SEO-A11Y-GOVERNANCE.md (W1.1–W1.3 — Detailseiten indexierbar).
//
// SSR-/build-safe: KEIN fetch, KEIN window, KEIN Date.now(). Das Prerender-
// Skript (scripts/prerender.ts) liest die Manifeste + Snapshot-Dateien vom
// Dateisystem und ruft diese reinen Funktionen. Erzeugt indexierbares HTML für
// /gesetze/:ebene/:key und /rechtsprechung/:key — React ERSETZT es clientseitig
// (render-then-replace, kein hydrate, s. docs/ssg-diagnose.md §5), deshalb darf
// das HTML den React-Output nicht matchen; es ist reiner Crawler-/First-Paint-
// Inhalt.
//
// §7/§8: Titel/Meta/JSON-LD NUR aus Strukturfeldern der Manifeste. Der Volltext
// stammt WÖRTLICH aus dem Snapshot (dieselbe kanonische Quelle, die der Reader
// fetcht — keine zweite Wahrheit). KEINE kuratierten Beschreibungen, KEINE
// Geltungsaussage: schema.org legislationLegalForce bleibt aus (keine
// Geltungsaussage ohne positives Datenfeld); legislationDateVersion = gepinnter
// Stand, s. Block unten (snapshot ≠ in Kraft — TODO(David), Welle ab 1.12.2026).

import { SITE_URL, type RouteMetadaten } from './seo';
import { AMTLICHE_FASSUNG, AMTLICHE_FASSUNG_AUFGEHOBEN, AMTLICHE_FASSUNG_NOMEN, MASSGEBLICH_SATZ } from './benennung';
import {
  aufgehobenSeitSatz,
  GELTUNG_UNGEPRUEFT_SATZ,
  naechsteFassungSatz,
  nachfolgerHinweis,
  STAND_UNBEKANNT,
  standausweisSatz,
} from './normtext/erlassKopfText';
import { GEBIET_LABEL } from './normtext/register';
import { GATTUNG_RANG, gattungVon } from './materialien/gattung';
import { erlassAltPfad, erlassPfad } from './normtext/erlassAdresse';
import { ABSCHNITT_TITEL } from './rechtsprechung/abschnitte';
import type { Rechtsgebiet } from './normtext/register';
import type { BrowseErlass } from './normtext/browse-typen';
import type { NormSnapshotDatei } from './normtext/typen';
import type { BrowseEntscheid } from './rechtsprechung/register';
import type { EntscheidSnapshot } from './rechtsprechung/typen';
import type { BrowseMaterial } from './materialien/typen';

export const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Pfad-/URL-brechende Zeichen im Key. Leerzeichen ist NICHT unsicher: die
 *  Datei wird am rohen Key geschrieben, die URL prozentkodiert (→ Vercel
 *  decodiert beim Filesystem-Match). `/ \ # ?` und Steuerzeichen brechen
 *  Pfad oder URL und werden übersprungen statt einen 404-Canonical zu erzeugen. */
// eslint-disable-next-line no-control-regex -- Steuerzeichen 0x00–0x1f sind absichtlich als pfad-/URL-unsicher erfasst
export const KEY_UNSICHER = /[\\/#?]|[\u0000-\u001f]/;

/** sprache-Code → BCP-47 für inLanguage (mechanisch, keine Annahme). */
function inSprache(s: string): string {
  return s === 'de' ? 'de-CH' : s === 'fr' ? 'fr-CH' : s === 'it' ? 'it-CH' : s;
}

/** Gebiet-Label mit Fallback auf die rohe id (statt esc(undefined)→throw bei
 *  einem Manifest-Wert ohne Eintrag in GEBIETE). */
function gebietLabel(g: Rechtsgebiet): string {
  return GEBIET_LABEL[g] ?? g;
}

/** §8-Substanz: hat der Erlass-Snapshot überhaupt Artikel-Volltext? Verhindert
 *  eine als «Volltext» betitelte, aber inhaltsleere (header-only) Detailseite. */
export function erlassHatVolltext(datei: NormSnapshotDatei): boolean {
  return Array.isArray(datei.eintraege) && datei.eintraege.some((a) => a.bloecke.some((b) => b.text.trim().length > 0));
}

/** §8-Substanz: hat der Entscheid eine Regeste ODER mindestens einen Block? */
export function entscheidHatVolltext(snap: EntscheidSnapshot): boolean {
  return (
    Boolean(snap.regeste?.text?.trim()) ||
    (Array.isArray(snap.abschnitte) && snap.abschnitte.some((a) => a.bloecke.some((b) => b.text.trim().length > 0)))
  );
}

// ─── Pfade ─────────────────────────────────────────────────────────────────
// Die Erlass-Adresse leitet EINE Stelle ab (§5): lib/normtext/erlassAdresse.ts
// — inklusive der Prozentkodierung, die Pfad == sitemap-loc == canonical ==
// Dateiname-Basis in einer Form hält. Hier steht nur die Fassade, damit der
// SEO-/Prerender-Weg dieselbe Adresse erzeugt wie der geklickte Link.

export function erlassDetailPfad(e: Pick<BrowseErlass, 'ebene' | 'rechtsgebiet' | 'key'>): string {
  return erlassPfad(e);
}

/** Alt-Adresse eines umgezogenen Erlasses (Befund 45, Entscheid David
 *  29.8.2026) — Quelle des Redirect-Stubs im Prerender. null, wenn der Erlass
 *  nie umgezogen ist (alle Bund-/Kantonserlasse ausser Staatsverträgen). */
export function erlassAltDetailPfad(e: Pick<BrowseErlass, 'ebene' | 'rechtsgebiet' | 'key'>): string | null {
  return erlassAltPfad(e);
}

export function entscheidDetailPfad(e: Pick<BrowseEntscheid, 'key'>): string {
  return `/rechtsprechung/${encodeURIComponent(e.key)}`;
}

function materialDetailPfad(m: Pick<BrowseMaterial, 'key'>): string {
  return `/materialien/${encodeURIComponent(m.key)}`;
}

// ─── Metadaten (mechanisches Template, kein Rechtstext §7) ───────────────────

/** Escapt ein Kürzel für den Einsatz als literales Regex-Teilstück. */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * true, wenn `kuerzel` im `titel` als GANZES Token vorkommt (Wortgrenzen:
 * Anfang/Ende des Titels, Leerzeichen, Klammern, Komma, Schrägstrich,
 * Semikolon, Doppelpunkt, Punkt) — kein Substring-Treffer.
 *
 * Auflage Gegenprüfung PR #721 (5.9.2026): `titel.includes(kuerzel)` matchte
 * `ZEMIS-V` in «…(ZEMIS-Verordnung)» und `Staatenlose` in «…der Staatenlosen»
 * als Substring, obwohl das Kürzel dort kein eigenständiges Wort ist — Folge:
 * die Kürzel-Klammer im <title> fehlte fälschlich komplett. Kein `\b`, weil
 * `\b` an Ziffern-/Umlaut-Rändern versagt (z. B. Kürzel endet auf Ziffer
 * gefolgt von Buchstabe). Ein Bindestrich INNERHALB des Kürzels (z. B.
 * `ZEMIS-V`) zählt als Teil des Kürzels, nicht als Wortgrenze — daher matcht
 * `ZEMIS-V` nicht in `ZEMIS-Verordnung` (das `V` dort ist keine Grenze).
 */
function kuerzelAlsTokenImTitel(titel: string, kuerzel: string): boolean {
  const re = new RegExp(`(^|[\\s(\\[/,;:])${escapeRegex(kuerzel)}(?=$|[\\s)\\]/,;:.])`, 'u');
  return re.test(titel);
}

export function metaFuerErlass(e: BrowseErlass): RouteMetadaten {
  const pfad = erlassDetailPfad(e);
  // Fehlerbuch W2·18 (5.9.2026): Kürzel nicht zweimal in Klammern (EMRK-Titel
  // endet bereits auf «(EMRK)») — Kürzel nur anhängen, wenn es im Titel als
  // GANZES Token vorkommt (nicht als Substring, s. kuerzelAlsTokenImTitel).
  const klammerTeile = [kuerzelAlsTokenImTitel(e.titel, e.kuerzel) ? null : e.kuerzel, e.sr ? `SR ${e.sr}` : null]
    .filter((t): t is string => t !== null);
  const klammer = klammerTeile.length ? ` (${klammerTeile.join(', ')})` : '';
  return {
    pfad,
    titel: `${e.titel}${klammer} — LexMetrik`,
    beschreibung:
      `Volltext von ${e.kuerzel}${e.sr ? ` (SR ${e.sr})` : ''} – ${e.titel}. ` +
      // Gleiche Weiche wie im Volltext-Kopf: leerer `stand` (VD-vd-106879,
      // VD-vd-128150) hiesse sonst «Stand ,» in der indexierten Beschreibung.
      `${e.stand ? `Stand ${e.stand}` : STAND_UNBEKANNT}, mit Live-Link zur amtlichen Fassung. ` +
      // B-6-Nachzug (R2-A, 31.8.2026): dasselbe Nomen wie im interaktiven Kopf.
      // Der SATZ wird gebaut, nicht kopiert — hier trägt er einen Anhang
      // («; keine Rechtsberatung»), für den `MASSGEBLICH_SATZ` nicht passt.
      `Massgeblich ist ${AMTLICHE_FASSUNG_NOMEN}; keine Rechtsberatung.`,
    canonical: SITE_URL + pfad,
  };
}

export function metaFuerEntscheid(e: BrowseEntscheid): RouteMetadaten {
  const pfad = entscheidDetailPfad(e);
  const bge = e.bgeReferenz ? ` (${e.bgeReferenz})` : '';
  return {
    pfad,
    titel: `${e.zitierung}${bge} — LexMetrik`,
    beschreibung:
      `${e.gerichtName}: ${e.zitierung}${bge}, ${e.datum}. ` +
      `Entscheid im Volltext auf LexMetrik, mit den zitierten Normen verzahnt und ` +
      `Live-Link zur amtlichen Fassung. Keine Rechtsberatung.`,
    canonical: SITE_URL + pfad,
  };
}

export function metaFuerMaterial(m: BrowseMaterial): RouteMetadaten {
  const pfad = materialDetailPfad(m);
  const nr = m.nummer ? ` ${m.nummer}` : '';
  return {
    pfad,
    titel: `${m.titel} — ${m.behoerdeKuerzel} — LexMetrik`,
    beschreibung:
      `${m.behoerdeName}: ${m.doktypLabel}${nr} «${m.titel}», Stand ${m.stand}. ` +
      `${GATTUNG_RANG[gattungVon(m.doktyp)]}; mit Live-Link zur amtlichen Fassung ` +
      `und Verzahnung zu den massgebenden Gesetzen. Keine Rechtsberatung.`,
    canonical: SITE_URL + pfad,
  };
}

// ─── JSON-LD ─────────────────────────────────────────────────────────────────
// Erlass: schema.org Legislation + BreadcrumbList. Identitätsfelder
// (legislationIdentifier = SR, name, alternateName, inLanguage, url) plus
// `legislationDateVersion` = das Stand-/Konsolidierungsdatum des gepinnten
// Snapshots (BrowseErlass.stand) — schema.org: "point-in-time at which the
// provided description of the legislation is valid" (eli:version_date), NICHT
// das Verabschiedungsdatum (legislationDate) — NUR wenn es ein valides ISO-Datum ist — zwei
// Registereinträge (VD-vd-106879, VD-vd-128150) tragen `stand: ''`, dort
// bleibt das Feld weg statt ein falsches Datum zu emittieren (QS-VERWENDEN
// V4, 2.9.2026). `legislationLegalForce` bleibt bewusst UNGESETZT: der
// Datensatz trägt keinen POSITIVEN Geltungsstatus — nur die negative
// Aufhebungsmarke `aufgehoben` (aufhebungen.ts), deren blosse ABSENZ laut
// browse-typen.ts als Default "geltend" gilt. Das ist eine Annahme, keine
// Ablesung; eine Geltungsaussage ohne Datengrundlage widerspräche §8. Bleibt
// TODO(David), bis ein echtes positives Feld (z. B. Fedlex inForceStatus)
// im Datensatz existiert.
// Entscheid: NUR BreadcrumbList — schema.org hat keinen validen Gerichtsentscheid-
// Typ; nichts erfinden (§8). Reicher Kopf + Meta tragen die Indexierung.

/** Valides ISO-Datum `YYYY-MM-DD` — Schutz gegen `stand: ''` (zwei VD-Einträge,
 *  gemessen 31.8.2026, siehe erlassKopfText.ts STAND_UNBEKANNT). */
const ISO_DATUM = /^\d{4}-\d{2}-\d{2}$/;

function breadcrumb(stufen: Array<{ name: string; pfad: string }>): object {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: stufen.map((s, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: s.name,
      item: SITE_URL + s.pfad,
    })),
  };
}

export function jsonLdFuerErlass(e: BrowseErlass): object {
  const pfad = erlassDetailPfad(e);
  const legislation: Record<string, unknown> = {
    '@type': 'Legislation',
    name: e.titel,
    alternateName: e.kuerzel,
    inLanguage: inSprache(e.sprache),
    url: SITE_URL + pfad,
    isPartOf: { '@type': 'WebSite', name: 'LexMetrik', url: `${SITE_URL}/` },
  };
  if (e.sr) legislation.legislationIdentifier = e.sr;
  if (ISO_DATUM.test(e.stand)) legislation.legislationDateVersion = e.stand;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      legislation,
      breadcrumb([
        { name: 'Gesetze', pfad: '/gesetze' },
        { name: gebietLabel(e.rechtsgebiet), pfad: '/gesetze' },
        { name: e.kuerzel, pfad },
      ]),
    ],
  };
}

export function jsonLdFuerEntscheid(e: BrowseEntscheid): object {
  const pfad = entscheidDetailPfad(e);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      breadcrumb([
        { name: 'Rechtsprechung', pfad: '/rechtsprechung' },
        { name: e.gerichtName, pfad: '/rechtsprechung' },
        { name: e.nummer, pfad },
      ]),
    ],
  };
}

// Material: schema.org Article (Behörden-Publikation, identitäts-/metadatenbasiert)
// + BreadcrumbList. NUR Identitätsfelder (name, author=Behörde, inLanguage,
// datePublished=Stand, url) — KEINE Geltungs-/Rechtsaussage (§8). Kein
// legislationLegalForce: Soft-Law ist kein Gesetz.
export function jsonLdFuerMaterial(m: BrowseMaterial): object {
  const pfad = materialDetailPfad(m);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        name: m.titel,
        inLanguage: inSprache(m.sprache),
        datePublished: m.stand,
        author: { '@type': 'GovernmentOrganization', name: m.behoerdeName, alternateName: m.behoerdeKuerzel },
        url: SITE_URL + pfad,
        isPartOf: { '@type': 'WebSite', name: 'LexMetrik', url: `${SITE_URL}/` },
      },
      breadcrumb([
        { name: 'Materialien', pfad: '/materialien' },
        { name: m.behoerdeKuerzel, pfad: '/materialien' },
        { name: m.nummer ?? m.doktypLabel, pfad },
      ]),
    ],
  };
}

// Crawler-/First-Paint-HTML der Material-Detailseite (Metadaten + Live-Link, KEIN
// Normtext §7). React ERSETZT es clientseitig (render-then-replace), es muss den
// React-Output also nicht matchen.
export function materialDetailHtml(m: BrowseMaterial): string {
  const nr = m.nummer ? ` ${esc(m.nummer)}` : '';
  return (
    `<article>` +
    `<p>${esc(m.behoerdeKuerzel)} · ${esc(m.doktypLabel)}${nr}</p>` +
    `<h1>${esc(m.titel)}</h1>` +
    `<p>${esc(m.behoerdeName)} · Stand ${esc(m.stand)} · ${esc(inSprache(m.sprache))}</p>` +
    // B-6/B-1-Nachzug (R2-A): dasselbe Nomen und derselbe Link-Name wie in der
    // React-Fläche (`MaterialLeser` → `ui/QuellLink`). Der Pfeil steht hinten
    // (Ä110); «Zur amtlichen Fassung» ist der verworfene Wortlaut.
    `<p>${esc(GATTUNG_RANG[gattungVon(m.doktyp)])}. ${MASSGEBLICH_SATZ}</p>` +
    `<p><a href="${esc(m.quelleUrl)}" rel="noopener noreferrer">${AMTLICHE_FASSUNG} ↗</a></p>` +
    `</article>`
  );
}

// ─── Volltext-HTML (wörtlich aus dem Snapshot) ───────────────────────────────

function bloeckeHtml(
  bloecke: NormSnapshotDatei['eintraege'][number]['bloecke'],
): string {
  let out = '';
  for (const b of bloecke) {
    const marke = b.absatz ? `<sup>${esc(b.absatz)}</sup> ` : '';
    if (b.text) out += `<p>${marke}${esc(b.text)}</p>`;
    else if (b.absatz) out += `<p>${marke}</p>`;
    if (b.items?.length) {
      out += '<ul>' + b.items.map((i) => `<li><b>${esc(i.marke)}</b> ${esc(i.text)}</li>`).join('') + '</ul>';
    }
    if (b.tabelle?.length) {
      out +=
        '<table><tbody>' +
        b.tabelle.map((z) => `<tr><td>${esc(z.beschreibung)}</td><td>${esc(z.betrag)}</td></tr>`).join('') +
        '</tbody></table>';
    }
    if (b.mehrspaltig?.zeilen.length) {
      const kopf = b.mehrspaltig.kopf?.length
        ? '<thead><tr>' + b.mehrspaltig.kopf.map((k) => `<th>${esc(k)}</th>`).join('') + '</tr></thead>'
        : '';
      const zeilen = b.mehrspaltig.zeilen
        .map((z) => '<tr>' + z.map((c) => `<td>${esc(c)}</td>`).join('') + '</tr>')
        .join('');
      out += `<table>${kopf}<tbody>${zeilen}</tbody></table>`;
    }
  }
  return out;
}

/** Volltext-HTML eines Erlasses: Kopf (Identität + Live-Link) + alle Artikel.
 *  Eine <h1>; Artikel als <article><h2>. */
export function erlassVolltextHtml(
  e: BrowseErlass,
  datei: NormSnapshotDatei,
  currency?: { geprueftAm?: string; naechsteFassungAb?: string },
): string {
  const srZeile = e.sr ? ` · SR ${esc(e.sr)}` : '';
  // P1-d: Currency-Angaben schon im prerenderten Kopf (CLS=0, kein async-
  // Einwachsen; §15/2). S3/F5: der WORTLAUT kommt aus `erlassKopfText` — genau
  // dieselbe Funktion, die der interaktive Erlass-Kopf aufruft (§5). Bis dahin
  // waren es zwei handgeschriebene Strings, die im Datumsformat bereits
  // auseinandergelaufen waren (hier ISO, dort TT.MM.JJJJ).
  // `!e.aufgehoben` spiegelt das `lebt`-Gate des interaktiven Kopfs (§5):
  // am aufgehobenen Erlass ist die Aufhebung DIE Aussage, nicht die Nicht-
  // Prüfung (Gegenprüfung 31.8.2026, Befund 5 — sonst divergiert die No-JS-
  // Seite beim ersten aufgehobenen Kantonserlass).
  const geprueft =
    currency?.geprueftAm && !e.aufgehoben
      ? ` · ${esc(standausweisSatz(currency.geprueftAm))}`
      : e.ebene === 'kanton' && !e.aufgehoben
        ? ` · ${esc(GELTUNG_UNGEPRUEFT_SATZ)}`
        : '';
  const kuenftig = currency?.naechsteFassungAb ? ` · ${esc(naechsteFassungSatz(currency.naechsteFassungAb))}` : '';
  const standSegment = e.stand ? `Stand ${esc(e.stand)}` : esc(STAND_UNBEKANNT);
  // Gegenprüfung PR #823/W2·18 (12.9.2026): der Live-Link hiess bis hierher
  // IMMER «amtliche Fassung (geltend)» — auch am GANZ aufgehobenen Erlass
  // (Beleg dist/gesetze/bund/BMV.html). `e.aufgehoben` ist dieselbe Ableitung,
  // die `geprueft`/`kuenftig` zwei Zeilen darüber bereits gatet (§5).
  // Nachtrag Gegenprüfung PR #826 (12.9.2026, A3): der Linktext am
  // aufgehobenen Erlass ist jetzt der KANON `AMTLICHE_FASSUNG_AUFGEHOBEN`
  // (`benennung.ts`, dieselbe Zeichenkette wie `QuellLink(variante:
  // 'aufgehoben')` im Reader) statt eines eigenen Literals; der geltende
  // Zweig bleibt das ungeänderte Alt-Literal — Golden für alle geltenden
  // Erlasse bleibt dadurch unberührt (nur der `e.aufgehoben`-Zweig ändert
  // sich, s. `npm run golden:vergleich` / SHA-256-Diff im PR).
  const linkText = e.aufgehoben ? AMTLICHE_FASSUNG_AUFGEHOBEN : 'amtliche Fassung (geltend)';
  const aufgehobenSegment = e.aufgehoben ? ` · ${esc(aufgehobenSeitSatz(e.aufgehoben.seit))}` : '';
  // A1 (PR #826): `altSr` (die SR-Nummer DIESES Erlasses) entscheidet, ob der
  // Nachfolger denselben SR-Slot trägt (Totalrevision, s. `nachfolgerHinweis`).
  const nachfolgerSegment = e.aufgehoben?.nachfolger
    ? ` · ${esc(nachfolgerHinweis(e.aufgehoben.nachfolger, e.sr))}`
    : '';
  const kopf =
    `<header><nav aria-label="Brotkrumen"><a href="/gesetze">Gesetze</a> › ` +
    `<a href="/gesetze">${esc(gebietLabel(e.rechtsgebiet))}</a> › ${esc(e.kuerzel)}</nav>` +
    `<h1>${esc(e.kuerzel)} — ${esc(e.titel)}</h1>` +
    `<p>${esc(e.kuerzel)}${srZeile} · ${standSegment} · ` +
    `<a href="${esc(e.quelleUrl)}" rel="nofollow noopener" target="_blank">${esc(linkText)}</a>` +
    `${aufgehobenSegment}${nachfolgerSegment}${geprueft}${kuenftig}</p>` +
    `</header>`;
  const artikel = datei.eintraege
    .map((a) => {
      const titel = a.titel ? ` ${esc(a.titel)}` : '';
      return `<article><h2>${esc(a.artikelLabel)}${titel}</h2>${bloeckeHtml(a.bloecke)}</article>`;
    })
    .join('');
  return `<main>${kopf}<section>${artikel}</section></main>`;
}

/** Volltext-HTML eines Entscheids: Kopf (Zitierung/Gericht/Live-Link) + Regeste
 *  (falls vorhanden) + Rubrum + Abschnitte. Eine <h1>. */
export function entscheidVolltextHtml(e: BrowseEntscheid, snap: EntscheidSnapshot): string {
  const bge = e.bgeReferenz ? ` · ${esc(e.bgeReferenz)}` : '';
  const kopf =
    `<header><nav aria-label="Brotkrumen"><a href="/rechtsprechung">Rechtsprechung</a> › ` +
    `<a href="/rechtsprechung">${esc(e.gerichtName)}</a> › ${esc(e.nummer)}</nav>` +
    `<h1>${esc(e.zitierung)}</h1>` +
    `<p>${esc(e.gerichtName)} · ${esc(e.datum)}${bge} · ${esc(gebietLabel(e.sachgebiet))} · ` +
    `<a href="${esc(e.quelleUrl)}" rel="nofollow noopener" target="_blank">amtliche Fassung</a></p>` +
    `</header>`;
  let inhalt = '';
  if (snap.regeste?.text) {
    inhalt += `<section><h2>Regeste</h2><p>${esc(snap.regeste.text)}</p></section>`;
  }
  if (snap.rubrum) {
    const r = snap.rubrum;
    const zeilen = [
      r.parteien ? `<p>${esc(r.parteien)}</p>` : '',
      r.gegenstand ? `<p>Gegenstand: ${esc(r.gegenstand)}</p>` : '',
      r.vorinstanz ? `<p>Vorinstanz: ${esc(r.vorinstanz)}</p>` : '',
    ].join('');
    if (zeilen) inhalt += `<section>${zeilen}</section>`;
  }
  for (const a of snap.abschnitte) {
    const bloecke = a.bloecke
      .map((b) => `<p>${b.marke ? `<b>${esc(b.marke)}</b> ` : ''}${esc(b.text)}</p>`)
      .join('');
    if (bloecke) inhalt += `<section><h2>${esc(ABSCHNITT_TITEL[a.typ] ?? a.typ)}</h2>${bloecke}</section>`;
  }
  return `<main>${kopf}${inhalt}</main>`;
}
