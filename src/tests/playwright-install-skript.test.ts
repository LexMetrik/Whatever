// src/tests/playwright-install-skript.test.ts — scripts/ci/playwright-install.sh im Testmodus.
// Anlass: W2·18-FEHLERBUCH (1.10.2026) — «apt nur wenn nötig». §6.7: die Startprobe muss
// scheitern KÖNNEN; scheitert sie, muss der apt-Weg laufen, und scheitern Probe UND apt,
// bleibt der Schritt rot (kein stiller Grün-Durchlauf). Kein Browser nötig: die Probe wird
// über LEXMETRIK_PROBE_CMD ersetzt (der echte Start wurde am 1.10.2026 lokal mit einem
// Fake-Chromium belegt, der «error while loading shared libraries» meldet, Exit 127).
import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const SKRIPT = join(process.cwd(), 'scripts/ci/playwright-install.sh');

function fahre(env: Record<string, string>) {
  // Eigene Umgebung ohne GITHUB_ACTIONS, sonst greift der B2-Riegel schon vor dem Fall.
  const basis = { ...process.env };
  delete basis.GITHUB_ACTIONS;
  const r = spawnSync('bash', [SKRIPT], {
    env: {
      ...basis,
      LEXMETRIK_SPERRE_TEST: '/nicht/vorhanden',
      LEXMETRIK_NODEPS_CMD: 'true',
      LEXMETRIK_INSTALL_CMD: 'echo APT-ZWEIG-LIEF',
      ...env,
    },
    encoding: 'utf8',
    timeout: 60_000,
  });
  return { status: r.status, out: `${r.stdout}${r.stderr}` };
}

describe('playwright-install.sh — apt nur wenn nötig', () => {
  it('Probe grün → apt übersprungen, apt-Befehl wird nie ausgeführt', () => {
    const r = fahre({ LEXMETRIK_PROBE_CMD: 'true' });
    expect(r.status).toBe(0);
    expect(r.out).toContain('apt übersprungen');
    expect(r.out).not.toContain('APT-ZWEIG-LIEF');
  });

  it('Probe rot (fehlende Bibliothek, Exit 127) → apt-Weg läuft', () => {
    const r = fahre({ LEXMETRIK_PROBE_CMD: 'lexmetrik-gibt-es-nicht' });
    expect(r.status).toBe(0);
    expect(r.out).not.toContain('apt übersprungen');
    expect(r.out).toContain('Startprobe fehlgeschlagen (Exit 127)');
    expect(r.out).toContain('APT-ZWEIG-LIEF');
  });

  it('Probe hängt (Zeitlimit) → apt-Weg läuft', () => {
    const r = fahre({ LEXMETRIK_PROBE_CMD: 'sleep 60', LEXMETRIK_PROBE_TIMEOUT: '1' });
    expect(r.status).toBe(0);
    expect(r.out).toContain('Exit 124');
    expect(r.out).toContain('APT-ZWEIG-LIEF');
  }, 45_000); // 1 s Limit + 15 s Kill-Kulanz der Wache

  it('no-deps-Install scheitert → apt-Weg läuft, Probe wird nicht befragt', () => {
    const r = fahre({ LEXMETRIK_NODEPS_CMD: 'false', LEXMETRIK_PROBE_CMD: 'true' });
    expect(r.status).toBe(0);
    expect(r.out).not.toContain('apt übersprungen');
    expect(r.out).toContain('APT-ZWEIG-LIEF');
  });

  it('Probe rot UND apt rot → Exit 1, kein stiller Grün-Durchlauf', () => {
    const r = fahre({ LEXMETRIK_PROBE_CMD: 'false', LEXMETRIK_INSTALL_CMD: 'false' });
    expect(r.status).toBe(1);
    expect(r.out).not.toContain('apt übersprungen');
    expect(r.out).toContain('Shard rot');
  });

  it('B2-Riegel: neue Testmodus-Variablen sind in echter CI gesperrt', () => {
    for (const v of ['LEXMETRIK_PROBE_CMD', 'LEXMETRIK_NODEPS_CMD', 'LEXMETRIK_PROBE_TIMEOUT']) {
      const r = spawnSync('bash', [SKRIPT], {
        env: { PATH: process.env.PATH ?? '', GITHUB_ACTIONS: 'true', [v]: 'true' },
        encoding: 'utf8',
        timeout: 20_000,
      });
      expect(r.status, v).toBe(1);
      expect(`${r.stdout}${r.stderr}`, v).toContain('Testmodus-Variablen in CI gesetzt');
    }
  });
});
