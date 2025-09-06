class TicTacToeGame {
    constructor() {
        this.gameState = {
            board: ['', '', '', '', '', '', '', '', ''],
            currentPlayer: 'X',
            gameOver: false,
            winner: null,
            moveCount: 0
        };
        
        this.scores = {
            player: 0,
            ai: 0
        };
        
        this.initializeElements();
        this.attachEventListeners();
        this.loadGameState();
    }

    initializeElements() {
        this.gameBoard = document.getElementById('gameBoard');
        this.cells = document.querySelectorAll('.cell');
        this.gameStatus = document.getElementById('gameStatus');
        this.resetBtn = document.getElementById('resetBtn');
        this.hintBtn = document.getElementById('hintBtn');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.winOverlay = document.getElementById('winOverlay');
        this.playAgainBtn = document.getElementById('playAgainBtn');
        
        this.playerScore = document.getElementById('playerScore');
        this.aiScore = document.getElementById('aiScore');
        
        this.winIcon = document.getElementById('winIcon');
        this.winTitle = document.getElementById('winTitle');
        this.winMessage = document.getElementById('winMessage');
    }

    attachEventListeners() {
        // Cell click events
        this.cells.forEach((cell, index) => {
            cell.addEventListener('click', () => this.handleCellClick(index));
        });

        // Button events
        this.resetBtn.addEventListener('click', () => this.resetGame());
        this.hintBtn.addEventListener('click', () => this.getHint());
        this.playAgainBtn.addEventListener('click', () => this.resetGame());

        // Win overlay click to close
        this.winOverlay.addEventListener('click', (e) => {
            if (e.target === this.winOverlay) {
                this.hideWinOverlay();
            }
        });
    }

    async loadGameState() {
        try {
            const response = await fetch('/api/game');
            this.gameState = await response.json();
            this.updateDisplay();
        } catch (error) {
            console.error('Error loading game state:', error);
            this.showError('Failed to load game state');
        }
    }

    async handleCellClick(index) {
        if (this.gameState.gameOver || this.gameState.board[index] !== '') {
            return;
        }

        try {
            this.showLoading();
            
            const response = await fetch('/api/move', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ position: index })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error);
            }

            this.gameState = await response.json();
            this.updateDisplay();
            
            if (this.gameState.gameOver) {
                this.handleGameEnd();
            }
            
        } catch (error) {
            console.error('Error making move:', error);
            this.showError(error.message);
        } finally {
            this.hideLoading();
        }
    }

    updateDisplay() {
        // Update board
        this.cells.forEach((cell, index) => {
            const value = this.gameState.board[index];
            cell.textContent = value;
            cell.className = 'cell';
            
            if (value === 'X') {
                cell.classList.add('x');
            } else if (value === 'O') {
                cell.classList.add('o');
            }
            
            if (this.gameState.gameOver && value !== '') {
                cell.classList.add('disabled');
            }
        });

        // Update status message
        this.updateStatusMessage();
    }

    updateStatusMessage() {
        const statusElement = this.gameStatus.querySelector('.status-message');
        
        if (this.gameState.gameOver) {
            if (this.gameState.winner === 'X') {
                statusElement.innerHTML = '<span>You Win!</span>';
                statusElement.style.background = 'linear-gradient(45deg, #ffd700, #ffed4e)';
                statusElement.style.color = '#333';
            } else if (this.gameState.winner === 'O') {
                statusElement.innerHTML = '<span>AI Wins!</span>';
                statusElement.style.background = 'linear-gradient(45deg, #ff6b6b, #ff8e8e)';
                statusElement.style.color = 'white';
            } else {
                statusElement.innerHTML = '<span>Draw!</span>';
                statusElement.style.background = 'linear-gradient(45deg, #4ecdc4, #6dd5ed)';
                statusElement.style.color = 'white';
            }
        } else {
            statusElement.innerHTML = '<span>Your turn</span>';
            statusElement.style.background = 'rgba(0, 0, 0, 0.4)';
            statusElement.style.color = 'white';
        }
    }

    async handleGameEnd() {
        // Update scores
        if (this.gameState.winner === 'X') {
            this.scores.player++;
        } else if (this.gameState.winner === 'O') {
            this.scores.ai++;
        }
        
        this.updateScoreDisplay();
        
        // Show win overlay after a short delay
        setTimeout(() => {
            this.showWinOverlay();
        }, 1000);
    }

    updateScoreDisplay() {
        this.playerScore.textContent = this.scores.player;
        this.aiScore.textContent = this.scores.ai;
    }

    showWinOverlay() {
        if (this.gameState.winner === 'X') {
            this.winIcon.innerHTML = '<i class="fas fa-trophy" style="color: #ffd700;"></i>';
            this.winTitle.textContent = 'You Win!';
            this.winMessage.textContent = 'Amazing! You beat the AI!';
        } else if (this.gameState.winner === 'O') {
            this.winIcon.innerHTML = '<i class="fas fa-robot" style="color: #ff6b6b;"></i>';
            this.winTitle.textContent = 'AI Wins!';
            this.winMessage.textContent = 'AI played perfectly. Try again!';
        } else {
            this.winIcon.innerHTML = '<i class="fas fa-handshake" style="color: #4ecdc4;"></i>';
            this.winTitle.textContent = 'Draw!';
            this.winMessage.textContent = 'Great game! You achieved a draw!';
        }
        
        this.winOverlay.classList.add('show');
    }

    hideWinOverlay() {
        this.winOverlay.classList.remove('show');
    }

    async resetGame() {
        try {
            this.showLoading();
            
            const response = await fetch('/api/reset', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error('Failed to reset game');
            }

            this.gameState = await response.json();
            this.updateDisplay();
            this.hideWinOverlay();
            
        } catch (error) {
            console.error('Error resetting game:', error);
            this.showError('Failed to reset game');
        } finally {
            this.hideLoading();
        }
    }

    async getHint() {
        if (this.gameState.gameOver) {
            this.showError('Game is over! Start a new game.');
            return;
        }

        // Simple hint: find the best move for the player
        const bestMove = this.findBestMove([...this.gameState.board], 'X');
        
        if (bestMove !== -1) {
            this.cells[bestMove].style.background = 'rgba(255, 215, 0, 0.3)';
            this.cells[bestMove].style.border = '2px solid #ffd700';
            
            setTimeout(() => {
                this.cells[bestMove].style.background = '';
                this.cells[bestMove].style.border = '';
            }, 2000);
            
            this.showMessage('💡 Hint: Try the highlighted cell!');
        } else {
            this.showMessage('No hints available at this time.');
        }
    }

    findBestMove(board, player) {
        // Simple heuristic: try to win, then block, then take center, then corners, then edges
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6] // Diagonals
        ];

        // Try to win
        for (let pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (board[a] === player && board[b] === player && board[c] === '') return c;
            if (board[a] === player && board[c] === player && board[b] === '') return b;
            if (board[b] === player && board[c] === player && board[a] === '') return a;
        }

        // Try to block opponent
        const opponent = player === 'X' ? 'O' : 'X';
        for (let pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (board[a] === opponent && board[b] === opponent && board[c] === '') return c;
            if (board[a] === opponent && board[c] === opponent && board[b] === '') return b;
            if (board[b] === opponent && board[c] === opponent && board[a] === '') return a;
        }

        // Take center
        if (board[4] === '') return 4;

        // Take corners
        const corners = [0, 2, 6, 8];
        for (let corner of corners) {
            if (board[corner] === '') return corner;
        }

        // Take edges
        const edges = [1, 3, 5, 7];
        for (let edge of edges) {
            if (board[edge] === '') return edge;
        }

        return -1;
    }

    showLoading() {
        this.loadingOverlay.classList.add('show');
    }

    hideLoading() {
        this.loadingOverlay.classList.remove('show');
    }

    showError(message) {
        // Create a temporary error message
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff6b6b;
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
            z-index: 1002;
            animation: slideInRight 0.3s ease;
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);

        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    }

    showMessage(message) {
        // Create a temporary message
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4ecdc4;
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(78, 205, 196, 0.4);
            z-index: 1002;
            animation: slideInRight 0.3s ease;
        `;
        messageDiv.textContent = message;
        document.body.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }
}

// Add slide animation CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TicTacToeGame();
});

// Add some fun keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R') {
        document.getElementById('resetBtn').click();
    } else if (e.key === 'h' || e.key === 'H') {
        document.getElementById('hintBtn').click();
    } else if (e.key === 'Escape') {
        const winOverlay = document.getElementById('winOverlay');
        if (winOverlay.classList.contains('show')) {
            winOverlay.classList.remove('show');
        }
    }
});
