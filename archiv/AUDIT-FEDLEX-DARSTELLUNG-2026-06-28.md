# Audit — Vollständigkeit der Bundes-Gesetzesdarstellung gegen Fedlex

> **Stand 28.6.2026.** Multi-Agent-Audit (ultracode, 54 Agenten, 12 Informations-Dimensionen):
> bildet LexMetrik alle Informationen ab, die Fedlex für einen Bundeserlass bietet? Jede Dimension
> Fedlex-HTML (Ground Truth) ↔ unsere JSON ↔ Renderer verglichen, jede Lücke adversarial gegengeprüft.
> **33 Lücken bestätigt, 9 widerlegt.** Dieses Dokument ist die Befund-Grundlage des
> Umbaus (→ `FAHRPLAN-NORMTEXT-DARSTELLUNG.md`).

**Schweregrad:** 19 info-verlust · 9 darstellung · 5 klein

## Bestätigte Lücken (nach Dimension)

### PREFACE / Kopf des Erlasses

**G1 · [info-verlust | beides] Amtliches Erlassdatum 'vom ...' fehlt komplett**  
- Fedlex: <p class="erlassdatum">vom 10. Dezember 1907 (Stand am 1. Januar 2026)</p> — Datum der Verabschiedung des Erlasses (Teil der amtlichen Zitierung)  
- LexMetrik: register.json hat KEIN erlassdatum-Feld (0 von 1460 Eintraegen); ZGB.json enthaelt weder '10. Dezember 1907' noch 'Stand am'. Renderer (inhalt.tsx Z.670-676) zeigt nur SR, Artikelzahl, 'Stand <consolidationdatum>' und geltende-Fassung-Link — das 'vom <Datum>' erscheint nirgends.  
- Umfang: ~alle 218 ausgelieferten Bund-Snapshots (388 von 499 gecachten preface-HTMLs haben die vom-Zeile)  
- Beleg: ZGB /tmp/zgb.html: 'vom 10. Dezember 1907 (Stand am 1. Januar 2026)'. Unser ZGB-Eintrag: nur stand='2026-01-01', titel='Schweizerisches Zivilgesetzbuch'. OR: Fedlex 'vom 30. März 1911', wir: stand='2026-01-01' ohne 1911. 388/499 preface-HTMLs tragen die vom-Zeile; betrifft praktisch alle 218 ausgelieferten Bund-Erlasse.  
- Konfidenz: hoch

**G2 · [info-verlust | beides] Kopf-/Abkuerzungs-Fussnoten im preface gehen verloren**  
- Fedlex: div.footnotes direkt im preface, angehaengt an erlasskurztitel/erlasstitel via <sup>-Marker — erklaert z.B. die Herkunft der amtlichen Abkuerzung oder eine Titelaenderung  
- LexMetrik: Extraktor liest den preface-Block nicht; weder register.json noch das Erlass-JSON speichern diese Fussnote; Renderer-Header hat kein Feld dafuer. Vollstaendig gedroppt.  
- Umfang: 50 von 218 ausgelieferten Bund-Erlassen haben eine preface-Fussnote (z.B. VVG, PatG, MSchV, PatV, PAVO, BetmG, VwVG, VG, AHVG, ArG)  
- Beleg: AHVG /tmp/ahvg.html: '(AHVG)<sup>1</sup>' mit Fussnote 'Abkürzung beigefügt gemäss Ziff. I des BG vom 24. Juni 1977 (9. AHV-Revision), in Kraft seit 1. Jan. 1979 (AS 1978 391; BBl 1976 III 1)'. Diese Fussnote fehlt bei uns vollstaendig. arg.html: '1 Fassung gemäss Ziff. I des BG vom 21. Dez. 2007 ... (AS 2008 2903)'.  
- Konfidenz: hoch

**G3 · [info-verlust | extraktion] Gespeicherter Titel weicht vom amtlichen erlasstitel ab**  
- Fedlex: <h1 class="erlasstitel botschafttitel"> mit dem vollen amtlichen Titel; erlasskurztitel separat in <h2 class="erlasskurztitel">  
- LexMetrik: register.titel ist eine handgesetzte Mischung aus Lang- und Kurztitel und kuerzt teils den amtlichen Wortlaut. Der verbatim amtliche erlasstitel ist nirgends gespeichert.  
- Umfang: Einzelfaelle unter den 218 Bund-Erlassen, in denen der amtliche Langtitel verkuerzt gespeichert ist (OR u.a.)  
- Beleg: OR: Fedlex erlasstitel='Bundesgesetz betreffend die Ergänzung des Schweizerischen Zivilgesetzbuches (Fünfter Teil: Obligationenrecht)'; unser titel='Bundesgesetz betreffend die Ergänzung des ZGB (Obligationenrecht)' — 'Schweizerischen Zivilgesetzbuches' zu 'ZGB' gekuerzt, 'Fünfter Teil:' weggelassen. (Die meisten der 156 'Abweichungen' sind dagegen nur Kurztitel-Anbau und kein Verlust.)  
- Konfidenz: hoch

### PREAMBLE / Ingress-Praeambel

**G4 · [info-verlust | beides] Erlassformel/Ingress (gestuetzt auf … beschliesst:/verordnet:) komplett verworfen**  
- Fedlex: Im <div id="preamble"> die vollstaendige Erlassformel mit Rechtsgrundlage und Botschafts-Verweis. ZGB: «Die Bundesversammlung der Schweizerischen Eidgenossenschaft, gestuetzt auf Artikel 64 der Bundesverfassung, nach Einsicht in eine Botschaft des Bundesrates vom 28. Mai 1904, beschliesst:». ArGV1 (Verordnung): «Der Schweizerische Bundesrat, gestuetzt auf Artikel 40 des Arbeitsgesetzes vom 13. Maerz 1964 (Gesetz, ArG), Artikel 83 Absatz 2 UVG und Artikel 33 DSG, verordnet:».  
- LexMetrik: Nichts. Kein eintraege-Element, kein Feld, kein synthetischer Eintrag — 0 von 218 Bund-JSON enthalten Ingress-Daten. Der erste eintraege-Eintrag ist stets der erste Artikel (z.B. ZGB.json beginnt mit art_1).  
- Umfang: Alle 218 Bund-Erlasse mit gecachtem HTML — alle 218 besitzen ein <div id="preamble"> (100%).  
- Beleg: Fedlex /tmp/zgb.html: <div id="preamble"><p class="man-template-autor">Die Bundesversammlung …</p><p class="ingress">gestuetzt auf Artikel 64 der Bundesverfassung…</p><p class="man-template-verb">beschliesst:</p>. Extraktor scripts/normtext/extrahiere-fedlex.ts Z.53-54: Regex `<article[^>]*\sid="art_${token}"…` — fasst nur <article>, nie <div id="preamble">. Renderer: grep preamble|ingress|erlassformel in src/pages/gesetz-leser/ + src/lib/normtext/ + src/components/normtext/ = 0 Treffer.  
- Konfidenz: hoch

**G5 · [info-verlust | beides] Praeambel-Fussnoten (BS/SR/AS/BBl-Verweise, «Fassung gemaess …») verloren**  
- Fedlex: Innerhalb des preamble-div ein eigener <div class="footnotes"> mit den Fundstellen zur Rechtsgrundlage und zur Botschaft sowie Aenderungsvermerken. ZGB: fn1 «[BS 1 3]. Dieser Bestimmung entspricht Artikel 122 der Bundesverfassung vom 18. April 1999 (SR 101).», fn2 «Fassung gemaess Anhang Ziff. 2 des Gerichtsstandsgesetzes vom 24. Maerz 2000, in Kraft seit 1. Jan. 2001 (AS 2000 2355; BBl 1999 2829).», fn3 «BBl 1904 IV 1, 1907 VI 367». ArGV1: SR 822.11 / SR 832.20 / SR 235.1 + «Fassung gemaess Anhang 2 Ziff. II 110 der Datenschutzverordnung … (AS 2022 568)».  
- LexMetrik: Nichts. Da der ganze preamble-Block uebersprungen wird, gehen auch seine Fussnoten verloren. Das eintraege[].fussnoten-Feld existiert nur fuer Artikel, hat aber fuer den Ingress keinen Traeger.  
- Umfang: Alle Bund-Erlasse mit Praeambel-Fussnoten (Gros der 218; ZGB, OR, ArGV1 stichprobenhaft bestaetigt).  
- Beleg: Fedlex /tmp/zgb.html, preamble-internes <div class="footnotes"><p id="fn-d1706615e18">…[BS 1 3]…</p><p id="fn-d1706615e36">Fassung gemaess … (AS 2000 2355; BBl 1999 2829)</p>…. Diese stehen IM preamble-div, das der Extraktor nie betritt; die sup-Marker 1/2/3 im Ingress haben in unseren Daten keinen Anker.  
- Konfidenz: hoch

**G6 · [info-verlust | beides] Verfassungs-Praeambel der BV (materieller Text) fehlt ganz**  
- Fedlex: Die BV hat im preamble-div eine echte normative Praeambel, nicht nur eine Erlassformel: «Praeambel — Im Namen Gottes des Allmaechtigen! Das Schweizervolk und die Kantone, in der Verantwortung gegenueber der Schoepfung, im Bestreben, den Bund zu erneuern …, geben sich folgende Verfassung:». Eigenstaendiger, oft zitierter Verfassungstext.  
- LexMetrik: Fehlt vollstaendig. BV.json beginnt mit art_1 («Das Schweizervolk und die Kantone Zuerich, Bern, Luzern …») — das ist Art. 1, NICHT die Praeambel. Die Praeambel davor ist nicht gespeichert und wird nicht angezeigt.  
- Umfang: BV (101) sicher betroffen; gilt analog fuer jeden Erlass mit substanzieller Praeambel statt blosser Erlassformel.  
- Beleg: Fedlex /tmp/bv.html preamble: «Praeambel Im Namen Gottes des Allmaechtigen! Das Schweizervolk und die Kantone, in der Verantwortung gegenueber der Schoepfung …». BV.json erstes eintraege-Element: id bund/BV/art_1, Text beginnt «Das Schweizervolk und die Kantone Zuerich, Bern, Luzern, Uri …» (= Art. 1, anderer Text). Keine synthetische Praeambel-Eintragung (grep praeamb/präamb ueber alle Bund-JSON = 0).  
- Konfidenz: hoch

### Absätze / Paragraphen-Treue

**G7 · [info-verlust | extraktion] Zwei verschiedene Artikel mit identischer Fedlex-ID art_<token> — nur der erste wird extrahiert, der zweite (samt seiner Absätze) geht verloren**  
- Fedlex: KKV: zwei <article id="art_126_z">: [0] Art. 126z 'Anlagebeschränkungen und Anlagetechniken' (1 Absatz) UND [1] Art. 126z^tredecies 'Wesentliche Mängel' mit echten Absätzen 1 + 2 ('Stellt die Prüfgesellschaft … wesentliche Mängel fest, so muss sie diese als Beanstandung …').  
- LexMetrik: public/normtext/bund/KKV.json hat nur EINEN Eintrag bund/KKV/art_126_z (= Art. 126z, 1 Block). Art. 126z^tredecies samt Abs. 1 + 2 ist als ganzer Artikel NICHT vorhanden — extrahiereArtikel nutzt html.match (erster Treffer gewinnt, Zeile 57), und die Inventar-Enumeration dedupliziert per Token.  
- Umfang: 1 Artikel mit echtem Absatz-Verlust im ganzen Bund-Korpus (KKV art_126z^tredecies, 2 Absätze). Reine Extraktions-Lücke.  
- Beleg: Korpusweiter Duplikat-ID-Scan: 4 Erlasse mit doppelten art_-IDs, 5 Zweit-Vorkommen gesamt; davon trägt nur KKV art_126_z (→126z^tredecies) echten Normtext mit Absätzen — die übrigen 4 (BetmG art_15, art_28 '28b–28l Aufgehoben'; VwVG art_71; PAVO art_11) sind aufgehobene/transitorische Stub-Überschriften ohne eigene Absätze, also kein Wortlaut-Verlust.  
- Konfidenz: hoch

### Aufzaehlungen lit./Ziff./Spiegelstriche

**G8 · [darstellung | beides] Verschachtelungstiefe der Aufzaehlung geht verloren (flaches Item-Modell + Renderer-Heuristik) -> Fehl-Einrueckung und FALSCHE Zitate bei Ziffer-oben/Buchstabe-unten und Tiefe>=3**  
- Fedlex: Fedlex kodiert die Verschachtelung explizit ueber geschachtelte <dl>: z.B. OR 959a (Bilanz) <dt>1.</dt><dd>...<dl><dt>a.</dt>...<dt>e.</dt></dl></dd><dt>2.</dt><dd>...<dl>a.-e.</dl></dd> — also Ziffern auf Top-Ebene, Buchstaben darunter; MWSTG 21 ebenso (Ziff 1-18, in Ziff 11/14 lit a-e); CISG 49 lit a/b -> roem. i)ii)iii). Die Einrueckung und Nummern-Hierarchie ist visuell eindeutig.  
- LexMetrik: JSON speichert items FLACH ohne Tiefen-Feld: BANKG.json art_16 = marke 1,1bis,a,b,2,3; OR 959a = 1,a,b,c,d,e,2,a,b,c,d,e. ArtikelBody.tsx rekonstruiert die Stufe heuristisch (Z.416-426: lit->0, ziff nach lit->1, strich->letzteNichtStrich+1). Fuer OR 959a/MWSTG 21/BankG 16 ergibt das: genestete lit faelschlich auf Stufe 0 (nicht eingerueckt), nachfolgende Top-Ziffern faelschlich auf Stufe 1 (eingerueckt), und der Zitier-Knopf (Z.441-456) baut eine falsche Eltern-Kette (Top-Ziffer bekommt ein lit-Praefix).  
- Umfang: >=20 Bund-Artikel JSON-verifiziert mit definitiver Fehl-Verschachtelung (Ziff-oben mit genesteten lit UND nachfolgender Top-Ziff), darunter Kern-Normen OR 959a (Bilanz), OR 727 (Revisionsstelle), MWSTG 21+23 (MWST-Ausnahmen). Breitere HTML-Klasse «Ziff-Parent mit lit-Kind» ~339 Artikel-Treffer (inkl. Dubletten/probe-Dateien) ueber ~228 Erlasse; zusaetzlich 60 Artikel mit <dl>-Schachtel-Tiefe>=3, davon die nicht-kanonischen (lit->ziff->ziff, lit->ziff->lit) ebenfalls fehl-gestuft.  
- Beleg: BankG 16 HTML: <dt>1.</dt>...<dd>krypto...<dl><dt>a.</dt><dd>...</dd><dt>b.</dt></dl></dd><dt>2.</dt><dt>3.</dt>. JSON BANKG.json: items marke=[1,1bis,a,b,2,3] flach, kein stufe. Renderer-Heuristik nachgerechnet -> Stufen [1=0,1bis=0,a=0,b=0,2=1,3=1]; korrekt waere [0,0,1,1,0,0]. Gleiche Klasse: OR 959a/959b/963a/964b/727, MWSTG 21+23, MStG 5, KOV 15, GFK 1, SortG 48. Tiefe-3 ausser kanonisch: elg art_10 (lit->ziff->ziff, Sub-Sub-Ziff landet auf Stufe 1 statt 2), erv art_4/mg art_13 (lit->ziff->strich ok, aber lit->ziff->lit waere defekt). Datei: scripts/normtext/extrahiere-fedlex.ts (parseDefinitionsListe gibt nur {marke,text} zurueck, Z.227-298, Tiefe bekannt aber verworfen) + src/components/normtext/ArtikelBody.tsx Z.411-456.  
- Konfidenz: hoch

**G9 · [klein | extraktion] Roemische Unterziffern (i)(ii)(iii)(iv) kollabieren in der marke zu 'i'/'v'-Duplikaten**  
- Fedlex: Internationale Erlasse nummerieren Unterpunkte roemisch: CISG 49 <dt>i)</dt><dt>ii)</dt><dt>iii)</dt>; KRK 40, PVUE 13/14/16, STAATENLOSE 1/24 ebenso. Fedlex zeigt i), ii), iii), iv).  
- LexMetrik: Die Marken-Regex in parseDefinitionsListe (extrahiere-fedlex.ts Z.255) erfasst nur EINEN Buchstaben: ^([a-z](?:bis|ter...)?). «ii)»->marke 'i', «iii)»->'i', «iv)»->'i'+'v'. JSON CISG art_49: items marke=[a,b,a,b,i,i,i]; KRK 40: [a,b,i,i,i,i,v,v,v]. Die roemische Reihenfolge ist verloren, im Reader stehen mehrere identische «i.».  
- Umfang: ~17 Artikel, ueberwiegend internationale Staatsvertraege (CISG, KRK, PVUE, STAATENLOSE, GFK). Bund-Kerngesetze (ZGB/OR/BV) nutzen keine roemischen Aufzaehler -> dort kein Befund.  
- Beleg: CISG 49 HTML dt-marks: ['a)','b)','a)','b)','i)','ii)','iii)']; JSON CISG.json art_49 items marke=['a','b','a','b','i','i','i']. Betroffen lt. Scan: CISG 49/64, KRK 40, PVUE 13/14/16/20/21, STAATENLOSE 1/24 u.a. (Text der Items bleibt korrekt, nur der Aufzaehler-Marker ist falsch). Datei: scripts/normtext/extrahiere-fedlex.ts Z.255 markeMatch-Regex.  
- Konfidenz: hoch

### Gliederung

**G10 · [info-verlust | extraktion] Gliederungsbaum der Schlusstitel/Uebergangsbestimmungen (disp-genestet) fehlt komplett**  
- Fedlex: Fedlex zeigt eigene Gliederungsbaeume fuer Schluss-/Uebergangstitel, z.B. ZGB <h2><a href="#disp_u1">Schlusstitel: Anwendungs- und Einfuehrungsbestimmungen</a></h2> mit <h>Erster Abschnitt: Die Anwendung bisherigen und neuen Rechts</h>, <h>Zweiter Abschnitt: Einfuehrungs- und Uebergangsbestimmungen</h> usw.; die Artikel darunter tragen id="disp_u1/art_1" (nicht art_1).  
- LexMetrik: Weder in public/normtext/bund/ZGB.json noch im Sidecar struktur/bund/ZGB.json vorhanden (ZGB.json hat keine nicht-numerischen Tokens, max Token 977; struktur kennt diese Sektionslabels nicht). Ursache: sowohl der Normtext-Extraktor (extrahiere-fedlex.ts, Regex /id="art_(\d[\w]*)"/g, Kommentar Z.362-370 schliesst nicht-art_<Ziffer>-Anker bewusst aus) als auch der Struktur-Extraktor (struktur-extrahiere.ts, ID = /id="(art_[^"]+)"/i) keyen auf art_<Ziffer> und ueberspringen id="disp_u1/art_N".  
- Umfang: 349 Artikel in 15 Erlassen (ZGB 178, OR 83, FZA 44, PatG 9, LugUe 9, VFV 7, SchKG 4, VZG 2, SVG 1 ...); fuer die Gliederungs-Dimension: alle Schlusstitel-/Uebergangs-Sektionsbaeume dieser Erlasse fehlen (allein ZGB ~6 Sektionsueberschriften). Hinweis: Wurzelursache = Artikel-Ausschluss, ueberschneidet sich mit der Content-/Artikel-Vollstaendigkeits-Dimension.  
- Beleg: ZGB: Heading "Schlusstitel: Anwendungs- und Einfuehrungsbestimmungen" (anchor #disp_u1) + "Erster/Zweiter Abschnitt" fehlen in struktur/bund/ZGB.json (ZGB-Vergleich: 6 von 7 nicht-gematchten Labels liegen alle im disp-Bereich; 1 war false-positive bis-Suffix). Erstes betroffenes Article-Tag im Cache /tmp/zgb.html: <article id="disp_u1/art_1">. OR analog: <article id="disp_u2/art_1"> etc., OR.json hat 0 Schluss/Uebergang-Tokens. Cross-Erlass-Zaehlung ueber /tmp/*.html: 349 solcher disp/.../art_-Artikel in 15 Erlassen.  
- Konfidenz: hoch

**G11 · [darstellung | renderer] Fussnoten-Marker an der Sektionsueberschrift wird nicht an der Ueberschrift angezeigt**  
- Fedlex: Fedlex setzt den Fussnoten-Superscript DIREKT an die Gliederungs-/Sektionsueberschrift, z.B. ZGB <h2>...Zweiter Titel<sup>bis</sup>: ...Die Sammelvermoegen<span class=man-font-weight-normal><sup><a>166</a></sup></span></h2> mit <div class="footnotes section-heading-footnote">166 Eingefuegt durch ... in Kraft seit 1. Jan. 2013</div> — der Leser sieht die Provenienz (eingefuegt/geaendert) am Titel selbst.  
- LexMetrik: Der Fussnotentext wird korrekt erfasst, aber an den ERSTEN Artikel unter der Ueberschrift verlagert (randtitelFnIds -> fussnoten mit absatz=null in struktur-run.ts Z.43-51; z.B. ZGB 89_b traegt Fn 166). Der Renderer (parts.tsx SektionKopf) gibt nur s.label aus, ohne Fussnoten-Marker/Hinweis an der Ueberschrift; die Sektionsueberschrift zeigt keine Provenienz. Info erhalten (Text), aber die Verankerung an der Ueberschrift geht verloren.  
- Umfang: Alle Sektionsueberschriften mit Section-heading-Fussnote (eingefuegte/geaenderte Titel/Abschnitte), erlassuebergreifend; betrifft nur die Darstellung am Ueberschrift-Ort, nicht den Fussnotentext.  
- Beleg: ZGB tit_2_bis: Fedlex-Heading traegt <sup>166</sup>; unser Sektionslabel = "Zweiter Titelbis: Die Sammelvermoegen" ohne Marker, Fn 166 erscheint stattdessen im Fussnotenblock von Art. 89_b (struktur/bund/ZGB.json art 89_b fussnoten nr 166 bestaetigt). SektionKopf (src/pages/gesetz-leser/parts.tsx Z.218/249) rendert {rest||s.label} ohne Fussnoten-Anzeige.  
- Konfidenz: hoch

### Fussnoten-Apparat

**G12 · [info-verlust | beides] Titel-/Praeambel-Fussnoten werden gar nicht extrahiert**  
- Fedlex: Im <div id="preface">/<div id="preamble"> stehen die Erlass-Eingangsfussnoten (Promulgations-/Entstehungsgeschichte): z.B. ZGB fn1 '[BS 1 3]. Dieser Bestimmung entspricht Art. 122 BV ... (SR 101)', fn2 'Fassung gemaess Anhang Ziff. 2 des Gerichtsstandsgesetzes ... (AS 2000 2355; BBl 1999 2829)', fn3 'BBl 1904 IV 1, 1907 VI 367' — jeweils mit klickbaren AS/BBl/SR-Links.  
- LexMetrik: Komplett verloren. scripts/normtext/fussnoten-extrahiere.ts iteriert NUR ueber <article id="art_*"> (Zeile 63), Marker ausserhalb werden nie aufgeloest. Zusaetzlich rendert der Reader Praeambel/Preface gar nicht (bund/ZGB.json hat keine preface/preamble-Eintraege, erstes Eintrag = art_1). Die Eingangsfussnoten erscheinen nirgends.  
- Umfang: ~1-6 Fussnoten je Erlass, praktisch ALLE 218 Bund-Erlasse (jeder Erlass hat Titel-/Praeambelfussnoten mit Quell-/Entstehungsangabe).  
- Beleg: ZGB: dropped fn-nrs {1,2,3}; OR fn1 'BBl 1905 II 1...'; BV fn1 'Angenommen in der Volksabstimmung vom 18.4.1999...'; AHVG fn1-4 (SR 101, Fassung, BBl); ARGV1 fn1-4 (SR 822.11, SR 832.20, Fassung). struktur-Token sind ausschliesslich numerisch (keine preface/preamble-Keys).  
- Konfidenz: hoch

**G13 · [info-verlust | extraktion] Fussnoten-Apparat von Schlusstitel/Uebergangs-/Schlussbestimmungen + Anhaengen faellt weg**  
- Fedlex: Fussnoten in Schluss-/Uebergangsbestimmungen, die NICHT in <article id="art_*"> stehen, sondern an Section-Headings/Tabellen der Schluss-Abschnitte: ZGB 'Schlusstitel: Anwendungs- und Einfuehrungsbestimmungen <a href=#fn-...>726</a>'; OR fn871 'SR 210', fn872 'Die Aenderungen koennen unter AS 27 317 konsultiert werden', fn873 '[BS 1 173; AS 1962 789...]', fn874 'AS 1962 1047; BBl 1960 I 523' (Quelle/Aufhebungshistorie des OR-Schlusstitels).  
- LexMetrik: Verworfen, weil diese Bloecke keine <article>-Container sind und die Section-Heading-Fussnoten-Logik (randtitelFnIds in struktur-extrahiere.ts) sie nur an einen FOLGENDEN Artikel haengt — im Schluss-/Endbereich folgt keiner mehr.  
- Umfang: Grosse Kodifikationen mit Schlusstitel/Uebergangsblock besonders betroffen (ZGB 115, OR 75, AHVG 47); kleinere Verordnungen 5-6. Quer ueber alle 218 Erlasse das End-/Anhang-Drittel des Apparats.  
- Beleg: ZGB: 115 der 840 fn-defs verloren (=14%), Decomposition exakt {3 Praeambel + 0 im Koerper Art.1-720 + 115 im Schlusstitel-Bereich fn726-840}. OR ~75 verloren (fn871+ in 'Uebergangsbestimmungen des BG vom 30. Maerz 1911'). AHVG 47 (u.a. fn474 'AS 1974 1589. Aufgehoben durch...'). BV 5, ARGV1 6.  
- Konfidenz: hoch

**G14 · [darstellung | beides] Fussnoten-Marker stehen am Absatz-/Item-Ende statt am exakten Wort**  
- Fedlex: Fedlex setzt den <sup>-Marker direkt hinter das betroffene Wort/den Term, z.B. ZGB Art.7 'Die allgemeinen Bestimmungen des Obligationenrechtes <sup>6</sup> ueber die Entstehung...' (Marker 6 = 'SR 220', mitten im Satz hinter 'Obligationenrechtes').  
- LexMetrik: Der Renderer kennt nur absatz/item-Granularitaet: ArtikelBody.tsx Z.404 haengt fnProAbsatz-Marker ANS ENDE des <p> (nach gruppiereBetraege(anzeige)), Items am Item-Ende (Z.497). Die Wort-/Zeichenposition wird in der Extraktion nie gespeichert (fussnoten-extrahiere.ts speichert nur absatz-Nr + item-Marke). Mehrere Fussnoten desselben Absatzes kollabieren ununterscheidbar ans Blockende.  
- Umfang: ~1121 Marker allein in ZGB/OR/BV/AHVG/ARGV1; betrifft alle Erlasse, jeden Absatz mit >0 Fussnoten.  
- Beleg: ZGB Art.7 Fedlex: Marker '6' nach 'Obligationenrechtes'; unser Render: '6' am Satzende. Verteilung der Marker-Ebenen ueber 5 Erlasse: artikel=1183, absatz=810, item=311 → 1121 Marker (absatz+item) verlieren die Wortposition; absatz-Ebene ZGB 245 / OR 295 / AHVG 195.  
- Konfidenz: hoch

**G15 · [darstellung | extraktion] Hervorhebungen (fett/kursiv) im Fussnotentext entfernt**  
- Fedlex: Fedlex hebt im Fusstext das AS-Jahr fett und BBl kursiv hervor: 'AS <b>2010</b> 1739; BBl <b>2006</b> 7221', '<i>BBl 1999 2829</i>'.  
- LexMetrik: clean() in fussnoten-extrahiere.ts (Z.21-28) strippt ALLE Tags → 'AS 2010 1739; BBl 2006 7221'. Kein Informationsverlust an Inhalt/Links (eli-URLs korrekt erhalten), aber die typografische Jahr-/BBl-Auszeichnung des amtlichen Apparats geht verloren.  
- Umfang: Alle erfassten Fussnoten mit AS/BBl-Zitat (Mehrheit des Apparats).  
- Beleg: ZGB Art.10-Fussnote STORED text 'AS 2010 1739; BBl 2006 7221' + links eli/oc/2010/262, eli/fga/2006/914 (beide korrekt); Fedlex-Roh: 'AS <b>2010</b> 1739' / 'BBl <b>2006</b> 7221'.  
- Konfidenz: hoch

### Aufgehobene Artikel + Aenderungsstatus

**G16 · [darstellung | renderer] Aufhebungsnotiz voll aufgehobener Artikel im Default unsichtbar (doppelt gated)**  
- Fedlex: Fedlex zeigt beim aufgehobenen Artikel den Fussnotenmarker am Kopf UND die Notiz am Artikelfuss IMMER sichtbar, z.B. ZGB Art. 10: 'Aufgehoben durch Anhang 1 Ziff. II 3 der Zivilprozessordnung vom 19. Dez. 2008, mit Wirkung seit 1. Jan. 2011 (AS 2010 1739; BBl 2006 7221)'.  
- LexMetrik: Wir HABEN die Notiz im Sidecar (struktur/bund/ZGB.json art 10), aber der Leser zeigt sie im Normalfall nicht: voll aufgehobene Artikel rendern eingeklappt (parts.tsx Z.43 artOffen=!ganzAufgehoben) UND der Fussnoten-Block ist hinter dem Toggle fussnotenAuf=false (inhalt.tsx Z.90, parts.tsx Z.170). Der Nutzer sieht nur 'Art. 10 . aufgehoben' (parts.tsx Z.140) - ohne wodurch/seit wann/AS-Stempel.  
- Umfang: 1294 voll aufgehobene Artikel in 153 Bund-Erlassen (Top: OR 72, IVV 48, AHVV 44, STGB 40, KVV 35, AHVG 33, ZGB 31).  
- Beleg: /tmp/zgb.html art_10: '<sup><a href=#fn-...>7</a></sup> ... Aufgehoben durch ... mit Wirkung seit 1. Jan. 2011 (AS 2010 1739; ...)'. Daten vorhanden: struktur/bund/ZGB.json art 10 fussnoten[0].text = exakt diese Notiz. Renderer: src/pages/gesetz-leser/parts.tsx Z.43,68,140,170; inhalt.tsx Z.90.  
- Konfidenz: hoch

**G17 · [darstellung | renderer] Eingefuegt durch / Fassung gemaess / in Kraft seit / AS-Stempel je Bestimmung standardmaessig ausgeblendet**  
- Fedlex: Fedlex zeigt die Provenienz-Fussnoten jeder geaenderten Bestimmung immer am Artikelfuss, z.B. ZGB Art. 1 Abs. 2: 'Fassung gemaess Ziff. I 1 des BG vom 26. Juni 1998, in Kraft seit 1. Jan. 2000 (AS 1999 1118; BBl 1996 I 1)'.  
- LexMetrik: Erfasst im Sidecar (451/1099 ZGB-Artikel, korpusweit 12812/24184 Artikel = 53% mit Aenderungs-/Quellenfussnote), aber der Fussnoten-Block UND die inline-Marker sind hinter dem globalen Schalter fussnotenAuf, der per Default AUS ist (inhalt.tsx Z.90; parts.tsx Z.68,158,170). Im Auslieferungszustand sieht der Nutzer keinen einzigen AS-Stempel / kein 'in Kraft seit'.  
- Umfang: 12812 von 24184 Bund-Artikeln (53%) ueber 218 Erlasse - alle nur auf Klick sichtbar statt wie bei Fedlex by default.  
- Beleg: struktur/bund/ZGB.json art 1 fussnoten enthaelt 'Ausdruck gemaess Ziff. I 1 des BG vom 26. Juni 1998, in Kraft seit 1. Jan. 2000 (AS 1999 1118; ...)'. Toggle-Default: src/pages/gesetz-leser/inhalt.tsx Z.90 useState(false); Gate parts.tsx Z.170 'fussnotenAuf && ...'.  
- Konfidenz: hoch

### Tabellen

**G18 · [info-verlust | extraktion] Alle Tabellen in Anhängen werden komplett gedroppt (Extraktor liest nur <article>)**  
- Fedlex: Anhang-Tarifwerke als <table>, z.B. GEBV_HREG-Anhang: <th>Beschreibung</th><th>Fr.</th> ... <td>Neueintragung</td><td>80.–</td> / <td>Sitzverlegung</td><td>30.–</td> — die eigentliche Gebührenliste der Verordnung. Ebenso ERV-Rückgewinnungssätze, VVV/LRV-Grenzwertmatrizen, VVEA, GSCHV.  
- LexMetrik: GEBV_HREG.json hat nur 11 eintraege (art_1..11), KEINE Anhang-Entries, KEIN mehrspaltig-Block — die komplette Fee-Schedule fehlt. VVV (86 Art.) und LRV (54 Art.) haben 0 von 27 bzw. 0 von 22 Tabellen erfasst (alle im Anhang). alleArtikelTokens() matcht nur id="art_(\d...)", Anhang-Anker (id="annex") werden nie extrahiert.  
- Umfang: 463 Anhang-Tabellen über 68 ausgelieferte Bund-Erlasse; bei VVV/LRV/VVEA/GEBV_HREG/STAATENLOSE u.a. ist KEINE einzige Tabelle erfasst (Tarif komplett fehlend)  
- Beleg: scripts/normtext/extrahiere-fedlex.ts:370 `const re = /id="art_(\d[\w]*)"/g` (nur Artikel). /tmp/gebv_hreg.html erster Anhang-<table>: 'Neueintragung 80.–, Sitzverlegung 30.–'. public/normtext/bund/GEBV_HREG.json: eintraege=11, annexEntry=False. Quervergleich /tmp vs JSON: 463 Anhang-Tabellen vs 0 erfasst.  
- Konfidenz: hoch

**G19 · [info-verlust | extraktion] Mehrzeilige Tabellen-Köpfe: nur die letzte <th>-Zeile überlebt, obere Kopfzeile geht verloren**  
- Fedlex: IVV art_1bis Beitragstabelle mit 2 Kopfzeilen: Zeile1 <th colspan=3>Jährliches Erwerbseinkommen in Franken</th>...<th>Beitragssatz in Prozent des Erwerbseinkommens</th>; Zeile2 <th>von mindestens</th><th>aber weniger als</th><th></th>. Gleiches Muster AHVV art_21/art_52 (art_52: 'Teilrente in Prozenten der Vollrente', 'Nummer der Rentenskala').  
- LexMetrik: IVV.json art_1_bis: kopf=['von mindestens','aber weniger als',''] — die übergeordnete Kopfzeile 'Jährliches Erwerbseinkommen in Franken' und 'Beitragssatz in Prozent des Erwerbseinkommens' ist WEG. Im Reader steht über den Zahlen nur 'von mindestens | aber weniger als', ohne dass erkennbar ist, dass die letzte Spalte ein Prozentsatz ist.  
- Umfang: 10 Artikel-Tabellen mit ≥2 Kopfzeilen in AHVV, BVG, EOV, IVV (sozialversicherungsrechtliche Beitrags-/Rententabellen — gerade dort ist die Spaltenbedeutung entscheidend)  
- Beleg: extrahiere-fedlex.ts:335-337 parseFedlexTabelle: `if (ths.length > 0) { if (ths.some(...)) kopf = ths; continue; }` — jede weitere <th>-Zeile ÜBERSCHREIBT kopf statt anzuhängen. JSON IVV 1_bis kopf=['von mindestens','aber weniger als','']; Fedlex-Top-Kopf 'Jährliches Erwerbseinkommen in Franken'/'Beitragssatz in Prozent' fehlt.  
- Konfidenz: hoch

**G20 · [darstellung | extraktion] Kopfzeilen via <td class=man-template-tab-kpf> (statt <th>) werden als Datenzeile geführt**  
- Fedlex: AHVV art_11 Kost-Tabelle: erste Zeile <td><p class='man-template-tab-kpf'></p></td><td><p class='man-template-tab-kpf'>Franken</p></td> — 'kpf' = Kopf-Template, aber als <td> ausgezeichnet.  
- LexMetrik: AHVV.json art_11: kopf=None, Zeile ['','Franken'] steht als normale (rechtsbündige) Datenzeile. Renderer setzt keine Kopf-Hervorhebung/role=columnheader für 'Franken'.  
- Umfang: Tabellen mit td-basierten Kost-/Naturalrechnungs-Köpfen (AHVV art_11 u.ä. kleine Verordnungstabellen)  
- Beleg: parseFedlexTabelle prüft nur `<th>`; man-template-tab-kpf-Klasse in <td> wird nicht als Kopf erkannt. JSON AHVV art_11 kopf=None, zeilen[0]=['','Franken'].  
- Konfidenz: hoch

### Spezialinhalt: Formeln / Bilder / man-template-Spezialbloecke + SR-interne Querverweis-Links im Artikeltext

**G21 · [info-verlust | beides] Alle Bilder/Pictogramme werden weggeschnitten (Extraktion + Renderer ohne Bild-Support)**  
- Fedlex: Inline-Bilder in <p class="absatz"> sowie eigenstaendige <p class="bild"><img src="image/imageN.png"></p>. Bsp SSV Art. 65: «Die dem Signal «Fussweg» (2.61) beigefuegte Zusatztafel «<img ... src="image/...">» ...» — das Pictogramm ist Teil der Rechtsnorm. 360 bild-Paragraphen + 300 img in SSV, 46/45 in VTS, 22 VVV, 22 AKKBV, 16 ChemV.  
- LexMetrik: Kein einziges Bund-JSON enthaelt eine Bildreferenz (grep auf image/png/svg/img ueber alle 218 JSON: nur Wort-Fragmente wie «Keimgut»). entferneTags() ersetzt <img> durch Leerzeichen; <p class="bild"> matcht keinen Extraktor-Zweig und wird gedroppt. Block-Typ (typen.ts) hat nur text/items/tabelle/mehrspaltig — kein Bild-Feld; ArtikelBody.tsx kann nichts rendern.  
- Umfang: ~21 Erlasse mit JSON enthalten <img>/class=bild (SSV/VTS/VVV/AKKBV/ChemV/LSV/LRV/FZV/ERV/UVV/AVO/DBG/KKG/MEPV/GSchV/FAV/CHEMRRV/BETMKV ...). Bei reinen Pictogramm-Verordnungen (SSV/VTS) ist der Bildinhalt der eigentliche Normgegenstand.  
- Beleg: scripts/normtext/extrahiere-fedlex.ts:353 entferneTags = s.replace(/<[^>]+>/g,' '); Regex (Zeile 92-96) matcht absatz|<sup>N|<table>, NICHT <p class="bild">. /tmp/ssv.html: «Zusatztafel «<img data-scaled-width=3 ... src="image/...">»» — in SSV.json bleibt nur «Zusatztafel «»». typen.ts:29-37 Block ohne Bild-Feld.  
- Konfidenz: hoch

**G22 · [info-verlust | beides] Mathematische Formeln (von Fedlex als Bild geliefert) gehen restlos verloren**  
- Fedlex: Fedlex rendert Formeln NICHT als MathML sondern als <img>. KKG Anhang 1: <h2>Formel zur Berechnung des effektiven Jahreszinses</h2> ... <p><img src="image/image1.png"></p> (gesamte Zinsformel ist ein Bild). DBG Art. 22 (Leibrenten-Ertragsanteil): «... berechnet sich der Ertragsanteil ... wie folgt:</dd></dl><p class="bild"><img ...>» — die Rechenformel folgt als Bild.  
- LexMetrik: Mit den Bildern (gleiche Strip-Logik) entfaellt der komplette Formel-Inhalt. DBG.json Art. 22 zeigt Abs. 1-4 als Text, aber die nach Abs. 3 stehende Ertragsanteil-Formel fehlt vollstaendig. Der Leser sieht «... wie folgt:» ohne das «folgt». Kein MathML im Korpus, also ist Bild die einzige Quelle der Formel.  
- Umfang: Teilmenge der Bild-Erlasse mit substanziellem Rechen-Inhalt: KKG (Zinsformel), DBG Art. 22, AVO (versicherungsmathematische Tabellen/Formeln), KKV, BVV 2, LRV. Materiell schwerwiegend, da Berechnungsnorm fehlt.  
- Beleg: /tmp/kkg.html: '<a href="#annex_1/lvl_u1">Formel zur Berechnung des effektiven Jahreszinses</a>...<p><img src="image/image1.png"></p>'. /tmp/dbg.html art_22: '<p class="bild"><img data-scaled-width=58 ... src="image/...">'. DBG.json eintraege art 22 hat keinen Block mit der Formel. grep '<math|<mfrac' ueber nicht-probe-Files: 0 Treffer.  
- Konfidenz: hoch

**G23 · [info-verlust | extraktion] Standalone man-template-Paragraphen (Delegations-Referenz, Untertitel) werden gedroppt**  
- Fedlex: Unter vielen Verordnungs-Artikeln steht eine man-template-referenz mit der Delegationsnorm, z.B. AVO: <h6>...</h6><div class="collapseable"><p class="man-template-referenz"> (Art. 2a Abs. 2 VAG)</p><p class="absatz">Die Funktionen ...». Ebenso man-template-tab-untertit (Agrar: «Schwellenpreise je Produktegruppe» als Zwischentitel) ausserhalb von <table>.  
- LexMetrik: AVO.json: 0 Bloecke beginnen mit «(Art. ...VAG)» (Python-Scan), HTML hat 157 man-template-referenz. Der Extraktor-Regex trifft nur absatz/<sup>N/<dl>/<table> — diese <p class="man-template-referenz"> und <p class="man-template-tab-untertit"> matchen keinen Zweig und werden ueberlesen. Damit fehlt die Angabe, auf welcher Delegationsnorm der Artikel beruht (von Fedlex prominent angezeigt).  
- Umfang: ~23 Erlasse mit JSON enthalten man-template-referenz; HTML-Treffer: AVIV 178, MWSTV 170, AVO 157, KKV 154, BPV 151, BVV_2 113, VZAE 85, BBV 79, ARGV1 77, EOV 67 — mehrere Tausend Annotationen insgesamt. Plus man-template-tab-untertit (Agrar u.a.).  
- Beleg: /tmp/avo.html: '</h6><div class="collapseable"><p class="man-template-referenz"> (Art.&nbsp;2<i>a</i> Abs.&nbsp;2 VAG)</p>'. Python-Scan AVO.json: Bloecke startend mit '(Art...VAG' = 0. extrahiere-fedlex.ts:92-96 Regex ohne man-template-referenz-Zweig.  
- Konfidenz: hoch

### Anhaenge + Schluss-/Uebergangsbestimmungen

**G24 · [info-verlust | extraktion] Schluss- und Uebergangsbestimmungen (datierte UeB-Bloecke) werden komplett nicht extrahiert**  
- Fedlex: Am Ende jedes Erlasses ein <div id="dispositions"> mit <section id="disp_uN"> Bloecken, jeweils <h1>-Titel wie «Uebergangsbestimmungen der Aenderung vom 23. Dezember 2011» bzw. «Schluss- und Uebergangsbestimmungen zum X. Titel» plus Fussnote (AS-Zitat) und Artikeln mit id="disp_uN/art_M".  
- LexMetrik: Diese Bloecke fehlen vollstaendig in der JSON. OR.json endet bei art_1186, AHVV.json bei art_226 — kein einziger disposition-/Schluss-/UeB-Eintrag; grep nach «Schlussbestimmungen der Aenderung»/«Uebergangsbestimmung» = 0 Treffer in ZGB/AHVV/ARGV1; kein eintrag.id enthaelt «disp» oder «schluss».  
- Umfang: 62 von 203 gematchten Bund-Erlassen haben ein dispositions-Div; insgesamt 277 disposition-Artikel gehen verloren (u.a. OR 83, ZGB 178, PatG 9, SchKG 4, VZG 2, SVG 1).  
- Beleg: Ursache: scripts/normtext/extrahiere-fedlex.ts alleArtikelTokens() = /id="art_(\d[\w]*)"/ matcht nur ids die mit `art_` beginnen; dispositions-Artikel haben id="disp_u1/art_1" (beginnt mit `disp`) -> ausgeschlossen. OR-Fedlex hat 18 disp_uN-Bloecke / 83 disposition-Artikel inkl. «disp_u13 Schluss- und Uebergangsbestimmungen zum X. Titel» (Aktienrecht-UeB) und «disp_u12 zum VIII. Titel» (Mietrecht) — keiner in OR.json. AHVV-Fedlex: disp_u1..disp_u12 (Schlussbestimmungen der Aenderung …) — alle weg.  
- Konfidenz: hoch

**G25 · [info-verlust | extraktion] Anhaenge (Anhang 1, 2 … mit Tabellen/Verzeichnissen/Formularen) werden komplett nicht extrahiert**  
- Fedlex: <div id="annex"> mit <section id="annex_uN">, <h1>«Anhang» + Fussnote, <p class="titelanhtext">(Art. 28 Abs. 4), darunter Unter-Ueberschriften (annex_u1/lvl_u1) und der eigentliche Anhang-Inhalt (Listen/Tabellen).  
- LexMetrik: Kein Anhang-Eintrag in der JSON. ARGV1.json endet bei art_94; der Anhang «Nachweis der technischen oder wirtschaftlichen Unentbehrlichkeit von Nacht- oder Sonntagsarbeit …» fehlt voellig — die 16 «Unentbehrlichkeit»-Treffer liegen nur in art_28/30/41 (Querverweise), nicht im Anhang. Kein eintrag.id enthaelt «annex».  
- Umfang: 121 von 203 gematchten Bund-Erlassen haben ein annex-Div (150 Anhang-Sektionen); z.B. GBV, HRegV, FusG, IPRG, ZStV, DSG, ZPO, StPO, BetmKV, ARGV1 — alle ohne extrahierten Anhang.  
- Beleg: ARGV1-Fedlex /tmp/argv1.html: nach </main> folgt <div id="annex"><section id="annex_u1"> … «Nachweis der technischen oder wirtschaftlichen Unentbehrlichkeit …». annex-Sektionen tragen ids wie annex_u1/lvl_u1 (kein `art_`-Praefix) -> von alleArtikelTokens nicht erfasst. Anhang-Inhalt (Branchen-/Arbeitsverfahren-Verzeichnis) komplett absent in ARGV1.json.  
- Konfidenz: hoch

**G26 · [info-verlust | extraktion] ZGB-Schlusstitel «Anwendungs- und Einfuehrungsbestimmungen» (178 Artikel) fehlt vollstaendig**  
- Fedlex: /tmp/zgb.html: <div id="dispositions"><section id="disp_u1"><h1>«Schlusstitel: Anwendungs- und Einfuehrungsbestimmungen» (Fassung 26. Juni 1998), Untergliederung disp_u1/chap_1 «Erster Abschnitt: Die Anwendung bisherigen und neuen Rechts», Artikel disp_u1/art_1 … art_61 (intertemporales Privatrecht) sowie disp_u2 «Wortlaut der frueheren Bestimmungen».  
- LexMetrik: ZGB.json endet bei art_977 (letzter Haupttitel-Artikel); der komplette Schlusstitel mit eigener Zaehlung Art. 1–61 SchlT plus «Wortlaut der frueheren Bestimmungen» fehlt. grep «Schlusstitel»/«Anwendung bisherigen» = 0 in ZGB.json.  
- Umfang: 1 Erlass (ZGB), aber 178 Artikel — der schwerste Einzelfall der dispositions-Luecke; analog OR (83), nur dort thematisch verteilt.  
- Beleg: 178 <article id="disp_u1/art_…"> bzw. disp_u2/art_… in ZGB-Fedlex (disp_u1/art_1 … disp_u2/art_251); keiner matcht /id="art_\d/. Schlusstitel ist materielles intertemporales Recht (Anwendung bisherigen/neuen Rechts) eines Flaggschiff-Erlasses — fuer Praxis zentral, fuer Nutzer unsichtbar.  
- Konfidenz: hoch

**G27 · [info-verlust | beides] Selbst wenn extrahiert: kein Render-Slot fuer Schluss-/Anhang-Ueberschriften und deren Fussnoten/AS-Zitate**  
- Fedlex: disp_uN/annex_uN tragen eigene <h1>-Ueberschriften («Schlussbestimmungen der Aenderung vom 23. Maerz 1962») mit zugehoeriger Fussnote (AS-Belegstelle), die den Block datieren/zuordnen.  
- LexMetrik: Das eintrag-Schema (id/artikel/artikelLabel/bloecke/fussnoten) kennt keinen Block-Typ «schlussbestimmung»/«anhang»/«schlusstitel»; der Renderer (src/pages/gesetz-leser/*, src/lib/normtext/darstellung.ts, src/components/normtext/*) hat keine Komponente dafuer. Einzige Anhang-Erwaehnung ist eine Querverweis-Heuristik (passus.ts ANHANG_ZIFFER, ArtikelBody.tsx «Tarif-/Anhang-Kontext») — kein echtes Rendern von Anhang-/Schlussbloecken.  
- Umfang: Alle 62 dispositions- + 121 annex-Erlasse — auch nach einem Extraktions-Fix fehlt der Anzeige-Pfad.  
- Beleg: grep ueber src/pages/gesetz-leser, src/lib/normtext, src/components/normtext: keine Treffer fuer «dispositions»/«schlusstitel»/«schlussbestimmung»/«annex»-Rendering ausser passus.ts:24 (Zitat-Linking) und ArtikelBody.tsx:365 (Tarif-Kontext-Label). Die Block-Titel + AS-Fussnoten (z.B. AHVV disp_u1 Fussnote «AS 1985 913. Aufgehoben durch …») haetten keinen Anzeigeort.  
- Konfidenz: hoch

### Metadaten + Anker/Links

**G28 · [darstellung | beides] Keine ELI-Point-in-Time-Pinnung auf die angezeigte Konsolidierung**  
- Fedlex: Fedlex bietet datierte Point-in-Time-ELI, z.B. /eli/cc/24/233_245_233/20260101/de, die genau die angezeigte Konsolidierung adressiert.  
- LexMetrik: Alle quelleUrl nutzen die Basis-ELI ohne Datumssegment (0/1460 datiert). Sie loest auf die LIVE-geltende Fassung auf — fuer den Label 'geltende Fassung' korrekt (§7c), aber es gibt keinen Link auf die exakt von uns gespeicherte Fassung (stand z.B. 2026-01-01). Driftet Fedlex, zeigt der Link eine andere Fassung als unser Snapshot.  
- Umfang: alle 1460 Register-Eintraege  
- Beleg: register.json: 0/1460 quelleUrl mit /\d{8}/-Segment; ZGB quelleUrl=https://www.fedlex.admin.ch/eli/cc/24/233_245_233/de bei stand 2026-01-01.  
- Konfidenz: hoch

**G29 · [klein | beides] Sprachverfuegbarkeit (DE/FR/IT) weder erfasst noch verlinkt**  
- Fedlex: Fedlex bietet jeden Erlass in DE/FR/IT (teils RM/EN) mit Sprachumschalter; die Anker (art_N) sind sprachunabhaengig identisch.  
- LexMetrik: register speichert sprache (1458 de, 2 fr) und quelleUrl endet stets auf /de. Weder die Verfuegbarkeit anderer Sprachfassungen noch Links dorthin werden angeboten; ErlassKarte zeigt nur ein Sprach-Badge bei sprache!=='de'.  
- Umfang: alle ~228 Bund-Erlasse (Fedlex hat je 3+ Sprachfassungen)  
- Beleg: register.json sprache-Zaehlung: 1458 de / 2 fr; quelleUrl durchgaengig '.../de'; src/components/normtext/ErlassKarte.tsx:47-48 nur Badge, kein FR/IT-Link. (Hinweis: fuer ein DE-Produkt teils bewusster Scope.)  
- Konfidenz: hoch

### Geltungsstand / Versionierung

**G30 · [klein | beides] Nur EIN Geltungsstand pro Erlass — keine historischen Fassungen**  
- Fedlex: Fedlex fuehrt zu jeder SR-Nummer die vollstaendige Reihe konsolidierter Geltungsstaende ueber die Zeit (Versions-Panel / datierte ELIs). Der HTML-Header benennt den jeweils gewaehlten Stand, z.B. ZGB 'vom 10. Dezember 1907 (Stand am 1. Januar 2026)', OR 'vom 30. Maerz 1911 (Stand am 1. Januar 2026)'. Ein Nutzer kann die Fassung 'wie sie am 1.1.2020 galt' abrufen.  
- LexMetrik: Pro Erlass genau ein skalarer Stand. register.json ZGB stand='2026-01-01', JSON-eintrag-keys nur stand/fassungsToken — kein Versions-Array irgendwo (python-Sonde ueber register: 'any key holding a list of versions? -> leere Menge'). Renderer src/pages/gesetz-leser/inhalt.tsx:464 zeigt nur '<span>Stand {formatiereDatum(erlass.stand)}</span>', kein Umschalter. Eine aeltere Fassung ist weder gespeichert noch aufrufbar.  
- Umfang: alle 229 Bund-Erlasse (register: 229 ebene=bund, 0 mit Versions-Liste); Fedlex haelt fuer jeden davon mehrere Geltungsstaende vor  
- Beleg: Fedlex /tmp/zgb.html Header: 'vom 10. Dezember 1907 (Stand am 1. Januar 2026)'. Unsere public/normtext/bund/ZGB.json eintrag-keys: ['id','ebene','quelle','erlass','artikel','artikelLabel','bloecke','stand','quelleUrl','abgerufen','fassungsToken','sha'] — kein version/fassungen-Feld. register.json ZGB stand='2026-01-01' (skalar). Renderer inhalt.tsx:464-465 ein einziges Stand-Label + ein Link, kein Selektor.  
- Konfidenz: hoch

**G31 · [klein | extraktion] quelleUrl ist generische ELI (immer aktuell) — kein Deep-Link auf historischen Stand**  
- Fedlex: Fedlex adressiert jeden Geltungsstand ueber eine DATIERTE ELI, z.B. .../eli/cc/24/233_245_233/20200101/de fuer den Stand 1.1.2020. Damit ist jede historische Fassung direkt verlinkbar.  
- LexMetrik: Wir speichern fuer alle Erlasse nur die generische ELI ohne Datums-Segment, die stets auf die aktuell in Kraft stehende Fassung aufloest (ZGB quelleUrl='https://www.fedlex.admin.ch/eli/cc/24/233_245_233/de'). Selbst der 'geltende Fassung'-Link kann also keinen frueheren Geltungsstand erreichen — ein Nutzer, der die Fassung eines vergangenen Datums braucht, hat aus unserer UI keinen Pfad dorthin.  
- Umfang: alle 229 Bund-Erlasse (0/229 mit datierter ELI)  
- Beleg: python-Sonde ueber register.json: 'erlasse with DATED quelleUrl (specific Geltungsstand): 0' von 229. Beispiel ZGB quelleUrl endet auf '/de' ohne YYYYMMDD-Segment. Fedlex-Aequivalent waere '/20200101/de'.  
- Konfidenz: hoch

**G32 · [klein | beides] Keine kuenftigen / noch nicht in Kraft stehenden Fassungen (Kuenftige Fassung)**  
- Fedlex: Fedlex publiziert bereits beschlossene, aber noch nicht in Kraft getretene Aenderungen als eigene KUENFTIGE Geltungsstaende ('Kuenftige Fassung'), sodass die kommende Rechtslage vorab einsehbar ist.  
- LexMetrik: Wir holen und zeigen ausschliesslich die aktuell geltende Konsolidierung. Kuenftige Fassungen werden weder extrahiert noch gerendert; per CLAUDE.md §7 d ist das eine bewusste Design-Entscheidung ('Kuenftige, noch nicht in Kraft stehende Fassungen werden NICHT verlinkt'). Gegenueber dem Fedlex-Angebot bleibt es dennoch eine Funktionsluecke: Nutzer koennen die kommende Gesetzesfassung bei uns nicht vorab lesen.  
- Umfang: alle Bund-Erlasse mit anhaengigen, noch nicht in Kraft stehenden Aenderungen (Fedlex-weit verfuegbar; bei uns 0 abgebildet)  
- Beleg: CLAUDE.md §7 Build-Regel Pkt.3: 'Kuenftige, noch nicht in Kraft stehende Fassungen werden NICHT verlinkt.' Kein Renderer-Pfad fuer Zukunftsstand (grep version/kuenftig in src/pages/gesetz-leser + src/lib/normtext: nur 'aufgehoben'/'Aenderungshistorie', kein Zukunfts-Fassungs-Feature).  
- Konfidenz: hoch

**G33 · [darstellung | renderer] Renderer signalisiert nicht, dass weitere Fassungen existieren**  
- Fedlex: Fedlex zeigt prominent einen Fassungs-/Versionswaehler (Liste aller Geltungsstaende) neben dem Erlass.  
- LexMetrik: Unsere Leser-UI bietet keinen Versions-Selektor und keinen Hinweis darauf, dass auf Fedlex aeltere/kuenftige Fassungen existieren. Der einzige Hinweis ist das statische 'Stand'-Datum; der Nutzer erfaehrt nicht, dass er bei Fedlex zwischen Geltungsstaenden waehlen koennte. Reine Darstellungsluecke (wir haben ohnehin nur eine Fassung), aber sie verschleiert die Existenz weiterer Fassungen.  
- Umfang: alle Erlasse im Gesetz-Leser (UI-weit, 1 Renderer-Pfad)  
- Beleg: src/pages/gesetz-leser/inhalt.tsx:464-467 rendert nur Stand-Label + 'geltende Fassung'-Link + PDF-Hinweis; kein Dropdown/Hinweis 'weitere Fassungen auf Fedlex'. Keine Komponente in src/components/normtext/* mit Versions-Auswahl.  
- Konfidenz: hoch

## Widerlegt (false positives — NICHT bauen)

- **Amtliche Titel-Zeilenumbrueche (br) werden geplattet** — Die behauptete Luecke betrifft keine Information, sondern reine Typografie, und der eigentliche Informationsgehalt (der vollstaendige amtliche Titel) wird von uns vollstaendig abgebildet.

BELEG DATEN: register.json BV-Titel = "Bundesverfassung der Schweizerischen Eidgenossenschaft" (ein String, <br> zu Leerzeichen kollabiert). Scan ueber alle 1460 Erlasse: 0 Titel mit <br>- oder Doppelleerzeichen-Resten -> der Extraktor ersetzt <br> sauber durch ein einzelnes Leerzeichen. Es gehen KEINE Worte verloren; aus "Bundesverfassung<br>der Schweizerischen Eidgenossenschaft" wird wortidentisch "Bundesverfassung der Schweizerischen Eidgenossenschaft". Das ist exakt der amtliche Titel laut SR.

BELEG RENDERER: inhalt.tsx Z.667-668 rendert bewusst "BV — Bundesverfassung der Schweizerischen Eidgenossenschaft" als ein eigenes Inline-h1 (Kuerzel + em-dash + Titel). Das ist ein voellig anderes, eigenes Header-Layout als Fedlex (zentrierte, mehrzeilige erlasstitel-Ueberschrift). Fedlex' <br> ist kein amtlicher Bestandteil des Titels, sondern ein typografischer Zeilenumbruch fuer den Satzspiegel der Fedlex-Seite. In unserem Layout (Kuerzel vorangestellt) waere ein Umbruch an Fedlex' Stelle sogar falsch/sinnlos.

ABGRENZUNG zur Kalibrierungs-Luecke (aufgehobene Artikel): Dort geht TEXT/Information verloren (die ganze Aufhebungs-Referenz wird auf "..." reduziert). Hier geht NULL Information verloren — nur eine nicht-semantische Umbruchposition wird zu einem Leerzeichen, was die Standard- und korrekte Art ist, einen Titel als Fliesstext wiederzugeben.

Fazit: Wir bilden die Information (den amtlichen Titel) vollstaendig ab. Der <br> ist keine Information, sein Wegfall ist verlustfrei. Kein Informationsverlust, keine relevante Darstellungsluecke.
- **Absatz-<p> innerhalb eines <table> wird beim Tabellen-Parsing verschluckt (Absatznummer + Wortlaut verloren)** — Widerlegt. Die behauptete Luecke ("Abs. 3 Nummer UND Text fehlt komplett, art_94 bricht nach Abs. 2 ab") ist faktisch falsch. In public/normtext/bund/VTS.json art_94 enthaelt der zweite mehrspaltig-Block als letzte Zeile genau ["3 Die Höhe der Motorwagen darf höchstens betragen:", "4,00"] — also Absatznummer (3), vollstaendiger Wortlaut UND der Wert (4,00). Das spiegelt exakt das Fedlex-HTML, wo Abs. 3 als <tr> mit <td><p class="absatz"><sup>3</sup>...</p></td> und <td colspan="2">4,00</td> in der Breiten-/Hoehen-Tabelle eingebettet ist. Der Extraktor verschluckt den Zellentext also NICHT; er zieht den eingebetteten Absatztext samt sup-Nummer als Zeilentext mit. Renderer-seitig wird der Block angezeigt: ArtikelBody.tsx Zeile 372-373 macht fuer jeden Block mit mehrspaltig.zeilen.length > 0 einen Early-Return auf <MehrspaltigeTabelle>, d.h. die Abs.-3-Zeile inkl. Text und Wert ist fuer den Nutzer sichtbar. KEIN Informationsverlust. Verbleibt nur eine Darstellungs-Unschoenheit: Abs. 3 erscheint als Tabellenzeile (Nummer als "3 " Praefix im Zellentext) statt als eigenstaendiger nummerierter Absatz — genau wie Fedlex es visuell auch in die Tabelle setzt. Damit isReal=false; Schweregrad hoechstens darstellung.
- **Gesamter Fussnoten-Apparat per Default ausgeblendet** — Die Information wird voll abgebildet — kein Info-Verlust und kein Render-Defekt. Der Fussnoten-Apparat ist vollstaendig extrahiert und gespeichert, nur NICHT in public/normtext/bund/<KUERZEL>.json (dort 0 Treffer ueber 24'184 Artikel), sondern im Sidecar public/normtext/struktur/bund/<KUERZEL>.json unter artikel/<token>/fussnoten. Jeder Eintrag traegt nr (Marker-Nummer), text (voller amtlicher Text inkl. «Aufgehoben durch…», «Fassung gemaess…», AS/BBl), links (AS/BBl/SR mit aufgeloesten fedlex-URLs) sowie absatz/item (Platzierung). Beleg ZGB Art. 10 nr 7: «Aufgehoben durch Anhang 1 Ziff. II 3 der Zivilprozessordnung … (AS 2010 1739; BBl 2006 7221)» mit klickbarem AS-2010-1739-Link. Der Renderer bildet das vollstaendig ab: inhalt.tsx:498 fn=struktur?.[tok]?.fussnoten, geladen via ladeStruktur (inhalt.tsx:109), an ArtikelLeser durchgereicht, dort Marker (FnRef), fnProAbsatz/fnProItem und die Fussnotenliste mit klickbaren AS/BBl-Links (fnTextMitLinks, parts.tsx:170-178). Die Faktenbasis des Finders (inhalt.tsx:90 useState(false); fussnotenAuf gated fnMarker parts.tsx:68, Liste Z.170, fnProAbsatz/Item Z.158) stimmt als Code-Beschreibung. ABER die Einordnung als Inhalts-Luecke («Fedlex hat es, wir NICHT») ist falsch: wir HABEN es, ein Klick auf den «Fussnoten»-Schalter (inhalt.tsx:617) entfernt. Das ist eine bewusste Default-Darstellungsentscheidung (Kommentar Z.90 «Fussnoten nur auf Wunsch»), kein Extraktions-/Render-Verlust. Verbleibender wahrer Kern: rein als Darstellungs-Differenz zeigt Fedlex Marker/Block immer, wir per Default ausgeblendet — daher correctedSeverity=darstellung, nicht info-verlust.
- **Aenderungs-/Aufhebungsnotizen auf Titel-/Abschnitts-Ueberschriften gehen verloren** — Widerlegt. Die Aenderungs-/Aufhebungsnotizen auf Gliederungsueberschriften werden DOCH erfasst und angezeigt. (1) ERFASSUNG: Ein eigener Extraktor scripts/normtext/struktur-extrahiere.ts (Z.25, 99-105) behandelt `section-heading-footnote` explizit und haengt sie «am ERSTEN Artikel unter der Ueberschrift» an; struktur-run.ts Z.45 loest sie auf. Beleg: ZGB Fuenfter Titel-Notiz (fn-d1706615e9043, «Fassung des fuenften Titels gemaess Ziff. I 1 des BG vom 5. Okt. 1984, in Kraft seit 1. Jan. 1988 (AS 1986 122 ...)») steht in public/normtext/struktur/bund/ZGB.json unter Artikel 159, fussnoten nr 231, absatz=null, inkl. links. Korpusmessung ZGB: 87/91 section-heading-footnotes erfasst (~96%). (2) RENDERING: inhalt.tsx:498 zieht struktur-fussnoten in ArtikelLeser; parts.tsx:68 legt absatz=null-Fussnoten in fnArtikelEbene (Marker an der Artikelnummer), parts.tsx:170-178 rendert den Volltext mit klickbaren AS/BBl-Links, sobald der Fussnoten-Toggle an ist. Damit ist die Notiz sichtbar UND abrufbar — die Kernbehauptung des Finders «nirgends sicht- oder abrufbar – nicht einmal ueber den Toggle» ist falsch. Der Finder zitierte fussnoten-extrahiere.ts Z.63 (Artikel-Body-Extraktor) und uebersah das separate struktur-extrahiere.ts. RESIDUUM (nur Darstellung, kein Info-Verlust): Die Notiz haengt am ersten Artikel statt visuell an der Ueberschrift; SektionKopf (parts.tsx:189) zeigt keinen eigenen Marker. Der Fussnotentext ist aber selbsterklaerend («Fassung des fuenften Titels...») und vollstaendig mit Links vorhanden — nur der Verankerungspunkt weicht von Fedlex ab. Zusaetzlich ~4% Randfaelle (vermutlich Schlusstitel-Ueberschriften ohne Folge-Artikel) evtl. nicht angehaengt. Verdikt: keine echte Luecke wie behauptet; hoechstens eine Darstellungs-Nuance.
- **Kein maschinenlesbares aufgehoben-Flag / Aenderungsdatum; Haupt-Snapshot ohne Fussnoten** — WIDERLEGT (Information wird abgebildet — Finder hat Sidecar + Renderer uebersehen).

Was stimmt an der Behauptung (Teilfakten):
- Haupt-Snapshot public/normtext/bund/*.json hat tatsaechlich 0 Fussnoten (verifiziert: 0/24184 Eintraege, ZGB 0/1099). Block-Keys nur absatz/text/items, Eintrag-Keys ohne Status/Datum.
- Es gibt KEIN boolesches aufgehoben-Feld und KEIN geparstes inKraftSeit-Datumsfeld; istAufgehoben/artikelGanzAufgehoben in darstellung.ts (Z.228/239) leiten den Status heuristisch ab. Kein Badge/Filter/Sortierung nach Aenderungsstand.

Warum es trotzdem KEINE Informationsluecke ist (Kernbefund):
1. Die komplette Aenderungshistorie IST erfasst — im Struktur-Sidecar public/normtext/struktur/bund/<K>.json. Genau das Kalibrierungs-Beispiel: ZGB Art. 10 traegt dort fussnoten[{nr:'7', text:'Aufgehoben durch Anhang 1 Ziff. II 3 der Zivilprozessordnung vom 19. Dez. 2008, mit Wirkung seit 1. Jan. 2011 (AS 2010 1739; BBl 2006 7221).', links:[{label:'AS 2010 1739',url:'.../eli/oc/2010/262'},{label:'BBl 2006 7221',url:...}]}]. Ebenso Art. 15/110/113 und 'Eingefuegt durch ... Aufgehoben durch ...' bei Art. 28d-28f. AS/BBl sind also NICHT bloss Freitext, sondern strukturierte links[] (label+url); nur das In-Kraft-Datum steht als Freitext im text — was Fedlex selbst genauso macht.
2. Der Renderer LIEST das Sidecar und ZEIGT es an: browse.ts laedt /normtext/struktur/<ebene>/<key>.json (Z.149) inkl. fussnoten (Z.141); inhalt.tsx fn=struktur?.[tok]?.fussnoten (Z.498); parts.tsx rendert fussAnzeige mit fnTextMitLinks (klickbare AS/BBl) (Z.170-176). Der eigentliche Konsument verliert also nichts.

Die Praemisse 'Fedlex traegt den Status maschinenlesbar/explizit' ueberzeichnet die Ground Truth: im konsolidierten Fedlex-HTML steht der Status ebenfalls NUR als Fussnoten-Text (<sup>-Marker + footnotes-div) mit AS/BBl-Links — exakt das, was wir speichern und rendern. Fedlex-HTML bietet kein boolesches Flag, keinen 'in Kraft seit'-Badge und keinen Aenderungs-Filter; das sind Feature-/Datenmodell-Wuensche, KEINE von Fedlex angebotene und uns fehlende Information.

Einzige reale Residuen (klein, nicht info-verlust): Fussnoten sind per Default ausgeblendet (Schalter fussnotenAuf, inhalt.tsx Z.90 default false) — aber jederzeit einblendbar; und vereinzelt fehlt eine Sidecar-Fussnote (z.B. ZGB Art. 50_51 'Aufgehoben', fussnoten=None) — das faellt aber in die separat bestaetigte Aufhebungstext-Luecke, nicht in diese. Fazit: Die behauptete Information (Aufgehoben/Eingefuegt durch, in Kraft seit, AS/BBl) wird erfasst UND angezeigt; die 'Luecke' reduziert sich auf eine nicht-normalisierte Schema-/Badge-/Filter-Frage, die keine Fedlex-Information verliert.
- **colspan/rowspan werden ignoriert — Zellen rein sequenziell gelesen** — Die behauptete Luecke (colspan/rowspan ignoriert -> Spalten-Semantik nicht abgesichert, Versatz droht) bildet KEINEN Informationsverlust ab. Belege:

(1) Werte + Spaltenzuordnung sind korrekt erhalten. AHVV art_52 JSON: kopf ["von mindestens","aber weniger als","",""], Zeilen ["","2,28","2,27","1"] etc. -> Sp1=Untergrenze, Sp2=Obergrenze, Sp3=Teilrente, Sp4=Rentenskala. Korrekt ausgerichtet. Der Finder gibt das selbst zu ("Werte erhalten").

(2) Das eigene Versatz-Beispiel widerlegt die Risiko-These. IVV art_1bis hat UNTERSCHIEDLICHE Spannen zwischen Kopfzeile-2 (colspan 2/2/1) und Datenzeilen (colspan 1/3/1) - genau der vom Finder behauptete Versatz-Ausloeser. Trotzdem richtet unser JSON perfekt aus: ["von mindestens","aber weniger als",""] ueber ["10 100","17 600","0,752"]. Kein Versatz, weil Fedlex-man-template-Zeilen stets dieselbe Anzahl LOGISCHER Zellen in derselben semantischen Reihenfolge tragen; sequentielles Lesen bewahrt diese Reihenfolge. Die colspan-Integer sind reine Raster-Geometrie ohne eigene Information.

(3) Der rowspan-Teil ist im Korpus inexistent. Grep ueber alle ~228 gecachten Fedlex-Bund-HTML nach rowspan>=2 innerhalb <table>: NULL Treffer. Kein Bund-Erlass nutzt Daten-Zell-rowspan, also kann der "rowspan ignoriert -> Zellen fallen weg"-Effekt gar nicht eintreten. Der UMFANG-Eintrag "rowspan in ... VTS" ist falsch.

(4) Renderer (MehrspaltigeTabelle, ArtikelBody.tsx:219ff, padZeile + Math.max-Spalten) zeigt alle Werte in den richtigen Spalten an.

Was tatsaechlich nicht gespeichert wird, ist nur (a) die colspan-Ganzzahl selbst (visuelle Geometrie, keine Rechtsinformation) und (b) gemergte Ober-Kopfzeilen (z.B. "Teilrente in Prozenten der Vollrente"), die durch kopf=ths ueberschrieben werden. Letzteres ist aber eine SEPARATE Mehrzeilen-Kopf-Luecke, nicht die hier behauptete colspan/rowspan-Spaltenversatz-Luecke. Die konkret behauptete Luecke (Spalten-Semantik unsicher / Versatz) ist nicht real; sie ist eine Code-Beobachtung (kein span-Parsing), die zu einem Datenverlust hochgespielt wurde, der nicht eintritt.
- **Beträge im Format 'N.—' bekommen ein eingefügtes Leerzeichen ('10. —')** — Information wird abgebildet, keine echte Luecke. Fedlex 'Mittagessen 10.—' (=10 Franken glatt) steht in AHVV.json art_11 als ['Mittagessen','10. —'] bzw. ['Abendessen','8. —'] — Zahl (10/8) UND glatt-Strich (—) sind beide vorhanden und werden 1:1 in die Wert-Spalte gerendert (StaffelTabelle, ArtikelBody.tsx). Es geht KEINE Information verloren; einzig ein typografisches Leerzeichen sitzt zwischen Zahl und Gedankenstrich. Anders als die Kalibrierung (aufgehoben-Artikel, ganzer Repeal-Text weg) fehlt hier nichts.

Die EVIDENZ des Finders zum Mechanismus ist zudem falsch: entferneTags ersetzt Tags NICHT durch Leerzeichen — der reale Zellen-Cleaner bereinige() (adapter-htm.ts:125) strippt Tags zu LEERSTRING. Empirisch reproduziert: '10.<tmp:inl></tmp:inl>—<tmp:inl></tmp:inl>' → '10.—' (kein Space). Das Leerzeichen entsteht erst in mehrspaltige-tabelle.ts:141, wo Tabellen-ZEILEN an ' — ' (Space-Emdash-Space) gesplittet werden — derselbe Em-Dash, der im Wert '10.—' steckt, kollidiert mit dem Zeilentrenner und hinterlaesst einen Stray-Space.

Umfang minimal: nur AHVV, genau 2 Zellen ueber alle 228 Bund-JSONs (grep '[0-9]\. —'). Fazit: wir bilden es doch ab; bestenfalls kosmetische Darstellungs-Macke, kein Info-Verlust.
- **Interne Artikel-Anker stimmen nicht mit Fedlex ueberein (art- statt art_)** — Die Evidenz ist technisch korrekt (parts.tsx:98 `id={`art-${e.artikel}`}`, :92/:136 `#art-${e.artikel}`; Fedlex `id="art_450_c"`), aber sie belegt KEINE Informationsluecke im Sinne der Audit-Frage ("Bilden wir ALLE Informationen ab, die Fedlex bietet?").

(1) Wir rendern fuer JEDEN Artikel einen Anker mit IDENTISCHEM Token. Verifiziert: ZGB.json fuehrt artikel="19_a", "450_c" etc., Fedlex setzt art_19_a / art_450_c — der Token-Teil ist Zeichen-fuer-Zeichen gleich, nur der Praefix-Trenner art- vs art_ unterscheidet sich. Es geht also weder bei der Extraktion noch beim Rendern eine von Fedlex angebotene Information verloren: die Artikel-Identitaet und das Sprungziel sind vollstaendig vorhanden und fuer alle 1099 ZGB-Artikel (und alle Erlasse) abgebildet.

(2) Intern ist das System konsistent und funktioniert: inhalt.tsx:214/220/247/296/305/339/386 lesen/schreiben/observen durchgaengig `#art-`/`[id^="art-"]`, der per-Artikel-Link-Button (parts.tsx:92) baut denselben Praefix. Unsere kopierten Permalinks scrollen bei uns korrekt; die Sprungnavigation ist intakt.

(3) Der einzige reale Effekt ist eine Cross-Site-Deep-Link-Inkompatibilitaet (ein von Fedlex kopierter #art_450_c springt bei uns nicht und umgekehrt). Das ist eine Interoperabilitaets-/Konvention-Frage, kein Informationsverlust und auch keine von Fedlex "angebotene Information", die wir nicht abbilden — Anker-IDs sind eine eigene Implementierungs-Konvention, keine Norm-Inhaltsdaten.

Damit faellt der Befund nicht in die kalibrierte Klasse (vgl. "aufgehoben"-Text + AS-Fundstelle real verloren). Hier ist nichts verloren; es ist allenfalls eine kosmetische Konventions-Differenz (darstellung), die man fuer Fedlex-Permalink-Kompatibilitaet angleichen KOENNTE, aber keine Audit-Luecke. correctedSeverity daher "keine" bzgl. Informationsabbildung.
- **Korrekt extrahierter Fedlex-Artikel-Deeplink wird vom Renderer verworfen** — WIDERLEGT. Die Kernbehauptung der Luecke ("Der NormSnapshot-Feldwert eintrag.quelleUrl (=.../de#art_450_c) wird nirgends gelesen / der Renderer nutzt ihn NIE") ist faktisch falsch.

BELEG: src/components/NormPopover.tsx:72-74 liest genau snapshot.quelleUrl (= der pro-Artikel-Deeplink aus dem JSON) und baut daraus den amtlichen Live-Link:
  const liveUrl = snapshot.quelleUrl.includes('#') ? snapshot.quelleUrl + frag.slice(1) : snapshot.quelleUrl + frag;
Dieser liveUrl wird als "↗ geltende Fassung" gerendert (NormPopover.tsx:129-136). Er springt also genau auf den konkreten Artikel auf Fedlex — sogar angereichert um ein Text-Fragment (#art_450_c:~:text=…), das Chromium die zitierte Stelle hervorheben laesst.

DATENFLUSS bestaetigt: public/normtext/bund/zgb.json haelt fuer alle 1099 Eintraege quelleUrl mit Anker (.../de#art_1 … #art_450_c). src/lib/normtext/laden.ts:102-105 (ladeSnapshot) gibt den Eintrag unveraendert via datei.eintraege.find(e => e.id===id) zurueck — der Anker wird NICHT gestrippt. Die NormSnapshot, die NormPopover bekommt, traegt also exakt eintrag.quelleUrl. Der Test src/tests/NormPopover.test.tsx:76 prueft genau dieses Verhalten (href.startsWith(SNAP.quelleUrl) mit #art_335_c). Der Finder hat NormPopover schlicht uebersehen — sein grep traf nur inhalt.tsx (erlass.quelleUrl).

EINSCHRAENKUNG (kein Info-Verlust): Korrekt ist nur der enge Teil, dass im VOLLTEXT-Reader selbst (gesetz-leser/parts.tsx:90-92) der per-Artikel-"Link"-Button eine LexMetrik-interne Permalink-URL kopiert und inhalt.tsx:465/676 den Erlass-Spitzen-Link ("geltende Fassung", ohne #art) zeigt. D.h. im Lese-Modus gibt es keinen Ein-Klick-"dieser Artikel auf Fedlex". Das ist aber eine reine UX-Bequemlichkeit, kein nicht-abgebildeter Datenpunkt: die Information (pro-Artikel-Fedlex-Anker) wird vom Renderer DOCH genutzt und dem Nutzer als amtlicher Sprung praesentiert — eben im Norm-Vorschau-Popover, das von jeder Normreferenz aus erreichbar ist. Damit ist die behauptete Luecke "Deeplink wird verworfen / Info fehlt" nicht real; correctedSeverity = keine.