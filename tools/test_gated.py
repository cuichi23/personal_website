#!/usr/bin/env python3
"""Tests for the gated realms: discovery, packing, and realm independence.

    python3 tools/test_gated.py

The test that matters is `realms stay independent`. Two realms mean two
passwords, and the whole point of separating them is that repacking one cannot
disturb the other. If that ever broke, editing a battery page would silently
re-key the oscillatory-computing panel, and the failure would surface later as a
correct password being reported as wrong, which is the one failure this
repository has already paid for once.

Everything runs against a scratch tree under /tmp. Nothing here touches
`content/gated/` or `static/`.
"""
from __future__ import annotations

import base64
import json
import os
import shutil
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
sys.path.insert(0, ROOT)

import gated  # noqa: E402

FAILURES = 0


def check(name: str, condition: bool, detail: str = "") -> None:
    global FAILURES
    if condition:
        print("  pass  " + name)
    else:
        FAILURES += 1
        print("  FAIL  " + name + ("   " + detail if detail else ""))


def build_tree(base: str) -> str:
    """A scratch content/gated/ with both realm shapes in it."""
    gated_dir = os.path.join(base, "gated")
    os.makedirs(gated_dir)

    # Legacy realm: two files at the top level, one page.
    with open(os.path.join(gated_dir, "oscillatory-computing.md"), "w") as fh:
        fh.write("the prose above the panel\n")
    with open(os.path.join(gated_dir, "panel.html"), "w") as fh:
        fh.write('<title>applet</title>\n'
                 '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=X">\n')

    # Directory realm: one folder per project.
    for slug in ("bms", "wave-equation"):
        project = os.path.join(gated_dir, "anabrid", slug)
        os.makedirs(os.path.join(project, "media"))
        with open(os.path.join(project, "page.md"), "w") as fh:
            fh.write(f"# {slug}\n\nwhat this project found\n")
        with open(os.path.join(project, "media", "clip.mp4"), "wb") as fh:
            fh.write(b"\x00\x00\x00\x18ftypmp42" + os.urandom(2048))
    return gated_dir


def main() -> None:
    base = tempfile.mkdtemp(prefix="gated-test-")
    try:
        gated_dir = build_tree(base)
        out = os.path.join(base, "out")

        print("gated realms — discovery")
        found = sorted(gated.realms(gated_dir))
        check("both realms are discovered", found == ["anabrid", "oscillatory-computing"],
              str(found))

        legacy = gated.discover("oscillatory-computing", gated_dir)
        check("the legacy realm yields one page", len(legacy) == 1, str(len(legacy)))
        check("the legacy page carries its applet",
              legacy and legacy[0].panel is not None and legacy[0].slug == "oscillatory-computing")

        anabrid = gated.discover("anabrid", gated_dir)
        check("the directory realm yields one page per project",
              sorted(p.slug for p in anabrid) == ["bms", "wave-equation"],
              str([p.slug for p in anabrid]))
        check("a project page has no applet and one media file",
              all(p.panel is None and len(p.media) == 1 for p in anabrid))

        print("\ngated realms — packing and reading back")
        gated.pack_realm("anabrid", "anabrid-password-one", gated_dir, out,
                         render=lambda text, source: f"<p>{text.strip()}</p>")
        payload_path = os.path.join(out, "tools", "bms", "payload.json")
        check("a payload lands at tools/<slug>/payload.json", os.path.isfile(payload_path))

        document = gated.open_payload(json.load(open(payload_path)), "anabrid-password-one")
        check("the payload decrypts to its prose", "what this project found" in document["intro"],
              document.get("intro", "")[:40])
        check("a document page carries no panel", not document.get("panel"))

        enc = os.path.join(out, "media-enc", "bms", "clip.mp4.enc")
        check("the media file is encrypted alongside", os.path.isfile(enc))
        source = open(os.path.join(gated_dir, "anabrid", "bms", "media", "clip.mp4"), "rb").read()
        payload = json.load(open(payload_path))
        plain = gated.open_media(open(enc, "rb").read(), payload, "anabrid-password-one")
        check("the media decrypts to the original bytes", plain == source,
              f"{len(plain)} vs {len(source)} bytes")

        wrong = gated.open_payload(payload, "not-the-password")
        check("a wrong password opens nothing", wrong is None)

        print("\ngated realms — independence")
        gated.pack_realm("oscillatory-computing", "oscillatory-password", gated_dir, out,
                         render=lambda text, source: f"<p>{text.strip()}</p>")
        before = open(payload_path, "rb").read()
        gated.pack_realm("oscillatory-computing", "oscillatory-password-changed", gated_dir, out,
                         render=lambda text, source: f"<p>{text.strip()}</p>")
        after = open(payload_path, "rb").read()
        check("re-keying one realm leaves the other byte-identical", before == after,
              "the anabrid payload changed when oscillatory-computing was repacked")

        osc = os.path.join(out, "tools", "oscillatory-computing", "payload.json")
        opened = gated.open_payload(json.load(open(osc)), "oscillatory-password-changed")
        check("the re-keyed realm opens with its new password", opened is not None)
        panel = (opened or {}).get("panel") or ""
        check("that realm's applet survives the round trip",
              "<title>applet</title>" in panel)
        check("the applet's third-party font request is stripped before encryption",
              "fonts.googleapis.com" not in panel and "/assets/css/fonts.css" in panel)
        check("the applet gets the iframe height-and-theme bridge",
              "embedHeight" in panel)
        check("the anabrid password does not open it",
              gated.open_payload(json.load(open(osc)), "anabrid-password-one") is None)
    finally:
        shutil.rmtree(base, ignore_errors=True)

    print("\nall tests passed" if FAILURES == 0 else f"\n{FAILURES} test(s) failed")
    sys.exit(0 if FAILURES == 0 else 1)


if __name__ == "__main__":
    main()
