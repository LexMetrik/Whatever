// @shard-gruppe: 6
import { test, expect } from '@playwright/test';

// ─── Klebende Seitenleisten: Abstand unter der Arbeitsleiste (W2·31 Bündel I) ─
//
// Posten 2026-09-30 («`--app-kopf-h` (98) liegt 34 px unter sichtbarer Kopf-
// Unterkante (64)»). BEFUND (gemessen, dist, 375–1920 px × Schriftskala 1 und
// 1.4, sieben Routen): `--app-kopf-h` ist KEINE Näherung, sondern exakt die
// Unterkante der klebenden Arbeitsleiste (`nav[aria-label="Offene Reiter"]`,
// 34 px, deckend, z-leiste) — sie belegt 64–98 px auf JEDER Seite, auch ohne
// Reiter (dann nur papierfarben, darum «unsichtbar», und bewusst reserviert:
// sonst sprängen 34 px beim ersten Reiter, R10-Befund in `Reiterleiste.tsx`).
// Die sichtbare Krone endet bei 64 px, der klebende Anschlag 98 px + 1.5 rem
// Luft ist der richtige: ein Anschlag bei ~88 px würde unter dem deckenden
// Streifen verschwinden. Die Variable bleibt darum unverändert.
//
// GEFUNDEN beim Messen «aller Verwender»: `SachgebietKacheln` (`/rechtsprechung`,
// ab lg) klebte bei `lg:top-20` = 80 px, also 18 px UNTER der Arbeitsleiste
// (Skala 1.4: 112 px gegen 137 px → 25 px verdeckt) — «Alle Sachgebiete» stand
// halb unter dem Streifen. Jetzt `--app-kopf-h` + 1.5 rem wie die anderen zwei.
//
// ZUSICHERUNG mit Unter- UND Obergrenze: die Oberkante der klebenden Leiste
// liegt 1.5 rem (Skala-abhängig: 24 px bzw. 33.6 px) unter der Unterkante der
// Arbeitsleiste, ±2 px. Untergrenze = nicht verdeckt/zu knapp, Obergrenze =
// kein wandernder Anschlag (Variable nicht mehr an die Kopfhöhe gebunden).
// Zusätzlich: `elementFromPoint` an der Leisten-Oberkante trifft die Leiste
// selbst, nicht die Arbeitsleiste.
//
// ROT ZU BEKOMMEN (§6.7, gegen `src/`, nie gegen `dist/`): in
// `components/rechtsprechung/SachgebietKacheln.tsx` den Anschlag auf
// `lg:top-20` zurücksetzen → der Sachgebiete-Test schlägt an der Untergrenze
// fehl (Abstand −18 px statt +24 px). Ebenso `--app-reiter-h` in `index.css`
// auf 0 → die Abstände schrumpfen aller drei Leisten um 34 px.

const SKALA_KEY = 'lexmetrik-schriftskala';

// `breiten`: die Fensterbreiten, bei denen die Leiste ZWEISPALTIG steht (sonst
// klebt nichts). `/suche` ist eine Container-Query (`@[62rem]/suche`) — 62 rem
// wachsen mit der Schriftskala (1.4 → 1389 px), darum dort erst @1920 zweispaltig
// (gemessen); `.kt-einstieg` (Fenster-Breakpoint 1100 px) und `lg:` (1024 px)
// sind px-gebunden. Der Test prüft `position: sticky` mit, eine falsche Liste
// würde also rot, nicht still grün.
const LEISTEN = [
  { name: '/rechner Themenleiste', route: '/rechner', selector: '.kt-einstieg', breiten: { 1: [1280, 1440, 1920], 1.4: [1280, 1440, 1920] } },
  { name: '/suche Facettenspalte', route: '/suche?q=miete', selector: '[data-suche-filter]', breiten: { 1: [1280, 1440, 1920], 1.4: [1920] } },
  { name: '/rechtsprechung Sachgebiete', route: '/rechtsprechung', selector: 'nav[aria-label="Sachgebiete"]', breiten: { 1: [1024, 1280, 1440, 1920], 1.4: [1024, 1280, 1440, 1920] } },
] as const;

for (const skala of [1, 1.4]) {
  for (const leiste of LEISTEN) {
    for (const breite of leiste.breiten[skala as 1 | 1.4]) {
      test(`${leiste.name} @${breite} Skala ${skala}: klebt 1.5 rem unter der Arbeitsleiste, unverdeckt`, async ({ page }) => {
        await page.addInitScript(([key, wert]) => {
          try { window.localStorage.setItem(key, String(wert)); } catch { /* Speicher gesperrt: Standardskala */ }
        }, [SKALA_KEY, skala] as const);
        await page.setViewportSize({ width: breite, height: 900 });
        await page.goto(leiste.route);
        const ziel = page.locator(leiste.selector).first();
        await expect(ziel).toBeVisible();
        await expect(page.locator('nav[aria-label="Offene Reiter"]')).toBeVisible();

        // Weit genug scrollen, dass die Leiste am Anschlag klebt (nicht mehr am Seitenfluss hängt).
        await page.evaluate(() => window.scrollTo(0, 1500));
        await page.waitForTimeout(100);

        const m = await ziel.evaluate((el) => {
          const arbeitsleiste = document.querySelector('nav[aria-label="Offene Reiter"]')!.getBoundingClientRect();
          const rect = el.getBoundingClientRect();
          // Punkt knapp unter der Oberkante der Leiste, mittig: wer hier oben liegt?
          const treffer = document.elementFromPoint(rect.left + Math.min(40, rect.width / 2), rect.top + 2);
          return {
            position: getComputedStyle(el).position,
            abstand: rect.top - arbeitsleiste.bottom,
            arbeitsleisteUnten: arbeitsleiste.bottom,
            wurzelPx: parseFloat(getComputedStyle(document.documentElement).fontSize),
            verdeckt: !(treffer && (el === treffer || el.contains(treffer))),
            trefferInArbeitsleiste: !!treffer?.closest('nav[aria-label="Offene Reiter"]'),
          };
        });
        expect(m.position, 'Leiste steht zweispaltig und klebt').toBe('sticky');
        const erwartet = 1.5 * m.wurzelPx; // Luft aus `--app-kopf-h` + 1.5rem
        expect(m.abstand, `Abstand unter der Arbeitsleiste (Untergrenze), Arbeitsleiste endet bei ${m.arbeitsleisteUnten}`).toBeGreaterThanOrEqual(erwartet - 2);
        expect(m.abstand, 'Abstand unter der Arbeitsleiste (Obergrenze)').toBeLessThanOrEqual(erwartet + 2);
        expect(m.trefferInArbeitsleiste, 'Leisten-Oberkante liegt unter der Arbeitsleiste').toBe(false);
        expect(m.verdeckt, 'Leisten-Oberkante ist unverdeckt').toBe(false);
      });
    }
  }
}
