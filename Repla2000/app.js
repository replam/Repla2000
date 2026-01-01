document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const stopBtn = document.getElementById('stopBtn');
    const resetBtn = document.getElementById('resetBtn');
    const saveBtn = document.getElementById('saveBtn');
    const statusIndicator = document.getElementById('status-indicator');
    const statusText = statusIndicator.querySelector('.status-text');

    // Metrics
    const dominantFreqDisplay = document.getElementById('dominantFreq');
    const peakDbDisplay = document.getElementById('peakDecibel');
    const noteDisplay = document.getElementById('musicalNote');
    const noteFreqDetail = document.getElementById('noteFreqDetail');
    const noteDbDetail = document.getElementById('noteDbDetail');

    const audioEngine = new AudioEngine();
    const visualizer = new Visualizer();

    let animationId;
    let isRunning = false;
    let isPaused = false;
    let lastTime = 0;

    // Session Stats
    let sessionStats = {
        freqSum: 0,
        freqCount: 0,
        dbSum: 0,
        dbCount: 0,
        maxDb: -100,
        voiceTyping: {},
        maxHoldSpectrum: new Uint8Array(1024)
    };

    function resetSession() {
        sessionStats = {
            freqSum: 0,
            freqCount: 0,
            dbSum: 0,
            dbCount: 0,
            maxDb: -100,
            voiceTyping: {},
            maxHoldSpectrum: new Uint8Array(audioEngine.analyser ? audioEngine.analyser.frequencyBinCount : 1024)
        };
    }

    // Voice Descriptions Map
    const voiceDescriptions = {
        "Bass": "Deep, Authoritative & Resonant",
        "Baritone": "Rich, Warm & Smooth",
        "Tenor": "Bright, Clear & Balanced",
        "Alto": "Dynamic, Expressive & Range",
        "Soprano": "High, Piercing & Brilliant",
        "Whistle": "Ultra-High Frequency",
        "Unknown": "Indeterminate Range"
    };

    // --- Core Loops & Functions ---

    function loop(timestamp) {
        if (!isRunning) return;

        // 1. Get Data
        const wave = audioEngine.getWaveformData();
        const spec = audioEngine.getSpectrumData();

        // 2. Draw Graphs
        visualizer.drawWaveform(wave);
        visualizer.drawSpectrum(spec);

        // 3. Logic & Stats
        if (spec) {
            for (let i = 0; i < spec.length; i++) {
                if (spec[i] > sessionStats.maxHoldSpectrum[i]) {
                    sessionStats.maxHoldSpectrum[i] = spec[i];
                }
            }
        }

        // 4. Update Text Metrics (Throttle: 10FPS)
        if (timestamp - lastTime > 100) {
            const freq = audioEngine.getFundamentalFrequency();
            const db = parseFloat(audioEngine.getPeakDecibels());
            const note = audioEngine.getMusicalNote(freq);

            if (freq > 0) {
                dominantFreqDisplay.innerHTML = `${freq} <span class="unit">Hz</span>`;
                noteDisplay.innerText = note;
                if (noteFreqDetail) noteFreqDetail.innerText = freq;
                if (noteDbDetail) noteDbDetail.innerText = db.toFixed(1);

                sessionStats.freqSum += freq;
                sessionStats.freqCount++;
                const vType = audioEngine.getVoiceType(freq);
                sessionStats.voiceTyping[vType] = (sessionStats.voiceTyping[vType] || 0) + 1;

                if (db > -100) {
                    sessionStats.dbSum += db;
                    sessionStats.dbCount++;
                }
            } else {
                dominantFreqDisplay.innerHTML = `0 <span class="unit">Hz</span>`;
                noteDisplay.innerText = "-";
                if (noteFreqDetail) noteFreqDetail.innerText = "0";
                if (noteDbDetail) noteDbDetail.innerText = "-";
            }

            peakDbDisplay.innerHTML = `${db.toFixed(1)} <span class="unit">dB</span>`;
            if (db > sessionStats.maxDb) sessionStats.maxDb = db;

            lastTime = timestamp;
        }

        animationId = requestAnimationFrame(loop);
    }

    async function startApp() {
        if (isPaused) {
            togglePause();
            return;
        }

        const ready = await audioEngine.init();
        if (!ready) return;

        if (audioEngine.audioContext.state === 'suspended') {
            await audioEngine.audioContext.resume();
        }

        resetSession();

        startBtn.disabled = true;
        pauseBtn.disabled = false;
        stopBtn.disabled = false;
        saveBtn.disabled = true;

        statusIndicator.classList.remove('paused');
        statusIndicator.classList.add('active');
        statusText.textContent = "LISTENING";

        isRunning = true;
        isPaused = false;
        visualizer.resize();
        loop();
    }

    function togglePause() {
        if (!isRunning && !isPaused) return;

        if (isPaused) {
            // RESUME
            isPaused = false;
            audioEngine.audioContext.resume();
            statusIndicator.classList.remove('paused');
            statusIndicator.classList.add('active');
            statusText.textContent = "LISTENING";
            pauseBtn.innerHTML = '<span class="btn-icon">⏸</span> PAUSE';
            loop();
        } else {
            // PAUSE
            isPaused = true;
            cancelAnimationFrame(animationId);
            audioEngine.audioContext.suspend();

            statusIndicator.classList.remove('active');
            statusIndicator.classList.add('paused');
            statusText.textContent = "PAUSED";
            pauseBtn.innerHTML = '<span class="btn-icon">▶</span> RESUME';
        }
    }

    function stopApp() {
        isRunning = false;
        isPaused = false;
        if (animationId) cancelAnimationFrame(animationId);

        if (audioEngine.audioContext) {
            audioEngine.audioContext.suspend();
        }

        startBtn.disabled = false;
        pauseBtn.disabled = true;
        stopBtn.disabled = true;
        saveBtn.disabled = false;

        pauseBtn.innerHTML = '<span class="btn-icon">⏸</span> PAUSE';

        statusIndicator.classList.remove('active');
        statusIndicator.classList.remove('paused');
        statusText.textContent = "ANALYSIS COMPLETE";
    }

    function resetApp() {
        stopApp();
        resetSession();

        dominantFreqDisplay.innerHTML = `0 <span class="unit">Hz</span>`;
        peakDbDisplay.innerHTML = `- <span class="unit">dB</span>`;
        if (noteDisplay) noteDisplay.innerText = `-`;

        const wCtx = visualizer.waveCtx;
        const sCtx = visualizer.specCtx;
        const w = visualizer.waveformCanvas.width;
        const h = visualizer.waveformCanvas.height;

        wCtx.clearRect(0, 0, w, h);
        sCtx.clearRect(0, 0, w, h);

        statusText.textContent = "SYSTEM RESET";

        resetBtn.style.background = "var(--accent-blue)";
        setTimeout(() => resetBtn.style.background = "", 200);
    }

    // --- Events ---
    startBtn.addEventListener('click', startApp);
    pauseBtn.addEventListener('click', togglePause);
    stopBtn.addEventListener('click', stopApp);
    resetBtn.addEventListener('click', resetApp);
    window.addEventListener('resize', () => visualizer.resize());

    // --- Saving Logic ---
    const saveModal = document.getElementById('saveModal');
    const closeModal = document.querySelector('.close-modal');
    const confirmSaveBtn = document.getElementById('confirmSaveBtn');
    const subjectNameInput = document.getElementById('subjectName');

    // Previews
    const pType = document.getElementById('previewVoiceType');
    const pFreq = document.getElementById('previewFreq');
    const pDb = document.getElementById('previewDb');

    saveBtn.addEventListener('click', () => {
        saveModal.classList.remove('hidden');
        const avg = sessionStats.freqCount > 0 ? Math.round(sessionStats.freqSum / sessionStats.freqCount) : 0;

        let bestType = "Unknown";
        let maxC = 0;
        for (let [t, c] of Object.entries(sessionStats.voiceTyping)) {
            if (c > maxC) { maxC = c; bestType = t; }
        }

        pType.innerText = bestType;
        pFreq.innerText = avg;
        pDb.innerText = sessionStats.maxDb.toFixed(1);
    });

    closeModal.addEventListener('click', () => saveModal.classList.add('hidden'));

    confirmSaveBtn.addEventListener('click', () => {
        const name = subjectNameInput.value || "Anonymous";
        const avg = sessionStats.freqCount > 0 ? Math.round(sessionStats.freqSum / sessionStats.freqCount) : 0;
        const avgDb = sessionStats.dbCount > 0 ? (sessionStats.dbSum / sessionStats.dbCount).toFixed(1) : -100;

        const bestType = pType.innerText;
        const description = voiceDescriptions[bestType] || "Standard Voice Profile";

        const profile = {
            id: Date.now(),
            name: name,
            voiceType: bestType,
            description: description,
            avgFreq: avg,
            avgDb: avgDb,
            maxDb: sessionStats.maxDb.toFixed(1),
            date: new Date().toLocaleString(),
            spectrumData: Array.from(sessionStats.maxHoldSpectrum)
        };

        const profiles = JSON.parse(localStorage.getItem('voiceApp_profiles') || '[]');
        profiles.unshift(profile);
        localStorage.setItem('voiceApp_profiles', JSON.stringify(profiles));

        saveModal.classList.add('hidden');
        subjectNameInput.value = "";
        renderProfiles();
    });

    // --- Profile & Comparison Logic ---
    const profilesList = document.getElementById('profilesList');
    const compareModal = document.getElementById('compareModal');
    const closeCompare = document.querySelector('.close-compare');
    const compareCanvas = document.getElementById('comparisonCanvas');

    if (closeCompare) closeCompare.addEventListener('click', () => compareModal.classList.add('hidden'));

    function renderProfiles() {
        const profiles = JSON.parse(localStorage.getItem('voiceApp_profiles') || '[]');
        let html = '';

        if (profiles.length >= 2) {
            html += `<div style="width:100%; text-align:right; margin-bottom:10px;">
                <button id="compareBtn" class="premium-btn">COMPARE SELECTED (0)</button>
            </div>`;
        }

        if (profiles.length === 0) {
            profilesList.innerHTML = '<div class="empty-state">No saved analyses.</div>';
        } else {
            html += profiles.map(p => `
                <div class="profile-card">
                    <div class="profile-header">
                        <div style="display:flex; gap:10px; align-items:center;">
                            <input type="checkbox" class="p-check" value="${p.id}">
                            <span class="profile-name">${p.name}</span>
                        </div>
                        <div style="display:flex; gap:10px; align-items:center;">
                            <span class="profile-type">${p.voiceType}</span>
                            <button class="delete-btn" data-id="${p.id}" title="Delete Profile" style="background:none; border:none; color:#666; cursor:pointer; font-size:1.1rem;">&times;</button>
                        </div>
                    </div>
                    <div style="font-size:0.8rem; color:#888; margin-top:5px; font-style:italic;">
                        "${p.description || 'Voice Profile'}"
                    </div>
                    <div class="profile-stats">
                        <div class="stat"><span>AVG PITCH</span>${p.avgFreq} Hz</div>
                        <div class="stat"><span>AVG VOL</span>${p.avgDb || p.maxDb} dB</div>
                    </div>
                    <div class="profile-date">${p.date}</div>
                </div>
            `).join('');
            profilesList.innerHTML = html;
        }

        // --- Event Listeners for Dynamic Elements ---
        const cards = document.querySelectorAll('.profile-card');
        const deleteBtns = document.querySelectorAll('.delete-btn');
        const compBtn = document.getElementById('compareBtn');
        const checks = document.querySelectorAll('.p-check');

        // Card Click
        cards.forEach(card => card.addEventListener('click', (e) => {
            if (e.target.closest('input') || e.target.closest('button')) return;
            const checkbox = card.querySelector('.p-check');
            checkbox.checked = !checkbox.checked;
            checkbox.dispatchEvent(new Event('change'));
        }));

        // Delete Logic
        deleteBtns.forEach(btn => btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            if (confirm("Delete this profile?")) {
                const newProfiles = profiles.filter(p => p.id != id);
                localStorage.setItem('voiceApp_profiles', JSON.stringify(newProfiles));
                renderProfiles();
            }
        }));

        // Compare Button Logic
        if (compBtn) {
            const updateBtn = () => {
                const sel = document.querySelectorAll('.p-check:checked');
                if (sel.length === 1) {
                    compBtn.innerText = `INSPECT SELECTED (1)`;
                    compBtn.style.color = "var(--accent-blue)";
                    compBtn.style.borderColor = "var(--accent-blue)";
                } else {
                    compBtn.innerText = `COMPARE SELECTED (${sel.length})`;
                    compBtn.style.color = "var(--accent-green)";
                    compBtn.style.borderColor = "var(--accent-green)";
                }
            };

            checks.forEach(c => c.addEventListener('change', () => {
                const sel = document.querySelectorAll('.p-check:checked');
                if (sel.length > 2) {
                    c.checked = false;
                    alert("Select max 2 profiles.");
                }
                updateBtn();
            }));

            compBtn.addEventListener('click', () => {
                const sel = document.querySelectorAll('.p-check:checked');
                if (sel.length === 0) {
                    alert("Select at least 1 profile.");
                    return;
                }

                compareModal.classList.remove('hidden');
                setTimeout(() => {
                    compareCanvas.width = compareCanvas.clientWidth;
                    compareCanvas.height = compareCanvas.clientHeight;

                    if (sel.length === 1) {
                        const id = sel[0].value;
                        const p = profiles.find(x => x.id == id);
                        visualizer.drawComparisonSpectrum(compareCanvas, p.spectrumData, null, p.name, null);
                    } else if (sel.length === 2) {
                        const id1 = sel[0].value;
                        const id2 = sel[1].value;
                        const p1 = profiles.find(x => x.id == id1);
                        const p2 = profiles.find(x => x.id == id2);
                        visualizer.drawComparisonSpectrum(compareCanvas, p1.spectrumData, p2.spectrumData, p1.name, p2.name);
                    }
                }, 50);
            });
        }
    }

    // Initial Render
    renderProfiles();
});
