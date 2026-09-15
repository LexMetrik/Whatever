# VPS-Bestell-Dossier (QS-BASIS B-5 · Stand 17.7.2026)

**Erstellt:** 17.7.2026 — QS-BASIS B-5: VPS-Beschaffung für E3-Serving/E4-Zitatgraph/VZUI-V2,
Preise live verifiziert.
**Status:** ERSTRECHERCHE

> **Zweck:** David bestellt in ~15 Min den VPS, der E3-Serving (195 342 Bundes-Entscheide),
> E4-Zitatgraph (8,7 Mio Kanten) und VZUI-V2 «Zitiert-von» entsperrt. Der Serving-**Bau** bleibt
> QS-DATA (E3/E4) — dieses Dossier ist NUR die Beschaffung. **Preise live verifiziert 17.7.2026**
> (Quell-Links unten). Dieser VPS kann zugleich das Off-site-**Backup-Zweitziel** (B-2) und das
> Fassungs-Archiv-Ziel (B-9) sein → eine Bestellung, drei Zwecke.

## 1. Anforderung (aus §6.3 + E3/E4-Ist)

| Kriterium | Minimum | Warum |
|---|---|---|
| NVMe-Disk | **≥ 350 GB** | `masse.db` ~5,8 GB + **cold-FTS `fts_entscheide_masse` ~58-GB-Klasse** + E4-Graph + Wachstum + Backup-Zweitziel (B-2) |
| RAM | **≥ 32 GB** | FTS-Serving + SQLite-Cache über 195k Entscheide |
| CPU | ≥ 8 dedizierte Kerne | FTS-Query-Last, Graph-Traversal |
| Standort | EU (DE/AT) | Latenz + DSGVO/DSG-Nähe |
| Traffic | ≥ mehrere TB | Volltext-Auslieferung |

Beleg E3-Ist: `bibliothek/register/e3-lokal-2026-07-03.md` (195 342 Entscheide, `masse.db` ~5,8 GB,
cold-FTS = «VPS-Schritt, 58-GB-Klasse»). E4: `bibliothek/register/e4-lokal-2026-07-03.md`.

## 2. Drei Angebote (live verifiziert 17.7.2026)

### ⭐ Option A — netcup RS 4000 G12 · **EMPFOHLEN**
- **12 dedizierte Kerne** (AMD EPYC 9645) · **32 GB DDR5** · **1 TB NVMe** · Standort Nürnberg/Wien
- **€ 39,92 / Monat** (inkl. 19 % MwSt; für CH-Business i. d. R. Reverse-Charge → netto ~€ 33,55)
- Kein Setup-Fee · 1- oder 12-Monats-Laufzeit (12 Mt spart bis 16 %) · 30-Tage-Geld-zurück
- **Warum:** erfüllt die Anforderung mit **grossem Puffer** (1 TB ≫ 350 GB → masse.db + 58-GB-FTS +
  E4 + Backup-Zweitziel + Archiv passen locker) zum **mit Abstand besten €/GB**. Bestes Gesamtpaket.
- **Headroom-Variante:** RS 8000 G12 — 16 Kerne / **64 GB** / **2 TB** — **€ 71,36/Mt** (falls die
  cold-FTS + Graph im Betrieb mehr RAM/Platz zieht; jederzeit Upgrade möglich).
- Quelle: <https://www.netcup.com/en/server/root-server>

### Option B — Hetzner Cloud CCX33 + 300-GB-Volume · Premium-Alternative
- **8 dedizierte vCPU** (AMD EPYC) · **32 GB RAM** · 240 GB SSD **+ 300 GB Volume** = 540 GB
- **€ 138,49/Mt** (CCX33) **+ ~€ 13,20/Mt** (300-GB-Volume à ~€ 0,044/GB) ≈ **€ 152/Mt** (netto, zzgl. MwSt)
- **Warum trotzdem gelistet:** bestes **Ökosystem** — stündliche Abrechnung, Snapshots/Backups per
  API, Ein-Klick-Skalierung, EU-DCs (Falkenstein/Nürnberg/Helsinki), separat wachsende Volumes.
- **Nachteil:** ~4× teurer als netcup bei gleichem RAM; Cloud-Basisdisk klein (350 GB nur via Volume).
- Quellen: <https://www.hetzner.com/cloud/general-purpose> · Volume-Preis <https://docs.hetzner.com/cloud/volumes/overview>

### Option C — OVHcloud · **erfüllt die Spec NICHT im Standard-VPS**
- Standard-VPS-Linie (VPS 2027) endet bei **VPS-4 = 8 vCore / 24 GB / 200 GB NVMe (~$23,37/Mt)** →
  **unter** ≥ 32 GB **und** ≥ 350 GB. Für die Anforderung bräuchte es OVH **Bare-Metal (Eco/Rise)**,
  Preis nur im Konfigurator (nicht verifiziert). **Daher nicht empfohlen** — nur der Vollständigkeit halber.
- Quellen: <https://www.ovhcloud.com/en/vps/> · Bare-Metal <https://eco.ovhcloud.com/en/>

### Vergleich

| | RAM | NVMe | Kerne | €/Mt | Spec erfüllt |
|---|---|---|---|---|---|
| **netcup RS 4000 G12** ⭐ | 32 GB | **1 TB** | 12 | **39,92** (inkl. MwSt) | ✅ mit Puffer |
| netcup RS 8000 G12 | 64 GB | 2 TB | 16 | 71,36 (inkl. MwSt) | ✅ viel Puffer |
| Hetzner CCX33 + Volume | 32 GB | 540 GB | 8 | ~152 (netto) | ✅ |
| OVH VPS-4 | 24 GB | 200 GB | 8 | ~21 (netto) | ❌ zu klein |

## 3. Setup-Plan (nach Lieferung — Agent/Opus baut, QS-DATA)

1. **OS:** Debian 12 (bookworm) oder Ubuntu 24.04 LTS (minimal).
2. **Härtung:** nur SSH-Key-Login (Passwort aus), `ufw` (nur 22/tcp begrenzt + 443), `fail2ban`,
   automatische Sicherheits-Updates (`unattended-upgrades`).
3. **Serving-Stack:** SQLite (`masse.db` + cold-FTS `fts_entscheide_masse`) hinter einem schlanken
   Read-Only-API-Dienst; Reverse-Proxy (Caddy/nginx) mit Let's-Encrypt-TLS. Details = QS-DATA E3.
4. **Datentransfer:** `masse.db` per `rsync -avz --progress` von Davids Mac hoch (einmalig ~5,8 GB);
   cold-FTS **auf dem VPS** bauen (nicht hochladen — 58-GB-Klasse).
5. **rsync-Ziel für B-2/B-9:** ein `backup`-User + Zielpfad `/srv/backup/` einrichten → dann ist der
   VPS zugleich Off-site-Backup-Zweitziel (B-2) und Fassungs-Archiv-Ablage (B-9). Ein Host, drei Zwecke.
6. **Monitoring:** in den Prod-Watchdog (B-11) einhängen (Health-Route 200-Check).

## 4. Schritt-für-Schritt-Bestellanleitung für David (~15 Min)

1. <https://www.netcup.com/en/server/root-server> öffnen → **RS 4000 G12** wählen (bei Unsicherheit
   über künftigen RAM-/FTS-Bedarf → **RS 8000 G12**; Upgrade ist später jederzeit möglich).
2. Laufzeit: **1 Monat** zum Start (max. Flexibilität; auf 12 Mt umstellen, sobald bewährt).
3. Standort **Nürnberg** (oder Wien) wählen.
4. Konto anlegen / einloggen, Zahlmittel hinterlegen, bestellen (kein Setup-Fee, 30-Tage-Geld-zurück).
5. Nach Freischaltung (meist Minuten–Stunden): **Root-Zugangsdaten + Server-IP** sicher an den
   Bau-Kanal übergeben (SCM-Passwort für Reinstall genügt) → Agent/Opus übernimmt Setup-Plan §3.
6. *(Optional, empfohlen)* Netcup-**Voucher-Code** vor Kauf prüfen (regelmässig 5–15 € Rabatt).

> **Kosten-Fazit:** ~**€ 40/Monat** (netcup RS 4000 G12) entsperrt E3-Serving + E4 + VZUI-V2 und
> dient zugleich als Backup-Zweitziel — das günstigste Angebot, das die Anforderung mit Reserve trägt.
</content>

---

## Nachtrag 8.9.2026 — Neuprüfung

Auftrag David 8.9.2026 («eruier nochmals, was genau der beste VPS ist» / «gibt es keine anderen
Techniken?»). Volle Neuprüfung inkl. serverloser Gegenrechnung: [`vps-auswahl-2026-09-08.md`](vps-auswahl-2026-09-08.md)
und [`alternativen-serverlos-2026-09-08.md`](alternativen-serverlos-2026-09-08.md).

- **Empfehlung bestätigt:** netcup RS 4000 G12 bleibt Erstwahl, Abstand zu Hetzner hat sich seit der
  Hetzner-Preisrunde vom 15.6.2026 (CCX-Cloud ×2,2–2,7) sogar **vergrössert**.
- **Preisstand 8.9.2026:** €33.55 netto/Mt ≈ **CHF 31.55/Mt** (Kurs EUR→CHF 0.9405), unverändert
  gegenüber dem 17.7.2026-Abruf. Netto-Abrechnung für CH-Kunden weiterhin **nicht amtlich bestätigt**
  gefunden — vor Bestellung mit CH-Adresse prüfen.
- **Bezugsteuer CH 8,1 % unklar** — ob auf eine ausländische Server-Dienstleistung Schweizer
  Bezugsteuer anfällt, ist im Bestellprozess bzw. mit der ESTV zu klären, nicht amtlich verifiziert.
- **Alternative RS 8000 G12** (16 Kerne/64 GB/2 TB, €59.97 netto ≈ CHF 56.40/Mt) bleibt die
  Ausweichoption, falls RS 4000 ausverkauft ist oder der Runner mit auf denselben Host soll.
- **Storage Box als Pflicht-Drittziel:** Hetzner Storage Box BX11 (1 TB, CHF 3.01/Mt, rsync/Borg/
  Restic über SSH) ist jetzt **Pflicht**-Backup-Ziel, anbieterfremd vom Serving-Host — ein Backup auf
  demselben Host wie die Produktion zählt nicht als Backup.
- **Runner getrennt:** der CI-Runner gehört **nicht** auf diesen Host, solange das Repo öffentlich
  ist (GitHub warnt ausdrücklich vor Self-hosted-Runnern bei öffentlichen Repos — Fremd-PRs könnten
  gefährlichen Code darauf ausführen) und würde bei CPU-Spitzen (4 parallele Playwright-Shards) die
  FTS-Serving-Latenz stören. Details und Runner-Optionen bei privatem Repo: `vps-auswahl-2026-09-08.md`
  §6.
- **Bestellanleitung Ziff. 4 gilt weiter** — netcup-Produktname («RS 4000 G12») und URL
  (`netcup.com/en/server/root-server`) am 8.9.2026 erneut geprüft und bestätigt, keine Änderung nötig.
- **Bestelltermin:** David, wörtlich 8.9.2026: «ich werde nächsten sonntag den server bestellen»
  (= Sonntag 13.9.2026).

### Nachtrag 8.9.2026 (abends) — Betriebs-Checkliste ist Vorbedingung, nicht Nachtrag

Lehre der Aufräum-Session 8.9.2026 (22 verwaiste Branches, 5 liegende Dependabot-PRs, ein nie
gelandeter Risikopfad-Branch: Ursache «niemand zuständig»): Der Server bekommt VOR der ersten
Nutzung eine Betriebs-Checkliste mit Zuständigkeit und Rhythmus — monatlich: Updates (unattended-
upgrades-Log lesen), Backup-Wiederherstellung testen (Storage Box → Server), Plattenstand,
Zertifikat, Nachtlauf-Protokolle (Stille ≠ Erfolg), Rechnung; jährlich: Laufzeit/Preis prüfen.
Ohne Checkliste keine Freigabe des Serving-Bauschritts (QS-DATA E3). Ort der Checkliste:
`bibliothek/betrieb/vps-betrieb-checkliste.md` (anlegen in der Server-Session).
