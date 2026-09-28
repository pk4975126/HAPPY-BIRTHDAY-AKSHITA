const unlockBtn = document.getElementById('unlock-btn');
const progressBar = document.getElementById('progress-bar');
const bgm = document.getElementById('bgm');
const lockScreen = document.getElementById('lock-screen');
const messageContainer = document.getElementById('message-container');

let holdTimer, progress = 0, isUnlocked = false;
let audioUnlocked = false; 

function startHold() {
    if(isUnlocked) return;

    if (!audioUnlocked && bgm) {
        bgm.play().then(() => {
            bgm.pause();
            audioUnlocked = true;
        }).catch(err => console.log("Audio unlock pending..."));
    }

    holdTimer = setInterval(() => {
        progress += 2;
        progressBar.style.width = progress + '%';
        if (progress >= 100) triggerUnlock();
    }, 25);
}

function stopHold() {
    if(isUnlocked) return;
    clearInterval(holdTimer);
    let drain = setInterval(() => {
        progress -= 4;
        if(progress <= 0) { progress = 0; clearInterval(drain); }
        progressBar.style.width = progress + '%';
    }, 20);
}

unlockBtn.addEventListener('mousedown', startHold);
unlockBtn.addEventListener('mouseup', stopHold);
unlockBtn.addEventListener('mouseleave', stopHold);
unlockBtn.addEventListener('touchstart', (e) => { e.preventDefault(); startHold(); });
unlockBtn.addEventListener('touchend', stopHold);

function triggerUnlock() {
    isUnlocked = true;
    clearInterval(holdTimer);
    
    if(bgm) {
        bgm.volume = 0.6; 
        bgm.play().catch(e => console.log("Ensure you have a valid MP3 file!"));
    }

    lockScreen.style.opacity = 0;
    setTimeout(() => {
        lockScreen.style.display = 'none';
        initParticleText();
    }, 500);

    setTimeout(() => {
        messageContainer.classList.remove('hidden');
    }, 3500);
}

// --- PARTICLE PHYSICS ENGINE ---
const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');
let particles = [];
let mouse = { x: -9999, y: -9999, radius: 80 }; 

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

window.addEventListener('mousemove', (e) => {
    mouse.x = e.x;
    mouse.y = e.y;
});
window.addEventListener('touchmove', (e) => {
    mouse.x = e.touches[0].clientX;
    mouse.y = e.touches[0].clientY;
});
window.addEventListener('mouseout', () => { mouse.x = -9999; mouse.y = -9999; });
window.addEventListener('touchend', () => { mouse.x = -9999; mouse.y = -9999; });

class Particle {
    constructor(x, y) {
        this.targetX = x;
        this.targetY = y;
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = 0;
        this.vy = 0;
        this.size = Math.random() * 2 + 1; 
        this.friction = 0.90; 
        this.spring = 0.05;   
    }

    update() {
        let dxMouse = mouse.x - this.x;
        let dyMouse = mouse.y - this.y;
        let distanceMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

        if (distanceMouse < mouse.radius) {
            let forceDirectionX = dxMouse / distanceMouse;
            let forceDirectionY = dyMouse / distanceMouse;
            let force = (mouse.radius - distanceMouse) / mouse.radius; 
            
            this.vx -= forceDirectionX * force * 5;
            this.vy -= forceDirectionY * force * 5;
        }

        let dxTarget = this.targetX - this.x;
        let dyTarget = this.targetY - this.y;
        
        this.vx += dxTarget * this.spring;
        this.vy += dyTarget * this.spring;

        this.vx *= this.friction;
        this.vy *= this.friction;
        this.x += this.vx;
        this.y += this.vy;
    }

    draw() {
        ctx.fillStyle = '#ff69b4'; // Particles are now Pink
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function initParticleText() {
    particles = [];
    
    const offCanvas = document.createElement('canvas');
    const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });
    offCanvas.width = canvas.width;
    offCanvas.height = canvas.height;

    // Capped max font size slightly smaller so 3 lines take up less vertical room
    let fontSize = Math.min(canvas.width / 6, 80); 
    offCtx.fillStyle = 'white';
    offCtx.font = `bold ${fontSize}px Inter, sans-serif`;
    offCtx.textAlign = 'center';
    offCtx.textBaseline = 'middle';
    
    // Shifted higher up (28% from the top instead of 35% or 50%)
    let centerY = canvas.height * 0.28; 
    
    offCtx.fillText('HAPPY', canvas.width / 2, centerY - fontSize * 1.1);
    offCtx.fillText('BIRTHDAY', canvas.width / 2, centerY);
    offCtx.fillText('AKSHITA', canvas.width / 2, centerY + fontSize * 1.1);
    
    const textData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height).data;
    
    let gap = canvas.width < 600 ? 5 : 6; 
    
    for (let y = 0; y < offCanvas.height; y += gap) {
        for (let x = 0; x < offCanvas.width; x += gap) {
            let index = (y * offCanvas.width + x) * 4;
            let alpha = textData[index + 3];
            
            if (alpha > 128) {
                particles.push(new Particle(x, y));
            }
        }
    }
    
    animateParticles();
}

function animateParticles() {
    ctx.fillStyle = 'rgba(2, 6, 23, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
    }
    
    requestAnimationFrame(animateParticles);
}