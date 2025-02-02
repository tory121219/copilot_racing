export function applyGravity(object) {
    object.velocity.y += object.gravity;
}

export function calculateFriction(object, frictionCoefficient) {
    object.velocity.x *= (1 - frictionCoefficient);
    object.velocity.y *= (1 - frictionCoefficient);
}