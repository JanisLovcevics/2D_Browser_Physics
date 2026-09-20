import { dotProduct } from './Math.js';
import { GameObject, Polygon, Circle, Capsule } from './Classes.js';

export const getCenter = (obj) => obj.position;

export const getAABB = (shape) => {
    if (shape instanceof Capsule) {
        return {
            minX: Math.min(shape.p1.x, shape.p2.x) - shape.radius,
            maxX: Math.max(shape.p1.x, shape.p2.x) + shape.radius,
            minY: Math.min(shape.p1.y, shape.p2.y) - shape.radius,
            maxY: Math.max(shape.p1.y, shape.p2.y) + shape.radius
        };
    }

    if (shape instanceof Circle) {
        return {
            minX: shape.center.x - shape.radius,
            maxX: shape.center.x + shape.radius,
            minY: shape.center.y - shape.radius,
            maxY: shape.center.y + shape.radius
        };
    }

    if (shape instanceof Polygon) {
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        for (let p of shape.vertices) {
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
        }

        return {minX, maxX, minY, maxY};
    }
};

const getAxes = (vertices) => {
    const axes = [];
    for (let i = 0; i < vertices.length; i++) {
        const p1 = vertices[i];
        const p2 = vertices[(i + 1) % vertices.length];

        const edge = {x: p2.x - p1.x, y: p2.y - p1.y};
        const length = Math.sqrt(edge.x ** 2 + edge.y ** 2);
        axes.push({x: -edge.y / length, y: edge.x / length});
    }
    return axes;
};

const getCircleAxis = (circle, poly) => {
    let closestVertex = null;
    let minDistanceSq = Infinity;

    for (let p of poly.vertices) {
        const distSq = (p.x - circle.center.x)**2 + (p.y - circle.center.y)**2;
        if (distSq < minDistanceSq) {
            minDistanceSq = distSq;
            closestVertex = p;
        }
    }

    const axis = {
        x: circle.center.x - closestVertex.x,
        y: circle.center.y - closestVertex.y
    };

    const length = Math.sqrt(axis.x**2 + axis.y**2);
    if (length === 0) return {x: 0, y: 1};

    return {x: axis.x / length, y: axis.y / length};
};

const projectShape = (shape, axis) => {
    if (shape instanceof Capsule) {
        const proj1 = dotProduct(shape.p1, axis);
        const proj2 = dotProduct(shape.p2, axis);

        return {
            min: Math.min(proj1, proj2) - shape.radius,
            max: Math.max(proj1, proj2) + shape.radius
        };
    }

    if (shape instanceof Circle) {
        const projection = dotProduct(shape.center, axis);
        return {
            min: projection - shape.radius,
            max: projection + shape.radius
        };
    }

    if (shape instanceof Polygon) {
        let min = dotProduct(shape.vertices[0], axis);
        let max = min;

        for (let i = 1; i < shape.vertices.length; i++) {
            const projection = dotProduct(shape.vertices[i], axis);
            if (projection < min) min = projection;
            if (projection > max) max = projection;
        }

        return {min, max};
    }
};

const getCapsuleNormal = (capsule) => {
    const dx = capsule.p2.x - capsule.p1.x;
    const dy = capsule.p2.y - capsule.p1.y;
    const length = Math.sqrt(dx**2 + dy**2);

    return {x: -dy / length, y: dx / length};
};

const getCapsuleCircleAxis = (capsule, circle) => {
    const v = {x: capsule.p2.x - capsule.p1.x, y: capsule.p2.y - capsule.p1.y};
    const w = {x: circle.center.x - capsule.p1.x, y: circle.center.y - capsule.p1.y};

    const vSq = v.x**2 + v.y**2;
    let t = (w.x * v.x + w.y * v.y) / vSq;
    t = Math.max(0, Math.min(1, t));

    const closestPoint = {
        x: capsule.p1.x + t * v.x,
        y: capsule.p1.y + t * v.y
    };

    const axis = {
        x: circle.center.x - closestPoint.x,
        y: circle.center.y - closestPoint.y
    };

    const length = Math.sqrt(axis.x**2 + axis.y**2);
    if (length === 0) return {x: 0, y: 1};

    return {x: axis.x / length, y: axis.y / length};
};

export const check_collision = (objA, objB) => {
    if (objA.parent === objB || objB.parent === objA) return false;

    const aabbA = getAABB(objA);
    const aabbB = getAABB(objB);

    if (aabbA.minX > aabbB.maxX || aabbA.maxX < aabbB.minX ||
        aabbA.minY > aabbB.maxY || aabbA.maxY < aabbB.minY) {
        return false;
    }

    if (objA instanceof Circle && objB instanceof Circle) {
        const dx = objA.center.x - objB.center.x;
        const dy = objA.center.y - objB.center.y;
        const distance = Math.sqrt(dx**2 + dy**2);
        const overlap = (objA.radius + objB.radius) - distance;

        if (overlap < 0) return false;

        return {
            isColliding: true,
            normal: {x: dx / distance, y: dy / distance},
            depth: overlap
        };
    }

    const allAxes = [];

    if (objA instanceof Polygon) allAxes.push(...getAxes(objA.vertices));
    else if (objA.radius && !objA.p1 && objB.vertices) allAxes.push(getCircleAxis(objA, objB));

    if (objB instanceof Polygon) allAxes.push(...getAxes(objB.vertices));
    else if (objB.radius && !objB.p1 && objA.vertices) allAxes.push(getCircleAxis(objB, objA));

    if (objA instanceof Capsule) {
        allAxes.push(getCapsuleNormal(objA));
        if (objB instanceof Polygon) {
            allAxes.push(getCircleAxis({center: {x: objA.p1.x, y: objA.p1.y}}, objB));
            allAxes.push(getCircleAxis({center: {x: objA.p2.x, y: objA.p2.y}}, objB));
        } else if (objB instanceof Circle) {
            allAxes.push(getCapsuleCircleAxis(objA, objB));
        }
    }

    if (objB instanceof Capsule) {
        allAxes.push(getCapsuleNormal(objB));
        if (objA instanceof Polygon) {
            allAxes.push(getCircleAxis({center: {x: objB.p1.x, y: objB.p1.y}}, objA));
            allAxes.push(getCircleAxis({center: {x: objB.p2.x, y: objB.p2.y}}, objA));
        } else if (objA instanceof Circle) {
            allAxes.push(getCapsuleCircleAxis(objB, objA));
        }
    }

    let minOverlap = Infinity;
    let collisionNormal = null;

    for (let i = 0; i < allAxes.length; i++) {
        const axis = allAxes[i];
        const projA = projectShape(objA, axis);
        const projB = projectShape(objB, axis);

        let overlap = Math.min(projA.max, projB.max) - Math.max(projA.min, projB.min);

        if (overlap < 0) return false;

        if (overlap < minOverlap) {
            minOverlap = overlap;
            collisionNormal = axis;
        }
    }

    const centerA = getCenter(objA);
    const centerB = getCenter(objB);

    const dir = {
        x: centerB.x - centerA.x,
        y: centerB.y - centerA.y
    };

    if (dotProduct(dir, collisionNormal) < 0) {
        collisionNormal.x *= -1;
        collisionNormal.y *= -1;
    }

    return {
        isColliding: true,
        normal: collisionNormal,
        depth: minOverlap
    };
};

const resolvePosition = (objA, objB, normal, depth) => {
    const totalInvMass = objA.invMass + objB.invMass;
    if (totalInvMass === 0) return;

    const pushFactorA = depth * (objA.invMass / totalInvMass);
    const pushFactorB = depth * (objB.invMass / totalInvMass);

    if (objA.invMass !== 0) {
        objA.position.x -= normal.x * pushFactorA;
        objA.position.y -= normal.y * pushFactorA;
        objA.updateTransform();
    }

    if (objB.invMass !== 0) {
        objB.position.x += normal.x * pushFactorB;
        objB.position.y += normal.y * pushFactorB;
        objB.updateTransform();
    }
};

const resolveVelocity = (objA, objB, normal) => {
    if (objA.invMass + objB.invMass === 0) return;

    const relVelocity = {
        x: objB.velocity.x - objA.velocity.x,
        y: objB.velocity.y - objA.velocity.y
    };

    const velAlongNormal = dotProduct(relVelocity, normal);

    if (velAlongNormal > 0) return;

    const restitution = objA.restitution * objB.restitution;
    const j = -(1 + restitution) * velAlongNormal / (objA.invMass + objB.invMass);

    const impulseX = normal.x * j;
    const impulseY = normal.y * j;

    objA.velocity.x -= impulseX * objA.invMass;
    objA.velocity.y -= impulseY * objA.invMass;

    objB.velocity.x += impulseX * objB.invMass;
    objB.velocity.y += impulseY * objB.invMass;
};

const resolveCollision = (objA, objB, collisionData) => {
    resolvePosition(objA, objB, collisionData.normal, collisionData.depth);
    resolveVelocity(objA, objB, collisionData.normal);
};

export const updatePhysics = (objects, onGroundedCallback) => {
    if (onGroundedCallback) onGroundedCallback(false);

    for (let i = 0; i < objects.length; i++) {
        for (let j = i + 1; j < objects.length; j++) {
            const objA = objects[i];
            const objB = objects[j];

            const collision = check_collision(objA, objB);

            if (collision && collision.isColliding) {
                resolveCollision(objA, objB, collision);

                if (typeof objA.OnCollision === "function") {
                    objA.OnCollision(objB, collision.normal, collision.depth);
                }

                if (typeof objB.OnCollision === "function") {
                    const invertedNormal = {x: -collision.normal.x, y: -collision.normal.y};
                    objB.OnCollision(objA, invertedNormal, collision.depth);
                }
            }
        }
    }
};

export const check_border_collision = (obj, canvasWidth, canvasHeight) => {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    if (obj instanceof Capsule) {
        minX = Math.min(obj.p1.x, obj.p2.x) - obj.radius;
        maxX = Math.max(obj.p1.x, obj.p2.x) + obj.radius;
        minY = Math.min(obj.p1.y, obj.p2.y) - obj.radius;
        maxY = Math.max(obj.p1.y, obj.p2.y) + obj.radius;
    } else if (obj instanceof Circle) {
        minX = obj.center.x - obj.radius;
        maxX = obj.center.x + obj.radius;
        minY = obj.center.y - obj.radius;
        maxY = obj.center.y + obj.radius;
    } else if (obj instanceof Polygon) {
        for (let p of obj.vertices) {
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
        }
    }

    if (minX < 0 && obj.velocity.x < 0) {
        obj.velocity.x = -obj.velocity.x;
    } else if (maxX > canvasWidth && obj.velocity.x > 0) {
        obj.velocity.x = -obj.velocity.x;
    }

    if (minY < 0 && obj.velocity.y < 0) {
        obj.velocity.y = -obj.velocity.y;
    } else if (maxY > canvasHeight && obj.velocity.y > 0) {
        obj.velocity.y = -obj.velocity.y;
    }
};