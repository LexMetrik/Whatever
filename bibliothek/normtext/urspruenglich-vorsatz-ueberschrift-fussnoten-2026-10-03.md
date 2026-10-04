# «Ursprünglich …»-Vorsatz an Überschrift-Fussnoten — Messung und Regel (3.10.2026)

**Erstellt:** 3.10.2026 — Roadmap-Schritt W2·27-BUND-FERTIG, Folge-Posten von #1286 («Ursprünglich»-Vorsatz vor B1-Anker abschneiden) samt Nachbar-Posten «Ursprünglich-Fussnoten an Überschriften 125».
**Quellen (Abruf 3.10.2026):** Fedlex-AKN-XML der in Kraft stehenden Konsolidierung (SPARQL `dateApplicability` → `isExemplifiedBy`, `<authorialNote>`): EBG SR 742.101 (Stand 2026-01-01), AHVV SR 831.101 (2026-01-01), AIG SR 142.20 (2026-06-12), RVOG SR 172.010 (2025-05-01), KVV SR 832.102 (2026-08-01), USG SR 814.01 (2026-08-01), ASYLG SR 142.31 (2026-06-12). Je Erlass der Fussnoten-Wortlaut mit dem Struktur-Sidecar (`public/normtext/struktur/bund/*.json`) wörtlich identisch (7/7).
**Status:** Messung + Regel, Gegenprüfung ausstehend, keine fachliche Abnahme gesetzt.

## Befund

Fedlex vermerkt an einer Gliederungsüberschrift oft zuerst deren Ur-Bezeichnung, danach die Fassung: «Ursprünglich vor Art. 56. Fassung gemäss Ziff. II 13 des BG vom 20. März 2009 …» (EBG, Kapitel 7). Der B1-Anker (`ganzeFassung`) verlangt «Fassung gemäss»/«Eingefügt durch» am Textanfang; der Vorsatz liess ihn ins Leere laufen, die Artikel unter der Überschrift erbten nichts.

Messung am Korpus (`public/normtext/struktur/bund/*.json`, 231 Erlasse): 279 Fussnoten beginnen mit «Ursprünglich»; 123 davon hängen an einer Überschrift (`sektion`), 2 weitere an einer Überschrift tragen «Ursprünglich» erst NACH dem Anker (AHVV 226, VIL 30; schon vorher vererbt) = die 125 des Nachbar-Postens. Von den 123 haben 49 hinter dem Vorsatz einen gültigen B1-Anker (27 Erlasse); 74 sind reine Ur-Bezeichnung («Ursprünglich vor Art. 27.», «Ursprünglich 2. Abschn.», AHVV 28/31 «…; hierher versetzt gemäss …», EMRK 52 «… Bereinigt gemäss …») ohne Fassungs-/Einfügungsklausel.

Vorsatz-Formen der 49: «vor/nach Art. N» (26), Kapitel-/Abschnitts-/Titel-Bezeichnungen wie «3. Kap.», «fünfter Tit.», «Zweites Kapitelbis/ter/quater», «14bis., dann 14b. Kap.» (14), «Bst. X» bzw. «Bst. X, danach Bst. Y» (4), je einzeln «Ziff. Vbis», «Abschnitt 11bis», «Sechster Abschnitt und Art. 964a–964f», «IIbis», «E» (5); Summe 49, Zählung per vite-node-Skript über alle Sidecars (`ohneUrsprungVorsatz` auf jede Überschrift-Fussnote mit «Ursprünglich»-Kopf)

## Regel (umgesetzt in `ohneUrsprungVorsatz`, `historie-parse.ts`; Schnitt-Kandidaten `historie-ursprung.ts`)

Beginnt die Fussnote mit «Ursprünglich» und folgt hinter einer Satzgrenze ein gültiger B1-Anker, gilt der Rest für die Vererbung; der Vorsatz muss reine Ur-Bezeichnung sein (kein weiteres Ereignis-Verb). Sonst bleibt der Text unverändert. Der Vorsatz selbst wird nicht an die Artikel darunter vererbt (`SEKTION_ERBT` enthält `urspruenglich` bewusst nicht): er beschreibt die Überschrift, nicht den Artikel; am Träger-Artikel bleibt er als eigenes Ereignis. «Ursprünglich vor/nach Art. N» belegt keine Umnummerierung eines Artikels, sondern die frühere Lage der Überschrift; Umnummerierungen sind eigene Fussnoten («Nummerierung gemäss», Typ `nummerierung`). Regel C (Überschrift-Ereignis nie in «Gilt seit») unverändert.

## Wirkung

Vergleich der Historie-Shards origin/main ↔ Kopf: 397 Artikel in 26 Erlassen geändert — 41 «nichts erfasst» → Chronik, 356 mit zusätzlichem Überschrift-Ereignis (hatten schon eigene Ereignisse); «Gilt seit» unverändert (0), nichts ausserhalb der Klasse (kein verlorenes Ereignis, kein Nicht-Überschrift-Ereignis neu).
