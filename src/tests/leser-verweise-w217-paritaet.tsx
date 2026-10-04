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
const KURZ = /^(?:[0-9]+[a-z]*[.,)]*|(?!(?:in|im|am|an|zu|um|ab|so|es|er|ob|wo|da)\.?$)[A-Za-z]{1,2}(?:bis|ter|quater)?\.?|\([A-Za-z0-9]{1,4}\)|[,–—‒−-]|[0-9]+[–—‒−-][0-9]+|Absätze|Absatz|Abs\.|Buchstaben?|Ziffern?|Ziff\.|Artikeln?|Art\.|Anhang|Anlage|Verbindung|sowie|oder|und|erstes|Lemma|f\.|ff\.|Abschn\.)$/u;
/** Besteht das Stück nur aus Passus-Wörtern, Zahlen, Buchstaben-Kürzeln und Satzzeichen? (Wortweise, ohne verschachtelte Quantoren.) */
const zwischenOk = (stueck: string): boolean => {
  const w = stueck.replace(/\bin\s+Verbindung\s+mit\b/g, 'Verbindung').split(/\s+/).filter(Boolean);
  return w.length <= 14 && w.every((x) => KURZ.test(x));
};
const ERLASSNAME = /(?:gesetz|(?<!an|zu|unter|neu|rang|ein)ordnung|übereinkommen|abkommen|vertrag|konvention|verfassung|reglement|dekret|konkordat|statut|satzung|beschluss|richtlinie|protokoll|charta|vereinbarung|kodex)(?:es|s|en|n)?$/i;
const DATIERT = /^(?:[\p{L}\p{N}.-]+\s+){1,4}vom\s+\d{1,2}\.\s/u;
export function fremderGenitivNach(htmlNachLink: string): string | null {
  // Satzgrenze («5. Artikel 135 …») und Strichpunkt beenden das Zitat.
  // Fussnoten-Marker (<button data-fn-ref>) sind kein Wortlaut — Detektor liest, was ein Mensch liest.
  const text = htmlNachLink.replace(/<button\b[^>]*data-fn-ref[\s\S]*?<\/button>/g, '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/[\u2060\u200b]+/g, '').slice(0, 220).split(/;|\.\s+[A-ZÄÖÜ][a-zäöü]/)[0];
  const m = /\s(?:des|der)\s/.exec(text);
  if (!m || !zwischenOk(text.slice(0, m.index))) return null;
  const name = text.slice(m.index + m[0].length);
  if (/^vorliegende/i.test(name)) return null;
  const woerter = name.split(/\s+/).slice(0, 4).map((w) => w.replace(/[.,;:)]+$/, ''));
  // Bares Gattungswort ohne Zusatz ist in Staatsverträgen/Verordnungen ein Selbstverweis (Prüfer 2.10.2026).
  const BARE = /^(?:Übereinkommens?|Abkommens?|Vertrag(?:es|s)?|Verordnung|Protokolls?|Vereinbarung|Gesetzes?|Reglements?|Konvention|Konkordats?|Dekrets?|Satzung|Statuts?|Richtlinie)$/i;
  if (BARE.test(woerter[0]) && !/^(?:vom|über|zum|zur|zwischen|von|betreffend|\(|\[|\d+\/|\d+\s+vom|des|der)/i.test(name.slice(woerter[0].length).trimStart())) return null;
  if (woerter.slice(0, 3).some((w) => ERLASSNAME.test(w)) || DATIERT.test(name)) return text.slice(0, m.index + m[0].length + 40).trim();
  return null;
}
const maskiere = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function wortlaut(e: Eintrag, kuerzel: string, intern: InternRefs, fussnoten: ReturnType<typeof fussnotenFuer>[string], ohneFussnoten = false): string {
  const v = verteileFussnoten(fussnotenAnzeige(e, fussnoten), e.bloecke);
  const fn = ohneFussnoten ? {} : {
    fnProAbsatz: v.fnProAbsatz, fnProItem: v.fnProItem, fnInlineAbsatz: v.fnInlineAbsatz, fnInlineItem: v.fnInlineItem, fnKlasse: v.fnKlasse,
  };
  return renderToStaticMarkup(
    <ArtikelBody bloecke={e.bloecke} artikel={e.artikel} passus={{ absatz: null }} autolink
      zitierKontext={{ artikelLabel: e.artikelLabel, kuerzel }} intern={intern} {...fn} />,
  );
}
/** Marker, die den Text zerlegen: nur dann kann die Segmentierung einen Link erzeugen. */
const hatInlineMarker = (e: Eintrag, fussnoten: ReturnType<typeof fussnotenFuer>[string]): boolean => {
  const v = verteileFussnoten(fussnotenAnzeige(e, fussnoten), e.bloecke);
  return Object.keys(v.fnInlineAbsatz).length + Object.keys(v.fnInlineItem).length > 0;
};
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
  const z = { artikel: 0, intern: 0, fremdGenitiv: 0, segmentierung: 0, selbstInListe: 0, paritaetAbweichung: 0 };
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
      // Segmentierung: Links, die es NUR gibt, weil ein Fussnoten-Marker den Text zerlegt (ohne Marker fehlen sie).
      if (hatInlineMarker(e, fn[e.artikel])) {
        const roh = wortlaut(e, kuerzel, intern, fn[e.artikel], true);
        const rest = new Map<string, number>();
        for (const m of roh.matchAll(basis)) rest.set(m[0], (rest.get(m[0]) ?? 0) + 1);
        for (const m of html.matchAll(basis)) {
          const n = rest.get(m[0]) ?? 0;
          if (n > 0) { rest.set(m[0], n - 1); continue; }
          z.segmentierung++;
          funde.push(`${key} ${e.artikel}: «${m[0].replace(/<[^>]+>/g, '')}» (Fussnoten-Marker zerlegt den Text)`);
        }
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

// BEKANNTER RESTBESTAND (Nebenfund, 2.10.2026): `ArtikelBody` zerlegt den Text an Fussnoten-
// Markern und ruft `NormText` je Stück auf; steht der Marker ZWISCHEN Zitat und Erlassname/Kürzel
// («Artikel 34⁠73 des Verwaltungsgerichtsgesetzes», ZPO 250 «Art. 107 Abs. 1⁠175 OR»), sieht der
// Linker den Namen nicht und setzt einen Selbst-Link. Der Fix gehört in `ArtikelBody` (offener
// PR #1251 hält die Datei) — die Verweis-Liste spiegelt den Wortlaut (§5), also steht der Link dort
// wie hier. ERFASST sind ALLE Links, die es nur wegen der Zerlegung gibt (Vergleich Wortlaut mit/ohne
// Fussnoten-Eingaben, `pruefeKorpus` → `segmentierung`), nicht nur die mit Genitiv-Erlassname: die
// Genitiv-Sonde sieht ZPO 250, KVV 7, VZV 80 nicht. Die Liste ist eine Ratsche: wird ein Eintrag behoben,
// MUSS er hier raus (der Korpus-Test prüft, dass jeder noch da ist und die Zahl stimmt).
export const FN_SEGMENT_BEKANNT = [
  'OR disp_u13_art_6: «Artikel 64»', 'OR disp_u16_art_3: «Artikel 673»', 'ZPO 250: «Art. 107»',
  'BGG 83: «Artikel 34»', 'BGERR 55: «Artikel 15»', 'FINFRAG 35: «7»', 'FINFRAG 35: «8»',
  'VZV 80: «Artikel 10»', 'DBG 196: «Artikel 28»', 'KVV 7: «Artikel 11»', 'AVIG 97_a: «Artikel 97»',
];
export const ohneBekannte = (funde: string[]): string[] =>
  funde.filter((f) => !FN_SEGMENT_BEKANNT.some((k) => f.startsWith(k)));
