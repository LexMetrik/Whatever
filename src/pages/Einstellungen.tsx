import { useState } from 'react';
import { SeitenKopf } from '../components/layout/SeitenKopf';
import { KANTONE } from '../lib/kantone';
import { KANTON_NAMEN } from '../data/tarif/typen';
import type { Kanton } from '../types/legal';
import { useEinstellungen, setzeEinstellung } from '../lib/einstellungen';
import { DETAILGRAD_OPTIONEN } from '../lib/vorlagen/detailgrad';
import { speichereThema, wendeThemaAn, systemThema, useThemaWahl, type ThemaWahl } from '../components/thema';
import { useAusgabeStil, setAusgabeStil } from '../components/vorlagen/ausgabeStil';
import { SelectionGrid } from '../components/ui/SelectionGrid';
import { SchriftgroessenRegler } from '../components/ui/SchriftgroessenRegler';
import { useSchriftskala } from '../components/layout/useSchriftskala';

// ─── Rubrik «Einstellungen» (Auftrag David) ─────────────────────────────────
//
// Aggregierende View über die Nutzer-Defaults — der EINE Ort, an dem man sie
// pflegt (§5). Eigene Werte (Standard-Kanton, Profil, Vorlagen-Detailgrad) im
// Store lib/einstellungen.ts; Theme/Stil/Rechtsprechungs-Ansicht werden in ihre
// bestehenden Stores GEBRÜCKT, nicht dupliziert. Reine Darstellung (§3).

// Segmentierte Auswahl (Token-konform, voller Zustands-Matrix §13/F4).
function Segment<T extends string>({ wert, optionen, onWahl, label }: {
  wert: T; optionen: { id: T; label: string; sub?: string }[]; onWahl: (id: T) => void; label: string;
}) {
  return (
    /* B3-4 (R3-α, 31.8.2026): eigene Kachel-Anatomie (px-3.5 py-2, aktive
       Tinte brass-800 statt ink-900, Unterzeile ink-500) → der EINE Baustein.
       Die Wahl selbst ist unverändert; nur die Kachel wird nicht mehr hier
       gezeichnet (§5/§10). */
    <SelectionGrid
      className="flex flex-wrap gap-2" gruppenLabel={label}
      items={optionen.map((o) => ({ code: o.id, label: o.label, sub: o.sub }))}
      value={wert} onSelect={onWahl} />
  );
}

function Zeile({ titel, hinweis, children }: { titel: string; hinweis?: string; children: React.ReactNode }) {
  return (
    <div className="es-zeile space-y-1.5">
      <p className="text-body-s font-semibold text-ink-900">{titel}</p>
      {hinweis && <p className="text-xs text-ink-500 max-w-reading">{hinweis}</p>}
      <div className="pt-1.5">{children}</div>
    </div>
  );
}

// Direkter Bezug auf die Rechtsprechungs-Keys (Spiegel der Komponenten-Keys —
// die Seite ist die zentrale Pflegestelle; wirkt beim nächsten Besuch der Ansicht).
const DICHTE_KEY = 'rsp:dichte';
const FS_KEY = 'rsp-fs-idx';
const FS_LABELS = ['Klein', 'Normal', 'Gross', 'Sehr gross'];

// Gesamt-Reset über PRÄFIX statt Allowlist (Bug-Fix 26.6.2026): eine hartcodierte
// Liste verfehlte ~17 Vorlagen-Entwurf-Keys (`lexmetrik.vorlage.*`) und veraltete
// bei jeder neuen Vorlage. Alle App-Keys tragen ein bekanntes Präfix.
const RESET_PRAEFIXE = ['lexmetrik', 'rsp:', 'rsp-'];

function leseKey(key: string, fallback: string): string {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}
function schreibeKey(key: string, wert: string): void {
  try { localStorage.setItem(key, wert); } catch { /* privat-Modus */ }
}

export function Einstellungen() {
  const e = useEinstellungen();
  const stil = useAusgabeStil();
  // W2·23-STARTSEITE-V4 §6.2: der Regler «Ganze Seite» stand bis hierher im
  // Top-Streifen. Er gehört zu den Dauer-Vorgaben, die diese Seite pflegt —
  // derselbe Hook, derselbe Speicher-Schlüssel, nur ein anderer Ort.
  const schrift = useSchriftskala();
  // Theme aus dem geteilten Store (synchron mit dem Topbar-Umschalter); Rechtsprechungs-
  // Ansicht lokal (clientseitig, opt-in).
  const themaWahl: ThemaWahl = useThemaWahl() ?? 'auto';
  const [dichte, setDichte] = useState<string>(() => leseKey(DICHTE_KEY, 'liste'));
  const [fsIdx, setFsIdx] = useState<string>(() => leseKey(FS_KEY, '1'));

  const themaSetzen = (w: ThemaWahl) => {
    speichereThema(w); // benachrichtigt Store → Segment + Topbar synchron
    wendeThemaAn(w === 'auto' ? systemThema() : w);
  };

  const reset = () => {
    if (!window.confirm('Alle gespeicherten Einstellungen, Reiter, Favoriten und Vorlagen-Entwürfe zurücksetzen? Das kann nicht rückgängig gemacht werden.')) return;
    try {
      // Rückwärts iterieren (removeItem verschiebt die Indizes); alles mit einem
      // App-Präfix löschen — deckt ALLE Einstellungen/Reiter/Favoriten/Vorlagen-
      // Entwürfe/Zeiterfassung ab, ohne fragile Allowlist (Bug-Fix 26.6.).
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && RESET_PRAEFIXE.some((p) => k.startsWith(p))) localStorage.removeItem(k);
      }
    } catch { /* privat-Modus */ }
    window.location.reload();
  };

  return (
    // ── LM-136 (W2·17-UI-BEFUNDE/B16) · KEIN EINZELWERT FÜR DIE LESEBREITE ────
    // Hier stand `max-w-[44rem]`. Gemessen 4.9.2026 @1440 (Preview von
    // origin/main): der Shell deckelt zentral auf `max-w-content` (1120 px, innen
    // 312→1384) — die Rechnerseiten laufen bis 1384, /einstellungen brach schon
    // bei 1016 ab. Die Abweichung entstand also nicht im Shell (D7-Heilung trägt),
    // sondern an diesem inneren Wrapper, und 44 rem ist ein Wert, den sonst
    // NIEMAND trägt: die statischen Schwesterseiten /kontakt, /ueber und
    // /datenschutz stehen alle auf `max-w-reading` (40 rem). Angeglichen auf
    // dasselbe Token — gleichartige Seiten, gleiche Inhaltsbreite, und ein
    // Arbitrary-Wert weniger im Design-System (§13/design.md: Tokens statt
    // Rohwerten).
    //
    // W2·29-WERKBANK-KATALOGE K5 (23.9.2026, Board «Unter-Einstellungen»): die
    // Gruppen stehen ab 1100 px in ZWEI Spalten (`.es-raster`, index.css) —
    // jede Spalte bleibt unter der Lesebreite; der Deckel des Shells trägt die
    // Seite wie die Übersichten. Karten weichen der Tinten-Linie (`.es-gruppe`).
    //
    // NICHT geändert, weil Kanon und kein Defekt: der dritte Teil des Befundes
    // («der Fliesstextblock der Startseite ist schmaler als alles darüber»). Die
    // Lesespalte unter breiteren Modulen ist die gewollte Satzbreite (§13.2,
    // dieselbe Herleitung wie Responsive-Audit D3 in pages/Methodik.tsx).
    <div className="space-y-6">
      {/* ── G9/G17 (Gesamtprüfung 6.9.2026) · DIESELBE KOPF-ANATOMIE ────────
          H1 zuerst, darunter EINE Zeile aus dem Bestand — die Form aller
          Übersichten (`layout/SeitenKopf`, D22). Overline und Ablesekante
          entfallen; sie hoben die H1 auf y = 213 statt auf 177 (G17).
          DER §8-SATZ BLEIBT, er wechselt nur die Zeile: dass Einstellungen
          diesen Browser nie verlassen, ist eine Zusage über die Datenhaltung,
          kein Erklärtext — als Ausgabe-Zeile (13 px, ink-500) steht sie in
          derselben Zelle, in der `/gesetze` seine Zähler führt, und fällt
          damit nicht unter D11 («Übersichts-Köpfe ohne Erklärtext»). */}
      <SeitenKopf titel="Einstellungen"
        ausgabe="Standardwerte für die ganze Seite — lokal in diesem Browser gespeichert, nie übermittelt." />

      <div className="es-raster">

      <section className="es-gruppe">
        <Zeile titel="Standard-Kanton" hinweis="Wird in Fristen- und Gebührenrechnern vorgewählt (ein Permalink oder eine eigene Wahl im Formular geht weiter vor).">
          <select aria-label="Standard-Kanton" value={e.standardKanton}
            onChange={(ev) => setzeEinstellung('standardKanton', ev.target.value as Kanton)}
            className="lc-input w-full max-w-xs">
            {KANTONE.map((k) => <option key={k} value={k}>{KANTON_NAMEN[k]} ({k})</option>)}
          </select>
        </Zeile>

        <Zeile titel="Profil (Name & Adresse)" hinweis="Optional. Füllt passende Absender-/Verfasser-Felder in Vorlagen vor. Leere Felder bleiben leer.">
          <div className="space-y-2 max-w-md">
            <input type="text" aria-label="Name" placeholder="Name / Kanzlei"
              value={e.profilName} onChange={(ev) => setzeEinstellung('profilName', ev.target.value)}
              className="lc-input w-full" />
            <textarea aria-label="Adresse" placeholder="Adresse (Strasse, PLZ Ort)" rows={2}
              value={e.profilAdresse} onChange={(ev) => setzeEinstellung('profilAdresse', ev.target.value)}
              className="lc-input w-full" />
          </div>
        </Zeile>
      </section>

      <section className="es-gruppe">
        <Zeile titel="Schriftgrösse — ganze Seite"
          hinweis="Vergrössert Schrift und Abstände der ganzen Anwendung (der Gesetzestext hat im Leser-Menü «Ansicht» zusätzlich einen eigenen Regler). Die Wahl gilt sofort und bleibt in diesem Browser gespeichert.">
          {/* role="group" + sichtbares Scope-Wort bleiben am Aufrufer (Baustein
              trägt nur das Knopf-Paar) — derselbe Umschluss wie
              `v3/LeserAnsichtV3.tsx` («Nur Gesetzestext»), hier mit dem
              Gegenstück «Ganze Seite» (C4, Entscheid David 5B 29.8.2026). */}
          <div role="group" aria-label="Schriftgrösse der ganzen Seite" className="inline-flex items-center gap-1.5">
            <span aria-hidden className="select-none whitespace-nowrap text-micro text-ink-500">Ganze Seite</span>
            <SchriftgroessenRegler
              schrift={schrift}
              kleinerLabel="Ganze Seite verkleinern"
              kleinerTitle="Verkleinert die ganze Anwendung — der Gesetzestext hat im Menü «Ansicht» einen eigenen Regler"
              groesserLabel="Ganze Seite vergrössern"
              groesserTitle="Vergrössert die ganze Anwendung — der Gesetzestext hat im Menü «Ansicht» einen eigenen Regler"
            />
          </div>
        </Zeile>

        <Zeile titel="Farbschema">
          <Segment label="Farbschema" wert={themaWahl} onWahl={themaSetzen}
            optionen={[
              { id: 'hell', label: 'Hell' },
              { id: 'dunkel', label: 'Dunkel' },
              { id: 'auto', label: 'Automatisch', sub: 'folgt dem System' },
            ]} />
        </Zeile>
      </section>

      <section className="es-gruppe">
        <Zeile titel="Vorlagen — Detailgrad" hinweis="Standardumfang neuer Vorlagen (eine Wahl im Wizard geht weiter vor).">
          <Segment label="Detailgrad" wert={e.vorlagenDetailgrad}
            onWahl={(id) => setzeEinstellung('vorlagenDetailgrad', id)} optionen={DETAILGRAD_OPTIONEN} />
        </Zeile>
        <Zeile titel="Vorlagen — Schriftbild">
          <Segment label="Schriftbild" wert={stil} onWahl={setAusgabeStil}
            optionen={[
              { id: 'modern', label: 'Modern' },
              { id: 'nuechtern', label: 'Nüchtern' },
            ]} />
        </Zeile>
      </section>

      <section className="es-gruppe">
        <Zeile titel="Rechtsprechung — Trefferliste" hinweis="Wirkt beim nächsten Öffnen der Rechtsprechungs-Übersicht.">
          <Segment label="Trefferliste" wert={dichte}
            onWahl={(id) => { setDichte(id); schreibeKey(DICHTE_KEY, id); }}
            optionen={[{ id: 'liste', label: 'Liste' }, { id: 'karten', label: 'Karten' }]} />
        </Zeile>
        <Zeile titel="Rechtsprechung — Lesegrösse" hinweis="Schriftgrösse im Entscheid-Leser.">
          <Segment label="Lesegrösse" wert={fsIdx}
            onWahl={(id) => { setFsIdx(id); schreibeKey(FS_KEY, id); }}
            optionen={FS_LABELS.map((l, i) => ({ id: String(i), label: l }))} />
        </Zeile>
      </section>

      <section className="es-gruppe">
        <Zeile titel="Zurücksetzen" hinweis="Löscht alle gespeicherten Einstellungen, offenen Reiter, Favoriten und Vorlagen-Entwürfe in diesem Browser.">
          <button type="button" onClick={reset}
            className="rounded-lg border border-danger-line bg-surface px-3.5 py-2 text-body-s font-medium text-danger-700 transition-colors hover:bg-danger-bg">
            Alles zurücksetzen …
          </button>
        </Zeile>
      </section>
      </div>
    </div>
  );
}
