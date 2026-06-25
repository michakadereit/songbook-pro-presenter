# TICKET-003 — UI Folder-Picker + Shell-Integration

> Plan: [OnSong-Import](./README.md) · Spec ACs: AC8

## Ziel

In der App-Shell einen Ordner-Import anbieten und mit dem bestehenden View-Umschalter
verbinden — ohne den `.sbp`-Flow zu brechen.

## Abhängigkeiten

TICKET-002 (`parseChordProFolder`). Nutzt `mountViewSwitcher` aus dem SlideView-Plan.

## Deliverables

- `src/main.ts` erweitern:
  - Zusätzlich zum bestehenden `.sbp`-File-Input ein **Ordner-Input**
    `<input type="file" webkitdirectory multiple>` (Label „OnSong-Ordner laden").
  - `change` → `files = [...input.files]` → `set = await parseChordProFolder(files)` →
    Status „Geladen: <Ordnername> (<n> Songs)" → vorherige View disposen →
    `mountViewSwitcher(container, set, 'slide')`.
  - Fehlerfälle: keine `.chopro` im Ordner → klare Meldung; Parse-Fehler abfangen.
  - Den `.sbp`-Flow unverändert lassen (beide Eingänge koexistieren).
- Optional kleines CSS für die beiden Eingänge (bestehende Tokens).

## Acceptance Criteria

- AC8: Ordner `samples/onsong/` über den Picker laden → Status zeigt Songanzahl;
  View-Umschalter erscheint; Slide zeigt Song 1; Eagle zeigt das Grid mit den OnSong-Songs.
- Der `.sbp`-Flow funktioniert weiterhin (Regression-Check im Browser mit dem `.sbp`-Sample).
- Soweit sinnvoll testbar: eine kleine reine Hilfsfunktion für „files → loader auswählen"
  bzw. die Set-zu-Shell-Verdrahtung; primär aber Browser-Verifikation.
- `npm run build` ok; keine Konsolenfehler (außer ggf. favicon 404).

## Out of Scope

- Drag&Drop eines Ordners (nice-to-have; Picker reicht für diese Spec).
- Formaterkennung über Dateiinhalt; `.xml`-Import.
