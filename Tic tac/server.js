const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Game state
let gameState = {
    board: ['', '', '', '', '', '', '', '', ''],
    currentPlayer: 'X',
    gameOver: false,
    winner: null,
    moveCount: 0
};

// Minimax algorithm implementation
class MinimaxAI {
    constructor() {
        this.humanPlayer = 'X';
        this.aiPlayer = 'O';
    }

    // Check if there's a winner
    checkWinner(board) {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6] // Diagonals
        ];

        for (let pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return board[a];
            }
        }
        return null;
    }

    // Check if board is full
    isBoardFull(board) {
        return board.every(cell => cell !== '');
    }

    // Get available moves
    getAvailableMoves(board) {
        return board.map((cell, index) => cell === '' ? index : null).filter(val => val !== null);
    }

    // Minimax algorithm
    minimax(board, depth, isMaximizing) {
        const winner = this.checkWinner(board);
        
        if (winner === this.aiPlayer) {
            return 10 - depth; // Prefer faster wins
        }
        if (winner === this.humanPlayer) {
            return depth - 10; // Prefer slower losses
        }
        if (this.isBoardFull(board)) {
            return 0; // Draw
        }

        if (isMaximizing) {
            let bestScore = -Infinity;
            const availableMoves = this.getAvailableMoves(board);
            
            for (let move of availableMoves) {
                board[move] = this.aiPlayer;
                const score = this.minimax(board, depth + 1, false);
                board[move] = '';
                bestScore = Math.max(score, bestScore);
            }
            return bestScore;
        } else {
            let bestScore = Infinity;
            const availableMoves = this.getAvailableMoves(board);
            
            for (let move of availableMoves) {
                board[move] = this.humanPlayer;
                const score = this.minimax(board, depth + 1, true);
                board[move] = '';
                bestScore = Math.min(score, bestScore);
            }
            return bestScore;
        }
    }

    // Get best move for AI
    getBestMove(board) {
        let bestScore = -Infinity;
        let bestMove = -1;
        const availableMoves = this.getAvailableMoves(board);

        for (let move of availableMoves) {
            board[move] = this.aiPlayer;
            const score = this.minimax(board, 0, false);
            board[move] = '';
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        return bestMove;
    }
}

const ai = new MinimaxAI();

// API Routes
app.get('/api/game', (req, res) => {
    res.json(gameState);
});

app.post('/api/move', (req, res) => {
    const { position } = req.body;
    
    if (gameState.gameOver) {
        return res.status(400).json({ error: 'Game is over' });
    }
    
    if (gameState.board[position] !== '') {
        return res.status(400).json({ error: 'Invalid move' });
    }
    
    // Human move
    gameState.board[position] = gameState.currentPlayer;
    gameState.moveCount++;
    
    // Check for winner after human move
    const winner = ai.checkWinner(gameState.board);
    if (winner) {
        gameState.gameOver = true;
        gameState.winner = winner;
        return res.json(gameState);
    }
    
    if (gameState.moveCount >= 9) {
        gameState.gameOver = true;
        gameState.winner = 'draw';
        return res.json(gameState);
    }
    
    // AI move
    const aiMove = ai.getBestMove([...gameState.board]);
    gameState.board[aiMove] = 'O';
    gameState.moveCount++;
    
    // Check for winner after AI move
    const aiWinner = ai.checkWinner(gameState.board);
    if (aiWinner) {
        gameState.gameOver = true;
        gameState.winner = aiWinner;
    } else if (gameState.moveCount >= 9) {
        gameState.gameOver = true;
        gameState.winner = 'draw';
    }
    
    res.json(gameState);
});

app.post('/api/reset', (req, res) => {
    gameState = {
        board: ['', '', '', '', '', '', '', '', ''],
        currentPlayer: 'X',
        gameOver: false,
        winner: null,
        moveCount: 0
    };
    res.json(gameState);
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🎮 Tic Tac Toe server running on http://localhost:${PORT}`);
});
