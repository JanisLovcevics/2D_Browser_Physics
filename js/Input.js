export const keys = {
    KeyW: false,
    KeyA: false,
    KeyS: false,
    KeyD: false,
    Space: false
}

export let jumpBufferTimer = 0
export const JUMP_BUFFER_TIME = 0.08

export const resetJumpBuffer = () => {
    jumpBufferTimer = 0
}

export const updateInput = (deltaTime) => {
    if (jumpBufferTimer > 0) {
        jumpBufferTimer -= deltaTime
    }
}

export const setupInputListeners = () => {
    window.addEventListener("keydown", (e) => {
        if (keys.hasOwnProperty(e.code)) keys[e.code] = true
        if (e.code === "Space") {
            jumpBufferTimer = JUMP_BUFFER_TIME
        }
    })

    window.addEventListener("keyup", (e) => {
        if (keys.hasOwnProperty(e.code)) keys[e.code] = false
    })
}