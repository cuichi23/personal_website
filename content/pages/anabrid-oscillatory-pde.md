---
title: Solving PDEs with oscillator networks
slug: projects-anabrid/oscillatory-pde
nav_order: 99
template: gated.html
gate_payload: oscillatory-pde
eyebrow: Projects@anabrid · joint work with the Deutsche Telekom Chair at TU Dresden, LMU and TUM
summary: >-
  A network of damped oscillators, trained on the residual of a partial
  differential equation and not on data, and what it takes to run it on the
  REDAC analog computer. The test problem is the viscous Burgers equation.
gate_heading: A live bench of the trained network, and what the digital twin measured
gate_blurb: >-
  A bench in your browser: one oscillator node, the filter bank behind the
  network, the trained network replayed along its path, and a cost card for the
  analog circuit. Next to it, the accuracy numbers and the honest comparison with
  a digital run. Unpublished, so it is kept behind a password.
---

A partial differential equation (PDE) is usually solved by stepping it in time
on a grid. This project asks a different question. Can a small network of
physical oscillators learn the solution, so that the solution is a signal the
network produces while it is driven along a path?

## The network

The network is a harmonic oscillator recurrent network (HORN). It is a
bank of damped harmonic oscillators. Each has its own resonance frequency and
its own damping, which is the heterogeneity. The oscillators are coupled to each
other through a nonlinear feedback, and a linear read-out turns their states
into one number. Driven by a signal, the bank acts as a set of resonant filters
with a fading memory. The read-out combines what the filters remember.

## Training on the equation, not on data

Nothing is fitted to measured solutions. We write down the PDE and ask the
network to satisfy it at a set of collocation points, plus its initial and
boundary conditions. The loss is the residual of the equation. This is the idea
behind physics-informed training, with an oscillator network as the function
class instead of a feed-forward one. The exact solution is used only afterwards,
to score the result.

## The test problem

The test problem is the viscous Burgers equation. A velocity profile steepens
under its own transport, and viscosity smooths the steepest part into a front of
finite width. The equation is nonlinear, it has a known exact solution, and the
front is hard for any coarse grid. That makes it a fair test of a solver.

## One path through the grid

An oscillator network is driven by a signal in time. A field has two coordinates.
The two are joined by a path. The collocation grid is visited along a serpentine,
left to right on one time row, right to left on the next. At every grid point the
network is driven with the coordinates of that point, and its read-out gives the
field value there. The field is the signal along the path, laid back onto the
grid.

## What an analog computer has to offer

The oscillator bank is a physical object here. Two integrators in a loop make one
damped oscillator, and the REDAC has many integrators. The path is continuous and
has no step-size limit. The memory of the network is the memory of the circuit, so
it can be measured rather than only simulated. And part of the nonlinearity the
network needs comes with the hardware.

## What it does not offer

It is not a shortcut. Training stays on a digital computer. The weights have to
survive the converters, the coefficient range and the spread between components.
Today we have a digital twin of the circuit and measurements of its parts, and we
have not found a gain in speed or energy over a laptop for this problem on the
present machine. We say so because the question is open, not because it is
settled in favor of the hardware. The claims on this page are bound to the Burgers
problem and to the REDAC installation we work with.

Behind the glass: a live bench of the trained network and of the analog circuit's
cost, and the numbers the digital twin measured, including where the method falls
short.

Joint work in the gAIn collaboration (6G-life): Juan Esteban, Cyrill Burth, Juan
Cabrera, Lucas Wetzel, et al.
