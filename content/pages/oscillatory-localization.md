---
title: GNSS-independent localization and timing
slug: oscillatory-computing/localization
nav_order: 99
template: gated.html
gate_payload: gnss-localization
gate_poster: /tools/gnss-localization/poster.jpg
eyebrow: Oscillatory computing · interactive demonstrators
gate_heading: "Two live benches: spoof detection and direction finding"
gate_blurb: >-
  A network of coupled clocks that holds true time without GNSS and catches a
  spoofing carry-off as a divergence from its own consensus, and a pair of
  coupled loops that hears the direction of a base station well enough to place
  a receiver or a hostile emitter. Both run in your browser, with base-station
  and local-receiver labels throughout. Unpublished, so behind a password.
gate_caption: >-
  Above: the two benches out of focus, blurred in the file itself so no label is
  legible. Behind the glass: spoof detection and emitter or self localization,
  both client-side, with nothing sent anywhere.
summary: >-
  Coupled oscillators for GNSS-independent timing, spoof detection and passive
  direction finding. Two interactive benches, by password.
---

Positioning, navigation and timing hang on one thread, and the thread is GNSS. Cut it and
a surprising amount stops working; fake it and the failure hides, because the receiver
keeps producing a position and a time that are wrong and look fine. This project asks what
a network of coupled oscillators can do about that, using the same self-organized
synchronization that runs through the [rest of the research](/research/).

Two capabilities come out of one kind of hardware. A network of **base stations (BS)**,
each a phase-locked loop, settles into a shared reference clock with no master and without
knowing the delays between them. Because that reference never reads GNSS, a **local
receiver (LR)** can catch a spoofing carry-off simply by watching its GNSS clock drift
away from the network consensus. The same coupled loops, a baseline apart, hear the
direction of an incoming wavefront from the tiny difference in its arrival time, so a few
bearings to known base stations place the receiver, or, run in reverse, place a hostile
emitter. Because a reflected (multipath) copy of a signal points at no known anchor, a
consensus over many fast measurements throws it out, which the second bench lets you turn
up and watch.

Behind the glass: the full write-up with the equations, the honest limits, and two
interactive benches, one for the spoof detector and one for the direction finder, labelled
in base-station and local-receiver terms throughout.

This work is a collaboration between the Max Planck Institute for the Physics of Complex
Systems (MPI-PKS) in Dresden and the Chair of Circuit Design and Network Theory at TU
Dresden, with Rabia Riaz, Christian Hoyer and Dimitris Prousalis.
