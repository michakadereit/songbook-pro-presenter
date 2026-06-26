# TICKET-002 — Export-Button + Download-Trigger

> Plan: [SBP-Export](./README.md) · Spec ACs: AC5

## Ziel

Einen „Exportieren"-Button in der Shell-Bar hinzufügen, der den Download der
`.sbp`-Datei auslöst. Sichtbar/aktiv nur wenn ein Set geladen ist.

## Abhängigkeiten

- TICKET-001: `songSetToSbpBlob` muss vorhanden sein.
- `src/main.ts`: Shell-Bar-HTML + `loadSet`-Funktion.
- `src/shellHelpers.ts`: `markSetLoaded` setzt `body.classList.add('set-loaded')` →
  CSS-Selektor zum Einblenden nutzen.

## Deliverables

### `src/main.ts` (ändern)

1. Button im Shell-Bar HTML hinzufügen:
   ```html
   <button class="shell-bar__btn" id="export-btn" type="button">Exportieren</button>
   ```

2. Import ergänzen:
   ```ts
   import { songSetToSbpBlob } from './exporter';
   ```

3. `activeSongSet: SongSet | null = null` als Modul-Variable verfolgen:
   - `loadSet` setzt `activeSongSet = set`.
   - Bei Fehler / Dispose: `activeSongSet = null`.

4. Click-Handler:
   ```ts
   exportBtn.addEventListener('click', () => {
     if (!activeSongSet) return;
     const blob = songSetToSbpBlob(activeSongSet);
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = `${activeSongSet.name}.sbp`;
     a.click();
     URL.revokeObjectURL(url);
   });
   ```

### `styles/main.css` (ändern)

Button standardmäßig ausgeblendet, nur sichtbar wenn Set geladen:

```css
#export-btn {
  display: none;
}
body.set-loaded #export-btn {
  display: inline-flex;
}
```

## Acceptance Criteria

- AC5: „Exportieren"-Button fehlt / ist nicht sichtbar ohne geladenes Set. Nach dem
  Laden eines Sets erscheint er; Klick löst Browser-Download einer `.sbp`-Datei aus,
  deren Name dem Set-Namen entspricht.
- Bestehende Tests grün, `tsc` sauber.

## Out of Scope

- Unit-Tests für den Click-Handler (Browser-API `URL.createObjectURL` — Browser-Verifikation reicht).
- Fortschrittsanzeige (synchron, kein Spinner nötig).
- Auswahl eines Speicherorts (Standard-Browser-Download-Verhalten).
