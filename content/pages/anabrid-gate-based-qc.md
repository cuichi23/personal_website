---
title: Gate-based quantum computing on coupled oscillators
slug: projects-anabrid/gate-based-qc
nav_order: 99
template: gated.html
gate_payload: gate-based-qc
eyebrow: Projects@anabrid · work in progress
summary: >-
  The Schrödinger equation for a finite quantum register is a linear system of
  coupled oscillators. That is old physics. What it costs to run a real circuit
  that way on real hardware is not.
gate_heading: Gate accuracy, algorithms, and where it stops
gate_blurb: >-
  Measured gate deviations, the time against accuracy trade, and which
  algorithms survive at which qubit counts. Unpublished, so it is kept behind a
  password.
---

The starting point is not ours and is not new. A quantum state on $N$ levels is
a vector of complex amplitudes obeying a linear equation. A classical array of
coupled harmonic oscillators obeys a linear equation of the same shape.
Briggs and Eisfeld worked the correspondence out in detail. First for excitonic
energy transfer, where the quantum coherences of a coupled-monomer aggregate are
reproduced exactly by a classical dipole array.[^1] Then for coherent states
built from classical oscillator amplitudes.[^2] Then in general, for an
arbitrary network of two-level systems, with coupled electrical circuits named
as the hardware it would run on.[^3] Skinner gives the mapping of the quantum
states of an arbitrary $N$-level system onto the positions of classical coupled
oscillators directly.[^4]

## The correspondence

Write the register's amplitudes as $c_n$. The Schrödinger equation

$$
i\hbar\,\dot{c}_n = \sum_m H_{nm} c_m
$$

is linear and first order. Split each complex amplitude into a real pair,
$c_n = q_n + i p_n$, and it becomes a real linear system of twice the size, in
which $q$ and $p$ drive one another. That is the equation of motion of coupled
oscillators. Site energies become frequencies, $\omega_n = \varepsilon_n/\hbar$,
and the off-diagonal couplings become reactive couplings between them.

Nothing is approximated in that step. The approximation, where the scheme has
one, comes from the regime the hardware must sit in. Couplings small against the
carrier frequency, site frequencies close to one another, dephasing slower than
either. Those are the conditions under which the rotating-wave
picture holds, and they are the operating specification for any machine built
this way.

A gate is the same statement over a finite time. Every unitary is

$$
U = \exp(-i\,\theta\,G)
$$

for some generator $G$ and angle $\theta$, so applying the gate means
integrating $\dot{c} = -iGc$ for a time $\theta$. There is no gate model, no
Trotter step, and no shot noise. There is also no error correction: what the
machine does is the equation, including everything it does wrong.

## The cost, stated plainly

The register has $2^N$ amplitudes, and every one of them needs its own pair of
integrators. Three qubits is eight amplitudes and sixteen integrators; ten
qubits would be a thousand amplitudes and two thousand integrators. The
resource scaling is exponential in the qubit count, and no argument here
changes that.

So this is not a route to a quantum computer. It is an exact classical
emulation, on hardware that solves the emulating equation continuously rather
than stepping it. That makes it a way to ask precise questions about gate
sequences at small register sizes.

## Three qubits, one transform

A quantum Fourier transform on three qubits, run as a single continuous
evolution through the whole gate sequence. The amplitudes, against time.

![Eight complex amplitudes through a three-qubit quantum Fourier transform, run as one continuous evolution.](/media/projects-anabrid/qft-n3-time-series.svg)

## What is behind the password

How closely individual gates reproduce their unitaries, what accuracy costs in
run time, how the error grows with the rotation angle and with circuit depth,
and which standard algorithms still return the right answer at which qubit
counts. One of those answers is a boundary rather than a success.

[^1]: J. S. Briggs and A. Eisfeld, *Equivalence of quantum and classical
coherence in electronic energy transfer*, Phys. Rev. E **83**, 051911 (2011).

[^2]: J. S. Briggs and A. Eisfeld, *Coherent quantum states from classical
oscillator amplitudes* (2012).

[^3]: J. S. Briggs and A. Eisfeld, *Quantum dynamics simulation with classical
oscillators*, Phys. Rev. A **88**, 062104 (2013).

[^4]: T. E. Skinner, *Exact mapping of the quantum states in arbitrary
$N$-level systems to the positions of classical coupled oscillators* (2013).
