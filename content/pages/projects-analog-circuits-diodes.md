---
title: "Diodes and the first nonlinearity"
slug: projects/analog-circuits/diodes
template: circuit-chapter.html
chapter: 5
status: "Chapter 5 of 8 · 22 November 2026"
summary: >-
  The first component that breaks superposition, and the two tools that replace
  it: the load line drawn against a curve, and linearization around an
  operating point. The exponential characteristic, the models worth using,
  small-signal resistance, and the circuits that exploit a nonlinearity on
  purpose.
prev_url: /projects/analog-circuits/rlc/
prev_title: "Inductors, RLC and resonance"
next_url: /projects/analog-circuits/op-amps/
next_title: "Operational amplifiers"
---

## What breaks {: #what-breaks }

Everything so far rested on linearity, usually without saying so. Superposition
let us treat sources one at a time. Impedance worked because a sinusoid in gave
a sinusoid out at the same frequency. Thévenin's theorem assumed a straight
characteristic line. Doubling the input doubled the output.

A diode does none of this. Its characteristic is a curve, so:

- **Superposition fails.** The response to two inputs is not the sum of the
  responses.
- **New frequencies appear.** A sinusoid in gives harmonics out. This is a
  defect in an amplifier and the entire point in a mixer.
- **There is no impedance.** Not a single number, anyway.

Two tools survive, and the whole rest of the course is built on them.

1. **The load line, drawn against a curve.** Chapter 1's picture still works:
   the device imposes one relation between $v$ and $i$, the rest of the circuit
   imposes another, and the operating point is where they cross. Nothing in
   that argument needed either relation to be straight.
2. **Linearization around the operating point.** Pick the operating point, then
   treat small deviations from it with a straight-line approximation. The small
   signal then obeys every linear result in chapters 1 to 4.

The second move is the more important one by a long way. **It is how a
nonlinear device is made to do linear work**, and it is the reason chapters 6
and 8 are possible at all.

## The characteristic {: #shockley }

A $pn$ junction follows the Shockley equation,

$$
\begin{aligned}
i &= I_\mathrm{S}\left(\mathrm{e}^{v/(nV_\mathrm{T})} - 1\right) ,\\[2pt]
V_\mathrm{T} &= \frac{k_\mathrm{B}T}{q} ,
\end{aligned}
$$

where $I_\mathrm{S}$ is the saturation current, $n$ the ideality factor
(between 1 and 2, around 1 for a good signal diode), $v$ the forward voltage
and $V_\mathrm{T}$ the thermal voltage. At $T = 300\ \mathrm{K}$,
$V_\mathrm{T} = 25.9\ \mathrm{mV}$.

Two readings of the same formula:

**Forward**, where $v \gg nV_\mathrm{T}$, the $-1$ is irrelevant and the current
is a pure exponential. Inverting it,

$$
v = nV_\mathrm{T}\ln\frac{i}{I_\mathrm{S}} .
$$

The voltage is logarithmic in the current. A decade more current costs

$$
\Delta v = nV_\mathrm{T}\ln 10 \approx 60\ \mathrm{mV} ,
$$

for $n = 1$ at 300 K, which is the most useful number in the chapter.
**Sixty millivolts per decade.**
It is why "a diode drops 0.7 V" is a serviceable lie: going from 1 mA to 10 mA
moves the drop by 60 mV, and from 1 µA to 10 mA by only 240 mV. Over the whole
range anyone uses, the voltage barely moves, so pretending it is constant costs
little.

**Reverse**, where $v \ll -nV_\mathrm{T}$, the exponential vanishes and
$i \to -I_\mathrm{S}$. Typically nanoamperes, strongly temperature dependent,
and in a real part swamped by leakage. Far enough in reverse the junction
breaks down, which is a separate mechanism and the basis of the Zener diode.

## A load line against a curve {: #load-line }

Put a diode in series with a resistor across a supply $V$. The circuit imposes

$$
i = \frac{V - v}{R} ,
$$

a straight line from $(0, V/R)$ to $(V, 0)$, and the diode imposes the
exponential. The operating point is the intersection. There is no closed form
for it in elementary functions; the honest solution uses the Lambert $W$
function, and the practical one is a few iterations of bisection, which is what
the bench does.

<div class="ac-bench" data-applet="diode-load-line">
<p class="ac-fallback">This bench needs JavaScript. The Shockley equation and
the load line above are the content of the panel.</p>
</div>

Notice how insensitive the diode voltage is and how sensitive the current is.
Change the supply by a factor of two and the current changes by roughly a
factor of two while the drop moves by some tens of millivolts. **The series
resistor sets the current; the diode only decides what to charge for it.**

## Models, in order of laziness {: #models }

| model | statement | use it when |
|---|---|---|
| **ideal switch** | 0 V forward, open reverse | checking which way current goes; supply voltages far above 1 V |
| **constant drop** | 0.7 V forward (0.3 V Schottky, 2 V LED) | almost all power and logic estimates |
| **drop plus resistance** | $0.7\ \mathrm{V} + i\,r_\mathrm{s}$ | currents above tens of milliamps |
| **full exponential** | Shockley | anything where the 60 mV/decade matters: log amps, references, temperature sensors |

Pick the laziest model the question tolerates. Using Shockley where the
constant drop suffices is not more rigorous, it is just slower, and it hides
which term dominates. Using the constant drop in a log amplifier is simply
wrong, because there the exponential is the circuit.

## Small-signal resistance {: #small-signal }

Here is the move. Sit at an operating point $(V_\mathrm{D}, I_\mathrm{D})$ and
ask what a small change does. Differentiate the characteristic:

$$
\frac{\mathrm{d}i}{\mathrm{d}v} = \frac{I_\mathrm{S}}{nV_\mathrm{T}}\,
\mathrm{e}^{v/(nV_\mathrm{T})} \approx \frac{i}{nV_\mathrm{T}} ,
$$

so the **small-signal resistance**, also called the dynamic or incremental
resistance, is

$$
r_\mathrm{d} = \frac{\mathrm{d}v}{\mathrm{d}i}\bigg|_{I_\mathrm{D}}
= \frac{nV_\mathrm{T}}{I_\mathrm{D}} .
$$

At 1 mA and $n = 1$ that is 25.9 Ω. At 100 µA it is 259 Ω. **The slope is set
by the current alone**, not by the device, the area or the temperature except
through $V_\mathrm{T}$. Two diodes from different manufacturers at the same
current have the same $r_\mathrm{d}$, which is a strong statement and the
reason the same formula reappears as $g_\mathrm{m} = I_\mathrm{C}/V_\mathrm{T}$
for the bipolar transistor in chapter 8.

Say what this means precisely, because it is easy to wave at. Write
$v = V_\mathrm{D} + \hat v$ and $i = I_\mathrm{D} + \hat i$ with
$|\hat v| \ll nV_\mathrm{T}$. Then $\hat i \approx \hat v / r_\mathrm{d}$, and
for the hatted quantities the diode **is** a resistor. Every technique from
chapters 1 to 4 applies to the hatted circuit: dividers, impedances, Thévenin,
Bode plots. The large-signal operating point and the small-signal behaviour are
computed separately and by different methods, and keeping the two apart is the
single most important habit in analog design.

The approximation has a stated range, and it is narrow. The second-order term
is down by $\hat v/(2nV_\mathrm{T})$, so a 2.6 mV swing on a 25.9 mV scale gives
about 5 % distortion. **Linear means millivolts here**, and when more swing is
needed it has to be bought with feedback, which is chapter 6.

## What diodes are for {: #uses }

**Rectification.** Pass one polarity, block the other. With a reservoir
capacitor the output ripple for a load current $I$ is

$$
\Delta V \approx \frac{I}{f_\mathrm{r}C} ,
$$

with $f_\mathrm{r}$ the ripple frequency: the line frequency for a half-wave
rectifier, twice it for a bridge. The derivation is one line and it is the
capacitor relation from chapter 3 with $\mathrm{d}v/\mathrm{d}t$ held constant
over the gap between peaks.

**Clamping and limiting.** A diode to a rail holds a node from going past that
rail by more than a drop. Across every relay coil and every motor, a diode
gives the inductor's current somewhere to go when the switch opens, which is
the problem chapter 4 raised and never solved.

**Making a fixed voltage.** A forward diode is a 0.7 V reference with a known
temperature coefficient; a Zener in reverse breakdown is a reference from 3 V
upwards. Both are cheap and both are mediocre, and the good references in
chapter 8 are built by cancelling one bad temperature coefficient against
another.

**Computing.** This is the one that matters here. Because $v \propto \ln i$,
an op-amp with a diode in the feedback path is a logarithmic amplifier, and the
same part in the input path is an exponential one. Put a log, a sum and an
antilog in series and you have

$$
\mathrm{e}^{\ln a + \ln b} = ab ,
$$

an analog multiplier built out of the exponential of a junction. That is how
multiplication was done on analog computers before four-quadrant multipliers
existed, and the modern versions use the same identity with transistors instead
of diodes because they match better. **The nonlinearity is not an error term
here. It is the function.**

## Temperature {: #temperature }

At fixed current the forward voltage falls by about

$$
\frac{\mathrm{d}v}{\mathrm{d}T} \approx -2\ \frac{\mathrm{mV}}{\mathrm{K}} ,
$$

which comes out of $I_\mathrm{S}(T)$ growing faster than the explicit
$V_\mathrm{T}$ in the exponent, not from $V_\mathrm{T}$ alone. Two consequences
pull in opposite directions. It makes a bare diode a poor reference, 7 % over a
10 K room-temperature drift. It also makes a junction an excellent thermometer,
linear over hundreds of kelvin, which is how most on-chip temperature sensors
work.

For the log amplifier above, both $V_\mathrm{T}$ and $I_\mathrm{S}$ sit in the
answer, so an uncompensated log amp is a thermometer with a signal input. The
fix is to take the **difference** of two junctions at the same temperature
carrying different currents,

$$
\Delta v = nV_\mathrm{T}\ln\frac{i_1}{i_2} ,
$$

which removes $I_\mathrm{S}$ entirely and leaves a clean, predictable
proportionality to absolute temperature. This expression is the seed of the
bandgap reference and it reappears in chapter 8.

## Exercises {: #exercises }

1. A diode carries 1 mA at 0.65 V with $n = 1$. What is $I_\mathrm{S}$? What
   voltage does it have at 10 µA, and at 100 mA? *(Roughly 0.53 V and 0.77 V:
   the whole useful range fits inside a quarter of a volt.)*
2. A 5 V supply drives an LED, $V_\mathrm{f} = 2.0\ \mathrm{V}$ at 20 mA,
   through a resistor. Choose the resistor. Then, using 60 mV/decade, estimate
   the current if the supply sags to 4.5 V and compare with the constant-drop
   answer.
3. Show that two identical junctions at the same temperature, carrying
   currents in a 10:1 ratio, differ in voltage by 59.5 mV at 300 K, and that
   this difference is proportional to $T$ with no device parameters in it.
4. On the diode bench, fix $R$ and sweep the supply over a decade. Plot the
   diode voltage against the log of the current from the readouts and extract
   the slope. You should recover $nV_\mathrm{T}$.

<p class="page-foot"><em>Next:</em> <a href="/projects/analog-circuits/op-amps/">Operational amplifiers</a>, where a large gain and negative feedback make a mediocre device behave exactly.</p>
