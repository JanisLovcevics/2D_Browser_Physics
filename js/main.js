import { GameObject, Polygon, Circle, Capsule } from "./Classes.js";
import { updatePhysics } from "./Physics.js";
import { draw_objects } from "./Render.js";
import { keys, jumpBufferTimer, resetJumpBuffer, setupInputListeners, updateInput } from "./Input.js";
import { degToRad } from "./Math.js";

const dyn_canvas = document.getElementById("dynamic-canvas")
const static_canvas = document.getElementById("static-canvas")

const ctx_dyn = dyn_canvas.getContext("2d")
const ctx_static = static_canvas.getContext("2d")

const resizeCanvas = (_canvas) => {
    const _parent = _canvas.parentElement

    _canvas.width = _parent.clientWidth
    _canvas.height = _parent.clientHeight
}

resizeCanvas(dyn_canvas)
resizeCanvas(static_canvas)

let grounded = false

const playerSprite = new Image()
playerSprite.src = "./Sprites/human.png"

let player = new Capsule({
    position: {x: 400, y: 600},
    length: 150,
    radius: 30,
    tag: "player",
    color: "black",
    OnCollision: (other) => {
        if (other.tag === "ground") {
            grounded = true
        }
    }
})

let ground = new Polygon({
    position: {x: static_canvas.width / 2, y: static_canvas.height - 50},
    localVertices: [
        {x: -static_canvas.width / 2, y: -50},
        {x: static_canvas.width / 2, y: -50},
        {x: static_canvas.width / 2, y: 50},
        {x: -static_canvas.width / 2, y: 50}
    ],
    tag: "ground",
    color: "green",
    dynamic: false,
    restitution: 0,
});

window.addEventListener("resize", () => {
    resizeCanvas(dyn_canvas)
    resizeCanvas(static_canvas)
    draw_objects(GameObject.staticGameObjects, ctx_static)
})

setupInputListeners()

const jump = () => {
    player.velocity.y -= 1000
}

const updatePositions = (deltaTime) => {
    for (let obj of GameObject.dynamicGameObjects) {
        if (!obj.parent) {
            obj.position.x += obj.velocity.x * deltaTime
            obj.position.y += obj.velocity.y * deltaTime

            obj.updateTransform()
        }
    }

    for (let obj of GameObject.allGameObjects) {
        if (obj.parent) {
            obj.updateChildTransform()
        }
    }
}

const update_acceleration = (deltaTime) => {
    const acceleration = 1250
    const falling_acceleration = 2000
    const friction = 0.98

    if (keys.KeyA) player.velocity.x -= acceleration * deltaTime
    if (keys.KeyD) player.velocity.x += acceleration * deltaTime

    for (let obj of GameObject.dynamicGameObjects) {
        if (!obj.parent) {
            obj.velocity.x *= friction ** (deltaTime * 60)
            obj.velocity.y += falling_acceleration * deltaTime
        }
    }

    updateInput(deltaTime)

    if (jumpBufferTimer > 0 && grounded) {
        jump()
        resetJumpBuffer()
    }
}

const update = (deltaTime) => {
    update_acceleration(deltaTime)
    updatePositions(deltaTime)
    updatePhysics(GameObject.allGameObjects, (isGrounded) => {
    grounded = isGrounded
})
}

const clearCanvas = () => {
    ctx_dyn.clearRect(0, 0, dyn_canvas.width, dyn_canvas.height)
}

let lastTime = 0

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

    requestAnimationFrame(gameLoop)
}

draw_objects(GameObject.staticGameObjects, ctx_static)
requestAnimationFrame(gameLoop)