#!/usr/bin/env bash
# Does anything git would publish describe the gated work?
#
# The phrases to look for are themselves a description of the model, so they live
# in content/gated/leak-terms.txt, which .gitignore excludes. One phrase per line.
# Words that are already public elsewhere on this site, "Kuramoto" and "order
# parameter" among them, do not belong in that file: they would match the
# Ising-machines post and drown the signal.
set -u
cd "$(dirname "$0")/.." || exit 1

TERMS_FILE=content/gated/leak-terms.txt
if [ ! -f "$TERMS_FILE" ]; then
  echo "no $TERMS_FILE; nothing to check against" >&2
  exit 2
fi
TERMS=$(paste -sd'|' "$TERMS_FILE")

PUBLIC_PAGE=docs/oscillatory-computing/index.html
echo "== what a reader reaches without the password =="
for f in content/pages/oscillatory-computing.md "$PUBLIC_PAGE"; do
  n=$(grep -Eic "$TERMS" "$f" 2>/dev/null || true)
  if [ "${n:-0}" -eq 0 ]; then
    printf '  clean      %s\n' "$f"
  else
    printf '  LEAKS (%s) %s\n' "$n" "$f"
    grep -Eio "$TERMS" "$f" | sort -u | sed 's/^/               /'
  fi
done

echo
echo "== every other file git would publish =="
found=0
git ls-files --cached --others --exclude-standard | while read -r f; do
  case "$f" in
    *.jpg|*.png|*.woff2|*.pdf|*.gif|*payload.json) continue ;;
    content/pages/oscillatory-computing.md|"$PUBLIC_PAGE") continue ;;
  esac
  n=$(grep -Eic "$TERMS" "$f" 2>/dev/null || true)
  if [ "${n:-0}" -gt 0 ]; then
    printf '  LEAKS  %s\n' "$f"
    grep -Eio "$TERMS" "$f" | sort -u | sed 's/^/           /'
    found=1
  fi
done
[ "$found" -eq 0 ] && echo "  clean"

echo
echo "== ciphertext =="
printf '  plaintext matches in payload.json: %s\n' \
  "$(grep -Eic "$TERMS" static/tools/oscillatory-computing/payload.json 2>/dev/null || echo 0)"
