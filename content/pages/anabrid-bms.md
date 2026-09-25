---
title: Battery management systems
slug: projects-anabrid/bms
nav_order: 99
template: gated.html
gate_payload: bms
eyebrow: Projects@anabrid · work in progress
summary: >-
  Lithium diffusion inside a single electrode particle, solved on an analog
  computer. The equation is old and well understood. What a continuous machine
  does to it is not.
gate_heading: Measurements on the machine, and what had to be corrected
gate_blurb: >-
  Six boundary conditions measured on the machine against a digital reference
  integrated from the same source, what went wrong, and the correction that
  fixed it. Unpublished, so it is kept behind a password.
---

A battery management system has to answer a question it cannot measure: how much
lithium is actually inside the electrode particles right now. Terminal voltage
and current are what a cell exposes. The state of charge is what the controller
needs, and between the two sits a diffusion problem.

## The equation

Take one electrode particle and treat it as a sphere. Lithium moves inside it by
diffusion, so the concentration $c(\mathbf{r}, t)$ obeys Fick's second law,

$$
\frac{\partial c}{\partial t} = \nabla\cdot\left(D\,\nabla c\right).
$$

Nothing about the particle distinguishes one direction from another, and neither
does the way it is loaded: lithium arrives across the whole surface at once. So
the concentration depends on the radius alone, and in spherical coordinates the
equation collapses from three dimensions to one,

$$
\frac{\partial c}{\partial t}
= \frac{D}{r^{2}}\,\frac{\partial}{\partial r}
  \left( r^{2}\,\frac{\partial c}{\partial r} \right).
$$

The $r^{2}$ factors are not decoration. They are the geometry: a shell at radius
$r$ has area $4\pi r^{2}$, so the same flux per unit area moves more lithium
through an outer shell than an inner one. A solver that loses those factors
conserves the wrong quantity.

There is a substitution that makes this tractable. Writing $u(r,t) = r\,c(r,t)$
turns the spherical operator into the flat one,

$$
\frac{\partial u}{\partial t} = D\,\frac{\partial^{2} u}{\partial r^{2}},
$$

which is the ordinary one-dimensional diffusion equation. The geometry has not
gone away. It has moved into the boundary conditions and into the meaning of
$u$, which is worth remembering when reading a result back out.

## What the outside world does

The particle only ever touches the electrolyte at its surface, so everything the
rest of the cell does enters through one term. At the centre, symmetry fixes the
gradient at zero. At the surface, the gradient is set by the current the cell is
being asked to deliver or absorb:

$$
\left.\frac{\partial c}{\partial r}\right|_{r=0} = 0,
\qquad
\left.-D\,\frac{\partial c}{\partial r}\right|_{r=R} = \frac{j(t)}{F}.
$$

Here $j(t)$ is the current density at the particle surface and $F$ is Faraday's
constant. This is the whole coupling between one particle and the pack around
it, and it is why the single-particle picture is useful: a controller's entire
influence on this equation is one scalar function of time.

Scaling by the particle radius, with $x = r/R$ and $\tau = D t / R^{2}$, removes
$D$ and $R$ from the interior and leaves a single dimensionless problem. Only the
boundary term carries the operating conditions.

## The cases that matter

Because the outside enters through $j(t)$ alone, the interesting scenarios are
just choices of that one function.

- **No current.** $j = 0$. The particle relaxes towards a flat profile and stays
  there. Nothing should happen, which makes it the sharpest test there is: any
  drift is the solver's, not the physics'.
- **Constant current.** $j$ fixed, of either sign. Lithium is inserted or removed
  steadily, a gradient builds between surface and centre, and after a transient
  the profile advances at constant shape. Halving the rate halves the gradient.
- **Time-varying current.** A ramp, or a pulse train. These are what a vehicle
  actually does to a cell, and they are where the surface concentration departs
  furthest from the average. That gap is the physical reason a cell can refuse a
  fast charge while its average state of charge says there is room.

That last case is treated directly in the local literature: solid-state
diffusion inside the particle, rather than anything at the terminals, is what
limits what a cell will accept under pulse operation.[^1]

## Why put this on an analog computer

The REDAC does not step the equation forward. It is wired into a system that
obeys it, and then it runs. Space still has to be discretised, so the particle
becomes a set of shells, each one an integrator, coupled to its neighbours by
the stencil the geometry dictates. Time does not have to be discretised at all.

That removes an entire class of error, and it introduces another. A digital
solver knows its coefficients exactly and pays for its time step. An analog
solver has no time step to pay for and does not know its coefficients exactly,
because each one is set by real hardware with finite resolution. The conserved
quantity here is lithium, and whether the machine keeps it depends on whether
coefficients that should cancel actually do.

What happens when they do not, how far off it puts the answer, and what can be
done about it in hardware rather than in arithmetic, is the work behind the
password below.

[^1]: *Solid-State Diffusion Limitations on Pulse Operation of a Lithium Ion
Cell for Hybrid Electric Vehicles.* In the group literature collection under
`ByPerson/FraunhoferBatterien`.
