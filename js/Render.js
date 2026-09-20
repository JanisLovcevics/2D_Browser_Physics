import { Capsule, Circle, Polygon } from "./Classes.js";
import { getCenter, getAABB } from "./Physics.js";

export const draw_capsule = (capsule, color, ctx, hitbox = false) => {
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


export const draw_polygon = (polygon, color, ctx) => {
    ctx.beginPath()

    ctx.moveTo(polygon[0].x, polygon[0].y)

    for (let i = 1; i < polygon.length; i++) {
        ctx.lineTo(polygon[i].x, polygon[i].y)
    }

    ctx.closePath()

    ctx.fillStyle = color
    ctx.fill()
}


export const draw_circle = (circleObj, color, ctx) => {
    ctx.beginPath()
    
    ctx.arc(circleObj.center.x, circleObj.center.y, circleObj.radius, 0, Math.PI * 2)
    
    ctx.closePath()
    
    ctx.fillStyle = color
    ctx.fill()
}


export const draw_objects = (objects, ctx) => {
    const sortedObjects = [...objects].sort((a, b) => a.zIndex - b.zIndex)

    for (let obj of sortedObjects) {
        if (obj.sprite) {
            draw_sprite(obj, ctx)
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


export const draw_sprite = (obj) => {
    if (!obj.sprite || !obj.sprite.complete) return;

    const center = getCenter(obj)
    let drawWidth = obj.sprite.width
    let drawHeight = obj.sprite.height

    let currentAngle = obj.angle + (obj.spriteAngle || 0 )

    ctx_dyn.save()

    ctx_dyn.translate(center.x, center.y)

    if (currentAngle !== 0) {
        ctx_dyn.rotate(currentAngle)
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