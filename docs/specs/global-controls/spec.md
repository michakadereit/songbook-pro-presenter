# Spec: Global Controls (Suche + Transpose)

## Ziel

Suchfeld und Transpose-Regler werden aus den view-spezifischen Toolbars herausgelöst und in
eine globale Kontrollleiste im ViewSwitcher verschoben. Die Steuerelemente bleiben beim
Wechsel zwischen Slide- und Eagle-View erhalten — Filterterm und Transpositions-Offset gehen
nicht verloren.

---

## User Flow

1. Benutzer lädt eine `.sbp`-Datei oder einen OnSong-Ordner.
2. ViewSwitcher erscheint mit Tab-Leiste **und** globaler Kontrollleiste (Suchfeld +
   Transpose-Regler).
3. Benutzer tippt einen Suchbegriff ins Suchfeld:
   - In Slide-View: navigierbare Songs werden auf Treffer reduziert (Position „x / Treffer").
   - In Eagle-View: nicht-passende Tiles werden ausgeblendet.
4. Benutzer bewegt den Transpose-Regler:
   - Akkorde in der aktiven View zeigen transponierte Symbole.
5. Benutzer wechselt die View (z. B. Slide → Eagle):
   - Suchbegriff und Transpose-Offset bleiben erhalten; die neue View startet mit dem
     aktuellen Stand.
6. Slide-View zeigt in ihrer lokalen Controls-Leiste **nur noch** den Schriftgrößen-Regler.
7. Eagle-View hat **keine** eigene Controls-Leiste mehr.

---

## Akzeptanzkriterien

| ID | Kriterium |
|---|---|
| AC-001 | Nach dem Laden eines Sets ist ein globales Suchfeld im ViewSwitcher sichtbar — unabhängig davon, ob Slide oder Eagle aktiv ist. |
| AC-002 | Der globale Transpose-Regler (−6…+6) ist ebenfalls im ViewSwitcher sichtbar. |
| AC-003 | Tippen in das globale Suchfeld in der Slide-View filtert die navigierbaren Songs; der Positions-Indikator zeigt „x / Trefferzahl". |
| AC-004 | Tippen in das globale Suchfeld in der Eagle-View blendet nicht-passende Tiles aus. |
| AC-005 | Wechsel von Slide → Eagle behält den aktuellen Suchbegriff; die Eagle-View zeigt denselben Filter an. |
| AC-006 | Wechsel von Eagle → Slide behält den Suchbegriff; die Slide-View filtert die Songs mit dem bestehenden Term. |
| AC-007 | Verschieben des Transpose-Reglers transponiert die Akkorde in der aktiven View. |
| AC-008 | Wechsel der View behält den Transpose-Offset; die neue View zeigt die Akkorde in demselben Offset. |
| AC-009 | Die Slide-View-Controls-Leiste enthält **nur noch** den Schriftgrößen-Regler (kein eigenes Suchfeld). |
| AC-010 | Die Eagle-View hat **keine** eigene Controls-Leiste mehr (kein eigenes Suchfeld, kein eigener Transpose-Regler). |

---

## Out of Scope

- Schriftgrößen-Regler global machen (bleibt Slide-spezifisch).
- Persistenz von Suchbegriff oder Transpose-Offset über Sessions hinweg (localStorage).
- Separate Transpose-Offsets pro View (globaler Offset gilt für beide).
