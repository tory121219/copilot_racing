// src/scenes/gameOver.js

export function showGameOver(score) {
    const gameOverScreen = document.createElement('div');
    gameOverScreen.className = 'game-over';
    gameOverScreen.innerHTML = `
        <h1>Game Over</h1>
        <p>Your Score: ${score}</p>
        <button id="restart">Restart</button>
        <button id="exit">Exit</button>
    `;

    document.body.appendChild(gameOverScreen);

    document.getElementById('restart').addEventListener('click', () => {
        // Logic to restart the game
        location.reload();
    });

    document.getElementById('exit').addEventListener('click', () => {
        // Logic to exit the game
        window.close();
    });
}