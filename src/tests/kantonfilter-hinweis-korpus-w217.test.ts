// W2·17-UI-BEFUNDE · Korpus-Sonde zum Kantonfilter-Hinweis (Entscheid David 2.10.2026, Variante A).
//
// Der Hinweis erscheint GENAU dann, wenn ein gewählter Kanton am Artikel keine Kante hat — und
// nennt genau diese Kantone. Soll-Werte kommen aus dem rohen Shard (ohne `src/lib`, wie
// `korpusSoll.helfer`), die geprüften Funktionen aus der Produktion; kein Soll-Wert aus derselben
// Funktion (sonst prüfte der Test nur sich selbst). Korpusrelativ: keine festen Zählwerte.
//
// Probe-Artikel (2.10.2026, gemessen): OR 41 (BS + AG), StPO 5 (nur BS), ZGB 8 (nur BS),
// BS-GOG § 92 (BS-154.100) — dazu je Wahl: keiner / BE / ZH / BS / gemischt.
import { describe, expect, it } from 'vitest';
import type { Bezug } from '../lib/rechtsprechung/bezuege';
import type { BezugStatus } from '../lib/verzahnung/facetten';
import { waehleBezuege } from '../pages/gesetz-leser/bezugAuswahl';
import { kantonOhneWirkungSatz } from '../pages/gesetz-leser/v3/entscheideOrdnung';
import { rohShard } from './korpusSoll.helfer';

const KL: BezugStatus[] = ['bge', 'bger', 'eidg', 'kantonal'];
const PROBEN: Array<[string, string, string]> = [
  ['OR', '41', 'Art. 41'], ['StPO', '5', 'Art. 5'], ['ZGB', '8', 'Art. 8'], ['BS-154.100', '92', '§ 92'],
];
const WAHLEN: string[][] = [[], ['BE'], ['ZH'], ['BS'], ['BE', 'BS', 'ZH']];

function kantenAm(erlass: string, token: string): Bezug[] {
  const s = rohShard(erlass);
  return (s.proArtikel[token] ?? []).map((k) => ({
    key: k.key, facetten: s.dokumente[k.key]?.facetten,
  })) as unknown as Bezug[];
}

describe('Korpus-Sonde · Hinweis genau bei Kantonen ohne Kante am Artikel', () => {
  for (const [erlass, token, label] of PROBEN) {
    const alle = kantenAm(erlass, token);
    // Soll: die Kantone der kantonalen Kanten, roh aus dem Shard.
    const vorhanden = new Set(alle.filter((b) => b.facetten.status === 'kantonal').map((b) => b.facetten.kanton));

    it(`${erlass} ${label}: Artikel hat Kanten (Sonde nicht leer) — kantonal: ${[...vorhanden].sort().join('/') || 'keine'}`, () => {
      expect(alle.length).toBeGreaterThan(0);
    });

    for (const wahl of WAHLEN) {
      it(`${erlass} ${label} × Wahl [${wahl.join(',') || 'keine'}]`, () => {
        const ohne = wahl.filter((k) => !vorhanden.has(k));
        const wirkt = wahl.filter((k) => vorhanden.has(k));
        const satz = kantonOhneWirkungSatz({ ort: `an ${label}`, alle, klassen: KL, kantone: wahl, geladen: true });

        // 1 · genau dann ein Satz, wenn mindestens ein gewählter Kanton keine Kante hat
        expect(satz !== null).toBe(ohne.length > 0);
        if (satz === null) return;

        // 2 · er nennt genau diese Kantone (und keinen wirkenden)
        const genannt = /^Kein Entscheid aus (.+?) an /.exec(satz)?.[1]?.split(/, | oder /);
        expect(genannt).toEqual(ohne);
        for (const k of wirkt) expect(satz.split(' — ')[0]).not.toContain(k);

        // 3 · «alle Kantone» nur, wenn die Wahl wirklich nichts ausblendet (Liste = ungefiltert)
        const ausgeblendet = waehleBezuege(alle, KL, wahl).length < waehleBezuege(alle, KL, []).length;
        if (satz.includes('alle Kantone')) {
          expect(ausgeblendet).toBe(false);
          expect(wirkt).toEqual([]);
        }
        // … und wirkt ein Teil, nennt der Satz genau diesen Teil als angezeigt
        if (wirkt.length > 0) {
          expect(ausgeblendet || vorhanden.size === wirkt.length).toBe(true);
          expect(satz).toContain(`nur ${wirkt.join(', ')}`);
        }
      });
    }
  }
});
