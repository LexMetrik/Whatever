import { type ReactNode } from 'react';
import { merkeRuecksprungVonDom } from '../scrollAnker';
import { margLabel } from '../helpers';
import type { ArtikelIndexGruppe } from '../gliederungsModell';

// ═══ Artikel-Index der Seitenleiste (Zone B, Modus B2/B4) ════════════════════
//
// W2·19-GLIEDERUNG · S9. Bau-Spec fahrplaene/FAHRPLAN-W2-19-SEITENLEISTE.md
// §3.2 (Modus-Kette, B2-Zeile «Art. N — Randtitel, Abschnitte als nicht
// klappbare Zwischenköpfe»), §8 T3/T4 (VwVG, NHG, VMWG).
//
// WARUM EINE EIGENE KOMPONENTE STATT `SektionBaumTOC` MIT EINEM SCHALTER. Der
// Baum rendert SEKTIONEN (klappbar, Kinder-Rekursion, F3-Unmount); der Index
// rendert ARTIKEL (flach, nie klappbar — B2 ersetzt das Klappen ausdrücklich
// durch Direktheit, das ist der ganze Witz gegenüber 5 Ordnern mit 93
// Artikeln darin). Ein gemeinsames Bauteil hätte für jede Zeile beide
// Fähigkeiten mitschleppen müssen, obwohl an keiner Stelle beide gebraucht
// werden (§3 Schichtentrennung: zwei Fragen, zwei Renderer).
//
// KEINE Zählwerte an der Zeile (David 9.8.2026, dieselbe Regel wie im Baum,
// s. SektionBaumTOC) — nur Etikett + Randtitel + Aufgehoben-Signal.
//
// VIRTUALISIERUNG (§6/4 «darf virtualisiert werden»): weiterhin NICHT gebaut,
// aber der Grund hat sich geändert und gehört korrigiert (§8, §9-Bug-Check F4
// vom 13.8.2026). Bis dahin stand hier, der Korpus bleibe «weit unter jeder
// Render-Schwelle» (VwVG 93, NHG 70, VMWG ~60 Zeilen). Das stimmt seit
// W2·18-FEHLERBUCH nicht mehr: mit dem Wegfall der B3-Leerzeile fallen 68
// sidecar-lose Erlasse in diesen Modus, und der längste zeigt beim Start 608
// Zeilen (SG-3849: 17 Artikel im Index, 590 Einträge im dominanz-offenen
// Anhang-Ast; ZH-243 152). Gemessen, nicht geschätzt — korpusweite Sonde
// 13.8.2026.
// Es bleibt trotzdem bei der flachen Liste: 608 statische Zeilen sind für den
// DOM kein Problem (der OR-Baum trug vor S5 über 20 000 Knoten), und eine
// Virtualisierung kostete Ctrl+F über die Leiste. Ob sie auf schwachen Geräten
// nötig wird, ist ein Messposten mit eigener ROADMAP-Zeile
// («Perf-Blick auf den langen Artikel-Index», W2·18-FEHLERBUCH) — kein
// stillschweigend hingenommenes Risiko.

interface ArtikelIndexProps {
  gruppen: ArtikelIndexGruppe[];
  /** Token des aktiv gelesenen Artikels (F5-Marke, §3.5) — `null` = keiner bekannt. */
  aktivToken: string | null;
  onSprung: (token: string) => void;
  /** Anhang-Ast (falls vorhanden) — derselbe Baum-Renderer, unter dem Index gehängt. */
  anhang?: ReactNode;
}

function Zeile({ z, aktiv, onSprung }: {
  z: ArtikelIndexGruppe['zeilen'][number]; aktiv: boolean; onSprung: (token: string) => void;
}) {
  const voll = [z.label, z.randtitel, z.aufgehoben ? 'aufgehoben' : ''].filter(Boolean).join(' — ');
  return (
    <li>
      <div className="flex items-start">
        {/* F5-Marke — dieselbe Messingkante wie im Gliederungsbaum
            (SektionBaumTOC), immer im Markup (CLS 0, §15.2).
            W2·18-FEHLERBUCH (15.9.2026): 3 px statt 2 px und über die ganze
            Zeilenhöhe, Zug um Zug mit dem Baum. Der flache Index IST die
            Gliederung der Erlasse ohne amtliche Struktur (b2/b4) — eine
            Standort-Marke, die dort anders aussieht, behauptete einen
            Unterschied, den es fachlich nicht gibt (§5). */}
        <span aria-hidden className={`w-[3px] shrink-0 self-stretch ${aktiv ? 'bg-brass-600' : 'bg-transparent'}`} />
        <button type="button"
          onClick={() => { merkeRuecksprungVonDom(); onSprung(z.token); }}
          data-toc-aktiv={aktiv ? '1' : undefined}
          aria-current={aktiv ? 'location' : undefined}
          title={voll} aria-label={voll}
          className={`flex-1 min-w-0 text-left rounded px-1.5 py-0.5 leading-snug transition-colors text-xs ${
            aktiv ? 'text-ink-900 font-medium bg-brass-100' : 'text-ink-700 hover:text-ink-900 lc-hover-flaeche'
          }`}>
          {/* Zusatzpunkt David 9.8.2026: dieselbe Umbruch-Garantie wie im Baum
              (SektionBaumTOC) — kein horizontaler Overflow im [data-toc]. */}
          <span className="line-clamp-2 [overflow-wrap:anywhere]">
            <span className="num font-medium text-ink-800">{z.label}</span>
            {z.randtitel && <span className="text-ink-600"> — {margLabel(z.randtitel)}</span>}
            {z.aufgehoben && <span className="ml-1 text-micro text-ink-500">aufgehoben</span>}
          </span>
        </button>
      </div>
    </li>
  );
}

export function ArtikelIndex({ gruppen, aktivToken, onSprung, anhang }: ArtikelIndexProps) {
  if (gruppen.length === 0 && !anhang) return null;
  return (
    <div className="space-y-3">
      {gruppen.map((g, gi) => (
        // Zwischenkopf: nicht klappbar (§3.2 «vorhandene Abschnitte als
        // Zwischenköpfe») — nur eine ruhige Überschrift, kein Button/Chevron.
        // `kopf === null` (T4: NHG/VMWG, oder freie Zwischenartikel bei T3)
        // bleibt ohne Überschrift — nichts erfunden (§8).
        <div key={g.kopf ?? `frei-${gi}`}>
          {g.kopf && (
            <p className="mb-0.5 text-micro font-semibold uppercase tracking-wide text-ink-500 [overflow-wrap:anywhere]">
              {margLabel(g.kopf)}
            </p>
          )}
          <ul className="space-y-0.5">
            {g.zeilen.map((z) => (
              <Zeile key={z.token} z={z} aktiv={z.token === aktivToken} onSprung={onSprung} />
            ))}
          </ul>
        </div>
      ))}
      {anhang}
    </div>
  );
}
