// src/tests/plan-lage-alarme.test.ts — Alarm-Zeile im Lage-Block von `plan:next`
// (QS-MONITOR-ROT, Entscheid David 1.10.2026). Leser der Alarm-Zettel
// (Labels `alarm:*`, Autor github-actions[bot]) ist die nächste Session.
import { describe, expect, it, vi } from 'vitest';
import { alarmZeile, lageBlock, type Laufe, sammleAlarme } from '../../scripts/plan/lage';

const issue = (number: number, label: string | null, created: string, title = '🔴 rot', pr = false) => ({
  number,
  title,
  created_at: created,
  labels: label ? [{ name: 'bug' }, { name: label }] : [{ name: 'bug' }],
  ...(pr ? { pull_request: { url: 'x' } } : {}),
});

describe('alarmZeile — reine Formatierung über die Issues-Antwort', () => {
  it('keine Alarme → «keine offenen»', () => {
    expect(alarmZeile('[]')).toBe('🚨 Alarme: — (keine offenen)');
  });

  it('zwei Alarme, einer ESKALATION → nach Nummer, Datum ohne führende Null', () => {
    const json = JSON.stringify([
      issue(956, 'alarm:normen-monitor', '2026-09-21T03:12:00Z', 'ESKALATION: 🔴 Normen-Monitor rot (2026-09-21)'),
      issue(750, 'alarm:waechter', '2026-09-07T06:00:00Z'),
    ]);
    expect(alarmZeile(json)).toBe('🚨 Alarme: #750 waechter (seit 7.9.) · #956 normen-monitor (seit 21.9., ESKALATION)');
  });

  it('Datum am Monatsersten', () => {
    expect(alarmZeile(JSON.stringify([issue(1300, 'alarm:prod-smoke', '2026-10-01T00:05:00Z')]))).toBe(
      '🚨 Alarme: #1300 prod-smoke (seit 1.10.)',
    );
  });

  it('PR mit alarm-Label ausgeschlossen, Issue ohne alarm-Label ignoriert', () => {
    const json = JSON.stringify([
      issue(801, 'alarm:waechter', '2026-09-10T00:00:00Z', 'PR', true),
      issue(802, null, '2026-09-10T00:00:00Z'),
      issue(803, 'kein-alarm:x', '2026-09-10T00:00:00Z'),
    ]);
    expect(alarmZeile(json)).toBe('🚨 Alarme: — (keine offenen)');
  });

  it('kaputtes JSON / kein Array → Hinweiszeile, kein Wurf', () => {
    expect(alarmZeile('{"message": "Bad cred')).toBe('🚨 Alarme: nicht abrufbar (Antwort unlesbar)');
    expect(alarmZeile('{"message":"Bad credentials"}')).toBe('🚨 Alarme: nicht abrufbar (Antwort unlesbar)');
    expect(alarmZeile('[{"number":1}]')).toBe('🚨 Alarme: nicht abrufbar (Antwort unlesbar)');
  });
});

describe('sammleAlarme — ein gh-Aufruf, Ausfall = Hinweiszeile', () => {
  it('fragt offene Bot-Issues des Repos aus dem gh-Kontext ab', () => {
    const laufe = vi.fn<Laufe>(() => '[]');
    expect(sammleAlarme(laufe)).toBe('🚨 Alarme: — (keine offenen)');
    expect(laufe).toHaveBeenCalledTimes(1);
    const [cmd, args] = laufe.mock.calls[0];
    expect(cmd).toBe('gh');
    expect(args.join(' ')).toMatch(/^api repos\/\{owner\}\/\{repo\}\/issues\?state=open&creator=github-actions%5Bbot%5D/);
  });

  it('Timeout bzw. fehlendes gh → Grund kurz, nie Wurf', () => {
    const wirf = (code: string): Laufe => () => { throw Object.assign(new Error('x'), { code }); };
    expect(sammleAlarme(wirf('ETIMEDOUT'))).toBe('🚨 Alarme: nicht abrufbar (Timeout)');
    expect(sammleAlarme(wirf('ENOENT'))).toBe('🚨 Alarme: nicht abrufbar (gh fehlt)');
    expect(sammleAlarme(() => { throw new Error('exit 1'); })).toBe('🚨 Alarme: nicht abrufbar (gh-Fehler)');
  });

  it('lageBlock: Zeile direkt unter dem Kopf; Ausfall nicht in der ⚠️-Sammelzeile', () => {
    const laufe: Laufe = (cmd) => {
      if (cmd === 'gh') throw Object.assign(new Error('x'), { code: 'ETIMEDOUT' });
      return '';
    };
    const z = lageBlock([], [], { prs: false, laufe });
    expect(z[2]).toBe('🚨 Alarme: nicht abrufbar (Timeout)');
    expect(z.filter((s) => s.startsWith('⚠️'))).toEqual([]);
  });
});
