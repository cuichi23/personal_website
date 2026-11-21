---
title: "Resistive networks and loading"
slug: projects/analog-circuits/resistive-networks
template: circuit-chapter.html
chapter: 2
status: "Chapter 2 of 8 · 21 November 2026"
summary: >-
  Kirchhoff's two laws, series and parallel, and the voltage divider that hides
  inside every other circuit. Then the thing textbooks mention and beginners
  forget: a divider stops dividing the moment something is connected to it.
  Output resistance, the rule of ten, and why matching a load for maximum power
  throws half the power away.
prev_url: /projects/analog-circuits/sources/
prev_title: "Sources and internal resistance"
---

## Two laws and nothing else {: #kirchhoff }

Everything in this chapter follows from two statements, both of them
conservation laws wearing circuit clothes.

**Kirchhoff's current law (KCL).** The currents into any node sum to zero:

$$
\sum_k i_k = 0 .
$$

Charge does not pile up at a junction. If three wires meet and two carry
current in, the third carries their sum out.

**Kirchhoff's voltage law (KVL).** The voltages around any closed loop sum to
zero:

$$
\sum_k v_k = 0 .
$$

Go round a loop and come back to where you started, and you are at the same
potential you left. This is only true because the electric field is
conservative in the quasi-static regime, which is the assumption that quietly
underlies all of circuit theory. Chapter 4 will say where it stops holding.

From those two, plus Ohm's law, the two combination rules follow in a line
each. In series the current is shared and the voltages add:

$$
R_\text{series} = R_1 + R_2 + \dots
$$

In parallel the voltage is shared and the currents add:

$$
\frac{1}{R_\text{parallel}} = \frac{1}{R_1} + \frac{1}{R_2} + \dots
\qquad\text{so for two resistors}\qquad
R_1 \parallel R_2 = \frac{R_1 R_2}{R_1 + R_2} .
$$

Two facts about the parallel rule are worth storing because they let you check
a result without arithmetic. **A parallel combination is always smaller than
the smallest of its parts**, and if one resistor is at least ten times the
other, the combination is within 10 % of the smaller one. Most of the
estimating in this chapter is that second sentence.

## The voltage divider {: #divider }

Two resistors in series across a source, output taken from the middle. It is
the most common sub-circuit there is, and the formula is one application of
each law:

$$
V_\text{out} = V_\text{in}\,\frac{R_2}{R_1 + R_2} .
$$

Here $R_1$ is the upper resistor, between the input and the output node, and
$R_2$ the lower one, between the output node and ground.

Notice what the formula does **not** contain: any absolute resistance. Only the
ratio matters. A 1 kΩ/1 kΩ divider and a 1 MΩ/1 MΩ divider both halve the
input. They are not interchangeable, and the reason is the whole rest of this
chapter.

### What the divider looks like from outside {: #output-resistance }

Chapter 1 ended with the claim that any two-terminal linear network collapses
to one source and one resistance. Apply it here.

The open-circuit voltage is the divider formula above. For the resistance, the
recipe is: **set every independent source to zero and look back into the
terminals.** Setting a voltage source to zero means replacing it with a short,
because that is the resistance of an ideal voltage source. Do that, and $R_1$
and $R_2$ both run from the output node to ground. They are in parallel:

$$
V_\mathrm{th} = V_\text{in}\,\frac{R_2}{R_1 + R_2},
\qquad
R_\mathrm{th} = R_1 \parallel R_2 = \frac{R_1R_2}{R_1 + R_2} .
$$

So the divider *is* a real voltage source in the sense of chapter 1, and its
internal resistance is the parallel combination. The 1 kΩ divider has
$R_\mathrm{th} = 500\ \Omega$; the 1 MΩ divider has $R_\mathrm{th} =
500\ \mathrm{k}\Omega$. Identical ratios, internal resistances a thousand
apart. That is the difference between them, and it only shows up when
something is connected.

## Loading {: #loading }

Connect a load $R_\mathrm{L}$ from the output node to ground. It sits in
parallel with $R_2$, and the divider now divides with that combination instead:

$$
V_\text{out} = V_\text{in}\,
\frac{R_2 \parallel R_\mathrm{L}}{R_1 + (R_2 \parallel R_\mathrm{L})} .
$$

Since a parallel combination is always smaller than either part, the lower leg
has shrunk, and **the output is always lower than the unloaded formula
promised.** Never higher. The error has a sign, and knowing the sign is half of
estimating it.

In terms of the Thévenin picture the same statement is one divider:

$$
V_\text{out} = V_\mathrm{th}\,
\frac{R_\mathrm{L}}{R_\mathrm{th} + R_\mathrm{L}} ,
$$

which says the whole thing depends on one ratio, $R_\mathrm{L}/R_\mathrm{th}$.
That is the number to think in.

### The bench {: #bench-divider }

Set the two resistors, then bring the load down from the open circuit and watch
the curve leave the dashed line.

<div class="ac-bench" data-applet="loaded-divider">
<p class="ac-fallback">This bench needs JavaScript. The two expressions above
are what it evaluates.</p>
</div>

### The rule of ten {: #rule-of-ten }

Put numbers on the ratio and the working rule falls out:

| $R_\mathrm{L}/R_\mathrm{th}$ | output as a fraction of $V_\mathrm{th}$ | error |
|---|---|---|
| 1 | 0.500 | −50 % |
| 3 | 0.750 | −25 % |
| 10 | 0.909 | −9.1 % |
| 100 | 0.990 | −0.99 % |
| 1000 | 0.999 | −0.1 % |

The shape is $R_\mathrm{L}/(R_\mathrm{th}+R_\mathrm{L})$, so the error is
roughly $-R_\mathrm{th}/R_\mathrm{L}$ once the ratio is comfortably above one.
A factor of ten costs about 10 %; a factor of a hundred costs about 1 %.

**The rule of ten** — make the input resistance of a stage at least ten times
the output resistance of the one before it — is therefore a 10 % rule, not an
accuracy guarantee. It is the right default when you are deciding whether a
circuit is sane. It is the wrong default when you need a measurement, and then
you want a hundred, or a buffer.

This is also the honest answer to "why not just use megohm dividers
everywhere, they waste less current". Because $R_\mathrm{th}$ scales with them,
and at 500 kΩ almost everything you might connect is a load.

### Two worked consequences {: #consequences }

**A multimeter is a load.** A 10 MΩ input measuring the 1 MΩ/1 MΩ divider sees
$R_\mathrm{th} = 500\ \mathrm{k}\Omega$, a ratio of 20, and reads about 4.8 %
low. The reading is not wrong; the circuit genuinely changed when you attached
the meter. On the 1 kΩ/1 kΩ divider the same meter reads correctly to one part
in twenty thousand.

**An oscilloscope probe is worse than it looks.** A ×1 probe presents about
1 MΩ and, more importantly, 50–100 pF. The resistance is a chapter-2 problem;
the capacitance is a chapter-3 problem and usually the one that bites.

## Matching, and what matching costs {: #matching }

One question remains from chapter 1: which load extracts the most power from a
given source? Write the power in the load of a Thévenin source,

$$
P_\mathrm{L} = I^2 R_\mathrm{L}
= \frac{V_\mathrm{th}^2 R_\mathrm{L}}{(R_\mathrm{th} + R_\mathrm{L})^2} ,
$$

differentiate with respect to $R_\mathrm{L}$ and set the result to zero. The
maximum sits at

$$
R_\mathrm{L} = R_\mathrm{th},
\qquad
P_\mathrm{max} = \frac{V_\mathrm{th}^2}{4R_\mathrm{th}} .
$$

This is the **maximum power transfer** condition, and it is the most
over-applied result in elementary circuit theory. Look at what it costs. At the
matched point the two resistances are equal and carry the same current, so they
dissipate the same power: **half of everything the source produces is burnt
inside the source.** The efficiency is exactly 50 %.

$$
\eta = \frac{P_\mathrm{L}}{P_\text{total}}
= \frac{R_\mathrm{L}}{R_\mathrm{th} + R_\mathrm{L}} .
$$

Efficiency rises monotonically with $R_\mathrm{L}$, while power peaks and then
falls. The two want opposite things, and which one you want depends on what is
scarce.

- **Match** when the source is fixed and small and you need every microwatt of
  it: an antenna, a sensor, a piezo element. Also, in radio, to avoid
  reflections, which is a different argument for the same number.
- **Do not match** when the power is cheap and you care about the signal or the
  heat: anything mains-powered, any amplifier chain, any logic. There you want
  $R_\mathrm{L} \gg R_\mathrm{th}$ and the rule of ten.

A power station does not match its load to the grid impedance. If it did, half
the generated energy would heat the generator.

<div class="ac-bench" data-applet="thevenin-power">
<p class="ac-fallback">This bench needs JavaScript. The power and efficiency
expressions above are what it plots.</p>
</div>

## Where this is going {: #next }

Every fix for a loading problem is the same fix: put something between the two
stages whose input resistance is high and whose output resistance is low. That
something is a buffer, it is built from an operational amplifier, and it is
chapter 6. The reason it can be built at all is that an amplifier is an active
device: it does not pass the signal through, it reproduces it from a separate
supply. Chapter 8 is where that comes from.

Before either of those, the components stop being resistors. Chapter 3 replaces
$R$ with something that depends on frequency, and almost everything on this
page survives the substitution with $R$ rewritten as $Z$.

## Exercises {: #exercises }

1. A 12 V supply feeds a 4.7 kΩ / 2.2 kΩ divider. What is the unloaded output,
   and what is $R_\mathrm{th}$? What does a 10 kΩ load do to the output?
   *(Answers: 3.83 V, 1.50 kΩ, and the output falls to about 3.33 V, 13 % low.)*
2. You need 2.50 V from a 5.00 V rail, accurate to 1 %, into a load that may be
   as low as 50 kΩ. Choose $R_1$ and $R_2$. State the constraint you used.
3. Show that for a fixed $R_\mathrm{L}$ and a free $R_\mathrm{th}$, the power in
   the load is maximized by $R_\mathrm{th} \to 0$, not by matching. Explain in
   one sentence why this is not a contradiction with the result above.
4. A sensor is a Thévenin source of 10 mV with $R_\mathrm{th} = 100\ \mathrm{k}
   \Omega$. You have two amplifiers available, one with an input resistance of
   1 MΩ and one with 100 MΩ. How much signal does each lose, and does the
   difference matter if the specification is 1 %?

<p class="page-foot"><em>Previous:</em> <a href="/projects/analog-circuits/sources/">Sources and internal resistance</a>.</p>
