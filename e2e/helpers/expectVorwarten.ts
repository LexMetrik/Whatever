// e2e/helpers/expectVorwarten.ts — Playwright-Assertions pollen, ohne die Seite
// auszubremsen (W2·29-WERKBANK-LESER, QS-Nebenfund 23.9.2026, Auftrag David
// «fix das gleich»). Registriert ZENTRAL aus `playwright.config.ts` — keine Spec
// importiert diese Datei, keine Spec muss etwas davon wissen.
//
// ── DER MECHANISMUS (Playwright 1.60, node_modules/playwright-core/lib/coreBundle.js)
// Jede Locator-Assertion (`toBeVisible`, `toHaveText`, …) pollt über
// `InjectedScript.expect()`. Diese Funktion rechnet NACH der eigentlichen Prüfung
// in JEDEM Poll — auch im grünen — `_ariaSnapshotForExpect()`:
//   · Ziel sichtbar   → Aria-Snapshot des Ziels (Tiefe 1; bei toHaveText/
//                        toContainText dessen ganzer Teilbaum) — billig.
//   · Ziel fehlt oder
//     ist unsichtbar  → Aria-Snapshot des GANZEN `document.body` — im
//                        Seiten-Hauptthread.
// Der Snapshot dient einzig dem `error-context` beim Scheitern
// (playwright/lib/worker/workerProcessEntry.js `testInfoError`). Auf einem
// grossen Erlass (ZGB ~54 000 Knoten) kostet er Sekunden je Poll — genau die
// Sekunden, in denen die App das Ziel rendern müsste; die Wartung verzögert das,
// worauf sie wartet (CPU-Profil PR #1007: 10.9 s von 13.7 s im Snapshot).
// Eine offizielle Abschaltung gibt es nicht (keine Config-/Env-/expect.configure-
// Option in 1.60). Playwright 1.63 rechnet den Snapshot nur noch in NICHT
// erfüllten Polls — das ist aber gerade das Warten auf ein noch fehlendes Ziel;
// ein Upgrade allein behebt den Defekt also nicht.
//
// ── DIE LÖSUNG ────────────────────────────────────────────────────────────────
// Vor der eigentlichen Assertion wird mit `locator.waitFor()` gewartet — das
// pollt dieselbe Zustandsfunktion (`isElementVisible`, gleich strikt), aber
// OHNE Snapshot. Zwei Gruppen:
//   A  toBeVisible / toBeHidden / toBeAttached (samt `.not` und
//      `{visible|attached:false}`): `waitFor` mit dem entsprechenden Zustand IST
//      die Assertion (dieselbe Prüfung im Injected Script). Gelingt es, ist die
//      Assertion erfüllt; die eingebaute Assertion läuft nur beim Scheitern, damit
//      Fehlermeldung, Call-Log und `error-context` (Snapshot) unverändert kommen.
//   B  toBeInViewport / toHaveAttribute / toHaveText / toContainText /
//      toHaveValue / toBeFocused: «im DOM» ist NOTWENDIGE Bedingung — ohne
//      Element scheitern sie in jedem Poll, eingebaut sogar NEGIERT (Injected
//      Script `_expectCore`: fehlendes Element → `matches: options.isNot`).
//      Darum erst `waitFor({state:'attached'})`, dann die eingebaute Assertion
//      mit der RESTFRIST. Ausgenommen: `not.toBeInViewport` (fehlendes Element
//      erfüllt dort) und Array-Erwartungen (mehrere Elemente, kein Snapshot) —
//      dort läuft unverändert die eingebaute Assertion.
// Frist, nicht Summe: `waitFor` und Nachprüfung teilen sich EINE Schranke (die der
// Aufrufstelle bzw. der Config). Kein Timeout erhöht, kein Retry, keine
// Assertion gelockert (§6.3). Nicht erfasste Matcher laufen unverändert.
//
// ── WARUM ZENTRAL UND WARUM SO ────────────────────────────────────────────────
// `expect.extend()` schreibt die Matcher in das Register der GLOBALEN
// `expect`-Instanz (playwright/lib/matchers/expect.js `expectFn.extend`:
// `Object.assign(info.userMatchers, …)`; User-Matcher überdecken eingebaute).
// Die Worker laden `playwright.config.ts` vor den Specs
// (`configLoader.deserializeConfig`). Also wirkt ein Import in der Config auf
// JEDEN `import { expect } from '@playwright/test'` — alle Specs und Helfer,
// auch künftige, ohne Import-Umbau. Beides sind Interna: fällt eines bei einem
// Playwright-Upgrade weg, wird `e2e/expect-vorwarten.e2e.ts` ROT (Stolperdraht
// über den Zähler unten), statt dass der Schutz still verschwindet (§6.7).
import { expect, type ExpectMatcherState, type Locator } from '@playwright/test'

type Zustand = 'visible' | 'hidden' | 'attached' | 'detached'
type Ergebnis = {
  pass: boolean
  message: () => string
  name?: string
  expected?: unknown
  actual?: unknown
  log?: string[]
  timeout?: number
}
type Optionen = { timeout?: number } & Record<string, unknown>

/** Globaler Schlüssel des Stolperdrahts — die Wächter-Spec liest ihn, OHNE diese
 *  Datei zu importieren (ein Import würde die Registrierung selbst auslösen und
 *  den Draht blind machen). */
const VORWARTEN_MARKE = Symbol.for('lexmetrik.e2e.expectVorwarten')
type Marke = { registriert: true; aufrufe: number }

const GLOBAL = globalThis as unknown as Record<symbol, Marke | undefined>

// Die unveränderten, eingebauten Matcher: `extend({})` liefert eine NEUE
// expect-Instanz mit KOPIE des (noch leeren) Registers — sie sieht die
// Überschreibungen unten nicht und dient als Delegat.
// (Wird das Modul doppelt geladen, registriert nur die erste Instanz —
// `registrieren()` unten prüft die Marke; der Delegat der zweiten bleibt unbenutzt.)
const eingebaut = expect.extend({})

function istLocator(x: unknown): x is Locator {
  const l = x as Partial<Locator> | null
  return !!l && typeof l === 'object' && typeof l.waitFor === 'function' && typeof l.locator === 'function'
}

function zaehlen(): void {
  const marke = GLOBAL[VORWARTEN_MARKE]
  if (marke) marke.aufrufe += 1
}

/** Ruft den eingebauten Matcher (gleiche Negation, gleiche Argumente) und gibt
 *  sein Ergebnis als Matcher-Ergebnis zurück — beim Scheitern samt Call-Log und
 *  Snapshot (`ariaSnapshot` → `error-context`). */
async function eingebautPruefen(
  ctx: ExpectMatcherState,
  name: string,
  actual: unknown,
  args: unknown[],
): Promise<Ergebnis> {
  const basis = eingebaut(actual) as unknown as Record<string, unknown> & { not: Record<string, unknown> }
  const matcher = (ctx.isNot ? basis.not[name] : basis[name]) as (...a: unknown[]) => Promise<void>
  try {
    await matcher(...args)
    return { pass: !ctx.isNot, message: () => '', name }
  } catch (e) {
    const r = (e as { matcherResult?: Ergebnis & { message: string | (() => string) } }).matcherResult
    if (!r) throw e
    const text = typeof r.message === 'function' ? r.message() : r.message
    return { ...r, message: () => text }
  }
}

/** Die eingebaute Nachprüfung lief mit der RESTFRIST `gegeben`; in Meldung,
 *  Call-Log und `timeout` steht die Schranke der Aufrufstelle (`echt`) —
 *  sonst läse sich ein Scheitern als «Timeout: 1ms». */
function fristEinsetzen(r: Ergebnis, gegeben: number, echt: number, vorlauf: string | null): Ergebnis {
  if (gegeben === echt && !vorlauf) return r
  const ersetze = (s: string): string =>
    s
      // Zeile «Timeout: ␣Nms» (ein oder zwei Leerzeichen, ANSI-gefärbt — darum ohne ^/$)
      .replace(new RegExp(`(Timeout:\\s+)${gegeben}ms`, 'g'), `$1${echt}ms`)
      .replace(new RegExp(` with timeout ${gegeben}ms`, 'g'), ` with timeout ${echt}ms`)
  const text = ersetze(r.message())
  const zusatz = vorlauf
    ? `\nVorlauf ohne Aria-Snapshot je Poll (e2e/helpers/expectVorwarten.ts):\n${vorlauf}\n`
    : ''
  return {
    ...r,
    timeout: r.timeout === undefined ? undefined : echt,
    log: r.log?.map(ersetze),
    message: () => text + zusatz,
  }
}

function restfrist(timeout: number, frist: number): number {
  // 0 heisst in Playwright «ohne Schranke» — so bleibt es.
  if (timeout === 0) return 0
  return Math.max(1, frist - Date.now())
}

function vorlaufText(e: unknown): string {
  const m = e instanceof Error ? e.message : String(e)
  return m
    .split('\n')
    .map((z) => z.trimEnd())
    .filter((z) => z.length > 0)
    .map((z) => `  ${z.trim()}`)
    .join('\n')
}

/** Gruppe A — `waitFor(zustand)` ist die Assertion. */
async function zustandMatcher(
  ctx: ExpectMatcherState,
  name: string,
  actual: unknown,
  args: unknown[],
  zustand: Zustand,
): Promise<Ergebnis> {
  if (!istLocator(actual) || ctx.promise) return eingebautPruefen(ctx, name, actual, args)
  zaehlen()
  const opt = (args[0] ?? {}) as Optionen
  const timeout = opt.timeout ?? ctx.timeout
  const frist = Date.now() + timeout
  try {
    await actual.waitFor({ state: zustand, timeout })
    return { pass: !ctx.isNot, message: () => '', name, expected: zustand }
  } catch (e) {
    // Scheitern (Frist, Strict-Mode, geschlossene Seite …): die eingebaute
    // Assertion urteilt selbst — mit der Restfrist, damit sie Meldung und
    // Snapshot wie gewohnt liefert.
    const gegeben = restfrist(timeout, frist)
    const r = await eingebautPruefen(ctx, name, actual, [{ ...opt, timeout: gegeben }])
    return r.pass === !ctx.isNot ? r : fristEinsetzen(r, gegeben, timeout, vorlaufText(e))
  }
}

function umkehren(z: Zustand): Zustand {
  return ({ visible: 'hidden', hidden: 'visible', attached: 'detached', detached: 'attached' } as const)[z]
}

/** Gruppe B — erst «im DOM» ohne Snapshot, dann die eingebaute Assertion mit der
 *  Restfrist. `optIndex` = Position des Optionen-Arguments. */
async function nachAnhaengenMatcher(
  ctx: ExpectMatcherState,
  name: string,
  actual: unknown,
  args: unknown[],
  optIndex: number,
  ohneVorlauf = false,
): Promise<Ergebnis> {
  if (!istLocator(actual) || ctx.promise || ohneVorlauf) {
    return eingebautPruefen(ctx, name, actual, args)
  }
  zaehlen()
  const opt = (args[optIndex] ?? {}) as Optionen
  const timeout = opt.timeout ?? ctx.timeout
  const frist = Date.now() + timeout
  let vorlauf: string | null = null
  try {
    await actual.waitFor({ state: 'attached', timeout })
  } catch (e) {
    vorlauf = vorlaufText(e)
  }
  const gegeben = restfrist(timeout, frist)
  const neu = args.slice()
  while (neu.length < optIndex) neu.push(undefined)
  neu[optIndex] = { ...opt, timeout: gegeben }
  const r = await eingebautPruefen(ctx, name, actual, neu)
  return r.pass === !ctx.isNot ? r : fristEinsetzen(r, gegeben, timeout, vorlauf)
}

function istTextListe(x: unknown): boolean {
  return Array.isArray(x)
}

/** toHaveAttribute(name, options?) | toHaveAttribute(name, value, options?) —
 *  wie im eingebauten Matcher: ein Nicht-RegExp-Objekt an Stelle 2 ist die
 *  Optionen-Form. */
function attributOptIndex(args: unknown[]): number {
  const zweites = args[1]
  return zweites !== null && typeof zweites === 'object' && !(zweites instanceof RegExp) ? 1 : 2
}

function registrieren(): void {
  if (GLOBAL[VORWARTEN_MARKE]) return
  GLOBAL[VORWARTEN_MARKE] = { registriert: true, aufrufe: 0 }
  expect.extend({
    // ── Gruppe A ──
    toBeVisible(this: ExpectMatcherState, actual: unknown, ...args: unknown[]) {
      const opt = (args[0] ?? {}) as { visible?: boolean }
      const soll: Zustand = opt.visible === false ? 'hidden' : 'visible'
      return zustandMatcher(this, 'toBeVisible', actual, args, this.isNot ? umkehren(soll) : soll)
    },
    toBeHidden(this: ExpectMatcherState, actual: unknown, ...args: unknown[]) {
      return zustandMatcher(this, 'toBeHidden', actual, args, this.isNot ? 'visible' : 'hidden')
    },
    toBeAttached(this: ExpectMatcherState, actual: unknown, ...args: unknown[]) {
      const opt = (args[0] ?? {}) as { attached?: boolean }
      const soll: Zustand = opt.attached === false ? 'detached' : 'attached'
      return zustandMatcher(this, 'toBeAttached', actual, args, this.isNot ? umkehren(soll) : soll)
    },
    // ── Gruppe B ──
    toBeInViewport(this: ExpectMatcherState, actual: unknown, ...args: unknown[]) {
      // not.toBeInViewport: fehlendes Element ERFÜLLT — kein Vorwarten.
      return nachAnhaengenMatcher(this, 'toBeInViewport', actual, args, 0, this.isNot)
    },
    toBeFocused(this: ExpectMatcherState, actual: unknown, ...args: unknown[]) {
      return nachAnhaengenMatcher(this, 'toBeFocused', actual, args, 0)
    },
    toHaveAttribute(this: ExpectMatcherState, actual: unknown, ...args: unknown[]) {
      return nachAnhaengenMatcher(this, 'toHaveAttribute', actual, args, attributOptIndex(args))
    },
    toHaveText(this: ExpectMatcherState, actual: unknown, ...args: unknown[]) {
      return nachAnhaengenMatcher(this, 'toHaveText', actual, args, 1, istTextListe(args[0]))
    },
    toContainText(this: ExpectMatcherState, actual: unknown, ...args: unknown[]) {
      return nachAnhaengenMatcher(this, 'toContainText', actual, args, 1, istTextListe(args[0]))
    },
    toHaveValue(this: ExpectMatcherState, actual: unknown, ...args: unknown[]) {
      return nachAnhaengenMatcher(this, 'toHaveValue', actual, args, 1)
    },
  })
}

registrieren()
