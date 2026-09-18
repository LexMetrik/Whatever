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
# confidence.json geht selbst NUR in den Manifest-Eintrag `dokument.sha` ein,
# NIE in `artikel.sha` (keine Zirkularität zu Schritt 5, Beleg #888/#890) —
# ein Manifest-Lauf NACH diesem Skript (Sache des Aufrufers, hier bereits der
# bestehende unbedingte Schritt "Manifest immer aktuell halten") holt diese
# letzte Bewegung nach und bleibt der tatsächlich LETZTE DB-berührende Schritt.
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

npm run gen:entstehung-projektion
npm run gen:entstehung-deckung
npm run check:verweis-inventar -- --schreiben
npm run gen:e2e-shards
npm run datenhaltung:manifest
npm run report:confidence -- --schreibe --datum="$datum"
