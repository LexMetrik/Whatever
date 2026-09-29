/**
 * W2·31-BILDSCHIRMBREITE — Bündel D, Posten 2 (29.9.2026).
 *
 * BEFUND: Das Zweispalten-Bild (Lesespalte ‖ Erwägungs-Rail) in
 * `EntscheidLeser.tsx` schaltete ausserhalb einer Split-View-Pane über
 * `pk()` auf den VIEWPORT-Breakpoint `xl` (1280 px) um — unabhängig davon,
 * wie viel Platz die Hauptspalte tatsächlich hatte. Mit offener Seitenleiste
 * (kein Split-View, `imPane` bleibt `false`) schrumpfte die Lesespalte
 * (`minmax(0,40rem)`) darum bei @1280 unter 640 px (Lesemass, Reglement R1).
 *
 * FIX: ein eigener, immer vorhandener Container (`@container/leser`) trägt
 * die Schwelle jetzt in BEIDEN Fällen (Fenster mit/ohne Seitenleiste, Pane) —
 * `pk()`/`imPane` entfallen für dieses Breitenpaar ersatzlos.
 *
 * QUELLTEXT-Sonde (kein Render-Test, s. design-gruppenkopf-karten-c.test.ts
 * für die Begründung der Bauart). Jeder Fall trägt eine NEGATIV-KONTROLLE.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { APP_WURZEL as WURZEL } from './appDateien';

function lies(pfad: string): string {
  return readFileSync(join(WURZEL, pfad), 'utf8');
}

describe('W2·31 Bündel D · Entscheid-Leser: Lesespalte hängt an der eigenen Breite', () => {
  const inhalt = lies('pages/EntscheidLeser.tsx');

  it('das Zweispalten-Grid zeichnet über @container/leser, nicht mehr über pk()/xl:', () => {
    expect(inhalt).toContain('<div className="@container/leser">');
    expect(inhalt).toContain(
      'className="flex flex-col gap-4 @[57rem]/leser:grid @[57rem]/leser:grid-cols-[minmax(0,40rem)_minmax(15rem,1fr)] @[57rem]/leser:items-start @[57rem]/leser:gap-8"',
    );
  });

  it('die order/col-start-Spalte darunter schaltet an derselben Schwelle @[57rem]/leser', () => {
    expect(inhalt).toContain(
      'className="order-2 min-w-0 @[57rem]/leser:order-1 @[57rem]/leser:col-start-1 @[57rem]/leser:row-start-1"',
    );
  });

  it('keine Viewport-Klasse xl:grid-cols-[minmax(0,40rem)…] mehr im Quelltext', () => {
    expect(inhalt).not.toMatch(/xl:grid-cols-\[minmax\(0,40rem\)_minmax\(15rem,1fr\)\]/);
    expect(inhalt).not.toMatch(/xl:order-1 xl:col-start-1 xl:row-start-1/);
  });

  it('NEGATIV-KONTROLLE: die Ausdrücke finden die Vorher-Form (pk()-Umschalter)', () => {
    // Wortlaut vor Bündel D (29.9.2026, Zeile ~994/1037).
    const vorherGrid =
      "<div className={pk(\n          'flex flex-col gap-4 xl:grid xl:grid-cols-[minmax(0,40rem)_minmax(15rem,1fr)] xl:items-start xl:gap-8',\n          'flex flex-col gap-4 @5xl/pane:grid @5xl/pane:grid-cols-[minmax(0,40rem)_minmax(15rem,1fr)] @5xl/pane:items-start @5xl/pane:gap-8',\n        )}>";
    const vorherOrder =
      "<div className={pk(\n            'order-2 min-w-0 xl:order-1 xl:col-start-1 xl:row-start-1',\n            'order-2 min-w-0 @5xl/pane:order-1 @5xl/pane:col-start-1 @5xl/pane:row-start-1',\n          )}>";
    expect(/xl:grid-cols-\[minmax\(0,40rem\)_minmax\(15rem,1fr\)\]/.test(vorherGrid)).toBe(true);
    expect(/xl:order-1 xl:col-start-1 xl:row-start-1/.test(vorherOrder)).toBe(true);
  });
});
