// @shard-gruppe: nacht
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

// ─── Sprungziele der schwebenden Marken: nicht unter Krone + Arbeitsleiste ───
//
// Zweiter gemessener Fund desselben Bündels («Sprung auf ein Anker-Ziel»): die
// Marken «↓ Ergebnis» (`ErgebnisSprung`, /rechner/*) und «Vorschau ↓»
// (Vorlagen-Wizard, nur unter md) rufen `scrollIntoView({block:'start'})`. Das
// Ziel `#lc-ergebnis` trug keinen Rand und landete bei y = −0.4…2.4 px (Skala
// 1.4 @768–1920: 137 px Kopf) — die ersten 98/137 px des Ergebnisses unter der
// klebenden Krone und der deckenden Arbeitsleiste. Die Vorlagen-Ziele trugen
// `scroll-mt-24` (96 px): 2 px darunter. Jetzt `.lc-sprungziel` (index.css):
// `--app-kopf-h` + 1 rem.
//
// Untergrenze: Ziel-Oberkante ≥ Arbeitsleisten-Unterkante (nicht verdeckt);
// Obergrenze: ≤ Unterkante + 1 rem + 4 px (nicht zu weit unten geparkt).
// ROT ZU BEKOMMEN (§6.7, gegen `src/`): `.lc-sprungziel` in `index.css` auf
// `scroll-margin-top: 0` setzen → Untergrenze reisst (Ziel bei ≈ 0 px). Gilt auch
// für die Dokumentmappe-Fälle (`.lc-sprungziel` an `Dokumentmappe.tsx` entfernen).

// `breiten` je Schriftskala (wie bei LEISTEN): ein Fall steht nur dort, wo der
// Sprung messbar ist. GEMESSEN (dist): Erbteilung @1920 Skala 1 zeigt das Ziel
// schon im ersten Bild ⇒ die Marke «↓ Ergebnis» verschwindet (useZielSichtbar),
// nichts zu klicken; Dokumentmappe (gmbh-gruendung) @1280 Skala 1 ist die
// Schlussstelle der Seite — Scrollende bei y = 4575, das Ziel kann gar nicht an
// den Kopf rücken (169 px darunter, 160 px hoch), der Fall könnte die
// Untergrenze nie beweisen. Dort also nur Skala 1.4 (Seite länger).
const SPRUNG_ZIELE = [
  { name: '/rechner/erbteilung «↓ Ergebnis»', route: '/rechner/erbteilung', ziel: '#lc-ergebnis', breiten: { 1: [375, 768, 1024, 1280, 1440], 1.4: [375, 768, 1024, 1280, 1440, 1920] } },
  { name: '/vorlagen/arbeitsvertrag «Vorschau ↓»', route: '/vorlagen/arbeitsvertrag', ziel: '#wizard-vorschau', breiten: { 1: [375, 600], 1.4: [375, 600] } },
  // Nachbesserung Gegenprüfung #1163: Dokumentmappe (`Dokumentmappe.tsx`, zwei `lc-sprungziel`-Stellen).
  { name: '/vorlagen/gmbh-gruendung «↓ Dokumente»', route: '/vorlagen/gmbh-gruendung', ziel: '#vorlagen-dokumente', breiten: { 1: [375], 1.4: [375, 1280] } },
] as const;

for (const skala of [1, 1.4]) {
  for (const sprung of SPRUNG_ZIELE) {
    for (const breite of sprung.breiten[skala as 1 | 1.4]) {
      test(`${sprung.name} @${breite} Skala ${skala}: Sprungziel landet unter der Arbeitsleiste, unverdeckt`, async ({ page }) => {
        await page.addInitScript(([key, wert]) => {
          try { window.localStorage.setItem(key, String(wert)); } catch { /* Speicher gesperrt: Standardskala */ }
        }, [SKALA_KEY, skala] as const);
        await page.setViewportSize({ width: breite, height: 900 });
        await page.goto(sprung.route);
        const marke = page.locator('[data-verdikt-sprung]').first();
        await expect(marke).toBeVisible();
        await marke.click();

        const messen = () => page.evaluate((selektor) => {
          const ziel = document.querySelector(selektor)!;
          const arbeitsleiste = document.querySelector('nav[aria-label="Offene Reiter"]')!.getBoundingClientRect();
          return {
            abstand: ziel.getBoundingClientRect().top - arbeitsleiste.bottom,
            wurzelPx: parseFloat(getComputedStyle(document.documentElement).fontSize),
          };
        }, sprung.ziel);
        // Weiches Scrollen ausschwingen lassen: lesen, sobald die Scrollposition
        // dreimal hintereinander (je 150 ms) unverändert ist — feste Wartezeit
        // reicht auf langen Seiten (3000 px weiches Scrollen) unter Last nicht.
        let letzte = -1;
        let ruhig = 0;
        for (let i = 0; i < 80 && ruhig < 3; i++) {
          await page.waitForTimeout(150);
          const y = await page.evaluate(() => window.scrollY);
          ruhig = y === letzte ? ruhig + 1 : 0;
          letzte = y;
        }
        expect(ruhig, 'Scrollen ist zur Ruhe gekommen').toBeGreaterThanOrEqual(3);
        const m = await messen();
        expect(m.abstand, 'Ziel-Oberkante nicht unter der Arbeitsleiste (Untergrenze)').toBeGreaterThanOrEqual(-1);
        expect(m.abstand, 'Ziel-Oberkante nicht weit unter dem Kopf geparkt (Obergrenze)').toBeLessThanOrEqual(m.wurzelPx + 4);
      });
    }
  }
}

// ─── Register-Sprungziele (Anker-Sprung per #hash) — W2·31 Bündel L, 30.9.2026 ─
//
// Nebenfund der Gegenprüfer #1161/#1163: vier Register-Ziele trugen noch
// `scroll-mt-24` (96 px), ein Wert aus der Zeit vor der Arbeitsleiste — die
// Arbeitsleiste reicht bis 98 px (Skala 1.4: 137.2). GEMESSEN (dist, echter Sprung
// `route#hash` über `ScrollZuHash`, 375/768/1280/1920 × Skala 1 und 1.4, je drei Ziele
// pro Seite, 96 Messungen): Ziel-Oberkante −1.5 … −3.3 px UNTER der Unterkante der
// Arbeitsleiste, in JEDER Kombination — die obersten 2–3 px des Rubrikkopfs verdeckt:
//   · `/vorlagen#vorlage-<id>`            `Katalog.tsx`  (Seitenleisten-Vorlagen-Gruppen)
//   · `/materialien#b-<behoerde>`         `Materialien.tsx`
//   · `/gesetze?ebene=bund#sys-<id>`      `gesetze-teile/geteilt.tsx` (Kategorie)
//   · `/gesetze?ebene=international#<id>` `normtext/InternationalRubriken.tsx`
// Jetzt `.lc-sprungziel` (index.css): Abstand 15.5–16.x px (Skala 1 = 1 rem) bzw.
// 22–22.9 px (Skala 1.4 = 1 rem). NICHT umgestellt: `Gesetze.tsx` (Kanton-Abschnitt,
// `scroll-mt-24` ohne `id`) — kein Sprungziel, die Klasse ist dort wirkungslos.
//
// Zusicherung mit Unter- UND Obergrenze: Ziel-Oberkante ≥ Arbeitsleisten-Unterkante
// (nicht verdeckt) und ≤ Unterkante + 1 rem + 4 px (nicht zu weit unten geparkt).
// Gewählt sind nur Ziele, die der Seite nach erreichbar an den Kopf rücken (nicht die
// letzten Abschnitte: `vorlage-vorsorge` @1920 endet die Seite bei 61.7 px Abstand).
// ROT ZU BEKOMMEN (§6.7, gegen `src/`): an EINER der vier Stellen `lc-sprungziel` durch
// `scroll-mt-24` ersetzen → der Fall der Seite schlägt an der Untergrenze an (−2 px).
const REGISTER_ZIELE = [
  { name: '/vorlagen', route: '/vorlagen', ziele: 'main div[id^="vorlage-"]' },
  { name: '/materialien', route: '/materialien', ziele: 'main section[id^="b-"]' },
  { name: '/gesetze?ebene=bund', route: '/gesetze?ebene=bund', ziele: 'main details[id^="sys-"]' },
  { name: '/gesetze?ebene=international', route: '/gesetze?ebene=international', ziele: 'main section[id]' },
] as const;

for (const skala of [1, 1.4]) {
  for (const reg of REGISTER_ZIELE) {
    for (const breite of [375, 1280, 1920]) {
      test(`${reg.name}#Anker @${breite} Skala ${skala}: Register-Sprungziel landet unter der Arbeitsleiste`, async ({ page }) => {
        await page.addInitScript(([key, wert]) => {
          try { window.localStorage.setItem(key, String(wert)); } catch { /* Speicher gesperrt: Standardskala */ }
        }, [SKALA_KEY, skala] as const);
        await page.setViewportSize({ width: breite, height: 900 });
        await page.goto(reg.route);
        await page.locator(reg.ziele).nth(1).waitFor({ state: 'attached' });
        const ids = await page.locator(reg.ziele).evaluateAll((els) => els.slice(0, 2).map((e) => e.id));
        expect(ids.length, 'mindestens zwei Register-Ziele auf der Seite').toBe(2);

        for (const id of ids) {
          // Kaltstart mit #hash = der Seitenleisten-Tieflink: erst auf eine andere Route,
          // damit `ScrollZuHash` den Anker wirklich neu einlöst.
          await page.goto('/');
          await page.goto(`${reg.route}#${id}`);
          await expect(page.locator(`[id="${id}"]`)).toBeAttached();
          // Der Sprung ist gelaufen, wenn die Seite gescrollt hat (alle Ziele liegen > 300 px tief).
          await page.waitForFunction(() => window.scrollY > 50);
          let letzte = -1;
          let ruhig = 0;
          for (let i = 0; i < 40 && ruhig < 3; i++) {
            await page.waitForTimeout(150);
            const y = await page.evaluate(() => window.scrollY);
            ruhig = y === letzte ? ruhig + 1 : 0;
            letzte = y;
          }
          expect(ruhig, 'Scrollen ist zur Ruhe gekommen').toBeGreaterThanOrEqual(3);
          const m = await page.evaluate((zielId) => {
            const ziel = document.getElementById(zielId)!;
            const arbeitsleiste = document.querySelector('nav[aria-label="Offene Reiter"]')!.getBoundingClientRect();
            return {
              abstand: ziel.getBoundingClientRect().top - arbeitsleiste.bottom,
              wurzelPx: parseFloat(getComputedStyle(document.documentElement).fontSize),
            };
          }, id);
          expect(m.abstand, `#${id}: Ziel-Oberkante nicht unter der Arbeitsleiste (Untergrenze), Abstand ${m.abstand.toFixed(1)} px`).toBeGreaterThanOrEqual(0);
          expect(m.abstand, `#${id}: Ziel-Oberkante nicht weit unter dem Kopf geparkt (Obergrenze), Abstand ${m.abstand.toFixed(1)} px`).toBeLessThanOrEqual(m.wurzelPx + 4);
        }
      });
    }
  }
}
