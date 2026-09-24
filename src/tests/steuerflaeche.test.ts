// src/tests/steuerflaeche.test.ts — §6.7-Nachweis für `check:steuerflaeche`.
//
// Das Tor muss ROT werden können, und zwar in den drei Lagen, für die es gebaut
// ist: Fläche über der Grenze · Grenze heimlich angehoben · Anhebung ohne
// David-Entscheid. Alle Eingaben werden injiziert (reine Funktionen aus
// scripts/analyse/steuerflaeche.ts) — kein git, kein Dateisystem, kein Netz.
import { describe, expect, it } from 'vitest';
import {
  HEIL_SATZ, istFlaeche, klinkeUrteil, summeBytes, trendZeile, urteil, zielGrenze,
  type Grenze,
} from '../../scripts/analyse/steuerflaecheKern';

const grenze = (bytes: number, anhebungen: Grenze['anhebungen'] = []): Grenze => ({
  grenze_bytes: bytes, gesetzt: '2026-09-20', anhebungen,
});

describe('Flächen-Definition', () => {
  it('zählt Steuerungs-Dateien, nicht Produkt-Dateien', () => {
    expect(istFlaeche('.claude/skills/lehren/SKILL.md')).toBe(true);
    expect(istFlaeche('CLAUDE.md')).toBe(true);
    expect(istFlaeche('scripts/plan/next.ts')).toBe(true);
    expect(istFlaeche('scripts/analyse/steuerflaecheKern.ts')).toBe(true);
    expect(istFlaeche('.github/workflows/ci.yml')).toBe(true);
    // Helfer neben der Tor-Hülle — die Lücke, durch die am 19./20.9.2026
    // Steuerungs-Logik in Nachbar-Ordner auswich.
    expect(istFlaeche('scripts/tor-paritaet-sonden.ts')).toBe(true);
    expect(istFlaeche('scripts/gate.sh')).toBe(true);
    // Bug-Check 21.9.2026, Auflage 2: der erste neue Top-Level-Helfer nach dem
    // Bau der Klinke (#955) wäre an der abschliessenden Liste vorbeigerutscht.
    expect(istFlaeche('scripts/aufraeumen-git.ts')).toBe(true);
    // Produkt und Rechtsdaten sind keine Steuerung.
    expect(istFlaeche('src/lib/vorlagen/kuendigung.ts')).toBe(false);
    expect(istFlaeche('scripts/normtext/check-drift.ts')).toBe(false);
    expect(istFlaeche('ROADMAP.md')).toBe(false);
  });

  it('nimmt Rechtsschutz-Prüfungen aus (CLAUDE.md §1)', () => {
    expect(istFlaeche('scripts/check-gegenpruefung.ts')).toBe(false);
    expect(istFlaeche('scripts/check-merge-schutz.ts')).toBe(false);
    expect(istFlaeche('scripts/check-ui-normzitate.ts')).toBe(false);
    expect(istFlaeche('.github/workflows/fedlex-frische.yml')).toBe(false);
    // Gegenprobe: ein NICHT rechtsschützendes Tor derselben Fläche zählt.
    expect(istFlaeche('scripts/check-tor-paritaet.ts')).toBe(true);
  });

  it('nimmt Testtreue (§6.3) aus — Wächter samt Helfer', () => {
    expect(istFlaeche('scripts/check-fachaenderung.ts')).toBe(false);
    expect(istFlaeche('scripts/analyse/fachaenderung-kern.ts')).toBe(false);
  });

  it('zählt Tests nie mit — §6.7 verlangt sie', () => {
    expect(istFlaeche('scripts/analyse/tor-bewaehrung.test.ts')).toBe(false);
  });
});

describe('§6.7 — das Tor wird rot', () => {
  const dateien = [
    { pfad: 'a.md', bytes: 600 * 1024 },
    { pfad: 'b.md', bytes: 500 * 1024 },
  ];
  const ist = summeBytes(dateien); // 1100 KB

  it('(d) Normalstand ⇒ GRÜN', () => {
    const r = urteil({ ist, grenze: grenze(1200 * 1024), basis: grenze(1200 * 1024), zuwaechse: [] });
    expect(r.ok).toBe(true);
    expect(r.zeilen[0]).toContain('check:steuerflaeche OK');
  });

  it('(a) Grenze unter Ist ⇒ ROT, mit den grössten Zuwächsen und dem Heil-Satz', () => {
    const r = urteil({
      ist,
      grenze: grenze(1000 * 1024),
      basis: grenze(1000 * 1024),
      zuwaechse: [
        { pfad: 'klein.md', bytes: 1024 },
        { pfad: 'gross.md', bytes: 50 * 1024 },
      ],
    });
    expect(r.ok).toBe(false);
    const text = r.zeilen.join('\n');
    expect(text).toContain('1100.0 KB > Grenze 1000.0 KB');
    // Absteigend sortiert: der grösste Zuwachs steht zuerst.
    expect(text.indexOf('gross.md')).toBeLessThan(text.indexOf('klein.md'));
    expect(text).toContain(HEIL_SATZ);
  });

  it('(b) Grenze gegenüber origin/main angehoben, ohne Eintrag ⇒ ROT', () => {
    const r = urteil({
      ist, grenze: grenze(1500 * 1024), basis: grenze(1200 * 1024), zuwaechse: [],
    });
    expect(r.ok).toBe(false);
    expect(r.zeilen.join('\n')).toContain('SPERRKLINKE');
  });

  it('(b2) Anhebung mit leerem `entscheid` ⇒ ROT — Reibung, nicht Formalie', () => {
    const anhebung = {
      datum: '2026-10-03', von: 1200 * 1024, auf: 1500 * 1024,
      grund: 'neues Tor', entscheid: '   ',
    };
    expect(klinkeUrteil(grenze(1500 * 1024, [anhebung]), grenze(1200 * 1024))).not.toBeNull();
  });

  it('(c) Anhebung mit datiertem Entscheid ⇒ GRÜN', () => {
    const anhebung = {
      datum: '2026-10-03', von: 1200 * 1024, auf: 1500 * 1024,
      grund: 'neues Tor', entscheid: 'David 3.10.2026, Chat',
    };
    const r = urteil({
      ist, grenze: grenze(1500 * 1024, [anhebung]), basis: grenze(1200 * 1024), zuwaechse: [],
    });
    expect(r.ok).toBe(true);
  });

  it('ein ALTER Eintrag rechtfertigt keine NEUE Anhebung', () => {
    const alt = {
      datum: '2026-10-03', von: 1200 * 1024, auf: 1500 * 1024,
      grund: 'neues Tor', entscheid: 'David 3.10.2026, Chat',
    };
    // Basis trägt den Eintrag bereits; die Grenze steigt trotzdem weiter.
    expect(klinkeUrteil(grenze(1800 * 1024, [alt]), grenze(1500 * 1024, [alt]))).not.toBeNull();
  });

  it('Absenken ist immer erlaubt', () => {
    expect(klinkeUrteil(grenze(900 * 1024), grenze(1200 * 1024))).toBeNull();
  });

  it('fehlende Basis (flacher Klon) ⇒ nie still grün, sondern mit Hinweis', () => {
    const r = urteil({
      ist, grenze: grenze(1200 * 1024), basis: null, zuwaechse: [],
      basisHinweis: 'kein Vergleichsstand — SPERRKLINKE nicht geprüft.',
    });
    expect(r.ok).toBe(true);
    expect(r.zeilen.join('\n')).toContain('SPERRKLINKE nicht geprüft');
  });
});

describe('Klinke zieht nur nach unten', () => {
  it('Ziel = Ist + 5 %, auf volle KB aufgerundet', () => {
    expect(zielGrenze(1000 * 1024)).toBe(1050 * 1024);
    expect(zielGrenze(1356.5 * 1024)).toBe(1425 * 1024);
  });
});

describe('Trendzeile für plan:next', () => {
  const reihe = [
    { datum: '2026-08-15', bytes: 900 * 1024 },
    { datum: '2026-09-01', bytes: 950 * 1024 },
  ];
  const heute = '2026-09-20';

  it('nennt Ist, Grenze, Luft und den Vergleichspunkt mit SEINEM Datum', () => {
    const s = trendZeile({ ist: 1000 * 1024, grenze: grenze(1050 * 1024), reihe, heute });
    expect(s).toBe('📐 Steuerung: 1000.0 KB von 1050.0 KB (Luft 50.0 KB) · Trend seit 2026-08-15: +100.0 KB');
  });

  it('zeigt Schrumpfen als Minus', () => {
    expect(trendZeile({ ist: 800 * 1024, grenze: grenze(1050 * 1024), reihe, heute }))
      .toContain('Trend seit 2026-08-15: −100.0 KB');
  });

  it('schweigt über den Trend, wenn die Reihe keine Spalte trägt', () => {
    const s = trendZeile({ ist: 1000 * 1024, grenze: grenze(1050 * 1024), reihe: [], heute });
    expect(s).not.toContain('Trend');
    expect(s).toContain('Luft 50.0 KB');
  });

  it('hängt den Nachzieh-Hinweis erst an, wenn > 10 KB Absenkung möglich sind', () => {
    // Ist+5 % = 1050 KB, Grenze 1055 KB ⇒ nur 5 KB Absenkung ⇒ kein Hinweis.
    expect(trendZeile({ ist: 1000 * 1024, grenze: grenze(1055 * 1024), reihe, heute }))
      .not.toContain('nachziehen');
    // Grenze 1200 KB ⇒ 150 KB Absenkung möglich ⇒ Hinweis.
    expect(trendZeile({ ist: 1000 * 1024, grenze: grenze(1200 * 1024), reihe, heute }))
      .toContain('npm run steuerflaeche -- --nachziehen');
  });
});
