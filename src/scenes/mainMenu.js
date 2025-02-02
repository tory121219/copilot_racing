// src/scenes/mainMenu.js

export function showMainMenu() {
    const menu = document.createElement('div');
    menu.id = 'main-menu';
    menu.innerHTML = `
        <h1>Welcome to the 2D Car Racing Game</h1>
        <button id="start-button">Start Game</button>
        <button id="exit-button">Exit</button>
    `;

    document.body.appendChild(menu);

    document.getElementById('start-button').addEventListener('click', () => {
        // Logic to start the game
        menu.remove();
        // Call startGame function from gamePlay.js
    });

    document.getElementById('exit-button').addEventListener('click', () => {
        // Logic to exit the game
        window.close();
    });
}