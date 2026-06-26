# TICKET-001: `noteMath.ts` — pure Note-/Tonart-/Akkord-Mathematik (TDD)

**Plan:** live-audio-detection
**Depends on:** —
**Model:** Sonnet

## Ziel

Reine, Web-Audio-freie Mathematik als Fundament der Erkennung. Vollständig unit-testbar ohne
Mikrofon. Deckt Spec-ACs **AC1, AC2, AC3** ab.

## Dateien (NUR diese anfassen)

- `src/audio/noteMath.ts` — neu
- `src/audio/noteMath.test.ts` — neu (zuerst, rot)

## API

```ts
export interface NoteResult { name: string; octave: number; cents: number }
export type Mode = 'major' | 'minor';
export interface KeyResult { tonic: string; mode: Mode }
export interface ChordResult { root: string; quality: Mode }

export const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'] as const;

export function hzToNote(hz: number): NoteResult | null;
export function estimateKey(chroma: number[]): KeyResult | null;   // chroma.length === 12
export function estimateChord(chroma: number[]): ChordResult | null;
```

## Implementierungs-Hinweise

- **Hz→Note:** `midi = 69 + 12*log2(hz/440)`; `name = NOTE_NAMES[((round(midi))%12+12)%12]`;
  `octave = floor(round(midi)/12) - 1`; `cents = round((midi - round(midi))*100)`.
  `hz <= 0 || !isFinite(hz)` → `null`.
- **Krumhansl-Schmuckler-Profile** (für `estimateKey`):
  - major: `[6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88]`
  - minor: `[6.33,2.68,3.52,5.38,2.60,3.53,2.54,4.75,3.98,2.69,3.34,3.17]`
  - Für jede der 12 Tonika das Profil rotieren, Pearson-Korrelation mit `chroma` bilden,
    über major+minor das Maximum wählen → `{ tonic, mode }`. Flaches/leeres Chroma → `null`.
- **Akkord-Templates** (für `estimateChord`):
  - major-Triad (Bitmaske rel. zum Root): Indizes `{0,4,7}`; minor-Triad: `{0,3,7}`.
  - Über 12 Roots × {major,minor} korrelieren/scoren (z. B. Skalarprodukt normalisiert),
    Bestwert wählen. Schwellwert: liegt der Score zu nah am Mittel (kein klarer Peak) → `null`.

## Akzeptanzkriterien

- AC1: `hzToNote(440) → {name:'A',octave:4,cents:0}`; `880 → A5`; `261.63 ≈ C4`; `0/NaN → null`.
- AC2: C-Dur-betontes Chroma → `{tonic:'C',mode:'major'}`; a-moll-betont → `{tonic:'A',mode:'minor'}`.
- AC3: Chroma mit C-E-G → `{root:'C',quality:'major'}`; A-C-E → `{root:'A',quality:'minor'}`;
  flaches Chroma → `null`.
- `npx vitest run` grün, `npx tsc --noEmit` sauber.

## Out of Scope

- Web Audio / Mikrofon-Anbindung (TICKET-002/004).
- Enharmonische Schreibweise (immer Sharps).
- 7er-/sus-/erweiterte Akkorde (nur Dur/Moll-Triaden).

## Vorgehen

TDD: erst `noteMath.test.ts` mit obigen ACs (rot), dann implementieren bis grün. Nichts
committen, Branch nicht wechseln — der Orchestrator übernimmt Commit/Verifikation.
