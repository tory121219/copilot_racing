import { Car } from '../src/components/car';
import { Track } from '../src/components/track';
import { checkCollision } from '../src/components/collision';

describe('Car', () => {
    let car;

    beforeEach(() => {
        car = new Car();
    });

    test('should accelerate correctly', () => {
        car.accelerate();
        expect(car.speed).toBeGreaterThan(0);
    });

    test('should brake correctly', () => {
        car.accelerate();
        car.brake();
        expect(car.speed).toBe(0);
    });

    test('should move correctly', () => {
        car.move();
        expect(car.position).toBeDefined();
    });
});

describe('Track', () => {
    let track;

    beforeEach(() => {
        track = new Track();
    });

    test('should draw the track', () => {
        const drawResult = track.draw();
        expect(drawResult).toBeTruthy();
    });

    test('should check boundaries', () => {
        const isWithinBounds = track.checkBounds(car.position);
        expect(isWithinBounds).toBe(true);
    });
});

describe('Collision', () => {
    test('should detect collision', () => {
        const collisionDetected = checkCollision(car.position, track.boundaries);
        expect(collisionDetected).toBe(false);
    });
});