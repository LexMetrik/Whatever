// scripts/entstehung/curia-run.ts
// CLI-Runner der Curia-Vista-Shards (E4, §11.6). MONATSLAUF — nie in der Gate-Kette:
// ~8 Anfragen je Geschäft über ~385 Geschäfte bei <=2 Anfragen/s ≈ 25 min (R4 §5:
// `Modified` ist als Delta-Arbiter unbrauchbar, es bleibt der Vollabgleich).
//
// §2: --datum aus der Shell, kein Date.now. §11.8: fragt nie ein Personenfeld ab.
// Aufruf: npm run materialien:curia -- --datum=$(date +%F) [--nur=17.059,20.026]
import { writeFileSync, mkdirSync, readdirSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { BOTSCHAFTEN } from '../../src/lib/materialien/botschaften.generated.ts';
import {
  CURIA_BASIS, CURIA_QUELLENANGABE, AUSZAEHLUNG_HINWEIS, odataZeilen, odataDatum,
  aggregiereStimmen, ratAusGroesse, baueKommissionen, baueBeschluesse, bauePublikationen,
  distinkteObjectiveZeilen, schlussabstimmungsVotes, serialisiereShard, shaShard, curiaUrl,
  type CuriaShard, type CuriaSchlussabstimmung, type OdataZeile,
} from './curia.ts';
import {
  CURIA_DIR, CURIA_ZUSTAND_PFAD, leseCuriaZustand, serialisiereCuriaZustand, type CuriaZustand,
} from './curia-zustand.ts';

const datumArg = process.argv.find((a) => a.startsWith('--datum='));
const heute = datumArg ? datumArg.slice('--datum='.length) : '';
if (!/^\d{4}-\d{2}-\d{2}$/.test(heute)) { console.error('--datum=YYYY-MM-DD nötig (§2)'); process.exit(1); }
const nurArg = process.argv.find((a) => a.startsWith('--nur='));
const nur = nurArg ? new Set(nurArg.slice('--nur='.length).split(',').map((s) => s.trim())) : null;

// ── Drosselung: GLOBAL <= 2 Anfragen/s, unabhängig von der Nebenläufigkeit ─────
// Gemessen 11.9.2026: der Endpunkt antwortet mit ~3,5 s Latenz je Anfrage. Streng
// seriell (eine Anfrage, dann 500 ms Pause) dauert der Vollabgleich darum nicht die
// geplanten ~27 min, sondern ~3,5 h — die Pause war nie der Engpass, die Latenz ist es.
// Lösung: mehrere Geschäfte gleichzeitig, aber EIN gemeinsamer Takt vor jedem Absenden.
// Damit bleibt die Rate bei <= 2 Anfragen/s (R4 §5: bei dieser Rate keine 429/503), und
// die Wartezeit läuft parallel statt hintereinander.
// `Date.now` steht hier NUR im Takt, nie in den Daten (§2): das Abrufdatum kommt
// unverändert aus --datum, und kein Feld des Shards hängt an der Uhr des Laufs.
const TAKT_MS = 500;
const NEBENLAEUFIG = 8;
let naechsterStart = 0;
async function drossel(): Promise<void> {
  const jetzt = Date.now();
  const ziel = Math.max(jetzt, naechsterStart + TAKT_MS);
  naechsterStart = ziel;
  if (ziel > jetzt) await new Promise((r) => setTimeout(r, ziel - jetzt));
}

/** Eine OData-Abfrage. `$select` nennt IMMER die Felder — nie `SELECT *` (§11.8). */
async function odata(entitaet: string, filter: string, select?: string): Promise<OdataZeile[]> {
  const u = new URL(`${CURIA_BASIS}/${entitaet}`);
  u.searchParams.set('$filter', filter);
  if (select) u.searchParams.set('$select', select);
  u.searchParams.set('$format', 'json');
  await drossel();
  const res = await fetch(u, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Curia antwortet ${res.status} für ${entitaet} (${filter})`);
  const typ = res.headers.get('content-type');
  if (typ && !/json/i.test(typ)) throw new Error(`Curia antwortet Content-Type «${typ}» statt JSON für ${entitaet}`);
  // Die URL mitgeben: der Paging-Wächter in `odataZeilen` soll sagen KÖNNEN, welche
  // Abfrage abgeschnitten wurde — eine Fehlermeldung ohne Fundstelle kostet eine Stunde.
  return odataZeilen(await res.json(), u.toString());
}

const nummern = [...new Set(BOTSCHAFTEN.map((b) => b.nummer).filter((n): n is string => !!n))]
  .filter((n) => !nur || nur.has(n))
  .sort();

console.log(`curia: ${nummern.length} Geschäfte (Vollabgleich, ~8 Anfragen je Geschäft, ${NEBENLAEUFIG} gleichzeitig, global ≥${TAKT_MS} ms Takt) …`);

mkdirSync(CURIA_DIR, { recursive: true });
const zustand: CuriaZustand[] = [];
const zuSchreiben: [string, string][] = [];
const fehlend: string[] = [];
let beschluesseGesamt = 0;
let vorberatungenGesamt = 0;
let schlussGesamt = 0;
let publikationenGesamt = 0;
let objectiveZeilenGesamt = 0;
let distinktObjectiveGesamt = 0;

let erledigt = 0;
async function holeGeschaeft(nr: string): Promise<void> {
  const q = `'${nr.replace(/'/g, "''")}'`;
  const business = await odata(
    'Business', `BusinessShortNumber eq ${q} and Language eq 'DE'`,
    'ID,BusinessShortNumber,Title,BusinessTypeName,SubmissionDate,BusinessStatusText,FirstCouncil1Name',
  );
  if (!business.length) { fehlend.push(nr); return; }
  const b0 = business[0];

  const bills = await odata('Bill', `BusinessShortNumber eq ${q} and Language eq 'DE'`, 'ID,BillNumber,Title');
  const vorlageJeBill = new Map<string, number>();
  for (const b of bills) if (typeof b.BillNumber === 'number') vorlageJeBill.set(String(b.ID), b.BillNumber);

  // Resolution kennt KEIN BusinessShortNumber (R4 §1a) — Join über ALLE Bill-IDs, nicht
  // nur die erste: R4 §4 mass mit der naiven Bill-0-Auswahl 40 % Abdeckung, das war ein
  // Artefakt der Auswahl. Hier ein Request mit or-Kette über alle Vorlagen.
  const beschluesse = bills.length
    ? baueBeschluesse(
      await odata('Resolution', `(${bills.map((b) => `IdBill eq guid'${String(b.ID)}'`).join(' or ')}) and Language eq 'DE'`),
      vorlageJeBill,
    )
    : [];

  const kommissionen = baueKommissionen(
    await odata('Preconsultation', `BusinessShortNumber eq ${q} and Language eq 'DE'`),
  );
  // Die ROHEN Objective-Zeilen bleiben stehen: aus ihnen kommt die Kreuzprobe des Tors.
  // `distinkteObjectiveZeilen` zählt UNABHÄNGIG von `bauePublikationen` (Tautologie-Falle,
  // §6.7) — beide Zahlen gehen in den Zustandsträger, `check:entstehung` rechnet offline
  // gegen. Befund 21.9.2026: ohne diese Gegenrechnung fiel der Verlust 32 → 21 nicht auf.
  const objectiveZeilen = await odata('Objective', `BusinessShortNumber eq ${q} and Language eq 'DE'`);
  const publikationen = bauePublikationen(objectiveZeilen);
  const distinktObjective = distinkteObjectiveZeilen(objectiveZeilen);

  const votes = schlussabstimmungsVotes(
    await odata('Vote', `BusinessShortNumber eq ${q} and Language eq 'DE'`, 'ID,BillNumber,Subject,VoteEnd'),
  );
  const schlussabstimmungen: CuriaSchlussabstimmung[] = [];
  for (const v of votes) {
    // NUR diese drei Felder — kein Name, keine PersonNumber, keine Fraktion, kein Kanton.
    const stimmen = await odata('Voting', `IdVote eq ${v.id} and Language eq 'DE'`, 'IdVote,Decision,DecisionText');
    if (!stimmen.length) continue;
    const aggregat = aggregiereStimmen(stimmen);
    schlussabstimmungen.push({
      datum: v.datum,
      vorlage: v.vorlage,
      rat: ratAusGroesse(aggregat.total),
      aggregat,
      beschriftung: `${AUSZAEHLUNG_HINWEIS}, Abruf ${heute}`,
    });
  }
  schlussabstimmungen.sort((a, c) => `${a.datum ?? ''}${a.vorlage ?? ''}`.localeCompare(`${c.datum ?? ''}${c.vorlage ?? ''}`));

  const shard: CuriaShard = {
    nummer: nr,
    titel: typeof b0.Title === 'string' ? b0.Title : null,
    geschaeftstyp: typeof b0.BusinessTypeName === 'string' ? b0.BusinessTypeName : null,
    status: typeof b0.BusinessStatusText === 'string' ? b0.BusinessStatusText : null,
    eingereicht: odataDatum(b0.SubmissionDate),
    erstrat: typeof b0.FirstCouncil1Name === 'string' ? b0.FirstCouncil1Name : null,
    quelleUrl: curiaUrl(nr) ?? `${CURIA_BASIS}/Business?$filter=BusinessShortNumber eq ${q}`,
    quellenangabe: CURIA_QUELLENANGABE,
    abgerufen: heute,
    kommissionen,
    beschluesse,
    publikationen,
    schlussabstimmungen,
  };
  zuSchreiben.push([join(CURIA_DIR, `${nr}.json`), serialisiereShard(shard)]);
  zustand.push({
    nummer: nr,
    abgerufen: heute,
    sha: shaShard(shard),
    beschluesse: beschluesse.length,
    vorberatungen: kommissionen.length,
    schlussabstimmung: schlussabstimmungen.length > 0,
    publikationen: publikationen.length,
    objectiveZeilen: objectiveZeilen.length,
    distinkteObjective: distinktObjective,
  });
  beschluesseGesamt += beschluesse.length;
  vorberatungenGesamt += kommissionen.length;
  schlussGesamt += schlussabstimmungen.length;
  publikationenGesamt += publikationen.length;
  objectiveZeilenGesamt += objectiveZeilen.length;
  distinktObjectiveGesamt += distinktObjective;
  erledigt += 1;
  if (erledigt % 25 === 0) console.log(`curia: ${erledigt}/${nummern.length} …`);
}

// Worker-Pool: NEBENLAEUFIG Arbeiter teilen sich eine Warteschlange. Die REIHENFOLGE der
// Abarbeitung ist damit nicht deterministisch — die AUSGABE bleibt es trotzdem, weil
// Shards und Zustandsträger unten nach Geschäftsnummer sortiert geschrieben werden (§2).
const warteschlange = [...nummern];
await Promise.all(Array.from({ length: NEBENLAEUFIG }, async () => {
  for (;;) {
    const nr = warteschlange.shift();
    if (nr === undefined) return;
    await holeGeschaeft(nr);
  }
}));

zuSchreiben.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
for (const [pfad, inhalt] of zuSchreiben) writeFileSync(pfad, inhalt, 'utf8');
const behalten = new Set(zustand.map((z) => `${z.nummer}.json`));
for (const f of readdirSync(CURIA_DIR)) {
  if (f.endsWith('.json') && !behalten.has(f) && !nur) {
    rmSync(join(CURIA_DIR, f));
    console.log(`curia: verwaisten Shard entfernt — ${f}`);
  }
}

mkdirSync('bibliothek/register', { recursive: true });
if (nur && existsSync(CURIA_ZUSTAND_PFAD)) {
  // --nur berührt nur einen Ausschnitt. Den Zustandsträger deshalb FORTSCHREIBEN statt
  // ersetzen (sonst verlören die übrigen Geschäfte ihre Zeile) — aber auch nicht
  // unberührt lassen: die alte Zeile trüge dann den sha des ALTEN Shards, und
  // `check:entstehung` wäre nach jedem --nur-Lauf rot, obwohl nichts kaputt ist
  // (Korrektur 21.9.2026, §17 — Workaround an der Wurzel statt umschiffen).
  const alt = leseCuriaZustand() ?? [];
  const fortgeschrieben = new Map(alt.map((z) => [z.nummer, z]));
  for (const z of zustand) fortgeschrieben.set(z.nummer, z);
  writeFileSync(CURIA_ZUSTAND_PFAD, serialisiereCuriaZustand([...fortgeschrieben.values()]), 'utf8');
  console.log(
    `curia: --nur-Lauf — ${zustand.length} Zeile(n) im Zustandsträger fortgeschrieben, `
    + `${fortgeschrieben.size - zustand.length} unberührt (der Vollabgleich schreibt ihn ganz neu).`,
  );
} else {
  writeFileSync(CURIA_ZUSTAND_PFAD, serialisiereCuriaZustand(zustand), 'utf8');
}

console.log(`curia: ${zustand.length}/${nummern.length} Geschäfte → ${CURIA_DIR}`);
console.log(`  Rats-Beschlüsse ${beschluesseGesamt} · Kommissions-Vorberatungen ${vorberatungenGesamt} · Schlussabstimmungen ${schlussGesamt}`);
// Drei Zahlen, nicht zwei: «gespeichert ≠ distinkt» heisst KOLLABIERT (Fehler),
// «distinkt < roh» heisst nur doppelt geliefert (harmlos). Eine einzige Differenz
// koennte beides bedeuten und hat in der Wegwerf-Probe am 21.9.2026 genau das
// verwechselt — sie nannte 11 kollabierte Fundstellen «Doppellieferungen».
console.log(
  `  Publikationen ${publikationenGesamt} gespeichert · ${distinktObjectiveGesamt} distinkte `
  + `· ${objectiveZeilenGesamt} rohe amtliche Objective-Zeile(n)`
  + `${publikationenGesamt === distinktObjectiveGesamt ? '' : ' ← KOLLABIERT, check:entstehung wird rot'}`,
);
fehlend.sort();
if (fehlend.length) console.log(`  ohne Business-Datensatz (${fehlend.length}): ${fehlend.join(', ')}`);
