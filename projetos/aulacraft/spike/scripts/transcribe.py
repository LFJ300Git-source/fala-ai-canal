"""
Transcribe narration.mp3 with word-level timestamps using Whisper.
Output: narration.json with { duration, words: [{word, start, end}] }
"""
import os
import sys
import json

os.environ["PATH"] = r"C:\ffmpeg\bin" + os.pathsep + os.environ.get("PATH", "")

import whisper

SPIKE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO = os.path.join(SPIKE_DIR, "assets", "narration.mp3")
OUTPUT = os.path.join(SPIKE_DIR, "assets", "narration.json")
MODEL = "small"

print(f"Loading model '{MODEL}'...", flush=True)
model = whisper.load_model(MODEL)

print(f"Transcribing: {AUDIO}", flush=True)
result = model.transcribe(
    AUDIO,
    language="en",
    word_timestamps=True,
    verbose=False,
    fp16=False,
)

words = []
for segment in result["segments"]:
    for w in segment.get("words", []):
        words.append({
            "word": w["word"].strip(),
            "start": float(w["start"]),
            "end": float(w["end"]),
        })

duration = words[-1]["end"] if words else 0.0

payload = {
    "duration": duration,
    "text": result["text"].strip(),
    "words": words,
}

with open(OUTPUT, "w", encoding="utf-8") as f:
    json.dump(payload, f, ensure_ascii=False, indent=2)

print(f"OK — {len(words)} words, {duration:.2f}s")
print(f"Saved to: {OUTPUT}")
