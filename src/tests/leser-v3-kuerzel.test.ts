import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { istSuchKuerzel } from '../pages/gesetz-leser/v3/suchKuerzel';

// ─── ⌘K / «/» im V3-Leser · Vorrang vor der Header-Suche (Bug-Check B1) ──────
//
// Der Befund vom 16.8.2026: `SuchSprungFeld` und `components/layout/
// HeaderSuche.tsx` hörten beide auf `window`-keydown. Der Header öffnete sein
// Dropdown synchron, V3 holte den Fokus per `requestAnimationFrame` — beide
// reagierten, das Dropdown stand offen über der Lesefläche. Und in der Lage
// «≥1024 px, Gliederungsspalte zugeklappt» war das V3-Feld gar nicht im DOM,
// ⌘K tat dort also NUR das Falsche.
//
// Zwei Sonden, weil zwei verschiedene Aussagen zu beweisen sind:
//  ① die ENTSCHEIDUNG (welcher Tastendruck gehört dem Leser) — reine Funktion,
//     an jeder Kombination prüfbar;
//  ② die MECHANIK der Vorrangregel (Capture + preventDefault hier, Rückzug
//     dort) — sie lebt in zwei Dateien und ist nur als Paar wahr. Quellensonde,
//     weil Vitest hier ohne DOM läuft (`environment: 'node'`); das Verhalten im
//     echten Browser prüft `e2e/leser-v3-suche-sprung.e2e.ts` (d).

describe('istSuchKuerzel — welcher Tastendruck gehört dem Leser', () => {
  it('⌘K und Ctrl+K gehören ihm — auch aus einem Eingabefeld heraus', () => {
    expect(istSuchKuerzel({ key: 'k', metaKey: true })).toBe(true);
    expect(istSuchKuerzel({ key: 'k', ctrlKey: true })).toBe(true);
    expect(istSuchKuerzel({ key: 'K', metaKey: true })).toBe(true);
    expect(istSuchKuerzel({ key: 'k', ctrlKey: true, target: { tagName: 'INPUT' } as unknown as EventTarget })).toBe(true);
  });

  it('«/» gehört ihm nur ausserhalb einer Eingabe — sonst ist es ein Zeichen', () => {
    expect(istSuchKuerzel({ key: '/' })).toBe(true);
    expect(istSuchKuerzel({ key: '/', target: null })).toBe(true);
    for (const tag of ['INPUT', 'TEXTAREA', 'SELECT']) {
      expect(istSuchKuerzel({ key: '/', target: { tagName: tag } as unknown as EventTarget }),
        `«/» in <${tag}> darf kein Kürzel sein`).toBe(false);
    }
    expect(istSuchKuerzel({
      key: '/', target: { tagName: 'DIV', isContentEditable: true } as unknown as EventTarget,
    }), '«/» in contenteditable darf kein Kürzel sein').toBe(false);
  });

  it('Alt-Kombinationen und alles Übrige gehören ihm NICHT', () => {
    expect(istSuchKuerzel({ key: 'k', metaKey: true, altKey: true })).toBe(false);
    expect(istSuchKuerzel({ key: '/', altKey: true })).toBe(false);
    expect(istSuchKuerzel({ key: 'k' })).toBe(false);
    expect(istSuchKuerzel({ key: 'j' })).toBe(false);
    expect(istSuchKuerzel({ key: 'Escape' })).toBe(false);
  });
});

describe('Die Vorrangregel lebt in zwei Dateien und ist nur als Paar wahr', () => {
  const KUERZEL = readFileSync('src/pages/gesetz-leser/v3/suchKuerzel.ts', 'utf8');
  const HEADER = readFileSync('src/components/layout/HeaderSuche.tsx', 'utf8');
  const FELD = readFileSync('src/pages/gesetz-leser/v3/SuchSprungFeld.tsx', 'utf8');
  const RAHMEN = readFileSync('src/pages/gesetz-leser/v3/LeserRahmenV3.tsx', 'utf8');
  // §6.3-NACHZUG D38 (7.9.2026): der Aufbau des Gliederungs-Sheets ist aus dem
  // Rahmen ausgelagert (`leisteAufbau.tsx`, 420-Zeilen-Sonde). Das FELD, um das
  // es hier geht, wird weiterhin im Rahmen gebaut und durchgereicht — die Sonde
  // liest darum beide Dateien statt nur eine. Sie wird dadurch nicht weicher:
  // sie verlangt UNVERÄNDERT, dass genau ein `sprungFeld={…}` das Sheet erreicht.
  const LEISTE = readFileSync('src/pages/gesetz-leser/v3/leisteAufbau.tsx', 'utf8');
  // A2 (H3-Nachzug): die Pane-Vorrangregel und ihr zweiter Verbraucher.
  const PANE_PRIO = readFileSync('src/pages/gesetz-leser/panePrioritaet.ts', 'utf8');
  const TASTATUR = readFileSync('src/pages/gesetz-leser/parts/LeserTastatur.tsx', 'utf8');

  it('V3 beansprucht die Taste in der CAPTURE-Phase und ruft dort preventDefault', () => {
    expect(KUERZEL).toContain("window.addEventListener('keydown', taste, { capture: true })");
    expect(KUERZEL).toContain("window.removeEventListener('keydown', taste, { capture: true })");
    // preventDefault VOR onKuerzel — sonst hinge der Vorrang daran, dass ein
    // etwaiger Öffner-Callback nicht wirft.
    // §6.3-NACHZUG (H2b-Nachzug, A3): `onKuerzel` ist optional geworden, der
    // Aufruf heisst darum `onKuerzel?.()`. Die geprüfte ZUSAGE ist unverändert
    // (Reihenfolge preventDefault → Callback), nur die Schreibweise folgt dem
    // Code. Grund der Optionalität: Vollzugsvermerk H2b-Nachzug (§17-Rückbau).
    const iPd = KUERZEL.indexOf('e.preventDefault()');
    const iCb = KUERZEL.indexOf('onKuerzel?.()');
    expect(iPd, 'preventDefault fehlt').toBeGreaterThan(-1);
    expect(iCb, 'onKuerzel wird nicht gerufen').toBeGreaterThan(-1);
    expect(iPd, 'preventDefault steht NACH onKuerzel').toBeLessThan(iCb);
  });

  it('A3 · die Pane-Zuständigkeit wird VOR preventDefault geprüft', () => {
    // BEFUND 17.8.2026 (Split @1600): zwei Listener am Fenster, beide riefen
    // `preventDefault` und zogen Fokus — der zuletzt registrierte gewann, der
    // Fokus landete quer im anderen Pane. Die Wache muss VOR dem Beanspruchen
    // stehen: reklamiert ein fremdes Pane den Tastendruck, schweigt zusätzlich
    // die Header-Suche (sie prüft `defaultPrevented`) und NIEMAND bedient ihn.
    //
    // A2 (H3-Nachzug): die Regel wohnt seit dem Nachzug in `../panePrioritaet` —
    // sie gilt für BEIDE Kürzel-Wege (⌘K hier, j/k/t/r dort), und `parts/` durfte
    // sie nicht aus `v3/` holen (FL-4). Die geprüfte ZUSAGE ist unverändert;
    // geprüft wird zusätzlich, dass es die EINE Quelle wirklich gibt.
    const iWache = KUERZEL.indexOf('tastendruckGehoertPane(imSekundaerenPane)');
    const iPd = KUERZEL.indexOf('e.preventDefault()');
    expect(iWache, 'die Pane-Wache fehlt').toBeGreaterThan(-1);
    expect(iWache, 'die Pane-Wache steht NACH preventDefault').toBeLessThan(iPd);
    // Die Auflösung liest den FOKUS, nicht einen beim Registrieren eingefrorenen
    // Zustand — sonst wäre sie nach einem Pane-Wechsel veraltet.
    expect(PANE_PRIO).toContain('document.activeElement');
    expect(PANE_PRIO).toContain("closest?.('[data-pane]')");
    expect(RAHMEN, 'der Rahmen gibt seine Pane-Rolle nicht durch')
      .toContain('imSekundaerenPane: umgebung.istSekundaer');
  });

  it('A2 · dieselbe Regel bedient auch «r» — EINE Quelle, zwei Verbraucher', () => {
    // BEFUND 17.8.2026 (Split): `r` war NICHT pane-bewusst. Der Leser-Tastatur-
    // Listener lief nur im primären Pane, also öffnete `r` aus dem sekundären das
    // PRIMÄRE Panel. Rot zu bekommen: die Wache in `parts/LeserTastatur` entfernen
    // (dann öffnen beide Panes), oder die Regel dort ein zweites Mal hinschreiben
    // (dann fehlt der Import und die Kopie läuft beim nächsten Fix auseinander).
    expect(PANE_PRIO, 'die geteilte Regel fehlt')
      .toContain('export function tastendruckGehoertPane(');
    expect(TASTATUR, 'die Leser-Tastatur prüft die Zuständigkeit nicht')
      .toContain('tastendruckGehoertPane(paneRolleRef.current)');
    expect(TASTATUR, 'die Leser-Tastatur baut die Regel selbst nach statt sie zu holen')
      .not.toContain("closest?.('[data-pane]')");
    expect(RAHMEN, 'der Rahmen gibt die Pane-Rolle nicht an die Tastatur durch')
      .toContain('imSekundaerenPane={umgebung.istSekundaer}');
    // … und der Listener läuft wieder in BEIDEN Panes: stünde er noch unter
    // `!umgebung.istSekundaer`, wäre die Wache wirkungslos.
    expect(/!umgebung\.istSekundaer && \(\s*\n?\s*<LeserTastatur/.test(RAHMEN),
      'die Leser-Tastatur ist wieder auf das primäre Pane beschränkt').toBe(false);
  });

  it('die Header-Suche zieht sich bei bereits beanspruchtem Tastendruck zurück', () => {
    expect(HEADER, 'HeaderSuche prüft `defaultPrevented` nicht mehr — der Vorrang ist tot')
      .toContain('if (e.defaultPrevented) return;');
  });

  // LESER-NAV · FB O-64: Esc schliesst nur die oberste Fläche. Zwei Hälften, beide nötig: die Esc-Funktion der Suche
  // gibt nach, wenn ein anderer Zuhörer das Esc schon angenommen hat (egal, wer am `window` zuerst läuft), UND die
  // geöffnete Suche trägt die Menü-Markierung, an der das Blatt (`usePopoverAutoZu`: `imMenue`) erkennt, dass das Esc
  // der Suche gehört. Wirkung im Browser: `e2e/leser-split-w217.e2e.ts` (O-64).
  // ROT ZU BEKOMMEN (§6.7): `|| e.defaultPrevented` bzw. `data-menue-flaeche` in HeaderSuche.tsx streichen.
  it('O-64: Esc der Header-Suche gibt nach, wenn ein anderer Zuhörer es angenommen hat, und markiert die offene Suche als Menü', () => {
    const von = HEADER.indexOf('const esc = (e: KeyboardEvent)');
    expect(von, 'die Esc-Funktion der Header-Suche fehlt').toBeGreaterThan(-1);
    expect(HEADER.slice(von, von + 200), 'die Esc-Funktion prüft `defaultPrevented` nicht')
      .toContain("e.key !== 'Escape' || e.defaultPrevented");
    expect(HEADER, 'die offene Suche trägt keine Menü-Markierung — das Blatt nähme das Esc mit')
      .toContain("data-menue-flaeche={zeigtPanel || zeigtLeer ? '' : undefined}");
  });

  it('das Kürzel hängt NICHT mehr am Feld — es muss auch ohne Feld im DOM greifen', () => {
    expect(/addEventListener\('keydown'/.test(FELD),
      'SuchSprungFeld registriert wieder einen eigenen keydown-Listener').toBe(false);
    expect(RAHMEN, 'der Rahmen ruft das Kürzel-Hook nicht').toContain('useSuchSprungKuerzel(');
  });

  it('das Kürzel muss keine Fläche mehr öffnen — das Feld ist immer im DOM', () => {
    // ── §17-RÜCKBAU (H2b-Nachzug) · ERSETZT die frühere Zusage ────────────────
    // Diese Prüfung verlangte bis hierher, dass der Rahmen bei ⌘K erst eine
    // Fläche aufzieht (`setTocOffen`/`setTocAuf`) — der B1-Nachzug von H1, als
    // das Feld bei zugeklappter Spalte gar nicht im DOM war. Ä19 (klebende
    // Such-Zone) und A2 (Feld im offenen Blatt) haben diese Lage beseitigt: bei
    // vorhandenen Einträgen steht das Feld IMMER im DOM, der Öffner-Zweig war
    // damit unerreichbar. `e2e/leser-v3-suche-sprung.e2e.ts` (e) verlangt
    // ausdrücklich das Gegenteil der alten Zusage — «⌘K hat die
    // Gliederungsspalte aufgezogen» ist dort ein FEHLER. Zwei Tore, die
    // Gegensätzliches fordern, sind kein Schutz; das jüngere gewinnt, und diese
    // Sonde bewacht jetzt den Rückbau statt den entfernten Zweig.
    expect(RAHMEN, 'der Rahmen öffnet bei ⌘K wieder eine Fläche')
      .not.toContain('m.setTocOffen(true);\n      else');
    expect(RAHMEN, 'der Rahmen ruft das Kürzel-Hook nicht mehr ohne Öffner')
      .toContain('useSuchSprungKuerzel({ feldRef: suchFeldRef');
    // Positiv-Sonde: das Feld ist in JEDER Lage vorhanden, weil die Zone es
    // trägt — sonst bewachte der Rückbau eine Lücke.
    // §6.3-NACHZUG D28 (David 6.9.2026): die Bedingung lautete bis 6.9.
    // `hatLeiste && !zweiSpalten` (Zone nur OHNE Gliederungs-Spalte, weil dort
    // die Leiste das Feld trug). Mit D28 trägt die Zone es in jeder Lage — die
    // Sonde wird dadurch STRENGER, nicht weicher: sie schliesst jetzt auch den
    // Fall aus, dass das Feld bei stehender Spalte wieder in die Leiste rutscht.
    expect(RAHMEN).toContain('const suchZoneKlebt = hatLeiste;');
    expect(RAHMEN, 'der Rahmen reicht das Feld nicht ins Sheet').toContain('suchFeld,');
    expect(LEISTE, 'das Sheet bekommt das Feld nicht').toContain('sprungFeld={a.suchFeld}');
  });
});
