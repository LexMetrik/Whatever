// scripts/plan/bildBau.ts — Seite «Bau-Details» (plan-bild-bau.html).
//
// Entstanden am 8.9.2026 aus dem Umbau «Lagebild schlank» (Auftrag David:
// «mach es schlanker und übersichtlicher für mich»). Alles hier stand vorher
// AUF der Hauptseite und hat sie zugeschüttet — gemessen an der Fassung vom
// 8.9.2026 entfielen auf diese Blöcke rund 4200 der 4675 Wörter:
//
//   * die Vollliste aller offenen Schritte, nach Wirkungsbereich gegliedert
//   * die Sperrmatrix «nicht parallel mit …» (`verknuepfungenZeile`)
//   * «Jetzt parallel startbar — ohne Kollision» (Resolver-Lane 1)
//   * das Fehlerbuch
//   * die Bau-Messreihe
//   * die 59 Bau-Prompts als `PROMPTS`-Skript (~75 KB)
//
// Nichts davon ist gelöscht — es hat nur ein anderes PUBLIKUM: Bau-Sessions
// und Disponenten-Fragen («darf Session B parallel starten?»). Davids
// Hauptseite beantwortet vier Fragen (Stand · Entscheide · was läuft · was
// kommt), diese Seite den ganzen Rest.
//
// Keine eigene Datenerhebung: dieselben Sammler und derselbe Resolver wie das
// Lagebild (§5) — die Seiten widersprechen sich nicht, sie zeigen verschiedene
// Auflösungsgrade.
import { readFileSync } from 'node:fs';
import { parseRoadmap, type Einheit, ladeChronikDone } from './parse';
import { resolve, type Buckets } from './aufloesen';
import { postenTitelJeDach } from './postenKern';
import {
  baustellenInfo,
  ersterSatz,
  schrittInfoAusRoadmap,
  selbstoptKennzahlen,
  verknuepfungenAusEinheiten,
  type Verknuepfung,
} from './bildDaten';
import {
  BEREICH_ERKLAERUNG,
  UEBRIGE_TECHNIK,
  WIRKUNGSBEREICHE,
  bereichKlasse,
  bereichsBadges,
  esc,
  fussnote,
  feldPfade,
  kacheln,
  rahmen,
  schrittLabel,
  seitenDatei,
  seitenKopf,
  wirkungsbereiche,
  type SeitenOpts,
} from './bildHtml';
import { bauPrompt } from './bildSeiten';

/**
 * Klartext-Fortschritt einer Dach-Checkliste, z. B. «3 von 14 Positionen offen»
 * (Auftrag David 14.8.2026 — Checklisten-Fortschritt auf einen Blick). `null`
 * heisst «kein Dach-Schritt» (keine Checkliste unter dem Etikett).
 */
export function checklisteText(chk: { offen: number; gesamt: number } | null | undefined): string | null {
  if (!chk) return null;
  return chk.offen === 0
    ? `alle ${chk.gesamt} Position${chk.gesamt === 1 ? '' : 'en'} erledigt`
    : `${chk.offen} von ${chk.gesamt} Position${chk.gesamt === 1 ? '' : 'en'} offen`;
}

/**
 * Kompakte Verknüpfungs-Zeile eines Schritts: dep-Richtung, gleiches Baufeld,
 * gleicher Fahrplan (Auftrag David 14.8.2026 — «zeigen was miteinander
 * verknüpft ist», ohne Graphik-Bibliothek). Reine Darstellung über bereits
 * erhobene IDs (s. `verknuepfungenAusEinheiten` in bildDaten.ts); jede Liste
 * wird auf `max` Einträge gekappt («+N weitere»), damit ein breit geteilter
 * Pfad (z. B. «src/pages») die Zeile nicht sprengt. Leer, wenn der Schritt
 * keine der vier Kanten trägt — dann erscheint keine Zeile (§8: nichts
 * Erfundenes anzeigen).
 */
export function verknuepfungenZeile(
  v: { wartetAuf: string[]; blockiert: string[]; feldPartner: string[]; fahrplanPartner: string[] },
  titelVon: (id: string) => string,
  max = 3,
): string {
  const teil = (label: string, ids: string[]): string => {
    if (!ids.length) return '';
    const zeig = ids
      .slice(0, max)
      .map((id) => schrittLabel(titelVon(id), id, false))
      .join(' · ');
    const rest = ids.length - Math.min(ids.length, max);
    return `<b>${label}:</b> ${zeig}${rest > 0 ? ` · +${rest} weitere` : ''}`;
  };
  const teile = [
    teil('wartet auf', v.wartetAuf),
    teil('blockiert', v.blockiert),
    teil('nicht parallel mit', v.feldPartner),
    teil('gleiche Baustelle', v.fahrplanPartner),
  ].filter(Boolean);
  return teile.length ? `<p class="sub">${teile.join(' &nbsp;·&nbsp; ')}</p>` : '';
}

/** Auffangkategorie für Schritte ohne `feld:` — ehrlich benannt statt geraten (§8). */
const OHNE_FLAECHE = 'Ohne deklariertes Baufeld';

export function bauSeite(o: SeitenOpts): string {
  const md = readFileSync('ROADMAP.md', 'utf8');
  const { einheiten, queue } = parseRoadmap(md);
  // Chronik-Wissen mitgeben, sonst zeigt das Lagebild andere Buckets als plan:next.
  const b: Buckets = resolve(einheiten, queue, ladeChronikDone());
  const schritte = schrittInfoAusRoadmap(md, postenTitelJeDach());
  const t = (id: string) => schritte.get(id)?.titel ?? id;
  const byId = new Map(einheiten.map((e) => [e.id, e]));
  const verkn = verknuepfungenAusEinheiten(einheiten);
  const verknZeile = (v: Verknuepfung | undefined) => (v ? verknuepfungenZeile(v, t) : '');

  const offen = einheiten.filter((e) => e.etikett.status !== 'done');
  const baubar = new Set(b.readyNow);

  // Prompts je baubarem Schritt (JSON ins Dokument, Kopier-Knopf liest daraus).
  // Die done-Menge speist die dep-Zeile jedes Prompts.
  const erledigt = new Set(einheiten.filter((e) => e.etikett.status === 'done').map((e) => e.id));
  const prompts: Record<string, string> = {};
  for (const id of baubar) {
    const e = byId.get(id);
    if (e) prompts[id] = bauPrompt(e, schritte.get(id), erledigt);
  }

  // Gliederung nach Wirkungsbereich — DIESELBE Ableitung wie die Badges
  // (`wirkungsbereiche()`, §5), keine zweite Taxonomie. Ein Schritt mit
  // mehreren Flächen zählt bei seinem HAUPT-Bereich.
  const bereichVon = (e: Einheit): string => wirkungsbereiche(feldPfade(e.etikett.feld))[0] ?? OHNE_FLAECHE;
  const nachBereich = new Map<string, Einheit[]>();
  for (const e of offen) {
    const bz = bereichVon(e);
    if (!nachBereich.has(bz)) nachBereich.set(bz, []);
    nachBereich.get(bz)!.push(e);
  }
  const bereichsErklaerung = new Map<string, string>(BEREICH_ERKLAERUNG);
  bereichsErklaerung.set(OHNE_FLAECHE, 'Schritte ohne feld:-Angabe im Etikett — Baufeld setzen, dann ordnen sie sich mechanisch ein (check:plan meldet sie ohnehin rot).');

  const statusPunkt = (s: string) => (s === 'done' ? 'done' : s === 'wip' ? 'wip' : s === 'blocked' ? 'block' : 'ready');

  const schrittZeile = (e: Einheit) => {
    const knopf = baubar.has(e.id)
      ? ` <button class="kopier" data-id="${esc(e.id)}" title="Bau-Auftrag für eine neue Session kopieren">Bau-Prompt kopieren</button>`
      : e.etikett.status === 'blocked'
        ? ` <span class="sub">⛔ ${esc(e.etikett.blocker ?? 'blockiert')}</span>`
        : e.etikett.status === 'wip'
          ? ' <span class="sub">🔨 im Bau</span>'
          : e.etikett.status === 'parked'
            ? ' <span class="sub">⏸ geparkt</span>'
            : '';
    const chkTxt = checklisteText(schritte.get(e.id)?.checkliste);
    const chkText = chkTxt ? ` <span class="sub">Checkliste: ${esc(chkTxt)}</span>` : '';
    const fpName = e.etikett.fahrplan ? baustellenInfo(e.etikett.fahrplan).name : null;
    return `<li><span class="s ${statusPunkt(e.etikett.status)}"></span><div>${schrittLabel(t(e.id), e.id, false)}${chkText}${knopf}${fpName ? `<br><span class="sub">Baustelle: ${esc(fpName)}</span>` : ''}${verknZeile(verkn.get(e.id))}</div></li>`;
  };
  const statusRang = (e: Einheit) => (e.etikett.status === 'wip' ? 0 : baubar.has(e.id) ? 1 : e.etikett.status === 'parked' ? 2 : e.etikett.status === 'blocked' ? 3 : 2);
  // Innerhalb eines Bereichs zählt die QUEUE-Reihenfolge (readyNow-Rang), nicht
  // die Dokument-Reihenfolge — sonst nennt eine Bereichs-Karte einen anderen
  // «Nächsten Schritt» als das Lagebild (zwei Wahrheiten, §5).
  const rangReady = new Map(b.readyNow.map((id, i) => [id, i]));
  const karten = [...WIRKUNGSBEREICHE, UEBRIGE_TECHNIK, OHNE_FLAECHE]
    .filter((bz) => nachBereich.has(bz))
    .map((bz) => {
      const es = [...nachBereich.get(bz)!].sort(
        (a, b2) => statusRang(a) - statusRang(b2) || (rangReady.get(a.id) ?? Infinity) - (rangReady.get(b2.id) ?? Infinity),
      );
      const wip = es.filter((e) => e.etikett.status === 'wip').length;
      const sofort = es.filter((e) => baubar.has(e.id)).length;
      const blockiert = es.filter((e) => e.etikett.status === 'blocked').length;
      const chip = wip
        ? '<span class="chip wip">im Bau</span>'
        : sofort
          ? '<span class="chip ready">bereit</span>'
          : blockiert
            ? '<span class="chip block">teils blockiert</span>'
            : '';
      const naechster = es.find((e) => baubar.has(e.id));
      return `<div class="card bz ${bereichKlasse(bz)}">
  <div class="kopf"><h3>${esc(bz)}</h3>${chip}</div>
  <p class="zweck">${esc(bereichsErklaerung.get(bz) ?? '')}</p>
  <span class="fortschritt">${es.length} Schritt${es.length === 1 ? '' : 'e'} offen · ${sofort} sofort baubar${wip ? ` · ${wip} im Bau` : ''}${blockiert ? ` · ${blockiert} blockiert` : ''}</span>
  ${naechster ? `<p class="next"><b>Nächster Schritt:</b> ${esc(t(naechster.id))} <button class="kopier" data-id="${esc(naechster.id)}">Bau-Prompt kopieren</button></p>` : ''}
  <details><summary>Einzelschritte (${es.length})</summary><ul>${es.map(schrittZeile).join('\n')}</ul></details>
</div>`;
    })
    .join('\n');

  // Vollständige Warteschlange — auf der Hauptseite stehen nur die ersten fünf.
  const queueHtml = queue
    .map((id) => {
      const e = byId.get(id);
      const st = e?.etikett.status ?? '?';
      const zusatz = st === 'wip' ? ' <span class="chip wip">im Bau</span>' : baubar.has(id) ? ` <button class="kopier" data-id="${esc(id)}">Bau-Prompt kopieren</button>` : '';
      return `<li>${schrittLabel(t(id), id)}${bereichsBadges(e?.etikett.feld ?? null)}${zusatz}</li>`;
    })
    .join('\n');

  // Parallel-Start: Lane 1 des Resolvers = untereinander kollisionsfreie Schritte.
  const laneEmpfehlung = (b.lanes[0] ?? []).filter((id) => prompts[id]).slice(0, 4);
  const laneHtml = laneEmpfehlung
    .map((id) => {
      const ziel = schritte.get(id)?.prosa;
      return `<li><span class="s ready"></span><div>${schrittLabel(t(id), id)} <button class="kopier" data-id="${esc(id)}">Bau-Prompt kopieren</button>${ziel ? `<br><span class="sub">${esc(ersterSatz(ziel))}</span>` : ''}</div></li>`;
    })
    .join('\n');

  // Fehlerbuch (Entscheid David 8.8.2026): W2·18-FEHLERBUCH ist der stehende
  // Sammel-Schritt für Alltags-Fehlerfunde.
  const fb = schritte.get('W2·18-FEHLERBUCH')?.checkliste ?? null;
  const fbOffen = fb?.offen ?? 0;
  const fehlerbuchHtml = `<div class="panel" style="border-color:var(--slate);background:var(--slate-bg)">
    <h3>Dein Fehlerbuch (W2·18-FEHLERBUCH)</h3>
    ${
      fbOffen > 0
        ? `<p class="sub">${fbOffen} offene Position${fbOffen === 1 ? '' : 'en'} aus deiner täglichen Nutzung — eine Fix-Batch-Session arbeitet sie gebündelt ab (ein Branch, einmal Tore, eine Landung).</p>
    <ul class="liste" style="margin-top:.6rem">${(fb?.offenTexte ?? []).map((x) => `<li><span class="s ready"></span><div>${esc(x)}</div></li>`).join('\n')}${fbOffen > (fb?.offenTexte.length ?? 0) ? `<li><span class="sub">… und ${fbOffen - (fb?.offenTexte.length ?? 0)} weitere in ROADMAP.md</span></li>` : ''}</ul>
    ${prompts['W2·18-FEHLERBUCH'] ? `<p class="next"><button class="kopier" data-id="W2·18-FEHLERBUCH">Fix-Batch-Prompt kopieren</button></p>` : ''}`
        : `<p class="sub">Keine offenen Positionen. Fällt dir bei der täglichen Nutzung ein Fehler auf, melde ihn einfach im Chat — die Session trägt ihn hier ein; behoben wird gebündelt statt einzeln.</p>`
    }
  </div>`;

  // Bau-Messreihe (Schritt QS-SELBSTOPT). Der erklärende Satz darunter ist
  // Absicht, nicht Zierde: diese Zahlen SIND keine Bewertung, sondern
  // Beobachtungsgrössen und ausdrücklich nie ein Tor-Kriterium.
  const messreihe = selbstoptKennzahlen();
  const messreiheHtml = messreihe
    ? `${kacheln([
        { wert: messreihe.ciFailure, label: 'der CI-Läufe MIT Ergebnis sind gescheitert' },
        { wert: messreihe.ciAbgebrochen, label: 'der CI-Läufe wurden abgebrochen (ohne Ergebnis)' },
        { wert: messreihe.ciRerun, label: 'der CI-Läufe waren Wiederholungen' },
        { wert: `${messreihe.torRot}/${messreihe.torGesamt}`, label: 'Tor-Läufe rot seit der vorigen Messung' },
        { wert: messreihe.rework, label: 'Quelltext-Commits mit Nacharbeit binnen 48 h' },
        { wert: messreihe.snapshots, label: 'Messpunkte in der Reihe' },
      ])}
  <p class="hinweis">Stand ${esc(messreihe.stand)} · Quelle <span class="id">messwerte/selbstopt-zeitreihe.json</span>,
  erhoben mit <span class="id">npm run selbstopt:erheben</span> aus git, der GitHub-API und dem lokalen Tor-Protokoll.
  <b>Diese Zahlen bewerten nichts.</b> Sie sind Beobachtung: kein Prüf-Tor hängt an ihnen, und keines wird je an ihnen hängen —
  sonst würde der Bau die Messung verbessern statt die Sache.${
    messreihe.ausfaelle.length
      ? ` <br>⚠ Bei der letzten Erhebung nicht verfügbar: ${esc(messreihe.ausfaelle.join(' · '))} (kein Fehler des Bau-Stands).`
      : ''
  }</p>`
    : `<p class="hinweis">Noch keine Messreihe erhoben — <span class="id">npm run selbstopt:erheben</span> legt den ersten Messpunkt an.</p>`;

  const lagebildLink = esc(seitenDatei(o.indexPfad, 'lagebild'));

  const kopf = seitenKopf({
    stand: o.stand,
    watch: o.watch,
    marke: 'Bau-Details',
    h1: 'Bau-Details — alles, was eine Bau-Session braucht',
    lede: `Die Arbeitsfläche hinter dem <a href="${lagebildLink}">Lagebild</a>: alle offenen Arbeitspakete mit Kürzel,
  ihre Sperren untereinander, die fertigen Bau-Aufträge zum Kopieren und die Messreihe des Bau-Betriebs.
  Das Lagebild beantwortet vier Fragen in Klartext; diese Seite beantwortet den Rest — und hier sind die
  Kürzel Absicht, weil Plan, Detailpläne und Änderungsvermerke darauf verweisen.`,
    extra: `<nav class="springen">Springen zu: <a href="#bereiche">Alle offenen Schritte</a> · <a href="#queue">Vollständige Warteschlange</a> · <a href="#parallel">Parallel startbar</a> · <a href="#fehlerbuch">Fehlerbuch</a> · <a href="#messreihe">Bau-Messreihe</a></nav>`,
  });

  const inhalt = `${kopf}

<section id="bereiche">
  <p class="eyebrow">Bau-Bereiche</p>
  <h2>Alle offenen Schritte, nach Bereich gegliedert</h2>
  <p class="lede">Dieselbe Einteilung wie die Bereichs-Schilder (mechanisch aus den deklarierten Dateiflächen abgeleitet);
  ein Schritt mit mehreren Flächen steht bei seinem Hauptbereich. Innerhalb: im Bau zuerst, dann sofort Baubares.
  Die Zeile «nicht parallel mit …» beantwortet die Disponenten-Frage, ob zwei Sessions gleichzeitig laufen dürfen.</p>
  <input id="filter" type="search" placeholder="Schritte filtern — z. B. «Kanton», «Design», «Suche» …" aria-label="Schritte filtern">
  <div class="cards">${karten}</div>
</section>

<section id="queue">
  <p class="eyebrow">Reihenfolge</p>
  <h2>Vollständige Warteschlange (${queue.length} Schritt${queue.length === 1 ? '' : 'e'})</h2>
  <p class="lede">Die <span class="id">@queue</span> aus ROADMAP.md in voller Länge — das Lagebild zeigt davon die ersten fünf.
  Mit «Bau-Prompt kopieren» holst du dir den fertigen Auftrag für eine neue Claude-Code-Session.</p>
  <ol class="queue">${queueHtml}</ol>
</section>

<section id="parallel">
  <p class="eyebrow">Parallelbetrieb</p>
  <h2>Jetzt parallel startbar — ohne Kollision</h2>
  ${
    laneEmpfehlung.length > 1
      ? `<p class="lede">Diese Schritte berühren getrennte Dateiflächen (Resolver-Lane 1): für jeden lässt sich eine eigene Session starten, sie kommen sich nicht in die Quere.</p>
  <ul class="liste">${laneHtml}</ul>`
      : '<p class="lede">Gerade kein kollisionsfreies Paar — die baubaren Schritte teilen sich ihre Baufelder, es läuft also sinnvollerweise eine Session auf einmal.</p>'
  }
</section>

<section id="fehlerbuch">
  <p class="eyebrow">Fehlerbuch</p>
  <h2>Gesammelte Alltags-Fehlerfunde</h2>
  ${fehlerbuchHtml}
</section>

<section id="messreihe">
  <p class="eyebrow">Bau-Messreihe</p>
  <h2>Wie rund der Bau läuft</h2>
  <p class="lede">Seit August 2026 misst der Bau sich selbst: bei jedem Prüflauf wird festgehalten, welches Tor grün oder rot war,
  und in Abständen kommen die Zahlen aus der Bau-Prüfstrasse (CI) und der Versionsgeschichte dazu. So lässt sich später belegen,
  ob eine Prozessänderung etwas gebracht hat — statt es zu vermuten.</p>
  ${messreiheHtml}
</section>

${fussnote('Klartext-Namen der Baustellen sind gepflegte Übersetzungen (@lagebild-Kopfzeile der Fahrpläne); alle Zahlen sind mechanisch.')}`;

  const json = JSON.stringify(prompts).replace(/<\//g, '<\\/');
  const skript = `  const PROMPTS = ${json};
  let timer = null;
  const filter = document.getElementById('filter');
  if (filter) filter.addEventListener('input', () => {
    const q = filter.value.trim().toLowerCase();
    for (const card of document.querySelectorAll('.cards .card')) {
      card.style.display = !q || card.textContent.toLowerCase().includes(q) ? '' : 'none';
    }
  });
  document.addEventListener('click', (ev) => {
    const b = ev.target.closest('.kopier');
    if (!b) return;
    const p = PROMPTS[b.dataset.id];
    if (!p) return;
    navigator.clipboard.writeText(p).then(() => {
      const t = document.getElementById('toast');
      t.style.opacity = '1';
      clearTimeout(timer);
      timer = setTimeout(() => { t.style.opacity = '0'; }, 2500);
    });
  });`;

  return rahmen({
    indexPfad: o.indexPfad,
    aktiv: 'bau',
    titel: `LexMetrik — Bau-Details ${o.stand}`,
    watch: o.watch,
    inhalt,
    skript,
    nachSpann: '<div id="toast" role="status">Bau-Prompt kopiert — in einer neuen Claude-Code-Session einfügen.</div>',
  });
}
