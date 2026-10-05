// @shard-gruppe: 6
import { test, expect, type Page } from '@playwright/test';
import { warteLeserBereit } from './helpers/leserBereit';

// W2·5d G3a — Per-Grundart-Darstellung im Gesetzes-Reader (FAHRPLAN §2.2):
// erlassTyp-Kopf-Label, KANTON §-Label (⑥, Anker bleibt #art-/R8),
// LIVE_VERWEIS-Verweiskarte (⑧). Der frühere aufbau-abhängige Linien-Default
// (U-LINIEN/A8, `data-guide-auto`) ist mit dem Linien-Rückbau V1 (16.8.2026,
// Entscheid David 13.8.2026) ersatzlos entfallen — die beiden A28-Fälle hier
// prüften genau ihn und sind mit ihm gestrichen (§6.3: deklariert).
// Reine Darstellung (§3) — die Grundart kommt zur Laufzeit aus dem Register
// (SSoT, §5), NICHT aus der BrowseErlass. Reader = prerendertes Crawler-HTML →
// auf den Client-Takeover warten, bevor geprüft wird.
//
// ── H4-UMHÄNGUNG (Flip 18.8.2026, Kontaktbogen H4 §7) ───────────────────────
// Diese Datei war eine B-Spec: sie fasste den Erlass-Kopf über `.lc-leser >
// header` — ein DIREKTES Kind. Beide Hüllen rendern denselben `<header>`
// (`parts/ErlassLeserKopf.tsx`, §5), aber V3 hängt ihn eine Zone tiefer
// (`v3/LeserErlassKopfZone`). Gemessen 18.8.2026 an BV @1440: `.lc-leser >
// header` = 0 in V3 / 1 in V1, `.lc-leser header` = 1 in BEIDEN. Der Selektor
// wandert deshalb auf den Nachfahren-Ausdruck; die geprüfte AUSSAGE ist
// unverändert (Overline, Zähl-Substantiv, Kopf-Etikett), kein Timeout, keine
// Assertion gelockert (§6.3). Damit ist die Datei wieder paritätsfähig und
// steht seit H4 in `N_SPECS` — sie läuft in BEIDEN Hüllen.
//
// `warteReader` fasste den Öffner über Rolle+Name; das ist die teure Abfrage aus
// der Ä24-Forensik und läuft jetzt über die EINE Bereitschafts-Wartung
// (`helpers/leserBereit`, §5), die den hüllenrichtigen Öffner kennt. Der
// ZUGÄNGLICHE NAME des Öffners bleibt in `leser-kopf-a9` und `leser-kopf-g2b`
// geprüft — er geht hier nicht verloren.
//
// `warteKopf` (nur der DSGVO-Fall) trug `'.lc-leser > header, header'`. Der
// Fallback war dort das EINZIGE, was je griff: die LIVE_VERWEIS-Karte hat gar
// keinen Leser — gemessen 18.8.2026 an DSGVO, in BEIDEN Hüllen `.lc-leser` = 0,
// `<header>` im Leser = 0. Gewartet wurde also auf den globalen Topbar-Header,
// der schon steht, bevor die Karte gerendert ist: eine Wartung, die nicht
// scheitern kann (§6.7). Sie fasst jetzt die Karte selbst über ihre `<h1>`.
const KOPF = '.lc-leser header';

async function warteVerweiskarte(page: Page, url: string): Promise<void> {
  await page.goto(url);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 20000 });
}
async function warteReader(page: Page, url: string): Promise<void> {
  await page.goto(url);
  await warteLeserBereit(page);
}

// ── erlassTyp-Kopf-Label (§5.1, behebt «Verordnung als Bundesgesetz») ──────────
test('Kopf-Label: Verordnung wird als «Verordnung» betitelt, nicht «Bundesgesetz» (VMWG)', async ({ page }) => {
  await warteReader(page, '/gesetze/bund/VMWG');
  const header = page.locator(KOPF);
  const overline = header.locator('.lc-overline').first();
  await expect(overline).toContainText('Verordnung');
  await expect(overline).not.toContainText('Bundesgesetz');
});

// CI-Härtung (§194-Muster, QS-PERF): der 935-KB/1686-Artikel-OR starvte den
// gedrosselten 2-Kern-Runner nahe an die 20-s-warteReader-Latte (16–19 s lokal
// unter Contention). Die Kopf-Label-Semantik («Bundesgesetz» für grundart GESETZ)
// ist seitengrössen-unabhängig → Umzug auf das kleine ELG (~50 KB), ebenfalls ein
// Bundesgesetz. Linien-Kanon Teil B (OR-Gate) ist seit dem Rückbau 16.8.2026 gestrichen.
test('Kopf-Label: Gesetz bleibt «Bundesgesetz» (ELG)', async ({ page }) => {
  await warteReader(page, '/gesetze/bund/ELG');
  await expect(page.locator(`${KOPF} .lc-overline`).first()).toContainText('Bundesgesetz');
});

// ── ⑥ KANTON §-Label: sichtbares «§ N», Anker bleibt #art- (R8) ────────────────
test('KANTON §-Label: Body zeigt «§», Kopf zählt «Paragraphen», Anker bleibt #art- (AG-291.150)', async ({ page }) => {
  await warteReader(page, '/gesetze/kanton/AG-291.150');
  await expect(page.locator('.lc-leser')).toHaveAttribute('data-grundart', 'KANTON');
  // Sichtbares Bestimmungs-Label beginnt mit «§» (aus dem amtlichen Snapshot).
  const artLink = page.locator('.lc-leser article[id^="art-"] a.num[href^="#art-"]').first();
  await expect(artLink).toContainText('§');
  // KRITISCH (R8): der Anker-id bleibt art-<token> (opak), NIE par-.
  const ersteArt = page.locator('.lc-leser article[id^="art-"]').first();
  const id = await ersteArt.getAttribute('id');
  expect(id).toMatch(/^art-/);
  // Kopf-Zähl-Substantiv «Paragraphen» statt «Artikel».
  await expect(page.locator(KOPF).getByText(/\d+\s+Paragraphen/)).toBeVisible();
});

// ── ⑧ LIVE_VERWEIS: ehrliche Verweiskarte statt Fehlerseite (DSGVO) ────────────
test('LIVE_VERWEIS: Verweiskarte mit amtlichem Live-Link + ehrlichem Hinweis, keine Fehlerseite (DSGVO)', async ({ page }) => {
  await warteVerweiskarte(page, '/gesetze/international/DSGVO');
  // Ehrlicher §8-Hinweis + prominenter amtlicher Link; KEINE «nicht verfügbar»-Fehlerseite.
  await expect(page.getByText(/nicht als In-App-Volltext gehostet/i)).toBeVisible();
  // R2-A (31.8.2026, deklarierter Nachzug): der Link der Verweiskarte trug den
  // Eigen-Wortlaut «↗ Amtliche Fassung öffnen» (Pfeil vorne) und läuft seit
  // B-1 über `ui/QuellLink` — Kanon-Name «Amtliche Fassung ↗» (Ä110). Die
  // Sonde greift jetzt IN die Verweiskarte (`data-verweiskarte`): der Fuss-Nav
  // derselben Ansicht führt denselben kanonischen Link ein zweites Mal, ein
  // seitenweiter `getByRole` wäre seither mehrdeutig.
  await expect(page.locator('[data-verweiskarte]')
    .getByRole('link', { name: 'Amtliche Fassung ↗' })).toBeVisible();
  await expect(page.getByText(/nicht als Volltext verfügbar/i)).toHaveCount(0);
});
