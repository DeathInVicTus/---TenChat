import { state, canvasState, canvas, ctx, resize } from './state.js';
import { startScenario, restart, collectContact } from './game.js';

// ============ ФОН ============
function drawBackground() {
    const { W, H, centerX, centerY, stars } = canvasState;
    const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(W, H));
    grad.addColorStop(0, '#141a3a');
    grad.addColorStop(1, '#0a0e27');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    for (const s of stars) {
        s.alpha += s.twinkle;
        if (s.alpha > 1 || s.alpha < 0.2) s.twinkle *= -1;
        ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ============ ОРБИТА ============
function drawOrbitScene() {
    const data = canvasState.orbitData;
    if (!data) return;

    const { centerX, centerY } = canvasState;
    data.orbitRadius += (data.targetOrbitRadius - data.orbitRadius) * 0.05;
    canvasState.playerPulse += 0.05;

    const pulseR = data.orbitRadius + Math.sin(canvasState.playerPulse) * 5;
    for (let i = 1; i <= 3; i++) {
        ctx.strokeStyle = `rgba(255,165,0,${0.15 / i})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(centerX, centerY, pulseR * i * 0.7, 0, Math.PI * 2);
        ctx.stroke();
    }

    const glow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, data.orbitRadius);
    glow.addColorStop(0, 'rgba(74,144,226,0.4)');
    glow.addColorStop(0.5, 'rgba(255,165,0,0.15)');
    glow.addColorStop(1, 'rgba(255,165,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(centerX, centerY, data.orbitRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(centerX, centerY, 18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4A90E2';
    ctx.beginPath(); ctx.arc(centerX, centerY, 14, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.scenario.icon, centerX, centerY);

    // Нити
    for (const t of data.threads) {
        t.progress = Math.min(1, t.progress + 0.03);
        const c = t.contact;
        const targetR = data.orbitRadius + 30 + data.threads.indexOf(t) * 25;
        const angle = Math.atan2(c.y - centerY, c.x - centerX);
        c.x = centerX + Math.cos(angle) * targetR;
        c.y = centerY + Math.sin(angle) * targetR;

        ctx.strokeStyle = t.color;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = t.color;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);

        const steps = 20;
        for (let i = 1; i <= steps; i++) {
            const p = i / steps;
            const x = centerX + (c.x - centerX) * p;
            const y = centerY + (c.y - centerY) * p;
            const wave = Math.sin(p * Math.PI * 4 + Date.now() * 0.003) * 5 * (1 - p);
            const perpX = -(c.y - centerY);
            const perpY = (c.x - centerX);
            const len = Math.sqrt(perpX * perpX + perpY * perpY) || 1;
            ctx.lineTo(x + perpX / len * wave, y + perpY / len * wave);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(c.emoji, c.x, c.y);
    }

    // Контакты
    for (const c of data.contacts) {
        if (c.collected) continue;
        c.angle += c.speed;
        c.pulse += 0.08;
        c.x = centerX + Math.cos(c.angle) * c.orbitR;
        c.y = centerY + Math.sin(c.angle) * c.orbitR;

        const glowSize = 40 + Math.sin(c.pulse) * 5;
        const glowC = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, glowSize);
        glowC.addColorStop(0, c.color + '66');
        glowC.addColorStop(1, c.color + '00');
        ctx.fillStyle = glowC;
        ctx.beginPath(); ctx.arc(c.x, c.y, glowSize, 0, Math.PI * 2); ctx.fill();

        ctx.font = `${c.size}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(c.emoji, c.x, c.y);

        ctx.font = '12px sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fillText(c.label, c.x, c.y + 30);
    }

    // Частицы
    for (let i = data.particles.length - 1; i >= 0; i--) {
        const p = data.particles[i];
        p.x += p.vx; p.y += p.vy;
        p.vx *= 0.95; p.vy *= 0.95;
        p.life -= 0.02;
        if (p.life <= 0) { data.particles.splice(i, 1); continue; }
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// ============ АНИМАЦИЯ ============
function animate() {
    drawBackground();
    if (canvasState.orbitMode) drawOrbitScene();
    requestAnimationFrame(animate);
}

// ============ КЛИК ПО ОРБИТЕ ============
canvas.addEventListener('click', (e) => {
    if (!canvasState.orbitMode || !canvasState.orbitData) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    for (const c of canvasState.orbitData.contacts) {
        if (c.collected) continue;
        const dx = mx - c.x;
        const dy = my - c.y;
        if (dx * dx + dy * dy < (c.size + 10) ** 2) {
            collectContact(c);
            break;
        }
    }
});

// ============ СТАРТ ============
window.addEventListener('resize', resize);
window.startScenario = startScenario;
window.restart = restart;

resize();
animate();