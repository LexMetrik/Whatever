// scripts/plan/bildHtml.ts — Darstellungs-Bausteine des Lagebild-Generators
// (Schritt QS-PLAN-BILD, Mehrseiten-Ausbau Go David 4.8.2026).
//
// Hier liegen die geteilten Bausteine ALLER vier Seiten: Design-Tokens/CSS,
// Escaping, Navigations-Leiste, Dokument-Rahmen und die kleinen
// Wiederhol-Bausteine (Kacheln, Tabellen-Container, Status-Punkte).
// Keine Datenbeschaffung, keine Seiten-Inhalte — die liegen in
// `bildDaten.ts` bzw. `bildSeiten.ts`.

/** Text → HTML-Text. Einzige Escaping-Stelle des Generators. */
export function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ---------------------------------------------------------------------------
// Seiten-Register — die vier Seiten und ihre Dateinamen
// ---------------------------------------------------------------------------
/** Die Index-Seite heisst IMMER `plan-bild.html` (bzw. der per `--out`
 *  gewählte Name): App-Kachel und LaunchAgent zeigen auf diesen Anker. Die
 *  drei Zusatzseiten hängen ihr Suffix an DENSELBEN Präfix — so bleiben die
 *  Verweise relativ und funktionieren auch unter `file://`. */
export const SEITEN = [
  { schluessel: 'lagebild', suffix: '', titel: 'Lagebild' },
  { schluessel: 'bau', suffix: '-bau', titel: 'Bau-Details' },
  { schluessel: 'projekt', suffix: '-projekt', titel: 'Projekt & Produkt' },
  { schluessel: 'geschichte', suffix: '-geschichte', titel: 'Geschichte' },
  { schluessel: 'methode', suffix: '-methode', titel: 'Arbeitsweise' },
] as const;

export type SeitenSchluessel = (typeof SEITEN)[number]['schluessel'];

/** Live-Plattform (Prod-Deploy von `main`; Beleg STRUKTUR.md, Prod-Re-Audit 2.8.2026). */
export const LIVE_URL = 'https://lexmetrik.vercel.app';

/** `tmp/plan-bild.html` → `tmp/plan-bild-projekt.html` usw. (voller Pfad). */
export function seitenPfad(indexPfad: string, schluessel: SeitenSchluessel): string {
  const suffix = SEITEN.find((s) => s.schluessel === schluessel)?.suffix ?? '';
  const m = indexPfad.match(/^(.*?)(\.html?)$/i);
  return m ? `${m[1]}${suffix}${m[2]}` : `${indexPfad}${suffix}`;
}

/** Nur der Dateiname — das ist der relative Verweis in der Navigations-Leiste. */
export function seitenDatei(indexPfad: string, schluessel: SeitenSchluessel): string {
  return seitenPfad(indexPfad, schluessel).replace(/^.*\//, '');
}

// ---------------------------------------------------------------------------
// Design-Tokens + Stylesheet (unverändert aus der Ein-Seiten-Fassung
// übernommen, ergänzt um Navigations-Leiste, Tabellen und Kanton-Raster)
//
// Zwei Regeln stehen hier ohne Kommentar im CSS und darum hier:
//  * Gegen horizontales Scrollen wirkt AUSSCHLIESSLICH der `.tabelle`-Container
//    (`overflow-x:auto`). Ein `overflow-x` auf `body` wurde bewusst verworfen:
//    `hidden` erzeugt einen Scroll-Container und setzt die sticky
//    Navigations-Leiste ausser Kraft, `clip` ist ein unnötiges Risiko am
//    selben Ort. Jede breite Fläche gehört stattdessen in ihren eigenen
//    Scroll-Container.
//  * Im Template-Literal sind KEINE Backticks zulässig (sie beenden den
//    String) — Kommentare zum CSS gehören deshalb hierher.
// ---------------------------------------------------------------------------
export const STIL = `
  :root { --paper:#FCFAF6; --raised:#FFFEFC; --ink:#1C1A15; --soft:#4A463C; --faint:#7A7466;
    --line:#E4DFD2; --gold:#8A6D1F; --gold-bg:#F5EEDA; --sage:#4E6B45; --sage-bg:#EAEBE2;
    --slate:#4A5350; --slate-bg:#E9E9E5; --warn:#8A5417; --warn-bg:#F5EBDE; --danger:#A03A28; --danger-bg:#F2E5DD; }
  @media (prefers-color-scheme: dark) { :root { --paper:#16150F; --raised:#201E17; --ink:#ECE8DD;
    --soft:#B8B2A2; --faint:#857E6E; --line:#35311F; --gold:#C9A94E; --gold-bg:#2C2510;
    --sage:#96B38C; --sage-bg:#22251B; --slate:#A9B3AE; --slate-bg:#21231F; --warn:#D9A75B;
    --warn-bg:#312515; --danger:#D98A75; --danger-bg:#2C1D15; } }
  * { box-sizing: border-box; }
  body { background:var(--paper); color:var(--ink); margin:0; line-height:1.55;
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif; }
  .wrap { max-width:1020px; margin:0 auto; padding:2.5rem 1.25rem 5rem; }
  h1,h2,h3 { font-family:Charter,Georgia,Cambria,"Times New Roman",serif; text-wrap:balance; margin:0; }
  h1 { font-size:2.1rem; } h2 { font-size:1.4rem; margin-bottom:.35rem; } h3 { font-size:1.05rem; }
  p { margin:.4rem 0; } section { margin-top:3rem; }
  .lede { color:var(--soft); max-width:46rem; }
  .eyebrow { text-transform:uppercase; letter-spacing:.14em; font-size:.72rem; font-weight:600; color:var(--gold); margin-bottom:.5rem; }
  .sub { color:var(--faint); font-size:.82rem; } .quelle { font-size:.78rem; color:var(--faint); }
  .id { font-size:.75rem; color:var(--faint); font-family:ui-monospace,"SF Mono",Menlo,monospace; }
  header.top { border-bottom:3px double var(--line); padding-bottom:1.4rem; }
  .stand { display:inline-block; font-size:.78rem; letter-spacing:.1em; text-transform:uppercase; color:var(--faint);
    border:1px solid var(--line); border-radius:999px; padding:.15rem .7rem; margin-bottom:.9rem; }
  .lage { font-size:1.12rem; margin-top:.8rem; }
  .tiles { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:.7rem; margin-top:1rem; }
  .tile { background:var(--raised); border:1px solid var(--line); border-radius:6px; padding:.8rem .9rem; }
  .tile b { display:block; font-size:1.5rem; font-variant-numeric:tabular-nums; font-family:Charter,Georgia,serif; }
  .tile span { font-size:.8rem; color:var(--soft); }
  .chip { display:inline-block; font-size:.72rem; font-weight:600; border-radius:999px; padding:.08rem .55rem; white-space:nowrap; vertical-align:middle; }
  .chip.done{background:var(--sage-bg);color:var(--sage);} .chip.ready{background:var(--slate-bg);color:var(--slate);}
  .chip.wip{background:var(--gold-bg);color:var(--gold);} .chip.block{background:var(--danger-bg);color:var(--danger);}
  .chip.gold{background:var(--gold-bg);color:var(--gold);}
  .panel { border:1px solid var(--warn); border-left-width:5px; border-radius:6px; background:var(--warn-bg); padding:1rem 1.2rem; margin-top:1rem; }
  .panel h2 { color:var(--warn); } .panel ul { margin:.5rem 0 0; padding-left:1.2rem; } .panel li { margin:.5rem 0; }
  .liste { list-style:none; margin:1rem 0 0; padding:0; display:flex; flex-direction:column; gap:.55rem; }
  .liste li { background:var(--raised); border:1px solid var(--line); border-radius:6px; padding:.7rem .95rem; display:flex; gap:.6rem; align-items:baseline; }
  ol.queue { margin:1rem 0 0; padding:0; list-style:none; counter-reset:q; display:flex; flex-direction:column; gap:.55rem; }
  ol.queue li { background:var(--raised); border:1px solid var(--line); border-radius:6px; padding:.7rem .95rem .7rem 3rem; position:relative; counter-increment:q; }
  ol.queue li::before { content:counter(q); position:absolute; left:.85rem; top:.72rem; width:1.5rem; height:1.5rem; border-radius:50%;
    background:var(--gold-bg); color:var(--gold); font-weight:700; font-size:.85rem; display:flex; align-items:center; justify-content:center; }
  .phasen { display:flex; flex-direction:column; margin-top:1rem; border-left:2px solid var(--line); }
  .phase { display:grid; grid-template-columns:2rem 1fr; gap:.5rem; padding:.45rem .6rem .45rem 0; }
  .phase .dot { width:.9rem; height:.9rem; border-radius:50%; border:2px solid var(--faint); background:var(--paper); margin-left:-.53rem; margin-top:.3rem; }
  .phase.done .dot { background:var(--sage); border-color:var(--sage); }
  .phase.now { background:var(--gold-bg); border-radius:0 6px 6px 0; }
  .phase.now .dot { background:var(--gold); border-color:var(--gold); }
  .phase .t { font-size:.92rem; } .phase .t .sub { display:block; }
  .cards { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:.8rem; margin-top:1rem; }
  .card { background:var(--raised); border:1px solid var(--line); border-radius:6px; padding:.95rem 1.05rem; display:flex; flex-direction:column; gap:.45rem; }
  .card .kopf { display:flex; justify-content:space-between; align-items:baseline; gap:.5rem; }
  .card .zweck { font-size:.88rem; color:var(--soft); flex:1; }
  .bar { height:6px; border-radius:3px; background:var(--slate-bg); overflow:hidden; }
  .bar i { display:block; height:100%; background:var(--sage); }
  .fortschritt { font-size:.78rem; color:var(--faint); font-variant-numeric:tabular-nums; }
  .card .next { font-size:.84rem; }
  details { border-top:1px dashed var(--line); padding-top:.4rem; }
  summary { cursor:pointer; font-size:.78rem; color:var(--faint); }
  summary:focus-visible, .kopier:focus-visible { outline:2px solid var(--gold); outline-offset:2px; }
  details ul { margin:.4rem 0 0; padding:0; list-style:none; font-size:.8rem; display:flex; flex-direction:column; gap:.25rem; }
  details li { display:flex; gap:.45rem; align-items:baseline; }
  .s { width:.55rem; height:.55rem; border-radius:50%; flex:none; position:relative; top:.05rem; }
  .s.done{background:var(--sage);} .s.ready{background:var(--faint);opacity:.45;} .s.block{background:var(--danger);} .s.wip{background:var(--gold);}
  .kopier { font:inherit; font-size:.72rem; font-weight:600; color:var(--gold); background:var(--gold-bg);
    border:1px solid var(--gold); border-radius:999px; padding:.12rem .65rem; cursor:pointer; transition:background .12s,color .12s; }
  .kopier:hover { background:var(--gold); color:var(--paper); }
  .empfehlung { border:1px solid var(--sage); border-left-width:5px; border-radius:6px; background:var(--sage-bg); padding:1rem 1.2rem; margin-top:1rem; }
  .empfehlung .kopier { font-size:.85rem; padding:.3rem .95rem; }
  .card { box-shadow:0 1px 2px rgba(0,0,0,.05); transition:box-shadow .15s; }
  .card:hover { box-shadow:0 3px 12px rgba(0,0,0,.09); }
  /* Wirkungsbereich-Farben (Auftrag David 8.8.2026: Zugehörigkeit sichtbar machen).
     Je Bereich EIN Variablen-Paar; Chips und Karten lesen dieselben Variablen. */
  .bz-ui{--bz:#31597B;--bz-bg:#E4EDF5;} .bz-logik{--bz:#8A3040;--bz-bg:#F5E3E6;}
  .bz-daten{--bz:#3F6B2F;--bz-bg:#E7F0DF;} .bz-halt{--bz:#5C4A80;--bz-bg:#ECE6F4;}
  .bz-ausl{--bz:#2E6B64;--bz-bg:#E0EFEC;} .bz-ki{--bz:#8A6D1F;--bz-bg:#F5EEDA;}
  .bz-rest{--bz:#4A5350;--bz-bg:#E9E9E5;}
  @media (prefers-color-scheme: dark) {
    .bz-ui{--bz:#8FB6D6;--bz-bg:#1A2530;} .bz-logik{--bz:#D9909C;--bz-bg:#2C171B;}
    .bz-daten{--bz:#9CC287;--bz-bg:#1F2718;} .bz-halt{--bz:#B5A5D8;--bz-bg:#241E30;}
    .bz-ausl{--bz:#8EC4BC;--bz-bg:#17302C;} .bz-ki{--bz:#C9A94E;--bz-bg:#2C2510;}
    .bz-rest{--bz:#A9B3AE;--bz-bg:#21231F;}
  }
  .chip.bz { background:var(--bz-bg); color:var(--bz); }
  .card.bz { border-left:4px solid var(--bz); }
  .card.bz h3 { color:var(--bz); }
  footer { margin-top:3rem; border-top:1px solid var(--line); padding-top:1rem; font-size:.8rem; color:var(--faint); }
  .hinweis { font-size:.82rem; color:var(--faint); margin-top:.6rem; }
  #toast { position:fixed; bottom:1rem; left:50%; transform:translateX(-50%); background:var(--ink); color:var(--paper);
    border-radius:6px; padding:.5rem 1rem; font-size:.85rem; opacity:0; transition:opacity .2s; pointer-events:none; }
  a { color:var(--gold); text-decoration-thickness:1px; text-underline-offset:2px; }
  a:focus-visible { outline:2px solid var(--gold); outline-offset:2px; }
  .springen { font-size:.82rem; color:var(--faint); margin-top:.9rem; display:flex; flex-wrap:wrap; gap:.4rem; align-items:center; }
  .springen a { color:var(--soft); text-decoration:none; border:1px solid var(--line); border-radius:999px; padding:.12rem .65rem; background:var(--raised); }
  .springen a:hover { border-color:var(--gold); color:var(--gold); }
  html { scroll-behavior:smooth; }
  @media (prefers-reduced-motion: reduce) { html { scroll-behavior:auto; } }
  #filter { font:inherit; font-size:.9rem; color:var(--ink); background:var(--raised); border:1px solid var(--line);
    border-radius:6px; padding:.5rem .8rem; width:100%; max-width:26rem; margin-top:1rem; }
  #filter:focus-visible { outline:2px solid var(--gold); outline-offset:1px; }
  /* --- Navigations-Leiste (Mehrseiten-Ausbau 4.8.2026) --------------------- */
  nav.haupt { position:sticky; top:0; z-index:10; background:var(--raised); border-bottom:1px solid var(--line); }
  nav.haupt .inner { max-width:1020px; margin:0 auto; padding:.5rem 1.25rem; display:flex; flex-wrap:wrap;
    align-items:center; gap:.35rem .5rem; }
  nav.haupt .marke { font-family:Charter,Georgia,serif; font-weight:700; letter-spacing:.02em; margin-right:.5rem; }
  nav.haupt a.seite { font-size:.85rem; color:var(--soft); text-decoration:none; border:1px solid transparent;
    border-radius:999px; padding:.2rem .7rem; }
  nav.haupt a.seite:hover { background:var(--slate-bg); }
  nav.haupt a.seite[aria-current="page"] { color:var(--gold); background:var(--gold-bg); border-color:var(--gold); font-weight:600; }
  nav.haupt a.live { margin-left:auto; font-size:.82rem; font-weight:600; color:var(--sage); background:var(--sage-bg);
    border:1px solid var(--sage); border-radius:999px; padding:.2rem .8rem; text-decoration:none; }
  nav.haupt a.live:hover { filter:brightness(1.05); }
  /* --- Tabellen: immer im eigenen Scroll-Container, nie die Seite schieben -- */
  .tabelle { overflow-x:auto; margin-top:.6rem; border:1px solid var(--line); border-radius:6px; background:var(--raised); }
  .tabelle table { border-collapse:collapse; width:100%; font-size:.82rem; min-width:34rem; }
  .tabelle th, .tabelle td { text-align:left; padding:.35rem .7rem; border-bottom:1px solid var(--line); white-space:nowrap; }
  .tabelle th { color:var(--faint); font-weight:600; font-size:.75rem; text-transform:uppercase; letter-spacing:.06em; }
  .tabelle td.titel { white-space:normal; min-width:16rem; }
  .tabelle tr:last-child td { border-bottom:none; }
  .tabelle td.num { text-align:right; font-variant-numeric:tabular-nums; }
  /* --- Kanton-Raster (26 Felder) ----------------------------------------- */
  .kantone { display:grid; grid-template-columns:repeat(auto-fit,minmax(4.6rem,1fr)); gap:.35rem; margin-top:.8rem; }
  .kantone div { background:var(--raised); border:1px solid var(--line); border-radius:5px; padding:.3rem .45rem; text-align:center; }
  .kantone b { display:block; font-size:.95rem; font-variant-numeric:tabular-nums; }
  .kantone span { font-size:.7rem; color:var(--faint); letter-spacing:.06em; }
  .kantone div.leer b { color:var(--faint); opacity:.5; }
  /* --- Gruppen-Listen (Werkzeug-Katalog, Zeitachse, Glossar) -------------- */
  .gruppe { margin-top:1.2rem; }
  .gruppe > h3 { display:flex; justify-content:space-between; align-items:baseline; gap:.5rem; border-bottom:1px solid var(--line); padding-bottom:.25rem; }
  ul.eintraege { list-style:none; margin:.5rem 0 0; padding:0; display:grid; grid-template-columns:repeat(auto-fill,minmax(15rem,1fr)); gap:.2rem .8rem; font-size:.85rem; }
  ul.eintraege li { display:flex; gap:.45rem; align-items:baseline; }
  dl.glossar { margin:1rem 0 0; }
  dl.glossar dt { font-weight:600; margin-top:.9rem; }
  dl.glossar dd { margin:.1rem 0 0; color:var(--soft); font-size:.9rem; }
  .zeitachse { margin-top:1rem; }
  .monat { border-left:2px solid var(--line); padding:.15rem 0 .6rem 1rem; }
  .monat > b { font-family:Charter,Georgia,serif; font-size:1rem; }
  .monat ul { margin:.3rem 0 0; padding-left:1.1rem; font-size:.85rem; color:var(--soft); }
  .monat ul li { margin:.12rem 0; }
  /* --- Lagebild «schlank» (8.9.2026): Entscheid-Karten + kompakte Zeilen ---
     Keine neuen Farben — die Karten nutzen die bestehende Ampel-Semantik
     (warn = wartet auf eine Entscheidung, slate = bewusst zurückgestellt). */
  .gate { border:1px solid var(--warn); border-left-width:5px; border-radius:6px; background:var(--warn-bg); padding:.85rem 1.05rem; margin-top:.7rem; }
  .gate h3 { color:var(--warn); font-size:1.02rem; }
  .gate p { margin:.35rem 0; font-size:.92rem; }
  .gate .haengt { color:var(--soft); font-size:.85rem; }
  .zeilen { list-style:none; margin:.9rem 0 0; padding:0; }
  .zeilen li { display:flex; gap:.6rem; align-items:baseline; padding:.5rem .1rem; border-bottom:1px solid var(--line); }
  .zeilen li:last-child { border-bottom:none; }
  .zeilen li > div { flex:1; }
`;

// ---------------------------------------------------------------------------
// Dokument-Rahmen
// ---------------------------------------------------------------------------
/** Navigations-Leiste — vier relative Verweise + Live-Link, aktive Seite markiert. */
export function navigation(indexPfad: string, aktiv: SeitenSchluessel): string {
  const links = SEITEN.map((s) => {
    const href = seitenDatei(indexPfad, s.schluessel);
    const cur = s.schluessel === aktiv ? ' aria-current="page"' : '';
    return `<a class="seite" href="${esc(href)}"${cur}>${esc(s.titel)}</a>`;
  }).join('\n    ');
  return `<nav class="haupt" aria-label="Seiten dieses Lagebilds">
  <div class="inner">
    <span class="marke">LexMetrik</span>
    ${links}
    <a class="live" href="${LIVE_URL}" target="_blank" rel="noopener">Zur Live-Plattform ↗</a>
  </div>
</nav>`;
}

export interface RahmenOpts {
  /** Pfad der INDEX-Seite (`--out`) — Basis für alle relativen Verweise. */
  indexPfad: string;
  aktiv: SeitenSchluessel;
  titel: string;
  watch: number | null;
  inhalt: string;
  /** Optionales Seiten-Skript (nur die Index-Seite braucht eines). */
  skript?: string;
  /** Optionaler Zusatz direkt vor `</body>` (z. B. Toast-Element). */
  nachSpann?: string;
}

/** Vollständiges HTML-Dokument mit Nav, Inhalt und gemeinsamer Fussnote. */
export function rahmen(o: RahmenOpts): string {
  const refresh = o.watch ? `<meta http-equiv="refresh" content="${Math.max(15, Math.min(o.watch, 300))}">` : '';
  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${refresh}
<title>${esc(o.titel)}</title>
<style>${STIL}</style>
</head>
<body>
${navigation(o.indexPfad, o.aktiv)}
<div class="wrap">
${o.inhalt}
</div>
${o.nachSpann ?? ''}
${o.skript ? `<script>\n${o.skript}\n</script>` : ''}
</body>
</html>
`;
}

// ---------------------------------------------------------------------------
// Kleine Wiederhol-Bausteine
// ---------------------------------------------------------------------------
/** Kopfzeile einer Seite: Stand-Stempel, Titel, Einleitung, optionaler Zusatz. */
export function seitenKopf(o: { stand: string; watch: number | null; marke: string; h1: string; lede: string; extra?: string }): string {
  return `<header class="top">
  <span class="stand">${esc(o.marke)} · erzeugt ${esc(o.stand)}${o.watch ? ' · aktualisiert sich selbst' : ''}</span>
  <h1>${esc(o.h1)}</h1>
  ${o.lede ? `<p class="lede">${o.lede}</p>` : ''}
  ${o.extra ?? ''}
</header>`;
}

/** Kachel-Reihe. `wert` ist bereits gezählt; `null` wird als «—» ehrlich gezeigt. */
export function kacheln(items: { wert: number | string | null; label: string }[]): string {
  const inner = items
    .map((i) => `<div class="tile"><b>${esc(String(i.wert ?? '—'))}</b><span>${i.label}</span></div>`)
    .join('\n    ');
  return `<div class="tiles">\n    ${inner}\n  </div>`;
}

/** Tabelle in eigenem Scroll-Container (kein horizontales Scrollen der Seite). */
export function tabelle(kopfzeilen: string[], zeilen: string[][], klassen: string[] = []): string {
  const th = kopfzeilen.map((k) => `<th>${esc(k)}</th>`).join('');
  const tr = zeilen
    .map((z) => `<tr>${z.map((c, i) => `<td${klassen[i] ? ` class="${klassen[i]}"` : ''}>${esc(c)}</td>`).join('')}</tr>`)
    .join('\n');
  return `<div class="tabelle"><table><thead><tr>${th}</tr></thead><tbody>\n${tr}\n</tbody></table></div>`;
}

// ---------------------------------------------------------------------------
// Laien-Block «Was gerade passiert» (Schritt QS-PLAN-BILD-LAGE, Auftrag David
// 5.8.2026: «ich brauche einfachere Sprache um zu verstehen was gerade passiert»)
//
// Drei Bauregeln dieses Blocks:
//
//  * **Jeder Satz steht hier statisch im Code**, gefüllt werden nur die Werte.
//    Kein Modell zur Laufzeit, keine Formulierung aus Repo-Prosa — gleicher
//    Repo-Stand ergibt gleichen Text (§2). Insbesondere werden die `Anlass:`-
//    Texte der ROADMAP NICHT übernommen: sie sind Fachprosa und würden den
//    Zweck des Blocks (Laiensprache) genau verfehlen.
//  * **Keine eigenen Design-Tokens.** Der Block nutzt ausschliesslich
//    bestehende Klassen aus `STIL`. Würde er das Stylesheet ergänzen, änderten
//    sich alle vier Seiten — die drei anderen sollen byte-gleich bleiben.
//  * **Zweitanzeige, nicht zweite Wahrheit (§5).** «Wartet auf David» erscheint
//    weiter unten auch fachlich (Sektion `#david`); beide Fassungen entstehen
//    aus demselben Resolver-Ergebnis, dieser Block verweist auf jene Sektion.
// ---------------------------------------------------------------------------

/**
 * Datei-Fläche → Alltagsbegriff. Statische Zuordnung, längster Präfix gewinnt;
 * ein unbekannter Pfad bleibt UNÜBERSETZT stehen (lieber ein technischer Pfad
 * als ein erfundener Oberbegriff, §8).
 *
 * Die Tabelle beschreibt, was ein Bereich für den Nutzer BEDEUTET, nicht was
 * er technisch enthält — «src/lib» heisst darum «Rechen- und Rechtslogik» und
 * nicht «Bibliotheks-Verzeichnis».
 */
export const FLAECHEN_KLARTEXT: readonly (readonly [string, string])[] = [
  ['scripts/plan', 'Werkzeuge der Bau-Planung'],
  ['scripts/gegenpruefung', 'Werkzeuge der Gegenprüfung'],
  ['scripts', 'Hilfsprogramme hinter den Kulissen'],
  ['src/pages', 'sichtbare Seiten der App'],
  ['src/components', 'Bausteine der Benutzeroberfläche'],
  ['src/lib', 'Rechen- und Rechtslogik'],
  ['src/tests', 'automatische Tests'],
  ['src/index.css', 'Erscheinungsbild der App'],
  ['e2e', 'Klick-Tests im Browser'],
  ['public/normtext', 'gespeicherte Gesetzestexte'],
  ['public/rechtsprechung', 'gespeicherte Gerichtsentscheide'],
  ['public', 'ausgelieferte Dateien'],
  ['daten', 'Rohdaten-Ablage'],
  ['fahrplaene', 'Detailpläne der Baustellen'],
  ['archiv', 'archivierte Detailpläne'],
  ['bibliothek', 'abgelegtes Recherche-Wissen'],
  ['ROADMAP', 'der Projektplan'],
  ['STRUKTUR.md', 'die Projekt-Landkarte'],
  ['CLAUDE.md', 'die Grundregeln des Projekts'],
  ['DESIGN-REGLEMENT.md', 'die Gestaltungsregeln'],
  ['.claude', 'Arbeitsregeln der KI-Sessions'],
  ['.github', 'die Prüfstrasse (automatische Kontrollen)'],
  ['vercel.json', 'die Auslieferung ins Internet'],
  ['package.json', 'die Bau- und Prüfbefehle'],
];

/**
 * Deckt der Tabellen-Eintrag diesen Pfad? Nur an einer TRENNSTELLE — hinter dem
 * Präfix steht das Pfad-Ende oder eines von `/ . -`. Ohne diese Bedingung
 * schluckte «scripts» auch ein künftiges `scriptsammlung/`; mit ihr trägt
 * «ROADMAP» weiterhin `ROADMAP.md` UND `ROADMAP-CHRONIK.md`.
 */
function deckt(pfad: string, praefix: string): boolean {
  if (!pfad.startsWith(praefix)) return false;
  const nach = pfad[praefix.length];
  return nach === undefined || nach === '/' || nach === '.' || nach === '-';
}

/**
 * Pfade → Alltagsbegriffe, ohne Wiederholung und in der Reihenfolge ihres
 * ersten Auftretens. Zwei Pfade desselben Bereichs (`src/pages/**` und
 * `src/pages/gesetze.tsx`) ergeben EINEN Eintrag. Gefüttert wird die Funktion
 * seit dem Plan-Neuschnitt 29.8.2026 aus `feldPfade()`, nicht mehr aus einer
 * je Schritt gepflegten Globliste.
 */
export function flaechenKlartext(globs: readonly string[]): string[] {
  const out: string[] = [];
  for (const glob of globs) {
    const pfad = glob.replace(/[*?{[].*$/, '').replace(/\/+$/, '');
    let treffer: string | null = null;
    let laenge = -1;
    for (const [praefix, wort] of FLAECHEN_KLARTEXT) {
      if (deckt(pfad, praefix) && praefix.length > laenge) {
        treffer = wort;
        laenge = praefix.length;
      }
    }
    const wort = treffer ?? glob;
    if (!out.includes(wort)) out.push(wort);
  }
  return out;
}

/**
 * **Baufeld → die Pfade, für die es steht** (Steuerungs-Diät 29.8.2026).
 *
 * Bis dahin trug JEDER Schritt seine eigene `kollision:`-Globliste — 44 von Hand
 * gepflegte Pfadlisten, aus denen die Anzeige Alltagsbegriffe und
 * Wirkungsbereiche ableitete. Die Listen drifteten gegen den echten Baum und
 * mussten bei jeder Datei-Verschiebung nachgezogen werden. Jetzt nennt der
 * Schritt sein Feld, und die Pfade stehen EINMAL hier (§5).
 *
 * Die Tabelle ist bewusst KEINE vollständige Aufzählung der Fläche, sondern die
 * kanonischen Anker, die für die Anzeige-Ableitung genügen — sie beantwortet nur
 * «welcher Wirkungsbereich» und «welcher Alltagsbegriff», nie «welche Datei».
 * Über Parallelität entscheidet sie nichts: das tut `feld` direkt (aufloesen.ts).
 */
export const FELD_PFADE: Record<string, readonly string[]> = {
  leser: ['src/pages/gesetz-leser', 'src/components/normtext'],
  korpus: ['scripts/normtext', 'public/normtext', 'scripts/fedlex'],
  rechtsprechung: ['scripts/rechtsprechung', 'public/rechtsprechung', 'src/lib/rechtsprechung'],
  suche: ['scripts/datenhaltung', 'src/components/suche'],
  design: ['src/index.css', 'tailwind.config.js', 'DESIGN-REGLEMENT.md', 'src/components'],
  werkzeuge: ['src/lib', 'src/pages'],
  betrieb: ['.github', 'scripts/plan', '.claude'],
  rechtslogik: ['src/lib/vorlagen', 'src/lib/tarif', 'src/data/tarif', 'src/lib/fristenspiegel'],
};

/** Pfad-Anker eines Baufelds; leer bei fehlendem oder unbekanntem Feld (§8: nichts raten). */
export function feldPfade(feld: string | null): readonly string[] {
  return feld ? (FELD_PFADE[feld] ?? []) : [];
}

// ---------------------------------------------------------------------------
// Wirkungsbereiche — «welchen Teil des Projekts berührt dieser Schritt?»
// (Auftrag David 5.8.2026: «klassifiziere in themenbereiche» · «sessions
// kommunizieren mit diesen bezeichnungen»)
//
// Abgeleitet wird MECHANISCH aus denselben Pfad-Ankern (`feldPfade`) wie
// `flaechenKlartext` — eine Wahrheit, zwei Auflösungsgrade (§5): der
// Alltagsbegriff sagt, WAS die Datei ist, der Wirkungsbereich, in welches der
// sechs Themenfelder sie fällt. Eine gepflegte Zweitliste je Schritt gäbe es
// nicht, weil sie still veralten würde — genau daran ist `kollision:` gescheitert.
// ---------------------------------------------------------------------------

/** Auffangkategorie für Pfade ohne Zuordnung — ehrlich benannt statt geraten (§8). */
export const UEBRIGE_TECHNIK = 'Übrige Technik';

/**
 * Die sechs Wirkungsbereiche in KANONISCHER Reihenfolge. Sie bestimmt zugleich
 * die Reihenfolge der Badges: sonst entschiede die zufällige Reihenfolge der
 * Pfad-Anker darüber, wie ein Schritt beschriftet aussieht (§2).
 */
export const WIRKUNGSBEREICHE = [
  'Benutzeroberfläche',
  'Rechtslogik & Berechnungen',
  'Gesetzes- & Urteilsdaten',
  'Datenhaltung',
  'Auslieferung & Prüfstrasse',
  'KI-Arbeitsprozesse',
] as const;

export type Wirkungsbereich = (typeof WIRKUNGSBEREICHE)[number] | typeof UEBRIGE_TECHNIK;

/** Je Bereich ein Laien-Satz — die Definition für die Glossar-Seite. */
export const BEREICH_ERKLAERUNG: readonly (readonly [Wirkungsbereich, string])[] = [
  ['Benutzeroberfläche', 'Alles, was man auf dem Bildschirm sieht und anklickt: Seiten, Formulare, Navigation, Erscheinungsbild.'],
  ['Rechtslogik & Berechnungen', 'Die Rechenkerne der Werkzeuge — Fristen, Streitwerte, Tarife, Vorlagen-Inhalte. Ein Fehler hier wird zu einer falschen Rechtsauskunft.'],
  ['Gesetzes- & Urteilsdaten', 'Das Beschaffen, Speichern und Überwachen der Gesetzestexte und Gerichtsentscheide aus den amtlichen Quellen.'],
  ['Datenhaltung', 'Wo die Daten liegen und wie sie dorthin kommen: Datenbank, Abgleich-Läufe, eingefrorene Vergleichsstände.'],
  ['Auslieferung & Prüfstrasse', 'Der Weg vom fertigen Code zur öffentlichen Plattform — samt den automatischen Prüfungen, die vorher bestehen müssen.'],
  ['KI-Arbeitsprozesse', 'Wie gebaut wird statt was: Projektplan, Detailpläne, Arbeitsregeln der KI-Sessions, abgelegtes Recherche-Wissen.'],
  [UEBRIGE_TECHNIK, 'Technische Flächen, die in keines der sechs Felder fallen — bewusst nicht eingeordnet, statt eine Einordnung zu erfinden.'],
];

/**
 * Pfadpräfix → Wirkungsbereich. Längster Präfix gewinnt (dieselbe Trennstellen-
 * Regel wie `flaechenKlartext`), Mehrfach-Zuordnung eines Schritts ist normal.
 *
 * Zwei Abgrenzungen sind bewusst gesetzt und stehen darum hier:
 *  * `src/lib/normtext` und `src/lib/rechtsprechung` zählen zu den DATEN, nicht
 *    zur Rechtslogik — dort wird geladen und dargestellt, nicht gerechnet.
 *    Jeder andere `src/lib`-Pfad gilt im Zweifel als Rechtslogik, weil eine
 *    zu Unrecht als harmlos einsortierte Rechenfläche der teurere Fehler wäre.
 *  * `scripts/check-*` ist Prüfstrasse, `scripts/plan` Arbeitsprozess,
 *    `scripts/fedlex*`/`scripts/normtext` Daten — «scripts» allein sagt nichts.
 */
export const BEREICH_PFADE: readonly (readonly [string, Wirkungsbereich])[] = [
  ['src/pages', 'Benutzeroberfläche'],
  ['src/components', 'Benutzeroberfläche'],
  ['src/index.css', 'Benutzeroberfläche'],
  ['index.html', 'Benutzeroberfläche'],
  ['tailwind.config.js', 'Benutzeroberfläche'],
  ['DESIGN-REGLEMENT', 'Benutzeroberfläche'],

  ['src/lib', 'Rechtslogik & Berechnungen'],
  ['src/data', 'Rechtslogik & Berechnungen'],

  ['src/lib/normtext', 'Gesetzes- & Urteilsdaten'],
  ['src/lib/rechtsprechung', 'Gesetzes- & Urteilsdaten'],
  ['public/normtext', 'Gesetzes- & Urteilsdaten'],
  ['public/rechtsprechung', 'Gesetzes- & Urteilsdaten'],
  ['scripts/normtext', 'Gesetzes- & Urteilsdaten'],
  ['scripts/rechtsprechung', 'Gesetzes- & Urteilsdaten'],
  ['scripts/fedlex', 'Gesetzes- & Urteilsdaten'],
  ['daten', 'Gesetzes- & Urteilsdaten'],

  ['scripts/datenhaltung', 'Datenhaltung'],
  ['turso', 'Datenhaltung'],
  ['golden', 'Datenhaltung'],

  ['.github', 'Auslieferung & Prüfstrasse'],
  ['vercel.json', 'Auslieferung & Prüfstrasse'],
  ['package.json', 'Auslieferung & Prüfstrasse'],
  ['package-lock.json', 'Auslieferung & Prüfstrasse'],
  ['knip.json', 'Auslieferung & Prüfstrasse'],
  ['scripts/check', 'Auslieferung & Prüfstrasse'],
  ['scripts/gegenpruefung', 'Auslieferung & Prüfstrasse'],
  ['e2e', 'Auslieferung & Prüfstrasse'],
  ['src/tests', 'Auslieferung & Prüfstrasse'],

  ['.claude', 'KI-Arbeitsprozesse'],
  ['scripts/plan', 'KI-Arbeitsprozesse'],
  ['ROADMAP', 'KI-Arbeitsprozesse'],
  ['STRUKTUR.md', 'KI-Arbeitsprozesse'],
  ['CLAUDE.md', 'KI-Arbeitsprozesse'],
  ['fahrplaene', 'KI-Arbeitsprozesse'],
  ['archiv', 'KI-Arbeitsprozesse'],
  ['bibliothek', 'KI-Arbeitsprozesse'],
];

/**
 * Pfade → Wirkungsbereiche, ohne Wiederholung und in kanonischer Reihenfolge.
 * Ein Schritt darf mehrere tragen; ein nicht zuordenbarer Pfad erzeugt «Übrige
 * Technik». Ohne Pfade bleibt die Liste LEER — «kein Feld deklariert» ist etwas
 * anderes als «keinem Bereich zuzuordnen» (§8).
 */
export function wirkungsbereiche(globs: readonly string[]): Wirkungsbereich[] {
  const gefunden = new Set<Wirkungsbereich>();
  for (const glob of globs) {
    const pfad = glob.replace(/[*?{[].*$/, '').replace(/\/+$/, '');
    let treffer: Wirkungsbereich | null = null;
    let laenge = -1;
    for (const [praefix, bereich] of BEREICH_PFADE) {
      if (deckt(pfad, praefix) && praefix.length > laenge) {
        treffer = bereich;
        laenge = praefix.length;
      }
    }
    gefunden.add(treffer ?? UEBRIGE_TECHNIK);
  }
  const out: Wirkungsbereich[] = WIRKUNGSBEREICHE.filter((b) => gefunden.has(b));
  if (gefunden.has(UEBRIGE_TECHNIK)) out.push(UEBRIGE_TECHNIK);
  return out;
}

/** CSS-Klasse eines Wirkungsbereichs — Farbzuordnung (Auftrag David 8.8.2026,
 *  «visuell klarer, was zu was gehört»). EINE Tabelle für Chips und Karten. */
export function bereichKlasse(b: Wirkungsbereich | string): string {
  switch (b) {
    case 'Benutzeroberfläche': return 'bz-ui';
    case 'Rechtslogik & Berechnungen': return 'bz-logik';
    case 'Gesetzes- & Urteilsdaten': return 'bz-daten';
    case 'Datenhaltung': return 'bz-halt';
    case 'Auslieferung & Prüfstrasse': return 'bz-ausl';
    case 'KI-Arbeitsprozesse': return 'bz-ki';
    default: return 'bz-rest';
  }
}

/**
 * Wirkungsbereiche als Badge-Reihe — seit 8.8.2026 farbcodiert (Auftrag David;
 * vorher bewusst farblos, um die Seiten byte-gleich zu halten). Der Text bleibt
 * die primäre Unterscheidung, die Farbe kommt dazu — farbunabhängig lesbar.
 */
export function bereichsBadges(feld: string | null): string {
  const b = wirkungsbereiche(feldPfade(feld));
  if (!b.length) return '';
  return ` ${b.map((x) => `<span class="chip bz ${bereichKlasse(x)}" title="Wirkungsbereich">${esc(x)}</span>`).join(' ')}`;
}

// Der Grössen-Badge (`groesseBadge`, Tabelle `GROESSE_TEXT`) ist mit der
// Steuerungs-Diät vom 29.8.2026 gestrichen — zusammen mit dem @meta-Feld
// `groesse:`, aus dem er las. Das Feld war seit dem Audit vom 14.8.2026 ohne
// Vokabelprüfung und ohne Tor; aus dem Bau-Prompt hatte David es schon am
// 15.8.2026 entfernen lassen («das mit der grösse soll weg»). Damit blieb der
// Lagebild-Badge sein letzter Leser: eine Schätzung, die niemand mehr pflegte,
// aber jede Session las.

/**
 * Ein Schritt in der Anzeige: **Klartext-Titel zuerst**, das Kürzel danach in
 * Klammern (Auftrag David 5.8.2026 — nie mehr ID-first).
 *
 * Warum übersetzen statt umbenennen: die Kürzel sind projektweite Verweis-Anker
 * (ROADMAP, Fahrpläne, Commit-Trailer, Branch-Namen). Sie umzubenennen liesse
 * hunderte Bestandsverweise auf das Falsche zeigen — dieselbe Fehlerklasse, die
 * CLAUDE.md §16 für Paragraphen-Nummern festhält. Sie bleiben also stehen wie
 * Hausnummern und bekommen nur ein lesbares Schild davor.
 */
export function schrittLabel(titel: string, id: string, fett = true): string {
  const t = esc(titel);
  return `${fett ? `<b>${t}</b>` : t} <span class="id">(${esc(id)})</span>`;
}

// ---------------------------------------------------------------------------
// Lagebild «schlank» — Bausteine der fünf Klartext-Blöcke
// (Auftrag David 8.9.2026: «mach es schlanker und übersichtlicher für mich»)
//
// Alles hier ist REIN: die Funktionen formulieren aus bereits erhobenen Werten,
// sie erheben nichts und rechnen nichts nach (§2). Der Vorgänger dieses
// Abschnitts war der Laien-Block `wasGeradePassiert` — er ist mit demselben
// Auftrag ersatzlos zurückgebaut (§17-Gegengewicht), weil die Blöcke 1/3/5
// seine Funktion übernehmen und zwei Erzählungen derselben Lage zwei
// Wahrheiten wären (§5).
// ---------------------------------------------------------------------------

/**
 * Ein Schritt im FLIESSTEXT der Hauptseite: nur der Klartext-Titel, das Kürzel
 * ausschliesslich als `title`-Attribut (Auftrag David 8.9.2026 — auf der
 * Hauptseite stand alle 29 Wörter ein Kürzel). `schrittLabel` mit sichtbarer
 * Klammer-ID bleibt unverändert bestehen und trägt weiterhin die Bau-Details-
 * Seite, deren Publikum die Kürzel als Verweis-Anker BRAUCHT.
 */
export function klartextLabel(titel: string, id: string, fett = true): string {
  const t = esc(titel);
  return fett ? `<b title="${esc(id)}">${t}</b>` : `<span title="${esc(id)}">${t}</span>`;
}

/**
 * Ist dieser `@blockers`-Text ein Entscheid, der bei David liegt?
 *
 * Mechanisch am Wortlaut des Registers, nicht an einer gepflegten Zweitliste
 * (die still veraltete). Vier Marker, alle im Bestand belegt; die ausdrückliche
 * VERNEINUNG («Kein David-Gate — Sequenz-Marker für die Plan-Buchung»,
 * `zh-tranche-laeuft`) schlägt jeden Marker, sonst zählte die Seite reine
 * Ablauf-Vermerke als Entscheidungen.
 *
 * `Freigabe David` steht bewusst mit in der Liste, obwohl der Auftrag nur drei
 * Marker nannte (§7 — abweichen und offenlegen): `richter-analytik-gate`
 * verlangt laut Register «bewusste Freigabe Davids», ist also ein echtes Gate;
 * ohne diesen Marker verschwände es von der Seite, statt sichtbar zu warten.
 */
export const DAVID_GATE_MARKER: readonly RegExp[] = [/David-Gate/i, /Entscheid David/i, /wartet auf David/i, /Freigabe David/i];
const KEIN_DAVID_GATE = /kein(?:e|er|es)?\s+(?:echtes\s+)?David-Gate/i;

export function istDavidGate(text: string): boolean {
  if (KEIN_DAVID_GATE.test(text)) return false;
  return DAVID_GATE_MARKER.some((r) => r.test(text));
}

/**
 * Sagt das Gate selbst, dass es bewusst liegen bleibt? Dann ist «wartet seit
 * N Tagen» kein Hinweis, sondern falscher Druck (Befund der Ist-Analyse
 * 8.9.2026: `vps-bestellung-david` trug «wartet seit 49 Tagen», obwohl David
 * am 8.8.2026 ausdrücklich zurückgestellt hat).
 */
export function istZurueckgestellt(text: string): boolean {
  return /zur(?:ü|ue)ckgestellt|geparkt|vertagt/i.test(text);
}

/**
 * Strukturiertes Feld aus der Gate-Prosa (`Frage: …`, `Optionen: …`,
 * `Empfehlung: …`). Fehlt es, kommt `null` zurück — der Block zeigt dann
 * nichts an dieser Stelle, statt etwas zu erfinden (§8). Die geplante
 * `@blockers`-Erweiterung um genau diese drei Felder ist ein eigener Schritt;
 * bis dahin findet die Funktion, was die Prosa ohnehin schon so schreibt.
 */
const FELD_LABEL: Record<'frage' | 'optionen' | 'empfehlung', string> = {
  frage: 'Frage',
  optionen: 'Optionen',
  empfehlung: 'Empfehlung',
};

export function gateFeld(text: string, feld: 'frage' | 'optionen' | 'empfehlung'): string | null {
  const m = text.match(new RegExp(`(?:^|[·;(]\\s*|\\s)${FELD_LABEL[feld]}:\\s*(.+?)(?=\\s+·\\s|$)`, 'is'));
  return m ? m[1].trim() : null;
}

/** Die Zahlen, aus denen Block 1 seine drei Sätze bildet. */
export interface LageZahlen {
  offen: number;
  baubar: number;
  imBau: number;
  /** Zahl der ENTSCHEIDE (Gates), nicht der daran hängenden Arbeitspakete. */
  entscheide: number;
  ampel: { gruen: boolean; name: string; wann: string } | null;
  zuletzt: { titel: string; wann: string } | null;
}

/** Zahl + Bezugswort in korrektem Deutsch; die Null bekommt ihre eigene Form
 *  («keines ist im Bau» statt «0 sind im Bau»). Jede Form steht ausgeschrieben
 *  da — eine generische Pluralregel produziert im Deutschen verlässlich Unsinn. */
function zahlwort(n: number, null_: string, ein: string, mehr: string): string {
  return n === 0 ? null_ : n === 1 ? `1 ${ein}` : `${n} ${mehr}`;
}

/**
 * Block 1 «Wo stehen wir» — drei Sätze, jeder Wert mechanisch belegt.
 * Satzschablonen stehen STATISCH hier: gleicher Repo-Stand ergibt gleichen
 * Text (§2), kein Modell zur Laufzeit.
 */
export function lageSaetze(d: LageZahlen): string[] {
  const ampel = d.ampel
    ? d.ampel.gruen
      ? `Der Hauptstand des Projekts ist gesund: der letzte abgeschlossene Prüflauf («${d.ampel.name}», ${d.ampel.wann}) war grün.`
      : `Der Hauptstand ist gerade ROT — der letzte abgeschlossene Prüflauf («${d.ampel.name}», ${d.ampel.wann}) ist gescheitert; das geht allem anderen vor.`
    : 'Ob der Hauptstand gerade gesund ist, lässt sich auf diesem Rechner nicht abfragen (GitHub-Kommandozeile nicht verfügbar).';
  const zahlen =
    `${zahlwort(d.offen, 'Kein Arbeitspaket ist offen', 'Arbeitspaket ist offen', 'Arbeitspakete sind offen')} — ` +
    `${zahlwort(d.baubar, 'keines davon könnte sofort starten', 'davon könnte sofort starten', 'davon könnten sofort starten')}, ` +
    `${zahlwort(d.imBau, 'keines ist gerade im Bau', 'ist gerade im Bau', 'sind gerade im Bau')}.`;
  const rest = zahlwort(
    d.entscheide,
    'Nichts hält gerade auf deine Entscheidung.',
    'Entscheidung wartet auf dich (gleich darunter).',
    'Entscheidungen warten auf dich (gleich darunter).',
  );
  const zuletzt = d.zuletzt ? ` Zuletzt fertig geworden: «${d.zuletzt.titel}» (${d.zuletzt.wann}).` : '';
  return [ampel, zahlen, `${rest}${zuletzt}`];
}

/**
 * Sichtbare Wörter einer erzeugten Seite — das Mass des Wortbudgets
 * (Auftrag David 8.9.2026: die Hauptseite trug 1714 sichtbare Wörter).
 *
 * «Sichtbar» heisst: beim Öffnen der Seite lesbar. Skript und Stylesheet
 * zählen nicht, und von einem `<details>` zählt nur sein `<summary>` — der
 * eingeklappte Rest ist Angebot, nicht Last. Die Zerlegung ist bewusst
 * einfach (kein HTML-Parser): sie setzt voraus, dass `<details>` nicht
 * verschachtelt werden — im Generator ist das nirgends der Fall.
 */
export function sichtbareWorte(html: string): number {
  const ohneCode = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ');
  const ohneDetails = ohneCode.replace(/<details[\s\S]*?<\/details>/gi, (blk) => (blk.match(/<summary[\s\S]*?<\/summary>/i) ?? [' '])[0]);
  const text = ohneDetails.replace(/<[^>]+>/g, ' ').replace(/&(?:[a-z]+|#\d+);/gi, ' ');
  return text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

// ---------------------------------------------------------------------------
// Gemeinsames der Seiten-Module
//
// `SeitenOpts` und `fussnote` lagen bis 5.8.2026 in `bildSeiten.ts`. Seit die
// Methode-Seite ein eigenes Modul hat (§6.6-Split, s. bildMethode.ts), brauchen
// sie ZWEI Seiten-Module — und zwei Kopien wären zwei Wahrheiten (§5). Sie
// gehören ohnehin hierher: der eine ist der Vertrag jeder Seiten-Funktion, der
// andere ein Wiederhol-Baustein wie `kacheln` oder `tabelle`.
// ---------------------------------------------------------------------------

/** Aufruf-Vertrag jeder Seiten-Funktion. */
export interface SeitenOpts {
  /** Pfad der Index-Seite (`--out`) — Basis der relativen Verweise. */
  indexPfad: string;
  watch: number | null;
  /** Erzeugungs-Zeitstempel; für alle vier Seiten eines Laufs identisch. */
  stand: string;
}

/** Gemeinsame Fussnote aller vier Seiten; `zusatz` nennt die Quellen der Seite. */
export function fussnote(zusatz: string): string {
  return `<footer>
  <p>Erzeugt von <span class="id">npm run plan:bild</span> aus ROADMAP.md (Parser und Resolver von <span class="id">plan:next</span>),
  den Korpus-Registern, git und gh. ${zusatz}
  Diese Dateien sind git-ignoriert — sie sind eine Projektion, nie eine zweite Wahrheit (§5).</p>
</footer>`;
}

/** Deutsche Monatsbeschriftung aus «YYYY-MM». */
const MONATSNAMEN = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
export function monatLabel(key: string): string {
  const [jahr, monat] = key.split('-');
  return `${MONATSNAMEN[Number(monat) - 1] ?? monat} ${jahr}`;
}
