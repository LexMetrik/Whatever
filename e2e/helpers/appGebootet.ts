import { type Page } from '@playwright/test'

// ── «DIE APP IST FERTIG HOCHGEFAHREN» (§17-Wurzel-Fix, 6.9.2026) ─────────────
//
// GEMESSEN am Stand 6e09c681e, `vite preview`, Chromium unter CPU-Drossel 20×
// (die Drossel bildet den 2-vCPU-CI-Runner unter Parallel-Last nach):
//   ohne diesen Helfer   12/12 ROT — `page.keyboard.press('Tab')` bewegte den
//                        Fokus GAR NICHT; `document.activeElement` blieb sofort
//                        UND nach 2.5 s `<body>`.
//   mit diesem Helfer    0/12 ROT.
// Der Tastendruck fiel also in das Zeitfenster, in dem der Haupt-Thread noch
// mit dem Hochfahren beschäftigt ist (Modul-Auswertung, erster React-Commit,
// Route-Chunk). Das ist eine MESSBEDINGUNG, kein Prüfgegenstand: der Wächter
// will die TAB-REIHENFOLGE messen, nicht das Verhalten der Anwendung während
// ihres eigenen Starts.
//
// ZWEI SIGNALE, beide deterministisch:
//  1. Der Baum ist der von React GERENDERTE, nicht mehr der prerenderte.
//     `createRoot(...).render()` ersetzt die Kinder von `#root` (main.tsx —
//     die App hydratisiert bewusst nicht); React markiert jeden Knoten, den es
//     selbst führt, mit einem `__reactFiber$…`-Schlüssel. Trägt der Skip-Link
//     ihn, hat der erste Commit stattgefunden.
//  2. Der Haupt-Thread hat danach einmal Luft (`requestIdleCallback`). Ohne
//     diesen zweiten Schritt genügt Signal 1 nicht: der Fiber-Schlüssel stand
//     in der Messung schon unmittelbar nach `load`, der Tastendruck ging
//     trotzdem verloren.
//
// KEIN PRÜFPUNKT WIRD WEICHER: der Helfer wartet nur, er drückt und behauptet
// nichts. Wer ihn missbraucht, um eine Zusage zu umgehen, merkt es daran, dass
// die Zusage danach unverändert dasteht.
//
// NACHTRAG 15.9.2026 (QS-BASIS) — die Messung oben bleibt, wie sie war; hier
// steht nur, was seither DAZUGEKOMMEN ist: auf den prerenderten App-Routen
// hydriert `main.tsx` inzwischen (`hydrateRoot`) statt zu ersetzen. Der Satz
// «die App hydratisiert bewusst nicht» in Signal 1 beschreibt damit den Stand
// bis 14.9.2026. Am Helfer ändert das NICHTS: der `__reactFiber$`-Schlüssel
// entsteht beim ersten React-Commit, ob der nun hydriert oder neu rendert —
// beide Wege werden unverändert erkannt.
//
// ROT ZU BEKOMMEN (§6.7): den `requestIdleCallback`-Schritt streichen ⇒ der
// Skip-Link-Wächter fällt unter Drossel 20× wieder auf 12/12 rot zurück.
export async function appGebootet(page: Page, timeout = 30_000): Promise<void> {
  await page.waitForFunction(() => {
    const el = document.querySelector('#root a[href="#inhalt"]')
    return !!el && Object.keys(el).some((k) => k.startsWith('__reactFiber$'))
  }, null, { timeout })
  await page.evaluate(() => new Promise<void>((fertig) => (
    'requestIdleCallback' in window
      ? window.requestIdleCallback(() => fertig(), { timeout: 5000 })
      : setTimeout(fertig, 0))))
}
