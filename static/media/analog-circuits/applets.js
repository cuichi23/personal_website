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

  /* A slider for a quantity that lives on one scale rather than over decades:
     a bias voltage, a temperature. The readout carries its own precision
     because a bias of 0.65 V and a bias of 0.6 V are different circuits. */
  function LinSlider(spec, onInput) {
    var wrap = el("label", "ac-ctl");
    var head = el("span", "ac-ctl__head");
    var name = el("span", "ac-ctl__name");
    name.innerHTML = spec.label;
    var readout = el("span", "ac-ctl__value");
    head.appendChild(name);
    head.appendChild(readout);

    var input = el("input");
    input.type = "range";
    input.min = String(spec.min);
    input.max = String(spec.max);
    input.step = String(spec.step || (spec.max - spec.min) / 200);
    input.value = String(spec.value);
    input.className = "ac-ctl__range";

    wrap.appendChild(head);
    wrap.appendChild(input);

    var self = {
      node: wrap,
      value: spec.value,
      sync: function () {
        self.value = parseFloat(input.value);
        readout.textContent = spec.format
          ? spec.format(self.value)
          : self.value.toFixed(spec.digits === undefined ? 2 : spec.digits)
            + " " + spec.unit;
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
    var W = 340, H = 240, PAD_L = 54, PAD_B = 34, PAD_T = 12, PAD_R = 12;
    var svg = svgEl("svg", {
      viewBox: "0 0 " + W + " " + H, "class": "ac-plot",
      role: "img", "aria-label": options.label || "plot",
    });
    var xMax = 1, yMax = 1, yMin = 0;
    var xLog = !!options.xLog, xMin = options.xMin || 1;

    function sx(x) {
      if (xLog) {
        var lo = Math.log10(xMin), hi = Math.log10(xMax);
        var t = (Math.log10(Math.max(x, xMin)) - lo) / (hi - lo || 1);
        return PAD_L + t * (W - PAD_L - PAD_R);
      }
      return PAD_L + (x / xMax) * (W - PAD_L - PAD_R);
    }
    function sy(y) {
      var span = (yMax - yMin) || 1;
      return H - PAD_B - ((y - yMin) / span) * (H - PAD_B - PAD_T);
    }

    var self = {
      node: svg,
      /* yMin defaults to zero, which is what every plot wanted until phase
         and decibels needed an axis that starts below it. */
      setRange: function (nextXMax, nextYMax, nextXMin, nextYMin) {
        xMax = nextXMax || 1;
        yMax = nextYMax || 1;
        if (nextXMin) xMin = nextXMin;
        yMin = nextYMin || 0;
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
        /* The first and last x labels are centred on the frame, so they
           have to grow inwards or they leave the viewBox. */
        var anchor = at < PAD_L + 16 ? "start"
          : at > W - PAD_R - 16 ? "end" : "middle";
        var label = svgEl("text", axis === "x"
          ? { x: at, y: H - PAD_B + 16, "text-anchor": anchor, "class": "ac-plot__tick" }
          : { x: PAD_L - 7, y: at + 3.5, "text-anchor": "end", "class": "ac-plot__tick" });
        label.textContent = text;
        svg.appendChild(label);
      },
      /* Full-width and full-height rules, for a zero line or a threshold. */
      hline: function (y, className) {
        svg.appendChild(svgEl("line", { x1: PAD_L, y1: sy(y), x2: W - PAD_R,
                                        y2: sy(y), "class": className }));
      },
      vline: function (x, className) {
        svg.appendChild(svgEl("line", { x1: sx(x), y1: PAD_T, x2: sx(x),
                                        y2: H - PAD_B, "class": className }));
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

  /* ====================================== 5. the RC step, driven repeatedly */

  /* A square wave is a step up followed by a step down, so one picture holds
     charging, discharging, and the case where neither finishes. The steady
     state is reached analytically rather than by simulating from rest: with
     a = exp(-T/2tau) the output swings between a/(1+a) and 1/(1+a). */
  function rcStepBench(mount) {
    var panel = Bench(mount,
      "Bench 5 · an RC low-pass meeting a square wave",
      "Slow drive: the output copies the input with rounded corners. Fast "
      + "drive: the exponentials never finish and what is left is a triangle, "
      + "which is the integral of the input. Watch the amplitude you pay for it.");

    var r = LogSlider({ label: "Resistor <em>R</em>", min: 100, max: 1e6,
                        value: 1e4, unit: "Ω" }, update);
    var c = LogSlider({ label: "Capacitor <em>C</em>", min: 1e-10, max: 1e-5,
                        value: 1e-7, unit: "F" }, update);
    var fin = LogSlider({ label: "Drive frequency <em>f</em><sub>in</sub>",
                          min: 1, max: 1e6, value: 1e3, unit: "Hz" }, update);
    [r, c, fin].forEach(function (ctl) { panel.controls.appendChild(ctl.node); });

    var plot = Plot({ label: "Square-wave response of an RC low-pass" });
    panel.output.appendChild(plot.node);

    var rows = {
      tau: readoutRow("Time constant · τ = RC"),
      fc: readoutRow("Cutoff · f_c = 1/2πRC"),
      ratio: readoutRow("Drive frequency in units of f_c"),
      swing: readoutRow("Output swing, peak to peak"),
    };
    var reads = el("div", "ac-reads");
    Object.keys(rows).forEach(function (k) { reads.appendChild(rows[k].node); });
    panel.output.appendChild(reads);

    var hint = el("p", "ac-hint");
    panel.output.appendChild(hint);

    function update() {
      var tau = r.value * c.value;
      var fc = 1 / (2 * Math.PI * tau);
      var period = 1 / fin.value;
      var half = period / 2;
      var a = Math.exp(-half / tau);
      var hi = 1 / (1 + a);
      var lo = a / (1 + a);
      var swing = hi - lo;

      rows.tau.value.textContent = siFormat(tau, "s");
      rows.fc.value.textContent = siFormat(fc, "Hz");
      rows.ratio.value.textContent = (fin.value / fc).toFixed(2) + " × f_c";
      rows.swing.value.textContent = (swing * 100).toFixed(1) + " % of input";

      /* Two full periods, starting at a rising edge in the steady state. */
      var out = [], drive = [], steps = 320, tEnd = 2 * period;
      for (var i = 0; i <= steps; i++) {
        var t = tEnd * i / steps;
        var phase = t % period;
        var rising = phase < half;
        var local = rising ? phase : phase - half;
        var v = rising
          ? 1 + (lo - 1) * Math.exp(-local / tau)
          : hi * Math.exp(-local / tau);
        out.push([t, v]);
        drive.push([t, rising ? 1 : 0]);
      }

      plot.clear();
      plot.setRange(tEnd, 1.1);
      plot.axes("t", "v");
      plot.tick("x", 0, "0");
      plot.tick("x", period, siFormat(period, "s"));
      plot.tick("y", 1, "1 V");
      plot.tick("y", 0, "0");
      plot.line(drive, "ac-plot__load");
      plot.line(out, "ac-plot__source");
      plot.note(tEnd * 0.02, 1.05, "input", "start", "ac-plot__key--load");
      plot.note(tEnd * 0.98, 1.05, "output", "end", "ac-plot__key--source");

      var ratio = fin.value / fc;
      hint.textContent = ratio < 0.1
        ? "Far below the cutoff. The capacitor reaches the rail long before the "
          + "input changes again, so the circuit simply follows."
        : ratio < 1
          ? "Approaching the cutoff. The corners are visibly rounded but the "
            + "output still gets most of the way there."
          : ratio < 10
            ? "Above the cutoff. The exponentials no longer finish, and the "
              + "curve is starting to look like straight ramps."
            : "Far above the cutoff: a triangle wave. Over a small fraction of "
              + "τ the exponential is linear, so the output is the running "
              + "integral of the input. It cost all but "
              + (swing * 100).toFixed(1) + " % of the amplitude.";
    }

    update();
  }

  /* ==================================== 6. the same circuit, seen in Bode */

  function rcBodeBench(mount) {
    var panel = Bench(mount,
      "Bench 6 · the first-order response in frequency",
      "The same two components, read from two nodes, with the asymptotes "
      + "drawn in. The corner is where the resistance and the reactance are "
      + "equal, and the phase is already moving a decade before the magnitude.");

    var kind = Choice({
      label: "Output taken across",
      value: "lp",
      options: [{ value: "lp", label: "the capacitor · low-pass" },
                { value: "hp", label: "the resistor · high-pass" }],
    }, update);
    var view = Choice({
      label: "Show",
      value: "mag",
      options: [{ value: "mag", label: "magnitude" },
                { value: "phase", label: "phase" }],
    }, update);
    var r = LogSlider({ label: "Resistor <em>R</em>", min: 100, max: 1e6,
                        value: 1e4, unit: "Ω" }, update);
    var c = LogSlider({ label: "Capacitor <em>C</em>", min: 1e-10, max: 1e-5,
                        value: 1e-7, unit: "F" }, update);
    var marker = LogSlider({ label: "Marker frequency", min: 1e-1, max: 1e7,
                             value: 1e3, unit: "Hz" }, update);
    [kind, view, r, c, marker].forEach(function (ctl) {
      panel.controls.appendChild(ctl.node);
    });

    var plot = Plot({ label: "First-order frequency response", xLog: true });
    panel.output.appendChild(plot.node);

    var rows = {
      fc: readoutRow("Corner · f_c"),
      tau: readoutRow("Time constant · τ"),
      mag: readoutRow("Magnitude at the marker"),
      phase: readoutRow("Phase at the marker"),
    };
    var reads = el("div", "ac-reads");
    Object.keys(rows).forEach(function (k) { reads.appendChild(rows[k].node); });
    panel.output.appendChild(reads);

    var hint = el("p", "ac-hint");
    panel.output.appendChild(hint);

    function response(f, fc) {
      var x = f / fc;
      if (kind.value === "lp") {
        return { mag: 1 / Math.sqrt(1 + x * x), phase: -Math.atan(x) };
      }
      return { mag: x / Math.sqrt(1 + x * x),
               phase: Math.PI / 2 - Math.atan(x) };
    }

    function update() {
      var tau = r.value * c.value;
      var fc = 1 / (2 * Math.PI * tau);
      var at = response(marker.value, fc);
      var dB = 20 * Math.log10(Math.max(at.mag, 1e-12));

      rows.fc.value.textContent = siFormat(fc, "Hz");
      rows.tau.value.textContent = siFormat(tau, "s");
      rows.mag.value.textContent = dB.toFixed(1) + " dB · ×"
        + at.mag.toFixed(at.mag < 0.01 ? 4 : 3);
      rows.phase.value.textContent = (at.phase * 180 / Math.PI).toFixed(1) + "°";

      var fLo = fc / 1000, fHi = fc * 1000;
      var curve = [], asym = [], steps = 240;
      for (var i = 0; i <= steps; i++) {
        var f = fLo * Math.pow(fHi / fLo, i / steps);
        var h = response(f, fc);
        curve.push([f, view.value === "mag"
          ? 20 * Math.log10(Math.max(h.mag, 1e-12))
          : h.phase * 180 / Math.PI]);
      }
      if (view.value === "mag") {
        /* The two straight lines whose intersection defines the corner. */
        if (kind.value === "lp") {
          asym = [[fLo, 0], [fc, 0], [fHi, -60]];
        } else {
          asym = [[fLo, -60], [fc, 0], [fHi, 0]];
        }
      }

      plot.clear();
      if (view.value === "mag") {
        plot.setRange(fHi, 8, fLo, -62);
        plot.axes("f", "dB");
        [-60, -40, -20, 0].forEach(function (v) {
          plot.tick("y", v, String(v));
        });
      } else {
        var lo = kind.value === "lp" ? -98 : -8;
        var hi = kind.value === "lp" ? 8 : 98;
        plot.setRange(fHi, hi, fLo, lo);
        plot.axes("f", "deg");
        (kind.value === "lp" ? [-90, -45, 0] : [0, 45, 90]).forEach(function (v) {
          plot.tick("y", v, String(v) + "°");
        });
      }
      [fLo, fc, fHi].forEach(function (f) {
        plot.tick("x", f, siFormat(f, ""));
      });
      plot.vline(fc, "ac-plot__load");
      if (asym.length) plot.line(asym, "ac-plot__asym");
      plot.line(curve, "ac-plot__source");
      plot.dot(marker.value,
               view.value === "mag" ? dB : at.phase * 180 / Math.PI,
               "ac-plot__point", "marker");
      plot.note(fc, view.value === "mag" ? 3 : (kind.value === "lp" ? 3 : 93),
                "f_c", "middle", "ac-plot__key--load");

      var decades = Math.log10(marker.value / fc);
      hint.textContent = Math.abs(decades) < 0.1
        ? "At the corner: −3.01 dB, a factor 0.707 in amplitude, half the "
          + "power, and 45° of phase. All four are the same statement."
        : decades > 0
          ? "The marker is " + decades.toFixed(2) + " decades above the corner. "
            + "A single pole costs 20 dB per decade, so the low-pass is down "
            + (20 * decades).toFixed(0) + " dB on its asymptote here."
          : "The marker is " + (-decades).toFixed(2) + " decades below the "
            + "corner. The magnitude has barely moved, but the phase has: "
            + "that is the asymmetry that makes feedback loops unstable.";
    }

    update();
  }

  /* ============================= 7. RLC: the step response and the poles */

  /* Three components, two numbers. omega0 and zeta decide everything about
     the shape; L and C only say where on the frequency axis it happens. */
  function rlcParameters(l, c, r) {
    var w0 = 1 / Math.sqrt(l * c);
    var zeta = (r / 2) * Math.sqrt(c / l);
    return { w0: w0, zeta: zeta, q: 1 / (2 * zeta), f0: w0 / (2 * Math.PI) };
  }

  /* Unit step on the capacitor voltage of a series RLC, all three regimes. */
  function rlcStep(t, w0, zeta) {
    if (Math.abs(zeta - 1) < 1e-4) {
      return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
    }
    if (zeta < 1) {
      var wd = w0 * Math.sqrt(1 - zeta * zeta);
      return 1 - Math.exp(-zeta * w0 * t)
        * (Math.cos(wd * t) + (zeta / Math.sqrt(1 - zeta * zeta)) * Math.sin(wd * t));
    }
    var root = w0 * Math.sqrt(zeta * zeta - 1);
    var s1 = -zeta * w0 + root, s2 = -zeta * w0 - root;
    return 1 + (s2 * Math.exp(s1 * t) - s1 * Math.exp(s2 * t)) / (s1 - s2);
  }

  /* A small s-plane inset. The poles are drawn in units of omega0, so the
     dashed circle is the constant-frequency locus and the only thing that
     moves with R is the angle. */
  function polePlane(zeta) {
    var svg = svgEl("svg", { viewBox: "0 0 160 120", "class": "ac-diagram",
                             role: "img", "aria-label": "pole positions" });
    var cx = 118, cy = 60, scale = 46;
    svg.appendChild(svgEl("line", { x1: 8, y1: cy, x2: 152, y2: cy,
                                    "class": "ac-sym__wire" }));
    svg.appendChild(svgEl("line", { x1: cx, y1: 8, x2: cx, y2: 112,
                                    "class": "ac-sym__wire" }));
    svg.appendChild(svgEl("circle", { cx: cx, cy: cy, r: scale, fill: "none",
                                      "class": "ac-sym__locus" }));
    var re, im;
    if (zeta < 1) {
      re = -zeta;
      im = Math.sqrt(1 - zeta * zeta);
      [im, -im].forEach(function (y) {
        svg.appendChild(svgEl("circle", { cx: cx + re * scale, cy: cy - y * scale,
                                          r: 4.5, "class": "ac-sym__node" }));
      });
    } else {
      var root = Math.sqrt(zeta * zeta - 1);
      [-zeta + root, -zeta - root].forEach(function (x) {
        var px = Math.max(x, -2.2);
        svg.appendChild(svgEl("circle", { cx: cx + px * scale, cy: cy,
                                          r: 4.5, "class": "ac-sym__node" }));
      });
    }
    var label = svgEl("text", { x: 150, y: cy - 6, "text-anchor": "end",
                                "class": "ac-sym__label" });
    label.textContent = "Re";
    svg.appendChild(label);
    var label2 = svgEl("text", { x: cx + 5, y: 16, "class": "ac-sym__label" });
    label2.textContent = "Im";
    svg.appendChild(label2);
    return svg;
  }

  function rlcStepBench(mount) {
    var panel = Bench(mount,
      "Bench 7 · damping, the step response and the pole pair",
      "Bring R down and watch the two real roots slide together on the "
      + "negative real axis, collide at ζ = 1, and split into a conjugate "
      + "pair that walks towards the imaginary axis. The time picture and the "
      + "pole picture are the same statement.");

    var l = LogSlider({ label: "Inductance <em>L</em>", min: 1e-6, max: 1,
                        value: 1e-2, unit: "H" }, update);
    var c = LogSlider({ label: "Capacitance <em>C</em>", min: 1e-10, max: 1e-5,
                        value: 1e-7, unit: "F" }, update);
    var r = LogSlider({ label: "Resistance <em>R</em>", min: 0.1, max: 1e5,
                        value: 50, unit: "Ω" }, update);
    [l, c, r].forEach(function (ctl) { panel.controls.appendChild(ctl.node); });

    var plot = Plot({ label: "Step response of the capacitor voltage" });
    panel.output.appendChild(plot.node);
    var planeWrap = el("div", "ac-inset");
    panel.output.appendChild(planeWrap);

    var rows = {
      f0: readoutRow("Natural frequency · f₀"),
      zeta: readoutRow("Damping ratio · ζ"),
      q: readoutRow("Quality factor · Q"),
      regime: readoutRow("Regime"),
      overshoot: readoutRow("First overshoot"),
    };
    var reads = el("div", "ac-reads");
    Object.keys(rows).forEach(function (k) { reads.appendChild(rows[k].node); });
    panel.output.appendChild(reads);

    var hint = el("p", "ac-hint");
    panel.output.appendChild(hint);

    function update() {
      var p = rlcParameters(l.value, c.value, r.value);
      var zeta = p.zeta;
      var regime = zeta < 0.999 ? "underdamped"
        : zeta > 1.001 ? "overdamped" : "critically damped";
      var overshoot = zeta < 1
        ? Math.exp(-Math.PI * zeta / Math.sqrt(1 - zeta * zeta))
        : 0;

      /* Run until the slowest mode has decayed, and show at least a few
         cycles of whatever ringing there is. */
      var decay = zeta < 1
        ? zeta * p.w0
        : p.w0 * (zeta - Math.sqrt(zeta * zeta - 1));
      var tEnd = Math.min(8 / Math.max(decay, 1e-9), 400 / p.w0);
      if (zeta < 1) tEnd = Math.max(tEnd, 6 * 2 * Math.PI / p.w0);

      var points = [], peak = 1, steps = 360;
      for (var i = 0; i <= steps; i++) {
        var t = tEnd * i / steps;
        var v = rlcStep(t, p.w0, zeta);
        peak = Math.max(peak, v);
        points.push([t, v]);
      }

      rows.f0.value.textContent = siFormat(p.f0, "Hz");
      rows.zeta.value.textContent = zeta.toFixed(zeta < 0.01 ? 4 : 3);
      rows.q.value.textContent = p.q.toFixed(p.q > 100 ? 0 : 2);
      rows.regime.value.textContent = regime;
      rows.overshoot.value.textContent = (overshoot * 100).toFixed(1) + " %";

      plot.clear();
      plot.setRange(tEnd, Math.max(peak * 1.12, 1.2));
      plot.axes("t", "v_C");
      plot.tick("x", 0, "0");
      plot.tick("x", tEnd, siFormat(tEnd, "s"));
      plot.tick("y", 1, "1 V");
      plot.hline(1, "ac-plot__load");
      plot.line(points, "ac-plot__source");

      while (planeWrap.firstChild) planeWrap.removeChild(planeWrap.firstChild);
      planeWrap.appendChild(polePlane(zeta));
      planeWrap.appendChild(el("p", "ac-inset__cap",
        "Poles in units of ω₀. The dashed circle is |s| = ω₀."));

      hint.textContent = zeta < 0.1
        ? "Very lightly damped. The pole pair is almost on the imaginary axis "
          + "and the ringing lasts for about Q cycles. Take R to zero and the "
          + "circuit never stops."
        : zeta < 0.9
          ? "Underdamped. The envelope decays as exp(−ζω₀t) and the ringing "
            + "runs at ω_d = ω₀√(1−ζ²), which is " + (100 * Math.sqrt(1 - zeta * zeta)).toFixed(1)
            + " % of ω₀."
          : zeta < 1.1
            ? "Around critical damping. This is the fastest approach with no "
              + "overshoot, and the two roots have just met on the real axis."
            : "Overdamped. Two real roots, and the slow one dominates: the "
              + "circuit now behaves almost like a first-order RC with a time "
              + "constant of " + siFormat(1 / decay, "s") + ".";
    }

    update();
  }

  /* ===================================== 8. RLC: resonance and bandwidth */

  function rlcResonanceBench(mount) {
    var panel = Bench(mount,
      "Bench 8 · resonance, Q and bandwidth",
      "The same circuit driven by a sinusoid, read across the resistor. Q is "
      + "the centre frequency divided by the width between the half-power "
      + "points, and it is also how many times the drive appears across the "
      + "inductor.");

    var l = LogSlider({ label: "Inductance <em>L</em>", min: 1e-6, max: 1,
                        value: 1e-2, unit: "H" }, update);
    var c = LogSlider({ label: "Capacitance <em>C</em>", min: 1e-10, max: 1e-5,
                        value: 1e-7, unit: "F" }, update);
    var r = LogSlider({ label: "Resistance <em>R</em>", min: 0.1, max: 1e5,
                        value: 50, unit: "Ω" }, update);
    [l, c, r].forEach(function (ctl) { panel.controls.appendChild(ctl.node); });

    var plot = Plot({ label: "Band-pass magnitude against frequency", xLog: true });
    panel.output.appendChild(plot.node);

    var rows = {
      f0: readoutRow("Resonance · f₀"),
      q: readoutRow("Quality factor · Q"),
      bw: readoutRow("Bandwidth · Δf = f₀/Q"),
      edges: readoutRow("Half-power points"),
      boost: readoutRow("Voltage across L at resonance"),
    };
    var reads = el("div", "ac-reads");
    Object.keys(rows).forEach(function (k) { reads.appendChild(rows[k].node); });
    panel.output.appendChild(reads);

    var hint = el("p", "ac-hint");
    panel.output.appendChild(hint);

    function update() {
      var p = rlcParameters(l.value, c.value, r.value);
      var q = p.q, f0 = p.f0;
      var bw = f0 / q;
      var k = Math.sqrt(1 + 1 / (4 * q * q));
      var fLoEdge = f0 * (k - 1 / (2 * q));
      var fHiEdge = f0 * (k + 1 / (2 * q));

      rows.f0.value.textContent = siFormat(f0, "Hz");
      rows.q.value.textContent = q.toFixed(q > 100 ? 0 : 2);
      rows.bw.value.textContent = siFormat(bw, "Hz");
      rows.edges.value.textContent = siFormat(fLoEdge, "Hz") + " … "
        + siFormat(fHiEdge, "Hz");
      rows.boost.value.textContent = "×" + q.toFixed(q > 100 ? 0 : 2)
        + " the drive";

      var fLo = f0 / 100, fHi = f0 * 100;
      var points = [], steps = 320;
      for (var i = 0; i <= steps; i++) {
        var f = fLo * Math.pow(fHi / fLo, i / steps);
        var x = f / f0;
        var mag = 1 / Math.sqrt(1 + q * q * Math.pow(x - 1 / x, 2));
        points.push([f, mag]);
      }

      plot.clear();
      plot.setRange(fHi, 1.15, fLo);
      plot.axes("f", "|H|");
      [fLo, f0, fHi].forEach(function (f) { plot.tick("x", f, siFormat(f, "")); });
      plot.tick("y", 1, "1");
      plot.tick("y", 0.707, "0.707");
      plot.hline(0.707, "ac-plot__load");
      plot.vline(f0, "ac-plot__asym");
      plot.line(points, "ac-plot__source");
      plot.dot(f0, 1, "ac-plot__point", "resonance");
      plot.note(fLo, 0.76, "−3 dB", "start", "ac-plot__key--load");

      hint.textContent = q < 0.6
        ? "Q below about 0.6: there is no peak left to speak of. The circuit "
          + "is two cascaded first-order sections in all but name."
        : q < 5
          ? "A broad resonance. Useful as a filter shape, useless as a "
            + "frequency reference: the peak is too flat to locate."
          : q < 100
            ? "A clear resonance. The width is " + siFormat(bw, "Hz")
              + ", and " + q.toFixed(1) + " times the drive voltage appears "
              + "across the inductor and the capacitor individually."
            : "Very high Q. Note what this costs: the bandwidth is now "
              + siFormat(bw, "Hz") + ", so the circuit takes about "
              + siFormat(q / (Math.PI * f0), "s") + " to respond to anything.";
    }

    update();
  }

  /* ================================ 9. a load line drawn against a curve */

  var BOLTZMANN_OVER_CHARGE = 8.617333e-5; // V/K

  /* Each device is pinned by one datasheet point rather than by a saturation
     current, because a datasheet gives a forward voltage at a current and
     nobody publishes I_S. Requiring v(i_ref, T) = v_ref + tc*(T - T0) fixes
     I_S(T) in one line and reproduces the quoted temperature coefficient by
     construction, while keeping the n*V_T*ln(10) slope exact at every
     temperature. */
  var DIODES = {
    "si-ideal": { label: "Silicon, n = 1", n: 1.0, iref: 1e-2, vref: 0.70, tc: -2.0e-3 },
    "1n4148":   { label: "1N4148, n = 1.75", n: 1.75, iref: 1e-2, vref: 0.72, tc: -2.0e-3 },
    "schottky": { label: "Schottky", n: 1.05, iref: 1e-2, vref: 0.32, tc: -1.5e-3 },
    "led":      { label: "Red LED", n: 1.8, iref: 2e-2, vref: 1.95, tc: -2.0e-3 },
  };

  function diodeModel(key, celsius) {
    var d = DIODES[key];
    var t = celsius + 273.15;
    var vt = BOLTZMANN_OVER_CHARGE * t;
    var vAtRef = d.vref + d.tc * (t - 300.15);
    var isat = d.iref * Math.exp(-vAtRef / (d.n * vt));
    return {
      n: d.n, vt: vt, isat: isat,
      decade: d.n * vt * Math.LN10,
      current: function (v) { return isat * (Math.exp(v / (d.n * vt)) - 1); },
    };
  }

  function diodeBench(mount) {
    var panel = Bench(mount,
      "Bench 9 · the diode load line",
      "The device imposes a curve, the rest of the circuit imposes a straight "
      + "line, and the operating point is where they cross. There is no "
      + "closed form for it, so the panel bisects. Watch how little the "
      + "voltage moves and how much the current does.");

    var part = Choice({
      label: "Device",
      value: "si-ideal",
      options: Object.keys(DIODES).map(function (k) {
        return { value: k, label: DIODES[k].label };
      }),
    }, update);
    var supply = LogSlider({ label: "Supply <em>V</em>", min: 0.3, max: 30,
                             value: 5, unit: "V" }, update);
    var r = LogSlider({ label: "Series resistor <em>R</em>", min: 10, max: 1e6,
                        value: 1e3, unit: "Ω" }, update);
    var temp = LinSlider({ label: "Temperature", min: -40, max: 125, value: 27,
                           step: 1, digits: 0, unit: "°C" }, update);
    [part, supply, r, temp].forEach(function (ctl) {
      panel.controls.appendChild(ctl.node);
    });

    var plot = Plot({ label: "Diode characteristic and load line" });
    panel.output.appendChild(plot.node);

    var rows = {
      vd: readoutRow("Diode voltage · V_D"),
      id: readoutRow("Current · I_D"),
      rd: readoutRow("Small-signal resistance · r_d = nV_T/I_D"),
      decade: readoutRow("Volts per decade of current"),
      naive: readoutRow("What a fixed 0.7 V model would give"),
    };
    var reads = el("div", "ac-reads");
    Object.keys(rows).forEach(function (k) { reads.appendChild(rows[k].node); });
    panel.output.appendChild(reads);

    var hint = el("p", "ac-hint");
    panel.output.appendChild(hint);

    /* The device current rises with v and the load line falls with it, so the
       difference is monotone and bisection cannot miss. */
    function operatingPoint(model, v, rs) {
      var lo = 0, hi = v;
      for (var i = 0; i < 80; i++) {
        var mid = (lo + hi) / 2;
        if (model.current(mid) - (v - mid) / rs > 0) hi = mid; else lo = mid;
      }
      var vd = (lo + hi) / 2;
      return { vd: vd, id: (v - vd) / rs };
    }

    function update() {
      var model = diodeModel(part.value, temp.value);
      var op = operatingPoint(model, supply.value, r.value);
      var rd = op.id > 0 ? model.n * model.vt / op.id : Infinity;
      var naive = Math.max(supply.value - 0.7, 0) / r.value;

      rows.vd.value.textContent = siFormat(op.vd, "V");
      rows.id.value.textContent = siFormat(op.id, "A");
      rows.rd.value.textContent = siFormat(rd, "Ω");
      rows.decade.value.textContent = (model.decade * 1000).toFixed(1) + " mV";
      rows.naive.value.textContent = siFormat(naive, "A");

      var iShort = supply.value / r.value;
      var vMax = supply.value;
      var yMax = Math.max(iShort * 1.08, 1e-12);
      var curve = [], steps = 260;
      for (var i = 0; i <= steps; i++) {
        var v = vMax * i / steps;
        curve.push([v, Math.min(model.current(v), yMax * 1.04)]);
      }

      plot.clear();
      plot.setRange(vMax, yMax);
      plot.axes("v", "i");
      plot.tick("x", 0, "0");
      plot.tick("x", vMax, siFormat(vMax, "V"));
      plot.tick("y", iShort, siFormat(iShort, "A"));
      plot.line([[0, iShort], [vMax, 0]], "ac-plot__load");
      plot.line(curve, "ac-plot__source");
      plot.dot(op.vd, op.id, "ac-plot__point", "operating point");
      plot.note(vMax * 0.98, yMax * 0.93, "load line", "end", "ac-plot__key--load");
      plot.note(vMax * 0.02, yMax * 0.93, "diode", "start", "ac-plot__key--source");

      var ratio = naive > 0 ? op.id / naive : 0;
      hint.textContent = op.id < 1e-9
        ? "The supply is below the forward voltage, so essentially nothing "
          + "flows. Note that the model does not switch off, it just becomes "
          + "very small: a diode has no threshold, only a steep curve."
        : supply.value < 2 * op.vd
          ? "The supply is close to the diode's own drop, so the load line is "
            + "short and the operating point is sensitive to everything. This "
            + "is the regime where the constant-drop model is worst."
          : "The series resistor sets the current and the diode only decides "
            + "what to charge for it. Here the 0.7 V model is off by "
            + (Math.abs(1 - ratio) * 100).toFixed(1) + " %, which is usually "
            + "close enough — and would not be in a log amplifier.";
    }

    update();
  }

  /* ========================== 10. loop gain, gain error and bandwidth */

  /* One expression, G = A/(1 + A*beta), plotted against frequency. The
     feedback factor is the same for both topologies, which is why the
     bandwidth of an inverting stage at a gain of -1 is that of a
     non-inverting stage at +2 and not at +1. */
  function opampBench(mount) {
    var panel = Bench(mount,
      "Bench 10 · loop gain is the whole story",
      "The distance between the open-loop curve and the flat noise-gain line "
      + "is the loop gain, and every good property of the circuit is "
      + "proportional to it. Where they meet, the circuit stops being exact.");

    var topology = Choice({
      label: "Topology",
      value: "noninv",
      options: [{ value: "noninv", label: "non-inverting" },
                { value: "inv", label: "inverting" }],
    }, update);
    var r1 = LogSlider({ label: "Input resistor <em>R</em><sub>1</sub>",
                         min: 100, max: 1e6, value: 1e3, unit: "Ω" }, update);
    var rf = LogSlider({ label: "Feedback resistor <em>R</em><sub>f</sub>",
                         min: 100, max: 1e7, value: 1e4, unit: "Ω" }, update);
    var a0 = LogSlider({ label: "Open-loop DC gain <em>A</em><sub>0</sub>",
                         min: 1e3, max: 1e7, value: 2e5, unit: "" }, update);
    var gbw = LogSlider({ label: "Gain-bandwidth product", min: 1e5, max: 1e9,
                          value: 4e6, unit: "Hz" }, update);
    [topology, r1, rf, a0, gbw].forEach(function (ctl) {
      panel.controls.appendChild(ctl.node);
    });

    var plot = Plot({ label: "Open-loop and closed-loop gain", xLog: true });
    panel.output.appendChild(plot.node);

    var rows = {
      ideal: readoutRow("Ideal gain"),
      noise: readoutRow("Noise gain · 1/β"),
      actual: readoutRow("Actual DC gain"),
      error: readoutRow("Gain error at DC"),
      loop: readoutRow("Loop gain at DC · Aβ"),
      bw: readoutRow("Closed-loop bandwidth"),
    };
    var reads = el("div", "ac-reads");
    Object.keys(rows).forEach(function (k) { reads.appendChild(rows[k].node); });
    panel.output.appendChild(reads);

    var hint = el("p", "ac-hint");
    panel.output.appendChild(hint);

    function dB(x) { return 20 * Math.log10(Math.max(x, 1e-9)); }

    function update() {
      var beta = r1.value / (r1.value + rf.value);
      var noiseGain = 1 / beta;
      var ideal = topology.value === "noninv"
        ? 1 + rf.value / r1.value
        : -rf.value / r1.value;
      var fp = gbw.value / a0.value;          // the dominant pole
      var loopDC = a0.value * beta;
      var actual = topology.value === "noninv"
        ? a0.value / (1 + loopDC)
        : -(rf.value / r1.value) * (loopDC / (1 + loopDC));
      var error = (Math.abs(actual) - Math.abs(ideal)) / Math.abs(ideal) * 100;
      var bw = gbw.value * beta;

      rows.ideal.value.textContent = "×" + ideal.toFixed(2)
        + " · " + dB(Math.abs(ideal)).toFixed(1) + " dB";
      rows.noise.value.textContent = "×" + noiseGain.toFixed(2);
      rows.actual.value.textContent = "×" + actual.toFixed(4);
      rows.error.value.textContent = error.toFixed(error > -0.01 ? 4 : 3) + " %";
      rows.loop.value.textContent = dB(loopDC).toFixed(1) + " dB · ×"
        + loopDC.toPrecision(3);
      rows.bw.value.textContent = siFormat(bw, "Hz");

      var fLo = Math.min(fp / 10, 0.1), fHi = gbw.value * 10;
      /* With A = A0/(1 + ju) the closed loop collapses to
         G = A0/(1 + A0*beta + ju), one pole at u = 1 + A0*beta. */
      var open = [], closed = [], steps = 260;
      for (var i = 0; i <= steps; i++) {
        var f = fLo * Math.pow(fHi / fLo, i / steps);
        var u = f / fp;
        open.push([f, dB(a0.value / Math.sqrt(1 + u * u))]);
        closed.push([f, dB(a0.value
          / Math.sqrt(Math.pow(1 + loopDC, 2) + u * u))]);
      }

      var top = Math.ceil(dB(a0.value) / 20) * 20 + 10;
      plot.clear();
      plot.setRange(fHi, top, fLo, -25);
      plot.axes("f", "dB");
      [0, 40, 80, 120].filter(function (v) { return v < top; })
        .forEach(function (v) { plot.tick("y", v, String(v)); });
      [fLo, 1e3, gbw.value].forEach(function (f) {
        plot.tick("x", f, siFormat(f, ""));
      });
      plot.hline(dB(noiseGain), "ac-plot__asym");
      plot.line(open, "ac-plot__load");
      plot.line(closed, "ac-plot__source");
      plot.dot(bw, dB(noiseGain) - 3, "ac-plot__point", "closed-loop −3 dB");
      plot.note(fLo, dB(a0.value) - 8, "open loop", "start", "ac-plot__key--load");
      plot.note(fLo, dB(noiseGain) + 6, "1/β", "start");

      hint.textContent = loopDC < 100
        ? "The loop gain is only " + dB(loopDC).toFixed(0) + " dB. The circuit "
          + "is no longer set by the resistors: the gain error is "
          + Math.abs(error).toFixed(2) + " %, and it will drift with the "
          + "device."
        : topology.value === "inv" && Math.abs(ideal) < noiseGain - 0.01
          ? "Note the gap: the signal gain is ×" + Math.abs(ideal).toFixed(2)
            + " but the noise gain is ×" + noiseGain.toFixed(2) + ". Bandwidth, "
            + "gain error and output noise all follow the noise gain, so an "
            + "inverting stage at −1 has the bandwidth of a non-inverting one "
            + "at +2."
          : "Loop gain " + dB(loopDC).toFixed(0) + " dB at DC, falling at "
            + "20 dB/decade. It reaches unity at " + siFormat(bw, "Hz")
            + ", and that is where the closed-loop curve leaves the flat line.";
    }

    update();
  }

  /* ================== 11. positive feedback: hysteresis and a free-runner */

  function schmittBench(mount) {
    var panel = Bench(mount,
      "Bench 11 · Schmitt trigger and relaxation oscillator",
      "Positive feedback removes the stable operating point, and a capacitor "
      + "supplies the state that carries the circuit from one switch to the "
      + "next. Change the supply and watch the period not move.");

    var r1 = LogSlider({ label: "Feedback divider <em>R</em><sub>1</sub>",
                         min: 1e3, max: 1e6, value: 1e4, unit: "Ω" }, update);
    var r2 = LogSlider({ label: "Feedback divider <em>R</em><sub>2</sub>",
                         min: 1e3, max: 1e6, value: 1e4, unit: "Ω" }, update);
    var r = LogSlider({ label: "Timing resistor <em>R</em>", min: 1e3,
                        max: 1e6, value: 4.7e4, unit: "Ω" }, update);
    var c = LogSlider({ label: "Timing capacitor <em>C</em>", min: 1e-10,
                        max: 1e-6, value: 1e-8, unit: "F" }, update);
    var vs = LogSlider({ label: "Supply <em>V</em><sub>s</sub>", min: 1,
                         max: 15, value: 12, unit: "V" }, update);
    [r1, r2, r, c, vs].forEach(function (ctl) {
      panel.controls.appendChild(ctl.node);
    });

    var plot = Plot({ label: "Capacitor voltage and comparator output" });
    panel.output.appendChild(plot.node);

    var rows = {
      beta: readoutRow("Feedback fraction · β = R₁/(R₁+R₂)"),
      th: readoutRow("Thresholds"),
      window: readoutRow("Hysteresis window"),
      period: readoutRow("Period"),
      freq: readoutRow("Frequency"),
    };
    var reads = el("div", "ac-reads");
    Object.keys(rows).forEach(function (k) { reads.appendChild(rows[k].node); });
    panel.output.appendChild(reads);

    var hint = el("p", "ac-hint");
    panel.output.appendChild(hint);

    function update() {
      var beta = r1.value / (r1.value + r2.value);
      var vth = beta * vs.value;
      var tau = r.value * c.value;
      var half = tau * Math.log((1 + beta) / (1 - beta));
      var period = 2 * half;

      rows.beta.value.textContent = beta.toFixed(4);
      rows.th.value.textContent = "±" + siFormat(vth, "V");
      rows.window.value.textContent = siFormat(2 * vth, "V");
      rows.period.value.textContent = siFormat(period, "s");
      rows.freq.value.textContent = siFormat(1 / period, "Hz");

      var cap = [], out = [], steps = 360, tEnd = 2 * period;
      for (var i = 0; i <= steps; i++) {
        var t = tEnd * i / steps;
        var phase = t % period;
        var rising = phase < half;
        var local = rising ? phase : phase - half;
        var v = rising
          ? vs.value + (-vth - vs.value) * Math.exp(-local / tau)
          : -vs.value + (vth + vs.value) * Math.exp(-local / tau);
        cap.push([t, v]);
        out.push([t, rising ? vs.value : -vs.value]);
      }

      plot.clear();
      plot.setRange(tEnd, vs.value * 1.25, 0, -vs.value * 1.25);
      plot.axes("t", "v");
      plot.tick("x", 0, "0");
      plot.tick("x", period, siFormat(period, "s"));
      plot.tick("y", vth, "+V_th");
      plot.tick("y", -vth, "−V_th");
      plot.hline(0, "ac-plot__axis");
      plot.hline(vth, "ac-plot__asym");
      plot.hline(-vth, "ac-plot__asym");
      plot.line(out, "ac-plot__load");
      plot.line(cap, "ac-plot__source");
      plot.note(tEnd * 0.02, vs.value * 1.1, "output", "start", "ac-plot__key--load");
      plot.note(tEnd * 0.98, vs.value * 1.1, "capacitor", "end", "ac-plot__key--source");

      hint.textContent = beta > 0.6
        ? "A wide hysteresis window: the capacitor has to travel most of the "
          + "way to the rails, so the ramp is strongly curved and the period "
          + "is long. Immune to noise, poor as a triangle generator."
        : beta < 0.05
          ? "A narrow window. The capacitor only moves through a small, nearly "
            + "straight part of the exponential, so the ramp is a good "
            + "triangle — and the circuit is now sensitive to noise and to "
            + "comparator offset."
          : "The period is 2RC·ln((1+β)/(1−β)). Both thresholds scale with the "
            + "supply, so the supply cancels out: the frequency depends only "
            + "on β and RC. Move the supply slider and watch the period hold.";
    }

    update();
  }

  /* ================ 12. biasing: the load line across a family of curves */

  var BJT = { isat: 1e-14, va: 100, knee: 0.05 };
  var FET = { k: 2e-3, vth: 1.0, lambda: 0.02 };

  /* Forward-active exponential, the Early slope, and a soft knee so the
     saturation region joins on smoothly instead of as a corner. */
  function bjtCurrent(vbe, vce, vt) {
    if (vce <= 0) return 0;
    return BJT.isat * Math.exp(vbe / vt) * (1 + vce / BJT.va)
      * (1 - Math.exp(-vce / BJT.knee));
  }

  /* Square law above threshold; triode below the overdrive. */
  function fetCurrent(vgs, vds) {
    var ov = vgs - FET.vth;
    if (ov <= 0 || vds <= 0) return 0;
    if (vds >= ov) {
      return (FET.k / 2) * ov * ov * (1 + FET.lambda * vds);
    }
    return FET.k * (ov * vds - vds * vds / 2);
  }

  function transistorBench(mount) {
    var panel = Bench(mount,
      "Bench 12 · the operating point and what it is worth",
      "The same load line as chapter 1, now drawn across a family of curves "
      + "instead of one. The bias picks the curve; the load line picks the "
      + "point on it; the slope at that point is the gain.");

    var device = Choice({
      label: "Device",
      value: "bjt",
      options: [{ value: "bjt", label: "bipolar" },
                { value: "fet", label: "MOSFET" }],
    }, update);
    var vcc = LogSlider({ label: "Supply <em>V</em><sub>CC</sub>", min: 1,
                          max: 30, value: 12, unit: "V" }, update);
    var rc = LogSlider({ label: "Load resistor <em>R</em><sub>C</sub>",
                         min: 100, max: 1e6, value: 4.7e3, unit: "Ω" }, update);
    var vbe = LinSlider({ label: "Bias <em>V</em><sub>BE</sub>", min: 0.50,
                          max: 0.80, value: 0.65, step: 0.001, digits: 3,
                          unit: "V" }, update);
    var vgs = LinSlider({ label: "Bias <em>V</em><sub>GS</sub>", min: 0.6,
                          max: 3.0, value: 2.0, step: 0.01, digits: 2,
                          unit: "V" }, update);
    [device, vcc, rc, vbe, vgs].forEach(function (ctl) {
      panel.controls.appendChild(ctl.node);
    });

    var plot = Plot({ label: "Output characteristics and load line" });
    panel.output.appendChild(plot.node);

    var rows = {
      region: readoutRow("Region"),
      ic: readoutRow("Current"),
      vce: readoutRow("Output voltage"),
      gm: readoutRow("Transconductance · g_m"),
      ro: readoutRow("Output resistance · r_o"),
      gain: readoutRow("Small-signal gain · −g_m(R_C ∥ r_o)"),
    };
    var reads = el("div", "ac-reads");
    Object.keys(rows).forEach(function (k) { reads.appendChild(rows[k].node); });
    panel.output.appendChild(reads);

    var hint = el("p", "ac-hint");
    panel.output.appendChild(hint);

    function currentAt(bias, vout) {
      return device.value === "bjt"
        ? bjtCurrent(bias, vout, 0.025852)
        : fetCurrent(bias, vout);
    }

    /* Device current rises with vout, load-line current falls with it. */
    function solve(bias) {
      var lo = 0, hi = vcc.value;
      for (var i = 0; i < 70; i++) {
        var mid = (lo + hi) / 2;
        if (currentAt(bias, mid) - (vcc.value - mid) / rc.value > 0) hi = mid;
        else lo = mid;
      }
      var vout = (lo + hi) / 2;
      return { vout: vout, i: (vcc.value - vout) / rc.value };
    }

    function update() {
      var isBjt = device.value === "bjt";
      vbe.node.hidden = !isBjt;
      vgs.node.hidden = isBjt;

      var bias = isBjt ? vbe.value : vgs.value;
      var step = isBjt ? 0.012 : 0.14;
      var op = solve(bias);
      var gm, ro;
      if (isBjt) {
        gm = op.i / 0.025852;
        ro = op.i > 0 ? BJT.va / op.i : Infinity;
      } else {
        var ov = Math.max(bias - FET.vth, 1e-9);
        gm = FET.k * ov;
        ro = op.i > 0 ? 1 / (FET.lambda * op.i) : Infinity;
      }
      var rload = isFinite(ro) ? (rc.value * ro) / (rc.value + ro) : rc.value;
      var gain = -gm * rload;

      var saturated = isBjt ? op.vout < 0.25
        : op.vout < Math.max(bias - FET.vth, 0);
      var cutoff = op.i < 1e-9;
      var region = cutoff ? "cutoff — no current"
        : saturated ? (isBjt ? "saturation — no gain" : "triode — no gain")
        : (isBjt ? "forward active" : "saturation (the useful one)");

      rows.region.value.textContent = region;
      rows.ic.value.textContent = siFormat(op.i, "A");
      rows.vce.value.textContent = siFormat(op.vout, "V");
      rows.gm.value.textContent = siFormat(gm, "S");
      rows.ro.value.textContent = siFormat(ro, "Ω");
      rows.gain.value.textContent = cutoff || saturated
        ? "—" : "×" + gain.toFixed(1);

      var iMax = vcc.value / rc.value;
      var family = [], steps = 180;
      for (var k = -2; k <= 2; k++) {
        var b = bias + k * step;
        var curve = [];
        for (var i = 0; i <= steps; i++) {
          var v = vcc.value * i / steps;
          curve.push([v, Math.min(currentAt(b, v), iMax * 1.06)]);
        }
        family.push({ curve: curve, self: k === 0 });
      }

      plot.clear();
      plot.setRange(vcc.value, iMax * 1.1);
      plot.axes(isBjt ? "v_CE" : "v_DS", "i");
      plot.tick("x", 0, "0");
      plot.tick("x", vcc.value, siFormat(vcc.value, "V"));
      plot.tick("y", iMax, siFormat(iMax, "A"));
      family.forEach(function (entry) {
        plot.line(entry.curve, entry.self ? "ac-plot__source" : "ac-plot__family");
      });
      plot.line([[0, iMax], [vcc.value, 0]], "ac-plot__load");
      if (!cutoff) plot.dot(op.vout, op.i, "ac-plot__point", "operating point");
      plot.note(vcc.value * 0.98, iMax * 0.95, "load line", "end",
                "ac-plot__key--load");

      hint.textContent = cutoff
        ? "Below conduction. The device is off, the load resistor carries "
          + "nothing, and the output sits at the supply."
        : saturated
          ? "Driven into " + (isBjt ? "saturation" : "triode") + ". The output "
            + "cannot fall further, the curves are nearly vertical here, and "
            + "there is no gain left. Useful as a switch, useless as an "
            + "amplifier."
          : "Gain ×" + Math.abs(gain).toFixed(1) + ", output sitting at "
            + siFormat(op.vout, "V") + " with "
            + siFormat(Math.min(op.vout, vcc.value - op.vout), "V")
            + " of swing to the nearer limit. The gain is the load line's "
            + "slope divided by the curve spacing, which is why the bias "
            + "belongs near the middle.";
    }

    update();
  }

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
    ".ac-plot__asym{fill:none;stroke:var(--muted);stroke-width:1.2;stroke-dasharray:3 3}",
    ".ac-plot__family{fill:none;stroke:var(--muted);stroke-width:1;opacity:0.55}",
    ".ac-sym__locus{stroke:var(--rule-strong);stroke-width:1;stroke-dasharray:3 3}",
    ".ac-inset{margin:0.9rem 0 0;display:flex;gap:0.8rem;align-items:center;flex-wrap:wrap}",
    ".ac-inset .ac-diagram{max-width:10rem;margin:0}",
    ".ac-inset__cap{margin:0;font-size:var(--step--2);color:var(--muted);max-width:14rem}",
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
    "rc-step": rcStepBench,
    "rc-bode": rcBodeBench,
    "rlc-step": rlcStepBench,
    "rlc-resonance": rlcResonanceBench,
    "diode-load-line": diodeBench,
    "opamp-loop": opampBench,
    "schmitt-oscillator": schmittBench,
    "transistor-bias": transistorBench,
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
