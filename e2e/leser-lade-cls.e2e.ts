// @shard-gruppe: nacht
import { test, expect } from '@playwright/test';
import { clsBeobachtenInstallieren, clsAuslesen } from './helpers/cls';

// ─── Entscheid-/Material-Leser: Lade-CLS (W2·31-BILDSCHIRMBREITE P13, 30.9.2026) ─
//
// Wie /materialien vor #1198: die Ladeanzeige der beiden Leser stand ohne
// Mindesthöhe, der `<footer>` ragte in den Fold und sprang beim Einwachsen
// wieder hinaus. Gemessen am Preview-Build vor dem Fix (headless Chromium,
// Beobachter vor dem ersten Paint, 5 Läufe je Zelle, sd 0.0000 — deterministisch):
//   Entscheid @375 0.9436 · @1920 0.4518 · Material @375 0.9439 · @1920 0.19–0.32.
// Quelle je Shift: `<footer>`. Fix: `min-h-inhalt-region` am `<Ladeanzeige …>`
// beider Leser (Hausmuster `pages/Materialien.tsx`, #1198).
// Nachher (5 Läufe je Zelle): Entscheid @375 0.0001 · @1366 0.0002 · @1440 0.0002
// · @1920 0.0001 (sd ≤ 0.0001); Material @375 0.0004 · @1366 0.0003.
//
// NACHZUG LESER-NAV Paket E (15.10.2026) · Material @≥1440 jetzt GEDECKT. Der
// Rest-CLS dort (0.019 @1440×900, 0.032 @1920×1000, 0.1333 @2560×1440; je 5 Läufe,
// sd 0.0000, Preview von origin/main) hatte eine ANDERE Quelle als die Ladeanzeige:
// das Verweis-Kontext-Panel («Bundesgerichtsentscheide», `KontextPanel`) wächst nach
// dem asynchronen Laden von ≈ 200 auf ≈ 1170 px und schiebt den Rückweg-Knopf
// («← Alle Materialien», stand im Fold) und bei hohen Fenstern den Footer aus dem
// Bild. Fix: der Artikel trägt dieselbe Mindesthöhe wie die Ladeanzeige
// (`min-h-inhalt-region`, der Footer bleibt stehen) und der Rückweg-Knopf ist
// `invisible` (Platz bleibt, Shifts unsichtbarer Elemente zählen nicht), solange das
// Panel `data-kontext-laedt` trägt. Nachher: 0.0001–0.0006 in allen Zellen.
// Die kurze Zelle (VERN-6008-30, Panel ohne Entscheide) deckt die Gegenrichtung ab:
// eine feste Reserve am Panel liesse sie nach oben springen.
// ROT ZU BEKOMMEN: `min-h-inhalt-region group/material` am Artikel und
// `group-has-[[data-kontext-laedt]]/material:invisible` am Rückweg-Knopf streichen.
//
// Beobachter wie `materialien-cls.e2e.ts`: geteilter aus `helpers/cls.ts`,
// `buffered: true` (zieht die Shifts der ganzen Ladephase nach), eine Sekunde
// Nachlauf. Latte 0.01 (Hausmuster d21; Messrauschen ≈ 0.0001–0.0004).
//
// NACHZUG P13b (1.10.2026, Prüfer-Auflage 1+2): «deterministisch» galt nur für
// den UNGEDROSSELTEN Lauf OHNE `reducedMotion` (lokal, warm, `--workers=1`): dort
// maskiert der Opacity-Einblender von `.lc-route` (index.css) die Ladeanzeige, solange
// sie noch unsichtbar steht. Unter CPU-Drosselung (CDP `Emulation.setCPUThrottlingRate`,
// wie die 2-vCPU-CI-Runner) ist sie lang genug sichtbar, und ein Shift zählt:
// Entscheid @375 0.0176 (Quelle `div.lc-route` y 167→187; beim Prüfer 6/6 bei 2–3×,
// in meinen Diagnoseläufen bei 3×/4× nur in 4 von 8 — zeitabhängig, daher flaky-rot
// auf CI). `reducedMotion: 'reduce'` (F2g) schaltet den Einblender ab und macht den
// Shift reproduzierbar: VOR dem Fix 9/10 rot (5/5 ungedrosselt, 4/5 bei 4×), Wert
// 0.0176. WURZEL: der Kopf des Entscheid-Lesers trug 20 px `margin-top` (Tailwind-3-
// `space-y` zählt das `<style>` als Geschwister), der durch den Wrapper und `.lc-route`
// hinaus kollabierte und die Hülle um 20 px verschob. Fix: `flow-root` am Wrapper
// (`pages/EntscheidLeser.tsx`), der Kopf steht pixelgleich. NACHHER (je 5 Läufe,
// `--workers=1`, lokal warm): Entscheid @375 0.0000–0.0001 (ungedrosselt, 2×, 4×),
// @1920 0.0001–0.0002, Material @375 0.0003 — 30/30 grün. Jede Zelle läuft ungedrosselt
// UND 4× gedrosselt (Messbedingung im Testtitel); 4× statt 2×, weil es die stärkere Probe
// ist. ROT ZU BEKOMMEN: `flow-root` streichen, `npm run build` → 0.0176.
//
// NACHZUG P18 (1.10.2026, Wurzel statt Klammer): `flow-root` fing den Rand nur ab. Jetzt
// steht das `<style>` des Wrappers als LETZTES Kind (kein Geschwister vor dem Kopf, also
// kein `space-y`-Rand), die 20 px Luft über dem Kopf als `pt-5` (Padding kollabiert nicht).
// Beleg: `flow-root` weg OHNE Umzug → Entscheid @375 ungedrosselt 0.0176 (y 167→187, rot);
// mit Umzug + `pt-5` Layout in 24 Zellen (4 Entscheide/Ansichten × 375/1280/1920 × Bildschirm/
// Druck, 9281 Elementkästen) identisch zum Stand mit `flow-root`.

// NACHZUG LESER-NAV Paket C (16.10.2026) · O-66 (c): Zelle Material @2560×1440 ergänzt. Sie war
// in #1386 gemessen (CLS vorher 0.1333, nachher 0.0001), stand aber nicht im Wächter — der
// grösste Befund des O-53-Fixes hatte keinen Stolperdraht. ROT ZU BEKOMMEN: wie oben
// (`min-h-inhalt-region group/material` am Artikel und `group-has-[…]:invisible` am Knopf
// streichen) ⇒ diese Zelle rot (Wert siehe PR-Bericht).
//
// O-66 (b): am Ende der Datei der Fall «hängender Abruf» — der Rückweg-Knopf bleibt nicht für
// immer unsichtbar (Frist `KONTEXT_FRIST_MS` in `pages/MaterialLeser.tsx`).

const LATTE = 0.01;
// Drosselstufen je Zelle: 1 = ungedrosselt, 4 = `Emulation.setCPUThrottlingRate` 4
// (stärkere Probe als die 2× der Prüfer-Auflage; Begründung im Kopf).
const DROSSELN = [1, 4];

const ZELLEN: { name: string; pfad: string; breite: number; hoehe: number }[] = [
  { name: 'Entscheid', pfad: '/rechtsprechung/bger_1B_278_2022', breite: 375, hoehe: 812 },
  { name: 'Entscheid', pfad: '/rechtsprechung/bger_1B_278_2022', breite: 1920, hoehe: 1000 },
  { name: 'Material', pfad: '/materialien/ESTV-MWST-INFO-02', breite: 375, hoehe: 812 },
  { name: 'Material', pfad: '/materialien/ESTV-MWST-INFO-02', breite: 1440, hoehe: 900 },
  { name: 'Material', pfad: '/materialien/ESTV-MWST-INFO-02', breite: 1920, hoehe: 1000 },
  { name: 'Material', pfad: '/materialien/ESTV-MWST-INFO-02', breite: 2560, hoehe: 1440 },
  { name: 'Material (kurz)', pfad: '/materialien/VERN-6008-30', breite: 1920, hoehe: 1000 },
];

for (const z of ZELLEN) {
  for (const drossel of DROSSELN) {
    const bedingung = drossel > 1 ? `${drossel}× CPU gedrosselt` : 'ungedrosselt';
    test(`${z.name}-Leser @${z.breite} (${bedingung}): Lade-CLS unter ${LATTE} (Footer springt nicht aus dem Bild)`, async ({ page }) => {
      // F2g: die Route blendet per Opacity-Animation ein (`.lc-route`); die hat keinen
      // Layout-Anteil, würde aber unter Drosselung Frames ziehen — die Messung gilt
      // dem Lade-Layout, nicht der Bewegung.
      await page.emulateMedia({ reducedMotion: 'reduce' });
      if (drossel > 1) {
        const cdp = await page.context().newCDPSession(page);
        await cdp.send('Emulation.setCPUThrottlingRate', { rate: drossel });
      }
      await page.setViewportSize({ width: z.breite, height: z.hoehe });
      await page.goto(z.pfad);
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
      await clsBeobachtenInstallieren(page, true);
      // Messfenster statt Zustand: es gibt keinen Marker für «alle späten Shifts sind
      // durch» — `buffered: true` zieht die Ladephase bis hierher nach, die Sekunde
      // fängt Nachzügler (z. B. asynchron nachladende Panels) ab.
      await page.waitForTimeout(1000);
      const { cls, bericht } = await clsAuslesen(page);
      expect(cls, `Lade-CLS ${cls.toFixed(4)} @${z.breite} ${z.pfad} (${bedingung}) — ${bericht}`).toBeLessThanOrEqual(LATTE);
    });
  }
}

// ─── O-65 (a): der Verlauf-Knopf der Kopfzeile erscheint, ohne die Werkzeug-Gruppe zu verschieben ──
//
// `VerlaufUebersicht` rendert erst nach dem Mount (Verlauf aus localStorage, §15.2). Die Gruppe
// rechts in der Kopfzeile (`div.ml-auto.shrink-0.flex`, `Topbar.tsx`) ist rechtsbündig: wuchs sie
// um den Knopf (44 px), wanderte ihre linke Kante von x 1309.4 nach 1265.4 — gemessen am
// 16.10.2026 (Dev-Server, Headless-Shell, 1440×900, frischer Kontext) CLS 0.0002–0.0003 auf JEDER
// Seite, Quelle `div.ml-auto.shrink-0.flex`. Fix: der Block `.lc-topbar-verlauf` reserviert die
// Knopfbreite (`min-w-11`). Probe: der Knopf ist am Ende da (kein leerer Fall), und KEIN Shift
// nennt die Gruppe als Quelle. (Der Rest-CLS 0.0003 der Ausgabe-Zeile ist ein Schrift-Tausch,
// Archivo Fallback → Variable, und gehört nicht hierher.)
// ROT ZU BEKOMMEN: in `Topbar.tsx` `min-w-11` am Block `lc-topbar-verlauf` streichen.
for (const breite of [1440, 768]) {
  test(`Kopfzeile @${breite}: Verlauf-Knopf erscheint ohne Verschiebung der Werkzeug-Gruppe`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: breite, height: 900 });
    await page.goto('/rechner/verzugszins');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    await clsBeobachtenInstallieren(page, true);
    await expect(page.getByRole('button', { name: 'Verlauf – zuletzt geöffnet' })).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(500);
    const gruppe = await page.evaluate(() => {
      const q = (window as unknown as { __clsQuellen: { wert: number; quellen: { el: string; von: string; nach: string }[] }[] }).__clsQuellen;
      return q.flatMap((s) => s.quellen.filter((x) => x.el.startsWith('div.ml-auto')).map((x) => `Δ${s.wert.toFixed(4)} ${x.el} ${x.von}→${x.nach}`));
    });
    expect(gruppe, `Werkzeug-Gruppe der Kopfzeile verschoben @${breite}`).toEqual([]);
  });
}

// ─── O-66 (a): die Lade-Reserve gilt nur am Bildschirm ───────────────────────────────────────
//
// `min-h-inhalt-region` (calc(100svh - 8rem)) ist eine Bildschirm-Reserve; im Druck blieb sie als
// leere Fläche unter dem Inhalt (gemessen 16.10.2026, Material-Leser VERN-6008-30 @1920×1000,
// print-Emulation: Artikel 872 px bei 629 px Inhalt). Fix: `@media print` in `index.css` setzt
// `.min-h-inhalt-region` auf `min-height: auto`. Probe: am Bildschirm trägt der Artikel die Reserve,
// im Druck nicht (die Reserve darf hier also nicht versehentlich überall fehlen).
// ROT ZU BEKOMMEN: `.min-h-inhalt-region` aus der Druck-Selektorliste (`index.css`, Block
// «Nichts wird auf den sichtbaren Ausschnitt zugeschnitten») streichen ⇒ `872px` im Druck.
test('Material-Leser: Lade-Reserve (min-h-inhalt-region) gilt am Bildschirm, nicht im Druck', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1000 });
  await page.goto('/materialien/VERN-6008-30');
  await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
  const minHoehe = () => page.evaluate(() => {
    const a = document.querySelector('article.min-h-inhalt-region');
    return a ? getComputedStyle(a).minHeight : null;
  });
  await page.emulateMedia({ media: 'screen' });
  expect(await minHoehe(), 'Bildschirm: Reserve calc(100svh - 8rem) = 1000 - 128').toBe('872px');
  await page.emulateMedia({ media: 'print' });
  expect(await minHoehe(), 'Druck: keine Reserve').toBe('0px');
});

// ─── O-66 (b): ein hängender Abruf hält den Rückweg-Knopf nicht ewig unsichtbar ─────────────
//
// O-53 blendet «← Alle Materialien» aus (`visibility`), solange das Kontext-Panel lädt. Hing der
// Abruf des Norm-Index (`norm-index-erlasse.json`) — Route hier nie beantwortet —, blieb die Marke
// `data-kontext-laedt` und mit ihr der Knopf für immer verborgen (gemessen: nach 20 s noch hidden).
// Jetzt fällt die Unsichtbarkeit nach `KONTEXT_FRIST_MS` (10 s) ab. Probe: davor hidden (der
// Lade-Schutz bleibt), danach visible, obwohl die Marke steht. ROT ZU BEKOMMEN: in
// `MaterialLeser.tsx` `kontextFristAbgelaufen` fest `false` ⇒ «sichtbar nach der Frist» rot.
test('Material-Leser: hängender Abruf ⇒ Rückweg-Knopf nach der Frist sichtbar (Lade-Schutz davor bleibt)', async ({ page }) => {
  test.setTimeout(60_000);
  await page.route('**/rechtsprechung/norm-index-erlasse.json', () => { /* bleibt offen */ });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/materialien/ESTV-MWST-INFO-02');
  await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
  const knopf = page.getByRole('link', { name: '← Alle Materialien' });
  // Die Marke steht (Panel lädt) und der Knopf ist verborgen: `toBeHidden` gilt auch für visibility:hidden.
  await expect(page.locator('[data-kontext-laedt]')).toHaveCount(1);
  await expect(knopf).toBeHidden();
  // Nach der Frist (10 s ab dem Stehen des Materials) sichtbar — bei weiter stehender Marke.
  await expect(knopf).toBeVisible({ timeout: 15000 });
  await expect(page.locator('[data-kontext-laedt]')).toHaveCount(1);
});
