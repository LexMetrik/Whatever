// scripts/datenhaltung/check-turso-frische.ts
// WÄCHTER (20.7.2026): macht eine veraltete oder verstümmelte Turso-HOT-Replika SICHTBAR.
//
// Warum es diesen Wächter gibt. Der Turso-Sync lief vom 18. bis 20.7.2026 sechsmal in den
// Job-Timeout und wurde jedes Mal `cancelled` — GitHub färbt einen abgebrochenen Lauf grau,
// nicht rot, also fiel es tagelang niemandem auf. Schlimmer: der damalige Ablauf liess die
// Ziel-Tabellen ZUERST fallen und lud danach; jeder Abbruch hinterliess damit eine halb
// gefüllte Prod-Replika. Befund bei der Reparatur: remote `artikel` = 16'400 von 55'822,
// `fts_entscheide_schaufenster` gar nicht vorhanden — api/suche servierte einen
// verstümmelten Index und meldete es nirgends. Genau dieses Schweigen bricht dieser Tor.
//
// Geprüft wird fünffach:
//   0. SCHEMA      — trägt die Replika die HEUTIGE DDL der FTS-Tabellen? (neu 31.8.2026,
//      Gegenprüfungs-Befund F1 zu QS-BASIS (d)). Alle anderen Dimensionen zählen Zeilen,
//      rowids und Signaturen; gegenüber einer FORM-Änderung sind sie blind. Genau die stand
//      an: `fts_artikel` bekam sechs Spalten statt einer, und api/suche.ts schickt seit K2
//      spalten-gefilterte MATCH-Ausdrücke (`{marginalie gliederung} : "…"`). Gegen die alte
//      Ein-Spalten-Replika antwortet SQLite `no such column: marginalie`, api/suche.ts macht
//      daraus 502 — auf JEDE Artikel-Query. Zeilenzahl, rowid-Spannweite und manifest_sha
//      wären dabei allesamt grün geblieben, weil sich an den DATEN nichts geändert hatte.
//   1. STRUKTUR    — existieren alle HOT-Tabellen und sind sie nicht leer?
//   2. VOLLSTÄNDIG — stimmt die Ist-Zeilenzahl je Tabelle mit der Zahl überein, die der
//      letzte erfolgreiche Sync in `sync_meta` hinterlegt hat? Das ist der eigentliche
//      Riegel gegen den historischen Schaden: `artikel` mit 16'400 von 55'822 Zeilen hätte
//      eine reine „nicht leer"-Prüfung ANSTANDSLOS PASSIERT (Gegenprüfungs-Befund B4).
//      Zusätzlich die Kopplungs-Invariante `fts_artikel` == `artikel` (der Such-Join hängt
//      daran) und keine Waisen im Join.
//   3. FRISCHE     — trägt die Replika die Signatur des committeten `daten-manifest.json`?
//      (fängt „Sync ist gar nicht gelaufen" bzw. „hinkt einem Merge hinterher")
//   4. ALTER       — ist die Frische-Marke jünger als MAX_ALTER_TAGE? (fängt einen toten
//      Auslöser, auch wenn zufällig kein Datenstand-Wechsel anstand)
//
// EHRLICHE GRENZE (§8): Prüfung 3 vergleicht die Manifest-Signatur, mit der der Sync
// GESTARTET ist — sie beweist die Generation, nicht Zeile für Zeile den Inhalt. Den
// Inhalt deckt Prüfung 2 ab (Ist gegen die protokollierten Soll-Zahlen). Wer Byte-Treue
// je Zeile braucht, fährt `npm run datenhaltung:turso-sync` erneut; der Sync verifiziert
// vor UND nach dem Tausch.
//
// Ohne Token kann nicht geprüft werden. Dann meldet der Tor das AUSDRÜCKLICH und endet grün
// (§8 ehrliche Degradierung, wie der Sync selbst) — er behauptet nie, geprüft zu haben.
//
// WO DIESER TOR LÄUFT — und wo bewusst NICHT. Verdrahtet ist er ausschliesslich in
// `.github/workflows/turso-sync.yml`: als harter Schritt nach dem Sync. Bis zum 15.9.2026
// lief er zusätzlich als eigener täglicher cron-Job; seit der Bündelung
// (QS-TURSO-SCHREIBVOLUMEN, §17) IST der Sync-Lauf der tägliche Lauf, der Wächter steckt
// darin — unverändert hart, mit dem Token-Riegel davor. NICHT in `check:netz`: der einzige Job, der `check:netz` fährt
// (`normen-monitor.yml`), bekommt kein TURSO_AUTH_TOKEN — der Tor liefe dort immer nur in
// die „ÜBERSPRUNGEN"-Meldung und täuschte Abdeckung vor. Umgekehrt ginge er LOKAL auf jedem
// Branch rot, der `daten-manifest.json` völlig legitim neu generiert (§12/4 `merge=regen`),
// weil dessen Signatur naturgemäss von der Live-Replika abweicht, bis der Branch gemergt und
// gesynct ist. Beides — Schein-Abdeckung wie Falsch-Rot — erzieht zum Wegschauen und wäre
// genau die Sorte stiller Tor-Erosion, gegen die dieser Wächter gebaut ist (§8).
//
// Aufruf: npm run check:turso-frische
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { ddlFtsArtikel, ddlFtsEntscheide } from './fts';

const URL_STD = 'libsql://lexmetrik-ravedave.aws-eu-west-1.turso.io';
const TOKEN_DATEI = 'daten/turso-token.txt';
const MANIFEST_DATEI = 'daten-manifest.json';
/** Ab hier gilt die Replika als schal — auch bei passender Signatur (toter Auslöser). */
const MAX_ALTER_TAGE = 7;
/** Zulässiger Vorlauf der `stand`-Marke (~15 min). Die Marke schreibt der Sync-Runner, geprüft
 *  wird sie vom cron-Runner — eine kleine Uhr-Differenz darf nicht rot werden, sonst erzieht
 *  der Tor zum Wegschauen. Eine ECHTE Zukunfts-Datierung (Stunden/Tage) bleibt rot. */
const MAX_VORLAUF_TAGE = 0.01;
/** HOT-Tabellen, die nach einem vollständigen Sync alle existieren und gefüllt sein müssen. */
const HOT_TABELLEN = ['erlasse', 'erlass_fassungen', 'artikel', 'fts_artikel', 'fts_entscheide_schaufenster'];

function httpUrl(basis: string): string {
  return basis.replace(/^libsql:\/\//, 'https://').replace(/\/$/, '');
}

const url = httpUrl(process.env.TURSO_DATABASE_URL ?? URL_STD);
const token =
  process.env.TURSO_AUTH_TOKEN ??
  (existsSync(TOKEN_DATEI) ? readFileSync(TOKEN_DATEI, 'utf8').trim() : '');

if (!token) {
  console.log(
    'check:turso-frische ÜBERSPRUNGEN — kein TURSO_AUTH_TOKEN (Env oder ' +
      TOKEN_DATEI +
      '). Die Frische der Live-Replika wurde NICHT geprüft (§8: nicht geprüft ≠ in Ordnung).',
  );
  process.exit(0);
}

/** Eine SQL-Abfrage; `null` wenn die Tabelle fehlt (Fehler wird als Befund zurückgegeben). */
async function abfrage(sql: string): Promise<{ wert: string | null; fehler?: string }> {
  const res = await fetch(`${url}/v2/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ requests: [{ type: 'execute', stmt: { sql } }, { type: 'close' }] }),
  });
  if (!res.ok) return { wert: null, fehler: `HTTP ${res.status}` };
  const daten = (await res.json()) as {
    results: Array<{ type: string; error?: { message: string }; response?: { result?: { rows: Array<Array<{ value: string | null }>> } } }>;
  };
  const r = daten.results[0];
  if (r?.type === 'error') return { wert: null, fehler: r.error?.message ?? 'unbekannter Fehler' };
  return { wert: r?.response?.result?.rows[0]?.[0]?.value ?? null };
}

const befunde: string[] = [];

/** Zeilenzahlen, die der letzte erfolgreiche Sync protokolliert hat (Soll je Tabelle). */
const sollZahlen: Record<string, number> = {};
{
  const res = await fetch(`${url}/v2/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [{ type: 'execute', stmt: { sql: "SELECT schluessel, wert FROM sync_meta WHERE schluessel LIKE 'zeilen_%'" } }, { type: 'close' }],
    }),
  });
  if (res.ok) {
    const daten = (await res.json()) as { results: Array<{ type: string; response?: { result?: { rows: Array<Array<{ value: string | null }>> } } }> };
    for (const zeile of daten.results[0]?.response?.result?.rows ?? []) {
      const k = zeile[0]?.value;
      const v = Number(zeile[1]?.value ?? NaN);
      if (k && Number.isFinite(v)) sollZahlen[k.replace(/^zeilen_/, '')] = v;
    }
  }
}

// ── 0) Schema: trägt die Replika die HEUTIGE DDL? ─────────────────────────────────────
//
// Verglichen wird `sqlite_master.sql` der Replika gegen die Funktionen, aus denen der Sync
// die Tabellen anlegt (fts.ts, §5) — NICHT gegen eine hier gepflegte Zweitkopie. Eine
// Zweitkopie wäre derselbe Fehler, den der Tor fangen soll, nur eine Ebene höher.
//
// WARUM NORMALISIERT UND NICHT ROH VERGLICHEN WIRD (empirisch geprüft, 31.8.2026): der
// Tausch am Ende des Syncs läuft über `ALTER TABLE fts_artikel_neu RENAME TO fts_artikel`,
// und SQLite schreibt den Namen dabei GEQUOTET in `sqlite_master` zurück:
//   vor  RENAME: CREATE VIRTUAL TABLE fts_artikel_neu USING fts5(text, marginalie, …)
//   nach RENAME: CREATE VIRTUAL TABLE "fts_artikel"   USING fts5(text, marginalie, …)
// Ein roher Stringvergleich gegen `ddlFtsArtikel('fts_artikel')` wäre also DAUERHAFT ROT,
// obwohl nichts fehlt — und ein Tor, das immer rot ist, erzieht binnen Tagen zum Wegsehen
// (§6.7). Normalisiert werden darum genau zwei Dinge und sonst nichts: die Quotes um den
// Tabellennamen und Whitespace-Läufe. Die Spaltenliste selbst — Zahl, Namen, REIHENFOLGE,
// `content=''`, Tokenizer — bleibt bit-genau im Vergleich; sie ist das, woran die
// bm25-Gewichte und der Spaltenfilter hängen.
function normalisiereDdl(sql: string): string {
  return sql
    .replace(/^\s*CREATE\s+VIRTUAL\s+TABLE\s+"([^"]+)"/i, 'CREATE VIRTUAL TABLE $1')
    .replace(/\s+/g, ' ')
    .trim();
}

/** FTS-Tabellen mit ihrer Soll-DDL. Die Namen sind die LIVE-Namen nach dem Tausch. */
const SCHEMA_SOLL: Array<{ tabelle: string; ddl: string }> = [
  { tabelle: 'fts_artikel', ddl: ddlFtsArtikel('fts_artikel') },
  { tabelle: 'fts_entscheide_schaufenster', ddl: ddlFtsEntscheide('fts_entscheide_schaufenster') },
];

for (const { tabelle, ddl } of SCHEMA_SOLL) {
  const ist = await abfrage(`SELECT sql FROM sqlite_master WHERE name = '${tabelle}'`);
  if (ist.fehler || ist.wert === null) {
    befunde.push(
      `Schema von \`${tabelle}\` nicht lesbar (${ist.fehler ?? 'kein sqlite_master-Eintrag'}) — ` +
        'die Form der Replika ist damit unbelegt.',
    );
    continue;
  }
  const istN = normalisiereDdl(ist.wert);
  const sollN = normalisiereDdl(ddl);
  if (istN !== sollN) {
    befunde.push(
      `SCHEMA-DRIFT bei \`${tabelle}\`: die Replika trägt eine ANDERE Form als der heutige ` +
        'Generator baut. api/suche.ts fragt gegen die heutige Form ab — passt sie nicht, ' +
        'antwortet die Live-Suche mit 502, ohne dass Zeilenzahlen oder manifest_sha etwas ' +
        'davon merken.\n' +
        `      live: ${istN}\n` +
        `      soll: ${sollN}\n` +
        '      Behebung: `npm run datenhaltung:turso-sync` (der Sync legt die Tabellen neu an).',
    );
  } else {
    console.log(`  Schema ${tabelle}: == ddl${tabelle === 'fts_artikel' ? 'FtsArtikel' : 'FtsEntscheide'}() (Form identisch)`);
  }
}

// ── 1+2) Struktur UND Vollständigkeit ─────────────────────────────────────────────────
const istZahlen: Record<string, number> = {};
for (const t of HOT_TABELLEN) {
  const { wert, fehler } = await abfrage(`SELECT count(*) FROM ${t}`);
  if (fehler) {
    befunde.push(`Tabelle \`${t}\` nicht abfragbar (${fehler}) — Replika unvollständig.`);
    continue;
  }
  const n = Number(wert ?? 0);
  istZahlen[t] = n;
  if (n === 0) {
    befunde.push(`Tabelle \`${t}\` ist LEER — Replika unvollständig.`);
    continue;
  }
  const soll = sollZahlen[t];
  if (soll === undefined) {
    // KEIN stilles Durchwinken: eine Marke ohne Soll-Zahlen stammt aus einer Vorversion
    // oder ist unvollständig — dann degradiert die Prüfung faktisch auf «nicht leer», und
    // genau das ist das Loch, das der historische Schaden ausgenutzt hat (Runde 2, Befund 4).
    befunde.push(
      `Tabelle \`${t}\`: ${n} Zeilen, aber der letzte Sync hat KEINE Soll-Zahl hinterlegt — ` +
        'die Vollständigkeit ist damit unbelegt. Einmal `npm run datenhaltung:turso-sync` fahren, ' +
        'dann trägt die Marke wieder alle Zahlen.',
    );
  } else if (n !== soll) {
    befunde.push(
      `Tabelle \`${t}\`: ${n} Zeilen, aber der letzte Sync protokollierte ${soll} — ` +
        'die Replika ist seither beschädigt oder ein Lauf ist mittendrin abgebrochen.',
    );
  } else {
    console.log(`  ${t}: ${n} Zeilen (== protokolliertes Soll)`);
  }
}

// Kopplungs-Invariante: der Such-Join api/suche.ts geht über fts_artikel.rowid == artikel.rowid.
if (istZahlen['artikel'] && istZahlen['fts_artikel'] && istZahlen['artikel'] !== istZahlen['fts_artikel']) {
  befunde.push(
    `Kopplung verletzt: fts_artikel hat ${istZahlen['fts_artikel']} Zeilen, artikel ${istZahlen['artikel']}. ` +
      'Der Such-Join liefert dann falsche oder fehlende Treffer.',
  );
}
// rowid-Spannweite statt LEFT JOIN: der Join `fts_artikel × artikel` über 55'822 Zeilen
// braucht auf der Edge-Replika Minuten (gemessen ~5 min) — ein Wächter, der so lange
// blockiert, wird abgeschaltet und schützt dann gar nicht mehr. min/max/count sind drei
// billige Aggregate und fangen jede Verschiebung der Kopplung genauso.
{
  const spanne = async (t: string) => await abfrage(`SELECT min(rowid) || '-' || max(rowid) FROM ${t}`);
  const a = await spanne('artikel');
  const f = await spanne('fts_artikel');
  // Fehler NICHT zu `null` verschlucken und dann „OK" melden: scheitern beide Abfragen,
  // wären sie sonst gleich (null == null) und der Vergleich meldete grün (Runde 2, Befund 6).
  if (a.fehler || f.fehler || a.wert === null || f.wert === null) {
    befunde.push(`rowid-Spannweite nicht ermittelbar (artikel: ${a.fehler ?? 'leer'}, fts_artikel: ${f.fehler ?? 'leer'}).`);
  } else if (a.wert !== f.wert) {
    befunde.push(
      `rowid-Spannweite verschoben: artikel ${a.wert}, fts_artikel ${f.wert} — der Such-Join trifft dann fremde Artikel.`,
    );
  } else {
    console.log(`  rowid-Spannweite artikel == fts_artikel: ${a.wert}`);
  }
}

// ── 2) Frische gegen das committete Manifest ──────────────────────────────────────────
const sollSha = createHash('sha256').update(readFileSync(MANIFEST_DATEI)).digest('hex');
const marke = await abfrage("SELECT wert FROM sync_meta WHERE schluessel = 'manifest_sha'");
if (marke.fehler || marke.wert === null) {
  befunde.push(
    `Keine Frische-Marke auf der Replika (${marke.fehler ?? 'sync_meta leer'}) — es ist unbelegt, ` +
      'welcher Datenstand live liegt. Ein vollständiger `npm run datenhaltung:turso-sync` fehlt.',
  );
} else if (marke.wert !== sollSha) {
  befunde.push(
    `Replika hinkt hinterher: manifest_sha live ${marke.wert.slice(0, 12)}… ≠ committet ${sollSha.slice(0, 12)}…. ` +
      'Die Suche serviert einen älteren Korpus als der Reader.',
  );
} else {
  console.log(`  manifest_sha: ${sollSha.slice(0, 12)}… (Replika == committeter Stand)`);
}

// ── 3) Alter ──────────────────────────────────────────────────────────────────────────
const stand = await abfrage("SELECT wert FROM sync_meta WHERE schluessel = 'stand'");
if (!stand.wert) {
  // Fehlt der Zeitstempel, wurde die Alters-Prüfung früher STILL übersprungen — der Tor
  // meldete grün, ohne diese Dimension je geprüft zu haben (Runde 3). Nicht geprüft ist
  // nicht in Ordnung (§8).
  befunde.push('Keine `stand`-Marke — das Alter der Replika ist unbelegt, ein toter Auslöser bliebe unbemerkt.');
} else {
  const tage = (Date.now() - Date.parse(stand.wert)) / 86_400_000;
  if (!Number.isFinite(tage)) {
    befunde.push(`\`stand\`-Marke «${stand.wert}» ist kein lesbares Datum — Alter unbelegt.`);
  } else {
    console.log(`  letzter Sync: ${stand.wert} (vor ${tage.toFixed(1)} Tagen)`);
    if (tage < -MAX_VORLAUF_TAGE) {
      // Eine ZUKUNFTS-datierte Marke machte die Altersprüfung dauerhaft grün: `tage > 7` ist
      // für negative Werte nie wahr. Damit wäre ausgerechnet die Dimension blind, die den
      // toten Auslöser fangen soll — bei Uhr-Schieflage auf dem Runner oder manipulierter
      // Marke (Gegenprüfung Runde 5, M2). Nicht geprüft ist nicht in Ordnung (§8).
      const vorlauf = Math.abs(tage);
      const menge = vorlauf < 1 ? `${(vorlauf * 24).toFixed(1)} Stunden` : `${vorlauf.toFixed(1)} Tage`;
      befunde.push(
        `\`stand\`-Marke liegt ${menge} in der ZUKUNFT (${stand.wert}) — ` +
          'unplausibel; die Altersprüfung kann damit nichts belegen.',
      );
    } else if (tage > MAX_ALTER_TAGE) {
      befunde.push(
        `Letzter erfolgreicher Sync vor ${tage.toFixed(1)} Tagen (Grenze ${MAX_ALTER_TAGE}) — ` +
          'der Auslöser läuft womöglich nicht mehr.',
      );
    }
  }
}

if (befunde.length > 0) {
  console.error('\ncheck:turso-frische ROT:');
  for (const b of befunde) console.error(`  · ${b}`);
  console.error('\nBehebung: `npm run datenhaltung:build && npm run datenhaltung:turso-sync` (Token nötig),');
  console.error('oder den Workflow `Turso-Serving-Sync` per workflow_dispatch anstossen.');
  process.exit(1);
}
console.log('check:turso-frische grün: HOT-Replika formgleich, vollständig, aktuell und datiert.');
