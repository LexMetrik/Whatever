// ─── S0 · Entscheid-Kern-Probe: Körper + Regeste byte-genau (W2·29-WERKBANK-REST)
//
// WOFÜR: S1 (Entscheid-Leser, FAHRPLAN-WERKBANK-UMBAU §5f) zieht Kopf, Reiter,
// Lesemodus und Kontext um und verspricht «Körper byte-gleich». Diese Probe ist
// das Instrument dafür — Muster der Normtext-Kern-Probe am Ende von
// `ArtikelBody.test.tsx` (LESER-S0): eine FESTE Stichprobe wird so gerendert,
// wie `EntscheidLeser.tsx` / `LesemodusOverlay.tsx` die Bausteine aufrufen
// (`<EntscheidBody abschnitte zitierung bgeReferenz quarantaene />`,
// `<RegesteBlock regeste amtlich mitAnker />`), je Fall zwei Hashes:
//   voll     = sha256 des vollständigen Markups (jede Klasse, jedes Zeichen);
//   struktur = sha256 des Markups OHNE class-Attribute (Elemente, Attribute,
//              Wortlaut) — ein reiner Klassen-Tausch lässt ihn stehen.
// Ändert sich ein Hash, ist das eine Änderung am Entscheid-Körper bzw. an der
// Regeste: nie still nachführen (§6.3), sondern deklariert und begründet — oder
// den Umbau zurücknehmen. Eine GEWOLLTE Darstellungsänderung zieht nur die
// Hashes in KERN_ERWARTET neu (Test laufen lassen, `toEqual`-Diff übernehmen);
// die Fixture bleibt unverändert.
//
// EINGEFROREN: die Eingaben stehen in `fixtures/kern-probe-entscheid.json`
// (Extraktion 25.9.2026 aus public/rechtsprechung, je Fall `meta` mit Key,
// Datei, abgerufen, fassungsToken) — ein Korpus-Nachzug kippt die Probe nicht.
//
// ZAUN — was die Stichprobe abdeckt (je ein echter Korpus-Fall):
//   Regeste · amtlich DE/FR/IT mehrteilig mit Teil-Labels (BGE 147 III 121)
//           · amtlich DE/FR/IT einteilig, ohne Sprung-Anker (BGE 149 IV 213,
//             Aufruf wie im Lesemodus)
//           · flach, nicht amtlich, ohne Sprachfassungen (SG B 2023/225)
//   Körper  · BGE-Auszug: Kolumnentitel als <sup>, Unter-Erwägungen nach
//             Tiefe, Norm-Autolinks (BGE 147 III 121)
//           · BGE-Vollurteil: Kolumnentitel direkt nach fremder Zitierung
//             wird still entfernt (BGE 149 III 172, ZITAT_AM_ENDE)
//           · BGE-Auszug französisch (BGE 146 I 126)
//           · BGer-Urteil ohne Regeste: Unter-Erwägungen, Dispositiv
//             nummeriert (12T_3/2025)
//           · kantonal BS: Sachverhalt, Erwägungen, Dispositiv (BEZ.2024.66)
//           · Sachverhalt `vollstaendig: false` → Hinweis (BVGer F-4109/2026)
//           · markenlose Erwägungen als Fliesstext, ohne Dispositiv →
//             Abgrenzungs-Hinweis (BStGer CR.2026.5)
//           · ohne Struktur: ein Block ohne Marke (SG B 2023/225)
//           · Quarantäne: leerer Körper mit Konflikt-Grund (BGE 152 V 2)
// NICHT im Zaun: die Such-Hervorhebung (`setzeSuchHighlight`) — sie
// markiert nachträglich im DOM und ist nicht Teil des gerenderten Markups;
// die Kopier-Quittung (aria-live) erst nach einem Klick.
//
// `anker` = Werttreue-Stichwort: die Probe rendert wirklich den Fall und nicht
// eine Leer- oder Fehlfläche.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { renderToStaticMarkup } from 'react-dom/server';
import { EntscheidBody } from '../components/rechtsprechung/EntscheidBody';
import RegesteBlock from '../components/rechtsprechung/RegesteBlock';
import type { EntscheidAbschnitt, EntscheidRegeste } from '../lib/rechtsprechung/typen';

type KernFixtureEintrag = {
  fall: string;
  art: 'regeste' | 'voll' | 'auszug';
  meta: { key: string; datei: string; abgerufen: string; fassungsToken: string; extrahiertAm: string };
  eingabe:
    | { regeste: EntscheidRegeste; amtlich: boolean; mitAnker: boolean }
    | { abschnitte: EntscheidAbschnitt[]; zitierung: string; bgeReferenz: string | null; quarantaene?: string };
};
const KERN_FIXTURE: KernFixtureEintrag[] = JSON.parse(
  readFileSync(join(process.cwd(), 'src', 'tests', 'fixtures', 'kern-probe-entscheid.json'), 'utf8'),
);

function kernMarkup(f: KernFixtureEintrag): string {
  const e = f.eingabe;
  if ('regeste' in e) return renderToStaticMarkup(<RegesteBlock regeste={e.regeste} amtlich={e.amtlich} mitAnker={e.mitAnker} />);
  return renderToStaticMarkup(
    <EntscheidBody abschnitte={e.abschnitte} zitierung={e.zitierung} bgeReferenz={e.bgeReferenz} quarantaene={e.quarantaene} />,
  );
}
const kernSha = (s: string) => createHash('sha256').update(s).digest('hex');
const ohneKlassen = (s: string) => s.replace(/ class="[^"]*"/g, '');

/** Werttreue-Stichwort je Fall (steht im gerenderten Markup). */
const KERN_ANKER: Record<string, string> = {
  'Regeste amtlich, DE/FR/IT, mehrteilig (Teil-Labels)': 'Regeste b',
  'Regeste amtlich, DE/FR/IT, einteilig, ohne Anker (Lesemodus-Aufruf)': 'Italiano',
  'Regeste flach, nicht amtlich (Fallback ohne Sprachfassungen)': 'Gesundheitsrecht, Notfalldienstersatzabgabe',
  'BGE-Auszug: Kolumnentitel hochgestellt, Unter-Erwägungen, Normverweise': 'title="Seitenzahl der amtlichen Sammlung (BGE)"',
  'BGE-Vollurteil: Kolumnentitel nach fremder Zitierung still entfernt': '5A_277/2019</a>  vom 25. September 2019 E. 3.1',
  'BGE-Auszug französisch (consid.)': 'ATF 145 II 328 consid. 3.1',
  'BGer-Urteil ohne Regeste: Unter-Erwägungen, Dispositiv nummeriert': '<ol',
  'Kantonal BS: Sachverhalt, Erwägungen, Dispositiv, Normbezüge': 'fedlex.admin.ch/eli/cc/2006/218/de#art_42',
  'BVGer: Sachverhalt als unvollständig markiert': 'Auszug — der vollständige Sachverhalt steht in der amtlichen Fassung',
  'Markenlose Erwägungen als Fliesstext, ohne Dispositiv': 'nicht zuverlässig abgegrenzt',
  'Ohne Struktur: ein Block ohne Marke': 'B 2023/225 Saint-Gall Verwaltungsgericht',
  'Quarantäne: leerer Körper mit Konflikt-Grund': 'data-quarantaene="ocl-konflation:152 V 20"',
};

/** Erwartete Hashes [voll, struktur] je Fall — erzeugt 25.9.2026 auf dem Stand
 *  8f13be7d2 (Kopf der Scheibe S0 vor T1). */
const KERN_ERWARTET: Record<string, [string, string]> = {
  'Regeste amtlich, DE/FR/IT, mehrteilig (Teil-Labels)': ['95daff5a6d1b076f8b591207d63f81c1759879cc0383c68ee1dec1d88b95c458', 'c7d66da8e9ebe765af8d61ce080c6d1340bb206549d7fa7b13696aaccbb27245'],
  'Regeste amtlich, DE/FR/IT, einteilig, ohne Anker (Lesemodus-Aufruf)': ['8e2680ecd0af0fa2aeb9df6415aa5ac01dfbe185cb2d64d669accec3e795f15b', '65891ab6d3c25d435a07f44279d4f849e9f325088250df71bd021e2882664cb9'],
  'Regeste flach, nicht amtlich (Fallback ohne Sprachfassungen)': ['1831de26476a6a282477a1986c4cd1eb265386033fd4cb99a05e85579befdeae', 'd947d54e868d2978e5828feaaf44a400a42242b3d4dbca3d4b9b6e325f41c1d9'],
  'BGE-Auszug: Kolumnentitel hochgestellt, Unter-Erwägungen, Normverweise': ['913e41d16e777c874e79b5a90fe923e909ec90127f93dc6b1596f857e56ddafb', 'b8bc71a05c1a7167514e034a32d3cc01b9bc60f3bafd02119f797536c30055f7'],
  'BGE-Vollurteil: Kolumnentitel nach fremder Zitierung still entfernt': ['eefdb21f29e95434ed496846fb8b0ecb252be59fe43ea0e1eee14fb80c6f9cdb', '9e4ad647ba869a001293aa31e1a14e60c144f07e59cc71d89aa62ce67a978c82'],
  'BGE-Auszug französisch (consid.)': ['34cee0a25349c4a208c62449cbcd4649088ea97842a1804c5863fe27594fc2b8', '7cd0ddc4f0400d5722cbad2296e57dce97e899a044873cc461ff09fde2758a50'],
  'BGer-Urteil ohne Regeste: Unter-Erwägungen, Dispositiv nummeriert': ['9c53a2f628149b1acac69615a865e411f84097f186497fb056b71f522df16c72', '610b08827f7a5416b53bb85e912b66a279d6aa2f3aa2c27b3e8f185f51b022f1'],
  'Kantonal BS: Sachverhalt, Erwägungen, Dispositiv, Normbezüge': ['3654ef222e751ea5fb4cd67271162aaa1200fb7769b9fa95a0c22af1a579653a', 'c251d0166c5e159f77c934bbd1306dc2b3d4c345bc6049b19125b0d717d40ddc'],
  'BVGer: Sachverhalt als unvollständig markiert': ['e75d7ddcbf7fadc0e0460a986ff2cd243b41133fe037843ab4416ee710154681', '50df96e80eb0181fe6a72e1998946c7617a708abd3e91d0d1410a8f2bec35114'],
  'Markenlose Erwägungen als Fliesstext, ohne Dispositiv': ['38feb2a7a4d96f02868744ced9e197a7df6c6a842eb403222fcb043490ceeeef', 'cf18a97216940732b2d3e8a46689222f948dd97b039efcb239856d59d428bc17'],
  'Ohne Struktur: ein Block ohne Marke': ['c027619d490cec626847adde85a334a19d928a6d89dda811fa574b7e3e2fc83e', '34edec0358b0d6eb23458fd8a0fe8ffb6417dfb6b0cd3db886c1b4c3347b7cf9'],
  'Quarantäne: leerer Körper mit Konflikt-Grund': ['29ee7a51449766eb4083e12e7ff18251dcd619ad37682354abaf865367a49d47', 'd556155e179b187976ec5bd1494a3222fce566e72d8f8a369f110e280fe4240c'],
};

describe('Kern-Probe · Entscheid-Körper und Regeste byte-genau (REST-S0)', () => {
  it('die Stichprobe ist vollständig verankert', () => {
    expect(KERN_FIXTURE.map((f) => f.fall)).toEqual(Object.keys(KERN_ERWARTET));
    expect(Object.keys(KERN_ANKER)).toEqual(Object.keys(KERN_ERWARTET));
  });
  for (const f of KERN_FIXTURE) {
    it(`${f.fall} — ${f.meta.key}`, () => {
      const markup = kernMarkup(f);
      expect(markup).toContain(KERN_ANKER[f.fall]);
      expect([kernSha(markup), kernSha(ohneKlassen(markup))]).toEqual(KERN_ERWARTET[f.fall]);
    });
  }
});
