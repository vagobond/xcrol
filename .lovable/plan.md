

## Remove Audio System — Scope & Impact

### What gets removed

The audio system is self-contained and only used in two places:

1. **`src/components/AudioMuteButton.tsx`** — The speaker icon in the header. Only imported by `AppHeader.tsx`.
2. **`src/pages/Welcome.tsx`** — ~50 lines of audio setup code: preloading `Skyforge_Citadel.mp3`, autoplay attempts, interaction listeners, mute-state listeners, and the `audioRef`.
3. **Static audio file**: `public/audio/Skyforge_Citadel.mp3` — can be deleted to save bundle/load time.

No other components reference `audio-mute-changed`, `AudioMuteButton`, or `Skyforge_Citadel`.

### What stays unchanged

- `public/audio/The_Hollow_Road.m4a` — not referenced by any code currently, but won't be touched unless you say so.
- The scroll-opening GIF animation on the Welcome page stays intact.

### Performance benefit

The MP3 file is preloaded on every Welcome page visit via `audio.preload = "auto"`, consuming bandwidth and delaying interactivity. Removing it eliminates that network request entirely.

### Changes

| File | Change |
|---|---|
| `src/components/AppHeader.tsx` | Remove `AudioMuteButton` import and `<AudioMuteButton />` |
| `src/components/AudioMuteButton.tsx` | Delete file |
| `src/pages/Welcome.tsx` | Remove all audio-related state, refs, effects (~50 lines) |
| `public/audio/Skyforge_Citadel.mp3` | Delete file |

