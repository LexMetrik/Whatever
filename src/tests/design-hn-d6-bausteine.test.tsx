/**
 * W2·19-DESIGN-KONSISTENZ · HN-D6 PR 1 — Formular- und Bedien-Bausteine
 * (Herz-und-Nieren-Prüfung 24.9.2026: DK-02, DK-04, DK-08, DK-11, DK-12, DK-13,
 * DK-14, DK-23 und drei A11y-Übergaben).
 *
 * Zwei Arten von Sonden, je einmal rot gesehen (§6.7, Belege im PR):
 *
 *  · RENDER: was die neuen Bausteine `KantonFeld` und `DatenTabelle` AUSGEBEN —
 *    Form der Beschriftung, Reihenfolge, Optgroup, Zusatz, Klassen der Tabelle.
 *  · QUELLTEXT: dass die alten Bauformen nicht wiederkommen und die
 *    Handkopien nur noch SINKEN. Die Kantons-Ratsche hält je Datei die Höchstzahl
 *    der handgebauten `KANTONE.map(… <option`-Stellen aus dem Ist-Stand
 *    (34 Stellen in 30 Dateien, 30.9.2026): PR 2–4 ziehen die Formulare um und
 *    senken sie; eine NEUE Handkopie (oder eine Datei, die nicht gelistet ist)
 *    fällt auf. Kein Freibrief — dieselbe Bauweise wie die Knopf-Ratsche
 *    (`design-r9-knopf-baustein.test.ts`).
 *
 * §3: reine Darstellung — weder Frist noch Quote noch Gebühr wird hier berührt.
 */
import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { isValidElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { KantonFeld } from '../components/ui/KantonFeld';
import { DatenTabelle } from '../components/ui/DatenTabelle';
import { FristenKalender } from '../components/FristenKalender';
import { KANTONE, KANTON_NAMEN } from '../data/tarif/typen';
import type { Kanton } from '../types/legal';
import { alleTsx, liesOhneKommentare, rel } from './appDateien';

const CSS = readFileSync(new URL('../index.css', import.meta.url), 'utf8');
const optionen = (html: string) => [...html.matchAll(/<option value="([^"]*)"[^>]*>([^<]*)<\/option>/g)].map((m) => [m[1], m[2]]);

describe('DK-02 · KantonFeld — eine Beschriftung, eine Reihenfolge, eine Namensquelle', () => {
  const html = renderToStaticMarkup(<KantonFeld value="ZH" onChange={() => {}} aria-label="Kanton" />);

  it('26 Kantone in amtlicher Reihenfolge (BV Art. 1), je «KZ – Name» aus KANTON_NAMEN', () => {
    const o = optionen(html);
    expect(o.map(([v]) => v)).toEqual([...KANTONE]);
    expect(o).toHaveLength(26);
    for (const [v, text] of o) expect(text).toBe(`${v} – ${KANTON_NAMEN[v as Kanton]}`);
    expect(o[0]).toEqual(['ZH', 'ZH – Zürich']);
    expect(o[25]).toEqual(['JU', 'JU – Jura']);
  });

  it('keine der drei anderen Beschriftungsformen (Geviertstrich, «Name (KZ)», nur Kürzel)', () => {
    expect(html).not.toContain('—');
    expect(html).not.toMatch(/\([A-Z]{2}\)<\/option>/);
    for (const [v, text] of optionen(html)) expect(text, `nur Kürzel bei ${v}`).not.toBe(v);
  });

  it('wählt den Wert vor und trägt die Hausform `lc-input` (className hängt an)', () => {
    expect(html).toMatch(/<option value="ZH" selected="">/);
    expect(html).toContain('class="lc-input"');
    expect(html).toContain('aria-label="Kanton"');
    expect(renderToStaticMarkup(<KantonFeld value="BS" onChange={() => {}} className="w-full max-w-xs" />))
      .toContain('class="lc-input w-full max-w-xs"');
  });

  it('`kantone` = Reihenfolge-Ausnahme (BS zuerst, KombinierteAnsicht): der Baustein sortiert nie selbst', () => {
    const bsZuerst: Kanton[] = ['BS', 'BL', ...KANTONE.filter((k) => k !== 'BS' && k !== 'BL')];
    const o = optionen(renderToStaticMarkup(<KantonFeld value="BS" onChange={() => {}} kantone={bsZuerst} />));
    expect(o.map(([v]) => v).slice(0, 3)).toEqual(['BS', 'BL', 'ZH']);
    expect(o).toHaveLength(26);
  });

  it('`gruppen` = optgroup (Lohnfortzahlungs-Skalen); `zusatz` hängt den Hinweis des Aufrufers an', () => {
    const h = renderToStaticMarkup(
      <KantonFeld value="ZG" onChange={() => {}} zusatz={{ ZG: '⚠' }}
        gruppen={[{ label: 'Basler Skala', kantone: ['BS', 'BL'] }, { label: 'Berner Skala', kantone: ['ZG', 'BE'] }]} />,
    );
    expect(h).toContain('<optgroup label="Basler Skala">');
    expect(h).toContain('<optgroup label="Berner Skala">');
    expect(optionen(h)).toEqual([['BS', 'BS – Basel-Stadt'], ['BL', 'BL – Basel-Landschaft'], ['ZG', 'ZG – Zug ⚠'], ['BE', 'BE – Bern']]);
    // Ein Kanton ausserhalb jeder Gruppe erscheint nicht — die Zuordnung ist Sache des Aufrufers.
    expect(h).not.toContain('value="ZH"');
  });

  it('`leer` = Platzhalter-Option mit value="" (noch kein Kanton gewählt)', () => {
    const h = renderToStaticMarkup(<KantonFeld value="" onChange={() => {}} leer="– bitte wählen –" />);
    expect(optionen(h)[0]).toEqual(['', '– bitte wählen –']);
    expect(optionen(h)).toHaveLength(27);
  });

  it('reicht den gewählten Kanton-Code unverändert durch (`onChange` mit dem Wert, kein Umbau)', () => {
    const geaendert = vi.fn();
    const el = KantonFeld({ value: 'ZH', onChange: geaendert }) as ReactElement<{ onChange: (e: { target: { value: string } }) => void }>;
    expect(isValidElement(el)).toBe(true);
    el.props.onChange({ target: { value: 'TI' } });
    expect(geaendert).toHaveBeenCalledExactlyOnceWith('TI');
  });
});

describe('DK-14 · DatenTabelle — eine ruhige Grundform', () => {
  const html = renderToStaticMarkup(
    <DatenTabelle
      spalten={[{ kopf: 'Typ', zelle: 'text-ink-900' }, { kopf: 'Frist', ziffern: true }, { kopf: 'Normen' }]}
      zeilen={[{ key: 'a', zellen: ['Kauf', '10 Jahre', 'Art. 127 OR'] }]}
      className="min-w-[26rem]"
    />,
  );

  it('Kopf in ink-600 mit Haarlinie, Zeilen mit Haarlinie, Polster py-2 pr-4 (letzte Spalte ohne rechten Rand)', () => {
    expect(html).toContain('<table class="w-full text-body-s border-collapse min-w-[26rem]">');
    expect(html).toContain('<tr class="text-left text-ink-600 border-b border-line">');
    expect(html).toContain('<th class="py-2 pr-4 font-medium">Typ</th>');
    expect(html).toContain('<th class="py-2 font-medium">Normen</th>');
    expect(html).toContain('<tr class="border-b border-line align-top">');
    expect(html).toContain('<td class="py-2 pr-4 text-ink-900">Kauf</td>');
    expect(html).toContain('<td class="py-2">Art. 127 OR</td>');
  });

  it('Zahlenspalte: rechtsbündig, Tabellenziffern (`num`, die eine Ziffern-Klasse), kein Umbruch — im Kopf wie in der Zelle', () => {
    expect(html).toContain('<th class="py-2 pr-4 font-medium text-right whitespace-nowrap">Frist</th>');
    expect(html).toContain('<td class="py-2 pr-4 num text-right whitespace-nowrap">10 Jahre</td>');
  });
});

describe('Quelltext-Sonden — die alten Bauformen kommen nicht wieder', () => {
  const ohne = (p: string) => liesOhneKommentare(new URL(`../${p}`, import.meta.url).pathname);

  it('DK-02 · Einstellungen baut keine eigene Kantonsliste mehr', () => {
    const q = ohne('pages/Einstellungen.tsx');
    expect(q).toContain('<KantonFeld');
    expect(q).not.toMatch(/KANTONE\.map\(/);
  });

  /** Ist-Stand 30.9.2026 (`node`-Zählung, PR-Body): je Datei die Höchstzahl. */
  const HANDKOPIEN: Record<string, number> = {
    'components/forms/AllgemeineFristForm.tsx': 2, 'components/forms/BeurkundungForm.tsx': 1,
    'components/forms/BgerRechtswegForm.tsx': 1, 'components/forms/EinfacheFristForm.tsx': 1,
    'components/forms/ErbFristenForm.tsx': 1, 'components/forms/EreignisFristen.tsx': 3,
    'components/forms/GewaehrleistungForm.tsx': 1, 'components/forms/GrundbuchEintragForm.tsx': 1,
    'components/forms/KombinierteAnsicht.tsx': 1, 'components/forms/LohnfortzahlungForm.tsx': 1,
    'components/forms/MietrechtForm.tsx': 1, 'components/forms/NotariatGrundbuchForm.tsx': 1,
    'components/forms/ProzesskostenForm.tsx': 1, 'components/forms/SchkgFristenForm.tsx': 1,
    'components/forms/SchkgZustaendigkeitTeil.tsx': 1, 'components/forms/StrafZustaendigkeitTeil.tsx': 2,
    'components/forms/VerjaehrungForm.tsx': 1, 'components/forms/VerjaehrungSchnellForm.tsx': 1,
    'components/forms/ZpoFristenForm.tsx': 1, 'components/forms/ZustaendigkeitForm.tsx': 1,
    'components/vorlagen/GerichtsWahlBlock.tsx': 1, 'components/vorlagen/GmbhDokumentmappe.tsx': 1,
    'pages/VorlageArbeitsvertrag.tsx': 1, 'pages/VorlageKapitalerhoehung.tsx': 1,
    'pages/VorlageKuendigungMieter.tsx': 1, 'pages/VorlageKuendigungVermieter.tsx': 1,
    'pages/VorlageMietvertrag.tsx': 1, 'pages/VorlageSchlichtungsgesuchBs.tsx': 1,
    'pages/VorlageVorsorgeauftrag.tsx': 1, 'pages/vorlage-ag-gruendung/schritte-eingabe.tsx': 1,
  };

  it('DK-02 · Ratsche: handgebaute `KANTONE.map(… <option` nur noch in der Liste — und nie mehr als dort', () => {
    const ist: Record<string, number> = {};
    for (const p of alleTsx()) {
      const n = liesOhneKommentare(p).match(/KANTONE\.map\(\s*\(\w+\)\s*=>\s*(?:\(\s*)?<option/g)?.length ?? 0;
      if (n > 0) ist[rel(p)] = n;
    }
    const zuViele = Object.entries(ist).filter(([d, n]) => n > (HANDKOPIEN[d] ?? 0)).map(([d, n]) => `${d}: ${n} > ${HANDKOPIEN[d] ?? 0}`);
    expect(zuViele, 'neue Handkopie einer Kantonsauswahl — `ui/KantonFeld` nehmen (§5/§10)').toEqual([]);
    const geraeumt = Object.keys(HANDKOPIEN).filter((d) => (ist[d] ?? 0) < HANDKOPIEN[d]);
    // Eine geräumte Datei senkt die Zahl hier — sie blockiert nichts, sie fällt nur auf.
    if (geraeumt.length > 0) console.warn(`Ratsche senken: ${geraeumt.join(', ')}`);
  });

  it('DK-04 · kein Sperrereignis-Feld in `text-xs` (Feldgrösse = Hausstandard 16 px)', () => {
    for (const f of ['components/forms/SperrereignisseEditor.tsx', 'components/forms/KombinierteAnsicht.tsx']) {
      expect(ohne(f), f).not.toMatch(/inputCls \+ ' text-xs'/);
    }
  });

  it('DK-13 · die Gefahr-Aktion trägt `lc-btn-danger` statt einer handgebauten Knopf-Form', () => {
    expect(CSS).toMatch(/\.lc-btn-danger\s*\{/);
    expect(CSS).toMatch(/\.lc-btn-danger:disabled/);
    const q = ohne('pages/Einstellungen.tsx');
    expect(q).toContain('lc-btn-danger');
    expect(q).not.toMatch(/rounded-lg border border-danger-line/);
  });

  it('DK-11 · Deaktiviert-Rolle: kein `disabled:opacity-40` mehr, die Rolle steht einmal in index.css', () => {
    expect(CSS).toMatch(/\.lc-deaktiviert:disabled\s*\{\s*opacity:\s*\.4;/);
    const rest = alleTsx().filter((p) => /disabled:opacity-40/.test(liesOhneKommentare(p))).map(rel);
    // Damals (#1191) blieb MappenDialog als FÜLL-Knopf (`lc-btn-primary`) stehen — dort trägt
    // `.lc-btn-primary:disabled` die Fläche. Seit #1194 (30.9.2026) ist die doppelte Dämpfung dort
    // entfernt; die Liste ist leer und bleibt es.
    expect(rest).toEqual([]);
  });

  it('DK-12 · Hover-Rolle «Aktion»: `lc-hover-akzent` in index.css, die geteilten Bausteine nutzen sie', () => {
    expect(CSS).toMatch(/\.lc-hover-akzent:hover\s*\{\s*background-color:\s*var\(--brass-100\)/);
    for (const f of ['components/ErgebnisAnzeige.tsx', 'components/DatumsFeld.tsx']) {
      const q = ohne(f);
      expect(q, f).toContain('lc-hover-akzent');
      expect(q, f).not.toMatch(/hover:bg-brass-100\b/);
    }
  });

  it('DK-08 · Tippziel-Polster: Klasse in index.css (nur Token/rem, keine rohe Zahl), Katalog-Link und Pflicht-Hinweis tragen sie', () => {
    expect(CSS).toMatch(/\.lc-tap-polster\s*\{\s*padding-block:\s*\.3125rem;\s*margin-block:\s*-\.3125rem;\s*\}/);
    expect(ohne('components/ZweiachsigerEinstieg.tsx')).toContain('lc-tap-polster');
    expect(ohne('components/PflichtDisclaimer.tsx')).toMatch(/<summary className="[^"]*lc-tap-polster/);
    // Normkürzel-Zeile: das Polster wird durch den Aussenrand ausgeglichen (Text bleibt, wo er war).
    const norm = CSS.slice(CSS.indexOf('.lc-normzeile [role="button"].lc-chip,'));
    expect(norm).toMatch(/padding-inline:\s*\.25rem;\s*margin-inline:\s*-\.25rem -\.125rem;\s*min-width:\s*var\(--tap-ziel\)/);
  });

  it('DK-23 · «bziffert» ist weg; der 404-Weiterweg führt auf die Kataloge, nicht auf «/»', () => {
    expect(readFileSync(new URL('../pages/RechnerInkassoStrecke.tsx', import.meta.url), 'utf8')).not.toMatch(/\bbziffert\b/);
    const nf = ohne('pages/NotFound.tsx');
    expect(nf).toContain("to: '/rechner'");
    expect(nf).toContain("to: '/vorlagen'");
    expect(nf).not.toMatch(/to: '\/',/);
  });

  it('A11y · Stichtag trägt seinen Namen am Feld; der Fristen-Satz nennt einen Tag nicht doppelt; leere Landmarke entfällt', () => {
    expect(ohne('components/forms/VerzugszinsForm.tsx')).toContain('aria-label="Stichtag (Berechnung bis)"');
    expect(ohne('components/FristenKalender.tsx')).toMatch(/aQuoISO === ereignisISO \? ''/);
    expect(ohne('components/layout/OrtsAngabe.tsx')).toMatch(/const leer = krumen\.length === 0 && !artikel;/);
  });

  it('A11y · Fristen-Satz für Screenreader: fallen Ereignis und Fristbeginn auf einen Tag, steht er einmal; sonst bleiben beide', () => {
    const satz = (ereignisISO: string) => {
      const h = renderToStaticMarkup(
        <FristenKalender ereignisISO={ereignisISO} aQuoISO="2026-01-05" adQuemISO="2026-03-04" kanton="BS"
          stillstandAktiv={false} feiertage={false}
          labels={{ ereignis: 'Beginn der Verhinderung', aquo: 'Beginn der Verhinderung', adquem: 'Letzter bezahlter Tag' }} />,
      );
      return /<p class="sr-only">([^<]*)<\/p>/.exec(h)![1];
    };
    expect(satz('2026-01-05')).toBe('Fristenlauf: Beginn der Verhinderung am 5.1.2026, Letzter bezahlter Tag am 4.3.2026.');
    expect(satz('2026-01-02')).toBe('Fristenlauf: Beginn der Verhinderung am 2.1.2026, Beginn der Verhinderung am 5.1.2026, Letzter bezahlter Tag am 4.3.2026.');
  });

  it('A11y · Landmarke: leere Ortsangabe wird ein `div`, eine gefüllte bleibt `nav` mit Namen', async () => {
    const { OrtsAngabe } = await import('../components/layout/OrtsAngabe');
    const leer = renderToStaticMarkup(<OrtsAngabe navLabel="Brotkrümel" />);
    expect(leer).not.toContain('<nav');
    expect(leer).not.toContain('aria-label');
    const voll = renderToStaticMarkup(<OrtsAngabe breadcrumb={[{ label: 'Gesetze' }]} navLabel="Brotkrümel" />);
    expect(voll).toContain('<nav aria-label="Brotkrümel"');
  });
});
