/**
 * V2·C-2 (Farb-Wörterbuch Teil 2, §4b-B) — Referenzschicht-Farbtöne.
 *
 * ERGÄNZT 2.10.2026 (Rückbau Rechtsprechungs-Zeilen, W2·17-UI-BEFUNDE): Block (1)
 * unten prüfte den Farbpunkt der «Leitfälle»-Overline an `LeitfallZeile` — die
 * Komponente ist zurückgebaut (unerreichbar seit M3/B4), der Fall entfällt mit ihr.
 * Der Punkt-Ton `lc-punkt-entscheid` lebt in `KontextGruppe` und ist durch
 * `v2-c3-farbwoerterbuch.test.tsx` belegt.
 *
 * Belegt die zwei C-2-Bausteine als reine Tick-/Punkt-Farbwahl (Anatomie
 * unverändert, CLS 0):
 *   (1) Overline-Farbpunkte: «Leitfälle» trägt den slate-Punkt (Rechtsprechung),
 *       «Verweise» den brass-Default — redundant zum Wortlabel (aria-hidden).
 *   (2) Currency-Aussagen: Fassungsvorbehalt in der warn-Rolle, Standausweis
 *       neutral. Das «(maschinell)»-Wortfeld bleibt tragend (§7/§8: keine
 *       fachliche-Abnahme-Suggestion).
 *
 * NEU GEFASST W2·5m-LESER-V3/S3 (Skizze Kap. 4e + Entscheid F5, 16.8.2026):
 * Block (2) prüfte bis dahin die zwei TICK-KLASSEN `lc-chip-geltend` (sage) und
 * `lc-chip-vorbehalt` (warn) am Erlass-Kopf. S3 nimmt dem Kopf die Chip-Optik
 * ganz — es gibt dort keine Chips mehr, an denen ein Tick sitzen könnte. Die
 * Prüfung wird deshalb nicht gestrichen, sondern auf das umgestellt, was die
 * Klassen TRUGEN und was allein zählt: der Fassungsvorbehalt bleibt in der
 * warn-Rolle sichtbar, der Standausweis bleibt neutral und maschinell
 * beschriftet. Farbe war ohnehin nie alleiniger Bedeutungsträger (§13/B3) —
 * das Wort trägt, der Ton verstärkt. Der Wortlaut wird gegen die EINE Quelle
 * `lib/normtext/erlassKopfText` geprüft, nicht gegen eine Kopie (§5).
 *
 * OFFEN (im PR deklariert): `lc-chip-geltend`/`lc-chip-vorbehalt` sind damit in
 * `src/` unbenutzt. Ihr Rückbau berührt das Farb-Wörterbuch in
 * DESIGN-REGLEMENT.md §N-4b-B und ist als eigener Schritt geführt, nicht als
 * Nebenwirkung dieses UI-PR.
 */
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ErlassLeserKopf } from '../pages/gesetz-leser/parts/ErlassLeserKopf';
import type { BrowseErlass } from '../lib/normtext/browse-typen';
import type { CurrencyEintrag } from '../lib/normtext/browse';
import { naechsteFassungSatz, standausweisSatz } from '../lib/normtext/erlassKopfText';

const erlass: BrowseErlass = {
  key: 'OR', ebene: 'bund', kanton: null, kuerzel: 'OR', titel: 'Obligationenrecht', sr: '220',
  rechtsgebiet: 'privat', sprache: 'de', rang: 0, status: 'snapshot',
  datei: 'bund/OR.json', artikelAnzahl: 1, stand: '2026-01-01', quelleUrl: 'https://x', fassungsToken: '20260101',
  pdfPfad: null,
};

// Partial: die Real-Sidecars führen `geprueftAm` immer, aber der Renderer gated
// jeden Chip einzeln (`currency?.geprueftAm && …`) — die Test-Matrix deckt darum
// auch die Einzelfälle (nur künftige Fassung / leer) ab.
const ssrKopf = (currency: Partial<CurrencyEintrag>) => renderToString(
  <ErlassLeserKopf erlass={erlass} overline="Bund" artikelAnzahl={1} hinweis="" currency={currency as CurrencyEintrag} />,
);

describe('C-2 (2) — Currency-Aussagen im Erlass-Kopf (S3-Fassung)', () => {
  it('Standausweis: F5-Wortlaut aus der EINEN Quelle, «(maschinell)» tragend', () => {
    const out = ssrKopf({ geprueftAm: '2026-01-15' });
    expect(out).toContain(standausweisSatz('2026-01-15'));
    expect(out).toContain('(maschinell)');
    // §7/§8: kein «gegengeprüft/verifiziert» — Freshness ist maschinell, keine Abnahme.
    expect(out).not.toMatch(/gegengeprüft|verifiziert/);
    // Der Standausweis ist ein neutraler Befund, kein Vorbehalt — er darf sich
    // die warn-Rolle nicht ausleihen (EIN Ton = EIN Sinn, §4b-B).
    expect(out).not.toMatch(/text-warn-700[^<]*gegen Fedlex-Konsolidierung/);
  });

  it('Fassungsvorbehalt bleibt in der warn-Rolle sichtbar', () => {
    const out = ssrKopf({ naechsteFassungAb: '2027-01-01' });
    expect(out).toContain(naechsteFassungSatz('2027-01-01'));
    expect(out).toContain('text-warn-700');
  });

  it('ohne Currency-Daten keine Currency-Aussage (kein toter Marker)', () => {
    const out = ssrKopf({});
    expect(out).not.toContain('geprüft am');
    expect(out).not.toContain('nächste Fassung ab');
    expect(out).not.toContain('text-warn-700');
  });

  it('S3: die Chip-Optik ist im Erlass-Kopf weg (Skizze 4e / Ä6)', () => {
    const out = ssrKopf({ geprueftAm: '2026-01-15', naechsteFassungAb: '2027-01-01' });
    expect(out).not.toContain('lc-chip-zeile');
    expect(out).not.toContain('lc-chip-geltend');
    expect(out).not.toContain('lc-chip-vorbehalt');
    // Die Aktionen-Zeile bleibt Slot-kompatibel (`.lc-chip` als Anker), wird
    // aber über `.lc-kopf-aktionen` entkastet (index.css).
    expect(out).toContain('lc-kopf-aktionen');
  });
});
