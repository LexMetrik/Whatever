import { useState } from 'react';
import { berechneVerzugszins, type VerzugszinsInput, type VerzugszinsErgebnis, type VerzugsbeginnTyp, type SatzGrund } from '../../lib/verzugszins';
import { permalinkKodieren } from '../../lib/permalink';
import { BetragsFeld } from '../BetragsFeld';
import { DatumsFeld } from '../DatumsFeld';
import { ErgebnisBlock } from '../ErgebnisBlock';
import { Field } from '../vorlagen/ui';
import { BEGINN, DEFAULTS, GRUENDE, METHODEN, VZ_LINK_SPEC, type VzLink } from './verzugszinsTexte';
import { datumOderStrich } from '../ui/datumText';
import { teileWahl } from './schnellFormTexte';
import { SchnellFormFuss } from './SchnellFormFuss';

// ─── Verzugszins als Schnellwerkzeug der Startseite (U2, 24.9.2026) ─────────
//
// David 24.9.2026: «ich möchte dass man bei den schnellwerkzeugen auswählen
// kann» → Frist · Verzugszins · Verjährung. Reine Kompositions-Schicht (§3)
// wie `EinfacheFristForm minimal`: rechnet mit DERSELBEN Engine
// (`berechneVerzugszins`, Art. 104 OR) und denselben Defaults, Wahl-Texten und
// Link-Kodierung wie der volle Rechner (`verzugszinsTexte.ts`, §5) — keine
// eigene, keine vereinfachte Rechtslogik (§1/§2).
//
// IN DER SCHNELLFORM (rechtlich entscheidend, Auftrag 24.9.2026): Betrag,
// Zinssatz und seine Grundlage (Art. 104 Abs. 1–3 — die Grundlage steuert die
// Warnung «vertraglich unter 5 %» und die Normverweise), Verzugsbeginn und
// dessen Art (Art. 102 Abs. 1/2 — der Verfalltag verschiebt den ersten Zinstag),
// Stichtag.
// WEGGELASSEN, mit sichtbarer Annahme (§8) und Weiterweg in den Rechner, der
// die Werte per Permalink übernimmt: Tageszählung (Default des Rechners,
// tatsächliche Tage / 365), Teilzahlungen und Satzänderungen (Art. 85 OR),
// rückständige Zins-/Rentenforderung (Art. 105 Abs. 1 OR). Die Engine bekommt
// genau das, was der volle Rechner mit denselben Eingaben und leeren Listen
// übergibt (`ereignisse: []`, `rueckstaendigeZinsforderung: false`).
//
// Ergebnis wie im Rechner: die Hauptkennzahl «Verzugszins (gesamt)» und «Total
// offen» aus dem Engine-Ergebnis (nichts nachgerechnet), bei Nicht-«ok» der
// Engine-Satz selbst; Normbezüge, Hinweis-Zahl und Weiterweg im geteilten
// `SchnellFormFuss`.

const METHODE_DEFAULT = METHODEN.find((m) => m.code === DEFAULTS.methode)!;

export function VerzugszinsSchnellForm() {
  const [form, setForm] = useState<VerzugszinsInput>(DEFAULTS);
  const set = <K extends keyof VerzugszinsInput>(k: K, v: VerzugszinsInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  let ergebnis: VerzugszinsErgebnis | null;
  try { ergebnis = berechneVerzugszins({ ...form, ereignisse: [], rueckstaendigeZinsforderung: false }); } catch { ergebnis = null; }

  const inputNum = 'lc-input num w-full';
  const rechnerZiel = '/rechner/verzugszins' + permalinkKodieren(VZ_LINK_SPEC, { ...form } as VzLink);

  return (
    // Füllt die Bühne des Schnellwerkzeugs (Mindesthöhe, `start/Schnellwerkzeug`);
    // der Fuss steht unten (`mt-auto`), der Leerraum einer kürzeren Form liegt
    // damit zwischen Ergebnis und Fuss statt unter dem Fuss.
    <div className="flex flex-1 flex-col gap-4">
      {/* Zwei Spalten erst ab 16.5 rem Flächenbreite (2 × 126 px Datumsfeld +
          Abstand) — dieselbe Schwelle wie `EinfacheFristForm minimal`. */}
      <div className="grid grid-cols-1 @[16.5rem]:grid-cols-2 gap-3 items-end">
        <Field label="Betrag (CHF)">
          <BetragsFeld value={form.kapital ? String(form.kapital) : ''} onChange={(v) => set('kapital', Number(v) || 0)} className={inputNum} />
        </Field>
        <Field label="Zinssatz (%)">
          <input type="number" inputMode="decimal" min={0} step={0.25} value={form.zinssatzProzent ?? 5}
            onChange={(e) => set('zinssatzProzent', Number(e.target.value))} className={inputNum} />
        </Field>
        <div className="@[16.5rem]:col-span-2">
          <Field label="Grundlage des Zinssatzes" hint={teileWahl(GRUENDE.find((g) => g.code === form.satzGrund)?.label ?? '').detail}>
            <select value={form.satzGrund} onChange={(e) => set('satzGrund', e.target.value as SatzGrund)} className="lc-input w-full">
              {GRUENDE.map((g) => <option key={g.code} value={g.code}>{teileWahl(g.label).name}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Verzugsbeginn">
          <DatumsFeld value={form.verzugsbeginn} onChange={(v) => set('verzugsbeginn', v)} className="lc-input w-full" />
        </Field>
        <Field label="Stichtag">
          <DatumsFeld value={form.stichtag} onChange={(v) => set('stichtag', v)} className="lc-input w-full" />
        </Field>
        <div className="@[16.5rem]:col-span-2">
          <Field label="Art des Verzugsbeginns" hint={teileWahl(BEGINN.find((b) => b.code === form.beginnTyp)?.label ?? '').detail}>
            <select value={form.beginnTyp} onChange={(e) => set('beginnTyp', e.target.value as VerzugsbeginnTyp)} className="lc-input w-full">
              {BEGINN.map((b) => <option key={b.code} value={b.code}>{teileWahl(b.label).name}</option>)}
            </select>
          </Field>
        </div>
      </div>

      {/* Ohne die Zeile «Live-Berechnung …» (`live={false}`; `aria-live` bleibt
          am Block): in der 20-rem-Spalte kostet sie ~50 px, die Form ist
          ohnehin sichtbar live. */}
      {ergebnis && (
        <ErgebnisBlock id="lc-ergebnis-schnell-verzugszins" sprung={false} live={false}>
          <div className="lc-notice space-y-1.5">
            {ergebnis.status === 'ok' ? (
              <>
                <p className="lc-overline">Verzugszins (gesamt)</p>
                <p className="text-h3 font-semibold text-ink-900 num">CHF {ergebnis.zinsTotalCHF}</p>
                <p className="text-body-s text-ink-600 num">Total offen CHF {ergebnis.totalOffenCHF} · {ergebnis.tageTotal} Tage ab {datumOderStrich(ergebnis.ersterZinstag)}</p>
              </>
            ) : (
              <p className="text-body-s text-ink-900">{ergebnis.ergebnis}</p>
            )}
          </div>
        </ErgebnisBlock>
      )}

      <SchnellFormFuss normverweise={ergebnis?.normverweise ?? []} hinweise={ergebnis?.warnungen.length ?? 0}
        annahmen={`Tageszählung «${teileWahl(METHODE_DEFAULT.label).name}», keine Teilzahlungen oder Satzänderungen (Art. 85 OR), keine Zins- oder Rentenforderung (Art. 105 OR)`}
        rechnerZiel={rechnerZiel} rechnerName="Verzugszinsrechner" />
    </div>
  );
}
