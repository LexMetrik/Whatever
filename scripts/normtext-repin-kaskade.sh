#!/usr/bin/env bash
# scripts/normtext-repin-kaskade.sh — volle Projektions-Kaskade nach einer
# Normtext-/Rechtsprechungs-Korpus-Bewegung (Re-Pin, Neuextraktion), Skill
# `auftrag` Ziff. 6 (g). §5 Single Source of Truth: EINE Stelle statt einer
# Liste, die an jedem Aufrufer (Workflow, Hand-PR) erneut gepflegt werden
# müsste — genau das war die Lücke in drei Einzelfällen (#902 gen:verfall,
# #904 Checkout-Historie, #906 gen:entstehung-projektion, Lauf 35358212138).
#
# Aufruf: bash scripts/normtext-repin-kaskade.sh --datum=YYYY-MM-DD
#   (via package.json: npm run projektionen:normtext -- --datum=YYYY-MM-DD)
#
# Reihenfolge — abhängige Projektionen NACH ihren Quellen, Manifest zuletzt
# unter den Daten-Projektionen dieses Skripts:
#   1. gen:entstehung-projektion  — liest historie/revisionen (Aufrufer muss
#      diese VORHER regeneriert haben, z. B. gen:historie/normtext:revisionen).
#   2. gen:entstehung-deckung     — liest die Entstehungs-Projektion aus 1.
#   3. check:verweis-inventar -- --schreiben — liest den Normtext-Korpus.
#   4. gen:e2e-shards             — unabhängig, Teil derselben Skill-Ziffer.
#   5. datenhaltung:manifest      — VOR report:confidence, nicht danach:
#      report:confidence --schreibe liest daten-manifest.json#normtext.db.
#      artikel.sha NUR von der Platte (scripts/normtext/check-confidence.ts).
#      Ohne diesen Zwischenlauf sähe es den Stand von VOR der Korpus-Bewegung
#      und schriebe die falsche (alte) Prüfsumme in confidence.json —
#      check:confidence-frische liefe rot (Kopplung #888/#890).
#   6. report:confidence -- --schreibe --datum=…
#
#   7. datenhaltung:manifest      — zweite Hälfte des Sandwichs: confidence.json
#      geht NUR in den Manifest-Eintrag `dokument.sha` ein, NIE in
#      `artikel.sha` (keine Zirkularität zu Schritt 5, Beleg #888/#890); ohne
#      diesen Schlusslauf bliebe check:datenhaltung rot (Bug-Check #907, Opus,
#      18.9.2026: empirisch belegt). Idempotent — der unbedingte Workflow-
#      Schritt "Manifest immer aktuell halten" wird danach zum No-Op.
#
# Vor Schritt 1 laufen gen:artikel-bestand (liest register.json + bund/*.json;
# ein Re-Pin mit neuem/entfallenem Artikel machte sonst check:artikel-bestand
# rot — latenter vierter Einzelfall, Bug-Check #907) und gen:zaehler (Hand-PRs
# nutzen dieses Skript "statt der Einzelbefehle", Skill `auftrag` 6 (g)).
#
# ACHTUNG Hand-Nutzung: das Skript PINNT das Manifest bewusst (Korpus hat sich
# bewegt = die Ausnahme zu Skill `landung` Ziff. 8 / #717) — nur nach einer
# echten Normtext-Bewegung fahren, Begründung in den Commit.
set -euo pipefail

datum=""
for arg in "$@"; do
  case "$arg" in
    --datum=*) datum="${arg#--datum=}" ;;
  esac
done
if [ -z "$datum" ]; then
  echo "normtext-repin-kaskade.sh: --datum=YYYY-MM-DD fehlt (§2 — kein Date.now in der Erhebung)." >&2
  exit 1
fi

npm run check:segmente -- --schreiben
npm run gen:artikel-bestand
npm run gen:zaehler
npm run gen:entstehung-projektion
npm run gen:entstehung-deckung
npm run check:verweis-inventar -- --schreiben
npm run gen:e2e-shards
npm run datenhaltung:manifest
npm run report:confidence -- --schreibe --datum="$datum"
npm run datenhaltung:manifest
