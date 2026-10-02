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
// Zwischenstück zwischen Verweis und «des/der»: nur KURZE Wörter, Zahlen und Satzzeichen
// (Passus-Wörter, Aufzählungen, «a–f», «(ii)», «Artikel 24», «in Verbindung mit») — bewusst
// nicht die Wortliste des Guards, sondern «alles Kurze»: so findet der Detektor auch Formen,
// die der Guard nicht kennt.
const KURZ = /^(?:[0-9]+[a-z]*[.,)]*|[A-Za-z]{1,2}(?:bis|ter|quater)?\.?|\([A-Za-z0-9]{1,4}\)|[,–—‒−-]|[0-9]+[–—‒−-][0-9]+|Absätze|Absatz|Abs\.|Buchstaben?|Ziffern?|Ziff\.|Artikeln?|Art\.|Anhang|Anlage|Verbindung|sowie|oder|und|erstes|Lemma|f\.|ff\.|Abschn\.|mit|in)$/u;
/** Besteht das Stück nur aus Passus-Wörtern, Zahlen, Buchstaben-Kürzeln und Satzzeichen? (Wortweise, ohne verschachtelte Quantoren.) */
const zwischenOk = (stueck: string): boolean => {
  const w = stueck.split(/\s+/).filter(Boolean);
  return w.length <= 14 && w.every((x) => KURZ.test(x));
};
const ERLASSNAME = /(?:gesetz|(?<!an|zu|unter|neu|rang|ein)ordnung|übereinkommen|abkommen|vertrag|konvention|verfassung|reglement|dekret|konkordat|statut|satzung|beschluss|richtlinie|protokoll|charta|vereinbarung|kodex)(?:es|s|en|n)?$/i;
const DATIERT = /^(?:[\p{L}\p{N}.-]+\s+){1,4}vom\s+\d{1,2}\.\s/u;
export function fremderGenitivNach(htmlNachLink: string): string | null {
  // Satzgrenze («5. Artikel 135 …») und Strichpunkt beenden das Zitat.
  // Fussnoten-Marker (<button data-fn-ref>) sind kein Wortlaut — Detektor liest, was ein Mensch liest.
  const text = htmlNachLink.replace(/<button\b[^>]*data-fn-ref[\s\S]*?<\/button>/g, '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/[\u2060\u200b]+/g, '').slice(0, 220).split(/;|\.\s+[A-ZÄÖÜ][a-zäöü]/)[0];
  if (!/^\s/.test(text)) return null;
  const m = /\s(?:des|der)\s/.exec(text);
  if (!m || !zwischenOk(text.slice(0, m.index))) return null;
  const name = text.slice(m.index + m[0].length);
  if (/^vorliegende/i.test(name)) return null;
  const woerter = name.split(/\s+/).slice(0, 4).map((w) => w.replace(/[.,;:)]+$/, ''));
  if (woerter.slice(0, 3).some((w) => ERLASSNAME.test(w)) || DATIERT.test(name)) return text.slice(0, m.index + m[0].length + 40).trim();
  return null;
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
