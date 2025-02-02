class Car {
    constructor() {
        this.position = { x: 0, y: 0 };
        this.speed = 0;
        this.acceleration = 0.1;
        this.brakeForce = 0.2;
    }

    move(direction) {
        if (direction === 'left') {
            this.position.x -= this.speed;
        } else if (direction === 'right') {
            this.position.x += this.speed;
        }
    }

    accelerate() {
        this.speed += this.acceleration;
    }

    brake() {
        this.speed = Math.max(0, this.speed - this.brakeForce);
    }

    getPosition() {
        return this.position;
    }
}

export default Car;