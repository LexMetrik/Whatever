// @shard-gruppe: 5
// ── W2·24-D35-F1 · DIE FUNKTIONSZEILE AM ARTIKELENDE ────────────────────────
//
// ENTSCHEID David 7.9.2026 (Variante A des D35-Vorschlags), Nachtrag wörtlich:
// «das alles soll dann nur auf klick aufklappbar sein».
//
// VIER ZUSAGEN, je einzeln messbar:
//  (a) ZU BEIM LADEN. Keine Rubrik steht offen — auch dann nicht, wenn der
//      alte Merker `lm.leser.bezuege-offen` im Speicher liegt. Er ist ersatzlos
//      gelöscht; läge er noch, wäre «nur auf klick» nur eine Absicht.
//  (b) JE RUBRIK EIN GRIFF. Ein Klick öffnet GENAU seine Rubrik, keine zweite.
//      Bis D34 öffnete EIN `<details>` alle vier zugleich.
//  (c) ZÄHLER = LISTE. Die Zahl auf dem Griff ist die Länge dessen, was er
//      aufklappt (§8) — hier an der Rubrik «Verweise» gemessen, die ohne jeden
//      Shard auskommt und darum eine harte, nicht wartende Gleichung ist.
//  (d) AKTIONEN OHNE HOVER. «Zitat · Link · Amtliche Fassung ↗» stehen in der
//      Zeile mit Deckkraft 1 und WCAG-2.5.8-Höhe, ohne dass die Maus etwas
//      berührt — und sie stehen dort GENAU EINMAL: die alte Kopf-Variante ist
//      weg, nicht zusätzlich (§5).
//  (e) DAS SKELETT ÜBERRESERVIERT NICHT. Während der Entscheid-Shard unterwegs
//      ist, hält die Rubrik einen Boden frei (`min-h-bez-skelett`). Er ist ein
//      BODEN: der Block darf beim Eintreffen der Liste nur WACHSEN, nie
//      schrumpfen — sonst wäre der Sprung bloss verlegt. Gemessen mit
//      künstlich verzögertem Shard, damit das Skelett überhaupt sichtbar wird.
//
// ── D44 (David 7.9.2026) · «⧉ ARTIKEL DANEBEN» IST WIEDER WEG ──────────────
// Die frühere Zusage (f) — eine vierte Aktion, die diesen Artikel per
// `naechsteInstanz` in ein zweites Fenster stellte — ist ersatzlos gestrichen
// (Herleitung `parts/ArtikelAktionen.tsx`, Nachzug
// `abnahme/design-identitaet/D35-F1-FUSSZEILE.md`). Fall (d) prüft seither
// GENAU DREI Aktionen statt vier; der Fall (f) selbst prüft seither die
// ABWESENHEIT des Knopfs, an jeder Breite.
//
// ROT ZU BEKOMMEN (§6.7), je einzeln belegt in
// `abnahme/design-identitaet/D35-F1-FUSSZEILE.md`:
//  · in `parts/Funktionszeile.tsx` `useState({})` durch `useState({ r: true, m: true,
//    g: true, w: true })` ersetzen (= Auto-Aufklappen)            ⇒ (a) rot
//  · dort `setOffen((s) => ({ ...s, [m.reg]: jetzt }))` durch
//    `setOffen({ r: jetzt, m: jetzt, g: jetzt, w: jetzt })` ersetzen (= der
//    D34-Sammelschalter)                                          ⇒ (b) rot
//  · in `parts/ArtikelAktionen.tsx` die GRUPPE `<span className="lr7-bez-
//    aktionen">` um `opacity-0` ergänzen (= die Kopf-Kette von D34) ⇒ (d) rot
//    Bewusst die Gruppe, nicht die Knöpfe: genau dieser Fall liess die
//    Erstfassung der Sonde falsch grün (s. den Absatz bei (d) unten).
//  · in `tailwind.config.js` `'bez-skelett': '3rem'` auf `'40rem'` setzen
//    (= das Skelett reserviert mehr, als der Inhalt braucht)      ⇒ (e) rot
//  · in `parts/ArtikelAktionen.tsx` die Aktionsgruppe um einen vierten Knopf
//    ergänzen, der `<span aria-hidden>⧉</span>` mit dem Wort «daneben» trägt
//    (= die D44-Rückkehr des gestrichenen Knopfs)                  ⇒ (f) rot
import { test, expect, type Page } from '@playwright/test';

const ORT = '/gesetze/bund/OR#art-336_c';
const ART = '336_c';
// Für die Rubrik «Verweise» braucht es einen Artikel, der welche FÜHRT: OR 336c
// hat keinen einzigen (gemessen 7.9.2026 — nur «11 Entscheide · 1 Rechner»),
// ZPO 271 dagegen sechs (D35-Untersuchung Teil 1d). Die Rubrik ist der richtige
// Messpunkt für «Zähler = Liste», weil sie ohne jeden Shard auskommt.
const ORT_G = '/gesetze/bund/ZPO#art-271';
const ART_G = '271';

/** Der Erlass steht, und die Zähl-Datei hat die Zeile gefüllt. */
async function oeffne(page: Page): Promise<void> {
  await page.goto(ORT);
  await expect(page.locator('#art-1')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator(`#art-${ART} .lr7-bez-marke[data-reg="r"]`))
    .toHaveText(/\d+\s*Entscheide?/, { timeout: 20_000 });
}

/** Dasselbe an ZPO 271 — dem Artikel mit einer Verweis-Rubrik. */
async function oeffneG(page: Page): Promise<void> {
  await page.goto(ORT_G);
  await expect(page.locator('#art-1')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator(`#art-${ART_G} .lr7-bez-marke[data-reg="g"]`))
    .toHaveText(/\d+\s*Verweis/, { timeout: 20_000 });
}

test.describe('D35-F1 · die Funktionszeile am Artikelende', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('(a) zu beim Laden — auch mit dem alten Merker im Speicher', async ({ page }) => {
    // Der Merker der D34-Zeile. Er wird hier VOR dem ersten Render gesetzt: eine
    // Fassung, die ihn noch läse, ginge damit offen auf. Genau das ist der Punkt.
    await page.addInitScript(() => {
      try { window.localStorage.setItem('lm.leser.bezuege-offen', '1'); } catch { /* gesperrt */ }
    });
    await oeffne(page);
    const offene = page.locator('.lc-leser .lr7-bez-marke[aria-expanded="true"]');
    expect(await offene.count(), 'eine Rubrik steht ungefragt offen').toBe(0);
    // Und kein Rubrik-Inhalt liegt im Layout (die Blöcke rendern gar nicht erst).
    expect(await page.locator('.lc-leser .lr7-bez-inhalt').count(),
      'aufgeklappter Inhalt ohne einen einzigen Klick').toBe(0);
    // Positiv-Sonde (§6.7): die Griffe SIND da — sonst prüfte (a) eine leere Seite.
    expect(await page.locator(`#art-${ART} .lr7-bez-marke`).count())
      .toBeGreaterThan(0);
  });

  test('(b)+(c) ein Klick öffnet genau seine Rubrik, und die Zahl stimmt', async ({ page }) => {
    await oeffneG(page);
    // «Verweise» führt eine feste, shard-freie Menge — die Gleichung
    // Zähler ↔ Liste ist damit sofort und ohne Wartefenster messbar.
    const griffG = page.locator(`#art-${ART_G} .lr7-bez-marke[data-reg="g"]`);
    await expect(griffG, 'ZPO 271 führt keine Verweis-Rubrik mehr').toHaveCount(1);
    const zahl = Number(/(\d+)/.exec((await griffG.innerText()).replace(/\u00A0/g, ' '))![1]);
    await griffG.click();

    // (b) GENAU EINE Rubrik offen — die geklickte.
    await expect(griffG).toHaveAttribute('aria-expanded', 'true');
    const bloecke = page.locator(`#art-${ART_G} .lr7-bez-block`);
    await expect(bloecke).toHaveCount(1);
    await expect(bloecke.first()).toHaveAttribute('data-reg', 'g');
    expect(await page.locator(`#art-${ART_G} .lr7-bez-marke[aria-expanded="true"]`).count(),
      'ein Klick hat mehr als eine Rubrik geöffnet — der D34-Sammelschalter ist zurück').toBe(1);

    // (c) Zähler = Listenlänge.
    const chips = bloecke.first().locator('a[href^="/gesetze/"]');
    expect(await chips.count(), `Griff sagt ${zahl} Verweise`).toBe(zahl);

    // Und der Klick ist ein SCHALTER: derselbe Griff schliesst wieder.
    await griffG.click();
    await expect(griffG).toHaveAttribute('aria-expanded', 'false');
    expect(await page.locator(`#art-${ART_G} .lr7-bez-block`).count()).toBe(0);
  });

  test('(b) Tastatur: der Griff reagiert auf Enter und auf Space', async ({ page }) => {
    await oeffneG(page);
    const griff = page.locator(`#art-${ART_G} .lr7-bez-marke[data-reg="g"]`);
    await griff.focus();
    await page.keyboard.press('Enter');
    await expect(griff).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press(' ');
    await expect(griff).toHaveAttribute('aria-expanded', 'false');
  });

  test('(d) die Aktionen stehen sichtbar in der Zeile — und nur dort', async ({ page }) => {
    await oeffne(page);
    const artikel = page.locator(`#art-${ART}`);
    // ── §6.3-DEKLARATION (W2·26/Z6, Mandat David 11.9.2026) ─────────────────
    // Der Satz «ohne jede Maus-Berührung sichtbar» unten beschreibt den Stand
    // vom 7.9.2026 und bleibt stehen (§0 Ziff. 2b). Seit Z6 werden die drei
    // Aktionen erst GERENDERT, wenn der Artikel Hover oder Fokus hat oder eine
    // Rubrik offen ist — auf Geräten OHNE Hover unverändert immer (eigene
    // Sonde: `e2e/w226-funktionszeile`, Fall (c2)). Anlass war die Knopfzahl:
    // gemessen 13 532 Knöpfe im OR-Leser, davon 3 372 Aktions-Knöpfe, die
    // niemand sieht (§15).
    // WAS DIESER FALL PRÜFT, BLEIBT WORT FÜR WORT: genau einmal je Artikel,
    // volle Deckkraft über die ganze Vorfahrenkette, WCAG-2.5.8-Trefferfläche,
    // Lage am Artikelende. Nur die Vorbedingung ist jetzt ausgesprochen.
    await artikel.locator('.lr7-bez').hover();
    await expect(artikel.locator('.lr7-bez-aktionen')).toHaveCount(1);
    // GENAU EINMAL je Artikel: die Kopf-Variante ist gelöscht, nicht gedoppelt.
    // D44 (David 7.9.2026): die vierte Aktion «⧉ Artikel daneben»
    // (`/^Artikel .* daneben stellen$/`) ist ersatzlos gestrichen — sie stand
    // hier testweise (s. Fall (f) unten).
    for (const name of [/^Zitat kopieren:/, /^Permalink kopieren$/, /^Amtliche Fassung von /]) {
      expect(await artikel.getByLabel(name).count(), `«${name}» steht nicht genau einmal am Artikel`).toBe(1);
    }
    // Ohne jede Maus-Berührung sichtbar, mit Trefferfläche nach WCAG 2.5.8.
    //
    // ── ERSTFASSUNG WAR EIN TOR, DAS NICHT SCHEITERN KONNTE (§6.7) ──────────
    // Sie mass `getComputedStyle(el).opacity` an den KINDERN der Aktionsgruppe.
    // Deckkraft ist aber nicht vererbt, sondern KUMULATIV: ein `opacity-0` an
    // der Gruppe lässt jedes Kind weiter «1» melden. Der Rot-Beweis vom
    // 7.9.2026 (Gruppe auf `opacity-0`, also genau die D34-Kette) blieb darum
    // GRÜN, während die Knöpfe unsichtbar waren. Jetzt misst die Sonde die
    // Kette vom Artikel abwärts (`checkVisibility({ opacityProperty: true })`
    // sieht jede unsichtbare Vorfahrin) UND die Deckkraft der Gruppe selbst.
    const mess = await artikel.locator('.lr7-bez-aktionen > *').evaluateAll((els) => els.map((el) => {
      let deckkraft = 1;
      for (let n: Element | null = el; n && n !== document.body; n = n.parentElement) {
        deckkraft *= Number(getComputedStyle(n).opacity);
      }
      return {
        text: (el.textContent ?? '').trim(),
        deckkraft,
        hoehe: el.getBoundingClientRect().height,
        sichtbar: (el as HTMLElement).checkVisibility({ opacityProperty: true, visibilityProperty: true }),
      };
    }));
    // DREI: Zitat, Link, Amtliche Fassung ↗. D44 strich die vierte Aktion
    // «⧉ Artikel daneben» ersatzlos (s. Fall (f) unten) — an jeder Breite.
    expect(mess.length, 'keine Aktionsgruppe in der Funktionszeile').toBe(3);
    for (const a of mess) {
      expect(a.deckkraft, `«${a.text}» steht mit Deckkraft ${a.deckkraft} da`).toBe(1);
      expect(a.hoehe, `«${a.text}» misst ${a.hoehe} px hoch (WCAG 2.5.8: ≥ 24)`).toBeGreaterThanOrEqual(24);
      expect(a.sichtbar, `«${a.text}» ist nicht sichtbar (Deckkraft/Sichtbarkeit einer Vorfahrin)`).toBe(true);
    }
    // Die Aktionen liegen am ARTIKELENDE, unter dem Wortlaut — nicht im Kopf.
    const lage = await artikel.evaluate((a) => {
      const akt = a.querySelector('.lr7-bez-aktionen')!.getBoundingClientRect();
      const nummer = a.querySelector('a[href^="#art-"], button[aria-label*="auf- und zuklappen"]')!.getBoundingClientRect();
      return { aktOben: akt.top, nummerUnten: nummer.bottom };
    });
    expect(lage.aktOben - lage.nummerUnten,
      'die Aktionen kleben wieder an der Artikelnummer').toBeGreaterThan(48);
  });

  test('(e) das Skelett reserviert einen BODEN, keinen Überschuss', async ({ page }) => {
    // Der Shard kommt lokal aus `dist/` und wäre sonst da, bevor das Skelett
    // je sichtbar würde. Die Verzögerung ist die MESSBEDINGUNG, nicht das
    // Ergebnis (§0 Ziff. 3) — sie macht den Zwischenzustand überhaupt messbar.
    await page.route('**/rechtsprechung/bezuege/**', async (route) => {
      await new Promise((r) => setTimeout(r, 1_500));
      await route.continue();
    });
    await oeffne(page);
    const griffR = page.locator(`#art-${ART} .lr7-bez-marke[data-reg="r"]`);
    await griffR.click();
    const block = page.locator(`#art-${ART} .lr7-bez-block[data-reg="r"]`);
    const skelett = block.locator('.lr7-bez-skelett');
    await expect(skelett, 'kein Skelett während der Ladung — der Boden fehlt').toBeVisible({ timeout: 5_000 });
    const hoeheSkelett = (await block.boundingBox())!.height;
    // Jetzt trifft die Liste ein.
    await expect(block.locator('[data-bezug-gruppe]').first()).toBeVisible({ timeout: 25_000 });
    await expect(skelett).toHaveCount(0);
    const hoeheGeladen = (await block.boundingBox())!.height;
    expect(hoeheGeladen,
      `Skelett ${Math.round(hoeheSkelett)} px, geladen ${Math.round(hoeheGeladen)} px — der Block SCHRUMPFT beim Laden, der Sprung ist nur verlegt`)
      .toBeGreaterThanOrEqual(hoeheSkelett);
    // Und der Boden ist ein Boden: er hält überhaupt Platz frei (sonst wäre die
    // Reservierung eine Zusage ohne Wirkung).
    expect(hoeheSkelett, 'das Skelett reserviert gar nichts').toBeGreaterThanOrEqual(48);
  });

  // ── DEKLARIERTE ANPASSUNG (§6.3, D44, David 7.9.2026) ────────────────────
  // Bis hierher prüfte Fall (f) an dieser Stelle, dass der vierte Knopf
  // («⧉ Artikel daneben», nach dem Nachfix vom 7.9.2026 mit dem Accessible
  // Name `Artikel Art. 336c OR daneben stellen`) an ≥ lg STEHT und wirklich
  // ein zweites Fenster öffnet, und in einem zweiten Test, dass er unter lg
  // ABWESEND ist (`kannOeffnen` ist erst ab lg wahr). David wollte den Knopf
  // nicht — D44 streicht ihn ersatzlos, kein zweiter Mechanismus dafür
  // (§17-Gegengewicht). Fall (f) prüft seither an BEIDEN Breiten dieselbe
  // Abwesenheit; Herleitung in `parts/ArtikelAktionen.tsx`, Nachzug in
  // `abnahme/design-identitaet/D35-F1-FUSSZEILE.md`.
  test('(f) «Artikel daneben» ist an keiner Breite da (D44)', async ({ page }) => {
    await oeffne(page);
    const artikel = page.locator(`#art-${ART}`);
    await expect(artikel.getByRole('button', { name: /daneben stellen$/ }),
      'die mit D44 gestrichene Aktion steht wieder am Artikel').toHaveCount(0);
    // Auch unter lg (wo der Knopf schon vor D44 wegen `kannOeffnen` fehlte).
    await page.setViewportSize({ width: 1023, height: 900 });
    await expect(page.locator(`#art-${ART}`).getByRole('button', { name: /daneben stellen$/ }))
      .toHaveCount(0);
  });

  test('(a)+(d) @390: dieselbe Zeile, derselbe Baustein', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await oeffne(page);
    // Zu, mit sichtbaren Griffen und sichtbaren Aktionen — auf dem Telefon
    // stand am Artikel bis D34 gar keine Bezugs-Zeile (D35-Untersuchung 1c).
    expect(await page.locator(`#art-${ART} .lr7-bez-marke[aria-expanded="true"]`).count()).toBe(0);
    await expect(page.locator(`#art-${ART} .lr7-bez-marke`).first()).toBeVisible();
    // §6.3-DEKLARATION (W2·26/Z6): `setViewportSize` macht ein SCHMALES FENSTER,
    // kein Telefon — Chromium meldet hier weiter `(hover: fine)`, also gilt die
    // Hover-Bedingung. Das ECHTE Telefon (isMobile ⇒ `(hover: none)`) prüft
    // `e2e/w226-funktionszeile`, Fall (c2): dort stehen die Aktionen dauerhaft.
    // Die Zusage dieses Falls — @390 dieselbe Zeile, derselbe Baustein, kein
    // Überlauf — ist unberührt.
    await page.locator(`#art-${ART} .lr7-bez`).hover();
    await expect(page.locator(`#art-${ART} .lr7-bez-aktionen`)).toBeVisible();
    // Kein waagrechter Überlauf durch die Zeile.
    const ueber = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(ueber, `@390 läuft die Seite um ${ueber} px über`).toBeLessThanOrEqual(1);
  });
});
