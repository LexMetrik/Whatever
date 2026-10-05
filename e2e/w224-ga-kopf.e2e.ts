// @shard-gruppe: nacht
// ═══ GA · JEDE ANGABE GENAU EINMAL IM KOPF (W2·24, 7.9.2026) ════════════════
//
// FAHRPLAN-DESIGN-IDENTITAET §5 D4 («Kopf-/Ortsprüfung: jede Angabe genau
// einmal») und DESIGN-REGLEMENT §F0.9 («Keine Brotkrume im Leser») waren bis
// hierher Prosa. Die Gesamtprüfung vom 6.9.2026 hat sie @1440 gemessen und
// dreimal gerissen gefunden (Befunde G4/G5/G6):
//   · Entscheid  «HOR.2024.19» 3× · «Obergericht AG» 3× · Datum 2×
//   · Vorlage    derselbe Titel 4× in 260 px
//   · Rechner    die Brotkrume WORTGLEICH mit der H1, 90 px darüber
// Diese Sonde macht daraus ein Tor.
//
// ── WAS SIE MISST ──────────────────────────────────────────────────────────
// KOPFZONE = die Ortsleiste (`[data-inhalt-kopf]`) + die obersten 300 px von
// `main#inhalt`. Bewusst OHNE Topbar und Reiterleiste: die sind der Rahmen der
// App, nicht der Kopf der Seite — der Reiter SOLL den Ort tragen, das ist
// gerade die Begründung dafür, dass die Leiste darunter ihn nicht mehr trägt.
//
// ANGABE = die H1 und jedes Glied der Overline darüber (die zwei Felder, die
// den Ort benennen). Beide werden wortgrenzen-genau im sichtbaren Text der
// Kopfzone gezählt (CLAUDE.md §7: Identitäts-Treffer, nie Substring-Präsenz).
// Erwartung: genau eine Nennung je Angabe.
//
// ── ZWEIMAL ROT GEFAHREN (§6.7), 7.9.2026 ──────────────────────────────────
// Mutation 1: in `layout/InhaltsKopf.tsx` den Aufruf `ortsLeistenKrumen(…)`
// wieder durch `daten.breadcrumb` ersetzen (= der Stand vor GA-1).
//   3 failed · 0 passed —
//     Entscheid «HOR.2024.19» n=2 (Leiste + H1)
//     Vorlage   «Kündigung durch Arbeitgeber:in» n=2 (Leiste + H1)
//     Rechner   «Verfahrens- & Rechtsmittelfristen» n=2 (Leiste + H1)
// Mutation 2: in `pages/EntscheidLeser.tsx` die Overline wieder bedingungslos
// mit `snap.gerichtName` beginnen lassen (= der Stand vor GA-2).
//   1 failed · 2 passed — Entscheid «Obergericht AG» n=2 (Overline + H1).
// Beides zurückgenommen; danach 3 passed.
import { test, expect } from '@playwright/test'

const ROUTEN: { name: string; pfad: string }[] = [
  { name: 'Entscheid', pfad: '/rechtsprechung/ag_gerichte_HOR_2024_19' },
  { name: 'Vorlage', pfad: '/vorlagen/kuendigung-arbeitgeber' },
  { name: 'Rechner', pfad: '/rechner/zpo-fristen' },
]

for (const { name, pfad } of ROUTEN) {
  test(`${name}: keine Kopf-Angabe steht zweimal in den obersten 300 px`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(pfad)
    await expect(page.locator('main#inhalt h1')).toBeVisible()

    const befund = await page.evaluate(() => {
      const norm = (s: string | null | undefined) => (s ?? '').replace(/\s+/g, ' ').trim()
      const main = document.querySelector('main#inhalt')!
      const grenze = main.getBoundingClientRect().top + 300

      // Sichtbarer Text der Kopfzone, in Dokument-Reihenfolge und OHNE
      // eingefügte Trenner: eine H1 wie «Verfahrens- & Rechtsmittelfristen»
      // ist im DOM auf drei Textknoten verteilt (`components/typografie`
      // setzt das «&» in ein eigenes <span>), und ein Trenner dazwischen
      // hätte die Angabe zerschnitten, statt sie zu zählen. Gezählt wird
      // darum über TEXTKNOTEN, nicht über Elemente.
      // Blockkasten eines Textknotens: der nächste Vorfahr, der KEIN Inline-
      // Kasten ist. Innerhalb eines Blocks wird ohne Trenner gefügt (sonst
      // zerfiele die H1), zwischen zwei Blöcken mit « · » (sonst liefen
      // «Privatrecht» und «Obergericht …» zu einem Wort zusammen und keine
      // Wortgrenze träfe mehr).
      const block = (el: Element): Element => {
        for (let e: Element | null = el; e; e = e.parentElement) {
          if (!getComputedStyle(e).display.startsWith('inline')) return e
        }
        return el
      }
      const stuecke: string[] = []
      let vorigerBlock: Element | null = null
      const sammle = (wurzel: Element | null, obergrenze: number) => {
        if (!wurzel) return
        const lauf = document.createTreeWalker(wurzel, NodeFilter.SHOW_TEXT)
        for (let k = lauf.nextNode(); k; k = lauf.nextNode()) {
          const roh = k.nodeValue ?? ''
          if (!roh.trim()) continue
          const el = k.parentElement
          if (!el) continue
          const r = el.getBoundingClientRect()
          if (r.width === 0 && r.height === 0) continue
          if (r.top >= obergrenze) continue
          const b = block(el)
          if (vorigerBlock && b !== vorigerBlock) stuecke.push(' · ')
          vorigerBlock = b
          stuecke.push(roh)
        }
      }
      sammle(document.querySelector('[data-inhalt-kopf]'), Number.POSITIVE_INFINITY)
      vorigerBlock = null
      sammle(main, grenze)
      const text = norm(stuecke.join(''))

      const h1 = norm(main.querySelector('h1')?.textContent)
      const overline = norm(main.querySelector('.lc-overline')?.textContent)
      // Die Overline fügt ihre Glieder mit « · » (KopfOverline); jedes Glied
      // ist eine eigene Angabe und wird einzeln gezählt.
      // Dazu jede Krume der Ortsleiste: sie nennt oft nur den TEIL der H1, der
      // die Identität trägt («HOR.2024.19» gegen «Obergericht AG HOR.2024.19
      // vom 12.12.2025») — genau die Dopplung aus G4, die ein Vergleich der
      // ganzen H1 nicht sieht.
      const krumen = [...document.querySelectorAll('[data-inhalt-kopf] nav a, [data-inhalt-kopf] nav button, [data-inhalt-kopf] nav > span > span')]
        .map((e) => norm(e.textContent))
      const angaben = [h1, ...overline.split('·').map(norm), ...krumen].filter((a) => a.length >= 4)
      return { h1, overline, text, angaben: [...new Set(angaben)] }
    })

    const meta = /[.*+?^${}()|[\]\\]/g
    const zaehle = (heu: string, nadel: string) => {
      const roh = nadel.replace(/\s+/g, ' ').trim()
      const teile = roh.split(' ').map((w) => w.replace(meta, '\\$&'))
      const vorn = /^[0-9A-Za-z_]/.test(roh) ? '\\b' : ''
      const hinten = /[0-9A-Za-z_]$/.test(roh) ? '\\b' : ''
      return (heu.match(new RegExp(`${vorn}${teile.join('\\s+')}${hinten}`, 'g')) ?? []).length
    }

    expect(befund.angaben.length, `${name}: keine Kopf-Angabe gefunden`).toBeGreaterThan(0)
    const doppelt = befund.angaben
      .map((a) => ({ angabe: a, n: zaehle(befund.text, a) }))
      .filter((x) => x.n !== 1)
    expect(doppelt, `${name} · Kopfzone «${befund.text}»`).toEqual([])
  })
}
