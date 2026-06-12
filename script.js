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

    draw_objects(static_objects, ctx_static)
})

const ctx_dyn = dyn_canvas.getContext("2d")
const ctx_static = static_canvas.getContext("2d")

const playerSprite = new Image()
playerSprite.src = "https://cdn-icons-png.flaticon.com/128/528/528111.png"

let playerCapsule = {
    p1: {x: 100, y: 300},
    p2: {x: 100, y: 350},
    radius: 20,
    velocity: {x: 0, y: 0},
    mass: 1,
    invMass: 1,
    tag: "player",
    restitution: 0.1,
    color: "black",
    sprite : playerSprite
}
let triangle = {
    vertices : [
        {x: 300, y: 300},
        {x: 260, y: 370},
        {x: 340, y: 370}
    ],
    velocity : {x: 0, y: 0},
    mass : 1,
    invMass : 1 / 1,
    tag: "triangle",
    restitution: 1,
    color: "blue"
}
let circle = {
    center: {x: 500, y: 500},
    radius: 50,
    velocity: {x: 0, y: 100},
    mass: 1,
    invMass: 1,
    tag: "ball",
    restitution: 0.8,
    color: "red"
}
let square = {
    vertices : [
        {x: 1000, y: 200},
        {x: 1200, y: 200},
        {x: 1200, y: 400},
        {x: 1000, y: 400}
    ],
    velocity : {x: 0, y: 0},
    mass: 10,
    invMass: 0,
    tag: null,
    restitution: 0.5,
    color: "yellow"
}
let walls = [
    ground = {
        vertices: [
            {x: 0, y: static_canvas.height - 100},
            {x: static_canvas.width, y: static_canvas.height - 100},
            {x: static_canvas.width, y: static_canvas.height},
            {x: 0, y: static_canvas.height}
        ],
        velocity : {x: 0, y: 0},
        invMass : 0,
        tag: "ground",
        restitution: 0,
        color: "green"
    }
]

let objects = [triangle, square, ...walls, circle, playerCapsule]

let static_objects = [square, ...walls]
let dyn_objects = [triangle, playerCapsule, circle]

const draw_objects = (objects, ctx) => {
    for (let obj of objects) {
        if (obj.p1 && obj.radius) {
            draw_capsule(obj, obj.color, ctx)
        }
        else if (obj.radius) {
            draw_circle(obj, obj.color, ctx)
        }
        else {
            draw_polygon(obj.vertices, obj.color, ctx)
        }
    }
}

const draw_capsule = (capsule, color, ctx) => {
    ctx.beginPath()

    ctx.arc(capsule.p1.x, capsule.p1.y, capsule.radius, 0, Math.PI * 2)
    ctx.arc(capsule.p2.x, capsule.p2.y, capsule.radius, 0, Math.PI * 2)

    ctx.rect(
        capsule.p1.x - capsule.radius,
        capsule.p1.y,
        capsule.radius * 2,
        capsule.p2.y - capsule.p1.y
    )

    ctx.fillStyle = color
    ctx.fill()
    ctx.closePath()
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
    if (!obj.sprite || !obj.sprite.complete) return

    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity

    if (obj.p1 && obj.radius) {
        minX = Math.min(obj.p1.x, obj.p2.x) - obj.radius
        maxX = Math.max(obj.p1.x, obj.p2.x) + obj.radius
        minY = Math.min(obj.p1.y, obj.p2.y) - obj.radius
        maxY = Math.max(obj.p1.y, obj.p2.y) + obj.radius
    }
    else if (obj.radius && !obj.p1) {
        minX = obj.center.x - obj.radius
        maxX = obj.center.x + obj.radius
        minY = obj.center.y - obj.radius
        maxY = obj.center.y + obj.radius
    }
    else {
        for (let p of obj.vertices) {
            if (p.x < minX) minX = p.x
            if (p.x > maxX) maxX = p.x
            if (p.y < minY) minY = p.y
            if (p.y > maxY) maxY = p.y
        }
    }
    
    minX = Math.round(minX)
    maxX = Math.round(maxX)
    minY = Math.round(minY)
    maxY = Math.round(maxY)

    const width = maxX - minX
    const height = maxY - minY

    ctx_dyn.drawImage(obj.sprite, minX, minY, width, height)
}

const dotProduct = (v1, v2) => v1.x * v2.x + v1.y * v2.y;

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

    const lenght = Math.sqrt(axis.x**2 + axis.y**2)
    if (lenght === 0) return {x: 0, y: 1}

    return {x: axis.x / lenght, y: axis.y / lenght}
}

const projectShape = (shape, axis) => {
    if (shape.p1 && shape.radius) {
        const proj1 = dotProduct(shape.p1, axis)
        const proj2 = dotProduct(shape.p2, axis)

        let min = Math.min(proj1, proj2) - shape.radius
        let max = Math.max(proj1, proj2) + shape.radius

        return {min, max}
    }

    if (shape.radius) {
        const projection = dotProduct(shape.center, axis)
        return {
            min: projection - shape.radius,
            max: projection + shape.radius
        }
    }

    let min = dotProduct(shape.vertices[0], axis)
    let max = min

    for (let i = 1; i < shape.vertices.length; i++) {
        const projection = dotProduct(shape.vertices[i], axis)

        if (projection < min) min = projection
        if (projection > max) max = projection
    }

    return {min, max}
}

const getCenter = (obj) => {
    if (obj.p1 && obj.radius) {
        return {
            x: (obj.p1.x + obj.p2.x) / 2,
            y: (obj.p1.y + obj.p2.y) / 2
        }
    }
    if (obj.radius) {
        return {
            x: obj.center.x,
            y: obj.center.y
        }
    }

    let cx = 0
    let cy = 0

    for (let p of obj.vertices) {
        cx += p.x
        cy += p.y
    }

    return {
        x: cx / obj.vertices.length,
        y: cy / obj.vertices.length
    }
}

const getAABB = (shape) => {
    if (shape.p1 && shape.radius) {
        return {
            minX: Math.min(shape.p1.x, shape.p2.x) - shape.radius,
            maxX: Math.max(shape.p1.x, shape.p2.x) + shape.radius,
            minY: Math.min(shape.p1.y, shape.p2.y) - shape.radius,
            maxY: Math.max(shape.p1.y, shape.p2.y) + shape.radius
        }
    }

    if (shape.radius) {
        return {
            minX: shape.center.x - shape.radius,
            maxX: shape.center.x + shape.radius,
            minY: shape.center.y - shape.radius,
            maxY: shape.center.y + shape.radius
        }
    }

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

const getCapsuleNormal = (capsule) => {
    const dx = capsule.p2.x - capsule.p1.x
    const dy = capsule.p2.y - capsule.p1.y
    const lenght = Math.sqrt(dx**2 + dy**2)

    return {x: -dy / lenght, y: dx / lenght}
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

    const lenght = Math.sqrt(axis.x**2 + axis.y**2)
    if (lenght === 0) return {x: 0, y: 1}

    return {x: axis.x / lenght, y: axis.y / lenght}
}

const check_collision = (objA, objB) => {
    const aabbA = getAABB(objA)
    const aabbB = getAABB(objB)

    if (aabbA.minX > aabbB.maxX || aabbA.maxX < aabbB.minX ||
        aabbA.minY > aabbB.maxY || aabbA.maxY < aabbB.minY ) {
        return false
    }


    if (objA.radius && !objA.p1 && objB.radius && !objB.p1) {
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

    if (objA.vertices) allAxes.push(...getAxes(objA.vertices))
    else if (objA.radius && !objA.p1 && objB.vertices) allAxes.push(getCircleAxis(objA, objB))

    if (objB.vertices) allAxes.push(...getAxes(objB.vertices))
    else if (objB.radius && !objB.p1 && objA.vertices) allAxes.push(getCircleAxis(objB, objA))

    if (objA.p1 && objA.radius) {
        allAxes.push(getCapsuleNormal(objA))
        if (objB.vertices) {
            allAxes.push(getCircleAxis({center: {x: objA.p1.x, y: objA.p1.y}}, objB))
            allAxes.push(getCircleAxis({center: {x: objA.p2.x, y: objA.p2.y}}, objB))
        } else if (objB.radius && !objB.p1) {
            allAxes.push(getCapsuleCircleAxis(objA, objB))
        }
    }

    if (objB.p1 && objB.radius) {
        allAxes.push(getCapsuleNormal(objB))
        if (objA.vertices) {
            allAxes.push(getCircleAxis({center: {x: objB.p1.x, y: objB.p1.y}}, objA))
            allAxes.push(getCircleAxis({center: {x: objB.p2.x, y: objB.p2.y}}, objA))
        } else if (objA.radius && !objA.p1) {
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

    const pushX_A = normal.x * pushFactorA
    const pushY_A = normal.y * pushFactorA

    const pushX_B = normal.x * pushFactorB
    const pushY_B = normal.y * pushFactorB
    
    if (objA.p1 && objA.radius) {
        objA.p1.x -= pushX_A; objA.p1.y -= pushY_A;
        objA.p2.x -= pushX_A; objA.p2.y -= pushY_A;
    }
    else if (objA.radius){
        objA.center.x -= pushX_A
        objA.center.y -= pushY_A
    }
    else {
        for (let p of objA.vertices) {
            p.x -= pushX_A
            p.y -= pushY_A
        }
    }

    if (objB.p1 && objB.radius) {
        objB.p1.x += pushX_B; objB.p1.y += pushY_B;
        objB.p2.x += pushX_B; objB.p2.y += pushY_B;
    }
    else if (objB.radius ) {
        objB.center.x += pushX_B
        objB.center.y += pushY_B
    }
    else {
        for (let p of objB.vertices) {
            p.x += pushX_B
            p.y += pushY_B
        }
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
                let IsPlayer = objA.tag === "player" || objB.tag === "player"
                let IsGround = objA.tag === "ground" || objB.tag === "ground"
                if (IsPlayer && IsGround) {
                    grounded = true
                }
                if (objA.tag === "ball" && objB.tag === "player") {
                    const playerPos = getCenter(objA);
                    const ballPos = getCenter(objB);
                    if (collision.normal.y < -0.5 && Math.abs(playerPos.x - ballPos.x) < 30) {
                        objA.center.y -= 600
                    }
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

    if (obj.p1 && obj.radius) {
        minX = Math.min(obj.p1.x, obj.p2.x) - obj.radius;
        maxX = Math.max(obj.p1.x, obj.p2.x) + obj.radius;
        minY = Math.min(obj.p1.y, obj.p2.y) - obj.radius;
        maxY = Math.max(obj.p1.y, obj.p2.y) + obj.radius;
    }
    else if (obj.radius) {
        minX = obj.center.x - obj.radius
        maxX = obj.center.x + obj.radius
        minY = obj.center.y - obj.radius
        maxY = obj.center.y + obj.radius
    }
    else {
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
    for (let obj of dyn_objects) {
        let moveX = obj.velocity.x * deltaTime
        let moveY = obj.velocity.y * deltaTime

        if(obj.p1 && obj.radius) {
            obj.p1.x += moveX
            obj.p1.y += moveY
            obj.p2.x += moveX
            obj.p2.y += moveY
        }
        else if (obj.radius) {
            obj.center.x += moveX
            obj.center.y += moveY
        }
        else {
            for (let p of obj.vertices) {
                p.x += moveX
                p.y += moveY
            }
        }

        check_border_collision(obj)
    }
}

const update_acceleration = (deltaTime) => {
    const acceleration = 1250
    const falling_acceleration = 2000
    const friction = 0.98

    if (keys.a) playerCapsule.velocity.x -= acceleration * deltaTime
    if (keys.d) playerCapsule.velocity.x += acceleration * deltaTime

    for (let obj of dyn_objects) {
        obj.velocity.x *= friction
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
    playerCapsule.velocity.y -= 1000
}

const update = (deltaTime) => {
    update_acceleration(deltaTime)
    updatePositions(deltaTime)
    updatePhysics(objects)
}

let lastTime = 0

const clearCanvas = () => {
    ctx_dyn.clearRect(0, 0, dyn_canvas.width, dyn_canvas.height)
}

const keys = {
    w: false,
    a: false,
    s: false,
    d: false
}

window.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase()
    if(keys.hasOwnProperty(key)) keys[key] = true
    if (key === "w") {
        jumpBufferTimer = JUMP_BUFFER_TIME
    }
})

window.addEventListener("keyup", (e) => {
    const key = e.key.toLowerCase()
    if(keys.hasOwnProperty(key)) keys[key] = false
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

    draw_objects([triangle, circle], ctx_dyn)
    draw_sprite(playerCapsule)

    requestAnimationFrame(gameLoop)
}

draw_objects(static_objects, ctx_static)
requestAnimationFrame(gameLoop)