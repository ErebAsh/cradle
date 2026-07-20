const test = require('node:test');
const assert = require('node:assert/strict');
const { determineWinner } = require('../projects/games/stone-paper-scissors-game/game-engine');

test('RPS classic rules evaluate correctly', () => {
    // Rock beats scissors
    assert.deepStrictEqual(determineWinner("rock", "scissors"), {
        outcome: "player",
        message: "Rock crushes Scissors! You win!"
    });
    
    // Paper loses to scissors
    assert.deepStrictEqual(determineWinner("paper", "scissors"), {
        outcome: "computer",
        message: "Scissors cuts Paper! Computer wins!"
    });

    // Rock ties with rock
    assert.deepStrictEqual(determineWinner("rock", "rock"), {
        outcome: "tie",
        message: "It's a tie!"
    });
});

test('RPS Lizard Spock rules evaluate correctly', () => {
    // Spock vaporizes Rock
    assert.deepStrictEqual(determineWinner("spock", "rock"), {
        outcome: "player",
        message: "Spock vaporizes Rock! You win!"
    });

    // Lizard poisons Spock
    assert.deepStrictEqual(determineWinner("lizard", "spock"), {
        outcome: "player",
        message: "Lizard poisons Spock! You win!"
    });

    // Spock loses to Paper
    assert.deepStrictEqual(determineWinner("spock", "paper"), {
        outcome: "computer",
        message: "Paper disproves Spock! Computer wins!"
    });
});
