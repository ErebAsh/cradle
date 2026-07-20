/* ============================================================
   NEURAL NETWORK PLAYGROUND — UI & CANVAS CONTROLLER
   Integrates with nnEngine.js for matrix calculations
   ============================================================ */

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
  customData: [],
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
    state.learningRate
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
  const c = boundaryCanvas;
  const ctx = bCtx;
  const w = c.width;
  const h = c.height;
  const res = 3;
  const imgData = ctx.createImageData(w, h);

  for (let py = 0; py < h; py += res) {
    for (let px = 0; px < w; px += res) {
      const x = (px / w) * 2 - 1;
      const y = (py / h) * 2 - 1;
      const pred = state.net ? state.net.predict([x, y]) : 0.5;

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
  const c = networkCanvas;
  const ctx = nCtx;
  const w = c.width;
  const h = c.height;
  ctx.clearRect(0, 0, w, h);

  if (!state.net) return;
  const layers = state.net.layers;
  const numLayers = layers.length;
  const padX = 60;
  const padY = 30;
  const layerSpacing = (w - padX * 2) / (numLayers - 1);

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

  const labels = [
    "Input",
    ...state.hiddenLayers.map((_, i) => `Hidden ${i + 1}`),
    "Output",
  ];
  for (let l = 0; l < numLayers; l++) {
    ctx.fillStyle = "rgba(139,157,195,0.7)";
    ctx.font = "500 10px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(labels[l], positions[l][0].x, padY - 10);

    for (let i = 0; i < layers[l]; i++) {
      const { x, y } = positions[l][i];
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
  const c = lossCanvas;
  const ctx = lCtx;
  const w = c.width;
  const h = c.height;
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

  const gradient = ctx.createLinearGradient(
    pad.left,
    pad.top,
    pad.left,
    pad.top + plotH
  );
  gradient.addColorStop(0, "rgba(255,183,77,0.3)");
  gradient.addColorStop(1, "rgba(255,183,77,0)");

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

  ctx.beginPath();
  for (let i = 0; i < hist.length; i++) {
    const x = pad.left + (i / (hist.length - 1)) * plotW;
    const y = pad.top + (1 - (hist[i] - minLoss) / (maxLoss - minLoss)) * plotH;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.strokeStyle = "#ffb74d";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "rgba(139,157,195,0.5)";
  ctx.font = "10px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Epoch", w / 2, h - 4);
}

function renderAll() {
  drawBoundary();
  drawNetwork();
  drawLossChart();
}

function trainStep() {
  if (!state.training || !state.net) return;

  const inputs = state.data.map((d) => [d[0], d[1]]);
  const targets = state.data.map((d) => d[2]);

  for (let s = 0; s < state.speed; s++) {
    const { loss, accuracy } = state.net.train(
      inputs,
      targets,
      state.batchSize
    );
    state.epoch++;
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

function setupEvents() {
  $("btnTrain").addEventListener("click", startTraining);
  $("btnPause").addEventListener("click", pauseTraining);
  $("btnReset").addEventListener("click", resetAll);

  $("speedSlider").addEventListener("input", (e) => {
    state.speed = parseInt(e.target.value);
    $("speedLabel").textContent = state.speed + " steps/frame";
  });

  // Layer add/remove handlers
  $("btnAddLayer").addEventListener("click", () => {
    if (state.hiddenLayers.length < 4) {
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

  $("showDataToggle").addEventListener("change", (e) => {
    state.showData = e.target.checked;
    drawBoundary();
  });

  $("showWeightsToggle").addEventListener("change", (e) => {
    state.showWeights = e.target.checked;
    drawNetwork();
  });
}

// ── INITIALIZATION ───────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  renderLayerUI();
  initData();
  initNetwork();
  renderAll();
  setupEvents();
});
