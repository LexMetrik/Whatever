import { useLayoutEffect } from 'react';
import { useMeldeInhaltsKopf } from '../../../components/layout/InhaltsKopfKontext';

// ═══ V1 (Nachzug 17.8.2026) · DER KOPF-ANSPRUCH GILT NUR, WO EIN KOPF STEHT ══
//
// BEFUND des Ästhetik-Reviews, reproduziert an `/gesetze/bund/EMRK` (pdf-embed),
// `/gesetze/bund/DSGVO` (nur-live-link) und `/gesetze/bund/GIBTSNICHT`
// (Fehlseite): `../../GesetzLeser.tsx` (bis H5, 21.8.2026: `gesetz-leser/GesetzLeserV3.tsx`)
// meldet `KopfDaten.kopfzeileSelbst` UNBEDINGT — die App-Krumen-Leiste schweigt
// also. Auf genau diesen drei Wegen kehrt `./LeserRahmenV3` aber früh zurück und
// rendert `./LeserKopf` nie. Ergebnis: weder App-Krume noch Leser-Krume noch ✕ —
// eine Seite ohne jeden Weg zurück. Die frühere Ist-Hülle trug ihn.
//
// DIE KORREKTUR IST EINE RÜCKNAHME, KEINE ZWEITE QUELLE. `meldeInhaltsKopf(null)`
// heisst nicht «kein Kopf», sondern «ich melde nichts» — die Shell fällt dann auf
// `kopfVonPfad()` zurück (`components/layout/Shell.tsx`), also exakt auf das Bild,
// das jede Nicht-V3-Seite bekommt. Es entsteht keine zweite Krumen-Ableitung, die
// neben `erlassAnsicht.brotkrume` veralten könnte (§5). [Nachtrag W2·17 H9-B01,
// 1.10.2026: `brotkrume` ist gestrichen (kein Aufrufer) — die Aussage gilt
// unverändert für die Shell-Ableitung `kopfVonPfad()`.]
//
// WARUM ZWEI SCHREIBER AUF EINEM SLOT HIER VERTRETBAR SIND: die Fassade
// RESERVIERT datenunabhängig und synchron — sie muss, denn der Rahmen ist `lazy`,
// und ohne die Reservierung rendert die Shell die Leiste und lässt sie danach um
// 37 px zusammenfallen (gemessen 17.8.2026 @1440 StPO: CLS 0.030 statt 0.005;
// Messreihe in `../../GesetzLeser.tsx`). Dieser Hook KORRIGIERT die Reservierung,
// sobald die Daten sagen, dass sie falsch war. Die Reihenfolge ist gesichert: die
// Fassade ist beim Eintreffen des Chunks längst montiert, ihr Layout-Effekt hat
// konstante Deps und läuft nicht erneut.
//
// DER LADE-PLATZHALTER ZÄHLT AUSDRÜCKLICH NICHT als «kein Kopf»: er ist der
// Übergang, für den die Reservierung überhaupt existiert. Nähme man sie dort
// zurück, erschiene die Leiste für die Dauer des Snapshot-Fetches und fiele
// danach zusammen — genau der Sprung, den A-2 gemessen beseitigt hat. Der Rahmen
// fragt darum nicht «gibt `FruehAnsicht` etwas zurück», sondern «gibt sie etwas
// BLEIBENDES zurück»; die Bedingungen selbst bleiben in `FruehAnsicht` (§5).
//
// EIGENE DATEI und nicht im Rahmen: der Rahmen sagt, WO etwas steht (Kap. 10) —
// welche Meldung in welcher Lage an die Hülle geht, ist eine Vertragsfrage und
// hat ihre Herleitung hier, neben der Bedingung. Dasselbe Muster wie
// `./leserGeometrie` und `./kopfStufen` (§6.6).

/**
 * Meldet der Hülle, ob der Leser seine Kopfzeile selbst trägt.
 *
 * @param bleibendOhneKopf `true`, wenn der Rahmen eine BLEIBENDE Ansicht ohne
 *   V3-Kopfzeile rendert (Fehlseite · pdf-embed · nur-live-link) — dann wird der
 *   Anspruch zurückgenommen. Der Lade-Platzhalter ist ausdrücklich `false`.
 */
export function useKopfAnspruch(bleibendOhneKopf: boolean): void {
  const meldeInhaltsKopf = useMeldeInhaltsKopf();
  useLayoutEffect(() => {
    meldeInhaltsKopf(bleibendOhneKopf ? null : { kopfzeileSelbst: true, breadcrumb: [] });
  }, [bleibendOhneKopf, meldeInhaltsKopf]);
}
