# FAHRPLAN — Multi-Pane / Split-View (+ Breiten-Umschalter)
<!-- @lagebild name: Split-View · zweck: Gesetz, Rechner und Entscheid nebeneinander wie Browser-Fenster. -->

> **ARCHIVIERT 23.9.2026 (W2·29-WERKBANK-LESER S5, FAHRPLAN-WERKBANK-UMBAU §7).** Ohne lebenden
> Schritt; der offene Rest (B3 Scroll-Positions-Wiederherstellung, Tastatur-Pane-Wechsel, Bündel S,
> a11y-Restpunkte) lebt als Posten `plan/posten/2026-06-29-multi-pane-split-view.md` unter
> `W3-AUSBAU` weiter und zeigt hierher. Stand bei Archivierung, nicht nachgeführt (§2b).

**Heimat: ROADMAP-Schritt `W3-AUSBAU`, Zeile «Multi-Pane / Split-View».** *Nachtrag 14.8.2026
(QS-PLAN-EINFACH): die früheren Teil-Etiketten `W3·14-B3`/`-S`/`-a11y` sind Checklisten-Zeilen
des Dachs. Nachzug 15.8.2026 (Etiketten-Konsolidierung BAUPLAN-UMBAU): auch das Dach `W3·14`
selbst ist in `W3-AUSBAU` aufgegangen — **Trailer einheitlich `Roadmap: W3-AUSBAU`**; alle
`W3·14`-Nennungen unten sind als diese Zeile zu lesen.*

> **Stand 29.6.2026 · KOMPLETT: A + B-0 + B-0b + B-1 + B-2 + B-2.5 + B-4 + B-5 (Branch
> `feat/split-view-strang-a`).** A/B-0/B-0b + B-1/B-2 auf **Prod** (`bec0ecb7`); B-2.5/B-4/B-5
> committet (`c9a8cca9`), Deploy ausstehend. Zwei ultracode-Bugchecks (B-1; B-2.5/B-4/B-5) —
> letzterer fing einen Re-Render-Loop-BLOCKER (React-Compiler NICHT aktiv) vor dem Deploy.
> Detail-„Wie" zum ROADMAP-Strang
> *„Multi-Pane / Split-View"*. Steuerung (Reihenfolge/Park) bleibt in `ROADMAP.md`;
> Ist-Zustand/Deploy in `STRUKTUR.md`. Auftrag David 29.6.2026: zwei oder drei
> „Engines" nebeneinander **wie im Browser** — Gesetz | Rechner | Begründungs-Absatz.
>
> **Erledigt (gegated, golden byte-gleich, 57 Routen prerendern):**
> - **Strang A** — Inhaltsbreite-Umschalter `[Kompakt|Breit]` (Commit `fc5dbb3c`);
>   ultracode-6-Linsen-Review, 4 Befunde behoben (toter `/70`-Alpha-Fill, a11y-Label,
>   localStorage-try/catch, expliziter Setter).
> - **B-0** — `<Routes>` nach `src/RouteSwitch.tsx` ausgelagert (Commit `2ed15aa7`),
>   verhaltensneutral; Runtime-Smoke (/, /rechner, /gesetze, /pro→/, NotFound) sauber.
>
> **Nächstes = B-0b (Container-Query-Fundament) — wartet auf zwei Entscheide Davids**
> (unten „Offene Entscheide"). B-0b ist der Hauptaufwand → eigene fokussierte Session.
> Bau weiter in **eigenem Worktree** (`Shell.tsx`/`Topbar.tsx`/`App.tsx`/
> `tailwind.config.js` = §12-Kollisionsdateien), nie parallel auf denselben Dateien.

---

> Erledigt-/Stand-Abschnitte vom 14.8.2026 nach `archiv/FAHRPLAN-ERLEDIGT-ABSCHNITTE.md` verschoben (QS-PLAN-EINFACH).

## §0 · Zweck

Detailquelle zu `W3·14`/`W3·14-B3` — zwei oder drei „Engines" nebeneinander wie
im Browser (Gesetz | Rechner | Begründungs-Absatz). Steuerung (Reihenfolge/Park)
bleibt in `ROADMAP.md`; Ist-Zustand/Deploy in `STRUKTUR.md`. Bau in eigenem
Worktree, nie parallel auf denselben Kollisionsdateien (§12).

---

## §1 · ROADMAP-Spec W3·14 (wörtlich verschoben 31.7.2026)

> **→ Bau-Spec: «STRANG B — Split-View (2–3 Panes)», «Reihenfolge & Tore» und «Entscheide (alle getroffen 29.6.2026)» dieser Datei.** Dieser § ist die *wörtlich hierher verschobene ROADMAP-Prosa* (Wortlaut-Heimat), nicht die Bau-Spezifikation — wer nur ihn slict, baut ohne die verbindlichen Einheiten, Entscheide und Querschnitt-Regeln.

*Wörtlich aus `ROADMAP.md` (QS-TOK/ROADMAP-Diät B4, 31.7.2026); dort bleiben Checkbox, `@meta`, Einzeiler, Pointer. Steuert nicht — Spec-Heimat.* *Wörtlich bis auf die Selbstverweise, die am 31.7.2026 auf «diese Datei» neutralisiert wurden (Endprüfung Fix-Runde 1; Fund R2-18).*

  David 29.6.2026)*. 2–3 „Engines" nebeneinander **wie im Browser** → der **Verzahnungs-Burggraben
  sichtbar** (Gesetz | Rechner | Begründungs-Absatz). **Erst Strang A** (Inhaltsbreite-Umschalter
  kompakt/breit, klein, `[OF]`), **dann Strang B** (Split-View: `RouteSwitch`-Extraktion →
  Container-Query-Fundament → Pane-Container in `Shell` → Steuerung → Scroll/A11y pro Pane →
  Mobil-Faltung; Layout-Modus **B3** Primär-URL + teilbar; bis **3 Panes** responsiv). Strikt
  zustandslos (Panes speichern nur Pfade, §5/§8); Lesespalte `max-w-reading` bleibt schmal (§13.2).
  **Kernaufwand = CSS Container-Queries** (450 Viewport-Breakpoints brechen in schmalen Panes;
  gestuft CQ-1). Detail + Architektur-Befund: `FAHRPLAN-SPLIT-VIEW.md`. §12-Kollisionsdateien
  `Shell.tsx`/`Topbar.tsx`/`App.tsx`/`tailwind.config.js` → nie parallel.

    3 verifizierte, bewusst **nach** dem Prod-Deploy zurückgestellte Kanten (Fokus-Logik-Regressions-
    risiko vor Deploy zu hoch): **#4** `usePaneLayout.ts` Z.102–110 strippt `?p=` per
    `history.replaceState` am React-Router vorbei → `useLocation().search` veraltet (Sidebar-Aktiv-
    Markierung); Fix = `navigate(…, {replace:true})`. **#6** `gesetz-leser/inhalt.tsx` Z.855 —
    F6-Panewechsel verlässt die Fokus-Falle des offenen In-Pane-Drawers (F6-Guard `Shell.tsx` prüft
    nur `aria-modal="true"`); Fix = Guard auf offenen fokus-gefangenen Drawer weiten. **#7**
    `Shell.tsx` F6-Handler ordnet Fokus auf PaneKopf-Knopf/Gutter dem falschen Pane zu; Fix =
    `data-pane-root`-Marker + `closest()`. (#1/#2 MITTEL + #3/#5 NIEDRIG am 29.6. gefixt + deployt.)

### Teilschritt-Spezifikation W3·14 (verschoben 31.7.2026)

*Aus `ROADMAP.md` hierher verschoben (QS-TOK-Nachdiät, 31.7.2026, Nachhalte-Konvention*
*Ausführungs-Protokoll Ziff. 6). Die ROADMAP führt je Teilschritt nur noch Checkbox,*
*`@meta` und einen Einzeiler; der Wortlaut unten ist die massgebliche Fassung.*

**Schnitt-Begründung (Session-Granularität AP-6) — wörtlich:** *Wörtlich bis auf die Selbstverweise, die am 31.7.2026 auf «diese Datei» neutralisiert wurden (Endprüfung Fix-Runde 1; Fund R2-18).*

  **Session-Granularität (AP-6, 31.7.2026):** Strang A sowie B-0/B-0b/B-1/B-2/B-2.5/B-4/B-5 sind
  gebaut; Bündel S, a11y-Restpunkte und B-3 stehen seit 14.8.2026 als Checklisten-Zeilen am
  Dach `W3·14` (Etiketten-Konsolidierung QS-PLAN-EINFACH).

**Ursprünglicher Wortlaut der Teilschritt-Bullets — wörtlich:** *Wörtlich bis auf die Selbstverweise, die am 31.7.2026 auf «diese Datei» neutralisiert wurden (Endprüfung Fix-Runde 1; Fund R2-18).*

  - [ ] **14-B3 · Scroll & Fokus pro Pane — Restposten** — pro-Pane-Scroll und Spy laufen bereits; **offen**: Scroll-POSITIONS-Wiederherstellung (`ScrollWiederherstellung`/`ScrollZuHash` sind in `App.tsx` weiterhin window-basiert und im Multipane-Primär ohne Wirkung) + Tastatur-Pane-Wechsel. Detail: diese Datei §STRANG B (B-3). Trailer `Roadmap: W3·14` (Teil-Etikett 14.8.2026 ins Dach konsolidiert).

### Bündel S (Auftrags-Eingang 30.6.2026) im Wortlaut (verschoben 31.7.2026)

*Aus `ROADMAP.md` hierher verschoben (QS-TOK-Nachdiät, 31.7.2026); massgebliche Fassung.*

> > **Bündel S · Split-View → Schritt 14** *(SPLIT-VIEW, eigener Worktree):*
> > - **S1 Breadcrumbs in der Pane:** `InhaltsKopf.tsx` Z.30 nutzt globalen Router-`<Link to>` → zielt
> >   aufs Hauptfenster statt in die autonome Pane. Fix über `PaneKontext`-Navigator.
> > - **S2 Tracker «alles schliessen» schliesst auch Panes:** Panes leben in `usePaneLayout`
> >   (localStorage `lexmetrik-panes`), separater Store von den Tabs → Close-all muss `usePaneLayout`
> >   mit-resetten. *(S1+S2 bündeln, gleiches Subsystem.)*


---


---

## Archivierte Abschnitte *(Plan-Neuschnitt 29.8.2026)*

7 Abschnitt(e) dieser Datei sind wörtlich nach
[`archiv/fahrplaene/FAHRPLAN-SPLIT-VIEW.md`](../archiv/fahrplaene/FAHRPLAN-SPLIT-VIEW.md) ausgelagert — sie tragen keine offene
ROADMAP-Bindung mehr. Titel:

- Warum (Produkt)
- Reihenfolge (Davids Entscheide 29.6.2026, FIXIERT)
- Architektur-Befund (29.6.2026 gelesen, nichts geändert)
- STRANG B — Split-View (2–3 Panes)  *(Fundament, mehrphasig)*
- Reihenfolge & Tore (Zusammenfassung)
- Entscheide (alle getroffen 29.6.2026)
- §2 · ROADMAP-Spec-Nachzug `W3·14-S` (wörtlich verschoben 4.8.2026, ROADMAP-Diät Welle 3)
