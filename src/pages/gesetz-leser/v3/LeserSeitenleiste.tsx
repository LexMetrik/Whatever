import { useCallback, type ReactNode } from 'react';

// ─── Seitenleiste V3 — feste Reihenfolge, nur der Baum klebt (Kap. 4b) ──────
//
//   ▸ Übersicht  (SR 312.0 · 480 Art. · Stand …)        scrollt MIT weg
//   Gliederung        [alles auf/zu]   [↑ Anfang]       ◀ ab hier sticky
//   ══════════════════════════════════════ 2-px-Kopflinie (Werkbank, W2·29 S3)
//    1. Teil … / 1. Titel …
//
// DREI ENTSCHEIDE, DIE HIER MARKUP WERDEN:
//  ① EINE Übersichtsbox statt drei (Fedlex hat drei) — und sie klebt NICHT:
//    SR-Nummer und Stand braucht man beim Ankommen, der Platz gehört dem Baum.
//  ② Kein Such-/Sprungfeld: es lebt seit D28 (David 6.9.2026) im klebenden
//    Kopf-Block des Lesers (`./SuchZone`) — GENAU EIN Feld für Suche und Sprung.
//  ③ Der Baum klebt ab seiner eigenen Kopfzeile — «alles auf/zu» als sichtbarer
//    Knopf OHNE Tastenkürzel: ein globales Auf/Zu ist im W3C-ARIA-APG kein
//    Baum-Standard (Kap. 4b, Pos. 16). «↑ Anfang» genau EINMAL pro Seite (Pos. 15).
//
// Reine Anordnung (§3): Übersicht und Baum kommen fertig herein; die Leiste
// kennt weder Erlass noch Suchzustand — in Spalte und Bottom-Sheet dasselbe
// Bauteil (`./leisteAufbau`).
//
// W2·29 S3 (23.9.2026): der Schalter `baumKnoepfe` und das Weiterreichen von
// «↑ Anfang» (Slot `anfangSlot.ts`, Ä94) sind gestrichen — beide dienten der
// Lage «Sheet zeigt die Trefferliste», die es seit D38 (7.9.2026) nicht mehr
// gibt; die Kopfzeile steht damit in jedem Zustand (§17: gestrichen statt
// bewacht). Den Empfang hat S4 zurückgebaut, die Slot-Datei ist mit S3 gelöscht.

export function LeserSeitenleiste({
  uebersicht, baum, baumTitel, onAlleAuf, onAlleZu, onAnfang, alleOffen,
}: {
  /** Übersichtsbox (Kap. 4b ①). `null` = noch nicht ladbar ⇒ Zeile entfällt. */
  uebersicht?: ReactNode;
  /** Der Gliederungsbaum (`./LeserGliederung`). */
  baum: ReactNode;
  /** Überschrift über dem klebenden Block. Ä10 (H2b): `undefined` = KEINE —
   *  im Bottom-Sheet benennt der Sheet-Kopf die Zone schon (gemessen 17.8.2026:
   *  «Gliederung» zweimal übereinander). */
  baumTitel?: string;
  onAlleAuf: () => void;
  onAlleZu: () => void;
  /** «↑ Anfang» — genau EIN Knopf pro Seite (Pos. 15), mit Text-Label. */
  onAnfang: () => void;
  /** Steuert nur die Beschriftung des einen Knopfes (auf/zu), kein Zustand. */
  alleOffen: boolean;
}) {
  // ── W-1 · Zone A publiziert ihre Höhe als `--toc-deckel` (Befund 16.8.2026) ─
  // Die Trefferliste klebt mit `top: var(--toc-deckel, 0px)`; ohne die Marke
  // klebten sie und Zone A beide bei 0 (gemessen: die Facetten-Leiste legte sich
  // über das Feld). Zone A misst sich selbst und legt die Höhe auf den
  // `[data-toc]`-Scroller — reine Geometrie, kein State (§15). Der
  // `ResizeObserver` folgt Umbrüchen der Kopfzeile. Kein Cleanup-Rückgabewert:
  // ein Callback-Ref darf keinen liefern; der Observer stirbt mit dem Element.
  const zoneARef = useCallback((el: HTMLDivElement | null) => {
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ziel = el.closest('[data-toc]') as HTMLElement | null;
    if (!ziel) return;
    const setze = () => ziel.style.setProperty('--toc-deckel', `${Math.round(el.getBoundingClientRect().height)}px`);
    setze();
    const ro = new ResizeObserver(setze);
    ro.observe(el);
  }, []);

  return (
    // `flex-1 min-h-0` statt `h-full`: der Vorfahre hat eine `max-height`, KEINE
    // feste Höhe, und `height:100%` löst dagegen nicht auf (CSS-Spec) — der
    // Scroller wuchs sonst auf volle Inhaltshöhe und schnitt stumm ab (OR @1440).
    <div data-v3-leiste className="flex min-h-0 flex-1 flex-col">
      {/* EIN Scroller für den ganzen Block; sticky wirkt darin. `data-toc` ist
          KEIN Testhaken, sondern der Anschluss an die GETEILTE Mechanik: der
          Scroll-Spy (`inhalt-hooks.tsx`) führt darüber die aktive Baumzeile mit
          (P9b/A33) und hängt den Nutzer-Interaktions-Guard an.
          LM-064 (B8, 31.8.2026): `lc-scrollrand-y` kündigt den Schnitt am
          unteren Rand an (geteilte Affordanz, index.css `lc-scrollrand`) — ein
          frei scrollender Kasten kann nicht zeilenrein enden, ein `scroll-snap`
          käme dem Spy und `tocAutoZuklappen` in die Quere. */}
      <div data-toc data-v3-leiste-scroller className="lc-scrollrand-y min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain pr-2 [scrollbar-width:thin]">
        {uebersicht && (
          <div data-v3-leiste-uebersicht className="mb-3">{uebersicht}</div>
        )}
        {/* Ab hier klebt es. Der Sockel ist OPAK (sonst liefe der Baum sichtbar
            darunter durch) und trägt die Fläche seines BEHÄLTERS
            (`.lc-leiste-sockel` liest `--leser-leiste-flaeche`, Ä5 — im Sheet
            `paper-raised`). `data-toc-zone-a`: der Mitscroll-Nudge misst daran,
            wie viele oberste Pixel des Scrollers der Sockel verdeckt. */}
        <div ref={zoneARef} data-toc-zone-a data-v3-leiste-baumkopf
          className="lc-leiste-sockel sticky top-0 z-sticky -mt-0.5 space-y-2 pb-2 pt-0.5">
          {/* W2·29 S3: die Kopfzeile der Spalte trägt die 2-px-Tintenlinie der
              Werkbank (F0.6, `--rule`) — im Sheet steht keine Überschrift, dort
              trennt der Sheet-Kopf. */}
          <div className={`flex items-center gap-2 ${baumTitel ? 'justify-between border-b-2 border-rule pb-1.5' : 'justify-end'}`}>
            {baumTitel && <h2 className="lc-overline font-semibold text-ink-600">{baumTitel}</h2>}
            <div className="flex shrink-0 items-center gap-1">
              <button type="button" data-v3-alle
                onClick={alleOffen ? onAlleZu : onAlleAuf}
                aria-expanded={alleOffen}
                title={alleOffen ? 'Alle Gliederungsstufen zuklappen' : 'Alle Gliederungsstufen aufklappen'}
                className="lc-leiste-griff gap-1 px-1.5 text-micro">
                <span aria-hidden>{alleOffen ? '⌃' : '⌄'}</span>
                <span>{alleOffen ? 'alles zu' : 'alles auf'}</span>
              </button>
              <button type="button" data-v3-anfang onClick={onAnfang}
                title="Zum Anfang des Erlasses"
                className="lc-leiste-griff gap-1 px-1.5 text-micro">
                <span aria-hidden>↑</span><span>Anfang</span>
              </button>
            </div>
          </div>
        </div>
        {/* `data-toc-baum` — wie `data-toc` ein geteilter Anschluss: die Taste
            «t» (`parts/LeserTastatur`) setzt den Fokus auf das erste Ziel im
            BAUM (sonst traf sie den Quell-Link im Steckbrief, B7 18.8.2026). */}
        <div data-v3-leiste-baum data-toc-baum>{baum}</div>
      </div>
    </div>
  );
}
