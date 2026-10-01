import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ArtikelHistorieZeile } from '../pages/gesetz-leser/parts/ArtikelHistorie';
import type { ArtikelHistorie } from '../lib/normtext/historie-laden';

// W2·27-BUND-FERTIG · P7 #11 (1.10.2026): die Zeitleiste nennt bei «Ursprünglich» die ALTE Bezeichnung (`frueher`),
// die der Parser aus der Fussnote liest (src/tests/normtext-historie-p7-w227.test.ts). Reine Darstellung (§3): die
// Komponente setzt, was der Shard liefert, in Anführungszeichen (Wortlaut der Fussnote); ein Datum zeigt sie nur,
// wenn der Shard eins trägt — bei der Ur-Bezeichnung nie (§7).

const E = { wirkung: false, quellen: [], absatz: null, item: null } as const;
const html = (h: ArtikelHistorie) => renderToStaticMarkup(<ArtikelHistorieZeile historie={h} zeitleiste />);

describe('ArtikelHistorie · Ursprünglich + alte Bezeichnung', () => {
  const h: ArtikelHistorie = {
    giltSeit: '2023-01-01',
    ereignisse: [
      { ...E, typ: 'urspruenglich', datum: null, absatz: '1', item: 'cquater', frueher: 'Bst. c, dann c' },
      { ...E, typ: 'eingefuegt', datum: '2023-01-01', absatz: '1', item: 'cquater' },
    ],
  };

  it('«Ursprünglich · Abs. 1 · lit./Ziff. cquater · «Bst. c, dann c»» — Bezeichnung in Anführungszeichen, ohne Datum', () => {
    const t = html(h).replace(/<[^>]+>/g, '');
    expect(t).toContain('Ursprünglich · Abs. 1, lit./Ziff. cquater · «Bst. c, dann c»');
    // Das Datum 2023 steht nur am Folge-Ereignis «Eingefügt», nie an der Ur-Bezeichnung.
    expect(t).toMatch(/Ursprünglich[^E]*«Bst\. c, dann c»Eingefügt/);
  });

  it('ohne frueher bleibt die Zeile Zeichen für Zeichen wie bisher (kein leeres «»)', () => {
    const t = html({ giltSeit: null, ereignisse: [{ ...E, typ: 'urspruenglich', datum: null }] }).replace(/<[^>]+>/g, '');
    expect(t).toContain('Ursprünglich');
    expect(t).not.toContain('«');
  });

  it('andere Ereignis-Typen zeigen nie «…» (nur urspruenglich trägt frueher)', () => {
    const t = html({ giltSeit: '2020-01-01', ereignisse: [{ ...E, typ: 'fassung', datum: '2020-01-01' }] }).replace(/<[^>]+>/g, '');
    expect(t).not.toContain('«');
  });
});
