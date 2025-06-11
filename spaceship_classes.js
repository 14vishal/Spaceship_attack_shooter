class Bullet {
    constructor(x, y, vx, vy, color, size) {
        this.x = x;
        this.y = y;
        this.vx = vx || 0;
        this.vy = vy || -8;
        this.color = color || 'cyan';
        this.size = size || 4;
        this.trail = [];
    }
    
    update() {
        // keep a trail behind the bullet
        this.trail.push({x: this.x, y: this.y});
        if (this.trail.length > 8) {
            this.trail.shift();
        }
        
        this.x += this.vx;
        this.y += this.vy;
    }
    
    draw(ctx) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        
        // draw trail
        for (let i = 0; i < this.trail.length; i++) {
            let alpha = i / this.trail.length;
            ctx.globalAlpha = alpha * 0.7;
            ctx.fillStyle = this.color;
            ctx.fillRect(this.trail[i].x - this.size/2, this.trail[i].y - this.size/2, this.size, this.size);
        }
        
        // draw main bullet
        ctx.globalAlpha = 1;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
        ctx.shadowBlur = 0;
    }
}

class Monster {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type || 'basic';
        
        // different stats for different types
        if (this.type === 'boss') {
            this.health = 5;
            this.speed = 1;
            this.size = 60;
            this.color = '#ff0066';
        } else if (this.type === 'fast') {
            this.health = 1;
            this.speed = 3;
            this.size = 25;
            this.color = 'yellow';
        } else {
            this.health = 2;
            this.speed = 2;
            this.size = 35;
            this.color = '#ff6600';
        }
        
        this.maxHealth = this.health;
        this.shootCooldown = 0;
        this.angle = 0;
    }
    
    update(player, bullets) {
        this.angle += 0.05;
        
        // fast monsters chase the player
        if (this.type === 'fast') {
            let dx = player.x - this.x;
            let dy = player.y - this.y;
            let distance = Math.sqrt(dx*dx + dy*dy);
            this.x += (dx/distance) * this.speed * 0.5;
            this.y += (dy/distance) * this.speed * 0.5 + this.speed;
        } else {
            // normal movement
            this.y += this.speed;
            this.x += Math.sin(this.angle) * 2; // wobble side to side
        }
        
        // boss monsters shoot back
        if (this.type === 'boss' && this.shootCooldown <= 0) {
            // shoot 3 bullets in a spread
            for (let i = 0; i < 3; i++) {
                let spreadAngle = (i - 1) * 0.5;
                bullets.push(new Bullet(
                    this.x, 
                    this.y + this.size/2,
                    Math.sin(spreadAngle) * 3, 
                    4,
                    this.color, 
                    6
                ));
            }
            this.shootCooldown = 60; // 1 second at 60fps
        }
        this.shootCooldown--;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;
        
        if (this.type === 'boss') {
            // big square with smaller square inside
            ctx.fillStyle = this.color;
            ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
            ctx.fillStyle = 'white';
            ctx.fillRect(-this.size/4, -this.size/4, this.size/2, this.size/2);
        } else if (this.type === 'fast') {
            // hexagon shape
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                let angle = (i * Math.PI * 2) / 6;
                let x = Math.cos(angle) * this.size/2;
                let y = Math.sin(angle) * this.size/2;
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.closePath();
            ctx.fillStyle = this.color;
            ctx.fill();
        } else {
            // star shape for basic monsters
            ctx.beginPath();
            for (let i = 0; i < 8; i++) {
                let angle = (i * Math.PI * 2) / 8;
                let radius = (i % 2 === 0) ? this.size/2 : this.size/3;
                let x = Math.cos(angle) * radius;
                let y = Math.sin(angle) * radius;
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.closePath();
            ctx.fillStyle = this.color;
            ctx.fill();
        }
        
        // health bar if damaged
        if (this.health < this.maxHealth) {
            ctx.fillStyle = 'red';
            ctx.fillRect(-this.size/2, -this.size/2 - 10, this.size, 4);
            ctx.fillStyle = 'green';
            let healthWidth = (this.health/this.maxHealth) * this.size;
            ctx.fillRect(-this.size/2, -this.size/2 - 10, healthWidth, 4);
        }
        
        ctx.restore();
        ctx.shadowBlur = 0;
    }
}

class Particle {
    constructor(x, y, vx, vy, color, life) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.life = life;
        this.maxLife = life;
        this.size = Math.random() * 4 + 2; // random size
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.1; // gravity
        this.life--;
    }
    
    draw(ctx) {
        let alpha = this.life / this.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
        ctx.globalAlpha = 1;
    }
}

class Player {
    constructor(canvasWidth, canvasHeight) {
        this.x = canvasWidth / 2;
        this.y = canvasHeight - 80;
        this.width = 40;
        this.height = 40;
        this.speed = 5;
        this.shootCooldown = 0;
        this.invulnerable = 0; // frames of invulnerability after getting hit
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
    }
    
    update(keys) {
        // movement controls
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
            this.x = Math.max(20, this.x - this.speed);
        }
        if (keys['ArrowRight'] || keys['d'] || keys['D']) {
            this.x = Math.min(this.canvasWidth - 20, this.x + this.speed);
        }
        if (keys['ArrowUp'] || keys['w'] || keys['W']) {
            this.y = Math.max(20, this.y - this.speed);
        }
        if (keys['ArrowDown'] || keys['s'] || keys['S']) {
            this.y = Math.min(this.canvasHeight - 20, this.y + this.speed);
        }
        
        // update timers
        if (this.shootCooldown > 0) this.shootCooldown--;
        if (this.invulnerable > 0) this.invulnerable--;
    }
    
    shoot(bullets, keys) {
        if ((keys[' '] || keys['Space']) && this.shootCooldown <= 0) {
            bullets.push(new Bullet(this.x, this.y - 20));
            this.shootCooldown = 15; // quarter second
        }
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // blink when invulnerable
        if (this.invulnerable > 0 && Math.floor(this.invulnerable / 5) % 2) {
            ctx.globalAlpha = 0.5;
        }
        
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'cyan';
        
        // draw spaceship shape
        ctx.fillStyle = 'cyan';
        ctx.beginPath();
        ctx.moveTo(0, -20);
        ctx.lineTo(-15, 15);
        ctx.lineTo(-5, 10);
        ctx.lineTo(0, 20);
        ctx.lineTo(5, 10);
        ctx.lineTo(15, 15);
        ctx.closePath();
        ctx.fill();
        
        // cockpit
        ctx.fillStyle = 'white';
        ctx.fillRect(-8, -5, 16, 10);
        
        ctx.restore();
        ctx.shadowBlur = 0;
    }
}
