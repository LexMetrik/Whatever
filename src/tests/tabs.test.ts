import { describe, it, expect, beforeEach } from 'vitest';
import {
  ladeTabs, merkeTab, ersetzeTab, schliesseTab, leereTabs, ordneTabsUm, naechsteInstanz,
  aktualisiereTabArtikel,
  schliesseAndere, schliesseRechtsVon, stelleLetztenWiederHer, letzterGeschlossener,
  reiterKurzform, reiterKurzformText, oeffnetReiter,
} from '../lib/tabs';

// In-App-Reiter (lib/tabs.ts): Persistenz, stabile Reihenfolge, Dublette per
// pathname, MAX-Kappung, korruptes localStorage. Reines Speicher-Werkzeug.
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

describe('tabs.ts — offene Reiter', () => {
  it('neuer Reiter hinten angehängt; Reihenfolge stabil', () => {
    merkeTab('/rechner/tagerechner');
    merkeTab('/gesetze/bund/or');
    expect(ladeTabs().map((t) => t.path)).toEqual(['/rechner/tagerechner', '/gesetze/bund/or']);
  });

  it('Dublette per pathname: Position bleibt, Label wird aktualisiert', () => {
    merkeTab('/rechner/tagerechner');
    merkeTab('/gesetze/bund/or');
    merkeTab('/rechner/tagerechner', 'Fristenrechner');
    const t = ladeTabs();
    expect(t.map((x) => x.path)).toEqual(['/rechner/tagerechner', '/gesetze/bund/or']);
    expect(t[0].label).toBe('Fristenrechner');
  });

  it('verschiedene ?query desselben Pfads = derselbe Reiter', () => {
    merkeTab('/rechner/tagerechner?preset=a');
    merkeTab('/rechner/tagerechner?preset=b');
    expect(ladeTabs().length).toBe(1);
  });

  it('MAX 50: der älteste (vorn) fällt heraus (Limit 8→50, Auftrag David)', () => {
    for (let i = 0; i < 52; i++) merkeTab(`/rechner/r${i}`);
    const t = ladeTabs();
    expect(t.length).toBe(50);
    expect(t[0].path).toBe('/rechner/r2');
    expect(t[49].path).toBe('/rechner/r51');
  });

  it('?r-Diskriminator: dasselbe Gesetz mehrfach offen (Auftrag David)', () => {
    merkeTab('/gesetze/bund/OR');
    merkeTab('/gesetze/bund/OR?r=2');
    expect(ladeTabs().map((t) => t.path)).toEqual(['/gesetze/bund/OR', '/gesetze/bund/OR?r=2']);
    // andere Query (kein ?r) bleibt EIN Reiter
    merkeTab('/gesetze/bund/OR?preset=x');
    expect(ladeTabs().length).toBe(2);
  });

  it('naechsteInstanz: nächster freier ?r, Artikel-Anker bleibt erhalten', () => {
    merkeTab('/gesetze/bund/OR');
    expect(naechsteInstanz('/gesetze/bund/OR#art-41')).toBe('/gesetze/bund/OR?r=2#art-41');
    merkeTab('/gesetze/bund/OR?r=2');
    expect(naechsteInstanz('/gesetze/bund/OR')).toBe('/gesetze/bund/OR?r=3');
  });

  // R15 (Entscheid David 24.9.2026): jedes «+» legt eine neue Startseiten-
  // Instanz an — die Buchführung ist dieselbe wie beim Gesetz, «/» ist ein
  // Pfad wie jeder andere.
  it('naechsteInstanz(\'/\'): bei offener Sammlung /?r=2, dann /?r=3 (R15)', () => {
    merkeTab('/');
    expect(naechsteInstanz('/')).toBe('/?r=2');
    merkeTab('/?r=2');
    expect(naechsteInstanz('/')).toBe('/?r=3');
    expect(ladeTabs().map((t) => t.path)).toEqual(['/', '/?r=2']);
  });

  it('aktualisiereTabArtikel ändert nur den Anker des passenden Reiters', () => {
    merkeTab('/gesetze/bund/OR?r=2');
    aktualisiereTabArtikel('/gesetze/bund/OR?r=2#art-97');
    expect(ladeTabs()[0].path).toBe('/gesetze/bund/OR?r=2#art-97');
    // kein passender Reiter → keine Änderung, kein Crash
    aktualisiereTabArtikel('/gesetze/bund/ZGB#art-1');
    expect(ladeTabs().length).toBe(1);
  });

  // ── W2·24 §5a Ziff. 3 (R2-Nachzug 6.9.2026) · ERSETZEN STATT ANHÄUFEN ─────
  // VERHALTENSÄNDERUNG, deklariert: bis hierher legte JEDE Navigation einen
  // Reiter an (gemessen im Preview: drei Klicks OR → ZGB → ZPO = drei Reiter).
  // `merkeTab` behält seine anhängende Bedeutung — sie ist jetzt der Weg für den
  // AUSDRÜCKLICH neuen Reiter (Mittelklick, ⌘/Ctrl+Enter, zweite Instanz);
  // die gewöhnliche Navigation läuft über `ersetzeTab`.
  describe('ersetzeTab — die Navigation verbraucht den aktiven Reiter', () => {
    it('ersetzt an Ort und Stelle; die Reihenfolge bleibt', () => {
      merkeTab('/gesetze/bund/OR');
      merkeTab('/rechner/tagerechner');
      ersetzeTab('/gesetze/bund/OR', '/gesetze/bund/ZGB');
      expect(ladeTabs().map((t) => t.path)).toEqual(['/gesetze/bund/ZGB', '/rechner/tagerechner']);
    });

    it('drei Navigationen hintereinander = EIN Reiter (kein Wildwuchs)', () => {
      ersetzeTab(null, '/gesetze/bund/OR');
      ersetzeTab('/gesetze/bund/OR', '/gesetze/bund/ZGB');
      ersetzeTab('/gesetze/bund/ZGB', '/gesetze/bund/ZPO');
      expect(ladeTabs().map((t) => t.path)).toEqual(['/gesetze/bund/ZPO']);
    });

    it('Ziel schon offen → nur wechseln, der aktive Reiter bleibt stehen', () => {
      merkeTab('/gesetze/bund/OR');
      merkeTab('/gesetze/bund/ZGB');
      ersetzeTab('/gesetze/bund/ZGB', '/gesetze/bund/OR', 'Obligationenrecht');
      expect(ladeTabs().map((t) => t.path)).toEqual(['/gesetze/bund/OR', '/gesetze/bund/ZGB']);
      expect(ladeTabs()[0].label).toBe('Obligationenrecht');
    });

    it('kein aktiver Reiter (Kaltstart, Übersichtsseite) → anhängen wie bisher', () => {
      merkeTab('/gesetze/bund/OR');
      ersetzeTab(null, '/rechner/tagerechner');
      ersetzeTab('/gesetze/bund/UNBEKANNT', '/vorlagen/kuendigung');
      expect(ladeTabs().map((t) => t.path))
        .toEqual(['/gesetze/bund/OR', '/rechner/tagerechner', '/vorlagen/kuendigung']);
    });

    it('der ersetzte Reiter erbt NICHTS vom alten (Label, Lesestellung, Wahl)', () => {
      merkeTab('/gesetze/bund/OR#art-336_c', 'Obligationenrecht');
      aktualisiereTabArtikel('/gesetze/bund/OR#art-97');
      ersetzeTab('/gesetze/bund/OR', '/gesetze/bund/ZGB');
      expect(ladeTabs()).toEqual([{ path: '/gesetze/bund/ZGB' }]);
    });
  });

  // ── F5 (Prüfbefund 6.9.2026) · BESCHRIFTUNG AUS DER ADRESSE, NICHT AUS DEM
  // SCROLL. Rot zu bekommen: in `eintragAus` den `wahl`-Zweig streichen, oder
  // in `aktualisiereTabArtikel` `wahl` mitschreiben.
  describe('wahl — der gewählte Anker neben der Lesestellung', () => {
    it('die Adresse setzt `wahl`; der Scroll-Spy rührt sie nicht an', () => {
      merkeTab('/gesetze/bund/OR#art-336_c');
      expect(ladeTabs()[0].wahl).toBe('#art-336_c');
      aktualisiereTabArtikel('/gesetze/bund/OR#art-97');
      const t = ladeTabs()[0];
      expect(t.path, 'die Lesestellung folgt dem Scroll').toBe('/gesetze/bund/OR#art-97');
      expect(t.wahl, 'die Beschriftung folgt der Adresse').toBe('#art-336_c');
    });

    it('ein Update OHNE Anker löscht die Wahl nicht (Tracker schickt pathname+search)', () => {
      merkeTab('/gesetze/bund/OR#art-336_c');
      merkeTab('/gesetze/bund/OR');
      expect(ladeTabs()[0].wahl).toBe('#art-336_c');
    });

    it('ohne Anker in der Adresse gibt es keine Wahl (kein geratener Artikel)', () => {
      merkeTab('/gesetze/bund/ZGB');
      aktualisiereTabArtikel('/gesetze/bund/ZGB#art-3');
      expect(ladeTabs()[0].wahl).toBeUndefined();
    });
  });

  it('schliesseTab entfernt per pathname', () => {
    merkeTab('/a'); merkeTab('/b');
    schliesseTab('/a');
    expect(ladeTabs().map((t) => t.path)).toEqual(['/b']);
  });

  it('leereTabs leert die Liste', () => {
    merkeTab('/a'); leereTabs();
    expect(ladeTabs()).toEqual([]);
  });

  it('ordneTabsUm verschiebt den Reiter an die Zielposition (#12 Drag-and-Drop)', () => {
    merkeTab('/a'); merkeTab('/b'); merkeTab('/c'); merkeTab('/d');
    // /d nach vorne (an Position von /a)
    ordneTabsUm('/d', '/a');
    expect(ladeTabs().map((t) => t.path)).toEqual(['/d', '/a', '/b', '/c']);
    // /d wieder nach hinten (an Position von /c)
    ordneTabsUm('/d', '/c');
    expect(ladeTabs().map((t) => t.path)).toEqual(['/a', '/b', '/c', '/d']);
  });

  // ── D15/D16 (David 6.9.2026) · DIE SEITE KOMMT VOM ZEIGER ────────────────
  // «per drag and drop soll man register verschieben können … analog browser».
  // Der dritte Parameter sagt, ob der Reiter DAVOR oder DAHINTER einrastet;
  // ohne ihn liesse sich kein Reiter ans ENDE ziehen (hinter dem letzten gibt
  // es kein weiteres Ziel). Der Default bleibt die frühere, richtungsabhängige
  // Regel — der Fall darüber prüft sie unverändert weiter.
  it('ordneTabsUm mit ausdrücklicher Seite: davor / dahinter', () => {
    merkeTab('/a'); merkeTab('/b'); merkeTab('/c');
    // /a DAHINTER /c → ans Ende (mit dem Default wäre es ebenfalls dahinter,
    // hier steht es ausdrücklich).
    ordneTabsUm('/a', '/c', false);
    expect(ladeTabs().map((t) => t.path)).toEqual(['/b', '/c', '/a']);
    // /a DAVOR /c — dieselbe Richtung wie eben, aber die andere Seite: der
    // Default (von > nach ⇒ davor … hier von < nach) läge falsch.
    leereTabs(); merkeTab('/a'); merkeTab('/b'); merkeTab('/c');
    ordneTabsUm('/a', '/c', true);
    expect(ladeTabs().map((t) => t.path)).toEqual(['/b', '/a', '/c']);
    // Rückwärts, ausdrücklich dahinter.
    leereTabs(); merkeTab('/a'); merkeTab('/b'); merkeTab('/c');
    ordneTabsUm('/c', '/a', false);
    expect(ladeTabs().map((t) => t.path)).toEqual(['/a', '/c', '/b']);
  });

  it('ordneTabsUm: unbekannter Pfad oder gleiche Position → unverändert', () => {
    merkeTab('/a'); merkeTab('/b');
    ordneTabsUm('/x', '/a');   // /x existiert nicht
    ordneTabsUm('/a', '/a');   // gleiche Position
    expect(ladeTabs().map((t) => t.path)).toEqual(['/a', '/b']);
  });

  it('ordneTabsUm identifiziert per pathname (Query egal)', () => {
    merkeTab('/a'); merkeTab('/b');
    ordneTabsUm('/b?x=1', '/a?y=2');
    expect(ladeTabs().map((t) => t.path)).toEqual(['/b', '/a']);
  });

  it('korruptes JSON / Nicht-Array → leere Liste (kein Crash)', () => {
    localStorage.setItem('lexmetrik-tabs', '{kaputt');
    expect(ladeTabs()).toEqual([]);
    localStorage.setItem('lexmetrik-tabs', '42');
    expect(ladeTabs()).toEqual([]);
  });

  // ── DEKLARIERTE TEST-ÄNDERUNG (§6.3) · R14, Entscheid David 7.9.2026 ──────
  //
  // Hier stand der Block «neuerLeererReiter — höchstens ein leerer Reiter»
  // (D19, 6.9.2026) mit fünf Fällen über `{ path: '/', leer: true }`. Die
  // geprüfte SACHE — «höchstens EINE Neuer-Reiter-Seite, und die erste
  // Navigation füllt genau sie» — ist unverändert; nur trägt sie seit R14
  // kein eigenes Datenmodell mehr: die Sammlung «/» ist ein gewöhnlicher
  // Reiter, `merkeTab` erkennt sie an ihrer Identität. Der alte Wortlaut der
  // aufgehobenen Erwartung, damit er nachlesbar bleibt:
  //   `neuerLeererReiter(); neuerLeererReiter()` ⇒ `[{ path: '/', leer: true }]`
  //   `hatLeerenReiter()` ⇒ true/false
  // ROT ZU BEKOMMEN (§6.7): in `lib/tabs.ladeTabs` den `leer`-Filter der
  // Migration streichen ⇒ der Migrations-Fall unten liest das Feld zurück.
  describe('R14 — die Sammlung ist ein Reiter wie jeder andere', () => {
    it('höchstens EINE Sammlung: zweimal öffnen ergibt einen Reiter', () => {
      merkeTab('/rechner/tagerechner');
      merkeTab('/');
      merkeTab('/');
      expect(ladeTabs()).toEqual([{ path: '/rechner/tagerechner' }, { path: '/' }]);
    });

    it('die Navigation aus der Sammlung heraus füllt GENAU sie (§5a Ziff. 3)', () => {
      merkeTab('/');
      ersetzeTab('/', '/gesetze/bund/OR#art-257_d', 'Art. 257d OR');
      const t = ladeTabs();
      expect(t.length).toBe(1);
      expect(t[0].path).toBe('/gesetze/bund/OR#art-257_d');
    });

    it('ein bereits offenes Ziel behält seine Position — die Sammlung bleibt stehen', () => {
      merkeTab('/gesetze/bund/OR');
      merkeTab('/');
      ersetzeTab('/', '/gesetze/bund/OR');
      expect(ladeTabs().map((x) => x.path)).toEqual(['/gesetze/bund/OR', '/']);
    });

    it('ein gespeicherter leerer «+»-Reiter (D19) lädt als gewöhnliche Sammlung', () => {
      localStorage.setItem('lexmetrik-tabs',
        JSON.stringify([{ path: '/gesetze/bund/OR' }, { path: '/', leer: true }]));
      expect(ladeTabs()).toEqual([{ path: '/gesetze/bund/OR' }, { path: '/' }]);
    });

    it('trifft die Migration auf eine schon offene Sammlung, bleibt EIN Reiter', () => {
      localStorage.setItem('lexmetrik-tabs',
        JSON.stringify([{ path: '/' }, { path: '/', leer: true }]));
      expect(ladeTabs()).toEqual([{ path: '/' }]);
    });
  });
  // ═══ R14b · JEDE ROUTE IST EIN REITER (Nachzug 7.9.2026) ═════════════════
  //
  // ── DEKLARIERTE TEST-ÄNDERUNG (§6.3) · R14b, 7.9.2026 ─────────────────────
  // Hier stand der Block «M2 — Materialien sind reiterfähig» mit drei Fällen
  // über `lib/tabs.istReiterPfad` (`'/materialien/…' === true`,
  // `'/' === true`, `'/ueber' === false`). Die Funktion ist mit R14b ERSATZLOS
  // gestrichen — es gibt keine Liste mehr, die entscheidet, welcher Pfad einen
  // Reiter trägt (Herleitung in `lib/tabs.ts`, Block «R14b»). Drei Fälle, die
  // nach dem Rückbau nicht mehr scheitern können, bleiben nicht als Attrappe
  // stehen (§6.7). Was die M2-Zusage inhaltlich schützte — «ein Material-Reiter
  // heisst nicht «Material öffnen»» — misst unverändert
  // `src/tests/reiterKurzformD27.test.ts`; dass die Leiste auf JEDER Route
  // mindestens einen Reiter trägt, misst `e2e/w224-r14b-meta-reiter.e2e.ts`.
  //
  // ROT ZU BEKOMMEN (§6.7): in `lib/tabs.KURZFORM` die Zeile `'/einstellungen'`
  // streichen ⇒ der erste Fall unten misst `null` statt «Einstellungen», und
  // der Reiter hiesse im Bild «Einstellungen — LexMetrik» (SEO-Titel).
  describe('R14b — Meta-Routen tragen eine Reiter-Kurzform', () => {
    it('die fünf Meta-Routen haben eine kanonische Kurzform, nicht den SEO-Titel', () => {
      expect(reiterKurzform('/einstellungen')).toBe('Einstellungen');
      expect(reiterKurzform('/ueber')).toBe('Über');
      expect(reiterKurzform('/methodik')).toBe('Methodik');
      expect(reiterKurzform('/kontakt')).toBe('Kontakt');
      expect(reiterKurzform('/datenschutz')).toBe('Datenschutz');
    });

    it('die Kurzform überlebt ?query und #hash — der Reiter heisst gleich', () => {
      expect(reiterKurzform('/einstellungen?r=2')).toBe('Einstellungen');
      expect(reiterKurzform('/methodik#regeln')).toBe('Methodik');
    });

    // ROT ZU BEKOMMEN (§6.7): in `lib/tabs.basisKurzform` den R14b-Zweig
    // «EINE ROUTE OHNE TITEL TRÄGT IHRE ADRESSE» entfernen ⇒ der Reiter hiesse
    // «Zuletzt geöffnet», also ein Name, den die Seite nicht hat (§8).
    it('eine Route ohne Titel (404) trägt ihre Adresse, nicht «Zuletzt geöffnet»', () => {
      expect(reiterKurzformText({ path: '/gibt-es-nicht' }, {})).toBe('/gibt-es-nicht');
      expect(reiterKurzformText({ path: '/gibt-es-nicht?r=2' }, {})).toBe('/gibt-es-nicht (2)');
    });
  });

  // ═══ W2·29-WERKBANK-REST S3 · META-SEITEN OHNE REITER (Entscheid David 19.9.2026)
  // ROT ZU BEKOMMEN (§6.7): in `lib/tabs.META_OHNE_REITER` '/kontakt' streichen
  // ⇒ der erste Fall wird rot; die Liste um '/datenschutz' ergänzen ⇒ der
  // zweite wird rot (der Entscheid nennt genau vier Routen).
  describe('W2·29-REST S3 — oeffnetReiter', () => {
    it('die vier Meta-Seiten öffnen keinen Reiter — auch mit ?query, #anker, Schluss-«/»', () => {
      for (const p of ['/ueber', '/methodik', '/einstellungen', '/kontakt']) {
        expect(oeffnetReiter(p), p).toBe(false);
      }
      expect(oeffnetReiter('/kontakt?x=1')).toBe(false);
      expect(oeffnetReiter('/methodik#grenzen')).toBe(false);
      expect(oeffnetReiter('/ueber/')).toBe(false);
    });

    it('jede andere Route bleibt Reiterinhalt (R14b unverändert)', () => {
      for (const p of ['/', '/?r=2', '/datenschutz', '/abdeckung', '/suche', '/gesetze',
        '/gesetze/bund/OR#art_1', '/rechner/tagerechner', '/gibt-es-nicht', '/ueberblick']) {
        expect(oeffnetReiter(p), p).toBe(true);
      }
    });
  });

  // ═══ M3 · «ZULETZT GESCHLOSSEN» (Prüfbefund R11 #37) ══════════════════════
  //
  // ROT ZU BEKOMMEN (§6.7): den `merkeGeschlossen`-Aufruf in `schliesseTab`
  // entfernen ⇒ `stelleLetztenWiederHer` gibt null zurück, alle Fälle unten
  // werden rot. Die POSITION ist der eigentliche Prüfgegenstand: ein
  // Wiederherstellen ans Ende der Leiste wäre kein Wiederherstellen.
  describe('M3 — zuletzt geschlossen', () => {
    it('Schliessen an Position 2 ⇒ Wiederherstellung an Position 2, nicht am Ende', () => {
      merkeTab('/gesetze/bund/OR');
      merkeTab('/rechtsprechung/bge_146_III_1');
      merkeTab('/rechner/zpo-fristen');
      schliesseTab('/rechtsprechung/bge_146_III_1');
      expect(ladeTabs().map((t) => t.path)).toEqual(['/gesetze/bund/OR', '/rechner/zpo-fristen']);
      expect(stelleLetztenWiederHer()?.path).toBe('/rechtsprechung/bge_146_III_1');
      expect(ladeTabs().map((t) => t.path))
        .toEqual(['/gesetze/bund/OR', '/rechtsprechung/bge_146_III_1', '/rechner/zpo-fristen']);
    });

    it('Label und gewählter Anker kommen mit zurück', () => {
      merkeTab('/gesetze/bund/OR#art-336_c', 'OR');
      schliesseTab('/gesetze/bund/OR');
      const wieder = stelleLetztenWiederHer();
      expect(wieder?.label).toBe('OR');
      expect(wieder?.wahl).toBe('#art-336_c');
      expect(ladeTabs()[0].wahl).toBe('#art-336_c');
    });

    it('auch ein ERSETZTER Reiter (§5a Ziff. 3) landet im Ring — dort ist der Verlust der Normalfall', () => {
      merkeTab('/gesetze/bund/OR');
      ersetzeTab('/gesetze/bund/OR', '/gesetze/bund/ZGB');
      expect(ladeTabs().map((t) => t.path)).toEqual(['/gesetze/bund/ZGB']);
      expect(stelleLetztenWiederHer()?.path).toBe('/gesetze/bund/OR');
      expect(ladeTabs().map((t) => t.path)).toEqual(['/gesetze/bund/OR', '/gesetze/bund/ZGB']);
    });

    it('leerer Ring: kein Fehler, kein Reiter — die Aktion wird gar nicht erst angeboten', () => {
      expect(letzterGeschlossener()).toBeNull();
      expect(stelleLetztenWiederHer()).toBeNull();
      expect(ladeTabs()).toEqual([]);
    });

    // DEKLARIERTE TEST-ÄNDERUNG (§6.3) · R14: alter Wortlaut «der leere
    // «+»-Reiter kommt NICHT in den Ring» mit `neuerLeererReiter()`. Die
    // Zusage ist unverändert — nur heisst der Reiter jetzt «Sammlung» und
    // trägt kein `leer`-Feld mehr; erkannt wird er an seinem Pfad.
    it('die Sammlung kommt NICHT in den Ring — sie trägt kein Dokument', () => {
      merkeTab('/');
      schliesseTab('/');
      expect(letzterGeschlossener()).toBeNull();
    });

    // R14 · Blättern (Zurück/Vorwärts) ist kein Verlust: `ringt = false`.
    // ROT ZU BEKOMMEN (§6.7): in `lib/tabs.ersetzeTab` das `if (ringt)` wieder
    // durch den unbedingten `merkeGeschlossen`-Aufruf ersetzen.
    it('eine POP-Navigation (Zurück/Vorwärts) füllt den Ring NICHT', () => {
      merkeTab('/gesetze/bund/OR');
      ersetzeTab('/gesetze/bund/OR', '/gesetze/bund/ZGB', undefined, false);
      expect(ladeTabs().map((t) => t.path)).toEqual(['/gesetze/bund/ZGB']);
      expect(letzterGeschlossener()).toBeNull();
    });

    // ── DEKLARIERTE TEST-ÄNDERUNG (§6.3) · W2·18 Welle 2 Punkt 4 ──────────
    // Der Titel hiess «holt von hinten nach vorn zurück» und die zwei
    // Erwartungen standen in dieser Richtung (erst ZGB, dann OR). Genau das
    // WAR der Defekt: bei ZWEI Reitern fiel er nicht auf (das Endergebnis
    // stimmte zufällig), ab DREI ergab er [a, c, b] und bei zehn
    // [r0, r9, r1, r8, …]. Seit Punkt 4 legt eine Geste ihre Reiter
    // absteigend nach Position ab, der Stapel gibt sie aufsteigend zurück —
    // der VORDERSTE kommt zuerst. Die geprüfte Zusage ist unverändert und
    // schärfer: die Leiste steht am Ende wieder in Ur-Reihenfolge (die
    // letzte Zeile, unberührt). Der Reihenfolge-Beweis über drei und zehn
    // Reiter steht in `src/tests/reiter-ring-ordnung.test.ts`.
    it('«Alle schliessen» füllt den Ring; Wiederherstellen holt von vorn nach hinten zurück', () => {
      merkeTab('/gesetze/bund/OR');
      merkeTab('/gesetze/bund/ZGB');
      leereTabs();
      expect(ladeTabs()).toEqual([]);
      expect(stelleLetztenWiederHer()?.path).toBe('/gesetze/bund/OR');
      expect(stelleLetztenWiederHer()?.path).toBe('/gesetze/bund/ZGB');
      expect(ladeTabs().map((t) => t.path)).toEqual(['/gesetze/bund/OR', '/gesetze/bund/ZGB']);
    });

    it('ist derselbe Reiter inzwischen wieder offen, wird der Ring-Eintrag verbraucht statt verdoppelt', () => {
      merkeTab('/gesetze/bund/OR');
      schliesseTab('/gesetze/bund/OR');
      merkeTab('/gesetze/bund/OR');
      expect(stelleLetztenWiederHer()?.path).toBe('/gesetze/bund/OR');
      expect(ladeTabs().map((t) => t.path)).toEqual(['/gesetze/bund/OR']);
      expect(letzterGeschlossener()).toBeNull();
    });
  });

  // ═══ M4 · DIE SAMMEL-SCHLIESSER DES KONTEXTMENÜS ══════════════════════════
  //
  // ROT ZU BEKOMMEN (§6.7): in `schliesseRechtsVon` `slice(0, idx + 1)` durch
  // `slice(0, idx)` ersetzen ⇒ der genannte Reiter fiele mit weg und der erste
  // Fall unten wird rot.
  describe('M4 — Alle anderen / rechts davon schliessen', () => {
    beforeEach(() => {
      merkeTab('/gesetze/bund/OR');
      merkeTab('/rechtsprechung/bge_146_III_1');
      merkeTab('/rechner/zpo-fristen');
      merkeTab('/vorlagen/arbeitsvertrag');
    });

    it('rechts davon: der genannte Reiter und alles links bleibt', () => {
      schliesseRechtsVon('/rechtsprechung/bge_146_III_1');
      expect(ladeTabs().map((t) => t.path)).toEqual(['/gesetze/bund/OR', '/rechtsprechung/bge_146_III_1']);
    });

    it('rechts davon am letzten Reiter: nichts geschieht, nichts landet im Ring', () => {
      schliesseRechtsVon('/vorlagen/arbeitsvertrag');
      expect(ladeTabs().length).toBe(4);
      expect(letzterGeschlossener()).toBeNull();
    });

    // ── DEKLARIERTE TEST-ÄNDERUNG (§6.3) · W2·18 Welle 2 Punkt 4 ──────────
    // Geprüft war, WELCHER der drei zuerst zurückkommt: der hinterste
    // (`/vorlagen/arbeitsvertrag`). Seit Punkt 4 ist es der VORDERSTE — nur so
    // landet eine ganze Geste wieder in Ur-Reihenfolge. Die Zusage des Falles
    // («genau einer bleibt, die drei anderen sind wiederherstellbar») ist
    // unverändert und wird hier stärker geprüft als vorher: jetzt kommen ALLE
    // DREI zurück, und zwar an ihre alten Plätze.
    it('alle anderen: genau einer bleibt, die drei anderen sind wiederherstellbar', () => {
      schliesseAndere('/rechner/zpo-fristen');
      expect(ladeTabs().map((t) => t.path)).toEqual(['/rechner/zpo-fristen']);
      expect(letzterGeschlossener()?.path).toBe('/gesetze/bund/OR');
      expect(stelleLetztenWiederHer()?.path).toBe('/gesetze/bund/OR');
      expect(ladeTabs().map((t) => t.path)).toEqual(['/gesetze/bund/OR', '/rechner/zpo-fristen']);
      stelleLetztenWiederHer();
      stelleLetztenWiederHer();
      expect(ladeTabs().map((t) => t.path)).toEqual(['/gesetze/bund/OR',
        '/rechtsprechung/bge_146_III_1', '/rechner/zpo-fristen', '/vorlagen/arbeitsvertrag']);
    });

    it('ein unbekannter Pfad lässt beide Listen unangetastet (nie stilles Schliessen)', () => {
      schliesseAndere('/gesetze/bund/UNBEKANNT');
      schliesseRechtsVon('/gesetze/bund/UNBEKANNT');
      expect(ladeTabs().length).toBe(4);
    });
  });
});
