// H-10 (§6.6 billig, B27): reiner Move aus Gesetze.tsx — Props/Verhalten unverändert.
import { useMemo, useState } from 'react';
import { GruppenKopf } from '../../components/ui/GruppenKopf';
import { ErlassTabelle } from '../../components/normtext/ErlassKarte';
import { type BrowseErlass } from '../../lib/normtext/browse-typen';
import {
  sachgruppe, topTitel, subTitel, sachgebietRang, untergruppeRang, srVergleich, type KantonSystematik,
} from '../../lib/normtext/systematik';
import { Kategorie } from './geteilt';

// SysZeile (kompakte, überlaufsichere Kanton-Erlass-Zeile) + standJahr leben
// jetzt in ErlassKarte.tsx (geteilt mit den Relevanz-/Rechtsgebiet-Sichten,
// GesetzeGliederung.tsx) — A14-Titelumbruch dort. Hier nur importiert.

// Ein gewählter Kanton, gegliedert nach der OFFIZIELLEN Systematik (systematik.ts:
// Top-Sachgebiet + Untergruppe aus dem amtlichen clex-Baum). Übersicht zuerst:
// alle Top-Sektionen eingeklappt (Sachgebiete des Kantons auf einen Blick), Klick
// öffnet eine; «Alle auf-/zuklappen». Im Inneren je Untergruppe ein Zwischen-
// titel, darunter nach SR-Nr sortierte Zeilen. Die Seiten-Suche liefert die
// flache Trefferliste — diese gegliederte Ansicht zeigt sich nur ohne Suche.
export function KantonSystematik(
  { erlasse, sys, sysGeladen = true }:
  { erlasse: BrowseErlass[]; sys?: KantonSystematik; sysGeladen?: boolean },
) {
  const gruppen = useMemo(() => {
    const rangTop = sachgebietRang(sys);
    const tops = new Map<string, Map<string, BrowseErlass[]>>();
    for (const e of erlasse) {
      const { top, sub } = sachgruppe(sys, e.sr);
      if (!tops.has(top)) tops.set(top, new Map());
      const subs = tops.get(top)!;
      if (!subs.has(sub)) subs.set(sub, []);
      subs.get(sub)!.push(e);
    }
    const alle = [...tops.entries()]
      .sort((a, b) => rangTop(a[0]) - rangTop(b[0]) || a[0].localeCompare(b[0], 'de', { numeric: true }))
      .map(([top, subs]) => {
        const rangSub = untergruppeRang(sys, top);
        const anzahl = [...subs.values()].reduce((n, arr) => n + arr.length, 0);
        const untergruppen = [...subs.entries()]
          .sort((a, b) => rangSub(a[0]) - rangSub(b[0]) || a[0].localeCompare(b[0], 'de', { numeric: true }))
          .map(([sub, items]) => ({
            sub,
            titel: subTitel(sys, top, sub),
            items: items.sort((a, b) => srVergleich(a.sr, b.sr) || a.titel.localeCompare(b.titel, 'de')),
          }));
        // amtlich = das Top-Sachgebiet trägt einen verifizierten Namen aus dem
        // Systematik-Baum. `false` = Fallback-Bucket (Sammlungs-Kürzel «LS»/«bGS»
        // oder «~» ohne Nummer), das sonst als vermeintliches Sachgebiet in die UI
        // lecken würde (§4.3.5). Reine Anzeige-Prüfung auf der `sys`-Prop (§3).
        const amtlich = !!sys?.roots.find((x) => x.nummer === top);
        return { top, amtlich, titel: topTitel(sys, top), anzahl, untergruppen };
      });
    // Roh-Code→Klartext (Gesetzes-UX G5 · §4.3.5): Buckets ohne amtlichen
    // Sachgebiets-Namen (interne Sammlungs-Kürzel «LS»/«bGS» oder «~» ohne Nummer,
    // die sonst als vermeintliches Sachgebiet «Bereich LS» in die UI lecken) werden
    // ehrlich zu EINEM «Nicht systematisiert»-Block gebündelt (§8). Der Roh-Code
    // bleibt je Erlass an der systematischen Nummer sichtbar (SysZeile); erfunden
    // wird kein Sachgebietsname.
    const amtlich = alle.filter((g) => g.amtlich);
    const rest = alle.filter((g) => !g.amtlich);
    if (rest.length === 0) return amtlich;
    const restItems = rest
      .flatMap((g) => g.untergruppen.flatMap((u) => u.items))
      .sort((a, b) => srVergleich(a.sr, b.sr) || a.titel.localeCompare(b.titel, 'de'));
    return [
      ...amtlich,
      {
        top: '__nicht_systematisiert__', amtlich: false, titel: 'Nicht systematisiert',
        anzahl: restItems.length,
        untergruppen: [{ sub: '', titel: '', items: restItems }],
      },
    ];
  }, [erlasse, sys]);

  // ── K-2e/F43 (W2·13-KANTONE, 31.8.2026) · «NICHT SYSTEMATISIERT» IST UNSERE
  //    LÜCKE, NICHT DIE DES KANTONS ────────────────────────────────────────────
  // GEMESSEN am 31.8.2026: `public/normtext/kanton-systematik.json` führt 19 der
  // 26 Kantone; sieben (ZH GE VD TI SZ NE JU) haben keinen Baum. Dort fällt
  // JEDER Erlass in den Fallback-Block, und die Seite bestand aus einem einzigen
  // grauen «Nicht systematisiert». Das las sich als Eigenschaft des Kantons —
  // als hätte er keine Systematik. Er hat eine; sie ist bei UNS noch nicht
  // erfasst (Daten-Nachzug, eigener Roadmap-Schritt). §8 verlangt, dass die
  // Zeile sagt, wessen Lücke sie ist.
  //
  // KEINE ZUSAGE MIT DATUM: «folgt später» ist belegbar (der Schritt steht im
  // Plan), «folgt im September» wäre ein Versprechen, das diese Datei nicht
  // halten kann.
  //
  // Die Weiche fragt den BAUM, nicht die Gruppen: ein Kanton kann einen Baum
  // haben und trotzdem einen Fallback-Block führen (einzelne Erlasse ohne
  // amtliche Nummer). Dort ist nichts offen, und der Hinweis wäre falsch.
  // ── NACHZUG 6.9.2026 (§15.2/§8, CI-Flake `gesetze-footer-cls`) ────────────
  // Die Weiche fragt den Baum — aber erst, wenn er ÜBERHAUPT SCHON DA IST.
  // Solange die Bäume laden, ist «kein Baum» keine Auskunft, sondern eine
  // Vermutung; sie stand 19 von 26 Kantonen für einen Moment fälschlich an
  // (Messung und Herleitung: `pages/Gesetze.tsx` beim `systematik`-Zustand).
  // ROT ZU BEKOMMEN (§6.7): `sysGeladen` aus der Bedingung streichen ⇒ auf
  // `/gesetze?ebene=kanton&kt=ZH` springt die Zeile «Alle aufklappen» unter
  // Drossel wieder um 54 px, und der Hinweis blitzt für einen Kanton auf, der
  // sehr wohl einen amtlichen Baum hat.
  const ohneAmtlichenBaum = sysGeladen && (sys?.roots.length ?? 0) === 0;

  const alleIds = gruppen.map((g) => g.top);
  const [offen, setOffen] = useState<Set<string>>(() => new Set());
  const alleOffen = alleIds.length > 0 && offen.size >= alleIds.length;
  const toggle = (id: string) => setOffen((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleAlle = () => setOffen(alleOffen ? new Set() : new Set(alleIds));

  return (
    <div className="space-y-3">
      {ohneAmtlichenBaum && gruppen.length > 0 && (
        <p data-kanton-systematik-offen className="text-body-s text-ink-500 max-w-reading">
          Die amtliche Systematik dieses Kantons ist noch nicht hinterlegt — die
          Erlasse stehen darum nach ihrer systematischen Nummer geordnet. Die
          Sachgebiete folgen mit einem späteren Daten-Nachzug.
        </p>
      )}
      <div className="flex justify-end">
        <button type="button" onClick={toggleAlle}
          className="text-body-s font-medium text-reg-g underline decoration-1 underline-offset-4 hover:decoration-2">
          {alleOffen ? 'Alle einklappen' : 'Alle aufklappen'}
        </button>
      </div>
      {gruppen.map((g) => (
        <Kategorie key={g.top} offen={offen.has(g.top)} onToggle={() => toggle(g.top)} anzahl={g.anzahl}
          kopf={
            g.amtlich ? (
              <span className="flex items-baseline gap-2.5 min-w-0">
                <span aria-hidden className="num font-display text-h3 leading-none text-reg-g shrink-0">{g.top}</span>
                {/* N10: nicht hart einzeilig kürzen (lange Sachgebietstitel werden auf
                    Mobil sonst abgeschnitten) — bis zu zwei Zeilen, dann erst ellipsis. */}
                <span className="font-sans font-semibold text-ink-900 text-h3 tracking-tight line-clamp-2">{g.titel}</span>
              </span>
            ) : (
              // Fallback-Block (§4.3.5): KEIN Roh-Code-Badge — der Sammlungs-Code ist
              // kein Sachgebiet. Ehrlicher, gedämpfter Kopf (§8).
              <span className="flex flex-col min-w-0">
                <span className="font-sans font-semibold text-ink-700 text-h3 tracking-tight line-clamp-2">{g.titel}</span>
                <span className="text-body-s text-ink-500 font-normal">Kein amtliches Sachgebiet hinterlegt — nach systematischer Nummer geordnet.</span>
              </span>
            )
          }>
          <div className="space-y-4">
            {g.untergruppen.map((u) => (
              <section key={u.sub || '_'} className="space-y-1.5">
                {/* C-7 (31.8.2026): der Zähler stand als «· 12» hier; nackte
                    Zahl ist Kanon. Anatomie und Haarlinie liegen jetzt im
                    geteilten `GruppenKopf` — mitgezogen ist dorthin auch der
                    DESIGN-D0-Befund (unsuffixiertes `bg-line`, weil Tailwinds
                    Deckkraft-Suffix auf dem color-mix-Token `--line` keine
                    CSS-Regel erzeugt). */}
                {u.titel && (
                  <GruppenKopf stufe={4} titel={u.titel} zahl={u.items.length}
                    marke={<span aria-hidden className="num text-xs text-reg-g shrink-0">{u.sub}</span>} />
                )}
                {/* D24: EIN Raster über beide Spalten (s. `ui/ListenTabelle`). */}
                <ErlassTabelle erlasse={u.items}
                  beschriftung={`${u.titel || g.titel} — Nummer, Titel, Umfang`} />
              </section>
            ))}
          </div>
        </Kategorie>
      ))}
    </div>
  );
}
