import { useEffect, useRef, useState } from 'react';
import { LOCALES, useLocale } from './locale';

// Sprachumschalter (Topbar, dezent): de aktiv; en/fr/it funktional, aber
// transparent als «in Bearbeitung» gekennzeichnet (gedämpfte Optik wie
// «In Vorbereitung» im Katalog). Keine maschinelle Übersetzung.

export function SprachUmschalter() {
  const { locale, setLocale } = useLocale();
  const [offen, setOffen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!offen) return;
    const klick = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOffen(false);
    };
    // Escape schliesst und gibt den Fokus an den Auslöser zurück (E13 A11y).
    const taste = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOffen(false); triggerRef.current?.focus(); } };
    document.addEventListener('pointerdown', klick);
    document.addEventListener('keydown', taste);
    return () => {
      document.removeEventListener('pointerdown', klick);
      document.removeEventListener('keydown', taste);
    };
  }, [offen]);

  // Ehrliche Disclosure statt role=menu (E13): das Menü-Muster versprach eine
  // Pfeiltasten-Bedienung, die es nie gab. Jetzt eine schlichte aufklappbare
  // Gruppe normaler Buttons (Tab-Reihenfolge, Escape, Fokus-Rückgabe), der
  // aktive Eintrag wird beim Öffnen fokussiert.
  return (
    <div ref={ref} className="relative">
      <button ref={triggerRef} type="button" onClick={() => setOffen((o) => !o)}
        aria-expanded={offen} aria-label="Sprache wählen"
        /* GB-15 (W2·24): eine Knopf-Form für alle Griffe des Titelblatts
           (Herleitung an `layout/Topbar`, Rezept index.css §GB-15). `uppercase`
           bleibt: der Sprachcode «DE» ist ein Kürzel, kein Etikett — F0.7 zielt
           auf Versal-ETIKETTEN (`.lc-overline`/`.lc-badge`), nicht auf die
           Schreibung eines ISO-Codes. */
        className="lc-topbar-griff gap-1 px-2.5 num text-xs uppercase">
        {locale}
        <span aria-hidden className={`text-ink-500 transition-transform ${offen ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {offen && (
        /* D35-F4 (7.9.2026): 14 rem → 18 rem. GEMESSEN nach dem Umbau
           (Screen `d35-f4-1440-hell-sprache`): mit der Zustands-Marke links
           blieb den Sprachnamen neben der «In Vorbereitung»-Marke so wenig
           Platz, dass sie als «E…» / «Fr…» / «Ital…» kappten. 18 rem (288 px)
           trägt «IT Italiano» samt Marke ganz und bleibt unter dem
           320-px-Deckel, den das Menü-Rezept für eine schwebende Fläche
           setzt. */
        <div role="group" data-menue-flaeche aria-label="Sprache wählen" className="lc-schwebeflaeche absolute right-0 top-full mt-1.5 w-72 max-w-[calc(100vw-1rem)] p-1 z-dropdown">
          {LOCALES.map((l) => {
            const aktiv = l.code === locale;
            return (
              <button key={l.code} type="button" aria-pressed={aktiv} autoFocus={aktiv}
                onClick={() => { setLocale(l.code); setOffen(false); triggerRef.current?.focus(); }}
                // B-M1 (R9-1, 6.9.2026): DAS EINE MENUE-ITEM-REZEPT. Hier stand ein
                // zweites: 14 px/500 auf einer Messing-Flaeche (`bg-brass-100/70`),
                // Radius `rounded-md`, Hover `bg-brass-100/40` — waehrend jedes andere
                // Menue des Hauses (`ui/Menue`, Verlauf, Reiter-Blatt, Ansicht) die
                // Zeile als `.lc-menu-zeile` fuehrt: 14 px/400, Polster 8/12, Haarlinie
                // nach unten, Hover in `--well`, Radius 0, Fokus als Strich. Zwei
                // Rezepte fuer dieselbe Sache (r9-befunde-b.md B-M1).
                // GEAENDERT WIRD NUR DIE KLASSENZEILE: Struktur, Handler, `aria-pressed`,
                // `autoFocus`, das Haekchen rechts und die «In Vorbereitung»-Marke
                // bleiben Zeichen fuer Zeichen. Der gewaehlte Eintrag traegt seinen
                // Zustand weiterhin doppelt — Tinte statt ink-700 UND das ✓ — also
                // nicht allein ueber die Farbe (F2/F4); nur die Flaeche faellt weg
                // (F0.6 «Linien statt Flaechen»).
                // ── D35-F4 (7.9.2026) · DER ZUSTAND STEHT LINKS UND IN BEIDEN
                //    STELLUNGEN ──────────────────────────────────────────────
                // B-M1 hat die Zeile schon auf `.lc-menu-zeile` geholt; das
                // ZUSTANDS-Bild blieb aber das alte: ein Messing-Haken RECHTS,
                // und im nicht gewaehlten Zustand gar nichts. Das ist derselbe
                // Befund, den David am Ansicht-Menue erhoben hat («liest sich
                // wie eine Rubrik, nicht wie ein Schalter»), nur in der
                // Topbar. Die Sprachwahl ist eine WAHL AUS MEHREREN, also
                // traegt sie die Punkt-Form des Rezepts (`lc-menu-punkt-form`),
                // nicht das Kaestchen.
                // FUNKTION UNVERAENDERT: `aria-pressed` traegt die Auskunft wie
                // bisher (das Zeichen ist `aria-hidden`), Handler, `autoFocus`
                // und die «In Vorbereitung»-Marke bleiben Zeichen fuer Zeichen.
                className={`lc-menu-zeile ${aktiv ? 'text-ink-900' : ''}`}>
                <span aria-hidden className="lc-menu-marke">
                  <span data-an={aktiv ? 'an' : 'aus'} data-menu-marke="punkt"
                    className="lc-menu-kasten lc-menu-punkt-form">
                    {aktiv && <span className="lc-menu-punkt-kern" />}
                  </span>
                </span>
                <span className={`lc-menu-label ${l.inBearbeitung ? 'text-ink-500' : ''}`}>
                  <span className="num uppercase text-xs mr-2">{l.code}</span>{l.label}
                </span>
                {l.inBearbeitung && <span className="lc-badge-geplant shrink-0">In Vorbereitung</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
