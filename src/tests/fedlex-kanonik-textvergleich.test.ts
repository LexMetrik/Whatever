// Monitor-Rückbau 5.10.2026: Kanonik-Wechsel ohne Textänderung färbt den Normen-Monitor nicht
// mehr rot (scripts/fedlex-versionen-pruefen.ts --kanonik-textvergleich). Fall belegt am OR
// 20261001 html-2 → html-3: einzige Änderung <i>…</i> → <span class="man-link-no-link">…</span>.
import { describe, it, expect } from 'vitest';
import { sichtbarerText, gepinnteHtmlUrl } from '../../scripts/fedlex-versionen-pruefen';

describe('sichtbarerText', () => {
  it('reines Markup-Republish (OR html-2→3) ⇒ gleicher Text', () => {
    const alt = '<p>Ziff. I, <i>921</i>, <i>\n<b>1971</b> 751</i>; <a href="x">BBl</a></p>';
    const neu = '<p>Ziff. I, <span class="man-link-no-link">921</span>, <span class="man-link-no-link">\n<b>1971</b> 751</span>; <a href="x">BBl</a></p>';
    expect(sichtbarerText(alt)).toBe(sichtbarerText(neu));
  });
  it('geänderter Wortlaut ⇒ ungleicher Text (bleibt ROT)', () => {
    expect(sichtbarerText('<p>Die Frist beträgt <b>30</b> Tage.</p>'))
      .not.toBe(sichtbarerText('<p>Die Frist beträgt <b>20</b> Tage.</p>'));
  });
  it('Skript-/Stilblöcke zählen nicht zum Text', () => {
    expect(sichtbarerText('<style>p{}</style><p>A</p><script>var x=1</script>')).toBe('A');
  });
});

describe('gepinnteHtmlUrl (wie fedlex-cache.sh)', () => {
  it('n>0 ⇒ -N-Suffix', () => {
    expect(gepinnteHtmlUrl({ eli: 'cc/27/317_321_377', konsKompakt: '20261001', n: 2 })).toBe(
      'https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli/cc/27/317_321_377/20261001/de/html/fedlex-data-admin-ch-eli-cc-27-317_321_377-20261001-de-html-2.html');
  });
  it('n=0 ⇒ Alias-URL ohne Suffix', () => {
    expect(gepinnteHtmlUrl({ eli: 'cc/2018/801', konsKompakt: '20261001', n: 0 })).toBe(
      'https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli/cc/2018/801/20261001/de/html/fedlex-data-admin-ch-eli-cc-2018-801-20261001-de-html.html');
  });
});
