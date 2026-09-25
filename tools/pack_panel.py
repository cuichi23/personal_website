#!/usr/bin/env python3
"""Encrypt one realm of gated pages into the payloads the site ships.

    python3 tools/pack_panel.py --realm anabrid
    python3 tools/pack_panel.py --realm oscillatory-computing
    python3 tools/pack_panel.py --list

This repository is public. Anything committed to it is readable by anyone who
guesses a URL, and stays readable in the history, in forks and in caches after
it is deleted. So everything that must not be read yet is encrypted here and
decrypted in the reader's browser only after the password is entered.

That is two things per page, not one. The applet, where there is one, is the
obvious one. The prose that describes the work is the one that is easy to
forget, because it looks like ordinary page content: an equation and three
paragraphs on a public page give away as much as a simulator does. Both go into
the same ciphertext, and media beside the page is encrypted under the same key.

**A realm is a password.** `content/gated/` holds two of them and they are
independent: Lucas Wetzel's own oscillatory-computing work, and the anabrid work
on the REDAC Technology Platform. `--realm` is therefore required whenever more
than one exists. Packing without naming one would re-key every realm at once,
and a payload re-keyed by accident is indistinguishable from a wrong password.
See `tools/gated.py` for the layout and `tools/test_gated.py` for the property.

Markdown is rendered through `build.render_markdown`, so a gated page is typeset
exactly as a public page body would be, KaTeX spans included.
"""
from __future__ import annotations

import argparse
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ROOT)
sys.path.insert(0, HERE)   # running as a script puts this here anyway; importing does not
import build  # noqa: E402  -- for the one Markdown pipeline, not a second one
import gated  # noqa: E402  -- the realms, and what each one encrypts
import password_prompt  # noqa: E402  -- one place that knows how to ask


def choose_realm(requested: str | None) -> str:
    """Name the realm to pack, or refuse rather than guess."""
    available = gated.realms()
    if not available:
        sys.exit(f"no gated sources under {os.path.relpath(gated.GATED, ROOT)}")
    if requested:
        if requested not in available:
            sys.exit(f"no such realm: {requested}\n"
                     f"  available: {', '.join(available)}")
        return requested
    if len(available) == 1:
        return available[0]
    sys.exit("more than one realm exists, so --realm is required:\n"
             + "".join(f"  --realm {name}\n" for name in available)
             + "each realm has its own password, and packing the wrong one\n"
               "would re-key pages you did not mean to touch.")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--realm", help="which set of pages to encrypt, and under "
                                        "which password. Required when several exist")
    parser.add_argument("--list", action="store_true",
                        help="show the realms and the pages each one holds, then exit")
    parser.add_argument("--password",
                        help="what a reader must type to unlock. Omit it and you "
                             "are prompted, which keeps it out of your shell history")
    parser.add_argument("--out", default=gated.STATIC,
                        help="where the payloads are written (default: static/)")
    args = parser.parse_args()

    if args.list:
        for name in gated.realms():
            pages = gated.discover(name)
            print(f"{name}  ({len(pages)} page{'s' if len(pages) != 1 else ''})")
            for page in pages:
                extras = []
                if page.panel:
                    extras.append("applet")
                if page.media:
                    extras.append(f"{len(page.media)} media")
                print(f"    {page.slug}" + (f"   [{', '.join(extras)}]" if extras else ""))
        return

    realm = choose_realm(args.realm)
    pages = gated.discover(realm)
    print(f"realm {realm}: {len(pages)} page(s) — "
          + ", ".join(page.slug for page in pages))

    password = password_prompt.ask_to_set(args.password)
    written = gated.pack_realm(realm, password, out_dir=args.out,
                               render=build.render_markdown)

    payloads = [p for p in written if p.endswith("payload.json")]
    media = [p for p in written if p.endswith(".enc")]
    for path in payloads:
        print(f"  wrote {os.path.relpath(path, ROOT)} "
              f"({os.path.getsize(path):,} bytes, AES-256-GCM)")
    if media:
        total = sum(os.path.getsize(p) for p in media)
        print(f"  wrote {len(media)} encrypted media file(s), {total:,} bytes total")
    print("the password is not stored anywhere in this repository")
    print(f"only realm '{realm}' was touched; every other realm keeps its own password")


if __name__ == "__main__":
    main()
