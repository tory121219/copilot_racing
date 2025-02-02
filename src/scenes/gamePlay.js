export function startGame() {
    // Initialize game variables
    let isGameRunning = true;
    const car = new Car();
    const track = new Track();

    // Game loop
    function gameLoop() {
        if (!isGameRunning) return;

        // Update game state
        car.move();
        track.draw();

        // Check for collisions
        if (checkCollision(car, track)) {
            isGameRunning = false;
            showGameOver();
        }

        requestAnimationFrame(gameLoop);
    }

    // Start the game loop
    gameLoop();
}