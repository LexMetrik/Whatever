import { describe, it, expect, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { LocaleProvider } from '../components/locale';
import { Startseite } from '../pages/Startseite';
import { RechnerUebersicht } from '../pages/RechnerUebersicht';
import { VorlagenUebersicht } from '../pages/VorlagenUebersicht';
import { HeaderSuche } from '../components/layout/HeaderSuche';
import { IMMER, TAGESZEITEN } from '../lib/begruessungen';
import { parseHTML } from 'linkedom';
import { KATALOG_KARTEN, istVerfuegbar } from '../lib/startseiteConfig';
import { kartenDerKategorie } from '../lib/katalogKategorie';
import { OBERKATEGORIEN, kategorieFuer, type OberkategorieId } from '../lib/oberkategorien';
import { STARTSEITE_ZAEHLER } from '../data/startseiteZaehler.generated';

/** Alle möglichen Grüsse — für den H1-Inhaltstest unten (D39). */
const ALLE_GRUESSE = [...IMMER, ...TAGESZEITEN.flatMap((t) => t.pool)];

// Akzeptanztests Katalog/Rubriken. Stand UI-Welle (deklarierte Anpassung
// §6 Ziff. 3): /recherche ist aufgelöst — die Rechner-/Vorlagen-Register leben
// auf eigenen Übersichtsseiten (/rechner, /vorlagen), die die bestehende
// KategorieSektion wiederverwenden; die Suche liegt im Header-Dropdown. Die
// Startseite «/» ist das Suche-zuerst-Cockpit. Startseite V3 · Schritt 2
// (deklarierte Änderung §6.3): Favoriten gestrichen (Anweisung David 5.6.),
// Zeiterfassung auf /rechner verschoben — beide nicht mehr auf «/».
// W2·23-STARTSEITE-V4 (5.9.2026, deklarierte Änderung §6.3 — fachlich gewollter
// Umbau, kein Refactoring): der Tab-Kasten «Schnellrechner» ist auf «/»
// zurückgebaut (nur noch die Fristen-ZEILE + zwei Link-Karten unter
// «Werkzeuge»), «Gesetze» hat eine eigene Schwerpunkt-Sektion, und die
// Landkarte heisst «Weitere Bereiche».
// W2·24-DESIGN-IDENTITAET R3 (6.9.2026, DEKLARIERTE Änderung §6.3): die
// Startseite ist das INHALTSVERZEICHNIS der Sammlung — Satzspiegel mit
// Marginalie statt Hero-Kasten, Listen statt Kacheln. Was sie ZEIGT, ist
// dasselbe (Suche, Bund, Kantone, Entscheide, Materialien, Frist-Zeile,
// Vertrauens-Sätze); geprüft wird darum unverändert der Bestand, nur an seiner
// neuen Form. Ebenfalls deklariert: die Sprach-Diät (Fahrplan §6 (h)) — die
// Value-Proposition-H1 «Schweizer Recht an einem Ort» ist gestrichen.

// Minimaler localStorage-Mock (Node hat keinen)
beforeEach(() => {
  const speicher = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (k: string) => speicher.get(k) ?? null,
    setItem: (k: string, v: string) => void speicher.set(k, v),
    removeItem: (k: string) => void speicher.delete(k),
    clear: () => speicher.clear(),
    key: () => null,
    length: 0,
  } as unknown as Storage;
});

// UI-Welle: /recherche ist aufgelöst — die Rechner- und Vorlagen-Register
// leben jetzt auf eigenen Übersichtsseiten (/rechner, /vorlagen), die die
// bestehende KategorieSektion wiederverwenden (kein ?kategorie-Drilldown mehr,
// keine ?q=-Flachsuche — die Suche liegt im Header-Dropdown).
const rechnerHtml = () =>
  renderToString(
    <MemoryRouter initialEntries={['/rechner']}>
      <LocaleProvider><RechnerUebersicht /></LocaleProvider>
    </MemoryRouter>,
  );
const vorlagenHtml = (url = '/vorlagen') =>
  renderToString(
    <MemoryRouter initialEntries={[url]}>
      <LocaleProvider><VorlagenUebersicht /></LocaleProvider>
    </MemoryRouter>,
  );

// Startseite V2 (Cockpit) — eigener Renderer für die Anatomie-Tests.
const startHtml = (url: string) =>
  renderToString(
    <MemoryRouter initialEntries={[url]}>
      <LocaleProvider><Startseite /></LocaleProvider>
    </MemoryRouter>,
  );

// Suche lebt seit dem App-Shell-Umbau im Top-Streifen (Topbar → HeaderSuche);
// Verhalten unverändert, neuer Ort (deklarierte Anpassung, §6 Ziff. 3).
const sucheHtml = (url: string) =>
  renderToString(
    <MemoryRouter initialEntries={[url]}>
      <LocaleProvider><HeaderSuche /></LocaleProvider>
    </MemoryRouter>,
  );

describe('Rechner-Übersicht /rechner (UI-Welle: Ersatz fürs Katalog-Deckblatt, §6.3)', () => {
  it('zeigt die drei Rechner-Kategorien als Sektionen — ohne Vorlagen/Deckblatt/Zurück-Weg, mit EINEM lokalen Filter (N0d·W4)', () => {
    const html = rechnerHtml();
    expect(html).toContain('id="register-zustaendigkeiten"');
    expect(html).toContain('id="register-fristen"');
    expect(html).toContain('id="register-gebuehren"');
    // Vorlagen liegen auf der eigenen Seite /vorlagen
    expect(html).not.toContain('id="register-vorlagen"');
    // kein Deckblatt-Klickmodell, kein «Alle Kategorien»-Zurück
    expect(html).not.toContain('aria-label="Oberkategorien"');
    expect(html).not.toContain('Alle Kategorien');
    // W2·10-UI-NAV/N0d·W4 (deklarierte fachliche Änderung, §6.3): GENAU EIN lokales
    // Filter-Feld über die bestehende Katalog-Struktur (keine zweite Voll-Suche —
    // die UniversalSuche bleibt der Kopf). Vorher war hier bewusst KEIN Suchfeld.
    expect(html).toContain('id="rechner-filter"');
    expect(html.match(/type="search"/g)?.length ?? 0).toBe(1);
  });

  it('Fristen-Register direkt sichtbar: Haupteinstieg Tagerechner + prozessual/materiell (kein Drilldown)', () => {
    const html = rechnerHtml();
    expect(html).toContain('id="register-titel-fristen"');
    expect(html).toContain('Fristen berechnen');
    expect(html).toContain('Einfacher Fristenrechner (Datum · Frist · Ferien-Wahl)');
    expect(html).toContain('href="/rechner/tagerechner"');
    expect(html).toContain('Prozessuale Fristen');
    expect(html).toContain('href="/rechner/zpo-fristen"');
    expect(html).toContain('href="/rechner/schkg-fristen"');
    expect(html).toContain('Materielle Fristen');
    expect(html).toContain('href="/rechner/verjaehrung"');
    expect(html).toContain('Art. 336c OR');
    // Ordnung INNERHALB des Fristen-Registers (Haupteinstieg Tagerechner vor
    // der materiellen Gewährleistungs-Frist). Ab dem Register-Anker schneiden,
    // da der neue «Einstieg nach Rechtsgebiet» (ROADMAP Schritt 5) oberhalb
    // dieselben Werkzeuge listet (deklarierte Struktur-Erweiterung, §6.3).
    const fristenAbschnitt = html.slice(html.indexOf('id="register-titel-fristen"'));
    expect(fristenAbschnitt.indexOf('Fristenrechner')).toBeLessThan(fristenAbschnitt.indexOf('Gewährleistung'));
    // Fristenspiegel aufgelöst; keine gleichrangige Mischliste
    expect(html).not.toContain('Fristenspiegel');
    // DEKLARIERT (§6.3, K8 W2·29-WERKBANK-KATALOGE, Entscheid David 23.9.2026
    // «zitierer auf /rechner zeigen»): der Amtliche Zitierer steht jetzt als
    // «Weitere Werkzeuge»-Zeile in der Zuständigkeits-Sektion (oberhalb der
    // Fristen). Die Zusicherung gilt darum ab dem Fristen-Register (Fristen +
    // Gebühren) statt seitenweit — ihr Gegenstand, keine Mischliste im
    // Fristen-Register, ist unverändert.
    expect(fristenAbschnitt).not.toContain('Weitere Werkzeuge');
  });

  it('Zuständigkeiten- + Gebühren-Sektion tragen ihre Werkzeuge; Ehrlichkeit (§8) bleibt', () => {
    const html = rechnerHtml();
    expect(html).toContain('Rechtswege');                  // Zuständigkeits-Register
    expect(html).toContain('href="/rechner/verzugszins"'); // Gebühren-Werkzeug
    expect(html).toContain('Entwurf</span>');
    expect(html).toContain('In Vorbereitung');
    expect(html).toContain('<details');
  });

  it('Methodik-Fuss + Pflichthinweis (§8) erreichbar; kein «kostenlos»', () => {
    const html = rechnerHtml();
    expect(html).toContain('So rechnet LexMetrik');
    expect(html).toContain('href="/methodik"');
    expect(html).toContain('Rechtlicher Hinweis');
    expect(html).not.toContain('kostenlos');
  });
});

describe('Vorlagen-Übersicht /vorlagen (UI-Welle)', () => {
  it('zeigt die Vorlagen-Sektion mit Dokument-Gruppen + Rechtsgebiet-Filter, keine Rechner-Sektion', () => {
    const html = vorlagenHtml();
    expect(html).toContain('id="register-vorlagen"');
    // Dokument-Gruppen (VORLAGE_SEKTIONEN-Titel)
    expect(html).toContain('Behördeneingaben');
    expect(html).toContain('Verträge');
    // Filter-Pillen nur in der Vorlagen-Kategorie
    expect(html).toContain('aria-label="Vorlagen nach Rechtsgebiet filtern"');
    // Rechner-Sektionen liegen auf /rechner
    expect(html).not.toContain('id="register-fristen"');
    expect(html).not.toContain('aria-label="Oberkategorien"');
  });

  it('eine verfügbare Vorlage ist direkt verlinkt; Filter-Reset «Alle Rechtsgebiete» vorhanden', () => {
    const html = vorlagenHtml();
    expect(html).toContain('href="/vorlagen/mahnung"');
    // Deklarierte Anpassung (D22-Nachzug D24, 6.9.2026): die Filterzeile trägt
    // jetzt das sichtbare Label «Filtern» (D22-Anatomie, wie /gesetze und
    // /materialien). Damit stünde die Achse nirgends mehr im Bedienelement —
    // die Reset-Option benennt sie darum selbst: «Alle Rechtsgebiete» statt
    // «Alle». Die ZUSICHERUNG des Falls ist unverändert: die Reset-Option
    // existiert im gerenderten Markup.
    expect(html).toContain('>Alle Rechtsgebiete<');
  });
});

describe('Globale Suche im Top-Streifen (UI-Welle: Dropdown überall, §6.3)', () => {
  // Deklarierte fachliche Änderung (§6.3, UI-Welle): Das Topbar-Feld führt nicht
  // mehr über ?q=/«/recherche», sondern zeigt Treffer als Dropdown direkt unter
  // dem Feld — auf JEDER Seite gleich. Beim ersten Render (SSR, leeres Feld) ist
  // genau ein leeres Suchfeld da; das Dropdown erscheint erst clientseitig beim
  // Tippen (Lazy-Daten).
  it('rendert genau ein leeres Suchfeld mit «/»- UND ⌘K-Kürzel — unabhängig vom Pfad', () => {
    for (const url of ['/', '/rechner/verzugszins', '/gesetze', '/rechtsprechung']) {
      const html = sucheHtml(url);
      expect(html.match(/type="search"/g)?.length, url).toBe(1);
      expect(html, url).toContain('value=""');
      // A5 (David 5.7.2026): das Feld trägt jetzt auch ⌘K/Ctrl-K (frühere Palette
      // entfallen, Shortcut fokussiert das Feld). «/» bleibt Bestandteil des Kürzels.
      expect(html, url).toContain('aria-keyshortcuts="/ Meta+K Control+K"');
    }
  });

  it('trägt die Such-Landmark (role="search") und kein ?q=-gebundenes Vorbefüllen mehr', () => {
    const html = sucheHtml('/?q=Rechtsvorschlag');
    expect(html).toContain('role="search"');
    // Kein Spiegeln von ?q= ins Feld (Dropdown-Suche ist URL-unabhängig).
    expect(html).toContain('value=""');
  });
});

describe('Startseite R3 — Inhaltsverzeichnis der Sammlung (deklarierte Anpassung §6.3)', () => {
  it('Titelblatt-Zeile: EINE H1 = die Begrüssung, Datumszeile, Bestands-Aufzählung — kein Slogan', () => {
    const html = startHtml('/');
    // Genau eine H1. DEKLARIERTE ANPASSUNG (W2·24-DESIGN-IDENTITAET D39,
    // David 7.9.2026, §6.3): bis hierher trug die H1 wortwörtlich den
    // Titelblatt-Begriff `SAMMLUNG_TITEL` («Sammlung») — Wortlaut «entferne
    // oberhalb der begrüssung das wort Sammlung […] die begrüssung [wird
    // die] h1». Die H1 trägt jetzt den (zufällig gezogenen) Gruss aus dem
    // Begrüssungs-Pool statt eines festen Worts; geprüft wird darum
    // Mitgliedschaft im Pool statt eines festen Substrings, UND dass
    // «Sammlung» nirgends mehr im Kopfbereich (vor der Bereichs-Reihe) steht.
    // `e2e/a11y.e2e.ts` prüft zusätzlich, dass die H1 SICHTBAR ist — eine
    // sr-only-H1 wäre dort rot.
    expect(html.match(/<h1[\s>]/g) ?? []).toHaveLength(1);
    const h1Inhalt = html.match(/<h1[^>]*>(.*?)<\/h1>/s)?.[1] ?? '';
    expect(h1Inhalt, `H1-Inhalt: ${h1Inhalt}`).not.toBe('');
    expect(ALLE_GRUESSE, `H1-Inhalt «${h1Inhalt}» nicht im Gruss-Pool`).toContain(h1Inhalt);
    const kopfbereich = html.slice(0, html.indexOf('Bereiche der Sammlung'));
    expect(kopfbereich, 'kein «Sammlung» oberhalb der Bereichs-Reihe (D39)').not.toContain('Sammlung');
    // DEKLARIERTE ANPASSUNG (W2·24-DESIGN-IDENTITAET R10, 6.9.2026, §6.3): hier
    // stand zusätzlich `toContain(SAMMLUNG_BESTAND)` — «Gesetze, Entscheide,
    // Materialien, Rechner, Vorlagen.». Genau diese fünf stehen seit R10 als
    // BEREICHS-REIHE mit ihren gemessenen Zahlen unmittelbar unter der Suche
    // (Referenzbild `pult-freigegeben.html`, Marke `.bereiche`); der Satz war
    // dieselbe Auskunft ein zweites Mal und ist Teil dessen, was David am
    // 6.9.2026 als «zu viel text» gesehen hat. Die AUSSAGE geht nicht verloren,
    // sie wird nur einmal statt zweimal gemacht — die fünf Bereiche werden
    // unten geprüft, und die Konstante selbst trägt unverändert der Seitenfuss
    // (`layout/Footer`, auf jeder Seite).
    // DEKLARIERTE ANPASSUNG (W2·29-WERKBANK-KATALOGE K7, Entscheid David
    // 22.9.2026, §6.3): fünf Bereiche → VIER Rubrik-Kacheln; «Rechner» und
    // «Vorlagen» stehen als EINE Kachel «Werkzeuge» (ein Register `w`).
    for (const bereich of ['Gesetze', 'Rechtsprechung', 'Materialien', 'Werkzeuge']) {
      expect(html, `Bereichs-Reihe: ${bereich}`).toContain(`>${bereich}</span>`);
    }
    // DEKLARIERTE ANPASSUNG (W2·29-WERKBANK-START-LAYOUT, David 24.9.2026
    // «entscheide sollen weg», §6.3): `href="/rechtsprechung"` stand zuletzt nur
    // noch im Link «alle Entscheide» der gestrichenen Entscheid-Liste — die
    // Kacheln sind seit S3 Knöpfe, die das Blatt vor Ort öffnen (oben: vier
    // `aria-controls="lm-start-blatt"`). Der Weg zur Rubrik führt über das Blatt.
    // Sprach-Diät (§6 (h)): die beiden getilgten Wendungen stehen nirgends mehr.
    expect(html).not.toContain('an einem Ort');
    expect(html).not.toContain('miteinander verzahnt');
    expect(html).not.toContain('Berechnung statt KI');
    // Begrüssung + Datum «T. Monat JJJJ». Seit D39 tickt daneben eine Uhr —
    // aber NICHT im statischen Server-Render hier (`renderToString` feuert
    // keine `useEffect`s, s. `Begruessung.tsx` `useHeute`): der HTML-Schnappschuss
    // trägt darum nur den unsichtbaren `00:00`-Platzhalter, der die Zeilenbreite
    // reserviert (§15, CLS) — keine echte, gebackene Uhrzeit.
    expect(html).toMatch(/\d{1,2}\.\s(Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)\s\d{4}/);
    expect(html, 'Uhrzeit-Platzhalter unsichtbar reserviert').toContain('visibility:hidden');
    expect(html.match(/\d{2}:\d{2}/g), 'einzige HH:MM-Stelle ist der Platzhalter').toEqual(['00:00']);
    // ── DEKLARIERTE ANPASSUNG (§6.3, W2·24-R5-F1C, David-Befund D18, 6.9.2026)
    // «insgesamt braucht es auf der startseite keine suche. nur oben reicht».
    // Hier standen drei Erwartungen an die Hero-Suche (`role="search"`,
    // `type="search"`) und an die Beispiel-Verweise unter ihr
    // (Art. 336c OR · BGE 152 V 52 · Arbeitsvertrag). Beides ist mit D18
    // entfallen: die EINE Suche steht im Titelblatt (`layout/HeaderSuche`, auf
    // JEDER Route — der `sucheHtml`-Block oben in dieser Datei prüft sie
    // unverändert, auch für die Adresse «/»), die Beispiel-Links fielen der
    // Sprach-Diät zum Opfer. Statt die Erwartungen zu streichen, werden sie
    // UMGEDREHT: die Startseite trägt jetzt nachweislich KEIN eigenes Suchfeld
    // — sonst wären es wieder zwei, und genau das war Davids Befund.
    expect(html, 'die Startseite trägt kein eigenes Suchfeld mehr (D18)').not.toContain('role="search"');
    expect(html).not.toContain('type="search"');
  });

  // DEKLARIERTE ANPASSUNG (K7, §6.3): der Titel sagte «keine Kachel-Optik
  // mehr» — seit dem Entscheid David 22.9.2026 trägt «/» die vier
  // Rubrik-Kacheln. Die Zusicherung `not.toContain('lc-tile')` (das alte
  // Rezept) bleibt unverändert scharf; nur der Titel widersprach dem Entscheid.
  // DEKLARIERTE ANPASSUNG (W2·29-WERKBANK-START S1, Prototyp + Go David
  // 23.9.2026, §6.3): die Listen-Module (Systematik, Kantone, Behörden) sind
  // mit dem Baukasten gestrichen (Auswahlfrage «Streichen») — Systematik und
  // Kantone sind Stufen der Gesetze-Kachel, die VOR ORT aufklappt und im
  // Prerender zu ist. Geprüft wird jetzt, was «/» wirklich trägt: vier
  // Kacheln (Gesetze als Knopf mit `aria-expanded`, die drei anderen bis S2/S3
  // als Link), «Jüngste Entscheide im Korpus» (§8-Wortlaut 5.9.2026), das
  // Schnellwerkzeug. Die Negativ-Zeilen bleiben unverändert.
  // DEKLARIERTE ANPASSUNG (S2 + S3, 23./24.9.2026, §6.3): Werkzeuge (S2),
  // Materialien (S3) und Rechtsprechung (S3-Nachzug, Entscheid David «Beim
  // Öffnen laden») klappen jetzt ebenfalls vor Ort auf — alle VIER Kacheln
  // sind Knöpfe mit derselben Anatomie (`aria-controls="lm-start-blatt"`).
  // `href="/rechner"` und `href="/materialien"` stehen darum nicht mehr auf
  // «/» und werden als fehlend geprüft; `/rechtsprechung` bleibt als Link
  // «alle Entscheide» in `EntscheideListe.tsx` bestehen — darum dort kein
  // `not.toContain`.
  // DEKLARIERTE ANPASSUNG (W2·29-WERKBANK-START-LAYOUT, David 24.9.2026
  // «entscheide sollen weg», §6.3): die Entscheid-Liste ist gestrichen — ihre
  // Überschrift wird jetzt als FEHLEND geprüft (kehrt den Entscheid vom
  // 23.9.2026 «neuste entscheide sollen nicht weg» um). Der Link «alle
  // Entscheide» fiel mit ihr; /rechtsprechung erreicht man über die Kachel.
  it('die vier Bestände stehen als Kacheln, daneben das Schnellwerkzeug — keine Entscheid-Liste, kein lc-tile-Rezept', () => {
    const html = startHtml('/');
    expect(html.match(/<button[^>]*aria-expanded="false"[^>]*aria-controls="lm-start-blatt"/g) ?? []).toHaveLength(4);
    expect(html).not.toContain('href="/rechner"');
    expect(html).not.toContain('href="/materialien"');
    expect(html).not.toContain('Jüngste Entscheide im Korpus');
    expect(html).toContain('Frist berechnen');
    // Das Blatt ist im Prerender ZU (Hydration, §15).
    expect(html).not.toContain('id="lm-start-blatt"');
    expect(html).not.toContain('lc-tile');
    expect(html).not.toContain('Weitere Bereiche');
    expect(html).not.toContain('Alle Bereiche');
    // Favoriten (5.6.) + Zeiterfassung (→ /rechner) sind nicht auf «/».
    expect(html).not.toContain('Favoriten');
    expect(html).not.toContain('Zeiterfassung');
    // Der Katalog (vier Oberkategorien) ist NICHT auf der Startseite.
    expect(html).not.toContain('aria-label="Oberkategorien"');
  });

  // DEKLARIERTE ANPASSUNG (W2·29-WERKBANK-START-UEBERARBEITUNG U2, §6.3):
  // David 24.9.2026 «ich möchte dass man bei den schnellwerkzeugen auswählen
  // kann» (Auswahl Frist · Verzugszins · Verjährung) — das kehrt den V4-Rückbau
  // «kein dreifacher Reiter» um. Geprüft wird jetzt GENAU EINE Reiterleiste mit
  // GENAU DREI Reitern, Frist gewählt (Prerender kennt keinen Speicher), und
  // weiterhin die echte Engine-Zeile samt Verweis in den Voll-Rechner.
  it('«Frist berechnen» ist die ECHTE Engine-Zeile — ein Wahl-Reiter, Frist vorgewählt, keine Kopie', () => {
    const html = startHtml('/');
    expect(html.match(/role="tablist"/g) ?? []).toHaveLength(1);
    expect(html.match(/role="tab"[ >]/g) ?? []).toHaveLength(3);
    expect(html).toMatch(/<button[^>]*role="tab"[^>]*aria-selected="true"[^>]*data-schnell="frist"/);
    // Die Fristen-Zeile rechnet live (echte Engine, keine Kopie).
    expect(html).toContain('Live-Berechnung');
    // Statt eingebetteter Zweit-Formulare der Verweis in den Voll-Rechner.
    // W2·29-WERKBANK-START S1 (§6.3, deklariert): die Verweise auf Prozesskosten
    // und Zuständigkeit standen im Fuss des gestrichenen Werkzeug-Moduls; alle
    // Rechner führt die Werkzeuge-Kachel (S2: Rechner | Vorlagen → Liste).
    expect(html).toContain('href="/rechner/tagerechner"');
  });

  it('§8: die Vertrauens-Sätze und der Pflichthinweis stehen wörtlich im Schluss', () => {
    const html = startHtml('/');
    expect(html).toContain('Rechtlicher Hinweis');
    expect(html).toContain('keine Rechtsberatung');
    expect(html).toContain('Kein Sprachmodell schätzt Ergebnisse');
  });
});

describe('FE-4: Rück-Abzweigung der Spezialrechner (FAHRPLAN-FRISTEN-EINHEIT)', () => {
  it.each(['RechnerVerjaehrung', 'RechnerGewaehrleistung', 'RechnerErbFristen', 'RechnerMietrecht', 'RechnerKuendigung'] as const)(
    '%s verlinkt zurück zum EINEN Fristenrechner-Einstieg', async (name) => {
      const mod = await import(`../pages/${name}.tsx`);
      const Seite = mod[name] as () => React.JSX.Element;
      const html = renderToString(
        <MemoryRouter initialEntries={['/x']}>
          <LocaleProvider><Seite /></LocaleProvider>
        </MemoryRouter>,
      );
      expect(html).toContain('Zum Fristenrechner');
      expect(html).toContain('href="/rechner/tagerechner"');
    });
});

describe('Kombinierter Fristenrechner (Auftrag 5.6.2026)', () => {
  it('Verfahrens-Schnitt vorhanden; Default Allgemein; Engines getrennt erreichbar', async () => {
    const { RechnerTagerechner } = await import('../pages/RechnerTagerechner');
    const html = renderToString(
      <MemoryRouter initialEntries={['/rechner/tagerechner']}>
        <LocaleProvider><RechnerTagerechner /></LocaleProvider>
      </MemoryRouter>,
    );
    expect(html).toContain('Allgemein (Vertrag/OR)');
    expect(html).toContain('Zivilprozess (ZPO)');
    expect(html).toContain('Betreibung (SchKG)');
    // Default = Allgemein-Form gerendert (Tabs frist/rueckwaerts/zwischen)
    expect(html).toContain('Tage zwischen');
    // FE-2: geführte Regime-Frage statt nackter Tabs; Weiche fragt, rät nicht
    expect(html).toContain('In welchem Verfahren läuft die Frist?');
    expect(html).toContain('Weiss nicht?');
  });
});

// ─── §8-Ratsche K0 (W2·29-WERKBANK-KATALOGE, 23.9.2026) ─────────────────────
//
// Jede GEPLANTE Karte (status 'geplant') der beiden Kataloge erscheint im
// Render genau einmal als «In Vorbereitung» — entweder als Titel im
// «In Vorbereitung (N)»-Aufklappblock oder als Zeile mit der
// `lc-badge-geplant`-Marke (Rechtsweg-Felder) — und NIE als verlinktes
// Werkzeug. Die Soll-Menge kommt aus der Quelle (KATALOG_KARTEN je
// Oberkategorie, §5), nicht aus einem Literal: wächst oder schrumpft der
// Katalog, zieht die Ratsche mit. Wächter gegen den Umbau KATALOGE (K1 ff.),
// der die Register-Anatomie neu schreibt. Stand 23.9.2026 (gezählt per
// vite-node über KATALOG_KARTEN × kartenDerKategorie): /rechner 37
// (zustaendigkeiten 3, fristen 12, gebuehren 22), /vorlagen 44.
describe('§8-Ratsche K0: geplante Karten stehen als «In Vorbereitung», nie als Werkzeug', () => {
  const geplantIn = (kats: OberkategorieId[]) =>
    kats.flatMap((kat) => kartenDerKategorie(KATALOG_KARTEN, kat)).filter((k) => k.status === 'geplant');

  /** Titel, die der Render als «In Vorbereitung» kennzeichnet, plus alle Link-Titel. */
  function kennzeichnung(html: string) {
    const { document } = parseHTML(`<!doctype html><html><body>${html}</body></html>`);
    const vorbereitet: string[] = [];
    let summenZahl = 0;
    // (a) Aufklappblock: <summary>In Vorbereitung (N)</summary><p><span>Titel</span>…</p>
    for (const d of document.querySelectorAll('details')) {
      const s = d.querySelector('summary')?.textContent?.trim() ?? '';
      const m = /^In Vorbereitung \((\d+)\)$/.exec(s);
      if (!m) continue;
      summenZahl += Number(m[1]);
      for (const span of d.querySelectorAll('p > span')) {
        vorbereitet.push((span.textContent ?? '').replace(/^ · /, '').trim());
      }
    }
    // (b) Zeile mit Marke: .kt-zeile mit .lc-badge-geplant; Titel = font-medium-Span.
    //     DEKLARIERT (§6.3, K4 23.9.2026): der Zeilen-Behälter heisst seit K4
    //     `.kt-zeile` statt `.lc-card` (Zeilen statt Karten) — die Zusicherung
    //     ist unverändert, nur der Anker zieht mit der Hülle um.
    let markenInLinks = 0;
    for (const b of document.querySelectorAll('.lc-badge-geplant')) {
      expect(b.textContent).toBe('In Vorbereitung');
      if (b.closest('a')) markenInLinks++;
      const titel = b.closest('.kt-zeile')?.querySelector('span.font-medium')?.textContent?.trim();
      vorbereitet.push(titel ?? '(Marke ohne Karten-Titel)');
      summenZahl++;
    }
    const linkTitel = [...document.querySelectorAll('a')].map((a) =>
      (a.querySelector('span.font-medium')?.textContent ?? a.textContent ?? '').trim());
    return { vorbereitet, summenZahl, markenInLinks, linkTitel };
  }

  const faelle: { seite: string; html: () => string; kats: OberkategorieId[] }[] = [
    { seite: '/rechner', html: rechnerHtml, kats: OBERKATEGORIEN.map((k) => k.id).filter((id) => id !== 'vorlagen') },
    { seite: '/vorlagen', html: vorlagenHtml, kats: ['vorlagen'] },
  ];

  for (const { seite, html, kats } of faelle) {
    it(`${seite}: jede geplante Karte genau einmal «In Vorbereitung», keine verlinkt`, () => {
      const soll = geplantIn(kats);
      expect(soll.length).toBeGreaterThan(0); // Ratsche muss etwas zu prüfen haben (§6.7)
      const sollTitel = soll.map((k) => k.title).sort((a, b) => a.localeCompare(b, 'de'));
      const { vorbereitet, summenZahl, markenInLinks, linkTitel } = kennzeichnung(html());
      // Zahl: Summe der «(N)»-Zähler + Marken = Soll aus der Quelle.
      expect(summenZahl).toBe(soll.length);
      // Menge: exakt die geplanten Titel, jeder genau einmal.
      expect([...vorbereitet].sort((a, b) => a.localeCompare(b, 'de'))).toEqual(sollTitel);
      // Nie als fertiges Werkzeug: keine Marke in einem Link, kein Link-Titel = geplanter Titel.
      expect(markenInLinks).toBe(0);
      expect(soll.filter((k) => k.href)).toEqual([]);
      const verlinktGeplant = linkTitel.filter((t) => sollTitel.includes(t));
      expect(verlinktGeplant).toEqual([]);
    });
  }
});

// ─── K8 Sichtbarkeit (W2·29-WERKBANK-KATALOGE, Entscheid David 23.9.2026) ───
//
// Befund 23.9.2026 (gemessen per vite-node, Render von /rechner und /vorlagen):
// die Karte `gerichtszitat` (modus 'rechner', status 'entwurf') war der
// Oberkategorie `vorlagen` zugeordnet. /rechner blendet `vorlagen` aus, und
// das VorlagenRegister auf /vorlagen zeigt nur echte Vorlagen — der Zitierer
// stand auf KEINER Katalogseite, zählte aber im Kopf «23 Rechner» (Register:
// 22 Links) und im /vorlagen-Fuss («27 verfügbar» bei Kopf 26). Entscheid
// David 23.9.2026 (Chat): «zitierer auf /rechner zeigen». Den /vorlagen-Fuss
// hat K5 (#999) parallel behoben; sein Wächter ist zaehler-eine-quelle.test.tsx
// (Fall c) — hier darum nicht doppelt.
//
// Invariante: jede verfügbare Rechner-Karte steht als Link im /rechner-
// Register; eine Rechner-Karte in der Oberkategorie `vorlagen` ist nur als
// ausdrücklich geführtes, GEPLANTES Vorlagen-Werkzeug zulässig (dann steht sie
// im «In Vorbereitung»-Block auf /vorlagen, Ratsche K0 oben) — eine verfügbare
// wäre auf beiden Seiten unsichtbar. Und /rechner zählt im Register dasselbe
// wie im Kopf (STARTSEITE_ZAEHLER, §5/§8).
describe('K8: jede Rechner-Karte steht auf einer Katalogseite, Kopf = Register', () => {
  /** Rechner-Karten (modus 'rechner') der Oberkategorie `vorlagen` — ausdrücklich geführt. */
  const VORLAGEN_WERKZEUGE = ['checklisten', 'mandatsaufnahme'];

  const dom = (html: string) => parseHTML(`<!doctype html><html><body>${html}</body></html>`).document;
  const registerLinks = (html: string) => new Set(
    [...dom(html).querySelectorAll('section[id^="register-"] a[href]')].map((a) => a.getAttribute('href')!),
  );

  it('Rechner-Karten bei `vorlagen` sind genau die geführten Vorlagen-Werkzeuge, alle geplant', () => {
    const beiVorlagen = KATALOG_KARTEN.filter((k) => k.modus === 'rechner' && kategorieFuer(k) === 'vorlagen');
    expect(beiVorlagen.map((k) => k.id).sort()).toEqual([...VORLAGEN_WERKZEUGE].sort());
    expect(beiVorlagen.filter((k) => istVerfuegbar(k)).map((k) => k.id)).toEqual([]);
  });

  it('/rechner: jede verfügbare Rechner-Karte als Link im Register, Anzahl = Kopf', () => {
    const soll = KATALOG_KARTEN.filter((k) => k.modus === 'rechner' && istVerfuegbar(k) && k.href);
    const links = registerLinks(rechnerHtml());
    expect(soll.filter((k) => !links.has(k.href!)).map((k) => k.id)).toEqual([]);
    const rechnerLinks = [...links].filter((h) => h.startsWith('/rechner/'));
    expect(rechnerLinks.length).toBe(STARTSEITE_ZAEHLER.rechner);
    expect(rechnerHtml()).toContain(`${STARTSEITE_ZAEHLER.rechner} Rechner nach Rechtsgebiet`);
  });
});
