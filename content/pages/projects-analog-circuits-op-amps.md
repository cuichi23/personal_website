---
title: "Operational amplifiers"
slug: projects/analog-circuits/op-amps
template: circuit-chapter.html
chapter: 6
status: "Chapter 6 of 8 · 22 November 2026"
summary: >-
  A device with a huge, badly specified gain, made exact by feedback. The two
  rules and where they come from, the stages built on them, the buffer that
  finally answers chapter 2, and then the honest version: finite loop gain,
  gain-bandwidth product, slew rate, offsets, and the stability question that
  decides whether a circuit works or sings.
prev_url: /projects/analog-circuits/diodes/
prev_title: "Diodes and the first nonlinearity"
next_url: /projects/analog-circuits/motifs/
next_title: "Motifs: the blocks circuits are made of"
---

## A deliberately excessive amplifier {: #idea }

An operational amplifier is a differential amplifier with an enormous voltage
gain:

$$
v_\mathrm{out} = A\,(v_+ - v_-) ,
$$

where $v_+$ and $v_-$ are the non-inverting and inverting input voltages and
$A$ is the open-loop gain, typically $10^5$ to $10^6$ at DC. It is also badly
specified. $A$ varies by a factor of three between parts from the same reel, it
drifts with temperature, and it collapses with frequency.

That sounds like a bad component, and on its own it is useless: with
$A = 10^5$ and a 15 V supply, an input difference of 150 µV already saturates
the output. The device cannot be used open loop for anything except comparing.

The idea that rescues it is the central idea of analog electronics. **Make the
gain far larger than needed, then throw almost all of it away through feedback
in exchange for precision.** What comes back is a circuit whose behaviour is
set by a ratio of two resistors, which can be made accurate to a part in
$10^4$, instead of by a semiconductor parameter, which cannot.

## The two rules, and where they come from {: #rules }

With negative feedback in place, two rules make most op-amp circuits a line of
algebra:

1. The output does whatever it must so that $v_+ = v_-$.
2. No current flows into either input.

Rule 2 is a device property: the input stage is built so that its input current
is picomperes to nanoamperes, negligible against the circuit's currents. Rule 1
is not a device property and it is worth deriving rather than believing.

Take the non-inverting amplifier: the output feeds a divider $R_1$, $R_\mathrm{f}$
and the divider's tap returns to $v_-$. Writing $\beta = R_1/(R_1+R_\mathrm{f})$
for the fraction fed back,

$$
\begin{aligned}
v_\mathrm{out} &= A\,(v_\mathrm{in} - \beta\,v_\mathrm{out}) ,\\[4pt]
G = \frac{v_\mathrm{out}}{v_\mathrm{in}} &= \frac{A}{1 + A\beta} .
\end{aligned}
$$

This single expression is the whole theory. The product $A\beta$ is the **loop
gain**: the gain all the way round the loop. When it is large,

$$
G \to \frac{1}{\beta} = 1 + \frac{R_\mathrm{f}}{R_1} ,
$$

and $A$ has disappeared. The input difference needed to sustain the output is
$v_\mathrm{out}/A$, which goes to zero as $A$ grows, and that is rule 1. It is
an approximation with a stated error, not an axiom, and the error is

$$
\frac{G - 1/\beta}{1/\beta} = \frac{-1}{1 + A\beta} \approx \frac{-1}{A\beta} .
$$

**Everything good about an op-amp circuit is proportional to $1/(1+A\beta)$.**
Gain error, output resistance, distortion from the device's own nonlinearity:
all divided by the loop gain. With $A = 10^5$ and a gain of 10, $A\beta = 10^4$
and the gain error is 0.01 %. That is why the circuit is better than the part
it is made of.

## The stages {: #stages }

Three circuits, and the algebra for each is two lines with the rules above.

**Non-inverting amplifier.** Input at $v_+$, divider from the output to $v_-$.

$$
G = 1 + \frac{R_\mathrm{f}}{R_1} ,
$$

input resistance essentially infinite, output resistance essentially zero, gain
at least 1.

**Buffer, or voltage follower.** The same circuit with $R_\mathrm{f} = 0$ and
$R_1 = \infty$, so $G = 1$. A gain of one sounds pointless and is the most
useful circuit on the page.

**This is chapter 2's answer.** A voltage divider has a source resistance
$R_1\parallel R_2$ and sags when loaded; a filter cascade in chapter 3 did not
multiply because the second stage loaded the first. Put a buffer in between and
the problem disappears: it presents almost no load to what drives it and
behaves almost like an ideal source to what follows. It converts a stiff
voltage at a weak node into the same voltage at a strong node, and it does so
because the feedback divides its output resistance by $1 + A\beta$.

**Inverting amplifier.** Input through $R_1$ to $v_-$, feedback $R_\mathrm{f}$
from the output to the same node, $v_+$ grounded.

Rule 1 forces $v_- = 0$ even though nothing connects it to ground. This node is
the **virtual ground**, and it is the most useful idea in the chapter. The
input current is then $v_\mathrm{in}/R_1$, rule 2 sends all of it through
$R_\mathrm{f}$, and

$$
v_\mathrm{out} = -\frac{R_\mathrm{f}}{R_1}\,v_\mathrm{in} .
$$

The input resistance is $R_1$ exactly, not infinity, because the source really
does drive a resistor to a held node. That is the price of the inverting
topology and the reason the two forms are both kept.

**Summing.** Because the virtual ground holds at zero, several inputs through
their own resistors contribute independent currents that simply add:

$$
v_\mathrm{out} = -R_\mathrm{f}\left(\frac{v_1}{R_1} + \frac{v_2}{R_2} + \cdots\right) .
$$

The inputs do not interact at all. That is what a virtual ground buys, and it
is why the summing junction is the workhorse of analog computing: weighted
addition for the cost of one resistor per term.

**Difference amplifier.** Two inputs, four resistors, output
$\frac{R_\mathrm{f}}{R_1}(v_2 - v_1)$ provided the two ratios match. The common
mode rejection is set by that match, not by the op-amp: a 1 % mismatch limits
rejection to about 50 dB however good the device is. Chapter 7 fixes this with
the instrumentation amplifier.

## Integrator and differentiator {: #integrator }

Replace $R_\mathrm{f}$ in the inverting amplifier with a capacitor. The virtual
ground still forces the input current to be $v_\mathrm{in}/R$, and that current
now has nowhere to go but into $C$:

$$
\begin{aligned}
C\,\frac{\mathrm{d}v_\mathrm{out}}{\mathrm{d}t} &= -\frac{v_\mathrm{in}}{R} ,\\[4pt]
v_\mathrm{out}(t) &= -\frac{1}{RC}\int_0^t v_\mathrm{in}(t')\,\mathrm{d}t' + v_\mathrm{out}(0) .
\end{aligned}
$$

**A true integrator, at all frequencies**, not the approximate one chapter 3
got from a passive RC far above its cutoff, and without the loss of amplitude.
The difference is entirely the feedback: the capacitor charges against a node
that is held at zero, so the integration does not slow down as the output
grows.

This is the central element of an analog computer. A differential equation
becomes a diagram by solving it for the highest derivative and integrating down
to the function, with summers and coefficients closing the loops. The initial
condition $v_\mathrm{out}(0)$ is the capacitor's starting charge, which is why
every analog-computer integrator has a reset switch and an initial-condition
input in hardware.

Two things spoil a real integrator, and both come from the fact that it has
infinite gain at DC:

- **Input offset voltage and bias current integrate too.** A constant error at
  the input ramps the output until it hits a rail. A large resistor across the
  feedback capacitor bounds the DC gain and stops the drift, at the price of
  the integration failing below $1/(2\pi R_\mathrm{DC}C)$.
- **It has to be told when to start.** Without a reset, the output is the
  integral of everything since power-on.

The **differentiator** is the same circuit with $R$ and $C$ swapped,
$v_\mathrm{out} = -RC\,\dot v_\mathrm{in}$. It is rarely used as written. Its
gain rises with frequency, so it amplifies noise without limit and its loop
gain falls where the op-amp is least able to cope, which makes it prone to
ringing. The usual version has a resistor in series with the input capacitor to
stop the rise above some frequency, and the clean way to get a derivative is
usually not to take one.

## The honest version {: #real }

The two rules are first-order. The things that break them are the content of
every op-amp datasheet.

**Finite gain, and gain that runs out.** $A$ is not constant with frequency. An
internally compensated op-amp is deliberately given a single dominant pole, so
above a few hertz

$$
A(f) \approx \frac{A_0}{1 + \mathrm{i}f/f_\mathrm{p}} \approx \frac{\mathrm{GBW}}{\mathrm{i}f} ,
$$

with GBW the **gain-bandwidth product**, the frequency at which the open-loop
gain passes through 1. The consequence is the most quoted rule in the subject:

$$
f_{-3\,\mathrm{dB}} = \frac{\mathrm{GBW}}{G} .
$$

Gain and bandwidth trade one for one. A 10 MHz part at a gain of 100 is a
100 kHz circuit. Note what this is really saying: the loop gain $A\beta$ falls
at 20 dB/decade, so all the precision above also decays at 20 dB/decade. **An
op-amp circuit is only as good as its loop gain at the frequency of interest**,
and the DC specification on the front page of the datasheet is the best it will
ever be.

One subtlety that catches people. The $G$ in that rule is $1/\beta$, called the
**noise gain**, and it is the same for both topologies because both use the
same feedback divider. The inverting stage's signal gain is
$-R_\mathrm{f}/R_1$ but its noise gain is $1 + R_\mathrm{f}/R_1$. An inverting
amplifier at a gain of $-1$ therefore has the bandwidth, the gain error and
the output noise of a non-inverting amplifier at $+2$, not at $+1$. The
feedback does not know which input the signal came in on.

<div class="ac-bench" data-applet="opamp-loop">
<p class="ac-fallback">This bench needs JavaScript. The relation
$G = A/(1+A\beta)$ and the gain-bandwidth rule above are the content of the
panel.</p>
</div>

**Slew rate.** A large-signal limit, and a different mechanism: the internal
compensation capacitor can only be charged by the input stage's finite tail
current, so

$$
\left|\frac{\mathrm{d}v_\mathrm{out}}{\mathrm{d}t}\right| \le \mathrm{SR} .
$$

A sine of amplitude $\hat V$ at frequency $f$ needs $2\pi f\hat V$, so the
largest undistorted sine is $f_\mathrm{max} = \mathrm{SR}/(2\pi\hat V)$. This
is not the same limit as the bandwidth and it bites first on big signals: a
1 V/µs part cannot produce a 10 V amplitude sine above 16 kHz, whatever its
GBW says.

**Offsets and bias.** The input stage is not perfectly matched, so the output
is zero at some input difference $V_\mathrm{os}$ of a few hundred microvolts
(microvolts for a chopper part), with a temperature drift. The inputs also draw
a small bias current, and if the two inputs see different resistances to ground
that current becomes another offset. The classic countermeasure is to make the
two source resistances equal so the bias currents cancel to first order.

**Output limits.** The output cannot reach the rails, except in parts
advertised as rail-to-rail, and even those only approach them when lightly
loaded. The output current is limited, usually to a few tens of milliamps, and
the device folds back or heats up beyond that.

## Stability {: #stability }

Negative feedback at DC is not negative feedback at all frequencies. The loop
gain $A\beta$ has phase, and when its phase reaches $-180^\circ$ the feedback
has become positive. If $|A\beta| \ge 1$ there, the circuit oscillates.

The margin is read off the loop gain where $|A\beta| = 1$:

$$
\text{phase margin} = 180^\circ + \arg A\beta \big|_{|A\beta| = 1} .
$$

Each pole in the loop contributes up to $-90^\circ$ (chapter 3). One pole can
never reach $-180^\circ$, which is why op-amps are built with a dominant pole:
it makes the part unconditionally stable at unity gain by construction. A
second pole inside the loop is what causes trouble, and 60° of phase margin is
the usual target, corresponding to about 4 % overshoot in the step response.
The connection to chapter 4 is direct: phase margin and damping ratio describe
the same pole pair.

Where the second pole typically comes from:

- **A capacitive load.** The output resistance of the amplifier together with
  the load capacitance forms a pole inside the loop. A buffer driving a long
  cable is the textbook way to make an oscillator by accident. The fix is a
  small series resistor at the output, outside the feedback or inside it
  depending on the topology, which pushes the pole back out.
- **Stray capacitance at the inverting input.** Together with the feedback
  resistor this is another pole. The fix is a few picofarads across
  $R_\mathrm{f}$, which puts a zero in to cancel it.

The symptom of too little margin is a ringing step response, and of none at all
a clean sine at a frequency nobody asked for. If a newly built circuit produces
a sine wave, the first suspicion should be the loop and not the signal.

## Exercises {: #exercises }

1. A non-inverting amplifier is set for a gain of 50 with a part specified
   $A_0 = 2\times10^5$ and $\mathrm{GBW} = 4\ \mathrm{MHz}$. Find the DC gain
   error, the loop gain at DC and at 10 kHz, and the closed-loop bandwidth.
2. Show that the feedback divides the amplifier's open-loop output resistance
   by $1 + A\beta$. Then explain, in one sentence, why a buffer's output
   resistance rises with frequency.
3. An integrator has $R = 100\ \mathrm{k}\Omega$, $C = 10\ \mathrm{nF}$ and an
   input offset of 1 mV. How long until the output has drifted by 1 V with no
   input? What value of resistor across $C$ bounds that drift to 1 V, and what
   does it cost at 10 Hz?
4. On the op-amp bench, set a gain of 1000 and then a gain of 1 with the same
   part. Read the bandwidth in both cases and confirm the product. Then explain
   why the gain error at DC is worse in the first case.

<p class="page-foot"><em>Next:</em> <a href="/projects/analog-circuits/motifs/">Motifs</a>, where these stages combine into the handful of blocks that real schematics are assembled from.</p>
