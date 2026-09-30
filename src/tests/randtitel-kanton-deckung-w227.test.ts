/**
 * W2·27-BUND-FERTIG · Randtitel-Doppelmodell Phase 2 — Kanton-Deckungswächter.
 *
 * ANLASS (30.9.2026): der Posten «Randtitel-Doppelmodell auflösen» vermutete,
 * der `titel`-Zweig sei «toter Code» (Prüfer B3) und evtl. ersatzlos
 * rückbaubar. Die Messung am Kanton-Korpus widerlegt das für das FELD, stützt
 * es aber für die DATEN: `NormSnapshot.titel` trägt im Kanton-Korpus 17 840
 * Artikel (Bund 0/25 601, s. `randtitel-eine-quelle-w227.test.ts`) und hat vier
 * lebende Leser (DB-Spalte `artikel.marg` in `scripts/datenhaltung/erlass-rows.ts`,
 * Prerender `src/lib/seo-detail.ts`, Erst-Render `ArtikelLeser.tsx` solange das
 * Sidecar noch lädt — `ladeStruktur` ist ein unabhängiger Ladepfad —, und die
 * Höhenschätzung `schaetzeArtikelHoehe`). Ein ersatzloser Rückbau ÄNDERT also
 * Erst-Render, SEO-HTML und DB. Er ist nur mit Migration jener vier Leser UND
 * Neuerzeugung aller 1339 Kanton-Snapshots (Netz, LexWork) zu haben — ein
 * eigener, deklarierter Schritt, kein verhaltensneutraler Rückbau.
 *
 * WAS DIESER TEST FESTHÄLT (Voraussetzung jeder späteren Migration, §5):
 * das Struktur-Sidecar deckt JEDES kantonale `titel` bereits vollständig. Wer
 * `titel` einmal ablöst, verliert dadurch keinen Randtitel-Text — er muss nur
 * die vier Leser umhängen. Wird diese Invariante verletzt (ein Kanton-Nachzug
 * liefert `titel` ohne Sidecar-Marginalie), hängt die Anzeige an einem Feld,
 * das die Suche (`such-index-generieren.ts`, liest nur Sidecar) nie sieht.
 *
 * Messung 30.9.2026, `node` über `public/normtext/kanton/*.json` +
 * `public/normtext/struktur/kanton/*.json` (1339 Snapshot-Dateien, 34 907
 * Artikel, 1304 Sidecars): titel 17 840 · davon im Sidecar identisch 16 469 ·
 * nur durch den Aufzähler-Präfix verschieden («1. Grundentschädigung» ↔
 * «Grundentschädigung») 1369 · ohne Sidecar-Sachtitel 0 · 2 echte Abweichungen
 * (BS-561.111 Art. 66/67: `titel` trägt ein LexWork-Escape «\"» statt «“»; das
 * Sidecar ist dort korrekt und gewinnt im Leser, sobald es geladen ist).
 */
import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { artikelSachtitel } from '../lib/normtext/darstellung';

interface SnapEintrag { artikel: string; titel?: string }
interface Sidecar { artikel?: Record<string, { marginalie?: string[] }> }

/** Bekannte, benannte Abweichungen (LexWork-Escape im `titel`, Sidecar korrekt).
 *  Erweitern ist eine fachliche Entscheidung, kein Test-Flicken. */
const BEKANNTE_ABWEICHUNG = new Set(['BS-561.111.json#66', 'BS-561.111.json#67']);

describe('W2·27 Randtitel Phase 2 — Kanton: Sidecar deckt jedes `titel`', () => {
  const wurzel = join(process.cwd(), 'public/normtext');
  const dateien = readdirSync(join(wurzel, 'kanton'))
    .filter((f) => f.endsWith('.json') && f !== 'index.json');

  const messung = (() => {
    let artikel = 0;
    let mitTitel = 0;
    let ohneSidecarSachtitel: string[] = [];
    let ohneSidecarDatei: string[] = [];
    let abweichend: string[] = [];
    for (const datei of dateien) {
      const snap = JSON.parse(readFileSync(join(wurzel, 'kanton', datei), 'utf8')) as { eintraege?: SnapEintrag[] };
      const sp = join(wurzel, 'struktur/kanton', datei);
      const sidecar: Sidecar | null = existsSync(sp) ? (JSON.parse(readFileSync(sp, 'utf8')) as Sidecar) : null;
      for (const e of snap.eintraege ?? []) {
        artikel += 1;
        const t = (e.titel ?? '').trim();
        if (!t) continue;
        mitTitel += 1;
        if (!sidecar) { ohneSidecarDatei.push(`${datei}#${e.artikel}`); continue; }
        const m = artikelSachtitel(sidecar.artikel?.[e.artikel]?.marginalie ?? []);
        if (m === null) { ohneSidecarSachtitel.push(`${datei}#${e.artikel}`); continue; }
        if (artikelSachtitel([t]) !== m) abweichend.push(`${datei}#${e.artikel}`);
      }
    }
    return { artikel, mitTitel, ohneSidecarSachtitel, ohneSidecarDatei, abweichend };
  })();

  it('die Messmenge ist real (kein stilles Grün, §6.7b)', () => {
    expect(dateien.length).toBeGreaterThan(1000);
    expect(messung.artikel).toBeGreaterThan(30000);
    expect(messung.mitTitel).toBeGreaterThan(15000);
  });

  it('kein Kanton-Artikel trägt `titel` ohne Sidecar-Datei', () => {
    expect(messung.ohneSidecarDatei).toEqual([]);
  });

  it('kein Kanton-Artikel trägt `titel` ohne Sachtitel in der Sidecar-Marginalie', () => {
    expect(messung.ohneSidecarSachtitel).toEqual([]);
  });

  it('`titel` und Sidecar-Sachtitel stimmen überein (Aufzähler-Präfix ausgenommen) — bis auf die benannten Abweichungen', () => {
    expect(new Set(messung.abweichend)).toEqual(BEKANNTE_ABWEICHUNG);
  });
});
