// @shard-gruppe: nacht
import { test, expect, type Page } from '@playwright/test';

// ─── Startseite auf Stufe `weit` (W2·31-BILDSCHIRMBREITE, 25.9.2026) ─────────
//
// Entscheid David 25.9.2026 «ja das soll optimiert werden» (Posten
// `2026-09-24-startseite-ab-1280-…`): die Startseite steht in `SEITENBREITE`
// auf `weit`. Den RAHMEN (1440 px ab 2xl, Footer-Flucht, Lesemass der
// Fliesstexte) prüft `e2e/seitenbreite.e2e.ts`. Was die Breite NUTZT, prüft
// nur dieser Wächter (Idee aus dem abgelegten Entwurf
// `archiv/w2-29-werkbank-rest-breite-voll-2026-09-25`, auf B1 übertragen):
//  (1) Die Kachelspalte wächst: @1920 Kachel ≥ 480 px (gemessen 508), die
//      Spalte rechts bleibt 320 px; @1440 unverändert 348 px.
//  (2) «Häufig gebraucht» ab 52rem Flächenbreite dreispaltig — nur auf dem
//      `weit`-Rahmen; @1440 und @1536 mit offener Seitenleiste zwei Spalten,
//      @390 eine.
//  (3) U13 GILT AUCH BREITER: `e2e/startseite-blatt.e2e.ts` prüft «kein
//      Scroll beim Aufklappen» nur @1440×900/@1280×800 (Prämisse dort: ab 1280
//      gleiche Breite — seit `weit` nicht mehr wahr). Hier @1536×864 (kleinste
//      2xl-Höhe), @1680×1050, @1920×1080 und @1536 mit Seitenleiste: jedes
//      Blatt ganz im Fenster, Seite unverschoben; Gesetze- und Werkzeuge-Wahl
//      ohne Überlauf (Rechtsprechung/Materialien tragen Listen, die im Blatt
//      scrollen dürfen — Auftrag U13).
//  (4) Nichts läuft bei mehr Breite auf eine unlesbare Länge aus: Kachel-
//      texte, «Häufig gebraucht» und die offenen Blätter Gesetze/Werkzeuge
//      höchstens 80 Zeichen je Zeile (wortgenau, Methode wie seitenbreite);
//      der Gruss (h1) bleibt ≤ 40rem.
//  (3b) W2·31 P15 (1.10.2026): dazu die Zellen @1280×800 und @1440×900 mit
//      Seitenleiste 460 (Standardschrift). Rot vorher: @1280 Gesetze-Blatt
//      Unterkante 915 > 800, @1440 Gesetze-Wahl 88 px Überlauf. Rot-Proben
//      nach dem Fix: `lg:@[936px]/start:grid-cols-…` (P15: `@[960px]/start:`) zurück auf
//      `lg:grid-cols-…` → @1280 rot (Unterkante 915) und @1440 rot (Überlauf 88);
//      `lg:max-w-[15.5rem]` der Kantone-Karte in GesetzeBlatt.tsx zurück auf
//      `lg:max-w-none 2xl:max-w-[15.5rem]` → nur @1440 rot (Überlauf 10 px).
//      Beide gemessen 1.10.2026 gegen den Quellcode (Probe-Logs `.gate/p15-probe*.log`).
//  (3c) W2·31 P15b (1.10.2026): Zellen (2b) «ohne Seitenleiste wie main». Rot-Probe
//      gegen den Quellcode: `lg:@[936px]/start:` in Startseite.tsx zurück auf
//      `@[960px]/start:` (Stand 75c0a5de3) → 2 von 4 Zellen rot: @1016 Skala 1
//      (erwartet 1 Spalte, gemessen 2) und @1024 Skala 1.4 (erwartet 2, gemessen 1);
//      Log `.gate/p15b-rot-probe.log`.
// ROT ZU BEKOMMEN (§6.7, Beweis im Commit):
//  (1) `startseite` in seitenbreite.ts zurück auf `content` → Kachel 348 px.
//  (2) `@[52rem]:grid-cols-3` in HaeufigGebraucht.tsx streichen → 2 Spalten.
//  (3) `2xl:max-w-[15.5rem]` an der Kantone-Karte (GesetzeBlatt.tsx)
//      streichen → Gesetze-Wahl läuft ab 2xl über.

const LEISTE = 460;

async function mitLeiste(page: Page, breite: number) {
  await page.addInitScript((b) => {
    localStorage.setItem('lexmetrik-seitenleiste-eingeklappt.v2', '0');
    localStorage.setItem('lexmetrik-seitenleiste-breite', String(b));
  }, breite);
}

async function start(page: Page, breite: number, hoehe: number, pfad = '/') {
  await page.setViewportSize({ width: breite, height: hoehe });
  await page.goto(pfad);
  await expect(page.locator('.lc-start-zelle').first()).toBeVisible();
}

/** Längste sichtbare Zeile (Zeichen) in den Elementen des Selektors —
 *  wortgenau: Wort-Rects nach Zeilen-y gruppiert. */
async function laengsteZeile(page: Page, selektor: string): Promise<{ ch: number; text: string }> {
  return page.evaluate((sel) => {
    let best = { ch: 0, text: '' };
    document.querySelectorAll(sel).forEach((el) => {
      const zeilen = new Map<number, string>();
      const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let n: Node | null;
      while ((n = w.nextNode())) {
        const t = (n as Text).data;
        const re = /\S+/g;
        let m: RegExpExecArray | null;
        while ((m = re.exec(t))) {
          const r = document.createRange();
          r.setStart(n, m.index);
          r.setEnd(n, m.index + m[0].length);
          const rc = r.getClientRects()[0];
          if (!rc || !rc.width) continue;
          const y = Math.round(rc.top / 4);
          zeilen.set(y, `${zeilen.get(y) ?? ''}${m[0]} `);
        }
      }
      for (const z of zeilen.values()) if (z.trim().length > best.ch) best = { ch: z.trim().length, text: z.trim() };
    });
    return best;
  }, selektor);
}

const HAEUFIG = 'ul:has(> li > a.lc-menu-zeile)';

test.describe('Startseite · Stufe weit (W2·31-BILDSCHIRMBREITE)', () => {
  for (const [breite, kachelMin, kachelMax] of [[1920, 480, 9999], [1440, 347, 349]] as const) {
    test(`(1) @${breite}: Kachel ${kachelMin > 400 ? '≥ 480 px' : '348 px'}, Spalte rechts 320 px`, async ({ page }) => {
      await start(page, breite, 1000);
      const m = await page.evaluate(() => ({
        kachel: Math.round(document.querySelector('.lc-start-zelle')!.getBoundingClientRect().width),
        aside: Math.round(document.querySelector('aside[aria-label="Arbeitsplatz"]')!.getBoundingClientRect().width),
      }));
      expect(m.kachel, JSON.stringify(m)).toBeGreaterThanOrEqual(kachelMin);
      expect(m.kachel, JSON.stringify(m)).toBeLessThanOrEqual(kachelMax);
      expect(m.aside).toBe(320);
    });
  }

  // W2·31 G (26.9.2026, Posten «Kachelinneres 508×280 recht leer, v. a.
  // Rechtsprechung»): die Rechtsprechungs-Kachel zeigt ihre Teile-Zeile
  // («Leitentscheide») erst ab 1536 px — darunter bleibt die Kachel
  // UNVERÄNDERT (Bauregel des Bündels): gleiche Höhe (280 px), Zeile
  // unsichtbar. ROT ZU BEKOMMEN: `teileAb2xl` an der Kachel streichen
  // (Zeile zeigt sich schon @1440) oder `hidden`/`2xl:block` in
  // `StartKachelFeld.tsx`s `gesicht()` entfernen.
  // Nachtrag 30.9.2026 (W2·31 J): heute `teileNurBreit` / `@md/kachel:block`.
  for (const [breite, sichtbar] of [[1440, false], [1536, true], [1920, true]] as const) {
    test(`(1b) @${breite}: Rechtsprechung-Teile «Leitentscheide» ${sichtbar ? 'sichtbar' : 'verborgen'}, Zelle 280 px`, async ({ page }) => {
      await start(page, breite, 1000);
      const m = await page.evaluate(() => {
        const zelle = document.querySelectorAll('.lc-start-zelle')[1]!;
        const span = [...zelle.querySelectorAll('span')].find((s) => (s.textContent ?? '').includes('Leitentscheide'));
        const r = span?.getBoundingClientRect();
        return {
          zelleH: Math.round(zelle.getBoundingClientRect().height),
          teileImDom: !!span,
          teileSichtbar: !!r && r.width > 0 && r.height > 0,
        };
      });
      expect(m.zelleH, JSON.stringify(m)).toBe(280);
      expect(m.teileImDom, JSON.stringify(m)).toBe(true);
      expect(m.teileSichtbar, JSON.stringify(m)).toBe(sichtbar);
    });
  }

  // W2·31 J (30.9.2026, Posten «Teile-Zeile `2xl:block` hängt am Viewport»):
  // die Teile-Zeile der Rechtsprechungs-Kachel hängt an der KACHELBREITE
  // (Container `kachel`, Schwelle `@md` = 28 rem), nicht am Fenster. Mit offener
  // Seitenleiste (460 px) ist die Kachel @1536 nur 326 px breit — die Zeile
  // blieb trotzdem sichtbar (`2xl` sieht nur das Fenster); Skala 1.4 schiebt
  // dieselbe Kachel in rem auf 21 rem. Zusicherung mit Unter- UND Obergrenze:
  // sichtbar ⇔ Kachelbreite ≥ 28 rem (am ECHTEN Wurzelmass gerechnet, nicht
  // an einer festen px-Zahl), und sichtbar heisst genau EINE Zeile; die Zelle
  // bleibt 17.5 rem hoch (U13). ROT ZU BEKOMMEN (§6.7): in `StartKachelFeld.tsx`
  // `hidden @md/kachel:block` zurück auf `hidden 2xl:block` — dann bleibt die Zeile
  // @1536 mit Seitenleiste sichtbar (326 px = 20.4 rem) und bei Skala 1.4 @1536.
  const SKALA_KEY = 'lexmetrik-schriftskala'; // useSchriftskala.ts
  for (const { breite, hoehe, leiste, skala, sichtbar } of [
    { breite: 1440, hoehe: 900, leiste: 0, skala: '1', sichtbar: false }, // 348 px = 21.75 rem
    { breite: 1536, hoehe: 864, leiste: 0, skala: '1', sichtbar: true }, // 508 px = 31.75 rem
    { breite: 1536, hoehe: 864, leiste: LEISTE, skala: '1', sichtbar: false }, // 326 px = 20.4 rem (vorher sichtbar)
    { breite: 1920, hoehe: 1080, leiste: LEISTE, skala: '1', sichtbar: true }, // 508 px
    { breite: 1536, hoehe: 864, leiste: 0, skala: '1.4', sichtbar: false }, // 471 px = 21.0 rem
    { breite: 1920, hoehe: 1080, leiste: 0, skala: '1.4', sichtbar: true }, // 663 px = 29.6 rem
    { breite: 1536, hoehe: 864, leiste: LEISTE, skala: '1.4', sichtbar: false }, // 241 px = 10.8 rem (vorher dreizeilig sichtbar)
    { breite: 1750, hoehe: 1000, leiste: 0, skala: '1.4', sichtbar: false }, // 578 px = 25.81 rem (gemessen 30.9.2026) — knapp UNTER der 28-rem-Schwelle; ohne diesen Fall bliebe eine auf 22/24 rem gesenkte Schwelle grün (Nachbesserung Gegenprüfung)
  ]) {
    test(`(1c) @${breite}${leiste ? ` mit Seitenleiste ${leiste} px` : ''} Skala ${skala}: Teile «Leitentscheide» ${sichtbar ? 'sichtbar, eine Zeile' : 'verborgen'} (Kachelbreite ${sichtbar ? '≥' : '<'} 28 rem)`, async ({ page }) => {
      if (leiste) await mitLeiste(page, leiste);
      await page.addInitScript(([k, v]) => { try { localStorage.setItem(k, v); } catch { /* gesperrt */ } }, [SKALA_KEY, skala]);
      await start(page, breite, hoehe);
      const m = await page.evaluate(() => {
        const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
        const zelle = document.querySelectorAll('.lc-start-zelle')[1]!;
        const span = [...zelle.querySelectorAll('span')].find((s) => (s.textContent ?? '').includes('Leitentscheide'))!;
        const r = span.getBoundingClientRect();
        return {
          kachelRem: Math.round(zelle.getBoundingClientRect().width / rem * 100) / 100,
          zelleRem: Math.round(zelle.getBoundingClientRect().height / rem * 100) / 100,
          sichtbar: r.width > 0 && r.height > 0,
          zeilen: r.height > 0 ? Math.round(r.height / parseFloat(getComputedStyle(span).lineHeight)) : 0,
        };
      });
      expect(m.sichtbar, JSON.stringify(m)).toBe(sichtbar);
      expect(m.kachelRem >= 28, `sichtbar ⇔ Kachel ≥ 28 rem (${JSON.stringify(m)})`).toBe(sichtbar);
      if (sichtbar) expect(m.zeilen, `Teile-Zeile einzeilig (${JSON.stringify(m)})`).toBe(1);
      // Die Teile-Zeile darf die Zelle nie über die Mindesthöhe treiben (U13);
      // die schmalste Zelle (241 px, Skala 1.4 mit Seitenleiste) wächst schon
      // ohne sie durch ihren Fliesstext — dort gilt die Zusicherung nicht.
      if (sichtbar) expect(m.zelleRem, `Zelle bleibt 17.5 rem (${JSON.stringify(m)})`).toBe(17.5);
    });
  }

  for (const { breite, leiste, spalten } of [
    { breite: 1920, leiste: 0, spalten: 3 },
    { breite: 1440, leiste: 0, spalten: 2 },
    { breite: 1536, leiste: LEISTE, spalten: 2 },
    { breite: 390, leiste: 0, spalten: 1 },
  ]) {
    test(`(2) @${breite}${leiste ? ` mit Seitenleiste ${leiste} px` : ''}: «Häufig gebraucht» ${spalten}-spaltig`, async ({ page }) => {
      if (leiste) await mitLeiste(page, leiste);
      await start(page, breite, 1000);
      const cols = await page.locator(HAEUFIG).evaluate((ul) => getComputedStyle(ul).gridTemplateColumns.split(' ').length);
      expect(cols).toBe(spalten);
    });
  }

  // W2·31 P15b (1.10.2026, Prüfer-Auflage 1 «ohne Seitenleiste unverändert»):
  // die Zweispaltigkeit (Kachelfeld | Spalte rechts) hängt an Fenster ≥ 1024 UND
  // Startseitenbreite ≥ 936 px. Gemessen vorher (PR-Stand 75c0a5de3, nur 960 px):
  // @1016 Skala 1 zweispaltig mit 296×242-Kacheln (Mischzustand, main: einspaltig
  // 476×220), @1024 Skala 1.4 einspaltig (Container 956.8 px; main: zweispaltig).
  // `spalten` = 2 ⇔ die rechte Spalte steht NEBEN dem Kachelfeld, nicht darunter.
  for (const { breite, leiste, skala, spalten, wie } of [
    { breite: 1016, leiste: 0, skala: '1', spalten: 1, wie: 'einspaltig wie main (kein Mischzustand unter 1024)' },
    { breite: 1024, leiste: 0, skala: '1', spalten: 2, wie: 'zweispaltig wie main' },
    { breite: 1024, leiste: 0, skala: '1.4', spalten: 2, wie: 'zweispaltig wie main (Container 956.8 px)' },
    { breite: 1440, leiste: LEISTE, skala: '1', spalten: 1, wie: 'einspaltig (Container 932 px)' },
  ]) {
    test(`(2b) P15b @${breite}${leiste ? ` mit Seitenleiste ${leiste} px` : ' ohne Seitenleiste'} Skala ${skala}: ${wie}`, async ({ page }) => {
      if (leiste) await mitLeiste(page, leiste);
      if (skala !== '1') await page.addInitScript(([k, v]) => { try { localStorage.setItem(k, v); } catch { /* gesperrt */ } }, ['lexmetrik-schriftskala', skala]);
      await start(page, breite, 900);
      const m = await page.evaluate(() => {
        const aside = document.querySelector('aside[aria-label="Arbeitsplatz"]')!;
        const feld = aside.previousElementSibling!.getBoundingClientRect();
        const a = aside.getBoundingClientRect();
        const z = document.querySelector('.lc-start-zelle')!.getBoundingClientRect();
        return { spalten: a.left >= feld.right - 1 ? 2 : 1, kachel: `${Math.round(z.width)}x${Math.round(z.height)}` };
      });
      expect(m.spalten, JSON.stringify(m)).toBe(spalten);
    });
  }

  // W2·31 J (30.9.2026): U13 bei Schriftskala 1.4. Gemessen @1536×864: Feldkopf
  // 305 px + Blatt 806 px (2 × 17.5 rem × 1.4 + Lücke) = Unterkante 1112 px —
  // das Blatt ist an der Mindesthöhe der Kachel (rem!) gebunden und die Gesetze-
  // Wahl braucht natürlich selbst 743–767 px; vor 1112 px Fensterhöhe hält U13
  // bei 1.4 darum KEINE Bauart ohne Inhaltsverlust (Bericht W2·31 J). Gehalten
  // wird und hier bewacht: ab Fensterhöhe 1200 steht jedes Blatt ganz im Fenster
  // (Obergrenze: Blatt wächst bei 1.4 nie über 1200 − 305 px).
  for (const { breite, hoehe, leiste, skala } of [
    { breite: 1536, hoehe: 864, leiste: 0, skala: '1' },
    { breite: 1680, hoehe: 1050, leiste: 0, skala: '1' },
    { breite: 1920, hoehe: 1080, leiste: 0, skala: '1' },
    { breite: 1536, hoehe: 864, leiste: LEISTE, skala: '1' },
    { breite: 1280, hoehe: 800, leiste: LEISTE, skala: '1' },
    { breite: 1440, hoehe: 900, leiste: LEISTE, skala: '1' },
    { breite: 1100, hoehe: 900, leiste: 208, skala: '1' }, // P17: Werkzeuge-Liste 163 px Überlauf (Fenster < 1280)
    { breite: 1920, hoehe: 1200, leiste: 0, skala: '1.4' },
  ]) {
    test(`(3) U13 @${breite}×${hoehe}${leiste ? ' mit Seitenleiste' : ''}${skala !== '1' ? ` Skala ${skala}` : ''}: alle vier Blätter ganz im Fenster`, async ({ page }) => {
      if (leiste) await mitLeiste(page, leiste);
      if (skala !== '1') await page.addInitScript(([k, v]) => { try { localStorage.setItem(k, v); } catch { /* gesperrt */ } }, [SKALA_KEY, skala]);
      await page.setViewportSize({ width: breite, height: hoehe });
      for (const name of ['Gesetze', 'Rechtsprechung', 'Materialien', 'Werkzeuge']) {
        await page.goto('/');
        await page.getByRole('navigation', { name: 'Bereiche der Sammlung' })
          .getByRole('button', { name: new RegExp(name) }).click();
        await expect(page.locator('#lm-start-blatt')).toHaveAttribute('data-phase', 'offen');
        if (name === 'Gesetze') await expect(page.getByRole('button', { name: 'Alle 26 Kantone' })).toBeVisible();
        if (name === 'Werkzeuge') await expect(page.getByRole('list', { name: 'Vorlagen nach Rechtsgebiet' })).toBeVisible();
        const m = await page.evaluate(() => {
          const i = document.querySelector('.lc-start-blatt-inhalt')!;
          const b = document.querySelector('#lm-start-blatt')!.getBoundingClientRect();
          return { ueber: i.scrollHeight - i.clientHeight, unten: Math.round(b.bottom), vh: innerHeight, sy: Math.round(scrollY) };
        });
        test.info().annotations.push({ type: `U13 ${name} @${breite}×${hoehe}`, description: JSON.stringify(m) });
        expect(m.unten, `${name}: Blatt-Unterkante im Fenster (${JSON.stringify(m)})`).toBeLessThanOrEqual(m.vh);
        expect(m.sy, `${name}: Seite unverschoben`).toBe(0);
        if (name === 'Gesetze' || name === 'Werkzeuge') {
          expect(m.ueber, `${name}-Wahl ohne Überlauf (${JSON.stringify(m)})`).toBeLessThanOrEqual(1);
        }
      }
    });
  }

  // W2·31 P17 (1.10.2026): die Vorlagen-Liste im Werkzeuge-Blatt wählt ihre zwei
  // Unterspalten nach der BLATTBREITE (Container `blatt`, ≥ 44 rem) ODER `xl`
  // (Fenster ≥ 1280), nicht mehr nur nach dem Fenster. Gemessen vorher: Fenster
  // 1100 + Seitenleiste 208 (Blatt 802 px breit) einspaltig, Überlauf 163 px.
  // Die drei «unverändert»-Zellen sichern «ohne Seitenleiste alles wie vorher»
  // (bei Browser-Grundschrift 16 px; kleine Grundschrift 9/12 px wird gewollt
  // zweispaltig, siehe WerkzeugeBlatt.tsx):
  // @1200 Skala 1 (Blatt 670 px = 41.9 rem, der Deckel ohne Seitenleiste) und
  // @1279 Skala 1.2 (739 px = 38.5 rem, das breiteste Blatt unter `xl` in px) bleiben
  // EINspaltig; @1100 + Seitenleiste 460 (Blatt 550 px) ebenso.
  // ROT ZU BEKOMMEN (§6.7, gegen den Quellcode): in `WerkzeugeBlatt.tsx`
  // `lg:@[44rem]/blatt:` streichen → Zelle 1100+208 rot; Schwelle auf `@[38rem]`
  // senken auf 38 rem → die Zellen @1200 (41.9 rem) und @1279 Skala 1.2 (38.5 rem) kippen auf 2 Spalten, rot. Beide Proben gemessen 1.10.2026 (Logs .gate/p17-rot1/2.log).
  for (const { breite, leiste, skala, cols } of [
    { breite: 1100, leiste: 208, skala: '1', cols: 2 },
    { breite: 1100, leiste: LEISTE, skala: '1', cols: 1 },
    { breite: 1200, leiste: 0, skala: '1', cols: 1 },
    { breite: 1279, leiste: 0, skala: '1.2', cols: 1 },
    { breite: 1280, leiste: 0, skala: '1', cols: 2 },
  ]) {
    test(`(3d) P17 @${breite}${leiste ? ` mit Seitenleiste ${leiste} px` : ''} Skala ${skala}: Vorlagen-Liste ${cols}-spaltig`, async ({ page }) => {
      if (leiste) await mitLeiste(page, leiste);
      await page.addInitScript(([k, v]) => { try { localStorage.setItem(k, v); } catch { /* gesperrt */ } }, [SKALA_KEY, skala]);
      await start(page, breite, 900, '/?blatt=werkzeuge');
      await expect(page.locator('#lm-start-blatt')).toHaveAttribute('data-phase', 'offen');
      const liste = page.getByRole('list', { name: 'Vorlagen nach Rechtsgebiet' });
      await expect(liste).toBeVisible();
      const m = await liste.evaluate((ul) => {
        const i = document.querySelector('.lc-start-blatt-inhalt')!;
        const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
        const cs = getComputedStyle(i);
        return {
          spalten: getComputedStyle(ul).columnCount === '2' ? 2 : 1,
          blattRem: Math.round((i.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)) / rem * 10) / 10,
        };
      });
      expect(m.spalten, JSON.stringify(m)).toBe(cols);
    });
  }

  test('(4) @1920: Kacheltexte, «Häufig gebraucht» und Gruss bleiben im Lesemass', async ({ page }) => {
    await start(page, 1920, 1080);
    for (const sel of ['.lc-start-zelle', `${HAEUFIG} li`]) {
      const z = await laengsteZeile(page, sel);
      expect(z.ch, `${sel}: mindestens eine Zeile gemessen`).toBeGreaterThan(0);
      expect(z.ch, `${sel}: «${z.text}»`).toBeLessThanOrEqual(80);
    }
    const h1 = await page.locator('h1').evaluate((e) => e.getBoundingClientRect().width / parseFloat(getComputedStyle(document.documentElement).fontSize));
    expect(h1, 'Gruss ≤ 40rem').toBeLessThanOrEqual(40);
  });

  for (const blatt of ['gesetze', 'werkzeuge']) {
    test(`(4) @1920: offenes Blatt ${blatt} ohne Zeile über 80 Zeichen`, async ({ page }) => {
      await start(page, 1920, 1080, `/?blatt=${blatt}`);
      await expect(page.locator('#lm-start-blatt')).toHaveAttribute('data-phase', 'offen');
      const z = await laengsteZeile(page, '.lc-start-blatt-inhalt li, .lc-start-blatt-inhalt p');
      expect(z.ch, 'mindestens eine Zeile gemessen').toBeGreaterThan(0);
      expect(z.ch, `«${z.text}»`).toBeLessThanOrEqual(80);
    });
  }
});
