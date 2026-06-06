const dyn_canvas = document.getElementById("dynamic-canvas")
const static_canvas = document.getElementById("static-canvas")

const resizeCanvas = (_canvas) => {
    const _parent = _canvas.parentElement

    _canvas.width = _parent.clientWidth
    _canvas.height = _parent.clientHeight
}

resizeCanvas(dyn_canvas)

window.addEventListener("resize", () => {
    resizeCanvas(dyn_canvas)
})

const ctx = dyn_canvas.getContext("2d")

let triangle = {
    vertices : [
        {x: 300, y: 300},
        {x: 260, y: 370},
        {x: 340, y: 370}
    ],
    velocity : {x: 150, y: 0},
    mass : 1,
    invMass : 1 / 1
}
let square = {
    vertices : [
        {x: 1000, y: 200},
        {x: 1200, y: 200},
        {x: 1200, y: 400},
        {x: 1000, y: 400}
    ],
    velocity : {x: -150, y: 0},
    mass: 10,
    invMass: 0
}

let objects = [triangle, square]

const draw_polygon = (polygon, color = "red") => {
    ctx.beginPath()

    ctx.moveTo(polygon[0].x, polygon[0].y)

    for (let i = 1; i < polygon.length; i++) {
        ctx.lineTo(polygon[i].x, polygon[i].y)
    }

    ctx.closePath()

    ctx.fillStyle = color
    ctx.fill()
}

const dotProduct = (v1, v2) => v1.x * v2.x + v1.y * v2.y;

const getAxes = (vertices) => {
    const axes = []
    for (let i = 0; i < vertices.length; i++) {
        const p1 = vertices[i]
        const p2 = vertices[(i + 1) % vertices.length]

        const edge = {x: p2.x - p1.x, y:  p2.y - p1.y}

        const length = Math.sqrt(edge.x ** 2 + edge.y ** 2)
        const normal = {x: -edge.y / length, y: edge.x / length}
        axes.push(normal)
    }

    return axes
}

const projectPolygon = (vertices, axis) => {
    let min = dotProduct(vertices[0], axis)
    let max = min

    for (let i = 1; i < vertices.length; i++) {
        const projection = dotProduct(vertices[i], axis)

        if (projection < min) min = projection
        if (projection > max) max = projection
    }

    return {min, max}
}

const getCenter = (vertices) => {
    let cx = 0
    let cy = 0

    for (let p of vertices) {
        cx += p.x
        cy += p.y
    }

    return {
        x: cx / vertices.length,
        y: cy / vertices.length
    }
}

const check_collision = (polyA, polyB) => {
    const allAxes = [...getAxes(polyA.vertices), ...getAxes(polyB.vertices)]

    let minOverlap = Infinity
    let collisionNormal = null

    for ( let i = 0; i < allAxes.length; i++) {
        const axis = allAxes[i]
        const projA = projectPolygon(polyA.vertices, axis)
        const projB = projectPolygon(polyB.vertices, axis)

        let overlap = Math.min(projA.max, projB.max) - Math.max(projA.min, projB.min)

        if (overlap < 0) {
            return false
        }

        if (overlap < minOverlap) {
            minOverlap = overlap
            collisionNormal = axis
        }
    }

    const centerA = getCenter(polyA.vertices)
    const centerB = getCenter(polyB.vertices)

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

    for (let p of objA.vertices) {
        p.x -= pushX_A
        p.y -= pushY_A
    }

    for (let p of objB.vertices) {
        p.x += pushX_B
        p.y += pushY_B
    }
}

const resolveVelocity = (objA, objB, normal) => {
    const relVelocity = {
        x: objB.velocity.x - objA.velocity.x,
        y: objB.velocity.y - objA.velocity.y
    }

    const velAlongNormal = dotProduct(relVelocity, normal)

    if (velAlongNormal > 0) return

    const restitution = 0.3

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

    for (let p of obj.vertices) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
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
    for (let obj of objects) {
        let moveX = obj.velocity.x * deltaTime
        let moveY = obj.velocity.y * deltaTime

        for (let p of obj.vertices) {
            p.x += moveX
            p.y += moveY
        }

        check_border_collision(obj)
    }
}

const update = (deltaTime) => {
    updatePositions(deltaTime)
    updatePhysics(objects)
}

let lastTime = 0

const clearCanvas = () => {
    ctx.clearRect(0, 0, dyn_canvas.width, dyn_canvas.height)
}

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

    draw_polygon(triangle.vertices)
    draw_polygon(square.vertices, "green")


    requestAnimationFrame(gameLoop)
}

requestAnimationFrame(gameLoop)