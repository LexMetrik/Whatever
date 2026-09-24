// @shard-gruppe: 6
// ═══ Posten 24.9.2026 · Materialien-Artikelteil im Erlass-Blatt: ehrliche
// Offenlegung der Zuordnungsmethode (§8) ═══════════════════════════════════
//
// Befund Bau W1f (#1045, `blattMaterialien.ts`): der Artikelteil des Reiters
// «Materialien» findet nur Botschaften, die eine Fussnote DIESES Artikels über
// die ELI nennt (`botschaftenZumArtikel`) — z. B. BGBM Art. 2 ohne BBl 2022
// 2651. Diese Session baut NUR die Offenlegung, keine neue Zuordnung: eine
// Hinweiszeile im Artikelteil sagt knapp, wie zugeordnet wird
// (`data-v3-blatt-materialien-hinweis`, `PanelTafeln.tsx`).
//
// ROT ZU BEKOMMEN (§6.7): den bedingten Block um die Hinweiszeile in
// `PanelTafeln.tsx` (`{token && materialien.fertig && matZahl !== 0 && (…)}`)
// entfernen ⇒ diese Spec rot (Zeile fehlt).
import { test, expect } from '@playwright/test';
import { blattFuerArtikel, blattReiter } from './helpers/fassungsRubrik';

test.describe('Blatt «Materialien» am Artikel — Hinweis zur Zuordnung (§8)', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('BGBM Art. 2: Hinweiszeile nennt die Fussnoten-Methode', async ({ page }) => {
    await page.goto('/gesetze/bund/BGBM?leser=v3');
    const art = page.locator('#art-2');
    await expect(art).toBeVisible({ timeout: 20_000 });
    const { page: p, token } = await blattFuerArtikel(art);
    await blattReiter(p, 'materialien');
    const hinweis = p.locator(`[data-v3-blatt-materialien-hinweis="${token}"]`);
    await expect(hinweis).toBeVisible({ timeout: 15_000 });
    await expect(hinweis).toContainText('Nur Botschaften, die eine Fussnote dieses Artikels nennt');
  });
});
