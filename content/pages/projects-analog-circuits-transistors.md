---
title: "Transistors"
slug: projects/analog-circuits/transistors
template: circuit-chapter.html
chapter: 8
status: "Chapter 8 of 8 · 22 November 2026"
summary: >-
  The controlled source that everything else is made of. The bipolar transistor
  and the MOSFET, biasing and the operating point, the small-signal model, the
  three single-stage amplifiers, and then the differential pair, the current
  mirror and enough of an op-amp's insides that chapter 6 stops being a black
  box.
prev_url: /projects/analog-circuits/motifs/
prev_title: "Motifs: the blocks circuits are made of"
---

## One idea, two devices {: #two-devices }

A transistor is a **controlled source**. A small quantity at one terminal pair
controls a large current at another, and the energy for that current comes from
the supply rather than from the input. Everything else is detail about which
quantity controls what and how the control curve is shaped.

Two families matter. Both are three-terminal devices and both are described by
a characteristic that saturates into a near-horizontal line, which is chapter
1's current source appearing as a physical object.

| | bipolar (BJT) | MOSFET |
|---|---|---|
| terminals | base, emitter, collector | gate, source, drain |
| controlled by | $v_\mathrm{BE}$, exponentially | $v_\mathrm{GS}$, above a threshold |
| input current | $i_\mathrm{B} = i_\mathrm{C}/\beta$, nanoamps to microamps | essentially zero |
| transconductance | $g_\mathrm{m} = I_\mathrm{C}/V_\mathrm{T}$ | $g_\mathrm{m} = \sqrt{2k I_\mathrm{D}}$ |
| matching at a given current | excellent | needs area |
| as a switch | a saturation voltage of ~0.2 V | a resistance $R_\mathrm{DS(on)}$ |

## The bipolar transistor {: #bjt }

In the forward active region the collector current is

$$
i_\mathrm{C} = I_\mathrm{S}\,\mathrm{e}^{v_\mathrm{BE}/V_\mathrm{T}} ,
$$

which is the same exponential as chapter 5's diode, with the same
$V_\mathrm{T} = k_\mathrm{B}T/q = 25.9\ \mathrm{mV}$ and the same 60 mV per
decade. That is not an analogy: the base-emitter junction *is* a diode, and
the collector collects the carriers that cross it.

The base current is $i_\mathrm{B} = i_\mathrm{C}/\beta$, with $\beta$ somewhere
between 50 and 500 and not to be relied on. **Design so that $\beta$ does not
appear in the answer**; it varies between parts, with current and with
temperature.

Three regions:

- **Cutoff.** $v_\mathrm{BE}$ below about 0.5 V, no current.
- **Forward active.** $v_\mathrm{BE}\approx 0.6$–$0.7$ V, collector-base
  reverse biased. $i_\mathrm{C}$ set by $v_\mathrm{BE}$ and nearly independent
  of $v_\mathrm{CE}$. This is the useful region for amplifiers.
- **Saturation.** $v_\mathrm{CE}$ below about 0.2 V, both junctions forward
  biased, $i_\mathrm{C}$ now set by the external circuit. This is the useful
  region for switches.

In the active region the curves are not quite flat. Extrapolated backwards
they meet the voltage axis at $-V_\mathrm{A}$, the Early voltage, 50 to 150 V,
and that slope is a finite output resistance

$$
r_\mathrm{o} = \frac{V_\mathrm{A}}{I_\mathrm{C}} .
$$

**Say that again in chapter 1's language: a transistor in the active region is
a real current source whose internal resistance is $V_\mathrm{A}/I_\mathrm{C}$.**
At 1 mA with $V_\mathrm{A} = 100\ \mathrm{V}$ that is 100 kΩ. The question
chapter 1 left open has an answer and the answer is a part.

## The MOSFET {: #mosfet }

Above the threshold voltage $V_\mathrm{th}$ and in saturation, the drain
current is approximately a square law,

$$
\begin{aligned}
i_\mathrm{D} &= \frac{k}{2}\,(v_\mathrm{GS} - V_\mathrm{th})^2\,(1 + \lambda v_\mathrm{DS}) ,\\[4pt]
k &= \mu C_\mathrm{ox}\frac{W}{L} ,
\end{aligned}
$$

where $W/L$ is the width-to-length ratio the designer chooses, $\mu C_\mathrm{ox}$
is a process constant and $\lambda$ plays the role of $1/V_\mathrm{A}$. The
quantity $v_\mathrm{GS} - V_\mathrm{th}$ is the **overdrive**, and most design
decisions are really a choice of overdrive.

Below the threshold the device does not switch off abruptly; it goes
exponential, with roughly 60–90 mV per decade, which is the same physics as the
BJT. Low-power analog design deliberately works there.

Two differences from the BJT that decide which to use:

- **The gate draws no DC current.** No base current, no $\beta$, no bias
  current error of the kind chapter 6 listed. It is a capacitor, so it costs
  charge at high frequency instead.
- **$g_\mathrm{m}$ per unit current is worse.** For the BJT
  $g_\mathrm{m} = I_\mathrm{C}/V_\mathrm{T}$, fixed by physics; for the MOSFET
  $g_\mathrm{m} = 2I_\mathrm{D}/(v_\mathrm{GS}-V_\mathrm{th})$, and the
  overdrive is typically 200 mV against the BJT's 26 mV. A bipolar input stage
  therefore gives more gain and lower noise for the same current, which is why
  precision op-amps still use them.

## Bias: choosing where to sit {: #bias }

An amplifier must sit somewhere on the curve before it can amplify. Choosing
that point is **biasing**, and it is a large-signal DC problem solved with
chapter 1's load line, now drawn across a family of curves instead of one.

The naive approach, driving the base from a fixed voltage, does not survive
contact with reality: $i_\mathrm{C}$ depends exponentially on $v_\mathrm{BE}$,
and $v_\mathrm{BE}$ shifts by $-2\ \mathrm{mV/K}$ (chapter 5). A 10 K rise
multiplies the current by more than two, and thermal runaway is a real failure
mode.

The fix is local negative feedback: put a resistor $R_\mathrm{E}$ in the
emitter. The emitter current then sets its own voltage, which opposes any
increase, and

$$
I_\mathrm{C} \approx \frac{V_\mathrm{B} - V_\mathrm{BE}}{R_\mathrm{E}} .
$$

Neither $\beta$ nor $I_\mathrm{S}$ appears. The exponential has been traded for
a division by a resistor, and the price is some of the gain. **This is chapter
6's trade — accuracy bought with gain — applied one level further down**, and
it is why degeneration appears in almost every discrete stage.

<div class="ac-bench" data-applet="transistor-bias">
<p class="ac-fallback">This bench needs JavaScript. The characteristic, the
load line and the small-signal gain above are the content of the panel.</p>
</div>

## Small signal {: #small-signal }

Same move as chapter 5. Fix the operating point, then linearize. The
transconductance is the slope of the control curve,

$$
g_\mathrm{m} = \frac{\partial i_\mathrm{C}}{\partial v_\mathrm{BE}}
= \frac{I_\mathrm{C}}{V_\mathrm{T}} ,
$$

38.6 mS at 1 mA, and the input resistance looking into the base is
$r_\pi = \beta/g_\mathrm{m}$. With the output resistance $r_\mathrm{o}$ from
the Early effect, these three elements are the hybrid-$\pi$ model, and the
whole of chapters 1 to 4 then applies to the small signal.

The intrinsic gain of the device, the most it can give in one stage, is

$$
g_\mathrm{m}r_\mathrm{o} = \frac{I_\mathrm{C}}{V_\mathrm{T}}\cdot\frac{V_\mathrm{A}}{I_\mathrm{C}}
= \frac{V_\mathrm{A}}{V_\mathrm{T}} ,
$$

about 4000 for $V_\mathrm{A} = 100\ \mathrm{V}$, and **independent of the
current**. That number is why an op-amp needs only two gain stages to reach
$10^5$.

## Three ways to wire one transistor {: #stages }

Which terminal is common to input and output names the stage, and the three
have genuinely different jobs.

| | common emitter | common collector (follower) | common base |
|---|---|---|---|
| **gain** | $-g_\mathrm{m}R_\mathrm{C}$, large, inverting | $\approx 1$ | $+g_\mathrm{m}R_\mathrm{C}$, large |
| **input resistance** | $r_\pi$, moderate | high, $\beta R_\mathrm{E}$ | low, $1/g_\mathrm{m}$ |
| **output resistance** | high, $R_\mathrm{C}$ | low, $\approx 1/g_\mathrm{m}$ | high |
| **job** | voltage gain | buffer | current buffer, wide band |

The **emitter follower** deserves the same attention the op-amp buffer got in
chapter 6, because it is the same function with one component: high input
resistance, low output resistance, unity gain. Before op-amps existed, this is
how a weak node was made strong, and it is still how an op-amp's own output
stage is built.

The **common base** stage has no Miller effect — the input and output are not
bridged by the collector-base capacitance — so it keeps working where the
common emitter has run out of bandwidth. A common emitter followed by a common
base is the cascode, which gets the gain of the first and the bandwidth of the
second.

## The differential pair {: #diff-pair }

Two matched transistors, emitters tied together, fed by a tail current source
$I_\mathrm{T}$. The tail splits according to the input difference, and for the
bipolar version the split is exactly

$$
i_{\mathrm{C}1} - i_{\mathrm{C}2} = I_\mathrm{T}\tanh\!\left(\frac{v_\mathrm{id}}{2V_\mathrm{T}}\right) ,
$$

with $v_\mathrm{id}$ the differential input. Three readings of this one line:

- **Near zero it is linear**, with a slope $g_\mathrm{m} = I_\mathrm{T}/(2V_\mathrm{T})$.
  That is the input stage of every op-amp in chapter 6, and the linear range is
  a few $V_\mathrm{T}$: tens of millivolts, which is exactly why an op-amp
  needs feedback to be usable.
- **It saturates gracefully.** Beyond about $4V_\mathrm{T}$ all the tail goes
  one way. The $\tanh$ is a soft limiter, and that is useful on purpose in
  oscillators, where something has to set the amplitude.
- **It rejects what is common.** Move both inputs together and the tail current
  does not care, so the output does not move. The common-mode rejection is set
  by how constant the tail source is, that is by its output resistance, which
  is chapter 1 again.

The same pair with the tail current itself modulated by a second input is the
**Gilbert cell**, a four-quadrant multiplier. It is the standard analog
multiplier and the standard mixer, and it works because $\tanh$ is odd and the
tail scales the whole characteristic. The multiplier that chapter 7 listed as
an analog-computer motif is this circuit.

## The current mirror {: #mirror }

Two matched transistors with their bases tied and one of them diode-connected.
The diode-connected one converts an input current into the $v_\mathrm{BE}$ that
produces it; the other, seeing the same $v_\mathrm{BE}$, produces the same
current:

$$
I_\mathrm{out} = I_\mathrm{in}\,\frac{A_2}{A_1} ,
$$

scaled by the ratio of device areas. The output resistance is $r_\mathrm{o}$,
so a mirror is a good current source in chapter 1's sense, and the accuracy
depends on matching rather than on absolute values. **Integrated analog design
is built on this observation**: absolute component values on a chip are poor,
20 % or worse, while ratios between adjacent identical devices are excellent,
a fraction of a percent. Every bias current on a chip is a mirrored copy of
one reference, and the reference is the bandgap built from chapter 5's
$\Delta v = V_\mathrm{T}\ln(i_1/i_2)$.

## Inside the op-amp {: #inside }

Chapter 6 treated the device as a black box. It is four blocks, all now
familiar.

1. **A differential pair** as the input stage, setting the offset, the noise
   and the input current.
2. **A current mirror as its load**, which converts the differential current
   into a single-ended one and gives the stage a high impedance and therefore a
   large gain.
3. **A second gain stage**, a common emitter with a compensation capacitor
   across it. That capacitor is what creates the dominant pole of chapter 6,
   and the gain-bandwidth product is $g_\mathrm{m1}/(2\pi C_\mathrm{c})$. The
   slew rate is $I_\mathrm{T}/C_\mathrm{c}$: the tail current charging the same
   capacitor. Two datasheet numbers, one capacitor.
4. **An output stage**, a complementary pair of followers, giving current drive
   at unity voltage gain, with the output current limit and the crossover
   distortion that come with it.

Chapter 6's list of imperfections was not arbitrary. Each entry on it is one of
these four blocks failing to be ideal, and knowing which block is responsible
is how you pick a part.

## The transistor as a switch {: #switch }

Drive the base or gate hard and the device leaves the active region. A bipolar
in saturation drops $V_\mathrm{CE(sat)} \approx 0.2\ \mathrm{V}$, so it
dissipates $0.2\ \mathrm{V}\times I$ regardless of how small $I$ is. A MOSFET
in triode behaves as a resistance $R_\mathrm{DS(on)}$, milliohms in a power
part, so it dissipates $I^2R$ and gets better as the current falls. That single
difference is why power switching is MOSFETs and why saturated bipolar logic
was abandoned.

Digital electronics is this and nothing else: transistors driven to the ends of
their characteristics, where the only two interesting numbers are the on
resistance and the charge needed to get there. The whole of chapters 1 to 7 is
about the region in between, which digital design works hard to pass through
quickly and which analog design has to live in.

## Exercises {: #exercises }

1. A common emitter stage runs at $I_\mathrm{C} = 1\ \mathrm{mA}$ with
   $R_\mathrm{C} = 4.7\ \mathrm{k}\Omega$. Find $g_\mathrm{m}$, the voltage
   gain, and the gain once a 100 Ω emitter resistor is added. *(Roughly
   $-181$, falling to $-45$: the degeneration costs a factor of four and buys
   bias stability.)*
2. Show that adding $R_\mathrm{E}$ changes the gain to
   $-R_\mathrm{C}/(1/g_\mathrm{m} + R_\mathrm{E})$, and explain why this form
   makes the stage's linearity much better.
3. A differential pair has $I_\mathrm{T} = 100\ \mathrm{\mu A}$. Over what
   differential input is the $\tanh$ within 1 % of its tangent at the origin?
   Compare with the input offset voltage of a typical op-amp.
4. On the transistor bench, pick an operating point in the middle of the load
   line and read the gain. Then move the point close to each end and read it
   again. Explain both changes, and say which end clips first.

<p class="page-foot">That is the end of the written chapters. The whole series starts at <a href="/projects/analog-circuits/">the hub</a>.</p>
