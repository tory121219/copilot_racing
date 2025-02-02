// src/components/collision.js

export function checkCollision(car, track) {
    // Check if the car is within the track boundaries
    if (car.x < track.leftBoundary || car.x > track.rightBoundary || 
        car.y < track.topBoundary || car.y > track.bottomBoundary) {
        return true; // Collision detected
    }
    return false; // No collision
}