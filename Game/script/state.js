// ============ СОСТОЯНИЕ ИГРЫ ============
export const state = {
    scenario: null,
    chapter: 0,
    sceneIndex: 0,
    rep: 0,
    energy: 100,
    conn: 0,
    flags: {},
    choices: []
};

export const canvasState = {
    W: 0, H: 0, centerX: 0, centerY: 0,
    stars: [],
    orbitMode: false,
    orbitData: null,
    playerPulse: 0
};

export const canvas = document.getElementById('gameCanvas');
export const ctx = canvas.getContext('2d');

export function resize() {
    canvasState.W = canvas.width = window.innerWidth;
    canvasState.H = canvas.height = window.innerHeight;
    canvasState.centerX = canvasState.W / 2;
    canvasState.centerY = canvasState.H / 2;
    if (canvasState.stars.length === 0) initStars();
}

function initStars() {
    canvasState.stars = [];
    for (let i = 0; i < 200; i++) {
        canvasState.stars.push({
            x: Math.random() * canvasState.W,
            y: Math.random() * canvasState.H,
            r: Math.random() * 1.5,
            alpha: Math.random() * 0.8 + 0.2,
            twinkle: Math.random() * 0.02
        });
    }
}

// ============ УВЕДОМЛЕНИЯ ============
export function notify(text, type = '') {
    const el = document.getElementById('notification');
    el.textContent = text;
    el.className = 'notification ' + type;
    setTimeout(() => el.classList.add('show'), 10);
    setTimeout(() => el.classList.remove('show'), 2000);
}

// ============ ДАННЫЕ СЦЕНАРИЕВ ============
export const SCENARIOS = [
    // ===== СЦЕНАРИЙ 1: ФРИЛАНСЕР =====
    {
        name: "Алексей, веб-дизайнер",
        icon: "🎨",
        chapters: [
            {
                location: "Кофейня «Зерно», утро вторника",
                title: "Обычное утро",
                narration: "Ты открываешь ноутбук с кофе. На бирже фриланса — три заказа на логотипы за 3000 рублей. Скучно. Открываешь TenChat — и видишь пост: маркетолог крупного банка делится болью: «Нужен редизайн личного кабинета. Текущий — как привет из 2005-го». Под постом — 47 комментариев. Все — «могу сделать, недорого».",
                dialog: {
                    emoji: "💭",
                    name: "Твои мысли",
                    text: "Так, если написать «могу» — потеряюсь в толпе. А если сделать что-то другое?"
                },
                choices: [
                    {
                        text: "Написать развёрнутый комментарий с 3 конкретными идеями по редизайну",
                        hint: "+15 репутации, −10 энергии",
                        effect: () => { state.rep += 15; state.energy -= 10; state.flags.approach = 'expert'; }
                    },
                    {
                        text: "Сделать у себя в профиле пост-разбор их текущего кабинета с макетами",
                        hint: "+25 репутации, −25 энергии, риск",
                        effect: () => { state.rep += 25; state.energy -= 25; state.flags.approach = 'bold'; }
                    },
                    {
                        text: "Поставить лайк и пройти мимо — сейчас не до этого",
                        hint: "Ничего не меняется",
                        effect: () => { state.flags.approach = 'passive'; }
                    }
                ]
            },
            {
                location: "TenChat, личные сообщения",
                title: "Первый отклик",
                narration: () => {
                    if (state.flags.approach === 'passive') return "Ты пролистал пост. Через час маркетолог сам написал тебе — увидел твой профиль в рекомендациях. Но интерес слабый.";
                    if (state.flags.approach === 'bold') return "Твой пост-разбор набрал 200 репостов. Маркетолог сам написал тебе в личку: «Это было смело. Давайте созвонимся».";
                    return "Маркетолог ответил на твой комментарий: «Интересный подход. Давайте обсудим в личке».";
                },
                dialog: {
                    emoji: "👔",
                    name: "Ирина, директор по маркетингу",
                    text: "Алексей, у нас сжатые сроки — через 2 недели презентация совету директоров. Бюджет есть, но нужен человек, который не подведёт. Расскажите о своём опыте с финтехом."
                },
                choices: [
                    {
                        text: "Честно: «С финтехом не работал, но быстро разберусь. Вот похожие кейсы...»",
                        hint: "+10 репутации (честность ценится)",
                        effect: () => { state.rep += 10; state.flags.honest = true; }
                    },
                    {
                        text: "Приукрасить: «У меня большой опыт в финтехе, вот проекты...»",
                        hint: "Рискованно",
                        effect: () => { state.rep -= 5; state.flags.lied = true; }
                    },
                    {
                        text: "Предложить: «Давайте я за 24 часа сделаю тестовый экран — и вы всё увидите»",
                        hint: "+20 репутации, −15 энергии",
                        effect: () => { state.rep += 20; state.energy -= 15; state.flags.test = true; }
                    }
                ]
            },
            {
                location: "Рабочий стол, ночь",
                title: "Портфолио под давлением",
                type: "minigame",
                instruction: "Собери портфолио для презентации: выбери 3 самых сильных проекта из 6. Подсказка: банки любят надёжность, а не креатив ради креатива.",
                cards: [
                    { emoji: "🏦", title: "Редизайн банка", desc: "Строгий, понятный, +40% конверсии", good: true },
                    { emoji: "🎨", title: "Психоделический лендинг", desc: "Ярко, но не по делу", good: false },
                    { emoji: "📊", title: "Дашборд аналитики", desc: "Сложные данные — просто", good: true },
                    { emoji: "🎮", title: "Игровой интерфейс", desc: "Креативно, но не для банка", good: false },
                    { emoji: "📱", title: "Мобильное приложение", desc: "UX на первом месте", good: true },
                    { emoji: "🛍️", title: "E-commerce с анимациями", desc: "Красиво, но тяжело", good: false }
                ],
                required: 3,
                onComplete: (score) => {
                    if (score === 3) { state.rep += 20; state.flags.portfolio = 'perfect'; notify("Идеальное портфолио! +20 репутации", "good"); }
                    else if (score >= 2) { state.rep += 10; state.flags.portfolio = 'good'; notify("Неплохо. +10 репутации", "good"); }
                    else { state.rep -= 5; state.flags.portfolio = 'bad'; notify("Слабовато...", "bad"); }
                }
            },
            {
                location: "Zoom-встреча",
                title: "Презентация",
                narration: () => {
                    if (state.flags.portfolio === 'perfect') return "Ирина кивает: «Впечатляет. Вижу, вы понимаете нашу специфику».";
                    if (state.flags.portfolio === 'good') return "Ирина смотрит внимательно: «Неплохо, но есть вопросы».";
                    return "Ирина хмурится: «Честно? Не совсем то, что мы ищем».";
                },
                dialog: {
                    emoji: "👔",
                    name: "Ирина",
                    text: "Последний вопрос. Почему вы? На бирже дешевле в три раза."
                },
                choices: [
                    {
                        text: "«Потому что я думаю о бизнес-результате, а не о картинке. Вот как мой редизайн поднял конверсию в прошлом проекте...»",
                        hint: "+15 репутации",
                        effect: () => { state.rep += 15; state.flags.pitch = 'value'; }
                    },
                    {
                        text: "«Готов сделать первый экран бесплатно — если не устроит, не платите»",
                        hint: "+10 репутации, риск",
                        effect: () => { state.rep += 10; state.flags.pitch = 'risk'; }
                    },
                    {
                        text: "«Ну... я просто очень хочу этот проект»",
                        hint: "−10 репутации",
                        effect: () => { state.rep -= 10; state.flags.pitch = 'weak'; }
                    }
                ]
            },
            {
                location: "TenChat, орбита возможностей",
                title: "Собери команду проекта",
                type: "orbit",
                hint: "Кликай по нужным людям: копирайтер, аналитик, разработчик, тестировщик. Не трогай лишних — они отвлекают.",
                goal: 4,
                contacts: [
                    { emoji: "✍️", label: "Копирайтер", color: "#4A90E2", good: true },
                    { emoji: "📊", label: "Аналитик", color: "#FFA500", good: true },
                    { emoji: "💻", label: "Разработчик", color: "#50E3C2", good: true },
                    { emoji: "🧪", label: "Тестировщик", color: "#B87BFF", good: true },
                    { emoji: "🎤", label: "Блогер", color: "#FF6B9D", good: false },
                    { emoji: "📸", label: "Фотограф", color: "#FFD700", good: false },
                    { emoji: "🎵", label: "Музыкант", color: "#FF8C42", good: false }
                ]
            },
            {
                location: "Офис банка, через месяц",
                title: "Итог",
                type: "ending",
                computeEnding: () => {
                    if (state.rep >= 70) return {
                        icon: "🏆", title: "Контракт на год + рекомендация",
                        text: "Ты не просто сделал редизайн — ты стал партнёром банка. Ирина рекомендовала тебя трём своим коллегам из других компаний. Твоя орбита изменилась навсегда.",
                        grade: "S"
                    };
                    if (state.rep >= 40) return {
                        icon: "💼", title: "Контракт на проект",
                        text: "Ты получил проект. Клиент доволен, но до партнёрства ещё далеко. Хороший старт — впереди новые связи.",
                        grade: "A"
                    };
                    return {
                        icon: "📝", title: "Тестовый проект",
                        text: "Получился только маленький тестовый заказ. Но ты понял главное: в TenChat важны не слова, а действия. В следующий раз — получится больше.",
                        grade: "B"
                    };
                }
            }
        ]
    },
    // ===== СЦЕНАРИЙ 2: СТАРТАП =====
    {
        name: "Мария, продакт-менеджер",
        icon: "🚀",
        chapters: [
            {
                location: "Кухня, полночь",
                title: "Идея, которая не даёт спать",
                narration: "Три месяца ты замечаешь одну и ту же проблему: малый бизнес тонет в бумажной отчётности. Ты набросала схему сервиса, который автоматизирует 80% рутины. Идея горит. Но одной идеи мало — нужна команда.",
                dialog: {
                    emoji: "💡",
                    name: "Ты (в заметках)",
                    text: "С чего начать? Написать пост в TenChat? Или сначала найти CTO?"
                },
                choices: [
                    {
                        text: "Написать публичный пост с описанием проблемы и видением решения",
                        hint: "+15 репутации, привлекает внимание",
                        effect: () => { state.rep += 15; state.flags.start = 'public'; }
                    },
                    {
                        text: "Найти CTO в личке и предложить идею один на один",
                        hint: "+10 связей, −10 энергии",
                        effect: () => { state.rep += 10; state.conn += 1; state.flags.start = 'private'; }
                    },
                    {
                        text: "Сначала сделать лендинг и посмотреть, откликнется ли аудитория",
                        hint: "+20 репутации, −20 энергии",
                        effect: () => { state.rep += 20; state.energy -= 20; state.flags.start = 'landing'; }
                    }
                ]
            },
            {
                location: "TenChat, личка",
                title: "Первый союзник",
                narration: () => {
                    if (state.flags.start === 'public') return "Под постом — 30 комментариев. Один из них — от CTO с 10-летним опытом: «Давно думаю о похожем. Давай поговорим».";
                    if (state.flags.start === 'landing') return "Лендинг собрал 500 заявок за неделю. CTO сам написал: «Вижу traction. В деле?»";
                    return "CTO согласился встретиться, но говорит: «Идея интересная, но мне нужно понять твою мотивацию».";
                },
                dialog: {
                    emoji: "💻",
                    name: "Дмитрий, CTO",
                    text: "Мария, я в деле, если ты серьёзно. Но мне нужны ответы: почему ты? Что будет, если не получится? И главное — кто ещё в команде?"
                },
                choices: [
                    {
                        text: "«Я 5 лет в продукте, знаю боль клиентов изнутри. А неудача — это просто урок»",
                        hint: "+15 репутации",
                        effect: () => { state.rep += 15; state.flags.cto = 'strong'; }
                    },
                    {
                        text: "«Честно? Я никогда не запускала стартап. Но я быстро учусь»",
                        hint: "+5 репутации (честность)",
                        effect: () => { state.rep += 5; state.flags.cto = 'honest'; }
                    },
                    {
                        text: "«Не переживай, я всё продумала. Будем как Facebook!»",
                        hint: "−10 репутации",
                        effect: () => { state.rep -= 10; state.flags.cto = 'naive'; }
                    }
                ]
            },
            {
                location: "Рабочий стол",
                title: "Питч за 60 секунд",
                type: "minigame",
                instruction: "Собери питч в правильном порядке: выбери 4 тезиса и расставь их по клику (первый клик — первый слайд). Инвесторы любят: проблема → решение → рынок → команда.",
                cards: [
                    { emoji: "😫", title: "Проблема", desc: "Малый бизнес тонет в отчётности", order: 1 },
                    { emoji: "🤖", title: "Решение", desc: "AI-сервис автоматизирует 80%", order: 2 },
                    { emoji: "💰", title: "Рынок", desc: "3 млн ИП в стране, TAM — 50 млрд", order: 3 },
                    { emoji: "👥", title: "Команда", desc: "Продакт + CTO с опытом", order: 4 },
                    { emoji: "🎨", title: "Дизайн", desc: "Красивые иконки", order: 99 },
                    { emoji: "🌍", title: "Экспансия", desc: "Выход в Европу через год", order: 99 }
                ],
                required: 4,
                ordered: true,
                onComplete: (score, ordered) => {
                    if (score === 4 && ordered) { state.rep += 25; state.flags.pitch = 'perfect'; notify("Идеальный питч! +25 репутации", "good"); }
                    else if (score >= 3) { state.rep += 10; state.flags.pitch = 'good'; notify("Неплохо. +10 репутации", "good"); }
                    else { state.rep -= 5; state.flags.pitch = 'bad'; notify("Слабовато...", "bad"); }
                }
            },
            {
                location: "Коворкинг",
                title: "Встреча с инвестором",
                narration: () => {
                    if (state.flags.pitch === 'perfect') return "Инвестор внимательно слушал, делал пометки. В конце улыбнулся: «Редко вижу такую структуру».";
                    if (state.flags.pitch === 'good') return "Инвестор задал несколько уточняющих вопросов. Интерес есть, но без восторга.";
                    return "Инвестор вежливо кивал, но было видно — не зацепило.";
                },
                dialog: {
                    emoji: "💰",
                    name: "Андрей, бизнес-ангел",
                    text: "Мне нравится команда. Готов дать 5 миллионов на 15%. Но есть условие — я хочу видеть еженедельные метрики. Согласны?"
                },
                choices: [
                    {
                        text: "«Согласны. Более того, давайте обсудим, как вы можете помочь не только деньгами, но и связями»",
                        hint: "+20 репутации, +2 связи",
                        effect: () => { state.rep += 20; state.conn += 2; state.flags.investor = 'smart'; }
                    },
                    {
                        text: "«Давайте, но давайте пересмотрим оценку — 10% за 5 миллионов»",
                        hint: "+10 репутации (торг уместен)",
                        effect: () => { state.rep += 10; state.flags.investor = 'negotiator'; }
                    },
                    {
                        text: "«Ой, да, конечно, мы согласны на всё!»",
                        hint: "−15 репутации",
                        effect: () => { state.rep -= 15; state.flags.investor = 'weak'; }
                    }
                ]
            },
            {
                location: "TenChat, орбита стартапа",
                title: "Собери команду мечты",
                type: "orbit",
                hint: "Кликай по нужным людям: дизайнер, маркетолог, разработчик, продажник, аналитик. Остальные — лишние.",
                goal: 5,
                contacts: [
                    { emoji: "🎨", label: "Дизайнер", color: "#FFA500", good: true },
                    { emoji: "📈", label: "Маркетолог", color: "#50E3C2", good: true },
                    { emoji: "💻", label: "Backend", color: "#4A90E2", good: true },
                    { emoji: "📞", label: "Продажник", color: "#B87BFF", good: true },
                    { emoji: "📊", label: "Аналитик", color: "#FFD700", good: true },
                    { emoji: "🎤", label: "Евангелист", color: "#FF6B9D", good: false },
                    { emoji: "📸", label: "СММ-щик", color: "#FF8C42", good: false }
                ]
            },
            {
                location: "Офис, через 3 месяца",
                title: "Итог",
                type: "ending",
                computeEnding: () => {
                    if (state.rep >= 80) return {
                        icon: "🚀", title: "Pre-seed раунд закрыт!",
                        text: "Андрей не только дал деньги, но и познакомил с тремя крупными клиентами. Сервис запустился, первые 1000 пользователей — за месяц. Твоя орбита — теперь около венчурного мира.",
                        grade: "S"
                    };
                    if (state.rep >= 50) return {
                        icon: "💼", title: "Первые клиенты",
                        text: "Деньги есть, команда собрана, первые клиенты платят. До большой истории ещё далеко, но фундамент заложен.",
                        grade: "A"
                    };
                    return {
                        icon: "🌱", title: "MVP запущен",
                        text: "Пока только MVP и несколько тестовых пользователей. Но ты поняла главное: стартап — это не идея, а сеть людей вокруг неё.",
                        grade: "B"
                    };
                }
            }
        ]
    },
    // ===== СЦЕНАРИЙ 3: ЭКСПЕРТ =====
    {
        name: "Павел, аналитик данных",
        icon: "🎤",
        chapters: [
            {
                location: "Home office",
                title: "Тихий голос",
                narration: "Ты 7 лет работаешь с данными. Знаешь про ML в маркетинге больше, чем 99% рынка. Но о тебе знает — 200 человек в LinkedIn-контактах. А на конференции DataFest в Москве через 2 месяца будут 3000 человек. И спикеры — те, кто погромче, а не поумнее.",
                dialog: {
                    emoji: "🎯",
                    name: "Твоя цель",
                    text: "Стать спикером DataFest. С чего начать?"
                },
                choices: [
                    {
                        text: "Написать серию из 5 глубоких постов в TenChat на тему ML в маркетинге",
                        hint: "+20 репутации, −15 энергии",
                        effect: () => { state.rep += 20; state.energy -= 15; state.flags.strategy = 'content'; }
                    },
                    {
                        text: "Напрямую написать организатору DataFest с предложением темы",
                        hint: "+10 репутации, риск",
                        effect: () => { state.rep += 10; state.flags.strategy = 'direct'; }
                    },
                    {
                        text: "Найти действующего спикера и попросить стать ментором",
                        hint: "+15 связей, +10 репутации",
                        effect: () => { state.rep += 10; state.conn += 1; state.flags.strategy = 'mentor'; }
                    }
                ]
            },
            {
                location: "TenChat, личка",
                title: "Разговор с организатором",
                narration: () => {
                    if (state.flags.strategy === 'content') return "Твои посты заметили. Организатор DataFest написал: «Читал вашу серию. Сильно. Хотите выступить?»";
                    if (state.flags.strategy === 'mentor') return "Ментор представил тебя организатору: «Это Павел, он должен выступить». Двери открылись.";
                    return "Организатор ответил сухо: «Пришлите тему и тезисы. Рассмотрем».";
                },
                dialog: {
                    emoji: "🎪",
                    name: "Олег, организатор DataFest",
                    text: "Павел, у нас жёсткий отбор. Из 200 заявок берём 20. Что вы можете дать аудитории такого, чего не дадут другие?"
                },
                choices: [
                    {
                        text: "«Я покажу 3 реальных кейса, где ML дал x10 к ROI. С цифрами и кодом»",
                        hint: "+20 репутации",
                        effect: () => { state.rep += 20; state.flags.topic = 'cases'; }
                    },
                    {
                        text: "«Я расскажу, почему 90% ML-проектов в маркетинге проваливаются — и как этого избежать»",
                        hint: "+15 репутации (острая тема)",
                        effect: () => { state.rep += 15; state.flags.topic = 'pain'; }
                    },
                    {
                        text: "«Ну... я просто хочу поделиться опытом»",
                        hint: "−10 репутации",
                        effect: () => { state.rep -= 10; state.flags.topic = 'weak'; }
                    }
                ]
            },
            {
                location: "Рабочий стол",
                title: "Заявка на выступление",
                type: "minigame",
                instruction: "Собери структуру выступления: выбери 4 блока в правильном порядке. Формула хита: крючок → боль → решение → призыв.",
                cards: [
                    { emoji: "🎣", title: "Крючок", desc: "Шокирующая цифра в первые 30 сек", order: 1 },
                    { emoji: "😣", title: "Боль", desc: "Проблема, знакомая каждому в зале", order: 2 },
                    { emoji: "💡", title: "Решение", desc: "Твой метод с примерами", order: 3 },
                    { emoji: "📢", title: "Призыв", desc: "Что сделать после выступления", order: 4 },
                    { emoji: "📚", title: "История метода", desc: "Как ты к этому пришёл", order: 99 },
                    { emoji: "🙏", title: "Благодарности", desc: "Спасибо маме и коту", order: 99 }
                ],
                required: 4,
                ordered: true,
                onComplete: (score, ordered) => {
                    if (score === 4 && ordered) { state.rep += 25; state.flags.application = 'perfect'; notify("Заявка принята! +25 репутации", "good"); }
                    else if (score >= 3) { state.rep += 10; state.flags.application = 'good'; notify("Неплохо. +10 репутации", "good"); }
                    else { state.rep -= 5; state.flags.application = 'bad'; notify("Слабовато...", "bad"); }
                }
            },
            {
                location: "Zoom с ментором",
                title: "Репетиция",
                narration: () => {
                    if (state.flags.application === 'perfect') return "Тебя утвердили! Теперь — репетиция. Ментор (действующий спикер) слушает твою речь и качает головой: «Сильно. Но есть нюанс».";
                    if (state.flags.application === 'good') return "Тебя утвердили с оговорками: «Последний слот, утренний. Но шанс есть».";
                    return "Тебя поставили в резерв. Ментор вздыхает: «Давай попробуем выжать максимум из ситуации».";
                },
                dialog: {
                    emoji: "🎓",
                    name: "Елена, топ-спикер",
                    text: "Павел, техника — это 30% успеха. Остальное — как ты держишь зал. Что ты сделаешь, если зададут провокационный вопрос?"
                },
                choices: [
                    {
                        text: "«Отвечу честно: не знаю, но разберусь и вернусь с ответом. И вернусь»",
                        hint: "+15 репутации",
                        effect: () => { state.rep += 15; state.flags.rehearsal = 'honest'; }
                    },
                    {
                        text: "«Превращу вопрос в дискуссию с залом — это всегда работает»",
                        hint: "+10 репутации",
                        effect: () => { state.rep += 10; state.flags.rehearsal = 'interactive'; }
                    },
                    {
                        text: "«Надеюсь, такого не случится...»",
                        hint: "−10 репутации",
                        effect: () => { state.rep -= 10; state.flags.rehearsal = 'scared'; }
                    }
                ]
            },
            {
                location: "TenChat, орбита внимания",
                title: "Собери свою аудиторию",
                type: "orbit",
                hint: "Кликай по тем, кто придёт на твоё выступление: маркетологи, аналитики, продакты, CEO. Избегай случайных — они отвлекают.",
                goal: 5,
                contacts: [
                    { emoji: "📈", label: "Маркетолог", color: "#50E3C2", good: true },
                    { emoji: "📊", label: "Аналитик", color: "#4A90E2", good: true },
                    { emoji: "🎯", label: "Продакт", color: "#FFA500", good: true },
                    { emoji: "👔", label: "CEO", color: "#B87BFF", good: true },
                    { emoji: "💻", label: "CTO", color: "#FFD700", good: true },
                    { emoji: "🎤", label: "Блогер", color: "#FF6B9D", good: false },
                    { emoji: "📸", label: "Журналист", color: "#FF8C42", good: false }
                ]
            },
            {
                location: "DataFest, главная сцена",
                title: "Итог",
                type: "ending",
                computeEnding: () => {
                    if (state.rep >= 80) return {
                        icon: "🎤", title: "Стоячая овация!",
                        text: "Твоё выступление — в топе конференции. Три компании пригласили тебя как консультанта. TenChat взорвался упоминаниями. Твоя орбита — теперь федеральная сцена.",
                        grade: "S"
                    };
                    if (state.rep >= 50) return {
                        icon: "👏", title: "Успешный выход",
                        text: "Зал аплодировал. Несколько человек подошли после с визитками. Ты в радаре отрасли — впереди новые приглашения.",
                        grade: "A"
                    };
                    return {
                        icon: "🌱", title: "Первый шаг сделан",
                        text: "Ты выступил. Не идеально, но ты на сцене. Главное — ты понял, что публичность строится не на одном выступлении, а на сети связей вокруг тебя.",
                        grade: "B"
                    };
                }
            }
        ]
    }
];