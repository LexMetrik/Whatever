// @shard-gruppe: 4
/**
 * W2·5m-LESER-V3 · S3 — CLS-Wächter für den neuen Erlass-Kopf.
 *
 * Der Kopf trägt zwei Aussagen, die erst NACH dem ersten Paint eintreffen (der
 * Standausweis aus dem Currency-Sidecar, die Konsolidierungs-Warnung aus dem
 * Revisions-Sidecar). Genau daraus entstand am 9.8.2026 ein gemessener
 * Layout-Shift (CLS 0.0227), als die Warnung noch ein eigener Block war. Die
 * Abwehr ist heute die höhenfeste Zelle (`kopf-stand*`, tailwind.config.js);
 * dieser Wächter hält fest, dass sie wirkt.
 *
 * Die 16 Kopf-SCREENSHOTS unter `docs/ux-audit-2026-07/reader/leser-v3-s3/`
 * sind einmalige Belege, kein Testlauf — wie sie erzeugt wurden, steht im
 * README daneben. Ein Spec, dessen Aufgabe es ist, bei jedem CI-Lauf
 * Dokumentation neu zu schreiben, wäre kein Wächter (§6.7).
 */
import { test, expect } from '@playwright/test';

const BREITEN = [
  { name: 'desktop', w: 1280, h: 900 },
  { name: 'mobil', w: 390, h: 844 },
] as const;

// ─── CLS-Messung: der Kopf darf beim Sidecar-Nachschub nicht wachsen ─────────
// STPO ist der harte Fall — er bekommt BEIDE Nachzügler (Standausweis aus dem
// Currency-Sidecar UND die Warnzeile aus dem Revisions-Sidecar). Gemessen wird
// @390, wo die Sätze am ehesten neu umbrechen. Der Beobachter startet vor der
// Navigation, damit er das Einwachsen sieht (Muster aus leser-kontext-e4).
// V3 stellt den Kopf in eine Spalte neben der Seitenleiste (@1280 nur 656 px
// statt 976 px), dort brechen dieselben Sätze über mehr Zeilen. Genau daran
// ist der frühere `xl`-Schritt der Reservierung gescheitert (Prüferbefund
// 16.8.2026). Bis H5 lief dieselbe Messung zusätzlich gegen die Ist-Hülle
// (`?leser=v1`) — mit ihrer Löschung (21.8.2026) entfällt der zweite Lauf,
// er hätte nur noch dasselbe V3 unter einem wirkungslosen Parameter gemessen.
// DIÄT 31.8.2026 (Runde 2 / Batch A): die `HUELLEN`-Schleife trug seit dem
// V1-Rückbau (21.8.2026) genau EINEN Eintrag, und dessen `q` war der tote
// Parameter `?leser=v3` (Produktcode liest ihn nicht, nachgemessen 31.8.2026 —
// bibliothek/betrieb/testapparat-fang-historie-2026-08-31.md §7 Ziff. 1). Schleife
// und Parameter sind entfallen; beide Breiten-Fälle bleiben unverändert.
{
  for (const b of BREITEN) {
    test(`CLS Erlass-Kopf @${b.w} (STPO — beide Sidecars als Nachzügler)`, async ({ page }) => {
      await page.setViewportSize({ width: b.w, height: b.h });
      await page.addInitScript(() => {
        (window as unknown as { __cls: number }).__cls = 0;
        new PerformanceObserver((liste) => {
          for (const e of liste.getEntries() as unknown as Array<{ value: number; hadRecentInput: boolean }>) {
            if (!e.hadRecentInput) (window as unknown as { __cls: number }).__cls += e.value;
          }
        }).observe({ type: 'layout-shift', buffered: true });
      });
      await page.goto('/gesetze/bund/STPO');
      await page.locator('header').first().waitFor({ state: 'visible', timeout: 20_000 });
      // Warten, bis die Warnzeile wirklich da ist — sonst misst man das Nichts.
      // Sie ist zugleich der Nachweis, dass die V3-Hülle den Zeitbezug bekommt
      // (S3-Nachzug: `nichtKonsolidiertSeit` durch `leserV3Modell`).
      //
      // §6.3-DEKLARATION (Ä70, 17.8.2026) — DER ANKER WIRD ENGER, NICHT WEITER.
      // Bis hierher stand hier `page.getByText(…).first()`, also die erste
      // Fundstelle IRGENDWO auf der Seite. Seit Ä70 nimmt auch die Übersichtsbox
      // der Seitenleiste denselben Satz aus `erlassKopfText.ts` (§5: EIN Wortlaut
      // für EINEN Sachverhalt — vorher trug die Box einen eigenen zweiten).
      // Damit traf `.first()` in der V3-Hülle die BOX statt den Kopf, und weil
      // die Box zugeklappt startet, ist ihr Treffer `hidden`: die Wartebedingung
      // lief in den Timeout, obwohl der Kopf die Zeile korrekt zeigte (so
      // gemessen: «locator resolved to <span>» 16× mit «unexpected value hidden»).
      // Der Fix ist keine Lockerung — die Messung GILT dem Erlass-Kopf, und der
      // Anker sagt das jetzt auch. `leser-kopf-g2b` scopet dieselbe Zeile seit
      // jeher auf einen Kopf-Anker; die Ausnahme war hier, nicht dort.
      //
      // ZWEI ZWISCHENFEHLER, damit sie niemand wiederholt (beide gemessen):
      //  · `page.locator('header').first()` ist die APP-Kopfzeile, nicht der
      //    Erlass-Kopf ⇒ 4/4 rot, «element(s) not found».
      //  · `.lc-leser > header` (der Anker von `leser-kopf-g2b`) trägt NUR die
      //    Ist-Hülle ⇒ ist-huelle grün, v3 2/2 rot. Diese Datei läuft über BEIDE
      //    Hüllen, sie braucht darum einen hüllenneutralen Anker.
      // Gemessen an STPO @1280: `header:has(h1)` trifft in beiden Hüllen genau
      // EIN Element (von je zwei `<header>` der Seite), und genau dieses trägt
      // die Warnzeile. Der Erlass-Kopf ist der einzige Kopf der Seite mit einer
      // H1 — das ist seine Definition, nicht ein Zufall des Markups.
      await expect(
        page.locator('header:has(h1)')
          .getByText(/Fedlex hat eine seit \d{2}\.\d{2}\.\d{4} geltende Änderung noch nicht in den Text eingearbeitet/),
      ).toBeVisible({ timeout: 20_000 });
      await page.waitForTimeout(1500);
      const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls);
      // (Die `eslint-disable-next-line no-console`-Zeile stand hier bis 31.8.2026
      //  und meldete sich selbst als «Unused eslint-disable directive» — `no-console`
      //  greift unter `e2e/` gar nicht. Eine Ausnahme von einer Regel, die nicht
      //  gilt, ist Regelfläche ohne Wirkung, §17-Gegengewicht Ziff. 2.)
      console.log(`S3-MESSUNG v3 cls@${b.w}=${cls}`);
      // ─── Woher die Schwelle kommt (gemessen 16.8.2026, nicht gesetzt) ────────
      // Gemessen wurde die GANZE Seite, nicht nur der Kopf: 0.0216 @390 und
      // 0.0072 @1280. Die Shift-Quellen (`layout-shift`-`sources`) liegen dabei
      // NICHT im Erlass-Kopf, sondern im Seiten-Chrom (die x-Bewegung der
      // Kopfleisten-Gruppen nach dem Font-Swap) und im Fliesstext. Beleg per
      // Nullprobe auf Seiten OHNE diesen Kopf, gleicher Lauf, gleiche Bedingung:
      // /gesetze 0.31 @390 · 0.73 @1280, /rechtsprechung 2.15 @390 · 2.19 @1280.
      // Der Leser liegt also zwei Grössenordnungen darunter.
      // Die Schwelle bewacht darum, dass der Kopf diesen Grundpegel nicht
      // VERSCHLECHTERT — sie ist kein Rein-Kopf-Mass. Für den Kopf selbst gilt
      // die Reservierung über die `min-h-kopf-stand*`-Tokens (tailwind.config.js
      // — dort stehen die gemessenen Fenster-Werte) plus die drei bereits
      // kalibrierten Wächter leser-kontext-e4, leser-kopf-a9 und
      // gesetze-historie-badge, die alle unverändert grün sind.
      // 0.05 = halber CWV-«good»-Wert (0.1), rund das 2.5-Fache des Ist-Werts —
      // eng genug, um eine echte Verschlechterung zu fangen, weit genug, um am
      // Chrom-Grundrauschen nicht zu flackern.
      // Messbedingung: warm, ohne CPU-Drossel, eigener Browser-Kontext je Fall.
      expect(cls).toBeLessThan(0.05);
    });
  }
}

// ─── W2·24-R6/L1 · DER TIEFLINK, DEN DIESER WÄCHTER NIE GESEHEN HAT ──────────
//
// §6.3-DEKLARATION: Dieser Fall wird HINZUGEFÜGT, keiner geändert. Die beiden
// Kopf-Fälle darüber stehen byte-gleich; ihre Schwelle bleibt 0.05.
//
// WARUM ER FEHLTE: beide Fälle fahren `/gesetze/bund/STPO` — eine Adresse OHNE
// `#art-…`. Genau der Pfad mit Anker war der teure: gemessen am Stand vom
// 6.9.2026 (`dist`-Preview, Chromium @390×844, je 3 Läufe, byte-gleiche Werte)
//   OR#art-336_c  1.1664 · OR#art-1  0.9307 · ZGB#art-457  0.5749
// gegen 0.0362 auf derselben Route ohne Anker. Der Wächter war grün, während
// jeder Tieflink das Zwanzigfache seiner Schwelle riss (§6.7: ein Tor, das den
// schlimmsten Fall nicht sehen kann).
//
// NACH DEM FIX (gleiche Bedingung, je 3 Läufe): 0.0431 · 0.0432 · 0.0921.
//
// DIE SCHWELLE IST 0.1 UND NICHT 0.05, und das ist eine Aussage, keine
// Bequemlichkeit: was hier gemessen wird, ist der GANZE Seitenaufbau eines
// Tieflinks, inklusive des Chrom-Grundpegels, den die Kopf-Fälle oben schon
// beschreiben — und inklusive der Reiterleisten-Reservierung, die beim
// Erstbesuch ohne Reiter-Speicher allein 0.0355 beiträgt (Finder R5/L7,
// eigener Bau). 0.1 ist der CWV-«good»-Deckel: er fängt eine Rückkehr in das
// gemessene 0.5-bis-1.2-Regime um eine Grössenordnung sicher, ohne am
// Grundpegel zu flackern. Wird L7 gebaut, kann er enger gezogen werden.
test('CLS Tieflink @390 (OR#art-336_c — Sprung in einen 1686-Artikel-Erlass)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    (window as unknown as { __cls: number }).__cls = 0;
    new PerformanceObserver((liste) => {
      for (const e of liste.getEntries() as unknown as Array<{ value: number; hadRecentInput: boolean }>) {
        if (!e.hadRecentInput) (window as unknown as { __cls: number }).__cls += e.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
  await page.goto('/gesetze/bund/OR#art-336_c');
  // Der Sprung ist erst fertig, wenn der Zielartikel im Bild steht — vorher
  // misst man den halben Aufbau. `toBeInViewport` statt einer Wartezeit: die
  // Bedingung ist die Sache selbst, nicht ihre Dauer.
  await expect(page.locator('#art-336_c')).toBeInViewport({ timeout: 20_000 });
  // Nachlauf: die Aufdeck-Klammer im Produktcode steht bei 600 ms; danach darf
  // sich nichts mehr bewegen, und genau das soll die Messung sehen.
  await page.waitForTimeout(2_000);
  const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls);
  expect(cls).toBeLessThan(0.1);
});

// ── D21-NEBENFUND (David 6.9.2026) · DIE GLIEDERUNG WÄCHST NICHT NACH DEM
//    ERSTEN BILD ────────────────────────────────────────────────────────────
//
// BEFUND, wörtlich: die Gliederungs-Einträge («Dritte Abteilung», «Vierte
// Abteilung», «Übergangsbestimmungen», «Schlussbestimmungen») verschieben sich
// rund 1.8–2.0 s nach dem Laden von `/gesetze/bund/OR#art-336_c`.
//
// URSACHE (gemessen, W2·24-R6c): der aktive Pfad klappte erst auf, wenn der
// Scroll-Spy den Zielartikel meldete — nach dem Anker-Einschwingen (Deckel
// 600 ms) plus 200 ms Nachlauf-Entprellung. Der Baum wuchs dabei von 18 auf 62
// Zeilen (Scrollhöhe 1042 → 2285 px) und schob die sichtbaren Geschwister-
// Zeilen aus dem Sichtband. Ohne Nutzer-Eingriff zu dieser Zeit zählt das voll
// als unerwartete Verschiebung: CLS 0.0746, davon 0.0741 in EINEM Shift bei
// t ≈ 1.84 s (3/3 Läufe bitgleich).
//
// GEBAUT: `v3/leserV3Modell.ts` öffnet den Pfad zum Anker in einem LAYOUT-Effekt,
// sobald die Sektionen da sind — also in demselben Render, in dem der Baum zum
// ersten Mal erscheint, und synchron vor dem Paint. Nachher gemessen: CLS
// 0.0006, Anteil im `[data-toc]` 0.0000 (3/3).
//
// WARUM DIESER FALL ZWEI ZAHLEN MISST: der ANTEIL IM BAUM ist die Aussage
// (dort sass der Defekt), die SPÄTE Summe ist die Klammer dagegen, dass er
// bloss woandershin wandert. Ein Deckel auf die Gesamtsumme allein wäre zu
// stumpf — 0.074 verschwinden im 0.1-Budget des Falls darüber.
//
// ROT ZU BEKOMMEN (§6.7): im `useLayoutEffect` «D21-NEBENFUND»
// (`v3/leserV3Modell.ts`) ein frühes `return` setzen — der Shift kommt
// bitgleich zurück (gemessen 6.9.2026: 0.0741 statt 0.0000).
// GEGENPROBE, DIE NICHT TRÄGT und darum hier steht: `useLayoutEffect` durch
// `useEffect` zu ersetzen bleibt GRÜN. Der Gewinn liegt also nicht am
// Effekt-Typ, sondern am ZEITPUNKT der Ursache: der Pfad öffnet, sobald die
// Sektionen da sind (~600 ms), nicht erst, wenn der Spy meldet (~1.8 s).
// `useLayoutEffect` bleibt trotzdem stehen — es ist die Zusage «vor dem Paint»
// und kostet nichts; wer es aufweicht, verlässt sich auf React-Zeitverhalten.
test('CLS Tieflink @1440 — die Gliederung wächst nicht nach dem ersten Bild (D21)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => {
    (window as unknown as { __d21: { spaet: number; toc: number } }).__d21 = { spaet: 0, toc: 0 };
    new PerformanceObserver((liste) => {
      type Q = { node?: Element | null };
      for (const e of liste.getEntries() as unknown as Array<{ value: number; startTime: number; hadRecentInput: boolean; sources?: Q[] }>) {
        if (e.hadRecentInput) continue;
        const z = (window as unknown as { __d21: { spaet: number; toc: number } }).__d21;
        // «Spät» = nach dem ersten Bild. Die Aufdeck-Klammer des Anker-Sprungs
        // steht bei 600 ms; alles danach ist Nachwachsen, nicht Aufbau.
        if (e.startTime > 1000) z.spaet += e.value;
        if ((e.sources ?? []).some((s) => s.node?.closest?.('[data-toc]'))) z.toc += e.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
  await page.goto('/gesetze/bund/OR#art-336_c');
  await expect(page.locator('#art-336_c')).toBeInViewport({ timeout: 20_000 });
  // Der Befund liegt bei t ≈ 1.84 s — 4 s Nachlauf sehen ihn mit Reserve.
  await page.waitForTimeout(4_000);
  const m = await page.evaluate(() => (window as unknown as { __d21: { spaet: number; toc: number } }).__d21);
  // Leer-Treffer-Schutz: der Baum muss überhaupt dagewesen sein, sonst wäre
  // «kein Shift im Baum» trivial erfüllt (§6.7 lit. b).
  expect(await page.locator('[data-toc] li[data-sektion-id]').count(),
    'kein Gliederungsbaum gerendert — der Fall misst nichts').toBeGreaterThan(10);
  expect(m.toc, `Verschiebung im Gliederungsbaum: ${m.toc.toFixed(4)} (Befund D21 war 0.0741)`)
    .toBeLessThan(0.01);
  expect(m.spaet, `Verschiebung nach dem ersten Bild: ${m.spaet.toFixed(4)} (Befund D21 war 0.0741)`)
    .toBeLessThan(0.01);
});
