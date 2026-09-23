import { useEffect, useRef, useState } from 'react';

// ─── Zeiterfassung / Stoppuhr (Startseite V2) ───────────────────────────────
//
// Einfache Arbeitszeit-Stoppuhr je Aufgabe — Werkzeug, KEINE Rechtslogik (§2
// betrifft Engines; eine Stoppuhr darf Date.now() nutzen). Vollständig lokal:
// die Tages-Einträge liegen in localStorage (kein Server, Berufsgeheimnis).
// SSR-sicher: Lazy-Initializer fällt serverseitig auf [] zurück; die einzige
// client-divergente Stelle (Einträge-Liste) trägt suppressHydrationWarning.
// W2·29-WERKBANK-KATALOGE K4 (23.9.2026): aus `components/start/` zum einzigen
// Verwender (`/rechner`, «Werkzeuge») gezogen; Hover-Ton Tinte statt Messing.

interface Eintrag { label: string; ms: number }

const KEY = 'lexmetrik-zeit';

function heuteSchluessel(): string {
  const d = new Date();
  return `${KEY}-${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function ladeEintraege(schluessel: string): Eintrag[] {
  try {
    const roh = localStorage.getItem(schluessel);
    const arr = roh ? JSON.parse(roh) : [];
    return Array.isArray(arr) ? arr.filter((e) => typeof e?.label === 'string' && typeof e?.ms === 'number') : [];
  } catch {
    return [];
  }
}

function speichereEintraege(schluessel: string, es: Eintrag[]): void {
  try { localStorage.setItem(schluessel, JSON.stringify(es)); } catch { /* privater Modus */ }
}

const zwei = (n: number) => String(n).padStart(2, '0');
function uhr(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${zwei(Math.floor(s / 3600))}:${zwei(Math.floor((s % 3600) / 60))}:${zwei(s % 60)}`;
}
function dauer(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  return `${h > 0 ? h + 'h ' : ''}${zwei(Math.floor((s % 3600) / 60))}m ${zwei(s % 60)}s`;
}

export function Zeiterfassung() {
  // Tagesschlüssel EINMAL beim Mount festhalten und für Laden UND Speichern
  // nutzen. Sonst wandern bei über Mitternacht offenem Tab die geladenen
  // Vortags-Einträge beim Buchen in den frisch berechneten neuen Tagesschlüssel
  // und verfälschen dessen Summe. (Kein neues Date.now() in Rechenlogik — die
  // Auswertung passiert einmalig an der bestehenden Lade-Stelle, §2.)
  // Lazy-State (einmal beim Mount, nie geändert) statt Ref — render-sicher und
  // dieselbe Semantik wie ein beim Mount fixierter Schlüssel.
  const [schluessel] = useState(heuteSchluessel);
  const [eintraege, setEintraege] = useState<Eintrag[]>(() => ladeEintraege(schluessel));
  const [aufgabe, setAufgabe] = useState('');
  const [laeuft, setLaeuft] = useState(false);
  const [verstrichen, setVerstrichen] = useState(0); // ms, nur Anzeige
  const startRef = useRef(0);   // Date.now() beim Start
  const ivRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stoppeUhr = () => {
    if (ivRef.current !== null) { clearInterval(ivRef.current); ivRef.current = null; }
  };

  useEffect(() => stoppeUhr, []);

  const starten = () => {
    stoppeUhr(); // doppelten Interval ausschliessen
    setLaeuft(true);
    startRef.current = Date.now();
    ivRef.current = setInterval(() => setVerstrichen(Date.now() - startRef.current), 250);
  };
  const stoppenUndBuchen = () => {
    stoppeUhr();
    setLaeuft(false);
    const total = Date.now() - startRef.current;
    setVerstrichen(0);
    if (total > 0) {
      const label = aufgabe.trim() || 'Ohne Bezeichnung';
      const naechste = [{ label, ms: total }, ...eintraege];
      setEintraege(naechste);
      speichereEintraege(schluessel, naechste);
      setAufgabe('');
    }
  };
  const zuruecksetzen = () => {
    stoppeUhr();
    setLaeuft(false);
    setVerstrichen(0);
    setAufgabe('');
  };
  const loeschen = () => {
    setEintraege([]);
    speichereEintraege(schluessel, []);
  };

  const summe = eintraege.reduce((a, e) => a + e.ms, 0);

  return (
    <div className="lc-card p-5 space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <span className="num font-medium text-ink-900" style={{ fontSize: 'var(--timer-fs)', letterSpacing: '-0.02em' }}>
          {uhr(verstrichen)}
        </span>
        <input
          value={aufgabe}
          onChange={(e) => setAufgabe(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && laeuft) stoppenUndBuchen(); }}
          placeholder="Woran arbeitest du? (z. B. Schlichtungsgesuch redigieren)"
          aria-label="Aufgabe"
          className="lc-input flex-1 min-w-0 basis-full sm:basis-auto sm:min-w-[12rem]"
        />
        <div className="flex gap-2">
          <button type="button" onClick={laeuft ? stoppenUndBuchen : starten}
            className="lc-btn lc-btn-primary"
            style={laeuft ? { background: 'var(--danger-700)' } : undefined}>
            {laeuft ? 'Stopp & buchen' : 'Start'}
          </button>
          <button type="button" onClick={zuruecksetzen} className="lc-btn lc-btn-ghost">Zurücksetzen</button>
        </div>
      </div>

      <div className="border-t border-line pt-2" suppressHydrationWarning>
        {eintraege.length === 0 ? (
          <p className="text-body-s text-ink-500 py-1.5">
            Noch nichts erfasst — Start drücken, um die Zeit für eine Aufgabe zu tracken.
          </p>
        ) : (
          <>
            {eintraege.map((e, i) => (
              <div key={i} className="flex items-baseline justify-between gap-3 py-2 border-b border-line last:border-0">
                <span className="text-body-s text-ink-900 min-w-0 truncate">{e.label}</span>
                <span className="num text-body-s text-ink-600 shrink-0">{dauer(e.ms)}</span>
              </div>
            ))}
            <div className="flex items-baseline justify-between gap-3 pt-2.5">
              <button type="button" onClick={loeschen} className="text-body-s text-ink-500 hover:text-ink-900 transition-colors">
                Heute zurücksetzen
              </button>
              <span className="text-body-s text-ink-600">Heute erfasst <b className="num text-ink-900 font-medium">{dauer(summe)}</b></span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
