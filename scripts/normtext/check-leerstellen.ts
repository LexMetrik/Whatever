/**
 * check:leerstellen — Wächter über UNGEKLÄRTE Leerstellen im Normtext-Korpus
 * (W2·27-BUND-FERTIG, Checklisten-Zeile «`aufgehoben` strukturell statt
 * Text-Heuristik»).
 *
 * ANLASS (§7/§8). Bis 14.9.2026 galt ein Artikel allein deshalb als aufgehoben,
 * weil sein Body leer oder «…» war (`artikelGanzAufgehoben`, Text-Heuristik) —
 * 1 375 Bund-Artikel. Ein EXTRAKTIONSFEHLER sieht genauso aus: fällt ein Absatz
 * beim Parsen weg, zeigt der Leser den Artikel still als «aufgehoben» und
 * niemand erfährt davon. Seit der Regeneration tragen 1 277 Bund-Artikel das
 * AMTLICHE Feld `aufgehoben` (Signal: `aufhebung-signal.ts`). Was übrig bleibt —
 * Platzhalter-Body OHNE amtliches Signal — ist genau die Klasse, die vorher
 * unsichtbar war. Dieses Tor zählt sie und hält sie auf ihrem Stand fest.
 *
 * WAS GEMESSEN WIRD. Über jeden committeten Snapshot
 * (`public/normtext/{bund,kanton}/**.json`): ein Artikel ist eine UNGEKLÄRTE
 * LEERSTELLE, wenn die Text-Heuristik ihn für ganz aufgehoben hält
 * (`artikelGanzAufgehoben(bloecke)` — dieselbe Funktion, die der Leser fährt,
 * §5) UND das deklarierte Feld `aufgehoben` NICHT gesetzt ist.
 *
 * VERDIKT. Rot bei ZUWACHS gegen die committete Basislinie
 * (`leerstellen-basislinie.json`) — je Erlass-Key, nicht nur in der Summe: eine
 * neue Leerstelle in KVG darf nicht von einer beseitigten in OR aufgewogen
 * werden. Ein RÜCKGANG ist grün und wird als Hinweis gemeldet (Basislinie mit
 * `--schreibe` nachziehen). Ein Erlass, der in der Basislinie fehlt und Fälle
 * hat, ist rot — sonst wäre jeder neue Erlass eine Gratis-Amnestie.
 *
 * WARUM EINE BASISLINIE UND KEINE NULL. Die 83 Bund-Restfälle (Messung
 * 14.9.2026) sind keine Bugs auf Halde, sondern vier belegte Klassen, die alle
 * eine eigene fachliche Antwort brauchen (Fahrplan FAHRPLAN-BUND-FERTIG §1):
 *   (1) Änderungs-Artikel — «…» + Fussnote «Die Änderung kann unter AS …
 *       konsultiert werden» (AVIG Art. 115, BGFA Art. 35, VGG Art. 50–52). Die
 *       Bestimmung ist NICHT aufgehoben; Fedlex zeigt ihren Inhalt nur nicht.
 *   (2) Noch nicht in Kraft — «Tritt zu einem späteren Zeitpunkt in Kraft»
 *       (AIG Art. 126f) bzw. befristete Bestimmungen (EPV Art. 64a–64j).
 *   (3) Amtliche Vermerke ausserhalb der Fussnoten-Grammatik: «Gegenstandslos»
 *       (StGB Art. 67f), «Dieser Art. bleibt aus gesetzestechnischen Gründen
 *       leer» (StGB Art. 108), «Diese aufgehobenen Art. werden … ersetzt durch»
 *       (StGB Art. 201–212) und der amtliche Tippfehler «Aufgehobn durch …»
 *       (BKV Art. 8).
 *   (4) Anhänge (`annex_*`) — eigenes `<section>`-Schema, vom Artikel-Signal
 *       noch nicht erfasst (AKKBV Anhang 3, EPV Anhang 1/2, EBG Anhang).
 * Sie auf 0 zu zwingen hiesse raten (§7). Sichtbar halten ist die ehrliche
 * Antwort (§8) — und der Zuwachs-Riegel fängt genau den Extraktionsfehler, um
 * dessentwillen das Tor existiert.
 *
 * KANTON steht mit eigener Basislinie in derselben Messung (481 Fälle,
 * 14.9.2026). Der Kanton-Adapter setzt `aufgehoben` bereits strukturell
 * (LexWork, G-AUFH-ART); die Restmenge wandert in Phase 2 auf das Bund-Sollbild.
 *
 * Aufruf:  npm run check:leerstellen
 *          npm run check:leerstellen -- --schreibe   (Basislinie neu schreiben)
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { artikelGanzAufgehoben } from '../../src/lib/normtext/darstellung.ts';

const wurzel = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const BASISLINIE = resolve(wurzel, 'scripts/normtext/leerstellen-basislinie.json');

interface Eintrag {
  artikelLabel: string;
  bloecke: Parameters<typeof artikelGanzAufgehoben>[0];
  aufgehoben?: true;
}

interface Datei {
  eintraege?: Eintrag[];
}

/** Alle *.json unterhalb eines Verzeichnisses (rekursiv, sortiert). */
function jsonDateien(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...jsonDateien(p));
    else if (name.endsWith('.json')) out.push(p);
  }
  return out;
}

export interface Fund {
  ebene: 'bund' | 'kanton';
  key: string;
  label: string;
}

/** Ungeklärte Leerstellen einer Ebene: Heuristik greift, Feld fehlt. */
export function sammleLeerstellen(wurzelDir: string, ebene: 'bund' | 'kanton'): Fund[] {
  const funde: Fund[] = [];
  for (const pfad of jsonDateien(join(wurzelDir, 'public/normtext', ebene))) {
    const key = pfad.slice(pfad.lastIndexOf('/') + 1).replace(/\.json$/, '');
    let doc: Datei;
    try {
      doc = JSON.parse(readFileSync(pfad, 'utf8')) as Datei;
    } catch {
      continue; // Nicht-Snapshot-JSON (Index-Dateien) — nie stillschweigend als Fund werten
    }
    if (!Array.isArray(doc.eintraege)) continue;
    for (const e of doc.eintraege) {
      if (e.aufgehoben) continue; // amtlich deklariert ⇒ geklärt
      if (!Array.isArray(e.bloecke)) continue;
      if (artikelGanzAufgehoben(e.bloecke)) funde.push({ ebene, key, label: e.artikelLabel });
    }
  }
  return funde;
}

/** Funde → `{ebene: {key: anzahl}}`, deterministisch sortiert. */
export function zuBasislinie(funde: readonly Fund[]): Record<string, Record<string, number>> {
  const roh: Record<string, Record<string, number>> = { bund: {}, kanton: {} };
  for (const f of funde) roh[f.ebene][f.key] = (roh[f.ebene][f.key] ?? 0) + 1;
  const out: Record<string, Record<string, number>> = {};
  for (const ebene of Object.keys(roh).sort()) {
    out[ebene] = Object.fromEntries(Object.entries(roh[ebene]).sort(([a], [b]) => (a < b ? -1 : 1)));
  }
  return out;
}

/** Vergleich Ist ↔ Basislinie. `rot` = Zuwachs oder unbekannter Erlass. */
export function vergleiche(
  ist: Record<string, Record<string, number>>,
  basis: Record<string, Record<string, number>>,
): { rot: string[]; rueckgang: string[]; summeIst: number; summeBasis: number } {
  const rot: string[] = [];
  const rueckgang: string[] = [];
  let summeIst = 0;
  let summeBasis = 0;
  for (const ebene of Object.keys(ist)) {
    for (const [key, n] of Object.entries(ist[ebene])) {
      summeIst += n;
      const b = basis[ebene]?.[key];
      if (b === undefined) rot.push(`${ebene}/${key}: ${n} ungeklärte Leerstelle(n), NICHT in der Basislinie`);
      else if (n > b) rot.push(`${ebene}/${key}: ${n} ungeklärte Leerstelle(n), Basislinie ${b} (+${n - b})`);
      else if (n < b) rueckgang.push(`${ebene}/${key}: ${n} statt ${b}`);
    }
  }
  for (const ebene of Object.keys(basis)) {
    for (const [key, b] of Object.entries(basis[ebene])) {
      summeBasis += b;
      if (ist[ebene]?.[key] === undefined) rueckgang.push(`${ebene}/${key}: 0 statt ${b}`);
    }
  }
  return { rot, rueckgang, summeIst, summeBasis };
}

// ── CLI ───────────────────────────────────────────────────────────────────────
// Test-Importe (VITEST) fahren nur die reinen Bausteine oben — kein Datei-Zugriff,
// kein process.exit (gleiche Konvention wie struktur-run.ts).
const istCliLauf = !process.env.VITEST;
if (istCliLauf) {
  const funde = [...sammleLeerstellen(wurzel, 'bund'), ...sammleLeerstellen(wurzel, 'kanton')];
  const ist = zuBasislinie(funde);

  if (process.argv.includes('--schreibe')) {
    writeFileSync(BASISLINIE, `${JSON.stringify(ist, null, 2)}\n`, 'utf8');
    console.log(`check:leerstellen — Basislinie geschrieben: ${funde.length} ungeklärte Leerstelle(n).`);
    process.exit(0);
  }

  const basis = JSON.parse(readFileSync(BASISLINIE, 'utf8')) as Record<string, Record<string, number>>;
  const { rot, rueckgang, summeIst, summeBasis } = vergleiche(ist, basis);

  if (rot.length) {
    console.error(
      `\ncheck:leerstellen ROT — ${rot.length} Erlass(e) mit ZUWACHS an ungeklärten Leerstellen.\n` +
        'Eine ungeklärte Leerstelle ist ein Artikel, dessen Body leer/«…» ist, OHNE dass die\n' +
        'amtliche Fedlex-Fussnote ihn als aufgehoben ausweist — genau die Signatur eines\n' +
        'Extraktionsfehlers (§7/§8). Prüfen, NICHT die Basislinie hochschreiben:\n',
    );
    for (const z of rot) console.error(`  ✗ ${z}`);
    console.error(
      `\nSumme: ${summeIst} ist / ${summeBasis} Basislinie.\n` +
        'Ist der Zuwachs amtlich belegt (neuer Erlass, neue Konsolidierung), Basislinie mit\n' +
        '`npm run check:leerstellen -- --schreibe` nachziehen UND im PR begründen.\n',
    );
    process.exit(1);
  }

  console.log(`check:leerstellen OK — ${summeIst} ungeklärte Leerstelle(n) (Basislinie ${summeBasis}).`);
  for (const z of rueckgang) console.log(`  ↓ ${z} (Basislinie darf schrumpfen: --schreibe)`);
}
