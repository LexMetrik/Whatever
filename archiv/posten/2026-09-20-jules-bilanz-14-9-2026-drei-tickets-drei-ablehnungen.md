<!-- @posten
dach: QS-FREMDAGENTEN
titel: Jules-Bilanz 14.9.2026 — drei Tickets, drei Ablehnungen
anlass: Messreihe: FAHRPLAN-FREMDAGENTEN §5
-->

  - [ ] **Jules-Bilanz 14.9.2026 — drei Tickets, drei Ablehnungen** *(Messreihe: FAHRPLAN-FREMDAGENTEN §5)* — Tickets #849/#850/#858 (Reiterleiste.tsx-/tabs.ts-Split), PRs #855, #857 und #861 **alle abgelehnt**. Muster: **Jules generiert, statt zu verschieben** (Kommentar-Paraphrasen, gelöschte Kommentarzeilen, in #855 zusätzlich eine geänderte Hook-Reihenfolge). **Ticket #858 war mein eigener Fehler** — der Body enthielt nur die EN-Summary-Zeile, die Detailregeln fehlten (Vorfall und Regel: Fahrplan §5). Die Rückbau-Schwelle §3 ist damit zu prüfen; die Neuanlauf-Tickets (Reiterleiste, `tabs.ts`-Split dritter Anlauf mit gemeinsamer Typen-Datei) gehören in die **nächste Session**, nicht in diese. **Nachtrag 15.9.2026:** `check:schlankheit` war deshalb **auf main rot** (Nullprobe `e94a3dc90`: `Reiterleiste.tsx` 1 237 Z., `lib/tabs.ts` 1 205 Z., Schwelle 800) — ein Dauer-Rot wird überlesen (F2-Familie), der Split ist **dringlich**, nicht nur fällig. PR #874 (`40f634b3d`) hat beide Dateien in `schlankheit-bestand.json` aufgenommen: Tor grün **ohne Schnitt** (§17 «kein Deckel-Anheben») — das Rot ist weg, der Befund nicht.
