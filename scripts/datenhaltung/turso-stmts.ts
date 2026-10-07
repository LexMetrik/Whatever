// scripts/datenhaltung/turso-stmts.ts
// Statement-Bau fuer das Delta (E0-BRANDSCHUTZ, 7.10.2026): Mehrzeilen-INSERTs, Loeschungen,
// Request-Buendelung — alles PURE (kein Netz, kein node:sqlite), damit ein Test die
// Schranken pruefen kann.
//
// `ladeWerte()` in turso-sync.ts packt Zeilen nach derselben Regel und flusht die Requests in
// einer Schleife. Das Delta braucht die Packregel OHNE Senden (die Statements laufen in einer
// offenen Transaktion, mit Verifikationslesungen dazwischen). Sie steht hier darum ein
// zweites Mal — bewusst NICHT durch einen Umbau von `ladeWerte()` zusammengelegt: der
// Vollneubau-Pfad ist der verifizierte Rueckfall und bleibt Byte fuer Byte unangetastet (§1).
// Die Schranken kommen aus denselben Konstanten (turso-transport.ts); `turso-delta.test.ts`
// haelt fest, dass kein erzeugtes Statement/Request sie ueberschreitet.
import {
  zeilenBytes,
  MAX_PARAM_JE_STMT,
  MAX_BYTES_JE_STMT,
  MAX_BYTES_JE_REQUEST,
  STMT_OVERHEAD,
  TUPEL_TRENNER,
  REQUEST_OVERHEAD,
  type Stmt,
  type Wert,
} from './turso-transport';

/** Nutzlast EINES Statements in der Hrana-Kodierung (Argumente + SQL-Geruest). */
export function stmtBytes(s: Stmt): number {
  return STMT_OVERHEAD + Buffer.byteLength(s.sql, 'utf8') + zeilenBytes(s.args ?? []);
}

/**
 * Mehrzeilen-`<kopf> VALUES (…),(…)` — so viele Zeilen je Statement, wie Parameter- und
 * Byte-Schranke zulassen (mindestens eine, auch wenn sie allein uebergross ist: eine
 * uebersprungene Zeile waere stiller Datenverlust, vgl. MAX_BYTES_JE_REQUEST).
 * `kopf` ist alles bis vor `VALUES`, z. B. `INSERT INTO t (a, b)`.
 */
export function gruppiereInserts(kopf: string, spaltenAnzahl: number, werte: Wert[][]): Stmt[] {
  const sqlKopf = `${kopf} VALUES `;
  const tupel = `(${Array.from({ length: spaltenAnzahl }, () => '?').join(', ')})`;
  const tupelBytes = Buffer.byteLength(tupel, 'utf8') + TUPEL_TRENNER;
  const aus: Stmt[] = [];
  let i = 0;
  while (i < werte.length) {
    const gruppe: Wert[][] = [];
    let bytes = STMT_OVERHEAD + Buffer.byteLength(sqlKopf, 'utf8');
    while (i < werte.length) {
      const b = zeilenBytes(werte[i]) + tupelBytes;
      const passt =
        gruppe.length === 0 || ((gruppe.length + 1) * spaltenAnzahl <= MAX_PARAM_JE_STMT && bytes + b <= MAX_BYTES_JE_STMT);
      if (!passt) break;
      gruppe.push(werte[i]);
      bytes += b;
      i++;
    }
    aus.push({ sql: sqlKopf + gruppe.map(() => tupel).join(', '), args: gruppe.flat() });
  }
  return aus;
}

/** Loescht Zeilen ueber einen oder mehrere Schluesselspalten. Eine Schluesselspalte:
 *  `WHERE k IN (?,…)` in Paketen; mehrere: ein Statement je Zeile (die Tabellen mit
 *  zusammengesetztem Schluessel sind klein oder werden ueber die rowid geloescht). */
export function loescheStatements(tabelle: string, schluesselSpalten: string[], schluessel: Wert[][]): Stmt[] {
  if (schluessel.length === 0) return [];
  if (schluesselSpalten.length === 1) {
    const aus: Stmt[] = [];
    const paket = 500;
    for (let i = 0; i < schluessel.length; i += paket) {
      const teil = schluessel.slice(i, i + paket);
      aus.push({
        sql: `DELETE FROM ${tabelle} WHERE ${schluesselSpalten[0]} IN (${teil.map(() => '?').join(', ')})`,
        args: teil.map((k) => k[0]),
      });
    }
    return aus;
  }
  const bedingung = schluesselSpalten.map((s) => `${s} = ?`).join(' AND ');
  return schluessel.map((k) => ({ sql: `DELETE FROM ${tabelle} WHERE ${bedingung}`, args: k }));
}

/** Teilt Statements in Requests bis MAX_BYTES_JE_REQUEST (mindestens ein Statement je
 *  Request) — dieselbe Regel wie `ladeWerte()`: erst absenden, dann anhaengen. */
export function buendeleStatements(stmts: Stmt[]): Stmt[][] {
  const requests: Stmt[][] = [];
  let aktuell: Stmt[] = [];
  let bytes = REQUEST_OVERHEAD;
  for (const s of stmts) {
    const b = stmtBytes(s);
    if (aktuell.length > 0 && bytes + b > MAX_BYTES_JE_REQUEST) {
      requests.push(aktuell);
      aktuell = [];
      bytes = REQUEST_OVERHEAD;
    }
    aktuell.push(s);
    bytes += b;
  }
  if (aktuell.length > 0) requests.push(aktuell);
  return requests;
}
