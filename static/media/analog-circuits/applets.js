/* Interactive benches for the "Analog circuits in theory and application"
 * chapters.
 *
 * One file, one tiny toolkit, several applets. An applet is mounted by putting
 * <div data-applet="name"></div> in the page; everything else (markup, styles,
 * maths) is built here, so a chapter is plain prose plus one element per bench.
 *
 * Nothing here is a circuit simulator. Every bench solves one closed-form
 * expression that the surrounding text derives, and the point of the sliders
 * is to make the limits of that expression visible: what happens as a
 * resistance goes to zero, and what happens as it goes to infinity. The two
 * limits are where the idealized models stop being true, which is the lesson.
 *
 * No dependencies. Colours come from the site's CSS custom properties, so the
 * benches follow the light and dark themes without being told. */
(function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";

  // A resistance the code treats as "infinite". Large enough that it swamps any
  // load on these pages, small enough that products stay far from overflow.
  var R_INFINITE = 1e12;

  /* ------------------------------------------------------------- formatting */

  var PREFIXES = [
    [1e9, "G"], [1e6, "M"], [1e3, "k"], [1, ""],
    [1e-3, "m"], [1e-6, "µ"], [1e-9, "n"], [1e-12, "p"],
  ];

  /* Engineering notation: three significant figures and an SI prefix, which is
     how these quantities are spoken out loud ("4.7 kilohm", not "4700 ohm"). */
  function siFormat(value, unit) {
    if (!isFinite(value)) return "∞ " + unit;
    if (value === 0) return "0 " + unit;
    var sign = value < 0 ? "−" : "";
    var magnitude = Math.abs(value);
    for (var i = 0; i < PREFIXES.length; i++) {
      if (magnitude >= PREFIXES[i][0] || i === PREFIXES.length - 1) {
        var scaled = magnitude / PREFIXES[i][0];
        var digits = scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2;
        return sign + scaled.toFixed(digits) + " " + PREFIXES[i][1] + unit;
      }
    }
    return sign + magnitude + " " + unit;
  }

  /* ------------------------------------------------------------ DOM helpers */

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function svgEl(tag, attrs) {
    var node = document.createElementNS(SVG_NS, tag);
    for (var key in attrs) {
      if (Object.prototype.hasOwnProperty.call(attrs, key)) {
        node.setAttribute(key, attrs[key]);
      }
    }
    return node;
  }

  /* A slider that moves in decades. Component values span many orders of
     magnitude, so a linear slider would spend most of its travel in a range
     nobody builds with. */
  function LogSlider(spec, onInput) {
    var wrap = el("label", "ac-ctl");
    var head = el("span", "ac-ctl__head");
    var name = el("span", "ac-ctl__name");
    name.innerHTML = spec.label;
    var readout = el("span", "ac-ctl__value");
    head.appendChild(name);
    head.appendChild(readout);

    var input = el("input");
    input.type = "range";
    input.min = String(Math.log10(spec.min));
    input.max = String(Math.log10(spec.max));
    input.step = "0.01";
    input.value = String(Math.log10(spec.value));
    input.className = "ac-ctl__range";

    wrap.appendChild(head);
    wrap.appendChild(input);

    var self = {
      node: wrap,
      value: spec.value,
      /* Snapping to the ends lets a slider reach an exact 0 or an exact
         infinity, which is where the interesting failures live. */
      read: function () {
        var raw = Math.pow(10, parseFloat(input.value));
        if (spec.zeroAtMin && parseFloat(input.value) <= parseFloat(input.min) + 0.02) {
          return 0;
        }
        if (spec.infiniteAtMax
            && parseFloat(input.value) >= parseFloat(input.max) - 0.02) {
          return Infinity;
        }
        return raw;
      },
      sync: function () {
        self.value = self.read();
        var shown = self.value === 0 ? "0 " + spec.unit
          : siFormat(self.value, spec.unit);
        readout.textContent = shown;
      },
    };

    input.addEventListener("input", function () {
      self.sync();
      onInput();
    });
    self.sync();
    return self;
  }

  function Choice(spec, onChange) {
    var wrap = el("div", "ac-choice");
    if (spec.label) wrap.appendChild(el("span", "ac-choice__label", spec.label));
    var group = el("div", "ac-choice__opts");
    wrap.appendChild(group);

    var self = { node: wrap, value: spec.value };
    spec.options.forEach(function (option) {
      var button = el("button", "ac-choice__opt", option.label);
      button.type = "button";
      button.dataset.value = option.value;
      button.addEventListener("click", function () {
        self.value = option.value;
        sync();
        onChange();
      });
      group.appendChild(button);
    });

    function sync() {
      Array.prototype.forEach.call(group.children, function (button) {
        var on = button.dataset.value === self.value;
        button.classList.toggle("is-on", on);
        button.setAttribute("aria-pressed", on ? "true" : "false");
      });
    }
    sync();
    return self;
  }

  /* ------------------------------------------------------------------ plots */

  /* A linear x-y panel with its own axes. Callers hand over data in physical
     units and let the panel do the mapping, so the physics code never contains
     a pixel. */
  function Plot(options) {
    var W = 340, H = 240, PAD_L = 46, PAD_B = 34, PAD_T = 12, PAD_R = 12;
    var svg = svgEl("svg", {
      viewBox: "0 0 " + W + " " + H, "class": "ac-plot",
      role: "img", "aria-label": options.label || "plot",
    });
    var xMax = 1, yMax = 1, xLog = !!options.xLog, xMin = options.xMin || 1;

    function sx(x) {
      if (xLog) {
        var lo = Math.log10(xMin), hi = Math.log10(xMax);
        var t = (Math.log10(Math.max(x, xMin)) - lo) / (hi - lo || 1);
        return PAD_L + t * (W - PAD_L - PAD_R);
      }
      return PAD_L + (x / xMax) * (W - PAD_L - PAD_R);
    }
    function sy(y) {
      return H - PAD_B - (y / yMax) * (H - PAD_B - PAD_T);
    }

    var self = {
      node: svg,
      setRange: function (nextXMax, nextYMax, nextXMin) {
        xMax = nextXMax || 1;
        yMax = nextYMax || 1;
        if (nextXMin) xMin = nextXMin;
      },
      clear: function () {
        while (svg.firstChild) svg.removeChild(svg.firstChild);
      },
      axes: function (xLabel, yLabel) {
        svg.appendChild(svgEl("line", { x1: PAD_L, y1: H - PAD_B, x2: W - PAD_R,
                                        y2: H - PAD_B, "class": "ac-plot__axis" }));
        svg.appendChild(svgEl("line", { x1: PAD_L, y1: H - PAD_B, x2: PAD_L,
                                        y2: PAD_T, "class": "ac-plot__axis" }));
        var x = svgEl("text", { x: W - PAD_R, y: H - 4,
                                "class": "ac-plot__axis-label",
                                "text-anchor": "end" });
        x.textContent = xLabel;
        var y = svgEl("text", { x: PAD_L - 4, y: PAD_T - 1,
                                "class": "ac-plot__axis-label",
                                "text-anchor": "end" });
        y.textContent = yLabel;
        svg.appendChild(x);
        svg.appendChild(y);
      },
      tick: function (axis, value, text) {
        var at = axis === "x" ? sx(value) : sy(value);
        var line = axis === "x"
          ? { x1: at, y1: H - PAD_B, x2: at, y2: H - PAD_B + 4 }
          : { x1: PAD_L - 4, y1: at, x2: PAD_L, y2: at };
        line["class"] = "ac-plot__axis";
        svg.appendChild(svgEl("line", line));
        var label = svgEl("text", axis === "x"
          ? { x: at, y: H - PAD_B + 16, "text-anchor": "middle", "class": "ac-plot__tick" }
          : { x: PAD_L - 7, y: at + 3.5, "text-anchor": "end", "class": "ac-plot__tick" });
        label.textContent = text;
        svg.appendChild(label);
      },
      line: function (points, className) {
        svg.appendChild(svgEl("polyline", {
          points: points.map(function (p) { return sx(p[0]) + "," + sy(p[1]); }).join(" "),
          "class": className,
        }));
      },
      dot: function (x, y, className, title) {
        var dot = svgEl("circle", { cx: sx(x), cy: sy(y), r: 5, "class": className });
        if (title) {
          var tip = svgEl("title", {});
          tip.textContent = title;
          dot.appendChild(tip);
        }
        svg.appendChild(dot);
      },
      note: function (x, y, text, anchor, className) {
        var node = svgEl("text", {
          x: sx(x), y: sy(y),
          "class": "ac-plot__note" + (className ? " " + className : ""),
          "text-anchor": anchor || "start",
        });
        node.textContent = text;
        svg.appendChild(node);
      },
      /* The largest value on each axis, written just inside the corner. Set
         outside next to the axis letter, it collides with it. */
      extent: function (xText, yText) {
        var x = svgEl("text", { x: W - PAD_R - 14, y: H - PAD_B + 16,
                                "text-anchor": "end", "class": "ac-plot__tick" });
        x.textContent = xText;
        var y = svgEl("text", { x: PAD_L + 6, y: PAD_T + 11,
                                "text-anchor": "start", "class": "ac-plot__tick" });
        y.textContent = yText;
        svg.appendChild(x);
        svg.appendChild(y);
      },
    };
    return self;
  }

  /* --------------------------------------------------- shared applet chrome */

  function Bench(mount, title, caption) {
    mount.classList.add("ac-bench");
    // The page ships a short fallback inside each mount so that a reader
    // without JavaScript is told what is missing instead of seeing an empty box.
    var fallback = mount.querySelector(".ac-fallback");
    if (fallback) fallback.remove();
    var header = el("div", "ac-bench__head");
    header.appendChild(el("h4", "ac-bench__title", title));
    if (caption) header.appendChild(el("p", "ac-bench__caption", caption));
    mount.appendChild(header);

    var body = el("div", "ac-bench__body");
    var controls = el("div", "ac-bench__controls");
    var output = el("div", "ac-bench__output");
    body.appendChild(controls);
    body.appendChild(output);
    mount.appendChild(body);
    return { controls: controls, output: output };
  }

  function readoutRow(label, className) {
    var row = el("div", "ac-read" + (className ? " " + className : ""));
    row.appendChild(el("span", "ac-read__label", label));
    var value = el("span", "ac-read__value", "—");
    row.appendChild(value);
    return { node: row, value: value };
  }

  /* ============================================ 1. source, R_i and the load */

  /* Both idealizations and their real counterparts in one expression pair.
     Voltage source: R_i in series, so the load divides the source voltage.
     Current source: R_i in parallel, so the load steals part of the current.
     The two are the same two-terminal box seen from opposite sides, which is
     what the Thevenin/Norton readout is there to show. */
  function solveSource(kind, value, ri, rl) {
    if (kind === "voltage") {
      var rTotal = ri + rl;
      if (rTotal === 0) return { i: Infinity, v: 0, broken: "short" };
      if (!isFinite(rl)) return { i: 0, v: value, broken: null };
      var i = value / rTotal;
      return { i: i, v: i * rl, broken: null };
    }
    var riEff = isFinite(ri) ? ri : R_INFINITE;
    if (!isFinite(rl)) {
      return isFinite(ri)
        ? { i: 0, v: value * ri, broken: null }
        : { i: 0, v: Infinity, broken: "open" };
    }
    if (rl === 0) return { i: value, v: 0, broken: null };
    var parallel = (riEff * rl) / (riEff + rl);
    return { i: (value * parallel) / rl, v: value * parallel, broken: null };
  }

  function sourceBench(mount) {
    var panel = Bench(mount,
      "Bench 1 · a source, its internal resistance, and a load",
      "Move the load and watch the operating point slide along the source's "
      + "characteristic. The dashed line is the load; where the two cross is "
      + "what the circuit actually does.");

    var kind = Choice({
      label: "Source",
      value: "voltage",
      options: [{ value: "voltage", label: "Voltage source" },
                { value: "current", label: "Current source" }],
    }, update);

    var ideal = Choice({
      label: "Internal resistance",
      value: "real",
      options: [{ value: "ideal", label: "Ideal" }, { value: "real", label: "Real" }],
    }, update);

    var vSource = LogSlider({ label: "Source value <em>V</em><sub>s</sub>",
                              min: 0.01, max: 1000, value: 5, unit: "V" }, update);
    var iSource = LogSlider({ label: "Source value <em>I</em><sub>s</sub>",
                              min: 1e-6, max: 1, value: 1e-3, unit: "A" }, update);
    var riCtl = LogSlider({ label: "Internal resistance <em>R</em><sub>i</sub>",
                            min: 1e-2, max: 1e8, value: 50, unit: "Ω" }, update);
    var rlCtl = LogSlider({ label: "Load <em>R</em><sub>L</sub>",
                            min: 1e-2, max: 1e9, value: 1000, unit: "Ω",
                            zeroAtMin: true, infiniteAtMax: true }, update);

    [kind, ideal, vSource, iSource, riCtl, rlCtl].forEach(function (control) {
      panel.controls.appendChild(control.node);
    });

    var hint = el("p", "ac-hint",
      "The load slider reaches a real short at one end and a real open circuit "
      + "at the other. Both ends are worth visiting.");
    panel.controls.appendChild(hint);

    var plot = Plot({ label: "Current against voltage at the terminals" });
    panel.output.appendChild(plot.node);

    var rows = {
      v: readoutRow("Terminal voltage · V"),
      i: readoutRow("Load current · I"),
      p: readoutRow("Power in the load · P"),
      eq: readoutRow("Thévenin / Norton"),
    };
    var readouts = el("div", "ac-reads");
    Object.keys(rows).forEach(function (key) { readouts.appendChild(rows[key].node); });
    panel.output.appendChild(readouts);

    var warning = el("p", "ac-warn");
    warning.hidden = true;
    panel.output.appendChild(warning);

    function update() {
      var isVoltage = kind.value === "voltage";
      vSource.node.hidden = !isVoltage;
      iSource.node.hidden = isVoltage;
      riCtl.node.hidden = ideal.value === "ideal";

      var ri = ideal.value === "ideal"
        ? (isVoltage ? 0 : Infinity)
        : riCtl.value;
      var source = isVoltage ? vSource.value : iSource.value;
      var rl = rlCtl.value;
      var point = solveSource(isVoltage ? "voltage" : "current", source, ri, rl);

      // Open-circuit voltage and short-circuit current fix both axes, and they
      // are also the two numbers the Thevenin/Norton pair is made of.
      var voc = isVoltage ? source : (isFinite(ri) ? source * ri : Infinity);
      var isc = isVoltage ? (ri > 0 ? source / ri : Infinity) : source;
      var vAxis = isFinite(voc) ? voc * 1.15 : Math.max(point.v, 1) * 1.6;
      var iAxis = isFinite(isc) ? isc * 1.15 : Math.max(point.i, 1e-6) * 1.6;

      plot.clear();
      plot.setRange(vAxis, iAxis);
      plot.axes("V", "I");
      plot.extent(siFormat(vAxis, "V"), siFormat(iAxis, "A"));

      // The source characteristic: a straight line between the two extremes,
      // or a straight edge of the box when one of them runs away.
      var characteristic = isFinite(voc) && isFinite(isc)
        ? [[0, isc], [voc, 0]]
        : isFinite(voc) ? [[voc, 0], [voc, iAxis]] : [[0, isc], [vAxis, isc]];
      plot.line(characteristic, "ac-plot__source");

      var loadLine = rl === 0 ? [[0, 0], [0, iAxis]]
        : !isFinite(rl) ? [[0, 0], [vAxis, 0]]
        : [[0, 0], [Math.min(vAxis, iAxis * rl), Math.min(iAxis, vAxis / rl)]];
      plot.line(loadLine, "ac-plot__load");

      if (isFinite(point.v) && isFinite(point.i)) {
        plot.dot(Math.min(point.v, vAxis), Math.min(point.i, iAxis),
                 "ac-plot__point", "operating point");
      }
      plot.note(vAxis * 0.98, iAxis * 0.92, "source", "end", "ac-plot__key--source");
      plot.note(vAxis * 0.98, iAxis * 0.80, "load", "end", "ac-plot__key--load");

      rows.v.value.textContent = siFormat(point.v, "V");
      rows.i.value.textContent = siFormat(point.i, "A");
      var power = isFinite(point.v) && isFinite(point.i) ? point.v * point.i : Infinity;
      rows.p.value.textContent = siFormat(power, "W");
      rows.eq.value.textContent = isFinite(voc) && isFinite(isc)
        ? siFormat(voc, "V") + " + " + siFormat(isFinite(ri) ? ri : Infinity, "Ω")
          + "  ≡  " + siFormat(isc, "A") + " ∥ "
          + siFormat(isFinite(ri) ? ri : Infinity, "Ω")
        : "an ideal source has only one of the two forms";

      var trouble = null;
      if (isVoltage && ideal.value === "ideal" && rl === 0) {
        trouble = "An ideal voltage source into a short circuit: the model says "
          + "the current is infinite. Nothing is. What a real source does here "
          + "is set by its internal resistance, which is exactly why Rᵢ is "
          + "not a detail.";
      } else if (!isVoltage && ideal.value === "ideal" && !isFinite(rl)) {
        trouble = "An ideal current source into an open circuit: the model says "
          + "the voltage is infinite. A real one runs out of supply voltage and "
          + "stops being a current source — it has a compliance limit.";
      }
      warning.textContent = trouble || "";
      warning.hidden = !trouble;
    }

    update();
  }

  /* ================================== 2. what may be connected to what, and how */

  var COMBINATIONS = {
    "voltage|voltage|series": {
      verdict: "ok",
      headline: "Allowed. The voltages add.",
      detail: "Two cells in series make one source of V₁ + V₂. This is the "
        + "connection a battery holder is built for.",
    },
    "voltage|voltage|parallel": {
      verdict: "care",
      headline: "Only if the two voltages are equal.",
      detail: "Two ideal voltage sources in parallel both insist on the voltage "
        + "across the same node pair. If they disagree, the model has no "
        + "solution; real ones settle it through their internal resistances, "
        + "with a circulating current of (V₁ − V₂)/(Rᵢ₁ + Rᵢ₂) "
        + "that heats the lower one.",
    },
    "current|current|series": {
      verdict: "care",
      headline: "Only if the two currents are equal.",
      detail: "Series means one current. Two ideal current sources each "
        + "prescribing a different one contradict Kirchhoff's current law at the "
        + "node between them. Equal currents are allowed and pointless; the pair "
        + "behaves as one of them.",
    },
    "current|current|parallel": {
      verdict: "ok",
      headline: "Allowed. The currents add.",
      detail: "The node receives I₁ + I₂, which is Kirchhoff's current law "
        + "read forwards. This is the dual of two voltage sources in series.",
    },
    "voltage|current|series": {
      verdict: "mixed",
      headline: "Allowed — and the pair acts as a current source.",
      detail: "The current source already fixes the current through the branch, "
        + "and a series voltage source cannot change a current. It only shifts "
        + "the terminal voltage. In series, the current source wins.",
    },
    "voltage|current|parallel": {
      verdict: "mixed",
      headline: "Allowed — and the pair acts as a voltage source.",
      detail: "The voltage source already fixes the voltage across the pair, and "
        + "a parallel current source cannot change a voltage. It only shifts the "
        + "terminal current. In parallel, the voltage source wins.",
    },
  };

  function combinationKey(a, b, mode) {
    // The pair is unordered, so normalise it: a mixed pair is always written
    // voltage first, which halves the table.
    var types = [a, b].sort().join("|");
    return (types === "current|voltage" ? "voltage|current" : types) + "|" + mode;
  }

  /* A single branch drawn vertically: circle with a bar across the leads for a
     voltage source, along them for a current source. */
  function sourceSymbol(x, y, type, label) {
    var group = svgEl("g", { "class": "ac-sym" });
    group.appendChild(svgEl("circle", { cx: x, cy: y, r: 15, "class": "ac-sym__body" }));
    group.appendChild(type === "voltage"
      ? svgEl("line", { x1: x - 11, y1: y, x2: x + 11, y2: y, "class": "ac-sym__bar" })
      : svgEl("line", { x1: x, y1: y - 11, x2: x, y2: y + 11, "class": "ac-sym__bar" }));
    var text = svgEl("text", { x: x + 23, y: y + 4, "class": "ac-sym__label" });
    text.textContent = label;
    group.appendChild(text);
    return group;
  }

  function combinationDiagram(a, b, mode) {
    var svg = svgEl("svg", { viewBox: "0 0 220 170", "class": "ac-diagram",
                             role: "img", "aria-label": "circuit sketch" });
    var wire = function (x1, y1, x2, y2) {
      svg.appendChild(svgEl("line", { x1: x1, y1: y1, x2: x2, y2: y2,
                                      "class": "ac-sym__wire" }));
    };
    if (mode === "series") {
      wire(60, 14, 60, 35);
      wire(60, 65, 60, 85);
      wire(60, 115, 60, 140);
      wire(60, 140, 150, 140);
      wire(150, 14, 150, 140);
      wire(60, 14, 150, 14);
      svg.appendChild(sourceSymbol(60, 50, a, "A"));
      svg.appendChild(sourceSymbol(60, 100, b, "B"));
    } else {
      wire(45, 14, 160, 14);
      wire(45, 140, 160, 140);
      wire(45, 14, 45, 60);
      wire(45, 90, 45, 140);
      wire(105, 14, 105, 60);
      wire(105, 90, 105, 140);
      wire(160, 14, 160, 140);
      svg.appendChild(sourceSymbol(45, 75, a, "A"));
      svg.appendChild(sourceSymbol(105, 75, b, "B"));
    }
    // the terminals the pair presents to the rest of the world
    svg.appendChild(svgEl("circle", { cx: mode === "series" ? 150 : 160, cy: 14,
                                      r: 3.5, "class": "ac-sym__node" }));
    svg.appendChild(svgEl("circle", { cx: mode === "series" ? 150 : 160, cy: 140,
                                      r: 3.5, "class": "ac-sym__node" }));
    return svg;
  }

  function combinationBench(mount) {
    var panel = Bench(mount,
      "Bench 2 · which sources may be connected, and how",
      "Pick two sources and a connection. Four of the six cases are the rules "
      + "worth memorising; the other two say which source wins when the types "
      + "are mixed.");

    var a = Choice({ label: "Source A", value: "voltage", options: [
      { value: "voltage", label: "Voltage" }, { value: "current", label: "Current" }] }, update);
    var b = Choice({ label: "Source B", value: "voltage", options: [
      { value: "voltage", label: "Voltage" }, { value: "current", label: "Current" }] }, update);
    var mode = Choice({ label: "Connection", value: "series", options: [
      { value: "series", label: "In series" },
      { value: "parallel", label: "In parallel" }] }, update);

    [a, b, mode].forEach(function (control) { panel.controls.appendChild(control.node); });

    var figure = el("div", "ac-figure");
    var verdict = el("p", "ac-verdict");
    var detail = el("p", "ac-detail");
    panel.output.appendChild(figure);
    panel.output.appendChild(verdict);
    panel.output.appendChild(detail);

    function update() {
      var entry = COMBINATIONS[combinationKey(a.value, b.value, mode.value)];
      figure.replaceChildren(combinationDiagram(a.value, b.value, mode.value));
      verdict.textContent = entry.headline;
      verdict.className = "ac-verdict ac-verdict--" + entry.verdict;
      detail.textContent = entry.detail;
    }

    update();
  }

  /* ================================================ 3. the divider under load */

  function dividerBench(mount) {
    var panel = Bench(mount,
      "Bench 3 · a voltage divider meeting its load",
      "The unloaded divider ratio is the formula everyone remembers. The "
      + "loaded one is the circuit that actually gets built. Watch the gap "
      + "between them as the load comes down.");

    var vin = LogSlider({ label: "Input <em>V</em><sub>in</sub>",
                          min: 0.1, max: 100, value: 10, unit: "V" }, update);
    var r1 = LogSlider({ label: "Upper resistor <em>R</em><sub>1</sub>",
                         min: 1, max: 1e7, value: 10e3, unit: "Ω" }, update);
    var r2 = LogSlider({ label: "Lower resistor <em>R</em><sub>2</sub>",
                         min: 1, max: 1e7, value: 10e3, unit: "Ω" }, update);
    var rl = LogSlider({ label: "Load <em>R</em><sub>L</sub>",
                         min: 10, max: 1e9, value: 1e5, unit: "Ω",
                         infiniteAtMax: true }, update);
    [vin, r1, r2, rl].forEach(function (c) { panel.controls.appendChild(c.node); });

    var plot = Plot({ label: "Output against load resistance", xLog: true, xMin: 10 });
    panel.output.appendChild(plot.node);

    var rows = {
      ideal: readoutRow("Unloaded output"),
      actual: readoutRow("Loaded output"),
      error: readoutRow("Error from loading"),
      rth: readoutRow("Source resistance seen by the load · R₁∥R₂"),
    };
    var reads = el("div", "ac-reads");
    Object.keys(rows).forEach(function (k) { reads.appendChild(rows[k].node); });
    panel.output.appendChild(reads);

    var hint = el("p", "ac-hint");
    panel.output.appendChild(hint);

    function outputFor(load) {
      var lower = !isFinite(load) ? r2.value : (r2.value * load) / (r2.value + load);
      return vin.value * lower / (r1.value + lower);
    }

    function update() {
      var unloaded = vin.value * r2.value / (r1.value + r2.value);
      var loaded = outputFor(rl.value);
      var rth = (r1.value * r2.value) / (r1.value + r2.value);
      var error = unloaded === 0 ? 0 : (loaded - unloaded) / unloaded * 100;

      rows.ideal.value.textContent = siFormat(unloaded, "V");
      rows.actual.value.textContent = siFormat(loaded, "V");
      rows.error.value.textContent = (error).toFixed(1) + " %";
      rows.rth.value.textContent = siFormat(rth, "Ω");

      var ratio = isFinite(rl.value) ? rl.value / rth : Infinity;
      hint.textContent = !isFinite(ratio)
        ? "With no load at all the divider delivers its full ratio. Every real "
          + "load is somewhere to the left of that."
        : ratio >= 100
          ? "The load is more than 100× the source resistance: the error is "
            + "under a percent, and the simple ratio is safe to use."
          : ratio >= 10
            ? "The load is between 10× and 100× the source resistance — the "
              + "rule-of-thumb range. It still costs a few percent."
            : "The load is comparable to the source resistance. The divider ratio "
              + "is no longer the ratio of the resistors, and a buffer belongs here.";

      var points = [];
      var decades = 8;
      for (var i = 0; i <= 160; i++) {
        var load = 10 * Math.pow(10, decades * i / 160);
        points.push([load, outputFor(load)]);
      }
      plot.clear();
      plot.setRange(10 * Math.pow(10, decades), Math.max(unloaded * 1.2, 1e-9), 10);
      plot.axes("Rₗ", "Vₒᵤₜ");
      [10, 1e3, 1e5, 1e7].forEach(function (value) {
        plot.tick("x", value, siFormat(value, ""));
      });
      plot.tick("y", unloaded, siFormat(unloaded, "V"));
      plot.line([[10, unloaded], [10 * Math.pow(10, decades), unloaded]],
                "ac-plot__load");
      plot.line(points, "ac-plot__source");
      if (isFinite(rl.value)) {
        plot.dot(rl.value, loaded, "ac-plot__point", "chosen load");
      }
      plot.note(10 * Math.pow(10, decades), unloaded * 1.08, "unloaded ratio", "end",
                "ac-plot__key--load");
    }

    update();
  }

  /* ========================= 4. Thevenin, matching, and what matching costs */

  function theveninBench(mount) {
    var panel = Bench(mount,
      "Bench 4 · maximum power is not maximum efficiency",
      "Any two-terminal network of sources and resistors looks like one source "
      + "and one resistor. Here is what the load does with that, and why the "
      + "load that draws the most power wastes half of it.");

    var vth = LogSlider({ label: "Source <em>V</em><sub>th</sub>",
                          min: 0.1, max: 100, value: 10, unit: "V" }, update);
    var rth = LogSlider({ label: "Source resistance <em>R</em><sub>th</sub>",
                          min: 1, max: 1e6, value: 1e3, unit: "Ω" }, update);
    var rl = LogSlider({ label: "Load <em>R</em><sub>L</sub>",
                         min: 1, max: 1e7, value: 1e3, unit: "Ω" }, update);
    [vth, rth, rl].forEach(function (c) { panel.controls.appendChild(c.node); });

    var plot = Plot({ label: "Power and efficiency against load", xLog: true, xMin: 1 });
    panel.output.appendChild(plot.node);

    var rows = {
      p: readoutRow("Power in the load"),
      pmax: readoutRow("Best possible power · at Rₗ = Rₜₕ"),
      eta: readoutRow("Efficiency · load share of the total"),
    };
    var reads = el("div", "ac-reads");
    Object.keys(rows).forEach(function (k) { reads.appendChild(rows[k].node); });
    panel.output.appendChild(reads);
    var hint = el("p", "ac-hint");
    panel.output.appendChild(hint);

    function powerIn(load) {
      var i = vth.value / (rth.value + load);
      return i * i * load;
    }

    function update() {
      var pMax = (vth.value * vth.value) / (4 * rth.value);
      var p = powerIn(rl.value);
      var eta = rl.value / (rl.value + rth.value);

      rows.p.value.textContent = siFormat(p, "W");
      rows.pmax.value.textContent = siFormat(pMax, "W");
      rows.eta.value.textContent = (eta * 100).toFixed(1) + " %";
      hint.textContent = Math.abs(Math.log10(rl.value / rth.value)) < 0.05
        ? "Matched. The load takes the most power it ever can — and exactly "
          + "half of what the source delivers is burnt inside the source. Match "
          + "when power is what you want to move, not when you want to keep it."
        : rl.value > rth.value
          ? "Load above the source resistance: less power than the matched "
            + "maximum, but a larger share of it reaches the load. This is where "
            + "signal circuits live."
          : "Load below the source resistance: both the power and the share "
            + "fall away. The source is heating itself.";

      var points = [], etaPoints = [];
      for (var i = 0; i <= 160; i++) {
        var load = Math.pow(10, 7 * i / 160);
        points.push([load, powerIn(load)]);
        etaPoints.push([load, (load / (load + rth.value)) * pMax]);
      }
      plot.clear();
      plot.setRange(1e7, pMax * 1.25, 1);
      plot.axes("Rₗ", "P");
      [1, 1e2, 1e4, 1e6].forEach(function (v) { plot.tick("x", v, siFormat(v, "")); });
      plot.extent("", siFormat(pMax, "W"));
      plot.line(etaPoints, "ac-plot__load");
      plot.line(points, "ac-plot__source");
      plot.dot(rl.value, p, "ac-plot__point", "chosen load");
      plot.note(6, pMax * 1.06, "power", "start", "ac-plot__key--source");
      plot.note(6, pMax * 0.92, "efficiency (scaled)", "start", "ac-plot__key--load");
    }

    update();
  }

  /* ------------------------------------------------------------------ styles */

  var CSS = [
    ".ac-bench{border:1px solid var(--rule);border-radius:12px;padding:1.1rem 1.2rem 1.3rem;margin:1.8rem 0;background:var(--surface)}",
    ".ac-bench__title{font-family:var(--font-display);font-size:var(--step-0);margin:0 0 0.3rem}",
    ".ac-bench__caption{margin:0 0 1rem;font-size:var(--step--1);color:var(--ink-soft);max-width:46rem}",
    ".ac-bench__body{display:grid;grid-template-columns:minmax(0,17rem) minmax(0,1fr);gap:1.4rem;align-items:start}",
    "@media (max-width:48rem){.ac-bench__body{grid-template-columns:1fr}}",
    ".ac-bench [hidden]{display:none}",
    ".ac-ctl{display:block;margin:0 0 0.8rem}",
    ".ac-ctl__head{display:flex;justify-content:space-between;align-items:baseline;gap:0.6rem;font-size:var(--step--1)}",
    ".ac-ctl__name{color:var(--ink-soft)}",
    ".ac-ctl__value{font-family:var(--font-mono);font-size:var(--step--2);color:var(--accent);white-space:nowrap}",
    ".ac-ctl__range{width:100%;margin:0.25rem 0 0;accent-color:var(--accent)}",
    ".ac-choice{margin:0 0 0.8rem}",
    ".ac-choice__label{display:block;font-size:var(--step--1);color:var(--ink-soft);margin-bottom:0.25rem}",
    ".ac-choice__opts{display:flex;flex-wrap:wrap;gap:0.35rem}",
    ".ac-choice__opt{border:1px solid var(--rule-strong);background:transparent;color:var(--ink-soft);border-radius:999px;padding:0.25rem 0.7rem;font:inherit;font-size:var(--step--1);cursor:pointer}",
    ".ac-choice__opt:hover{border-color:var(--accent)}",
    ".ac-choice__opt.is-on{border-color:var(--accent);background:var(--accent-wash);color:var(--ink)}",
    ".ac-hint{font-size:var(--step--1);color:var(--muted);margin:0.8rem 0 0}",
    ".ac-warn{font-size:var(--step--1);margin:0.9rem 0 0;padding:0.6rem 0.8rem;border-left:3px solid var(--accent);background:var(--accent-wash);border-radius:0 8px 8px 0;color:var(--ink)}",
    ".ac-plot{display:block;width:100%;max-width:26rem;height:auto;background:var(--sunk);border-radius:8px}",
    ".ac-plot__axis{stroke:var(--rule-strong);stroke-width:1}",
    ".ac-plot__axis-label,.ac-plot__tick,.ac-plot__note{fill:var(--muted);font-size:10px;font-family:var(--font-mono)}",
    ".ac-plot__note{fill:var(--ink-soft)}",
    ".ac-plot__key--source{fill:var(--accent)}",
    ".ac-plot__key--load{fill:var(--link)}",
    ".ac-plot__source{fill:none;stroke:var(--accent);stroke-width:2}",
    ".ac-plot__load{fill:none;stroke:var(--link);stroke-width:1.6;stroke-dasharray:5 4}",
    ".ac-plot__point{fill:var(--accent);stroke:var(--surface);stroke-width:2}",
    ".ac-reads{margin:0.9rem 0 0;display:grid;gap:0.3rem}",
    ".ac-read{display:flex;justify-content:space-between;gap:1rem;border-bottom:1px solid var(--rule);padding-bottom:0.25rem;font-size:var(--step--1)}",
    ".ac-read__label{color:var(--ink-soft)}",
    ".ac-read__value{font-family:var(--font-mono);font-size:var(--step--2);color:var(--ink);text-align:right}",
    ".ac-diagram{display:block;width:100%;max-width:13rem;height:auto;background:var(--sunk);border-radius:8px;padding:0.4rem}",
    ".ac-sym__body{fill:none;stroke:var(--ink-soft);stroke-width:1.6}",
    ".ac-sym__bar{stroke:var(--accent);stroke-width:2.4;stroke-linecap:round}",
    ".ac-sym__wire{stroke:var(--ink-soft);stroke-width:1.4}",
    ".ac-sym__node{fill:var(--accent);stroke:none}",
    ".ac-sym__label{fill:var(--muted);font-size:11px;font-family:var(--font-mono)}",
    ".ac-verdict{font-weight:600;margin:0.8rem 0 0.3rem}",
    ".ac-verdict--ok{color:#1e8e3e}",
    ".ac-verdict--care{color:var(--accent)}",
    ".ac-verdict--mixed{color:var(--link)}",
    ".ac-detail{margin:0;font-size:var(--step--1);color:var(--ink-soft);max-width:34rem}",
  ].join("\n");

  /* --------------------------------------------------------------- mounting */

  var APPLETS = {
    "source-load": sourceBench,
    "source-combinations": combinationBench,
    "loaded-divider": dividerBench,
    "thevenin-power": theveninBench,
  };

  function init() {
    var mounts = document.querySelectorAll("[data-applet]");
    if (!mounts.length) return;
    var style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);
    Array.prototype.forEach.call(mounts, function (mount) {
      var build = APPLETS[mount.dataset.applet];
      if (build) build(mount);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
