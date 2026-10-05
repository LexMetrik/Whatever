#!/usr/bin/env python3
"""Unabhaengige Neu-Einlesung der BFS-LIK-Indexierungstabelle (Gegenlesung zum Generator).

Zweck: Beleg im Bot-PR (lik-nachzug), dass die generierte src/data/likReihe.ts dieselben
Werte traegt wie die amtliche XLSX — gelesen auf einem ZWEITEN Weg, damit ein Fehler im
Generator (z. B. verschobene Spalte, neue Basis) nicht sich selbst bestaetigt:

  * kein openpyxl — nur zipfile + xml.etree der Standardbibliothek;
  * keine fest verdrahtete Spaltenzuordnung — die Basismonate werden aus der Kopfzeile
    des Blatts gelesen (Excel-Datumszahl), die Spalte folgt aus der Zellreferenz;
  * Rundung per Decimal ROUND_HALF_UP aus der Textdarstellung der Zelle (der Generator
    rundet float mit round()); eine Abweichung waere ein Befund, kein Rauschen.

Ausgabe (stdout, JSON): {"basen": [...], "reihen": {basis: {"JJJJ-MM": wert}}}
Aufruf: python3 scripts/lik/neu-einlesen.py <xlsx>
"""
import datetime
import json
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from decimal import Decimal, ROUND_HALF_UP

NS = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
      'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
BLATT = 'Index_m'
EXCEL_NULL = datetime.date(1899, 12, 30)


def spalte(ref: str) -> int:
    n = 0
    for ch in re.match(r'[A-Z]+', ref).group(0):
        n = n * 26 + (ord(ch) - 64)
    return n


def monat(serial: str) -> str:
    d = EXCEL_NULL + datetime.timedelta(days=int(Decimal(serial)))
    return f'{d.year}-{d.month:02d}'


def blatt_pfad(z: zipfile.ZipFile) -> str:
    wb = ET.fromstring(z.read('xl/workbook.xml'))
    rid = None
    for s in wb.find('m:sheets', NS):
        if s.get('name') == BLATT:
            rid = s.get(f"{{{NS['r']}}}id")
    if rid is None:
        sys.exit(f'Blatt {BLATT} fehlt in der XLSX')
    rels = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
    for rel in rels:
        if rel.get('Id') == rid:
            ziel = rel.get('Target').lstrip('/')
            return ziel if ziel.startswith('xl/') else 'xl/' + ziel
    sys.exit(f'Beziehung {rid} fehlt')


def main() -> None:
    z = zipfile.ZipFile(sys.argv[1])
    ws = ET.fromstring(z.read(blatt_pfad(z)))
    zeilen = ws.find('m:sheetData', NS)
    kopf: dict[int, str] = {}
    reihen: dict[str, dict[str, float]] = {}
    for row in zeilen:
        zellen = {}
        for c in row:
            v = c.find('m:v', NS)
            if v is None or v.text is None or c.get('t') in ('s', 'str', 'inlineStr'):
                continue
            zellen[spalte(c.get('r'))] = v.text
        if not kopf:
            # Kopfzeile = erste Zeile mit Datumszahlen ab Spalte B (Basismonate).
            if len([k for k in zellen if k >= 2]) >= 3 and 1 not in zellen:
                kopf = {k: monat(v) for k, v in zellen.items() if k >= 2}
            continue
        if 1 not in zellen:
            continue
        m = monat(zellen[1])
        for k, basis in kopf.items():
            if k in zellen:
                w = Decimal(zellen[k]).quantize(Decimal('0.1'), rounding=ROUND_HALF_UP)
                reihen.setdefault(basis, {})[m] = float(w)
    json.dump({'basen': sorted(reihen), 'reihen': reihen}, sys.stdout, sort_keys=True)


main()
