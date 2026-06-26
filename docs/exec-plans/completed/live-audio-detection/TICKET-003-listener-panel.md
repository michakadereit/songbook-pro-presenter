# TICKET-003: `ListenerPanel.ts` — Toggle + Lautstärke-Bar + Anzeige, im Shell gemountet

**Plan:** live-audio-detection
**Depends on:** TICKET-001, TICKET-002
**Model:** Opus (visuelles Panel/CSS)

## Ziel

Das sichtbare Sidecar-Panel: Aktivierungs-Toggle, animierte Lautstärke-Bar und Platzhalter für
Note/Tonart/Akkord. Mountet additiv im Shell, ohne die Views zu berühren. Deckt **AC6** ab;
liefert die UI-Hülle, in die TICKET-004/005 ihre Werte schreiben.

## Dateien (NUR diese anfassen)

- `src/views/ListenerPanel.ts` — neu (`createListenerPanel(): { el: HTMLElement; dispose(): void }`)
- `src/views/ListenerPanel.test.ts` — neu
- `src/main.ts` — Panel im Shell mounten (minimaler additiver Eingriff)
- `styles/main.css` — `.listener-panel`, `.listener-bar`, `.listener-readout` etc.

## Verhalten

- Toggle-Button „Mikro aktivieren" ↔ „Mikro aktiv ●", `aria-pressed` spiegelt den Zustand.
- Aktivierung ruft `startMic()` (TICKET-002); ein `requestAnimationFrame`-Loop liest
  `readLevel(analyser)` → `rmsToBarRatio` → setzt Bar-Breite/`--level` als CSS-Var.
- Deaktivierung ruft `stop()`, bricht den rAF-Loop ab, setzt Bar auf 0 und leert die Readouts.
- `dispose()` stoppt Mic + rAF (für sauberes Teardown, analog zu View-Dispose im Projekt).
- Readout-Bereich: drei Felder `Note`, `Tonart`, `Akkord` (zunächst leer/„—").

## CSS-Hinweise

- Design-Tokens aus `:root` nutzen (`light-dark()`, `clamp()`), keine `px`-Festwerte für Typo.
- Bar: ein Container + eine `.listener-bar__fill`, Breite via `transform: scaleX(var(--level))`
  oder `width: calc(var(--level)*100%)`; flüssige Transition. Peak gut sichtbar bei lautem Signal.
- Panel unaufdringlich im Shell (z. B. neben den globalen Controls), bricht das bestehende
  Layout nicht (vgl. `#songs:has(...)`-Breiten-Overrides nicht stören).

## Akzeptanzkriterien

- AC6: Initial Bar bei 0, Readouts leer, Toggle `aria-pressed="false"`.
- Nach Aktivierung `aria-pressed="true"`, Button-Text im aktiven Zustand.
- Im Browser: eingespeistes Signal bewegt die Bar (manuell/Spy-gestützt); nach Deaktivierung
  Bar zurück auf 0, Readouts leer.
- AC7: `SongRenderer`, `SlideView`, `EagleView`, `viewSwitcher`, `transpose` unverändert.
- `npm test` grün, `npx tsc --noEmit` sauber.

## Browser-Verifikation

Headless-Mic ist eingeschränkt → Capture per Spy testen; im Browser nur „Panel vorhanden,
Toggle wirft nicht, Bar-Element existiert, `aria-pressed` toggelt". Echte Pegel-/Erkennungs-
Prüfung manuell durch den User.

## Out of Scope

- Tatsächliche Note/Tonart/Akkord-Werte berechnen (TICKET-004/005) — hier nur leere Felder.

## Vorgehen

Nichts committen, Branch nicht wechseln.
