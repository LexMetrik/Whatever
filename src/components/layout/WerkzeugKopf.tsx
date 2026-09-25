import { useId, useState, type ReactNode } from 'react';
import { NormChip } from '../vorlagen/NormChip';
import { SeitenTitel } from '../ui/SeitenTitel';
import { EntwurfHinweis } from '../EntwurfLegende';
import type { Status } from '../../lib/startseiteConfigTypen';

// ─── WerkzeugKopf: der Kopf der Werkzeuge (W2·29-WERKBANK-VORLAGEN V1) ───────
//
// Anatomie wie `RechnerKopf` (Overline · H1 · Einleitung · Norm-Chips), im
// Kleid der Werkbank-Boards «Unter-Vorlage-Wizard» / «Unter-Rechner»: Overline
// und Titel stehen auf einem TITELBLATT-BAND (`.ub-kopf`, dieselbe Anatomie wie
// `SeitenKopf` und das Leser-Titelblatt). `.wk-kopf` legt das Register fest auf
// «Werkzeuge» (`--reg-w`), unabhängig von Route oder Pane — ein Werkzeug trägt
// nie eine geratene Farbe. Das Board färbt das Band voll mit weisser Schrift;
// das Haus erlaubt als Fläche nur `--reg-w-flaeche` mit Tinte (F0.2).
// Heute nutzen ihn die Vorlagen; die Rechner ziehen in W2·29-WERKBANK-RECHNER
// nach. Reine Darstellung (§3).
//
// STATUS (RL-12 PR 2, Befund R3-06): rechts im Band steht vor dem Etikett der
// Prüfstand der Karte, die die Seite vertritt — «Entwurf» im Wortlaut der
// Katalog-Legende (`EntwurfHinweis`). Wer per Direktlink kommt, sieht ihn so
// wie im Katalog (§8). «geprüft» zeigt keinen Warnhinweis; ohne `status`
// (Seite ohne Karte) bleibt das Band wie bisher — der Kopf rät keinen Status.
// Etikett und Status stehen NEBENEINANDER, keiner verdrängt den anderen.

// ── W2·29-WERKBANK-REST S3 (25.9.2026) · EINLEITUNG MOBIL GEKÜRZT ──────────
// Posten «WerkzeugKopf-Intro @390 sehr hoch»: die Katalog-Beschriebe sind bis
// 62 Wörter lang (Notariat 580 Zeichen, Tagerechner 382 — gemessen per
// vite-node über `CALCULATORS`), in der Serif-Stufe `text-body-l` füllten sie
// @390 den ersten Bildschirm, bevor ein Eingabefeld kam. Unter `sm` (640 px)
// zeigt der Kopf darum drei Zeilen und einen Knopf «Weiterlesen»; der VOLLE
// Text steht immer im DOM (Screenreader, Suche, Druck lesen ihn ganz — die
// Kürzung ist `line-clamp`, reine Darstellung, kein Textverlust). Ab `sm` und
// bei kurzen Beschrieben bleibt alles wie bisher. Nicht nach dem ersten Satz
// geschnitten: der ist oft selbst 270–380 Zeichen lang (Tagerechner 273).
// Schwelle: ~3 Zeilen à ~40 Zeichen @390 in der Serif-Stufe.
const INTRO_KURZ_AB = 140;

/** Ein Norm-Chip des Kopfes — dieselben Angaben, die `NormChip` nimmt. */
interface WerkzeugNorm {
  artikel: string;
  /** Fertiger Link (z. B. lokalisiert); sonst leitet `NormChip` ihn ab. */
  href?: string;
  titel?: string;
}

export function WerkzeugKopf({ overline, titel, titelKlasse, status, etikett, vorspann, intro, normen, children }: {
  /** Einordnung über dem Titel («Arbeit · Vorlage»). */
  overline: string;
  titel: string;
  /** Zusatzklassen am Titel (z. B. Umbruchregeln für lange Komposita). */
  titelKlasse?: string;
  /** Prüfstand der Katalog-Karte der Seite (RL-12); «entwurf» → Marke im Band. */
  status?: Status;
  /** Rechts im Band: das Etikett des Werkzeugs (Formvorschrift der Vorlage). */
  etikett?: ReactNode;
  /** Direkt unter dem Band, vor der Einleitung (Rückweg der Vorlagen). */
  vorspann?: ReactNode;
  intro?: ReactNode;
  normen: readonly WerkzeugNorm[];
  /** Zeilen unter den Chips (passender Rechner, Zurücksetzen, Hinweise). */
  children?: ReactNode;
}) {
  const kuerzbar = typeof intro === 'string' && intro.length > INTRO_KURZ_AB;
  const [introOffen, setIntroOffen] = useState(false);
  const introId = useId();
  return (
    <div className="space-y-3">
      <div className="ub-kopf wk-kopf flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div className="min-w-0 space-y-1">
          <p className="lc-overline">{overline}</p>
          <SeitenTitel stimme="serif" className={titelKlasse}>{titel}</SeitenTitel>
        </div>
        {(status === 'entwurf' || etikett) && (
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {status === 'entwurf' && (
              <span data-werkzeug-status="entwurf" className="min-w-0"><EntwurfHinweis /></span>
            )}
            {etikett}
          </div>
        )}
      </div>
      {vorspann}
      {intro && (
        <div className="max-w-reading">
          <p id={introId} data-werkzeug-intro={kuerzbar ? (introOffen ? 'offen' : 'gekuerzt') : undefined}
            className={`font-serif text-body-l text-ink-600${kuerzbar && !introOffen ? ' max-sm:line-clamp-3' : ''}`}>{intro}</p>
          {kuerzbar && (
            <button type="button" aria-expanded={introOffen} aria-controls={introId}
              onClick={() => setIntroOffen((o) => !o)}
              className="lc-btn-ghost lc-btn-sm mt-1 sm:hidden">
              {introOffen ? 'Einklappen' : 'Weiterlesen'}
            </button>
          )}
        </div>
      )}
      {/* lc-chip-zeile (LM-044/N1): Norm-Chips sind <a> und tragen die
          Link-Unterstreichung als Form-Merkmal. */}
      <div className="lc-chip-zeile flex flex-wrap items-center gap-1.5">
        {normen.map((n) => (
          <NormChip key={n.artikel} artikel={n.artikel} hrefOverride={n.href} title={n.titel} />
        ))}
      </div>
      {children}
    </div>
  );
}
