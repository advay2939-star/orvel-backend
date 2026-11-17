#!/bin/bash
# ingest.sh <NN> <slug> <zipbytes> : pick up the browser download of that exact size, verify, extract
NN="$1"; SLUG="$2"; BYTES="$3"; R="$HOME/mnt/Desktop/Orvel/8-reels"; D="$HOME/mnt/Downloads"
src=""
for i in $(seq 1 20); do
  src=$(find "$D" -maxdepth 1 -type f \( -name "orvel-flow-$NN*.zip" -o -name ".*claudefordesktop*" \) -size "${BYTES}c" | head -1)
  [ -n "$src" ] && break; sleep 3
done
[ -z "$src" ] && { echo "NOT FOUND size=$BYTES"; exit 1; }
cp "$src" "$R/_incoming/$NN.zip"
python3 - "$R/_incoming/$NN.zip" "$R/${NN}_$SLUG/raw/_flow" <<'PY'
import sys, zipfile, os
z = zipfile.ZipFile(sys.argv[1]); bad = z.testzip()
print("crc:", "OK" if bad is None else "BAD "+bad, "| files:", len(z.namelist()))
os.makedirs(sys.argv[2], exist_ok=True); z.extractall(sys.argv[2])
PY
cd "$R/${NN}_$SLUG/raw/_flow"
for f in *.mp4; do printf "%s  " "$f"; ffprobe -v error -show_entries stream=codec_type,width,height,r_frame_rate,duration -of csv=p=0 "$f" | tr '\n' ' '; echo; done
ls *.jpg | wc -l | sed 's/^/jpgs: /'
