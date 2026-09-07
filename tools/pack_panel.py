#!/usr/bin/env python3
"""Encrypt the gated Oscillatory computing panel into the payload the site ships.

    python3 tools/pack_panel.py          # prompts for the password

Both plaintext sources default to `content/gated/`, which `.gitignore` excludes:
`panel.html` is the simulator and `oscillatory-computing.md` is the prose above
it. Keep the master copies wherever the research lives and refresh those two
files when either changes. Only the ciphertext under `static/tools/` is ever
committed.

This repository is public. Anything committed to it is readable by anyone who
guesses a URL, and stays readable in the history, in forks and in caches after
it is deleted. So everything that must not be read yet is encrypted here and
decrypted in the reader's browser only after the password is entered.

That is two things, not one. The applet is the obvious one. The prose that
describes the model is the one that is easy to forget, because it looks like
ordinary page content: an equation and three paragraphs on a public page give
away as much as the simulator does. Both go into the same ciphertext.

The intro is Markdown, rendered here through `build.render_markdown` so that it
is typeset exactly as a page body would be, KaTeX spans included. Its source
belongs in `content/gated/`, which `.gitignore` excludes.

The output is `static/tools/oscillatory-computing/payload.json`, which `build.py`
copies to the site root like any other static file. What ships is ciphertext
plus the salt and nonce needed to derive the key again. The password itself is
never written anywhere.
"""
from __future__ import annotations

import argparse
import base64
import getpass
import hashlib
import json
import os
import re
import sys

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
import build  # noqa: E402  -- for the one Markdown pipeline, not a second one

OUT_DIR = os.path.join(ROOT, "static", "tools", "oscillatory-computing")
GATED = os.path.join(ROOT, "content", "gated")
DEFAULT_APPLET = os.path.join(GATED, "panel.html")
DEFAULT_INTRO = os.path.join(GATED, "oscillatory-computing.md")
MIN_PASSWORD = 12

# The site makes no third-party requests at page load, which is the reason it
# needs no cookie banner. The applet was written against Google's font CDN, so
# those three tags are swapped for the identical faces this domain already
# serves. See the README.
GOOGLE_FONT_TAGS = re.compile(
    r'<link[^>]*(?:fonts\.googleapis\.com|fonts\.gstatic\.com)[^>]*>\s*', re.I)
SELF_HOSTED_FONTS = '<link rel="stylesheet" href="/assets/css/fonts.css">\n'

# Reported to the parent page so the panel can size itself and hand down the
# reader's colour theme. Same bridge the other embedded tools use.
BRIDGE = """
<script>
/* Embedded in a page on this site: report our height, follow the parent's theme. */
(function () {
  if (window.parent === window) return;
  function report() {
    window.parent.postMessage(
      { embedHeight: Math.ceil(document.documentElement.scrollHeight) }, "*");
  }
  window.addEventListener("message", function (event) {
    var theme = event.data && event.data.theme;
    if (theme === "light" || theme === "dark") document.documentElement.dataset.theme = theme;
    else delete document.documentElement.dataset.theme;
    report();
  });
  window.addEventListener("load", report);
  window.addEventListener("resize", report);
  if (window.ResizeObserver) new ResizeObserver(report).observe(document.documentElement);
  report();
})();
</script>
"""

ITERATIONS = 310_000  # OWASP's 2023 floor for PBKDF2-HMAC-SHA256


def prepare(applet_html: str) -> str:
    """Strip the third-party font requests and add the embed bridge."""
    html, removed = GOOGLE_FONT_TAGS.subn("", applet_html)
    if removed:
        html = SELF_HOSTED_FONTS + html
        print(f"  removed {removed} Google Fonts tag(s), pointed at /assets/css/fonts.css")
    if "embedHeight" not in html:
        html = html.replace("</body>", BRIDGE + "</body>") if "</body>" in html \
            else html + BRIDGE
        print("  added the embed bridge")
    return html


def encrypt(plaintext: str, password: str) -> dict:
    salt = os.urandom(16)
    nonce = os.urandom(12)
    key = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, ITERATIONS, 32)
    ciphertext = AESGCM(key).encrypt(nonce, plaintext.encode(), None)
    b64 = lambda raw: base64.b64encode(raw).decode()
    return {
        "v": 2,
        "kdf": {"name": "PBKDF2", "hash": "SHA-256",
                "iterations": ITERATIONS, "salt": b64(salt)},
        "cipher": "AES-GCM",
        "iv": b64(nonce),
        "ct": b64(ciphertext),
    }


def ask_for_password() -> str:
    """Read the password from the terminal rather than from argv.

    A password passed as an argument is written to the shell history file and is
    visible in the process list while the script runs. Neither is acceptable for
    the one secret protecting everything in the payload.
    """
    first = getpass.getpass("Password for the panel: ")
    if first != getpass.getpass("Again: "):
        sys.exit("the two entries differ; nothing was written")
    return first


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--applet", default=DEFAULT_APPLET,
                        help="the self-contained applet HTML "
                             "(default: content/gated/panel.html)")
    parser.add_argument("--intro", default=DEFAULT_INTRO,
                        help="Markdown shown above the panel once unlocked "
                             "(default: content/gated/oscillatory-computing.md)")
    parser.add_argument("--password",
                        help="what a reader must type to unlock. Omit it and you "
                             "are prompted, which keeps it out of your shell history")
    parser.add_argument("--out", default=OUT_DIR)
    args = parser.parse_args()

    for label, path in (("applet", args.applet), ("intro", args.intro)):
        if not os.path.isfile(path):
            sys.exit(f"no such {label}: {os.path.relpath(path, ROOT)}")

    password = args.password or ask_for_password()
    if len(password) < MIN_PASSWORD:
        sys.exit(f"password too short: use at least {MIN_PASSWORD} characters. "
                 "Several unrelated words beat one clever one.")

    source = open(args.applet, encoding="utf-8").read()
    print(f"read {os.path.relpath(args.applet)} ({len(source):,} bytes)")
    intro_md = open(args.intro, encoding="utf-8").read()
    print(f"read {os.path.relpath(args.intro, ROOT)} "
          f"({len(intro_md.split()):,} words)")

    document = json.dumps({
        "intro": build.render_markdown(intro_md, source=args.intro),
        "panel": prepare(source),
    })
    payload = encrypt(document, password)

    os.makedirs(args.out, exist_ok=True)
    target = os.path.join(args.out, "payload.json")
    with open(target, "w", encoding="utf-8") as fh:
        json.dump(payload, fh)
    print(f"wrote {os.path.relpath(target, ROOT)} "
          f"({os.path.getsize(target):,} bytes, AES-256-GCM)")
    print("the password is not stored anywhere in this repository")
    print("the intro prose is inside the ciphertext, not on the public page")


if __name__ == "__main__":
    main()
