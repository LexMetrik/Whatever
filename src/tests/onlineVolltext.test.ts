import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  holeOnlineTreffer,
  formatiereIndexStand,
  artikelTrefferHref,
  entscheidTrefferHref,
  zuruecksetzenOnlineSperre,
  MIN_ZEICHEN,
  SPERRE_MS,
} from '../lib/suche/onlineVolltext';

// QS-DATA E2 (W2·6-DATA): die Online-Volltextsuche als zusätzliche Treffergruppe.
// Kern dieser Tests ist die reine Fetch-/Degradations-Logik (holeOnlineTreffer):
// 200 → Gruppe, 503/Netz/Timeout → GAR keine Gruppe (null), <3 Zeichen → kein Fetch,
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
  entscheide: {
    treffer: [
      {
        id: 'bge-150-III-1',
        titel: 'BGE 150 III 1',
        snippet: '… [Verjährung] …',
        fundstelle: { quelleUrl: 'https://www.bger.ch/...' },
      },
    ],
    gesamt: 1,
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

  it('Entscheid → Entscheid-Route über die kanonische id (kodiert)', () => {
    expect(entscheidTrefferHref('bge-150-III-1')).toBe('/rechtsprechung/bge-150-III-1');
    expect(entscheidTrefferHref('BGer 4A_1/2020')).toBe('/rechtsprechung/BGer%204A_1%2F2020');
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
  it('baut die §8-markierte Gruppe mit Artikel- + Entscheid-Treffern', async () => {
    let gerufeneUrl = '';
    const mock = vi.fn(async (url: string) => { gerufeneUrl = url; return jsonRes(ARTIKEL_ANTWORT); });
    const g = await holeOnlineTreffer('verjaehrung', { fetchImpl: mock as unknown as typeof fetch, basisUrl: BASIS });
    expect(mock).toHaveBeenCalledOnce();
    expect(gerufeneUrl).toBe('/api/suche?q=verjaehrung&limit=10');
    expect(g).not.toBeNull();
    expect(g!.id).toBe('online');
    expect(g!.hinweis).toMatch(/verlassen dafür den Browser/);
    // Artikel zuerst, dann Entscheide; gesamt = Summe der Edge-Zählungen.
    expect(g!.treffer.map((t) => t.href)).toEqual(['/gesetze/bund/OR#art-330_a', '/rechtsprechung/bge-150-III-1']);
    expect(g!.gesamt).toBe(4);
    // Kein Volltext im Treffer — nur Snippet als Untertitel (§15).
    expect(g!.treffer[0].untertitel).toContain('Zeugnis');
    // Cowork-Befund 30 (18.8.2026): die FTS5-Snippet-Klammern (`[Verjährung]`)
    // um den Treffer-Term sind entfernt — der Client hebt selbst mit <mark>
    // hervor (SuchResultate.markiere); die Klammern wären doppelte Auszeichnung.
    expect(g!.treffer[1].untertitel).toBe('… Verjährung …');
    expect(g!.treffer[1].untertitel).not.toMatch(/[[\]]/);
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

  it('200 mit leerer Antwort → GAR keine Gruppe (null)', async () => {
    const fetchImpl = vi.fn(async () => jsonRes({ artikel: { treffer: [], gesamt: 0, naechsteSeite: null } }));
    const g = await holeOnlineTreffer('xyznichttreffer', { fetchImpl, basisUrl: BASIS });
    expect(g).toBeNull();
  });
});

describe('onlineVolltext: ehrliches Degradieren', () => {
  it('503 (Turso nicht aktiviert) → null, danach ~5 min NICHT erneut fetchen', async () => {
    const fetchImpl = vi.fn(async () => jsonRes({ fehler: 'nicht aktiviert' }, false, 503));
    const jetzt = () => 1_000;
    const g1 = await holeOnlineTreffer('verjaehrung', { fetchImpl, basisUrl: BASIS, jetzt });
    expect(g1).toBeNull();
    expect(fetchImpl).toHaveBeenCalledOnce();

    // Neue Query innerhalb des Sperr-Fensters: KEIN weiterer Fetch.
    const g2 = await holeOnlineTreffer('kuendigung', { fetchImpl, basisUrl: BASIS, jetzt: () => 1_000 + SPERRE_MS - 1 });
    expect(g2).toBeNull();
    expect(fetchImpl).toHaveBeenCalledOnce();

    // Nach Ablauf des Fensters (>5 min): wieder probieren.
    const fetchOk = vi.fn(async () => jsonRes(ARTIKEL_ANTWORT));
    const g3 = await holeOnlineTreffer('verjaehrung', { fetchImpl: fetchOk, basisUrl: BASIS, jetzt: () => 1_000 + SPERRE_MS + 1 });
    expect(fetchOk).toHaveBeenCalledOnce();
    expect(g3).not.toBeNull();
  });

  it('Netzwerkfehler → null + Sperre gesetzt', async () => {
    const fetchImpl = vi.fn(async () => { throw new Error('network down'); });
    const g = await holeOnlineTreffer('verjaehrung', { fetchImpl, basisUrl: BASIS, jetzt: () => 5_000 });
    expect(g).toBeNull();
    // Sperre aktiv → nächster Aufruf im Fenster fetcht nicht.
    const g2 = await holeOnlineTreffer('mietrecht', { fetchImpl, basisUrl: BASIS, jetzt: () => 5_100 });
    expect(g2).toBeNull();
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it('Timeout → AbortController bricht ab → null', async () => {
    // fetch, das den Abort-Signal respektiert (rejectet, wenn abgebrochen).
    const fetchImpl = vi.fn((_url: string, init?: { signal?: AbortSignal }) =>
      new Promise<Response>((_res, rej) => {
        init?.signal?.addEventListener('abort', () => rej(new DOMException('Aborted', 'AbortError')));
      }),
    ) as unknown as typeof fetch;
    const g = await holeOnlineTreffer('verjaehrung', { fetchImpl, basisUrl: BASIS, timeoutMs: 10, jetzt: () => 9_000 });
    expect(g).toBeNull();
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
