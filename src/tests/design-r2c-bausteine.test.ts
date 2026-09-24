/**
 * W2·19-DESIGN-KONSISTENZ — Runde 2, Paket C (31.8.2026).
 *
 * Bewacht die vier Kanons dieses Pakets:
 *   C-4  EINE Treffer-Zeile (`ui/TrefferZeile`) für Katalog-Register UND
 *        Such-Panel; der Behälter bleibt je Fläche.
 *   C-5  EINE Rubrik-Kachel (`ui/RubrikKachel`) für die Startseiten-Landkarte
 *        UND den /gesetze-Einstieg — inkl. §8: der Zähler-WORTLAUT ist beim
 *        Umbau von der Fusszeile in die Einheit gewandert, nicht verändert.
 *   D-3  EIN Auswahl-Signal: die invertierte `bg-ink-900`-Füllung ist weg, die
 *        Pillen laufen über `ui/SelectionGrid` (variant «pille»).
 *   §5   EINE Dialog-Fokus-Falle: `useDialogFokus`, auch im Lesemodus-Overlay.
 *
 * QUELLTEXT-Sonde, kein Render-Test: bewacht wird «diese Form kommt in der App
 * genau einmal vor» — am Quelltext messbar, am DOM einer Seite nicht.
 *
 * ROT-BEWEIS (§6.7): jeder Fall trägt eine NEGATIV-KONTROLLE mit dem Wortlaut,
 * wie er vor dem Bau im Repo stand. Läuft die Kontrolle grün, prüft der Ausdruck
 * nichts und der Fall ist wertlos.
 *
 * Reine Darstellung (§3) — keine Rechtslogik berührt.
 */
import { describe, it, expect } from 'vitest';
// R5-A (5.9.2026) · §5: Verzeichnis-Wanderung und Kommentar-Sieb standen hier
// als eigene Kopie von `appDateien.ts`. Ein Wächter, der seinen Sweep selbst
// nachbaut, ist ab der ersten Abweichung ein anderer Wächter als sein
// Nachbar — beide hängen jetzt an der einen Quelle.
import { join } from 'node:path';
import { APP_WURZEL, alleQuellen, ohneKommentare, liesRoh } from './appDateien';

const WURZEL = APP_WURZEL;

const rohLies = (pfad: string) => liesRoh(join(WURZEL, pfad));

/** Quelltext OHNE Kommentare — die Herleitungen dürfen den Vorzustand beim
 *  Namen nennen (§2b), ohne die Sonde für immer rot zu färben. */
const lies = (rel: string) => rohLies(rel)
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .split('\n').filter((z) => !/^\s*(\/\/|\*)/.test(z)).join('\n');



// ─── C-4 · EINE Treffer-Zeile ───────────────────────────────────────────────

describe('C-4 · Treffer-Zeilen laufen über EINEN Baustein', () => {
  const katalog = lies('components/Katalog.tsx');
  const suche = lies('components/suche/SuchResultate.tsx');

  // ── F1 (Prüfer D23, 6.9.2026) · DEKLARIERTE TEST-ÄNDERUNG (§6.3) ──────────
  // C-4 hatte Katalog UND Suche auf EINEN Baustein gezogen, weil beide
  // «anklickbare Zeile mit Titel, zweiter Zeile, Marke und Pfeil» zeigten. Mit
  // D23 zeigen sie das NICHT mehr beide: das Such-Panel trägt seit F1 die
  // Anatomie seines eigenen Leerzustands (Registerstrich · Kurzform · Art als
  // Text) — eine Streifen-Zeile fester Höhe, keine Karten-Zeile. Gemessen war
  // genau die Vermischung der Befund: Volltitel, mehrzeiliges Snippet und
  // gerahmtes Etikett ergaben Zeilenhöhen von 37 bis 266 px in EINER Liste.
  // §1 gilt hier gegen die Abstraktion: zwei verschiedene Fälle dürfen nicht
  // stillschweigend gleich behandelt werden, nur weil sie einmal gleich aussahen.
  // Der Wächter behält seine Zähne — er prüft jetzt je Fläche, dass sie DIE
  // EINE für sie kanonische Anatomie konsumiert und keine dritte erfindet.
  it('der Katalog konsumiert `ui/TrefferZeile` samt gemeinsamem Rahmen', () => {
    expect(katalog, 'Katalog: rendert den Baustein').toContain('<TrefferZeile');
    expect(katalog, 'Katalog: teilt die Flex-Geometrie/den Gruppen-Namen').toContain('TREFFER_ZEILE_RAHMEN');
  });

  it('das Such-Panel trägt die D23-Anatomie seines Leerzustands', () => {
    // Dieselben drei Glieder wie `SucheLeerzustand.tsx`, aus denselben Quellen:
    // Registerstrich (`RegisterMarke`, §5), Kurzform, Art rechts als Text.
    for (const glied of ['<RegisterMarke', 'trefferKurzform', 'trefferArt']) {
      expect(suche, `SuchResultate: führt ${glied}`).toContain(glied);
    }
    // Und KEINE Karten-Anatomie mehr — weder der Baustein noch eine Kopie.
    expect(ohneKommentare(suche), 'SuchResultate: keine Karten-Zeile mehr').not.toContain('<TrefferZeile');
  });

  it('keine der beiden zeichnet Titel/Untertitel/Pfeil noch selbst', () => {
    // Die drei Formen, die vor dem Bau je Fläche dastanden.
    const eigeneTitelzeile = /<span className="block [^"]*text-ink-900[^"]*">\{(?:sansAmp\(k\.title\)|t\.label)\}/;
    const eigenerPfeil = /className="[^"]*group-hover\/z:translate-x-0\.5/;
    for (const [name, q] of [['Katalog', katalog], ['SuchResultate', suche]] as const) {
      expect(q, `${name}: eigene Titelzeile`).not.toMatch(eigeneTitelzeile);
      expect(q, `${name}: eigener Hover-Pfeil`).not.toMatch(eigenerPfeil);
    }
  });

  it('NEGATIV-KONTROLLE: die Ausdrücke finden die Vorher-Formen', () => {
    // Katalog.tsx vor dem Bau (Stand 31.8.2026, Zeile 40).
    expect(
      '<span className="block font-sans font-medium text-ink-900 text-body-s leading-snug">{sansAmp(k.title)}</span>',
    ).toMatch(/<span className="block [^"]*text-ink-900[^"]*">\{(?:sansAmp\(k\.title\)|t\.label)\}/);
    // SuchResultate.tsx vor dem Bau (Stand 31.8.2026, Zeile 66/75).
    expect(
      '<span className="block max-sm:line-clamp-2 sm:truncate text-body-s font-medium text-ink-900 transition-colors group-hover/z:text-brass-800">{t.label}</span>',
    ).toMatch(/<span className="block [^"]*text-ink-900[^"]*">\{(?:sansAmp\(k\.title\)|t\.label)\}/);
    expect(
      `className="text-ink-300 transition-all group-hover/z:translate-x-0.5 group-hover/z:text-brass-500"`,
    ).toMatch(/className="[^"]*group-hover\/z:translate-x-0\.5/);
  });

  it('der Baustein ist genau einmal definiert', () => {
    const definitionen = alleQuellen()
      .filter((d) => /export function TrefferZeile\(/.test(liesRoh(d)));
    expect(definitionen.map((d) => d.slice(WURZEL.length + 1)))
      .toEqual(['components/ui/TrefferZeile.tsx']);
  });
});

// ─── C-5 · EINE Rubrik-Kachel ───────────────────────────────────────────────

describe('C-5 · Einstiegs-Kacheln laufen über EINEN Baustein', () => {
  // DEKLARIERTE ANPASSUNG (W2·24-DESIGN-IDENTITAET R3, 6.9.2026, §6.3): die
  // Startseite hat KEINE Kachel-Landkarte mehr — «/» ist das
  // Inhaltsverzeichnis der Sammlung geworden (Listen im Satzspiegel,
  // Referenzbild `abnahme/design-identitaet/vorschlag-freigegeben.html`).
  // `components/start/RubrikKacheln.tsx` ist damit gelöscht, und C-5 hat nur
  // noch EINE Fläche: den /gesetze-Einstieg. Der Kanon selbst — «die
  // Kachel-Anatomie steht genau einmal» — ist unverändert scharf und wird
  // unten weiterhin app-weit geprüft; was wegfällt, ist die zweite Fläche,
  // nicht die Regel. Der §8-Zähler-Wortlaut ist mitgewandert und wird an
  // seinem neuen Ort geprüft (letzter Fall).
  const gesetze = lies('pages/Gesetze.tsx');

  it('der /gesetze-Einstieg konsumiert `ui/RubrikKachel`', () => {
    expect(gesetze, 'Gesetze: rendert den Baustein').toContain('<RubrikKachel');
  });

  it('die Fläche zeichnet die Kachel-Anatomie nicht selbst', () => {
    const eigenerZahlKopf = /className="num font-display text-h1 leading-none text-brass-700"/;
    expect(gesetze, 'Gesetze: eigener Zahl-Kopf').not.toMatch(eigenerZahlKopf);
  });

  // DEKLARIERTE ANPASSUNG (W2·29-WERKBANK-KATALOGE K7, Entscheid David
  // 22.9.2026, §6.3): «/» trägt wieder Kacheln — die vier Rubriken über DEN
  // Baustein `ui/RubrikKachel`, direkt in `pages/Startseite.tsx`. Die Regel
  // «Kachel-Anatomie genau einmal» wird dadurch SCHÄRFER geprüft (zweiter
  // Konsument), nicht schwächer: die Start-Bausteine und das Modul-Registry
  // dürfen weiterhin keine eigene Kachel und kein `lc-tile` führen.
  // DEKLARIERTE ANPASSUNG (W2·29-WERKBANK-START S1, Prototyp + Go David
  // 23.9.2026, §6.3): die Kacheln klappen jetzt VOR ORT auf — der Baustein wird
  // im Kachelfeld (`start/StartKachelFeld`) und in der Wahl-Stufe der
  // Gesetze-Kachel (`start/GesetzeBlatt`, Bund · Kantone · International wie
  // auf /gesetze) konsumiert, nicht mehr direkt in der Seite; das
  // Modul-Registry ist gelöscht. Der PRÜFPUNKT bleibt: wer eine Kachel zeigt,
  // nimmt DEN Baustein; kein Start-Baustein baut `lc-tile` oder eine eigene
  // Kachel-Anatomie (Fläche + Strich + Zahl), die übrigen führen gar keine.
  // NACHZUG S2 (23.9.2026, §6.3): die Wahl-Stufe der Werkzeuge-Kachel
  // (`start/WerkzeugeBlatt`, Rechner | Vorlagen) ist der DRITTE Konsument —
  // derselbe Baustein, kein eigener Kachel-Nachbau (analog GesetzeBlatt in S1).
  it('die Startseite konsumiert `ui/RubrikKachel`, die Start-Bausteine keine eigene Kachel', () => {
    const konsumenten = ['components/start/StartKachelFeld.tsx', 'components/start/GesetzeBlatt.tsx', 'components/start/WerkzeugeBlatt.tsx'];
    for (const d of konsumenten) expect(lies(d), `${d}: rendert den Baustein`).toContain('<RubrikKachel');
    expect(lies('pages/Startseite.tsx'), 'Startseite: kein lc-tile').not.toContain('lc-tile');
    const startDateien = alleQuellen().filter((d) => d.includes('/components/start/'));
    expect(startDateien.length, 'Startseiten-Bausteine gefunden').toBeGreaterThan(0);
    for (const d of startDateien) {
      const rel = d.slice(WURZEL.length + 1);
      const q = ohneKommentare(liesRoh(d));
      if (!konsumenten.some((k) => rel.endsWith(k))) expect(q, `${rel}: keine Kachel`).not.toContain('<RubrikKachel');
      expect(q, `${rel}: kein lc-tile`).not.toContain('lc-tile');
      expect(q, `${rel}: keine eigene Kachel-Fläche mit Zahl`).not.toMatch(/bg-reg-[grmw]-flaeche[^'"`]*text-h1/);
    }
  });

  it('NEGATIV-KONTROLLE: die Ausdrücke finden die Vorher-Formen', () => {
    expect('<span className="num font-display text-h1 leading-none text-brass-700">{k.zahl}</span>')
      .toMatch(/className="num font-display text-h1 leading-none text-brass-700"/);
    // So stand die Landkarte bis R3 in `components/start/RubrikKacheln.tsx`.
    expect('<RubrikKachel key={a.ziel} ziel={a.ziel!} titel={a.titel}').toContain('<RubrikKachel');
  });

  it('§8: der Zähler-Wortlaut ist gewandert, nicht abgeschwächt', () => {
    // «erfasst» für die bibliografischen Materialien, «im Volltext» für die
    // echten Volltexte (E6a·M5) — jeder Umbau darf die Aussage nur an einen
    // anderen Ort tragen, nie glätten.
    //
    // DEKLARIERTE ANPASSUNG (W2·24-DESIGN-IDENTITAET R10, 6.9.2026, §6.3): die
    // Zähler standen bis R3 in der MARGINALIE jeder Modulzeile («1'565
    // Erlasse<br/>im Volltext»). Die Marginalienspalte gibt es auf dem Pult
    // nicht mehr; die Bestandszahl steht jetzt EINMAL in der Bereichs-Reihe
    // (`start/BereichsReihe`) und, wo das Modul sie zusätzlich braucht, in
    // seiner Fuss-Zeile. Der PRÜFPUNKT ist unverändert derselbe — Zahl NIE ohne
    // Scope-Wort, «erfasst» nie zu «Volltext» geglättet —, er wird nur am neuen
    // Ort geprüft. Die Ausdrücke bleiben scharf: die Negativ-Kontrolle darüber
    // und `not.toContain('im Volltext')` unten fallen weiterhin auf jede
    // Abschwächung.
    // K7 (§6.3, deklariert): die Bereichs-Reihe ist in die vier Rubrik-Kacheln
    // von `pages/Startseite.tsx` gewandert — gleicher Prüfpunkt, neuer Ort.
    // W2·29-WERKBANK-START S1 (§6.3, deklariert): Systematik und Kantone sind
    // Stufen der Gesetze-Kachel (`start/GesetzeBlatt`), das Behörden-Modul ist
    // mit dem Baukasten gestrichen (Auswahlfrage David 23.9.2026) — der
    // Materialien-Scope wird an der Kachel geprüft. Die Bund-Stufe nennt NUR
    // das Bundesrecht: das internationale Recht ist die dritte Wahl daneben.
    const bereiche = lies('pages/Startseite.tsx');
    const bund = lies('components/start/GesetzeBlatt.tsx');
    const kantone = bund;
    const materialien = bereiche;
    expect(bereiche, 'Bereich Gesetze: Zähler mit Scope')
      .toMatch(/Erlasse im Volltext, Bund und Kantone/);
    expect(bereiche, 'Bereich Rechtsprechung: Zähler mit Scope')
      .toMatch(/Entscheide im Volltext/);
    // U12 (§6.3, deklariert, David 24.9.2026 «materialien soll erläuterungen
    // und materialien enthalten»): die Einheit nennt beide Gattungen — der
    // Prüfpunkt («erfasst», nie «Volltext») bleibt derselbe, nur der Wortlaut.
    expect(bereiche, 'Bereich Materialien: «erfasst», nie «Volltext»')
      .toMatch(/Materialien und Erläuterungen erfasst/);
    // K7 (§6.3, deklariert): der Fuss nennt Bundesrecht und Staatsverträge
    // getrennt statt der Mischzahl — der Ausdruck ist schärfer, nicht weicher.
    expect(bund, 'Bund-Stufe: Zähler mit Scope').toMatch(/erfasste Volltext \({nf\(z\.gesetzeBundesrechtVolltext\)} Erlasse\s+des Bundesrechts\)/);
    expect(kantone, 'Kanton-Stufe: Zähler mit Scope').toMatch(/kantonale Erlasse/);
    // W2·29-WERKBANK-START-LAYOUT (§6.3, deklariert, David 24.9.2026 «entscheide
    // sollen weg»): das Entscheide-Modul ist gestrichen; «Entscheide im
    // Volltext» prüft die Zeile «Bereich Rechtsprechung» oben an der Kachel.
    expect(materialien, 'Materialien: «erfasst», nie «Volltext»').toMatch(/Materialien und Erläuterungen erfasst/);
    expect(materialien, 'Materialien behaupten keinen Volltext').not.toMatch(/Materialien und Erläuterungen[^'"]*im Volltext/);
    // §8 am Kantons-Eintrag: Zustands-Wort im Accessible Name, nie
    // «vollständig» aus eigener Kraft (erfassungsgrad.ts bleibt die Quelle).
    expect(kantone).toContain('STUFE_WORT');
    expect(kantone).toContain('erfasst');
  });

  it('der Baustein ist genau einmal definiert', () => {
    const definitionen = alleQuellen()
      .filter((d) => /export function RubrikKachel\(/.test(liesRoh(d)));
    expect(definitionen.map((d) => d.slice(WURZEL.length + 1)))
      .toEqual(['components/ui/RubrikKachel.tsx']);
  });
});

// ─── D-3 · EIN Auswahl-Signal ───────────────────────────────────────────────

describe('D-3 · Auswahl-Pillen laufen über SelectionGrid', () => {
  /** Die invertierte Füllung, mit der vier Wizard-Stellen die Auswahl zeigten. */
  const INVERS = 'bg-ink-900 border-ink-900 text-paper';
  /** Die Pillen-Anatomie — sie darf nur noch im Baustein stehen.
   *
   *  W2·24 (6.9.2026) NACHGEFUEHRT, deklarierte Design-Aenderung (§6.3): die
   *  Pille ist nicht mehr `rounded-full`, sondern kantig wie `.lc-chip`
   *  (Klasse `lc-wahl-pille`, index.css) — «Kanten statt Pille» ist seit R1-3
   *  die Hausform. Die ABSICHT dieses Waechters ist unberuehrt: er prueft
   *  weiterhin, dass die Anatomie genau EINMAL steht, naemlich im Baustein.
   *  Nur der Ausdruck folgt der neuen Form; die Vorher-Form steht in der
   *  Negativ-Kontrolle unten weiter als Zitat (§2b).
   */
  const PILLE = /lc-wahl-pille [^`]*px-3 py-1\.5 text-body-s font-medium border transition-colors/;

  it('die invertierte ink-900-Füllung als Auswahl-Signal ist nirgends mehr', () => {
    const funde = alleQuellen()
      .filter((d) => ohneKommentare(liesRoh(d)).includes(INVERS))
      .map((d) => d.slice(WURZEL.length + 1));
    expect(funde).toEqual([]);
  });

  it('die Pillen-Anatomie steht genau einmal — im Baustein', () => {
    const funde = alleQuellen()
      .filter((d) => PILLE.test(ohneKommentare(liesRoh(d))))
      .map((d) => d.slice(WURZEL.length + 1));
    expect(funde).toEqual(['components/ui/SelectionGrid.tsx']);
  });

  it('NEGATIV-KONTROLLE: die Ausdrücke finden die Form, gegen die sie gebaut sind', () => {
    // Die INVERS-Kontrolle zitiert unveraendert die Vorher-Form von D-3
    // (31.8.2026) — ein datierter Beleg wird nicht nachgefuehrt (§2b).
    const vorher = 'className={`px-3 py-1.5 rounded-full text-body-s font-medium border transition-colors ${'
      + "a.entschaedigung === code ? 'bg-ink-900 border-ink-900 text-paper' : 'bg-surface border-line text-ink-600 hover:border-brass-400'}`}";
    expect(vorher).toContain(INVERS);
    // Die PILLE-Kontrolle prueft die HEUTIGE Anatomie: ein Ausdruck, der nichts
    // mehr findet, ist ein Tor, das nicht scheitern kann (§6.7).
    const heute = 'className={`lc-wahl-pille ${PILLE_HITBOX} px-3 py-1.5 text-body-s font-medium border transition-colors ${';
    expect(PILLE.test(heute)).toBe(true);
    expect(PILLE.test(vorher), 'die alte Pillenform darf NICHT mehr matchen').toBe(false);
  });

  it('die vier Fundstellen konsumieren die Pillen-Variante', () => {
    for (const rel of [
      'pages/VorlagePatientenverfuegung.tsx',
      'pages/VorlageVorsorgeauftrag.tsx',
      'pages/VorlageSchlichtungsgesuchBs.tsx',
    ]) {
      expect(lies(rel), `${rel}: variant="pille"`).toContain('variant="pille"');
    }
  });

  it('§1: die BEDEUTUNGS-Töne der Patientenverfügung überleben die Vereinheitlichung', () => {
    // «zustimmen»/«ablehnen»/«nur befristet» tragen Farbe als AUSSAGE, nicht als
    // Auswahl-Zustand — sie wegzunehmen wäre Informationsverlust (§1/§8).
    const pv = lies('pages/VorlagePatientenverfuegung.tsx');
    expect(pv).toMatch(/code: 'zustimmen',[^\n]*ton: 'zustimmung'/);
    expect(pv).toMatch(/code: 'ablehnen',[^\n]*ton: 'ablehnung'/);
    expect(pv).toMatch(/code: 'nur_befristet',[^\n]*ton: 'vorbehalt'/);
    const baustein = lies('components/ui/SelectionGrid.tsx');
    // A3-6-NACHFÜHRUNG (R3-α, 31.8.2026) — DEKLARIERTE fachliche Änderung, kein
    // Refactoring-Nachziehen (§6.3): der Zustimmungs-Ton stand in der
    // MATERIALIEN-Kennfarbe `sage`. Er ist auf die Zustands-Rolle `--ok-*`
    // gezogen (wertidentisch, §4b-B-i) — das Signal ist unverändert, seine
    // Herkunft ist es nicht mehr. Die Zusicherung dieses Falls («die drei
    // Bedeutungs-Töne überleben») bleibt Wort für Wort dieselbe.
    expect(baustein).toContain('bg-ok-bg border-ok-line text-ok-text');
    expect(baustein).toContain('bg-danger-bg border-danger-line text-danger-700');
    expect(baustein).toContain('bg-warn-bg border-warn-500 text-warn-700');
  });
});

// ─── §5 · EINE Dialog-Fokus-Falle ───────────────────────────────────────────

describe('§5 · der Lesemodus benutzt die geteilte Fokus-Falle', () => {
  const overlay = lies('components/rechtsprechung/LesemodusOverlay.tsx');

  it('ruft `useDialogFokus` statt einer eigenen Tab-Schleife', () => {
    expect(overlay).toContain('useDialogFokus(true, dialogRef, onClose, schliessRef)');
    expect(overlay).not.toContain("querySelectorAll<HTMLElement>('a[href], button:not([disabled])')");
    expect(overlay).not.toContain('e.shiftKey && document.activeElement === erst');
  });

  it('NEGATIV-KONTROLLE: der Ausdruck findet die Vorher-Falle', () => {
    const vorher = `const f = dialogRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
        if (e.shiftKey && document.activeElement === erst) { e.preventDefault(); letzt.focus(); }`;
    expect(vorher).toContain("querySelectorAll<HTMLElement>('a[href], button:not([disabled])')");
    expect(vorher).toContain('e.shiftKey && document.activeElement === erst');
  });

  it('der Anfangsfokus bleibt «✕ schliessen» (nicht der erste Grössen-Knopf)', () => {
    expect(lies('components/layout/useDialogFokus.ts'))
      .toContain('(startFokus?.current ?? sammle()[0] ?? wurzel).focus()');
  });
});
