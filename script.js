const dyn_canvas = document.getElementById("dynamic-canvas")
const static_canvas = document.getElementById("static-canvas")

const resizeCanvas = (_canvas) => {
    const _parent = _canvas.parentElement

    _canvas.width = _parent.clientWidth
    _canvas.height = _parent.clientHeight
}

resizeCanvas(dyn_canvas)
resizeCanvas(static_canvas)

window.addEventListener("resize", () => {
    resizeCanvas(dyn_canvas)
    resizeCanvas(static_canvas)

    draw_objects(GameObject.staticGameObjects, ctx_static)
})

const ctx_dyn = dyn_canvas.getContext("2d")
const ctx_static = static_canvas.getContext("2d")

const playerSprite = new Image()
playerSprite.src = "./Sprites/human.png"

class GameObject {
    static allGameObjects = []
    static dynamicGameObjects = []
    static staticGameObjects = []

    constructor({
        position =  {x: 0, y: 0},
        angle = 0,
        spriteAngle = 0,
        velocity = {x: 0, y: 0}, 
        mass = 1, 
        invMass = 1, 
        tag = null,
        restitution = 1, 
        color = "white",
        sprite = null,
        dynamic = true,
        OnCollision = null
    } = {}) {
        this.position = position;
        this.angle = angle;
        this.spriteAngle = spriteAngle;
        this.velocity = velocity;
        this.mass = mass;
        this.invMass = invMass;
        this.tag = tag;
        this.restitution = restitution;
        this.color = color;
        this.sprite = sprite;
        this.dynamic = dynamic;
        this.OnCollision = OnCollision

        GameObject.allGameObjects.push(this)
        if (dynamic) {
            GameObject.dynamicGameObjects.push(this)
        }
        else {
            this.mass = null
            this.invMass = 0
            GameObject.staticGameObjects.push(this)
        }
    }

    updateTransform() {}
}

class Polygon extends GameObject {
    constructor({localVertices = [], ...rest} = {}) {
        super(rest)
        this.localVertices = localVertices
        this.vertices = []
        this.updateTransform()
    }

    updateTransform() {
        this.vertices = []
        const cos = Math.cos(this.angle)
        const sin = Math.sin(this.angle)

        for (let p of this.localVertices) {
            this.vertices.push({
                x: this.position.x + (p.x * cos - p.y * sin),
                y: this.position.y + (p.x * sin - p.y * cos)
            })
        }
    }
}

class Circle extends GameObject {
    constructor({radius = 1, ...rest} = {}) {
        super(rest)
        this.radius = radius
        this.center = {x: this.position.x , y: this.position.y}
    }

    updateTransform() {
        this.center.x = this.position.x
        this.center.y = this.position.y
    }
}

class Capsule extends GameObject{
    constructor({length = 50, radius = 1, ...rest} = {}) {
        super(rest)
        this.length = length
        this.radius = radius
        this.p1 = {x: 0, y: 0}
        this.p2 = {x: 0, y: 0}
        this.updateTransform()
    }

    updateTransform() {
        const halfLen = this.length / 2
        const cos = Math.cos(this.angle)
        const sin = Math.sin(this.angle)

        this.p1 = {
            x: this.position.x + halfLen * sin,
            y: this.position.y - halfLen * cos
        }

        this.p2 = {
            x: this.position.x - halfLen * sin,
            y: this.position.y + halfLen * cos
        }
    }
}

let player = new Capsule({
    position: {x: 100, y: 350},
    length: 100,
    radius: 40,
    tag: "player",
    color: "black",
    sprite: playerSprite,
    OnCollision: (other, normal, depth) => {
        if (other.tag === "ground") {
            grounded = true
        }
        if (other === point) {
            player.angle = degToRad(90)
        }
    }
});

let point = new Circle({
    position: {x: 500, y: 200},
    radius: 10,
    tag: "point",
    color: "red"
})

let ground = new Polygon({
    position: {x: static_canvas.width / 2, y: static_canvas.height - 50},
    localVertices : [
        {x: -static_canvas.width / 2, y: -50},
        {x: static_canvas.width / 2, y: -50},
        {x: static_canvas.width / 2, y: 50},
        {x: -static_canvas.width / 2, y: 50}
    ],
    tag : "ground",
    color : "green",
    dynamic : false,
    restitution: 0,
})

const draw_objects = (objects, ctx) => {
    for (let obj of objects) {
        if (obj.sprite) {
            draw_capsule(obj, obj.color, ctx, true)
            continue
        }
        if (obj instanceof Capsule) {
            draw_capsule(obj, obj.color, ctx)
        }
        else if (obj instanceof Circle) {
            draw_circle(obj, obj.color, ctx)
        }
        else if (obj instanceof Polygon) {
            draw_polygon(obj.vertices, obj.color, ctx)
        }
    }
}

const draw_capsule = (capsule, color, ctx, hitbox = false) => {
    ctx.beginPath()

    const dx = capsule.p2.x - capsule.p1.x
    const dy = capsule.p2.y - capsule.p1.y
    const length = Math.sqrt(dx ** 2 + dy ** 2)

    if (length === 0) return

    const nx = (-dy / length) * capsule.radius
    const ny = (dx / length) * capsule.radius

    ctx.arc(capsule.p1.x, capsule.p1.y, capsule.radius, Math.atan2(-dy, -dx) - Math.PI/2, Math.atan2(-dy, -dx) + Math.PI/2, false)
    
    ctx.lineTo(capsule.p2.x - nx, capsule.p2.y - ny)

    ctx.arc(capsule.p2.x, capsule.p2.y, capsule.radius, Math.atan2(dy, dx) - Math.PI/2, Math.atan2(dy, dx) + Math.PI/2, false)

    ctx.lineTo(capsule.p1.x + nx, capsule.p1.y + ny)

    ctx.closePath()

    if (hitbox) {
        ctx.strokeStyle = color
        ctx.stroke()
    }
    else {
        ctx.fillStyle = color
        ctx.fill()
    }
}

const draw_polygon = (polygon, color, ctx) => {
    ctx.beginPath()

    ctx.moveTo(polygon[0].x, polygon[0].y)

    for (let i = 1; i < polygon.length; i++) {
        ctx.lineTo(polygon[i].x, polygon[i].y)
    }

    ctx.closePath()

    ctx.fillStyle = color
    ctx.fill()
}

const draw_circle = (circleObj, color, ctx) => {
    ctx.beginPath()
    
    ctx.arc(circleObj.center.x, circleObj.center.y, circleObj.radius, 0, Math.PI * 2)
    
    ctx.closePath()
    
    ctx.fillStyle = color
    ctx.fill()
}

const draw_sprite = (obj) => {
    if (!obj.sprite || !obj.sprite.complete) return;

    const center = getCenter(obj)
    let drawWidth = obj.sprite.width
    let drawHeight = obj.sprite.height

    let currentAngle = obj.angle + obj.spriteAngle

    ctx_dyn.save()

    ctx_dyn.translate(center.x, center.y)

    if (obj.angle !== 0) {
        ctx_dyn.rotate(obj.angle)
    }

    if (obj instanceof Capsule) {
        drawWidth = obj.radius * 2
        drawHeight = obj.length + (obj.radius * 2)
    }
    else if (obj instanceof Circle) {
        drawWidth = obj.radius * 2
        drawHeight = obj.radius * 2
    }
    else if (obj instanceof Polygon) {
        const aabb = getAABB(obj)
        drawWidth = aabb.maxX - aabb.minX
        drawHeight = aabb.maxY - aabb.minY
    }

    ctx_dyn.drawImage(
        obj.sprite,
        -drawWidth / 2,
        -drawHeight / 2,
        drawWidth,
        drawHeight
    )

    ctx_dyn.restore()
}

const dotProduct = (v1, v2) => v1.x * v2.x + v1.y * v2.y;
const degToRad = (degrees) => degrees * (Math.PI / 180)

const getAxes = (vertices) => {
    const axes = []
    for (let i = 0; i < vertices.length; i++) {
        const p1 = vertices[i]
        const p2 = vertices[(i + 1) % vertices.length]

        const edge = {x: p2.x - p1.x, y:  p2.y - p1.y}

        const length = Math.sqrt(edge.x ** 2 + edge.y ** 2)
        const normal = {x: -edge.y / length, y: edge.x / length}
        axes.push(normal)
    }

    return axes
}

const getCircleAxis = (circle, poly) => {
    let closestVertex = null
    let minDistanceSq = Infinity

    for (let p of poly.vertices) {
        const distSq = (p.x - circle.center.x)**2 + (p.y - circle.center.y)**2
        if (distSq < minDistanceSq) {
            minDistanceSq = distSq
            closestVertex = p
        }
    }

    const axis = {
        x: circle.center.x - closestVertex.x,
        y: circle.center.y - closestVertex.y
    }

    const length = Math.sqrt(axis.x**2 + axis.y**2)
    if (length === 0) return {x: 0, y: 1}

    return {x: axis.x / length, y: axis.y / length}
}

const projectShape = (shape, axis) => {
    if (shape instanceof Capsule) {
        const proj1 = dotProduct(shape.p1, axis)
        const proj2 = dotProduct(shape.p2, axis)

        let min = Math.min(proj1, proj2) - shape.radius
        let max = Math.max(proj1, proj2) + shape.radius

        return {min, max}
    }

    if (shape instanceof Circle) {
        const projection = dotProduct(shape.center, axis)
        return {
            min: projection - shape.radius,
            max: projection + shape.radius
        }
    }

    if (shape instanceof Polygon) {
        let min = dotProduct(shape.vertices[0], axis)
        let max = min

        for (let i = 1; i < shape.vertices.length; i++) {
            const projection = dotProduct(shape.vertices[i], axis)

            if (projection < min) min = projection
            if (projection > max) max = projection
        }

        return {min, max}
    }
}

const getCenter = (obj) => {
    return obj.position
}

const getAABB = (shape) => {
    if (shape instanceof Capsule) {
        return {
            minX: Math.min(shape.p1.x, shape.p2.x) - shape.radius,
            maxX: Math.max(shape.p1.x, shape.p2.x) + shape.radius,
            minY: Math.min(shape.p1.y, shape.p2.y) - shape.radius,
            maxY: Math.max(shape.p1.y, shape.p2.y) + shape.radius
        }
    }

    if (shape instanceof Circle) {
        return {
            minX: shape.center.x - shape.radius,
            maxX: shape.center.x + shape.radius,
            minY: shape.center.y - shape.radius,
            maxY: shape.center.y + shape.radius
        }
    }

    if (shape instanceof Polygon) {
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        for (let p of shape.vertices) {
            if (p.x < minX) minX = p.x
            if (p.x > maxX) maxX = p.x
            if (p.y < minY) minY = p.y
            if (p.y > maxY) maxY = p.y
        }

        return {minX, maxX, minY, maxY}
    }
}

const getCapsuleNormal = (capsule) => {
    const dx = capsule.p2.x - capsule.p1.x
    const dy = capsule.p2.y - capsule.p1.y
    const length = Math.sqrt(dx**2 + dy**2)

    return {x: -dy / length, y: dx / length}
}

const getCapsuleCircleAxis = (capsule, circle) => {
    const v = {x: capsule.p2.x - capsule.p1.x, y: capsule.p2.y - capsule.p1.y}
    const w = {x: circle.center.x - capsule.p1.x, y: circle.center.y - capsule.p1.y}

    vSq = v.x**2 + v.y**2

    let t = (w.x * v.x + w.y * v.y) / vSq
    t = Math.max(0, Math.min(1, t))

    const closestPoint = {
        x: capsule.p1.x + t * v.x,
        y: capsule.p1.y + t * v.y
    }

    const axis = {
        x: circle.center.x - closestPoint.x,
        y: circle.center.y - closestPoint.y
    }

    const length = Math.sqrt(axis.x**2 + axis.y**2)
    if (length === 0) return {x: 0, y: 1}

    return {x: axis.x / length, y: axis.y / length}
}

const check_collision = (objA, objB) => {
    const aabbA = getAABB(objA)
    const aabbB = getAABB(objB)

    if (aabbA.minX > aabbB.maxX || aabbA.maxX < aabbB.minX ||
        aabbA.minY > aabbB.maxY || aabbA.maxY < aabbB.minY ) {
        return false
    }

    if (objA instanceof Circle && objB instanceof Circle) {
        const dx = objA.center.x - objB.center.x
        const dy = objA.center.y - objB.center.y
        const distance = Math.sqrt(dx**2 + dy**2)
        const overlap = (objA.radius + objB.radius) - distance

        if (overlap < 0) return false

        let collisionNormal = {x: dx / distance, y: dy / distance}
        return {
            isColliding: true,
            normal: collisionNormal,
            depth: overlap
        }
    }

    const allAxes = []

    if (objA instanceof Polygon) allAxes.push(...getAxes(objA.vertices))
    else if (objA.radius && !objA.p1 && objB.vertices) allAxes.push(getCircleAxis(objA, objB))

    if (objB instanceof Polygon) allAxes.push(...getAxes(objB.vertices))
    else if (objB.radius && !objB.p1 && objA.vertices) allAxes.push(getCircleAxis(objB, objA))

    if (objA instanceof Capsule) {
        allAxes.push(getCapsuleNormal(objA))
        if (objB instanceof Polygon) {
            allAxes.push(getCircleAxis({center: {x: objA.p1.x, y: objA.p1.y}}, objB))
            allAxes.push(getCircleAxis({center: {x: objA.p2.x, y: objA.p2.y}}, objB))
        } else if (objB instanceof Circle) {
            allAxes.push(getCapsuleCircleAxis(objA, objB))
        }
    }

    if (objB instanceof Capsule) {
        allAxes.push(getCapsuleNormal(objB))
        if (objA instanceof Polygon) {
            allAxes.push(getCircleAxis({center: {x: objB.p1.x, y: objB.p1.y}}, objA))
            allAxes.push(getCircleAxis({center: {x: objB.p2.x, y: objB.p2.y}}, objA))
        } else if (objA instanceof Circle) {
            allAxes.push(getCapsuleCircleAxis(objB, objA))
        }
    }

    let minOverlap = Infinity
    let collisionNormal = null

    for ( let i = 0; i < allAxes.length; i++) {
        const axis = allAxes[i]
        const projA = projectShape(objA, axis)
        const projB = projectShape(objB, axis)

        let overlap = Math.min(projA.max, projB.max) - Math.max(projA.min, projB.min)

        if (overlap < 0) {
            return false
        }

        if (overlap < minOverlap) {
            minOverlap = overlap
            collisionNormal = axis
        }
    }

    const centerA = getCenter(objA)
    const centerB = getCenter(objB)

    const dir = {
        x: centerB.x - centerA.x,
        y: centerB.y - centerA.y
    }

    if (dotProduct(dir, collisionNormal) < 0) {
        collisionNormal.x *= -1
        collisionNormal.y *= -1
    }

    return {
        isColliding: true,
        normal: collisionNormal,
        depth: minOverlap
    }
}

const resolvePosition = (objA, objB, normal, depth) => {
    const totalInvMass = objA.invMass + objB.invMass
    if (totalInvMass === 0) return

    const pushFactorA = depth * (objA.invMass / totalInvMass)
    const pushFactorB = depth * (objB.invMass / totalInvMass)

    if (objA.invMass !== 0) {
        objA.position.x -= normal.x * pushFactorA
        objA.position.y -= normal.y * pushFactorA
        objA.updateTransform()
    }

    if (objB.invMass !== 0) {
        objB.position.x -= normal.x * pushFactorB
        objB.position.y -= normal.y * pushFactorB
        objB.updateTransform()
    }
}

const resolveVelocity = (objA, objB, normal) => {
    if(objA.invMass + objB.invMass === 0) return

    const relVelocity = {
        x: objB.velocity.x - objA.velocity.x,
        y: objB.velocity.y - objA.velocity.y
    }

    const velAlongNormal = dotProduct(relVelocity, normal)

    if (velAlongNormal > 0) return

    const restitution = objA.restitution * objB.restitution

    const j = -(1 + restitution) * velAlongNormal / (objA.invMass + objB.invMass)

    const impulseX = normal.x * j
    const impulseY = normal.y * j

    objA.velocity.x -= impulseX * objA.invMass
    objA.velocity.y -= impulseY * objA.invMass

    objB.velocity.x += impulseX * objB.invMass
    objB.velocity.y += impulseY * objB.invMass
}

const resolveCollision = (objA, objB, collisionData) => {
    resolvePosition(objA, objB, collisionData.normal, collisionData.depth)
    resolveVelocity(objA, objB, collisionData.normal)
}

const updatePhysics = (objects) => {
    grounded = false
    for (let i = 0; i < objects.length; i++) {
        for (let j = i + 1; j < objects.length; j++) {
            const objA = objects[i]
            const objB = objects[j]

            const collision = check_collision(objA, objB)

            if (collision && collision.isColliding) {
                resolveCollision(objA, objB, collision)

                if (typeof objA.OnCollision === "function") {
                objA.OnCollision(objB, collision.normal, collision.depth)
                }

                if (typeof objB.OnCollision === "function") {
                    const invertedNormal = {x: -collision.normal.x, y: -collision.normal.y}
                    objB.OnCollision(objA, invertedNormal, collision.depth)
                }
            }
        }
    }
}

const check_border_collision = (obj) => {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    if (obj instanceof Capsule) {
        minX = Math.min(obj.p1.x, obj.p2.x) - obj.radius;
        maxX = Math.max(obj.p1.x, obj.p2.x) + obj.radius;
        minY = Math.min(obj.p1.y, obj.p2.y) - obj.radius;
        maxY = Math.max(obj.p1.y, obj.p2.y) + obj.radius;
    }
    else if (obj instanceof Circle) {
        minX = obj.center.x - obj.radius
        maxX = obj.center.x + obj.radius
        minY = obj.center.y - obj.radius
        maxY = obj.center.y + obj.radius
    }
    else if (obj instanceof Polygon) {
        for (let p of obj.vertices) {
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
        }
    }

    

    if (minX < 0 && obj.velocity.x < 0) {
        obj.velocity.x = -obj.velocity.x;
    } else if (maxX > dyn_canvas.width && obj.velocity.x > 0) {
        obj.velocity.x = -obj.velocity.x;
    }

    if (minY < 0 && obj.velocity.y < 0) {
        obj.velocity.y = -obj.velocity.y;
    } else if (maxY > dyn_canvas.height && obj.velocity.y > 0) {
        obj.velocity.y = -obj.velocity.y;
    }
}

const updatePositions = (deltaTime) => {
    for (let obj of GameObject.dynamicGameObjects) {
        obj.position.x += obj.velocity.x * deltaTime
        obj.position.y += obj.velocity.y * deltaTime

        obj.updateTransform()
    }
}

const update_acceleration = (deltaTime) => {
    const acceleration = 1250
    const falling_acceleration = 2000
    const friction = 0.98

    if (keys.KeyA) player.velocity.x -= acceleration * deltaTime
    if (keys.KeyD) player.velocity.x += acceleration * deltaTime

    for (let obj of GameObject.dynamicGameObjects) {
        obj.velocity.x *= friction ** (deltaTime * 60)
        obj.velocity.y += falling_acceleration * deltaTime
    }

    if (jumpBufferTimer > 0) {
        jumpBufferTimer -= deltaTime
    }

    if (jumpBufferTimer > 0 && grounded) {
        jump()
        jumpBufferTimer = 0
    }
}

let grounded = false
let jumpBufferTimer = 0
const JUMP_BUFFER_TIME = 0.08

const jump = () => {
    player.velocity.y -= 1000
}

const update = (deltaTime) => {
    update_acceleration(deltaTime)
    updatePositions(deltaTime)
    updatePhysics(GameObject.allGameObjects)
}

let lastTime = 0

const clearCanvas = () => {
    ctx_dyn.clearRect(0, 0, dyn_canvas.width, dyn_canvas.height)
}

const keys = {
    KeyW: false,
    KeyA: false,
    KeyS: false,
    KeyD: false,
    Space: false
}

window.addEventListener("keydown", (e) => {
    if(keys.hasOwnProperty(e.code)) keys[e.code] = true
    if (e.code === "Space") {
        jumpBufferTimer = JUMP_BUFFER_TIME
    }
})

window.addEventListener("keyup", (e) => {
    if(keys.hasOwnProperty(e.code)) keys[e.code] = false
})

const gameLoop = (timestamp) => {
    if (lastTime === 0) {
        lastTime = timestamp
    }
    let deltaTime = (timestamp - lastTime) / 1000
    if (deltaTime > 0.1) {
        deltaTime = 0.016;
    }
    lastTime = timestamp

    update(deltaTime)

    clearCanvas()

    draw_objects(GameObject.dynamicGameObjects, ctx_dyn)
    draw_sprite(player)

    requestAnimationFrame(gameLoop)
}

draw_objects(GameObject.staticGameObjects, ctx_static)
console.log(GameObject.allGameObjects)
requestAnimationFrame(gameLoop)