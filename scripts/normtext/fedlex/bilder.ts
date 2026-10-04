/**
 * Fedlex-Extraktor — Bilder & Formeln (<img> → BildRef, Piktogramm-Kacheln, Containment-Netz,
 * Formel-Markierung). Split aus `extrahiere-fedlex.ts`, W2·27-BUND-FERTIG PR 0, 2.10.2026.
 * Code und Kommentare unverändert verschoben.
 */
import { entferneTags, entferneFussnotenSups } from './text.ts';
import type { ArtikelText, BildRef } from './typen.ts';

// ─── Bilder & Formeln (1.7.2026) ────────────────────────────────────────────
// Fedlex liefert Piktogramme (SSV/VTS/chem.) und Formeln als <img src="image/…png">.
// Der Extraktor erfasst die RELATIVE src (kein Netz); der Generator lädt herunter.

/** Ein einzelnes <img>-Tag → BildRef (datei = relative src, Masse aus data-scaled-*). */
export function bildAusImg(imgTag: string): BildRef {
  const zahl = (re: RegExp): number | undefined => Number(imgTag.match(re)?.[1] ?? '') || undefined;
  return {
    datei: imgTag.match(/\bsrc="([^"]*)"/i)?.[1] ?? '',
    alt: entferneTags(imgTag.match(/\balt="([^"]*)"/i)?.[1] ?? ''),
    breite: zahl(/\bdata-scaled-width="(\d+)"/i) ?? zahl(/\bwidth="(\d+)"/i),
    hoehe: zahl(/\bdata-scaled-height="(\d+)"/i) ?? zahl(/\bheight="(\d+)"/i),
  };
}

/** Alle <img>-Tags eines HTML-Fragments (für Containment + Nicht-Katalog-Zellen). */
export function alleImgTags(html: string): string[] {
  return [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
}

/**
 * Reiner Piktogramm-Katalog? → flache Kachel-Liste, sonst null (dann bleibt es eine
 * normale Tabelle). Katalog NUR, wenn genug Bild-Zellen UND (fast) jede nicht-leere
 * Zelle ein Bild trägt — so bleibt eine GEMISCHTE Datentabelle (SSV Anhang 3:
 * Zeit-Tabelle + Illustration) eine Tabelle (§1) und verliert ihre Daten nicht.
 */
export function parseBildKacheln(tableInner: string): Array<{ bild?: BildRef; nummer?: string; name?: string }> | null {
  const zellen = [...tableInner.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((m) => m[1]);
  const nichtLeer = zellen.filter((z) => entferneTags(z) !== '' || /<img\b/i.test(z));
  const mitBild = nichtLeer.filter((z) => /<img\b/i.test(z));
  if (mitBild.length < 3 || mitBild.length < nichtLeer.length * 0.8) return null;
  const kacheln: Array<{ bild?: BildRef; nummer?: string; name?: string }> = [];
  for (const z of nichtLeer) {
    const imgs = alleImgTags(z);
    // ALLE <dt>/<dd>-Paare der Zelle (eine Zelle kann EIN Bild + MEHRERE Signale
    // tragen, z.B. «6.10 Haltelinie / 6.11 Stop / 6.12 …» — sonst Textverlust §1).
    const paare = [...z.matchAll(/<dt\b[^>]*>([\s\S]*?)<\/dt>\s*<dd\b[^>]*>([\s\S]*?)<\/dd>/gi)]
      .map((m) => ({
        nummer: entferneTags(entferneFussnotenSups(m[1])) || undefined,
        name: entferneTags(entferneFussnotenSups(m[2])) || undefined,
      }));
    // Kein <dt>/<dd> → ganzer bildloser Zelltext als ein Name (nichts verlieren).
    // Fussnoten-<sup><a>…</a></sup> VOR entferneTags tilgen — sonst leakt die
    // Fussnoten-Ziffer in den Namen (SSV 4.77.1 «…(Art. 59)379», §1); analog zum
    // Absatz-Pfad (Zeile 270) und dem <dt>/<dd>-Weg unten.
    if (paare.length === 0) {
      const rest = entferneTags(entferneFussnotenSups(z.replace(/<img\b[^>]*>/gi, '')));
      if (rest) paare.push({ nummer: undefined, name: rest });
    }
    // Bilder und Paare index-weise zu Kacheln zusammenführen: keine Zeile verliert
    // ihr Bild, kein Bild verliert seinen Text; Überzahl auf einer Seite → eigene Kachel.
    const anzahl = Math.max(imgs.length, paare.length, 1);
    for (let i = 0; i < anzahl; i++) {
      const p = paare[i] ?? {};
      const bild = imgs[i] ? bildAusImg(imgs[i]) : undefined;
      // alt aus der amtlichen Bezeichnung ableiten (§8: keine Erfindung, nur die Quelle).
      if (bild) bild.alt = p.name ? `Signal: ${p.name}` : 'Amtliche Abbildung';
      kacheln.push({ ...(bild ? { bild } : {}), nummer: p.nummer, name: p.name });
    }
  }
  return kacheln.length ? kacheln : null;
}

/**
 * Containment-Sicherheitsnetz: hängt jedes QUELL-Bild, das die Block-Parser nicht
 * erfasst haben (z.B. Formel-Variablen als <img> in <dt>/<dd> oder inline <sub>),
 * als eigenen Bild-Block an — so geht KEIN amtliches Bild still verloren (§1/§8).
 * Platzierung am Ende statt inline ist eine bewusste, dokumentierte Vereinfachung
 * (Formel-Symbol-Inline = eigener Folgeschritt); Vollständigkeit hat Vorrang.
 */
// Ein Standalone-Bild ist eine FORMEL, wenn der nächste vorausgehende Text-Block
// eine Rechen-Einleitung ist («Formel …», «… wie folgt:», «… umgerechnet:»). §8-
// konservativ: Piktogramme (Signale/Warnzeichen) stehen NIE nach so einem Lead-in
// (sie folgen normalen Sätzen/Überschriften), werden also nicht fälschlich als
// Formel etikettiert. Kachel-Signale (bildKacheln) sind ausgenommen.
const FORMEL_KONTEXT = /\bFormeln?\b|\bGleichung\b|(?:berechnet|ermittelt|errechnet|umgerechnet|umzurechnen|bestimmt sich|wie folgt)\s*:?\s*$/i;

export function markiereFormeln(bloecke: ArtikelText['bloecke']): void {
  bloecke.forEach((b, i) => {
    if (!b.bild) return;
    for (let j = i - 1; j >= 0; j--) {
      const t = bloecke[j].text;
      if (t) {
        if (FORMEL_KONTEXT.test(t)) b.bild.formel = true;
        break;
      }
    }
  });
}

export function ergaenzeFehlendeBilder(bloecke: ArtikelText['bloecke'], quellHtml: string): void {
  const erfasst = new Set<string>();
  for (const b of bloecke) {
    if (b.bild) erfasst.add(b.bild.datei);
    for (const k of b.bildKacheln ?? []) if (k.bild) erfasst.add(k.bild.datei);
  }
  for (const img of alleImgTags(quellHtml)) {
    const b = bildAusImg(img);
    if (b.datei && !erfasst.has(b.datei)) {
      b.alt = 'Amtliche Abbildung';
      bloecke.push({ absatz: null, text: '', bild: b });
      erfasst.add(b.datei);
    }
  }
}
