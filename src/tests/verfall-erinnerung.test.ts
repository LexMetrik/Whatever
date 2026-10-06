// Tests der Verfall-Erinnerung: reine Auswahl (Stichtag als Parameter, §2), Zettel-Text
// und das CLI-Verhalten «Exit 0 auch bei Überschreitung» (Erinnerung färbt nie rot).
// Stichtag bewusst ≠ Monatserster (2026-10-06); Monats-/Jahres-/Schaltjahrgrenzen explizit.
// Rechen-Fälle laufen gegen ein FIXTURE-Register (feste Termine): ein planmässig nachgeführtes
// echtes Register darf einen reinen Register-PR nie rot färben. Gegen das echte Register wird nur
// geprüft, dass es lesbar ist und ≥ 1 Termin liefert (und der CLI-Lauf funktioniert).
import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { sammleTermine, type Termin } from '../../scripts/verfall-parse.ts';
import { findeZeile, tageZwischen, waehleErinnerungen, zettelText, zettelTitel } from '../../scripts/verfall-erinnerung-kern.ts';

const WURZEL = resolve(__dirname, '../..');
const echtesRegister = readFileSync(join(WURZEL, 'bibliothek/register/parameter-verfall.md'), 'utf8');

/** Fixture-Register im Format des echten (Tabelle + Freitext «bis DD.MM.YYYY»), Termine fest. */
const md = [
  '| Parameter | Fundstelle | Wert/Stand | Rhythmus | Nächste Prüfung |',
  '|---|---|---|---|---|',
  '| Formularpflicht-Kantone (Mietzins) | `mietvertrag.ts` | BWO 4.2.2026 | jährlich | **1.11.2026 (BE!)** |',
  '| Hypothekarischer Referenzzinssatz | `mietvertrag.ts` | 1.25 % | quartalsweise | 1.12.2026 |',
  '| Kantonale Mindestlöhne | `arbeitsvertrag.ts` | je Eintrag datiert | jährlich | Jan. 2027 |',
  '| Künftige Fassung X | `fedlex-cache.sh` | Pin | automatisch | 1.3.2027 |',
  '| Ohne Termin | `x.ts` | — | offen | bei Nutzerbedarf |',
  '',
  '- Übergangsfrist Muster läuft BIS 30.6.2027 — Folgefassung prüfen.',
].join('\n');
const { termine: registerTermine } = sammleTermine(md);

const t = (datum: string, label = `T ${datum}`): Termin => ({ label, datum, quelle: 'Tabelle', fundstelle: '`x.ts`' });
const STICHTAG = '2026-10-06';

describe('tageZwischen', () => {
  it('rechnet kalendarisch über Monats-, Jahres- und Schaltjahrgrenzen', () => {
    expect(tageZwischen('2026-10-06', '2026-10-06')).toBe(0);
    expect(tageZwischen('2026-10-06', '2026-11-20')).toBe(45);
    expect(tageZwischen('2027-12-31', '2028-01-01')).toBe(1);
    expect(tageZwischen('2028-02-28', '2028-03-01')).toBe(2); // Schaltjahr
    expect(tageZwischen('2027-02-28', '2027-03-01')).toBe(1);
    expect(tageZwischen('2026-10-06', '2026-10-05')).toBe(-1);
  });
  it('wirft bei Nicht-ISO (kein stilles NaN)', () => {
    expect(() => tageZwischen('6.10.2026', '2026-11-01')).toThrow();
  });
});

describe('waehleErinnerungen — Fenster ≤ 45 Tage / überschritten / später', () => {
  const a = waehleErinnerungen(
    [t('2026-10-05'), t('2026-10-06'), t('2026-11-20'), t('2026-11-21'), t('2027-06-01'), t('2026-09-01')],
    STICHTAG,
    45,
  );
  it('überschritten = Termin VOR dem Stichtag (wie check:verfall «VERFALLEN»)', () => {
    expect(a.ueberschritten.map((f) => [f.termin.datum, f.tage])).toEqual([['2026-09-01', -35], ['2026-10-05', -1]]);
  });
  it('bald = Stichtag selbst bis einschliesslich Tag 45', () => {
    expect(a.bald.map((f) => [f.termin.datum, f.tage])).toEqual([['2026-10-06', 0], ['2026-11-20', 45]]);
  });
  it('Tag 46 und später stehen in keiner Liste', () => {
    const alle = [...a.ueberschritten, ...a.bald].map((f) => f.termin.datum);
    expect(alle).not.toContain('2026-11-21');
    expect(alle).not.toContain('2027-06-01');
  });
  it('Vorlauf ist Parameter (kein verstecktes 45)', () => {
    expect(waehleErinnerungen([t('2026-10-10')], STICHTAG, 3).bald).toHaveLength(0);
    expect(waehleErinnerungen([t('2026-10-10')], STICHTAG, 4).bald).toHaveLength(1);
  });
  it('sortiert nach Datum, dann Label (deterministisch)', () => {
    const r = waehleErinnerungen([t('2026-11-01', 'B'), t('2026-10-20', 'Z'), t('2026-11-01', 'A')], STICHTAG, 45);
    expect(r.bald.map((f) => f.termin.label)).toEqual(['Z', 'A', 'B']);
  });
});

describe('Fixture-Register (feste Termine, unabhängig vom echten Register)', () => {
  const finde = (a: ReturnType<typeof waehleErinnerungen>, teil: string) =>
    [...a.ueberschritten, ...a.bald].find((f) => f.termin.label.includes(teil));
  it('Fixture liefert die vier Tabellen-Termine plus den Freitext-Termin', () => {
    expect(registerTermine.map((x) => x.datum)).toEqual(['2026-11-01', '2026-12-01', '2027-01-01', '2027-03-01', '2027-06-30']);
  });
  it('6.10.2026: Formularpflicht (1.11.2026) ist im Fenster, nicht überschritten', () => {
    const f = finde(waehleErinnerungen(registerTermine, STICHTAG), 'Formularpflicht-Kantone');
    expect(f?.tage).toBe(26);
  });
  it('15.12.2026: Formularpflicht und Referenzzinssatz sind überschritten', () => {
    const a = waehleErinnerungen(registerTermine, '2026-12-15');
    expect(a.ueberschritten.some((f) => f.termin.label.includes('Formularpflicht-Kantone'))).toBe(true);
    expect(a.ueberschritten.some((f) => f.termin.label.includes('Referenzzinssatz'))).toBe(true);
  });
  it('1.9.2026: Formularpflicht (Tag 61) liegt noch ausserhalb', () => {
    expect(finde(waehleErinnerungen(registerTermine, '2026-09-01'), 'Formularpflicht-Kantone')).toBeUndefined();
  });
});

describe('echtes Register (nur Lesbarkeit, keine Termin-Abhängigkeit)', () => {
  it('ist lesbar und liefert mindestens einen Termin', () => {
    expect(sammleTermine(echtesRegister).termine.length).toBeGreaterThanOrEqual(1);
  });
});

describe('zettelText / zettelTitel', () => {
  const o = { registerPfad: 'bibliothek/register/parameter-verfall.md', registerMd: md, repoUrl: 'https://github.com/o/r' };
  const a = waehleErinnerungen(registerTermine, '2026-12-15');
  const text = zettelText(a, o);
  it('überschrittene stehen zuoberst, deutlich markiert, vor dem Fenster-Abschnitt', () => {
    expect(text.indexOf('ÜBERSCHRITTEN')).toBeGreaterThan(-1);
    expect(text.indexOf('ÜBERSCHRITTEN')).toBeLessThan(text.indexOf('Fällig in den nächsten'));
  });
  it('färbt nie rot: kein Rot-Symbol', () => {
    expect(text + zettelTitel(a)).not.toMatch(/🔴|🟥|❌/u);
  });
  it('nennt je Eintrag Termin, klickbaren Register-Anker (Zeile) und den Handgriff', () => {
    expect(text).toContain('`2026-11-01`');
    expect(text).toMatch(/\[bibliothek\/register\/parameter-verfall\.md#L\d+\]\(https:\/\/github\.com\/o\/r\/blob\/main\/bibliothek\/register\/parameter-verfall\.md\?plain=1#L\d+\)/);
    expect(text).toContain('fachlich prüfen');
    expect(text).toContain('Register nachführen');
  });
  it('ohne Überschreitung kein Überschritten-Abschnitt', () => {
    const b = zettelText(waehleErinnerungen(registerTermine, STICHTAG), o);
    expect(b).not.toContain('ÜBERSCHRITTEN');
    expect(b).toContain('Formularpflicht-Kantone');
  });
  it('findeZeile liefert die Register-Zeile des Eintrags', () => {
    const f = registerTermine.find((x) => x.label.includes('Formularpflicht-Kantone'))!;
    const n = findeZeile(md, f)!;
    expect(md.split('\n')[n - 1]).toContain('Formularpflicht-Kantone');
  });
  it('Titel nennt Stichtag und beide Zahlen', () => {
    expect(zettelTitel(a)).toBe(`Verfall-Erinnerung (2026-12-15): ${a.bald.length} Termine in ≤ 45 Tagen, ${a.ueberschritten.length} überschritten`);
  });
});

describe('CLI report:verfall-erinnerung', () => {
  const lauf = (args: string[], env: Record<string, string> = {}) =>
    spawnSync(join(WURZEL, 'node_modules/.bin/vite-node'), ['scripts/verfall-erinnerung.ts', '--', ...args], {
      cwd: WURZEL,
      encoding: 'utf8',
      env: { ...process.env, ...env },
    });
  it('Exit 0 auch bei überschrittenen Terminen; schreibt auswahl.json + zettel.md; GITHUB_OUTPUT-Zahlen', () => {
    const out = mkdtempSync(join(tmpdir(), 've-'));
    const gh = join(out, 'github-output');
    // Stichtag weit in der Zukunft: jeder Termin des echten Registers ist überschritten,
    // unabhängig von dessen Pflegestand.
    const r = lauf(['--stichtag=2099-06-15', `--out=${out}`], { GITHUB_OUTPUT: gh });
    expect(r.status).toBe(0);
    const ausgabe = readFileSync(gh, 'utf8');
    const a0 = waehleErinnerungen(sammleTermine(echtesRegister).termine, '2099-06-15');
    expect(ausgabe).toContain(`faellig=${a0.bald.length + a0.ueberschritten.length}\n`);
    expect(ausgabe).toContain(`ueberschritten=${a0.ueberschritten.length}\n`);
    const auswahl = JSON.parse(readFileSync(join(out, 'auswahl.json'), 'utf8'));
    expect(auswahl.ueberschritten.length).toBeGreaterThan(0);
    expect(readFileSync(join(out, 'zettel.md'), 'utf8')).toContain('ÜBERSCHRITTEN');
  });
  it.each(['15.12.2026', '2026-13-45', '2026-02-30', '2027-02-29', '2026-00-10'])(
    'Exit 1 nur bei kaputter Eingabe (ungültiger Stichtag «%s»)',
    (stichtag) => {
      const r = lauf([`--stichtag=${stichtag}`, `--out=${mkdtempSync(join(tmpdir(), 've-'))}`]);
      expect(r.status).toBe(1);
      expect(r.stderr).toContain('--stichtag');
    },
  );
  it('gültiger Schalttag 2028-02-29 wird akzeptiert (Exit 0)', () => {
    const r = lauf(['--stichtag=2028-02-29', `--out=${mkdtempSync(join(tmpdir(), 've-'))}`]);
    expect(r.status).toBe(0);
  });
});
