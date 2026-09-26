---
title: Machine learning on REDAC
slug: projects-anabrid/ml-on-redac
nav_order: 99
template: gated.html
gate_payload: ml-on-redac
eyebrow: Projects@anabrid · work in progress
summary: >-
  A trained network's hidden layer run as physics rather than as arithmetic. The
  activation function is not computed here. It is what an integrator does when
  you let it hit its limit.
gate_heading: What the hardware actually returned
gate_blurb: >-
  Measured runs of two networks on the machine against digital references built
  from the same weights, repeatability across repeats, and where the approach
  runs out of range. Unpublished, so it is kept behind a password.
---

A feedforward network is three things in a row: a matrix multiplied by the
input, a nonlinearity applied element by element, and a second matrix. Written
out for one hidden layer,

$$
y = W_2\,\sigma\!\left(W_1 x + b_1\right) + b_2 .
$$

Two of those three are matrix-vector products, which digital hardware does
extremely well and which analog hardware has no particular advantage in. The
interesting one is $\sigma$.

## The activation is not computed here

On this machine an integrator with its output limiter switched on does something
specific. Drive it with a constant and it ramps. Let it ramp long enough and it
stops at the limiter level and stays there. Plot where it ended against what
drove it and the curve is linear through the middle and flat at both ends.

That is a clipped-linear activation, the function usually called HardTanh:

$$
\sigma(z) = \operatorname{clip}(z, -1, +1).
$$

Nothing evaluates it. There is no lookup table, no polynomial, no comparator.
The shape is what the component does when it runs out of room. Every hidden unit
does it at the same time, because they are separate pieces of hardware rather
than successive iterations of a loop.

This is the part worth taking seriously. Most proposals to put neural networks
on analog hardware are about the matrix multiply, where the case is a crowded
one. The activation is the part that is free here, and it is free because it is
a physical limit rather than a computation.

## Which parts go where

The layout we run is digital, analog, digital. The input layer is a digital
matrix-vector product that produces the pre-activations. Those become drive
signals. The hidden layer is analog: one integrator per unit, all of them
ramping and clipping at once. The result is read back and the output layer is
another digital product.

The split is not a compromise on the way to an all-analog network. It is where
the boundary currently belongs. Conversion between the two domains costs time
and energy, so a partition is only worth it if the analog part does something
the digital part would find expensive. One nonlinearity per unit, in parallel,
with no arithmetic, is such a thing. A dense matrix product is not.

## What a comparison has to state

An accuracy number for an analog network means nothing on its own, because the
question is never whether it classifies. It is whether it classifies *the same
way* the network it was trained as does. So every run here is measured against a
digital reference built from the same weights, sample by sample. What we report
is agreement with that reference, not accuracy alone.

The same applies twice over to energy. A figure without the comparison machine
named, the batch size stated, and the measuring instrument identified is not a
result. Our digital baselines run on CPU and GPU across a range of batch sizes.
The power drawn is measured on identical windows by more than one instrument.
That is the least that makes the comparison arguable.

## What we have run

Two problems. Handwritten digits, as the case everybody can calibrate against.
And a public set of tetromino shapes at random positions and rotations. That one
is harder in a way that matters: it asks a small network to recognise a shape
independently of where it sits.

Both have been placed on the hardware and run against digital references with
the same weights, repeatedly, to see whether the machine gives the same answer
twice. The results, including the one that shows where this approach currently
runs out of room, are behind the password.
