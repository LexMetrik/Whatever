// Geteilter Paritäts-Helfer für `leser-verweise-w217*.test.tsx` (§5/§6.7, Prüfer-Verdikt PR #1264).
//
// Die Verweis-Liste (Dossier/Blatt) muss GENAU die Ziele zeigen, die der Wortlaut verlinkt —
// verglichen als MENGE DER ZIELE (nicht nur Ja/Nein je Artikel), mit denselben Eingaben wie
// im Leser: Fussnoten (Marker zerlegen den Text) und der echte `InternRefs` (Register-Kürzel,
// Kantons-Karte). Wortlaut-Seite = Anker im SSR-Markup von `ArtikelBody` (unabhängig von der
// Element-Wanderung in `sammleVerweise`); Listen-Seite = was Dossier und Blatt darstellen
// (Sprung → href, Normverweis → Chip-Ziel). Ein Artikel ohne «Art»/«§» im Text kann keinen
// Verweis tragen und wird nicht gerendert (Laufzeit: das Rendern ist der Kostentreiber).
import { renderToStaticMarkup } from 'react-dom/server';
import { ArtikelBody } from '../components/normtext/ArtikelBody';
import type { InternRefs } from '../components/NormText';
import { NormChip } from '../components/vorlagen/NormChip';
import { fussnotenAnzeige, sammleVerweise, verteileFussnoten } from '../pages/gesetz-leser/parts/ArtikelLeser.fussnoten';
import { fussnotenFuer, internFuer, lade, type Eintrag } from './leser-verweise-w217-helfer';

// Der Detektor ist ABSICHTLICH breiter als der Guard (andere Wortliste, bis zu
// vier Wörter nach des/der, auch «recht(s)»): er soll finden, was der Guard
// übersieht, nicht dessen Muster wiederholen.
const PASSUS_GLIED = '(?:\\s+(?:Absatz|Absätze|Abs\\.|Buchstaben?|Bst\\.|lit\\.|Ziffern?|Ziff\\.|Satz|Sätze)\\s*[0-9a-z]+(?:bis|ter)?)*';
const ERLASSNAME = /(?:gesetz|ordnung|übereinkommen|abkommen|vertrag|konvention|verfassung|reglement|dekret|konkordat|statut|satzung|beschluss|richtlinie|protokoll|charta|vereinbarung)(?:es|s|en|n)?$/i;
export function fremderGenitivNach(htmlNachLink: string): string | null {
  const text = htmlNachLink.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').slice(0, 220);
  const m = new RegExp(`^${PASSUS_GLIED}\\s+(?:des|der)\\s+([\\p{L}\\p{N}-]+(?:\\s+[\\p{L}\\p{N}-]+){0,3})`, 'u').exec(text);
  if (!m) return null;
  const woerter = m[1].split(/\s+/);
  if (/^vorliegende/i.test(woerter[0])) return null;
  return woerter.some((w) => ERLASSNAME.test(w)) ? m[0].trim() : null;
}
const maskiere = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function wortlaut(e: Eintrag, kuerzel: string, intern: InternRefs, fussnoten: ReturnType<typeof fussnotenFuer>[string]): string {
  const v = verteileFussnoten(fussnotenAnzeige(e, fussnoten), e.bloecke);
  return renderToStaticMarkup(
    <ArtikelBody bloecke={e.bloecke} artikel={e.artikel} passus={{ absatz: null }} autolink
      zitierKontext={{ artikelLabel: e.artikelLabel, kuerzel }} intern={intern}
      fnProAbsatz={v.fnProAbsatz} fnProItem={v.fnProItem} fnInlineAbsatz={v.fnInlineAbsatz}
      fnInlineItem={v.fnInlineItem} fnKlasse={v.fnKlasse} />,
  );
}
/** Sprung- und Fedlex-Ziele des Wortlauts (Anker auf Bestimmungen), eigener Artikel ausgenommen. */
export function wortlautZiele(html: string, selbst: string): Set<string> {
  const ziele = new Set<string>();
  for (const m of html.matchAll(/<a\b[^>]*?\shref="([^"]+)"/g)) if (/#art[-_]/.test(m[1]) && m[1] !== selbst) ziele.add(m[1]);
  return ziele;
}
/** Ziele der LISTE, so wie Dossier/Blatt sie darstellen: Sprung → href; Normverweis → Chip-Ziel (Fedlex). */
export function listenZiele(liste: ReturnType<typeof sammleVerweise>): Set<string> {
  const ziele = new Set<string>();
  for (const v of liste) {
    if (v.href) { ziele.add(v.href); continue; }
    const html = renderToStaticMarkup(<NormChip artikel={v.norm!} zielIntern={false} />);
    for (const m of html.matchAll(/<a\b[^>]*?\shref="([^"]+)"/g)) if (/#art[-_]/.test(m[1])) ziele.add(m[1]);
  }
  return ziele;
}

export function pruefeKorpus(ebene: 'bund' | 'kanton', schluessel: string[], nurErste?: number) {
  const z = { artikel: 0, intern: 0, fremdGenitiv: 0, selbstInListe: 0, paritaetAbweichung: 0 };
  const funde: string[] = [];
  for (const key of schluessel) {
    const eintraege = lade(ebene, key);
    const intern = internFuer(ebene, key, eintraege);
    const kuerzel = intern.eigenesKuerzel ?? key;
    const fn = fussnotenFuer(ebene, key);
    const basis = new RegExp(`<a\\b[^>]*?\\shref="${maskiere(intern.basisPfad)}#art-([^"]+)"[^>]*>[^<]*</a>`, 'g');
    for (const e of eintraege.slice(0, nurErste)) {
      if (!/\bArt|§/.test(JSON.stringify(e.bloecke))) continue;
      z.artikel++;
      const html = wortlaut(e, kuerzel, intern, fn[e.artikel]);
      const selbst = `${intern.basisPfad}#art-${e.artikel}`;
      for (const m of html.matchAll(basis)) {
        z.intern++;
        const g = fremderGenitivNach(html.slice(m.index! + m[0].length));
        if (g) { z.fremdGenitiv++; funde.push(`${key} ${e.artikel}: «${m[0].replace(/<[^>]+>/g, '')}» ${g}`); }
      }
      const liste = sammleVerweise(e, { kuerzel, intern, fussnoten: fn[e.artikel] });
      if (liste.some((v) => v.href === selbst)) { z.selbstInListe++; funde.push(`${key} ${e.artikel}: Liste führt den eigenen Artikel`); }
      const w = wortlautZiele(html, selbst), l = listenZiele(liste);
      const nurW = [...w].filter((x) => !l.has(x)), nurL = [...l].filter((x) => !w.has(x));
      if (nurW.length > 0 || nurL.length > 0) {
        z.paritaetAbweichung++;
        funde.push(`${key} ${e.artikel}: nur Wortlaut ${JSON.stringify(nurW)} · nur Liste ${JSON.stringify(nurL)}`);
      }
    }
  }
  return { z, funde };
}
