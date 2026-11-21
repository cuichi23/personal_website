---
title: "Sources and internal resistance"
slug: projects/analog-circuits/sources
template: circuit-chapter.html
chapter: 1
status: "Chapter 1 of 8 · 21 November 2026"
summary: >-
  A voltage source prescribes the voltage and lets the current follow. A
  current source does exactly the opposite. Everything else in this chapter
  is a consequence: what internal resistance is, which source survives a short
  and which survives an open circuit, which sources may be wired together, and
  why Thévenin and Norton are two names for one box.
next_url: /projects/analog-circuits/resistive-networks/
next_title: "Resistive networks and loading"
---

## Two ways to insist {: #two-ways }

A source is a component that forces something. There are exactly two things it
can force, and that gives exactly two idealizations.

A **voltage source** fixes the voltage across its terminals. Whatever you
connect, it holds $V$ and accepts whatever current that implies.

A **current source** fixes the current through its branch. Whatever you
connect, it pushes $I$ and accepts whatever voltage that implies.

That is the whole definition, and it is worth stating in the form that makes
the symmetry visible:

| | prescribes | adapts |
|---|---|---|
| **Voltage source** (Spannungsquelle) | the voltage | the current |
| **Current source** (Stromquelle) | the current | the voltage |

The adapting quantity is not free. It is set by Ohm's law in the load,

$$
R = \frac{V}{I} \qquad\Longleftrightarrow\qquad V = R\,I ,
$$

where $R$ is the load resistance, $V$ the voltage across it and $I$ the current
through it. The source names one of the two; the load names the ratio; the
third number follows. There is nothing else going on.

### The same operating point, reached from either side {: #same-point }

Take a 1 MΩ load and ask for 1 mA through it.

With a **current source**, you command the 1 mA. The load then develops

$$
V = R\,I = 10^{6}\,\Omega \times 10^{-3}\,\mathrm{A} = 1000\ \mathrm{V} .
$$

With a **voltage source**, you command 1000 V. The load then draws

$$
I = \frac{V}{R} = \frac{1000\ \mathrm{V}}{10^{6}\,\Omega} = 1\ \mathrm{mA} .
$$

Same resistor, same current, same voltage, same power. The two sources are
indistinguishable from outside. What differs is which number you set and which
one the circuit hands back to you, and therefore which one surprises you when
the load changes. Change the load to 1 kΩ: the current source still delivers
1 mA and the voltage collapses to 1 V; the voltage source still delivers
1000 V and the current rises to 1 A. Same change, opposite consequence.

A thousand volts out of a milliamp source also makes a second point, which is
worth absorbing early: **an ideal current source will produce whatever voltage
the load demands of it.** Nothing real does this. The fix is the next section.

## Internal resistance {: #internal-resistance }

A real source behaves like an ideal one with a resistor attached. Which side
the resistor goes on follows from what the source is trying to do.

- A real **voltage source** has $R_\mathrm{i}$ **in series**. The load and
  $R_\mathrm{i}$ divide the source voltage, so the terminal voltage sags as the
  current rises.
- A real **current source** has $R_\mathrm{i}$ **in parallel**. The internal
  resistance steals a share of the current, and that share grows as the
  terminal voltage rises.

Solving each is one line. For the voltage source,

$$
\begin{aligned}
I &= \frac{V_\mathrm{s}}{R_\mathrm{i} + R_\mathrm{L}} , &
V_\mathrm{L} &= V_\mathrm{s}\,\frac{R_\mathrm{L}}{R_\mathrm{i} + R_\mathrm{L}} ,
\end{aligned}
$$

and for the current source,

$$
\begin{aligned}
V_\mathrm{L} &= I_\mathrm{s}\,\frac{R_\mathrm{i}R_\mathrm{L}}{R_\mathrm{i} + R_\mathrm{L}} , &
I_\mathrm{L} &= I_\mathrm{s}\,\frac{R_\mathrm{i}}{R_\mathrm{i} + R_\mathrm{L}} ,
\end{aligned}
$$

with $V_\mathrm{s}$ the source voltage, $I_\mathrm{s}$ the source current,
$R_\mathrm{i}$ the internal resistance and $R_\mathrm{L}$ the load.

Read the two sets side by side and the duality is mechanical: swap voltage for
current, series for parallel, and $R_\mathrm{i} \to 0$ for
$R_\mathrm{i} \to \infty$, and each line becomes the other.

**The ideal limits are therefore opposite.** A voltage source is good when
$R_\mathrm{i}$ is *small*, because then the divider ratio stays near one. A
current source is good when $R_\mathrm{i}$ is *large*, because then it keeps
almost none of the current for itself.

$$
\begin{aligned}
\text{ideal voltage source:}\quad & R_\mathrm{i} \to 0 ,\\
\text{ideal current source:}\quad & R_\mathrm{i} \to \infty .
\end{aligned}
$$

### The bench {: #bench-source }

Both expressions, one panel. Switch the source type and the picture flips; the
plot is the pair $(V, I)$ the terminals can take, and the straight dashed line
is the load. Where the two cross is what the circuit does.

Three things are worth doing before reading on. Set a real voltage source and
drag the load down to the short. Set a real current source and drag it up to
the open. Then switch each to **ideal** and do the same again.

<div class="ac-bench" data-applet="source-load">
<p class="ac-fallback">This bench needs JavaScript. Without it, the four
expressions above are the whole content of the panel.</p>
</div>

The characteristic line tells the story at a glance. Its two intercepts are the
two extreme loads:

- the **open-circuit voltage** $V_\mathrm{oc}$, where the line meets the
  voltage axis ($I = 0$),
- the **short-circuit current** $I_\mathrm{sc}$, where it meets the current
  axis ($V = 0$).

The slope between them is $-1/R_\mathrm{i}$. An ideal voltage source is a
vertical line: any current, always the same voltage. An ideal current source is
a horizontal line: any voltage, always the same current. Every real source is a
slanted line between those two extremes, and $R_\mathrm{i}$ is the slant.

## What each ideal source cannot survive {: #limits }

The two idealizations fail at opposite ends, and each is perfectly comfortable
exactly where the other one dies.

| | short circuit ($R_\mathrm{L} = 0$) | open circuit ($R_\mathrm{L} \to \infty$) |
|---|---|---|
| **Ideal voltage source** | $I \to \infty$. The model breaks. | Fine. $V = V_\mathrm{s}$, no current, no power. |
| **Ideal current source** | Fine. $I = I_\mathrm{s}$, no voltage, no power. | $V \to \infty$. The model breaks. |

This is the single most useful thing in the chapter, so here it is in words.
**A voltage source is happy driving nothing and destroyed by a short. A current
source is happy driving a short and destroyed by nothing.** An open circuit is
the dangerous load for a current source in exactly the way a short is dangerous
for a voltage source, which is why you never open the secondary of a current
transformer and never short a charged battery.

Real parts do not go to infinity. They do something else:

- A real voltage source runs into its $R_\mathrm{i}$, and the short-circuit
  current settles at $V_\mathrm{s}/R_\mathrm{i}$. For a lithium cell with
  $R_\mathrm{i}$ of a few tens of milliohms that is still hundreds of amperes,
  which is why the failure is a fire and not a formula.
- A real current source runs out of supply voltage. The largest terminal
  voltage it can produce is its **compliance**, and past that it stops
  regulating the current at all. A current source datasheet always states a
  compliance range; it is the first number to check.

## Which sources may be wired together {: #combining }

Two sources, one connection. There are six cases and they are all decided by
the same question: **does the connection force the two sources to disagree
about a quantity one of them insists on?**

Series means one shared current. Parallel means one shared voltage.

<div class="ac-bench" data-applet="source-combinations">
<p class="ac-fallback">This bench needs JavaScript. The six cases are listed
in the table below.</p>
</div>

Collected as a table, with the reason in the last column:

| Connection | Verdict | Why |
|---|---|---|
| **V + V in series** | allowed, voltages add | Series constrains the current, which neither source claims. Both get to set their voltage, and the terminal voltage is the sum. |
| **V + V in parallel** | only if equal | Parallel constrains the voltage, which both claim. Two different claims have no solution. |
| **I + I in series** | only if equal | Series constrains the current, which both claim. Same contradiction, dual form. |
| **I + I in parallel** | allowed, currents add | Parallel constrains the voltage, which neither source claims. Kirchhoff's current law gives $I_1 + I_2$. |
| **V + I in series** | allowed, acts as a **current source** | A series voltage source cannot alter a current. It shifts the terminal voltage and nothing else. |
| **V + I in parallel** | allowed, acts as a **voltage source** | A parallel current source cannot alter a voltage. It shifts the terminal current and nothing else. |

The last two lines deserve their own sentence, because they are the ones people
get wrong. **In series the current source wins. In parallel the voltage source
wins.** In both cases the winner is the source whose prescribed quantity is the
one the connection shares, and the other source is demoted to an offset.

The two "only if equal" cases are not pedantry about ideal components. They
are the reason you do not simply bolt two batteries in parallel and hope: the
one with the higher open-circuit voltage drives a circulating current

$$
I_\text{circ} = \frac{V_1 - V_2}{R_{\mathrm{i},1} + R_{\mathrm{i},2}}
$$

into the other, limited by nothing but the two internal resistances. With
matched cells it is small. With a full cell and a flat one it is not.

## Thévenin and Norton {: #thevenin-norton }

Look again at the characteristic line. It is a straight line, it is fixed by
two numbers, and a real voltage source and a real current source produce
exactly the same line whenever

$$
\begin{aligned}
V_\mathrm{oc} &= I_\mathrm{s} R_\mathrm{i} , &
I_\mathrm{sc} &= \frac{V_\mathrm{s}}{R_\mathrm{i}} , &
R_\mathrm{th} &= R_\mathrm{i} .
\end{aligned}
$$

If two boxes produce the same line, no measurement at the terminals can
distinguish them. So they are the same source, written two ways:

- **Thévenin form**: a voltage source $V_\mathrm{th} = V_\mathrm{oc}$ in series
  with $R_\mathrm{th}$.
- **Norton form**: a current source $I_\mathrm{n} = I_\mathrm{sc}$ in parallel
  with the same $R_\mathrm{th}$.

and the conversion is one relation, $V_\mathrm{th} = I_\mathrm{n}R_\mathrm{th}$.
The bench prints both forms for whatever you have set up; switching the source
type while holding $R_\mathrm{i}$ moves you between them.

The theorem behind this is more general than the two-component case: *any*
two-terminal network of linear sources and resistances, however large, is
equivalent at its terminals to one source and one resistance. That is what
makes circuit analysis tractable, and chapter 2 uses it immediately.

A caution that matters later: the equivalence is **at the terminals only**. The
Thévenin and Norton versions of a box dissipate different amounts of power
inside themselves, so you cannot use the equivalent circuit to reason about the
heat in the original. With no load connected, the Thévenin form burns nothing
and the Norton form burns $I_\mathrm{n}^2 R_\mathrm{th}$.

## Exercises {: #exercises }

1. A battery measures 9.00 V with nothing connected and 8.40 V across a 100 Ω
   load. Find $R_\mathrm{i}$ and the short-circuit current. *(Answer: the load
   draws 84 mA, so $R_\mathrm{i} = 0.60\ \mathrm{V} / 84\ \mathrm{mA} \approx
   7.1\ \Omega$ and $I_\mathrm{sc} \approx 1.3\ \mathrm{A}$.)*
2. A current source is specified as 2 mA with a compliance of 10 V. What is
   the largest load it can drive while still delivering 2 mA? What happens
   above that? Check your answer on the bench by giving a real current source
   an $R_\mathrm{i}$ of 5 kΩ and sweeping the load.
3. Show that the power delivered by a real current source into a load is
   maximized at $R_\mathrm{L} = R_\mathrm{i}$, the same condition as for a real
   voltage source. Why does the dual of a maximum stay a maximum here, when
   everything else in this chapter swapped?
4. Two sources are wired in series: an ideal 5 V source and an ideal 1 mA
   source. What current flows into a 2 kΩ load, and what is the voltage across
   the whole arrangement? Answer without computing anything.

<p class="page-foot"><em>Next:</em> <a href="/projects/analog-circuits/resistive-networks/">Resistive networks and loading</a>, where the single source of this chapter meets a divider and stops behaving.</p>
