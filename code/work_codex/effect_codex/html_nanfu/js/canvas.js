const canvas2 = document.getElementById('fluid-canvas');
const ctx = canvas2.getContext('2d');

let blobs = [];
let rect = null;

const CONFIG = {
    speed: 1.2,
    range: 150,
    blur: 18,
    density: 5,
    minDistance: 220
};

canvas2.style.transform = "translateZ(0)";
canvas2.style.willChange = "transform";

function getRect() {
    rect = canvas2.getBoundingClientRect();
}

function initFluid() {

    getRect();

    const scale = 0.8;

    canvas2.width = rect.width * scale;
    canvas2.height = rect.height * scale;

    canvas2.style.width = rect.width + 'px';
    canvas2.style.height = rect.height + 'px';

    blobs = [];

    createBlobs();
}

function createBlobs() {

    const w = rect.width;
    const h = rect.height;

    const maxAttempts = 50;

    for (let i = 0; i < CONFIG.density; i++) {

        let attempts = 0;
        let valid = false;
        let x, y;

        while (!valid && attempts < maxAttempts) {

            x = Math.random() * w;
            y = Math.random() * (h * 0.5);

            valid = true;

            for (let j = 0; j < blobs.length; j++) {

                const b = blobs[j];

                const dx = x - b.baseX;
                const dy = y - b.baseY;

                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < CONFIG.minDistance) {
                    valid = false;
                    break;
                }
            }

            attempts++;
        }

        blobs.push(new Blob(x, y));
    }
}

class Blob {

    constructor(x, y) {

        this.baseX = x;
        this.baseY = y;

        this.x = x;
        this.y = y;

        this.radius =
            (window.innerWidth < 1280 ? 100 : 280) +
            Math.random() * 220;

        this.color = 'rgba(24,69,149,1)';
        this.offset = Math.random() * 1000;
    }

    update(time) {

        const t = time * 0.0003 * CONFIG.speed;

        this.x =
            this.baseX +
            Math.sin(t + this.offset) * CONFIG.range;

        this.y =
            this.baseY +
            Math.cos(t + this.offset) * CONFIG.range;
    }

    draw() {

        const gradient = ctx.createRadialGradient(
            this.x,
            this.y,
            0,
            this.x,
            this.y,
            this.radius
        );

        gradient.addColorStop(0, this.color);
        gradient.addColorStop(0.6, 'rgba(5,133,187,0.1)');
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;

        ctx.beginPath();
        ctx.arc(
            this.x,
            this.y,
            this.radius,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }
}

function renderFluid(time) {

    ctx.clearRect(
        0,
        0,
        canvas2.width,
        canvas2.height
    );

    ctx.filter = 'blur(10px)';
    ctx.globalCompositeOperation = 'lighter';

    for (let i = 0; i < blobs.length; i++) {

        blobs[i].update(time);
        blobs[i].draw();
    }
}

function loop(time) {

    renderFluid(time);

    requestAnimationFrame(loop);
}

function resize() {
    initFluid();
}

window.addEventListener('resize', resize);

initFluid();

/**
 * 注意这里
 * 不要 loop()
 * 要让浏览器传入 time
 */
requestAnimationFrame(loop);