#!/usr/bin/env bash
# Open the 100xDevs revision notes in your browser (macOS/Linux).
DIR="$(cd "$(dirname "$0")" && pwd)"
FILE="$DIR/out/revision.html"
if [ ! -f "$FILE" ]; then
  echo "[!] Output not built yet. Run: npm install && npm run build"
  exit 1
fi
case "$(uname)" in
  Darwin) open "$FILE" ;;
  *) xdg-open "$FILE" ;;
esac
