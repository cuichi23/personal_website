---
title: "Inductors, RLC and resonance"
slug: projects/analog-circuits/rlc
template: circuit-chapter.html
chapter: 4
status: "Chapter 4 of 8 · 22 November 2026"
summary: >-
  A second energy store turns the exponential into a ringing. The second-order
  equation, the three damping regimes and the pole pair behind them, resonance
  and the quality factor, and what happens to a circuit when the damping is
  driven towards zero. This is the chapter the oscillator work stands on.
prev_url: /projects/analog-circuits/rc/
prev_title: "Capacitors and the RC circuit"
next_url: /projects/analog-circuits/diodes/
next_title: "Diodes and the first nonlinearity"
---

## The other way to store energy {: #inductor }

A capacitor stores energy in an electric field and resists a change of voltage.
An inductor stores energy in a magnetic field and resists a change of current.
Everything else follows by swapping the words.

$$
\begin{aligned}
v &= L\,\frac{\mathrm{d}i}{\mathrm{d}t} ,&
W &= \tfrac{1}{2}L\,i^2 ,&
Z_L &= \mathrm{i}\omega L ,
\end{aligned}
$$

where $L$ is the inductance in henries, $v$ the voltage across the coil and $i$
the current through it. The impedance follows from the same substitution as
before: put $i = \underline{I}\mathrm{e}^{\mathrm{i}\omega t}$ into the defining
relation and the derivative becomes a factor $\mathrm{i}\omega$.

The duality is exact, and writing it out once saves re-deriving anything:

| | capacitor | inductor |
|---|---|---|
| **state variable** | voltage $v$ | current $i$ |
| **defining relation** | $i = C\,\dot v$ | $v = L\,\dot i$ |
| **cannot jump** | the voltage | the current |
| **energy** | $\tfrac12 Cv^2$ | $\tfrac12 Li^2$ |
| **impedance** | $1/(\mathrm{i}\omega C)$ | $\mathrm{i}\omega L$ |
| **at DC** | open circuit | short circuit |
| **at high frequency** | short circuit | open circuit |
| **phase** | current leads by $90^\circ$ | current lags by $90^\circ$ |

The "cannot jump" row deserves the same warning chapter 1 gave about sources.
Interrupting the current in an inductor is the dual of shorting a capacitor:
the device tries to produce whatever voltage it takes to keep the current
going, and in a mechanical switch that voltage arrives as a spark. This is why
every relay coil in every circuit has a diode across it, and chapter 5 explains
what that diode does.

## Two stores, one equation {: #second-order }

Put $L$, $R$ and $C$ in series across a source $v_\mathrm{in}$. Kirchhoff's
voltage law and the three component relations give one equation in the
capacitor voltage,

$$
LC\,\ddot v_C + RC\,\dot v_C + v_C = v_\mathrm{in} .
$$

This is a damped harmonic oscillator, which is the same equation as a mass on a
spring in a viscous fluid, and the correspondence is worth keeping: $L$ is the
mass, $1/C$ the spring constant, $R$ the drag. Put it in the standard form

$$
\ddot v_C + 2\zeta\omega_0\,\dot v_C + \omega_0^2\,v_C = \omega_0^2\,v_\mathrm{in} ,
$$

with the two parameters that replace the three components,

$$
\begin{aligned}
\omega_0 &= \frac{1}{\sqrt{LC}} ,\\[4pt]
\zeta &= \frac{R}{2}\sqrt{\frac{C}{L}} ,\\[4pt]
Q &= \frac{1}{2\zeta} = \frac{1}{R}\sqrt{\frac{L}{C}} .
\end{aligned}
$$

Here $\omega_0$ is the undamped natural frequency, $\zeta$ the damping ratio and
$Q$ the quality factor. **Three components collapse into two numbers**, and
only those two numbers matter for the shape of the response. $L$ and $C$ set
where it happens, $R$ sets how violently.

The characteristic roots are

$$
s_{1,2} = -\zeta\omega_0 \pm \omega_0\sqrt{\zeta^2 - 1} ,
$$

and everything the circuit does in time is read off their position in the
complex plane. The real part is the decay rate; the imaginary part, when there
is one, is the ringing frequency.

## Three regimes {: #regimes }

| $\zeta$ | roots | step response |
|---|---|---|
| $\zeta > 1$ **overdamped** | two real, negative | two exponentials, no overshoot, slow |
| $\zeta = 1$ **critically damped** | one double real root | fastest approach without overshoot |
| $\zeta < 1$ **underdamped** | complex conjugate pair | ringing at $\omega_\mathrm{d}$, decaying as $\mathrm{e}^{-\zeta\omega_0 t}$ |

For the underdamped case the damped frequency is

$$
\omega_\mathrm{d} = \omega_0\sqrt{1 - \zeta^2} ,
$$

and the step response of the capacitor voltage is

$$
v_C(t) = V\left[1 - \mathrm{e}^{-\zeta\omega_0 t}
\left(\cos\omega_\mathrm{d}t + \frac{\zeta}{\sqrt{1-\zeta^2}}\sin\omega_\mathrm{d}t\right)\right] .
$$

The first overshoot is a clean function of the damping alone,

$$
\frac{v_\mathrm{peak} - V}{V} = \exp\!\left(\frac{-\pi\zeta}{\sqrt{1-\zeta^2}}\right) ,
$$

which gives 16 % at $\zeta = 0.5$, 4.3 % at $\zeta = 0.707$ and 0.0 % at
$\zeta = 1$. The value $\zeta = 1/\sqrt{2}$ turns up constantly because it is
the damping that makes the frequency response as flat as possible without
peaking. It is called the Butterworth response and chapter 7 builds filters out
of it.

**Critical damping is the fastest settling, not the fastest rise.** An
overdamped circuit rises more slowly; an underdamped one rises faster but then
spends time ringing. If the specification is "within 1 % and stay there",
$\zeta$ slightly below 1 usually wins.

### The bench {: #bench-step }

Drag $R$ down from large to small and watch the two real roots approach each
other on the negative real axis, collide at $\zeta = 1$, and then split into a
conjugate pair that walks towards the imaginary axis. The step response does
the corresponding thing. The pole picture and the time picture are the same
statement.

<div class="ac-bench" data-applet="rlc-step">
<p class="ac-fallback">This bench needs JavaScript. The step response and the
root expression above are the content of the panel.</p>
</div>

## Resonance {: #resonance }

Drive the same series circuit with a sinusoid instead of a step. The total
impedance is

$$
Z(\omega) = R + \mathrm{i}\omega L + \frac{1}{\mathrm{i}\omega C}
= R + \mathrm{i}\left(\omega L - \frac{1}{\omega C}\right) .
$$

The reactive part vanishes when $\omega L = 1/(\omega C)$, that is at
$\omega = \omega_0$. There the impedance is purely resistive and at its
smallest, the current is at its largest, and the circuit is **in resonance**.
The voltages across $L$ and $C$ individually are then $Q$ times the drive and
cancel each other exactly. A series RLC with $Q = 50$ driven by 1 V has 50 V
across the inductor, which surprises people once.

Reading the output across the resistor gives a band-pass,

$$
H(\omega) = \frac{R}{Z(\omega)}
= \frac{1}{1 + \mathrm{i}Q\left(\dfrac{\omega}{\omega_0} - \dfrac{\omega_0}{\omega}\right)} ,
$$

whose magnitude is 1 at $\omega_0$ and falls on both sides. The half-power
points are where the bracket equals $\pm 1/Q$, and the width between them is

$$
\Delta\omega = \frac{\omega_0}{Q} = \frac{R}{L} .
$$

**$Q$ is the ratio of centre frequency to bandwidth**, which is the definition
to remember, and it is numerically the same as

$$
Q = 2\pi\,\frac{\text{energy stored}}{\text{energy lost per cycle}} ,
$$

which is the definition that explains why it is called a quality factor and
which transfers unchanged to a pendulum, an optical cavity or a nuclear
resonance. A circuit and an atom are described by the same two numbers here.

<div class="ac-bench" data-applet="rlc-resonance">
<p class="ac-fallback">This bench needs JavaScript. The band-pass expression
and the bandwidth relation above are the content of the panel.</p>
</div>

## What happens as the damping goes to zero {: #towards-oscillation }

Follow the pole pair as $R$ falls. It approaches the imaginary axis, the
ringing lasts longer, the resonance gets taller and narrower. At $R = 0$ the
poles sit exactly on the axis and the circuit rings forever at $\omega_0$,
exchanging energy between the two stores without loss. That is an oscillator,
and it is also an idealization no more realistic than the ideal sources of
chapter 1.

Every real coil and every real capacitor has loss, so the poles sit in the left
half plane and any disturbance dies. To build an oscillator you have to **put
the energy back**, with a circuit that behaves like a negative resistance over
the amplitude range of interest. Then the poles cross into the right half plane,
the amplitude grows, and some nonlinearity has to catch it and hold it. An
oscillator is therefore never a linear circuit, however linear its small-signal
model looks: amplitude is set by the nonlinearity and frequency by the
resonance.

This is where the course connects to what I do for a living. A phase-locked
loop is a resonator of this kind wrapped in a feedback loop that steers
$\omega_0$, and a network of them is what I write down as coupled phase
equations. In the models the quantity that matters is the phase; $Q$ enters as
the bandwidth over which a phase disturbance survives, and $R$ only appears
disguised as a damping constant. Here it is a part number.

## Real inductors are the worst component {: #real }

A capacitor is close to ideal over a wide range. An inductor is not, and the
differences show up early:

- **Series resistance.** The wire has resistance, and it is not small. A 10 mH
  coil might carry 20 Ω, which already caps $Q$ before anything else does.
- **Self-resonance.** The turns have capacitance between them. Above its
  self-resonant frequency an inductor is a capacitor, and the datasheet gives
  the frequency where it stops being what it says.
- **Core saturation.** Any inductor with a magnetic core has a current above
  which the permeability collapses and the inductance drops. The circuit then
  changes behaviour as a function of signal amplitude.
- **It is physically large and it couples.** An inductor broadcasts and
  receives a magnetic field, so two of them near each other are a transformer
  whether or not that was the intention.

For these reasons integrated analog design avoids inductors below the hundreds
of megahertz and synthesizes the behaviour instead. A **gyrator** is a circuit
that makes a capacitor look inductive from one port, and chapter 7 builds
resonant responses out of op-amps, resistors and capacitors with no coil
anywhere. The second-order equation of this chapter is what those circuits
reproduce; the component that produced it is optional.

## Exercises {: #exercises }

1. A series RLC has $L = 10\ \mathrm{mH}$, $C = 100\ \mathrm{nF}$ and
   $R = 50\ \Omega$. Find $f_0$, $\zeta$, $Q$, the bandwidth and the first
   overshoot of the step response. *(Answers: 5.03 kHz, 0.079, 6.32, 796 Hz,
   78 %.)*
2. Show that the parallel RLC is the dual of the series one, with
   $Q = R\sqrt{C/L}$. Note that $R$ now has to be **large** for a high $Q$,
   which is the same reversal as between the two sources in chapter 1.
3. At resonance the voltage across the inductor is $Q$ times the drive. Where
   does the extra energy come from, and why does this not violate anything?
4. Set $\zeta = 1/\sqrt{2}$ on bench 7 and read the overshoot; then set the
   same $\zeta$ on bench 8 and confirm the magnitude response has no peak.
   Those two facts are the same fact.

<p class="page-foot"><em>Next:</em> <a href="/projects/analog-circuits/diodes/">Diodes and the first nonlinearity</a>, where superposition stops working and two new tools replace it.</p>
