// scripts/normtext/cache-pin-befund.ts
//
// Cache-Pin-Identitäts-Sonde (Gegenprüfung #806, 12.9.2026). Ausgelagert aus
// scripts/normtext-snapshot.ts (§6.6 Datei-Schlankheit — der Zuwachs hätte die
// dortige Baseline gerissen; `scripts/normtext/**` ist der vorgesehene Ort für
// Cache-Helfer, s. Whitelist des Auftrags).
//
// Fundort des Defekts: `cacheBefund` (scripts/normtext-snapshot.ts) urteilt
// rein nach INHALT (Grösse, Shell-Marker, Anker) — das genügt nicht. Ein
// Cache kann alle drei Inhalts-Sonden bestehen und trotzdem aus der FALSCHEN
// Fedlex-Manifestation stammen: wird zwischen einem früheren Abruf und der
// nächsten Verwendung re-gepinnt (`fedlex:repin-kanonik --write` ändert
// html-N in scripts/fedlex-cache.sh), bleibt die alte, inhaltlich unauffällige
// /tmp-Datei liegen — nichts an ihr unterscheidet sie von einem echten,
// aktuellen Dump. Bei ERV blieb das am 12.9.2026 folgenlos, weil html-6 und
// html-7 byte-identisch sind (Republish derselben Konsolidierung); sobald ein
// Republish inhaltlich abweicht, baute ein solcher Alt-Cache den Snapshot
// still aus der überholten Fassung (§7).
//
// KORREKTUR (Gegenprüfung #808, Auflage A1, 12.9.2026): «byte-identisch» oben
// ist falsch — html-6 (584 855 B, sha b5dc9c83…) und html-7 (585 530 B, sha
// 2ce2ce1f…) weichen auf Byte-Ebene ab (1584 Fussnoten-`id`-Zeilen + 108
// `class`-Zeilen unterschiedlich, z. B. `footnotes` → `footnotes
// section-heading-footnote`). Richtig: textgleich, Markup abweichend;
// Extraktionsgleichheit belegt durch 224/224 Artikel-SHAs (#806).
//
// Der Marker `/tmp/<name>.html.pin` trägt die Identität, mit der der Cache
// zuletzt bestätigt geschrieben wurde (`eli|konsolidierung|html-N`). Fehlt er
// oder weicht er vom aktuell gepinnten Eintrag ab, gilt der Cache als
// unbrauchbar — unabhängig davon, wie plausibel sein Inhalt aussieht. Diese
// Sonde ersetzt `cacheBefund` nicht, sie ergänzt sie: beide zusammen bilden
// den vollen Befund, den `sicherstelleCaches` verlangt (dort `cacheUndPinOk`).
import { existsSync, readFileSync, statSync } from 'node:fs';

export type CacheBefund = { ok: boolean; grund?: string };

/** Deterministisches Marker-Format: `eli|konsolidierung|html-N`. */
export function pinIdentitaet(eli: string, konsolidierung: string, htmlN: number): string {
  return `${eli}|${konsolidierung}|${htmlN}`;
}

/** Urteilt, ob der Marker eines /tmp-HTML-Caches der aktuell gepinnten Manifestation entspricht. */
// `cacheDir` (Default /tmp, Ergänzung 7.10.2026 ARCH-REVIEW cache-tore): nur Tests/Rot-Beweise
// setzen ein anderes Verzeichnis (LEXMETRIK_FEDLEX_CACHE_DIR, wie fedlex-cache.sh/check-segmente.ts).
export function pinBefund(
  name: string,
  eli: string,
  konsolidierung: string,
  htmlN: number,
  cacheDir = '/tmp',
): CacheBefund {
  const pinPfad = `${cacheDir}/${name}.html.pin`;
  const erwartet = pinIdentitaet(eli, konsolidierung, htmlN);
  if (!existsSync(pinPfad)) return { ok: false, grund: `Pin-Marker fehlt (erwartet ${erwartet}) — Neuabruf nötig` };
  let tatsaechlich: string;
  try {
    tatsaechlich = readFileSync(pinPfad, 'utf8').trim();
  } catch (e) {
    return { ok: false, grund: `Pin-Marker unlesbar (${(e as Error).message})` };
  }
  if (tatsaechlich !== erwartet)
    return {
      ok: false,
      grund: `Pin-Marker weicht ab: Cache=${tatsaechlich} ≠ gepinnt=${erwartet} — Neuabruf nötig`,
    };
  return { ok: true };
}

// ── mtime-Sonde (Gegenprüfung #808, Auflage B1, 12.9.2026) ────────────────────
// `sicherstelleCaches` stempelte bisher die VOLLE Eintrags-Liste, auch wenn
// `execSync('bash scripts/fedlex-cache.sh')` mittendrin scheiterte (Teilfehler:
// manche /tmp-Dateien wurden neu geschrieben, andere blieben STEHENGEBLIEBENE
// Alt-Dateien). Eine stehengebliebene Alt-Datei kann die Inhalts-Sonde
// zufällig weiter bestehen (sie ist ja ein echter, nur überholter Dump) — ein
// Marker dafür wäre GENAU die Lücke, die diese Sonde eigentlich schliessen
// soll. `warFrischGeschrieben` lässt `sicherstelleCaches` nur die Einträge
// stempeln, deren Datei dieser Lauf TATSÄCHLICH neu geschrieben hat.
export function warFrischGeschrieben(pfad: string, seit: number): boolean {
  try {
    return statSync(pfad).mtimeMs >= seit;
  } catch {
    return false;
  }
}
