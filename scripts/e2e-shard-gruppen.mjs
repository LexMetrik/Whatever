#!/usr/bin/env node
// ─── e2e-Shard-Balancing: gemessene Datei-Gruppen statt Alphabet ─────────────
// Playwright 1.60 verteilt `--shard=i/N` nach TEST-ZAHL in Projekt- +
// Alphabet-Reihenfolge (fullyParallel:true → Test-Ebene), NICHT nach Dauer.
// Ergebnis: die schweren OR-Reader-Specs (leser-*, gesetze.e2e, norm-sprung)
// liegen alphabetisch beisammen und landeten alle in Shard 2 → 22–42 min,
// während Shard 1/3 in 7–11 min durchliefen. Auf dem gestarveten Runner riss
// die lange Chromium-Session dann sogar Einzel-Budgets (a33-F1 240 s).
//
// Lösung: DETERMINISTISCHE, aus gemessenen Dauern gepackte Datei-Gruppen
// (`shard-gruppen.json`), je Matrix-Job eine Gruppe. Das ändert NUR, WELCHE
// Datei auf WELCHEM Runner läuft — kein `expect`, kein Test, kein Timeout, kein
// Umfang wird berührt (§6.3). Die Union der Gruppen MUSS exakt die Gesamtmenge
// der von Playwright gesammelten Specs sein; das erzwingt der `--pruefen`-
// Wächter unten (in `check:seriell` und als CI-Schritt vor den Shards).
//
// NACHTLAUF (Entscheid David 5.10.2026, QS-CI-ZEIT N2): neben den Queue-
// Gruppen trägt die JSON die Liste `nacht` — Specs, die täglich gegen main
// laufen statt in der Warteschlange (perf-nacht.yml, Job e2e-nacht). Der
// Wächter prüft die VEREINIGUNG Queue ∪ Nacht gegen `playwright --list` und
// den SCHNITT auf leer: keine Spec darf in keiner Liste fehlen, keine in
// beiden stehen (sonst führe sie doppelt oder, schlimmer, nirgends).
//
// Verwendung:
//   node scripts/e2e-shard-gruppen.mjs --pruefen        Union-Wächter (Queue ∪ Nacht == playwright --list, Schnitt leer)
//   node scripts/e2e-shard-gruppen.mjs --fahren <N>     Gruppe N (oder `nacht`) mit Playwright fahren (Exit-Code durchgereicht)
//   node scripts/e2e-shard-gruppen.mjs --dateien <N>    Datei-Argumente der Gruppe N (oder `nacht`) ausgeben
import { execFileSync, spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { gruppenAnzahl, NACHT } from './e2e-shard-anzahl.mjs'

const HIER = dirname(fileURLToPath(import.meta.url))
const WURZEL = join(HIER, '..')
const GRUPPEN_JSON = join(WURZEL, 'e2e', 'shard-gruppen.json')

// Anzahl der Shard-Gruppen: EINE Quelle, die Job-Matrix in ci.yml (§5).
// Die frueheren Kopien dieser Zahl in diesem und im Nachbar-Skript sind mit
// M3 (8 -> 4 Shards, QS-CI-MINUTEN, 8.9.2026) entfallen — Begruendung und
// Fehlerseite in scripts/e2e-shard-anzahl.mjs. Nicht lesbare Matrix = rot.
const GRUPPEN_MAX = gruppenAnzahl()

/** Gruppen-Definition laden: { gruppen: { "1": [datei, …], … }, nacht: [datei, …] }. */
function ladeGruppen() {
  const roh = JSON.parse(readFileSync(GRUPPEN_JSON, 'utf8'))
  const schluessel = Object.keys(roh.gruppen)
  return { meta: roh, schluessel, gruppen: roh.gruppen, nacht: roh[NACHT] }
}

/**
 * Autoritative Gesamtmenge: was Playwright SELBST sammelt (`--list`), über
 * beide Projekte (schwer + chromium). Rückgabe = Set der Spec-Datei-Basenamen.
 * `--list` startet weder webServer noch Browser — günstig und offline.
 */
function gesammelteSpecs() {
  const ausgabe = execFileSync(
    'npx',
    ['playwright', 'test', '--list'],
    { cwd: WURZEL, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env } },
  )
  const dateien = new Set()
  for (const zeile of ausgabe.split('\n')) {
    const treffer = zeile.match(/([A-Za-z0-9._-]+\.e2e\.ts):\d+/)
    if (treffer) dateien.add(treffer[1])
  }
  return dateien
}

/** Schlüssel ausserhalb 1..GRUPPEN_MAX (auch führende Nullen wie "01"). */
function ungueltigeSchluessel(schluessel) {
  return schluessel.filter((s) => !/^[1-9]\d*$/.test(s) || Number(s) > GRUPPEN_MAX)
}

function pruefen() {
  const { gruppen, schluessel, nacht } = ladeGruppen()

  if (!Array.isArray(nacht)) {
    console.error(`✗ e2e-Shard-Union-Wächter ROT — e2e/shard-gruppen.json trägt keine Liste "${NACHT}" (auch leer muss sie stehen).`)
    console.error('\n   Fix: `npm run gen:e2e-shards` erzeugt die Datei aus den Annotationen neu.')
    process.exit(1)
  }

  const schlechteSchluessel = ungueltigeSchluessel(schluessel)
  if (schlechteSchluessel.length) {
    console.error(`✗ e2e-Shard-Union-Wächter ROT — Gruppen-Schlüssel ausserhalb 1–${GRUPPEN_MAX} in e2e/shard-gruppen.json:`)
    for (const s of schlechteSchluessel) console.error(`   "${s}"`)
    console.error('\n   Fix: gültigen Schlüssel setzen oder Datei per `npm run gen:e2e-shards` aus den Annotationen neu erzeugen.')
    process.exit(1)
  }

  const gesamt = gesammelteSpecs()

  const fehler = []
  const gesehen = new Map() // datei -> gruppe (Duplikat-Erkennung)
  const union = new Set()

  // Queue-Gruppen und Nachtliste in EINEM Durchgang: so meldet derselbe
  // DOPPELT-Zweig auch eine Spec, die zugleich in einer Queue-Gruppe und in der
  // Nacht steht (Schnitt ≠ leer).
  const listen = [...Object.entries(gruppen), [NACHT, nacht]]
  for (const [g, dateien] of listen) {
    for (const d of dateien) {
      if (gesehen.has(d)) {
        fehler.push(`DOPPELT: ${d} in Gruppe ${gesehen.get(d)} UND Gruppe ${g}`)
      }
      gesehen.set(d, g)
      union.add(d)
      if (!gesamt.has(d)) {
        fehler.push(`UNBEKANNT: ${d} (Gruppe ${g}) — von Playwright nicht gesammelt`)
      }
    }
  }
  for (const d of gesamt) {
    if (!union.has(d)) {
      fehler.push(`FEHLT: ${d} — weder in einer Queue-Gruppe noch in «${NACHT}» (neue Spec? → Annotation \`// @shard-gruppe: N\` setzen, dann npm run gen:e2e-shards)`)
    }
  }

  if (fehler.length) {
    console.error('✗ e2e-Shard-Union-Wächter ROT — Gruppen ≠ playwright --list:')
    for (const f of fehler) console.error('   ' + f)
    console.error(`\n   Gesammelt: ${gesamt.size} Specs · in Gruppen: ${union.size} · Datei: e2e/shard-gruppen.json`)
    process.exit(1)
  }
  console.log(
    `✓ e2e-Shard-Union-Wächter grün — ${gesamt.size} Specs, Union der ${Object.keys(gruppen).length} Queue-Gruppen und der Nachtliste (${nacht.length}) exakt deckungsgleich, keine Doppelten.`,
  )
}

function dateienDerGruppe(n) {
  const { gruppen, nacht } = ladeGruppen()
  const dateien = n === NACHT ? nacht : gruppen[String(n)]
  if (!Array.isArray(dateien) || dateien.length === 0) {
    // Leere Liste = rot, nicht «nichts zu tun»: `playwright test` OHNE Datei-
    // Argumente führe sonst ALLE Specs (§6.7 — kein stilles Falsch-Grün/-Voll).
    console.error(`Unbekannte oder leere Gruppe: ${n} (bekannt: ${Object.keys(gruppen).join(', ')}, ${NACHT})`)
    process.exit(2)
  }
  return dateien.map((d) => `e2e/${d}`)
}

function fahren(n) {
  const args = ['playwright', 'test', ...dateienDerGruppe(n)]
  const r = spawnSync('npx', args, { cwd: WURZEL, stdio: 'inherit', env: { ...process.env } })
  process.exit(r.status ?? 1)
}

const [modus, arg] = process.argv.slice(2)
switch (modus) {
  case '--pruefen':
    pruefen()
    break
  case '--fahren':
    fahren(arg)
    break
  case '--dateien':
    console.log(dateienDerGruppe(arg).join(' '))
    break
  default:
    console.error('Verwendung: --pruefen | --fahren <N> | --dateien <N>')
    process.exit(2)
}
