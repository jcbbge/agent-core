---
name: video-transcribe
description: Download a video from a URL (YouTube, Twitter/X, TikTok, or any yt-dlp supported source) and transcribe it locally using WhisperKit on Apple Silicon. Use when user drops a video link and wants a transcript, or says "transcribe this", "extract audio from", "get the transcript of".
argument-hint: <video-url> [output-path]
allowed-tools: Bash Read Write
metadata:
  author: jrg
  version: "1.0"
  tags: whisper, transcription, video, youtube, twitter, tiktok, local-llm, mlx
---

# Video Transcribe Skill

Transcribes any yt-dlp-supported video URL locally using WhisperKit (CoreML, Apple Silicon).

---

## Dependencies

| Tool | Location | Purpose |
|------|----------|---------|
| `yt-dlp` | `/opt/homebrew/bin/yt-dlp` | Download + extract audio |
| `whisperkit-cli` | `~/WhisperKit/.build/release/whisperkit-cli` | Local transcription |
| Model | `~/whisperkit-models/models/argmaxinc/whisperkit-coreml/openai_whisper-large-v3_turbo` | CoreML model |

Install yt-dlp if missing: `brew install yt-dlp`

---

## Procedure

### 1. Extract slug from URL
Use the last non-empty path segment of the URL as the filename slug.
- `https://www.tiktok.com/t/ZTkwgpy6v/` → slug = `ZTkwgpy6v`
- `https://youtu.be/dQw4w9WgXcQ` → slug = `dQw4w9WgXcQ`
- `https://twitter.com/i/status/123456` → slug = `123456`

### 2. Download audio
```bash
SLUG="<slug>"
yt-dlp --force-overwrites --no-part -x --audio-format wav -o "/tmp/${SLUG}.wav" "<URL>"
```

### 3. Transcribe
```bash
~/WhisperKit/.build/release/whisperkit-cli transcribe \
  --audio-path /tmp/${SLUG}.wav \
  --model-path ~/whisperkit-models/models/argmaxinc/whisperkit-coreml/openai_whisper-large-v3_turbo
```

### 4. Cleanup — REQUIRED after transcription
```bash
rm -f /tmp/${SLUG}.wav /tmp/${SLUG}.mp4 /tmp/${SLUG}.orig.wav
```

### 5. Output
- Drop the transcript directly in chat as an artifact
- Do NOT write to a file unless the user explicitly asks

---

## Notes

- Works with YouTube, Twitter/X, TikTok, Vimeo, and any yt-dlp-supported platform
- Runs fully offline after download — no API calls, no data leaves the machine
- Model: `openai_whisper-large-v3_turbo` via CoreML — fast on M-series Neural Engine
- **Never** use a generic shared filename — always use the URL slug. Reusing `/tmp/transcript_audio.wav` causes silent cache poisoning across sessions.
- `--force-overwrites` and `--no-part` prevent yt-dlp from serving stale cached downloads
- Always delete all temp files after transcription — no audio or video artifacts should persist
