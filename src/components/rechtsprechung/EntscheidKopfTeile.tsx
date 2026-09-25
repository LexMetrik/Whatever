import { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { besetzungsTeile } from '../../lib/rechtsprechung/besetzung-verlinkung';
import { Datum } from '../ui/Datum';
import { QuellLink } from '../ui/QuellLink';
import { AMTLICHE_FASSUNG } from '../../lib/benennung';
import type { RichterRef } from '../../lib/rechtsprechung/register';
import type { EntscheidSnapshot } from '../../lib/rechtsprechung/typen';

// ═══ Die Kopf-Teile, die BEIDE Ansichten des Entscheid-Lesers führen ════════
//
// Herausgelöst aus `pages/EntscheidLeser.tsx` am 31.8.2026 (§6.6 · Datei-
// Schlankheit; Anlass: `check:schlankheit` wurde nach den B2/BAU-4-Nachzügen
// ROT — 1380 Z. gegen eine Baseline von 1095). Der Schnitt liegt dort, wo die
// Datei ihn selbst schon markiert hatte: diese drei Stücke stehen wörtlich
// zweimal im Bild — einmal im Seiten-Kopf, einmal im Lesemodus-Overlay
// (`LesemodusOverlay.tsx`). Sie sind also nicht «zufällig gross», sondern die
// gemeinsame Sprache der beiden Ansichten (§5).
//
// VERHALTENSNEUTRAL: verschoben, nicht verändert — die Herleitungen stehen
// unverändert bei ihrem Bauteil, damit kein Beleg beim Umzug verlorengeht
// (§2b).
//
// NUR KOMPONENTEN NACH AUSSEN (`react-refresh/only-export-components`):
// `istBandjahr`/`bgeJahrgang` bleiben modul-privat — sie beantworten genau die
// Frage, die `DatumMeta` gleich darunter stellt, und geprüft wird ihre WIRKUNG
// am gerenderten Markup, nicht ihre Signatur (dieselbe Regel wie
// `kuerzeArtikel` in `layout/OrtsAngabe`). Werte, die beide Ansichten teilen,
// stehen in `leseGroesse.ts`.

// Manche BGE tragen nur das Bandjahr-Platzhalterdatum (YYYY-01-01) statt eines echten
// Urteilsdatums (ein echtes Urteil datiert nie auf den 1.1. — Feiertag). Diese ehrlich
// als «BGE-Jahrgang» zeigen statt eines fingierten «1.1.» (§8). Sentinel = das
// Platzhalterdatum selbst, NICHT azaUrteil (Bug-Check 26.6.: Auszug-BGE können ein
// echtes Datum tragen trotz fehlendem azaUrteil — die zeigen korrekt «Entscheid vom …»).
function istBandjahr(snap: EntscheidSnapshot): boolean {
  return snap.gericht === 'bge' && /-01-01$/.test(snap.datum);
}
// Angezeigter Jahrgang folgt der BGE-Band-Nummer (Band N → Jahr 1874+N), deterministisch
// (§2) — robuster als das Platzhalter-Jahr, das bei OCL gelegentlich um 1 abweicht.
function bgeJahrgang(snap: EntscheidSnapshot): string {
  const band = parseInt(snap.bgeReferenz ?? '', 10);
  return band ? String(band + 1874) : snap.datum.slice(0, 4);
}

// ── Besetzungs-Zeile: amtlicher Wortlaut, Richter:innen klickbar ────────────
//
// Der Wortlaut bleibt UNVERÄNDERT — `besetzungsTeile()` zerschneidet ihn nur und
// hängt die Teile lückenlos wieder aneinander (§8, Test-Invariante). Verlinkt
// werden ausschliesslich richterliche Mitwirkende mit eindeutigem Kanon-Slug;
// Gerichtsschreiber:innen und nicht eindeutig zuordenbare Namen bleiben Text
// (die Facette `?richter=` führt GS nicht — ein Link liefe ins Leere).
//
// Optik (§13): derselbe dezente Inline-Link wie die Norm-Verweise im Lesetext
// (gepunktete Unterstreichung, Akzent erst im Hover) — als Link erkennbar, ohne
// den Rubrum-Block zu tigern. Fokus trägt der globale :focus-visible-Outline (F3).
const BESETZUNG_LINK = 'underline decoration-dotted underline-offset-2 hover:text-accent-text';

// §15.4: der React Compiler ist AUS — die Zerlegung (ein Parser-Lauf) darf nicht
// an jedem Render des Lesers hängen (Tab-Wechsel, Kopiert-Toast, Lese-Modus,
// Schriftgrösse). `useMemo` + `React.memo` mit Default-Komparator.
export const BesetzungWert = memo(function BesetzungWert({ freitext, gericht, refs }: {
  freitext: string;
  gericht: string;
  refs: RichterRef[] | undefined;
}) {
  const teile = useMemo(
    () => besetzungsTeile(freitext, gericht, refs),
    [freitext, gericht, refs],
  );
  // Genau ein Teil OHNE Slug = reiner Wortlaut (nichts verlinkbar). Ein einzelner
  // Teil MIT Slug ist dagegen ein gültiger Link (Freitext besteht nur aus dem
  // Namen) und darf nicht wegfallen — Befund Gegenprüfung 20.7.2026.
  if (teile.length === 1 && !teile[0].slug) return <>{freitext}</>;
  return (
    <>
      {teile.map((t, i) => (t.slug
        ? (
          <Link key={i} to={`/rechtsprechung?richter=${encodeURIComponent(t.slug)}`}
            className={BESETZUNG_LINK}
            // §8 genau: die Facette zeigt ALLE Entscheide dieser Person — auch den
            // gerade gelesenen. «Übrige» wäre eine kleine Unwahrheit.
            title={`Alle Entscheide mit ${t.text} anzeigen`}>
            {t.text}
          </Link>
        )
        : <span key={i}>{t.text}</span>
      ))}
    </>
  );
});

// ── B-1-NACHZUG (Design-Konsistenz, 31.8.2026) · EIN LINK, DREI PLÄTZE ──────
//
// Derselbe Link auf die massgebliche amtliche Fassung steht in diesem Leser an
// DREI Stellen (Kopf-Schlusszeile, Provenienz-Fuss, Lesemodus-Fuss) und war an
// allen dreien von Hand gebaut — mit demselben Wortlaut «↗ massgebliche
// Fassung» (Pfeil vorne, klein beginnend), aber je eigener Klassenzeile. Wort
// und Anatomie kommen jetzt aus `ui/QuellLink` (Kanon Ä110), und diese
// Fassade hält die drei Aufrufe zusammen: was die Optik unterscheidet, ist
// allein die Chip-Grammatik der Umgebung — und die reicht der Aufrufer als
// `className` herein (im `lc-chip-zeile`-Streifen sind <a> unterstrichen,
// ausserhalb nicht, LM-047).
export function MassgeblicheFassung({ url, titel, fehlt, className }: {
  url: string;
  titel: string;
  /** BGE-Volltext ohne aufgelöstes aza-Urteil: der Link führt ersatzweise auf
   *  die BGE-Sammlungsquelle. §8 — das steht SICHTBAR im Namen, nicht nur im
   *  `title` (Touch erreicht keinen Tooltip). */
  fehlt: boolean;
  className: string;
}) {
  return (
    <QuellLink href={url} className={className} title={titel}>
      {fehlt ? `${AMTLICHE_FASSUNG} (Urteil n. v.)` : undefined}
    </QuellLink>
  );
}

// Datums-Aussage der Meta-Zeile — EINE Regel für Kopf UND Lesemodus (§5):
// 1) datumUnbekannt (BS §7.2): die amtliche Quelle publiziert KEIN Entscheiddatum
//    → das Platzhalterdatum (<GN-Jahr>-01-01) nie als echtes Datum zeigen (§8);
//    stattdessen ehrlich «Entscheiddatum nicht publiziert» + Erstpublikation.
// 2) BGE-Bandjahr-Platzhalter → «BGE-Jahrgang». 3) sonst «Entscheid vom …».
export function DatumMeta({ snap }: { snap: EntscheidSnapshot }) {
  if (snap.datumUnbekannt) {
    return (
      <span title="Die amtliche Quelle publiziert kein Entscheiddatum">
        Entscheiddatum nicht publiziert
        {snap.erstpublikation && <> · Erstpublikation <Datum iso={snap.erstpublikation} /></>}
      </span>
    );
  }
  // Der Jahrgang ist eine Datums-, keine Aktenzeichen-Angabe und wechselt darum
  // mit — er stand als einziger Wert dieser Zeile sonst weiter in der
  // Mono-Stimme, während seine beiden Geschwister proportional laufen.
  // `Datum` reicht einen Nicht-ISO-Wert (hier die nackte Jahreszahl)
  // unverändert durch und setzt nur `tabular-nums` (Vertrag des Bausteins).
  if (istBandjahr(snap)) return <span>BGE-Jahrgang <Datum iso={bgeJahrgang(snap)} /></span>;
  return <span>Entscheid vom <Datum iso={snap.datum} /></span>;
}
