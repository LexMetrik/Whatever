// @shard-gruppe: 2
// FN-4 (W2·5d/A21, FAHRPLAN-GESETZESDARSTELLUNG-V2.md §2 F1): Absatz-Zuordnung
// der Fussnoten in der Alt-Form-Familie (VZG, KOV, ENTG, FZA, LugÜ …).
//
// BEFUND 25.7.2026 (Repro-Versuch VOR Bau, §7): Der FN-4-Defekt («Alt-Form trägt
// absatz=null → Marker auf Artikelebene») ist auf dem KANONISCHEN Korpus NICHT
// mehr reproduzierbar. Die P1-a/b-Kanonik-Re-Pins (11.7.2026) ersetzten die
// Alt-Generations-Aspose-Dumps durch die registrierte isExemplifiedBy-
// Manifestation: dort tragen alle Erlasse Neu-Form-Markup
// (`<p class="absatz "><sup>N</sup>…` + fnbck-Backlinks), das der bestehende
// Absatz-Walk in fussnoten-extrahiere.ts korrekt zuordnet. Korpusweiter Audit
// (227 Bund-Sidecars gegen /tmp-Cache): 0 Fussnoten mit absatz=null, deren
// Marker in einem nummerierten Absatz sitzt; Voll-Regeneration byte-identisch.
//
// Dieser Wächter zementiert den geheilten Zustand am Kronzeugen VZG (Davids
// FN-4-Ausgangsbefund) + KOV (zweites Familien-Mitglied): kippt ein künftiger
// Re-Pin/Extraktor-Drift die Absatz-Zuordnung zurück auf Artikelebene, wird er rot.
import { test, expect } from '@playwright/test'
import { vollerApparat } from './helpers/vollerApparat'

// ── §6.3-DEKLARATION (D35-F3, Entscheid David 7.9.2026) ─────────────────────
// Die Vorgabe der Ansicht ist seither «Fassung», und dort sind die als `kl:'A'`
// klassifizierten Änderungs-Fussnoten samt ihren Markern gedämpft (beim
// Bundesrecht die Mehrheit: ZGB 719 von 809, StPO 187 von 283). Diese Sonde
// prüft die EXTRAKTION, nicht die Ansicht — sie stellt darum den vollen
// Apparat ein. Die geprüfte Aussage ist Wort für Wort unverändert.
test.beforeEach(async ({ page }) => { await vollerApparat(page) })


test('VZG Art. 1: fn 4/5 sitzen im jeweiligen Absatz, fn 3 auf Artikelebene', async ({ page }) => {
  await page.goto('/gesetze/bund/VZG#art-1')
  const art = page.locator('#art-1')
  await expect(art).toBeVisible()
  await art.scrollIntoViewIfNeeded()

  // Abs. 1 («Den Vorschriften dieser Verordnung unterliegen …») trägt fn 4
  // (SR 210-Verweis auf das ZGB — Quelle /tmp/vzg.html, fn-d7e73 in Abs.-<p> 1).
  const abs1 = art.locator('p', { hasText: 'Den Vorschriften dieser Verordnung unterliegen' })
  await expect(abs1).toHaveCount(1)
  await expect(abs1.getByRole('button', { name: 'Fussnote 4' })).toHaveCount(1)

  // Abs. 2 («Für die Verwertung der Eigentumsrechte …») trägt fn 5
  // (SR 281.41-Verweis — Quelle fn-d7e85 in Abs.-<p> 2).
  const abs2 = art.locator('p', { hasText: 'Für die Verwertung der Eigentumsrechte' })
  await expect(abs2).toHaveCount(1)
  await expect(abs2.getByRole('button', { name: 'Fussnote 5' })).toHaveCount(1)

  // fn 3 (Fussnote der Artikel-Überschrift, «Fassung gemäss …») bleibt korrekt
  // auf ARTIKELEBENE (data-fn-marker am Kopf) — §8: ehrliche Artikelebene, wo die
  // Quelle den Marker auf den <h6>-Kopf setzt, nie ein geratener Absatz.
  await expect(abs1.getByRole('button', { name: 'Fussnote 3' })).toHaveCount(0)
  await expect(abs2.getByRole('button', { name: 'Fussnote 3' })).toHaveCount(0)
  await expect(art.locator('[data-fn-marker]').getByRole('button', { name: 'Fussnote 3' })).toHaveCount(1)
})

test('KOV Art. 3: fn 7 sitzt in Abs. 1 (Alt-Form-Familie, zweiter Zeuge)', async ({ page }) => {
  await page.goto('/gesetze/bund/KOV#art-3')
  const art = page.locator('#art-3')
  await expect(art).toBeVisible()
  await art.scrollIntoViewIfNeeded()

  // Abs. 1 («Die in den Artikeln 1 und 2 genannten Bücher …») trägt fn 7
  // (Anhang-Verweis — Quelle /tmp/kov.html, fn-d91139e250 in Abs.-<p> 1).
  const abs1 = art.locator('p', { hasText: 'Die in den Artikeln 1 und 2 genannten' })
  await expect(abs1).toHaveCount(1)
  await expect(abs1.getByRole('button', { name: 'Fussnote 7' })).toHaveCount(1)
  // Abs. 2 trägt KEINE Fussnote — fn 7 darf nicht dorthin oder auf die
  // Artikelebene wandern.
  const abs2 = art.locator('p', { hasText: 'Die Kantone können noch weitere Formulare' })
  await expect(abs2.getByRole('button', { name: 'Fussnote 7' })).toHaveCount(0)
})
