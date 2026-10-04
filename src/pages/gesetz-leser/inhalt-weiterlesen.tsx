import { useCallback, useEffect, useRef, useState } from 'react';
import type { BrowseErlass } from '../../lib/normtext/browse-typen';
import type { StrukturMap } from '../../lib/normtext/browse';
import type { NormSnapshot } from '../../lib/normtext/typen';
import { eindeutigeBezeichnung } from './artikelBezeichnung';
import { holeLesePosition, merkeLesePosition, vergissLesePosition, type LesePosition } from './lesePosition';

// ═══ ABSCHNITT · R4 «Weiterlesen bei Art. X» + R8 Tastatur-Navigation ════════
// (§6.6-Split, QS-TOK/T14) — aus GesetzLeserInhalt ausgelagert. VERHALTENS-
// NEUTRAL: Effekt-Rümpfe und Dependency-Listen byte-identisch, Hook-Reihenfolge
// erhalten (ein kontiguer Block, an derselben Position gerufen). Das Markup der
// beiden Overlays lebt in ./inhalt-overlays (react-refresh trennt Hook- und
// Komponenten-Exporte); im Ruhezustand rendern beide `null`, das prerenderte
// Markup bleibt also byte-gleich. Keine Rechtsregel (§3).

export function useWeiterlesen({ erlass, eintraege, struktur, istSekundaer, locationHash, aktArtikel, aktivToken, springeZuArtikel }: {
  erlass: BrowseErlass | null;
  eintraege: NormSnapshot[] | null;
  /** Für die eindeutige Chip-Beschriftung von Übergangsartikeln (B7). */
  struktur: StrukturMap | null;
  istSekundaer: boolean;
  locationHash: string;
  aktArtikel: string | null;
  aktivToken: string | null;
  springeZuArtikel: (token: string) => void;
}) {
  // R4 · Angebot beim Wiederkommen. EINMAL je Erlass gelesen (Ref-Riegel), bevor
  // der Spy zu schreiben beginnt — sonst überschriebe die frisch geladene Seite
  // die gemerkte Stelle, noch bevor sie jemand angeboten bekäme.
  const [weiterlesen, setWeiterlesen] = useState<LesePosition | null>(null);
  const weiterlesenGelesen = useRef<string | null>(null);
  // W2·17-UI-BEFUNDE: solange ein Angebot offen steht, bleibt die gemerkte Stelle
  // unberührt. Synchron geführt (Ref), nicht über `weiterlesen`: der Chip erscheint
  // erst über einen 0-ms-Timer, das Schreiben darf nicht in diese Lücke fallen.
  const angebotOffen = useRef(false);
  useEffect(() => {
    const key = erlass?.key;
    // `eintraege` MUSS stehen, bevor der Riegel fällt (§9-Bug-Check B2): der
    // Effekt lief sonst schon im Zwischen-Render (Erlass geladen, Artikel noch
    // nicht), verglich gegen einen Dokumentanfang, den er noch gar nicht kannte,
    // und verriegelte sich danach gegen den Nachlauf — die Unterdrückung «nichts
    // anbieten, was ohnehin gilt» griff damit NIE, und der Chip bot bei scrollY 0
    // «Weiterlesen bei Art. 1» an.
    if (!key || !erlass || istSekundaer || !eintraege) return;
    if (weiterlesenGelesen.current === key) return;
    weiterlesenGelesen.current = key;
    // Deep-Link: die Adresse nennt bereits ein Ziel. Wer einem Link auf Art. 5
    // folgt, will Art. 5 — ein zweites Angebot daneben wäre Lärm (§8).
    const tief = /^#art-/.test(locationHash);
    const pos = tief ? null : holeLesePosition(key, erlass.stand);
    // Nichts anbieten, was ohnehin schon gilt: steht die gemerkte Stelle am
    // Dokumentanfang, verspräche der Chip eine Reise ans Ziel, an dem man steht.
    const anfang = eintraege?.[0]?.artikel ?? null;
    const angebot = pos && pos.token !== anfang ? pos : null;
    angebotOffen.current = angebot !== null;
    // Über einen 0-ms-Timer statt synchron: ein setState direkt im Effektkörper
    // erzeugt eine Kaskade (Muster wie `sucheDebounced`). `null` räumt zugleich
    // das Angebot des zuvor gelesenen Erlasses ab.
    const id = window.setTimeout(() => setWeiterlesen(angebot), 0);
    return () => window.clearTimeout(id);
  }, [erlass, istSekundaer, locationHash, eintraege]);

  // R4 · Stelle fortschreiben. Hängt allein am (bereits entprellten) Spy-Ergebnis
  // — kein eigener Scroll-Listener, kein Timer (§15): ein localStorage-Write je
  // überschrittener Artikelgrenze, wie ihn der Reiter-Tracker längst macht.
  // Nur die Primär-/Einzelansicht: ein sekundäres Pane ist nicht die adressierte
  // Seite und darf die gemerkte Lesestelle nicht bestimmen (Muster A16-Anker).
  useEffect(() => {
    if (istSekundaer || !erlass || !aktArtikel || !aktivToken) return;
    if (weiterlesenGelesen.current !== erlass.key) return; // erst nach dem Lesen schreiben
    // Beleg (Browser, 2.10.2026, ZGB): Chip «Weiterlesen bei Art. 457», ein
    // 100-px-Scroll im Art. 1 genügte — die gemerkte Stelle war sofort «Art. 1»,
    // der Chip noch da, der zweite Reload bot nichts mehr an. Geschrieben wird erst,
    // wenn das Angebot beantwortet ist (Verfall, Klick, Verwerfen).
    if (angebotOffen.current) return;
    // B7: bei Übergangsartikeln mit der Gruppe beschriftet, nie als blosses «Art. 3».
    merkeLesePosition({ key: erlass.key, token: aktivToken, label: eindeutigeBezeichnung(aktivToken, aktArtikel, struktur), stand: erlass.stand });
  }, [istSekundaer, erlass, aktArtikel, aktivToken, struktur, weiterlesen]);

  // R4 · Verfall ohne Timer und ohne Listener: sobald der Spy einen ANDEREN
  // Artikel meldet als beim Erscheinen des Chips, liest der Nutzer bereits selbst
  // weiter — dann ist das Angebot beantwortet. (Ein Zeitablauf wäre willkürlich,
  // ein Scroll-Schwellenwert eine Magic-Number.)
  const weiterlesenStart = useRef<string | null>(null);
  useEffect(() => {
    if (!weiterlesen) { weiterlesenStart.current = null; return; }
    if (aktivToken == null) return;
    if (weiterlesenStart.current === null) { weiterlesenStart.current = aktivToken; return; }
    if (aktivToken !== weiterlesenStart.current) { angebotOffen.current = false; setWeiterlesen(null); }
  }, [weiterlesen, aktivToken]);

  const weiterlesenSprung = useCallback(() => {
    // Sprung NEBEN dem Setter, nicht in ihm: ein State-Updater muss rein bleiben
    // (StrictMode ruft ihn doppelt auf — der Sprung liefe sonst zweimal).
    if (!weiterlesen) return;
    const token = weiterlesen.token;
    angebotOffen.current = false;
    setWeiterlesen(null);
    springeZuArtikel(token);
  }, [weiterlesen, springeZuArtikel]);
  const weiterlesenVerwerfen = useCallback(() => {
    // Weggeklickt heisst «nicht wieder anbieten» — also auch aus dem Speicher.
    if (erlass) vergissLesePosition(erlass.key);
    angebotOffen.current = false;
    setWeiterlesen(null);
  }, [erlass]);

  return { weiterlesen, weiterlesenSprung, weiterlesenVerwerfen };
}
