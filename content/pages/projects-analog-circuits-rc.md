---
title: "Capacitors and the RC circuit"
slug: projects/analog-circuits/rc
template: circuit-chapter.html
chapter: 3
status: "Chapter 3 of 8 · 22 November 2026"
summary: >-
  The first component with memory, and therefore the first differential
  equation. Step response and the time constant, the complex impedance that
  turns calculus back into algebra, the low-pass and the high-pass as one
  circuit read from two nodes, and why a chain of filters is not the product of
  its filters.
prev_url: /projects/analog-circuits/resistive-networks/
prev_title: "Resistive networks and loading"
next_url: /projects/analog-circuits/rlc/
next_title: "Inductors, RLC and resonance"
---

## A component that remembers {: #memory }

Everything in the first two chapters obeyed a relation between the voltage
across a component and the current through it **at the same instant**. A
resistor has no memory. Tell it the voltage now and it tells you the current
now, and nothing about the past enters.

A capacitor stores charge, and charge is an integral of current. That one fact
is the whole chapter.

$$
\begin{aligned}
q &= C\,v ,\\[2pt]
i &= \frac{\mathrm{d}q}{\mathrm{d}t} = C\,\frac{\mathrm{d}v}{\mathrm{d}t} ,
\end{aligned}
$$

where $q$ is the stored charge, $v$ the voltage across the plates, $i$ the
current into the positive plate, and $C$ the capacitance in farads. For a
parallel-plate capacitor $C = \varepsilon_0\varepsilon_\mathrm{r}A/d$, with $A$
the plate area and $d$ their separation, which is why a 1 F capacitor used to
be an absurd object and is now a thumbnail.

Three consequences follow immediately, and all three get used constantly.

- **Current flows only while the voltage changes.** Hold $v$ constant and $i$ is
  zero. At DC a capacitor is an open circuit.
- **The voltage cannot jump.** A discontinuity in $v$ would need an infinite
  current. Over an interval short compared with everything else, a charged
  capacitor behaves like a voltage source holding its present value.
- **It stores energy rather than dissipating it.** Integrating $p = vi$ gives
  $W = \tfrac{1}{2}Cv^2$, and that energy comes back out. A resistor's energy
  does not.

The second point is the dual of something you already know. A resistor set by
Ohm's law has no state; a capacitor has exactly one number of state, its
voltage. Everything a capacitor does to a circuit is a consequence of the
circuit having to charge or discharge that one number.

## The first differential equation {: #step }

Put a resistor in series with a capacitor and drive the pair from a voltage
source $V$. Kirchhoff's voltage law gives $v_R + v_C = V$, Ohm's law gives
$v_R = R\,i$, and the capacitor gives $i = C\,\dot v_C$. Substituting,

$$
RC\,\frac{\mathrm{d}v_C}{\mathrm{d}t} + v_C = V .
$$

First order, linear, constant coefficients. With an initial voltage
$v_C(0) = V_0$ the solution is

$$
\begin{aligned}
v_C(t) &= V + (V_0 - V)\,\mathrm{e}^{-t/\tau} ,\\[2pt]
\tau &= RC .
\end{aligned}
$$

The capacitor voltage leaves where it was and approaches where the source wants
it, exponentially, with one time scale. Check that $\tau$ really is a time:
ohm times farad is $(\mathrm{V/A})\cdot(\mathrm{C/V}) = \mathrm{C/A} =
\mathrm{s}$.

The current is what the resistor sees across it,

$$
i(t) = \frac{V - v_C(t)}{R} = \frac{V - V_0}{R}\,\mathrm{e}^{-t/\tau} .
$$

**The current jumps and the voltage does not.** At $t = 0^+$ the capacitor still
holds $V_0$, so the full difference appears across the resistor and the current
is at its maximum. That is the standard picture and it is worth having in mind
before looking at any RC waveform.

The numbers people actually quote:

| after | fraction of the way there |
|---|---|
| $1\tau$ | 63.2 % |
| $2\tau$ | 86.5 % |
| $3\tau$ | 95.0 % |
| $5\tau$ | 99.3 % |

"Five time constants" is the engineering definition of *settled*, and it is a
choice, not a theorem. The exponential never arrives.

### The bench {: #bench-step }

A square wave is a step up followed by a step down, so one picture shows
charging, discharging and the thing that matters most: what happens when the
drive changes faster than the circuit can follow.

Drive the filter slowly and the output copies the input with rounded corners.
Speed the drive up past the cutoff and the exponentials no longer have time to
curve. What is left is a triangle, and a triangle is the integral of a square
wave. **The RC low-pass becomes an integrator when you run it far above its
cutoff, and it pays for that with almost all of the amplitude.** Chapter 6 buys
the integration back without the price.

<div class="ac-bench" data-applet="rc-step">
<p class="ac-fallback">This bench needs JavaScript. Without it, the exponential
above is the whole content of the panel.</p>
</div>

## The move that makes everything easier {: #impedance }

Solving a differential equation for every input would be unbearable. There is a
standard way out, and it is the same one used for normal modes in mechanics.

The circuit is linear and time invariant, so a complex exponential is an
eigenfunction of it: put $\mathrm{e}^{\mathrm{i}\omega t}$ in and you get
$\mathrm{e}^{\mathrm{i}\omega t}$ out, at the same frequency, scaled by a
complex number. Write every quantity as

$$
\begin{aligned}
v(t) &= \mathrm{Re}\left\{\underline{V}\,\mathrm{e}^{\mathrm{i}\omega t}\right\} ,\\[2pt]
i(t) &= \mathrm{Re}\left\{\underline{I}\,\mathrm{e}^{\mathrm{i}\omega t}\right\} ,
\end{aligned}
$$

where the underlined quantities are complex amplitudes, carrying magnitude and
phase. Differentiation becomes multiplication by $\mathrm{i}\omega$. Putting
this into $i = C\dot v$ gives $\underline{I} = \mathrm{i}\omega C\,\underline{V}$,
and therefore

$$
Z_C = \frac{\underline{V}}{\underline{I}} = \frac{1}{\mathrm{i}\omega C}
= \frac{-\mathrm{i}}{\omega C} .
$$

This is the **impedance** of a capacitor: an Ohm's law for sinusoids, complex
because the response is not in phase with the drive. Its magnitude is
$1/(\omega C)$ and its phase is $-90^\circ$, which says the current leads the
voltage by a quarter cycle. The capacitor is already pushing charge in while
the voltage is still low.

The two limits are worth saying in words:

$$
\begin{aligned}
\omega \to 0: \quad & |Z_C| \to \infty \quad\text{(an open circuit at DC)},\\
\omega \to \infty: \quad & |Z_C| \to 0 \quad\text{(a short circuit at high frequency)}.
\end{aligned}
$$

Those two sentences are most of what a decoupling capacitor does for a living:
it is invisible to the supply rail and a short to anything that wiggles.

**The payoff is that chapter 2 now applies unchanged.** Series impedances add,
parallel impedances combine by the product-over-sum rule, the voltage divider
is still the voltage divider, Thévenin and Norton still hold. Replace $R$ by
$Z$ and every result carries over. That is the reason impedance is introduced
at all: it turns calculus back into the algebra you already did.

## Two filters, one circuit {: #filters }

Take a resistor and a capacitor in series across a source, and read the output
from one node or the other. Nothing else changes.

$$
\begin{aligned}
H_\mathrm{LP}(\omega) &= \frac{Z_C}{R + Z_C} = \frac{1}{1 + \mathrm{i}\omega RC} ,\\[4pt]
H_\mathrm{HP}(\omega) &= \frac{R}{R + Z_C} = \frac{\mathrm{i}\omega RC}{1 + \mathrm{i}\omega RC} .
\end{aligned}
$$

Across the capacitor you get a **low-pass**; across the resistor a
**high-pass**. They are the same divider read from two places, so they add to
one at every frequency, which is a useful check and an occasionally useful
circuit.

Both have the same corner, where the resistance and the reactance are equal in
magnitude:

$$
\omega_\mathrm{c} = \frac{1}{RC} , \qquad f_\mathrm{c} = \frac{\omega_\mathrm{c}}{2\pi} .
$$

At that frequency $|H| = 1/\sqrt{2} = 0.707$, the delivered power is halved,
and the phase has moved by $45^\circ$. In decibels $20\log_{10}(1/\sqrt 2) =
-3.01$, which is where the name **−3 dB point** comes from. It marks a factor
of two in power, not a factor of two in amplitude, and conflating the two is
the most common unit error in the subject.

One number to carry around: 1 kΩ with 1 µF gives $\tau = 1\ \mathrm{ms}$ and
$f_\mathrm{c} = 159\ \mathrm{Hz}$. Everything else scales from there, since

$$
f_\mathrm{c}\,[\mathrm{Hz}] = \frac{159\,155}{R\,[\Omega]\;C\,[\mu\mathrm{F}]} .
$$

## Reading it as a Bode plot {: #bode }

Plot $20\log_{10}|H|$ against $\log\omega$ and the low-pass becomes two straight
lines: flat at 0 dB below the corner, falling at **20 dB per decade** above it.
The asymptotes meet exactly at $\omega_\mathrm{c}$, and the true curve sits
3 dB below that meeting point.

The phase is

$$
\arg H_\mathrm{LP} = -\arctan(\omega RC) ,
$$

which is $0^\circ$ at DC, $-45^\circ$ at the corner and $-90^\circ$ far above
it. The transition is slow: $-5.7^\circ$ at a tenth of the corner and
$-84.3^\circ$ at ten times it. **A single pole costs 20 dB per decade and
$90^\circ$, and the phase is already moving a decade before the magnitude
notices.** That sentence is the reason chapter 6 has a stability section.

<div class="ac-bench" data-applet="rc-bode">
<p class="ac-fallback">This bench needs JavaScript. The two transfer functions
above, and the 20 dB/decade asymptote, are the content of the panel.</p>
</div>

## The same information, twice {: #duality }

The step response and the frequency response are not two properties of the
circuit. They are one property written in two coordinate systems, and the
dictionary between them is

$$
\tau = \frac{1}{\omega_\mathrm{c}} = \frac{1}{2\pi f_\mathrm{c}} .
$$

The most used consequence: the 10 % to 90 % rise time of a first-order step is
$t_\mathrm{r} = \tau\ln 9 = 2.197\,\tau$, so

$$
t_\mathrm{r}\,f_\mathrm{c} = \frac{\ln 9}{2\pi} \approx 0.35 .
$$

A scope with 100 MHz of bandwidth cannot show an edge faster than about 3.5 ns,
and a 3.5 ns edge on its screen tells you nothing except that the scope is a
first-order system. Anything faster than that is the instrument, not the
signal.

## Cascading is not multiplying {: #cascade }

Put one RC low-pass after another and the obvious guess is that the transfer
functions multiply. They do not, because the second stage loads the first. This
is chapter 2's problem wearing a frequency-dependent coat.

Analysed properly, two stages with $R_1, C_1$ then $R_2, C_2$ give

$$
H(s) = \frac{1}{1 + s\,(R_1C_1 + R_2C_2 + R_1C_2) + s^2 R_1C_1R_2C_2} ,
$$

with $s = \mathrm{i}\omega$, and the term $R_1C_2$ is the loading. With two identical stages the exact
answer and the naive one are

$$
\begin{aligned}
\text{loaded:}\quad & \frac{1}{1 + 3\,sRC + (sRC)^2} ,\\[4pt]
\text{naive product:}\quad & \frac{1}{1 + 2\,sRC + (sRC)^2} .
\end{aligned}
$$

Same two poles' worth of structure, different damping. The real cascade is
slower and less peaked than the product predicts, and the discrepancy does not
go away by making the components nicer.

Two fixes, both already familiar:

1. **Scale the stages.** Make $R_2 \gg R_1$ and $C_2 \ll C_1$ so that
   $R_1C_2$ is negligible. The rule of ten from chapter 2, applied to a
   product of two quantities instead of a ratio.
2. **Put a buffer between them.** A device with a high input impedance and a
   low output impedance makes the product exact. That device is the subject of
   chapter 6, and this is the second time it has been needed.

## Where this bites {: #practice }

- **Your probe is part of the circuit.** A scope probe presents roughly 10 pF.
  At a node with 100 kΩ of source resistance that is a corner at 159 kHz. You
  are measuring the probe as much as the signal, which is why a 10× probe
  trades amplitude for a tenth of the capacitance.
- **Decoupling.** Every supply pin gets a capacitor to ground because the
  supply wiring has inductance and resistance, and the chip's current demand is
  not constant. The capacitor is a local source with a very small internal
  resistance, in exactly chapter 1's sense.
- **Noise sets a floor you cannot resistor your way out of.** A resistor and a
  capacitor alone, in thermal equilibrium, put a mean-square voltage on the
  capacitor of

  $$
  \overline{v^2} = \frac{k_\mathrm{B}T}{C} ,
  $$

  independent of $R$. Equipartition: one degree of freedom, $\tfrac12 C
  \overline{v^2} = \tfrac12 k_\mathrm{B}T$. At 300 K on 1 pF that is 64 µV rms.
  Making the resistor quieter does not help, because a larger resistor makes
  more noise over a narrower band and the two cancel exactly. Only more
  capacitance helps.

## Exercises {: #exercises }

1. Show that the high-pass has the same time constant $RC$, and find its
   response to a step of height $V$. *(It jumps to $V$ and decays to zero: the
   capacitor blocks the DC the step leaves behind.)*
2. A 10× scope probe is a 9 MΩ resistor in parallel with a trimmer capacitor,
   feeding the scope's 1 MΩ and 20 pF. What must the trimmer be set to so that
   the division ratio is the same at all frequencies? This is what the little
   screw on a probe adjusts.
3. Derive $\overline{v^2} = k_\mathrm{B}T/C$ the long way: integrate the
   Johnson noise density $4k_\mathrm{B}TR$ through $|H_\mathrm{LP}|^2$ over all
   frequencies, and watch $R$ cancel.
4. Two identical RC stages are cascaded. Using the exact expression above, by
   what factor is the overall −3 dB frequency lower than that of one stage?
   Compare with the answer the naive product gives, and check both on bench 6
   by matching the single-stage curve.

<p class="page-foot"><em>Next:</em> <a href="/projects/analog-circuits/rlc/">Inductors, RLC and resonance</a>, where a second energy store turns the exponential into a ringing.</p>
