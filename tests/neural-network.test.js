const test = require('node:test');
const assert = require('node:assert/strict');
const { Activations, generateDataset, normalizeDataset, NeuralNetwork } = require('../projects/aiml/neural-network-playground/nnEngine');

test('activations evaluate correctly and derivates match expected values', () => {
    assert.equal(Activations.relu.fn(5), 5);
    assert.equal(Activations.relu.fn(-3), 0);
    assert.equal(Activations.relu.deriv(5), 1);
    assert.equal(Activations.relu.deriv(-3), 0);

    assert.ok(Activations.sigmoid.fn(0) - 0.5 < 1e-5);
    assert.ok(Activations.sigmoid.deriv(0) - 0.25 < 1e-5);
});

test('dataset generator builds valid normalized 2D data points', () => {
    const data = generateDataset('circle', 50, 10);
    assert.equal(data.length, 50);
    data.forEach(p => {
        assert.equal(p.length, 3);
        assert.ok(p[0] >= -1.05 && p[0] <= 1.05);
        assert.ok(p[1] >= -1.05 && p[1] <= 1.05);
        assert.ok(p[2] === 0 || p[2] === 1);
    });
});

test('neural network forward pass initializes weights and produces probability in [0, 1]', () => {
    const net = new NeuralNetwork([2, 4, 4, 1], 'relu', 0.01);
    const result = net.forward([0.5, -0.2]);
    assert.equal(result.as.length, 4); // 4 layers
    const prob = net.predict([0.5, -0.2]);
    assert.ok(prob >= 0 && prob <= 1);
});

test('neural network reduces loss after training steps on XOR problem', () => {
    const net = new NeuralNetwork([2, 8, 4, 1], 'tanh', 0.1);
    const inputs = [
        [-1, -1],
        [-1,  1],
        [ 1, -1],
        [ 1,  1]
    ];
    const targets = [0, 1, 1, 0];

    const initialLoss = net.train(inputs, targets, 4).loss;
    let finalLoss = initialLoss;

    for (let epoch = 0; epoch < 100; epoch++) {
        finalLoss = net.train(inputs, targets, 4).loss;
    }

    assert.ok(finalLoss < initialLoss, `Final loss (${finalLoss}) should be smaller than initial loss (${initialLoss})`);
});
