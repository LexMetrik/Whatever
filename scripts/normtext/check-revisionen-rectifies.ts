/**
 * scripts/normtext/check-revisionen-rectifies.ts — Netz-Arm «rectifies-Ziel vs.
 * Berichtigungstext» (Fehlerbuch ROADMAP W2·18, Kontext PR #827/#828/#834).
 *
 * Fedlex' `jolux:rectifies` kann auf das FALSCHE AS-Dokument zeigen (belegt: AS 2025 686
 * SKV — Ziel AS 2025 648 = TAFV 2, der amtliche Berichtigungstext selbst nennt aber
 * AS 2025 644 = SKV). `check:revisionen` (offline, Prüfung 8/8b) prüft nur, dass der
 * §8-Marker `plausibilitaet` konsistent mit dem GESPEICHERTEN `jolux:rectifies`-Tripel ist —
 * es prüft NICHT, ob dieses Tripel selbst mit dem amtlichen BERICHTIGUNGSTEXT (Filestore-
 * HTML des berichtigenden AS) übereinstimmt. Das ist die Lücke, die dieser Netz-Arm schliesst.
 *
 * NETZ, kein Offline-Pflichttor (Filestore-HTML nötig, s. `rectifies-berichtigung.ts`) —
 * läuft in `check:netz:kette` im selben Rhythmus wie `check:revisionen-netz`. K1 (schützt
 * Datentreue, Skill `refactoring` §7).
 *
 * Klassen je rectifies-Kante (oc → dessen `jolux:rectifies`-Ziel):
 *   uebereinstimmend  — der amtliche Berichtigungstext nennt die Fundstelle/SR des Ziels.
 *   abweichend        — er nennt eine ANDERE (Befund, §7: gelistet, nie in Prosa gedeutet —
 *                        kann ein Fedlex-Datenfehler sein, muss es aber nicht).
 *   sammelberichtigung — der Text nennt MEHR ALS EINE Fundstelle; das rectifies-Tripel
 *                        trägt nur eine davon (§8-Ehrlichkeit, wie `baueOcZuRectifiesSr`).
 *   nicht-abrufbar     — keine HTML-Manifestation oder Casemates-Hülle (Skill-Falle 3) —
 *                        eine Lücke wird GELISTET, nie geraten.
 *   stale              — WAR als `abweichend` dokumentiert-entschärft (Ausnahmeliste), aber
 *                        das aktuell gemessene Paar (rectifies-Ziel + Text-Fundstelle) passt
 *                        nicht mehr zum dokumentierten Paar (§6.7-Stale-Schutz, Gegenprüfung
 *                        PR #834 Auflage 3, s. `ausnahmeGueltig`). Rot wie ein unbelegtes
 *                        `abweichend` — eine Ausnahme, die egal welchem neuen Tripel weiter
 *                        stillschweigend zustimmt, wäre ein Freibrief, kein Beleg.
 *
 * Exit 1 bei `abweichend` ohne (gültigen) Eintrag in
 * `bibliothek/normtext/rectifies-ausnahmen.json` ODER bei `stale` (Identität = exakte
 * oc-URI, kein Substring) ODER bei einer nicht konsumierten Ausnahme der Stufe `rot` (Auflage
 * B3, Runde 2, DREISTUFIG verschärft Nachzug R2b F2, s. `findeNichtKonsumierteAusnahmen`): eine
 * Ausnahme, deren oc auf eine `uebereinstimmend`/`sammelberichtigung`-Kante trifft, ist ein
 * stiller, nie mehr scheiternder Freibrief (§6.7) — ROT. Die beiden anderen Stufen bleiben
 * SICHTBAR, aber GRÜN: `warnung` (das oc kommt im geprüften Bestand gar nicht vor — kann nichts
 * verdecken, evtl. Daten noch nicht geladen oder Kante bei Fedlex entfallen) und `hinweis` (die
 * Kante existiert, ist aber `nicht-abrufbar` — zurzeit nicht prüfbar, Eintrag NICHT löschen).
 * `sammelberichtigung`/`nicht-abrufbar` bleiben grün (dokumentierter Befund, keine Behauptung
 * eines Fehlers).
 *
 * ── Live-Befund 12.9.2026 (Mass, nicht übernommen — Auftragstext nannte ≈16/1/1/n) ──
 * 25 rectifies-Kanten im Korpus (nicht 71 — Schätzung des Auftrags widerlegt, §0/§17
 * «messen, nicht übernehmen»): 14 uebereinstimmend, 2 abweichend, 2 sammelberichtigung,
 * 7 nicht-abrufbar (nur pdf-a/docx, keine HTML-Manifestation).
 *
 * ── Stand 18.9.2026 (2b: ergänzt, nicht nachgeführt — der Satz oben bleibt der 12.9.-Beleg
 * stehen; der Korpus ist seither gewachsen und die Klassifikation nach Blöcken statt roher
 * AS-Anzahl korrigiert, Gegenprüfung Opus Auflagen B1/B2, s. `rectifies-berichtigung.ts`) ──
 * 31 rectifies-Kanten (Modus `auto` UND `netz`, live gemessen 18.9.2026, identisches
 * Ergebnis): 19 uebereinstimmend, 2 abweichend (AIG/oc/2025/342, SKV/oc/2025/686 — beide
 * weiter per Ausnahmeliste grün), 8 nicht-abrufbar, 2 sammelberichtigung (VVEA/oc/2023/543,
 * SSV/oc/2024/144). VTS/oc/2025/691 zählt jetzt korrekt zu uebereinstimmend (vor B1/B2 wäre
 * es fälschlich als sammelberichtigung durchgerutscht, s. Fixture-Test).
 *
 * ── Ergänzung 12.9.2026, Gegenprüfung PR #834 (Auflage 1) ── (2b: ergänzt, nicht
 * nachgeführt — der obige Mess-Satz bleibt stehen) Beide `abweichend`-Funde sind jetzt
 * amtlich eingeordnet und in `rectifies-ausnahmen.json` belegt: SKV/oc/2025/686 (Erst-Fund,
 * PR #827) UND AIG/oc/2025/342 (ZWEITER Fedlex-Datenfehler — der Berichtigungstext korrigiert
 * die AsylG-Änderung AS 2016 3101/AIG Art. 80, das rectifies-Ziel `eli/oc/2018/438` ist aber
 * eine reine, normtextlose Inkraftsetzungsverordnung, s. `rectifies-berichtigung.ts`-Docstring
 * und den Ausnahme-Eintrag für Volltext-Beleg). Das Tor zeigt damit wieder grün — der
 * Stale-Schutz oben sorgt dafür, dass es das nicht stillschweigend BLEIBT, sollte Fedlex das
 * Tripel je wieder ändern. Da dieser Arm nur in `check:netz:kette`
 * (Schedule/`workflow_dispatch`, s. `normen-monitor.yml`) läuft, blockiert ein Rot-Fund hier
 * nie einen PR-Merge — er öffnet den «Bei Rot»-Aufgaben-Zettel des Monitors.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import {
  ausnahmeGueltig, extrahiereHeadlineZitate, findeNichtKonsumierteAusnahmen, formatiereBefundDetail,
  holeBerichtigungstext, kanonischeTextFundstelle, klassifiziereBerichtigung, loeseBerichtigungsHtmlUrl,
  type RectifiesAusnahme, type RectifiesKlasse,
} from './rectifies-berichtigung.ts';
import { holeMitCache, modusAusUmgebung } from './rectifies-cache.ts';
import type { RectifiesInfo } from './revisionen-generieren.ts';

const RAW_DIR = 'bibliothek/normtext/revisionen-raw';
const AUSNAHMEN_PFAD = 'bibliothek/normtext/rectifies-ausnahmen.json';

interface Kante { erlassKey: string; oc: string; info: RectifiesInfo }
type Klasse = RectifiesKlasse | 'nicht-abrufbar' | 'stale';
interface Befund {
  erlassKey: string; oc: string; klasse: Klasse; detail: string;
  /** Kanonische Text-Fundstelle (s. `kanonischeTextFundstelle`) — Grundlage des Stale-Vergleichs
   *  gegen `erwarteteTextFundstelle`. `undefined` nur bei 0 erkannten Headline-Zitaten
   *  (Parser-Lücke, s. `formatiereBefundDetail`).
   *  ── Nachzug R2b, F3 (2b: ergänzt, nicht nachgeführt — Ergänzung 18.9.2026 unten bleibt
   *  stehen) ── die vorherige Fassung setzte dieses Feld NUR bei `zitate.as.length === 1`; bei
   *  MEHREREN AS-Fundstellen (Sammelberichtigung mit 2 Blöcken ODER eine Klammer mit mehreren
   *  komma-getrennten Nummern) blieb es `undefined`, wodurch `ausnahmeGueltig` `'' === ''`
   *  verglich — die Stale-Sicherung war damit für JEDE Mehrfach-AS-Kante stillschweigend
   *  ausgeschaltet (§6.7). Jetzt: `kanonischeTextFundstelle(zitate.as)`, bei genau einer
   *  Fundstelle byte-gleich zur bisherigen Form.
   *  ── Ergänzung 18.9.2026, Gegenprüfung Opus Auflage B3 ── der Code setzte dieses Feld VORHER
   *  UNCONDITIONIERT (`zitate.as[0]`) — seit `klassifiziereBerichtigung` nach Blöcken klassiert
   *  (Auflage B2), kann `abweichend` auch bei MEHR als einer genannten Fundstelle auftreten. */
  textFundstelle?: string;
}

/** Alle rectifies-Kanten aus den committeten store-raw-Dateien (§2: kein erneuter
 *  SPARQL-Aufruf für die Kantenliste selbst — die ist bereits Teil der Pipeline-1-Ausgabe;
 *  NUR der Berichtigungstext-Abgleich unten ist der frische Netz-Schritt dieses Tors). */
export function ladeKanten(rawDir: string = RAW_DIR): Kante[] {
  if (!existsSync(rawDir)) return [];
  const kanten: Kante[] = [];
  for (const datei of readdirSync(rawDir).filter((f) => f.endsWith('.json')).sort()) {
    const erlassKey = datei.slice(0, -5);
    const raw = JSON.parse(readFileSync(`${rawDir}/${datei}`, 'utf8')) as {
      rectifiesInfoProOc?: Record<string, RectifiesInfo>;
    };
    for (const [oc, info] of Object.entries(raw.rectifiesInfoProOc ?? {})) kanten.push({ erlassKey, oc, info });
  }
  return kanten.sort((a, b) => (a.erlassKey !== b.erlassKey
    ? (a.erlassKey < b.erlassKey ? -1 : 1)
    : (a.oc < b.oc ? -1 : a.oc > b.oc ? 1 : 0)));
}

export function ladeAusnahmen(pfad: string = AUSNAHMEN_PFAD): Map<string, RectifiesAusnahme> {
  if (!existsSync(pfad)) return new Map();
  const arr = JSON.parse(readFileSync(pfad, 'utf8')) as RectifiesAusnahme[];
  return new Map(arr.map((a) => [a.oc, a]));
}

async function pruefeKante(k: Kante, modus: ReturnType<typeof modusAusUmgebung>): Promise<Befund> {
  try {
    const treffer = await holeMitCache(k.oc, async () => {
      const url = await loeseBerichtigungsHtmlUrl(k.oc);
      if (!url) throw new Error('keine html-Manifestation (nur pdf-a/docx?) — Skill-Falle 3: nie raten.');
      const html = await holeBerichtigungstext(url);
      return { url, html };
    }, modus);
    const zitate = extrahiereHeadlineZitate(treffer.html);
    const klasse = klassifiziereBerichtigung(zitate, k.info);
    const detail = formatiereBefundDetail(zitate, k.info, klasse);
    return { erlassKey: k.erlassKey, oc: k.oc, klasse, detail, textFundstelle: kanonischeTextFundstelle(zitate.as) };
  } catch (e) {
    return { erlassKey: k.erlassKey, oc: k.oc, klasse: 'nicht-abrufbar', detail: (e as Error).message };
  }
}

async function main(): Promise<void> {
  if (!existsSync(RAW_DIR)) {
    console.error(`check:revisionen-rectifies ROT: ${RAW_DIR} fehlt — Tor kann nicht laufen (§6.7 kein stilles Grün).`);
    process.exit(2);
  }
  const kanten = ladeKanten();
  const ausnahmen = ladeAusnahmen();
  const modus = modusAusUmgebung();

  const befunde: Befund[] = [];
  for (const k of kanten) {
    const befund = await pruefeKante(k, modus);
    if (befund.klasse === 'abweichend') {
      const ausnahme = ausnahmen.get(befund.oc);
      if (ausnahme) {
        const gueltig = ausnahmeGueltig(ausnahme, {
          zielOc: k.info.zielOc, zielFundstelle: k.info.zielFundstelle, textFundstelle: befund.textFundstelle,
        });
        if (!gueltig) {
          befund.klasse = 'stale';
          befund.detail = `Ausnahmeliste-Eintrag seit ${ausnahme.seit} passt NICHT MEHR zum frischen Mass `
            + `(erwartet Ziel ${ausnahme.erwartetesZielOc} / Fundstelle ${ausnahme.erwarteteZielFundstelle ?? '∅'} / `
            + `Text ${ausnahme.erwarteteTextFundstelle ?? '∅'}; aktuell Ziel ${k.info.zielOc} / `
            + `Fundstelle ${k.info.zielFundstelle ?? '∅'} / Text ${befund.textFundstelle ?? '∅'}) — neu einordnen.`;
        }
      }
    }
    befunde.push(befund);
  }

  const counts: Partial<Record<Klasse, number>> = {};
  for (const b of befunde) counts[b.klasse] = (counts[b.klasse] ?? 0) + 1;

  console.log(`check:revisionen-rectifies: ${kanten.length} rectifies-Kante(n) geprüft (Modus ${modus}).`);
  console.log(`Klassen: ${JSON.stringify(counts)}`);

  const nichtGruen = befunde
    .filter((b) => b.klasse !== 'uebereinstimmend')
    .sort((a, b) => (a.oc < b.oc ? -1 : a.oc > b.oc ? 1 : 0));
  for (const b of nichtGruen) {
    const ausnahme = b.klasse === 'abweichend' ? ausnahmen.get(b.oc) : undefined;
    const marker = ausnahme ? ` [Ausnahmeliste seit ${ausnahme.seit}]` : '';
    console.log(`  - ${b.erlassKey} ${b.oc} → ${b.klasse}${marker}: ${b.detail}`);
  }

  const rot = befunde.filter((b) => b.klasse === 'stale' || (b.klasse === 'abweichend' && !ausnahmen.has(b.oc)));
  const nichtKonsumiert = findeNichtKonsumierteAusnahmen(ausnahmen, befunde);
  const nkWarnung = nichtKonsumiert.filter((n) => n.stufe === 'warnung');
  const nkHinweis = nichtKonsumiert.filter((n) => n.stufe === 'hinweis');
  const nkRot = nichtKonsumiert.filter((n) => n.stufe === 'rot');

  if (rot.length) {
    console.error(`\ncheck:revisionen-rectifies ROT: ${rot.length} unbelegte/veraltete Abweichung(en):`);
    for (const b of rot) console.error(`  - ${b.erlassKey} ${b.oc} (${b.klasse}): ${b.detail}`);
    console.error(
      `Beleg-URL amtlich prüfen und — nur bei bestätigtem Fedlex-Datenfehler (§7) — Eintrag `
      + `in ${AUSNAHMEN_PFAD} ergänzen/nachführen (oc + seit + belegUrl + begruendung + `
      + `erwartetesZielOc + erwarteteZielFundstelle + erwarteteTextFundstelle).`,
    );
  }
  // Dreistufig statt pauschal rot (Nachzug R2b, F2): nur `rot` zählt zum Exit-Code. `warnung`
  // (oc gar keine Kante mehr — kann nichts verdecken) und `hinweis` (Kante zurzeit
  // `nicht-abrufbar` — Eintrag NICHT löschen) sind sichtbar, aber nicht blockierend.
  if (nkWarnung.length) {
    console.warn(`\ncheck:revisionen-rectifies WARNUNG: ${nkWarnung.length} Ausnahmeliste-Eintrag/-einträge ohne passende Kante:`);
    for (const { ausnahme } of nkWarnung) {
      console.warn(`  - ${ausnahme.oc} (seit ${ausnahme.seit}): Ausnahme-oc nicht im geprüften Bestand `
        + '(Daten noch nicht geladen oder Kante bei Fedlex entfallen) — prüfen.');
    }
  }
  if (nkHinweis.length) {
    console.log(`\ncheck:revisionen-rectifies HINWEIS: ${nkHinweis.length} Ausnahmeliste-Eintrag/-einträge zurzeit nicht prüfbar:`);
    for (const { ausnahme } of nkHinweis) {
      console.log(`  - ${ausnahme.oc} (seit ${ausnahme.seit}): zurzeit nicht prüfbar (nicht-abrufbar) — Eintrag NICHT löschen.`);
    }
  }
  if (nkRot.length) {
    console.error(
      `\ncheck:revisionen-rectifies ROT: ${nkRot.length} nicht konsumierte Ausnahmeliste-Eintrag/`
      + `-einträge (Auflage B3, §6.7 — ein Tor, das nicht scheitern kann, ist gefährlicher als keines):`,
    );
    for (const { ausnahme } of nkRot) {
      console.error(
        `  - ${ausnahme.oc} (seit ${ausnahme.seit}): keine aktuelle abweichend/stale-Kante trifft mehr zu — `
        + `Kante ist jetzt uebereinstimmend/sammelberichtigung. Eintrag in ${AUSNAHMEN_PFAD} entfernen `
        + 'oder neu einordnen.',
      );
    }
  }
  if (rot.length || nkRot.length) process.exit(1);
  console.log('check:revisionen-rectifies grün: keine unbelegte/veraltete Abweichung, alle Ausnahmen konsumiert oder erklärt.');
}

await main();
