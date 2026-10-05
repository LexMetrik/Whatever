// @shard-gruppe: 4
import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { LESER_SUCHFELD_NAME } from './helpers/leserBeschriftung';
import { OR_LESER_FRIST } from './helpers/orLeser';

// Visuelle + funktionale Verifikation der 9 Gesetze-UX-Punkte (Auftrag David
// 26.6.2026). Screenshots landen unter test-results/ux9/ zur Sichtprüfung.
// WICHTIG: relativer Pfad (test-results/ ist gitignored) — KEIN absoluter,
// maschinenlokaler Scratchpad-Pfad. Ein solcher (aus einer früheren Session
// hart einkopiert) existiert auf dem CI-Runner nicht → ENOENT brach die Browser-
// Smoke-Stufe. mkdirSync stellt das Zielverzeichnis auf jeder Maschine sicher.
const SHOT = 'test-results/ux9';
mkdirSync(SHOT, { recursive: true });

test.describe('Gesetze-UX 9 Punkte', () => {
  // Test-Stabilität (QS-PH, §6.3 — KEINE Substanz-Änderung, Behauptungen identisch):
  // Diese Spec fährt ausnahmslos die schwerste Leser-Seite (/gesetze/bund/OR:
  // OR.json ~1.9 MB → ~1700 Artikel). Die Detailseite liefert nur PRERENDERTES
  // Volltext-HTML (erlassVolltextHtml: <article> OHNE id="art-1", OHNE Klapp-Knopf);
  // React ersetzt es clientseitig NACH dem Fetch+Parse (render-then-replace, §15.5,
  // kein hydrateRoot). #art-1, der Artikel-Klappknopf und die Reiter-
  // Registrierung entstehen also erst nach dem Client-Takeover. Die auto-wartenden
  // Locators (locator.click ohne actionTimeout → an das TEST-Timeout gebunden)
  // warten korrekt genau darauf. Auf dem 1-Kern-CI-Runner (workers:1) übersteigt die
  // KUMULATIVE Zeit (Screenshot-Test lädt OR zweimal: goto + reload; Interaktions-
  // Tests: schwerer Load + Client-Render + Klick) das Default-Budget von 30 s →
  // «Test timeout of 30000ms exceeded» (PR #90/#93/#94). Lokal < 1 s, 0 Konsolen-
  // fehler → reine Timing-Contention, kein Code-Defekt. Die anderen Flake-Schichten
  // stehen bereits (playwright.config: workers:1, retries:2, expect.timeout:10 s);
  // die individuellen 10-s-Web-First-Assertions bestehen (sonst läse der Fehler
  // «Timeout 10000ms»), es bindet allein das WHOLE-TEST-Budget. Darum hier — und nur
  // hier, spec-lokal — das Per-Test-Budget grosszügig auf 90 s heben; das lässt die
  // bereits vorhandenen, semantisch korrekten Auto-Waits fertiglaufen. Greift nur bei
  // Überschreitung, verlangsamt grüne Tests nicht. Assertions unverändert (§6.3).
  //
  // RUNNER-ROBUSTHEIT 3.8.2026 — 90 s → 150 s. Belegt: «Screenshots Desktop hell +
  // dunkel» riss im Lauf 30836806866 (Shard 2/8) mit «page.screenshot: Test timeout
  // of 90000ms exceeded» an Zeile 122 (dem zweiten Screenshot, nach emulateMedia +
  // reload), auf einem PR-Stand ohne jede src/-Änderung; der Rerun lief grün. Der
  // Runner-Pool ist an diesem Tag messbar langsamer geworden (Perf-Kalibrierlauf
  // 30830332128: OR-TBT-Mittel 4489 → 5290 ms gegenüber Juli, +17.8 %) — dieser Test
  // lädt OR ZWEIMAL (goto + reload) und trifft die Verlangsamung doppelt.
  // DEKLARIERTE TEST-INFRASTRUKTUR-ÄNDERUNG, kein Refactoring i. S. v. §6.3: Diese
  // Tests prüfen FUNKTIONALITÄT, nicht Tempo. Tempo prüft das §15-Perf-Budget
  // (check:perf-lighthouse) — ein Timeout, der langsame Runner bestraft, misst den
  // Runner, nicht die Software. Keine Assertion und kein Prüfschritt berührt.
  test.describe.configure({ timeout: 150_000 });

  test('P4: Gliederung/Randtitel steht VOR der Artikelnummer (Fedlex-Reihenfolge)', async ({ page }) => {
    await page.goto('/gesetze/bund/OR');
    await expect(page.locator('#art-1')).toBeVisible({ timeout: OR_LESER_FRIST });
    // §6.3-Anpassung 29.6.2026 (B1-Modell, Verhalten verifiziert): Der Randtitel
    // ist seit B1 ein eigener Gliederungs-Sektionskopf ([data-sek], Fedlex-analog)
    // und steht in DOKUMENT-Reihenfolge VOR der Artikelnummer — nicht mehr als
    // Marginalie INNERHALB von #art-1. Geprüft: der «Im Allgemeinen»-Sektionskopf
    // existiert und kommt vor #art-1.
    const ord = await page.evaluate(() => {
      const knoten = [...document.querySelectorAll('[data-sek], [id^="art-"]')];
      const sek = [...document.querySelectorAll('[data-sek]')].find((s) => {
        const c = s.cloneNode(true) as HTMLElement;
        c.querySelectorAll('[data-sek], [id^="art-"]').forEach((x) => x.remove());
        return /Im Allgemeinen/.test(c.textContent ?? '');
      });
      const art1 = document.getElementById('art-1');
      if (!sek || !art1) return { found: false, before: false };
      return { found: true, before: knoten.indexOf(sek) < knoten.indexOf(art1) };
    });
    expect(ord.found, '«Im Allgemeinen» als Sektionskopf vorhanden').toBe(true);
    expect(ord.before, 'Sektionskopf steht vor #art-1').toBe(true);
  });

  test('Einklappen analog Fedlex: Artikel-Body klappt zu, Nummer bleibt; Randtitel-Sektionskopf bleibt', async ({ page }) => {
    await page.goto('/gesetze/bund/OR');
    const art = page.locator('#art-1');
    await expect(art).toContainText('Willensäusserung', { timeout: OR_LESER_FRIST }); // Body sichtbar
    // §6.3-ANPASSUNG 5.9.2026 (deklarierte fachliche Änderung, QS-UI
    // Folgeschritt): der Klapp-Knopf hiess zustandsabhängig «Artikel
    // einklappen» / «Artikel ausklappen» — zwölf wortgleiche Namen auf
    // /gesetze/bund/GEBV_HREG, 1598 auf dem OR, und der Name wechselte beim
    // Klick (WCAG 4.1.2, Tor ARIA_ZUSTANDSNAME). Er heisst jetzt konstant
    // «‹Art. N› auf- und zuklappen»; den Zustand trägt `aria-expanded`.
    // Das deterministische Umschalt-Signal, auf das diese Spec wartet, ist
    // damit NICHT verloren, sondern präziser: statt auf einen Namenswechsel
    // wartet sie auf `expanded` — dieselbe Wartebedingung, an der richtigen
    // Stelle. Die Sache der Spec (Body klappt zu, Nummer bleibt, Randtitel
    // bleibt) ist unverändert.
    const klapp = art.getByRole('button', { name: '«Art. 1» auf- und zuklappen' });
    await expect(klapp, 'Vorbedingung: Artikel ist aufgeklappt').toHaveAttribute('aria-expanded', 'true');
    await klapp.click();
    // Erst auf das Umschalt-Signal warten (`aria-expanded=false`), DANN den Body
    // prüfen — sonst rennt die Assertion auf langsamen CI-Runnern gegen die noch
    // laufende Einklapp-Umschaltung (Flake).
    await expect(klapp).toHaveAttribute('aria-expanded', 'false');
    // Body weg, Artikelnummer bleibt. §6.3-Anpassung 29.6.2026: Der Randtitel
    // «Im Allgemeinen» ist seit B1 ein eigener Sektionskopf AUSSERHALB des Artikels
    // (immer sichtbar) — daher auf Seitenebene geprüft, nicht mehr innerhalb #art-1.
    await expect(art.getByText('Willensäusserung')).toHaveCount(0);
    await expect(art.getByText('Art. 1')).toBeVisible();
    await expect(page.getByText('Im Allgemeinen', { exact: false }).first()).toBeVisible();
    // Wieder aufklappen — ebenso erst auf das Umschalt-Signal warten.
    await klapp.click();
    await expect(klapp).toHaveAttribute('aria-expanded', 'true');
    await expect(art).toContainText('Willensäusserung');
  });

  test('P9: Gliederung markiert aktive Sektion beim Scrollen (Scroll-Spy)', async ({ page }) => {
    await page.goto('/gesetze/bund/OR');
    await expect(page.locator('#art-1')).toBeVisible({ timeout: OR_LESER_FRIST });
    // Tief scrollen → ein aktiver TOC-Eintrag muss existieren.
    await page.evaluate(() => window.scrollTo(0, 2500));
    await page.waitForTimeout(400);
    await expect(page.locator('[data-toc-aktiv]').first()).toBeVisible();
  });

  // ── §6.3-DEKLARATION 6.9.2026 (W2·24 R2/R11 · D19) ─────────────────────────
  // GEGENSTAND UNVERÄNDERT: die Übersicht ALLER offenen Reiter steht in der
  // Kopfzone und ist gruppiert — Kategorie «Gesetze», darunter die Herkunft
  // «Bund» (`lib/tabGruppen`). GEÄNDERT ist der WEG dorthin: das Reiter-Dropdown
  // der alten Topbar ist der Arbeitsleiste gewichen (`layout/Reiterleiste.tsx`).
  // Ihr Blatt-Auslöser heisst jetzt konstant «Alle N offenen Reiter» (die Zahl
  // gehört zum Namen) und erscheint erst, wenn es etwas zu überlaufen gibt
  // (Desktop: `ueberlaufZahl > 0`; schmale Ansicht ab drei Reitern). Zwei
  // geöffnete Gesetze reichten dafür nicht mehr — der Fall lief 150 s in den
  // Timeout, weil er auf einen Knopf wartete, den es bei zwei Reitern nicht
  // gibt. Der Wächter stellt die Bedingung darum selbst her (Reiter-Speicher
  // seeden, Muster aus `a11y.e2e.ts` / `w224-r11-reiterleiste.e2e.ts`).
  // ROT ZU BEKOMMEN (§6.7): in `lib/tabGruppen.reiterKategorie` das
  // `gesetze`-Präfix streichen ⇒ die Bund-Erlasse landen unter «Weitere» und
  // die beiden Gruppen-Überschriften fehlen.
  test('P3/B: Reiter-Übersicht im Header, gruppiert (Gesetze→Bund)', async ({ page }) => {
    // Startroute nur als Herkunft für `localStorage`: was hier gesetzt wird,
    // überschreibt sie. (Bis R14b trug `/kontakt` selbst keinen Reiter; seit
    // R14b trägt jede Route einen — für diesen Fall ohne Belang, weil das Ziel
    // `/gesetze/bund/ZGB` bereits im Seed steht und die Zahl im Knopfnamen
    // ohnehin als `\d+` gelesen wird.)
    await page.goto('/kontakt');
    await page.evaluate(() => {
      try {
        localStorage.setItem('lexmetrik-tabs', JSON.stringify(
          ['OR', 'ZGB', 'StGB', 'ZPO', 'StPO', 'SchKG', 'BV', 'DSG', 'URG']
            .map((k) => ({ path: `/gesetze/bund/${k}` }))));
      } catch { /* privater Modus */ }
    });
    await page.goto('/gesetze/bund/ZGB');
    await expect(page.locator('article').first()).toBeVisible();
    // Übersicht aus der KOPFZONE öffnen (Arbeitsleiste → Blatt).
    const ausloeser = page.getByRole('button', { name: /Alle \d+ offenen Reiter/ });
    await ausloeser.click();
    const dialog = page.getByRole('dialog', { name: 'Alle geöffneten Reiter' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Gesetze', { exact: true })).toBeVisible();
    await expect(dialog.getByText('Bund', { exact: true })).toBeVisible();
    await page.screenshot({ path: `${SHOT}/p3-panel-header.png` });
  });

  test('Such-Bug: Suchleiste bleibt nach Aktivieren im Bild (nicht nach oben raus)', async ({ page }) => {
    await page.goto('/gesetze/bund/OR');
    await expect(page.locator('#art-1')).toBeVisible({ timeout: OR_LESER_FRIST });
    // Tief scrollen, dann suchen → vor dem Fix rutschte der sticky-Container raus.
    await page.evaluate(() => window.scrollTo(0, 4000));
    await page.waitForTimeout(150);
    const suche = page.getByRole('searchbox', { name: LESER_SUCHFELD_NAME });
    await suche.fill('Vertrag');
    await page.waitForTimeout(300);
    await expect(suche).toBeInViewport();
  });

  test('Screenshots Desktop hell + dunkel', async ({ page }) => {
    await page.goto('/gesetze/bund/OR');
    await expect(page.locator('#art-1')).toBeVisible({ timeout: OR_LESER_FRIST });
    // Screenshot-Budget explizit auf 60 s (Playwright-Default 30 s). Auf dem
    // langsamen Runner wartet `page.screenshot` auf einen stabilen Frame der
    // ~930-KB-OR-Seite; bisher band das 90-s-TEST-Budget vorher (Beleg oben), mit
    // 150 s käme der 30-s-Default als nächste Kante. Reine Zeitbudget-Zahl.
    await page.screenshot({ path: `${SHOT}/leser-desktop-hell.png`, fullPage: false, timeout: 60_000 });
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.reload();
    await expect(page.locator('#art-1')).toBeVisible({ timeout: OR_LESER_FRIST });
    await page.screenshot({ path: `${SHOT}/leser-desktop-dunkel.png`, fullPage: false, timeout: 60_000 });
  });

  test('C: aktueller Artikel wird bei KANTONALEM Gesetz verfolgt (Reiter-Anker)', async ({ page }) => {
    await page.goto('/gesetze/kanton/BS-640.100');
    await expect(page.locator('article').first()).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 3000));
    await page.waitForTimeout(600);
    // Der geteilte Observer muss den Reiter-Pfad in localStorage mit #art-… aktualisiert haben.
    const hatAnker = await page.evaluate(() => {
      const roh = localStorage.getItem('lexmetrik-tabs');
      if (!roh) return false;
      const tabs = JSON.parse(roh) as Array<{ path: string }>;
      return tabs.some((t) => t.path.includes('/gesetze/kanton/BS-640.100') && t.path.includes('#art-'));
    });
    expect(hatAnker).toBe(true);
  });

  test('H: Absatzmarker 2bis/2ter verschieben den Text nicht (ZGB Art. 61)', async ({ page }) => {
    await page.goto('/gesetze/bund/ZGB#art-61');
    await expect(page.locator('#art-61')).toBeVisible();
    await page.waitForTimeout(300);
    await page.locator('#art-61').screenshot({ path: `${SHOT}/h-zgb-art61.png` });
  });

  test('Screenshot Mobil', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/gesetze/bund/OR');
    await expect(page.locator('#art-1')).toBeVisible({ timeout: OR_LESER_FRIST });
    await page.screenshot({ path: `${SHOT}/leser-mobil-hell.png`, fullPage: false });
  });
});
