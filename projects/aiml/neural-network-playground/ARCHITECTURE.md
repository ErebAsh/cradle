# Neural Network Playground Architecture Documentation

## Overview
The Neural Network Playground is an interactive visual Deep Learning simulation environment built with Vanilla HTML5 Canvas and ES6 Modular JavaScript. It visualizes forward inference, decision boundary contours, network weight topology, and training loss optimization curves in real time.

## Architectural Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                    User Control Dashboard                   │
│   Dataset / Learning Rate / Activation / Layer Configurator │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             Neural Network Engine (nnEngine.js)             │
│   • Forward Pass & He Initialization                        │
│   • Binary Cross-Entropy Loss                               │
│   • Stochastic Gradient Descent Backpropagation             │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   Canvas Rendering Engines                  │
│   • Decision Boundary Contour Canvas (2D grid interpolation) │
│   • Network Graph Canvas (Weighted connections & Nodes)     │
│   • Loss History Canvas (Chart trend line)                  │
└─────────────────────────────────────────────────────────────┘
```

## Layer Topology Configuration
- **Input Layer**: 2 features $(x_1, x_2)$ representing normalized coordinate points in range $[-1, 1]$.
- **Hidden Layers**: Dynamic array of hidden layers, customizable from 1 to 4 layers, each with 1 to 12 hidden units.
- **Output Layer**: 1 output unit representing binary classification probability $p \in [0, 1]$.

## Mathematical Formulations
1. **Activation Functions**:
   - `ReLU`: $f(x) = \max(0, x)$
   - `Sigmoid`: $f(x) = \frac{1}{1 + e^{-x}}$
   - `Tanh`: $f(x) = \tanh(x)$
   - `LeakyReLU`: $f(x) = \max(0.01x, x)$
2. **Loss Function**:
   Binary Cross-Entropy Loss:
   $$\mathcal{L} = -\frac{1}{N} \sum_{i=1}^N \left[ y_i \log(\hat{y}_i) + (1 - y_i) \log(1 - \hat{y}_i) \right]$$

## File Structure
```text
projects/aiml/neural-network-playground/
├── ARCHITECTURE.md    # Architecture documentation
├── index.html         # Workspace UI layout
├── nnEngine.js        # Mathematical primitives & network model
├── script.js          # Canvas rendering & interaction loop
└── style.css          # Styling & responsive design tokens
```
