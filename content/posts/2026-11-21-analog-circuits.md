---
title: "Analog circuits in theory and application"
slug: analog-circuits
date: 2026-11-21
summary: >-
  A course in analog circuit design for people who already have the
  mathematics and the physics: sources and internal resistance, resistive
  networks, RC and RLC, diodes, operational amplifiers, the motifs built from
  them, and transistors. Every chapter carries interactive benches rather than
  worked numbers. Eight chapters, twelve benches, under construction.
tags:
  - "analog circuits"
  - "electronics"
  - "teaching"
  - "circuit design"
---

<p class="ac-construction"><strong>Under construction.</strong> All eight
chapters are written and every bench works. What is still missing is the part
only a bench can supply: measured numbers next to the predicted ones. As I
build these circuits I will add what they actually did, and correct whatever
the hardware disagrees with. Treat the chapters as derivations that have not
yet been checked against a soldering iron.</p>

<style>
.ac-construction { border-left: 3px solid var(--accent); background: var(--accent-wash); border-radius: 0 10px 10px 0; padding: 0.8rem 1rem; font-size: var(--step--1); }
.ac-toc { list-style: none; padding: 0; margin: 1.5rem 0; display: grid; gap: 0.6rem; }
.ac-toc li { border: 1px solid var(--rule); border-radius: 10px; padding: 0.8rem 1rem; display: grid; grid-template-columns: 2.2rem 1fr auto; gap: 0.8rem; align-items: baseline; }
.ac-toc__no { font-family: var(--font-mono); font-size: var(--step--1); color: var(--muted); }
.ac-toc__title { font-family: var(--font-display); font-weight: 600; }
.ac-toc__title a { text-decoration: none; border-bottom: 1px solid var(--rule-strong); }
.ac-toc__body { font-size: var(--step--1); color: var(--ink-soft); margin: 0.3rem 0 0; grid-column: 2 / -1; }
.ac-toc__state { font-family: var(--font-mono); font-size: var(--step--2); letter-spacing: 0.04em; text-transform: uppercase; color: var(--muted); white-space: nowrap; }
.ac-toc__state--ready { color: var(--accent); }
@media (max-width: 36rem) { .ac-toc li { grid-template-columns: 2.2rem 1fr; } .ac-toc__state { grid-column: 2; } }
</style>

## Why this exists {: #why }

I am a theoretical physicist, and I work on circuits that compute. At
[anabrid](https://anabrid.com) that means analog computers. In my own research
it means networks of coupled oscillators built out of phase-locked loops. I
think about them at the level of their dynamics. An oscillator is a phase, a
coupling is a function of phase differences, a delay is a number. That level
answers the questions I ask of it, and every result I have rests on it. It also
stops one step short of the board. In my equations a phase-locked loop is a
symbol. On a board it is a mixer, a loop filter with a real cutoff, an
oscillator with a real tuning slope, and a few impedances I never wrote down.
That step is the part a physicist is usually never taught properly: how a real
circuit behaves when it is loaded, when its source is not ideal, when a signal
has to get from one block to the next without being eaten on the way. So far I
have taken that layer on trust. I would rather build these things than only
model them.

That part is not hard. It is a small set of ideas applied over and over.
This is my attempt to write it down the way I would want to have read it:
derive the expression, then make the expression move, then say what it means
when a component value goes to zero or to infinity, which is where every
idealization in circuit theory dies.

**Who it is for.** Someone with first-year calculus and first-year physics:
comfortable with a differential equation, with complex numbers, and with the
idea of an impedance even if the word is new. No prior electronics is assumed.
If you can read $v(t) = V_0\,\mathrm{e}^{\mathrm{i}\omega t}$ without flinching,
the chapters will work.

**What it is not.** Not a replacement for a lab bench, and not a SPICE manual.
Every bench on these pages evaluates one closed-form expression that the text
derives. That is deliberate: a simulator hides which term dominates, and the
point of a first course is to learn which term dominates.

## How to use a chapter {: #how }

Each chapter has the same three layers.

1. **The model.** The governing relation, with every symbol named on the line
   after it.
2. **The bench.** An interactive panel for that relation. The sliders run over
   decades, because component values do, and most of them reach a true zero
   and a true infinity at the ends. Go to the ends. The interesting failures
   live there.
3. **The limits.** What the expression says when something is shorted, opened,
   matched or mismatched, and which of those a real component survives.

The benches need JavaScript, and nothing else: no account, no network traffic,
no data leaving the page. Where a bench is unavailable, the surrounding text
still carries the result as a formula.

## The chapters {: #chapters }

<ol class="ac-toc">
<li><span class="ac-toc__no">1</span>
  <span class="ac-toc__title"><a href="/projects/analog-circuits/sources/">Sources and internal resistance</a></span>
  <span class="ac-toc__state ac-toc__state--ready">ready</span>
  <p class="ac-toc__body">The two idealizations and why they are duals of each other: a voltage source prescribes the voltage and lets the current follow, a current source does the opposite. Internal resistance as the single parameter that turns an idealization into a component. Which sources may be wired in series and which in parallel, and what the combination behaves as. Thévenin and Norton as two views of the same box.</p></li>

<li><span class="ac-toc__no">2</span>
  <span class="ac-toc__title"><a href="/projects/analog-circuits/resistive-networks/">Resistive networks and loading</a></span>
  <span class="ac-toc__state ac-toc__state--ready">ready</span>
  <p class="ac-toc__body">Kirchhoff's two laws, series and parallel, and the voltage divider: the circuit that appears inside every other circuit. Why the divider you build never has the ratio you designed, what output resistance means, where the rule of ten comes from, and why matching a load for maximum power throws half the power away.</p></li>

<li><span class="ac-toc__no">3</span>
  <span class="ac-toc__title"><a href="/projects/analog-circuits/rc/">Capacitors and the RC circuit</a></span>
  <span class="ac-toc__state ac-toc__state--ready">ready</span>
  <p class="ac-toc__body">Charge, the $i = C\,\mathrm{d}v/\mathrm{d}t$ relation, and the first differential equation of the course. Step response and the time constant; sinusoidal steady state and the complex impedance; the low-pass and the high-pass as the same two components read from two nodes. Bode magnitude and phase, the −3 dB point, and why a 20 dB/decade slope is a statement about a single pole.</p></li>

<li><span class="ac-toc__no">4</span>
  <span class="ac-toc__title"><a href="/projects/analog-circuits/rlc/">Inductors, RLC and resonance</a></span>
  <span class="ac-toc__state ac-toc__state--ready">ready</span>
  <p class="ac-toc__body">The dual of the capacitor, the second-order equation, and the three damping regimes. Resonance, the quality factor, bandwidth, and the connection between a pole pair in the complex plane and a ringing step response. This is the chapter the oscillator work later builds on.</p></li>

<li><span class="ac-toc__no">5</span>
  <span class="ac-toc__title"><a href="/projects/analog-circuits/diodes/">Diodes and the first nonlinearity</a></span>
  <span class="ac-toc__state ac-toc__state--ready">ready</span>
  <p class="ac-toc__body">The exponential characteristic, the thermal voltage, and what a load line does when the device is not a straight line. Rectifiers, clamps, limiters, and the small-signal resistance: the move of linearizing around an operating point, which is the move the whole rest of the course depends on.</p></li>

<li><span class="ac-toc__no">6</span>
  <span class="ac-toc__title"><a href="/projects/analog-circuits/op-amps/">Operational amplifiers</a></span>
  <span class="ac-toc__state ac-toc__state--ready">ready</span>
  <p class="ac-toc__body">The ideal op-amp as two rules and what they are worth. Inverting and non-inverting stages, the buffer and why a divider that could not drive anything suddenly can, summing and difference amplifiers, integrator and differentiator. Then the honest version: finite gain, finite bandwidth, the gain-bandwidth product, slew rate, input offset, and the stability question that decides whether a circuit works or sings.</p></li>

<li><span class="ac-toc__no">7</span>
  <span class="ac-toc__title"><a href="/projects/analog-circuits/motifs/">Motifs: the blocks circuits are made of</a></span>
  <span class="ac-toc__state ac-toc__state--ready">ready</span>
  <p class="ac-toc__body">Comparator and Schmitt trigger, active filters, the instrumentation amplifier, current sources made from what chapter 6 provides, precision rectifiers, and the relaxation oscillator. The emphasis is on recognizing a motif inside a schematic you have never seen before.</p></li>

<li><span class="ac-toc__no">8</span>
  <span class="ac-toc__title"><a href="/projects/analog-circuits/transistors/">Transistors</a></span>
  <span class="ac-toc__state ac-toc__state--ready">ready</span>
  <p class="ac-toc__body">The bipolar transistor and the MOSFET as controlled sources, biasing and the operating point, the small-signal model, and the three single-stage amplifiers. Then the transistor as a switch, the differential pair, the current mirror, and enough of a look inside an op-amp that chapter 6 stops being a black box.</p></li>
</ol>

## Conventions {: #conventions }

Fixed once, used everywhere.

| | |
|---|---|
| **Current direction** | Conventional current, from the positive terminal through the external circuit. |
| **Passive sign convention** | For a resistor, current enters at the terminal marked positive. A positive power then means the component absorbs. |
| **Lower case, upper case** | $v$, $i$ are instantaneous values; $V$, $I$ are constant or RMS values; $\hat V$ is an amplitude; $\underline{V}$ is a complex phasor. |
| **Node voltages** | Always with respect to a named reference node, drawn as ground. There is no absolute voltage anywhere in this course. |
| **Component values** | Engineering notation with SI prefixes: 4.7 kΩ, 100 nF, 1 µA. |

## Sources and further reading {: #reading }

The physics here is standard and nothing in it is mine. Where I follow a
particular treatment I say so in the chapter. The books I keep going back to:
Horowitz and Hill, *The Art of Electronics* (3rd edition) for the engineering
judgement; Tietze and Schenk, *Halbleiter-Schaltungstechnik* for the German
reference treatment; Sedra and Smith, *Microelectronic Circuits* for the device
chapters; and for the analog-computing side, Ulmann, *Analog Computing*.

Corrections are welcome. If a derivation here is wrong, I would rather hear it
than keep it.
