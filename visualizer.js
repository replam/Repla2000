class Visualizer {
    constructor() {
        this.waveformCanvas = document.getElementById('waveformCanvas');
        this.spectrumCanvas = document.getElementById('spectrumCanvas');
        this.waveCtx = this.waveformCanvas.getContext('2d');
        this.specCtx = this.spectrumCanvas.getContext('2d');
        this.resize();
    }

    resize() {
        if (!this.waveformCanvas || !this.spectrumCanvas) return;

        const p1 = this.waveformCanvas.parentElement;
        const p2 = this.spectrumCanvas.parentElement;
        const dpr = window.devicePixelRatio || 1;

        // Waveform
        const rect1 = p1.getBoundingClientRect();
        this.waveformCanvas.width = rect1.width * dpr;
        this.waveformCanvas.height = rect1.height * dpr;
        this.waveCtx.scale(dpr, dpr);
        // Reset CSS width/height to match logic bounds
        this.waveformCanvas.style.width = `${rect1.width}px`;
        this.waveformCanvas.style.height = `${rect1.height}px`;

        // Spectrum
        const rect2 = p2.getBoundingClientRect();
        this.spectrumCanvas.width = rect2.width * dpr;
        this.spectrumCanvas.height = rect2.height * dpr;
        this.specCtx.scale(dpr, dpr);
        this.spectrumCanvas.style.width = `${rect2.width}px`;
        this.spectrumCanvas.style.height = `${rect2.height}px`;
    }

    drawWaveform(dataArray) {
        if (!dataArray) return;
        const ctx = this.waveCtx;

        const w = this.waveformCanvas.width / (window.devicePixelRatio || 1);
        const h = this.waveformCanvas.height / (window.devicePixelRatio || 1);

        ctx.clearRect(0, 0, w, h);
        ctx.lineWidth = 3; // Even thicker luxury line
        ctx.strokeStyle = '#00ff9d';
        ctx.lineJoin = 'round';
        ctx.beginPath();

        const sliceWidth = w * 1.0 / dataArray.length;
        let x = 0;

        // Draw loop for Float32 Data (-1.0 to 1.0)
        for (let i = 0; i < dataArray.length; i++) {
            // Data is already -1 to 1. No need to normalize from 255.
            const v = dataArray[i];

            // Gain: 4x zoom on the wave itself to see details clearly
            // The float data is continuous, so no 'steps' will appear regardless of zoom!
            const y = (h / 2) + (v * (h / 2) * 4.0);

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);

            x += sliceWidth;
        }

        ctx.lineTo(w, h / 2);
        ctx.stroke();
    }

    drawSpectrum(frequencyArray) {
        if (!frequencyArray) return;
        const ctx = this.specCtx;
        const w = this.spectrumCanvas.width / (window.devicePixelRatio || 1);
        const h = this.spectrumCanvas.height / (window.devicePixelRatio || 1);

        ctx.clearRect(0, 0, w, h);

        // Y-Axis: Decibels
        // We leave 20px padding at top for 0dB label
        const topPadding = 20;
        const drawingHeight = h - topPadding;

        ctx.font = '12px Roboto Mono'; // Larger Y-axis font
        ctx.fillStyle = '#888';

        [0, -20, -40, -60, -80, -100].forEach(db => {
            const percent = Math.abs(db) / 100;
            const y = topPadding + (percent * drawingHeight);

            ctx.beginPath();
            ctx.moveTo(45, y); // Start after label
            ctx.lineTo(w, y);
            ctx.stroke();
            ctx.fillText(`${db}dB`, 40, y + 4); // Adjusted text position
        });


        // X-Axis: Frequency Labels
        ctx.textAlign = 'center';
        ctx.font = '14px Roboto Mono'; // Larger X-axis font
        const labels = ['200Hz', '1kHz', '5kHz'];
        const xStart = 45;
        const totalW = w - xStart;

        labels.forEach((lab, i) => {
            const perc = (i + 1) / (labels.length + 1);
            const x = xStart + (totalW * perc);
            ctx.fillText(lab, x, h - 8);

            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.strokeStyle = '#222';
            ctx.stroke();
        });


        // Bars
        const voiceBinCount = frequencyArray.length / 2;
        const xOffset = 45; // Matches new label offset
        const drawWidth = w - xOffset;

        const barWidthRaw = drawWidth / voiceBinCount;
        const barWidth = barWidthRaw > 1 ? barWidthRaw - 1 : barWidthRaw;

        let x = xOffset;

        for (let i = 0; i < voiceBinCount; i++) {
            const value = frequencyArray[i];
            const percent = value / 255;
            const barHeight = percent * drawingHeight;

            ctx.fillStyle = '#00ff00';

            if (barHeight > 0) {
                ctx.fillRect(x, h - barHeight, Math.max(1, barWidth), barHeight);
            }
            x += barWidthRaw;
        }
    }

    drawComparisonSpectrum(canvas, dataA, dataB, nameA, nameB) {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;

        ctx.clearRect(0, 0, w, h);

        // --- Grid & Background ---
        ctx.strokeStyle = '#222';
        ctx.fillStyle = '#666';
        ctx.textAlign = 'right';
        ctx.font = '10px Roboto Mono';

        [-20, -40, -60, -80, -100].forEach(db => {
            const y = (Math.abs(db) / 100) * h;
            ctx.beginPath();
            ctx.moveTo(35, y);
            ctx.lineTo(w, y);
            ctx.stroke();
            ctx.fillText(`${db}dB`, 30, y + 3);
        });

        // Freq Labels X-Axis
        ctx.textAlign = 'center';
        ['200Hz', '1kHz', '5kHz'].forEach((lab, i) => {
            const perc = (i + 1) / 4;
            const x = 35 + ((w - 35) * perc);
            ctx.fillText(lab, x, h - 5);
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        });

        // --- Drawing Function ---
        const drawSet = (data, color, alpha) => {
            if (!data) return;
            // Matches Zoom Logic (35%)
            const count = Math.floor(data.length * 0.35);
            const bWidth = (w - 35) / count;
            let startX = 35;

            ctx.fillStyle = color;
            ctx.globalAlpha = alpha;

            for (let i = 0; i < count; i++) {
                const val = data[i];
                const height = (val / 255) * h;
                ctx.fillRect(startX, h - height, Math.max(1, bWidth - 0.5), height);
                startX += bWidth;
            }
            ctx.globalAlpha = 1.0;
        };

        // --- Logic Selection ---
        if (dataB) {
            // COMPARISON MODE (2 Profiles)
            drawSet(dataB, '#ff0055', 0.6); // Name B (Bottom/Background layer)
            drawSet(dataA, '#00ff00', 0.5); // Name A (Top layer)

            // Legend
            ctx.font = 'bold 14px Roboto Mono';
            ctx.textAlign = 'left';

            // A Legend
            ctx.fillStyle = '#00ff00';
            ctx.fillText(`■ ${nameA}`, 50, 30);

            // B Legend
            ctx.fillStyle = '#ff0055';
            ctx.fillText(`■ ${nameB}`, 50, 50);

        } else {
            // INSPECT MODE (1 Profile)
            drawSet(dataA, '#00eaff', 0.8); // Cyan for single view

            ctx.font = 'bold 16px Roboto Mono';
            ctx.textAlign = 'left';
            ctx.fillStyle = '#00eaff';
            ctx.fillText(`ANALYSIS: ${nameA}`, 50, 30);

            ctx.font = '12px Roboto Mono';
            ctx.fillStyle = '#aaa';
            ctx.fillText("Detailed Frequency Spectrum View", 50, 50);
        }
    }
}

