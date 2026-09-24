import type { Sperrereignis, SperrereignisTyp } from '../../types/legal';
import { NormText } from '../NormText';
import { DatumsFeld } from '../DatumsFeld';
import { Field, inputCls, ListenEditor } from '../vorlagen/ui';
import { usePaneKlasse } from '../layout/PaneKontext';
import { SPERREREIGNIS_TYPEN, MIT_NIEDERKUNFT, sperrereignisEntfernen, sperrereignisTypSetzen } from './sperrereignisseShared';

// ─── Geteilter Sperrereignis-Listen-Editor (Art. 336c OR) ───────────────────
//
// Extrahiert aus KuendigungSperrForm (verhaltensneutral, §6/§10, 6.6.2026):
// Markup, Typen-Katalog und die Index-Referenz-Pflege («Rückfall wie
// Ereignis …») leben jetzt genau EINMAL — genutzt vom Sperrfristen-Rechner
// und von der Vorlagen-Maske «Kündigung durch Arbeitgeber:in». Reine
// kontrollierte Darstellung, KEINE Rechtslogik (§3) — gerechnet wird in
// lib/sperrfristen.ts.

// Typen-Katalog + Entfernen-Helfer: sperrereignisseShared.ts (react-refresh-
// Regel: Komponenten-Dateien exportieren nur Komponenten — Logik-Check 6.6.2026).

export function SperrereignisseEditor({ wert, onChange, hinweis }: {
  wert: Sperrereignis[];
  onChange: (liste: Sperrereignis[]) => void;
  /** Optionaler Zusatz neben dem Titel (z. B. «nur bei Arbeitgeberkündigung relevant»). */
  hinweis?: string;
}) {
  const pk = usePaneKlasse();
  const update = (i: number, patch: Partial<Sperrereignis>) => {
    const list = [...wert];
    list[i] = { ...list[i], ...patch } as Sperrereignis;
    onChange(list);
  };

  return (
    <div className="space-y-3">
      <h4 className="text-body-s font-semibold text-ink-700">
        Sperrereignisse (Art. 336c OR)
        {hinweis && <span className="ml-2 text-xs font-normal text-ink-500">({hinweis})</span>}
      </h4>

      {/* R2-F/F1-9: der handgebaute Repeater (eigene Knopf-Optik `px-3 py-1.5
          bg-surface hover:bg-brass-100`, Hinzufügen ÜBER der Liste, «Entfernen»
          gross) ist durch den geteilten ListenEditor ersetzt. R2-F/F1-6: die
          fünf handgeschriebenen `<label>` sind `Field` gewichen — damit trägt
          «Niederkunft» das «optional» in der Prop statt im Text, und jedes
          Feld ist erstmals mit seinem Label verknüpft (die rohen Labels hatten
          weder htmlFor noch aria-labelledby). */}
      <ListenEditor
        element="Ereignis"
        eintraege={wert}
        leer="Keine Sperrereignisse erfasst."
        onHinzufuegen={() => onChange([...wert, { typ: 'krankheit_unfall', von: '2025-04-01', bis: '2025-05-31' }])}
        onEntfernen={(i) => onChange(sperrereignisEntfernen(wert, i))}
        kinder={(e, i) => (
        <>
          <div className={pk('grid grid-cols-1 sm:grid-cols-3 gap-3', 'grid grid-cols-1 @xl/pane:grid-cols-3 gap-3')}>
            <Field label="Typ">
              <select value={e.typ} onChange={(ev) => onChange(sperrereignisTypSetzen(wert, i, ev.target.value as SperrereignisTyp))} className={inputCls + ' text-xs'}>
                {SPERREREIGNIS_TYPEN.map((t) => <option key={t.code} value={t.code}>{t.label}</option>)}
              </select>
            </Field>
            {/* B5-Fix 10.6.2026 (SHK-Abgleich), aus KombinierteAnsicht übernommen:
                die 6-Monats-Kappung des Art. 329i OR läuft ab Beginn der
                RAHMENFRIST, nicht zwingend ab Urlaubsbeginn. */}
            <Field label={e.typ === 'betreuungsurlaub' ? 'Von (Beginn der Rahmenfrist)' : 'Von'}>
              <DatumsFeld value={e.von} onChange={(v) => update(i, { von: v })} className={inputCls + ' text-xs'} />
            </Field>
            <Field label="Bis">
              <DatumsFeld value={e.bis} onChange={(v) => update(i, { bis: v })} className={inputCls + ' text-xs'} />
            </Field>
          </div>
          {MIT_NIEDERKUNFT.includes(e.typ) && (
            <Field label="Niederkunft" optional>
              <DatumsFeld value={e.niederkunft ?? ''} onChange={(v) => update(i, { niederkunft: v })} className={inputCls + ' text-xs'} />
            </Field>
          )}
          {e.typ === 'schwangerschaft' && (
            <p className="text-xs text-brass-700">
              «Von»: Beginn der Schwangerschaft. Mit Niederkunftsdatum berechnet der Rechner das Sperrfristende
              selbst (Niederkunft + 112 Tage, Art. 336c Abs. 1 lit. c OR); ohne Datum gilt «Bis» gemäss Eingabe.
            </p>
          )}
          {e.typ === 'mutterschaftsurlaub_verlaengert' && (
            <p className="text-xs text-brass-700"><NormText text={`Hospitalisierung des Neugeborenen: Kündigungsschutz bis zum Ende des verlängerten Mutterschaftsurlaubs (Art. 336c Abs. 1 lit. cbis i.V.m. Art. 329f Abs. 2 OR). «Bis» = Ende des verlängerten Urlaubs.`} /></p>
          )}
          {e.typ === 'zusatzurlaub_tod_elternteil' && (
            <p className="text-xs text-brass-700">
              «Von»/«Bis»: Beginn des Urlaubs bis letzter bezogener Urlaubstag (Art. 336c Abs. 1 lit. cter i.V.m.
              Art. 329f Abs. 3 OR). Mit Niederkunftsdatum prüft der Rechner die gesetzliche Kappung
              (längstens 3 Monate ab Ende der lit.-c-Sperrfrist); ohne Datum wird sie nicht geprüft.
            </p>
          )}
          {e.typ === 'urlaub_tod_mutter' && (
            <p className="text-xs text-brass-700"><NormText text={`Urlaub des anderen Elternteils nach Tod der Mutter: 14 Wochen ab dem Tag nach dem Tod, an aufeinanderfolgenden Tagen (Art. 336c Abs. 1 lit. cquinquies i.V.m. Art. 329gbis OR).`} /></p>
          )}
          {e.typ === 'militaer_zivil' && (
            <p className="text-xs text-brass-700">Bei Dauer &gt; 11 Tage wird die Sperrfrist automatisch je 4 Wochen davor und danach erweitert (Art. 336c Abs. 1 lit. a OR).</p>
          )}
          {/* RL-13 PR 2 (UI-05/W-04): Bezug nur auf FRÜHERE Krankheit/Unfall-
              Ereignisse; ein Rückfall zehrt vom Rest des ursprünglichen
              Kontingents (gerechnet in lib/sperrfristen.ts). */}
          {e.typ === 'krankheit_unfall' && wert.slice(0, i).some((f) => f.typ === 'krankheit_unfall') && (
            <Field label="Rückfall derselben Ursache wie … (§1.3)">
              <select
                className={inputCls + ' text-xs'}
                value={e.gleicheUrsacheWieEreignis ?? ''}
                onChange={(ev) => update(i, { gleicheUrsacheWieEreignis: ev.target.value === '' ? null : Number(ev.target.value) })}
              >
                <option value="">Eigenständige Ursache (eigene Sperrfrist)</option>
                {wert.slice(0, i).map((f, j) => f.typ === 'krankheit_unfall' && (
                  <option key={j} value={j}>Rückfall wie Ereignis {j + 1} (Rest des Kontingents)</option>
                ))}
              </select>
            </Field>
          )}
        </>
        )}
      />
    </div>
  );
}
