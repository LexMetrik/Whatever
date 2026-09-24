import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vitest/config';
import react from '@vitejs/plugin-react';

// §15.2 CLS-Fix (A9-Forensik `fix/e2e-ci-haertung`, 19.7.2026): der Reader-Ingress
// (font-serif = Source Serif 4) trug auf dem 2-vCPU-Linux-Runner deterministisch
// einen +30-px-Lade-Shift (CLS ~0.10, Budget 0.05), lokal (macOS) NICHT
// reproduzierbar. Ursache empirisch belegt (Playwright-Wrapping-Messung
// /gesetze/bund/OR): ein 84-Zeichen-Ingress-Absatz bricht in Source Serif 4 /
// Georgia / Charter ZWEIzeilig (59 px), in Times / Liberation Serif / DejaVu /
// generic serif EINzeilig (30 px). macOS löst die Fallback-Kette über Georgia/
// Charter (beide breit → wrappt wie der Webfont → kein Shift) auf; das Linux-CI-
// Image hat KEIN Georgia/Charter/Arial → generic `serif` = Liberation Serif
// (schmal, Times-Metrik) → EINzeilig, bis der Source-Serif-4-Webfont via
// font-display:swap nach ~2.7 s einschwappt und ZWEIzeilig reflowt = der +30-px-
// Sprung. Die metrik-angepassten @font-face-Fallbacks (index.css) matchen die
// VERTIKALE Box, nicht die horizontale Laufweite → sie können den Wrapping-Sprung
// NICHT verhindern. Robuster, OS-unabhängiger §15.2-Fix: den SERIF-Webfont auf
// `font-display: optional` stellen — kein Swap nach der ~100-ms-Blockphase, der
// Fallback-Umbruch bleibt für den ganzen Ladevorgang stabil (CLS 0), der Webfont
// greift ab dem gecachten Folgeaufruf. Der SANS-Webfont (Geist) bleibt auf `swap`
// (Fallback Arial/Liberation-Sans metrik-gleich → wrappt konsistent, war nie
// Shift-Opfer); für Linux ist seine Fallback-`src` in index.css zusätzlich um
// Arimo/Liberation Sans gehärtet. fontsource hardcodet `swap` in seiner CSS —
// darum wird es beim Bau NUR für die source-serif-4-CSS auf `optional` umgeschrieben.
// Reine Ladeverhalten-Änderung (§3/§6.4): Inhalt/Reihenfolge unberührt.
//
// ── W2·24-NACHZUG R6I (7.9.2026) · DER WAECHTER WAR SEIT R1 TOT ─────────────
// Diese Umschreibung suchte bis heute `@fontsource-variable/source-serif-4`.
// W2·24-R1 hat den Lesetext am 6.9.2026 auf **Literata** gestellt und das Paket
// `source-serif-4` aus package.json entfernt — seither traf die Bedingung KEINE
// Datei mehr, und der Serif-Webfont lief wieder auf `swap`. Der oben
// beschriebene, auf dem Linux-Runner DETERMINISTISCHE +30-px-Lade-Shift war
// damit ungeschuetzt; lokal (macOS, Georgia vorhanden) ist er nicht
// reproduzierbar, also faellt so etwas nur in CI auf — oder gar nicht.
// ZWEI AENDERUNGEN, und die zweite ist die wichtigere:
//  (a) Das Ziel kommt aus EINER Konstante (`SERIF_PAKET`), nicht mehr aus einem
//      Literal mitten in der Bedingung.
//  (b) Der Bau BRICHT, wenn die Umschreibung nie gegriffen hat (`buildEnd`).
//      Ein Schutz, der beim naechsten Schriftwechsel wieder still verschwinden
//      kann, ist keiner (§6.7 «ein Tor, das nicht scheitern kann» / §17). Genau
//      dieser stille Ausfall hat den Perf-Deckel rot gemacht.
// ROT ZU BEKOMMEN: `SERIF_PAKET` auf einen nicht installierten Paketnamen
// stellen ⇒ `npm run build` bricht mit «serif-font-display-optional hat nie
// gegriffen».
/** Das fontsource-Paket des LESETEXTES (`src/main.tsx`). Eine Quelle (§5). */
const SERIF_PAKET = '@fontsource-variable/literata';

function serifFontDisplayOptional(): Plugin {
  let getroffen = 0;
  return {
    name: 'serif-font-display-optional',
    enforce: 'pre',
    transform(code, id) {
      if (id.includes(SERIF_PAKET) && id.endsWith('.css')) {
        const neu = code.replace(/font-display:\s*swap/g, 'font-display: optional');
        if (neu !== code) getroffen += 1;
        return { code: neu, map: null };
      }
      return null;
    },
    buildEnd(fehler) {
      // Bei einem ohnehin gescheiterten Bau nicht den echten Fehler ueberdecken.
      if (fehler) return;
      if (getroffen === 0) {
        throw new Error(
          `serif-font-display-optional hat nie gegriffen: unter '${SERIF_PAKET}' wurde keine CSS `
          + 'mit `font-display: swap` gefunden. Entweder heisst das Lesetext-Paket anders '
          + '(dann SERIF_PAKET nachziehen) oder fontsource liefert kein `swap` mehr '
          + '(dann diese Umschreibung samt Begruendung streichen). Stillschweigend '
          + 'weiterbauen wuerde den §15.2-CLS-Schutz des Linux-Runners verlieren.',
        );
      }
    },
  };
}

/** Kurze Build-Kennung: Vercel-Commit-SHA auf 8 Zeichen, sonst 'dev'. */
function buildId(): string {
  return (process.env.VERCEL_GIT_COMMIT_SHA ?? '').slice(0, 8) || 'dev';
}

// QS-AUTOMATIK (16.8.2026): die Build-Kennung zusätzlich als <meta> in den <head>
// schreiben. VITE_BUILD_ID (unten) lebt nur im JS-Bundle — von aussen nicht
// lesbar, ohne die App auszuführen. Erst das Meta macht den ausgelieferten Stand
// mit einem simplen GET prüfbar; darauf setzt der Prod-Stand-Wächter in
// scripts/betrieb/prod-smoke.ts auf («hinkt Prod hinter main?»). Anlass: sieben
// gemergte PRs waren zwischen dem 15. und 16.8. nicht live, und kein Wächter
// konnte es sehen — der Prod-Smoke prüfte nur HTTP 200 und blieb grün.
// Der Prerender (scripts/prerender.ts) nimmt dist/index.html als Template für
// JEDE Route ⇒ das Meta trägt automatisch auf allen prerenderten Seiten.
// Kein Geheimnis (§18): der Commit-SHA ist öffentlich.
function buildKennungMeta(): Plugin {
  return {
    name: 'build-kennung-meta',
    transformIndexHtml(html) {
      return html.replace(
        '</head>',
        `  <meta name="lexmetrik-build" content="${buildId()}" />\n  </head>`,
      );
    },
  };
}

export default defineConfig({
  plugins: [serifFontDisplayOptional(), react(), buildKennungMeta()],
  // Dev-Server: Port aus `PORT`, wenn die Vorschau einen zuweist (`.claude/launch.json`
  // «autoPort»). Vorher stand 5180 fest in der Startzeile — die zweite parallele
  // Session fand den Port belegt und kam nicht an ihre Vorschau (24.9.2026, §17).
  // Ohne `PORT` bleibt Vites Vorgabe; `strictPort` nur mit zugewiesenem Port.
  server: process.env.PORT ? { port: Number(process.env.PORT), strictPort: true } : undefined,
  // O-1.9: Build-Kennung für den Fehlerkanal — Vercel-Commit-SHA (kurz), sonst 'dev'.
  // Erlaubt es, einen gemeldeten Client-Fehler einem Deploy zuzuordnen. Kein Geheimnis.
  define: {
    'import.meta.env.VITE_BUILD_ID': JSON.stringify(buildId()),
  },
  resolve: {
    alias: {
      // html2canvas wird von jsPDF nur per dynamischem import() in der nie
      // aufgerufenen .html()-Methode geladen. Auf ein leeres Stub umbiegen, damit
      // der ~200 kB-Chunk nicht gebaut wird (reine Ladepfad-Änderung, CLAUDE.md §6.4).
      html2canvas: fileURLToPath(new URL('./src/lib/pdf/html2canvas-stub.ts', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Nur die React-Familie in einen stabil benannten vendor-react-Chunk
        // isolieren (Default-Chunking sonst unberührt). react-dom/react-router
        // lagen bisher im App-Entry → jeder Shell-Commit rehashte ~130 kB
        // Engine; ausgegliedert bleibt sie über Deploys im HTTP-Cache der
        // Wiederbesucher. Reine Chunk-Grenze — Modul-Reihenfolge/Inhalt
        // unverändert, golden pinnt Outputs nicht Asset-Hashes (§15/5, §6.4).
        manualChunks(id: string) {
          if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id)) {
            return 'vendor-react';
          }
        },
      },
    },
  },
  test: {
    environment: 'node',
    globals: true,
    // Die erschöpfenden Konstellations-Sweeps (prozesskosten/beurkundung/
    // fristenspiegel/schkgZustaendigkeit) laufen über die volle Kantons×Streitwert
    // ×Materie×Instanz×Verfahren-Matrix (Hunderttausende Iterationen je inkl.
    // PDF-Bericht). Lokal < 5 s, auf langsamen CI-Runnern überschritten sie aber
    // den Vitest-Default (5000 ms) → sporadisch «Test timed out» (kein echter
    // Fehler). Globales Zeitbudget grosszügig auf 30 s heben: das verlangsamt
    // schnelle Tests nicht (Timeout greift nur bei Überschreitung), macht die
    // legitim schweren Sweeps aber stabil — Assertions unverändert (§6.3).
    testTimeout: 30000,
    // Agent-Worktrees unter .claude/ nicht mittesten (sonst doppelte Suite
    // bzw. Fehlschläge aus halbfertigen Ständen fremder Sessions, 6.6.2026).
    exclude: ['**/node_modules/**', '**/dist/**', '**/.claude/**'],
  },
});
