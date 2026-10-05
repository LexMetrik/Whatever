// scripts/materialien/check-materialien-netz.ts
// E6a Stufe 1 (FAHRPLAN-MATERIALIEN-VERZAHNUNG §4 «check:materialien-netz»): Live-Drift-Arbiter
// der Materialien-Quellen gegen das committete Zustands-Manifest. Verdrahtet in `check:netz`
// (seit 5.10.2026 `check:netz:bericht`: Drift ist ein Wochenbericht-Hinweis, kein Monitor-Rot;
// Nachführung unten beschrieben, §7 kein Auto-Fix).
//
// Struktur: pro Quelle ein Arbiter (M1 ESTV-MWST / M3 EDÖB / M4 ESTV-KS docken hier an). M2 = SECO.
// Drift ⇒ ROT = «Snapshot neu ziehen» (npm run materialien:snapshot …), NIE Auto-Fix (§7 Build-Regel).
//
// SECO-Arbiter: Menge (id → drift_token/quelle_url) aus beiden Hub-Seiten (live) vs. Manifest.
//   · Count-Gate ≥ 60 je Quelle (im Adapter erzwungen — crawleSeco wirft bei Unterschreitung).
//   · Soft-404 (Content-Type statt HTTP-Status) — ladeHub prüft das.
//   · Drift = neue/verschwundene id ODER drift_token-Abweichung (Datumslabel/URL/Dateiname geändert).

import { ladeZustand, type DokZeile } from './soft-law-zustand.ts';
import { baueKorpusInfo, KANTEN_DIR } from './soft-law-projektion.ts';
import { crawleSeco, SECO_QUELLEN } from './adapter-seco.ts';
import { crawleEdoeb, EDOEB_ID_PREFIX } from './adapter-edoeb.ts';
import { crawleEstvKs, ESTV_KS_ID_PREFIXE } from './adapter-estv-ks.ts';
import { inventarEstvMwst, ladeSeite as ladeMwstSeite, pruefeKurzUrl, kurzUrl, type InventarEintrag } from './adapter-estv-mwst.ts';
import { ESTV_MWST_ID_PREFIX } from './estv-mwst-ids.ts';
import { leseShards, planeStandProben, pruefeStandProbe } from './estv-mwst-stand-probe.ts';

interface QuelleArbiter {
  quelle: string;
  pruefe(gelistet: Map<string, DokZeile>): Promise<string[]>;
}

// ── SECO (M2) ────────────────────────────────────────────────────────────────
const SECO_PREFIXE = SECO_QUELLEN.map((q) => q.idPrefix);
function istSecoId(id: string): boolean {
  return SECO_PREFIXE.some((p) => id.startsWith(p));
}

const secoArbiter: QuelleArbiter = {
  quelle: 'seco',
  async pruefe(gelistet) {
    const fehler: string[] = [];
    const heute = new Date().toISOString().slice(0, 10); // nur als abgerufen-Etikett des Live-Laufs
    const korpus = baueKorpusInfo();
    const korpusFuer = (erlassKey: string): Iterable<string> => korpus.artikelSet(erlassKey) ?? [];

    let ergebnis;
    try {
      ergebnis = await crawleSeco(korpusFuer, { abgerufen: heute });
    } catch (e) {
      // Count-/Vollständigkeits-Gate rot ODER Soft-404 ⇒ Drift-Signal (Snapshot neu ziehen).
      return [`SECO: Live-Crawl ROT — ${(e as Error).message}`];
    }

    const live = new Map(ergebnis.dokumente.map((d) => [d.id, d.drift_token]));
    const manifestSeco = new Map<string, DokZeile>();
    for (const [id, z] of gelistet) if (istSecoId(id)) manifestSeco.set(id, z);

    for (const [id, z] of manifestSeco) {
      const lt = live.get(id);
      if (lt === undefined) {
        fehler.push(`SECO: Dokument '${id}' im Manifest, aber live nicht mehr auffindbar (entlistet?) — Snapshot neu ziehen.`);
      } else if (lt !== z.drift_token) {
        fehler.push(`SECO: drift_token '${id}' abweichend (Manifest ${z.drift_token} ≠ live ${lt}: Datum/URL/Dateiname geändert) — Snapshot neu ziehen.`);
      }
    }
    for (const id of live.keys()) {
      if (!manifestSeco.has(id)) fehler.push(`SECO: neues Dokument '${id}' live, fehlt im Manifest — Snapshot neu ziehen.`);
    }
    return fehler;
  },
};

// ── EDÖB (M3) ────────────────────────────────────────────────────────────────
function istEdoebId(id: string): boolean {
  return id.startsWith(EDOEB_ID_PREFIX);
}

const edoebArbiter: QuelleArbiter = {
  quelle: 'edoeb',
  async pruefe(gelistet) {
    const fehler: string[] = [];
    const heute = new Date().toISOString().slice(0, 10); // nur abgerufen-Etikett des Live-Laufs

    let ergebnis;
    try {
      ergebnis = await crawleEdoeb({ abgerufen: heute });
    } catch (e) {
      // Count-Gate rot ODER Soft-404 / fehlende Sektion ⇒ Drift-Signal (Snapshot neu ziehen).
      return [`EDÖB: Live-Crawl ROT — ${(e as Error).message}`];
    }

    const live = new Map(ergebnis.dokumente.map((d) => [d.id, d.drift_token]));
    const manifestEdoeb = new Map<string, DokZeile>();
    for (const [id, z] of gelistet) if (istEdoebId(id)) manifestEdoeb.set(id, z);

    for (const [id, z] of manifestEdoeb) {
      const lt = live.get(id);
      if (lt === undefined) {
        fehler.push(`EDÖB: Dokument '${id}' im Manifest, aber live nicht mehr auffindbar (entlistet/umbenannt?) — Snapshot neu ziehen.`);
      } else if (lt !== z.drift_token) {
        fehler.push(`EDÖB: drift_token '${id}' abweichend (Manifest ${z.drift_token} ≠ live ${lt}: Titel/Datum/DAM-URL geändert) — Snapshot neu ziehen.`);
      }
    }
    for (const id of live.keys()) {
      if (!manifestEdoeb.has(id)) fehler.push(`EDÖB: neues Dokument '${id}' live, fehlt im Manifest — Snapshot neu ziehen.`);
    }
    return fehler;
  },
};

// ── ESTV-KS (M4) ─────────────────────────────────────────────────────────────
function istEstvKsId(id: string): boolean {
  return ESTV_KS_ID_PREFIXE.some((p) => id.startsWith(p));
}

const estvKsArbiter: QuelleArbiter = {
  quelle: 'estv-ks',
  async pruefe(gelistet) {
    const fehler: string[] = [];
    const heute = new Date().toISOString().slice(0, 10); // nur abgerufen-Etikett des Live-Laufs

    let ergebnis;
    try {
      ergebnis = await crawleEstvKs({ abgerufen: heute });
    } catch (e) {
      // Count-Gate rot ODER Soft-404 / Struktur-Bruch ⇒ Drift-Signal (Snapshot neu ziehen).
      return [`ESTV-KS: Live-Crawl ROT — ${(e as Error).message}`];
    }

    const live = new Map(ergebnis.dokumente.map((d) => [d.id, d.drift_token]));
    const manifestEstv = new Map<string, DokZeile>();
    for (const [id, z] of gelistet) if (istEstvKsId(id)) manifestEstv.set(id, z);

    for (const [id, z] of manifestEstv) {
      const lt = live.get(id);
      if (lt === undefined) {
        fehler.push(`ESTV-KS: Dokument '${id}' im Manifest, aber live nicht mehr auffindbar (entlistet?) — Snapshot neu ziehen.`);
      } else if (lt !== z.drift_token) {
        fehler.push(`ESTV-KS: drift_token '${id}' abweichend (Manifest ${z.drift_token} ≠ live ${lt}: Titel/Datum/DAM-URL geändert) — Snapshot neu ziehen.`);
      }
    }
    for (const id of live.keys()) {
      if (!manifestEstv.has(id)) fehler.push(`ESTV-KS: neues Dokument '${id}' live, fehlt im Manifest — Snapshot neu ziehen.`);
    }
    return fehler;
  },
};

// ── ESTV-MWST (M1) ───────────────────────────────────────────────────────────
// Arbiter §3 Q1: ToC-Anker-Token je Publikation (1 GET/Publikation, robots-höflich) gegen das
// Manifest; Kurz-URL-302-Ziel + Stand-Probe JE Dokument (Publiziert-am der stand-tragenden Ziffer
// gegen den committeten Shard, estv-mwst-stand-probe.ts) als Zweitsignale. Bis 31.8.2026 war die
// Stand-Probe eine Dreier-Stichprobe — ~45 Dokumente ohne Stand-Deckung (§17-Wurzel-Fix 1.9.2026).
// robots-Freigabe David 4.7.2026 (§8).
function istEstvMwstId(id: string): boolean {
  return id.startsWith(ESTV_MWST_ID_PREFIX);
}

const estvMwstArbiter: QuelleArbiter = {
  quelle: 'estv-mwst',
  async pruefe(gelistet) {
    const fehler: string[] = [];
    const heute = new Date().toISOString().slice(0, 10); // nur abgerufen-Etikett des Live-Laufs

    const manifestMwst = new Map<string, DokZeile>();
    for (const [id, z] of gelistet) if (istEstvMwstId(id)) manifestMwst.set(id, z);
    if (manifestMwst.size === 0) return []; // Quelle (noch) nicht gesnapshottet → nichts zu prüfen

    let live;
    try {
      live = await inventarEstvMwst({ abgerufen: heute });
    } catch (e) {
      // Count-Gate rot ODER Soft-404 / leerer Baum ⇒ Drift-Signal (Snapshot neu ziehen).
      return [`ESTV-MWST: Live-Inventar ROT — ${(e as Error).message}`];
    }

    for (const [id, z] of manifestMwst) {
      const lt = live.get(id);
      if (lt === undefined) {
        fehler.push(`ESTV-MWST: Dokument '${id}' im Manifest, aber live nicht mehr im Menü — Snapshot neu ziehen.`);
      } else if (lt.drift_token !== z.drift_token) {
        fehler.push(`ESTV-MWST: drift_token '${id}' abweichend (Manifest ${z.drift_token} ≠ live ${lt.drift_token}: ToC/Ziffern-Baum geändert) — Snapshot neu ziehen.`);
      }
    }
    for (const id of live.keys()) {
      if (!manifestMwst.has(id)) fehler.push(`ESTV-MWST: neues Dokument '${id}' live, fehlt im Manifest — Snapshot neu ziehen.`);
    }

    // Zweitsignal 1: Kurz-URL-302-Ziel (erste Publikation je Bereich).
    const proben = new Map<string, InventarEintrag>();
    for (const [id, e] of live) {
      if (![...proben.values()].some((p) => p.bereich.tag === e.bereich.tag)) proben.set(id, e);
      if (proben.size >= 2) break;
    }
    for (const [id, e] of proben) {
      try {
        await pruefeKurzUrl(kurzUrl(e.bereich, e.nummer), e.publicationId);
      } catch (err) {
        fehler.push(`ESTV-MWST: Kurz-URL-Stichprobe '${id}' — ${(err as Error).message}`);
      }
    }

    // Zweitsignal 2 (§0/A11 + A6, §17 1.9.2026): Stand-Probe JE Dokument aus den committeten
    // Shards — erreichbar (url_effective/Content-Type) UND «Publiziert am» deckt den Stand der
    // stand-tragenden Ziffer. Fängt In-place-Änderungen, die den Anker-Token nicht bewegen.
    const proben2 = planeStandProben(leseShards(KANTEN_DIR), istEstvMwstId);
    const ohneProbe = [...manifestMwst.keys()].filter((id) => !proben2.some((p) => p.dok === id));
    if (ohneProbe.length) {
      console.log(`  ESTV-MWST: ${ohneProbe.length} Dokument(e) ohne belegte Kante — keine Stand-Probe möglich: ${ohneProbe.join(', ')}`);
    }
    let erste = true;
    for (const probe of proben2) {
      if (!erste) await new Promise<void>((r) => setTimeout(r, 300));
      erste = false;
      try {
        const html = await ladeMwstSeite(probe.url);
        const f = pruefeStandProbe(probe, html);
        if (f) fehler.push(f);
      } catch (err) {
        fehler.push(`ESTV-MWST: Stand-Probe ${probe.dok} tot (${(err as Error).message}) — Snapshot neu ziehen.`);
      }
    }
    console.log(`  ESTV-MWST: ${proben2.length} Stand-Proben (je Dokument eine Ziffer) gefahren.`);
    return fehler;
  },
};

const ARBITER: QuelleArbiter[] = [secoArbiter, edoebArbiter, estvKsArbiter, estvMwstArbiter];

async function main(): Promise<void> {
  const zustand = ladeZustand();
  const gelistet = new Map<string, DokZeile>();
  for (const [id, z] of zustand.letzterZustand) if (z.status === 'gelistet') gelistet.set(id, z);

  const fehler: string[] = [];
  for (const a of ARBITER) {
    try {
      fehler.push(...(await a.pruefe(gelistet)));
    } catch (e) {
      fehler.push(`${a.quelle}: Arbiter-Fehler — ${(e as Error).message}`);
    }
  }

  if (fehler.length) {
    for (const f of fehler) console.error(`ROT   materialien-netz: ${f}`);
    console.error(`\ncheck:materialien-netz — ${fehler.length} Drift-Befund(e). Snapshot neu ziehen (nie Auto-Fix).`);
    process.exit(1);
  }
  const nSeco = [...gelistet.keys()].filter(istSecoId).length;
  const nEdoeb = [...gelistet.keys()].filter(istEdoebId).length;
  const nEstv = [...gelistet.keys()].filter(istEstvKsId).length;
  const nMwst = [...gelistet.keys()].filter(istEstvMwstId).length;
  console.log(`check:materialien-netz OK — ${nSeco} SECO- + ${nEdoeb} EDÖB- + ${nEstv} ESTV-KS- + ${nMwst} ESTV-MWST-Dokumente drift-frei gegen die Hub-/Index-/ToC-Seiten.`);
}

main().catch((e) => {
  console.error(`check:materialien-netz ROT: ${(e as Error).message}`);
  process.exit(1);
});
