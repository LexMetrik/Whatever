// @shard-gruppe: 8
// ═══ D1 (W2·24-Gesamtprüfung 7.9.2026) · unmögliches Datum im Tagerechner ═══
//
// GEMESSEN am Stand `018b41a37`: `01.01.2026` + 30 Tage ⇒ Fristende
// 02.02.2026. Danach das Datum auf `31.02.2026` geändert (ein Tag, den es
// nicht gibt) — das Ergebnis blieb UNVERÄNDERT bei 02.02.2026 stehen, 0 ×
// `aria-invalid`, 0 × Meldung: ein Tippfehler im Datum blieb unbemerkt (§8).
//
// FIX (reine Darstellungs-Korrektur, §3 — keine Rechenlogik berührt):
// `src/components/DatumsFeld.tsx` markiert das Feld bei einem vollständig
// eingegebenen, aber kalendarisch unmöglichen Datum `aria-invalid` mit einer
// Feld-Fehlerzeile (`.lc-notice-danger`) und leert den Wert — der Aufrufer
// (`EinfacheFristForm.tsx`, unverändert) fällt dadurch von selbst auf seinen
// bestehenden Leerzustand (`ErgebnisPlatzhalter`, `data-platzhalter`) zurück.
import { test, expect } from '@playwright/test'

test('D1 · 31.02.2026 markiert das Feld und leert das alte Fristende', async ({ page }) => {
  await page.goto('/rechner/tagerechner')
  // Erstes DatumsFeld/Zahlenfeld der Seite gehört dem oberen Schnellrechner
  // (EinfacheFristForm) — derselben Fläche, an der D1 gemessen wurde.
  const datum = page.locator('input[placeholder="TT.MM.JJJJ"]').first()
  const laenge = page.locator('input[type="number"]').first()

  await datum.fill('01.01.2026')
  await laenge.fill('30')
  const ergebnis = page.locator('#lc-ergebnis-einfach')
  await expect(ergebnis).toBeVisible()
  const vorher = await ergebnis.innerText()
  expect(vorher, 'Vorbedingung: ein echtes Ergebnis steht da').toMatch(/02\.02\.2026/)

  await datum.fill('31.02.2026')

  // Feld sichtbar ungültig, mit Feld-Fehlerzeile.
  await expect(datum, 'D1: aria-invalid fehlte vorher ganz').toHaveAttribute('aria-invalid', 'true')
  // getByRole+name griffe hier nicht: `alert` berechnet seinen Accessible-Name
  // NICHT aus dem Inhalt (kein «name from contents»-Rolle) — der sichtbare Text
  // ist trotzdem da, `getByText` prüft genau den.
  await expect(page.getByText('Dieses Datum gibt es nicht', { exact: false })).toBeVisible()

  // Das ALTE Ergebnis (02.02.2026) darf nicht mehr stehen — der Leerzustand
  // übernimmt (`data-platzhalter`), nicht eine stillschweigend fortgeschriebene Zahl.
  await expect(page.locator('#lc-ergebnis-einfach')).toHaveCount(0)
  await expect(page.locator('[data-platzhalter]').first()).toBeVisible()

  // ROT-BEWEIS (§6.7): am Vorher-Stand blieb genau der alte Text stehen —
  // dieselbe Prüfung auf der GEMESSENEN Vorher-Ausgabe fällt durch.
  expect(vorher).toMatch(/02\.02\.2026/)
})

test('D1 · 99.99.9999 verhält sich gleich (kein Einzelfall am Kalenderende)', async ({ page }) => {
  await page.goto('/rechner/tagerechner')
  const datum = page.locator('input[placeholder="TT.MM.JJJJ"]').first()
  await datum.fill('99.99.9999')
  await expect(datum).toHaveAttribute('aria-invalid', 'true')
  await expect(page.locator('[data-platzhalter]').first()).toBeVisible()
})
