export class GameObject {
    static allGameObjects = []
    static dynamicGameObjects = []
    static staticGameObjects = []

    constructor({
        parent = null,
        offset = {x: 0, y: 0},
        localAngle = 0,
        inheritRotation = true,
        position =  {x: 0, y: 0},
        angle = 0,
        spriteAngle = 0,
        velocity = {x: 0, y: 0}, 
        mass = 1, 
        invMass = 1, 
        tag = null,
        restitution = 0, 
        color = "white",
        sprite = null,
        dynamic = true,
        OnCollision = null,
        zIndex = 0,
        useGravity = true
    } = {}) {
        this.parent = parent;
        this.offset = offset;
        this.localAngle = localAngle;
        this.inheritRotation = inheritRotation;
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
        this.OnCollision = OnCollision;
        this.zIndex = zIndex;
        this.useGravity = useGravity;

        GameObject.allGameObjects.push(this)
        
        if (dynamic || (this.parent && this.parent.dynamic)) {
            if (!dynamic) {
                this.mass = null;
                this.invMass = 0;
            }
            GameObject.dynamicGameObjects.push(this);
        } else {
            this.mass = null;
            this.invMass = 0;
            GameObject.staticGameObjects.push(this);
        }
    }

    SetParent(parentObject, offset = {x: 0, y: 0}, localAngle = 0) {
        this.parent = parentObject
        this.offset = offset
        this.localAngle = localAngle
    }

    updateChildTransform() {
        if (!this.parent) return

        if (this.inheritRotation) {
            this.angle = this.parent.angle + this.localAngle
        }
        else {
            this.angle = this.localAngle
        }

        const cos = Math.cos(this.parent.angle)
        const sin = Math.sin(this.parent.angle)

        const rotatedOffsetX = this.offset.x * cos - this.offset.y * sin
        const rotatedOffsetY = this.offset.x * sin + this.offset.y * cos

        this.position.x = this.parent.position.x + rotatedOffsetX
        this.position.y = this.parent.position.y + rotatedOffsetY

        this.updateTransform()
    }

    updateTransform() {}
}


export class Polygon extends GameObject {
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


export class Circle extends GameObject {
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


export class Capsule extends GameObject{
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