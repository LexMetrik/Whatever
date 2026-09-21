import { useMemo, type ReactNode } from 'react';
import { TrefferLandkarte } from '../../../components/leser/TrefferLandkarte';
import { landkarteSpur } from '../../../components/leser/landkarteModell';
import { gesetzLandkarteEinheiten } from './landkarteGesetz';
import { zaehlform, type BestimmungsWort } from './erlassAnsicht';
import type { LeserV3Modell } from './leserV3Modell';

// ═══ W2·28 · L-1 · DER AUFBAU DER TREFFER-LANDKARTE ═════════════════════════
//
// Die Landkarte ist Such-Chrome wie die Zone in `./suchZoneAufbau`, und der
// Rahmen soll auch für sie nur sagen, OB sie da ist.
//
// WO SIE HÄNGT: der Rahmen setzt sie in den `display: contents`-Träger neben
// dem Reiter-Toast (`./LeserRahmenV3`) — beide sind `fixed` und brauchen keinen
// Platz, stünden als Grid-Kinder aber im `space-y-5`-Fluss von `.lc-leser` und
// gäben dem Nachbarn ein `mt-5` (gemessene 20 px, Bug-Check 16.8.2026). Ein
// Träger ohne eigene Box nimmt den Margin entgegen und wirft ihn weg.
//
// ── WARUM EINE EIGENE DATEI ─────────────────────────────────────────────────
// Sie stand kurz neben `suchZoneAufbau`, was naheliegt (gleiche Naht, gleicher
// Aufrufer). Der Lint-Wächter `react-refresh/only-export-components` weist das
// zurück, und zu Recht: `suchZoneAufbau` ist eine Aufbau-FUNKTION (sie gibt
// einen Knoten als Wert zurück, den der Rahmen als Prop weiterreicht), diese
// hier eine echte KOMPONENTE mit Hooks. Zwei Sorten Export in einer Datei
// nehmen dem schnellen Neuladen die Grenze, an der es weiss, was es ersetzen
// darf. Getrennt statt Regel abgeschaltet.
//
// ── WARUM EINE KOMPONENTE UND KEIN AUFBAU-AUFRUF (21.9.2026) ────────────────
// Die Landkarten-Spur stand bis hierher im Adapter `./leserV3Modell` und kam
// als `m.landkarte` an. Zwei Gründe haben sie hierher geholt:
//  (1) §15 · SIE HING AM SUCHBEGRIFF. Das `useMemo` dort trug `sucheTrim` in
//      seiner Abhängigkeitsliste und rechnete darum bei JEDEM entprellten
//      Tastendruck neu über alle Artikel (OR: 1686) — obwohl die Spur den
//      Begriff gar nicht liest: sie ist die Karte des DOKUMENTS, begriffs-
//      abhängig sind erst die MARKEN darauf (`landkarteMarken`). Hier hängt
//      sie an `noetig` (einem boolean, der je Suche genau zweimal kippt) und
//      an den Daten. Lazy bleibt sie unverändert — nur eben einmal je Suche
//      statt einmal je Zeichen.
//  (2) §6.6 · DER ADAPTER HAT KEINE ZEILE FREI. `./leserV3Modell` steht bei
//      420/420 der Schlankheits-Sonde `src/tests/leser-v3-fundament.test.ts`,
//      die das selbst als offene Klemme vermerkt. Eine Ableitung, die nur ein
//      einziger Aufrufer braucht, gehört ohnehin zu ihm und nicht ins Modell
//      aller Leser-Flächen (§3).
// Eine echte Komponente (statt einer Funktion wie `suchZoneAufbau` darüber)
// ist nötig, weil `useMemo` ein Hook ist: er muss unbedingt laufen, die
// Sichtbarkeit entscheidet sich DANACH per `return null`.
//
// SICHTBARKEIT — fünf Bedingungen, alle benannt. Die tragende Regel dahinter
// (Befund 21.9.2026, an zwei Stellen verletzt): STREIFEN UND SCHALTER STEHEN
// UND FALLEN GEMEINSAM. Ein Streifen ohne seinen Abschalter ist ein Element,
// das der Leser nicht mehr loswird.
//  · nur mit laufender Suche (kein Dauer-Element, DESIGN-REGLEMENT Ruhe-Grundsatz),
//  · nur mit TREFFERN. `m.sucheAktiv` sagt bloss «es läuft eine Suche»; der
//    Schalter in der Zähler-Zeile erscheint aber erst ab `fundstellen > 0`
//    (`./SuchZone`). Ohne diese Bedingung stand bei einer erfolglosen Suche ein
//    leerer Streifen ohne Abschalter — und ohne Aussage (§8: null Marken sind
//    keine Landkarte). DIESELBE Zahl wie die Zähler-Zeile, aus derselben Quelle
//    (§5) — hier wird nichts nachgezählt.
//  · nicht, solange die TREFFERLISTE über der Lesespalte steht. Dann fällt die
//    Zähler-Zeile weg (D38: `sucheAktiv && !listeSteht` in `./SuchZone`) und
//    mit ihr der Schalter. Die Auskunft fehlt in dieser Lage nicht — die Liste
//    SELBST ist die Übersicht, samt Zahlen und ↑↓ in ihrer Werkzeugzeile.
//  · nicht, wenn der Leser Hervorhebung und Marken weggeschaltet hat (L-2: EIN
//    Schalter für beide Anzeigen),
//  · nur auf einer Fläche mit Randluft. Gemessen füllt das Lesemass die
//    Lese-Zelle auf jeder Breite vollständig aus (Rahmen auf 1072 px gedeckelt,
//    Gliederungsspur 19.25 rem) — freien Platz gibt es erst NEBEN dem Rahmen,
//    im Fensterrand. In einer geteilten Pane gibt es ihn gar nicht; dort steht
//    der Streifen nicht, und kein Element ist besser als eines über dem
//    Wortlaut (§8). Die Auskunft fehlt nirgends: Trefferliste, Zähler und ↑↓
//    stehen unverändert. Die Fenster-Schwelle selbst trägt das Bauteil
//    (`components/leser/TrefferLandkarte`, Herleitung dort).
export function LandkarteZone({ m, bestimmungsWort, randluft, listeSteht, onVorSprung }: {
  m: LeserV3Modell;
  /** Zähl-Substantiv des Erlasses — DASSELBE, das die Zähler-Zeile daneben
   *  zeigt (`./SuchZone`, `zaehlform(bestimmungen, bestimmungsWort)`). Es kommt
   *  wie dort vom Rahmen aus der einen Ableitung `./erlassAnsicht` (B8/§5);
   *  hier wird nichts abgeleitet, und der Streifen erfindet kein eigenes Wort. */
  bestimmungsWort: BestimmungsWort;
  /** Hat diese Fläche Randluft neben dem Lesemass? (Einzelansicht: ja.) */
  randluft: boolean;
  /** Liegt die Trefferliste GERADE über der Lesespalte? Derselbe Wert, den auch
   *  `suchZoneAufbau` als `listeSteht` bekommt — der Rahmen kennt ihn, das
   *  Modell nicht (er hängt an `useTrefferSicht`, nicht an den Daten). */
  listeSteht: boolean;
  /** Die Trefferliste weicht wie bei jedem anderen Sprung (D38). */
  onVorSprung: () => void;
}): ReactNode {
  // Die eine Bedingung, die über das RECHNEN entscheidet — nicht über das
  // Zeigen: sobald eine Suche läuft, wird die Karte gebraucht. Alles Weitere
  // (Treffer, Schalter, Liste, Randluft) entscheidet weiter unten nur noch,
  // ob sie auch dasteht; ihr Aufbau bliebe davon unberührt teuer.
  const noetig = m.sucheAktiv && m.eintraege !== null;
  const eintraege = m.eintraege;
  const struktur = m.struktur;
  const spur = useMemo(
    () => (noetig && eintraege ? landkarteSpur(gesetzLandkarteEinheiten(eintraege, struktur)) : []),
    [noetig, eintraege, struktur],
  );
  const marken = useMemo(
    () => m.treffer.map((t) => ({ id: t.token, anzahl: t.fundstellen })),
    [m.treffer],
  );
  if (!m.sucheAktiv || m.markenAus || !randluft) return null;
  if (listeSteht || m.fundstellen <= 0) return null;
  return (
    <TrefferLandkarte
      spur={spur}
      treffer={marken}
      leseId={m.aktivToken}
      register="g"
      obenVar="--nt-stick"
      gesamtFundstellen={m.fundstellen}
      wortEins={zaehlform(1, bestimmungsWort)}
      wortMehr={zaehlform(2, bestimmungsWort)}
      onSprung={(token) => {
        // Danach läuft die BESTEHENDE Sprungmechanik: zur ersten Fundstelle, wo
        // es eine gibt, sonst zum Artikel. Keine zweite Sprungart (§5).
        onVorSprung();
        if (m.treffer.some((t) => t.token === token)) m.springeZuTreffer?.(token);
        else m.springeZuArtikel(token);
      }} />
  );
}
