// scripts/materialien/check-vernehmlassungen-alter.ts — standalone Tor: Alterungs-
// Wächter für das Vernehmlassungs-Register (§17-Wurzelfix PR #803, Gegenprüfungs-
// Auflage A1, K7-Entscheid).
//
// WARUM EIN EIGENER TOR UND NICHT TEIL VON check-materialien.ts: Begründung in
// scripts/materialien/vernehmlassungen-tor.ts (Kopf). Kurzfassung: dieser Wächter
// liest `heute` — wanduhr-abhängig per Definition. check-materialien.ts wird von
// fachfremden Jobs beim Namen aufgerufen (z. B. normen-monatslauf.yml Job
// `bs-grossrat`), die mit Vernehmlassungs-Frische nichts zu tun haben; ein Rot hier
// hätte sie vor deren eigenem PR-Schritt getötet (K7-Muster, wie `check:verfall`
// in ci.yml). Dieser Tor ist darum BEWUSST NICHT Teil von `check:seriell` — sein
// einziger Aufrufer ist der wöchentliche Detektor in normen-monitor.yml (Job
// `normen`, direkt nach `check:verfall`, `if: always()`, derselbe K7-Platz).
// Lokal von Hand: `npm run check:vernehmlassungen-alter`.
//
// Cadence 45 Tage (Gegenprüfungs-Auflage A1, angehoben von 35): ein Monatslauf am
// 1. + bis zu ~5 Tage Gegenprüfung/Merge-Verzug des Monats-PR reichten bei einem
// 31-Tage-Monat bei 35 Tagen nicht — der Deckel riss schon am 6. des Folgemonats.
// 45 Tage geben dem Monatslauf + Gegenprüfung + Merge realistischen Puffer, bleiben
// aber klar unter einem Doppel-Monats-Intervall (kein Nachführungs-Fenster wird
// verschluckt, ein zwei Monate lang stummer Kreislauf bleibt trotzdem meldenswert).
//
// A3: keine BUND/vernehmlassung-Einträge ⇒ Fehler (kein stiller Skip) — siehe
// alterungsFehler() in vernehmlassungen-tor.ts.
// A2: --datum gegen ISO validiert (parseDatumArg wirft bei kaputtem Format) — kein
// stilles NaN-Abschalten.

import { ALLE_MATERIALIEN } from './material-manifest.ts';
import { alterungsFehler, minimum, parseDatumArg } from './vernehmlassungen-tor.ts';

const MAX_ALTER_TAGE = 45;

function main(): void {
  let heute: string | undefined;
  try {
    heute = parseDatumArg(process.argv);
  } catch (e) {
    console.error(`ROT   vernehmlassungen-alter: ${(e as Error).message}`);
    process.exit(1);
  }
  const heuteEff = heute ?? new Date().toISOString().slice(0, 10); // NUR HIER: Wanduhr-Lesestelle

  const staende = ALLE_MATERIALIEN
    .filter((r) => r.behoerde === 'BUND' && r.doktyp === 'vernehmlassung')
    .map((r) => r.stand);
  const erhebung = minimum(staende);

  const fehler = alterungsFehler(erhebung, heuteEff, MAX_ALTER_TAGE);
  if (fehler) {
    console.error(`ROT   vernehmlassungen-alter: ${fehler}`);
    process.exit(1);
  }
  console.log(`check:vernehmlassungen-alter OK — Erhebungsdatum ${erhebung} (≤ ${MAX_ALTER_TAGE} Tage alt, Stichtag ${heuteEff}).`);
}

main();
