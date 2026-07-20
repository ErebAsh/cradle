// Shared 2048 rules live in this module so the game logic can be tested
// independently from the UI and reused in future enhancements.
(function (root, factory) {
  const api = factory();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  root.__2048Logic = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function createInitialState(size = 4, random = Math.random) {
    if (typeof size === 'function') {
      random = size;
      size = 4;
    }
    const board = Array.from({ length: size }, () => Array(size).fill(0));
    const state = {
      board,
      score: 0,
      bestScore: 0,
      won: false,
      over: false,
      moved: false,
      size: size
    };

    addRandomTile(state, random);
    addRandomTile(state, random);
    return state;
  }

  function addRandomTile(state, random = Math.random) {
    const emptyCells = [];
    state.board.forEach((row, rowIndex) => {
      row.forEach((value, columnIndex) => {
        if (value === 0) {
          emptyCells.push({ row: rowIndex, col: columnIndex });
        }
      });
    });

    if (!emptyCells.length) {
      return false;
    }

    const target = emptyCells[Math.floor(random() * emptyCells.length)];
    state.board[target.row][target.col] = random() < 0.9 ? 2 : 4;
    return true;
  }

  function cloneBoard(board) {
    return board.map((row) => [...row]);
  }

  function collapseLine(line, size = 4) {
    const compacted = line.filter((value) => value !== 0);
    const merged = [];
    let scoreGain = 0;

    for (let index = 0; index < compacted.length; index += 1) {
      const current = compacted[index];
      const next = compacted[index + 1];

      if (current === next) {
        const mergedValue = current * 2;
        merged.push(mergedValue);
        scoreGain += mergedValue;
        index += 1;
      } else {
        merged.push(current);
      }
    }

    while (merged.length < size) {
      merged.push(0);
    }

    return { line: merged, scoreGain };
  }

  function moveBoard(board, direction) {
    const rows = board.length;
    const cols = board[0].length;
    const nextBoard = Array.from({ length: rows }, () => Array(cols).fill(0));
    let scoreGain = 0;
    let moved = false;

    if (direction === 'left' || direction === 'right') {
      for (let row = 0; row < rows; row += 1) {
        const sourceLine = direction === 'left' ? board[row] : [...board[row]].reverse();
        const { line: mergedLine, scoreGain: lineScore } = collapseLine(sourceLine, cols);
        scoreGain += lineScore;
        const targetLine = direction === 'left' ? mergedLine : mergedLine.reverse();

        if (targetLine.join(',') !== board[row].join(',')) {
          moved = true;
        }

        nextBoard[row] = targetLine;
      }

      return { board: nextBoard, scoreGain, moved };
    }

    for (let col = 0; col < cols; col += 1) {
      const sourceLine = direction === 'up'
        ? board.map((currentRow) => currentRow[col])
        : board.map((currentRow) => currentRow[col]).reverse();
      const { line: mergedLine, scoreGain: lineScore } = collapseLine(sourceLine, rows);
      scoreGain += lineScore;
      const targetLine = direction === 'up' ? mergedLine : mergedLine.reverse();

      if (targetLine.join(',') !== board.map((currentRow) => currentRow[col]).join(',')) {
        moved = true;
      }

      targetLine.forEach((value, index) => {
        nextBoard[index][col] = value;
      });
    }

    return { board: nextBoard, scoreGain, moved };
  }

  function moveGameState(state, direction, random = Math.random) {
    const next = {
      board: cloneBoard(state.board),
      score: state.score,
      bestScore: state.bestScore,
      won: state.won,
      over: state.over,
      moved: false,
      size: state.size || state.board.length
    };

    const { board: movedBoard, scoreGain, moved } = moveBoard(next.board, direction);
    next.board = movedBoard;
    next.score += scoreGain;
    next.bestScore = Math.max(next.bestScore, next.score);
    next.moved = moved;

    if (moved) {
      addRandomTile(next, random);
    }

    next.won = hasWon(next.board);
    next.over = !canMove(next.board);
    return next;
  }

  function hasWon(board) {
    return board.some((row) => row.some((value) => value >= 2048));
  }

  function canMove(board) {
    for (let row = 0; row < board.length; row += 1) {
      for (let col = 0; col < board[row].length; col += 1) {
        const value = board[row][col];
        if (value === 0) {
          return true;
        }

        const right = board[row][col + 1];
        const down = board[row + 1]?.[col];

        if (right === value || down === value) {
          return true;
        }
      }
    }

    return false;
  }

  return {
    createInitialState,
    addRandomTile,
    moveGameState,
    hasWon,
    canMove
  };
}));
