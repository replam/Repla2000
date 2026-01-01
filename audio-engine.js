class AudioEngine {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.microphoneSource = null;
        this.dataArray = null;
        this.frequencyArray = null;
        this.bufferLength = 0;
        this.isInitialized = false;
    }

    async init() {
        if (this.isInitialized) return true;

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });

            this.analyser = this.audioContext.createAnalyser();
            // Standard resolution for stability
            this.analyser.fftSize = 2048;
            this.analyser.smoothingTimeConstant = 0.8; // Standard smoothing

            this.microphoneSource = this.audioContext.createMediaStreamSource(stream);
            this.microphoneSource.connect(this.analyser);

            this.bufferLength = this.analyser.frequencyBinCount;
            // Float32 for high-res smooth waveform
            this.timeDataArray = new Float32Array(this.bufferLength);
            // Uint8 for Spectrum (Performance & Sufficiency)
            this.frequencyArray = new Uint8Array(this.bufferLength);

            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error("Audio Engine Init Failed:", error);
            alert("Microphone access is required.");
            return false;
        }
    }

    getWaveformData() {
        if (!this.isInitialized) return null;
        this.analyser.getFloatTimeDomainData(this.timeDataArray);
        return this.timeDataArray;
    }

    getSpectrumData() {
        if (!this.isInitialized) return null;
        this.analyser.getByteFrequencyData(this.frequencyArray);
        return this.frequencyArray;
    }

    getFundamentalFrequency() {
        if (!this.isInitialized) return 0;

        const spectrum = this.frequencyArray;
        let maxVal = -1;
        let maxIndex = -1;

        // Human voice range focus (approx 50Hz - 2000Hz)
        // Helps avoid low freq rumble or high hiss
        const sampleRate = this.audioContext.sampleRate;
        const binSize = sampleRate / this.analyser.fftSize;
        const minBin = Math.floor(50 / binSize);
        const maxBin = Math.floor(3000 / binSize); // Expanded slightly

        for (let i = minBin; i < maxBin; i++) {
            if (spectrum[i] > maxVal) {
                maxVal = spectrum[i];
                maxIndex = i;
            }
        }

        // Standard Threshold
        if (maxVal < 30) return 0; // 30/255 is a safe noise floor

        const frequency = maxIndex * binSize;
        return Math.round(frequency);
    }

    getPeakDecibels() {
        if (!this.isInitialized) return -100;

        let maxVal = 0;
        const spectrum = this.frequencyArray;
        for (let i = 0; i < this.bufferLength; i++) {
            if (spectrum[i] > maxVal) maxVal = spectrum[i];
        }

        if (maxVal === 0) return -100;
        // Simple conversion for display
        const db = 20 * Math.log10(maxVal / 255);
        return db.toFixed(1);
    }

    getMusicalNote(frequency) {
        if (frequency <= 0) return "-";
        const noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        const A4 = 440;
        const C0 = A4 * Math.pow(2, -4.75);
        const halfStepsFromC0 = Math.round(12 * Math.log2(frequency / C0));
        const octave = Math.floor(halfStepsFromC0 / 12);
        const noteIndex = halfStepsFromC0 % 12;
        if (noteIndex < 0 || noteIndex >= noteStrings.length) return "-";
        return noteStrings[noteIndex] + octave;
    }

    getVoiceType(frequency) {
        if (frequency < 60) return "Unknown";
        if (frequency < 120) return "Bass";
        if (frequency < 170) return "Baritone";
        if (frequency < 260) return "Tenor";
        if (frequency < 400) return "Alto";
        if (frequency < 800) return "Soprano";
        return "Whistle";
    }
}
