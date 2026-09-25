#!/usr/bin/env python3
"""Does this password actually open these pages, here or on the live site?

    python3 tools/check_panel.py --realm anabrid      # every page in one realm
    python3 tools/check_panel.py --slug bms           # one page
    python3 tools/check_panel.py --realm anabrid --live   # what lucaswetzel.de serves

The packer writes `static/`. Only `build.py` copies that into `docs/`, and
`docs/` is what GitHub Pages serves. Re-key without rebuilding and the site goes
on serving the previous ciphertext, so a correct password is reported as wrong by
a page that cannot tell the difference. This answers the question directly, on
whichever copy actually matters, before a push rather than after one.

With two realms in play it answers a second question too: whether the password
you just used belongs to the realm you think it does. A realm's pages all open
with one password, and no page from another realm opens with it at all.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import gated  # noqa: E402  -- the realms and the decryption
import password_prompt  # noqa: E402  -- the same prompt the packer uses

BUILT = os.path.join(ROOT, "docs")
LIVE = "https://lucaswetzel.de"


def load(source: str) -> dict:
    if source.startswith("http"):
        with urllib.request.urlopen(source, timeout=30) as response:
            return json.load(response)
    return json.load(open(source, encoding="utf-8"))


def payload_url(slug: str, live: bool) -> str:
    if live:
        return f"{LIVE}/tools/{slug}/payload.json"
    return os.path.join(BUILT, "tools", slug, "payload.json")


def slugs_to_check(args) -> list:
    if args.slug:
        return [args.slug]
    available = gated.realms()
    realm = args.realm or (available[0] if len(available) == 1 else None)
    if not realm:
        sys.exit("more than one realm exists, so --realm or --slug is required:\n"
                 + "".join(f"  --realm {name}\n" for name in available))
    if realm not in available:
        sys.exit(f"no such realm: {realm}\n  available: {', '.join(available)}")
    return [page.slug for page in gated.discover(realm)]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--realm", help="check every page in this realm")
    parser.add_argument("--slug", help="check one page by slug")
    parser.add_argument("--live", action="store_true",
                        help=f"check {LIVE} instead of the built copy")
    args = parser.parse_args()

    targets = slugs_to_check(args)
    where = "the live site" if args.live else "the built copy in docs/"
    print(f"checking {len(targets)} page(s) against {where}")

    payloads = {}
    for slug in targets:
        source = payload_url(slug, args.live)
        try:
            payloads[slug] = load(source)
        except Exception as error:
            sys.exit(f"could not read {source}\n  {error}")
        print(f"  {slug}: salt {payloads[slug]['kdf']['salt'][:12]}...")

    password = password_prompt.ask_to_open()
    opened = failed = 0
    for slug, payload in payloads.items():
        document = gated.open_payload(payload, password)
        if document is None:
            failed += 1
            print(f"  {slug}: this password does not open it")
            continue
        opened += 1
        parts = [f"{len(document.get('intro', '')):,} chars of prose"]
        if document.get("panel"):
            parts.append(f"{len(document['panel']):,} chars of panel")
        print(f"  {slug}: opens — " + ", ".join(parts))

    if failed:
        sys.exit(f"\n{failed} of {len(payloads)} did not open.\n"
                 "If you just re-keyed, run `python3 build.py` and try again:\n"
                 "the packer writes static/, and only a build reaches docs/.\n"
                 "If some opened and some did not, they are in different realms.")
    print(f"\nall {opened} page(s) open with that password")


if __name__ == "__main__":
    main()
