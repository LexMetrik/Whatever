// @shard-gruppe: 3
import { test, expect } from '@playwright/test';
import { OR_LESER_FRIST } from './helpers/orLeser';

// W2·5d U-PDF / A12 — die Download-Aktion lädt das AMTLICHE PDF der gepinnten
// Fassung (Bund: Fedlex-Filestore pdf-a; Kanton: LexWork). Reine Verifikation der
// gebauten Aktion: sie existiert, ist ehrlich beschriftet «Amtliches PDF (Fassung
// vom …)», zeigt auf die amtliche Quelle und ist bedienbar (A9-DoD: <a>, aria,
// Tastaturfokus). Der Reader ersetzt das prerenderte Volltext-HTML clientseitig
// (render-then-replace, §15.5); #art-1 ist das Client-Takeover-Signal.
test.describe('U-PDF · Download = amtliches PDF (A12)', () => {
  test.describe.configure({ timeout: 90_000 });

  test('Bund-Snapshot (OR): Fedlex-Filestore-pdf-a, ehrlich beschriftet, fokussierbar', async ({ page }) => {
    await page.goto('/gesetze/bund/OR');
    // §17-Wurzelfix 12.9.2026 (OR-Leser-e2e-Härtung, Rot-/Grün-Beweis in
    // `helpers/orLeser.ts`): Client-Takeover abwarten, 60-s-Budget statt
    // 10-s-Default.
    await expect(page.locator('#art-1')).toBeVisible({ timeout: OR_LESER_FRIST });
    const pdf = page.getByRole('link', { name: /Amtliches PDF/ }).first();
    await expect(pdf).toBeVisible();
    // Ehrliche «Fassung vom …»-Beschriftung (§8).
    await expect(pdf).toContainText(/Amtliches PDF \(Fassung vom /);
    // Zeigt auf die amtliche Fedlex-Filestore-pdf-a-Datei der gepinnten Fassung.
    const href = await pdf.getAttribute('href');
    expect(href).toMatch(/^https:\/\/fedlex\.data\.admin\.ch\/filestore\/.*\/pdf-a\/.*\.pdf$/);
    expect(href).toContain('cc/27/317_321_377'); // OR-ELI
    expect(href).toContain('20260101'); // gepinnte Konsolidierung
    // A9-DoD: neuer Tab (amtliche Fremd-URL) + aria + Tastaturfokus.
    await expect(pdf).toHaveAttribute('target', '_blank');
    await expect(pdf).toHaveAttribute('aria-label', /Amtliches PDF.*herunterladen/);
    await pdf.focus();
    await expect(pdf).toBeFocused();
  });

  test('Kanton-Snapshot (AG Anwaltstarif): LexWork-PDF derselben Quelle', async ({ page }) => {
    await page.goto('/gesetze/kanton/AG-291.150');
    await expect(page.locator('#art-1')).toBeVisible();
    const pdf = page.getByRole('link', { name: /Amtliches PDF/ }).first();
    await expect(pdf).toBeVisible();
    const href = await pdf.getAttribute('href');
    expect(href).toContain('gesetzessammlungen.ag.ch'); // amtliche Kantonsquelle
    expect(href).toMatch(/pdf_file/);
  });
});
