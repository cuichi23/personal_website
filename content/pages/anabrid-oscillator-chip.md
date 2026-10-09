---
title: The oscillator AI chip
slug: projects-anabrid/oscillator-chip
nav_order: 99
template: gated.html
gate_payload: oscillator-chip
eyebrow: Projects@anabrid · digital twin measured
summary: >-
  An always-on analog pre-processor built from damped harmonic oscillator
  pairs, modelled element by element before any silicon is committed.
gate_heading: A live bench of the architecture, and what the twin measured
gate_blurb: >-
  An interactive model of the chip in your browser — the oscillator bank, the
  recurrent crossbars, the leaky read-out integrators, the two three-harmonic
  inputs — with every converter constraint enforced, plus the measured answers
  on trainability and deployability. Unpublished, so it is kept behind a
  password.
---

Most sensor data is thrown away unread. A microphone, a strain gauge or a
vibration pickup produces a continuous signal around the clock, and the
machinery that decides whether anything in it matters — an analog-to-digital
converter, a processor, a Fourier transform — burns most of a device's power
budget doing arithmetic on silence. The oscillator chip attacks that from the
physics side: let the signal run through a small bank of damped harmonic
oscillators, each one two analog integrators in a loop, and read the bank out
through integrators that average on exactly the time scale a decision needs.
Filtering, temporal accumulation and a bounded decision then happen by virtue
of the circuit obeying its own differential equation, with no clock and no
conversion until something is worth waking up for.

The hard questions are not whether such a network can classify — it can, and
the published work on harmonic oscillator recurrent networks shows it — but
what survives contact with the machine. An analog coefficient lives on a
twelve-bit converter inside a fixed range. An integrator output is clamped by
a diode limiter that stops short of the nominal rail, at a level that was
measured, not assumed.
A node's resonance frequency is set jointly by two programmable coefficients
and two discrete time-scale factors. Whether a network trained in floating
point still works once every number is forced onto that grid is a question
that deserves measurement, not argument, and it is the question the digital
twin behind this page was built to answer.

Behind the glass: a live, element-faithful model of the architecture you can
play with in the browser, and the twin's measured results on what training
inside the machine's range costs.
