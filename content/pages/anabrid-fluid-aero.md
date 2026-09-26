---
title: Fluid and aerodynamics on a physical computer
slug: projects-anabrid/fluid-aero
nav_order: 99
template: gated.html
gate_payload: fluid-aero
eyebrow: Projects@anabrid · work in progress
summary: >-
  Gas in an engine runner, driven by a valve that slams open once per cycle.
  A one-dimensional problem with a fast, broadband boundary, which is the shape
  of problem a continuous machine should be good at and a stepped one is not.
gate_heading: The compiled runs and how they scale
gate_blurb: >-
  What was compiled, what it cost in hardware, how the time-scale mechanism was
  set, and how the element budget and the bandwidth demand grow with the mesh.
  Unpublished, so it is kept behind a password.
---

An engine breathes through pipes. A valve at one end of the intake or exhaust
runner opens and shuts once per cycle. Each event launches a pressure wave that
runs the length of the duct at the speed of sound, steepens as it goes, and
reflects off the far end. Whether the returning wave arrives in time to help or
to hinder the next cylinder filling is what engine designers call tuning. It is
why one-dimensional unsteady gas dynamics is still a working tool rather than a
textbook exercise.

## Why this problem and not a prettier one

The valve is the point. It is a genuinely fast boundary condition: steep opening
and closing flanks, injecting broadband content with high harmonics, over and
over. The whole time history matters, not a converged steady state, which makes
this transient computational fluid dynamics in the strict sense.

A stepped solver has to resolve the fastest thing present, everywhere, for the
whole run. A machine that integrates continuously does not have a time step to
choose. That makes a fast-driven duct the natural place to ask whether the
difference is worth anything. It is a far better test than a steady flow, which
any method handles.

## The reduction

The honest model is the full one-dimensional unsteady compressible Euler system
with wall friction and heat transfer. For a single running wave of weak to
moderate amplitude, the weakly nonlinear reduction collapses that to the viscous
Burgers equation,

$$
\frac{\partial u}{\partial t} + \lambda\,u\,\frac{\partial u}{\partial x}
= \nu_{\text{eff}}\,\frac{\partial^{2} u}{\partial x^{2}},
\qquad x \in (0, L),
$$

with $\lambda = (\gamma+1)/2 \approx 1.2$ for air, and $\nu_{\text{eff}}$ a
lumped effective diffusivity standing for thermoviscous losses plus wall
friction rather than molecular viscosity. Burgers is the canonical scalar model
of wave action in a duct. It carries nonlinear steepening regularised by
dissipation, and it is not the engine.

## The boundaries are the interesting part

At the valve end the velocity is prescribed, $u(0,t) = U_v(t)$, a sharp periodic
pulse: near zero while shut, fast rise, fast fall. Rather than switch it with a
comparator, the pulse is synthesised as a truncated Fourier series from a bank
of linear oscillators, two integrators each. Five to eight harmonics give a
sharp enough flank. The generator is part of the circuit, made of the same
elements as the duct.

At the far end the wall is closed and reflecting, $u(L,t) = 0$, which is what
produces the rich tuning transients worth looking at. The string starts at rest.

## What it costs to be a circuit

Discretise space by the method of lines. Each interior node becomes one
integrator, and because the advection term is $u\,\partial_x u$, each node also
needs one multiplier. That pairing is the binding constraint. A cluster offers
eight integrators and four multipliers, so the multipliers run out first and a
cluster holds four nodes, not eight.

Two things then have to be checked before anything is compiled. Central
differencing of the advection term needs the mesh Reynolds number to stay at or
below two, which bounds how coarse the grid may be for a given flow. And the
diffusive and advective coefficients differ in size, so the ratio between them
has to fit inside what the coefficient lanes and the machine's time-scale
mechanism can span together.

That second point is the real subject here. A driven, stiff chain asks the
hardware for two very different rates at once. How much of that spread the
machine can hold decides how fine the mesh can get. We have compiled and run
this, measured what it takes, and swept the mesh to see how the demand grows.
The numbers are behind the password.
