/**
 * Tor `check:p-klassen` (P3, W2·5b) — macht STILLE <p>-Drops im Fedlex-Extraktor
 * LAUT. Über alle gepinnten Bund-HTMLs: findet jede top-level <p class="…"> im
 * Artikelkörper, die KEINE Block-Alternative des Extraktors trifft (also stumm
 * verworfen würde), normalisiert ihre Klasse auf den semantischen Leit-Token und
 * vergleicht das Vokabular gegen ein eingefrorenes Manifest ENTSCHIEDENER Klassen.
 *
 * Zweck: kein neuer <p>-Klassentyp (Fedlex-Template-Drift/Currency) kann je wieder
 * STILL Normtext verlieren — er bricht dieses Tor, bis eine bewusste Entscheidung
 * (extrahieren / bewusst-ignorieren mit Beleg) im Manifest getroffen ist.
 *
 * Vollständige Herleitung + Klassen-Verdikte:
 *   bibliothek/register/p3-drop-klassen-inventar-2026-07-05.md
 */
import { readFileSync, existsSync } from 'node:fs';
import { parseFedlexCacheEintraege } from './inventar-bund.ts';
import { pinBefund } from './cache-pin-befund.ts';
import { istSternNote } from './stern-note.ts';
import { ABSATZ_NR_INHALT } from './fedlex/absatz-nr.ts';

// ─── Manifest: ENTSCHIEDENE Drop-Klassen (semantischer Leit-Token) ───────────
// Diese Klassen treffen KEINE Extraktor-Alternative und werden BEWUSST nicht in
// den Normtext übernommen. Jede trägt eine Begründung (Beleg im Register).
const BEWUSST_IGNORIERT: Record<string, string> = {
  // Fedlex-Schlussformel «Datum des Inkrafttretens: …» am Erlass-Ende — reine
  // Vollzugs-Metadaten (kein Artikel-Normtext); das In-Kraft-Datum trägt bereits
  // die Provenienz-Spalte `stand` (§7). Trailing-Ziffer = AS-Fussnote.
  inkrafttreten: 'Vollzugs-Metadaten (In-Kraft-Datum) — steht in `stand` (§7), kein Artikel-Normtext',
  // Staatsvertrags-Schlussformel «Zu Urkund dessen haben die … Bevollmächtigten
  // dieses Übereinkommen unterschrieben» (Testimonium/Unterzeichnungs-Attestat am
  // Vertragsende, nach dem letzten Artikel). Authentische, aber NICHT-normative
  // Schluss-Boilerplate ohne art_-Anker; im artikel-getasteten Snapshot-Modell nicht
  // als Artikel abbildbar (Paket 4: kein neues Format/Skript). Erscheint bei den P4-
  // Verträgen (RBÜ/CMR/Montreal/HKsÜ/HUVÜ/EAUe/UNO-BRK/Istanbul); Fundstelle bleibt
  // über den Live-Link zur amtlichen Fassung (§7/§8) einsehbar.
  schlussint: 'Staatsvertrags-Testimonium (Unterzeichnungs-Attestat) — nicht-normative Schluss-Boilerplate ohne art_-Anker (Paket 4)',
  // Präsentations-Varianten der Absatz-Klasse (Punktgrösse/Kursiv), die die
  // wortgebundene alt1-Regex (\babsatz\b) NICHT trifft. Inhalt gemischt
  // (Inkrafttreten-Kleindruck-Datumslisten UND vereinzelt Sondertext: ParlG-Eid,
  // UVPV art_13 Abs. 3/4). DEFERIERT als eigener Schritt (Absatz-Nr in <span>-
  // Wrapper + <sup><br></sup>-Artefakte brauchen eigene Behandlung) — dokumentiert,
  // NICHT mehr still. Bekannte Rest-Lücke: p3-drop-klassen-inventar-2026-07-05.md §Defer.
  absatz8pt: 'Präsentations-Absatz-Variante (8pt Kleindruck) — DEFERIERT, dokumentiert',
  absatz09pt: 'Präsentations-Absatz-Variante (9pt) — DEFERIERT, dokumentiert',
  absatz10pt: 'Präsentations-Absatz-Variante (10pt) — DEFERIERT, dokumentiert',
  absatzkurs: 'Präsentations-Absatz-Variante (kursiv) — DEFERIERT, dokumentiert',
  // Leerer Seiten-Abstandshalter (<p class="abstand1seite">) — Layout-Spacer ohne
  // Textinhalt (z.B. GebV-SchKG art_63a). Kein Normtext.
  abstand1seite: 'Leerer Layout-Abstandshalter — kein Textinhalt',
  // Manuskript-Abstandshalter (<p class="man-space-before-0 …"></p>) — reiner
  // Layout-Spacer OHNE Textinhalt (z.B. ENTG). Erscheint neu mit den P1-a/b
  // kanonisch re-gepinnten Fassungen (11.7.2026). Empirisch geprüft: als LEIT-
  // Token ausschliesslich leer; wo er als ZWEIT-Token an echtem Text hängt
  // (`erlasssubtitel man-space-before-0`, `man-template-tab-krpr man-space-before-0`),
  // entscheidet der jeweilige Leit-Token, nicht dieser. Kein Normtext.
  'man-space-before-0': 'Manuskript-Layout-Abstandshalter (leer) — kein Textinhalt (P1-a/b kanonische Fassungen)',
  // Standalone <p class="bild"> OHNE <img> = eine als MathML/Text gesetzte Formel
  // (GBV art_34i Gebührenformel, Einzelfall). DEFERIERT: Formel-als-Text braucht
  // eigene MathML-Behandlung, nicht in diesem Schritt. Bekannte Rest-Lücke.
  bild: 'Text-/MathML-Formel ohne <img> (GBV art_34i, Einzelfall) — DEFERIERT, dokumentiert',
  // Standalone kursive Editorial-/Aufgehoben-Note (man-font-style-italic), meist
  // «… <fn>»-Platzhalter oder redaktionelle Anmerkung — kein tragender Normtext.
  'man-font-style-italic': 'Kursive Editorial-/Aufgehoben-Note — kein tragender Normtext',
  // Tabellen-Kopf-<p> (man-template-tab-kpf): Zellinhalt echter Tabellen; erscheint
  // hier nur als Artefakt des nicht-balancierten Tabellen-Ausschnitts (verschachtelte
  // Tabellen) bzw. leer. Über den Tabellen-Pfad (mehrspaltig) erfasst.
  'man-template-tab-kpf': 'Tabellen-Kopf-Zelle — über den Tabellen-Pfad erfasst (Strip-Artefakt/leer)',
  // Kosmetische Zwischen-Titel (man-template-tab-utit*): z.B. SchKG art_219
  // «Erste/Zweite/Dritte Klasse» — die materiellen Forderungs-Kataloge sind als
  // item-Gruppen in Reihenfolge vollständig erfasst (Rang = Gruppen-Ordnung); der
  // blosse Klassen-Titel ist eine Darstellungs-Überschrift, kein eigener Normsatz.
  'man-template-tab-utit-kurs': 'Kosmetischer Zwischen-Titel (Substanz via item-Gruppen erfasst)',
  'man-template-tab-utit': 'Kosmetischer Zwischen-Titel (Substanz via item-Gruppen erfasst)',
};

/** Semantischer Leit-Token einer Klasse (erster Token, ohne Präsentations-Modifier). */
function leitToken(klasse: string): string {
  return klasse.trim().split(/\s+/)[0] ?? '';
}

/** Trifft die <p> eine Extraktor-Block-Alternative (→ erfasst, kein Drop)? */
function istErfasst(attrs: string, inner: string, folgt: string): boolean {
  const klasse = (attrs.match(/\bclass="([^"]*)"/i)?.[1] ?? '').toLowerCase();
  // alt1: class enthält «absatz» — EXAKT die \b-Wortgrenze des Extraktors (JS-\b
  // zählt Ziffern als Wortzeichen → «absatz8pt»/«absatzkurs» treffen NICHT).
  if (/\babsatz\b/.test(klasse)) return true;
  // grundlage: class enthält «referenz» (inkl. man-template-referenz), \b wie Extraktor.
  if (/\breferenz\b/.test(klasse)) return true;
  // alt7: man-template-tab-krpr (standalone; in-table wird vorab weggeschnitten)
  if (/man-template-tab-krpr/.test(klasse)) return true;
  // alt8 (P3b, W2·27-BUND-FERTIG): Sternchen-Verweisnote als absatz8pt — dieselbe Definition wie der Extraktor.
  if (istSternNote(klasse, inner)) return true;
  // Bild-Pfad: enthält <img>
  if (/<img\b/i.test(inner)) return true;
  // alt2: führendes nacktes Ziffern-<sup> OHNE <a> (Absatznummer)
  const sup = inner.match(/^(?:\s|&nbsp;|<\/?inl>)*<sup\b[^>]*>([\s\S]*?)<\/sup>/i);
  if (sup && !/<a[\s>]/i.test(sup[1]) && ABSATZ_NR_INHALT.test(sup[1].trim())) return true;
  // alt3: unmittelbar von <dl> gefolgt
  if (/^\s*<dl\b/i.test(folgt)) return true;
  return false;
}

const shell = readFileSync('scripts/fedlex-cache.sh', 'utf8');
const eintraege = parseFedlexCacheEintraege(shell);
// §17 (Gegenprüfung #822 C1): `ci.yml` fährt dieses Tor bei JEDEM Nicht-Doku-PR, OHNE je
// `fedlex-cache.sh` zu rufen — dort ist ein /tmp-Cache die AUSNAHME, kein Normalfall.
// `--cache-pflicht` (nur im Frische-Arm `fedlex-frische.yml` gesetzt, der den Cache selbst
// frisch fetcht) verlangt die VOLLE Bestandszahl auch bei 0 vorhandenen Caches.
const cachePflicht = process.argv.includes('--cache-pflicht') || process.env.LEXMETRIK_CACHE_PFLICHT === '1';

const gefundeneTokens = new Set<string>();
const beispiel = new Map<string, string>();
let artScan = 0;

// Gegenprüfung #822 B1: mit ALLEN `.pin`-Markern weggelegt hätte ein blosses HINWEIS +
// `continue` jeden Eintrag übersprungen — `artScan` bliebe 0, und ohne eine untere
// Schranke meldete das Tor trotzdem «✓ … keine stillen <p>-Verluste» EXIT=0 (fedlex-cache.sh
// selbst schreibt nie `.pin`, nur normtext-snapshot.ts/struktur-run.ts nach einem Fetch —
// auf einem frischen Rechner/CI, der nur fedlex-cache.sh gefahren hat, fehlen ALLE Marker).
let pinFehlerTotal = 0;
let vorhanden = 0; // Gegenprüfung #822 C1: Caches, die ÜBERHAUPT existieren (Existenz, nicht Pin-Gültigkeit)

for (const e of eintraege) {
  const pfad = `/tmp/${e.name}.html`;
  if (!existsSync(pfad)) continue;
  vorhanden++;
  // §17 (Gegenprüfung #808 B4): ein VOR einem Re-Pin geschriebener Cache besteht die
  // Existenz-Prüfung anstandslos, stammt aber aus der überholten Manifestation —
  // dieselbe Pin-Sonde wie normtext-snapshot.ts/struktur-run.ts/check-vollstaendigkeit.ts.
  // FEHLER statt HINWEIS (wie struktur-run.ts): ein Pin-Fehlbefund ist kein tolerierbarer
  // Lückenfall, sondern ein unzuverlässiger Cache.
  const pin = pinBefund(e.name, e.eli, e.konsolidierung, e.htmlN);
  if (!pin.ok) {
    console.error(`  FEHLER ${e.name}: ${pin.grund} — Cache pin-ungültig, Prüfung unzuverlässig.`);
    pinFehlerTotal++;
    continue;
  }
  const html = readFileSync(pfad, 'utf8');
  const artRe = /<article[^>]*\sid="[^"]+"[^>]*>([\s\S]*?)<\/article>/gi;
  let am: RegExpExecArray | null;
  while ((am = artRe.exec(html)) !== null) {
    artScan++;
    // Fussnoten-Apparat, echte Tabellen und <dl>-Inhalte entfernen — deren <p>
    // sind über den Tabellen-/Listen-Pfad erfasst und keine top-level-Drops.
    const koerper = am[1]
      .replace(/<div\s+class="footnotes">[\s\S]*$/i, '')
      .replace(/<table\b[\s\S]*?<\/table>/gi, '')
      .replace(/<dl\b[\s\S]*?<\/dl>/gi, '');
    const pRe = /<p\b([^>]*)>([\s\S]*?)<\/p>/gi;
    let pm: RegExpExecArray | null;
    while ((pm = pRe.exec(koerper)) !== null) {
      const attrs = pm[1];
      const inner = pm[2];
      const klasse = attrs.match(/\bclass="([^"]*)"/i)?.[1];
      if (!klasse) continue; // classless: Fallback-/alt2-Pfad bzw. R7 — separat
      const folgt = koerper.slice(pm.index + pm[0].length);
      if (istErfasst(attrs, inner, folgt)) continue;
      const token = leitToken(klasse);
      gefundeneTokens.add(token);
      if (!beispiel.has(token)) {
        const txt = inner.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
        beispiel.set(token, `${e.name}: "${txt}"`);
      }
    }
  }
}

const bekannt = new Set(Object.keys(BEWUSST_IGNORIERT));
const neu = [...gefundeneTokens].filter((t) => !bekannt.has(t)).sort();
const verschwunden = [...bekannt].filter((t) => !gefundeneTokens.has(t)).sort();

console.log(`[check:p-klassen] ${artScan} Artikel gescannt, ${gefundeneTokens.size} entschiedene Drop-Klassen-Tokens.`);

// Bestandszahl-Sperre (Gegenprüfung #822 B1, verschärft C1): der reale Bestand scannt
// ~25'000 Artikel; ein Kollaps auf (nahe) 0 — z.B. weil ALLE Caches pin-ungültig sind —
// darf nie als «✓ keine stillen Verluste» durchgehen.
//
// C1-KORREKTUR: bezieht sich auf VORHANDENE Caches, nicht auf die volle Registerzahl.
// `ci.yml` fährt dieses Tor bei JEDEM Nicht-Doku-PR, OHNE je `fedlex-cache.sh` zu rufen —
// dort ist `vorhanden === 0` der NORMALFALL (Rot-Beweis der Vorfassung: alle 227 Bund-
// Caches weggelegt stellte JEDEN Nicht-Doku-PR rot). 0 vorhanden ⇒ Prüfung ungefahren
// (grün, HINWEIS) — ausser `--cache-pflicht` (nur Frische-Arm) verlangt die volle Zahl
// auch bei 0. Ein TEILBESTAND (0 < n < alle) ist in JEDEM Kontext ein Befund.
const MINDEST_ARTIKELZAHL = 10_000;
if (vorhanden === 0 && !cachePflicht) {
  console.log(`\nHINWEIS: Cache-Prüfung nicht durchgeführt (kein /tmp-Cache; nur im Frische-Arm Pflicht).`);
} else if (vorhanden > 0 && vorhanden < eintraege.length) {
  console.error(
    `\n❌ FEHLER: nur ${vorhanden}/${eintraege.length} Bund-Erlasse haben überhaupt einen /tmp-Cache ` +
      `(Teilbestand) — entweder ALLE Caches bereitstellen ('bash scripts/fedlex-cache.sh') oder KEINEN.`,
  );
  process.exit(1);
} else if (vorhanden === 0 && cachePflicht) {
  console.error(
    `\n❌ FEHLER: --cache-pflicht verlangt Bund-Caches, aber 0/${eintraege.length} vorhanden ` +
      `— 'bash scripts/fedlex-cache.sh' lief nicht oder scheiterte vollständig.`,
  );
  process.exit(1);
} else if (pinFehlerTotal > 0 || artScan < MINDEST_ARTIKELZAHL) {
  console.error(
    `\n❌ FEHLER: ${artScan} Artikel gescannt (Mindestzahl ${MINDEST_ARTIKELZAHL})` +
      (pinFehlerTotal > 0 ? `, ${pinFehlerTotal} Cache(s) pin-ungültig` : '') +
      ' — Prüfung unzuverlässig statt grün.',
  );
  process.exit(1);
}
if (neu.length > 0) {
  console.error('\n❌ NEUE, UNENTSCHIEDENE <p>-Drop-Klasse(n) — stiller Normtext-Verlust droht:');
  for (const t of neu) console.error(`   · class-Leit-Token "${t}"  z.B. ${beispiel.get(t)}`);
  console.error('\nEntscheide je Klasse (extrahieren am Extraktor ODER bewusst ignorieren mit Beleg)');
  console.error('und trage sie ins Manifest BEWUSST_IGNORIERT bzw. eine Extraktor-Alternative ein.');
  console.error('Herleitung: bibliothek/register/p3-drop-klassen-inventar-2026-07-05.md');
  process.exit(1);
}
if (verschwunden.length > 0) {
  console.log(`ℹ  Nicht mehr auftretende Manifest-Klassen (ok, Currency-Drift): ${verschwunden.join(', ')}`);
}
console.log('✓ Alle Drop-Klassen sind im Manifest entschieden — keine stillen <p>-Verluste.');
