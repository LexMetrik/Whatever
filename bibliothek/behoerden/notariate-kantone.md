# Notariate je Kanton — wer beurkundet GmbH-/AG-Gründungen, und wo findet man die Urkundsperson?

**Erstellt:** 7.6.2026 (Auftrag David: Notariats-Anlaufstellen mit Link in den
Gründungs-Masken anzeigen). **Recherche:** Web-Sweep über alle 26 Kantone,
jede URL per Abruf geprüft (Ausnahmen unten vermerkt).
**Status: ERSTRECHERCHE (einfach belegt; 3 als unsicher markierte Einträge: UR/AI/BL).**
Fachliche Abnahme David ausstehend.

**Bundesrahmen:** Art. 55 SchlT ZGB überlässt den Kantonen, wer öffentliche
Urkunden errichtet. Für GRÜNDUNGEN gilt — anders als bei Grundstücken —
**keine örtliche Ausschliesslichkeit**: Beurkundung bei jeder schweizerischen
Urkundsperson möglich; die Tabelle zeigt die Anlaufstelle IM jeweiligen
Kanton. → Engine-Hinweis-Zeile: «Beurkundung auch ausserkantonal zulässig.»

## Stammdaten-Tabelle (Engine-Quelle: `src/lib/notariate.ts`)

| Kt. | System (Gründungen) | Anlaufstelle | URL (geprüft 7.6.2026) | Status |
|---|---|---|---|---|
| ZH | Amtsnotariat | Notariate Kanton Zürich | https://www.notariate-zh.ch/de/notariat/gesellschaftsrecht/gmbh/gruendung-einer-gmbh | ok |
| BE | frei (lateinisch) | Notariatsregister Kanton Bern (DIJ) | https://www.gba.dij.be.ch/de/start/notariat/notariatsregister.html | ok |
| LU | frei | Notarenregister Kanton Luzern (Gerichte) | https://gerichte.lu.ch/anwaelte_notare_sachwalter/notare/notarenregister_kanton_luzern | ok |
| UR | frei | Justizdirektion Uri (Aufsicht; kein Online-Verzeichnis) | https://www.ur.ch/dienstleistungen/3039 | **unsicher** — Seite betrifft v. a. Beglaubigungen; vor Live-Einsatz verifizieren |
| SZ | gemischt (Bezirksnotare + registrierte Urkundspersonen) | Urkundspersonen-Liste Kantonsgericht SZ (PDF, Stand 4/2026) | https://www.sz.ch/public/upload/assets/69540/Urkundspersonen_des_Kantons_Schwyz.pdf | ok |
| OW | gemischt (freie + Gemeindenotare) | Urkundspersonen-Liste OW (Notariatskommission, Stand 5/2026) | https://www.ow.ch/publikationen/15380 | ok |
| NW | Amtsnotariat (+ Privatnotariat ohne Online-Verzeichnis) | Abteilung Notariat NW | https://www.nw.ch/notariat/2497 | ok (Privatnotariat unverlinkt) |
| GL | gemischt (ernannte Anwälte als Urkundspersonen) | Beurkundungsgeschäfte Kanton Glarus (Liste) | https://www.gl.ch/rechtspflege/oeffentliche-beurkundung/alle-beurkundungsgeschaefte.html/288 | ok |
| ZG | gemischt | Urkundspersonen-Register (UPReg, gesamtschweizerisch) | https://www.upreg.ch/ | ok |
| FR | frei (lateinisch) | Registre du notariat (Service de la justice) | https://www.fr.ch/etat-et-droit/gouvernement-et-administration/registre-du-notariat | ok |
| SO | gemischt (freie Notare; Amtschreibereien nur Grundstücke) | Notarenliste Staatskanzlei SO | https://so.ch/staatskanzlei/legistik-und-justiz/notare/ | ok |
| BS | frei | Notariatskammer Basel-Stadt | https://www.notariatskammerbasel.ch/ | ok (Kammer, amtsnah) |
| BL | frei | Basellandschaftliches Notariat (ZRV) | https://www.baselland.ch/politik-und-behorden/direktionen/sicherheitsdirektion/zivilrechtsverwaltung/basellandschaftliches-notariat | **unsicher** — Abruf 403 (Bot-Block), im Browser erreichbar |
| SH | **Handelsregisteramt beurkundet Gründungen selbst** | Handelsregisteramt Kanton Schaffhausen | https://sh.ch/CMS/Webseite/Kanton-Schaffhausen/Beh-rde/Verwaltung/Volkswirtschaftsdepartement/Handelsregisteramt-3872-DE.html | ok (Sonderregel; Deep-Links JS-gerendert) |
| AR | gemischt («kleines Notariat»: HR-Führer, Grundbuchverwalter, registrierte Anwälte) | Verzeichnis Obergericht AR | https://ar.ch/gerichte/obergericht/anwaltsregister-oeffentliche-urkundspersonen/ | ok |
| AI | gemischt (Grundbuchverwalter + zugelassene Anwälte) | Grundbuch/Notariat AI (Amtsstelle; keine Personenliste online) | https://ai.ch/themen/planen-und-bauen/grundbuch-notariat | **unsicher** — keine öffentliche Personenliste |
| SG | gemischt (4 Amtsnotariate + freiberufliche Urkundspersonen) | Amtsnotariate SG (Beurkundungen) | https://www.sg.ch/recht/handelsregister-notariate/amtsnotariate/beurkundungen/ | ok |
| GR | frei (Kantons-/Regionalnotare) | Register Justiz GR | https://www.justiz-gr.ch/advokatur-und-notariat/register/ | ok |
| AG | frei | Register der Urkundspersonen (Notariatskommission AG) | https://www.ag.ch/de/themen/planen-bauen/grundbuch-vermessung/notariat/notariatskommission/register | ok |
| TG | Amtsnotariat (Bezirksnotariate) | Grundbuchämter und Notariate TG (Standorte) | https://gni.tg.ch/standorte.html/1776 | ok |
| TI | frei (lateinisch) | Ordine dei Notai del Cantone Ticino | https://www.odnti.ch/ | ok (Kammer mit Pflichtmitgliedschaft) |
| VD | frei (lateinisch) | Annuaire — Association des Notaires Vaudois | https://notaires-vaudois.ch/annuaire/ | ok (Verband; Aufsicht DGAIC/vd.ch) |
| VS | frei (lateinisch) | Registre des notaires (Service de la justice) | https://www.vs.ch/web/sjsj/registe-notaires | ok |
| NE | frei (lateinisch) | Liste officielle des notaires (Stand 1/2026) | https://www.ne.ch/themes/etat-droit-et-finances/droits-et-justice/notaires | ok |
| GE | frei (lateinisch) | Liste des notaires du canton de Genève (Stand 6/2025) | https://www.ge.ch/document/liste-notaires-du-canton-geneve | ok |
| JU | frei (lateinisch) | Notaires — République et Canton du Jura | https://www.jura.ch/JUST/Notaires/Notaires.html | ok |

## Deterministische Regeln für die Maske

1. Kanton gewählt → Zeile «Beurkundung: {System-Label} — {Anlaufstelle}» mit
   Link; dazu immer der Hinweis «Gründungs-Beurkundung ist auch bei einer
   Urkundsperson eines anderen Kantons zulässig (keine örtliche
   Ausschliesslichkeit wie bei Grundstücken)».
2. SH zusätzlich hervorheben: Beurkundung direkt beim Handelsregisteramt.
3. Als `unsicher` markierte Einträge (UR, AI, BL) tragen in den Stammdaten
   `urlBelegt: false` (Feldname bewusst ≠ §7-`verified`) und in der UI den Zusatz «Angabe ohne Gewähr —
   Anlaufstelle kontaktieren».

## Pflegebedarf

- Listen-PDFs sind datiert (SZ 4/2026, OW 5/2026, NE 1/2026, GE 6/2025) —
  **jährlicher Prüfrhythmus**, Eintrag im Parameter-Verfallsregister.
- UR/AI/BL-Verifikation offen (oben).

## Nachtrag 15.10.2026 (RL-33): `system` ist kein MwSt-Kriterium

Amts- und freie Notare rechnen MwSt (MWSTV SR 641.201 Art. 14 Ziff. 13, Stand 1.1.2025;
MWSTG SR 641.20 Art. 25 Abs. 1). Die Spalte `system` bleibt Stammdatum der Anlaufstelle;
die MwSt-Behandlung je Kanton steht in `src/data/tarif/mwst-notariat.ts`, Belege in
`bibliothek/kosten/beurkundungstarife-kantone.md` (Nachtrag 15.10.2026).
