#!/usr/bin/env python3
"""Does this password actually open the panel, here or on the live site?

    python3 tools/check_panel.py                 # the built copy in docs/
    python3 tools/check_panel.py --live          # what lucaswetzel.de serves

The packer writes `static/`. Only `build.py` copies that into `docs/`, and
`docs/` is what GitHub Pages serves. Re-key without rebuilding and the site goes
on serving the previous ciphertext, so a correct password is reported as wrong by
a page that cannot tell the difference. This answers the question directly, on
whichever copy actually matters, before a push rather than after one.
"""
from __future__ import annotations

import argparse
import base64
import getpass
import hashlib
import json
import os
import sys
import urllib.request

from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUILT = os.path.join(ROOT, "docs", "tools", "oscillatory-computing", "payload.json")
LIVE = "https://lucaswetzel.de/tools/oscillatory-computing/payload.json"


def load(source: str) -> dict:
    if source.startswith("http"):
        with urllib.request.urlopen(source, timeout=30) as response:
            return json.load(response)
    return json.load(open(source, encoding="utf-8"))


def open_payload(payload: dict, password: str) -> dict:
    raw = lambda field: base64.b64decode(field)
    key = hashlib.pbkdf2_hmac("sha256", password.encode(),
                              raw(payload["kdf"]["salt"]),
                              payload["kdf"]["iterations"], 32)
    plain = AESGCM(key).decrypt(raw(payload["iv"]), raw(payload["ct"]), None)
    return json.loads(plain.decode())


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--live", action="store_true",
                        help=f"check {LIVE} instead of the built copy")
    parser.add_argument("--source", help="a payload path or URL of your own")
    args = parser.parse_args()

    source = args.source or (LIVE if args.live else BUILT)
    try:
        payload = load(source)
    except Exception as error:
        sys.exit(f"could not read {source}\n  {error}")

    label = source if source.startswith("http") else os.path.relpath(source, ROOT)
    print(f"checking {label}")
    print(f"  salt {payload['kdf']['salt']}  ({payload['kdf']['iterations']:,} iterations)")

    try:
        opened = open_payload(payload, getpass.getpass("Password: "))
    except InvalidTag:
        sys.exit("  this password does not open that payload.\n"
                 "  If you just re-keyed, run `python3 build.py` and try again:\n"
                 "  the packer writes static/, and only a build reaches docs/.")

    print(f"  opens: {len(opened.get('intro', '')):,} chars of prose, "
          f"{len(opened.get('panel', '')):,} chars of panel")


if __name__ == "__main__":
    main()
