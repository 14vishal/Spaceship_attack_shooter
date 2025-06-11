class Bullet {
    constructor(x, y, vx = 0, vy = -8, color = '#00ffff', size = 4) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = size;
        this.trail = [];
    }
    
    update() {
        this.trail.push({x: this.x, y: this.y});
        if (this.trail.length > 8) this.trail.shift();
        
        this.x += this.vx;
        this.y += this.vy;
    }
    
    draw(ctx) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        
        for (let i = 0; i < this.trail.length; i++) {
            const alpha = i / this.trail.length;
            ctx.globalAlpha = alpha * 0.7;
            ctx.fillStyle = this.color;
            ctx.fillRect(this.trail[i].x - this.size/2, this.trail[i].y - this.size/2, this.size, this.size);
        }
        
        ctx.globalAlpha = 1;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
        ctx.shadowBlur = 0;
    }
}

class Monster {
    constructor(x, y, type = 'basic') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.health = type === 'boss' ? 5 : type === 'fast' ? 1 : 2;
        this.maxHealth = this.health;
        this.speed = type === 'fast' ? 3 : type === 'boss' ? 1 : 2;
        this.size = type === 'boss' ? 60 : type === 'fast' ? 25 : 35;
        this.shootCooldown = 0;
        this.angle = 0;
        this.color = type === 'boss' ? '#ff0066' : type === 'fast' ? '#ffff00' : '#ff6600';
    }
    
    update(player, bullets) {
        this.angle += 0.05;
        
        if (this.type === 'fast') {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            this.x += (dx/dist) * this.speed * 0.5;
            this.y += (dy/dist) * this.speed * 0.5 + this.speed;
        } else {
            this.y += this.speed;
            this.x += Math.sin(this.angle) * 2;
        }
        
        if (this.type === 'boss' && this.shootCooldown <= 0) {
            for (let i = 0; i < 3; i++) {
                const angle = (i - 1) * 0.5;
                bullets.push(new Bullet(
                    this.x, this.y + this.size/2,
                    Math.sin(angle) * 3, 4,
                    '#ff0066', 6
                ));
            }
            this.shootCooldown = 60;
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
            ctx.fillStyle = this.color;
            ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-this.size/4, -this.size/4, this.size/2, this.size/2);
        } else if (this.type === 'fast') {
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (i * Math.PI * 2) / 6;
                const x = Math.cos(angle) * this.size/2;
                const y = Math.sin(angle) * this.size/2;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fillStyle = this.color;
            ctx.fill();
        } else {
            ctx.beginPath();
            for (let i = 0; i < 8; i++) {
                const angle = (i * Math.PI * 2) / 8;
                const radius = (i % 2 === 0) ? this.size/2 : this.size/3;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fillStyle = this.color;
            ctx.fill();
        }
        
        if (this.health < this.maxHealth) {
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(-this.size/2, -this.size/2 - 10, this.size, 4);
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(-this.size/2, -this.size/2 - 10, (this.health/this.maxHealth) * this.size, 4);
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
        this.size = Math.random() * 4 + 2;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.1;
        this.life--;
    }
    
    draw(ctx) {
        const alpha = this.life / this.maxLife;
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
        this.invulnerable = 0;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
    }
    
    update(keys) {
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
        
        this.shootCooldown = Math.max(0, this.shootCooldown - 1);
        this.invulnerable = Math.max(0, this.invulnerable - 1);
    }
    
    shoot(bullets, keys) {
        if ((keys[' '] || keys['Space']) && this.shootCooldown <= 0) {
            bullets.push(new Bullet(this.x, this.y - 20));
            this.shootCooldown = 15;
        }
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        if (this.invulnerable > 0 && Math.floor(this.invulnerable / 5) % 2) {
            ctx.globalAlpha = 0.5;
        }
        
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00ffff';
        
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.moveTo(0, -20);
        ctx.lineTo(-15, 15);
        ctx.lineTo(-5, 10);
        ctx.lineTo(0, 20);
        ctx.lineTo(5, 10);
        ctx.lineTo(15, 15);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-8, -5, 16, 10);
        
        ctx.restore();
        ctx.shadowBlur = 0;
    }
}