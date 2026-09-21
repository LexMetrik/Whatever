/**
 * W2·28-TREFFER-LANDKARTE · L-1 — DER ZUGÄNGLICHE NAME SAGT DAS ABGEBILDETE.
 *
 * ── DER BEFUND (Bug-Check 21.9.2026, §8) ────────────────────────────────────
 * Der Streifen ist `role="img"`; sein `aria-label` IST seine ganze Auskunft für
 * alle, die das Bild nicht sehen. Er nannte darin `gesamtFundstellen` — im
 * Entscheid-Leser die Zahl über ALLE Abschnitte (`zaehleTreffer`), während die
 * Marken ausschliesslich aus den Erwägungen kommen (`trefferInErwaegungen`).
 * Vorkommen in Regeste, Sachverhalt und Dispositiv tragen keinen zitierfähigen
 * Anker und darum keine Marke: der Streifen SAGTE also regelmässig eine Zahl
 * an, die grösser ist als das, was er ZEIGT (gemessen am längsten Entscheid des
 * Korpus, Appellationsgericht BS SB.2018.46, Begriff «Beschwerde»: 26 angesagt,
 * 19 abgebildet). Die Zeile daneben legt die Differenz offen («3 von 16 Treffer
 * … · übrige ausserhalb»), der Streifen verschwieg sie.
 *
 * Der zweite Befund derselben Runde steht im selben Namen: er sagte
 * «Abschnitten», wo die Zähler-Zeile daneben dieselbe Zahl «Artikel» bzw.
 * «Erwägungen» nennt — zwei Wörter für eine Grösse auf einem Bildschirm (§5).
 *
 * ── WARUM HIER UND NICHT IN e2e ─────────────────────────────────────────────
 * Der Name ist eine reine Funktion seiner Eingaben; ein Browser fügte der
 * Zusage nichts hinzu (§2/§3). Die VERDRAHTUNG im Gesetz-Leser prüft weiterhin
 * `e2e/leser-w228-landkarte.e2e.ts` (b).
 *
 * ── ROT ZU BEKOMMEN (§6.7), je Fall ein Handgriff ───────────────────────────
 *  (1) In `components/leser/TrefferLandkarte.tsx` `teilmenge` auf `false` und
 *      `bezug` auf `gesamtFundstellen` setzen (= der alte Zustand) ⇒ der Name
 *      lautet «2 Erwägungen · 5 Fundstellen»; ZWEI Fälle fallen (die Zahl und
 *      die Offenlegung). Das ist der Befund selbst.
 *  (2) Dort nur die Klausel `teilmenge ? ' · übrige ausserhalb' : ''` streichen
 *      ⇒ der Offenlegungs-Fall fällt allein.
 *  (3) `wortEins`/`wortMehr` im Namen wieder durch «Abschnitt(en)» ersetzen ⇒
 *      alle DREI A2-Fälle fallen, auch der Gleichlauf-Fall.
 *  (4) In `lib/rechtsprechung/abschnitte.ts` `erwaegungsWort` die Mehrzahl von
 *      `ABSCHNITT_TITEL.erwaegung` abhängen und hart hinschreiben ⇒ der
 *      Wort-Fall fällt; der Gleichlauf-Fall bleibt grün, weil er den GLEICHLAUF
 *      prüft und nicht die Schreibweise — dafür ist Fall 1 der A2-Gruppe da.
 * Alle vier am Bau gesehen (Rot-Beweis im Bericht 21.9.2026).
 */
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { TrefferLandkarte } from '../components/leser/TrefferLandkarte';
import { landkarteSpur } from '../components/leser/landkarteModell';
import { entscheidLandkarteEinheiten } from '../pages/entscheidLandkarte';
import { erwaegungsWort } from '../lib/rechtsprechung/abschnitte';
import { trefferInErwaegungen, zaehleTreffer } from '../pages/entscheidLeserRegeln';
import { ErwaegungsRail } from '../components/rechtsprechung/ErwaegungsRail';
import { MemoryRouter } from 'react-router-dom';
import type { EntscheidAbschnitt } from '../lib/rechtsprechung/typen';

/** Der zugängliche Name des Streifens aus dem gerenderten Markup. */
function nameVon(el: React.ReactElement): string {
  const s = renderToString(<MemoryRouter>{el}</MemoryRouter>);
  const m = /aria-label="([^"]*)"/.exec(s);
  if (!m) throw new Error('kein aria-label im Streifen-Markup');
  // SSR maskiert die Anführungs- und Sonderzeichen des Namens.
  return m[1].replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, '&');
}

// ── DIE DATENLAGE, DIE DEN BEFUND TRÄGT ─────────────────────────────────────
// «Kenntnis» steht dreimal in den Erwägungen UND zweimal ausserhalb (einmal im
// Sachverhalt, einmal im Dispositiv). Damit gilt hier, was am echten Entscheid
// gilt: `zaehleTreffer` = 5, die Summe der Marken = 3.
const ENTSCHEID: EntscheidAbschnitt[] = [
  { typ: 'sachverhalt', bloecke: [{ marke: null, text: 'A. Kenntnis des Schadens war streitig.' }] },
  {
    typ: 'erwaegung',
    bloecke: [
      { marke: 'E. 1', text: 'Eintreten ist unbestritten.' },
      { marke: 'E. 2', text: 'Kenntnis heisst tatsächliche Kenntnis.' },
      { marke: 'E. 2.1', text: 'Die Kenntnis trat später ein.' },
    ],
  },
  { typ: 'dispositiv', bloecke: [{ marke: null, text: 'Die Kenntnis bleibt ohne Folgen.' }] },
];

const BEGRIFF = 'Kenntnis';

function entscheidStreifen() {
  const spur = landkarteSpur(entscheidLandkarteEinheiten(ENTSCHEID));
  const treffer = trefferInErwaegungen(ENTSCHEID, BEGRIFF);
  return (
    <TrefferLandkarte
      spur={spur}
      treffer={treffer.map((t) => ({ id: t.anker, anzahl: t.anzahl }))}
      leseId={null}
      register="r"
      obenVar="--rsp-stick"
      gesamtFundstellen={zaehleTreffer(ENTSCHEID, BEGRIFF)}
      wortEins={erwaegungsWort(1)}
      wortMehr={erwaegungsWort(2)}
      onSprung={() => {}}
    />
  );
}

describe('A1 · der Name nennt das Abgebildete, nicht mehr (§8)', () => {
  it('VORBEDINGUNG: die Bezugsgrösse liegt wirklich über der Summe der Marken', () => {
    // Ohne diese Ungleichheit wäre der ganze Block trivial grün (§6.7).
    const gesamt = zaehleTreffer(ENTSCHEID, BEGRIFF);
    const summe = trefferInErwaegungen(ENTSCHEID, BEGRIFF).reduce((n, t) => n + t.anzahl, 0);
    expect(gesamt, 'Gesamtzahl über alle Abschnitte').toBe(5);
    expect(summe, 'Fundstellen, die eine Marke bekommen').toBe(3);
    expect(summe).toBeLessThan(gesamt);
  });

  it('DER DEFEKT: der Streifen behauptet nicht die grössere Zahl', () => {
    const name = nameVon(entscheidStreifen());
    // Das Abgebildete steht vorn — und zwar VOR der Bezugsgrösse.
    expect(name, `Name: «${name}»`).toContain('3 von 5 Fundstellen');
    // Die frühere Fassung lautete «5 Fundstellen in 3 Abschnitten des
    // Dokuments» — die Bezugsgrösse ALLEIN, als wäre sie das Abgebildete.
    // Genau diese Behauptung darf nicht wiederkommen: «5 Fundstellen» ohne das
    // vorangestellte «3 von» ist der Defekt.
    expect(name).not.toContain('· 5 Fundstellen');
    expect(name).not.toContain('in 3 Abschnitten');
  });

  it('die Differenz wird BENANNT, in den Worten des Rails daneben', () => {
    expect(nameVon(entscheidStreifen())).toContain('übrige ausserhalb');
  });

  it('fallen beide Zahlen zusammen, entsteht KEINE zweite Zahl (Gesetz-Leser)', () => {
    // Der Gesetz-Leser markiert jede getroffene Bestimmung; Summe = Gesamtzahl.
    const spur = landkarteSpur([
      { id: 'art-1', label: 'Art. 1', umfang: 100, abschnitt: 'Erster Titel' },
      { id: 'art-2', label: 'Art. 2', umfang: 100, abschnitt: 'Erster Titel' },
    ]);
    const name = nameVon(
      <TrefferLandkarte
        spur={spur}
        treffer={[{ id: 'art-1', anzahl: 4 }, { id: 'art-2', anzahl: 2 }]}
        leseId={null} register="g" obenVar="--nt-stick"
        gesamtFundstellen={6} wortEins="Artikel" wortMehr="Artikel"
        onSprung={() => {}} />,
    );
    expect(name, `Name: «${name}»`).toContain('6 Fundstellen');
    expect(name).not.toContain('von');
    expect(name).not.toContain('übrige ausserhalb');
  });
});

describe('A2 · ein Wort für eine Zahl (§5)', () => {
  it('der Entscheid-Streifen sagt «Erwägungen», nicht «Abschnitten»', () => {
    const name = nameVon(entscheidStreifen());
    expect(name, `Name: «${name}»`).toContain('2 Erwägungen');
    expect(name).not.toContain('Abschnitt');
  });

  it('der Gesetz-Streifen nimmt das Zähl-Substantiv des Erlasses', () => {
    const spur = landkarteSpur([{ id: 'p-1', label: '§ 1', umfang: 100, abschnitt: null }]);
    const name = nameVon(
      <TrefferLandkarte spur={spur} treffer={[{ id: 'p-1', anzahl: 1 }]} leseId={null}
        register="g" obenVar="--nt-stick" gesamtFundstellen={1}
        wortEins="Paragraph" wortMehr="Paragraphen" onSprung={() => {}} />,
    );
    expect(name, `Name: «${name}»`).toContain('1 Paragraph ·');
    expect(name).not.toContain('Abschnitt');
  });

  it('Rail und Streifen ziehen ihr Wort aus DERSELBEN Quelle', () => {
    // Gemessen wird der Gleichlauf, nicht ein im Test notiertes Wort — eine
    // zweite Schreibweise hier wäre genau die dritte Wahrheit, die A2 auflöst.
    const treffer = trefferInErwaegungen(ENTSCHEID, BEGRIFF);
    const rail = renderToString(
      <MemoryRouter>
        <ErwaegungsRail gliederung={[]} treffer={treffer} trefferGesamt={5}
          normen={[{ zitat: 'Art. 60 OR', anker: 'e-2' }]}
          suche={BEGRIFF} onSuche={() => {}} springe={() => {}} />
      </MemoryRouter>,
    );
    const wort = erwaegungsWort(treffer.length);
    expect(treffer.length, 'Vorbedingung: Mehrzahl-Fall').toBeGreaterThan(1);
    expect(rail, 'der Rail nennt das Wort nicht').toContain(wort);
    expect(nameVon(entscheidStreifen()), 'der Streifen nennt ein anderes Wort').toContain(wort);
  });
});
