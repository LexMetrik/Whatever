import type { SperrfristenErgebnis } from '../lib/sperrfristen';
import { NormText } from './NormText';
import { GruppenKopf } from './ui/GruppenKopf';
import { datumOderStrich } from './ui/datumText';

// Sperrtage-Zähler (Art. 336c Abs. 1 OR): je Ereignis beanspruchte Tage;
// bei Krankheit/Unfall zusätzlich Kontingent (30/90/180 je Dienstjahr) und
// verbleibende Tage mit Messing-Füllbalken. Rückfälle gleicher Ursache
// erhalten kein neues Kontingent, sondern zehren vom Rest des ursprünglichen
// (RL-13/W-04, Lesart nicht gerichtlich bestätigt — Offenlegung in den
// Hinweisen der Engine). Alle Zahlen kommen aus lib/sperrfristen.ts (§3).

const TYP_LABEL: Record<string, string> = {
  krankheit_unfall: 'Krankheit / Unfall',
  schwangerschaft: 'Schwangerschaft / Niederkunft',
  militaer_zivil: 'Militär- / Zivildienst',
  hilfsaktion: 'Hilfsaktion im Ausland',
  betreuungsurlaub: 'Betreuungsurlaub (Art. 329i OR)',
  mutterschaftsurlaub_verlaengert: 'Verlängerter Mutterschaftsurlaub (lit. cbis)',
  zusatzurlaub_tod_elternteil: 'Zusatzurlaub nach Tod des anderen Elternteils (lit. cter)',
  urlaub_tod_mutter: 'Urlaub nach Tod der Mutter (lit. cquinquies)',
};


export function SperrtageZaehler({ sperrtage }: { sperrtage: NonNullable<SperrfristenErgebnis['sperrtage']> }) {
  if (sperrtage.length === 0) return null;
  return (
    // data-ansicht: abgeleitete Ansicht (R4 Ziff. 3) — steht immer NACH dem
    // Verdikt, vom Tor `e2e/qsui-hierarchie.e2e.ts` (I1) geprüft.
    <section data-ansicht="sperrtage-zaehler" aria-label="Sperrtage-Zähler" className="lc-card p-5 space-y-3">
      {/* B3-2 (R3-β, 31.8.2026): der Kopf war die letzte handgezeichnete Kopie
          des Gruppenkopf-Rezepts — R2-A hatte hier bereits die fehlende
          `aria-hidden`-Auszeichnung der Haarlinie nachgezogen, also genau den
          Mangel geflickt, den der geteilte Baustein von sich aus nicht hat
          (§5/§10: Konsumenten ziehen, nicht Kopien angleichen). Die Norm-Marke
          steht rechts der Haarlinie — dieselbe Stelle, an der der breite Kopf
          seinen Zähler führt. Sichtbar ändert sich damit zweierlei, beides der
          Kanon: `gap-3` statt `gap-4` und die Overline in `brass-700` statt
          `ink-700` (C-2, alle 12 breiten Köpfe der App). */}
      <GruppenKopf
        titel="Sperrtage-Zähler"
        markeStellung="rechts"
        /* LM-101-Muster: Buchstabenzusatz (336c) darf die uppercase-Overline nicht durchlaufen. */
        marke={<span className="lc-overline normal-case"><NormText text={`Art. 336c OR`} /></span>}
      />

      <ul className="space-y-3">
        {sperrtage.map((z) => {
          const label = TYP_LABEL[z.typ] ?? z.typ;
          const anteil = z.kontingent ? Math.min(1, z.beansprucht / z.kontingent) : null;
          return (
            <li key={z.ereignis} className="space-y-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <p className="text-body-s text-ink-700">
                  <span className="num text-ink-500 mr-1.5">{z.ereignis}.</span>
                  {label}
                  {z.rueckfall && <span className="text-ink-500"> (Rückfall)</span>}
                  <span className="text-ink-500"> · {datumOderStrich(z.vonISO)} – {datumOderStrich(z.bisISO)}</span>
                </p>
                {z.kontingent != null ? (
                  <p className="num text-body-s text-ink-900">
                    {z.beansprucht} / {z.kontingent} Tage{z.rueckfall ? ' aus dem Rest' : ''}
                    <span className={`ml-2 ${z.verbleibend === 0 ? 'text-danger-700' : 'text-ink-500'}`}>
                      · {z.verbleibend === 0 ? 'Kontingent ausgeschöpft' : `${z.verbleibend} verbleibend`}
                    </span>
                  </p>
                ) : (
                  <p className="num text-body-s text-ink-900">{z.beansprucht} Sperrtage</p>
                )}
              </div>
              {anteil !== null && (
                <div className="h-1.5 rounded-full bg-paper-sunken overflow-hidden" role="img"
                  aria-label={`${z.beansprucht} von ${z.kontingent} Sperrtagen beansprucht`}>
                  <div className={`h-full rounded-full ${anteil >= 1 ? 'bg-danger-line' : 'bg-brass-500'}`}
                    style={{ width: `${Math.round(anteil * 100)}%` }} />
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <p className="text-xs text-ink-500">
        Kontingent Krankheit/Unfall je Dienstjahr: 30 (1. DJ) · 90 (2.–5. DJ) · 180 Tage (ab 6. DJ);
        Anfangstag zählt nicht (Art. 77 OR). Das Kontingent gilt je Verhinderungsursache —
        Überlappungen mehrerer Ereignisse werden für die Hemmung bereinigt.
        {sperrtage.some((z) => z.rueckfall) && (
          <> Rückfall: kein neues Kontingent, gezählt wird gegen den Rest des ursprünglichen —
          Lesart und Zählweise siehe Hinweise.</>
        )}
      </p>
    </section>
  );
}
