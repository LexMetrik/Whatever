#!/usr/bin/env node
// ─── e2e-Shard-Gruppen generieren: Wurzel-Fix für den Merge-Konflikt-Hotspot ──
// (QS-E2E-SHARD-GEN, fahrplaene/FAHRPLAN-LERNPHASE-2026.md §3.5). Anlass:
// `e2e/shard-gruppen.json` war 5 von 6 Nachzieh-Konflikten der seriellen
// Landung vom 4.8.2026, weil jeder PR mit neuer Spec dieselbe Gruppen-Liste
// editierte. Fix: die Gruppen-Zuordnung wandert als Kopf-Annotation
// (`// @shard-gruppe: N`, erste Zeile jeder `e2e/*.e2e.ts`-Datei) in die
// Spec-Datei selbst — Git-Konflikte auf verschiedenen Specs treffen dann nie
// mehr dieselbe Zeile. `e2e/shard-gruppen.json` ist ab jetzt eine REINE
// Projektion dieser Annotationen (§5 Single Source of Truth: die Annotation
// ist die eine Quelle, die JSON nie von Hand editieren) und trägt
// `merge=regen` in .gitattributes — bei einem lokalen Merge-Konflikt gewinnt
// automatisch die eigene Seite, DANACH macht dieser Generator die Datei
// wieder korrekt (das CI-Tor `check:e2e-shards` erzwingt den Neulauf — es
// ruft seit der Gegenprüfungs-Auflage 14.8.2026 NEBEN dem Union-Wächter auch
// `--check` dieses Skripts auf, damit eine verschobene Annotation OHNE
// Neulauf ebenfalls rot wird, nicht nur eine fehlende Datei/Spec).
//
// GRUPPEN-MITGLIEDSCHAFT (fachlich relevant, was der Union-Wächter prüft):
// ausschliesslich aus den `@shard-gruppe`-Annotationen. Eine Spec ohne
// Annotation, mit mehr als einer Annotation im Kopf oder mit einer Annotation
// ausserhalb 1–GRUPPEN_MAX lässt dieses Skript mit Exit 1 rot laufen
// (Wächter-Funktion vor dem eigentlichen Union-Wächter
// `e2e-shard-gruppen.mjs --pruefen`, der seinerseits die JSON-Schlüssel
// gegen dieselbe Spanne prüft — auch Hand-Edits der JSON fängt so wer).
//
// REIHENFOLGE innerhalb einer Gruppe (rein kosmetisch, betrifft keine
// Zuordnung): die bestehende Reihenfolge aus der aktuellen JSON bleibt
// STABIL erhalten (kein Neu-Sortieren bei jedem Lauf — das würde bei jedem
// PR unnötige Diff-Zeilen erzeugen); neue Dateien einer Gruppe werden
// alphabetisch ans Gruppen-Ende angehängt. Der Freitext-Kommentar
// `_kommentar` ist Hand-Narrativ (Mess-Historie) und wird unverändert aus der
// bestehenden Datei übernommen — dieser Generator schreibt ihn nie selbst.
//
// NACHTLAUF (5.10.2026): Wert `nacht` statt einer Zahl → Liste `nacht` in der
// JSON statt einer Queue-Gruppe (Begründung bei NACHT unten).
//
// Verwendung:
//   node scripts/e2e-shard-gruppen-generieren.mjs           schreibt e2e/shard-gruppen.json
//   node scripts/e2e-shard-gruppen-generieren.mjs --check   nur prüfen, kein Schreiben (Exit 1 bei Drift)
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { gruppenAnzahl, NACHT } from './e2e-shard-anzahl.mjs'

const HIER = dirname(fileURLToPath(import.meta.url))
const WURZEL = join(HIER, '..')
const E2E_DIR = join(WURZEL, 'e2e')
const GRUPPEN_JSON = join(WURZEL, 'e2e', 'shard-gruppen.json')

// Anzahl der Shard-Gruppen: EINE Quelle, die Job-Matrix in ci.yml (§5).
// Die frueheren Kopien dieser Zahl in diesem und im Nachbar-Skript sind mit
// M3 (8 -> 4 Shards, QS-CI-MINUTEN, 8.9.2026) entfallen — Begruendung und
// Fehlerseite in scripts/e2e-shard-anzahl.mjs. Nicht lesbare Matrix = rot.
const GRUPPEN_MAX = gruppenAnzahl()

// Annotation gilt nur als KOPF-Annotation, wenn sie in den ersten KOPF_ZEILEN
// Zeilen der Spec steht (Konvention: Zeile 1, direkt über/unter einem
// Datei-Banner in Zeile 1–2 ist noch "Kopf"; alles danach zählt nicht mehr).
const KOPF_ZEILEN = 3

const ANNOTATION_RE = /^\/\/\s*@shard-gruppe:\s*(\S+)\s*$/

const DEFAULT_KOMMENTAR =
  'e2e-Shard-Balancing: Gruppen sind GENERIERT aus den `// @shard-gruppe:`-Kopf-' +
  'Annotationen in e2e/*.e2e.ts (npm run gen:e2e-shards, QS-E2E-SHARD-GEN). ' +
  'Diese Datei nie von Hand editieren — Neuzuordnung geschieht über die ' +
  'Annotation in der jeweiligen Spec-Datei, dann Generator neu laufen lassen. ' +
  'Union-Wächter: scripts/e2e-shard-gruppen.mjs --pruefen.'

/** Alle @shard-gruppe-Treffer in den ersten KOPF_ZEILEN Zeilen (roh, ungeprüft). */
function annotationenLesen(pfad) {
  const inhalt = readFileSync(pfad, 'utf8')
  const zeilen = inhalt.split('\n', KOPF_ZEILEN)
  const treffer = []
  for (const z of zeilen) {
    const m = z.match(ANNOTATION_RE)
    if (m) treffer.push(m[1])
  }
  return treffer
}

// ── NACHTLAUF (Entscheid David 5.10.2026, QS-CI-ZEIT N2) ────────────────────
// `// @shard-gruppe: nacht` statt einer Zahl: die Spec läuft NICHT in den
// Queue-Shards der Merge-Warteschlange, sondern täglich gegen main
// (perf-nacht.yml, Job e2e-nacht). Bewusst DIESELBE Annotation und keine
// zweite (`@lauf:`): eine Spec trägt genau einen Wert, also liegt sie in genau
// EINER Liste — Queue-Gruppe ODER Nacht; ein Widerspruch zwischen zwei
// Annotationen kann gar nicht entstehen. Die Vereinigung beider Listen prüft
// der Union-Wächter gegen `playwright --list` (e2e-shard-gruppen.mjs).
// Wer eine Spec in die Nacht verschiebt, hält die GRENZE der Freigabe ein:
// Specs, die Rechenergebnisse oder die Anzeige von Gesetzes-/Urteilstext
// prüfen, bleiben in der Warteschlange (Einstufung und Begründung:
// bibliothek/betrieb/e2e-fang-historie-2026-10-05.md).

/** roh (String) → kanonische Gruppen-Nummer als String bzw. NACHT, oder null wenn
 *  ungültig (nicht-numerisch, führende Null wie "01", ausserhalb 1..GRUPPEN_MAX). */
function gruppeParsen(roh) {
  if (roh === NACHT) return NACHT
  if (!/^[1-9]\d*$/.test(roh)) return null
  const n = Number(roh)
  if (!Number.isInteger(n) || n < 1 || n > GRUPPEN_MAX) return null
  return String(n)
}

// ── OPT-IN-SPECS: nicht im CI-Lauf, also auch in keiner Shard-Gruppe ────────
// `e2e/px-*.e2e.ts` (Pixelvergleich A-7) wird von playwright.config.ts nur bei
// gesetztem `PX=1` überhaupt einem Projekt zugeordnet. Ohne das Flag sammelt
// `playwright test --list` sie nicht — der Union-Wächter kennt sie also gar
// nicht und würde eine Gruppenzuordnung sogar als «UNBEKANNT» rot melden.
// Dieser Generator liest dagegen das VERZEICHNIS und sähe die Datei; ohne diese
// Ausnahme verlangte er eine Annotation, die der Wächter direkt danach wieder
// verböte — zwei Tore mit gegenläufiger Forderung.
//
// Das Muster steht bewusst hier und nicht als Annotation in der Spec: «läuft im
// CI mit» ist eine Eigenschaft der PROJEKT-Konfiguration, und die Datei, die
// die Gruppen erzeugt, muss dieselbe Grenze kennen (§5). Wer ein weiteres
// Opt-in-Projekt einführt, ergänzt hier ein Muster — und nirgends sonst.
const OPT_IN_MUSTER = [/^px-.*\.e2e\.ts$/]

function alleSpecs() {
  return readdirSync(E2E_DIR)
    .filter((d) => d.endsWith('.e2e.ts'))
    .filter((d) => !OPT_IN_MUSTER.some((re) => re.test(d)))
    .sort()
}

function altesJson() {
  if (!existsSync(GRUPPEN_JSON)) return null
  try {
    return JSON.parse(readFileSync(GRUPPEN_JSON, 'utf8'))
  } catch {
    return null
  }
}

function bauen() {
  const specs = alleSpecs()
  const gruppeVon = new Map()
  const fehlend = []
  const mehrdeutig = []
  const ungueltig = []

  for (const spec of specs) {
    const treffer = annotationenLesen(join(E2E_DIR, spec))
    if (treffer.length === 0) {
      fehlend.push(spec)
      continue
    }
    if (treffer.length > 1) {
      mehrdeutig.push({ spec, werte: treffer })
      continue
    }
    const g = gruppeParsen(treffer[0])
    if (g === null) {
      ungueltig.push({ spec, roh: treffer[0] })
      continue
    }
    gruppeVon.set(spec, g)
  }

  if (fehlend.length || mehrdeutig.length || ungueltig.length) {
    console.error('✗ e2e-Shard-Generator ROT:')
    if (fehlend.length) {
      console.error(`  Ohne \`// @shard-gruppe: N\`-Kopf-Annotation (erste ${KOPF_ZEILEN} Zeilen):`)
      for (const f of fehlend) console.error(`     ${f}`)
    }
    if (mehrdeutig.length) {
      console.error(`  MEHRDEUTIG — mehr als eine Annotation in den ersten ${KOPF_ZEILEN} Zeilen:`)
      for (const { spec, werte } of mehrdeutig) console.error(`     ${spec} (Werte: ${werte.join(', ')})`)
    }
    if (ungueltig.length) {
      console.error(`  UNGÜLTIG — Wert weder 1–${GRUPPEN_MAX} noch «${NACHT}» oder falsch formatiert (z. B. führende Null):`)
      for (const { spec, roh } of ungueltig) console.error(`     ${spec} (Wert: "${roh}")`)
    }
    console.error(
      `\n   Fix: genau EINE gültige Annotation \`// @shard-gruppe: 1\`..\`${GRUPPEN_MAX}\` oder \`// @shard-gruppe: ${NACHT}\` in Zeile 1–${KOPF_ZEILEN} der Spec-Datei, dann neu laufen lassen.`,
    )
    process.exit(1)
  }

  const alt = altesJson()
  const alteGruppen = alt?.gruppen ?? {}
  const gruppenNummern = [...new Set(gruppeVon.values())]
    .filter((g) => g !== NACHT)
    .sort((a, b) => Number(a) - Number(b))

  /** Stabile Reihenfolge: bisherige Folge erhalten, Neue alphabetisch anhängen. */
  const stabil = (bisher, g) => {
    const bisherigeReihenfolge = Array.isArray(bisher) ? bisher : []
    const dieserGruppe = new Set([...gruppeVon.entries()].filter(([, v]) => v === g).map(([k]) => k))
    const erhalten = bisherigeReihenfolge.filter((f) => dieserGruppe.has(f))
    const neu = [...dieserGruppe].filter((f) => !bisherigeReihenfolge.includes(f)).sort()
    return [...erhalten, ...neu]
  }

  const gruppen = {}
  for (const g of gruppenNummern) gruppen[g] = stabil(alteGruppen[g], g)

  const kommentar = typeof alt?._kommentar === 'string' ? alt._kommentar : DEFAULT_KOMMENTAR

  // `nacht` steht IMMER im Objekt (auch leer): der Union-Wächter liest es ohne
  // Sonderfall, und eine fehlende Liste ist dort ein Befund, kein Default.
  return { _kommentar: kommentar, gruppen, [NACHT]: stabil(alt?.[NACHT], NACHT) }
}

function serialisieren(objekt) {
  return JSON.stringify(objekt, null, 1) + '\n'
}

function main() {
  const modus = process.argv[2]
  const neu = serialisieren(bauen())

  if (modus === '--check') {
    const jetzt = existsSync(GRUPPEN_JSON) ? readFileSync(GRUPPEN_JSON, 'utf8') : ''
    if (jetzt === neu) {
      console.log('✓ e2e/shard-gruppen.json ist aktuell (byte-gleich zur Generierung aus den Annotationen).')
      process.exit(0)
    }
    console.error('✗ e2e/shard-gruppen.json ist NICHT aktuell — Drift zur Generierung aus den Annotationen.')
    console.error('  Fix: npm run gen:e2e-shards')
    process.exit(1)
  }

  writeFileSync(GRUPPEN_JSON, neu)
  const b = bauen()
  console.log(`✓ e2e/shard-gruppen.json generiert (${Object.keys(b.gruppen).length} Queue-Gruppen, ${b[NACHT].length} Specs im Nachtlauf).`)
}

main()
