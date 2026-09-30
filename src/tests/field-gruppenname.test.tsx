// Field: auch ein zusammengesetztes Control (div-Wrapper) bekommt seinen Namen
// (W2·19 P12, 30.9.2026). Vorher: ein `div` ist nicht beschriftbar, `htmlFor`
// blieb leer, das Control darin hiess nur nach seinem Platzhalter; lokal war das
// nur in VerzugszinsForm per `aria-label` behoben (HN-D6-Übergabe DK-Bericht).
// Jetzt trägt der Baustein es selbst: `role="group"` + `aria-labelledby` auf das
// Label. Kein DOM-Environment im Haus — der zugängliche Name wird aus dem
// gerenderten Markup gelesen (Label-id ↔ aria-labelledby/htmlFor).
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Field } from '../components/vorlagen/ui';

const labelId = (html: string): string => /<label id="([^"]+)"/.exec(html)![1];

describe('Field: zugänglicher Name je Kind-Art', () => {
  it('natives input: Label verweist per htmlFor auf die id des Controls', () => {
    const html = renderToStaticMarkup(<Field label="Betrag"><input className="x" /></Field>);
    const fuer = /for="([^"]+)"/.exec(html)![1];
    expect(html).toMatch(new RegExp(`<input[^>]* id="${fuer}"`));
    expect(html).not.toContain('role="group"');
  });

  it('div-Wrapper (Datum + Knopf): role=group, benannt nach dem Label', () => {
    const html = renderToStaticMarkup(
      <Field label="Stichtag"><div className="flex"><input className="a" /><button type="button">heute</button></div></Field>);
    expect(html).toContain(`role="group"`);
    expect(html).toContain(`aria-labelledby="${labelId(html)}"`);
    expect(html).toContain('>Stichtag</label>');
  });

  it('fieldset: aria-labelledby ohne doppelte Rolle', () => {
    const html = renderToStaticMarkup(<Field label="Auswahl"><fieldset><input /></fieldset></Field>);
    expect(html).toContain(`aria-labelledby="${labelId(html)}"`);
    expect(html).not.toContain('role="group"');
  });

  it('eigener Name oder eigene Rolle des Wrappers hat Vorrang (keine Überschreibung)', () => {
    const mitName = renderToStaticMarkup(<Field label="Zahl"><div aria-label="Eigener Name"><input /></div></Field>);
    expect(mitName).toContain('aria-label="Eigener Name"');
    expect(mitName).not.toContain('role="group"');
    expect(mitName).not.toContain('aria-labelledby');
    const mitRolle = renderToStaticMarkup(<Field label="Zahl"><div role="radiogroup"><input /></div></Field>);
    expect(mitRolle).toContain('role="radiogroup"');
    expect(mitRolle).not.toContain('role="group"');
    expect(mitRolle).not.toContain('aria-labelledby');
  });
});
