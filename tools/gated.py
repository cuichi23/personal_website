#!/usr/bin/env python3
"""The gated realms: what is encrypted, under which password, and where it lands.

A **realm** is a set of gated pages that share one password and one derived key.
This repository has two, and they are deliberately independent:

    content/gated/
      oscillatory-computing.md   realm "oscillatory-computing": Lucas Wetzel's
      panel.html                 own research, one page with an applet
      anabrid/                   realm "anabrid": work on the REDAC Technology
        bms/                     Platform, one directory per project
        gate-based-qc/
        ...

Independence is the point, not a detail. Repacking one realm must never rewrite
another realm's payload or ask for its password, because a payload silently
re-keyed is indistinguishable from a wrong password, and this repository has
already paid for that failure once. `tools/test_gated.py` holds that property
down with a test.

Each page becomes `static/tools/<slug>/payload.json`, encrypted with AES-256-GCM
under a key derived from the realm's password with PBKDF2. Media beside a page
becomes `static/media-enc/<slug>/<name>.enc`, encrypted with the *same* key so
the reader's one password opens both, and carrying its own 12-byte nonce as a
header so the file is self-describing.

Media is encrypted separately rather than inlined for one reason worth stating.
A payload is rewritten in full on every repack, because a new salt makes entirely
new ciphertext that no version-control system can delta-compress. Inlining ten
megabytes of video would therefore add ten megabytes to the repository's history
every time a sentence changed. Keeping media in its own files means a prose fix
repacks the prose.
"""
from __future__ import annotations

import base64
import glob
import hashlib
import json
import os
import re
from dataclasses import dataclass, field
from typing import Callable, Optional

from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GATED = os.path.join(ROOT, "content", "gated")
STATIC = os.path.join(ROOT, "static")

ITERATIONS = 310_000  # OWASP's 2023 floor for PBKDF2-HMAC-SHA256
NONCE_BYTES = 12
PAYLOAD_VERSION = 3

# The realm whose sources predate the directory layout. Its two files sit at the
# top of content/gated/ and it stays there: migrating a working, published,
# password-protected payload to gain tidiness would be a poor trade.
LEGACY_REALM = "oscillatory-computing"
LEGACY_INTRO = "oscillatory-computing.md"
LEGACY_PANEL = "panel.html"

MEDIA_SUFFIXES = (".mp4", ".webm", ".gif", ".png", ".jpg", ".jpeg", ".svg", ".webp")

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


@dataclass
class GatedPage:
    """One password-protected page: its prose, an optional applet, its media."""

    slug: str
    intro: str
    panel: Optional[str] = None
    media: list = field(default_factory=list)


def realms(gated_dir: str = GATED) -> list:
    """Every realm present on disk, by name."""
    if not os.path.isdir(gated_dir):
        return []
    found = [name for name in sorted(os.listdir(gated_dir))
             if os.path.isdir(os.path.join(gated_dir, name))]
    if os.path.isfile(os.path.join(gated_dir, LEGACY_INTRO)):
        found.append(LEGACY_REALM)
    return found


def discover(realm: str, gated_dir: str = GATED) -> list:
    """The pages a realm contains, in slug order."""
    if realm == LEGACY_REALM:
        intro = os.path.join(gated_dir, LEGACY_INTRO)
        if not os.path.isfile(intro):
            return []
        panel = os.path.join(gated_dir, LEGACY_PANEL)
        return [GatedPage(slug=LEGACY_REALM, intro=intro,
                          panel=panel if os.path.isfile(panel) else None)]

    base = os.path.join(gated_dir, realm)
    if not os.path.isdir(base):
        return []
    pages = []
    for slug in sorted(os.listdir(base)):
        project = os.path.join(base, slug)
        intro = os.path.join(project, "page.md")
        if not os.path.isfile(intro):
            continue
        panel = os.path.join(project, "panel.html")
        media_dir = os.path.join(project, "media")
        media = sorted(p for p in glob.glob(os.path.join(media_dir, "*"))
                       if p.lower().endswith(MEDIA_SUFFIXES))
        pages.append(GatedPage(slug=slug, intro=intro,
                               panel=panel if os.path.isfile(panel) else None,
                               media=media))
    return pages


def derive_key(password: str, salt: bytes) -> bytes:
    return hashlib.pbkdf2_hmac("sha256", password.encode(), salt, ITERATIONS, 32)


def _b64(raw: bytes) -> str:
    return base64.b64encode(raw).decode()


def _encrypt(key: bytes, plaintext: bytes) -> tuple:
    nonce = os.urandom(NONCE_BYTES)
    return nonce, AESGCM(key).encrypt(nonce, plaintext, None)


def pack_realm(realm: str, password: str, gated_dir: str = GATED,
               out_dir: str = STATIC, render: Optional[Callable] = None) -> list:
    """Encrypt every page in one realm. Returns what was written, for reporting.

    One salt for the realm, so the key is derived once and the reader's single
    password opens the pages and their media alike. Every page and every media
    file still gets its own nonce.
    """
    pages = discover(realm, gated_dir)
    if not pages:
        return []
    if render is None:
        raise ValueError("pack_realm needs a Markdown renderer")

    salt = os.urandom(16)
    key = derive_key(password, salt)
    written = []

    for page in pages:
        intro_md = open(page.intro, encoding="utf-8").read()
        document = {"intro": render(intro_md, page.intro)}
        if page.panel:
            document["panel"] = prepare(open(page.panel, encoding="utf-8").read())

        nonce, ciphertext = _encrypt(key, json.dumps(document).encode())
        payload = {
            "v": PAYLOAD_VERSION,
            "realm": realm,
            "kdf": {"name": "PBKDF2", "hash": "SHA-256",
                    "iterations": ITERATIONS, "salt": _b64(salt)},
            "cipher": "AES-GCM",
            "iv": _b64(nonce),
            "ct": _b64(ciphertext),
        }
        target = os.path.join(out_dir, "tools", page.slug, "payload.json")
        os.makedirs(os.path.dirname(target), exist_ok=True)
        with open(target, "w", encoding="utf-8") as fh:
            json.dump(payload, fh)
        written.append(target)

        for source in page.media:
            raw = open(source, "rb").read()
            nonce, ciphertext = _encrypt(key, raw)
            enc_path = os.path.join(out_dir, "media-enc", page.slug,
                                    os.path.basename(source) + ".enc")
            os.makedirs(os.path.dirname(enc_path), exist_ok=True)
            with open(enc_path, "wb") as fh:
                fh.write(nonce + ciphertext)
            written.append(enc_path)

    return written


def open_payload(payload: dict, password: str) -> Optional[dict]:
    """The decrypted document, or None when the tag rejects the key."""
    key = derive_key(password, base64.b64decode(payload["kdf"]["salt"]))
    try:
        plain = AESGCM(key).decrypt(base64.b64decode(payload["iv"]),
                                    base64.b64decode(payload["ct"]), None)
    except InvalidTag:
        return None
    return json.loads(plain.decode())


def open_media(blob: bytes, payload: dict, password: str) -> Optional[bytes]:
    """Decrypt one `.enc` media file against its realm's payload."""
    key = derive_key(password, base64.b64decode(payload["kdf"]["salt"]))
    try:
        return AESGCM(key).decrypt(blob[:NONCE_BYTES], blob[NONCE_BYTES:], None)
    except InvalidTag:
        return None
