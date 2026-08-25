/* ==========================================================================
   FOR ANONNA BRISTY - AMBIENT FLOATING PARTICLES & HEARTS CANVAS ENGINE
   ========================================================================== */

(function () {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    const particles = [];
    const maxParticles = 45;

    class Particle {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.size = Math.random() * 12 + 6;
            this.speedY = -(Math.random() * 0.6 + 0.2);
            this.speedX = (Math.random() - 0.5) * 0.4;
            this.opacity = Math.random() * 0.6 + 0.2;
            this.fadeSpeed = Math.random() * 0.005 + 0.002;
            this.type = Math.random() > 0.4 ? 'heart' : 'sparkle';
            this.rotation = Math.random() * Math.PI * 2;
            this.rotSpeed = (Math.random() - 0.5) * 0.02;
        }

        update() {
            this.y += this.speedY;
            this.x += this.speedX;
            this.rotation += this.rotSpeed;

            if (this.y < -30 || this.x < -30 || this.x > width + 30) {
                this.y = height + 20;
                this.x = Math.random() * width;
            }
        }

        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.globalAlpha = this.opacity;

            if (this.type === 'heart') {
                ctx.fillStyle = '#f43f5e';
                ctx.shadowColor = '#fda4af';
                ctx.shadowBlur = 12;
                ctx.beginPath();
                const topCurveHeight = this.size * 0.3;
                ctx.moveTo(0, topCurveHeight);
                ctx.bezierCurveTo(0, 0, -this.size / 2, 0, -this.size / 2, topCurveHeight);
                ctx.bezierCurveTo(-this.size / 2, (this.size + topCurveHeight) / 2, 0, this.size, 0, this.size);
                ctx.bezierCurveTo(0, (this.size + topCurveHeight) / 2, this.size / 2, (this.size + topCurveHeight) / 2, this.size / 2, topCurveHeight);
                ctx.bezierCurveTo(this.size / 2, 0, 0, 0, 0, topCurveHeight);
                ctx.closePath();
                ctx.fill();
            } else {
                ctx.fillStyle = '#fda4af';
                ctx.shadowColor = '#ffffff';
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.arc(0, 0, this.size / 4, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }
    }

    for (let i = 0; i < maxParticles; i++) {
        particles.push(new Particle());
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        requestAnimationFrame(animate);
    }

    animate();
})();
