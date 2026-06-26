# Spec: Slide Two-Column Layout

## Ziel

Die Slide-View nutzt den horizontalen Bildschirmraum besser: Wenn der Song-Inhalt die
Viewport-Höhe überschreitet, fließt er in eine zweite Spalte rechts weiter (wie bei
Zeitungsspalten). Ein Toggle-Button in der Slide-Controls-Leiste schaltet das Layout um.

---

## User Flow

1. Benutzer lädt ein Set; Slide-View zeigt den ersten Song.
2. **Ein-Spalten-Modus (Standard):** Song-Inhalt füllt die linke Spalte von oben nach unten.
   Bei sehr langen Songs scrollt der Benutzer (wie bisher).
3. **Zwei-Spalten-Modus (Toggle):** Ein Button „2 Spalten" ist in der Controls-Leiste
   sichtbar. Nach Klick:
   - Song-Inhalt füllt zuerst die linke Spalte bis zum unteren Rand des Viewports.
   - Überschüssiger Inhalt wird in der rechten Spalte fortgesetzt.
   - Sections werden nicht über Spaltengrenzen hinweg getrennt (ein Section-Header
     bleibt mit seinen Zeilen zusammen).
4. Navigation (←/→) zum nächsten Song behält den gewählten Spalten-Modus bei.
5. Der Modus-Toggle ist immer aktiv — unabhängig davon, wie lang der aktuelle Song ist.
   (Kurze Songs haben eine leere rechte Spalte; das ist akzeptiert.)

---

## Akzeptanzkriterien

| ID | Kriterium |
|---|---|
| AC-001 | In der Slide-View-Controls-Leiste ist ein Toggle-Button für das Zwei-Spalten-Layout sichtbar (z. B. „2 Sp." oder ähnliches Label). |
| AC-002 | Im Standard-Modus (Toggle aus) verhält sich die Slide-View wie bisher (Ein-Spalten, vertikaler Fluss). |
| AC-003 | Nach Aktivierung des Toggles zeigt ein langer Song (mehr Inhalt als Viewport-Höhe) den überschüssigen Inhalt in einer zweiten Spalte rechts. |
| AC-004 | Sections (Vers, Chorus usw.) werden nicht mitten durch eine Spaltengrenze getrennt — Section-Header und zugehörige Zeilen bleiben in derselben Spalte. |
| AC-005 | Navigation zum nächsten oder vorherigen Song behält den aktiven Spalten-Modus (Toggle-Zustand bleibt beim Weiterblättern erhalten). |
| AC-006 | Der Toggle-Zustand (ein/aus) wird in `localStorage` gespeichert und beim nächsten Öffnen der App wiederhergestellt. |

---

## Technische Hinweise

- Umsetzung via CSS `columns` (Multi-Column Layout).
- **Kritisch:** `.slide-view` ist content-driven (gemessen: 5564 px bei einem langen Song).
  `height: 100%` auf `.song` würde zu 100 % des Content-Höhe auflösen → kein Clip-Effekt.
  Korrekte Kaskade im Modifier:
  1. `.slide-view--two-col { height: 100dvh; overflow: hidden }` — Viewport-Pinning
  2. `.slide-view--two-col .slide-body { min-height: 0; overflow: hidden }` — Flex-Shrink erlauben
  3. `.slide-view--two-col .slide-body .song { height: 100%; columns: 2; column-fill: auto }` — füllt verbleibende Höhe
  4. `.slide-view--two-col .slide-body .section { break-inside: avoid }` — Sections zusammenhalten
- CSS-Klasse `.slide-view--two-col` an `.slide-view` als Modifier schalten — kein
  Inline-Style nötig.

## Out of Scope

- Automatische Spaltenentscheidung anhand der Song-Länge (kein Auto-Detection).
- Drei oder mehr Spalten.
- Zwei-Spalten-Layout in der Eagle-View.
