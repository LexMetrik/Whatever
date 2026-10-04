import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { NormText, type InternRefs } from '../components/NormText';
import { istParagrafDesigniert } from '../pages/gesetz-leser/inhalt-sprung';
import { LocaleProvider } from '../components/locale';

// ═══ W2·13-KANTONE · F41 + F40 — Verweise in §-designierten Erlassen ═════════
//
// F41 (Unterdrückung) und F40 (Auflösung) sind DIESELBE Regel von zwei Seiten:
// zählt ein Erlass seine Bestimmungen mit «§», dann ist «§ N» der Self-Verweis
// und ein bare «Art. N» praktisch immer ein FREMDER Erlass. Bis zum Bau war es
// umgekehrt verdrahtet — «Art. N» sprang auf den eigenen Erlass, «§ N» blieb
// Text. Gemessen 31.8.2026 mit den echten Guards: 199 falsche Art.-Self-Links
// in 82 der 775 §-designierten Erlasse.
//
// Die Fixtures sind ECHTE Snapshot-Texte (public/normtext, nur gelesen) — eine
// erfundene Beispielzeile beweist nichts über den Korpus (§7).

const ssr = (el: React.ReactElement) => renderToString(<LocaleProvider>{el}</LocaleProvider>);

const NORMTEXT = join(process.cwd(), 'public/normtext/kanton');
/** Blocktext eines Artikels aus dem echten Kanton-Snapshot. */
function snapshotText(stamm: string, artikel: string, absatz: string): string {
  const daten = JSON.parse(readFileSync(join(NORMTEXT, `${stamm}.json`), 'utf8')) as {
    eintraege: Array<{ artikel: string; bloecke?: Array<{ absatz?: string; text?: string }> }>;
  };
  const e = daten.eintraege.find((x) => x.artikel === artikel);
  const t = e?.bloecke?.find((b) => b.absatz === absatz)?.text;
  if (!t) throw new Error(`Fixture fehlt: ${stamm} art_${artikel} Abs. ${absatz}`);
  return t;
}
/** tokenMap wie der Reader sie baut (nur der eigene Erlass). */
function tokenMapVon(stamm: string): Map<string, string> {
  const daten = JSON.parse(readFileSync(join(NORMTEXT, `${stamm}.json`), 'utf8')) as {
    eintraege: Array<{ artikel: string }>;
  };
  const m = new Map<string, string>();
  for (const e of daten.eintraege) m.set(e.artikel.toLowerCase().replace(/[^a-z0-9]/g, ''), e.artikel);
  return m;
}
const refs = (stamm: string, paragrafDesigniert: boolean): InternRefs => ({
  tokenMap: tokenMapVon(stamm),
  basisPfad: `/gesetze/kanton/${stamm}`,
  springeZu: () => {},
  paragrafDesigniert,
});

describe('istParagrafDesigniert — Weiche aus dem Grundart-Register', () => {
  it('kantonaler §-Erlass ⇒ true, Art.-Erlass ⇒ false', () => {
    expect(istParagrafDesigniert('/gesetze/kanton/BS-427.800')).toBe(true);
    expect(istParagrafDesigniert('/gesetze/kanton/SO-615.11')).toBe(true);
    expect(istParagrafDesigniert('/gesetze/kanton/AR-111.1')).toBe(false);
  });

  it('Bund und Unbekanntes ⇒ false (kein Rückfall auf «§»)', () => {
    expect(istParagrafDesigniert('/gesetze/bund/OR')).toBe(false);
    expect(istParagrafDesigniert('/gesetze/bund/AHVV')).toBe(false);
    expect(istParagrafDesigniert('/gesetze/kanton/GIBT-ES-NICHT')).toBe(false);
  });

  it('prozentkodierter Schlüssel wird dekodiert', () => {
    expect(istParagrafDesigniert(`/gesetze/kanton/${encodeURIComponent('BS-427.800')}`)).toBe(true);
  });
});

describe('F41 — bare «Art. N» wird in §-Erlassen nicht self-verlinkt', () => {
  // Belegstelle 1: BS-427.800 § 1 Abs. 4 — «Art. 18 Abs. 2 des Bundesgesetzes».
  // Keine Bund-Weiche greift (kein Klammer-Kürzel, kein FEDLEX-Kürzel, das
  // «des» steht hinter dem Passus), und BS-427.800 HAT einen § 18 → der alte
  // Stand sprang auf den eigenen § 18.
  it('BS-427.800 § 1 Abs. 4: «Art. 18 Abs. 2 des Bundesgesetzes» bleibt Text', () => {
    const text = snapshotText('BS-427.800', '1', '4');
    expect(text).toContain('Art. 18 Abs. 2 des Bundesgesetzes');
    expect(ssr(<NormText text={text} intern={refs('BS-427.800', true)} />)).not.toContain('#art-18');
  });

  // Rot-Probe der Weiche (§6.7): ohne `paragrafDesigniert` entsteht der Self-Link. Seit
  // 2.10.2026 (W2·17-UI-BEFUNDE Nachzug) fängt die Belegstelle selbst auch FREMDERLASS_GENITIV
  // («Art. 18 Abs. 2 des Bundesgesetzes» — Genitiv-Erlassname hinter dem Passus); zwei
  // unabhängige Guards. Die Probe nimmt darum einen Text, über den NUR F41 entscheidet.
  it('OHNE die Weiche entstünde der falsche Self-Link (Ist vor F41; Text ohne Erlassnamen)', () => {
    const text = 'Gemäss Art. 18 Abs. 2 kann die Behörde im Einzelfall abweichen.';
    expect(ssr(<NormText text={text} intern={refs('BS-427.800', false)} />)).toContain('#art-18');
    expect(ssr(<NormText text={text} intern={refs('BS-427.800', true)} />)).not.toContain('#art-18');
  });

  it('BS-427.800 § 1 Abs. 4: auch ohne F41 bleibt «Art. 18 Abs. 2 des Bundesgesetzes» Text (Genitiv-Erlassname)', () => {
    const text = snapshotText('BS-427.800', '1', '4');
    expect(ssr(<NormText text={text} intern={refs('BS-427.800', false)} />)).not.toContain('#art-18');
  });

  // Belegstelle 2: SO-615.11 § 12 Abs. 1 — «Art. 80 Abs. 2 des Bundesgesetzes
  // über Schuldbetreibung und Konkurs vom 11. April 1889, SchKG». SO-615.11 hat
  // einen § 80 → derselbe Fehlgriff.
  it('SO-615.11 § 12 Abs. 1: «Art. 80 Abs. 2 des Bundesgesetzes …» bleibt Text', () => {
    const text = snapshotText('SO-615.11', '12', '1');
    expect(text).toContain('Art. 80 Abs. 2 des Bundesgesetzes');
    expect(ssr(<NormText text={text} intern={refs('SO-615.11', true)} />)).not.toContain('#art-80');
  });

  it('kein Ersatz-Link auf Bundesrecht (Konvention ist Indiz, kein Beweis)', () => {
    const text = snapshotText('BS-427.800', '1', '4');
    const out = ssr(<NormText text={text} intern={refs('BS-427.800', true)} />);
    expect(out).not.toContain('fedlex');
    expect(out).toContain('Art. 18 Abs. 2 des Bundesgesetzes'); // Text zeichengleich
  });

  it('auch das Plural-Glied springt nicht («die Artikel 3 und 5»)', () => {
    const t = 'Die Voraussetzungen nach den Artikeln 3 und 5 gelten sinngemäss.';
    expect(ssr(<NormText text={t} intern={refs('BS-427.800', true)} />)).not.toContain('#art-');
    // Gegenprobe Art.-Erlass: dort bleibt der Plural-Self-Sprung bestehen.
    expect(ssr(<NormText text={t} intern={refs('BS-427.800', false)} />)).toContain('#art-3');
  });

  it('das Fremdgesetz-Routing bleibt unberührt (StGB-Klammerkürzel)', () => {
    const t = 'Eine Landesverweisung nach Artikel 66a des Strafgesetzbuchs (StGB) bleibt vorbehalten.';
    const out = ssr(<NormText text={t} intern={refs('BS-427.800', true)} />);
    expect(out).toMatch(/href="[^"]*#art_66_a"/);
  });
});

describe('F40 — «§ N» wird in §-Erlassen self-verlinkt', () => {
  it('BS-427.800 § 2 Abs. 1: «§ 5» springt auf das eigene Token', () => {
    const text = snapshotText('BS-427.800', '2', '1');
    expect(text).toContain('in § 5 erwähnten');
    const out = ssr(<NormText text={text} intern={refs('BS-427.800', true)} />);
    expect(out).toContain('/gesetze/kanton/BS-427.800#art-5"');
    expect(out).toContain('§ 5'); // Text zeichengleich
  });

  it('SO-615.11 § 21 Abs. 1: «§ 40 Absatz 2 Buchstabe a InfoDG» bleibt Text (Fremd-Kürzel)', () => {
    const text = snapshotText('SO-615.11', '21', '1');
    expect(text).toContain('§ 40 Absatz 2 Buchstabe a InfoDG');
    expect(ssr(<NormText text={text} intern={refs('SO-615.11', true)} />)).not.toContain('#art-40');
  });

  it('SO-615.11 § 50 Abs. 1: «§§ 19 bis 21 der Verordnung …» bleibt Text (Fremd-Name)', () => {
    const text = snapshotText('SO-615.11', '50', '1');
    expect(text).toContain('§§ 19 bis 21 der Verordnung');
    const out = ssr(<NormText text={text} intern={refs('SO-615.11', true)} />);
    expect(out).not.toContain('#art-19');
    expect(out).not.toContain('#art-21');
  });

  // Der teure Befund der Nachmessung (31.8.2026): Kantone hängen den AUSGE-
  // SCHRIEBENEN Erlassnamen an, und der trägt nur EINEN Grossbuchstaben — das
  // Kürzel-Muster des Art.-Pfads (zwei Grossbuchstaben) griff daran nicht.
  // BS-122.510 (Integrationsverordnung) HAT einen § 8 → ohne die Grosswort-
  // Weiche zeigte «§ 8 Abs. 3 Integrationsgesetz» auf den eigenen § 8.
  it('BS-122.510 § 2 Abs. 1: «§ 8 Abs. 3 Integrationsgesetz» bleibt Text', () => {
    const text = snapshotText('BS-122.510', '2', '1');
    expect(text).toContain('§ 8 Abs. 3 Integrationsgesetz');
    expect(ssr(<NormText text={text} intern={refs('BS-122.510', true)} />)).not.toContain('#art-8');
  });

  it('ausgeschriebener Erlassname mit EINEM Grossbuchstaben unterdrückt den Link', () => {
    const intern = refs('BS-427.800', true);
    for (const t of ['nach § 5 Abs. 1 lit. g Bestattungsgesetz gilt',
      'In Abweichung von § 5 Abs. 1 Bst. a Schulordnung erhalten sie']) {
      expect(ssr(<NormText text={t} intern={intern} />)).not.toContain('#art-5');
    }
  });

  it('ein Satz-ANFANG nach dem Zitat unterdrückt NICHT (Interpunktion trennt)', () => {
    const out = ssr(<NormText text="Es gilt § 5. Die Behörde entscheidet." intern={refs('BS-427.800', true)} />);
    expect(out).toContain('#art-5"');
  });

  it('«§ 18 StG» bleibt Text — ein «StG» in BS ist nicht das «StG» in ZH', () => {
    const out = ssr(<NormText text="Massgebend ist § 18 StG." intern={refs('BS-427.800', true)} />);
    expect(out).not.toContain('#art-18');
    expect(out).toContain('§ 18 StG');
  });

  it('nicht auflösbare Nummer ⇒ kein Link (§8, nie ein toter Sprung)', () => {
    // BS-427.800 endet bei § 19.
    const out = ssr(<NormText text="Vorbehalten bleibt § 99." intern={refs('BS-427.800', true)} />);
    expect(out).not.toContain('#art-99');
  });

  it('«§ 12bis» wird nicht auf «§ 12b» verkürzt', () => {
    const tokenMap = new Map([['12b', '12_b'], ['12bis', '12_bis']]);
    const intern: InternRefs = {
      tokenMap, basisPfad: '/gesetze/kanton/XX-1', springeZu: () => {}, paragrafDesigniert: true,
    };
    const out = ssr(<NormText text="Nach § 12bis gilt Folgendes." intern={intern} />);
    expect(out).toContain('#art-12_bis"');
    expect(out).not.toContain('#art-12_b"');
  });

  it('mehrere «§» in einem Satz werden einzeln verlinkt, Text bleibt zeichengleich', () => {
    const t = 'Die § 5 und § 7 gelten, § 99 nicht.';
    const out = ssr(<NormText text={t} intern={refs('BS-427.800', true)} />);
    expect(out).toContain('#art-5"');
    expect(out).toContain('#art-7"');
    expect(out).not.toContain('#art-99');
    expect(out.replace(/<[^>]*>/g, '')).toBe(t);
  });
});

describe('Erlass-Neutralität — Art.-designierte Erlasse bleiben unverändert', () => {
  const bund: InternRefs = {
    tokenMap: new Map([['5', '5'], ['18', '18'], ['6a', '6_a']]),
    basisPfad: '/gesetze/bund/AHVV', springeZu: () => {},
  };

  it('Bund: bare «Art. 6a» bleibt ein Self-Sprung (F41 greift nicht)', () => {
    expect(ssr(<NormText text="gemäss Art. 6a hier" intern={bund} />)).toContain('#art-6_a"');
  });

  it('Bund: «§ 5» erzeugt KEINEN Link (F40 greift nicht)', () => {
    expect(ssr(<NormText text="siehe § 5 dort" intern={bund} />)).not.toContain('#art-5');
  });

  it('Bund-Rendering ist byte-identisch mit und ohne das neue Feld', () => {
    const texte = [
      'gemäss Art. 6a hier', 'nach Artikel 5 Absatz 2 hier',
      'Massnahmen nach den Artikeln 5 und 18 des StGB bleiben vorbehalten.',
      'siehe § 5 dort', 'Art. 18 Abs. 2 des Bundesgesetzes bleibt vorbehalten.',
    ];
    for (const t of texte) {
      const ohne = ssr(<NormText text={t} intern={bund} />);
      const mit = ssr(<NormText text={t} intern={{ ...bund, paragrafDesigniert: false }} />);
      expect(mit).toBe(ohne);
    }
  });

  it('Art.-designierter KANTON: «Art. N» self, «§ N» kein Link', () => {
    const kantonArt = refs('BS-427.800', false); // Weiche aus = Art.-Designation
    expect(ssr(<NormText text="gemäss Art. 5 hier" intern={kantonArt} />)).toContain('#art-5"');
    expect(ssr(<NormText text="gemäss § 5 hier" intern={kantonArt} />)).not.toContain('#art-5');
  });
});
