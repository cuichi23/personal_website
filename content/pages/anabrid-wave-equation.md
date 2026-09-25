---
title: The wave equation on strings
slug: projects-anabrid/wave-equation
nav_order: 99
template: gated.html
gate_payload: wave-equation
eyebrow: Projects@anabrid · work in progress
summary: >-
  A plucked string is the simplest system that carries a wave, and the only one
  of these problems with an exact solution to be wrong against. That makes it
  the machine's report card rather than its demonstration.
gate_heading: What the machine did with it
gate_blurb: >-
  The measured run: the dispersion relation, the spectrum against the analytic
  solution, where the error sits in space and in time, and the string as sound.
  Unpublished, so it is kept behind a password.
---

Every other problem in this section is hard because nobody knows the answer.
This one is useful for the opposite reason. A string clamped at both ends and
released from rest has an exact solution, written down in the nineteenth
century, and any machine claiming to solve it can be checked against the truth
rather than against another solver.

## The equation

A displacement $u(x,t)$ on a string under tension obeys

$$
\frac{\partial^{2} u}{\partial t^{2}} = c^{2}\,\frac{\partial^{2} u}{\partial x^{2}},
$$

with $c$ the wave speed set by tension and mass per unit length. Clamp both ends,

$$
u(0,t) = 0, \qquad u(L,t) = 0,
$$

pull the string into a corner and let go, and the motion is a sum of standing
modes whose frequencies are exact integer multiples of $c/2L$. That integer
relationship is why a string sounds like a note rather than a noise, and it is
the thing a discretised solver gets wrong first.

## What discretisation does to it

Cut the string into $N$ nodes a distance $h$ apart and replace the spatial
derivative with its three-point difference. Each node becomes a second-order
oscillator driven by its two neighbours,

$$
\ddot{u}_j = \frac{c^{2}}{h^{2}}\left( u_{j-1} - 2u_j + u_{j+1} \right),
$$

which on the machine is a pair of integrators per node, one carrying velocity
and one carrying position, wired to the neighbours through a tridiagonal
stencil. No multipliers: the wave equation is linear, so the whole string is
integrators and coefficients.

The discretisation exacts a price, and it is a specific and predictable one. The
modes of the chain are no longer exact integer multiples of the fundamental. The
higher the mode, the further it falls below where it should be. This is
**numerical dispersion**, and it is not a bug in the solver. It is what
replacing a derivative by a difference does, on any machine.

That makes dispersion the right thing to measure. It is a known, calculable
disagreement between the chain and the continuum, so anything on top of it
belongs to the hardware. A string is a spectrometer for a solver's errors.

## Why put it on an analog computer

The chain is exactly the shape the machine likes: linear, local, and built from
integrators. It also has the property this section keeps returning to, which is
a quantity that ought to be conserved. An undamped string cannot lose energy. If
the circuit's string decays, the circuit is wrong, and by how much is a number.

And a string has one output no other problem here has. It can be played. The
node traces are a pressure signal, so the machine's answer can be listened to
next to the analytic one.

We have run this: a plucked string on the hardware, against both the discrete
and the continuous analytic solutions, with the dispersion relation, the
spectrum and the error maps measured, and the result rendered as sound. What
came out is behind the password.
