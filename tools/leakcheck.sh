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

# The public half of every gated page: the source that carries the gate template,
# and the page it builds to. Naming them individually went stale the moment a
# second gated page existed, so they are discovered instead.
PUBLIC_SOURCES=$(grep -rl "template: gated.html" content/pages 2>/dev/null)
PUBLIC_BUILT=""
for src in $PUBLIC_SOURCES; do
  slug=$(sed -n 's/^slug:[[:space:]]*//p' "$src" | head -1)
  [ -n "$slug" ] && PUBLIC_BUILT="$PUBLIC_BUILT docs/$slug/index.html"
done
PUBLIC_ALL="$PUBLIC_SOURCES $PUBLIC_BUILT"

echo "== what a reader reaches without the password =="
for f in $PUBLIC_ALL; do
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
  esac
  case " $PUBLIC_ALL " in
    *" $f "*) continue ;;
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
shopt -s nullglob
payloads=(static/tools/*/payload.json)
if [ ${#payloads[@]} -eq 0 ]; then
  echo "  no payloads packed yet"
fi
for p in "${payloads[@]}"; do
  printf '  %-52s %s plaintext match(es)\n' "$p" \
    "$(grep -Eic "$TERMS" "$p" 2>/dev/null || echo 0)"
done
