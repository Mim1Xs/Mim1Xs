// ============================================================================
//  Mim1Ks.music – Visualizer Script (ПОЛНАЯ ВЕРСИЯ)
//  Включает: темы, favicon, мини-эквалайзер, клик-взрыв, все визуализаторы
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {

    // ========================================================================
    //  0. ДИНАМИЧЕСКАЯ ИКОНКА ВКЛАДКИ (FAVICON)
    // ========================================================================
    function updateFavicon() {
        const link = document.getElementById('dynamic-favicon');
        if (!link) return;

        const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#a855f7';
        const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='45' fill='${accent}'/><circle cx='50' cy='50' r='45' fill='none' stroke='#fff' stroke-opacity='0.5' stroke-width='4'/></svg>`;
        link.href = "data:image/svg+xml," + encodeURIComponent(svg);
    }

    // ========================================================================
    //  1. ИНИЦИАЛИЗАЦИЯ ТЕМ
    // ========================================================================
    const themes = {
        purple: { accent: '#a855f7', accentHover: '#c084fc', rgb: '168, 85, 247' },
        green:  { accent: '#22c55e', accentHover: '#4ade80', rgb: '34, 197, 94' },
        pink:   { accent: '#ff4d94', accentHover: '#ff7ab8', rgb: '255, 77, 148' }
    };

    function applyTheme(themeName) {
        const t = themes[themeName];
        if (!t) return;

        document.documentElement.style.setProperty('--accent', t.accent);
        document.documentElement.style.setProperty('--accent-hover', t.accentHover);
        document.documentElement.style.setProperty('--accent-rgb', t.rgb);
        document.documentElement.classList.toggle('theme-pink', themeName === 'pink');
        localStorage.setItem('mim1ks_theme', themeName);

        const progressFill = document.getElementById('progress-fill');
        if (progressFill) {
            progressFill.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
        }

        updateFavicon();
    }

    function getSavedTheme() {
        return localStorage.getItem('mim1ks_theme') || 'purple';
    }

    applyTheme(getSavedTheme());

    const startThemeBtn = document.getElementById('btn-theme-start');
    if (startThemeBtn) {
        startThemeBtn.addEventListener('click', function() {
            const current = getSavedTheme();
            const next = current === 'purple' ? 'green' : (current === 'green' ? 'pink' : 'purple');
            applyTheme(next);
        });
    }

    // ========================================================================
    //  2. ПОЛУЧЕНИЕ ЭЛЕМЕНТОВ ПЛЕЕРА
    // ========================================================================
    const audioPlayer = document.getElementById('audio-player');
    const canvas = document.getElementById('visualizer');
    const btnPlay = document.getElementById('btn-play');
    const btnNext = document.getElementById('btn-next');
    const btnPrev = document.getElementById('btn-prev');
    const btnPlaylist = document.getElementById('btn-playlist');
    const btnTheme = document.getElementById('btn-theme');
    const btnRepeat = document.getElementById('btn-repeat');
    const btnShuffle = document.getElementById('btn-shuffle');
    const trackTitle = document.getElementById('track-title');
    const trackArtist = document.getElementById('track-artist');
    const panelTrackTitle = document.getElementById('panel-track-title');
    const panelTrackArtist = document.getElementById('panel-track-artist');
    const progressFill = document.getElementById('progress-fill');
    const progressBar = document.getElementById('progress');
    const currentTimeLabel = document.getElementById('current-time');
    const durationLabel = document.getElementById('duration');
    const volumeSlider = document.getElementById('volume-slider');
    const playlistModal = document.getElementById('playlistModal');
    const playlistList = document.getElementById('playlist-list');
    const modeSelector = document.getElementById('mode-selector');
    const waveformCanvas = document.getElementById('waveform-progress');
    const waveformCtx = waveformCanvas ? waveformCanvas.getContext('2d') : null;
    const miniEqCanvas = document.getElementById('mini-eq');
    const miniEqCtx = miniEqCanvas ? miniEqCanvas.getContext('2d') : null;
    const btnFullscreen = document.getElementById('btn-fullscreen');
    const brandLink = document.getElementById('brand-link');
    const btnTogglePanel = document.getElementById('btn-toggle-panel');
    const playerControls = document.getElementById('player-controls');

    if (!audioPlayer || !canvas || !btnPlay || !btnNext || !btnPrev || !btnPlaylist || !btnTheme || !btnRepeat || !btnShuffle ||
        !trackTitle || !trackArtist || !panelTrackTitle || !panelTrackArtist ||
        !progressFill || !progressBar || !currentTimeLabel || !durationLabel ||
        !volumeSlider || !playlistModal || !playlistList || !modeSelector || !waveformCanvas || !btnFullscreen || !brandLink || !btnTogglePanel || !playerControls || !miniEqCanvas) {
        return;
    }

    // ========================================================================
    //  3. ПЕРЕМЕННЫЕ
    // ========================================================================
    const ctx = canvas.getContext('2d');
    let audioContext = null;
    let analyser = null;
    let dataArray = null;
    let timeDataArray = null;
    let smoothedData = null;
    let animationId = null;
    let isPlaying = false;
    let currentMode = 0;
    const modes = [
        'Bars', 'Circle', 'Pulse', 'Tunnel', 'Ribbon', 'Burst', 'Aurora', 'Bloom',
        'Rubik', 'Starburst', 'Hexagon', 'Lissajous', 'Vortex', 'Mosaic',
        'Cosmos', 'Spiral', 'Waves3D'
    ];

    let allTracks = [];
    let currentTrackIndex = -1;
    let sampleRate = 44100;
    let repeatActive = false;
    let shuffleActive = false;
    let playedIndexes = [];

    let tunnelAngle = 0;
    let auroraTime = 0;
    let bloomTime = 0;
    let rubikAngleX = 0;
    let rubikAngleY = 0;
    let rubikAngleZ = 0;
    let rubikLayerRotations = [0, 0, 0, 0, 0, 0];
    let starburstTime = 0;
    let hexagonTime = 0;
    let lissajousTime = 0;
    let vortexTime = 0;
    let mosaicTime = 0;
    let cosmosTime = 0;
    let spiralTime = 0;
    let waves3DTime = 0;

    let isLabOpen = false;
    let labCanvasesReady = false;
    let peakHold = -Infinity;
    let flashAlpha = 0;
    let flashRgb = '168, 85, 247';
    let waveformPeaks = [];
    let smoothCurrentTime = 0;
    let bgParticles = [];
    let clickParticles = [];
    let brandHoldTimer = null;
    let isFading = false;
    let fadeInterval = null;

    const minecraftGlyphs = ['ᔑ', 'ʖ', '╎', 'ℸ', '∴', '∷', 'ᒷ', 'リ', '⍑', '⎓', '⋮', 'ᒲ', 'ᒷ', '⍊', 'ᒷ', '∷'];
    let originalCenterTitle = '';
    let originalPanelTitle = '';
    let randomGlitchInterval = null;
    let fullGlitchInterval = null;
    let fullGlitchInProgress = false;

    const btnLab = document.getElementById('btn-lab');
    const labSection = document.getElementById('lab-section');
    const btnCloseLab = document.getElementById('btn-close-lab');
    const labTooltip = document.getElementById('lab-tooltip');
    const labWaveform = document.getElementById('lab-waveform');
    const labSpectrum = document.getElementById('lab-spectrum');
    const labOscilloscope = document.getElementById('lab-oscilloscope');
    const labVector = document.getElementById('lab-vector');
    const labVolume = document.getElementById('lab-volume');
    const labLR = document.getElementById('lab-lr');
    const dataWaveform = document.getElementById('data-waveform');
    const dataSpectrum = document.getElementById('data-spectrum');
    const dataOscilloscope = document.getElementById('data-oscilloscope');
    const dataVector = document.getElementById('data-vector');
    const dataVolume = document.getElementById('data-volume');
    const dataLR = document.getElementById('data-lr');
    let currentTheme = getSavedTheme();

    // ========================================================================
    //  4. ФУНКЦИИ СОСТОЯНИЯ
    // ========================================================================
    function saveState() {
        localStorage.setItem('mim1ks_theme', currentTheme);
        localStorage.setItem('mim1ks_mode', currentMode);
        localStorage.setItem('mim1ks_volume', audioPlayer.volume);
    }

    function loadState() {
        const savedTheme = localStorage.getItem('mim1ks_theme');
        const savedMode = localStorage.getItem('mim1ks_mode');
        const savedVolume = localStorage.getItem('mim1ks_volume');
        if (savedTheme) currentTheme = savedTheme;
        if (savedMode !== null) currentMode = parseInt(savedMode);
        if (savedVolume !== null) audioPlayer.volume = parseFloat(savedVolume);
        volumeSlider.value = audioPlayer.volume;
    }

    // ========================================================================
    //  5. РАЗМЕРЫ И ВЕЙВФОРМА
    // ========================================================================
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function resizeWaveformCanvas() {
        if (waveformCanvas) {
            waveformCanvas.width = window.innerWidth;
            waveformCanvas.height = 30;
            drawWaveformProgress();
        }
    }

    function resizeMiniEq() {
        if (miniEqCanvas) {
            miniEqCanvas.width = window.innerWidth;
            miniEqCanvas.height = 30;
        }
    }

    function resizeLabCanvases() {
        const canvases = [labWaveform, labSpectrum, labOscilloscope, labVector, labVolume, labLR];
        canvases.forEach(c => {
            if (c) {
                c.width = c.parentElement ? c.parentElement.clientWidth || 300 : 300;
                c.height = 200;
            }
        });
    }

    // ========================================================================
    //  6. ЗАГРУЗКА ВЕЙВФОРМЫ
    // ========================================================================
    async function loadWaveform(url) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
            const channelData = audioBuffer.getChannelData(0);
            const peaks = [];
            const samplesPerPixel = Math.floor(channelData.length / waveformCanvas.width);

            for (let i = 0; i < waveformCanvas.width; i++) {
                let min = 1, max = -1;
                for (let j = 0; j < samplesPerPixel; j++) {
                    const idx = i * samplesPerPixel + j;
                    if (idx < channelData.length) {
                        const val = channelData[idx];
                        if (val < min) min = val;
                        if (val > max) max = val;
                    }
                }
                peaks.push({ min, max });
            }

            waveformPeaks = peaks;
            drawWaveformProgress();
        } catch (e) {
            console.error('Не удалось загрузить вейвформу:', e);
            waveformPeaks = [];
            drawWaveformProgress();
        }
    }

    // ========================================================================
    //  ПРОГРЕСС-БАР (волна повторяет форму, прогресс заполняет ярким цветом)
    // ========================================================================
    function drawWaveformProgress() {
        if (!waveformCtx || !waveformCanvas || !waveformPeaks.length) return;

        const width = waveformCanvas.width;
        const height = waveformCanvas.height;
        waveformCtx.clearRect(0, 0, width, height);

        const accentRgb = getAccentRgb();
        const currentTime = smoothCurrentTime || 0;
        const duration = audioPlayer.duration || 0;
        const progressRatio = duration > 0 ? currentTime / duration : 0;
        const progressX = progressRatio * width;

        waveformCtx.fillStyle = `rgba(${accentRgb}, 0.25)`;
        for (let i = 0; i < waveformPeaks.length; i++) {
            const x = i;
            let barHeight = Math.abs(waveformPeaks[i].max - waveformPeaks[i].min) * height * 0.8;
            if (barHeight < 2) barHeight = 2;
            const y = (height - barHeight) / 2;
            waveformCtx.fillRect(x, y, 1, barHeight);
        }

        waveformCtx.fillStyle = `rgba(${accentRgb}, 1)`;
        for (let i = 0; i < waveformPeaks.length; i++) {
            if (i >= progressX) break;
            let barHeight = Math.abs(waveformPeaks[i].max - waveformPeaks[i].min) * height * 0.8;
            if (barHeight < 2) barHeight = 2;
            const y = (height - barHeight) / 2;
            waveformCtx.fillRect(i, y, 1, barHeight);
        }
    }

    function getAccent() {
        return getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
    }

    function getAccentRgb() {
        return getComputedStyle(document.documentElement).getPropertyValue('--accent-rgb').trim();
    }

    // ========================================================================
    //  7. ЗАГРУЗКА ТРЕКОВ
    // ========================================================================
    function loadTracks() {
        fetch('/api/tracks')
            .then(response => {
                if (!response.ok) throw new Error('Ошибка сервера');
                return response.json();
            })
            .then(tracks => {
                allTracks = tracks;
                playedIndexes = [];
                if (allTracks.length > 0) {
                    currentTrackIndex = Math.floor(Math.random() * allTracks.length);
                    loadTrackByIndex(currentTrackIndex, false);
                    btnPrev.disabled = false;
                } else {
                    trackTitle.textContent = 'Нет треков';
                    trackArtist.textContent = '';
                    panelTrackTitle.textContent = 'Нет треков';
                    panelTrackArtist.textContent = '';
                }
            })
            .catch(error => {
                console.error('Ошибка загрузки:', error);
                trackTitle.textContent = 'Ошибка загрузки';
                trackArtist.textContent = 'Проверьте сервер';
                panelTrackTitle.textContent = 'Ошибка загрузки';
                panelTrackArtist.textContent = '';
            });
    }

    function loadTrackByIndex(index, fade = true) {
        if (index < 0 || index >= allTracks.length) return;
        if (fade && isPlaying) {
            fadeOutAndChange(index);
        } else {
            setTrack(index);
        }
    }

    function setTrack(index) {
        currentTrackIndex = index;
        const track = allTracks[index];
        audioPlayer.src = track.audio_url;
        trackTitle.textContent = track.title;
        panelTrackTitle.textContent = track.title;
        trackArtist.textContent = track.artist;
        panelTrackArtist.textContent = track.artist;
        btnPlay.disabled = false;
        audioPlayer.load();
        progressFill.style.width = '0%';
        currentTimeLabel.textContent = '0:00';
        durationLabel.textContent = '0:00';
        loadWaveform(track.audio_url);
        if (isPlaying) audioPlayer.play();
        document.title = `${track.title} - ${track.artist}`;
        originalCenterTitle = track.title;
        originalPanelTitle = track.title;
        startGlitchIntervals();
    }

    function fadeOutAndChange(newIndex) {
        if (isFading) return;
        isFading = true;
        let volume = audioPlayer.volume;
        fadeInterval = setInterval(() => {
            volume -= 0.05;
            if (volume <= 0) {
                clearInterval(fadeInterval);
                fadeInterval = null;
                isFading = false;
                setTrack(newIndex);
                let fadeInInterval = setInterval(() => {
                    volume += 0.05;
                    audioPlayer.volume = Math.min(volumeSlider.value, volume);
                    if (volume >= volumeSlider.value) clearInterval(fadeInInterval);
                }, 100);
            } else {
                audioPlayer.volume = volume;
            }
        }, 100);
    }

    function getRandomTrackIndex() {
        if (allTracks.length === 0) return -1;
        if (playedIndexes.length >= allTracks.length) playedIndexes = [];
        let randomIndex;
        do {
            randomIndex = Math.floor(Math.random() * allTracks.length);
        } while (playedIndexes.includes(randomIndex));
        playedIndexes.push(randomIndex);
        return randomIndex;
    }

    function nextTrack() {
        if (allTracks.length === 0) return;
        if (shuffleActive) {
            const nextIndex = getRandomTrackIndex();
            loadTrackByIndex(nextIndex, false);
        } else {
            let nextIndex = currentTrackIndex + 1;
            if (nextIndex >= allTracks.length) {
                if (repeatActive) loadTrackByIndex(currentTrackIndex, false);
                else { nextIndex = 0; loadTrackByIndex(nextIndex, false); }
            } else {
                loadTrackByIndex(nextIndex, false);
            }
        }
    }

    function prevTrack() {
        if (allTracks.length === 0) return;
        let prevIndex = currentTrackIndex - 1;
        if (prevIndex < 0) prevIndex = allTracks.length - 1;
        loadTrackByIndex(prevIndex, false);
    }

    // ========================================================================
    //  ФУНКЦИЯ УЛУЧШЕНИЯ ЗВУКА (ВСТАВКА: Эквалайзер + Компрессор)
    // ========================================================================
    function initAudioContext() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            sampleRate = audioContext.sampleRate;
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 512;
            const source = audioContext.createMediaElementSource(audioPlayer);
            
            // 1. Эквалайзер (приподнимаем низы и верха)
            const eqHigh = audioContext.createBiquadFilter();
            eqHigh.type = 'highshelf';
            eqHigh.frequency.value = 8000;
            eqHigh.gain.value = 2; // +2 дБ к высоким

            const eqLow = audioContext.createBiquadFilter();
            eqLow.type = 'lowshelf';
            eqLow.frequency.value = 200;
            eqLow.gain.value = 3; // +3 дБ к басам

            // 2. Компрессор (делает громкость ровной и плотной)
            const compressor = audioContext.createDynamicsCompressor();
            compressor.threshold.value = -24;
            compressor.knee.value = 30;
            compressor.ratio.value = 12;
            compressor.attack.value = 0.003;
            compressor.release.value = 0.25;

            // Соединяем цепочку: источник -> эквалайзер -> компрессор -> анализатор -> динамики
            source.connect(eqHigh);
            eqHigh.connect(eqLow);
            eqLow.connect(compressor);
            compressor.connect(analyser);
            
            analyser.connect(audioContext.destination);
            dataArray = new Uint8Array(analyser.frequencyBinCount);
            timeDataArray = new Uint8Array(analyser.fftSize);
            smoothedData = new Float32Array(analyser.frequencyBinCount);
            for (let i = 0; i < smoothedData.length; i++) smoothedData[i] = 0;
        }
    }

    // ========================================================================
    //  8. ГЛИТЧ-ЭФФЕКТЫ
    // ========================================================================
    function startGlitchIntervals() {
        if (randomGlitchInterval) clearInterval(randomGlitchInterval);
        if (fullGlitchInterval) clearInterval(fullGlitchInterval);

        randomGlitchInterval = setInterval(() => {
            if (!isPlaying || fullGlitchInProgress) return;
            applyRandomLetterGlitch();
        }, 7000);

        fullGlitchInterval = setInterval(() => {
            if (!isPlaying || fullGlitchInProgress) return;
            fullGlitchInProgress = true;
            runFullGlitchSequence().finally(() => { fullGlitchInProgress = false; });
        }, 20000);
    }

    function applyRandomLetterGlitch() {
        const pos = Math.floor(Math.random() * originalCenterTitle.length);
        const glyph = minecraftGlyphs[Math.floor(Math.random() * minecraftGlyphs.length)];
        const glitched = originalCenterTitle.substring(0, pos) + glyph + originalCenterTitle.substring(pos + 1);
        trackTitle.textContent = glitched;
        panelTrackTitle.textContent = glitched;

        setTimeout(() => {
            trackTitle.textContent = originalCenterTitle;
            panelTrackTitle.textContent = originalPanelTitle;
        }, 200);
    }

    async function runFullGlitchSequence() {
        const centerEl = trackTitle;
        const panelEl = panelTrackTitle;

        for (let cycle = 0; cycle < 3; cycle++) {
            centerEl.textContent = generateGlitchText(originalCenterTitle);
            panelEl.textContent = generateGlitchText(originalPanelTitle);
            await sleep(50);
        }

        centerEl.classList.add('glitch-blur-strong');
        panelEl.classList.add('glitch-blur-strong');
        await sleep(300);

        for (let i = 0; i < originalCenterTitle.length; i++) {
            centerEl.textContent = originalCenterTitle.substring(0, i + 1) + generateGlitchText(originalCenterTitle.substring(i + 1));
            panelEl.textContent = originalPanelTitle.substring(0, i + 1) + generateGlitchText(originalPanelTitle.substring(i + 1));
            await sleep(30);
        }

        centerEl.textContent = originalCenterTitle;
        panelEl.textContent = originalPanelTitle;
        centerEl.classList.remove('glitch-blur-strong');
        panelEl.classList.remove('glitch-blur-strong');
    }

    function generateGlitchText(original) {
        if (!original) return '';
        let result = '';
        for (let i = 0; i < original.length; i++) {
            result += minecraftGlyphs[Math.floor(Math.random() * minecraftGlyphs.length)];
        }
        return result;
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ========================================================================
    //  9. ФОНОВЫЕ ЧАСТИЦЫ И ГЛАВНЫЙ ЦИКЛ
    // ========================================================================
    function drawBackgroundParticles() {
        const accentRgb = getAccentRgb();
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length / 255;
        for (let p of bgParticles) {
            p.phase += p.speed;
            p.x += p.vx + Math.sin(p.phase) * 0.3;
            p.y += p.vy + Math.cos(p.phase) * 0.3;
            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;
            const alpha = 0.1 + avg * 0.6;
            ctx.fillStyle = `rgba(${accentRgb}, ${alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius * (0.8 + avg * 0.5), 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function spawnClickParticles(x, y) {
        for (let i = 0; i < 40; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 8;
            clickParticles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                decay: 0.01 + Math.random() * 0.03,
                size: 1 + Math.random() * 3
            });
        }
    }

    function drawClickParticles() {
        for (let i = clickParticles.length - 1; i >= 0; i--) {
            const p = clickParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;
            if (p.life <= 0) {
                clickParticles.splice(i, 1);
                continue;
            }
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${getAccentRgb()}, ${p.life})`;
            ctx.fill();
        }
    }

    function drawMiniEq() {
        if (!miniEqCtx || !miniEqCanvas) return;
        const width = miniEqCanvas.width;
        const height = miniEqCanvas.height;
        miniEqCtx.clearRect(0, 0, width, height);
        const barCount = 32;
        const barWidth = width / barCount;
        for (let i = 0; i < barCount; i++) {
            const index = Math.floor(i / barCount * dataArray.length);
            const amp = dataArray[index] / 255;
            const barHeight = amp * height;
            miniEqCtx.fillStyle = `rgba(${getAccentRgb()}, 0.8)`;
            miniEqCtx.fillRect(i * barWidth, height - barHeight, barWidth - 2, barHeight);
        }
    }

    function draw() {
        if (!isPlaying || !analyser) return;
        animationId = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);
        analyser.getByteTimeDomainData(timeDataArray);
        for (let i = 0; i < dataArray.length; i++) smoothedData[i] = smoothedData[i] * 0.7 + dataArray[i] * 0.3;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBackgroundParticles();
        drawClickParticles();

        tunnelAngle += 0.002;
        auroraTime += 0.01;
        bloomTime += 0.02;
        rubikAngleX += 0.01;
        rubikAngleY += 0.015;
        rubikAngleZ += 0.008;
        starburstTime += 0.02;
        hexagonTime += 0.015;
        lissajousTime += 0.02;
        vortexTime += 0.02;
        mosaicTime += 0.01;
        cosmosTime += 0.01;
        spiralTime += 0.015;
        waves3DTime += 0.015;

        // Вращение отдельных слоёв кубика в зависимости от громкости
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length / 255;
        if (avg > 0.2) rubikLayerRotations[0] += 0.05;
        if (avg > 0.4) rubikLayerRotations[1] += 0.06;
        if (avg > 0.6) rubikLayerRotations[2] += 0.07;
        if (avg > 0.3) rubikLayerRotations[3] += 0.05;
        if (avg > 0.5) rubikLayerRotations[4] += 0.06;
        if (avg > 0.7) rubikLayerRotations[5] += 0.07;

        smoothCurrentTime += (audioPlayer.currentTime - smoothCurrentTime) * 0.1;
        if (Math.abs(smoothCurrentTime - audioPlayer.currentTime) < 0.01) {
            smoothCurrentTime = audioPlayer.currentTime;
        }
        currentTimeLabel.textContent = formatTime(smoothCurrentTime);
        durationLabel.textContent = formatTime(audioPlayer.duration);
        drawWaveformProgress();
        drawMiniEq();

        switch (currentMode) {
            case 0: drawBars(); break;
            case 1: drawCircle(); break;
            case 2: drawPulse(); break;
            case 3: drawTunnel(); break;
            case 4: drawRibbon(); break;
            case 5: drawBurst(); break;
            case 6: drawAurora(); break;
            case 7: drawBloom(); break;
            case 8: drawRubik(); break;
            case 9: drawStarburst(); break;
            case 10: drawHexagon(); break;
            case 11: drawLissajous(); break;
            case 12: drawVortex(); break;
            case 13: drawMosaic(); break;
            case 14: drawCosmos(); break;
            case 15: drawSpiral(); break;
            case 16: drawWaves3D(); break;
        }

        if (flashAlpha > 0) {
            ctx.fillStyle = `rgba(${flashRgb}, ${flashAlpha})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            flashAlpha -= 0.02;
            if (flashAlpha < 0) flashAlpha = 0;
        }

        if (isLabOpen && labCanvasesReady) drawLabAnalyzers();
    }

    // ==================== ВИЗУАЛИЗАТОРЫ ====================

    function drawBars() {
        const accentRgb = getAccentRgb();
        const barWidth = canvas.width / smoothedData.length * 1.5;
        let x = 0;
        for (let i = 0; i < smoothedData.length; i++) {
            const amp = Math.min(1, smoothedData[i] / 255 * 1.2);
            const barHeight = amp * canvas.height;
            ctx.fillStyle = `rgba(${accentRgb}, ${0.3 + amp * 0.7})`;
            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
            x += barWidth + 1;
        }
    }

    function drawCircle() {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const baseRadius = Math.min(canvas.width, canvas.height) * 0.3;
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length / 255;

        const gradient = ctx.createRadialGradient(centerX, centerY, baseRadius * 0.5, centerX, centerY, baseRadius * 1.5);
        gradient.addColorStop(0, getAccent());
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2 + avg * 2;

        ctx.beginPath();
        const angleStep = (Math.PI * 2) / smoothedData.length;
        for (let i = 0; i < smoothedData.length; i++) {
            const angle = i * angleStep;
            const amp = smoothedData[i] / 255;
            const outerR = baseRadius + amp * baseRadius * 0.8 * Math.min(1, avg * 2);
            const x1 = centerX + Math.cos(angle) * baseRadius;
            const y1 = centerY + Math.sin(angle) * baseRadius;
            const x2 = centerX + Math.cos(angle) * outerR;
            const y2 = centerY + Math.sin(angle) * outerR;
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
        }
        ctx.stroke();
    }

    function drawPulse() {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length / 255;
        const rings = 8;
        for (let i = 0; i < rings; i++) {
            const freqIndex = Math.floor(i / rings * smoothedData.length);
            const amp = smoothedData[freqIndex] / 255;
            const radius = 20 + i * 30 + amp * 30;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(${getAccentRgb()}, ${0.2 + amp * 0.8})`;
            ctx.lineWidth = 2 + amp * 3;
            ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(centerX, centerY, 10, 0, Math.PI * 2);
        ctx.fillStyle = getAccent();
        ctx.fill();
    }

    function drawTunnel() {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const layers = 20;
        for (let i = 0; i < layers; i++) {
            const t = i / layers;
            const freqIndex = Math.floor(t * smoothedData.length);
            const amp = smoothedData[freqIndex] / 255;
            const radius = (1 - t) * Math.min(canvas.width, canvas.height) * 0.5 + amp * 30;
            const rotation = tunnelAngle + i * 0.2;
            ctx.beginPath();
            ctx.ellipse(centerX, centerY, radius, radius * 0.3, rotation, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(${getAccentRgb()}, ${0.1 + amp * 0.6})`;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    function drawRibbon() {
        const points = 200;
        const time = Date.now() * 0.002;
        ctx.beginPath();
        for (let i = 0; i <= points; i++) {
            const t = i / points;
            const freqIndex = Math.floor(t * smoothedData.length);
            const amp = smoothedData[freqIndex] / 255;
            const x = t * canvas.width;
            const y = canvas.height / 2 + Math.sin(t * 10 + time) * amp * 100;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = getAccent();
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    function drawBurst() {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const particlesCount = 200;
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length / 255;
        const angleStep = Math.PI * 2 / particlesCount;
        for (let i = 0; i < particlesCount; i++) {
            const angle = i * angleStep;
            const freqIndex = Math.floor(i / particlesCount * smoothedData.length);
            const amp = smoothedData[freqIndex] / 255;
            const dist = 20 + amp * canvas.width * 0.3;
            const x = centerX + Math.cos(angle) * dist;
            const y = centerY + Math.sin(angle) * dist;
            ctx.fillStyle = `rgba(${getAccentRgb()}, ${0.3 + amp * 0.7})`;
            ctx.beginPath();
            ctx.arc(x, y, 1 + amp * 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawAurora() {
        const layers = 5;
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length / 255;
        for (let l = 0; l < layers; l++) {
            const yBase = canvas.height * (0.2 + l * 0.15);
            const amplitude = canvas.height * 0.1 * (1 + avg) * (0.5 + Math.sin(auroraTime + l));
            ctx.beginPath();
            for (let x = 0; x <= canvas.width; x += 10) {
                const t = x / canvas.width;
                const freqIndex = Math.floor(t * smoothedData.length);
                const amp = smoothedData[freqIndex] / 255;
                const y = yBase + Math.sin(t * 5 + auroraTime * 2 + l) * amplitude * (0.5 + amp);
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.strokeStyle = `rgba(${getAccentRgb()}, ${0.3 + l * 0.1})`;
            ctx.lineWidth = 2 + l;
            ctx.stroke();
        }
    }

    function drawBloom() {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const rays = 24;
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length / 255;
        const maxLength = Math.min(canvas.width, canvas.height) * 0.4;

        for (let i = 0; i < rays; i++) {
            const angle = (i / rays) * Math.PI * 2 + bloomTime * 0.5;
            const freqIndex = Math.floor(i / rays * smoothedData.length);
            const amp = smoothedData[freqIndex] / 255;
            const length = maxLength * (0.2 + amp * 0.8);
            const x1 = centerX + Math.cos(angle) * 10;
            const y1 = centerY + Math.sin(angle) * 10;
            const x2 = centerX + Math.cos(angle) * (10 + length);
            const y2 = centerY + Math.sin(angle) * (10 + length);

            const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
            gradient.addColorStop(0, `rgba(${getAccentRgb()}, ${0.8 + amp * 0.2})`);
            gradient.addColorStop(1, `rgba(${getAccentRgb()}, 0)`);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 2 + amp * 5;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }

        const glowRadius = 20 + avg * 40;
        const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowRadius);
        glowGradient.addColorStop(0, `rgba(${getAccentRgb()}, 1)`);
        glowGradient.addColorStop(1, `rgba(${getAccentRgb()}, 0)`);
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
        ctx.fill();
    }

    // ==================== RUBIK (3D кубик Рубик) ====================
    function drawRubik() {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const size = Math.min(canvas.width, canvas.height) * 0.35;
        const cubeSize = size / 3;
        const gap = cubeSize * 0.05;
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length / 255;
        const accent = getAccent();

        const speed = 0.02 + avg * 0.05;
        rubikAngleX += speed * 0.7;
        rubikAngleY += speed * 1.0;
        rubikAngleZ += speed * 0.5;

        const cosX = Math.cos(rubikAngleX);
        const sinX = Math.sin(rubikAngleX);
        const cosY = Math.cos(rubikAngleY);
        const sinY = Math.sin(rubikAngleY);
        const cosZ = Math.cos(rubikAngleZ);
        const sinZ = Math.sin(rubikAngleZ);

        function project(x, y, z) {
            let y1 = y * cosX - z * sinX;
            let z1 = y * sinX + z * cosX;
            let x1 = x * cosY + z1 * sinY;
            let z2 = -x * sinY + z1 * cosY;
            let x2 = x1 * cosZ - y1 * sinZ;
            let y2 = x1 * sinZ + y1 * cosZ;
            const scale = 600 / (600 + z2);
            return { x: centerX + x2 * scale, y: centerY + y2 * scale, z: z2 };
        }

        function rotateLayer(x, y, z, layerType, angle) {
            if (angle === 0) return { x, y, z };
            let xr = x, yr = y, zr = z;
            const c = Math.cos(angle);
            const s = Math.sin(angle);
            if (layerType === 'x') {
                yr = y * c - z * s;
                zr = y * s + z * c;
            } else if (layerType === 'y') {
                xr = x * c + z * s;
                zr = -x * s + z * c;
            } else {
                xr = x * c - y * s;
                yr = x * s + y * c;
            }
            return { x: xr, y: yr, z: zr };
        }

        const activeLayers = [];
        if (avg > 0.2) activeLayers.push({ type: 'x', index: -1, angle: rubikLayerRotations[0] });
        if (avg > 0.4) activeLayers.push({ type: 'x', index: 0, angle: rubikLayerRotations[1] });
        if (avg > 0.6) activeLayers.push({ type: 'x', index: 1, angle: rubikLayerRotations[2] });
        if (avg > 0.3) activeLayers.push({ type: 'y', index: -1, angle: rubikLayerRotations[3] });
        if (avg > 0.5) activeLayers.push({ type: 'y', index: 0, angle: rubikLayerRotations[4] });
        if (avg > 0.7) activeLayers.push({ type: 'y', index: 1, angle: rubikLayerRotations[5] });

        const cubes = [];
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                for (let z = -1; z <= 1; z++) {
                    let px = x, py = y, pz = z;
                    for (const layer of activeLayers) {
                        if (layer.type === 'x' && px === layer.index) {
                            const r = rotateLayer(px, py, pz, 'x', layer.angle);
                            px = r.x; py = r.y; pz = r.z;
                        } else if (layer.type === 'y' && py === layer.index) {
                            const r = rotateLayer(px, py, pz, 'y', layer.angle);
                            px = r.x; py = r.y; pz = r.z;
                        }
                    }
                    const bx = px * (cubeSize + gap);
                    const by = py * (cubeSize + gap);
                    const bz = pz * (cubeSize + gap);
                    const proj = project(bx, by, bz);
                    cubes.push({ bx, by, bz, z: proj.z });
                }
            }
        }
        cubes.sort((a, b) => a.z - b.z);

        ctx.shadowBlur = 5 + avg * 5;
        ctx.shadowColor = accent;

        for (const cube of cubes) {
            const p1 = project(cube.bx - cubeSize/2, cube.by - cubeSize/2, cube.bz - cubeSize/2);
            const p2 = project(cube.bx + cubeSize/2, cube.by - cubeSize/2, cube.bz - cubeSize/2);
            const p3 = project(cube.bx + cubeSize/2, cube.by + cubeSize/2, cube.bz - cubeSize/2);
            const p4 = project(cube.bx - cubeSize/2, cube.by + cubeSize/2, cube.bz - cubeSize/2);

            const p5 = project(cube.bx - cubeSize/2, cube.by - cubeSize/2, cube.bz + cubeSize/2);
            const p6 = project(cube.bx + cubeSize/2, cube.by - cubeSize/2, cube.bz + cubeSize/2);
            const p7 = project(cube.bx + cubeSize/2, cube.by + cubeSize/2, cube.bz + cubeSize/2);
            const p8 = project(cube.bx - cubeSize/2, cube.by + cubeSize/2, cube.bz + cubeSize/2);

            ctx.fillStyle = accent;
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.moveTo(p5.x, p5.y);
            ctx.lineTo(p6.x, p6.y);
            ctx.lineTo(p7.x, p7.y);
            ctx.lineTo(p8.x, p8.y);
            ctx.closePath();
            ctx.fill();

            ctx.globalAlpha = 0.2;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.lineTo(p6.x, p6.y);
            ctx.lineTo(p5.x, p5.y);
            ctx.closePath();
            ctx.fill();

            ctx.globalAlpha = 0.1;
            ctx.beginPath();
            ctx.moveTo(p2.x, p2.y);
            ctx.lineTo(p3.x, p3.y);
            ctx.lineTo(p7.x, p7.y);
            ctx.lineTo(p6.x, p6.y);
            ctx.closePath();
            ctx.fill();

            ctx.globalAlpha = 0.8;
            ctx.strokeStyle = accent;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.lineTo(p3.x, p3.y);
            ctx.lineTo(p4.x, p4.y);
            ctx.closePath();
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(p5.x, p5.y);
            ctx.lineTo(p6.x, p6.y);
            ctx.lineTo(p7.x, p7.y);
            ctx.lineTo(p8.x, p8.y);
            ctx.closePath();
            ctx.stroke();

            ctx.globalAlpha = 1;
        }
    }

    // ==================== STARBURST ====================
    function drawStarburst() {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length / 255;
        const rays = 24;
        const maxLen = Math.min(canvas.width, canvas.height) * 0.45;
        const time = starburstTime;

        for (let i = 0; i < rays; i++) {
            const angle = (i / rays) * Math.PI * 2 + time * 0.2;
            const freqIndex = Math.floor(i / rays * smoothedData.length);
            const amp = smoothedData[freqIndex] / 255;
            const len = maxLen * (0.2 + amp * 0.8);
            const x1 = centerX + Math.cos(angle) * 10;
            const y1 = centerY + Math.sin(angle) * 10;
            const x2 = centerX + Math.cos(angle) * (10 + len);
            const y2 = centerY + Math.sin(angle) * (10 + len);

            const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
            gradient.addColorStop(0, getAccent());
            gradient.addColorStop(1, `rgba(${getAccentRgb()}, 0)`);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 2 + amp * 4;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();

            ctx.fillStyle = getAccent();
            ctx.beginPath();
            ctx.arc(x2, y2, 2 + amp * 3, 0, Math.PI * 2);
            ctx.fill();
        }

        const glowRadius = 15 + avg * 50;
        const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowRadius);
        glowGradient.addColorStop(0, `rgba(${getAccentRgb()}, 1)`);
        glowGradient.addColorStop(1, `rgba(${getAccentRgb()}, 0)`);
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
        ctx.fill();
    }

    // ==================== HEXAGON ====================
    function drawHexagon() {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length / 255;
        const count = 6;
        const maxRadius = Math.min(canvas.width, canvas.height) * 0.4;

        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + hexagonTime * 0.3;
            const freqIndex = Math.floor(i / count * smoothedData.length);
            const amp = smoothedData[freqIndex] / 255;
            const radius = maxRadius * (0.5 + amp * 0.5);

            ctx.beginPath();
            for (let j = 0; j < 6; j++) {
                const a = (j / 6) * Math.PI * 2 + angle;
                const x = centerX + Math.cos(a) * radius;
                const y = centerY + Math.sin(a) * radius;
                if (j === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.strokeStyle = `rgba(${getAccentRgb()}, ${0.5 + amp * 0.5})`;
            ctx.lineWidth = 2 + amp * 3;
            ctx.stroke();
        }

        const glowRadius = 10 + avg * 30;
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowRadius);
        gradient.addColorStop(0, getAccent());
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
        ctx.fill();
    }

    // ==================== LISSAJOUS ====================
    function drawLissajous() {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length / 255;
        const amplitude = Math.min(canvas.width, canvas.height) * 0.35;
        const points = 300;

        ctx.beginPath();
        for (let i = 0; i <= points; i++) {
            const t = (i / points) * Math.PI * 2;
            const a = 3 + Math.floor(avg * 5);
            const b = 2 + Math.floor(avg * 4);
            const x = centerX + Math.sin(a * t + lissajousTime) * amplitude;
            const y = centerY + Math.cos(b * t + lissajousTime * 0.5) * amplitude;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = getAccent();
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.shadowBlur = 10 + avg * 20;
        ctx.shadowColor = getAccent();
        ctx.stroke();
    }

    // ==================== VORTEX ====================
    function drawVortex() {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length / 255;
        const particlesCount = 150;

        for (let i = 0; i < particlesCount; i++) {
            const t = i / particlesCount;
            const angle = t * Math.PI * 6 + vortexTime;
            const radius = (1 - t) * Math.min(canvas.width, canvas.height) * 0.4 * (0.3 + avg * 0.7);
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            const amp = smoothedData[Math.floor(t * smoothedData.length)] / 255;

            ctx.beginPath();
            ctx.arc(x, y, 1 + amp * 3, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${getAccentRgb()}, ${0.3 + amp * 0.7})`;
            ctx.fill();
        }

        const glowRadius = 10 + avg * 30;
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowRadius);
        gradient.addColorStop(0, getAccent());
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
        ctx.fill();
    }

    // ==================== MOSAIC ====================
    function drawMosaic() {
        const width = canvas.width;
        const height = canvas.height;
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length / 255;
        const gridSize = 20;

        for (let x = 0; x < width; x += gridSize) {
            for (let y = 0; y < height; y += gridSize) {
                const idx = Math.floor((x / width) * smoothedData.length);
                const amp = smoothedData[idx] / 255;
                const brightness = 0.1 + amp * 0.9;
                ctx.fillStyle = `rgba(${getAccentRgb()}, ${brightness})`;
                ctx.fillRect(x, y, gridSize - 1, gridSize - 1);
            }
        }
    }

    // ==================== COSMOS ====================
    let cosmosParticles = [];
    function initCosmos() {
        cosmosParticles = [];
        for (let i = 0; i < 150; i++) {
            cosmosParticles.push({
                baseAngle: Math.random() * Math.PI * 2,
                radius: 0.1 + Math.random() * 0.9,
                speed: 0.001 + Math.random() * 0.004,
                size: 0.5 + Math.random() * 2,
                phase: Math.random() * Math.PI * 2,
                arm: Math.floor(Math.random() * 2)
            });
        }
    }
    initCosmos();

    function drawCosmos() {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const maxRadius = Math.min(canvas.width, canvas.height) * 0.45;
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length / 255;
        const accentRgb = getAccentRgb();

        const fogGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius);
        fogGradient.addColorStop(0, `rgba(${accentRgb}, ${0.1 + avg * 0.2})`);
        fogGradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = fogGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, maxRadius, 0, Math.PI * 2);
        ctx.fill();

        for (let p of cosmosParticles) {
            p.baseAngle += p.speed * (1 + avg * 3);
            const armOffset = p.arm === 0 ? 0 : Math.PI;
            const angle = p.baseAngle + armOffset;
            const r = p.radius * maxRadius;
            const x = centerX + Math.cos(angle) * r;
            const y = centerY + Math.sin(angle) * r;

            const amp = smoothedData[Math.floor(p.radius * smoothedData.length)] / 255;
            const alpha = 0.3 + amp * 0.7;
            const size = p.size * (0.8 + amp * 2);

            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${accentRgb}, ${alpha})`;
            ctx.fill();
        }

        const coreRadius = 20 + avg * 60;
        const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreRadius);
        coreGradient.addColorStop(0, '#fff');
        coreGradient.addColorStop(0.3, getAccent());
        coreGradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
        ctx.fill();
    }

    // ==================== SPIRAL ====================
    function drawSpiral() {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const maxRadius = Math.min(canvas.width, canvas.height) * 0.45;
        const turns = 6;
        const pointsPerTurn = 80;
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length / 255;
        const rotation = spiralTime;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(rotation);
        ctx.beginPath();
        for (let i = 0; i < turns * pointsPerTurn; i++) {
            const t = i / (turns * pointsPerTurn);
            const angle = t * Math.PI * 2 * turns;
            const radius = t * maxRadius;
            const freqIndex = Math.floor(t * smoothedData.length);
            const amp = smoothedData[freqIndex] / 255;
            const r = radius + amp * 20;
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = getAccent();
        ctx.lineWidth = 1.5 + avg * 3;
        ctx.shadowBlur = 10 + avg * 20;
        ctx.shadowColor = getAccent();
        ctx.stroke();
        ctx.restore();
    }

    // ==================== WAVES3D ====================
    function drawWaves3D() {
        const width = canvas.width;
        const height = canvas.height;
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length / 255;
        const numLines = 10;
        const time = waves3DTime;

        for (let l = 0; l < numLines; l++) {
            ctx.beginPath();
            const baseY = height / 2 + (l - numLines / 2) * 20;
            for (let x = 0; x < width; x += 10) {
                const t = x / width;
                const amp = smoothedData[Math.floor(t * smoothedData.length)] / 255;
                const y = baseY + Math.sin(t * 10 + time + l) * 20 * (0.5 + amp);
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.strokeStyle = `rgba(${getAccentRgb()}, ${0.3 + avg * 0.5})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
    }

    // ==================== LAB ====================
    function drawLabAnalyzers() {
        const wfCtx = labWaveform.getContext('2d');
        wfCtx.clearRect(0, 0, labWaveform.width, labWaveform.height);
        wfCtx.fillStyle = '#000';
        wfCtx.fillRect(0, 0, labWaveform.width, labWaveform.height);
        wfCtx.strokeStyle = getAccent();
        wfCtx.lineWidth = 2;
        wfCtx.beginPath();
        const wfStep = labWaveform.width / timeDataArray.length;
        for (let i = 0; i < timeDataArray.length; i++) {
            const x = i * wfStep;
            const y = (timeDataArray[i] / 255) * labWaveform.height;
            if (i === 0) wfCtx.moveTo(x, y);
            else wfCtx.lineTo(x, y);
        }
        wfCtx.stroke();
        dataWaveform.textContent = `Samples: ${timeDataArray.length}`;

        const specCtx = labSpectrum.getContext('2d');
        specCtx.clearRect(0, 0, labSpectrum.width, labSpectrum.height);
        const barWidth = labSpectrum.width / dataArray.length * 2;
        let x = 0;
        let maxAmp = 0;
        for (let i = 0; i < dataArray.length; i++) {
            const barHeight = (dataArray[i] / 255) * labSpectrum.height;
            if (dataArray[i] > maxAmp) maxAmp = dataArray[i];
            specCtx.fillStyle = `rgba(${getAccentRgb()}, 0.7)`;
            specCtx.fillRect(x, labSpectrum.height - barHeight, barWidth, barHeight);
            x += barWidth + 1;
        }
        dataSpectrum.textContent = `Peak: ${maxAmp} dB`;

        const oscCtx = labOscilloscope.getContext('2d');
        oscCtx.clearRect(0, 0, labOscilloscope.width, labOscilloscope.height);
        oscCtx.fillStyle = '#000';
        oscCtx.fillRect(0, 0, labOscilloscope.width, labOscilloscope.height);
        oscCtx.strokeStyle = getAccent();
        oscCtx.lineWidth = 2;
        oscCtx.beginPath();
        const oscStep = labOscilloscope.width / timeDataArray.length;
        for (let i = 0; i < timeDataArray.length; i++) {
            const x = i * oscStep;
            const y = (timeDataArray[i] / 255) * labOscilloscope.height;
            if (i === 0) oscCtx.moveTo(x, y);
            else oscCtx.lineTo(x, y);
        }
        oscCtx.stroke();
        dataOscilloscope.textContent = `Amp: ${(Math.max(...timeDataArray) - Math.min(...timeDataArray)).toFixed(0)}`;

        const vectorCtx = labVector.getContext('2d');
        vectorCtx.clearRect(0, 0, labVector.width, labVector.height);
        vectorCtx.fillStyle = '#000';
        vectorCtx.fillRect(0, 0, labVector.width, labVector.height);
        vectorCtx.strokeStyle = getAccent();
        vectorCtx.beginPath();
        for (let i = 0; i < timeDataArray.length - 1; i += 2) {
            const x = (timeDataArray[i] / 255) * labVector.width;
            const y = (timeDataArray[i+1] / 255) * labVector.height;
            if (i === 0) vectorCtx.moveTo(x, y);
            else vectorCtx.lineTo(x, y);
        }
        vectorCtx.stroke();
        dataVector.textContent = `Corr: 0.87`;

        const volCtx = labVolume.getContext('2d');
        volCtx.clearRect(0, 0, labVolume.width, labVolume.height);
        let sumSquares = 0;
        for (let i = 0; i < timeDataArray.length; i++) {
            const val = (timeDataArray[i] - 128) / 128;
            sumSquares += val * val;
        }
        const rms = Math.sqrt(sumSquares / timeDataArray.length);
        if (rms > peakHold) {
            peakHold = rms;
        } else {
            peakHold = Math.max(0, peakHold - 0.005);
        }
        const volWidth = Math.min(labVolume.width, rms * labVolume.width * 3);
        const peakX = Math.min(labVolume.width, peakHold * labVolume.width * 3);
        volCtx.fillStyle = getAccent();
        volCtx.fillRect(0, labVolume.height/2 - 10, volWidth, 20);
        volCtx.fillStyle = '#fff';
        volCtx.fillRect(peakX - 1, labVolume.height/2 - 15, 2, 30);
        const lufs = (-60 + rms * 40).toFixed(1);
        dataVolume.innerHTML = `
            <span>${lufs} LUFS</span> |
            <span>M: ${(rms * 100).toFixed(0)}</span> |
            <span>S: ${(peakHold * 100).toFixed(0)}</span> |
            <span>INT: 0</span> |
            <span>LRA: 0</span> |
            <span>PK: ${(peakHold * 100).toFixed(0)}</span>
        `;

        const lrCtx = labLR.getContext('2d');
        lrCtx.clearRect(0, 0, labLR.width, labLR.height);
        lrCtx.font = '20px Inter';
        lrCtx.fillStyle = getAccent();
        lrCtx.textAlign = 'left';
        lrCtx.fillText('L', 10, labLR.height/2 - 20);
        lrCtx.fillText('R', 10, labLR.height - 20);
        const half = Math.floor(timeDataArray.length / 2);
        let lSum = 0, rSum = 0;
        for (let i = 0; i < half; i++) {
            lSum += Math.abs(timeDataArray[i] - 128);
            rSum += Math.abs(timeDataArray[half + i] - 128);
        }
        const lAvg = lSum / half / 128;
        const rAvg = rSum / half / 128;
        lrCtx.fillStyle = getAccent();
        lrCtx.fillRect(40, labLR.height/2 - 25, lAvg * (labLR.width - 50), 14);
        lrCtx.fillRect(40, labLR.height - 25, rAvg * (labLR.width - 50), 14);
        dataLR.textContent = `L: ${(lAvg * 100).toFixed(0)}%  R: ${(rAvg * 100).toFixed(0)}%`;
    }

    // ==================== ПОДПИСИ ВИДЖЕТОВ ====================
    function addWidgetTitles() {
        const widgetTitles = {
            'lab-waveform': 'Waveform',
            'lab-spectrum': 'Spectrum',
            'lab-oscilloscope': 'Oscilloscope',
            'lab-vector': 'Vector',
            'lab-volume': 'Volume',
            'lab-lr': 'L/R'
        };
        Object.keys(widgetTitles).forEach(id => {
            const canvas = document.getElementById(id);
            if (canvas) {
                const parent = canvas.parentElement;
                if (parent && !parent.querySelector('.widget-title')) {
                    const title = document.createElement('div');
                    title.className = 'widget-title';
                    title.textContent = widgetTitles[id];
                    parent.insertBefore(title, canvas);
                }
            }
        });
    }
    addWidgetTitles();

    // ==================== TOOLTIPS ====================
    function setupTooltip(canvas, getText) {
        canvas.addEventListener('mousemove', function(e) {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const text = getText(x, y);
            if (text) {
                labTooltip.style.display = 'block';
                labTooltip.style.left = (e.clientX + 10) + 'px';
                labTooltip.style.top = (e.clientY + 10) + 'px';
                labTooltip.textContent = text;
            }
        });
        canvas.addEventListener('mouseleave', function() {
            labTooltip.style.display = 'none';
        });
    }

    setupTooltip(labWaveform, (x) => {
        const index = Math.floor(x / (labWaveform.width / timeDataArray.length));
        if (index >= 0 && index < timeDataArray.length) {
            const time = (index / sampleRate).toFixed(4);
            const amp = timeDataArray[index];
            return `Время: ${time} c, Уровень: ${amp}`;
        }
        return null;
    });

    setupTooltip(labOscilloscope, (x) => {
        const index = Math.floor(x / (labOscilloscope.width / timeDataArray.length));
        if (index >= 0 && index < timeDataArray.length) {
            const time = (index / sampleRate).toFixed(4);
            const amp = timeDataArray[index];
            return `Время: ${time} c, Уровень: ${amp}`;
        }
        return null;
    });

    setupTooltip(labVector, (x, y) => `X: ${x.toFixed(0)}, Y: ${y.toFixed(0)}`);

    // ========================================================================
    //  9. СЕКРЕТНЫЙ РЕЖИМ
    // ========================================================================
    brandLink.addEventListener('mousedown', function() {
        brandHoldTimer = setTimeout(() => {
            if (brandLink.style.filter) {
                brandLink.style.filter = '';
                return;
            }
            brandLink.style.filter = 'blur(5px) brightness(1.5)';
            flashAlpha = 0.6;
            flashRgb = getAccentRgb();
        }, 3000);
    });
    brandLink.addEventListener('mouseup', function() {
        clearTimeout(brandHoldTimer);
        brandLink.style.filter = '';
    });
    brandLink.addEventListener('mouseleave', function() {
        clearTimeout(brandHoldTimer);
        brandLink.style.filter = '';
    });

    // ========================================================================
    //  10. ОБРАБОТЧИКИ СОБЫТИЙ
    // ========================================================================
    btnPlay.addEventListener('click', function() {
        if (!audioPlayer.src) return;
        if (audioPlayer.paused) {
            if (!audioContext) initAudioContext();
            audioPlayer.play();
        } else {
            audioPlayer.pause();
        }
    });

    btnNext.addEventListener('click', nextTrack);
    btnPrev.addEventListener('click', prevTrack);

    btnRepeat.addEventListener('click', function() {
        repeatActive = !repeatActive;
        btnRepeat.classList.toggle('active', repeatActive);
    });
    btnShuffle.addEventListener('click', function() {
        shuffleActive = !shuffleActive;
        btnShuffle.classList.toggle('active', shuffleActive);
        playedIndexes = [];
    });

    btnFullscreen.addEventListener('click', function() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    });

    if (btnLab && labSection && btnCloseLab) {
        btnLab.addEventListener('click', function() {
            isLabOpen = !isLabOpen;
            labCanvasesReady = isLabOpen;
            labSection.classList.toggle('active', isLabOpen);
            btnLab.classList.toggle('active', isLabOpen);
            if (isLabOpen) {
                resizeLabCanvases();
                if (!isPlaying) drawLabAnalyzers();
                setTimeout(() => labSection.scrollIntoView({ behavior: 'smooth' }), 100);
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });

        btnCloseLab.addEventListener('click', function() {
            isLabOpen = false;
            labCanvasesReady = false;
            labSection.classList.remove('active');
            btnLab.classList.remove('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        document.querySelectorAll('.widget-close').forEach(btn => {
            btn.addEventListener('click', function() {
                const widgetName = this.dataset.widget;
                const widget = document.getElementById('widget-' + widgetName);
                if (widget) {
                    widget.style.display = 'none';
                    const checkbox = document.querySelector(`.widget-toggle input[data-widget="${widgetName}"]`);
                    if (checkbox) checkbox.checked = false;
                }
            });
        });

        document.querySelectorAll('.widget-toggle input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', function() {
                const widgetName = this.dataset.widget;
                const widget = document.getElementById('widget-' + widgetName);
                if (widget) {
                    widget.style.display = this.checked ? 'flex' : 'none';
                }
            });
        });
    }

    btnPlaylist.addEventListener('click', function() {
        fetch('/api/tracks')
            .then(r => r.json())
            .then(tracks => {
                playlistList.innerHTML = '';
                tracks.forEach((track, index) => {
                    const li = document.createElement('li');
                    li.className = 'list-group-item bg-transparent d-flex justify-content-between align-items-center';
                    li.innerHTML = `<div><strong>${track.title}</strong><br><small class="text-muted">${track.artist}</small></div>
                                    <button class="btn btn-sm load-track-btn" data-index="${index}">▶</button>`;
                    playlistList.appendChild(li);
                });
                document.querySelectorAll('.load-track-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        loadTrackByIndex(parseInt(this.dataset.index));
                        bootstrap.Modal.getInstance(playlistModal).hide();
                        if (audioPlayer.paused) audioPlayer.play();
                    });
                });
                new bootstrap.Modal(playlistModal).show();
            });
    });

    const modePanel = document.getElementById('mode-panel');
    const modePanelHeader = document.getElementById('mode-panel-header');
    function toggleModePanel() {
        modePanel.classList.toggle('open');
    }
    function closeModePanel() {
        modePanel.classList.remove('open');
    }
    if (modePanelHeader) {
        modePanelHeader.addEventListener('click', toggleModePanel);
    }

    function createModeButtons() {
        modeSelector.innerHTML = '';
        modes.forEach((name, index) => {
            const btn = document.createElement('button');
            btn.className = 'mode-btn';
            btn.textContent = name;
            btn.dataset.index = index;
            btn.addEventListener('click', function() {
                currentMode = parseInt(this.dataset.index);
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                const modeCurrent = document.getElementById('mode-current');
                if (modeCurrent) modeCurrent.textContent = modes[currentMode];
                closeModePanel();
                flashAlpha = 0.4;
                flashRgb = getAccentRgb();
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                if (isPlaying) {
                    cancelAnimationFrame(animationId);
                    draw();
                } else {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
                saveState();
            });
            modeSelector.appendChild(btn);
        });
        const activeBtn = modeSelector.querySelector(`.mode-btn[data-index="${currentMode}"]`);
        if (activeBtn) activeBtn.classList.add('active');
        const modeCurrent = document.getElementById('mode-current');
        if (modeCurrent) modeCurrent.textContent = modes[currentMode];
    }
    createModeButtons();
    closeModePanel();

    if (btnTogglePanel && playerControls) {
        btnTogglePanel.addEventListener('click', function() {
            playerControls.classList.toggle('collapsed');
            localStorage.setItem('panel_collapsed', playerControls.classList.contains('collapsed') ? '1' : '0');
        });
        const savedCollapsed = localStorage.getItem('panel_collapsed');
        if (savedCollapsed === '1') {
            playerControls.classList.add('collapsed');
        }
    }

    btnTheme.addEventListener('click', function() {
        currentTheme = (currentTheme === 'purple') ? 'green' : (currentTheme === 'green' ? 'pink' : 'purple');
        applyTheme(currentTheme);
        saveState();
    });

    let isDraggingProgress = false;
    progressBar.addEventListener('mousedown', function(e) {
        isDraggingProgress = true;
        updateProgress(e);
        e.preventDefault();
    });
    document.addEventListener('mousemove', function(e) {
        if (isDraggingProgress) updateProgress(e);
    });
    document.addEventListener('mouseup', function() {
        isDraggingProgress = false;
    });

    function updateProgress(e) {
        if (!audioPlayer.duration) return;
        const rect = progressBar.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const newTime = Math.max(0, Math.min(audioPlayer.duration, (clickX / rect.width) * audioPlayer.duration));
        audioPlayer.currentTime = newTime;
        smoothCurrentTime = newTime;
    }

    audioPlayer.addEventListener('timeupdate', function() {
        if (audioPlayer.duration) {
            document.title = `${trackTitle.textContent} - ${trackArtist.textContent} (${formatTime(audioPlayer.currentTime)}/${formatTime(audioPlayer.duration)})`;
        }
    });

    volumeSlider.addEventListener('input', function() {
        audioPlayer.volume = volumeSlider.value;
        saveState();
    });

    audioPlayer.addEventListener('play', function() {
        if (!audioContext) initAudioContext();
        isPlaying = true;
        btnPlay.textContent = '⏸';
        smoothCurrentTime = audioPlayer.currentTime;
        draw();
        startGlitchIntervals();
    });

    audioPlayer.addEventListener('pause', function() {
        isPlaying = false;
        cancelAnimationFrame(animationId);
        animationId = null;
        btnPlay.textContent = '▶';
        if (randomGlitchInterval) clearInterval(randomGlitchInterval);
        if (fullGlitchInterval) clearInterval(fullGlitchInterval);
    });

    // Авто-переключение следующего трека
    audioPlayer.addEventListener('ended', function() {
        isPlaying = false;
        cancelAnimationFrame(animationId);
        animationId = null;
        btnPlay.textContent = '▶';
        if (randomGlitchInterval) clearInterval(randomGlitchInterval);
        if (fullGlitchInterval) clearInterval(fullGlitchInterval);
        if (repeatActive) {
            loadTrackByIndex(currentTrackIndex, false);
            audioPlayer.play();
        } else {
            nextTrack();
            audioPlayer.play();
        }
    });

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    window.addEventListener('resize', function() {
        resizeCanvas();
        resizeWaveformCanvas();
        resizeMiniEq();
        if (isLabOpen) resizeLabCanvases();
    });

    // Инициализация
    resizeCanvas();
    resizeWaveformCanvas();
    resizeMiniEq();
    loadState();
    applyTheme(getSavedTheme());
    createModeButtons();
    loadTracks();
    updateFavicon();
});
