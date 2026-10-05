/**
 * ZH-4a · Auflöse-Werkzeug für die deklarative ZH-Quellenliste (`zh-quellen.ts`).
 *
 *   npx vite-node scripts/normtext/zh-quellen-aufloesen.ts            # Liste prüfen
 *   npx vite-node scripts/normtext/zh-quellen-aufloesen.ts 550.1 700.1 # Nummern auflösen
 *   npx vite-node scripts/normtext/zh-quellen-aufloesen.ts --ordner=3,4,10
 *                                       # ganze Systematik-Ordner enumerieren
 *
 * Ohne Argumente prüft es die eingetragenen Erlasse gegen die amtliche Quelle
 * (Titel + Registry-URL der geltenden Fassung) und meldet jede Abweichung mit
 * Exit 1 — so wird eine still veraltete Registry-URL (neue Nachtragsnummer)
 * sichtbar, statt erst im Lauf als 404 aufzuschlagen. Mit Argumenten löst es
 * beliebige LS-Ordnungsnummern auf und druckt fertige `ZH_QUELLEN`-Einträge.
 *
 * VERDRAHTUNG (Befund B3, Fix-Runde 4, 31.8.2026): Der Prüfmodus läuft als
 * ZH-Teil von `check:normtext-netz` (package.json) und damit über `check:netz`
 * im wöchentlichen Cron `.github/workflows/normen-monitor.yml`. WARUM: die
 * Drift-Prüfung der Snapshots hasht die versionsGEPINNTE Registry-URL — eine
 * alte Registry-Seite liefert aber auf ewig HTTP 200 mit dem alten PDF
 * (empirisch belegt an 211.1 Suppl. 129), ein NEUER Nachtrag bliebe dem
 * Drift-Tor also unsichtbar. Erst der Vergleich gegen die amtliche SUCHE
 * (geltende Fassung) macht den überholten Pin rot. Rot-Beweis 31.8.2026:
 * 211.1-Pin künstlich auf die historische …-129.html zurückgesetzt → FEHLER
 * «URL ist …-131.html», Exit 1; am echten Stand grün.
 *
 * ORDNER-MODUS (Tranche A, 1.9.2026): `--ordner=N[,M]` enumeriert alle in Kraft
 * stehenden Erlasse eines der 14 amtlichen Systematik-Ordner über denselben
 * JSON-Endpunkt mit `fileNumber=N` und blättert `page` durch (15 Treffer/Seite).
 * WARUM eine eigene Betriebsart: die Einzelauflösung braucht einen Request JE
 * Ordnungsnummer (170 Erlasse = 170 Requests ≈ 3 min); ordner-weise sind es
 * ~12. Die Kappungs-Falle (>150 Treffer) bleibt bewacht — sie kann hier nicht
 * greifen, weil je `fileNumber` geblättert wird, aber die Prüfung bleibt stehen.
 *
 * §5: DIESES Werkzeug erzeugt die Einträge in `zh-quellen.ts` — die Liste wird
 * nie von Hand geraten. §2: keine Rechenlogik, reines Erhebungs-/Prüfwerkzeug.
 *
 * Netz-Disziplin (Dossier §5): ~1 req/s seriell gegen zh.ch, UA mit Kontakt,
 * AEM-Komponenten-ID zur Laufzeit aufgelöst, HTTP-204-Leerbody abgefangen.
 *
 * EXIT 2 (5.10.2026, MONITOR-Rückbau): Quelle nach allen Wiederholungen nicht erreichbar
 * (Netzfehler, 429/5xx) ⇒ «keine Aussage» statt Exit 1 — vorher stand ein Netz-Ausfall als
 * Gesetzestext-ROT in der Monitor-Tafel. Eine echte Abweichung (Exit 1) hat Vorrang;
 * strukturelle Fehler (Komponenten-ID, Kappung) bleiben rot. Probe: fetch-Stub, der wirft ⇒
 * Exit 2.
 */

import { ZH_QUELLEN, type ZhQuelle } from './zh-quellen.ts';
import { fetchMitWiederholung, istWiederholbarerStatus } from './netz-retry.ts';

const UA = 'LexMetrik-Import/1.0 (kontakt: david.graf95@gmail.com)';
const BASIS = 'https://www.zh.ch/de/politik-staat/gesetze-beschluesse/gesetzessammlung';
const ABSTAND_MS = 1100;

const schlaf = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/** Quelle nach allen Wiederholungen nicht erreichbar — keine Aussage (Exit 2). */
class NetzFehler extends Error {}

async function hole(url: string): Promise<Response> {
  await schlaf(ABSTAND_MS);
  let res: Response;
  try {
    res = await fetchMitWiederholung(url, { headers: { 'User-Agent': UA } });
  } catch (e) {
    throw new NetzFehler(e instanceof Error ? e.message : String(e));
  }
  if (istWiederholbarerStatus(res.status)) throw new NetzFehler(`HTTP ${res.status} für ${url}`);
  return res;
}

function keineAussage(e: unknown): never {
  if (!(e instanceof NetzFehler)) throw e;
  console.error(`zh-quellen KEINE AUSSAGE (Exit 2) — Quelle nicht erreichbar: ${e.message}`);
  process.exit(2);
}

/** AEM-Komponenten-ID aus der server-gerenderten Suchseite (nie verdrahten). */
async function komponentenId(): Promise<string> {
  const res = await hole(`${BASIS}.html`);
  if (!res.ok) throw new Error(`Suchseite: HTTP ${res.status}`);
  const html = await res.text();
  const ids = [...new Set([...html.matchAll(/lawcollectionsearch_(\d+)/g)].map((m) => m[1]))];
  if (ids.length !== 1) {
    throw new Error(`Erwartet genau eine lawcollectionsearch-Komponenten-ID, gefunden: ${ids.join(', ') || 'keine'}`);
  }
  return ids[0];
}

interface Satz {
  link: string;
  referenceNumber: string;
  enactmentTitle: string;
  withdrawalDate?: string;
}

/** Geltende Fassung zu einer Ordnungsnummer; null = kein eindeutiger Treffer. */
async function loese(id: string, nr: string): Promise<ZhQuelle | null> {
  const url =
    `${BASIS}/_jcr_content/main/lawcollectionsearch_${id}.zhweb-zhlex-ls.zhweb-cache.json` +
    `?referenceNumber=${encodeURIComponent(nr)}&includeRepealedEnactments=false`;
  const res = await hole(url);
  // Falle: 0 Treffer → HTTP 204 mit LEEREM Body (kein JSON).
  if (res.status === 204) return null;
  const txt = await res.text();
  if (!res.ok || txt.trim().length === 0) return null;
  const json = JSON.parse(txt) as { data?: Satz[]; moreSearchResultsThanAllowed?: boolean };
  if (json.moreSearchResultsThanAllowed) {
    throw new Error(`${nr}: Endpunkt meldet Kappung (>150) — Abfrage verfeinern`);
  }
  const exakt = (json.data ?? []).filter((s) => s.referenceNumber === nr && !s.withdrawalDate);
  if (exakt.length !== 1) return null;
  const s = exakt[0];
  // Der Endpunkt hängt bei einigen Erlassen ein bis zwei Leerzeichen an
  // («Gemeindegesetz (GG) »). Das ist Transport-Artefakt, nicht Titelbestandteil
  // — hier EINMAL getrimmt, damit Liste und Prüfung dieselbe Normalisierung
  // sehen. (Ohne das meldete die Prüfung 4 von 20 Erlassen dauerhaft als
  // Abweichung, obwohl nur das Leerzeichen differierte — Befund 31.8.2026.)
  const titel = s.enactmentTitle.trim();
  const klammer = titel.match(/\(([^()]+)\)\s*$/);
  return {
    nr,
    titel,
    kuerzel: klammer ? klammer[1] : '',
    registryUrl: new URL(s.link, 'https://www.zh.ch').toString(),
  };
}

/**
 * Alle in Kraft stehenden Erlasse eines Systematik-Ordners (`fileNumber`),
 * seitenweise. Reihenfolge = LS-Ordnungsnummer (deterministisch sortiert).
 */
async function loeseOrdner(id: string, ordner: string): Promise<ZhQuelle[]> {
  const treffer: ZhQuelle[] = [];
  // FALLE (empirisch 1.9.2026): `page` ist EINSBASIERT — `page=0` und `page=1`
  // liefern beide dieselbe erste Seite. Eine nullbasierte Schleife holt darum
  // Seite 1 doppelt und lässt die LETZTE Seite still weg (Ordner 4: 15 statt
  // 27 Erlasse). Deshalb 1 … numberOfResultPages, und die Dubletten-Wache
  // unten bleibt als zweite Sicherung stehen.
  let seite = 1;
  for (;;) {
    const url =
      `${BASIS}/_jcr_content/main/lawcollectionsearch_${id}.zhweb-zhlex-ls.zhweb-cache.json` +
      `?fileNumber=${encodeURIComponent(ordner)}&includeRepealedEnactments=false&page=${seite}`;
    const res = await hole(url);
    if (res.status === 204) break;
    const txt = await res.text();
    if (!res.ok || txt.trim().length === 0) break;
    const json = JSON.parse(txt) as {
      data?: Satz[];
      numberOfResultPages?: number;
      moreSearchResultsThanAllowed?: boolean;
    };
    if (json.moreSearchResultsThanAllowed) {
      throw new Error(`Ordner ${ordner}: Endpunkt meldet Kappung (>150) — Abfrage verfeinern`);
    }
    for (const satz of json.data ?? []) {
      if (satz.withdrawalDate) continue;
      const titel = satz.enactmentTitle.trim();
      const klammer = titel.match(/\(([^()]+)\)\s*$/);
      treffer.push({
        nr: satz.referenceNumber,
        titel,
        kuerzel: klammer ? klammer[1] : '',
        registryUrl: new URL(satz.link, 'https://www.zh.ch').toString(),
      });
    }
    if (seite >= (json.numberOfResultPages ?? 1)) break;
    seite++;
  }
  // Doppelte Ordnungsnummern (mehrere geltende Fassungen) sind ein Quell-Signal,
  // kein stiller Fall: sichtbar melden statt die zweite zu verschlucken (§8).
  const gesehen = new Map<string, ZhQuelle>();
  for (const t of treffer) {
    if (gesehen.has(t.nr)) {
      console.error(`  WARN Ordner ${ordner}: ${t.nr} mehrfach geltend — von Hand klären`);
      continue;
    }
    gesehen.set(t.nr, t);
  }
  return [...gesehen.values()].sort((a, b) =>
    a.nr.localeCompare(b.nr, 'de', { numeric: true }),
  );
}

/** Fertiger `ZH_QUELLEN`-Eintrag als Quelltext (eine Form, §5). */
function alsEintrag(q: ZhQuelle): string {
  return (
    `  {\n    nr: '${q.nr}',\n    titel: ${JSON.stringify(q.titel)},\n` +
    `    kuerzel: ${JSON.stringify(q.kuerzel)},\n` +
    `    registryUrl: \`\${BASIS}${q.registryUrl.split('/zhlex-ls/')[1]}\`,\n  },`
  );
}

const argumente = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const id = await komponentenId().catch(keineAussage);
console.log(`AEM-Komponenten-ID (Laufzeit aufgelöst): ${id}`);

const ordnerArg = process.argv.slice(2).find((a) => a.startsWith('--ordner='))?.slice(9);

if (ordnerArg) {
  for (const ordner of ordnerArg.split(',').map((o) => o.trim()).filter(Boolean)) {
    const liste = await loeseOrdner(id, ordner);
    console.log(`\n  // ── Systematik-Ordner ${ordner} — ${liste.length} geltende Erlasse`);
    for (const q of liste) console.log(alsEintrag(q));
  }
} else if (argumente.length > 0) {
  for (const nr of argumente) {
    const q = await loese(id, nr);
    if (!q) {
      console.log(`  { /* ${nr}: KEIN eindeutiger geltender Treffer — von Hand klären */ },`);
      continue;
    }
    console.log(alsEintrag(q));
  }
} else {
  let abweichungen = 0;
  let netzfehler = 0;
  for (const soll of ZH_QUELLEN) {
    let ist: ZhQuelle | null;
    try {
      ist = await loese(id, soll.nr);
    } catch (e) {
      if (!(e instanceof NetzFehler)) throw e;
      console.error(`  NETZ ${soll.nr}: ${e.message}`);
      netzfehler++;
      continue;
    }
    if (!ist) {
      console.error(`  FEHLER ${soll.nr}: kein eindeutiger geltender Treffer am JSON-Endpunkt`);
      abweichungen++;
      continue;
    }
    const probleme: string[] = [];
    if (ist.registryUrl !== soll.registryUrl) probleme.push(`URL ist "${ist.registryUrl}"`);
    if (ist.titel !== soll.titel) probleme.push(`Titel ist "${ist.titel}"`);
    // Befund B-9 (Gegenprüfung 31.8.2026): `kuerzel` wurde bisher GAR NICHT
    // geprüft — LS 215.1 trug das erfundene «AnwG», obwohl der amtliche Titel
    // «Anwaltsgesetz» keinen Klammerzusatz hat. Zulässig ist ausschliesslich
    // der Klammerzusatz des amtlichen Titels; alles andere ist erfunden (§8).
    if (ist.kuerzel !== soll.kuerzel) {
      probleme.push(
        `Kürzel amtlich "${ist.kuerzel}" (Klammerzusatz), Liste sagt "${soll.kuerzel}"`,
      );
    }
    if (probleme.length > 0) {
      console.error(`  FEHLER ${soll.nr} (${soll.kuerzel || '—'}): ${probleme.join(' · ')}`);
      abweichungen++;
    } else {
      console.log(`  ok ${soll.nr.padEnd(8)} ${soll.kuerzel || '—'}`);
    }
  }
  console.log(`\nzh-quellen: ${ZH_QUELLEN.length} Erlasse geprüft, ${abweichungen} Abweichung(en), ${netzfehler} nicht erreichbar.`);
  if (abweichungen > 0) process.exit(1);
  if (netzfehler > 0) process.exit(2);
}
