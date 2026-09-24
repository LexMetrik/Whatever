// ─── RL-12 PR 2 · Status-Ehrlichkeit am Werkzeug-Kopf (W2·30-RL-W1, R3-06) ──
//
// BEFUND R3-06 (Prüfung Rechtslogik 23.9.2026, hoch): der Prüfstand
// «Entwurf» stand nur an der Katalog-Zeile. Wer eine Rechner- oder
// Vorlagen-Seite per Direktlink oder aus der Suchmaschine öffnet, sah keinen
// Status — §8 verlangt, dass der echte Prüfstand dort sichtbar ist, wo das
// Werkzeug benutzt wird.
//
// ZUSICHERUNG je gebauter Katalog-Route (`katalogRouten()`, alle Rechner und
// Vorlagen — damit jede Oberkategorie abgedeckt):
//   · der Titelblatt-Band (`.wk-kopf`) trägt eine Status-Marke
//     `[data-werkzeug-status]` mit dem Status DER KARTE, die die Seite vertritt
//     (`metaFuerPfad(pfad).karte` — dieselbe Zuordnung wie Titel/Canonical);
//   · Karte «entwurf» ⇒ Marke «Entwurf» (lc-badge-entwurf) + Kurzsatz, beide
//     im Wortlaut der EntwurfLegende (Quelle: deren Render, nicht kopiert);
//   · Vorlagen behalten ihr Formvorschrift-Etikett (`[data-formgate]`) genau
//     einmal im Band — der Status kommt dazu, nichts wird überschrieben.
// Dazu: Routen unter /rechner|/vorlagen ohne Karte werden als Befund gelistet
// (nicht geraten) — Soll: keine.
//
// Rot-Beweis (§6.7): vor dem Fix fehlt die Marke auf allen 50 Routen.
import { describe, it, expect, beforeAll } from 'vitest';
import type { ComponentProps } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { prerenderToNodeStream } from 'react-dom/static';
import { MemoryRouter } from 'react-router-dom';
import { parseHTML } from 'linkedom';
import { LocaleProvider } from '../components/locale';
import { EntwurfLegende } from '../components/EntwurfLegende';
import { WerkzeugKopf } from '../components/layout/WerkzeugKopf';
import { ROUTEN_MANIFEST } from '../routesManifest';
import { katalogRouten, metaFuerPfad } from '../lib/seo';
import { OBERKATEGORIEN, kategorieFuer } from '../lib/oberkategorien';

const txt = (el: Element | null | undefined) => (el?.textContent ?? '').replace(/\s+/g, ' ').trim();
const dok = (html: string) => parseHTML(`<!doctype html><html><body>${html}</body></html>`).document;

// Wortlaut-Quelle: die EntwurfLegende selbst (Katalog-Kopf), gerendert.
const legende = dok(renderToStaticMarkup(<EntwurfLegende />));
const MARKE = txt(legende.querySelector('.lc-badge-entwurf'));
const KURZ = txt(legende.querySelector('button'));

function speicherStub(): Storage {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => { m.set(k, v); },
    removeItem: (k: string) => { m.delete(k); },
    clear: () => m.clear(),
    key: (i: number) => [...m.keys()][i] ?? null,
    get length() { return m.size; },
  };
}

async function rendere(href: string): Promise<Document> {
  const eintrag = ROUTEN_MANIFEST.find((r) => r.pfad === href);
  if (!eintrag) throw new Error(`kein Manifest-Eintrag für ${href}`);
  (globalThis as { localStorage?: Storage }).localStorage = speicherStub();
  const { prelude } = await prerenderToNodeStream(
    <MemoryRouter initialEntries={[href]}>
      <LocaleProvider><eintrag.Comp /></LocaleProvider>
    </MemoryRouter>,
  );
  let html = '';
  for await (const teil of prelude) html += String(teil);
  return dok(html);
}

type Befund = { band: boolean; status: string | null; marke: string; kurz: boolean; formgate: number };

function erfasse(doc: Document): Befund {
  const band = doc.querySelector('.wk-kopf');
  const m = band?.querySelector('[data-werkzeug-status]') ?? null;
  return {
    band: !!band,
    status: m?.getAttribute('data-werkzeug-status') ?? null,
    marke: txt(m?.querySelector('.lc-badge-entwurf')),
    kurz: !!m && [...m.querySelectorAll('*')].some((el) => txt(el) === KURZ),
    formgate: band ? band.querySelectorAll('[data-formgate]').length : 0,
  };
}

const ROUTEN = katalogRouten().filter((p) => /^\/(rechner|vorlagen)\//.test(p)).sort();

describe('RL-12 · Status-Marke am Werkzeug-Kopf (R3-06)', () => {
  const ist: Record<string, Befund> = {};

  beforeAll(async () => {
    for (const r of ROUTEN) ist[r] = erfasse(await rendere(r));
  }, 180_000);

  it('Wortlaut-Quelle EntwurfLegende ist lesbar (Marke + Kurzsatz)', () => {
    expect(MARKE).toBe('Entwurf');
    expect(KURZ.length).toBeGreaterThan(0);
  });

  it('jede Oberkategorie ist mit mindestens einer Route vertreten', () => {
    const abgedeckt = new Set(ROUTEN.map((r) => kategorieFuer(metaFuerPfad(r)!.karte!)));
    for (const k of OBERKATEGORIEN) expect(abgedeckt.has(k.id), k.id).toBe(true);
  });

  it('Befund: Routen unter /rechner|/vorlagen ohne Katalog-Karte (Soll: keine)', () => {
    const ohneKarte = ROUTEN_MANIFEST.map((r) => r.pfad)
      .filter((p) => /^\/(rechner|vorlagen)\/[a-z0-9-]+$/.test(p))
      .filter((p) => !metaFuerPfad(p)?.karte);
    expect(ohneKarte).toEqual([]);
  });

  it('jede Route: Band trägt die Status-Marke der Karte, Entwurf im Legenden-Wortlaut', () => {
    const fehler: string[] = [];
    for (const r of ROUTEN) {
      const karte = metaFuerPfad(r)!.karte!;
      const b = ist[r];
      if (!b.band) { fehler.push(`${r}: kein .wk-kopf`); continue; }
      if (b.status !== karte.status) fehler.push(`${r}: Marke «${b.status}» ≠ Karte «${karte.status}»`);
      if (karte.status === 'entwurf' && (b.marke !== MARKE || !b.kurz)) {
        fehler.push(`${r}: Entwurf-Hinweis fehlt/abweichend (Marke «${b.marke}», Kurzsatz ${b.kurz})`);
      }
    }
    const roteRouten = new Set(fehler.map((f) => f.slice(0, f.indexOf(':'))));
    expect(fehler, `${roteRouten.size} von ${ROUTEN.length} Routen rot`).toEqual([]);
  });

  it('Vorlagen: Formvorschrift-Etikett bleibt genau einmal im Band (nichts überschrieben)', () => {
    const fehler = ROUTEN.filter((r) => r.startsWith('/vorlagen/') && ist[r].formgate !== 1)
      .map((r) => `${r}: ${ist[r].formgate}× [data-formgate]`);
    expect(fehler).toEqual([]);
  });
});

describe('RL-12 · WerkzeugKopf-Status als Baustein', () => {
  const basis = { overline: 'Test', titel: 'Werkzeug', normen: [] };
  const kopf = (props: Record<string, unknown>) =>
    dok(renderToStaticMarkup(<WerkzeugKopf {...({ ...basis, ...props } as ComponentProps<typeof WerkzeugKopf>)} />));

  it('entwurf + Etikett: beide im Band, Etikett unverändert', () => {
    const d = kopf({ status: 'entwurf', etikett: <span data-formgate className="lc-badge lc-badge-warn">Schriftform</span> });
    const band = d.querySelector('.wk-kopf')!;
    expect(txt(band.querySelector('[data-werkzeug-status="entwurf"] .lc-badge-entwurf'))).toBe(MARKE);
    expect(txt(band.querySelector('[data-formgate]'))).toBe('Schriftform');
  });

  it('geprüft: kein Entwurf-Warnhinweis', () => {
    const d = kopf({ status: 'geprüft' });
    expect(d.querySelector('.lc-badge-entwurf')).toBeNull();
    expect(d.querySelector('[data-werkzeug-status="entwurf"]')).toBeNull();
  });
});
