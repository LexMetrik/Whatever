<!-- @posten
dach: W2·27-BUND-FERTIG
titel: W3-11-Rest «Ursprünglich · cquater» ohne alte Bezeichnung (283 Ereignisse in 74 Historie-Shards; Datum nicht ableitbar)
anlass: Session-Notizen 2026-09-25; Teil «Berichtigung · AS 1974 1051» erledigt 30.9.2026 (fix/w227-historie-w3-10-11)
-->

Die Zeile «Ursprünglich · Abs. 1, lit./Ziff. cquater» (`ArtikelHistorie.tsx`) nennt nicht, WAS ursprünglich
galt: die Fussnote trägt es im Wortlaut («Ursprünglich: Bst. c, dann c. Eingefügt durch …»), das Shard-Ereignis
`urspruenglich` hat dafür kein Feld. Gemessen 30.9.2026 (Skript über `public/normtext/struktur/bund/*.json`):
283 Vorkommen in 281 Fussnoten, 109 verschiedene Wortlaut-Formen («vor Art. 25», «Art. 1a», «: Art. 49a»,
«3. Kap.», «Bst. F, danach Bst. G» …); `urspruenglich`-Ereignisse in 74 Shards.

- Alte Bezeichnung: deterministisch ableitbar (Text nach «Ursprünglich» bis zum nächsten Verb-Kopf), braucht
  ein neues optionales Shard-Feld (z. B. `frueher`), den Parser (`historie-parse.ts`) und die Darstellung
  (`ArtikelHistorie.tsx` — Darstellungsschicht, daher nicht in der Daten-Einheit W3-10/11 gebaut).
- Datum: NICHT ableitbar. Die Fussnote datiert nur den folgenden «Eingefügt durch …»-Teil, nicht die
  Ur-Bezeichnung; ein Datum wäre geraten (§7) — bleibt leer.

**Erledigt 2026-10-01:** PR #1249 (Commits 3524d1ec4 + ac17bf942): frueher im Shard und in ArtikelHistorie, Datum bleibt leer; Wurzel: Fussnotentext verlor Hochstellungen
