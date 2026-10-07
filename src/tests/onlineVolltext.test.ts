import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  holeOnlineTreffer,
  formatiereIndexStand,
  artikelTrefferHref,
  passeOnlineGruppeAn,
  zuruecksetzenOnlineSperre,
  HINWEIS_NICHT_VERFUEGBAR,
  MIN_ZEICHEN,
  SPERRE_MS,
} from '../lib/suche/onlineVolltext';
import type { SuchGruppe } from '../lib/universalSuche';

// QS-DATA E2 (W2·6-DATA): die Online-Volltextsuche als Treffergruppe; seit
// A1-FUNDAMENT (7.10.2026) der EINZIGE Weg zur Wortsuche im Gesetzestext.
// Kern dieser Tests ist die reine Fetch-/Degradations-Logik (holeOnlineTreffer):
// 200 → Gruppe, 503/502/Netz/Timeout/unlesbar → Gruppe MIT Hinweis «derzeit nicht
// verfügbar» (§8, früher: still keine Gruppe), <3 Zeichen → kein Fetch,
// Feature-Detection-Cache (nach Ausfall ~5 min nicht erneut hämmern, dann wieder).

const BASIS = '/';

function jsonRes(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => body,
  } as unknown as Response;
}

const ARTIKEL_ANTWORT = {
  artikel: {
    treffer: [
      {
        id: 'art:OR:art_330_a',
        titel: 'Art. 330a OR',
        snippet: '… Der Arbeitgeber stellt … Zeugnis …',
        fundstelle: { erlass: 'OR', artikel: '330_a', quelleUrl: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de#art_330_a' },
      },
    ],
    gesamt: 3,
    naechsteSeite: null,
  },
};

/** Kantonaler + eidgenössischer Artikel-Treffer in EINER Antwort (F35): die
 *  hot-FTS trägt beide Ebenen, die Trefferliste muss sie unterscheiden. */
const KANTON_ANTWORT = {
  artikel: {
    treffer: [
      {
        id: 'art:AG-291.150:art_1',
        titel: '§ 1 AnwT',
        snippet: '… Honorar …',
        fundstelle: {
          erlass: 'AG-291.150',
          artikel: '1',
          quelleUrl: 'https://gesetzessammlungen.ag.ch/app/de/texts_of_law/291.150',
          ebene: 'kanton',
          kanton: 'AG',
        },
      },
      {
        id: 'art:OR:art_330_a',
        titel: 'Art. 330a OR',
        snippet: '… Zeugnis …',
        fundstelle: {
          erlass: 'OR',
          artikel: '330_a',
          quelleUrl: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de#art_330_a',
          ebene: 'bund',
        },
      },
    ],
    gesamt: 2,
    naechsteSeite: null,
  },
};

beforeEach(() => {
  zuruecksetzenOnlineSperre();
});

describe('onlineVolltext: URL-Bildung (aus bestehenden Helfern abgeleitet)', () => {
  it('Artikel → Gesetzes-Anker-Route (Bund, #art-<artikel>, key kodiert, Anker roh)', () => {
    expect(artikelTrefferHref({ erlass: 'OR', artikel: '330_a', quelleUrl: 'x' })).toBe('/gesetze/bund/OR#art-330_a');
    // Routen-Key wird kodiert (wie universalSuche/artikelVolltext), der Anker-Token nicht.
    expect(artikelTrefferHref({ erlass: 'ArGV_1', artikel: '13', quelleUrl: 'x' })).toBe('/gesetze/bund/ArGV_1#art-13');
  });

  // ── W2·13-KANTONE K-3 (F35/F36): Kanton-Treffer auf die Kanton-Ebene ──────
  //
  // Vor dem Fix baute der Href über `erlassPfadVonKey(key)` OHNE Ebene — und
  // dessen Fallback ist 'bund'. Die hot-FTS trägt aber auch kantonale Artikel:
  // jeder kantonale Online-Treffer landete damit auf `/gesetze/bund/<kanton-key>`,
  // also auf einer Adresse, die die falsche Ebene behauptet (§8).
  it('Artikel (Kanton) → Kanton-Route aus der DTO-Ebene', () => {
    expect(
      artikelTrefferHref({ erlass: 'AG-291.150', artikel: '1', quelleUrl: 'x', ebene: 'kanton', kanton: 'AG' }),
    ).toBe('/gesetze/kanton/AG-291.150#art-1');
  });

  it('DTO OHNE Ebene (gecachte Alt-Antwort) → kein Crash, richtige Ebene', () => {
    expect(artikelTrefferHref({ erlass: 'OR', artikel: '330_a', quelleUrl: 'x' })).toBe('/gesetze/bund/OR#art-330_a');
    // NACHGEZOGEN (W2·13-KANTONE K-3 Ebenen-Redirect, 31.8.2026): hier stand
    // «weiterhin der Bund-Fallback (wie bisher)» — das galt, solange
    // `routenEbeneVonKey` kantonale Schlüssel nicht kannte. Sie erkennt sie
    // jetzt am Kantons-Präfix (erlassAdresse.ts, über den ganzen Bestand
    // bewacht), also greift der Bund-Fallback auch OHNE DTO-Ebene nicht mehr:
    // die gecachte Alt-Antwort landet ebenfalls auf der richtigen Ebene. 'bund'
    // bleibt Fallback nur für Schlüssel, die weder im Register stehen noch ein
    // Kantonskürzel tragen (unten geprüft).
    expect(artikelTrefferHref({ erlass: 'AG-291.150', artikel: '1', quelleUrl: 'x' })).toBe(
      '/gesetze/kanton/AG-291.150#art-1',
    );
    expect(artikelTrefferHref({ erlass: 'GIBTSNICHT', artikel: '1', quelleUrl: 'x' })).toBe(
      '/gesetze/bund/GIBTSNICHT#art-1',
    );
  });

  it('das REGISTER schlägt die DTO-Ebene (Staatsvertrag bleibt international)', () => {
    // Befund 45 darf nicht zurückkehren: `CISG` trägt die Daten-Ebene 'bund',
    // seine kanonische Adresse ist aber /gesetze/international/CISG. Die
    // DTO-Ebene ist NUR Fallback für Schlüssel, die das Register nicht kennt.
    expect(artikelTrefferHref({ erlass: 'CISG', artikel: '1', quelleUrl: 'x', ebene: 'bund' })).toBe(
      '/gesetze/international/CISG#art-1',
    );
  });
});

describe('onlineVolltext: 200-Fall', () => {
  it('baut die §8-markierte Gruppe mit Artikel-Treffern und fragt NUR Artikel ab (typ=artikel)', async () => {
    let gerufeneUrl = '';
    const mock = vi.fn(async (url: string) => { gerufeneUrl = url; return jsonRes(ARTIKEL_ANTWORT); });
    const g = await holeOnlineTreffer('verjaehrung', { fetchImpl: mock as unknown as typeof fetch, basisUrl: BASIS });
    expect(mock).toHaveBeenCalledOnce();
    // Entscheide sucht diese Gruppe nicht mehr (Entscheid David 7.10.2026): kein
    // Netz-Aufwand und keine Treffer dafür — `typ=artikel` hält sie serverseitig fern.
    expect(gerufeneUrl).toBe('/api/suche?q=verjaehrung&typ=artikel&limit=10');
    expect(g).not.toBeNull();
    expect(g!.id).toBe('online');
    expect(g!.nichtVerfuegbar).toBeUndefined();
    expect(g!.hinweis).toMatch(/verlassen dafür den Browser/);
    expect(g!.hinweis).not.toMatch(/Leitentscheid/);
    expect(g!.treffer.map((t) => t.href)).toEqual(['/gesetze/bund/OR#art-330_a']);
    expect(g!.gesamt).toBe(3); // Zählung des Servers, nicht die Länge der Seite
    // Kein Volltext im Treffer — nur Snippet als Untertitel (§15).
    expect(g!.treffer[0].untertitel).toContain('Zeugnis');
  });

  it('eine Antwort mit Entscheiden (Alt-Antwort/Cache) erzeugt KEINE Entscheid-Treffer', async () => {
    const mitEntscheid = jsonRes({
      ...ARTIKEL_ANTWORT,
      entscheide: { treffer: [{ id: 'bge-150-III-1', titel: 'BGE 150 III 1', snippet: '…', fundstelle: { quelleUrl: 'x' } }], gesamt: 1, naechsteSeite: null },
    });
    const g = await holeOnlineTreffer('verjaehrung', { fetchImpl: vi.fn(async () => mitEntscheid), basisUrl: BASIS });
    expect(g!.treffer.every((t) => t.href.startsWith('/gesetze/'))).toBe(true);
    expect(g!.gesamt).toBe(3);
  });

  it('Snippet-Klammern des Servers (FTS5-Hervorhebung `[Wort]`) werden entfernt', async () => {
    // Cowork-Befund 30 (18.8.2026): der Client hebt selbst mit <mark> hervor
    // (SuchResultate.markiere); die Klammern wären doppelte Auszeichnung.
    const antwort = jsonRes({
      artikel: { treffer: [{ id: 'a', titel: 'Art. 127 OR', snippet: '… [Verjährung] [10] Jahre …', fundstelle: { erlass: 'OR', artikel: '127', quelleUrl: 'x' } }], gesamt: 1, naechsteSeite: null },
    });
    const g = await holeOnlineTreffer('verjaehrung', { fetchImpl: vi.fn(async () => antwort), basisUrl: BASIS });
    expect(g!.treffer[0].untertitel).toBe('… Verjährung 10 Jahre …');
    expect(g!.treffer[0].untertitel).not.toMatch(/[[\]]/);
  });

  it('`limit` der Fläche geht an den Server (/suche holt mehr als das Dropdown)', async () => {
    let gerufeneUrl = '';
    const mock = vi.fn(async (url: string) => { gerufeneUrl = url; return jsonRes(ARTIKEL_ANTWORT); });
    await holeOnlineTreffer('miete', { fetchImpl: mock as unknown as typeof fetch, basisUrl: BASIS, limit: 50 });
    expect(gerufeneUrl).toBe('/api/suche?q=miete&typ=artikel&limit=50');
  });

  it('Kanton-Treffer trägt Ebene-Route, Kürzel-Marke und Label-Suffix (F35/F36)', async () => {
    const fetchImpl = vi.fn(async () => jsonRes(KANTON_ANTWORT));
    const g = await holeOnlineTreffer('honorar', { fetchImpl, basisUrl: BASIS });
    expect(g).not.toBeNull();
    const t = g!.treffer[0];
    expect(t.href).toBe('/gesetze/kanton/AG-291.150#art-1');
    // Herkunft ehrlich (§8) — dasselbe Doppel-Idiom wie im statischen Index
    // (artikelVolltext.treffer): Label-Suffix « · AG» PLUS Marke «AG», die
    // anders als «Gesetz» NICHT als redundant ausgeblendet werden darf.
    expect(t.label).toBe('§ 1 AnwT · AG');
    expect(t.marke).toEqual({ text: 'AG', ton: 'soft' });
    // Der Bund-Treffer derselben Antwort bleibt unverändert.
    const b = g!.treffer[1];
    expect(b.href).toBe('/gesetze/bund/OR#art-330_a');
    expect(b.label).toBe('Art. 330a OR');
    expect(b.marke).toEqual({ text: 'Gesetz', ton: 'soft', redundant: true });
  });

  it('F36: der Gruppen-Hinweis nennt Bund UND Kanton und sagt, dass es online läuft', async () => {
    const fetchImpl = vi.fn(async () => jsonRes(ARTIKEL_ANTWORT));
    const g = await holeOnlineTreffer('verjaehrung', { fetchImpl, basisUrl: BASIS });
    expect(g!.hinweis).toMatch(/Bund/);
    expect(g!.hinweis).toMatch(/[Kk]anton/);
    expect(g!.hinweis).toMatch(/nur online/);
    expect(g!.hinweis).toMatch(/verlassen dafür den Browser/);
  });

  it('200 mit leerer Antwort → echte Antwort «nichts gefunden» (null), KEIN Ausfall', async () => {
    const fetchImpl = vi.fn(async () => jsonRes({ artikel: { treffer: [], gesamt: 0, naechsteSeite: null } }));
    const g = await holeOnlineTreffer('xyznichttreffer', { fetchImpl, basisUrl: BASIS });
    expect(g).toBeNull();
  });
});

describe('onlineVolltext: ehrliches Degradieren (§8)', () => {
  // Früher: Ausfall ⇒ null ⇒ die Gruppe fehlte still, die Seite wirkte, als gäbe es
  // keine Treffer. Seit A1-FUNDAMENT ist die Server-Suche der einzige Volltext-Weg,
  // also sagt die Gruppe den Ausfall ausdrücklich — und führt keinen Zähler.
  const istAusfall = (g: SuchGruppe | null) => {
    expect(g).not.toBeNull();
    expect(g!.id).toBe('online');
    expect(g!.nichtVerfuegbar).toBe(true);
    expect(g!.treffer).toEqual([]);
    expect(g!.hinweis).toBe(HINWEIS_NICHT_VERFUEGBAR);
    expect(g!.hinweis).toMatch(/Volltextsuche derzeit nicht verfügbar/);
  };

  it('503 (Turso nicht aktiviert) → Ausfall-Gruppe, danach ~5 min NICHT erneut fetchen', async () => {
    const fetchImpl = vi.fn(async () => jsonRes({ fehler: 'nicht aktiviert' }, false, 503));
    const jetzt = () => 1_000;
    const g1 = await holeOnlineTreffer('verjaehrung', { fetchImpl, basisUrl: BASIS, jetzt });
    istAusfall(g1);
    expect(fetchImpl).toHaveBeenCalledOnce();

    // Neue Query innerhalb des Sperr-Fensters: KEIN weiterer Fetch — aber der Ausfall
    // bleibt sichtbar (nicht plötzlich «keine Treffer»).
    const g2 = await holeOnlineTreffer('kuendigung', { fetchImpl, basisUrl: BASIS, jetzt: () => 1_000 + SPERRE_MS - 1 });
    istAusfall(g2);
    expect(fetchImpl).toHaveBeenCalledOnce();

    // Nach Ablauf des Fensters (>5 min): wieder probieren.
    const fetchOk = vi.fn(async () => jsonRes(ARTIKEL_ANTWORT));
    const g3 = await holeOnlineTreffer('verjaehrung', { fetchImpl: fetchOk, basisUrl: BASIS, jetzt: () => 1_000 + SPERRE_MS + 1 });
    expect(fetchOk).toHaveBeenCalledOnce();
    expect(g3!.nichtVerfuegbar).toBeUndefined();
    expect(g3!.treffer.length).toBeGreaterThan(0);
  });

  it('502 (Abfrage fehlgeschlagen) → Ausfall-Gruppe', async () => {
    const fetchImpl = vi.fn(async () => jsonRes({ fehler: 'Suche vorübergehend nicht verfügbar' }, false, 502));
    istAusfall(await holeOnlineTreffer('verjaehrung', { fetchImpl, basisUrl: BASIS, jetzt: () => 2_000 }));
  });

  it('Netzwerkfehler (offline) → Ausfall-Gruppe + Sperre gesetzt', async () => {
    const fetchImpl = vi.fn(async () => { throw new Error('network down'); });
    const g = await holeOnlineTreffer('verjaehrung', { fetchImpl, basisUrl: BASIS, jetzt: () => 5_000 });
    istAusfall(g);
    // Sperre aktiv → nächster Aufruf im Fenster fetcht nicht, meldet aber weiter den Ausfall.
    const g2 = await holeOnlineTreffer('mietrecht', { fetchImpl, basisUrl: BASIS, jetzt: () => 5_100 });
    istAusfall(g2);
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it('Timeout → AbortController bricht ab → Ausfall-Gruppe', async () => {
    // fetch, das den Abort-Signal respektiert (rejectet, wenn abgebrochen).
    const fetchImpl = vi.fn((_url: string, init?: { signal?: AbortSignal }) =>
      new Promise<Response>((_res, rej) => {
        init?.signal?.addEventListener('abort', () => rej(new DOMException('Aborted', 'AbortError')));
      }),
    ) as unknown as typeof fetch;
    const g = await holeOnlineTreffer('verjaehrung', { fetchImpl, basisUrl: BASIS, timeoutMs: 10, jetzt: () => 9_000 });
    istAusfall(g);
  });

  it('200 mit HTML statt JSON (SPA-Rückfall eines Hosts ohne Funktion) → Ausfall, nie «0 Treffer»', async () => {
    const html = { ok: true, status: 200, json: async () => { throw new SyntaxError('Unexpected token <'); } } as unknown as Response;
    istAusfall(await holeOnlineTreffer('verjaehrung', { fetchImpl: vi.fn(async () => html), basisUrl: BASIS, jetzt: () => 7_000 }));
  });

  it('200 ohne `artikel` (keine Suchantwort) → Ausfall', async () => {
    const fremd = jsonRes({ irgendwas: true });
    istAusfall(await holeOnlineTreffer('verjaehrung', { fetchImpl: vi.fn(async () => fremd), basisUrl: BASIS, jetzt: () => 8_000 }));
  });

  it('Ausfall-Gruppe trägt keinen Zähler und keine Treffer (Zähler «0» wäre falsch)', async () => {
    const g = await holeOnlineTreffer('verjaehrung', { fetchImpl: vi.fn(async () => jsonRes({}, false, 503)), basisUrl: BASIS, jetzt: () => 1 });
    expect(g!.gesamt).toBe(0);
    expect(g!.nichtVerfuegbar).toBe(true);
    expect(g!.laedt).toBeUndefined();
  });
});

describe('onlineVolltext: Anpassung an die Fläche (passeOnlineGruppeAn)', () => {
  const treffer = (n: number) => Array.from({ length: n }, (_, i) => ({
    id: `art:OR:${i}`, label: `Art. ${i} OR`, href: `/gesetze/bund/OR#art-${i}`,
  }));
  const gruppe = (anzahl: number, gesamt: number): SuchGruppe => ({
    id: 'online', titel: 'Volltext-Suche (online)', treffer: treffer(anzahl), gesamt, hinweis: 'H',
  });

  it('Dropdown: 10 geholt, 6 gezeigt, Server kennt 223 → gekürzt + «alle N» nach /suche?q=', () => {
    const g = passeOnlineGruppeAn(gruppe(10, 223), 6, ' Miete ');
    expect(g.treffer).toHaveLength(6);
    expect(g.gesamt).toBe(223);
    expect(g.mehrHref).toBe('/suche?q=Miete');
  });

  it('Dropdown: alles passt in die Kappung → unverändert, kein «alle N»', () => {
    const g = gruppe(4, 4);
    expect(passeOnlineGruppeAn(g, 6, 'miete')).toBe(g);
  });

  it('Dropdown: 8 Treffer, Kappung 6 → «alle 8» (gesamt > gezeigt), Zähler bleibt 8', () => {
    const g = passeOnlineGruppeAn(gruppe(8, 8), 6, 'miete');
    expect(g.treffer).toHaveLength(6);
    expect(g.mehrHref).toBe('/suche?q=miete');
  });

  it('/suche: alle geholten gezeigt, Server kennt mehr → ehrlicher Hinweis «die ersten n von N», KEIN Link auf sich selbst', () => {
    const g = passeOnlineGruppeAn(gruppe(50, 223), 500, 'miete');
    expect(g.treffer).toHaveLength(50);
    expect(g.mehrHref).toBeUndefined();
    expect(g.hinweis).toContain('Angezeigt: die ersten 50 von 223 Treffern');
  });

  it('Ausfall-Gruppe bleibt unverändert', () => {
    const aus: SuchGruppe = { id: 'online', titel: 't', treffer: [], gesamt: 0, nichtVerfuegbar: true, hinweis: HINWEIS_NICHT_VERFUEGBAR };
    expect(passeOnlineGruppeAn(aus, 6, 'x')).toBe(aus);
  });
});

describe('onlineVolltext: <3-Zeichen-Fall', () => {
  it('unter MIN_ZEICHEN → kein Fetch, null', async () => {
    const fetchImpl = vi.fn(async () => jsonRes(ARTIKEL_ANTWORT));
    const kurz = 'ab'.slice(0, MIN_ZEICHEN - 1);
    const g = await holeOnlineTreffer(kurz, { fetchImpl, basisUrl: BASIS });
    expect(g).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('Leerraum-Padding zählt nicht (getrimmt) → kein Fetch', async () => {
    const fetchImpl = vi.fn(async () => jsonRes(ARTIKEL_ANTWORT));
    const g = await holeOnlineTreffer('  a  ', { fetchImpl, basisUrl: BASIS });
    expect(g).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

// E0-BRANDSCHUTZ (§8): wie frisch ist die Server-Suche? Die Edge liefert `stand`
// (ISO, letzter erfolgreicher Sync); der Hinweis der Online-Gruppe zeigt ihn als
// «Suchindex Stand TT.MM.JJJJ». Fehlt/ungültig → keine Anzeige, nie ein erfundenes Datum.
describe('onlineVolltext: Suchindex-Stand (§8)', () => {
  const mitStand = (stand?: string) => jsonRes({ ...ARTIKEL_ANTWORT, ...(stand === undefined ? {} : { stand }) });
  const hole = (res: Response) =>
    holeOnlineTreffer('verjaehrung', { fetchImpl: (async () => res) as unknown as typeof fetch, basisUrl: BASIS });

  it('formatiert den Kalendertag in Zürich als TT.MM.JJJJ (Tag ≠ Monatserster)', async () => {
    expect(formatiereIndexStand('2026-10-05T04:17:09.123Z')).toBe('05.10.2026');
    const g = await hole(mitStand('2026-10-05T04:17:09.123Z'));
    expect(g!.hinweis).toContain('Suchindex Stand 05.10.2026.');
    expect(g!.hinweis).toMatch(/verlassen dafür den Browser/); // bisheriger Hinweis bleibt vollständig
  });

  it('Mitternachts-Rand: 23:30 UTC ist in Zürich schon der Folgetag (Sommer- und Winterzeit)', () => {
    expect(formatiereIndexStand('2026-10-05T23:30:00Z')).toBe('06.10.2026'); // MESZ, +2
    expect(formatiereIndexStand('2026-12-31T23:30:00Z')).toBe('01.01.2027'); // MEZ, +1, Jahreswechsel
    expect(formatiereIndexStand('2026-10-05T21:59:59Z')).toBe('05.10.2026'); // 23:59:59 MESZ
  });

  it('kein Stand in der Antwort → Hinweis ohne Datumszeile (nichts erfunden)', async () => {
    const g = await hole(mitStand());
    expect(g!.hinweis).not.toMatch(/Suchindex Stand/);
  });

  it('unlesbarer Stand → keine Anzeige', async () => {
    expect(formatiereIndexStand('gestern')).toBeNull();
    expect(formatiereIndexStand('')).toBeNull();
    expect(formatiereIndexStand(undefined)).toBeNull();
    const g = await hole(mitStand('gestern Abend'));
    expect(g!.hinweis).not.toMatch(/Suchindex Stand/);
  });
});
