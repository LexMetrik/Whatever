import { Link } from 'react-router-dom';
import { artikelWerkzeugGruppen, werkzeugeFuerNorm } from '../../../lib/normtext/werkzeuge';
import type { MaterialBezug, Werkzeug } from '../../../lib/normtext/werkzeuge';
import { datumAnzeige } from '../../../components/rechtsprechung/format';
import { GruppenKopf } from '../../../components/ui/GruppenKopf';
import type { Geladen } from './panelKontextLaden';

// ─── Reiter «Anwendung» (W2·7-VZUI, 31.8.2026) ───────────────────────────────
//
// DER ORT, DEN ZWEI BESTÄNDE SEIT H3 NICHT MEHR HATTEN. Die V3-Hülle löste das
// `KontextPanel` mit drei benannten Reitern ab — und liess dabei zwei seiner
// Sektionen zurück: die Behörden-Ressourcen (`kontextSoftLaw`) und die
// «Passenden Werkzeuge». Der Dateikopf von `PanelMaterialien.tsx` hat das
// ausdrücklich als offenen Punkt notiert statt es stillschweigend wegzulassen:
// «Beides ist kein MATERIAL zur Entstehung des Erlasses, sondern eine dritte und
// vierte Sache — sie in diesen Reiter zu kippen wäre die Rückkehr zu den sechs
// bedingten Sektionen, die Kap. 4d gerade auflöst.» Genau diese Zeile schliesst
// der Reiter hier: die dritte und vierte Sache bekommen einen eigenen Ort, statt
// in «Materialien» gekippt oder weiter verschwiegen zu werden.
//
// ── WARUM «ANWENDUNG» DER SCHNITT IST, NICHT «SONSTIGES» ────────────────────
// Die drei bestehenden Reiter beantworten je eine Frage am Artikel: wie wird er
// AUSGELEGT (Entscheide) · wie ist er GEWORDEN (Änderungen) · woher KOMMT er
// (Materialien). Der vierte beantwortet die vierte: wie WENDET man ihn an. Beide
// Abschnitte darunter gehören zu genau dieser Frage und zu keiner der drei
// anderen:
//   Behörden-Praxis — wie die Verwaltung die Norm handhabt (Kreisschreiben,
//                     Wegleitungen, Leitfäden). Kein Gesetzesrang, und der
//                     Hinweis sagt das (§8).
//   Werkzeuge       — die Rechner und Vorlagen dieses Hauses zu den Artikeln
//                     des Erlasses.
// Ein Reiter «Sonstiges» wäre der Sammelbegriff, den man wählt, wenn man den
// Schnitt nicht gefunden hat; er hätte die sechs bedingten Sektionen unter einem
// neuen Namen wiederhergestellt.
//
// ── DER VIERTE REITER PASST — DIE LEISTE SCROLLT (H4-II, nachgemessen) ──────
// Die 17.8.2026 gemessene Rechnung «Budget für einen vierten: 41 px» (Kommentar
// in `LeserPanelZone.tsx`) ist mit H4-II überholt: `LeserPanel.tsx` hat die
// Reiter-Leiste danach auf `overflow-x-auto` mit `shrink-0` an den Reitern
// gestellt, ausdrücklich damit ein viertes Fach nicht mehr am Rand
// abgeschnitten wird («Eine Leiste, die ihr viertes Fach verschluckt, ist die
// Falle; eine, die waagrecht scrollt, ist die kleinste ehrliche Antwort»).
//
// GEMESSEN 31.8.2026 am gebauten Stand (ARG, Panel offen), nicht geschätzt:
//   @1440 / @1024  clientWidth 350 · scrollWidth 385  ⇒  35 px Scrollweg
//   @390           clientWidth 388 · scrollWidth 388  ⇒  passt vollständig
//   Reiter: Entscheide 89 · Änderungen 94 · Materialien 87 · Anwendung 92
// Auf D scrollt die Leiste also um 35 px — genau der Fall, für den H4-II sie
// scrollbar gemacht hat; auf dem Handy-Blatt passt sie ganz. Ein kürzeres Wort
// PASSTE (Budget rechnerisch 57 px, «Praxis» misst ~57) und ist bewusst NICHT
// gewählt: «Praxis» meint im schweizerischen Sprachgebrauch zuerst die
// RECHTSPRECHUNGS-Praxis und führte neben dem Reiter «Entscheide» in die Irre.
// 35 px Scrollweg sind billiger als ein mehrdeutiges Etikett (§8).
//
// ── ERLASS-WEIT, NICHT ARTIKELSCHARF (Befund 34) ────────────────────────────
// Wie «Änderungen» und «Materialien» gilt dieser Reiter dem GANZEN Erlass — der
// Panel-Kopf zeigt darum sein Kürzel, nicht die Leseposition. Das ist keine
// Bequemlichkeit: eine artikelscharfe Werkzeug-Liste wüchse und schrumpfte beim
// Scrollen, also ohne Zutun des Nutzers. Die Artikel-Angabe steckt stattdessen
// IN den Zeilen («Art. 127–142»), wo sie stillsteht.
//
// ── DREI ZUSTÄNDE, UND EINER DAVON IST NICHT DERSELBE WIE DORT ─────────────
// «Änderungen»/«Materialien» unterscheiden `null` (Quelle unerreichbar) von der
// leeren Liste. `kontextSoftLaw` KANN das nicht: es löst den Fetch-Fehler zur
// leeren Liste auf (`ladeMaterialManifest` → `null` ⇒ `return []`). Ein
// «Zu diesem Erlass ist keine Behördenpublikation erfasst» wäre hier also eine
// Bestandsbehauptung aus Unwissen — der Abschnitt entfällt darum schlicht,
// statt eine Zahl zu behaupten, die wir nicht haben (§8, dieselbe Schranke wie
// am Panel-Öffner).

/** Chip-Zeile eines Werkzeugs — Optik wörtlich wie im `KontextPanel` (§5: eine
 *  Werkzeug-Gestalt im Haus, nicht zwei). `lc-chip` trägt Rahmen und Polster. */
function WerkzeugChip({ w }: { w: Werkzeug }) {
  return (
    <Link to={w.href} data-v3-anwendung-werkzeug={w.id}
      className="lc-chip no-underline hover:border-ink-900 hover:text-ink-900">
      <span className="mr-1 text-ink-500" aria-hidden>{w.modus === 'rechner' ? '⊞' : '▤'}</span>{w.titel}
    </Link>
  );
}

// ── K-2b/F37 (W2·13-KANTONE, 31.8.2026) · WARUM DER KANTON HIER LEER IST ─────
// Dieselbe Quelle wie bei den Materialien, dieselbe Messung: die neun
// hinterlegten Behörden sind ausnahmslos eidgenössisch, kein kantonaler
// Erlass-Key trägt eine Kante. Der Zusatz nennt darum NUR die
// Behörden-Ressourcen — über die Werkzeuge sagt er nichts, denn die kommen aus
// der Karten-Tabelle und sind an keine Ebene gebunden (dieser Zweig läuft
// ohnehin nur, wenn es auch keine gibt).
const KANTON_ABDECKUNG = 'Behörden-Ressourcen sind bisher nur zu Bundeserlassen erfasst.';

export function PanelAnwendung({ softLaw, erlassKey, ebene }: {
  softLaw: Geladen<MaterialBezug[]>;
  erlassKey: string;
  /** Ebene des Erlasses — durchgereicht aus dem Modell (§5, s. `PanelEntscheide`).
   *  Steuert allein den Leerzustands-Zusatz; `undefined` = keine Aussage. */
  ebene?: 'bund' | 'kanton';
}) {
  // Beide Werkzeug-Quellen sind SYNCHRON (statische Karten-Tabelle, kein Fetch) —
  // sie haben darum keinen Ladezustand und dürfen bereits stehen, während die
  // Behörden-Ressourcen noch unterwegs sind.
  const gruppen = artikelWerkzeugGruppen(erlassKey);
  // Fallback wie im `KontextPanel`: die grobe Erlass-Zuordnung NUR, wo es keine
  // artikelscharfe gibt. Beide nebeneinander wären zwei Antworten auf dieselbe
  // Frage am selben Erlass (§5) — und die gröbere ist genau das Rauschen, das
  // der Rausch-Filter #28 entfernt hat.
  const grob = gruppen.length === 0 ? werkzeugeFuerNorm(erlassKey) : [];
  const ressourcen = softLaw.wert ?? [];
  const hatWerkzeuge = gruppen.length > 0 || grob.length > 0;

  if (!softLaw.fertig && !hatWerkzeuge) {
    return <p data-v3-panel-reiter-inhalt="anwendung" className="px-3 py-3 text-body-s text-ink-600">Behörden-Ressourcen werden geladen …</p>;
  }
  if (softLaw.fertig && ressourcen.length === 0 && !hatWerkzeuge) {
    return (
      <p data-v3-panel-reiter-inhalt="anwendung" className="px-3 py-3 text-body-s text-ink-600">
        Zu diesem Erlass sind weder Behörden-Ressourcen noch Werkzeuge erfasst.
        {ebene === 'kanton' && (
          <span data-v3-panel-abdeckung="kanton" className="block text-ink-600">{KANTON_ABDECKUNG}</span>
        )}
      </p>
    );
  }

  return (
    <div data-v3-panel-reiter-inhalt="anwendung" className="px-3 py-1">
      {ressourcen.length > 0 && (
        <section data-v3-anwendung="behoerden" className="pt-1">
          {/* B3-1 (R3-β): dichte Gestalt des EINEN Gruppenkopfs (`ui/GruppenKopf`). */}
          <GruppenKopf als="p" dicht titel="Behörden-Praxis" zahl={ressourcen.length} />
          {/* §8: der Rang wird genannt, nicht vorausgesetzt. Eine Wegleitung neben
              Gerichtsentscheiden ohne diesen Satz läse sich wie eine Quelle
              gleichen Rangs — R16 verbietet Wertungsfarben, dieser Satz ersetzt
              sie durch die Auskunft selbst. «erfasste» statt einer
              Vollzähligkeits-Behauptung (Leitplanke §8 des Fahrplans). */}
          <p className="pb-1 pt-0.5 text-micro leading-snug text-ink-500">
            Erfasste Behördenpublikationen (Kreisschreiben, Wegleitungen, Leitfäden) — kein Gesetzesrang.
          </p>
          <ul className="mt-0.5">
            {ressourcen.map((m) => (
              <li key={m.key} className="border-l-2 border-t border-line border-l-reg-w py-2 pl-2.5">
                <Link to={m.pfad} className="no-underline hover:text-ink-900">
                  <span className="flex items-baseline gap-2">
                    <span className="shrink-0 text-body-s font-medium text-ink-800">
                      {m.behoerdeKuerzel} · {m.doktypLabel}{m.nummer ? ` ${m.nummer}` : ''}
                    </span>
                    <span className="num shrink-0 text-micro text-ink-500">{datumAnzeige(m.stand)}</span>
                  </span>
                  <span className="mt-0.5 block text-micro leading-snug text-ink-600">
                    {m.titel}
                    {/* Fundstellen-Sublabel («via Art. 24») nur, wo das Sidecar es
                        trägt — auf Erlass-Ebene steht dort nichts statt eines
                        erfundenen Artikel-Bezugs (§8). */}
                    {m.sublabel && <span className="num text-ink-500"> · {m.sublabel}</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {gruppen.length > 0 && (
        <section data-v3-anwendung="werkzeuge" className="pt-2">
          <GruppenKopf als="p" dicht titel="Werkzeuge" zahl={gruppen.length} />
          <ul className="mt-0.5">
            {gruppen.map((g) => (
              <li key={`${g.von}-${g.bis}`} className="flex flex-wrap items-baseline gap-x-2 gap-y-1.5 border-t border-line py-2">
                {/* Der fachliche Beleg der Kante steht im `title` — dieselbe
                    Stelle wie im `KontextPanel`, damit die Zuordnung nachprüfbar
                    bleibt, ohne die Zeile zu verlängern (§7). */}
                <span className="num lc-overline shrink-0 text-ink-600" title={g.beleg}>{g.label}</span>
                {g.werkzeuge.map((w) => <WerkzeugChip key={w.id} w={w} />)}
              </li>
            ))}
          </ul>
        </section>
      )}

      {grob.length > 0 && (
        <section data-v3-anwendung="werkzeuge-grob" className="pt-2">
          <GruppenKopf als="p" dicht titel="Werkzeuge" zahl={grob.length} />
          {/* §8: die Zuordnung ist hier ERLASS-weit und nicht artikelscharf — das
              steht da, statt eine Genauigkeit zu suggerieren, die die Tabelle für
              diesen Erlass nicht führt. */}
          <p className="pb-1 pt-0.5 text-micro leading-snug text-ink-500">
            Dem Erlass als Ganzem zugeordnet, nicht einzelnen Artikeln.
          </p>
          <ul className="mt-0.5 flex flex-wrap gap-2">
            {grob.map((w) => <li key={w.id}><WerkzeugChip w={w} /></li>)}
          </ul>
        </section>
      )}
    </div>
  );
}
