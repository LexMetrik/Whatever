// @shard-gruppe: 1
import { test, expect } from '@playwright/test'
import { fehlerSammeln } from './helpers/fehlerSammeln'

// ─── E6a·M5: Amtliche-Materialien-Delta in der Verzahnungs-UI ───────────────
//
// GELÖSCHT 21.8.2026 (H5): «DSG-Reader: Amtliche Materialien-Gruppe mit
// kuratiertem Art.-Sublabel + Dokument-Stand» und «DSG-Reader @390: async
// Soft-Law-Dokument erscheint» prüften das Ist-Hüllen-Kontextfenster
// (`components/kontext/KontextPanel.tsx`). Kontaktbogen H4 §7b Pos. 1
// (21.8.2026, §7b-Deckungsprüfung): geprüft und ausdrücklich NICHT
// nachgebaut — `v3/PanelMaterialien.tsx` schliesst Soft-Law/kuratierte
// Nachträge bewusst aus dem Reiter aus (Dateikopf-Kommentar dort, «SOFT LAW
// BLEIBT DRAUSSEN»: eine dritte/vierte Sache neben Entstehung/In-Arbeit,
// kein Bau-Rückstand — ein Nachbau widerspräche der erklärten V3-
// Architektur und wäre zudem ein Produktentscheid, keine Testlücke).
// Zusicherung in V3 bewusst entfallen, Alt-Spec fällt ersatzlos.
// Verbleibt: die dritte Spec unten, hüllenneutral (MaterialLeser-Karte).

test('MaterialLeser-Karte trägt die nur-verweis-Badge (V3-Vorzug E6a·M5)', async ({ page }) => {
  const fehler = fehlerSammeln(page)
  await page.goto('/materialien/EDOEB-LEITFADEN-DATABREACH')

  await expect(page.getByRole('heading', { name: /Meldung von Datensicherheitsverletzungen/ })).toBeVisible()
  // role="img" mit aria-label «nur Verweis …» (StatusBadge voll, ohne Glyph).
  await expect(page.getByRole('img', { name: /nur Verweis/ })).toBeVisible()
  // Der prominente amtliche Live-Link bleibt (§7c).
  await expect(page.getByRole('link', { name: /Amtliche Fassung ↗/ })).toBeVisible()

  expect(fehler, `Konsolen-/Seitenfehler:\n${fehler.join('\n')}`).toEqual([])
})
