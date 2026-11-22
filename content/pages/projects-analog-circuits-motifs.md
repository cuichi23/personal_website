---
title: "Motifs: the blocks circuits are made of"
slug: projects/analog-circuits/motifs
template: circuit-chapter.html
chapter: 7
status: "Chapter 7 of 8 · 22 November 2026"
summary: >-
  A schematic is not a hundred components, it is eight or ten recognizable
  blocks. Positive feedback and hysteresis, the relaxation oscillator that
  makes its own time, active filters without an inductor, the instrumentation
  amplifier, current sources, precision rectifiers, and the four motifs an
  analog computer is assembled from.
prev_url: /projects/analog-circuits/op-amps/
prev_title: "Operational amplifiers"
next_url: /projects/analog-circuits/transistors/
next_title: "Transistors"
---

## Schematics are read, not solved {: #reading }

A page of analog circuitry looks like a hundred components. It is not. It is
eight or ten blocks, each of which has a name, a transfer function and a
characteristic shape on the page, wired in a sequence. Somebody fluent reads
them the way you read words rather than letters, and the only way to get there
is to learn the vocabulary.

This chapter is the vocabulary. Every block in it is built from chapters 1 to
6 and nothing else, and the useful skill is recognizing one inside a circuit
you have never seen.

## Positive feedback: the comparator and the Schmitt trigger {: #schmitt }

Everything in chapter 6 assumed the feedback went to the inverting input. Send
it to the non-inverting input instead and the sign in $G = A/(1 - A\beta)$
flips. The loop gain is now positive, the denominator passes through zero, and
the circuit has no stable operating point in its linear range. It snaps to one
rail or the other and stays there.

That is not a failure, it is a decision-making circuit.

A **comparator** with no feedback at all outputs high when $v_+ > v_-$ and low
otherwise. Useful, and badly behaved on a slow or noisy input: near the
threshold the noise crosses back and forth and the output chatters.

A **Schmitt trigger** adds positive feedback through a divider, so the
threshold moves away from wherever the input just came from. With a divider
$R_1$ from the inverting input's reference and $R_2$ from the output, and rails
at $\pm V_\mathrm{s}$, the two thresholds are

$$
V_{\mathrm{th}\pm} = \pm\,\frac{R_1}{R_1 + R_2}\,V_\mathrm{s} ,
$$

and the gap between them is the **hysteresis window**. An input must cross the
whole window to flip the output back, so any noise smaller than the window is
ignored. The cost is that the switching point now depends on which way the
input is moving, so the circuit has memory. Hysteresis and memory are the same
thing.

## The relaxation oscillator {: #relaxation }

Take the Schmitt trigger and let its own output charge a capacitor back into
its input through a resistor. The output drives the capacitor towards one rail;
the capacitor reaches the threshold; the output flips; now it is driven the
other way. Nothing settles, and the circuit produces a square wave and a
triangle-ish ramp forever.

With $\beta = R_1/(R_1+R_2)$ the half period follows from chapter 3's
exponential, started at $-\beta V_\mathrm{s}$ and aimed at $+V_\mathrm{s}$,
stopped at $+\beta V_\mathrm{s}$:

$$
\begin{aligned}
T &= 2RC\,\ln\!\left(\frac{1+\beta}{1-\beta}\right)\\[4pt]
  &= 2RC\,\ln\!\left(1 + \frac{2R_1}{R_2}\right) .
\end{aligned}
$$

**This is the first circuit in the course that makes its own time.** Everything
before it responded to something; this one has no input. It is worth being
precise about why it can: the positive feedback removes the stable operating
point, and the capacitor supplies the state that carries the circuit from one
switch to the next. A relaxation oscillator and a resonant oscillator (chapter
4) are the two ways to do that, and they fail differently. The resonant one
has good frequency stability because the frequency is set by $\sqrt{LC}$ and
the amplitude by a nonlinearity. The relaxation one has terrible frequency
stability, because the frequency is set by rails and thresholds that drift,
and excellent amplitude stability, because the amplitude is the rails.

<div class="ac-bench" data-applet="schmitt-oscillator">
<p class="ac-fallback">This bench needs JavaScript. The threshold and period
expressions above are the content of the panel.</p>
</div>

## Active filters {: #active-filters }

Chapter 4 got a resonant response out of an inductor, and then explained why
nobody wants an inductor. An op-amp provides the way out: feedback can produce
a complex pole pair from resistors and capacitors alone.

The standard block is the **Sallen-Key** low-pass: two resistors, two
capacitors and a buffer, with the first capacitor returned to the buffer's
output instead of to ground. That one connection is what creates the
second-order behaviour. For the equal-component version with gain $K$,

$$
\omega_0 = \frac{1}{RC} ,
\qquad
Q = \frac{1}{3 - K} .
$$

Read that $Q$ expression carefully, because it contains the whole story of
active filters. At $K = 1$ the $Q$ is $1/2$, safely overdamped. At $K = 3$ the
$Q$ is infinite and the circuit oscillates. **The pole pair is positioned by
how much positive feedback is let through, and the distance to instability is
a resistor ratio.** The Butterworth response from chapter 4 needs
$Q = 1/\sqrt2$, that is $K = 1.586$, and a 5 % error in that gain is a visible
error in the passband.

Higher orders are made by cascading second-order sections, each with its own
$\omega_0$ and $Q$ taken from a table, with buffers between them so that
chapter 3's cascading problem does not return.

The same trick generalizes. A **gyrator** uses an op-amp to make a capacitor
look like an inductor from one port, with an effective $L = R_1R_2C$. There is
no coil, no stray field and no saturation, and the synthetic inductor has one
end committed to ground. Below a few megahertz this is how resonance is built.

## The instrumentation amplifier {: #inamp }

Chapter 6's difference amplifier had two defects: its input resistance is low
and unequal on the two inputs, and its common-mode rejection is set by resistor
matching rather than by the amplifier.

The instrumentation amplifier fixes both with two more op-amps. Each input goes
to its own non-inverting buffer stage, and the two stages share a single gain
resistor $R_\mathrm{G}$ between their inverting inputs. A difference amplifier
follows at unity gain. The result is

$$
v_\mathrm{out} = \left(1 + \frac{2R}{R_\mathrm{G}}\right)(v_2 - v_1) ,
$$

with both inputs now presenting the op-amp's own input resistance, and the gain
set by one component. The subtlety is the good part: **the input stage has a
gain of one for the common mode and a gain of $1 + 2R/R_\mathrm{G}$ for the
difference**, because the common mode puts no voltage across $R_\mathrm{G}$ and
therefore drives no current through it. The difference is amplified before the
matched resistors see it, so their mismatch matters less by exactly the gain.

This is the front end of essentially every sensor measurement: strain gauges,
thermocouples, electrode pairs, current-sense shunts. Anywhere the wanted
signal is a small difference riding on a large common voltage.

## Making a current source {: #current-sources }

Chapter 1 asked for a current source and never built one. The ingredients are
now available, and the recipe is the same one as always: use feedback to hold
something constant.

**Current through a floating load.** Put the load in the feedback path of an
inverting stage. The virtual ground forces the input current to
$v_\mathrm{in}/R$, and rule 2 sends all of it through the load, whatever the
load is:

$$
i_\mathrm{L} = -\frac{v_\mathrm{in}}{R} .
$$

The load's resistance has dropped out, which is the definition of a current
source. The compliance is the op-amp's output swing, exactly as chapter 1
predicted it would be.

**Current through a grounded load.** Harder, because the load cannot sit in
the feedback path. The **Howland current source** uses a bridge of four
resistors around one op-amp; it works, and its output resistance depends on the
resistor matching in the same way a difference amplifier's rejection does. The
usual practical answer instead puts a transistor in the loop, which is chapter
8.

## Precision rectifier {: #precision }

A diode cannot rectify a 50 mV signal: the 0.7 V drop from chapter 5 swallows
it. Put the diode **inside** an op-amp's feedback loop and the drop is divided
by the loop gain, like every other error in chapter 6. The amplifier simply
drives its output 0.7 V higher than it otherwise would, and the node that
matters is where the feedback is taken from.

$$
\text{effective drop} \approx \frac{V_\mathrm{f}}{1 + A\beta} .
$$

With $A\beta = 10^4$ the 0.7 V has become 70 µV. The circuit is sometimes
called a superdiode, and the technique is general: **anything inside the loop
is divided by the loop gain, so put the component you cannot fix where the
feedback can see it.** The cost is that when the diode turns off the loop is
broken and the amplifier saturates, so the recovery is slow; the two-diode
version keeps the loop closed in both halves and is what actually gets built.

## The analog computer, in four motifs {: #analog-computer }

Everything above is general electronics. Four of these blocks, specifically,
are what a programmable analog computer is made of, and they are the reason
this series exists.

| motif | what it does | built from |
|---|---|---|
| **integrator** | $v_\mathrm{out} = -\frac{1}{RC}\int v\,\mathrm{d}t$, with a settable initial condition and a reset | chapter 6 |
| **summer** | weighted addition at a virtual ground, inputs not interacting | chapter 6 |
| **coefficient** | multiplication by a constant in $[-1, 1]$, set by a potentiometer or a multiplying DAC | chapter 2 |
| **multiplier** | the product of two signals | chapter 5's logarithm, or chapter 8's differential pair |

A differential equation is patched by solving for the highest derivative,
feeding it to a chain of integrators, and closing the loops with summers and
coefficients. The machine then solves it in continuous time, in parallel, with
no time step and no numerical stability condition, because it is not
approximating the equation — it is obeying a different physical system with the
same equation.

What it costs is exactly the content of this course. The coefficient is only as
good as the divider (chapter 2). The integrator drifts and has a finite loop
gain (chapter 6). Every block loads the next one, so each is buffered, and the
buffers have bandwidth (chapters 3 and 6). The multiplier's accuracy comes from
how well two junctions match (chapters 5 and 8). **The accuracy of an analog
computer is a statement about its loading, its offsets and its matching, and
there is no other place for it to come from.**

## Exercises {: #exercises }

1. A Schmitt trigger runs on $\pm12\ \mathrm{V}$ with $R_1 = 10\ \mathrm{k}\Omega$
   and $R_2 = 100\ \mathrm{k}\Omega$. Find the thresholds and the window. Then
   add $R = 47\ \mathrm{k}\Omega$ and $C = 10\ \mathrm{nF}$ and find the
   oscillation frequency. Check both on bench 11.
2. Show that an equal-component Sallen-Key section reaches $Q = 1/\sqrt{2}$ at
   $K = 1.586$, and find how far $K$ may drift before $Q$ changes by 10 %. This
   is why the gain-setting resistors in an active filter are the 1 % ones.
3. An instrumentation amplifier is set to a gain of 100. Its output difference
   amplifier uses 1 % resistors. Estimate the common-mode rejection, and
   compare with the same 1 % resistors used in a plain difference amplifier at
   a gain of 100.
4. Sketch the patch diagram for $\ddot x + 2\zeta\omega_0\dot x + \omega_0^2 x = 0$
   using two integrators, one summer and two coefficients. Where does the
   initial condition for $\dot x$ enter, and what sets the time scale?

<p class="page-foot"><em>Next:</em> <a href="/projects/analog-circuits/transistors/">Transistors</a>, which is what all of the above is actually made of.</p>
