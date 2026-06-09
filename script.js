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

    draw_polygon(square.vertices, "yellow", ctx_static)
    draw_polygon(walls[0].vertices, "green", ctx_static)
})

const ctx_dyn = dyn_canvas.getContext("2d")
const ctx_static = static_canvas.getContext("2d")

const image = new Image()
image.src = "https://cdn-icons-png.flaticon.com/512/744/744546.png"

let triangle = {
    vertices : [
        {x: 300, y: 440},
        {x: 260, y: 370},
        {x: 340, y: 370}
    ],
    velocity : {x: 0, y: 0},
    mass : 1,
    invMass : 1 / 1,
    sprite : image,
    tag: "player",
    restitution: 1
}
let circle = {
    center: {x: 500, y: 500},
    radius: 50,
    velocity: {x: 0, y: 100},
    mass: 1,
    invMass: 1,
    tag: "ball",
    restitution: 0.8
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
    restitution: 0.5
}
let walls = [
    ground = {
        vertices: [
            {x: 0, y: static_canvas.height - 100},
            {x: 1000, y: static_canvas.height - 100},
            {x: 1000, y: static_canvas.height},
            {x: 0, y: static_canvas.height}
        ],
        velocity : {x: 0, y: 0},
        invMass : 0,
        tag: "ground",
        restitution: 0.2
    }
]

let objects = [triangle, square, ...walls, circle]

let static_objects = [square, ...walls]
let dyn_objects = [triangle, circle]

const draw_polygon = (polygon, color, canvas) => {
    canvas.beginPath()

    canvas.moveTo(polygon[0].x, polygon[0].y)

    for (let i = 1; i < polygon.length; i++) {
        canvas.lineTo(polygon[i].x, polygon[i].y)
    }

    canvas.closePath()

    canvas.fillStyle = color
    canvas.fill()
}

const draw_circle = (circleObj, color, canvas) => {
    canvas.beginPath()
    
    canvas.arc(circleObj.center.x, circleObj.center.y, circleObj.radius, 0, Math.PI * 2)
    
    canvas.closePath()
    
    canvas.fillStyle = color
    canvas.fill()
}

const draw_sprite = (obj) => {
    if (!obj.sprite || !obj.sprite.complete) return

    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity

    for (let p of obj.vertices) {
        if (p.x < minX) minX = p.x
        if (p.x > maxX) maxX = p.x
        if (p.y < minY) minY = p.y
        if (p.y > maxY) maxY = p.y
    }

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

const check_collision = (objA, objB) => {
    const aabbA = getAABB(objA)
    const aabbB = getAABB(objB)

    if (aabbA.minX > aabbB.maxX || aabbA.maxX < aabbB.minX ||
        aabbA.minY > aabbB.maxY || aabbA.maxY < aabbB.minY ) {
        return false
    }


    if (objA.radius && objB.radius) {
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
    else if (objA.radius && objB.vertices) allAxes.push(getCircleAxis(objA, objB))

    if (objB.vertices) allAxes.push(...getAxes(objB.vertices))
    else if (objB.radius && objA.vertices) allAxes.push(getCircleAxis(objB, objA))

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
    
    if (objA.radius){
        objA.center.x -= pushX_A
        objA.center.y -= pushY_A
    }
    else {
        for (let p of objA.vertices) {
            p.x -= pushX_A
            p.y -= pushY_A
        }
    }

    if (objB.radius ) {
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

    for (let i = 0; i < objects.length; i++) {
        for (let j = i + 1; j < objects.length; j++) {
            const objA = objects[i]
            const objB = objects[j]

            const collision = check_collision(objA, objB)

            if (collision && collision.isColliding) {
                resolveCollision(objA, objB, collision)
            }
        }
    }
}

const check_border_collision = (obj) => {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    if (obj.radius) {
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

        if (obj.radius) {
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
    const acceleration = 2000
    const falling_acceleration = 500
    const friction = 0.98
    const max_falling_velocity = 2500

    if (keys.a) triangle.velocity.x -= acceleration * deltaTime
    if (keys.d) triangle.velocity.x += acceleration * deltaTime

    for (let obj of dyn_objects) {
        obj.velocity.x *= friction
        obj.velocity.y += falling_acceleration * deltaTime
        if (Math.abs(obj.velocity.y) > max_falling_velocity) {
            obj.velocity.y = max_falling_velocity
        }
    }
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

    draw_polygon(triangle.vertices, "blue", ctx_dyn)
    draw_circle(circle, "red", ctx_dyn)


    requestAnimationFrame(gameLoop)
}

draw_polygon(square.vertices, "yellow", ctx_static)
draw_polygon(walls[0].vertices, "green", ctx_static)
requestAnimationFrame(gameLoop)