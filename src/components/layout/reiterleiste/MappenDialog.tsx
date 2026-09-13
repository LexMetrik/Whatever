import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { type TabEintrag } from '../../../lib/tabs';
import { ladeMappen, mappeMitNamen, NAME_MAX, type Mappe } from '../../../lib/mappen';
import { useDialogFokus } from '../useDialogFokus';
import { SchliessKnopf } from '../../ui/SchliessKnopf';

// ═══ W2·25 TEIL 2 · DIE FLÄCHE DER ARBEITSMAPPE (Spec §7, §5a Ziff. 9) ══════
//
// DREI ZUSTÄNDE, EIN RAHMEN — speichern, öffnen (die Rückfrage), verwalten.
// Sie teilen Portal, Scrim und Fokus-Verwaltung (`useDialogFokus`, dieselbe
// Quelle wie Überlauf-Blatt und Kontextmenü, §5); getrennt wäre dreimal
// dasselbe Gerüst.
//
// WARUM ES ÜBERHAUPT EINEN DIALOG BRAUCHT — zweimal, und beide Male, weil die
// Alternative schlechter wäre:
//  · SPEICHERN braucht einen NAMEN. Ein `window.prompt` täte es technisch,
//    ist aber in dieser App nirgends im Gebrauch, trägt keine Gestaltung und
//    lässt sich nicht mit «diese Namen gibt es schon» beschriften.
//  · ÖFFNEN ist eine grosse Schliess-Geste (die offenen Reiter weichen). §8
//    und A3-1 verlangen für Destruktives eine sichtbare Rückfrage, die SAGT,
//    was verschwindet und was bleibt — mit Zahlen, nicht mit «Sind Sie
//    sicher?». Genau das steht unten.
//
// LAZY (§15): die Leiste holt den Chunk erst, wenn jemand das Menü des
// Leerraums öffnet — der Start-Chunk bleibt unberührt. Logikverlust: keiner,
// dieselbe Fläche, nur später.

export type MappenAbsicht =
  | { art: 'speichern' }
  | { art: 'oeffnen'; name: string }
  | { art: 'verwalten' };

export function MappenDialog({
  absicht, offeneReiter, onSpeichern, onOeffnen, onLoeschen, onAdresse, onSchliessen,
}: {
  absicht: MappenAbsicht;
  /** Die Reiter, die gerade offen sind — Grundlage des Speicherns UND der
   *  Zahlen in der Rückfrage. */
  offeneReiter: TabEintrag[];
  onSpeichern: (name: string) => void;
  onOeffnen: (mappe: Mappe) => void;
  onLoeschen: (name: string) => void;
  /** «Adresse der Mappe kopieren» — die Mechanik steht in der Leiste
   *  (`useKopieren`), hier nur der Knopf. */
  onAdresse: (reiter: TabEintrag[]) => void;
  onSchliessen: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const mappen = ladeMappen();
  // Vorschlag statt Vorgabe: der Name der zuletzt gespeicherten Mappe wäre
  // geraten. Leer heisst «Sie benennen sie», und der Fokus steht im Feld.
  const [name, setName] = useState('');
  useDialogFokus(true, ref, onSchliessen, absicht.art === 'speichern' ? nameRef : undefined);

  const feste = offeneReiter.filter((t) => t.fest).length;
  const freie = offeneReiter.length - feste;
  const schonVergeben = mappeMitNamen(name) !== null;

  const zaehlwort = (n: number, eins: string, viele: string) => `${n} ${n === 1 ? eins : viele}`;

  const titel = absicht.art === 'speichern' ? 'Als Mappe speichern'
    : absicht.art === 'oeffnen' ? `Mappe «${absicht.name}» öffnen`
      : 'Mappen verwalten';

  const speichernAbsenden = () => {
    if (!name.trim()) return;
    onSpeichern(name);
  };

  return createPortal(
    <div className="fixed inset-0 z-overlay">
      <div className="lc-scrim-voll absolute inset-0" onClick={onSchliessen} aria-hidden />
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={titel}
        data-mappen-dialog={absicht.art}
        className="lc-schwebeflaeche absolute left-1/2 top-16 w-[26rem] max-w-[calc(100vw-1rem)] -translate-x-1/2 p-4 focus:outline-none">
        <div className="mb-3 flex items-start gap-2">
          <h2 className="lc-overline flex-1">{titel}</h2>
          {/* Komfort-Fläche AN (A3-1 Regelfall): der Dialog ist keine dichte
              Zeile — links davon steht nur die Überschrift, darunter beginnt
              der Inhalt erst nach 12 px. Die vier deklarierten Ausnahmen
              (`design-r3b-chrome`) sind Reiter- und Pane-Zeilen, nicht das. */}
          <SchliessKnopf name="Dialog schliessen"
            onClick={onSchliessen} klasse="h-6 w-6 shrink-0" />
        </div>

        {absicht.art === 'speichern' && (
          <>
            <label className="block">
              <span className="mb-1 block text-body-s text-ink-700">Name der Mappe</span>
              <input ref={nameRef} type="text" value={name} maxLength={NAME_MAX}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); speichernAbsenden(); } }}
                placeholder="z. B. Kündigung Meier"
                data-mappen-feld="name"
                className="lc-input h-9 w-full py-0 text-body-s" />
            </label>
            {/* §8 · WAS GESPEICHERT WIRD, STEHT DA — und was NICHT: die Mappe
                merkt sich Adressen, keine Eingaben. Wer das nicht liest, soll
                es wenigstens gesehen haben. */}
            <p className="mt-2 text-micro text-ink-500">
              {`Gespeichert werden ${zaehlwort(offeneReiter.length, 'offener Reiter', 'offene Reiter')}`}
              {feste > 0 ? ` (davon ${feste} angeheftet)` : ''}
              {' '}mit Reihenfolge und Lesestellung — nur Adressen, keine Formulareingaben.
              Die Mappe bleibt auf diesem Gerät.
            </p>
            {schonVergeben && (
              <p className="mt-2 text-micro text-danger-700" data-mappen-hinweis="belegt">
                {`«${name.trim()}» gibt es schon — Speichern überschreibt diese Mappe.`}
              </p>
            )}
            <div className="mt-3 flex justify-end gap-2">
              <button type="button" onClick={onSchliessen} className="lc-btn-ghost lc-btn-sm">Abbrechen</button>
              <button type="button" onClick={speichernAbsenden} disabled={!name.trim()}
                data-mappen-aktion="speichern"
                className="lc-btn-primary lc-btn-sm disabled:opacity-40">
                {schonVergeben ? 'Überschreiben' : 'Speichern'}
              </button>
            </div>
          </>
        )}

        {absicht.art === 'oeffnen' && (() => {
          const m = mappeMitNamen(absicht.name);
          if (!m) {
            return <p className="text-body-s text-ink-700">Diese Mappe gibt es nicht mehr.</p>;
          }
          return (
            <>
              {/* DIE RÜCKFRAGE NENNT ZAHLEN, NICHT «SIND SIE SICHER?» — wer
                  fünf Reiter offen hat, soll die Fünf sehen. Und den Ausweg:
                  der Schliess-Ring holt sie zurück (Alt+⇧+T). */}
              <p className="text-body-s text-ink-700">
                {`Die Mappe öffnet ${zaehlwort(m.reiter.length, 'Reiter', 'Reiter')}. `}
                {freie > 0
                  ? `Die ${zaehlwort(freie, 'offene Reiter wird', 'offenen Reiter werden')} geschlossen`
                  : 'Es ist kein freier Reiter offen'}
                {feste > 0 ? `; ${zaehlwort(feste, 'angehefteter Reiter bleibt', 'angeheftete Reiter bleiben')} stehen.` : '.'}
              </p>
              <p className="mt-2 text-micro text-ink-500">
                Geschlossene Reiter lassen sich einzeln zurückholen (Alt+⇧+T).
              </p>
              <ol className="mt-3 max-h-48 overflow-y-auto text-micro text-ink-600">
                {m.reiter.map((t) => (
                  // Kein Piktogramm für «angeheftet»: die App führt ihre
                  // Glyphen aus einem festen, schmalen Satz (✕ ⧉ ▲ ▼ ↩ +) —
                  // ein Emoji wäre eine dreizehnte Bildsprache (§13 Ziff. 4).
                  <li key={t.path} className="flex gap-1 truncate" title={t.path}>
                    <span className="truncate">{t.path}</span>
                    {t.fest && <span className="shrink-0 text-ink-400">angeheftet</span>}
                  </li>
                ))}
              </ol>
              <div className="mt-3 flex justify-end gap-2">
                <button type="button" onClick={onSchliessen} className="lc-btn-ghost lc-btn-sm">Abbrechen</button>
                <button type="button" onClick={() => onOeffnen(m)} data-mappen-aktion="oeffnen"
                  className="lc-btn-primary lc-btn-sm">Mappe öffnen</button>
              </div>
            </>
          );
        })()}

        {absicht.art === 'verwalten' && (
          <>
            {mappen.length === 0 && (
              <p className="text-body-s text-ink-700">Noch keine Mappe gespeichert.</p>
            )}
            <ul className="space-y-1">
              {mappen.map((m) => (
                // Die Zeile IST eine Menüzeile — also trägt sie den Baustein
                // der App (`lc-menu-zeile`, Höhe aus `--menu-zeile-h`) statt
                // eines eigenen Rezepts (B-K1/R9: ein roher `<button>` baut
                // seine Optik selbst, und genau daraus entstehen die
                // Rezept-Familien). Der Zähler steht rechts in der Zeile, nicht
                // darunter: `lc-menu-zeile` ist einzeilig.
                <li key={m.name} data-mappen-zeile={m.name}
                  className="flex items-center gap-1 border-b border-rule-soft">
                  <button type="button" onClick={() => onOeffnen(m)}
                    title={`Mappe «${m.name}» öffnen`}
                    className="lc-menu-zeile min-w-0 flex-1">
                    <span className="min-w-0 flex-1 truncate">{m.name}</span>
                    <span className="num shrink-0 text-micro text-ink-500">
                      {zaehlwort(m.reiter.length, 'Reiter', 'Reiter')}
                    </span>
                  </button>
                  <button type="button" onClick={() => onAdresse(m.reiter)}
                    aria-label={`Adresse der Mappe «${m.name}» kopieren`}
                    title="Adresse kopieren"
                    className="lc-btn-ghost lc-btn-sm shrink-0 text-micro">
                    Adresse
                  </button>
                  <SchliessKnopf name={`Mappe «${m.name}» löschen`} ton="destruktiv"
                    onClick={() => onLoeschen(m.name)} klasse="h-6 w-6 shrink-0" />
                </li>
              ))}
            </ul>
            <div className="mt-3 flex justify-end">
              <button type="button" onClick={onSchliessen} className="lc-btn-outline lc-btn-sm">Fertig</button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
