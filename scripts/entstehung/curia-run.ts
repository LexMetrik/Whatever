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
  CURIA_BASIS, CURIA_QUELLENANGABE, AUSZAEHLUNG_HINWEIS, odataDatum,
  aggregiereStimmen, ratAusGroesse, baueKommissionen, baueBeschluesse, bauePublikationen,
  schlussabstimmungsVotes, serialisiereShard, shaShard, curiaUrl,
  type CuriaShard, type CuriaSchlussabstimmung,
} from './curia.ts';
import { odata, TAKT_MS } from './curia-abruf.ts';
import {
  CURIA_DIR, CURIA_ZUSTAND_PFAD, leseCuriaZustand, serialisiereCuriaZustand, type CuriaZustand,
} from './curia-zustand.ts';

const datumArg = process.argv.find((a) => a.startsWith('--datum='));
const heute = datumArg ? datumArg.slice('--datum='.length) : '';
if (!/^\d{4}-\d{2}-\d{2}$/.test(heute)) { console.error('--datum=YYYY-MM-DD nötig (§2)'); process.exit(1); }
const nurArg = process.argv.find((a) => a.startsWith('--nur='));
const nur = nurArg ? new Set(nurArg.slice('--nur='.length).split(',').map((s) => s.trim())) : null;

// Takt (global <= 2 Anfragen/s), Wiederholversuch und OData-Abfrage liegen in
// `curia-abruf.ts` (importierbar, getestet in src/tests/entstehung-curia-abruf.test.ts).
// Die Aufruf-STELLEN mit ihren `$select`-Literalen bleiben HIER (§11.8, Quelltext-Test).
const NEBENLAEUFIG = 8;

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
  // Die ROHE Zeilenzahl der amtlichen Antwort ist die Referenz der Kreuzprobe — die einzige
  // Zahl, die KEINE unserer Identitäts-Entscheidungen teilt (die erste Runde rechnete gegen
  // eine zweite Auszählung über dieselben sechs Felder und konnte deren Fehler darum nicht
  // finden). Über unseren Bestand ist der Lauf verlustfrei (2055 = 2055, Vollzensus
  // 21.9.2026); speichert ein Shard weniger, ist das ab jetzt ROT, nicht still.
  const objectiveZeilen = await odata('Objective', `BusinessShortNumber eq ${q} and Language eq 'DE'`);
  const publikationen = bauePublikationen(objectiveZeilen);

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
  });
  beschluesseGesamt += beschluesse.length;
  vorberatungenGesamt += kommissionen.length;
  schlussGesamt += schlussabstimmungen.length;
  publikationenGesamt += publikationen.length;
  objectiveZeilenGesamt += objectiveZeilen.length;
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
// BERICHTIGUNG 21.9.2026 (zweite Runde, F8): hier standen DREI Zahlen mit der Lesart
// «gespeichert ≠ distinkt = kollabiert, distinkt < roh = bloss doppelt geliefert». Die
// mittlere Zahl war keine unabhängige Referenz — sie rechnete über dieselben sechs Felder
// wie der Schlüssel und nannte darum Zeilen «Doppellieferungen», die sich in der Vorlage
// unterscheiden (08.053: angeblich 4 Doppel, tatsächlich 4 eigene Fundstellen). Sie ist
// ersatzlos weg; verglichen wird gegen die ROHE amtliche Zeilenzahl.
// §8: die Zeile behauptet keine Vollständigkeit, sie nennt nur, was sie gemessen hat.
console.log(
  `  Publikationen ${publikationenGesamt} gespeichert · ${objectiveZeilenGesamt} rohe amtliche `
  + 'Objective-Zeile(n) geliefert'
  + `${publikationenGesamt === objectiveZeilenGesamt ? '' : ' ← ZUSAMMENGEFALLEN, check:entstehung wird rot'}`,
);
fehlend.sort();
if (fehlend.length) console.log(`  ohne Business-Datensatz (${fehlend.length}): ${fehlend.join(', ')}`);
