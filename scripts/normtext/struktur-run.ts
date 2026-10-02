/**
 * Runner: erzeugt die Struktur-Sidecars public/normtext/struktur/bund/<KEY>.json
 * (Gliederung + Marginalien je Artikel) aus den gecachten Fedlex-HTMLs.
 *
 * Voraussetzung: `bash scripts/fedlex-cache.sh` hat /tmp/<key>.html erzeugt
 * (gleiche Quelle wie die Bund-Snapshots). §2: --datum aus der Shell.
 * Reine Präsentations-Anreicherung — Snapshots/Golden bleiben unberührt (§3/§6).
 *
 * Aufruf: npm run normtext:struktur -- --datum=$(date +%F) [--nur=OR,ZGB]
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { extrahiereStruktur, extrahiereAnhangStruktur } from './struktur-extrahiere.ts';
import { extrahiereMarginalienXml, ueberlagereMarginalien } from './struktur-marginalien-xml.ts';
import { sicherstelleXmlCaches, xmlPfad } from './fedlex-xml-cache.ts';
import { extrahiereKopf } from './kopf-extrahiere.ts';
import { extrahiereFussnoten, fnDefinitionen, type Fussnote } from './fussnoten-extrahiere.ts';
import { klassifiziereFussnote } from './fussnoten-klassifikation.ts';
import { pinBefund, pinIdentitaet, warFrischGeschrieben } from './cache-pin-befund.ts';
import { parseFedlexCacheEintraege, type FedlexCacheEintrag } from './inventar-bund.ts';
import { istReinerDatumsChurn } from './churn-reset.ts';
import { ERLASS_REGISTER } from '../../src/lib/normtext/register.ts';

// ── Pure, testbare Bausteine ──────────────────────────────────────────────────
// Rot-Beweis + Bindung: src/tests/normtext-struktur-run-logik.test.ts. Alles
// UNTERHALB von `istCliLauf` läuft nur im echten CLI-Lauf — ein Test-Import
// dieser Datei darf weder --datum erzwingen (process.exit) noch Dateien anfassen.

/**
 * Erlass-genauer Filter (`--nur=OR,ZGB`), analog zu `--nur=bund` (normtext-snapshot.ts)
 * und `--nur=` in struktur-kanton-run.ts/revisionen-generieren-run.ts: ohne Filter
 * stempelt JEDER Lauf `erzeugt` in ALLEN 227 Bund-Sidecars neu (Churn-Wurzel, §17 —
 * fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md), ein gezielter Fix an einem Erlass soll nur
 * dessen eigene Datei berühren.
 */
export function parseNurFilter(argv: readonly string[]): Set<string> | null {
  const arg = argv.find((a) => a.startsWith('--nur='));
  if (!arg) return null;
  const keys = arg
    .slice('--nur='.length)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return keys.length ? new Set(keys) : null;
}

/**
 * Entfernt eine von `scripts/gen-bezuege-zaehler.ts` (W2·26) NACHTRÄGLICH eingefügte
 * `"zaehler":…`-Zeile direkt hinter der öffnenden Klammer, falls vorhanden — sonst
 * unverändert. Dieser Generator berechnet/schreibt `zaehler` nie selbst (das tut
 * gen-bezuege-zaehler.ts aus den Verzahnungs-Shards); ohne dieses Stripping hielte
 * `sollSchreiben` jede Regeneration für eine Substanz-Änderung, sobald ein vorheriger
 * `npm run gen:bezuege-zaehler`-Lauf die Zeile eingefügt hatte (Gegenprüfung #822 B2).
 */
function ohneZaehlerZeile(text: string): string {
  const nl = text.indexOf('\n');
  if (nl < 0 || text.slice(0, nl + 1) !== '{\n') return text;
  const rest = text.slice(nl + 1);
  return text.slice(0, nl + 1) + rest.replace(/^([ \t]*)"zaehler":.*\n/, '');
}

/**
 * §17 Churn-Wurzel: `erzeugt` wird nur neu gestempelt, wenn sich der Inhalt (Struktur/
 * Kopf/Fussnoten) tatsächlich geändert hat — sonst bliebe die Datei inhaltlich gleich,
 * nur mit neuem Datum, und ein Breitband-Lauf risse einen reinen Datums-Diff über den
 * ganzen Bestand (227 Dateien). `altInhalt === null` heisst: Datei existiert noch
 * nicht → immer schreiben. Churn-Felder/-Regel wiederverwendet aus
 * scripts/normtext/churn-reset.ts (`erzeugt`/`abgerufen`) statt zweimal definiert (§5).
 *
 * Gegenprüfung #822 B2: eine `zaehler`-Zeile in `altInhalt` (von gen-bezuege-zaehler.ts
 * nachträglich eingefügt) wird VOR dem Vergleich entfernt — sonst wäre jede Regeneration
 * nach einem `npm run gen:bezuege-zaehler`-Lauf fälschlich eine Substanz-Änderung, und
 * das Zurückschreiben hätte den Block stillschweigend gelöscht (derselbe Churn, den
 * dieser Generator eigentlich vermeiden soll — nur diesmal fremdverschuldet).
 */
export function sollSchreiben(altInhalt: string | null, neuInhalt: string): boolean {
  if (altInhalt === null) return true;
  const altOhneZaehler = ohneZaehlerZeile(altInhalt);
  if (altOhneZaehler === neuInhalt) return false;
  return !istReinerDatumsChurn(altOhneZaehler, neuInhalt);
}

/**
 * §17 (Gegenprüfung #822 B2): trägt eine vorhandene `zaehler`-Zeile aus `altInhalt`
 * unverändert in `neuInhalt` weiter, wenn geschrieben wird — «beim Schreiben erhalten».
 * Dieser Generator berechnet den Block nicht selbst und darf ihn beim Zurückschreiben
 * darum nicht löschen.
 *
 * ZUSATZ-HINWEIS (Prüfer-Auflage, Gegenprüfung #822 C1): bei einer REINEN Datums-Churn
 * (nichts inhaltlich geändert) ist der übernommene Block exakt richtig. Bei einer ECHTEN
 * Bestandsänderung (neue/entfernte Artikel, geänderte Fussnoten) trägt er den ALTEN Wert
 * weiter — der kann für neue Artikel fehlen oder für entfernte noch dastehen, bis
 * `npm run gen:bezuege-zaehler` (Teil von `npm run projektionen`, läuft nach jedem
 * `normtext:struktur`-Lauf) den Block aus den aktuellen Verzahnungs-Shards neu zieht und
 * ersetzt. Diese Projektions-Kaskade (struktur-run.ts → gen-bezuege-zaehler.ts) ist der
 * Grund, warum ein kurzzeitig veralteter Block hier vertretbar ist: er wird im selben
 * Build-Durchlauf korrigiert, statt bis dahin ganz zu fehlen (§8: nie stillschweigend
 * verlieren — lieber kurz veraltet als leer).
 */
export function zaehlerZeileErhalten(altInhalt: string | null, neuInhalt: string): string {
  if (!altInhalt) return neuInhalt;
  const nlAlt = altInhalt.indexOf('\n');
  if (nlAlt < 0 || altInhalt.slice(0, nlAlt + 1) !== '{\n') return neuInhalt;
  const m = /^([ \t]*)"zaehler":.*\n/.exec(altInhalt.slice(nlAlt + 1));
  if (!m) return neuInhalt;
  const nlNeu = neuInhalt.indexOf('\n');
  if (nlNeu < 0 || neuInhalt.slice(0, nlNeu + 1) !== '{\n') return neuInhalt;
  return neuInhalt.slice(0, nlNeu + 1) + m[0] + neuInhalt.slice(nlNeu + 1);
}

/**
 * §17 (Gegenprüfung #808, Auflage B4): ein /tmp-HTML-Cache gilt nur dann als brauchbar,
 * wenn er NEBEN der blossen Existenz auch den Pin-Marker der aktuell in fedlex-cache.sh
 * gepinnten Manifestation trägt — sonst überlebt ein VOR einem Re-Pin geschriebener
 * /tmp-Dump einen Re-Pin unbemerkt (derselbe Fund, den `sicherstelleCaches` in
 * normtext-snapshot.ts seit #808 abdeckt; dieser Runner prüfte bisher NUR `existsSync`).
 */
export function cacheGueltig(key: string, pins: ReadonlyMap<string, FedlexCacheEintrag>): boolean {
  const datei = `/tmp/${key.toLowerCase()}.html`;
  if (!existsSync(datei)) return false;
  const pin = pins.get(key.toLowerCase());
  if (!pin) return true; // kein Pin-Eintrag zu diesem Key (defensiv — sollte für bund-Register-Keys nicht vorkommen)
  return pinBefund(pin.name, pin.eli, pin.konsolidierung, pin.htmlN).ok;
}

// `process.argv[1]` zeigt unter vite-node (npm-Aufruf) auf das vite-node-Binary
// selbst, nicht auf diese Datei — ein Pfad-Regex-Guard wäre also für den ECHTEN
// CLI-Lauf blind (still exit 0 ohne main(), erlebt beim ersten Testlauf dieses
// Fixes: `npm run normtext:struktur` blieb wortlos). `VITEST` setzt Vitest in
// JEDEM Testprozess zuverlässig (verifiziert), vite-node/tsx/node nie.
const istCliLauf = !process.env.VITEST;

async function main(): Promise<void> {
  const datumArg = process.argv.find((a) => a.startsWith('--datum='));
  const erzeugt = datumArg ? datumArg.slice('--datum='.length) : '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(erzeugt)) {
    console.error('struktur-run: --datum=YYYY-MM-DD erforderlich (§2).');
    process.exit(1);
  }

  const ZIEL = 'public/normtext/struktur/bund';
  mkdirSync(ZIEL, { recursive: true });

  // W2·5i-HIST-ANSICHT (H0-Auflage 3): die Fussnoten-Klasse wird GENAU HIER, EINMAL
  // build-seitig berechnet und als kompaktes Feld `kl` ('A'|'V'|'G'|'Z'|'U') an jede
  // Fussnote gehängt — kein Client-Regex-Lauf über 37'849 Fussnoten (§15.3), kein
  // zweiter Rechenort (§5). Regeln + empirische Grundlage: fussnoten-klassifikation.ts
  // bzw. bibliothek/normen/hist-ansicht-h0-trennbarkeit.md.
  //
  // `kl` wird ZULETZT gesetzt (Objekt-Spread am Ende), damit die bestehenden Felder
  // — inkl. `pos{b,it,o,l}` aus FN-5/M14 — in unveränderter Reihenfolge und
  // byte-identisch im JSON stehen: die Regeneration ist damit rein ADDITIV
  // (Differ-Beweis: scripts/normtext/check-sidecar-differ.ts).
  //
  // Fehlt `kl` (Kanton-Sidecars, die bewusst NICHT regeneriert werden — dort sind
  // nur 11 % der Fussnoten Historie), gilt die Fussnote im Reader als
  // UNklassifiziert und bleibt in JEDER Ansicht sichtbar. Konservativ (§8): eine
  // fehlende Klasse blendet nie etwas aus.
  const mitKlasse = (f: Fussnote): Fussnote & { kl: string } => ({ ...f, kl: klassifiziereFussnote(f.text) });

  /** Section-heading-Fussnote (G11): `absatz`/`item` sind hier per Konstruktion `null`
   *  (Marker sitzt am Sektions-/Randtitel-Kopf), `sektion` trägt das Quell-Heading.
   *  Genau die Form, die der `.map()` unten erzeugt — als Prädikat-Ziel des
   *  nachfolgenden `.filter()`. */
  type SektionsFussnote = Fussnote & { absatz: null; item: null; sektion: string };

  const nurFilter = parseNurFilter(process.argv);
  const bund = ERLASS_REGISTER.filter(
    (r) => r.ebene === 'bund' && r.status === 'snapshot' && (!nurFilter || nurFilter.has(r.key)),
  );
  if (nurFilter) {
    const gefunden = new Set(bund.map((r) => r.key));
    const unbekannt = [...nurFilter].filter((k) => !gefunden.has(k));
    if (unbekannt.length) {
      console.error(`struktur-run: --nur nennt unbekannte/nicht-snapshot Erlass-Key(s): ${unbekannt.join(', ')}`);
      process.exit(1);
    }
  }
  // Gegenprüfung #822 B3: `verarbeitet` zählt jeden erfolgreich extrahierten Erlass
  // (unabhängig davon, ob die Datei tatsächlich neu geschrieben wurde); `tatsaechlich-
  // Geschrieben` NUR die echten writeFileSync-Aufrufe. Vorher hiess die Summenzeile
  // «X geschrieben», zählte aber Verarbeitungen — bei --nur=OR mit Churn-Skip stand
  // «1/1 … » obwohl 0 Bytes auf die Platte gingen.
  let verarbeitet = 0;
  let tatsaechlichGeschrieben = 0;
  const fehlend: string[] = [];

  // Pin-Identität je Cache-Eintrag (§17, Gegenprüfung #808 B4) — dieselbe Quelle
  // (fedlex-cache.sh) wie normtext-snapshot.ts (sicherstelleCaches).
  const cachePins = new Map<string, FedlexCacheEintrag>(
    parseFedlexCacheEintraege(readFileSync('scripts/fedlex-cache.sh', 'utf8')).map((e) => [e.name, e]),
  );

  // P1-a/b (Querschnitts-Wurzel): /tmp-Caches überleben Neustarts NICHT und ein
  // fehlender ODER pin-veralteter Cache führte hier zu STILLEM Skip (continue) mit
  // Exit 0 → grüner No-op-Lauf, der die Sidecars der übersprungenen Erlasse still
  // veralten liess (Symptom «54 Sidecars ohne Erlassdatum»). Darum VOR dem Lauf die
  // Caches sicherstellen — genau wie der Snapshot-Generator (normtext-snapshot.ts).
  const alleFehlen = bund.filter((r) => !cacheGueltig(r.key, cachePins));
  if (alleFehlen.length > 0) {
    console.log(
      `\n[Cache] ${alleFehlen.length} HTML-Cache(s) fehlen oder sind pin-veraltet — lade via bash scripts/fedlex-cache.sh …`,
    );
    // `vorAbruf` + Pin-Nachzug (Gegenprüfung #808 B1/B4, identischer Mechanismus wie
    // `sicherstelleCaches` in normtext-snapshot.ts): fedlex-cache.sh lädt bei jedem
    // Aufruf AUSNAHMSLOS seine komplette EINTRAEGE-Liste neu (kein Skip-if-exists) —
    // ohne diesen Nachzug bliebe JEDER `/tmp/<key>.html` nach dem Fetch weiterhin
    // ohne `.pin`-Marker und `cacheGueltig` würde ihn ewig als «pin-veraltet» ablehnen
    // (Rot-Beweis dieses genauen Fehlers: erster Testlauf dieses Fixes, alle 227
    // Erlasse fälschlich «ohne verwertbaren Cache»). Nur TATSÄCHLICH frisch
    // geschriebene Dateien werden gestempelt (Teilfehler-Schutz, wie dort).
    const vorAbruf = Date.now();
    execSync('bash scripts/fedlex-cache.sh', { stdio: 'inherit' });
    for (const pin of cachePins.values()) {
      const pfad = `/tmp/${pin.name}.html`;
      if (warFrischGeschrieben(pfad, vorAbruf) && existsSync(pfad)) {
        writeFileSync(`${pfad}.pin`, pinIdentitaet(pin.eli, pin.konsolidierung, pin.htmlN), 'utf8');
      }
    }
  }

  // Randtitel kommen aus dem amtlichen XML (`fedlex:role="marginal"`), nicht aus der
  // HTML-Auszeichnung — gleicher Stand wie das HTML-Cache (Pin). Kein stiller Fallback:
  // fehlt das XML, bricht der Lauf ab (wie beim HTML-Cache).
  await sicherstelleXmlCaches(bund.map((r) => r.key), cachePins);

  for (const reg of bund) {
    const cache = `/tmp/${reg.key.toLowerCase()}.html`;
    if (!cacheGueltig(reg.key, cachePins)) { fehlend.push(reg.key); continue; }
    const html = readFileSync(cache, 'utf8');
    const struktur = extrahiereStruktur(html);
    // M13-Annex: Anhang-Gliederung («Anhänge») additiv ergänzen — Keys lockstep
    // mit den Snapshot-Annex-Tokens (gleicher Keep-Prädikat, Konsistenz-Tor).
    Object.assign(struktur, extrahiereAnhangStruktur(html));
    // Randtitel: XML-Rolle `marginal` ersetzt die HTML-Klassifikation (Wahl je Glied:
    // `waehleRandtitel` — HTML-Typografie, wo beide dieselben Buchstaben/Ziffern tragen).
    ueberlagereMarginalien(struktur, extrahiereMarginalienXml(readFileSync(xmlPfad(reg.key), 'utf8')));
    const anzahl = Object.keys(struktur).length;
    if (anzahl === 0) { fehlend.push(`${reg.key}(0)`); continue; }
    // Fussnoten (Änderungs-/AS/BBl-Historie) je Artikel dazumischen.
    const fussnoten = extrahiereFussnoten(html);
    const defs = fnDefinitionen(html);
    // Deterministisch sortierte Token-Schlüssel für diff-freundliches JSON.
    const sortiert: Record<string, unknown> = {};
    for (const tok of Object.keys(struktur).sort()) {
      const { randtitelFn, ...rest } = struktur[tok];
      const perArt = fussnoten[tok] ?? [];
      // Section-heading-Fussnoten auflösen (G11): absatz/item null → am Kopf, und
      // `sektion` trägt das Quell-Heading (Label), damit der Renderer den Marker am
      // richtigen Sektions-/Randtitel-Kopf setzt statt anonym auf Artikelebene.
      const rfn = (randtitelFn ?? [])
        .map((rf) => { const f = defs.get(rf.fnId); return f ? { ...f, absatz: null, item: null, sektion: rf.label } : null; })
        // Das Prädikat lautete `f is Fussnote` und war damit WEITER als der Wert,
        // den `.map()` erzeugt — TypeScript verwarf es (TS2677), `.filter()` fiel
        // auf die nicht-verengende Überladung zurück, `rfn` blieb typseitig
        // `(Fussnote | null)[]`. LAUFZEIT war davon nie betroffen: der Guard
        // `!!f` filtert die nulls seit jeher (Gegenprüfung 15.8.2026 hat die
        // Erst-Erzählung «Nulls im Sidecar» widerlegt). Die exakte Prädikat-Form
        // stellt nur die Typ-Verengung her (QS-TYP-LUECKE 15.8.2026).
        .filter((f): f is SektionsFussnote => !!f && !perArt.some((p) => p.nr === f.nr));
      // A43-Hinweis (David 16.7.): Die ANZEIGE-Reihenfolge der Fussnoten (laufende
      // Fedlex-Nummer) wird in der Darstellungsschicht hergestellt (ArtikelLeser
      // sortiert fussAnzeige), NICHT hier. Die Sidecar-Reihenfolge bleibt bewusst
      // [perArt, …rfn] (artikel-eigene VOR Section-heading-Fussnoten) — sie ist
      // load-bearing für den Revisions-Extrakt (revisionen-extrakt.ts, Gleichdatum-
      // Tie-Break first-wins): die eigene «Fassung gemäss»-Fussnote des Artikels muss
      // VOR einer gleichdatierten Section-heading-Fussnote stehen, sonst attribuiert
      // der Extrakt die Section-Revision fälschlich dem Artikel (§1/§3).
      const alle = [...perArt, ...rfn].map(mitKlasse);
      sortiert[tok] = alle.length ? { ...rest, fussnoten: alle } : rest;
    }
    // M5: Erlass-Kopf (preface/preamble) als Sidecar — golden-neutral (kein Snapshot).
    // W2·5i: die Kopf-Fussnoten (Ingress-/Präambel-Apparat) tragen `kl` ebenfalls —
    // sie sind im Reader dieselbe Bedienfläche (ErlassKopfBlock, data-fn-apparat).
    const kopfRoh = extrahiereKopf(html);
    const kopf = kopfRoh?.fussnoten?.length
      ? { ...kopfRoh, fussnoten: kopfRoh.fussnoten.map(mitKlasse) }
      : kopfRoh;
    // §6.7 (Gegenprüfung #808 B4): Version, aus der DIESER Sidecar gebaut wurde —
    // additiv wie `kl` (H0-Auflage 3): ältere Sidecars ohne dieses Feld werden
    // dadurch nicht rückwirkend rot (check-struktur-konsistenz.ts vergleicht nur,
    // wenn BEIDE Seiten die Felder tragen); sie erhalten es beim nächsten regulären
    // Regenerations-Lauf. Ermöglicht, einen Drift zu erkennen, bei dem der Snapshot
    // einen neuen `fassungsToken` auf unverändertem Artikel-Bestand trägt, der
    // Sidecar aber aus der alten Fassung stammt (Beleg DBG #695): gleiche
    // Artikel-Keys, aber veraltete Version.
    let version: { stand: string; fassungsToken: string } | undefined;
    const snapPfad = `public/normtext/bund/${reg.key}.json`;
    if (existsSync(snapPfad)) {
      try {
        const snap = JSON.parse(readFileSync(snapPfad, 'utf8')) as {
          eintraege?: Array<{ stand?: string; fassungsToken?: string }>;
        };
        const erster = snap.eintraege?.[0];
        if (erster?.stand && erster?.fassungsToken) version = { stand: erster.stand, fassungsToken: erster.fassungsToken };
      } catch {
        // Snapshot unlesbar/kein JSON: kein Version-Feld — Sidecar verhält sich wie vor §6.7.
      }
    }
    const metaBasis = version ? { erzeugt, ...version } : { erzeugt };
    const doc = kopf ? { ...metaBasis, kopf, artikel: sortiert } : { ...metaBasis, artikel: sortiert };
    const zielPfad = `${ZIEL}/${reg.key}.json`;
    const neuInhaltRoh = JSON.stringify(doc, null, 1) + '\n';
    const altInhalt = existsSync(zielPfad) ? readFileSync(zielPfad, 'utf8') : null;
    if (sollSchreiben(altInhalt, neuInhaltRoh)) {
      // §17 (Gegenprüfung #822 B2): eine bestehende `zaehler`-Zeile bleibt erhalten —
      // dieser Generator kennt den Block nicht, darf ihn beim Schreiben aber nicht löschen.
      writeFileSync(zielPfad, zaehlerZeileErhalten(altInhalt, neuInhaltRoh), 'utf8');
      tatsaechlichGeschrieben++;
    }
    verarbeitet++;
  }

  console.log(
    `Struktur-Sidecars: ${verarbeitet}/${bund.length} Bund-Erlasse${nurFilter ? ` (--nur=${[...nurFilter].join(',')})` : ''} → ${ZIEL}/, ` +
      `${tatsaechlichGeschrieben} geschrieben (${verarbeitet - tatsaechlichGeschrieben} unverändert/Churn übersprungen)`,
  );
  // «0 übersprungen»-Pflichtkontrolle (P1-a/b): ein übersprungener Erlass ist ein
  // harter Fehler, kein Hinweis — sonst regeneriert ein grüner No-op-Lauf still aus
  // veralteten/fehlenden Caches (Soft-404-Shell → 0 Token → früher lautlos skip).
  if (fehlend.length) {
    console.error(
      `\nFEHLER: ${fehlend.length} Erlass(e) ohne verwertbaren Cache übersprungen: ${fehlend.join(', ')}\n` +
        `→ 'bash scripts/fedlex-cache.sh' erfolgreich laufen lassen (kanonische html-N-Pins prüfen); ` +
        `ein (0) markiert eine Soft-404-Shell/leeren Extrakt — Pin-Kanonik in fedlex-cache.sh prüfen.`,
    );
    process.exit(1);
  }
}

if (istCliLauf) main().catch((e: unknown) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
