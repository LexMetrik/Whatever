// scripts/entstehung/curia-abruf.ts
// Abruf-Logik des Curia-Vista-Runners (E4, §11.6): globaler Takt, begrenzter
// Wiederholversuch, OData-Abfrage. Aus `curia-run.ts` VERHALTENSGLEICH herausgezogen
// (21.9.2026, Posten «Curia-Retry ist ungetestet»), weil der Runner Top-Level-Seiten-
// effekte hat und darum nicht importierbar ist — der Wiederholversuch war so durch
// keinen Test gedeckt. Die Aufruf-STELLEN mit ihren `$select`-Literalen bleiben im
// Runner (Personendaten-Grenze §11.8, der Test grept dort den Quelltext).
//
// WARUM NICHT `scripts/normtext/netz-retry.ts` (fetchMitWiederholung)? Der Baustein
// trägt eine andere Semantik, und jede Abweichung wäre hier ein Verhaltenswechsel (§1
// vor §17): er wiederholt auch 429, GIBT 4xx ZURÜCK statt zu werfen, rechnet den
// Backoff als basisMs·2^(n-1) (Curia: fest 1000/4000), setzt ein eigenes
// AbortSignal.timeout je Versuch, wirft mit eigener Meldung und kennt keinen Takt vor
// jedem Versuch. Darum hier die bestehende Logik unverändert, nur injizierbar.
//
// Injizierbar (§2, testbar ohne Netz und ohne Uhr): `fetchImpl`, `warte`, `drossel`,
// `log`. Defaults = das echte Verhalten des Monatslaufs.
import { CURIA_BASIS, odataZeilen, type OdataZeile } from './curia.ts';

// ── Drosselung: GLOBAL <= 2 Anfragen/s, unabhängig von der Nebenläufigkeit ─────
// Gemessen 11.9.2026: der Endpunkt antwortet mit ~3,5 s Latenz je Anfrage. Streng
// seriell (eine Anfrage, dann 500 ms Pause) dauert der Vollabgleich darum nicht die
// geplanten ~27 min, sondern ~3,5 h — die Pause war nie der Engpass, die Latenz ist es.
// Lösung: mehrere Geschäfte gleichzeitig, aber EIN gemeinsamer Takt vor jedem Absenden.
// Damit bleibt die Rate bei <= 2 Anfragen/s (R4 §5: bei dieser Rate keine 429/503), und
// die Wartezeit läuft parallel statt hintereinander.
// `Date.now` steht hier NUR im Takt, nie in den Daten (§2): das Abrufdatum kommt
// unverändert aus --datum, und kein Feld des Shards hängt an der Uhr des Laufs.
export const TAKT_MS = 500;
let naechsterStart = 0;
export async function drossel(): Promise<void> {
  const jetzt = Date.now();
  const ziel = Math.max(jetzt, naechsterStart + TAKT_MS);
  naechsterStart = ziel;
  if (ziel > jetzt) await new Promise((r) => setTimeout(r, ziel - jetzt));
}

// ── Wiederholversuch: NUR bei Zufallsstörungen des Netzes (§17-Wurzelfix) ─────
// BELEGTER ANLASS, 21.9.2026: der Vollabgleich starb bei 250 von 403 Geschäften an einem
// einzelnen `ConnectTimeoutError` (`UND_ERR_CONNECT_TIMEOUT`, 10 s) und warf ~20 Minuten
// Arbeit weg. Am 1.10.2026 läuft der Monatslauf, der die fehlenden Publikationen
// nachschreiben soll — er würde heute an derselben Zufallsstörung scheitern.
// GRENZE (§6.7): wiederholt wird NUR, was von selbst vorübergehen kann — ein
// Verbindungs-/Netzfehler oder ein 5xx. Ein 4xx ist unsere Anfrage (falscher Filter,
// falsche Entität) und wird durch Warten nicht richtig; eine fachlich unerwartete
// Antwortform (Content-Type, `__next`, weder `d[]` noch `d.results[]`) muss sofort laut
// scheitern, sonst verdeckte der Retry genau den Fehlertyp, den der Wächter finden soll.
export const VERSUCHE = 3;
export const BACKOFF_MS = [1000, 4000];   // exponentiell, gedeckelt — nie länger als der Lauf dauert

/** Injizierbare Umgebung des Abrufs; jedes weggelassene Feld = echtes Verhalten. */
export interface CuriaAbrufUmgebung {
  fetchImpl?: typeof fetch;
  warte?: (ms: number) => Promise<void>;
  drossel?: () => Promise<void>;
  log?: (zeile: string) => void;
}

const echteWarte = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/** Eine OData-Abfrage. `$select` nennt IMMER die Felder — nie `SELECT *` (§11.8). */
export async function odata(
  entitaet: string, filter: string, select?: string, umgebung: CuriaAbrufUmgebung = {},
): Promise<OdataZeile[]> {
  const fetchImpl = umgebung.fetchImpl ?? fetch;
  const takt = umgebung.drossel ?? drossel;
  const u = new URL(`${CURIA_BASIS}/${entitaet}`);
  u.searchParams.set('$filter', filter);
  if (select) u.searchParams.set('$select', select);
  u.searchParams.set('$format', 'json');
  for (let versuch = 1; ; versuch += 1) {
    // Jeder Versuch ist eine eigene Anfrage und geht darum durch denselben globalen Takt.
    await takt();
    let res: Response;
    try {
      res = await fetchImpl(u, { headers: { Accept: 'application/json' } });
    } catch (e) {
      // Verbindungsfehler (Timeout, DNS, Abbruch) — wiederholbar.
      if (versuch >= VERSUCHE) {
        throw new Error(
          `Curia nicht erreichbar für ${entitaet} (${filter}) — ${VERSUCHE} Versuche: ${String(e)}`,
          { cause: e },
        );
      }
      await wiederhole(versuch, entitaet, filter, String(e), umgebung);
      continue;
    }
    if (res.status >= 500) {
      // Serverseitig und vorübergehend — wiederholbar.
      if (versuch >= VERSUCHE) throw new Error(`Curia antwortet ${res.status} für ${entitaet} (${filter}) — auch nach ${VERSUCHE} Versuchen`);
      await wiederhole(versuch, entitaet, filter, `HTTP ${res.status}`, umgebung);
      continue;
    }
    if (!res.ok) throw new Error(`Curia antwortet ${res.status} für ${entitaet} (${filter})`);
    const typ = res.headers.get('content-type');
    if (typ && !/json/i.test(typ)) throw new Error(`Curia antwortet Content-Type «${typ}» statt JSON für ${entitaet}`);
    // Die URL mitgeben: der Paging-Wächter in `odataZeilen` soll sagen KÖNNEN, welche
    // Abfrage abgeschnitten wurde — eine Fehlermeldung ohne Fundstelle kostet eine Stunde.
    return odataZeilen(await res.json(), u.toString());
  }
}

/** Log JEDEN Wiederholversuch: ein stiller Dauer-Retry sähe sonst wie ein gesunder Lauf aus. */
async function wiederhole(
  versuch: number, entitaet: string, filter: string, grund: string, umgebung: CuriaAbrufUmgebung,
): Promise<void> {
  const ms = BACKOFF_MS[Math.min(versuch - 1, BACKOFF_MS.length - 1)];
  (umgebung.log ?? console.log)(`curia: Versuch ${versuch}/${VERSUCHE} für ${entitaet} (${filter}) gescheitert — ${grund}; neuer Versuch in ${ms} ms`);
  await (umgebung.warte ?? echteWarte)(ms);
}
