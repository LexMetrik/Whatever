import type { Sperrereignis, SperrereignisTyp } from '../../types/legal';

// ─── Geteilte Daten/Helfer des Sperrereignis-Editors ────────────────────────
// Eigene Datei (react-refresh: Komponenten-Dateien exportieren nur
// Komponenten) — Befund Logik-Check 6.6.2026. Keine Rechtslogik (§3).

export const SPERREREIGNIS_TYPEN: { code: SperrereignisTyp; label: string }[] = [
  { code: 'krankheit_unfall',  label: 'Krankheit / Unfall (Art. 336c Abs. 1 lit. b)' },
  { code: 'schwangerschaft',   label: 'Schwangerschaft / Niederkunft (lit. c)' },
  { code: 'mutterschaftsurlaub_verlaengert', label: 'Verlängerter Mutterschaftsurlaub — Hospitalisierung Neugeborenes (lit. cbis)' },
  { code: 'zusatzurlaub_tod_elternteil',     label: 'Zusatzurlaub der Mutter nach Tod des anderen Elternteils (lit. cter)' },
  { code: 'urlaub_tod_mutter',               label: 'Urlaub des anderen Elternteils nach Tod der Mutter (lit. cquinquies)' },
  { code: 'militaer_zivil',    label: 'Militär / Zivildienst (lit. a)' },
  { code: 'hilfsaktion',       label: 'Hilfsaktion im Ausland (lit. d)' },
  { code: 'betreuungsurlaub',  label: 'Betreuungsurlaub (lit. cquater, Art. 329i OR, max. 6 Monate)' },
];

// Typen mit optionalem Niederkunftsdatum (deterministische Endberechnung lit. c
// bzw. Kappung lit. cter — siehe sperrfristen.ts).
export const MIT_NIEDERKUNFT: SperrereignisTyp[] = ['schwangerschaft', 'zusatzurlaub_tod_elternteil'];

/** Beim Entfernen: Index-Referenzen («Rückfall wie Ereignis …») nachführen. */
export function sperrereignisEntfernen(liste: Sperrereignis[], i: number): Sperrereignis[] {
  return liste
    .filter((_, j) => j !== i)
    .map((e) => {
      const ref = e.gleicheUrsacheWieEreignis;
      if (ref == null) return e;
      if (ref === i) return { ...e, gleicheUrsacheWieEreignis: undefined };
      if (ref > i) return { ...e, gleicheUrsacheWieEreignis: ref - 1 };
      return e;
    });
}

/**
 * Typwechsel eines Ereignisses (RL-13 PR 2, UI-05). Einen Rückfall kennt nur
 * Krankheit/Unfall (Art. 336c Abs. 1 lit. b OR): Wird Ereignis i zu einem
 * anderen Typ, fällt sein eigener Bezug weg, und Rückfälle, die auf i zeigen,
 * verlieren ihren Bezug — sonst bliebe im Formular ein unsichtbarer Wert
 * stehen, den die Engine nur noch als «ungültiger Bezug» offenlegen könnte.
 */
export function sperrereignisTypSetzen(liste: Sperrereignis[], i: number, typ: SperrereignisTyp): Sperrereignis[] {
  const krankheit = typ === 'krankheit_unfall';
  return liste.map((e, j) => {
    if (j === i) return krankheit ? { ...e, typ } : { ...e, typ, gleicheUrsacheWieEreignis: undefined };
    if (!krankheit && e.gleicheUrsacheWieEreignis === i) return { ...e, gleicheUrsacheWieEreignis: undefined };
    return e;
  });
}
