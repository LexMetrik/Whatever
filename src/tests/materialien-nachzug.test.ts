// Materialien-Nachzug-Bot (scripts/materialien/nachzug.ts, MONITOR 6.10.2026).
// Bewiesen wird: Drift-Auswertung nur per Positiv-Liste (Netzfehler/Count-Gate = Hinweis, kein
// Vollcrawl), Rauschschutz über angehängte dok-Zeilen, Reihenfolge snapshot → materialien je Quelle
// vor EINER Kaskade ohne Revisionen, Werkzeugfehler ⇒ Exit ≠ 0, und die Workflow-Struktur
// (kein Auto-Merge, Entwurf bei «pruefen», Staging = ERLAUBTE_PFADE). Nachzug nach Gegenprüfung
// 6.10.2026: Vorprüfung vor jedem Netz-Abruf (B1), rote Stufe festgenagelt (S1), Netzfehler im
// Snapshot ⇒ verworfen statt rot (K1), zweiter Netzfehler in Folge ⇒ rot über den Netz-Zettel.
import { describe, expect, it, beforeAll } from 'vitest';
import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import {
  ERLAUBTE_PFADE, NACHZUG_ZWEIG_PRAEFIX, NETZ_ZETTEL_LABEL, PAUSE_ZETTEL_LABEL, Werkzeugfehler, echtesErgebnis, netzZettelAktion,
  type NachzugErgebnis, fremdePfade, klassifiziereZustand, nachzug, netzfehlerAus,
  parseQuellenFilter, prText, vorpruefung, werteNetzAus, type Lauf, type Werkzeuge,
} from '../../scripts/materialien/nachzug';
import { istRisikoPfad, behalten } from '../../scripts/gegenpruefung/kern';

const ROOT = resolve(__dirname, '../..');
const rot = (t: string) => `ROT   materialien-netz: ${t}`;
const zus = (n: number) => `\ncheck:materialien-netz — ${n} Drift-Befund(e). Snapshot neu ziehen (nie Auto-Fix).`;
const netz = (...zeilen: string[]) => zeilen.map(rot).join('\n') + zus(zeilen.length);

describe('werteNetzAus — Drift nur per Positiv-Liste', () => {
  it('zwei driftende Quellen ⇒ [seco, estv-mwst] in fester Reihenfolge', () => {
    const a = werteNetzAus(netz(
      "ESTV-MWST: drift_token 'ESTV-MWST-INFO-04' abweichend (Manifest a ≠ live b: ToC/Ziffern-Baum geändert) — Snapshot neu ziehen.",
      "SECO: neues Dokument 'SECO-WL-ARG-ART-9' live, fehlt im Manifest — Snapshot neu ziehen.",
    ));
    expect(a.drift).toEqual(['seco', 'estv-mwst']);
    expect(a.hinweise).toEqual([]);
  });

  it('entlistet und Stand-Probe «Publiziert-am ≠ Stand» sind Drift', () => {
    const a = werteNetzAus(netz(
      "EDÖB: Dokument 'EDOEB-LF-1' im Manifest, aber live nicht mehr auffindbar (entlistet/umbenannt?) — Snapshot neu ziehen.",
      'ESTV-MWST: Stand-Probe ESTV-MWST-BRANCHEN-INFO-26 Publiziert-am 2026-09-03 ≠ committeter Stand 2025-03-31 — Snapshot neu ziehen.',
    ));
    expect(a.drift).toEqual(['edoeb', 'estv-mwst']);
  });

  it('Live-Crawl ROT / Live-Inventar ROT / Arbiter-Fehler / Kurz-URL / tote Stand-Probe ⇒ Hinweis, KEINE Drift', () => {
    const a = werteNetzAus(netz(
      'SECO: Live-Crawl ROT — fetch failed',
      'ESTV-MWST: Live-Inventar ROT — Count-Gate 12 < 20',
      'estv-ks: Arbiter-Fehler — ECONNRESET',
      "ESTV-MWST: Kurz-URL-Stichprobe 'ESTV-MWST-INFO-01' — 302-Ziel weicht ab",
      'ESTV-MWST: Stand-Probe ESTV-MWST-INFO-02 tot (HTTP 503) — Snapshot neu ziehen.',
      'ESTV-MWST: Stand-Probe ESTV-MWST-INFO-03 (https://x) ohne «Publiziert am» — Struktur-Drift.',
    ));
    expect(a.drift).toEqual([]);
    expect(a.hinweise.map((h) => h.quelle)).toEqual(['seco', 'estv-mwst', 'estv-ks', 'estv-mwst', 'estv-mwst', 'estv-mwst']);
  });

  it('EDÖB in zerlegter Unicode-Form (NFD) wird erkannt', () => {
    const a = werteNetzAus(netz("EDÖB: neues Dokument 'EDOEB-X' live, fehlt im Manifest — Snapshot neu ziehen.".normalize('NFD')));
    expect(a.drift).toEqual(['edoeb']);
  });

  it('unbekannte Form ⇒ Hinweis ohne Quelle', () => {
    expect(werteNetzAus(netz('irgendwas Neues')).hinweise).toEqual([{ quelle: null, text: 'irgendwas Neues' }]);
  });

  it('rot ohne Befundzeile oder Zahl ≠ Zusammenfassung ⇒ Werkzeugfehler', () => {
    expect(() => werteNetzAus('check:materialien-netz ROT: soft-law-zustand Z.3: kein gültiges JSON.')).toThrow(Werkzeugfehler);
    expect(() => werteNetzAus(rot("SECO: neues Dokument 'A' live, fehlt im Manifest") + zus(2))).toThrow(/Ausgabeformat/);
  });

  it('Vertrag mit check-materialien-netz.ts / estv-mwst-stand-probe.ts: die erkannten Formen stehen dort wörtlich', () => {
    const netzSrc = readFileSync(join(ROOT, 'scripts/materialien/check-materialien-netz.ts'), 'utf8');
    const probeSrc = readFileSync(join(ROOT, 'scripts/materialien/estv-mwst-stand-probe.ts'), 'utf8');
    expect(netzSrc).toContain('console.error(`ROT   materialien-netz: ${f}`)');
    expect(netzSrc).toContain('check:materialien-netz — ${fehler.length} Drift-Befund(e)');
    expect(netzSrc).toContain("neues Dokument '${id}' live, fehlt im Manifest");
    expect(netzSrc).toContain("Dokument '${id}' im Manifest, aber live nicht mehr");
    expect(netzSrc).toContain("drift_token '${id}' abweichend");
    expect(netzSrc).toContain('`${a.quelle}: Arbiter-Fehler');
    for (const p of ['SECO', 'EDÖB', 'ESTV-KS', 'ESTV-MWST']) expect(netzSrc).toContain(`\`${p}: `);
    expect(probeSrc).toMatch(/Stand-Probe \$\{probe\.dok\} Publiziert-am \$\{live\} ≠ committeter Stand/);
  });
});

// ── Rauschschutz ─────────────────────────────────────────────────────────────────────────────
const lauf = (q: string) => JSON.stringify({ typ: 'lauf', quelle: q, abgerufen: '2026-10-12', indexSha: 'x' });
const dok = (id: string, status = 'gelistet') => JSON.stringify({ typ: 'dok', id, status });
const lauf_ = lauf;
const ALT = [lauf('seco'), dok('SECO-A'), dok('SECO-B'), dok('SECO-C'), dok('SECO-C', 'entlistet')].join('\n') + '\n';

describe('klassifiziereZustand — Rauschschutz über angehängte dok-Zeilen', () => {
  it('nur lauf-Kopfzeile ⇒ keine (kein PR)', () => {
    const k = klassifiziereZustand(ALT, ALT + lauf('seco') + '\n');
    expect(k.status).toBe('keine');
    expect(k.dokZeilen).toBe(0);
    expect(k.jeQuelle.has('seco')).toBe(true);
  });
  it('eine neue dok-Zeile ⇒ anfuegung', () => {
    const k = klassifiziereZustand(ALT, ALT + [lauf('seco'), dok('SECO-NEU')].join('\n') + '\n');
    expect(k.status).toBe('anfuegung');
    expect(k.jeQuelle.get('seco')?.neu).toEqual(['SECO-NEU']);
  });
  it('geänderte, entlistete oder wieder gelistete dok ⇒ pruefen', () => {
    expect(klassifiziereZustand(ALT, ALT + [lauf('seco'), dok('SECO-NEU'), dok('SECO-A')].join('\n') + '\n').status).toBe('pruefen');
    expect(klassifiziereZustand(ALT, ALT + [lauf('seco'), dok('SECO-B', 'entlistet')].join('\n') + '\n').jeQuelle.get('seco')?.entlistet).toEqual(['SECO-B']);
    const w = klassifiziereZustand(ALT, ALT + [lauf('seco'), dok('SECO-C')].join('\n') + '\n');
    expect(w.status).toBe('pruefen');
    expect(w.jeQuelle.get('seco')?.wiedergelistet).toEqual(['SECO-C']);
  });
  it('dok-Zeilen werden der vorangehenden lauf-Zeile (Quelle) zugeordnet', () => {
    const k = klassifiziereZustand(ALT, ALT + [lauf('seco'), lauf('estv-mwst'), dok('ESTV-MWST-INFO-99')].join('\n') + '\n');
    expect(k.jeQuelle.get('seco')?.neu).toEqual([]);
    expect(k.jeQuelle.get('estv-mwst')?.neu).toEqual(['ESTV-MWST-INFO-99']);
  });
  it('nicht append-only, dok vor lauf, kaputtes JSON ⇒ Werkzeugfehler', () => {
    expect(() => klassifiziereZustand(ALT, ALT.slice(5))).toThrow(Werkzeugfehler);
    expect(() => klassifiziereZustand(ALT, ALT + dok('SECO-X') + '\n')).toThrow(/vor jeder lauf/);
    expect(() => klassifiziereZustand(ALT, ALT + '{kaputt\n')).toThrow(/kein gültiges JSON/);
  });
  it('echtes committetes Manifest: unverändert + Kopfzeile ⇒ keine', () => {
    const echt = readFileSync(join(ROOT, 'bibliothek/register/soft-law-zustand.jsonl'), 'utf8');
    expect(klassifiziereZustand(echt, echt).status).toBe('keine');
    expect(klassifiziereZustand(echt, echt + lauf('estv-mwst') + '\n').status).toBe('keine');
  });
});

describe('Pfad-Wache', () => {
  it('erlaubte Pfade gehen durch, Revisions-Sidecars und Fremdes nicht', () => {
    const s = [
      ' M bibliothek/register/soft-law-zustand.jsonl',
      ' M public/materialien/register.json',
      '?? public/materialien/kanten/OR.json',
      ' D public/materialien/kanten/ALT.json',
      ' M src/data/startseiteZaehler.generated.ts',
      ' M daten-manifest.json',
      ' M public/normtext/revisionen/DSG.json',
      'R  public/materialien/a.json -> src/x.ts',
    ].join('\n');
    expect(fremdePfade(s)).toEqual(['public/normtext/revisionen/DSG.json', 'src/x.ts']);
  });
});

describe('netzfehlerAus — nur der erschöpfte Abruf ist ein Netzfehler (K1)', () => {
  const ROT = 'soft-law-snapshot ROT: ';
  it('erschöpfter Abruf (Timeout/fetch failed) ⇒ Grund', () => {
    expect(netzfehlerAus(`x\n${ROT}fetchMitWiederholung: 4 Versuche erschöpft für https://a/b — fetch failed\n`))
      .toBe('fetchMitWiederholung: 4 Versuche erschöpft für https://a/b — fetch failed');
  });
  it('Count-Gate, HTTP-Status, kein/zwei ROT-Zeilen, Marker nicht am Zeilenanfang ⇒ null', () => {
    expect(netzfehlerAus(`${ROT}adapter-estv-mwst: ToC-Baum leer — Snapshot NICHT schreiben.`)).toBeNull();
    expect(netzfehlerAus(`${ROT}adapter-seco: https://a HTTP 503.`)).toBeNull();
    expect(netzfehlerAus('')).toBeNull();
    const e = `${ROT}fetchMitWiederholung: 4 Versuche erschöpft für https://a — x`;
    expect(netzfehlerAus(`${e}\n${e}`)).toBeNull();
    expect(netzfehlerAus(`  ${e}`)).toBeNull();
    expect(netzfehlerAus(`${ROT}Fehler: fetchMitWiederholung: 4 Versuche erschöpft für https://a — x`)).toBeNull();
  });
  it('Vertrag: soft-law-snapshot.ts und netz-retry.ts schreiben diese Formen wörtlich', () => {
    expect(readFileSync(join(ROOT, 'scripts/materialien/soft-law-snapshot.ts'), 'utf8'))
      .toContain('console.error(`soft-law-snapshot ROT: ${(e as Error).message}`)');
    expect(readFileSync(join(ROOT, 'scripts/normtext/netz-retry.ts'), 'utf8'))
      .toContain('throw new Error(`fetchMitWiederholung: ${versuche} Versuche erschöpft für ${url} — ${grund}`)');
  });
});

describe('vorpruefung — kein Wiederholungs-Vollcrawl (B1)', () => {
  const v = (o: Partial<Parameters<typeof vorpruefung>[0]>) =>
    vorpruefung({ offeneKoepfe: [], pauseZettel: '', ausloeser: 'schedule', ...o });
  it('offener Nachzug-PR ⇒ Abbruch, gleich welcher Auslöser und welches Datum', () => {
    expect(v({ offeneKoepfe: ['feat/x', 'chore/materialien-nachzug-2026-09-28'] })).toMatch(/Nachzug-PR noch offen \(chore\/materialien-nachzug-2026-09-28\)/);
    expect(v({ offeneKoepfe: ['chore/materialien-nachzug-2026-10-12'], ausloeser: 'workflow_dispatch' })).not.toBeNull();
  });
  it('fremde Köpfe (auch ähnlich benannt) ⇒ kein Abbruch', () => {
    expect(v({ offeneKoepfe: ['chore/materialien-nachzugX', 'feat/chore/materialien-nachzug-1', ''] })).toBeNull();
  });
  it('B2: offener Pause-Zettel + schedule ⇒ Abbruch; workflow_dispatch übersteuert', () => {
    expect(v({ pauseZettel: '23' })).toMatch(/Pause-Zettel #23 offen .*Takt pausiert/);
    expect(v({ pauseZettel: '23', ausloeser: 'workflow_dispatch' })).toBeNull();
  });
  it('kein Pause-Zettel ⇒ Nachzug fahren', () => {
    for (const p of ['', '  ']) expect(v({ pauseZettel: p })).toBeNull();
  });
});

// ── Ablauf mit Attrappen ─────────────────────────────────────────────────────────────────────
interface Attrappe extends Werkzeuge {
  aufrufe: string[];
  warnungen: string[];
  verworfen: number;
}
function attrappe(o: {
  netz?: Lauf;
  exit?: Record<string, number>;
  /** stderr je «skript --quelle=…»-Aufruf (Schlüssel: Aufruf ohne --datum) bzw. je Skript. */
  stderr?: Record<string, string>;
  statusNach?: string;
  angehaengt?: string;
  sauberVorher?: boolean;
}): Attrappe {
  let gefahren = false;
  const a: Attrappe = {
    aufrufe: [],
    warnungen: [],
    verworfen: 0,
    npm(skript, args) {
      a.aufrufe.push([skript, ...args].join(' '));
      if (skript === 'check:materialien-netz') return o.netz ?? { status: 0, ausgabe: '' };
      gefahren = true;
      const quelle = args.find((x) => x.startsWith('--quelle='));
      const exit = o.exit?.[quelle ? `${skript} ${quelle}` : skript] ?? o.exit?.[skript] ?? 0;
      return { status: exit, ausgabe: (quelle && o.stderr?.[`${skript} ${quelle}`]) ?? o.stderr?.[skript] ?? '' };
    },
    gitStatus() {
      if (!gefahren) return o.sauberVorher === false ? ' M src/x.ts\n' : '';
      return a.verworfen ? '' : (o.statusNach ?? ' M bibliothek/register/soft-law-zustand.jsonl\n');
    },
    zustandHead: () => ALT,
    zustandArbeitsbaum: () => ALT + (o.angehaengt ?? ''),
    verwerfe() { a.verworfen++; },
    log() {},
    warnung(s) { a.warnungen.push(s); },
  };
  return a;
}
const DRIFT2 = {
  status: 1,
  ausgabe: netz(
    "ESTV-MWST: drift_token 'ESTV-MWST-INFO-04' abweichend (Manifest a ≠ live b) — Snapshot neu ziehen.",
    "SECO: neues Dokument 'SECO-NEU' live, fehlt im Manifest — Snapshot neu ziehen.",
    'EDÖB: Live-Crawl ROT — fetch failed',
  ),
};
const ANGEHAENGT2 = [lauf('seco'), dok('SECO-NEU'), lauf('estv-mwst'), dok('ESTV-MWST-INFO-04')].join('\n') + '\n';

describe('nachzug — Reihenfolge und Fehlerpfade', () => {
  it('keine Drift (Exit 0) ⇒ status keine, nur das Netz-Tor gefahren', () => {
    const w = attrappe({});
    expect(nachzug('2026-10-12', null, w).status).toBe('keine');
    expect(w.aufrufe).toEqual(['check:materialien-netz']);
  });

  it('Drift seco + estv-mwst: je Quelle snapshot → materialien, dann EINE Kaskade ohne Revisionen; EDÖB-Netzfehler nur Hinweis', () => {
    const w = attrappe({ netz: DRIFT2, angehaengt: ANGEHAENGT2 });
    const e = nachzug('2026-10-12', null, w);
    expect(w.aufrufe).toEqual([
      'check:materialien-netz',
      'materialien:snapshot --datum=2026-10-12 --quelle=seco',
      'materialien --datum=2026-10-12',
      'materialien:snapshot --datum=2026-10-12 --quelle=estv-mwst',
      'materialien --datum=2026-10-12',
      'materialien:kaskade --datum=2026-10-12 --ohne-revisionen',
    ]);
    expect(e.quellen).toEqual(['seco', 'estv-mwst']);
    expect(e.status).toBe('anfuegung'); // beide ids in ALT unbekannt ⇒ neu
    expect(e.widerspruch).toEqual([]);
  });

  it('nur Hinweise (Netzfehler) ⇒ kein Snapshot, kein PR, kein Rot', () => {
    const w = attrappe({ netz: { status: 1, ausgabe: netz('ESTV-MWST: Live-Inventar ROT — Timeout') } });
    const e = nachzug('2026-10-12', null, w);
    expect(e.status).toBe('keine');
    expect(w.aufrufe).toEqual(['check:materialien-netz']);
    expect(w.warnungen).toHaveLength(1);
  });

  it('Filter «quellen» lässt eine driftende Quelle aus (Warnung)', () => {
    const w = attrappe({ netz: DRIFT2, angehaengt: [lauf('seco'), dok('SECO-NEU')].join('\n') + '\n' });
    const e = nachzug('2026-10-12', parseQuellenFilter('seco'), w);
    expect(e.quellen).toEqual(['seco']);
    expect(e.ausgelassen).toEqual(['estv-mwst']);
    expect(e.status).toBe('anfuegung');
    expect(w.aufrufe.filter((x) => x.startsWith('materialien:snapshot'))).toEqual(['materialien:snapshot --datum=2026-10-12 --quelle=seco']);
    expect(() => parseQuellenFilter('seco,bger')).toThrow(Werkzeugfehler);
  });

  it('nur Lauf-Kopfzeilen nach dem Snapshot ⇒ verworfen, status keine, aber Widerspruch (Lauf rot)', () => {
    const w = attrappe({ netz: DRIFT2, angehaengt: [lauf('seco'), lauf('estv-mwst')].join('\n') + '\n' });
    const e = nachzug('2026-10-12', null, w);
    expect(e.status).toBe('keine');
    expect(w.verworfen).toBe(1);
    expect(e.widerspruch).toEqual(['seco', 'estv-mwst']);
  });

  it('Werkzeugfehler: Netz-Tor Exit 2, Snapshot rot, Kaskade rot, fremder Pfad, schmutziger Baum', () => {
    expect(() => nachzug('2026-10-12', null, attrappe({ netz: { status: 2, ausgabe: '' } }))).toThrow(/Exit 2/);
    const s = attrappe({ netz: DRIFT2, exit: { 'materialien:snapshot': 1 } });
    expect(() => nachzug('2026-10-12', null, s)).toThrow(/snapshot --quelle=seco/);
    expect(s.aufrufe).toHaveLength(2); // nach dem roten Snapshot läuft nichts mehr
    expect(() => nachzug('2026-10-12', null, attrappe({ netz: DRIFT2, exit: { 'materialien:kaskade': 1 } }))).toThrow(/kaskade/);
    expect(() => nachzug('2026-10-12', null, attrappe({ netz: DRIFT2, angehaengt: ANGEHAENGT2, statusNach: ' M public/normtext/revisionen/OR.json\n' })))
      .toThrow(/ausserhalb der erlaubten Pfade/);
    expect(() => nachzug('2026-10-12', null, attrappe({ sauberVorher: false }))).toThrow(/nicht sauber/);
    expect(() => nachzug('heute', null, attrappe({}))).toThrow(/--datum/);
  });

  it('K1: Netzfehler im Snapshot NACH erkannter Drift ⇒ verworfen, status keine, Warnung, keine Kaskade, kein Rot', () => {
    const erschoepft = 'soft-law-snapshot ROT: fetchMitWiederholung: 4 Versuche erschöpft für https://www.gate.estv.admin.ch/x — The operation was aborted due to timeout\n';
    const w = attrappe({
      netz: DRIFT2,
      exit: { 'materialien:snapshot --quelle=estv-mwst': 1 },
      stderr: { 'materialien:snapshot --quelle=estv-mwst': `Warnung irgendwas\n${erschoepft}` },
    });
    const e = nachzug('2026-10-12', null, w);
    expect(e.status).toBe('keine');
    expect(e.netzfehler).toMatch(/^estv-mwst: fetchMitWiederholung: 4 Versuche erschöpft/);
    expect(w.verworfen).toBe(1);
    expect(e.widerspruch).toEqual([]);
    expect(w.aufrufe.at(-1)).toBe('materialien:snapshot --datum=2026-10-12 --quelle=estv-mwst'); // keine Kaskade danach
    expect(w.warnungen.at(-1)).toContain('Netzfehler beim Nachladen (estv-mwst) — nächster Lauf versucht erneut');
  });

  it('K1-Grenze: Count-Gate/Struktur-Bruch bei erreichbarer Quelle bleibt Werkzeugfehler (rot)', () => {
    const w = attrappe({
      netz: DRIFT2,
      exit: { 'materialien:snapshot': 1 },
      stderr: { 'materialien:snapshot': 'soft-law-snapshot ROT: adapter-seco: ARG nur 3 Artikel-PDFs (< 60) — Quell-Bruch? Snapshot NICHT schreiben.\n' },
    });
    expect(() => nachzug('2026-10-12', null, w)).toThrow(/snapshot --quelle=seco rot/);
    expect(w.verworfen).toBe(0);
  });

  describe('netzZettelAktion — Zwei-Läufe-Grenze (Muster Normen-Monitor)', () => {
    const NF = { 'materialien:snapshot --quelle=estv-mwst': 1 };
    const NF_ERR = { 'materialien:snapshot --quelle=estv-mwst': 'soft-law-snapshot ROT: fetchMitWiederholung: 4 Versuche erschöpft für https://a — fetch failed\n' };
    const netzfehler = () => nachzug('2026-10-12', null, attrappe({ netz: DRIFT2, exit: NF, stderr: NF_ERR }));
    it('Netzfehler: erster Lauf ⇒ anlegen (grün), Zettel schon offen ⇒ kommentieren (rot)', () => {
      expect(netzZettelAktion(netzfehler(), false)).toBe('anlegen');
      expect(netzZettelAktion(netzfehler(), true)).toBe('kommentieren');
    });
    it('erfolgreicher Nachzug oder keine Drift schliesst einen offenen Zettel; ohne Zettel nichts', () => {
      const erfolg = nachzug('2026-10-12', null, attrappe({ netz: DRIFT2, angehaengt: ANGEHAENGT2 }));
      const keineDrift = nachzug('2026-10-12', null, attrappe({}));
      expect(netzZettelAktion(erfolg, true)).toBe('schliessen');
      expect(netzZettelAktion(keineDrift, true)).toBe('schliessen');
      expect(netzZettelAktion(erfolg, false)).toBe('');
      expect(netzZettelAktion(keineDrift, false)).toBe('');
    });
    it('echtesErgebnis: nachgeladen oder keine Drift ja; Netzfehler, nur Hinweise, Filter-Auslassung nein', () => {
      expect(echtesErgebnis(nachzug('2026-10-12', null, attrappe({ netz: DRIFT2, angehaengt: ANGEHAENGT2 })))).toBe(true);
      expect(echtesErgebnis(nachzug('2026-10-12', null, attrappe({})))).toBe(true);
      expect(echtesErgebnis(netzfehler())).toBe(false);
      expect(echtesErgebnis(nachzug('2026-10-12', null, attrappe({ netz: { status: 1, ausgabe: netz('ESTV-MWST: Live-Inventar ROT — Timeout') } })))).toBe(false);
      expect(echtesErgebnis(nachzug('2026-10-12', ['edoeb'], attrappe({ netz: DRIFT2 })))).toBe(false);
    });
    it('nur Hinweise des Netz-Tors oder Vorprüfungs-Abbruch ⇒ Zettel unberührt', () => {
      const hinweise = nachzug('2026-10-12', null, attrappe({ netz: { status: 1, ausgabe: netz('ESTV-MWST: Live-Inventar ROT — Timeout') } }));
      expect(netzZettelAktion(hinweise, true)).toBe('');
      expect(netzZettelAktion(null, true)).toBe('');
    });
  });

  it('PR-Text nennt Status, Quellen-Tabelle und Hinweise', () => {
    const e = nachzug('2026-10-12', null, attrappe({ netz: DRIFT2, angehaengt: ANGEHAENGT2 }));
    const t = prText(e, '2026-10-12');
    expect(t).toContain('| seco | SECO-NEU |');
    expect(t).toContain('Live-Crawl ROT');
  });
});

describe('CLI nachzug-run.ts — Werkzeugfehler ⇒ Exit ≠ 0', () => {
  it('ohne --datum endet der Runner mit Exit 1 (vor jedem Netz-Zugriff)', () => {
    const r = spawnSync('npx', ['vite-node', 'scripts/materialien/nachzug-run.ts', '--', '--quellen=bger'], { cwd: ROOT, encoding: 'utf8' });
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('Werkzeugfehler');
  }, 60_000);

  /**
   * Runner mit Ersatz-npm (nie Netz; Exit `npmExit`): Protokoll der npm-Aufrufe + Prozess-Ergebnis.
   * cwd = frisches, sauberes git-Repo — unabhängig vom Arbeitsbaum (die Tor-Stufe des Bots fährt
   * diese Datei auf einem nachgeführten, also schmutzigen Stand).
   */
  function runner(env: Record<string, string>, npmExit = 2) {
    const dir = mkdtempSync(join(tmpdir(), 'mat-nr-'));
    const log = join(dir, 'log');
    writeFileSync(join(dir, 'npm'), `#!/usr/bin/env bash\necho "$*" >> "${log}"\nexit ${npmExit}\n`);
    chmodSync(join(dir, 'npm'), 0o755);
    const repo = join(dir, 'repo');
    mkdirSync(repo);
    spawnSync('git', ['init', '-q'], { cwd: repo });
    const r = spawnSync(join(ROOT, 'node_modules/.bin/vite-node'), [join(ROOT, 'scripts/materialien/nachzug-run.ts'), '--', '--datum=2026-10-12'], {
      cwd: repo, encoding: 'utf8',
      env: { ...process.env, PATH: `${dir}:${process.env.PATH}`, GITHUB_OUTPUT: join(dir, 'out'), GITHUB_STEP_SUMMARY: '', ...env },
    });
    return { r, npm: existsSync(log) ? readFileSync(log, 'utf8') : '', out: existsSync(join(dir, 'out')) ? readFileSync(join(dir, 'out'), 'utf8') : '' };
  }
  it('B1: Vorprüfung bricht VOR jedem npm-/Netz-Aufruf ab — Exit 0, ::notice::, status=keine', () => {
    for (const env of [
      { AUSLOESER: 'schedule', OFFENE_KOEPFE: '', PAUSE_ZETTEL: '23', NETZ_ZETTEL: '7' },
      { AUSLOESER: 'workflow_dispatch', OFFENE_KOEPFE: 'feat/x\nchore/materialien-nachzug-2026-10-05', PAUSE_ZETTEL: '', NETZ_ZETTEL: '' },
    ]) {
      const { r, npm, out } = runner(env);
      expect(r.status).toBe(0);
      expect(r.stdout).toContain('::notice::Materialien-Nachzug übersprungen');
      expect(npm).toBe('');
      expect(out).toBe('status=keine\nquellen=\nwiderspruch=\nhinweise=0\nzettel=\nergebnis=\n');
    }
  }, 60_000);
  it('Zettel: Runner gibt Nummern und Aktion aus — dispatch trotz Pause, keine Drift ⇒ zettel=schliessen, ergebnis=echt', () => {
    const { r, npm, out } = runner({ AUSLOESER: 'workflow_dispatch', OFFENE_KOEPFE: '', PAUSE_ZETTEL: '23', NETZ_ZETTEL: '17' }, 0);
    expect(r.status).toBe(0);
    expect(npm.trim()).toBe('run check:materialien-netz');
    expect(out).toContain('status=keine\n');
    expect(out).toContain('zettel=schliessen\nnetzzettel=17\nnetzfehler=\nergebnis=echt\npausezettel=23\n');
  }, 60_000);
  it('B1: AUSLOESER ohne OFFENE_KOEPFE/PAUSE_ZETTEL/NETZ_ZETTEL ⇒ Werkzeugfehler (Verdrahtung kaputt), kein npm', () => {
    const faelle: Record<string, string>[] = [
      { AUSLOESER: 'schedule' },
      { AUSLOESER: 'schedule', OFFENE_KOEPFE: '', PAUSE_ZETTEL: '' },
      { AUSLOESER: 'schedule', OFFENE_KOEPFE: '', NETZ_ZETTEL: '' },
    ];
    for (const env of faelle) {
      const { r, npm } = runner(env);
      expect(r.status).toBe(1);
      expect(r.stderr).toContain('nicht verdrahtet');
      expect(npm).toBe('');
    }
  }, 60_000);
});

describe('kaskade-run.ts --ohne-revisionen (gegen Ersatz-npm)', () => {
  function glieder(...extra: string[]): string[] {
    const dir = mkdtempSync(join(tmpdir(), 'mat-ks-'));
    const log = join(dir, 'log');
    writeFileSync(join(dir, 'npm'), `#!/usr/bin/env bash\necho "$*" >> "${log}"\nexit 0\n`);
    chmodSync(join(dir, 'npm'), 0o755);
    const r = spawnSync(join(ROOT, 'node_modules/.bin/vite-node'), ['scripts/materialien/kaskade-run.ts', '--', '--datum=2026-10-12', ...extra], {
      cwd: ROOT, encoding: 'utf8', env: { ...process.env, PATH: `${dir}:${process.env.PATH}` },
    });
    expect(r.status).toBe(0);
    return readFileSync(log, 'utf8').trim().split('\n').map((z) => z.split(' ')[1]);
  }
  it('ohne Schalter alle vier Glieder, mit Schalter genau normtext:revisionen weg — Reihenfolge sonst gleich', () => {
    expect(glieder()).toEqual(['materialien', 'normtext:revisionen', 'normtext:churn-reset', 'entstehung:projektion-kaskade']);
    expect(glieder('--ohne-revisionen')).toEqual(['materialien', 'normtext:churn-reset', 'entstehung:projektion-kaskade']);
  }, 60_000);
});

describe('Risikopfad', () => {
  it('Bot-Dateien sind gegenprüfungspflichtig (istRisikoPfad ∧ behalten)', () => {
    for (const p of ['scripts/materialien/nachzug.ts', 'scripts/materialien/nachzug-run.ts', 'scripts/materialien/kaskade-run.ts']) {
      expect(istRisikoPfad(p)).toBe(true);
      expect(behalten(p)).toBe(true);
    }
  });
});

// ── Workflow-Struktur ────────────────────────────────────────────────────────────────────────
const WORKFLOW = join(ROOT, '.github/workflows/materialien-nachzug.yml');

/** run-Block des Schritts mit dem gegebenen Namens-Anfang, entrückt (Muster verfall-erinnerung-workflow.test.ts). */
function runBlock(yml: string, schrittName: string): string {
  const zeilen = yml.split('\n');
  const i = zeilen.findIndex((z) => z.includes(`- name: ${schrittName}`));
  if (i < 0) throw new Error(`Schritt «${schrittName}» fehlt`);
  const r = zeilen.findIndex((z, k) => k > i && /^\s+run: \|\s*$/.test(z));
  const einzug = zeilen[r].match(/^\s*/)![0].length;
  const block: string[] = [];
  for (let k = r + 1; k < zeilen.length; k++) {
    const z = zeilen[k];
    if (z.trim() !== '' && z.match(/^\s*/)![0].length <= einzug) break;
    block.push(z.slice(einzug + 2));
  }
  return block.join('\n') + '\n';
}

describe('Workflow materialien-nachzug.yml', () => {
  const yml = readFileSync(WORKFLOW, 'utf8');

  it('Takt, Eingaben, Concurrency, minimale Rechte, Timeout', () => {
    expect(yml).toContain("- cron: '43 5 * * 1'");
    expect(yml).toMatch(/workflow_dispatch:\n\s+inputs:\n\s+quellen:/);
    expect(yml).toMatch(/trockenlauf:[\s\S]*?type: boolean/);
    expect(yml).toMatch(/concurrency:\n\s+group: materialien-nachzug\n\s+cancel-in-progress: false/);
    expect(yml).toMatch(/^permissions: \{\}$/m);
    expect(yml).toMatch(/permissions:\n\s+contents: write\n\s+pull-requests: write\n[\s\S]*?actions: write\n[\s\S]*?issues: write\n/);
    expect(yml).toContain('timeout-minutes: 120');
    expect(yml).toMatch(/name: Nachzug \+ Rauschschutz\n\s+id: lauf\n(?:\s+#.*\n)*\s+timeout-minutes: 110\n/);
    expect(yml).toContain('npm run materialien:nachzug -- --datum=');
  });

  it('nie Auto-Merge; Token-Fallback; CI per workflow_dispatch angestossen', () => {
    expect(yml).not.toMatch(/gh pr merge|--auto\b/);
    expect(yml).toContain('GH_TOKEN: ${{ secrets.AUTOMERGE_TOKEN || github.token }}');
    expect(yml).toContain('gh workflow run ci.yml --ref "$branch"');
  });

  it('S1: rote Stufe — Widerspruch ODER (Nachzug ∧ Tore rot); Werkzeugfehler färbt über die Stufe selbst', () => {
    const zeilen = yml.split('\n');
    const i = zeilen.findIndex((z) => z.includes('- name: Lauf rot färben'));
    expect(i).toBeGreaterThan(0);
    const ausdruck = /^\s+if: (.+)$/.exec(zeilen[i + 1])![1];
    // Mini-Auswerter für genau diese GitHub-Ausdrucksform (Ausgaben sind Strings, '' = nicht gesetzt).
    const wahr = (ctx: Record<string, Record<string, string>>): boolean => {
      const js = ausdruck
        .replace(/steps\.(\w+)\.outputs\.(\w+)/g, (_, st: string, k: string) => JSON.stringify(ctx[st]?.[k] ?? ''))
        .replace(/([!=])=/g, '$1==');
      expect(js).toMatch(/^[\s"'\w,()|&!=-]*$/);
      return new Function(`return (${js});`)() as boolean;
    };
    const lauf = (status: string, widerspruch = '') => ({ status, widerspruch });
    expect(wahr({ lauf: lauf('keine', 'seco') })).toBe(true); // Widerspruch, Tore übersprungen
    expect(wahr({ lauf: lauf('anfuegung', 'estv-mwst'), tore: { rc: '0' } })).toBe(true);
    expect(wahr({ lauf: lauf('anfuegung'), tore: { rc: '1' } })).toBe(true);
    expect(wahr({ lauf: lauf('pruefen'), tore: { rc: '1' } })).toBe(true);
    expect(wahr({ lauf: lauf('pruefen'), tore: { rc: '0' } })).toBe(false);
    expect(wahr({ lauf: lauf('keine') })).toBe(false); // nichts zu tun / Netzfehler / Vorprüfung
    // Zwei-Läufe-Grenze: zweiter Netzfehler in Folge rot, erster nicht.
    expect(wahr({ lauf: { status: 'keine', widerspruch: '', zettel: 'kommentieren' } })).toBe(true);
    expect(wahr({ lauf: { status: 'keine', widerspruch: '', zettel: 'anlegen' } })).toBe(false);
    expect(wahr({ lauf: { status: 'anfuegung', widerspruch: '', zettel: 'schliessen' }, tore: { rc: '0' } })).toBe(false);
    // Werkzeugfehler: Exit 1 der Stufe «Nachzug» färbt den Lauf selbst — nichts darf das schlucken.
    expect(yml).not.toMatch(/continue-on-error/);
    expect(zeilen[zeilen.findIndex((z) => z.includes('- name: Nachzug + Rauschschutz')) + 1]).toMatch(/^\s+id: lauf$/);
    expect(runBlock(yml, 'Nachzug + Rauschschutz')).toMatch(/^set -euo pipefail$/m);
  });

  it('B1/B2: Stufe «Nachzug» holt offene PR-Köpfe, Pause- und Netz-Zettel VOR dem Bot-Aufruf und reicht sie durch', () => {
    const dir = mkdtempSync(join(tmpdir(), 'mat-vp-'));
    const log = join(dir, 'log');
    writeFileSync(join(dir, 'gh'), `#!/usr/bin/env bash
echo "gh $*" >> "${log}"
if [ "$1 $2" = "pr list" ]; then printf 'feat/x\\nchore/materialien-nachzug-2026-10-05\\n'; fi
case "$*" in *'labels=alarm:materialien-nachzug-netz&'*) echo 17 ;; *'labels=alarm:materialien-nachzug&'*) echo 23 ;; esac
`);
    writeFileSync(join(dir, 'npm'), `#!/usr/bin/env bash\necho "npm $* | $AUSLOESER | $PAUSE_ZETTEL | $NETZ_ZETTEL | $OFFENE_KOEPFE" >> "${log}"\n`);
    for (const n of ['gh', 'npm']) chmodSync(join(dir, n), 0o755);
    const block = runBlock(yml, 'Nachzug + Rauschschutz').replace('${{ steps.datum.outputs.iso }}', '2026-10-12');
    const r = spawnSync('bash', ['-c', block], { encoding: 'utf8', env: { PATH: `${dir}:${process.env.PATH}`, QUELLEN: '', AUSLOESER: 'schedule', GITHUB_REPOSITORY: 'o/r' } });
    expect(r.status).toBe(0);
    const z = readFileSync(log, 'utf8').trim().split('\n');
    expect(z[0]).toMatch(/^gh pr list --state open --limit \d+ --json headRefName /);
    expect(z[1]).toBe(`gh api repos/o/r/issues?labels=${PAUSE_ZETTEL_LABEL}&state=open&creator=github-actions%5Bbot%5D -q [.[]|select(.pull_request|not)][0].number // empty`);
    expect(z[2]).toBe(`gh api repos/o/r/issues?labels=${NETZ_ZETTEL_LABEL}&state=open&creator=github-actions%5Bbot%5D -q [.[]|select(.pull_request|not)][0].number // empty`);
    expect(z[3]).toBe('npm run materialien:nachzug -- --datum=2026-10-12 --quellen= | schedule | 23 | 17 | feat/x');
    expect(z[4]).toBe('chore/materialien-nachzug-2026-10-05');
    expect(yml).toMatch(/AUSLOESER: \$\{\{ github\.event_name \}\}/);
    expect(yml).toContain(`branch="${NACHZUG_ZWEIG_PRAEFIX}\${DATUM}"`);
  });

  describe('Netz-Zettel-Stufe gegen Ersatz-gh', () => {
    function zettel(aktion: string, ghExit = 0) {
      const dir = mkdtempSync(join(tmpdir(), 'mat-zt-'));
      const log = join(dir, 'log');
      writeFileSync(join(dir, 'gh'), `#!/usr/bin/env bash\necho "gh $1 $2 $3 $4 $5" >> "${log}"\nexit ${ghExit}\n`);
      chmodSync(join(dir, 'gh'), 0o755);
      const r = spawnSync('bash', ['-c', runBlock(yml, 'Netz-Zettel pflegen')], {
        encoding: 'utf8',
        env: { PATH: `${dir}:${process.env.PATH}`, AKTION: aktion, NR: '17', NETZFEHLER: 'estv-mwst: x', RUN_URL: 'https://x/1' },
      });
      return { status: r.status, out: r.stdout, aufrufe: existsSync(log) ? readFileSync(log, 'utf8').trim().split('\n') : [] };
    }
    it('Stufe läuft genau bei gesetzter Aktion, mit github.token', () => {
      const zeilen = yml.split('\n');
      const i = zeilen.findIndex((z) => z.includes('- name: Netz-Zettel pflegen'));
      expect(zeilen[i + 1]).toBe("        if: steps.lauf.outputs.zettel != '' && !inputs.trockenlauf");
      expect(zeilen[i + 3]).toContain('GH_TOKEN: ${{ github.token }}');
    });
    it('anlegen ⇒ Label + Zettel mit Label; kommentieren ⇒ Kommentar auf #NR; schliessen ⇒ close #NR', () => {
      const a = zettel('anlegen');
      expect(a.status).toBe(0);
      expect(a.aufrufe[0]).toBe(`gh label create ${NETZ_ZETTEL_LABEL} --color FBCA04`);
      expect(a.aufrufe[1]).toBe(`gh issue create --label ${NETZ_ZETTEL_LABEL} --title`);
      const k = zettel('kommentieren').aufrufe;
      expect(k).toHaveLength(1);
      expect(k[0]).toMatch(/^gh issue comment 17 --body Erneut Netzfehler beim Nachladen am \d{4}-\d{2}-\d{2} — Lauf ROT \(Zwei-Läufe-Grenze\).* estv-mwst: x\. Lauf: https:\/\/x\/1$/);
      expect(zettel('schliessen').aufrufe[0]).toBe('gh issue close 17 --reason completed');
    });
    it('FAIL-SAFE: Anlegen/Kommentieren scheitert ⇒ rot; Schliessen scheitert ⇒ Warnung; unbekannte Aktion ⇒ rot', () => {
      expect(zettel('anlegen', 1).status).toBe(1);
      expect(zettel('kommentieren', 1).status).toBe(1);
      const s = zettel('schliessen', 1);
      expect(s.status).toBe(0);
      expect(s.out).toContain('::warning::Netz-Zettel-Schliessen gescheitert');
      expect(zettel('loeschen').status).toBe(1);
    });
  });

  describe('Lauffolge: Pause-Zettel hält bis zur Quittung (B2), trockenlauf fasst keine Zettel an', () => {
    /** `if:` des Schritts mit diesem Namens-Anfang ('true' ohne if:, d. h. implizit success()). */
    const ifVon = (name: string) => {
      const z = yml.split('\n');
      const i = z.findIndex((x) => x.includes(`- name: ${name}`));
      if (i < 0) throw new Error(`Schritt «${name}» fehlt`);
      for (let k = i + 1; k < z.length && !/^\s+- name: /.test(z[k]); k++) {
        const m = /^\s+if: (.+)$/.exec(z[k]);
        if (m) return m[1];
      }
      return 'true';
    };
    interface Kontext { out: Record<string, Record<string, string>>; outcome: Record<string, string>; job: 'success' | 'failure'; trockenlauf: boolean }
    /** Mini-Auswerter GitHub-Ausdruck; ohne Status-Funktion gilt implizit success() (Actions-Semantik). */
    const ghIf = (ausdruck: string, k: Kontext): boolean => {
      const js = ausdruck
        .replace(/steps\.(\w+)\.outputs\.(\w+)/g, (_, st: string, x: string) => JSON.stringify(k.out[st]?.[x] ?? ''))
        .replace(/steps\.(\w+)\.outcome/g, (_, st: string) => JSON.stringify(k.outcome[st] ?? ''))
        .replace(/inputs\.trockenlauf/g, String(k.trockenlauf))
        .replace(/success\(\)/g, String(k.job === 'success'))
        .replace(/failure\(\)/g, String(k.job === 'failure'))
        .replace(/cancelled\(\)/g, 'false')
        .replace(/([!=])=/g, '$1==');
      expect(js).toMatch(/^[\s"'\w,()|&!=-]*$/);
      const wert = new Function(`return (${js});`)() as boolean;
      return /\b(success|failure|cancelled|always)\(\)/.test(ausdruck) ? wert : k.job === 'success' && wert;
    };
    interface Zustand { pause: string; netz: string }
    /** Ein Lauf: Vorprüfung (nachzug.ts) → Runner-Ausgaben → if:-Ausdrücke der Workflow-Stufen. */
    function lauf(z: Zustand, ausloeser: string, o: { e?: NachzugErgebnis; werkzeugfehler?: boolean; tore?: string; trockenlauf?: boolean }) {
      const k: Kontext = { out: { lauf: {} }, outcome: { lauf: 'success' }, job: 'success', trockenlauf: !!o.trockenlauf };
      const grund = vorpruefung({ offeneKoepfe: [], pauseZettel: z.pause, ausloeser });
      if (grund !== null) {
        k.out.lauf = { status: 'keine', quellen: '', widerspruch: '', hinweise: '0', zettel: '', ergebnis: '' };
      } else if (o.werkzeugfehler) {
        k.outcome.lauf = 'failure';
        k.job = 'failure';
      } else {
        const e = o.e!;
        const zettel = netzZettelAktion(e, z.netz !== '');
        k.out.lauf = {
          status: e.status, widerspruch: e.widerspruch.join(','), zettel, netzzettel: z.netz,
          ergebnis: echtesErgebnis(e) ? 'echt' : '', pausezettel: z.pause,
        };
        if (ghIf(ifVon('Netz-Zettel pflegen'), k)) z.netz = zettel === 'anlegen' ? 'N' : zettel === 'schliessen' ? '' : z.netz;
        if (ghIf(ifVon('Tore auf dem nachgeführten Stand'), k)) k.out.tore = { rc: o.tore ?? '0' };
        if (ghIf(ifVon('Lauf rot färben'), k)) k.job = 'failure';
      }
      if (ghIf(ifVon('Bei Rot — Pause-Zettel'), k)) z.pause = z.pause || 'P';
      if (ghIf(ifVon('Grün mit echtem Ergebnis — Pause-Zettel schliessen'), k)) z.pause = '';
      return { uebersprungen: grund !== null, rot: k.job === 'failure' };
    }
    const keineDrift = () => nachzug('2026-10-12', null, attrappe({}));
    const netzfehler = () => nachzug('2026-10-12', null, attrappe({
      netz: DRIFT2, exit: { 'materialien:snapshot --quelle=estv-mwst': 1 },
      stderr: { 'materialien:snapshot --quelle=estv-mwst': 'soft-law-snapshot ROT: fetchMitWiederholung: 4 Versuche erschöpft für https://a — fetch failed\n' },
    }));

    it('rot → skip → skip → dispatch grün schliesst → schedule läuft wieder', () => {
      const z: Zustand = { pause: '', netz: '' };
      expect(lauf(z, 'schedule', { werkzeugfehler: true })).toEqual({ uebersprungen: false, rot: true });
      expect(z.pause).toBe('P');
      expect(lauf(z, 'schedule', {})).toEqual({ uebersprungen: true, rot: false });
      expect(lauf(z, 'schedule', {})).toEqual({ uebersprungen: true, rot: false });
      expect(z.pause).toBe('P'); // der grüne Skip gibt NICHT frei (B2)
      expect(lauf(z, 'workflow_dispatch', { e: keineDrift() })).toEqual({ uebersprungen: false, rot: false });
      expect(z.pause).toBe('');
      expect(lauf(z, 'schedule', { e: keineDrift() })).toEqual({ uebersprungen: false, rot: false });
    });

    it('Netz 1 grün + Netz-Zettel → Netz 2 rot + Pause-Zettel → schedule übersprungen', () => {
      const z: Zustand = { pause: '', netz: '' };
      expect(lauf(z, 'schedule', { e: netzfehler() })).toEqual({ uebersprungen: false, rot: false });
      expect(z).toEqual({ pause: '', netz: 'N' });
      expect(lauf(z, 'schedule', { e: netzfehler() })).toEqual({ uebersprungen: false, rot: true });
      expect(z).toEqual({ pause: 'P', netz: 'N' });
      expect(lauf(z, 'schedule', {}).uebersprungen).toBe(true);
      expect(lauf(z, 'workflow_dispatch', { e: keineDrift() }).rot).toBe(false);
      expect(z).toEqual({ pause: '', netz: '' }); // grüner Lauf mit echtem Ergebnis schliesst beide
    });

    it('Widerspruch und Tore rot legen den Pause-Zettel an; dispatch-Netzfehler (grün) schliesst ihn nicht', () => {
      const z: Zustand = { pause: '', netz: '' };
      const widerspruch = nachzug('2026-10-12', null, attrappe({ netz: DRIFT2, angehaengt: [lauf_('seco'), lauf_('estv-mwst')].join('\n') + '\n' }));
      expect(lauf(z, 'schedule', { e: widerspruch }).rot).toBe(true);
      expect(z.pause).toBe('P');
      const pruefen = nachzug('2026-10-12', null, attrappe({ netz: DRIFT2, angehaengt: ANGEHAENGT2 }));
      expect(lauf({ pause: '', netz: '' }, 'schedule', { e: pruefen, tore: '1' }).rot).toBe(true);
      const z2: Zustand = { pause: '', netz: '' };
      lauf(z2, 'schedule', { e: pruefen, tore: '1' });
      expect(z2.pause).toBe('P');
      expect(lauf(z, 'workflow_dispatch', { e: netzfehler() }).rot).toBe(false);
      expect(z.pause).toBe('P');
    });

    it('trockenlauf: weder Pause- noch Netz-Zettel anlegen, kommentieren oder schliessen', () => {
      const z: Zustand = { pause: '', netz: '' };
      expect(lauf(z, 'workflow_dispatch', { werkzeugfehler: true, trockenlauf: true }).rot).toBe(true);
      expect(lauf(z, 'workflow_dispatch', { e: netzfehler(), trockenlauf: true }).rot).toBe(false);
      expect(z).toEqual({ pause: '', netz: '' });
      const offen: Zustand = { pause: 'P', netz: 'N' };
      expect(lauf(offen, 'workflow_dispatch', { e: keineDrift(), trockenlauf: true }).rot).toBe(false);
      expect(offen).toEqual({ pause: 'P', netz: 'N' });
    });
  });

  describe('Pause-Zettel-Stufen gegen Ersatz-gh', () => {
    function fahre(schritt: string, env: Record<string, string>, ghExit = 0, offen = '') {
      const dir = mkdtempSync(join(tmpdir(), 'mat-pz-'));
      const log = join(dir, 'log');
      writeFileSync(join(dir, 'gh'), `#!/usr/bin/env bash\necho "gh $1 $2 $3 $4 $5" >> "${log}"\nif [ "$1" = api ]; then echo "${offen}"; fi\nexit ${ghExit}\n`);
      chmodSync(join(dir, 'gh'), 0o755);
      const r = spawnSync('bash', ['-c', runBlock(yml, schritt)], {
        encoding: 'utf8',
        env: { PATH: `${dir}:${process.env.PATH}`, RUN_URL: 'https://x/1', GITHUB_REPOSITORY: 'o/r', LAUF: 'success', WIDERSPRUCH: '', TORE: '', ZETTEL: '', NR: '23', ...env },
      });
      return { status: r.status, out: r.stdout, aufrufe: existsSync(log) ? readFileSync(log, 'utf8').trim().split('\n') : [] };
    }
    const ROT = 'Bei Rot — Pause-Zettel';
    it('kein offener Zettel ⇒ Label + Zettel mit Grund und Quittungs-Hinweis; offener ⇒ Kommentar', () => {
      const a = fahre(ROT, { LAUF: 'failure', WIDERSPRUCH: 'seco' });
      expect(a.status).toBe(0);
      expect(a.aufrufe[1]).toBe(`gh label create ${PAUSE_ZETTEL_LABEL} --color D93F0B`);
      expect(a.aufrufe[2]).toBe(`gh issue create --label ${PAUSE_ZETTEL_LABEL} --title`);
      const b = runBlock(yml, ROT);
      expect(b).toContain('Nach Reparatur: workflow_dispatch; ein grüner Lauf schliesst den Zettel.');
      const k = fahre(ROT, { ZETTEL: 'kommentieren' }, 0, '41');
      expect(k.aufrufe[1]).toMatch(/^gh issue comment 41 --body Lauf ROT am \d{4}-\d{2}-\d{2}: zweiter Netzfehler beim Nachladen in Folge; Nach Reparatur/);
    });
    it('FAIL-SAFE: Pflege scheitert ⇒ rot; Schliessen scheitert ⇒ Warnung', () => {
      expect(fahre(ROT, { LAUF: 'failure' }, 1).status).toBe(1);
      const s = fahre('Grün mit echtem Ergebnis', {}, 1);
      expect(s.status).toBe(0);
      expect(s.out).toContain('::warning::Pause-Zettel-Schliessen gescheitert');
      expect(fahre('Grün mit echtem Ergebnis', {}).aufrufe[0]).toBe('gh issue close 23 --reason completed');
    });
  });

  it('Staging = genau ERLAUBTE_PFADE (eine Liste, zwei Leser)', () => {
    const m = /git add -A -- (.+)$/m.exec(yml);
    expect(m).not.toBeNull();
    expect(m![1].trim().split(/\s+/)).toEqual([...ERLAUBTE_PFADE]);
  });

  describe('PR-Stufe gegen Ersatz-git/gh', () => {
    let dir: string;
    let block: string;
    beforeAll(() => {
      block = runBlock(yml, 'PR eröffnen');
      dir = mkdtempSync(join(tmpdir(), 'mat-nz-'));
      mkdirSync(join(dir, 'bin'));
      for (const name of ['gh', 'git']) {
        writeFileSync(
          join(dir, 'bin', name),
          `#!/usr/bin/env bash\necho "${name} $*" >> "$LOG"\n` +
            'exit 0\n',
        );
        chmodSync(join(dir, 'bin', name), 0o755);
      }
    });
    function fahre(env: Record<string, string>) {
      const log = join(dir, `log-${Math.random().toString(36).slice(2)}`);
      const tmp = mkdtempSync(join(dir, 't-'));
      writeFileSync(join(tmp, 'pr-body.md'), 'Text\n');
      const r = spawnSync('bash', ['-c', block], {
        encoding: 'utf8',
        env: {
          PATH: `${join(dir, 'bin')}:${process.env.PATH}`, LOG: log, NACHZUG_TMP: tmp,
          DATUM: '2026-10-12', QUELLEN_LAUF: 'seco', TORE: '0', GITHUB_SERVER_URL: 'https://x', GITHUB_REPOSITORY: 'o/r', GITHUB_RUN_ID: '1',
          ...env,
        },
      });
      return { status: r.status, aufrufe: existsSync(log) ? readFileSync(log, 'utf8').trim().split('\n') : [] };
    }
    it('anfuegung ⇒ normaler PR, dann CI-Dispatch; kein --draft', () => {
      const r = fahre({ STATUS: 'anfuegung' });
      expect(r.status).toBe(0);
      const create = r.aufrufe.find((a) => a.startsWith('gh pr create'))!;
      expect(create).not.toContain('--draft');
      expect(r.aufrufe.at(-1)).toBe('gh workflow run ci.yml --ref chore/materialien-nachzug-2026-10-12');
      expect(r.aufrufe).toContain('git push --force -u origin chore/materialien-nachzug-2026-10-12');
    });
    it('pruefen ⇒ PR als Entwurf', () => {
      expect(fahre({ STATUS: 'pruefen' }).aufrufe.find((a) => a.startsWith('gh pr create'))).toContain('--draft');
    });
    it('kein Zweitcheck auf offene PRs mehr (die Vorprüfung trägt die Sorge, B1)', () => {
      expect(fahre({ STATUS: 'anfuegung' }).aufrufe.some((a) => a.startsWith('gh pr list'))).toBe(false);
    });
    it('anfuegung mit roten Toren ⇒ Exit 1, kein git/gh', () => {
      const r = fahre({ STATUS: 'anfuegung', TORE: '1' });
      expect(r.status).toBe(1);
      expect(r.aufrufe).toEqual([]);
    });
  });
});
