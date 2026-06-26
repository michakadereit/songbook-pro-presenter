# Spec: Live Audio Detection (Mikro → Note / Tonart / Akkord)

> Status: Draft · Erstellt 2026-06-26 · Module: `src/audio/*`, `src/views/ListenerPanel.ts`

## Ziel

Während eines Live-Lobpreissets über das eingebaute Mac-Mikrofon Sound aufnehmen
(Instrument oder Gesang) und daraus **Note**, **Tonart** und – best effort – **Akkord**
bestimmen. Das Mikro nimmt **nur auf, wenn aktiviert** (klar erkennbarer Ein/Aus-Zustand),
und eine **Lautstärke-Bar** zeigt jederzeit, ob Signal ankommt.

Diese Funktion ist **kein Import-Format** und damit kein Loader. Sie ist ein **additives
Sidecar-Werkzeug** („Listener"), das parallel zu Slide-/Eagle-View im Shell verfügbar ist.
`SongRenderer`, die Views, `viewSwitcher` und `transposeSong` werden **nicht** verändert.

## Realismus-Einschätzung (Architektur-Entscheidung)

| Feature | Realismus | Begründung |
|---|---|---|
| Mikro-Aufnahme + Aktivierungs-Gate | ★★★★★ | `getUserMedia` + Track stop/enable; Browser-Mic-Indikator schafft Vertrauen |
| Lautstärke-Bar | ★★★★★ | `AnalyserNode` → RMS/dB → `requestAnimationFrame` |
| Note/Tonhöhe (monophon) | ★★★★☆ | `pitchy` (McLeod Pitch Method); sehr gut bei **einem** Instrument/einer Stimme |
| Tonart (Key) | ★★★☆☆ | Chroma über Zeitfenster + Krumhansl-Schmuckler; integriert über Zeit → robuster als Akkord |
| Akkord (polyphon, instantan) | ★★☆☆☆ | **Experimentell.** Chroma + Triad-Templates; zuverlässig nur bei isoliertem Instrument, nicht im vollen Bandmix über das eingebaute Mic |

**Fazit:** Mic-Gate + Lautstärke-Bar + monophone Note/Tonart sind realistisch und sofort
nützlich (z. B. „in welcher Tonart spielt das Keyboard"). Vollständige Akkorderkennung aus
einem **Live-Bandmix über das eingebaute Mac-Mic** ist der ambitionierte Teil — wird als
**experimenteller Best-Effort-Modus** geliefert, am besten bei einem isolierten Instrument.

## Library-Empfehlung

- **Capture + Lautstärke + Chroma-Zuführung:** native **Web Audio API** (keine Dependency).
  `navigator.mediaDevices.getUserMedia({ audio: { echoCancellation:false, noiseSuppression:false, autoGainControl:false } })`
  → `AudioContext` → `AnalyserNode`. Gate via `MediaStreamTrack.stop()` (echtes Aus, Mic-Indikator erlischt).
- **Monophone Tonhöhe → Note/Tonart-Fundament:** **`pitchy`** (modern, TypeScript, MIT,
  gepflegt, wenige KB). API: `PitchDetector.forFloat32Array(fftSize)` → `findPitch(buf, sampleRate)` → `[hz, clarity]`.
  Alternative: `pitchfinder` (YIN/AMDF), falls mehrere Algorithmen gebraucht werden.
- **Akkord/Tonart über Chroma:** zwei Routen hinter **demselben Port** (austauschbar):
  - **Pragmatisch/leicht (empfohlen):** **`meyda`** `chroma`-Feature **oder** eigener Chroma
    aus `AnalyserNode.getFloatFrequencyData`, plus **eigene** Krumhansl-Schmuckler-Tonart
    und Triad-Template-Matching. Leicht, volle Kontrolle, problemlos mit Vite.
  - **Stark/schwer (optionaler Upgrade-Pfad):** **`essentia.js`** (`HPCP` + `ChordsDetection`
    + `KeyExtractor`). Bessere Algorithmen, aber npm `0.1.3` (~4 Jahre alt), WASM-/AudioWorklet-
    Verdrahtung, mehr Vite-Reibung. Nur falls die leichte Route nicht ausreicht.

## Architektur (Hexagonal-light, Modulgrenzen)

```
src/audio/
  noteMath.ts        # PURE: Hz→Note/Cents, chroma→Tonart (Krumhansl), chroma→Akkord (Templates) — unit-testbar OHNE Web Audio
  micCapture.ts      # ADAPTER: getUserMedia, AudioContext, AnalyserNode, start/stop-Gate
  levelMeter.ts      # RMS/dB aus Float-Time-Daten (pure Rechen-Helfer + Analyser-Anbindung)
  chroma.ts          # 12-bin Chroma aus Analyser-Frequenzdaten (oder via Meyda)
  pitchDetector.ts   # Hz + clarity (wrappt pitchy)
src/views/
  ListenerPanel.ts   # UI: Aktivierungs-Toggle, Lautstärke-Bar, Live-Anzeige Note/Tonart/Akkord
src/main.ts          # mountet ListenerPanel im Shell (additiv)
```

**Trennlinie:** Alles Musik-/Mathematische liegt in `noteMath.ts` (pure, TDD-fähig ohne Mic).
Web-Audio-Adapter (`micCapture`, `levelMeter`, `chroma`, `pitchDetector`) werden im Browser
verifiziert. UI-Logik (Toggle-Zustand, Anzeige-Formatierung) ist unit-testbar.

## User Flow

1. Im Shell gibt es einen Bereich/Button **„Listener"** (Mikro-Symbol). Initial: Mic **aus**.
2. Klick auf **„Mikro aktivieren"** → Browser fragt Mic-Erlaubnis → bei Erlaubnis startet die
   Aufnahme; der Button zeigt **aktiven** Zustand (z. B. „Mikro aktiv ●"), `aria-pressed="true"`.
3. Die **Lautstärke-Bar** füllt sich proportional zum Eingangspegel und reagiert sichtbar auf
   Sprechen/Spielen → Nutzer sieht, dass das Mic aufnimmt.
4. Bei monophonem Signal zeigt die **Note**-Anzeige die aktuell erkannte Note (z. B. „A4 +5¢").
5. Über ein gleitendes Zeitfenster zeigt die **Tonart**-Anzeige die geschätzte Tonart (z. B. „A-Dur").
6. Im **experimentellen Akkord-Modus** zeigt die Anzeige den best-match Akkord (z. B. „A", „F#m") — als experimentell gekennzeichnet.
7. Klick auf **„Mikro deaktivieren"** → Tracks gestoppt, Mic-Indikator erlischt, Bar auf 0,
   Anzeigen leeren sich. Es wird **nichts** mehr aufgenommen.

## Akzeptanzkriterien

### AC1 — Pure Note-Mathematik (`noteMath.ts`)
- `hzToNote(440)` liefert `{ name: 'A', octave: 4, cents: 0 }`.
- `hzToNote(880)` → `A5`; `hzToNote(261.63)` ≈ `C4`; Cents-Abweichung wird korrekt gerundet (±50¢).
- `hz <= 0` oder `NaN` liefert `null` (kein Wurf).

### AC2 — Tonart aus Chroma (`noteMath.ts`)
- `estimateKey(chroma)` mit einem 12-Bin-Chroma, das eine C-Dur-Tonleiter betont, liefert
  `{ tonic: 'C', mode: 'major' }`.
- Ein a-moll-betontes Chroma liefert `{ tonic: 'A', mode: 'minor' }`.
- Verwendet Krumhansl-Schmuckler-Profile, rotiert über alle 12 Tonika, max. Korrelation gewinnt.

### AC3 — Akkord aus Chroma (`noteMath.ts`, experimentell)
- `estimateChord(chroma)` mit aktiven Tönen C-E-G liefert `{ root: 'C', quality: 'major' }`.
- A-C-E liefert `{ root: 'A', quality: 'minor' }`.
- Unklares/flaches Chroma (alle Bins ähnlich) liefert `null` (keine Falschanzeige).

### AC4 — Lautstärke-Berechnung (`levelMeter.ts`)
- `rms(samples)` einer Stille (alle 0) ist `0`; eines Vollausschlags-Sinus ~`0.707`.
- `rmsToBarRatio(rms)` ist auf `[0,1]` geklemmt und steigt monoton mit dem Pegel.

### AC5 — Aktivierungs-Gate (`micCapture.ts`, Browser-verifiziert)
- Vor Aktivierung existiert kein aktiver `MediaStreamTrack` (kein Mic-Indikator).
- Nach „aktivieren" liefert `getUserMedia` einen laufenden Track; nach „deaktivieren" ist
  `track.readyState === 'ended'` und der Mic-Indikator erlischt.
- Die Logik ist per Unit-Test mit Spies abgesichert (kein echtes Mic im Test).

### AC6 — Listener-Panel UI (`ListenerPanel.ts`)
- Initial ist die Bar bei 0 und die Anzeige leer; der Toggle hat `aria-pressed="false"`.
- Nach Aktivierung wechselt `aria-pressed="true"` und der Button-Text auf den aktiven Zustand.
- Bei eingespeistem Signal (im Browser) bewegt sich die Bar und die Note-Anzeige zeigt einen Wert.
- Nach Deaktivierung steht die Bar wieder auf 0 und die Anzeigen sind leer.

### AC7 — Architektur-Invariante
- `npx tsc --noEmit` ist sauber; `npm test` bleibt grün.
- `SongRenderer.ts`, `SlideView.ts`, `EagleView.ts`, `viewSwitcher.ts`, `transpose.ts` sind
  **unverändert** (Listener ist rein additiv).

## Out of Scope

- Speichern/Exportieren der Aufnahme als Audiodatei.
- Akkorderkennung in Studioqualität aus dem vollen Bandmix (bewusst „best effort").
- Tonart-bewusste enharmonische Schreibweise (Anzeige nutzt Sharps als Default).
- Automatisches Mitsetzen der Song-Tonart in der App basierend auf Erkennung (separate Idee).
