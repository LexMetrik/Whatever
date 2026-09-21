<!-- @posten
dach: QS-KORPUS
titel: Curia-Schlusszeile sagt keiner fehlt auch wenn Shards fehlen
anlass: Kosmetik-Befund der Gegenprüfung zu PR #963 (21.9.2026)
-->

**Befund (Gegenprüfung PR #963, Delta-Runde, 21.9.2026):** Die Info-Schlusszeile von
`check:entstehung` im Curia-Teil (`scripts/entstehung/curia-tor.ts` ~Z. 190-200) druckt fest
«…, N Shard(s), keiner fehlt; …» — auch dann, wenn daneben Fehler «Shard fehlt» oder «Shard
steht nicht im Zustandsträger» stehen (z. B. bei 0 Shards). Kein Tor-Loch: die Fehler machen
das Tor rot. Aber die Zeile widerspricht den Fehlern und verletzt §8 (sie behauptet, was sie
nicht gemessen hat).

*Fix-Skizze:* «keiner fehlt» nur drucken, wenn die Zahl fehlender/unbelegter Shards 0 ist,
sonst die Zahl nennen («2 fehlen, 1 unbelegt»). Reine Prüflogik (`istPruefLogik`), kein
Risikopfad; Test: Zeile bei fehlendem Shard enthält nicht «keiner fehlt».
