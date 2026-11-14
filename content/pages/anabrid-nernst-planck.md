---
title: Ion transport on an analog computer
slug: projects-anabrid/nernst-planck
nav_order: 98
template: gated.html
gate_payload: nernst-planck
eyebrow: Projects@anabrid · ion transport with a charge-conservation constraint
summary: >-
  Two ion species diffuse and drift in an electric field that they create
  themselves. The field is fixed by a constraint, not by a differential
  equation in time. This project solves that system on the REDAC analog computer
  and measures it against solvers on a central processing unit and a graphics
  processing unit.
gate_heading: A live bench of the circuit, and what the measurements say
gate_blurb: >-
  A bench in your browser: move the diffusivity ratio, the grid size and the
  stiffness of the constraint, and watch what each circuit does to the
  solution. Next to it, the reasoning behind the circuit and the honest
  comparison with digital solvers. Unpublished, so it is kept behind a password.
---

Dissolve a salt in water and let the concentration differ from place to place.
The positive and the negative ion both diffuse. They do not diffuse at the same
speed, so one runs ahead of the other and an electric field builds up that holds
them together. The Nernst-Planck system describes this. It couples the transport
of each species to a potential, and the potential is not stepped in time. It is
whatever makes charge conservation hold at every instant.

## Why this is hard on any computer

A system with a rule that must hold at every instant, next to equations that
evolve in time, is a differential-algebraic system. A digital solver treats the
rule as a linear system to be solved at every step. An analog computer has no
step and no linear solver. It has integrators, multipliers and wires. So the
question is how to write the rule into a circuit, and what the circuit costs
once its coefficients have to fit the converters of a real machine.

## What we do

We build the circuit in more than one way, from the one that removes the
constraint by hand to the one that enforces it with a fast relaxation. We run
each against a digital reference of the same problem, so that every discrepancy
has one owner: the discretization, the relaxation, or the hardware. The same
problem is also run on a central processing unit (CPU) and on a graphics
processing unit (GPU), to put the analog result next to what a digital
solver spends.

## What it does not offer

It is not a claim of speed. Whether a circuit of this kind can beat a digital
solver on this problem is the open question, and the work is built to answer it
either way. The statements here are bound to one spatial dimension, to a salt
with two ion species, and to the REDAC installation we work with.

Behind the glass: a bench in the browser where the reader moves the diffusivity
ratio, the grid size and the stiffness of the constraint, the reasoning behind
the circuit, and the numbers, including where the method falls short. The work
is unpublished, hence the password.
