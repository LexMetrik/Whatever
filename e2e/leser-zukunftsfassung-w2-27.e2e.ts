// @shard-gruppe: 4
/**
 * W2·27 (BUND-FERTIG §4 b) — der Zukunftsfassungs-Hinweis im Leserkopf.
 *
 * Geprüft wird am ausgelieferten Stand, was die Unit-Sonde nicht sehen kann:
 * dass der Hinweis IM ERLASS-KOPF steht, dass er ein anklickbares amtliches
 * Ziel hat — und dass er am Erlass ohne künftige Fassung GAR NICHT existiert
 * (kein leeres Element, kein reservierter Platz).
 *
 * ERLASS-WAHL AUS DEN DATEN, NICHT AUS DEM GEDÄCHTNIS. Welcher Bundeserlass
 * eine künftige Fassung trägt, ändert sich mit jedem Currency-Lauf (heute 62
 * von 1 578). Ein fest verdrahtetes Kürzel wäre darum eine Sonde mit
 * Verfallsdatum: sie würde rot, ohne dass sich am Verhalten etwas geändert
 * hätte. Beide Erlasse kommen deshalb aus den Artefakten, die die Seite selbst
 * ausliefert — deterministisch sortiert, damit der Lauf reproduzierbar ist (§2).
 *
 * ANKER `header:has(h1)`: der Erlass-Kopf ist der einzige Kopf der Seite mit
 * einer H1 (Herleitung samt zwei Fehlversuchen in `leser-kopf-cls-s3.e2e.ts`).
 * Ohne diesen Scope träfe der Satz auch die Übersichtsbox der Seitenleiste.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from '@playwright/test';

const PUB = join(process.cwd(), 'public', 'normtext');
type Eintrag = { geprueftAm?: string; naechsteFassungAb?: string };
type Erlass = { key: string; ebene: string; quelleUrl: string; aufgehoben?: unknown };

const currency = JSON.parse(readFileSync(join(PUB, 'currency.json'), 'utf8')) as Record<string, Eintrag>;
const erlasse = (JSON.parse(readFileSync(join(PUB, 'register.json'), 'utf8')) as { erlasse: Erlass[] })
  .erlasse.filter((e) => e.ebene === 'bund' && !e.aufgehoben);

const MIT = erlasse
  .filter((e) => currency[e.key]?.naechsteFassungAb)
  .sort((a, b) => a.key.localeCompare(b.key))[0];
const OHNE = erlasse
  .filter((e) => currency[e.key] && !currency[e.key].naechsteFassungAb)
  .sort((a, b) => a.key.localeCompare(b.key))[0];

const DATUM_CH = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;

test('Erlass MIT künftiger Fassung: Hinweis im Kopf, verlinkt auf die datierte amtliche Fassung', async ({ page }) => {
  expect(MIT, 'kein Bundeserlass mit `naechsteFassungAb` im ausgelieferten Bestand').toBeTruthy();
  const ab = currency[MIT.key].naechsteFassungAb!;
  await page.goto(`/gesetze/bund/${MIT.key}`);

  const kopf = page.locator('header:has(h1)');
  const hinweis = kopf.getByRole('link', { name: new RegExp(`nächste Fassung ab ${DATUM_CH(ab).replace(/\./g, '\\.')}`) });
  await expect(hinweis).toBeVisible({ timeout: 20_000 });

  // Das Ziel ist die Manifestation GENAU DIESER Fassung — die ELI-Adresse des
  // Erlasses mit dem Fassungsdatum vor dem Sprachsegment. Geprüft wird die
  // ganze Adresse, nicht ein Teilstück: ein Link auf die GELTENDE Fassung
  // (also ohne Datumssegment) wäre hier der wahrscheinlichste Rückfall, und
  // ein Substring-Test würde ihn durchlassen (§7, Identität statt Präsenz).
  const ziel = `${MIT.quelleUrl.replace(/\/(de|fr|it|rm|en)$/, '')}/${ab.replace(/-/g, '')}/${MIT.quelleUrl.slice(-2)}`;
  await expect(hinweis).toHaveAttribute('href', ziel);
  await expect(hinweis).toHaveAttribute('target', '_blank');
  await expect(hinweis).toHaveAttribute('rel', /noopener/);
});

test('Erlass OHNE künftige Fassung: kein Hinweis, kein leeres Element', async ({ page }) => {
  expect(OHNE, 'kein Bundeserlass ohne `naechsteFassungAb` im ausgelieferten Bestand').toBeTruthy();
  await page.goto(`/gesetze/bund/${OHNE.key}`);
  const kopf = page.locator('header:has(h1)');
  // Erst auf den Kopf warten — sonst prüfte man die Abwesenheit auf einer
  // Seite, die noch gar nichts gerendert hat (ein Tor, das nicht scheitern
  // kann, §6.7).
  await expect(kopf.locator('h1')).toBeVisible({ timeout: 20_000 });
  await expect(kopf.getByText(/nächste Fassung ab|gilt eine neuere Fassung/)).toHaveCount(0);
});
