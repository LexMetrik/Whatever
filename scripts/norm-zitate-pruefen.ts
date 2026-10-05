// ─── Norm-Zitate-Prüfer: jedes Art.-Zitat der Engines gegen die Caches ──────
// (Anordnung David 6.6.2026: «doppelt überprüfen ob richtige normen verwendet
// wurden».) Deterministische Stufe: Existenz des Artikels + des zitierten
// Absatzes/der Litera im Cache-HTML. Die INHALTLICHE Stützung prüft der
// adversariale Zweitdurchgang (Agent).
//   Aufruf: npx vite-node scripts/norm-zitate-pruefen.ts
import { readFileSync } from 'node:fs';

const QUELLEN = [
  'src/lib/zustaendigkeit.ts',
  'src/lib/schkgZustaendigkeit.ts',
  'src/lib/strafZustaendigkeit.ts',
  'src/lib/zustaendigkeitFahrplan.ts',
  'src/lib/vorlagen/klageVereinfacht.ts',
  'src/data/zustaendigkeitKosten.ts',
  // Gründungs-Masken GmbH/AG (6.6.2026) — HRegV-/StG-Zitate
  'src/lib/gruendungsunterlagen.ts',
  // AG-Volldokumente (Etappe 0/1 der Komplett-Überarbeitung, 7.6.2026) —
  // Statuten-/Urkunden-Bausteine zitieren OR + HRegV in text/norm/begruendung.
  'src/lib/vorlagen/gruendungAgDokumente.ts',
  // Mahnung & Inverzugsetzung (11.6.2026) — Art. 102/104/107/108 OR in
  // Bausteinen und Gates.
  'src/lib/vorlagen/mahnung.ts',
  'src/lib/vorlagen/verjaehrungsverzicht.ts',
  'src/lib/vorlagen/forderungsabtretung.ts',
  // Rubrum (Gerichts-Baustein-Set W2·7) — Art. 238 ZPO (lit. a–h) + Art. 112 BGG
  // (Abs. 1 lit. a–d), live gegen Fedlex verifiziert 2026-07-05.
  'src/lib/vorlagen/rubrum.ts',
  // Arbeitsvertrag (Detailgrad-Vollausbau P1a, 14.6.2026) — Art. 319 ff. OR,
  // neu Art. 332 OR (Arbeitsergebnisse) + Art. 34 ZPO (Gerichtsstand).
  'src/lib/vorlagen/arbeitsvertrag.ts',
  // Mietvertrag (Detailgrad P2, 14.6.2026) — Art. 253 ff. OR + VMWG (neu
  // Art. 18 VMWG Mietzinsvorbehalt, Art. 257h OR Duldungspflicht).
  'src/lib/vorlagen/mietvertrag.ts',
  // Lehrvertrag (Sonderregime P1c, 14.6.2026) — Art. 344–346a OR.
  'src/lib/vorlagen/lehrvertrag.ts',
  // Handelsreisendenvertrag (Sonderregime P1d, 14.6.2026) — Art. 347–350a OR.
  'src/lib/vorlagen/handelsreisendenvertrag.ts',
  // Heimarbeitsvertrag (Sonderregime P1e, 14.6.2026) — Art. 351–354 OR.
  'src/lib/vorlagen/heimarbeitsvertrag.ts',
  // Auftrag/Dienstleistungsvertrag (V3, 13.6.2026) — Art. 394 ff. OR.
  'src/lib/vorlagen/auftrag.ts',
  // Werkvertrag (V3, 13.6.2026) — Art. 363 ff. OR.
  'src/lib/vorlagen/werkvertrag.ts',
  // NDA/Geheimhaltung (V3, 13.6.2026) — Art. 19/160/161/163 OR.
  'src/lib/vorlagen/nda.ts',
  // Konkubinatsvertrag (V3, 13.6.2026) — Art. 19 OR, Art. 646/650/651 ZGB,
  // Art. 530/548/549 OR.
  'src/lib/vorlagen/konkubinat.ts',
  'src/lib/vorlagen/fristerstreckung.ts',
  'src/lib/vorlagen/nichtbekanntgabe.ts',
  'src/lib/vorlagen/scheidungsklage.ts',
  'src/lib/vorlagen/scheidungsbegehren.ts',
  'src/lib/vorlagen/eheschutzgesuch.ts',
  // BGer-Rechtsweg (11.6.2026) — BGG- und BGerR-Zitate in Rechenweg/Hinweisen.
  'src/lib/bgerRechtsweg.ts',
  // Verwaltungs-/BGG-Stillstand (13.6.2026) — Art. 22a/20 VwVG, Art. 46/45 BGG.
  'src/lib/bggVwvgFristen.ts',
  // Vertrags-Kündigungsmaske 3 (KVG-Preset 11.6.2026) — VVG-/OR-/KVG-/KVV-
  // Zitate in Bausteinen und Gates.
  'src/lib/vorlagen/kuendigungAllgemein.ts',
];
const CACHES: Record<string, string> = {
  ZPO: '/tmp/zpo.html', SchKG: '/tmp/schkg.html', StPO: '/tmp/stpo.html',
  BGG: '/tmp/bgg.html', StGB: '/tmp/stgb.html', ZGB: '/tmp/zgb.html', OR: '/tmp/or.html',
  // VwVG (Verwaltungs-Stillstand 13.6.2026): Art. 22a/20 — Filestore-Anker
  // «art_22_a» (artText baut den Unterstrich aus «22a» selbst).
  VwVG: '/tmp/vwvg.html',
  // via scripts/fedlex-cache.sh gepinnt (6.6.2026)
  HRegV: '/tmp/hregv.html', StG: '/tmp/stg.html',
  // BGerR gepinnt 11.6.2026 (BGer-Rechtsweg, Abteilungs-Auskunft)
  BGerR: '/tmp/bgerr.html',
  // VVG/KVG/KVV gepinnt (Kündigungs-Maske 3; KVG-Preset 11.6.2026)
  VVG: '/tmp/vvg.html', KVG: '/tmp/kvg.html', KVV: '/tmp/kvv.html',
};
const html: Record<string, string> = {};
for (const [g, p] of Object.entries(CACHES)) {
  try { html[g] = readFileSync(p, 'utf-8'); } catch { console.log(`⚠ Cache fehlt: ${g} (${p})`); }
}
const artText = (gesetz: string, nr: string): string | null => {
  const h = html[gesetz];
  if (!h) return null;
  const anker = `art_${nr.replace(/([a-z]+)$/, '_$1')}`;
  const m = h.match(new RegExp(`<article id="${anker}">([\\s\\S]*?)</article>`))
    ?? h.match(new RegExp(`<article id="art_${nr}">([\\s\\S]*?)</article>`));
  return m ? m[1].replace(/<[^>]+>/g, ' ') : null;
};

// Zitate einsammeln: «Art. 74 Abs. 2 lit. b BGG», «Art. 198 lit. e Ziff. 3 ZPO» …
// BGerR vor BGG, damit die Alternation «Art. 33 BGerR» nicht an BGG scheitert.
// KVV vor KVG analog (distinkte Tokens, Reihenfolge nur der Klarheit halber).
const RX = /Art\.\s*(\d+[a-z]*)\s*(?:Abs\.\s*(\d+)\s*)?(?:lit\.\s*([a-z]+(?:bis|ter)?)\s*)?(?:Ziff\.\s*(\d+)\s*)?(ZPO|SchKG|StPO|BGerR|BGG|StGB|ZGB|OR|HRegV|StG|VwVG|VVG|KVV|KVG)\b/g;
let total = 0, fehler = 0;
const gesehen = new Set<string>();
for (const q of QUELLEN) {
  const src = readFileSync(q, 'utf-8');
  for (const m of src.matchAll(RX)) {
    const [voll, nr, abs, lit, ziff, gesetz] = m;
    const id = `${q}::${voll}`;
    if (gesehen.has(id)) continue;
    gesehen.add(id); total++;
    const t = artText(gesetz, nr);
    if (t === null) {
      if (html[gesetz]) { console.log(`✗ FEHLT     ${voll}  (${q}) — Artikel nicht im Cache`); fehler++; }
      continue;
    }
    if (abs) {
      // Absatz-Marker: «<sup>N</sup>» wird zu « N »-Ziffer am Satzanfang
      const absOk = new RegExp(`(^|\\s)${abs}\\s`).test(t) || t.includes(`Abs. ${abs}`);
      if (!absOk) { console.log(`✗ ABS?      ${voll}  (${q}) — Abs. ${abs} nicht erkennbar`); fehler++; continue; }
    }
    if (lit) {
      // bis/ter-Literae stehen im HTML hochgestellt («a<sup>bis</sup>.» → «a bis .»)
      const litMuster = lit.replace(/(bis|ter)$/, '\\s*$1');
      const litOk = new RegExp(`(^|\\s)${litMuster}\\s*\\.\\s`).test(t);
      if (!litOk) { console.log(`✗ LIT?      ${voll}  (${q}) — lit. ${lit} nicht erkennbar`); fehler++; continue; }
    }
    if (ziff) {
      const zOk = new RegExp(`(^|\\s)${ziff}\\.\\s`).test(t);
      if (!zOk) { console.log(`✗ ZIFF?     ${voll}  (${q}) — Ziff. ${ziff} nicht erkennbar`); fehler++; continue; }
    }
  }
}
console.log(`\n${total} eindeutige Zitate geprüft · ${fehler} Befunde`);

// §6.7-Abbruchpfad (QS-PLAN-EINFACH 14.8.2026): Bis hierher konnte dieses Tor
// nie scheitern — es zählte Befunde und endete mit Exit 0; ohne Caches meldete
// es «0 Befunde», obwohl es NICHTS geprüft hatte. Ein Tor, das nicht scheitern
// kann, ist gefährlicher als keines. Rot bei echten Befunden UND wenn kein
// einziger Cache lesbar war (Caches besorgt `check:caches`, das in check:netz
// davor läuft).
// Reihenfolge seit 5.10.2026 (Monitor-Rückbau): echte Zitat-Befunde zuerst (Exit 1); fehlt
// nur ein Cache (check:caches meldet Netz-Ausfall mit Exit 2 und löscht die Datei), ist das
// «keine Aussage» — Exit 2, nie still grün und nie ein Gesetzestext-Rot.
const fehlendeCaches = Object.keys(CACHES).filter((g) => !(g in html));
if (fehler > 0) {
  console.error(`check:zitate ROT: ${fehler} Zitat-Befunde (Liste oben).`);
  process.exit(1);
}
if (fehlendeCaches.length > 0) {
  console.error(`check:zitate KEINE AUSSAGE (Exit 2): ${fehlendeCaches.length} Gesetzes-Cache(s) nicht lesbar (${fehlendeCaches.join(', ')}) — Zitate dieser Gesetze ungeprüft (erst \`npm run check:caches\`).`);
  process.exit(2);
}
