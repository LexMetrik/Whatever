// scripts/plan/set.ts
import { readFileSync, writeFileSync } from 'node:fs';
import { parseEtikett, serializeEtikett } from './etikett';
import { bindeCheckbox, checkboxAus, CHECKBOX_STATUS, CHRONIK_DATEI, chronikErledigte, dateiLeser, parseRoadmap, ladeChronikDone } from './parse';
import { resolve } from './aufloesen';
import { obersterMarkerId } from './marker';

// `feld` IST setzbar (anders als das gestrichene `groesse`): es steuert die
// Lane-Bildung und die Kollisionswarnung, also muss es aus dem Werkzeug heraus
// korrigierbar sein. Ein Tippfehler bleibt trotzdem nicht still — check.ts
// Regel 14 prüft das Vokabular und nennt die sieben zulässigen Werte.
const FELDER = new Set(['id', 'status', 'blocker', 'dep', 'feld', 'fahrplan']);
// Marke, die ein Statuswechsel setzt, WENN die bestehende nicht schon passt.
//
// `parked: '[d]'`/`blocked: '[d]'` waren am 31.7.2026 kurzzeitig hier (Fund
// R2-9/R2-15) und sind am selben Tag wieder zurückgenommen (Fund R3-2): Begründet
// war nur das BEWAHREN einer vorhandenen `[d]`-Marke, und das hängt an der
// CHECKBOX_STATUS-Abfrage unten, nicht an dieser Tabelle. Als ERZEUGER richtete
// der Eintrag Schaden an — ein bloss blockierter Schritt trug danach die Legende
// «geparkt/zurückgestellt» (§8), und derselbe Status `blocked` erschien je nach
// Vorzustand als `[ ]` oder `[d]`; kein Tor sah es, weil CHECKBOX_STATUS beide
// duldet. Normalform ist `[ ]`; wer parken WILL, setzt `[d]` von Hand.
const CHECKBOX_FUER: Record<string, string> = { done: '[x]', wip: '[~]' };
const CHECKBOX_ERSATZ_RE = /([-*+][ \t]*)\[[ xX~dD]\]/;

/**
 * @param leseDatei injizierter Datei-Leser, allein für die Diagnose unten
 *   (ROADMAP-CHRONIK.md). Injiziert statt fest verdrahtet, damit `setField` rein
 *   und dateisystemfrei testbar bleibt — wie `pruefe` in check.ts.
 */
export function setField(
  md: string,
  id: string,
  feld: string,
  wert: string,
  leseDatei: (p: string) => string | null = dateiLeser,
): string {
  if (!FELDER.has(feld)) throw new Error(`Unbekanntes Feld "${feld}"`);
  const zeilen = md.split('\n');
  const idx = zeilen.findIndex((z) => z.includes('<!-- @meta') && parseEtikett(z).id === id);
  if (idx < 0) {
    // Seit der Deckel-Entlastung (15.9.2026) wandern erledigte Schritte WÖRTLICH
    // nach ROADMAP-CHRONIK.md und verschwinden damit aus ROADMAP.md. «nicht
    // gefunden» ist dann eine wahre, aber irreführende Auskunft: sie liest sich
    // wie ein Tippfehler in der ID und schickt den Bediener auf die Suche nach
    // einem Schritt, den er gerade selbst korrekt archiviert hat. Also den
    // Fundort nennen — und trotzdem werfen: ein Archiv-Eintrag ist Wortlaut-Beleg
    // und wird nie nachgeführt (Regel: Belege altern nicht).
    const archiviert = chronikErledigte(leseDatei(CHRONIK_DATEI)).status.get(id);
    if (archiviert !== undefined) {
      throw new Error(
        `Schritt-id "${id}" steht nicht in ROADMAP.md — sie liegt erledigt in der Chronik ` +
          `(${CHRONIK_DATEI}, status: ${archiviert}). Archivierte Schritte werden nicht mehr gesetzt; ` +
          `wer sie wieder aufnimmt, legt einen neuen Schritt an.`,
      );
    }
    throw new Error(`Schritt-id "${id}" nicht gefunden`);
  }

  // Zeile normalisieren (kanonische Feld-Reihenfolge), dann das eine Feld ersetzen.
  const indent = zeilen[idx].match(/^([ \t]*(?:>[ \t]*)*)/)![1];
  const normalisiert = serializeEtikett(parseEtikett(zeilen[idx]), indent);
  let ersetzt = normalisiert.replace(new RegExp(`(\\b${feld}): .*?(?= ·| -->)`), (_m, g1) => `${g1}: ${wert}`);
  // Fehlt ein OPTIONALES Feld (`feld`, `fahrplan`), trifft
  // die Regex nichts — bis 31.7.2026 blieb die Zeile dann unverändert, und die CLI
  // meldete trotzdem «gesetzt: …». Ein Werkzeug, das seinen Nicht-Erfolg als Erfolg
  // meldet, ist dieselbe Fehlerklasse wie die Funde dieser Runde. Darum anhängen:
  // parseEtikett liest reihenfolge-unabhängig, serializeEtikett stellt die
  // kanonische Position her.
  if (ersetzt === normalisiert) ersetzt = normalisiert.replace(/ -->$/, ` · ${feld}: ${wert} -->`);
  const neu = parseEtikett(ersetzt); // validiert den neuen Wert (wirft bei ungültig)
  zeilen[idx] = serializeEtikett(neu, indent);

  if (feld === 'status') {
    // Fund 27 der QS-TOK-Endprüfung (31.7.2026): Die Zeichenklasse kannte nur
    // `[ ]`, `[x]`, `[~]` — der Legenden-Status `[d]`/`[D]` («geparkt/zurück-
    // gestellt», CHECKBOX_STATUS) fehlte. `plan:set <geparkt> status=ready`
    // setzte darum das @meta, liess die Checkbox aber auf `[d]` stehen und machte
    // `check:plan` — Pflichtglied von `npm run gate` — beim Entparken rot.
    //
    // Fund R2-1/R2-10 (Runde 2): Die Suche nach der Checkbox teilt sich jetzt die
    // EINE Implementierung mit parse.ts (`bindeCheckbox`) — die frühere Kopie hier
    // brach wie parse.ts an der ersten nicht-leeren Zeile ab und liess die Checkbox
    // bei B20/W2·5g-ZEIT unangetastet. Zwei Kopien derselben Nachbarschafts-Regel
    // wären zwei Wahrheiten (§5); auseinanderlaufen können sie nur still.
    //
    // Fund R2-9/R2-15 (Runde 2): Der Nachzug greift NUR, wenn die bestehende Marke
    // nicht schon zum neuen Status passt. `[d]` + parked/blocked bleibt damit
    // `[d]` (bzw. `[D]`), `[ ]` + parked bleibt `[ ]` — vorher überschrieb der
    // Fallback beides mit `[ ]` und löschte die Legendenmarke unwiederbringlich.
    // Genau HIER sitzt die Bewahrung (Fund R3-2), nicht in CHECKBOX_FUER: passt
    // die vorhandene Marke NICHT, ist das Ziel die Normalform `[ ]`.
    const { zeile: cbIdx } = bindeCheckbox(zeilen, idx);
    if (cbIdx !== null) {
      const bestehend = checkboxAus(zeilen[cbIdx])!;
      if (!CHECKBOX_STATUS[bestehend].includes(neu.status)) {
        const cb = CHECKBOX_FUER[neu.status] ?? '[ ]';
        zeilen[cbIdx] = zeilen[cbIdx].replace(CHECKBOX_ERSATZ_RE, `$1${cb}`);
      }
    }
    // Zweiter Halbsatz desselben Funds: `ready` mit gesetztem `blocker` ist nach
    // check.ts Regel 3 ein Problem. Wer entparkt, hat den Blocker aufgelöst — der
    // Eintrag im @blockers-Register bleibt als Beleg stehen, die Bindung fällt.
    if (neu.status === 'ready' && neu.blocker) {
      zeilen[idx] = serializeEtikett({ ...neu, blocker: null }, indent);
      console.error(`Hinweis: blocker "${neu.blocker}" bei ${id} mit entfernt (status ready duldet keinen blocker).`);
    }
    // §17-Wurzel-Fix (Anlass 16.8.2026, PR #530): Die Auto-Buchung
    // (`plan-buchung.yml`) setzte `W2·5h-GESETZ-UI status=done`, liess die ID
    // aber in der `@queue` stehen — check.ts («@queue-ID ist done — veraltete
    // Steuerung») machte den Lauf rot, die Buchung fiel aus, Hand-Nachzug nötig.
    // Ein done-Schritt hat in der Reihenfolge nichts mehr zu suchen; wer den
    // Status schliesst, räumt die Queue mit — sonst scheitert JEDE Auto-Buchung
    // eines Queue-Schritts am eigenen Tor. Nur die @queue-Zeile, nur die eine ID.
    if (neu.status === 'done') {
      // Regex wie parse.ts (`<!--\s*@queue:`), damit beide dieselbe Zeile meinen (§5).
      const qIdx = zeilen.findIndex((z) => /<!--\s*@queue:/.test(z));
      if (qIdx >= 0) {
        const m = zeilen[qIdx].match(/^(\s*<!--\s*@queue:\s*)(.*?)(\s*-->\s*)$/);
        if (m) {
          const ids = m[2].split(',').map((s) => s.trim()).filter(Boolean);
          if (ids.includes(id)) {
            const rest = ids.filter((q) => q !== id);
            zeilen[qIdx] = `${m[1]}${rest.join(', ')}${m[3]}`;
            console.error(`Hinweis: ${id} aus @queue entfernt (done-Schritt steuert keine Reihenfolge mehr).`);
          }
        }
      }
    }
  }
  return zeilen.join('\n');
}

// §17-Wurzel-Fix (Anlass 5.8.2026): `npm run plan:set -- QS-TOK status=wip` setzte
// den Queue-Kopf auf `wip`, liess den Prosa-Marker «⬆ OBERSTER OFFENER SCHRITT»
// aber unverändert stehen — ein `wip`-Schritt fällt aus `resolve().readyNow`
// (aufloesen.ts), also driftete der Marker sofort gegen `plan:next`, und
// `check:plan` Regel 8.4 (check.ts) wurde erst im NÄCHSTEN Lauf rot. Der
// Bediener musste die Ursache selbst ausgraben, statt sie am Ort des Setzens
// zu sehen. Reine BEOBACHTUNG, kein Auto-Rewrite: Prosa ist Menschentext, also
// nur ein Hinweis, kein Schreibzugriff auf den Fliesstext.
//
// Extraktions-Logik wird mit check.ts über marker.ts geteilt (`obersterMarkerId`)
// statt kopiert — zwei Kopien derselben Regel wären zwei Wahrheiten (§5). Direkt
// aus check.ts importieren geht NICHT: dessen CLI-Block liefe als Nebenwirkung
// mit (Kommentarkopf marker.ts).
//
// `null`, wenn kein Marker vorkommt oder er bereits mit `plan:next` übereinstimmt.
export function prosaMarkerDriftHinweis(md: string): string | null {
  const idImText = obersterMarkerId(md);
  if (idImText === null) return null;
  const { einheiten, queue } = parseRoadmap(md);
  // Chronik mit auflösen — sonst nennt der Hinweis einen anderen «obersten» als
  // plan:next und check.ts Regel 8.4 (dieselbe Drift, nur eine Ebene höher).
  const readyNow0 = resolve(einheiten, queue, ladeChronikDone()).readyNow[0] ?? null;
  if (idImText === readyNow0) return null;
  return (
    `Hinweis: Prosa-Marker nennt \`${idImText}\`, plan:next liefert nun \`${readyNow0 ?? '—'}\` — ` +
    `ROADMAP-Prosa nachziehen, sonst check:plan rot (Regel 8.4). Muster: Marker auf \`${readyNow0 ?? '—'}\` ` +
    `setzen und den wip-Schritt im Satz danach nennen (Präzedenz 28.7.2026 W2·7-BEZUG).`
  );
}

// CLI: vite-node scripts/plan/set.ts -- <id> <feld>=<wert>
if (!process.env.VITEST) {
  const arg = process.argv.slice(2);
  const id = arg[0];
  const [feld, wert] = (arg[1] ?? '').split('=');
  if (!id || !feld || wert === undefined) {
    console.error('Aufruf: npm run plan:set -- <id> <feld>=<wert>');
    process.exit(2);
  }
  const out = setField(readFileSync('ROADMAP.md', 'utf8'), id, feld, wert);
  writeFileSync('ROADMAP.md', out);
  console.log(`gesetzt: ${id} ${feld}=${wert}`);
  const drift = prosaMarkerDriftHinweis(out);
  if (drift) console.log(drift);
}
