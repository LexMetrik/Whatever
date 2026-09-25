import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUniversalSuche } from '../suche/useUniversalSuche';
import { SuchResultate } from '../suche/SuchResultate';
import { SucheLeerzustand } from '../suche/SucheLeerzustand';
import { leerOptionen } from '../suche/SucheLeerzustandKontext';
import { aktivePosition, flacheTreffer, naechsterKey, vorigerKey, gewaehlterHref } from '../suche/trefferAuswahl';
import { useZuletzt } from './useZuletzt';
import { usePaneSteuerung } from './usePaneLayout';
import { SchliessKnopf } from '../ui/SchliessKnopf';
import { suchKuerzelEmpfaengerAbmelden, suchKuerzelEmpfaengerAnmelden } from '../suche/fruehesSuchKuerzel';

// ── D23 (David 6.9.2026) · EIN PLATZHALTER, UND ZWAR EIN KURZER ─────────────
// Davids Befund am Bild: «Platzhalter ‹Suchen oder Norm springen (z. B. ‹OR
// 257d›) …› zu lang, wird abgeschnitten»; sein Soll wörtlich: «Platzhalter
// kurz: ‹Suchen · ‹OR 257d› springt zum Artikel›».
// Damit fällt die ganze LM-124-Mechanik (Canvas-`measureText` +
// ResizeObserver + MutationObserver am Wurzel-Element), die den LANGEN Satz
// gegen den freien Platz mass und bei Enge auf einen zweiten Text umschaltete:
// es gibt keinen langen Satz mehr, den man messen könnte. Rückbau statt
// Bewachung (§17-Gegengewicht) — der Befund, den LM-124 löste, kann an einem
// Text, der überall passt, nicht mehr auftreten; und wo eine Fläche doch
// einmal enger wird als der Satz, kürzt seit LM-067/068 die
// `text-overflow: ellipsis`-Regel in `.lc-input` sichtbar statt hart.
const PLATZHALTER = 'Suchen · «OR 257d» springt zum Artikel';

// ── SCROLL-KAPPUNG DES KOPF-DROPDOWNS ───────────────────────────────────────
// Im Header intern scrollbar (David 28.6.): die geöffnete Trefferfläche wächst
// sonst unbegrenzt aus dem Top-Streifen heraus. Sie sitzt an der LISTBOX, nicht
// an der Hülle — Herleitung bei `SuchResultate.panelKlasse` (axe
// `scrollable-region-focusable` nimmt genau das Combobox-Popup aus, und ein
// `tabIndex={-1}` an der Hülle genügt der Regel nicht). Nur der HEADER-Pfad ist
// gekappt; Hero und `/suche` nutzen dieselbe `SuchResultate` ungekappt.
const SCROLL_KAPPUNG = 'max-h-[70vh] overflow-y-auto overscroll-contain';

// ─── Globale Suche im Top-Streifen (UI-Welle: Dropdown überall) ─────────────
//
// EIN Feld über Rechner+Vorlagen, Fristen-Vorlagen, Gesetze und Rechtsprechung
// — Treffer erscheinen als Dropdown DIREKT unter dem Feld, auf JEDER Seite
// (Auftrag David: «Resultate überall im Drop-down-Menü»). Kein ?q=-Umweg, kein
// /recherche mehr. Reine Darstellung/Navigation (§3): Trefferlogik liegt im
// geteilten Hook useUniversalSuche (§5).
//
// A5 (David 5.7.2026): der Norm-Sprung («OR 257d» → Deep-Link) sitzt jetzt HIER,
// nicht mehr in einer eigenen ⌘K-Palette — der Hook liefert die Sprung-Gruppe als
// obersten Treffer, Enter springt. «/» UND ⌘K/Ctrl-K fokussieren das Feld global
// (die frühere Befehls-Palette ist entfallen); mobil reicht das sichtbare Feld.
export function HeaderSuche({ onFokusModus, onFokusZurueck }: {
  /** S6: meldet dem Top-Streifen, dass das Feld mobil die volle Breite braucht
   *  (Logo/Werkzeuge weichen so lange). Nur mobil je true. */
  onFokusModus?: (aktiv: boolean) => void;
  /** Fokus-Ziel nach dem ✕: der Streifen sagt, wohin die Tastatur zurückkehrt. */
  onFokusZurueck?: () => void;
} = {}) {
  const navigate = useNavigate();
  const { oeffneDaneben, kannOeffnen } = usePaneSteuerung();
  const listboxId = useId();
  const [wert, setWert] = useState('');
  const [q, setQ] = useState('');
  const [offen, setOffen] = useState(false);
  const feld = useRef<HTMLInputElement>(null);
  const huelle = useRef<HTMLDivElement>(null);

  // S6 — MOBILER SUCH-FOKUSMODUS. Auf 390 px teilt sich das Feld den Streifen mit
  // Logo, Menü-Schalter und vier Werkzeug-Knöpfen; es blieben ~40 % der Breite,
  // in denen eine getippte Query («arbeitsvertrag kündigung») nie ganz lesbar
  // war. Solange die Suche offen ist, weichen die Nachbarn (Topbar) und ein ✕
  // führt zurück. Die Grenze ist dieselbe sm-Schwelle (640 px) wie im übrigen
  // Layout und folgt Rotation/Resize (Muster AzRegister).
  const [istMobil, setIstMobil] = useState(() =>
    typeof window === 'undefined' ? false : !window.matchMedia('(min-width: 640px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)');
    const auf = () => setIstMobil(!mq.matches);
    mq.addEventListener('change', auf);
    return () => mq.removeEventListener('change', auf);
  }, []);

  // Debounce: Eingabe → Such-Query (~120 ms) — stösst zugleich das Lazy-Laden an.
  useEffect(() => {
    const id = setTimeout(() => setQ(wert.trim()), 120);
    return () => clearTimeout(id);
  }, [wert]);

  const { gruppen, allesGeladen, vorschlag, abdeckung } = useUniversalSuche(q);

  // Enter-Puffer (S3/#52): Wird Enter gedrückt, BEVOR Treffer geladen sind (mobil
  // trifft die «Suchen»-Taste sonst ins Leere), merkt sich das Feld die Query und
  // öffnet den obersten Treffer, sobald geladen. `wert.trim()`, weil `q` dem
  // Debounce nachhängt; bei weiterem Tippen wird der Puffer verworfen (onChange).
  const [enterQ, setEnterQ] = useState<string | null>(null);

  // Flache Trefferliste + Pfeil-Auswahl über einen STABILEN Treffer-Key (die
  // oid), NICHT über einen Positions-Index — identisch zum Hero (EIN Suchweg,
  // §5); geteilte Options-IDs via suchOptionId. Wächst die per useDeferredValue
  // entkoppelte Artikelgruppe (§15.3/#183) einen Tick später ein und verschiebt
  // die Positionen, folgt die Auswahl dem SEMANTISCH gleichen Treffer statt auf
  // einen fremden umzuspringen (Race-Fix #210, Logik in trefferAuswahl.ts).
  // flacheTreffer (SSoT, §5) enthält am Gruppenende auch die «alle N Treffer»-
  // Option (mehrHref) — so ist der Sprung auch per Tastatur erreichbar (a11y).
  const flach = flacheTreffer(gruppen, listboxId);
  // UI-NAV O1: das Feld öffnet auch LEER (⌘K/Fokus) → Verlauf + kuratierte
  // Einstiege (SucheLeerzustand). `feldLeer` an `wert` (nicht am nachhängenden `q`),
  // damit der Leerzustand beim ersten Tastendruck sofort den Treffern weicht.
  const feldLeer = wert.trim() === '';
  const zeigtPanel = offen && !feldLeer;
  const zeigtLeer = offen && feldLeer;
  // Befund 38 (21.8.2026): EIN geteilter useZuletzt()-Aufruf für Anzeige UND
  // Pfeiltasten-Navigation (leerOptionen) — dieselbe Liste, kein zweiter, evtl.
  // abweichender Hook-Stand in SucheLeerzustand. Die Listbox-Options-Liste des
  // Leerzustands hat einen eigenen Namensraum (Gruppen «verlauf»/«einstieg»,
  // suchOptionId) und kollidiert nie mit den Treffer-oids aus `flach`.
  const verlauf = useZuletzt().slice(0, 5);
  const flachLeer = useMemo(() => leerOptionen(verlauf, listboxId), [verlauf, listboxId]);
  // Aktive Pfeil-Auswahl: EIN Key-State über beide Listen hinweg (Panel/Leer sind
  // nie gleichzeitig sichtbar, s. zeigtPanel/zeigtLeer oben) — welche Liste
  // gerade gilt, entscheidet `feldLeer`.
  const aktivListe = feldLeer ? flachLeer : flach;
  const [aktivKey, setAktivKey] = useState<string | null>(null);
  // Bei neuer Query ODER beim Wechsel leer↔Treffer zurücksetzen (Render-Phasen-
  // Abgleich statt setState-im-Effekt) — sonst zeigt aria-activedescendant auf
  // eine oid aus der jeweils ANDEREN Liste (harmlos dank aktivePosition-Fallback
  // -1, aber unnötig verwirrend beim Umschalten).
  const [letzterStand, setLetzterStand] = useState({ q, feldLeer });
  if (q !== letzterStand.q || feldLeer !== letzterStand.feldLeer) {
    setLetzterStand({ q, feldLeer });
    setAktivKey(null);
  }
  const aktivPos = aktivePosition(aktivListe, aktivKey);
  // Fokusmodus = mobil UND Suche offen. Bewusst an `offen` gekoppelt statt an ein
  // eigenes onFocus/onBlur: ein Blur feuert auch beim Antippen eines Treffers —
  // der Streifen würde mitten im Tap neu umbrechen und den Tap verschieben.
  // `offen` endet dagegen genau dort, wo die Suche endet (✕, Escape, Klick
  // ausserhalb, Trefferwahl).
  const breit = istMobil && offen;
  useEffect(() => { onFokusModus?.(breit); }, [breit, onFokusModus]);
  // Beim Verlassen der Komponente den Streifen nicht im Fokusmodus zurücklassen.
  useEffect(() => () => onFokusModus?.(false), [onFokusModus]);
  const aktivId = (zeigtPanel || zeigtLeer) && aktivPos >= 0 ? aktivListe[aktivPos].oid : undefined;

  // ── C1/B10/L3 (Design-Review 29.8.2026) · DER FOKUS-WUNSCH ÜBERLEBT EIN RENDER
  // Unter 480 px steht das Feld im Ruhezustand nicht im Bild (Lupen-Modus, s.
  // unten) — `focus()` auf ein `display:none`-Element verpufft still. Der Wunsch
  // wird darum gemerkt und eingelöst, sobald das Feld sichtbar IST. Über 480 px
  // ist das Feld immer sichtbar, der Zweig wird nie betreten, das Verhalten
  // (⌘K/«/»/CTA) ist unverändert.
  const fokusWunschFeld = useRef(false);
  const fokussiere = useCallback(() => {
    // UI-NAV O1: immer öffnen — leer erscheint der Verlauf-/Einstieg-Leerzustand.
    setOffen(true);
    const el = feld.current;
    if (el && el.offsetParent !== null) { el.focus(); el.select(); }
    else fokusWunschFeld.current = true;
  }, []);
  useEffect(() => {
    if (!fokusWunschFeld.current) return;
    const el = feld.current;
    if (!el || el.offsetParent === null) return;
    fokusWunschFeld.current = false;
    el.focus();
    el.select();
  });

  // Globale Fokus-Shortcuts: «/» UND ⌘K/Ctrl-K fokussieren das Feld (A5 — die
  // frühere Palette ist entfallen, der Shortcut bleibt nützlich). In Eingabe-
  // feldern greift «/» nicht (normales Zeichen), ⌘K/Ctrl-K schon (globaler
  // Einstieg von überall). Bis 24.9.2026 lauschte das Feld zusätzlich auf das
  // Fenster-Ereignis «lm:suche-fokus»; einziger Sender war zuletzt der «+» der
  // Reiterleiste (der hier genannte /gesetze-Landeplatz-CTA sendete es nicht
  // mehr — grep 24.9.2026: 0 Sender ausser `Reiterleiste.neuerReiter`). Seit
  // R15 (David 24.9.2026: «… und es nicht automatisch in suchen landet»)
  // sendet niemand mehr — der Lauscher ist ersatzlos gestrichen
  // (§17-Gegengewicht: was nichts mehr auslöst, wird gestrichen, nicht
  // bewacht). Der aktuelle Feldwert wird
  // direkt vom DOM-Element gelesen (kein stale-closure über `wert`), das Panel
  // öffnet nur bei bereits vorhandenem Text (leeres Feld bleibt ruhig).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // VORRANGREGEL (Bug-Check B1 zu Leser V3, 16.8.2026): Wer denselben
      // Tastendruck in der CAPTURE-Phase schon beansprucht hat, gewinnt. Der
      // V3-Leser tut das für sein Such-/Sprungfeld (`v3/suchKuerzel.ts`) —
      // ohne diese Zeile öffnete ⌘K/«/» dort BEIDES: hier synchron das
      // Dropdown, dort einen Frame später den Fokus, und das Dropdown blieb
      // sichtbar über der Lesefläche stehen. Einzige Änderung an dieser Datei;
      // ausserhalb des V3-Lesers ruft niemand `preventDefault` in Capture, das
      // Verhalten bleibt also unverändert.
      if (e.defaultPrevented) return;
      if ((e.metaKey || e.ctrlKey) && !e.altKey && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        fokussiere();
        return;
      }
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      const ziel = e.target as HTMLElement | null;
      if (ziel && (/^(INPUT|TEXTAREA|SELECT)$/.test(ziel.tagName) || ziel.isContentEditable)) return;
      e.preventDefault();
      fokussiere();
    };
    window.addEventListener('keydown', handler);
    // VORLAUF (§17-Wurzel-Fix 4.9.2026): dieser Effekt läuft erst nach dem
    // ersten React-Commit. Ein ⌘K aus dem Fenster davor hat `main.tsx` gemerkt
    // — hier wird es eingelöst. Ab der Anmeldung hält sich der Vorlauf heraus,
    // die Mechanik oben (samt Vorrangregel B1) bleibt die einzige, die zählt.
    suchKuerzelEmpfaengerAnmelden(fokussiere);
    return () => {
      suchKuerzelEmpfaengerAbmelden(fokussiere);
      window.removeEventListener('keydown', handler);
    };
  }, [fokussiere]);

  // Klick ausserhalb / Escape schliesst das Dropdown (Klick auf einen Treffer
  // navigiert via Link und ruft onAuswahl, das hier ebenfalls schliesst).
  useEffect(() => {
    if (!offen) return;
    const aus = (e: PointerEvent) => { if (huelle.current && !huelle.current.contains(e.target as Node)) setOffen(false); };
    // D2/D3 (W2·24-Gesamtprüfung 7.9.2026): `<input type="search">` löscht
    // seinen Wert bei Escape NATIV (Chromium) und feuert dabei sein eigenes
    // 'input'-Event — dessen `onChange` (unten am Feld) rief im SELBEN
    // Tastendruck erneut `setOffen(true)` auf und überschrieb den gerade
    // gesetzten Schliess-Zustand (D3: `aria-expanded` blieb `true`, bis ein
    // zweiter Esc griff). `preventDefault` unterdrückt die native Löschung;
    // dieselben State-Setzer wie `auswahl()` (unten, nach einer echten
    // Trefferwahl) leeren Feld/Query/Panel deterministisch über React-State
    // — inline statt über `auswahl()` selbst, weil die Deklarationsreihenfolge
    // sonst `react-hooks/immutability` verletzt (der Effekt liegt vor ihr).
    // KEIN `feld.current?.blur()` mehr (D2): der Fokus bleibt im Feld —
    // Vorbild ist die Erlass-Suche im Leser (`SuchSprungFeld.tsx`), die auf
    // Esc ebenfalls nur leert und nie defokussiert.
    const esc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      setOffen(false); setWert(''); setQ(''); setAktivKey(null); setEnterQ(null);
    };
    window.addEventListener('pointerdown', aus);
    window.addEventListener('keydown', esc);
    return () => { window.removeEventListener('pointerdown', aus); window.removeEventListener('keydown', esc); };
  }, [offen]);

  const auswahl = () => { setOffen(false); setWert(''); setQ(''); setAktivKey(null); setEnterQ(null); };

  // Übernimmt einen «Meinten Sie …?»-Vorschlag als neue Query (S3).
  const uebernehmeVorschlag = (begriff: string) => { setWert(begriff); setQ(begriff); setOffen(true); setAktivKey(null); };

  // Gepufferten Enter auslösen, sobald der Index geladen UND der Debounce
  // eingeholt ist (enterQ === q). Öffnet den obersten Treffer der ersten
  // nicht-leeren Gruppe; gibt es keinen (echte Nulltreffer/BGE nicht im Bestand),
  // bleibt das Panel mit der ehrlichen Auskunft stehen (§8).
  useEffect(() => {
    if (enterQ === null) return;
    if (!allesGeladen || enterQ !== q) return;
    const ziel = gruppen.find((g) => g.treffer.length > 0)?.treffer[0]?.href;
    // Deferred, damit kein synchrones set-state-in-effect kaskadiert (Repo-Muster).
    const id = window.setTimeout(() => {
      setEnterQ(null);
      if (ziel) { navigate(ziel); setOffen(false); setWert(''); setQ(''); setAktivKey(null); }
    }, 0);
    return () => window.clearTimeout(id);
  }, [enterQ, q, allesGeladen, gruppen, navigate]);

  // Aktiven Treffer in den sichtbaren Bereich rollen (lange Trefferliste).
  useEffect(() => {
    if (aktivId) document.getElementById(aktivId)?.scrollIntoView({ block: 'nearest' });
  }, [aktivId]);

  // Pfeil-/Enter-Navigation wie im Hero (§5): Enter öffnet den hervorgehobenen
  // bzw. — ohne Auswahl — den obersten Treffer der ersten nicht-leeren Gruppe.
  // Läuft über `aktivListe` (Treffer ODER Leerzustand-Optionen, je nach
  // `feldLeer`) — Befund 38: Pfeiltasten navigieren die Vorschläge, TAB bleibt
  // dagegen dem Browser überlassen und verlässt das Feld sofort (kein eigener
  // Tab-Handler hier — genau das ist der Fix).
  const aufTaste = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' && aktivListe.length > 0) {
      e.preventDefault();
      setOffen(true);
      setAktivKey((k) => naechsterKey(aktivListe, k));
    } else if (e.key === 'ArrowUp' && aktivListe.length > 0) {
      e.preventDefault();
      setAktivKey((k) => vorigerKey(aktivListe, k));
    } else if (e.key === 'Enter') {
      const ziel = gewaehlterHref(aktivListe, aktivKey)
        ?? (feldLeer ? undefined : gruppen.find((g) => g.treffer.length > 0)?.treffer[0]?.href);
      // ── W2·24 §5a Ziff. 7 · ZWEI ZUSATZ-TASTEN, ZWEI ZIELE ─────────────────
      // Ctrl/⌘+Enter = «in neuem Reiter», wörtlich wie die Ziffer es verlangt.
      // Bis zum R2-Nachzug war das eine Zusage ohne Wirkung, weil JEDE
      // Navigation ohnehin einen Reiter anlegte (`TabTracker` → `merkeTab`);
      // seit §5a Ziff. 3 gebaut ist (die Navigation ERSETZT den aktiven
      // Reiter), hat sie ihre Bedeutung: der Treffer geht auf, OHNE den Reiter
      // zu verbrauchen, aus dem man kommt. Der Navigations-State
      // `lmNeuerReiter` sagt das dem Tracker (`components/TabTracker.tsx`).
      // Alt+Enter = «daneben öffnen» (zweites FENSTER). Das war bis 6.9.2026
      // die Belegung von Ctrl/⌘+Enter; sie ist nicht entfallen, sondern
      // umgezogen — und bleibt wie bisher an `kannOeffnen` gebunden (ab lg,
      // freie Kapazität), damit keine Taste ins Leere zusagt (§8).
      if (ziel && e.altKey && kannOeffnen) {
        e.preventDefault();
        oeffneDaneben(ziel);
        auswahl();
        return;
      }
      if (ziel && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        navigate(ziel, { state: { lmNeuerReiter: true } });
        auswahl();
        return;
      }
      if (ziel) { navigate(ziel); auswahl(); }
      else if (!feldLeer && wert.trim() !== '') { setEnterQ(wert.trim()); setOffen(true); } // Puffer: öffnen, sobald geladen
    }
  };

  return (
    <div ref={huelle} className="relative" role="search">
      <input
        ref={feld}
        type="search"
        value={wert}
        onChange={(e) => { setWert(e.target.value); setOffen(true); setEnterQ(null); }}
        onFocus={() => setOffen(true)}
        onKeyDown={aufTaste}
        // D23: EIN kurzer Satz, der das Sprung-Beispiel trägt (Herleitung oben).
        placeholder={PLATZHALTER}
        // text-base (16 px) UNTER sm: alles darunter löst in iOS Safari beim
        // Fokus einen Seiten-Zoom aus, aus dem der Nutzer von Hand wieder
        // herausfinden muss (S6). Ab sm bleibt die kompakte Streifen-Grösse.
        // C1/B10/L3: unter 480 px weicht das FELD im Ruhezustand der Lupe (s.
        // unten) — geöffnet (`breit`) steht es dort über die volle Streifenbreite.
        // `lc-suchpanel-feld` (F5, index.css): solange das Panel offen ist, trägt
        // der Unterstrich des Feldes DIESELBE Linie wie der Panel-Rahmen darunter
        // (`--rule`) — im Dunkel standen dort zwei verschiedene Farben an einer
        // Kante. Herleitung samt Fokus-Nachweis an der Klasse selbst.
        className={`lc-input lc-suchpanel-feld h-11 py-0 text-base sm:text-body-s w-full lg:pr-9 ${breit ? 'pr-11' : 'pr-0 max-[480px]:hidden'}`}
        aria-label="LexMetrik durchsuchen oder zur Norm springen"
        aria-keyshortcuts="/ Meta+K Control+K"
        autoComplete="off"
        role="combobox"
        // Befund 38: aria-expanded/-controls galten bisher NUR im Treffer-Panel —
        // der Leerzustand (SucheLeerzustand) öffnete visuell denselben Dropdown,
        // meldete das aber nicht (aria-expanded blieb false). Beide Panel-Arten
        // sind jetzt dieselbe ARIA-Listbox (`listboxId`), also gilt dieselbe
        // Bedingung für beide.
        aria-expanded={zeigtPanel || zeigtLeer}
        aria-controls={(zeigtPanel || zeigtLeer) ? listboxId : undefined}
        aria-activedescendant={aktivId}
        aria-autocomplete="list"
      />
      {/* ── C1/B10/L3 (Design-Review 29.8.2026) · UNTER 480 px EINE LUPE ───────
          BEFUND, gemessen 29.8.2026 (Chromium, `vite preview`, warmer Zustand):
          das Feld war @320 und @375 genau 28 px breit — ein leerer Rahmen ohne
          Lupe, ohne Platzhalter, ohne erkennbaren Zweck. Es ist `flex-1 min-w-0`
          und gibt allen anderen Streifen-Elementen nach, bis nichts mehr da ist.
          Der Review las das als Leser-Eigenheit; nachgemessen tritt es auf JEDER
          Route auf, sobald Verlauf und ein Reiter existieren (Messreihe im
          Commit zu C2).
          DIE ENTSCHEIDUNG: unter 480 px ist ein 28-px-Feld keine kleine Suche,
          sondern gar keine. Dort steht ein 44-px-Ziel mit Lupe; ein Tap darauf
          schaltet in den Fokusmodus, den es seit S6 ohnehin gibt — Feld über die
          volle Streifenbreite, Nachbarn weichen, ✕ zurück. Kein zweites Overlay,
          kein zweiter Zustand: derselbe `offen`-Zustand, dieselbe Trefferfläche.
          Ab 480 px ist alles unverändert (Gegenprobe im Tor
          `e2e/topbar-kein-ueberlauf-320.e2e.ts`).
          Warum ein Knopf und keine reine `min-width` am Feld: 44 px Mindestbreite
          hätten das Feld nur wieder zum leeren Rahmen gemacht, in dem nichts
          lesbar ist — die Untergrenze löst die Sichtbarkeit, nicht die
          Benutzbarkeit (§8: nichts anbieten, was in dieser Grösse nicht trägt). */}
      {!breit && (
        <button
          type="button"
          data-suche-lupe
          onClick={fokussiere}
          aria-label="LexMetrik durchsuchen oder zur Norm springen"
          aria-keyshortcuts="/ Meta+K Control+K"
          /* GB-15 (W2·24): eine Knopf-Form für alle Griffe des Titelblatts
             (Herleitung an `layout/Topbar`, Rezept index.css §GB-15). */
          className="lc-topbar-griff hidden max-[480px]:inline-flex shrink-0"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
            <line x1="15.8" y1="15.8" x2="20" y2="20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      )}
      {/* Dezenter Shortcut-Hinweis (⌘K/Ctrl-K fokussiert das Feld). Nur Desktop,
          nicht interaktiv (pointer-events-none) — die Bedienung ist das Feld
          selbst, mobil reicht es ohne Hinweis (A5).
          D23 (6.9.2026): «⌘K-Marke rechts aussen, ink-3» — sie sass bei
          `right-2.5` MITTEN im Feld, in `.num` (Tabellenziffern) und ink-600.
          Jetzt an der rechten Feldkante (`right-0`, dieselbe Kante, die der
          Unterstrich zieht), in der Grotesk-Feinschrift der Etiketten
          (Archivo 11 = `text-micro`, kein Mono/`num`) und in ink-500 — der
          Rolle, die das Referenzbild `--ink-3` nennt. Kontrast auf `--paper`
          gemessen 5.34:1 (KONTRAST-R1), AA in beiden Themes. */}
      <kbd className="pointer-events-none absolute right-0 top-1/2 hidden -translate-y-1/2 text-micro tracking-tight text-ink-500 lg:inline">⌘K</kbd>
      {/* S6: Ausstieg aus dem mobilen Fokusmodus — dieselbe Wirkung wie Escape
          (Panel zu, Feld unfokussiert), aber mit dem Finger erreichbar. Nur im
          Fokusmodus im DOM, damit er ausserhalb keine Tab-Station belegt. */}
      {breit && (
        <SchliessKnopf
          name="Suche schliessen"
          onClick={() => {
            setOffen(false);
            feld.current?.blur();
            // Fokus GEZIELT zurückgeben: dieser Knopf verlässt beim Schliessen das
            // DOM, ein blosses blur() setzt die Tastatur sonst auf <body> zurück
            // und Screenreader-Nutzer verlieren ihre Position (Gegenprüfungs-
            // Befund 7.8.2026). Hier wird nur der WUNSCH gemeldet — das Ziel ist
            // in diesem Moment noch ausgeblendet und damit nicht fokussierbar;
            // der Streifen setzt den Fokus, sobald es wieder sichtbar ist.
            onFokusZurueck?.();
          }}
          // 44 px wie alle übrigen Bedienelemente dieser Zone (min-h-11/min-w-11);
          // 36 px lagen unter dem Komfortmuster des Streifens. Die SICHTBARE Box
          // bleibt damit, wo sie war — A3-1 (R3-β) vereinheitlicht Glyph, Ton
          // und Trefferfläche, nicht die Box der Zeile. Der Hover wird warm
          // (brass-700) statt dunkel (ink-900): §G-j, eine Flexoki-Stufe.
          klasse="absolute right-1 top-1/2 min-h-11 min-w-11 -translate-y-1/2"
        />
      )}
      {(zeigtPanel || zeigtLeer) && (
        // Im Header intern scrollbar (David 28.6.): die geöffnete Trefferfläche
        // wächst sonst unbegrenzt aus dem Top-Streifen heraus. max-h + eigener
        // Scroll + overscroll-contain (kein Durchscrollen auf die Seite). Nur der
        // HEADER-Pfad ist gekappt; der Hero nutzt dieselbe SuchResultate ungekappt.
        //
        // Ab 1400 px (LM-008): unter dem Feld verankert (absolute, Feldbreite) —
        // dort ist das Feld selbst breit genug. Darunter, inkl. des ganzen
        // «schmal, aber schon Desktop»-Bereichs 640–1400 px (Dedup-Notiz LM-008:
        // dort erbte das Panel bisher die Feldbreite von ~250–300 px, Titel und
        // Snippets wurden auf ein bis zwei Wörter beschnitten, Badges lagen über
        // dem Text) UND mobil (A5 — die Suchleiste trägt den Norm-Sprung): das
        // Panel ist viewport-verankert (fixed, feste Seitenränder inset-x-2) →
        // lesbare Breite OHNE horizontalen Overflow, unabhängig von der Feldbreite.
        // LM-018 (§8 B7): die Trefferzahl-Zeile (SuchResultate) sitzt bewusst
        // AUSSERHALB der `.lc-card` — im Hero und auf /suche liegt sie damit einfach
        // auf der Papier-Fläche der Seite (§5, geteilte Komponente, dort kein Bug).
        // Hier im Header-Dropdown überlagert dasselbe Markup aber fremden Inhalt
        // (Positions-/Brotkrumleiste dahinter) — ohne eigenen Hintergrund schien
        // dieser durch die transparente Zeile hindurch. `bg-paper` schliesst NUR
        // diesen Fundort, ohne SuchResultate selbst (und damit Hero/`/suche`)
        // anzufassen.
        // C3 (5.9.2026, R6-C): `z-30` → `z-dropdown` (Schichtungs-Skala,
        // index.css), Wert unverändert (30), nur benannt.
        // ── D9 (David 6.9.2026, Bild @~1030) · BÜNDIG UNTER DEM FELD ────────
        // BEFUND, gemessen 6.9.2026 (Preview, gebauter Stand `0834cbd7b`,
        // `/gesetze`): das Panel war unterhalb 1400 px viewport-verankert
        // (`fixed inset-x-2`) und hatte mit dem Feld nichts mehr zu tun —
        // @1024 stand das Feld bei x=871 (56 px breit!), das Panel bei x=8
        // (1008 px breit); @1280 Feld x=927/200 px gegen Panel x=8/1264 px.
        // Erst ab 1400 px flog es unter dem Feld (x=927, 360 px). Genau das
        // beschreibt Davids Befund «Versatz nach rechts, Panel-Breite ≠
        // Feldbreite».
        // DIE ANTWORT hat zwei Hälften, und die zweite ist die wichtigere:
        //  (a) das Panel hängt jetzt IMMER am Feld — an dessen RECHTER Kante
        //      (`right-0`), mit der Feldbreite als Mindestmass und 22 rem als
        //      Lesbarkeits-Boden. Rechtsbündig, weil das Feld in der rechten
        //      Hälfte des Titelblatts steht: linksbündig liefe ein 22-rem-Panel
        //      bei 1024 px aus dem Fenster (871 + 352 = 1223 > 1024).
        //  (b) das FELD ist nicht mehr auf 56 px zusammendrückbar (`Topbar`,
        //      `min-[481px]:min-w-[9rem]`) — der Grund, warum (a) allein nicht
        //      gereicht hätte.
        // Der viewport-verankerte Zweig bleibt für den MOBILEN Fokusmodus
        // (< 640 px): dort nimmt das Feld ohnehin den ganzen Streifen ein.
        // C3 (5.9.2026, R6-C): `z-dropdown` (Schichtungs-Skala, index.css).
        // LM-018/§8 B7 bleibt gewahrt: die Trefferzahl-Zeile sitzt weiter
        // AUSSERHALB des Panel-Inhalts; ihren Grund gibt jetzt die schwebende
        // Hülle (`.lc-schwebeflaeche`) statt eines eigenen `bg-paper`.
        // ── a11y · axe `scrollable-region-focusable` (serious) ────────────────
        // Die scrollende Fläche darf keinen neuen Tab-Stopp erzeugen (Cowork-
        // Befund 38: die Treffer sind `role="option"` und bewusst keine
        // Tab-Stationen, sonst hängt der Fokus bis zu neunmal Tab im Widget).
        // Der Fund vom 6.9.2026 (D18) hatte das mit `tabIndex={-1}` an DIESER
        // Hülle gelöst — zu Unrecht: der Check `focusable-element` der Regel
        // prüft `isInTabOrder`, und −1 ist gerade nicht in der Tab-Ordnung. Grün
        // war der Fall nur, solange der Inhalt nicht wirklich überlief (die
        // Regel greift erst dann); im Parallel-Lauf vom 6.9.2026 lief er über
        // und der Fall wurde rot.
        // WURZEL-FIX (§17): nicht die Hülle scrollt, sondern die LISTBOX selbst
        // (`SCROLL_KAPPUNG`, oben) — und das Popup einer Combobox nimmt axe
        // ausdrücklich von der Regel aus (`isComboboxPopup`). Damit ist der Fall
        // nicht mehr timing-abhängig grün, sondern gar nicht mehr betroffen; das
        // `tabIndex={-1}` an der Hülle ist ersatzlos entfallen (§17-Gegengewicht:
        // was nichts mehr trägt, wird gestrichen).
        // ── D23 (David 6.9.2026, Bild Kopf-Suche im Leerzustand) · FELD UND
        //    PANEL SIND EIN OBJEKT ────────────────────────────────────────────
        // Davids Wortlaut zum Bild: «schau mal wie das aussieht mit der suche.
        // sehr unästhetisch». Was D9 offen liess, steht hier:
        //  (a) DIE KANTEN. Das Panel hatte einen EIGENEN Breiten-Boden
        //      (`min-w-[22rem]`) und war damit überall dort breiter als das
        //      Feld, wo das Feld schmaler als 22 rem ist — im Bild ragte es
        //      links über die Feldkante hinaus und quer über die Reiterleiste.
        //      Jetzt: `inset-x-0` am `role="search"`-Anker, sonst NICHTS.
        //      Das Panel kann seine Breite gar nicht mehr selbst wählen; sie
        //      IST die Feldbreite, an jeder Fensterbreite, per Konstruktion
        //      (Δ = 0, bewacht von `e2e/w224-kopfsuche-d23.e2e.ts`).
        //  (b) DER SPALT. `mt-1.5` sind 6 px Luft zwischen Feld und Panel —
        //      genug, damit beide als zwei Dinge lesen. Er fällt: `top-full`
        //      setzt das Panel unmittelbar unter die Unterkante des Feldes,
        //      und die Kante des Feldes (`.lc-input`, `border-bottom: 1px
        //      solid var(--rule)`) ist die Oberkante des Panels.
        //  (c) DIE ANATOMIE. `.lc-schwebeflaeche` (weisse Tafel, Radius,
        //      `shadow-lg`) → `.lc-suchpanel-huelle` (Papier, 1 px `--rule`
        //      rundum ausser oben, kein Schatten, kein Radius; index.css).
        //  (d) DER MOBILE ZWEIG ist ersatzlos gefallen. `max-[639px]:fixed
        //      inset-x-2` verankerte das Panel unter 640 px am VIEWPORT — genau
        //      die Trennung von Feld und Panel, die D23 abschafft, nur eine
        //      Etage tiefer. Unter 640 px nimmt das Feld im Fokusmodus (S6)
        //      ohnehin den ganzen Streifen ein, das Panel also auch.
        // z-dropdown (30) bleibt: das Panel liegt ÜBER Reiterleiste (Topbar
        // z-leiste = 20) und Inhalt — es ist nur nicht mehr breiter als sein
        // Die Scroll-Kappung sitzt seit dem a11y-Wurzel-Fix (oben) an der
        // Listbox, nicht mehr an dieser Hülle.
        <div className="lc-suchpanel-huelle absolute inset-x-0 top-full z-dropdown">
          {zeigtLeer
            // UI-NAV O1: Leerzustand (⌘K/Fokus ohne Eingabe) — Verlauf + Einstiege.
            // Listbox-Modus (Befund 38): Maus-Klick navigiert UND schliesst/leert
            // das Feld in einem Zug (wie Enter/Tastatur-Auswahl).
            ? <SucheLeerzustand verlauf={verlauf} listboxId={listboxId} aktivId={aktivId} panelKlasse={SCROLL_KAPPUNG}
                onNavigate={(href) => { navigate(href); auswahl(); }} />
            : <SuchResultate gruppen={gruppen} allesGeladen={allesGeladen} q={q} onAuswahl={auswahl} listboxId={listboxId} aktivId={aktivId} panelKlasse={SCROLL_KAPPUNG}
                /* F6 · das Entprellungs-Fenster (120 ms, oben): getippt ist
                   schon, übernommen noch nicht — sonst stünde das Panel hier
                   als 1-px-Streifen. */
                wartet={q !== wert.trim()}
                vorschlag={vorschlag} abdeckung={abdeckung} onVorschlag={uebernehmeVorschlag}
                onLeeren={() => { setWert(''); setQ(''); }}
                onNavigate={(href) => navigate(href)} />}
        </div>
      )}
    </div>
  );
}
