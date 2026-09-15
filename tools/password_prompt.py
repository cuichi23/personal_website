#!/usr/bin/env python3
"""How this repository asks for the panel password, in one place.

The packer and the checker need the same guarantee: that the bytes they hash
are the bytes the person meant to type. Nothing else protects the payload, and a
password wrong by one invisible character fails exactly like a password that is
wrong, so the mistake has to be caught at the prompt or not at all.

The trap this exists for is bracketed paste. A terminal in that mode wraps
pasted text in `ESC[200~` and `ESC[201~`; `getpass` reads the line raw and keeps
them, so the packer keys on a string twelve characters longer than the one on
screen. Asking twice does not catch it, because the same paste produces the same
wrapped string both times. The reader then types the password by hand, correctly,
and is told it is wrong -- by the packer, by the checker and by the page, none of
which can see the difference.

Nothing here strips the offending characters. A password quietly altered on the
way in is the same failure one step later, and this time with no way to find out.
"""
from __future__ import annotations

import getpass
import sys
import unicodedata

NO_TERMINAL = (
    "there is no terminal here to type a password into.\n"
    "`getpass` falls back to reading standard input with the echo left ON,\n"
    "which would put the password on screen and into whatever is capturing\n"
    "this output. Run this in a terminal window instead. Nothing was written.")

MIN_LENGTH = 12
# Beyond any passphrase anyone types. Past this it is pasted text.
MAX_LENGTH = 128

# What a terminal wraps pasted text in when bracketed paste is on.
PASTE_MARKERS = ("\x1b[200~", "\x1b[201~")


def _read(prompt: str) -> str:
    """Read one password from a terminal, or refuse when there is not one.

    Refusing beats echoing. `getpass` warns and falls back to plain input when
    it cannot reach a terminal, which is a reasonable default for a throwaway
    login and the wrong one for the single secret protecting a payload that is
    published permanently.
    """
    if not sys.stdin.isatty():
        sys.exit(NO_TERMINAL)
    try:
        return getpass.getpass(prompt)
    except EOFError:
        sys.exit(NO_TERMINAL)


def reject_if_unusable(password: str) -> None:
    """Stop if what arrived cannot be what someone meant to type.

    Three ways a paste goes wrong, in decreasing order of how obvious they are
    afterwards. Only the first leaves a mark you could find by eye.
    """
    if len(password) > MAX_LENGTH:
        sys.exit(
            f"that is {len(password):,} characters, which is a pasted block and\n"
            "not a password. Something other than the password reached the\n"
            "prompt, usually a paste that swallowed the text around it.\n"
            "Type it by hand. Nothing was written.")

    if any(marker in password for marker in PASTE_MARKERS):
        sys.exit(
            "that password arrived wrapped in your terminal's bracketed-paste\n"
            "markers, so it is not the password you can see. Type it by hand,\n"
            "or turn bracketed paste off for the paste. Nothing was written.")

    control = {c for c in password if unicodedata.category(c) == "Cc"}
    if control:
        names = ", ".join(sorted(f"U+{ord(c):04X}" for c in control))
        sys.exit(
            f"that password contains control characters ({names}), which you\n"
            "cannot see and cannot retype reliably. Usually a paste artefact.\n"
            "Type it by hand. Nothing was written.")


def reject_if_too_short(password: str) -> None:
    """Stop if the password is below the floor for a payload published forever.

    Only applies when setting one. An existing password is whatever it is.
    """
    if len(password) < MIN_LENGTH:
        sys.exit(f"password too short: use at least {MIN_LENGTH} characters. "
                 "Several unrelated words beat one clever one.")


def ask_to_set(preset: str | None = None) -> str:
    """Read a password to encrypt with, from the terminal or from argv.

    A password passed as an argument is written to the shell history file and is
    visible in the process list while the script runs. Neither is acceptable for
    the one secret protecting everything in the payload, which is why the prompt
    is the default and `preset` exists only for a script that has no terminal.
    """
    if preset is not None:
        reject_if_unusable(preset)
        reject_if_too_short(preset)
        return preset

    first = _read("Password for the panel: ")
    reject_if_unusable(first)
    if first != first.strip():
        sys.exit("that password starts or ends with whitespace, which you cannot\n"
                 "see and will not reproduce by hand. Nothing was written.")
    if first != _read("Again: "):
        sys.exit("the two entries differ; nothing was written")
    reject_if_too_short(first)
    return first


def ask_to_open(prompt: str = "Password: ") -> str:
    """Read an existing password. No length floor: it is whatever it already is."""
    password = _read(prompt)
    reject_if_unusable(password)
    return password
