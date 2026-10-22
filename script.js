let currentState = 'STUDY';
let currentCycle = 1;
let timerInterval = null;
const alarmSound = new Audio('alarm_sounds/notif_sfx.mp3');
let sessionSeconds = 25 * 60; 
let timeLeft = sessionSeconds; 
let lastLine = ""; 

const INVISIBLE_PLACEHOLDER = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

const SPRITE_EXPRESSIONS = {
    STUDY: INVISIBLE_PLACEHOLDER,
    BREAK: INVISIBLE_PLACEHOLDER,
    STANDBY: INVISIBLE_PLACEHOLDER,
    BACKGROUND: "" 
};

let studyLines = [];
let customBreakLines = [];    
let customStandbyLines = [];  

const DEFAULT_STUDY_LINES = [
    "Keep pushing! You're doing amazing!",
    "Focus time! Put that phone away!",
    "We're making great progress together!",
    "One step at a time, you've completely got this!",
    "Consistency is key. Keep your eyes on the prize!",
    "Your future self will thank you for the work you're doing right now.",
    "Eliminate the distractions and lock in!",
    "Every small minute adds up to massive success.",
    "Stay curious, stay focused, and keep pushing forward!",
    "Deep breaths. Clear your mind and let's conquer this block!"
];

const breakLines = [
    "Time to stretch! Take a deep breath.",
    "Great work! Let's rest for a bit.",
    "Go grab a glass of water!",
    "Step away from the screen for a minute and rest your eyes.",
    "Fantastic session! Give your brain a well-deserved break.",
    "Stand up, shake out your hands, and loosen those shoulders.",
    "A quick rest now ensures deep focus later!",
    "Resting is just as important as working. Recharge your batteries!",
    "Look out a window and look at something far away for twenty seconds.",
    "Perfect timing. Unwind completely before our next sprint!"
];

const EMOTE_ICONS = { STUDY: "✏️", BREAK: "☕", TALK: "❤️", ALARM: "🚨" };

let minutesDisplay, secondsDisplay, startBtn, pauseBtn, resetBtn, addTimeBtn;
let minUp, minDown, secUp, secDown, indicatorStudy, indicatorStandby, indicatorBreak;
let burgerMenuBtn, settingsSidebar, customDialogueInput, saveDialogueBtn, dialogueBox;
let charSprite, talkBtn, uploaderStandby, uploaderStudy, uploaderBreak, alarmUploader;
let customNameInput, toggleCustomOnlyCheckbox, clearDialogueBtn, characterNametag;
let urlStandby, urlStudy, urlBreak, urlBackground, uploaderBackground, customDialogueType, toggleCharVisibility, characterAvatarZone, timerBox, hardResetCacheBtn;

let isDragging = false;
let startX, startY, initialX, initialY;

document.addEventListener("DOMContentLoaded", function() {

    minutesDisplay = document.getElementById('minutes-display');
    secondsDisplay = document.getElementById('seconds-display');
    startBtn = document.getElementById('start-btn');
    pauseBtn = document.getElementById('pause-btn');
    resetBtn = document.getElementById('reset-btn');
    addTimeBtn = document.getElementById('add-time-btn');
    minUp = document.getElementById('min-up');
    minDown = document.getElementById('min-down');
    secUp = document.getElementById('sec-up');
    secDown = document.getElementById('sec-down');
    indicatorStudy = document.getElementById('indicator-study');
    indicatorStandby = document.getElementById('indicator-standby');
    indicatorBreak = document.getElementById('indicator-break');
    burgerMenuBtn = document.getElementById('burger-menu-btn');
    settingsSidebar = document.getElementById('settings-sidebar');
    customDialogueInput = document.getElementById('custom-dialogue-input');
    saveDialogueBtn = document.getElementById('save-dialogue-btn');
    dialogueBox = document.getElementById('dialogue-box');
    charSprite = document.getElementById('char-sprite');
    talkBtn = document.getElementById('talk-btn');
    uploaderStandby = document.getElementById('uploader-standby');
    uploaderStudy = document.getElementById('uploader-study');
    uploaderBreak = document.getElementById('uploader-break');
    alarmUploader = document.getElementById('alarm-uploader');
    customNameInput = document.getElementById('custom-name-input');
    toggleCustomOnlyCheckbox = document.getElementById('toggle-custom-only-checkbox');
    clearDialogueBtn = document.getElementById('clear-dialogue-btn');
    characterNametag = document.getElementById('character-nametag');
    urlStandby = document.getElementById('url-standby');
    urlStudy = document.getElementById('url-study');
    urlBreak = document.getElementById('url-break');
    urlBackground = document.getElementById('url-background');
    uploaderBackground = document.getElementById('uploader-background');
    customDialogueType = document.getElementById('custom-dialogue-type');
    toggleCharVisibility = document.getElementById('toggle-char-visibility');
    characterAvatarZone = document.querySelector('.character-avatar-zone');
    timerBox = document.querySelector('.timer-box');
    hardResetCacheBtn = document.getElementById('hard-reset-cache-btn');

    initApp();
    loadUserDataFromCache(); 
    
    if (customNameInput && customNameInput.value.trim() !== "") {
        characterNametag.textContent = customNameInput.value.trim();
    }
    
    setupEventListeners(); 
    updateUI();
});

// Strip giant Base64 strings to prevent exceeding the browser's 5MB LocalStorage limit

function saveUserDataToCache() {
    try {
        const storageDump = {
            customDialoguePool: studyLines,
            customBreakPool: customBreakLines,       
            customStandbyPool: customStandbyLines,   
            expressionsRegistry: SPRITE_EXPRESSIONS,
            cachedAlarmTrack: alarmSound.src !== window.location.href + 'alarm_sounds/notif_sfx.mp3' ? alarmSound.src : null,
            avatarVisibleSetting: toggleCharVisibility.checked,
            customOnlySetting: toggleCustomOnlyCheckbox.checked
        };
        localStorage.setItem('pomChan_user_memory', JSON.stringify(storageDump));
    } catch (error) {
        console.warn("Storage warning: Your uploaded assets might be too large for LocalStorage limits.", error);
    }
}

function loadUserDataFromCache() {
    const cachedData = localStorage.getItem('pomChan_user_memory');
    if (!cachedData) return;

    try {
        const parsedMemory = JSON.parse(cachedData);
        
        const pools = { customDialoguePool: studyLines, customBreakPool: customBreakLines, customStandbyPool: customStandbyLines };
        Object.entries(pools).forEach(([key, activeList]) => {
            activeList.length = 0;
            if (parsedMemory[key]?.length > 0) activeList.push(...parsedMemory[key]);
        });
        
        if (parsedMemory.expressionsRegistry) Object.assign(SPRITE_EXPRESSIONS, parsedMemory.expressionsRegistry);
        if (parsedMemory.cachedAlarmTrack) { alarmSound.src = parsedMemory.cachedAlarmTrack; alarmSound.load(); }
        
        if (parsedMemory.hasOwnProperty('avatarVisibleSetting')) {
            toggleCharVisibility.checked = parsedMemory.avatarVisibleSetting;
            characterAvatarZone.classList.toggle('avatar-hidden', !toggleCharVisibility.checked);
        }

        if (parsedMemory.hasOwnProperty('customOnlySetting')) toggleCustomOnlyCheckbox.checked = parsedMemory.customOnlySetting;

        // FIXED: Input value population lives securely inside the bootstrap initialization loop ONLY
        if (SPRITE_EXPRESSIONS.STANDBY.toLowerCase().startsWith('https')) urlStandby.value = SPRITE_EXPRESSIONS.STANDBY;
        if (SPRITE_EXPRESSIONS.STUDY.toLowerCase().startsWith('https')) urlStudy.value = SPRITE_EXPRESSIONS.STUDY;
        if (SPRITE_EXPRESSIONS.BREAK.toLowerCase().startsWith('https')) urlBreak.value = SPRITE_EXPRESSIONS.BREAK;
        if (SPRITE_EXPRESSIONS.BACKGROUND.toLowerCase().startsWith('https')) urlBackground.value = SPRITE_EXPRESSIONS.BACKGROUND;

        
    } catch (error) {
        console.error("Failed to parse cached memory tree:", error);
    }
}

function speak(type) {
    let chosenLine = "";
    let pool = [];

    if (type === 'STUDY_MOTIVATION') {
        pool = toggleCustomOnlyCheckbox.checked ? studyLines : DEFAULT_STUDY_LINES.concat(studyLines);
    } else if (type === 'BREAK_TIME') {
        pool = toggleCustomOnlyCheckbox.checked ? customBreakLines : breakLines.concat(customBreakLines);
    } else if (type === 'STANDBY_TIME') {
        pool = toggleCustomOnlyCheckbox.checked ? customStandbyLines : ["Standing by! Let's get to work whenever you're ready!"].concat(customStandbyLines);
    }

    if (pool.length === 0) {
        dialogueBox.textContent = "... (Add lines in settings!)";
        return;
    }

    do {
        chosenLine = pool[Math.floor(Math.random() * pool.length)];
    } while (chosenLine === lastLine && pool.length > 1);

    lastLine = chosenLine;
    dialogueBox.textContent = chosenLine;
}

function updateUI() {
    let minutes = Math.floor(timeLeft / 60);
    let seconds = timeLeft % 60;

    if (document.activeElement !== minutesDisplay) {
        minutesDisplay.textContent = minutes < 10 ? '0' + minutes : minutes;
    }
    if (document.activeElement !== secondsDisplay) {
        secondsDisplay.textContent = seconds < 10 ? '0' + seconds : seconds;
    }

    indicatorStudy.classList.remove('active');
    indicatorStandby.classList.remove('active');
    indicatorBreak.classList.remove('active');

    if (currentState === 'STUDY') {
        indicatorStudy.classList.add('active');
        charSprite.src = SPRITE_EXPRESSIONS.STUDY;
        charSprite.className = timerInterval !== null ? 'fx-shake' : 'fx-idle';
    } else if (currentState === 'STANDBY') {
        indicatorStandby.classList.add('active');
        charSprite.src = SPRITE_EXPRESSIONS.STANDBY;
        charSprite.className = 'fx-idle';
    } else if (currentState === 'BREAK') {
        indicatorBreak.classList.add('active');
        charSprite.src = SPRITE_EXPRESSIONS.BREAK;
        charSprite.className = 'fx-idle';
    }

    if (SPRITE_EXPRESSIONS.BACKGROUND !== "") {
        document.body.style.backgroundImage = `url('${SPRITE_EXPRESSIONS.BACKGROUND}')`;
    } else {
        document.body.style.backgroundImage = "none";
    }
}
  
function tick() {
    if (timeLeft > 0) {
        timeLeft--;
        updateUI();
        if (currentState === 'STUDY' && timeLeft % 300 === 0 && timeLeft !== sessionSeconds) {
            speak('STUDY_MOTIVATION'); spawnFloatingEmote(EMOTE_ICONS.STUDY); triggerCharacterAnimation('fx-bounce');
        }
    } else {
        clearInterval(timerInterval); timerInterval = null;
        currentState = currentState === 'STUDY' ? 'BREAK' : 'STUDY';
        alarmSound.currentTime = 0; alarmSound.play();
        startBtn.textContent = currentState === 'BREAK' ? "START BREAK" : "RESUME STUDY";
        speak(currentState === 'BREAK' ? 'BREAK_TIME' : 'STUDY_MOTIVATION');
        spawnFloatingEmote(EMOTE_ICONS.ALARM); triggerCharacterAnimation('fx-bounce'); updateUI();
    }
}

function triggerCharacterAnimation(anim) {
    if (anim === 'fx-shake' || anim === 'fx-idle') { charSprite.className = anim; return; }
    charSprite.classList.remove('fx-bounce', 'fx-shake', 'fx-idle');
    void charSprite.offsetWidth; charSprite.classList.add(anim); // Force a layout repaint to reliably restart the CSS keyframe animation
    setTimeout(() => {
        charSprite.classList.remove(anim);
        charSprite.className = (currentState === 'STUDY' && timerInterval !== null) ? 'fx-shake' : 'fx-idle';
    }, 500); 
}

function spawnFloatingEmote(emote) {
    const container = document.querySelector('.character-avatar-zone');
    const node = document.createElement('div');
    node.className = 'floating-overlay-fx'; node.textContent = emote; container.appendChild(node);
    node.addEventListener('animationend', () => node.remove());
    setTimeout(() => { if (node.parentNode) node.remove(); }, 1500);
}

function processExpressionUpload(fileInput, stateKey) {
    const files = fileInput.target ? fileInput.target.files : fileInput.files;
    
    if (!files || files.length === 0) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        SPRITE_EXPRESSIONS[stateKey] = e.target.result;
        charSprite.src = e.target.result;
        triggerCharacterAnimation('fx-bounce');
        spawnFloatingEmote("🎭");
        saveUserDataToCache();
        updateUI();
    };
    
    reader.readAsDataURL(files[0]); 
}

function setupEventListeners() {
    startBtn.addEventListener('click', function() {
        if (startBtn.textContent === "START BREAK" || startBtn.textContent === "RESUME STUDY") {
            if (startBtn.textContent === "START BREAK") indicatorBreak.click(); else indicatorStudy.click();
            startBtn.textContent = "START"; return;
        }
        if (timerInterval !== null) return;
        pauseBtn.textContent = "PAUSE"; tick(); timerInterval = setInterval(tick, 1000);
    });

    pauseBtn.addEventListener('click', function() {
        if (timerInterval !== null) { clearInterval(timerInterval); timerInterval = null; pauseBtn.textContent = "RESUME"; }
        else { pauseBtn.textContent = "PAUSE"; tick(); timerInterval = setInterval(tick, 1000); }
    });

    addTimeBtn.addEventListener('click', function() { timeLeft = Math.min(3600, timeLeft + 60); sessionSeconds = Math.max(sessionSeconds, timeLeft); updateUI(); });
    resetBtn.addEventListener('click', function() { clearInterval(timerInterval); timerInterval = null; currentState = 'STUDY'; timeLeft = 25 * 60; sessionSeconds = timeLeft; startBtn.textContent = "START"; pauseBtn.textContent = "PAUSE"; updateUI(); });

    minUp.addEventListener('click', () => { if (timeLeft + 60 <= 3600) { timeLeft += 60; sessionSeconds = timeLeft; updateUI(); } });
    minDown.addEventListener('click', () => { if (timeLeft >= 60) { timeLeft -= 60; sessionSeconds = timeLeft; updateUI(); } });
    secUp.addEventListener('click', () => { if (timeLeft + 1 <= 3600) { timeLeft += 1; sessionSeconds = timeLeft; updateUI(); } });
    secDown.addEventListener('click', () => { if (timeLeft >= 1) { timeLeft -= 1; sessionSeconds = timeLeft; updateUI(); } });

    indicatorStudy.addEventListener('click', () => { currentState = 'STUDY'; timeLeft = 25 * 60; sessionSeconds = timeLeft; updateUI(); });
    indicatorStandby.addEventListener('click', () => { currentState = 'STANDBY'; timeLeft = 0; updateUI(); });
    indicatorBreak.addEventListener('click', () => { currentState = 'BREAK'; timeLeft = 5 * 60; sessionSeconds = timeLeft; updateUI(); });

    burgerMenuBtn.addEventListener('click', () => settingsSidebar.classList.toggle('open'));

    saveDialogueBtn.addEventListener('click', function() {
        let txt = customDialogueInput.value.trim(); if (txt === "") return;
        const type = customDialogueType.value;
        if (type === 'STUDY') studyLines.push(txt); else if (type === 'BREAK') customBreakLines.push(txt); else if (type === 'STANDBY') customStandbyLines.push(txt);
        customDialogueInput.value = ""; saveUserDataToCache(); 
    });

    talkBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (currentState === 'STUDY') { speak('STUDY_MOTIVATION'); spawnFloatingEmote(EMOTE_ICONS.TALK); triggerCharacterAnimation('fx-bounce'); }
        else if (currentState === 'BREAK') { speak('BREAK_TIME'); spawnFloatingEmote(EMOTE_ICONS.BREAK); triggerCharacterAnimation('fx-bounce'); }
        else { speak('STANDBY_TIME'); spawnFloatingEmote(EMOTE_ICONS.TALK); triggerCharacterAnimation('fx-idle'); }
    });

    uploaderStandby.addEventListener('change', () => { currentState = 'STANDBY'; processExpressionUpload(uploaderStandby, 'STANDBY'); });
    uploaderStudy.addEventListener('change', () => { currentState = 'STUDY'; processExpressionUpload(uploaderStudy, 'STUDY'); });
    uploaderBreak.addEventListener('change', () => { currentState = 'BREAK'; processExpressionUpload(uploaderBreak, 'BREAK'); });
    uploaderBackground.addEventListener('change', () => processExpressionUpload(uploaderBackground, 'BACKGROUND'));

     alarmUploader.addEventListener('change', function() {
        const files = alarmUploader.files; 
        if (!files || files.length === 0) return;
        
        const reader = new FileReader(); 
        reader.onload = function(e) { 
            alarmSound.src = e.target.result; 
            alarmSound.load(); 
            saveUserDataToCache(); 
        };

        reader.readAsDataURL(files); 
    });

    urlStandby.addEventListener('change', () => { let u = urlStandby.value.trim(); if(u) { SPRITE_EXPRESSIONS.STANDBY = u; currentState = 'STANDBY'; saveUserDataToCache(); updateUI(); } });
    urlStudy.addEventListener('change', () => { let u = urlStudy.value.trim(); if(u) { SPRITE_EXPRESSIONS.STUDY = u; currentState = 'STUDY'; saveUserDataToCache(); updateUI(); } });
    urlBreak.addEventListener('change', () => { let u = urlBreak.value.trim(); if(u) { SPRITE_EXPRESSIONS.BREAK = u; currentState = 'BREAK'; saveUserDataToCache(); updateUI(); } });
    urlBackground.addEventListener('change', () => { SPRITE_EXPRESSIONS.BACKGROUND = urlBackground.value.trim(); saveUserDataToCache(); updateUI(); });

    customNameInput.addEventListener('input', () => { characterNametag.textContent = customNameInput.value.trim() === "" ? "Pom-chan" : customNameInput.value.trim(); saveUserDataToCache(); });
    toggleCustomOnlyCheckbox.addEventListener('change', () => saveUserDataToCache());
    toggleCharVisibility.addEventListener('change', () => { characterAvatarZone.classList.toggle('avatar-hidden', !toggleCharVisibility.checked); saveUserDataToCache(); });

    clearDialogueBtn.addEventListener('click', function() {
        if (confirm("Clear all custom dialogue strings?")) { studyLines.length = 0; customBreakLines.length = 0; customStandbyLines.length = 0; saveUserDataToCache(); window.location.reload(); }
    });
    hardResetCacheBtn.addEventListener('click', function() {
        if (confirm("🚨 Wipe all memory cache configurations?")) { localStorage.removeItem('pomChan_user_memory'); window.location.reload(); }
    });

    minutesDisplay.addEventListener('keydown', handleKeyMask); secondsDisplay.addEventListener('keydown', handleKeyMask);
    minutesDisplay.addEventListener('blur', () => { let v = parseInt(minutesDisplay.textContent.trim()); if(isNaN(v)) v=0; v=Math.min(60, Math.max(0, v)); timeLeft = (v*60)+(timeLeft%60); sessionSeconds = timeLeft; updateUI(); });
    secondsDisplay.addEventListener('blur', handleSecondsBlur);
    timerBox.addEventListener('mousedown', startDrag); timerBox.addEventListener('touchstart', startDrag, { passive: true });
}

function handleKeyMask(e) {
    if (['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); return; }
    if (!/^[0-9]$/.test(e.key) || (e.target.textContent.length >= 2 && window.getSelection().toString().length === 0)) e.preventDefault();
}

// July 1987 Release Easter Egg: Opens Rick Astley video stream

function handleSecondsBlur() {
    let v = parseInt(secondsDisplay.textContent.trim()); if (isNaN(v)) v = 0;
    let m = Math.floor(timeLeft / 60);
    
    if (m === 19 && v === 87) { 
        window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_blank', 'noopener,noreferrer'); 
        v = 59;
    }
    
    v = Math.min(59, Math.max(0, v)); 
    timeLeft = (m * 60) + v;
    sessionSeconds = timeLeft; 
    updateUI();
}

function startDrag(e) {

    if (window.innerWidth < 768) return;

    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.getAttribute('contenteditable') === 'true') return;
    isDragging = true;

    window.getSelection().removeAllRanges();

    
    const cx = e.type.startsWith('touch') ? e.targetTouches[0].clientX : e.clientX;
    const cy = e.type.startsWith('touch') ? e.targetTouches[0].clientY : e.clientY;
    
    const rect = timerBox.getBoundingClientRect(); 
    startX = cx - rect.left; 
    startY = cy - rect.top;
    
    document.addEventListener('mousemove', dragMove); 
    document.addEventListener('touchmove', dragMove, { passive: false });
    document.addEventListener('mouseup', stopDrag); 
    document.addEventListener('touchend', stopDrag);
}

function dragMove(e) {
    if (!isDragging) return; 
    if (e.cancelable) e.preventDefault();
    
    const cx = e.type.startsWith('touch') ? e.targetTouches[0].clientX : e.clientX;
    const cy = e.type.startsWith('touch') ? e.targetTouches[0].clientY : e.clientY;
    
    timerBox.style.transform = "none"; 
    timerBox.style.margin = "0"; 
    timerBox.style.left = `${cx - startX}px`; 
    timerBox.style.top = `${cy - startY}px`;
}

function stopDrag() { 
    isDragging = false; 
    document.removeEventListener('mousemove', dragMove); 
    document.removeEventListener('touchmove', dragMove); 
}

function initApp() { 
    currentState = 'STUDY'; 
    timeLeft = 25 * 60; 
    sessionSeconds = timeLeft; 
}

document.addEventListener("DOMContentLoaded", () => {
    const yearElement = document.getElementById("year");
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
});