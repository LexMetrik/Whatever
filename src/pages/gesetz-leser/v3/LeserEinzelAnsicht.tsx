import { useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArtikelNachbarn } from '../parts/ArtikelNachbarn';
import {
  einzelAdresse, gliederungsPfad, vorschauMarginalie, vorschauZiel, type VorschauZiel,
} from './einzelModus';
import type { ArtikelNachbarn as NachbarnAmArtikel } from './nachbarArtikel';
import type { LeserV3Modell } from './leserV3Modell';

// ═══ W2·5m · DIE EINZELARTIKEL-ANSICHT (Kap. 15.3/15.4) ═════════════════════
//
// D-E2 (David 14.9.2026, wörtlich): «können wir als ansichtsoption bauen wo man
// nur den einzelnen artikel sieht und so sich weiterklicken kann?». Diese Datei
// ist die ANORDNUNG dieser Option — Gliederungspfad oben, die Artikel-Karte in
// der Mitte, der Blätter-Fuss unten. Sie rendert den Artikel NICHT selbst: er
// kommt als fertiger Knoten aus `./LeserLesespalte.tsx` herein, wo die
// Artikel-Props an genau einer Stelle gebaut werden (§5).
//
// ── WAS HIER BEWUSST NICHT PASSIERT ────────────────────────────────────────
// Kein Datenzugriff, kein Shard, keine zweite Artikel-Anatomie. Der Körper der
// Bestimmung ist derselbe `parts/ArtikelLeser` wie in der Gesamtansicht, mit
// demselben `ArtikelBody` darin — die Grenze Hülle/Kern (Kap. 1.3) läuft
// zwischen dieser Datei und jenem Körper, und das PX-Tor misst sie.
//
// ── WAS IM EINZELMODUS OBERHALB DER KARTE NICHT STEHT ──────────────────────
// Der INGRESS des Erlasses («Die Bundesversammlung der Schweizerischen
// Eidgenossenschaft, gestützt auf …, beschliesst:») wird nicht gerendert
// (`./LeserRahmenV3.tsx`). GEMESSEN an der ersten Sichtprüfung 14.9.2026
// (OR 336c, fullPage): er stand samt Erlass-Vorspann VOR der Bestimmung — auf
// dem Handy @390 füllte er den ersten Bildschirm, bevor der Artikel begann.
//
// Das nimmt nichts weg und ist keine Abkürzung: der Ingress ist eine Auskunft
// über den ERLASS, und in der Gesamtansicht steht er unverändert da, wo er
// hingehört — an seinem Anfang. Im Einzelmodus ist der Gegenstand die eine
// Bestimmung (D-E3: «wenn man aber nur einen einzelnen artikel haben dann
// können wir mehr informationen anzeigen» — gemeint sind Informationen ZUM
// ARTIKEL). Der Erlass-KOPF bleibt dagegen stehen: Titel, Kennung, Stand und
// amtliche Quelle sind der §7-Ausweis der Fassung, die man gerade liest, und
// im Einzelmodus wichtiger als in der Scroll-Ansicht.
//
// Offengelegte Ergänzung zu Kap. 15.3, das die Zone nicht erwähnt hat.
//
// ── B1 · DIE PFEILE STEHEN ZWEIMAL, BEIDE MALE AN FESTEM ORT ───────────────
// Oben rechts in der Artikel-Kopfzeile (das Paar, das `parts/ArtikelLeser`
// ohnehin rendert, sobald `nachbarn` gesetzt ist) und unten in der Fusszeile
// dieser Ansicht. Beide Male DIESELBE Komponente `parts/ArtikelNachbarn`, nur
// mit anderer Anordnung — nicht bei Hover, nicht abhängig von der Artikellänge.
// Auf ≤ 390 px ist das untere Paar die Hauptbedienung (B9): es steht dort, wo
// der Daumen ist, und trägt volle Tap-Höhe.

export function LeserEinzelAnsicht({ m, karte, search, token, label, nachbarn, bestimmungsWort }: {
  m: LeserV3Modell;
  /** Die fertige Artikel-Karte (`parts/ArtikelLeser` mit `fussForm="dossier"`),
   *  gebaut in `./LeserLesespalte.tsx` — dort und nur dort stehen die Props. */
  karte: ReactNode;
  /** Der Query-Teil der aktuellen Adresse — er wird beim Blättern mitgeführt. */
  search: string;
  token: string;
  /** Anzeige-Label («Art. 336c») aus `labelMitBereich` — §5, dieselbe
   *  Ableitung, die auch die Pfeile und der Artikelkopf benutzen. */
  label: string;
  /** Vorgänger/Nachfolger in amtlicher Reihung (`./nachbarArtikel`). */
  nachbarn?: NachbarnAmArtikel;
  bestimmungsWort: string;
}) {
  const { basisPfad, sektionen } = m;
  // Der Pfad wird je Artikel EINMAL gerechnet und nicht bei jedem Render:
  // `pfadZu` läuft über den Sektionsbaum, und der ist im OR vierstellig tief
  // besetzt (§15 — dieselbe Sorge, aus der `baueNachbarn` memoisiert ist).
  const pfad = useMemo(() => gliederungsPfad(sektionen, token), [sektionen, token]);
  // F-E2 · WORUM ES BEIM NACHBARN GEHT. Erst der Randtitel am Eintrag; wo der
  // Korpus keinen führt (im OR kein einziger, s. `vorschauMarginalie`), die
  // spezifischste Gliederungsstufe des Nachbarn — aber nur, wenn sie von der
  // eigenen abweicht. Zwei Baumsuchen je ANGEZEIGTEM Artikel, also zwei pro
  // Bild und nicht 1686 (§15).
  const vorschau = useMemo<{ vor: VorschauZiel | null; nach: VorschauZiel | null }>(() => {
    const eigenStufe = pfad.at(-1)?.label ?? null;
    const marginalieVon = (t: string) => m.margAnzeige.get(t)?.teile?.at(-1)
      ?? vorschauMarginalie(sektionen, t, eigenStufe);
    return {
      vor: vorschauZiel(nachbarn?.vor, marginalieVon),
      nach: vorschauZiel(nachbarn?.nach, marginalieVon),
    };
  }, [m.margAnzeige, nachbarn, pfad, sektionen]);
  const adresse = (t: string) => einzelAdresse(basisPfad, search, t, 'artikel');
  // Der Rückweg verlässt den Einzelmodus: `?ansicht=` fällt weg, der Anker
  // bleibt — die Gesamtansicht löst ihn mit dem bestehenden Tieflink-Zweig auf
  // (Herleitung an `PfadStufe.ersterArtikel`).
  const rueckweg = (t: string) => einzelAdresse(basisPfad, search, t, 'erlass');

  return (
    <div className="lr7-einzel" data-einzel-artikel={token}>
      {/* ── GLIEDERUNGSPFAD (Kap. 15.3) · zugleich der Rückweg (B4) ────────
          Im Einzelmodus ist er TRIVIAL WAHR: genau eine Bestimmung ist
          sichtbar, es gibt keine Scroll-Stellung, die von ihm abweichen könnte
          — der §7-Wahrheitsfall der Scroll-Spy-Krume (Ä1) entfällt baulich.
          Eine Stufe ohne eigenen Artikel bleibt Text statt Griff (§8). */}
      {pfad.length > 0 && (
        <nav aria-label="Gliederungspfad" data-einzel-pfad
          className="lr7-einzel-pfad text-micro leading-normal text-ink-500">
          {pfad.map((stufe, i) => (
            <span key={stufe.id}>
              {i > 0 && <span aria-hidden className="lr7-einzel-pfad-trenner">›</span>}
              {stufe.ersterArtikel
                ? (
                  <Link to={rueckweg(stufe.ersterArtikel)} className="lr7-einzel-pfad-glied"
                    title={`«${stufe.label}» im ganzen Erlass lesen`}>{stufe.label}</Link>
                )
                : <span className="lr7-einzel-pfad-glied">{stufe.label}</span>}
            </span>
          ))}
        </nav>
      )}

      {/* Die Karte. `article` bringt `parts/ArtikelLeser` selbst mit — hier
          steht nur die Fläche, die ihn vom Beiwerk trennt. */}
      <div className="lr7-einzel-karte">{karte}</div>

      {/* ── B1/B9 · DAS FUSS-PFEILPAAR UND DER TASTATUR-HINWEIS ───────────
          B2: der Hinweis steht GENAU EINMAL im Dokument und nicht je Block —
          eine ruhige Zeile, kein Hilfe-Dialog. Er nennt die Pfeiltasten, weil
          die im Einzelmodus frei sind (das Panel ist nicht gemountet, D-E4);
          `j`/`k` bleiben unverändert belegt und brauchen keinen zweiten
          Hinweis (Kap. 15.6). */}
      <div className="lr7-einzel-blaettern">
        {nachbarn && (
          <ArtikelNachbarn nachbarn={nachbarn} adresse={adresse}
            klassen="inline-flex w-full items-baseline justify-between gap-4" />
        )}
        {/* B8/C1 · KEIN Zähl-Substantiv im Code (Fundament-Sonde): «vor und
            zurück» ist erlassneutral und an einem §-Erlass genauso richtig wie
            am OR. Wo die Bestimmungsart wirklich nötig ist (der Name der
            Vorschau-Navigation unten), kommt sie als Wert aus der EINEN
            Ableitung `./erlassAnsicht.bestimmungsWort` herein. */}
        <p className="lr7-einzel-tastatur text-micro text-ink-500" data-einzel-tastaturhinweis>
          <kbd>←</kbd> <kbd>→</kbd> blättert vor und zurück
        </p>
      </div>

      {/* ── F-E2 · NACHBARN-VORSCHAU ──────────────────────────────────────
          Entschieden David 14.9.2026 («ja, aber erst in E2»). Sie zeigt, WOHIN
          der Pfeil führt, bevor man ihn drückt — Nummer und Randtitel, beides
          aus dem geladenen Snapshot, KEIN zusätzlicher Abruf (Kap. 15.5).
          Am ersten und letzten Artikel entfällt die betroffene Seite: ein
          Vorschau-Kasten ohne Ziel wäre eine Einladung ins Leere. */}
      {(vorschau.vor?.marginalie || vorschau.nach?.marginalie) && (
        <nav aria-label={`Benachbarte ${bestimmungsWort}`} data-einzel-vorschau
          className="lr7-einzel-vorschau">
          <VorschauKarte ziel={vorschau.vor} richtung="vor" adresse={adresse} eigen={label} />
          <VorschauKarte ziel={vorschau.nach} richtung="nach" adresse={adresse} eigen={label} />
        </nav>
      )}
    </div>
  );
}

function VorschauKarte({ ziel, richtung, adresse, eigen }: {
  ziel: VorschauZiel | null;
  richtung: 'vor' | 'nach';
  adresse: (token: string) => string;
  /** Das Label des gelesenen Artikels — es steht im zugänglichen Namen, damit
   *  «Nächster» in einer Linkliste nicht fünfmal dasselbe heisst (WCAG 4.1.2). */
  eigen: string;
}) {
  // Kein toter Kasten am Rand des Erlasses (§8) — dieselbe Auflösung wie an den
  // Pfeilen selbst (`parts/ArtikelNachbarn`): ein leeres Element hält die
  // Spalte, ein ausgegrauter Griff wäre eine Einladung ins Leere.
  //
  // UND KEINE KARTE OHNE AUSKUNFT (M1): trägt der Nachbar weder Randtitel noch
  // eine eigene Gliederungsstufe, sagt die Vorschau nichts, was die Pfeile
  // darüber nicht schon sagen — dann steht sie nicht da. Kap. 15.5 führt Zeile 6
  // ausdrücklich als «kein eigener Mehrwert»; das ist die Bedingung, unter der
  // sie trotzdem einen hat.
  if (!ziel || !ziel.marginalie) return <span />;
  return (
    <Link to={adresse(ziel.token)} data-vorschau={richtung}
      className="lr7-einzel-vorschau-karte"
      aria-label={`${richtung === 'vor' ? 'Davor' : 'Danach'} — ${eigen} zu ${ziel.label}${ziel.marginalie ? `: ${ziel.marginalie}` : ''}${ziel.aufgehoben ? ' (aufgehoben)' : ''}`}>
      <span className="lr7-einzel-vorschau-num num text-body-s">
        {richtung === 'vor' && <span aria-hidden>‹ </span>}
        {ziel.label}
        {richtung === 'nach' && <span aria-hidden> ›</span>}
      </span>
      {/* Der Randtitel ist die eigentliche Auskunft der Vorschau: er sagt,
          WOVON die nächste Bestimmung handelt. Fehlt er, steht nichts da —
          kein Platzhalter, keine erfundene Kurzfassung des Wortlauts (§8). */}
      {ziel.marginalie && <span className="lr7-einzel-vorschau-marg text-micro leading-snug">{ziel.marginalie}</span>}
      {ziel.aufgehoben && <span className="lr7-einzel-vorschau-marg text-micro leading-snug">aufgehoben</span>}
    </Link>
  );
}
