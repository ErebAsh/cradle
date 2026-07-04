/* ============================================================
   NEURAL NETWORK PLAYGROUND — ENGINE
   Full forward/backprop, dataset generation, Canvas rendering
   ============================================================ */

// ── Activation Functions ─────────────────────────────────────
const Activations = {
  relu: { fn: (x) => Math.max(0, x), deriv: (x) => (x > 0 ? 1 : 0) },
  sigmoid: {
    fn: (x) => 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x)))),
    deriv: (x) => {
      const s = 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x))));
      return s * (1 - s);
    },
  },
  tanh: { fn: (x) => Math.tanh(x), deriv: (x) => 1 - Math.tanh(x) ** 2 },
  leaky_relu: {
    fn: (x) => (x > 0 ? x : 0.01 * x),
    deriv: (x) => (x > 0 ? 1 : 0.01),
  },
};

// ── Dataset Generators ───────────────────────────────────────
function generateDataset(type, n, noise) {
  const pts = [];
  const nr = noise / 100;
  const rand = () => (Math.random() - 0.5) * 2 * nr;
  switch (type) {
    case "circle":
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2,
          r = Math.random();
        const inner = r < 0.5;
        const rad = inner ? Math.random() * 0.35 : 0.55 + Math.random() * 0.4;
        pts.push([
          Math.cos(a) * rad + rand(),
          Math.sin(a) * rad + rand(),
          inner ? 1 : 0,
        ]);
      }
      break;
    case "xor":
      for (let i = 0; i < n; i++) {
        const x = (Math.random() - 0.5) * 2,
          y = (Math.random() - 0.5) * 2;
        pts.push([x + rand(), y + rand(), x * y > 0 ? 1 : 0]);
      }
      break;
    case "spiral":
      for (let i = 0; i < n; i++) {
        const c = i % 2,
          t = (i / n) * 3 * Math.PI + c * Math.PI;
        const r = (t / (3 * Math.PI)) * 0.8 + 0.1;
        pts.push([r * Math.cos(t) + rand(), r * Math.sin(t) + rand(), c]);
      }
      break;
    case "gaussian":
      for (let i = 0; i < n; i++) {
        const c = i % 2;
        const cx = c ? -0.4 : 0.4,
          cy = c ? -0.4 : 0.4;
        pts.push([
          cx + (Math.random() - 0.5) * 0.6 + rand(),
          cy + (Math.random() - 0.5) * 0.6 + rand(),
          c,
        ]);
      }
      break;
    case "moon":
      for (let i = 0; i < n; i++) {
        const c = i % 2;
        const a = Math.random() * Math.PI;
        if (c === 0) {
          pts.push([Math.cos(a) + rand(), Math.sin(a) + rand() - 0.2, 0]);
        } else {
          pts.push([
            1 - Math.cos(a) + rand(),
            1 - Math.sin(a) - 0.5 + rand(),
            1,
          ]);
        }
      }
      break;
    default:
      return generateDataset("circle", n, noise);
  }
  // Normalize to [-1,1]
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  pts.forEach((p) => {
    minX = Math.min(minX, p[0]);
    maxX = Math.max(maxX, p[0]);
    minY = Math.min(minY, p[1]);
    maxY = Math.max(maxY, p[1]);
  });
  const rx = maxX - minX || 1,
    ry = maxY - minY || 1;
  pts.forEach((p) => {
    p[0] = ((p[0] - minX) / rx) * 2 - 1;
    p[1] = ((p[1] - minY) / ry) * 2 - 1;
  });
  return pts;
}

// ── Neural Network Class ─────────────────────────────────────
class NeuralNetwork {
  constructor(layers, activationName = "relu", lr = 0.01) {
    this.layers = layers; // e.g. [2, 4, 4, 1]
    this.activationName = activationName;
    this.activation = Activations[activationName] || Activations.relu;
    this.lr = lr;
    this.weights = [];
    this.biases = [];
    this.initWeights();
  }

  initWeights() {
    this.weights = [];
    this.biases = [];
    for (let i = 0; i < this.layers.length - 1; i++) {
      const fanIn = this.layers[i],
        fanOut = this.layers[i + 1];
      const scale = Math.sqrt(2 / fanIn); // He init
      const w = [];
      for (let j = 0; j < fanOut; j++) {
        const row = [];
        for (let k = 0; k < fanIn; k++)
          row.push((Math.random() * 2 - 1) * scale);
        w.push(row);
      }
      this.weights.push(w);
      this.biases.push(new Array(fanOut).fill(0));
    }
  }

  forward(input) {
    const zs = [],
      as = [input.slice()];
    let a = input.slice();
    for (let l = 0; l < this.weights.length; l++) {
      const z = [],
        w = this.weights[l],
        b = this.biases[l];
      for (let j = 0; j < w.length; j++) {
        let sum = b[j];
        for (let k = 0; k < a.length; k++) sum += w[j][k] * a[k];
        z.push(sum);
      }
      zs.push(z);
      // Last layer: sigmoid, others: chosen activation
      const isLast = l === this.weights.length - 1;
      a = z.map((v) =>
        isLast ? Activations.sigmoid.fn(v) : this.activation.fn(v),
      );
      as.push(a);
    }
    return { zs, as, output: a };
  }

  predict(input) {
    return this.forward(input).output[0];
  }

  train(inputs, targets, batchSize) {
    let totalLoss = 0,
      correct = 0;
    // Mini-batch or full batch
    const indices = Array.from({ length: inputs.length }, (_, i) => i);
    // Shuffle
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    const bs = batchSize > 0 ? batchSize : inputs.length;

    for (let bStart = 0; bStart < indices.length; bStart += bs) {
      const bEnd = Math.min(bStart + bs, indices.length);
      // Accumulate gradients
      const dW = this.weights.map((w) =>
        w.map((row) => new Array(row.length).fill(0)),
      );
      const dB = this.biases.map((b) => new Array(b.length).fill(0));
      const batchLen = bEnd - bStart;

      for (let bi = bStart; bi < bEnd; bi++) {
        const idx = indices[bi];
        const x = inputs[idx],
          t = targets[idx];
        const { zs, as } = this.forward(x);
        const out = as[as.length - 1][0];

        // Loss
        const clipped = Math.max(1e-7, Math.min(1 - 1e-7, out));
        totalLoss += -(t * Math.log(clipped) + (1 - t) * Math.log(1 - clipped));
        correct += (out >= 0.5 ? 1 : 0) === t ? 1 : 0;

        // Backprop
        const deltas = [];
        // Output layer delta
        let delta = [out - t]; // BCE derivative * sigmoid derivative simplified
        deltas.unshift(delta);

        for (let l = this.weights.length - 2; l >= 0; l--) {
          const newDelta = [];
          for (let j = 0; j < this.weights[l].length; j++) {
            let err = 0;
            for (let k = 0; k < this.weights[l + 1].length; k++) {
              err += this.weights[l + 1][k][j] * deltas[0][k];
            }
            newDelta.push(err * this.activation.deriv(zs[l][j]));
          }
          deltas.unshift(newDelta);
        }

        // Accumulate
        for (let l = 0; l < this.weights.length; l++) {
          for (let j = 0; j < this.weights[l].length; j++) {
            for (let k = 0; k < this.weights[l][j].length; k++) {
              dW[l][j][k] += deltas[l][j] * as[l][k];
            }
            dB[l][j] += deltas[l][j];
          }
        }
      }

      // Apply gradients
      for (let l = 0; l < this.weights.length; l++) {
        for (let j = 0; j < this.weights[l].length; j++) {
          for (let k = 0; k < this.weights[l][j].length; k++) {
            this.weights[l][j][k] -= (this.lr * dW[l][j][k]) / batchLen;
          }
          this.biases[l][j] -= (this.lr * dB[l][j]) / batchLen;
        }
      }
    }

    return {
      loss: totalLoss / inputs.length,
      accuracy: correct / inputs.length,
    };
  }
}

// ── CSV Parsing, Validation, and Normalization ───────────────
function parseAndValidateCSV(text) {
  const lines = text.split(/\r?\n/);
  const rows = [];
  
  const nonEmptyLines = lines
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  if (nonEmptyLines.length === 0) {
    throw new Error("The uploaded file is empty.");
  }
  
  // Detect delimiter
  const firstLine = nonEmptyLines[0];
  let delimiter = ',';
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;
  
  if (semiCount > commaCount && semiCount > tabCount) {
    delimiter = ';';
  } else if (tabCount > commaCount && tabCount > semiCount) {
    delimiter = '\t';
  }
  
  const firstLineParts = firstLine.split(delimiter).map(p => p.trim());
  // Remove trailing empty elements
  while (firstLineParts.length > 3 && firstLineParts[firstLineParts.length - 1] === "") {
    firstLineParts.pop();
  }
  
  const isFirstLineNumeric = 
    firstLineParts.length === 3 &&
    !isNaN(parseFloat(firstLineParts[0])) &&
    !isNaN(parseFloat(firstLineParts[1])) &&
    (firstLineParts[2] === "0" || firstLineParts[2] === "1" || parseFloat(firstLineParts[2]) === 0 || parseFloat(firstLineParts[2]) === 1);
    
  let startIndex = 0;
  if (!isFirstLineNumeric) {
    if (firstLineParts.length !== 3) {
      throw new Error(`Uneven column counts detected. Each row must have exactly 3 columns (feature_1, feature_2, class_label). Found ${firstLineParts.length} columns.`);
    }
    startIndex = 1;
  }
  
  const dataLines = nonEmptyLines.slice(startIndex);
  if (dataLines.length === 0) {
    throw new Error("File contains fewer than two valid samples.");
  }
  
  for (let i = 0; i < dataLines.length; i++) {
    const lineNum = startIndex + i + 1;
    const parts = dataLines[i].split(delimiter).map(p => p.trim());
    
    // Remove trailing empty elements
    while (parts.length > 3 && parts[parts.length - 1] === "") {
      parts.pop();
    }
    
    if (parts.length !== 3) {
      throw new Error(`Uneven column count at line ${lineNum}: expected 3 columns, found ${parts.length}.`);
    }
    
    if (parts[0] === "" || parts[1] === "" || parts[2] === "") {
      throw new Error(`Missing value at line ${lineNum}.`);
    }
    
    const f1 = parseFloat(parts[0]);
    const f2 = parseFloat(parts[1]);
    
    if (isNaN(f1) || !isFinite(f1)) {
      throw new Error(`Non-numeric feature value "${parts[0]}" at line ${lineNum}, column 1.`);
    }
    if (isNaN(f2) || !isFinite(f2)) {
      throw new Error(`Non-numeric feature value "${parts[1]}" at line ${lineNum}, column 2.`);
    }
    
    const labelVal = parseFloat(parts[2]);
    if (isNaN(labelVal) || (labelVal !== 0 && labelVal !== 1)) {
      throw new Error(`Invalid class label "${parts[2]}" at line ${lineNum}. Class label must be 0 or 1.`);
    }
    
    rows.push([f1, f2, labelVal]);
  }
  
  if (rows.length < 2) {
    throw new Error("File contains fewer than two valid samples.");
  }
  
  return rows;
}

function normalizeDataset(pts) {
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  pts.forEach((p) => {
    minX = Math.min(minX, p[0]);
    maxX = Math.max(maxX, p[0]);
    minY = Math.min(minY, p[1]);
    maxY = Math.max(maxY, p[1]);
  });
  const rx = maxX - minX || 1;
  const ry = maxY - minY || 1;
  
  return pts.map((p) => [
    ((p[0] - minX) / rx) * 2 - 1,
    ((p[1] - minY) / ry) * 2 - 1,
    p[2],
  ]);
}

function showCSVError(message) {
  $("csvErrorMessage").textContent = message;
  $("csvErrorContainer").style.display = "flex";
  $("csvSuccessContainer").style.display = "none";
}

function showCSVSuccess(message) {
  $("csvSuccessMessage").textContent = message;
  $("csvSuccessContainer").style.display = "flex";
  $("csvErrorContainer").style.display = "none";
}

function updateControlDisabling() {
  const isCustom = (state.dataset === "custom");
  $("noiseSlider").disabled = isCustom;
  $("pointsSlider").disabled = isCustom;
  $("btnRegenData").disabled = isCustom;
  
  const noiseRow = $("noiseSlider").closest(".form-row");
  const pointsRow = $("pointsSlider").closest(".form-row");
  
  if (isCustom) {
    noiseRow.classList.add("disabled-row");
    pointsRow.classList.add("disabled-row");
    $("btnRegenData").classList.add("disabled-btn");
  } else {
    noiseRow.classList.remove("disabled-row");
    pointsRow.classList.remove("disabled-row");
    $("btnRegenData").classList.remove("disabled-btn");
  }
}

// ── APP STATE ────────────────────────────────────────────────
const state = {
  dataset: "circle",
  noise: 15,
  numPoints: 200,
  hiddenLayers: [6, 4],
  learningRate: 0.01,
  activationName: "relu",
  batchSize: 16,
  speed: 50,
  training: false,
  epoch: 0,
  lossHistory: [],
  data: [],
  customData: [], // parsed & normalized custom dataset
  net: null,
  animId: null,
  showData: true,
  showWeights: true,
};

// ── DOM REFS ─────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);
const boundaryCanvas = $("boundaryCanvas");
const networkCanvas = $("networkCanvas");
const lossCanvas = $("lossCanvas");
const bCtx = boundaryCanvas.getContext("2d");
const nCtx = networkCanvas.getContext("2d");
const lCtx = lossCanvas.getContext("2d");

// ── INITIALIZATION ───────────────────────────────────────────
function initNetwork() {
  const layers = [2, ...state.hiddenLayers, 1];
  state.net = new NeuralNetwork(
    layers,
    state.activationName,
    state.learningRate,
  );
  state.epoch = 0;
  state.lossHistory = [];
  updateStats(0, "—", "—");
}

function initData() {
  if (state.dataset === "custom") {
    state.data = state.customData.map((p) => [...p]);
  } else {
    state.data = generateDataset(state.dataset, state.numPoints, state.noise);
  }
}

function updateStats(epoch, loss, acc) {
  $("epochCount").textContent = epoch;
  $("lossValue").textContent =
    typeof loss === "number" ? loss.toFixed(4) : loss;
  $("accuracyValue").textContent =
    typeof acc === "number" ? (acc * 100).toFixed(1) + "%" : acc;
}

// ── RENDERING: DECISION BOUNDARY ─────────────────────────────
function drawBoundary() {
  const c = boundaryCanvas,
    ctx = bCtx;
  const w = c.width,
    h = c.height;
  const res = 3; // pixel step for perf
  const imgData = ctx.createImageData(w, h);

  for (let py = 0; py < h; py += res) {
    for (let px = 0; px < w; px += res) {
      const x = (px / w) * 2 - 1;
      const y = (py / h) * 2 - 1;
      const pred = state.net ? state.net.predict([x, y]) : 0.5;

      // Color: blue (class 0) to red (class 1)
      const r = Math.floor(30 + pred * 180);
      const g = Math.floor(40 + (1 - Math.abs(pred - 0.5) * 2) * 30);
      const b = Math.floor(30 + (1 - pred) * 180);
      const a = 180;

      for (let dy = 0; dy < res && py + dy < h; dy++) {
        for (let dx = 0; dx < res && px + dx < w; dx++) {
          const idx = ((py + dy) * w + (px + dx)) * 4;
          imgData.data[idx] = r;
          imgData.data[idx + 1] = g;
          imgData.data[idx + 2] = b;
          imgData.data[idx + 3] = a;
        }
      }
    }
  }
  ctx.putImageData(imgData, 0, 0);

  // Draw decision boundary contour (pred ≈ 0.5)
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 1;

  // Draw data points
  if (state.showData && state.data.length) {
    state.data.forEach(([x, y, label]) => {
      const px = ((x + 1) / 2) * w;
      const py = ((y + 1) / 2) * h;
      ctx.beginPath();
      ctx.arc(px, py, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = label === 1 ? "#ef5350" : "#4fc3f7";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  }
}

// ── RENDERING: NETWORK GRAPH ─────────────────────────────────
function drawNetwork() {
  const c = networkCanvas,
    ctx = nCtx;
  const w = c.width,
    h = c.height;
  ctx.clearRect(0, 0, w, h);

  if (!state.net) return;
  const layers = state.net.layers;
  const numLayers = layers.length;
  const padX = 60,
    padY = 30;
  const layerSpacing = (w - padX * 2) / (numLayers - 1);

  // Compute neuron positions
  const positions = [];
  for (let l = 0; l < numLayers; l++) {
    const n = layers[l];
    const x = padX + l * layerSpacing;
    const neuronSpacing = Math.min(40, (h - padY * 2) / (n + 1));
    const startY = h / 2 - ((n - 1) * neuronSpacing) / 2;
    const layerPos = [];
    for (let i = 0; i < n; i++) {
      layerPos.push({ x, y: startY + i * neuronSpacing });
    }
    positions.push(layerPos);
  }

  // Draw connections
  if (state.showWeights) {
    for (let l = 0; l < state.net.weights.length; l++) {
      const wt = state.net.weights[l];
      for (let j = 0; j < wt.length; j++) {
        for (let k = 0; k < wt[j].length; k++) {
          const v = wt[j][k];
          const absV = Math.min(Math.abs(v), 3) / 3;
          const from = positions[l][k];
          const to = positions[l + 1][j];
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);
          ctx.strokeStyle =
            v > 0
              ? `rgba(79,195,247,${0.1 + absV * 0.7})`
              : `rgba(239,83,80,${0.1 + absV * 0.7})`;
          ctx.lineWidth = 0.5 + absV * 2.5;
          ctx.stroke();
        }
      }
    }
  }

  // Draw neurons
  const labels = [
    "Input",
    ...state.hiddenLayers.map((_, i) => `Hidden ${i + 1}`),
    "Output",
  ];
  for (let l = 0; l < numLayers; l++) {
    // Layer label
    ctx.fillStyle = "rgba(139,157,195,0.7)";
    ctx.font = "500 10px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(labels[l], positions[l][0].x, padY - 10);

    for (let i = 0; i < layers[l]; i++) {
      const { x, y } = positions[l][i];
      // Glow
      const grad = ctx.createRadialGradient(x, y, 0, x, y, 16);
      grad.addColorStop(0, "rgba(79,195,247,0.15)");
      grad.addColorStop(1, "rgba(79,195,247,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(x - 16, y - 16, 32, 32);

      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fillStyle =
        l === 0 ? "#1a3a5c" : l === numLayers - 1 ? "#3a1a2c" : "#1a2a3c";
      ctx.fill();
      ctx.strokeStyle =
        l === 0 ? "#4fc3f7" : l === numLayers - 1 ? "#ef5350" : "#7c4dff";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}

// ── RENDERING: LOSS CHART ────────────────────────────────────
function drawLossChart() {
  const c = lossCanvas,
    ctx = lCtx;
  const w = c.width,
    h = c.height;
  ctx.clearRect(0, 0, w, h);

  const hist = state.lossHistory;
  if (hist.length < 2) {
    ctx.fillStyle = "rgba(139,157,195,0.3)";
    ctx.font = "12px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Training loss will appear here...", w / 2, h / 2);
    return;
  }

  const pad = { top: 15, right: 20, bottom: 25, left: 50 };
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;
  const maxLoss = Math.max(...hist, 0.01);
  const minLoss = 0;

  // Grid lines
  ctx.strokeStyle = "rgba(42,53,80,0.5)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (plotH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(w - pad.right, y);
    ctx.stroke();
    ctx.fillStyle = "rgba(139,157,195,0.5)";
    ctx.font = "10px JetBrains Mono, monospace";
    ctx.textAlign = "right";
    ctx.fillText((maxLoss - (maxLoss / 4) * i).toFixed(3), pad.left - 6, y + 3);
  }

  // Loss curve
  const gradient = ctx.createLinearGradient(
    pad.left,
    pad.top,
    pad.left,
    pad.top + plotH,
  );
  gradient.addColorStop(0, "rgba(255,183,77,0.3)");
  gradient.addColorStop(1, "rgba(255,183,77,0)");

  // Fill area
  ctx.beginPath();
  ctx.moveTo(pad.left, pad.top + plotH);
  for (let i = 0; i < hist.length; i++) {
    const x = pad.left + (i / (hist.length - 1)) * plotW;
    const y = pad.top + (1 - (hist[i] - minLoss) / (maxLoss - minLoss)) * plotH;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(pad.left + plotW, pad.top + plotH);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  // Line
  ctx.beginPath();
  for (let i = 0; i < hist.length; i++) {
    const x = pad.left + (i / (hist.length - 1)) * plotW;
    const y = pad.top + (1 - (hist[i] - minLoss) / (maxLoss - minLoss)) * plotH;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.strokeStyle = "#ffb74d";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Epoch label
  ctx.fillStyle = "rgba(139,157,195,0.5)";
  ctx.font = "10px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Epoch", w / 2, h - 4);
}

// ── RENDER ALL ───────────────────────────────────────────────
function renderAll() {
  drawBoundary();
  drawNetwork();
  drawLossChart();
}

// ── TRAINING LOOP ────────────────────────────────────────────
function trainStep() {
  if (!state.training || !state.net) return;

  const inputs = state.data.map((d) => [d[0], d[1]]);
  const targets = state.data.map((d) => d[2]);

  for (let s = 0; s < state.speed; s++) {
    const { loss, accuracy } = state.net.train(
      inputs,
      targets,
      state.batchSize,
    );
    state.epoch++;
    // Record every few epochs to avoid huge arrays
    if (
      state.epoch % Math.max(1, Math.floor(state.speed / 5)) === 0 ||
      state.lossHistory.length === 0
    ) {
      state.lossHistory.push(loss);
      if (state.lossHistory.length > 500) state.lossHistory.shift();
    }
    updateStats(state.epoch, loss, accuracy);
  }

  renderAll();
  state.animId = requestAnimationFrame(trainStep);
}

function startTraining() {
  if (state.training) return;
  if (!state.net) initNetwork();
  state.training = true;
  $("btnTrain").disabled = true;
  $("btnPause").disabled = false;
  document.body.classList.add("training-active");
  trainStep();
}

function pauseTraining() {
  state.training = false;
  if (state.animId) cancelAnimationFrame(state.animId);
  $("btnTrain").disabled = false;
  $("btnPause").disabled = true;
  $("btnTrain").innerHTML = '<i class="fas fa-play"></i> Resume';
  document.body.classList.remove("training-active");
}

function resetAll() {
  pauseTraining();
  $("btnTrain").innerHTML = '<i class="fas fa-play"></i> Train';
  initNetwork();
  renderAll();
}

// ── LAYER UI ─────────────────────────────────────────────────
function renderLayerUI() {
  const container = $("layerNeurons");
  container.innerHTML = "";
  state.hiddenLayers.forEach((n, i) => {
    const row = document.createElement("div");
    row.className = "layer-row";
    row.innerHTML = `
      <span class="layer-label">Layer ${i + 1}</span>
      <input type="range" min="1" max="12" value="${n}" data-layer="${i}">
      <span class="neuron-count">${n}</span>
    `;
    row.querySelector("input").addEventListener("input", (e) => {
      const val = parseInt(e.target.value);
      state.hiddenLayers[i] = val;
      row.querySelector(".neuron-count").textContent = val;
      resetAll();
    });
    container.appendChild(row);
  });
}

// ── EVENT LISTENERS ──────────────────────────────────────────
function setupEvents() {
  $("btnTrain").addEventListener("click", startTraining);
  $("btnPause").addEventListener("click", pauseTraining);
  $("btnReset").addEventListener("click", resetAll);

  // Speed
  $("speedSlider").addEventListener("input", (e) => {
    state.speed = parseInt(e.target.value);
    $("speedLabel").textContent = state.speed + " steps/frame";
  });

  // Dataset
  document.querySelectorAll(".dataset-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetDataset = btn.dataset.dataset;
      
      if (targetDataset === "custom") {
        if (!state.customData || state.customData.length === 0) {
          $("csvFileInput").click();
          return;
        } else if (state.dataset === "custom") {
          $("csvFileInput").click();
          return;
        }
      }
      
      document
        .querySelectorAll(".dataset-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      state.dataset = targetDataset;
      initData();
      updateControlDisabling();
      resetAll();
    });
  });

  // CSV File Upload
  $("csvFileInput").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    $("csvErrorContainer").style.display = "none";
    $("csvSuccessContainer").style.display = "none";

    if (!file.name.toLowerCase().endsWith(".csv")) {
      showCSVError("Unsupported file type. Please upload a .csv file.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target.result;
        const parsedRows = parseAndValidateCSV(text);
        const normalizedRows = normalizeDataset(parsedRows);

        state.customData = normalizedRows;
        state.dataset = "custom";

        document.querySelectorAll(".dataset-btn").forEach((btn) => {
          if (btn.dataset.dataset === "custom") {
            btn.classList.add("active");
            const label = btn.querySelector("span");
            if (label) {
              const displayName = file.name.length > 12 ? file.name.slice(0, 9) + "..." : file.name;
              label.textContent = displayName;
            }
          } else {
            btn.classList.remove("active");
          }
        });

        showCSVSuccess(`Loaded: ${file.name} (${parsedRows.length} points)`);
        initData();
        updateControlDisabling();
        resetAll();
      } catch (err) {
        showCSVError(err.message);
      }
      e.target.value = "";
    };
    reader.onerror = () => {
      showCSVError("Failed to read the file.");
      e.target.value = "";
    };
    reader.readAsText(file);
  });

  // Noise & Points
  $("noiseSlider").addEventListener("input", (e) => {
    state.noise = parseInt(e.target.value);
    $("noiseLabel").textContent = state.noise + "%";
  });
  $("pointsSlider").addEventListener("input", (e) => {
    state.numPoints = parseInt(e.target.value);
    $("pointsLabel").textContent = state.numPoints;
  });
  $("btnRegenData").addEventListener("click", () => {
    initData();
    resetAll();
  });

  // Layers
  $("btnAddLayer").addEventListener("click", () => {
    if (state.hiddenLayers.length < 6) {
      state.hiddenLayers.push(4);
      renderLayerUI();
      resetAll();
    }
  });
  $("btnRemoveLayer").addEventListener("click", () => {
    if (state.hiddenLayers.length > 1) {
      state.hiddenLayers.pop();
      renderLayerUI();
      resetAll();
    }
  });

  // Hyperparameters
  $("learningRate").addEventListener("change", (e) => {
    state.learningRate = parseFloat(e.target.value);
    if (state.net) state.net.lr = state.learningRate;
  });
  $("activation").addEventListener("change", (e) => {
    state.activationName = e.target.value;
    resetAll();
  });
  $("batchSize").addEventListener("change", (e) => {
    state.batchSize = parseInt(e.target.value);
  });

  // Toggles
  $("showDataToggle").addEventListener("change", (e) => {
    state.showData = e.target.checked;
    renderAll();
  });
  $("showWeightsToggle").addEventListener("change", (e) => {
    state.showWeights = e.target.checked;
    renderAll();
  });

  // Responsive canvas resize
  function resizeCanvases() {
    [boundaryCanvas, networkCanvas, lossCanvas].forEach((c) => {
      const rect = c.parentElement.getBoundingClientRect();
      if (c === lossCanvas) {
        c.width = Math.floor(rect.width - 20);
        c.height = Math.floor(Math.min(rect.height - 10, 180));
      } else {
        const size = Math.floor(Math.min(rect.width - 20, rect.height - 10));
        c.width = c === networkCanvas ? Math.floor(rect.width - 20) : size;
        c.height = size;
      }
    });
    renderAll();
  }
  window.addEventListener("resize", resizeCanvases);
  setTimeout(resizeCanvases, 100);
}

// ── EXPORT MODEL ─────────────────────────────────────────────
function triggerDownload(content, filename) {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportModelJS() {
  if (!state.net) {
    alert("No active model to export.");
    return;
  }
  const jsCode = `// Exported Neural Network Model
// Architecture: ${state.net.layers.join(" -> ")}
// Activation: ${state.net.activationName}

const model = {
  layers: ${JSON.stringify(state.net.layers)},
  activation: "${state.net.activationName}",
  weights: ${JSON.stringify(state.net.weights)},
  biases: ${JSON.stringify(state.net.biases)}
};

function predict(input) {
  let a = input.slice();
  for (let l = 0; l < model.weights.length; l++) {
    const w = model.weights[l];
    const b = model.biases[l];
    const isLast = (l === model.weights.length - 1);
    let nextA = [];
    
    for (let j = 0; j < w.length; j++) {
      let sum = b[j];
      for (let k = 0; k < a.length; k++) {
        sum += w[j][k] * a[k];
      }
      
      // Output layer always uses Sigmoid
      if (isLast) {
        let clamped = Math.max(-500, Math.min(500, sum));
        nextA.push(1 / (1 + Math.exp(-clamped)));
      } else {
        if (model.activation === "relu") {
          nextA.push(Math.max(0, sum));
        } else if (model.activation === "sigmoid") {
          let clamped = Math.max(-500, Math.min(500, sum));
          nextA.push(1 / (1 + Math.exp(-clamped)));
        } else if (model.activation === "tanh") {
          nextA.push(Math.tanh(sum));
        } else if (model.activation === "leaky_relu") {
          nextA.push(sum > 0 ? sum : 0.01 * sum);
        }
      }
    }
    a = nextA;
  }
  return a;
}

// Example Prediction
const prediction = predict([0.25, -0.4]);
console.log("Prediction output:", prediction);
`;
  triggerDownload(jsCode, "model.js");
}

function exportModelPython() {
  if (!state.net) {
    alert("No active model to export.");
    return;
  }
  const pyCode = `# Exported Neural Network Model
# Architecture: ${state.net.layers.join(" -> ")}
# Activation: ${state.net.activationName}
import math

model = {
    "layers": ${JSON.stringify(state.net.layers)},
    "activation": "${state.net.activationName}",
    "weights": ${JSON.stringify(state.net.weights)},
    "biases": ${JSON.stringify(state.net.biases)}
}

def predict(input_data):
    a = list(input_data)
    for l in range(len(model["weights"])):
        w = model["weights"][l]
        b = model["biases"][l]
        is_last = (l == len(model["weights"]) - 1)
        next_a = []
        
        for j in range(len(w)):
            s = b[j]
            for k in range(len(a)):
                s += w[j][k] * a[k]
                
            if is_last:
                clamped = max(-500, min(500, s))
                next_a.append(1 / (1 + math.exp(-clamped)))
            else:
                act = model["activation"]
                if act == "relu":
                    next_a.append(max(0, s))
                elif act == "sigmoid":
                    clamped = max(-500, min(500, s))
                    next_a.append(1 / (1 + math.exp(-clamped)))
                elif act == "tanh":
                    next_a.append(math.tanh(s))
                elif act == "leaky_relu":
                    next_a.append(s if s > 0 else 0.01 * s)
        a = next_a
    return a

# Example Prediction
prediction = predict([0.25, -0.4])
print("Prediction output:", prediction)
`;
  triggerDownload(pyCode, "model.py");
}

// ── BOOT ─────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  initData();
  initNetwork();
  renderLayerUI();
  setupEvents();
  updateControlDisabling();
  renderAll();
  
  // Bind Export Buttons
  const btnExportJS = document.getElementById("btnExportJS");
  const btnExportPy = document.getElementById("btnExportPy");
  if (btnExportJS) btnExportJS.addEventListener("click", exportModelJS);
  if (btnExportPy) btnExportPy.addEventListener("click", exportModelPython);
});
