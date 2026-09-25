import { useEffect, useRef, useState } from 'react';
import { kopierAnsageRegion, sageKopiertAn } from './ui/kopierAnsage';

// ─── Kopier-Hook (FAHRPLAN-BEGRUENDUNGS-ABSATZ B2-1) ────────────────────────
// Geteilte Copy-to-Clipboard-Mechanik: «Kopiert ✓» erst NACH erfolgreichem
// Schreiben. Eine abgewiesene Clipboard-Berechtigung (Promise-Rejection) oder
// eine fehlende API darf keinen Erfolg vortäuschen (Review-Befund 6.6.2026).

/**
 * Wie lange die Kopier-Quittung stehen bleibt — EINE Zahl für die ganze App.
 *
 * GEMESSEN (Design-Konsistenz R3-α/B3-9, 31.8.2026): dieselbe Rückmeldung lief
 * mit DREI Verweildauern — 1500 ms (GerichtszitatForm, Dokumentmappe,
 * ArtikelLeser), 1600 ms (dieser Hook, LinkTeilenButton), 2000 ms
 * (useWizardState, Kontakt, EntscheidLeser). Wie lange eine Quittung steht, ist
 * eine Design-Entscheidung und keine lokale Geschmacksfrage; sie stand achtmal
 * da und lief dreifach auseinander (§5).
 *
 * KANON ist der Wert des geteilten Hooks (1600 ms) — die verbreitetste Zahl und
 * zugleich die einzige, die schon eine gemeinsame Heimat hatte.
 *
 * ── R4-D (5.9.2026): die Zahl war nur der halbe Befund ─────────────────────
 * R3-α hat die DAUER vereinheitlicht und die Flächen mit eigenem Kopier-Zustand
 * die Konstante LESEN lassen. Die MECHANIK blieb dabei fünfmal von Hand gebaut
 * — und lief auseinander (Messung 5.9.2026 am Quelltext):
 *
 *   Fundort                        Erfolg erst nach Promise?  Timer-Ersatz  Unmount
 *   useKopieren (Kanon)                    ja                    ja           ja
 *   vorlagen/Dokumentmappe Z.123           ja                    ja           ja
 *   vorlagen/useWizardState Z.67           ja                    ja           ja
 *   pages/EntscheidLeser Z.582             ja                    NEIN         NEIN
 *   gesetz-leser/parts/ArtikelLeser Z.344  ja                    NEIN         NEIN
 *   components/LinkTeilenButton Z.47      NEIN                   NEIN         NEIN
 *
 * `LinkTeilenButton` schrieb `void navigator.clipboard.writeText(…)` und setzte
 * die Quittung SOFORT — genau der Fehlgriff, gegen den dieser Hook am 6.6.2026
 * gebaut wurde: bei verweigerter Berechtigung meldete der Knopf «Link kopiert
 * ✓», während die Zwischenablage unverändert blieb (§8).
 *
 * DIE WURZEL, nicht das Symptom: der Hook nahm seinen Text bei der HOOK-Zeile
 * entgegen. Vier der fünf Flächen kennen ihn erst beim KLICK (Permalink mit
 * aktuellem Anker, Zitat mit Abrufdatum, gewähltes Dokument der Mappe) — sie
 * KONNTEN ihn nicht verwenden. Darum nimmt `kopieren()` den Text jetzt auch
 * beim Aufruf entgegen; die Konstante bleibt exportiert, weil Tests und
 * Wächter sie zitieren.
 *
 * @textsonde `eingabe-bausteine-r2e.test.tsx` prüft den Literal-String
 * `export const KOPIER_DAUER_MS` im Quelltext (kein Import) — für knip
 * unsichtbar (check:sediment (d), W2·29-WERKBANK-EXPORTE, 22.9.2026;
 * Tag-Ausnahme `tags: ["-textsonde"]` in knip.json).
 */
export const KOPIER_DAUER_MS = 1600;

/** Was `kopieren()` entgegennimmt: nur den Text, oder Text plus MARKE. */
export type KopierAuftrag = {
  text?: string;
  marke?: string;
  /** Screenreader-Ansage nach dem Schreiben (REST S5b, `ui/kopierAnsage`);
   *  ohne Angabe «In die Zwischenablage kopiert». */
  ansage?: string;
};

export function useKopieren(text?: string, dauerMs = KOPIER_DAUER_MS): {
  /** Steht die Quittung? Für den Regelfall «ein Ziel je Fläche». */
  kopiert: boolean;
  /**
   * WELCHES Ziel zuletzt quittiert wurde, `''` = keines. Für Flächen mit
   * mehreren Kopier-Knöpfen nebeneinander (`ArtikelLeser`: «Zitat» und «Link»
   * in einer Zeile) — dort darf nur der geklickte Knopf sein Häkchen zeigen.
   * Ohne übergebene Marke steht hier `'ja'`.
   */
  marke: string;
  /**
   * Kopiert und quittiert — die Quittung erst NACH erfolgreichem Schreiben.
   * Ohne Argument gilt der `text` der Hook-Zeile.
   */
  kopieren: (was?: string | KopierAuftrag) => void;
} {
  const [marke, setMarke] = useState('');
  // Rücksetz-Timer als Handle halten: ohne das feuerte er nach dem Unmount ins
  // Leere, und ein zweiter Klick liess zwei Timer gleichzeitig laufen (der
  // ältere setzte die frische Quittung vorzeitig zurück). Dieselbe
  // Vorsichtsmassnahme, die `Dokumentmappe`/`useWizardState` von Hand trafen —
  // sie gehört in den geteilten Hook, sonst ist der Hook die schlechtere
  // Variante seiner eigenen Kopien (§5/§10, R3-α 31.8.2026).
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  // Die Ansage-Region steht VOR dem ersten Klick im DOM (Screenreader
  // überhören eine Region, die erst mit ihrem Text erscheint).
  useEffect(() => { kopierAnsageRegion(); }, []);
  const kopieren = (was?: string | KopierAuftrag) => {
    const auftrag: KopierAuftrag = typeof was === 'string' ? { text: was } : (was ?? {});
    const inhalt = auftrag.text ?? text;
    // Kein Text = nichts zu tun, und vor allem KEINE Quittung: eine Quittung
    // ohne Kopie ist genau die Unehrlichkeit, die dieser Hook verhindert (§8).
    if (inhalt == null) return;
    try {
      // `?.` UND `try`: fehlt die API ganz, wirft schon der Aufruf; wird die
      // Berechtigung verweigert, lehnt das Promise ab. Beide Wege enden still
      // — aber ohne Häkchen. `then(ok, fail)` statt `.catch()`: ein Fehler IM
      // Erfolgszweig darf nicht als «Berechtigung verweigert» durchgehen.
      navigator.clipboard?.writeText(inhalt).then(() => {
        setMarke(auftrag.marke ?? 'ja');
        sageKopiertAn(auftrag.ansage);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setMarke(''), dauerMs);
      }, () => { /* Berechtigung verweigert/unsicherer Kontext */ });
    } catch { /* Clipboard-API nicht vorhanden */ }
  };
  return { kopiert: marke !== '', marke, kopieren };
}
