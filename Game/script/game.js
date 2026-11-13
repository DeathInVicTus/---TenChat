import { state, canvasState, SCENARIOS, notify } from './state.js';

// ============ УПРАВЛЕНИЕ ИГРОЙ ============
export function startScenario(index) {
    state.scenario = SCENARIOS[index];
    state.chapter = 0;
    state.sceneIndex = 0;
    state.rep = 0;
    state.energy = 100;
    state.conn = 0;
    state.flags = {};
    state.choices = [];
    canvasState.orbitMode = false;

    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('endScreen').classList.add('hidden');
    document.getElementById('hud').classList.remove('d-none');
    document.getElementById('chapterBadge').classList.remove('d-none');
    document.getElementById('heroName').textContent = state.scenario.name;

    updateHUD();
    playScene();
}

export function updateHUD() {
    document.getElementById('statRep').textContent = state.rep;
    document.getElementById('statEnergy').textContent = state.energy;
    document.getElementById('statConn').textContent = state.conn;

    const total = state.scenario.chapters.length;
    const pct = (state.chapter / total) * 100;
    document.getElementById('chapterBar').style.width = pct + '%';
    document.getElementById('chapterLabel').textContent = `Глава ${state.chapter + 1} из ${total}`;
    document.getElementById('chapterIcon').textContent = state.scenario.icon;
    document.getElementById('chapterName').textContent = state.scenario.chapters[state.chapter].title;
}

export function playScene() {
    const chapter = state.scenario.chapters[state.chapter];
    updateHUD();

    if (chapter.type === 'minigame') renderMinigame(chapter);
    else if (chapter.type === 'orbit') startOrbitPhase(chapter);
    else if (chapter.type === 'ending') showEnding(chapter);
    else renderDialogScene(chapter);
}

export function nextChapter() {
    state.chapter++;
    if (state.chapter >= state.scenario.chapters.length) finishGame();
    else playScene();
}

// ============ ДИАЛОГОВАЯ СЦЕНА ============
function renderDialogScene(chapter) {
    const container = document.getElementById('sceneContainer');
    const narration = typeof chapter.narration === 'function' ? chapter.narration() : chapter.narration;

    container.innerHTML = `
        <div class="scene-location">${chapter.location}</div>
        <div class="scene-title">${chapter.title}</div>
        <div class="narration" id="narrationText"></div>
        ${chapter.dialog ? `
        <div class="dialog-box">
            <div class="avatar">${chapter.dialog.emoji}</div>
            <div class="dialog-content">
                <div class="speaker-name">${chapter.dialog.name}</div>
                <div class="dialog-text" id="dialogText"></div>
            </div>
        </div>` : ''}
        <div class="choices" id="choicesContainer" style="display:none;"></div>
        <div style="text-align:right;">
            <button class="continue-btn" id="continueBtn">Далее →</button>
        </div>
    `;
    document.getElementById('sceneScreen').classList.remove('hidden');

    typewriter('narrationText', narration, 15, () => {
        if (chapter.dialog) typewriter('dialogText', chapter.dialog.text, 20, () => showChoices(chapter));
        else showChoices(chapter);
    });
    document.getElementById('continueBtn').style.display = 'none';
}

function showChoices(chapter) {
    const container = document.getElementById('choicesContainer');
    container.innerHTML = '';
    chapter.choices.forEach((choice, i) => {
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.innerHTML = `${choice.text}<span class="choice-hint">${choice.hint}</span>`;
        btn.onclick = () => makeChoice(chapter, i);
        container.appendChild(btn);
    });
    container.style.display = 'flex';
}

function makeChoice(chapter, index) {
    const choice = chapter.choices[index];
    choice.effect();
    state.choices.push({ chapter: state.chapter, choice: index });

    const container = document.getElementById('choicesContainer');
    Array.from(container.children).forEach((btn, i) => {
        if (i === index) {
            btn.style.background = 'rgba(255,165,0,0.3)';
            btn.style.borderColor = '#FFA500';
        } else {
            btn.style.opacity = '0.3';
            btn.style.pointerEvents = 'none';
        }
    });
    updateHUD();
    setTimeout(() => {
        document.getElementById('sceneScreen').classList.add('hidden');
        nextChapter();
    }, 1200);
}

// ============ ПЕЧАТНАЯ МАШИНКА ============
function typewriter(elementId, text, speed, callback) {
    const el = document.getElementById(elementId);
    if (!el) { if (callback) callback(); return; }
    el.textContent = '';
    el.classList.add('typewriter');
    let i = 0;
    const interval = setInterval(() => {
        if (i < text.length) { el.textContent += text[i]; i++; }
        else {
            clearInterval(interval);
            el.classList.remove('typewriter');
            if (callback) callback();
        }
    }, speed);

    el.onclick = () => {
        clearInterval(interval);
        el.textContent = text;
        el.classList.remove('typewriter');
        el.onclick = null;
        if (callback) callback();
    };
}

// ============ МИНИ-ИГРА ============
function renderMinigame(chapter) {
    const container = document.getElementById('sceneContainer');
    const shuffled = [...chapter.cards].sort(() => Math.random() - 0.5);

    container.innerHTML = `
        <div class="scene-location">${chapter.location}</div>
        <div class="scene-title">${chapter.title}</div>
        <div class="mg-instruction">${chapter.instruction}</div>
        <div class="minigame-grid" id="mgGrid"></div>
        <div style="text-align:center;margin-top:20px;">
            <div class="small opacity-75 mb-2" id="mgCounter">Выбрано: 0 / ${chapter.required}</div>
            <button class="continue-btn" id="mgSubmit" disabled>Подтвердить выбор</button>
        </div>
    `;
    document.getElementById('sceneScreen').classList.remove('hidden');

    const grid = document.getElementById('mgGrid');
    const selected = new Set();
    const order = [];

    shuffled.forEach((card, i) => {
        const el = document.createElement('div');
        el.className = 'mg-card';
        el.innerHTML = `
            <div class="mg-emoji">${card.emoji}</div>
            <div class="mg-title">${card.title}</div>
            <div class="mg-desc">${card.desc}</div>
        `;
        el.onclick = () => {
            if (chapter.ordered) {
                if (selected.has(i)) {
                    selected.delete(i);
                    el.classList.remove('selected');
                    const idx = order.indexOf(i);
                    order.splice(idx, 1);
                } else if (selected.size < chapter.required) {
                    selected.add(i);
                    order.push(i);
                    el.classList.add('selected');
                    el.dataset.order = order.length;
                }
            } else {
                if (selected.has(i)) {
                    selected.delete(i);
                    el.classList.remove('selected');
                } else if (selected.size < chapter.required) {
                    selected.add(i);
                    el.classList.add('selected');
                }
            }
            document.getElementById('mgCounter').textContent = `Выбрано: ${selected.size} / ${chapter.required}`;
            document.getElementById('mgSubmit').disabled = selected.size !== chapter.required;
        };
        grid.appendChild(el);
    });

    document.getElementById('mgSubmit').onclick = () => {
        let score = 0;
        selected.forEach(i => { if (shuffled[i].good) score++; });

        let ordered = false;
        if (chapter.ordered) {
            ordered = true;
            for (let k = 0; k < order.length; k++) {
                if (shuffled[order[k]].order !== k + 1) { ordered = false; break; }
            }
        }
        chapter.onComplete(score, ordered);
        updateHUD();
        setTimeout(() => {
            document.getElementById('sceneScreen').classList.add('hidden');
            nextChapter();
        }, 1500);
    };
}

// ============ ОРБИТАЛЬНАЯ ФАЗА ============
export function startOrbitPhase(chapter) {
    document.getElementById('sceneScreen').classList.add('hidden');
    canvasState.orbitMode = true;
    canvasState.orbitData = {
        chapter: chapter,
        collected: 0,
        orbitRadius: 80,
        targetOrbitRadius: 80,
        contacts: [],
        threads: [],
        particles: [],
        bgFrom: "#0a0e27",
        bgTo: "#0a3d5c"
    };

    const count = chapter.contacts.length;
    for (let i = 0; i < count; i++) {
        const c = chapter.contacts[i];
        canvasState.orbitData.contacts.push({
            ...c,
            angle: (Math.PI * 2 / count) * i + Math.random() * 0.5,
            orbitR: 180 + Math.random() * 120,
            speed: 0.003 + Math.random() * 0.004,
            x: 0, y: 0,
            collected: false,
            pulse: Math.random() * Math.PI * 2,
            size: 28
        });
    }

    document.getElementById('orbitHint').classList.remove('d-none');
    document.getElementById('orbitHint').textContent = '💡 ' + chapter.hint;
}

export function collectContact(c) {
    c.collected = true;
    if (c.good) {
        canvasState.orbitData.collected++;
        state.conn++;
        state.rep += 5;
        canvasState.orbitData.targetOrbitRadius = 80 + canvasState.orbitData.collected * 40;
        notify(`+1 связь: ${c.label}`, "good");
        canvasState.orbitData.threads.push({
            targetX: c.x, targetY: c.y,
            color: c.color, progress: 0, contact: c
        });
    } else {
        state.energy -= 5;
        notify(`Лишнее. −5 энергии`, "bad");
    }

    for (let i = 0; i < 30; i++) {
        canvasState.orbitData.particles.push({
            x: c.x, y: c.y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 1, color: c.color,
            size: Math.random() * 3 + 1
        });
    }
    updateHUD();
    if (canvasState.orbitData.collected >= canvasState.orbitData.chapter.goal) {
        setTimeout(finishOrbitPhase, 1200);
    }
}

function finishOrbitPhase() {
    canvasState.orbitMode = false;
    document.getElementById('orbitHint').classList.add('d-none');
    document.getElementById('sceneScreen').classList.add('hidden');
    nextChapter();
}

// ============ КОНЦОВКА ============
function showEnding(chapter) {
    const ending = chapter.computeEnding();
    document.getElementById('resultIcon').textContent = ending.icon;
    document.getElementById('resultTitle').textContent = ending.title;
    document.getElementById('resultText').textContent = ending.text;
    document.getElementById('finalRep').textContent = state.rep;
    document.getElementById('finalConn').textContent = state.conn;
    document.getElementById('finalEnd').textContent = ending.grade;
    document.getElementById('hud').classList.add('d-none');
    document.getElementById('chapterBadge').classList.add('d-none');
    document.getElementById('endScreen').classList.remove('hidden');
}

function finishGame() {
    const lastChapter = state.scenario.chapters[state.scenario.chapters.length - 1];
    if (lastChapter.type === 'ending') showEnding(lastChapter);
    else document.getElementById('endScreen').classList.remove('hidden');
}

export function restart() {
    document.getElementById('endScreen').classList.add('hidden');
    document.getElementById('startScreen').classList.remove('hidden');
    canvasState.orbitMode = false;
    canvasState.orbitData = null;
}