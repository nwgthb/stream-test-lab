// ============================================================================
// 1. SELECT DUAL WORKBENCH DOM CONTROLS & SYSTEM INTERFACES
// ============================================================================
const clearConsoleBtn = document.getElementById('clearConsoleBtn');
const masterPlayPauseBtn = document.getElementById('masterPlayPauseBtn');
const masterLatencySyncBtn = document.getElementById('masterLatencySyncBtn');
const toggleOverlayBtn = document.getElementById('toggleOverlayBtn');
const workbenchGrid = document.getElementById('workbenchGrid');
const playerContainerA = document.getElementById('playerContainerA');
const globalPresetBtns = document.querySelectorAll('.preset-btn:not(.master-sync-btn):not(.master-latency-btn):not(.master-overlay-btn)');

// ============================================================================
// 2. PARALLEL DEPLOYMENT DATA PIPELINE CONFIGURATION MAPS
// ============================================================================
const players = {
    A: {
        video: document.getElementById('videoPlayerA'),
        urlInput: document.getElementById('streamUrlA'),
        loadBtn: document.getElementById('loadBtnA'),
        playPauseBtn: document.getElementById('playPauseBtnA'),
        qualitySelect: document.getElementById('qualitySelectA'),
        snapshotBtn: document.getElementById('snapshotBtnA'),
        statBuffer: document.getElementById('statBufferA'),
        statDropped: document.getElementById('statDroppedA'),
        statFps: document.getElementById('statFpsA'),
        hlsInstance: null,
        lastDecodedFrames: 0,
        lastTime: performance.now()
    },
    B: {
        video: document.getElementById('videoPlayerB'),
        urlInput: document.getElementById('streamUrlB'),
        loadBtn: document.getElementById('loadBtnB'),
        playPauseBtn: document.getElementById('playPauseBtnB'),
        qualitySelect: document.getElementById('qualitySelectB'),
        snapshotBtn: document.getElementById('snapshotBtnB'),
        statBuffer: document.getElementById('statBufferB'),
        statDropped: document.getElementById('statDroppedB'),
        statFps: document.getElementById('statFpsB'),
        hlsInstance: null,
        lastDecodedFrames: 0,
        lastTime: performance.now()
    }
};

// Global state variable managing difference analysis alignment visibility rules
let isOverlayModeActive = false;

// Attach click responder to reset diagnostic console timeline metrics logs
clearConsoleBtn.addEventListener('click', () => {
    document.getElementById('consoleTerminal').innerHTML = '';
    window.writeToConsole("Terminal workspace logs reset.", "system");
});
// ============================================================================
// 3. CORE ADAPTIVE PROTOCOL INJECTION & INGRESS ROUTING ENGINE
// ============================================================================
function deployStreamRoute(key) {
    const p = players[key];
    const targetUrl = p.urlInput.value.trim();
    
    // Refresh resolution layout selector dropdown options
    p.qualitySelect.innerHTML = '<option value="-1">Auto Quality</option>';
    
    if (!targetUrl) {
        window.writeToConsole(`Pipeline ${key} Cancelled: URL path is empty.`, "error");
        return;
    }

    // Safely tear down ongoing engine bindings to prevent memory footprint leaks
    if (p.hlsInstance) {
        window.writeToConsole(`Tearing down active HLS processor instance inside Core ${key}...`, "system");
        p.hlsInstance.destroy();
        p.hlsInstance = null;
    }

    // Path A: The ingress resource target string is an HLS adaptive feed configuration index
    if (targetUrl.includes('.m3u8')) {
        if (Hls.isSupported()) {
            window.writeToConsole(`Deploying Hls.js extension engine pipeline down Channel ${key}...`, "system");
            
            p.hlsInstance = new Hls();
            p.hlsInstance.loadSource(targetUrl);
            p.hlsInstance.attachMedia(p.video);
            
            p.hlsInstance.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
                window.writeToConsole(`Core ${key}: Adaptive tracks successfully initialized: ${data.levels.length}`, "state");
                
                // Read and register internal track profiles onto the dropdown interface options
                data.levels.forEach((level, index) => {
                    const option = document.createElement('option');
                    option.value = index;
                    option.textContent = level.name || `${level.height}p (${Math.round(level.bitrate / 1000)}kbps)`;
                    p.qualitySelect.appendChild(option);
                });
                p.video.play().catch(e => window.writeToConsole(`Core ${key} Playback notice: ${e.message}`, "warn"));
            });

            p.hlsInstance.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) window.writeToConsole(`Core ${key} Critical Stream Exception: ${data.details}`, "error");
            });
        } 
        // Safari browser environment fallback context
        else if (p.video.canPlayType('application/vnd.apple.mpegurl')) {
            window.writeToConsole(`Core ${key}: Routing using browser native HLS pipeline environment setup.`, "system");
            p.video.src = targetUrl;
        } else {
            window.writeToConsole(`Fatal Error: HLS unsupported on pipeline channel ${key}`, "error");
        }
    } 
    // Path B: Fallback directly to native basic standard HTML5 decoding blocks
    else {
        window.writeToConsole(`Core ${key}: Binding native HTML5 progressive frame decoder path...`, "system");
        p.video.src = targetUrl;
        p.video.load();
        p.video.play().catch(e => window.writeToConsole(`Core ${key} Playback note: ${e.message}`, "warn"));
    }
}
// ============================================================================
// 4. BIND DUAL-CHANNEL HARDWARE USER CONTROL INTERRUPT ACTIONS
// ============================================================================
['A', 'B'].forEach(key => {
    const p = players[key];
    
    p.loadBtn.addEventListener('click', () => {
        window.writeToConsole(`Deploying custom asset payload target loading routing commands to Core ${key}...`, "action");
        deployStreamRoute(key);
    });

    p.playPauseBtn.addEventListener('click', () => {
        if (p.video.paused) {
            p.video.play();
            window.writeToConsole(`Manual Intercept: Resumed video workspace window ${key}.`, "action");
        } else {
            p.video.pause();
            window.writeToConsole(`Manual Intercept: Suspended video workspace window ${key}.`, "action");
        }
    });

    p.qualitySelect.addEventListener('change', (e) => {
        const selectedIdx = parseInt(e.target.value);
        if (p.hlsInstance) {
            p.hlsInstance.currentLevel = selectedIdx;
            window.writeToConsole(`Core ${key}: Track layer variant execution shifted ➔ Option Index: ${selectedIdx}`, "action");
        } else {
            window.writeToConsole(`Core ${key}: Quality adjustment bypassed. Active pipeline route lacks alternative layout manifests.`, "warn");
        }
    });

    p.snapshotBtn.addEventListener('click', () => {
        window.writeToConsole(`Triggering Frame Export request layout workflow on channel ${key}...`, "action");
        window.captureVideoFrame(key, p.video);
    });

    p.video.addEventListener('waiting', () => window.writeToConsole(`Core ${key}: Internal buffer empty. Synchronizing network streams...`, "warn"));
    p.video.addEventListener('playing', () => window.writeToConsole(`Core ${key}: Buffer filled. Frame raster processing active inside viewport canvas.`, "state"));
});

// ============================================================================
// 5. GLOBAL CROSS-CHANNEL SYNCHRONIZATION OVERSIGHT MANAGERS
// ============================================================================
masterPlayPauseBtn.addEventListener('click', () => {
    const targetPlayState = players.A.video.paused || players.B.video.paused;
    window.writeToConsole(`Global Matrix Macro Command: Forcing playback state sync (Target State: ${targetPlayState ? "PLAY" : "PAUSE"})...`, "action");
    
    if (targetPlayState) {
        players.A.video.play().catch(()=>{});
        players.B.video.play().catch(()=>{});
    } else {
        players.A.video.pause();
        players.B.video.pause();
    }
});

masterLatencySyncBtn.addEventListener('click', () => {
    const timeA = players.A.video.currentTime;
    const timeB = players.B.video.currentTime;
    window.writeToConsole(`Orchestrating latency alignment pass. Time A: ${timeA.toFixed(3)}s | Time B: ${timeB.toFixed(3)}s`, "action");
    
    players.B.video.currentTime = timeA;
    window.writeToConsole(`Calibration complete. Player B forced to match Player A runtime position context.`, "state");
});

// --- COMPRESSION MIX-BLEND DIFFERENCE OVERLAY TRACKER CONTROLLER ---
toggleOverlayBtn.addEventListener('click', () => {
    isOverlayModeActive = !isOverlayModeActive;
    
    if (isOverlayModeActive) {
        workbenchGrid.classList.add('overlay-active');
        players.B.video.classList.add('embedded-overlay-player');
        playerContainerA.appendChild(players.B.video); // Embed player node B into panel A hierarchy
        
        players.B.video.currentTime = players.A.video.currentTime;
        players.B.video.controls = false; 
        
        toggleOverlayBtn.textContent = "Exit Visual Difference Overlay Mode";
        window.writeToConsole("Matrix Shift: Visual Difference Layer initialized. Black frames indicate identical compressed pixel data.", "warn");
    } else {
        workbenchGrid.classList.remove('overlay-active');
        players.B.video.classList.remove('embedded-overlay-player');
        document.querySelector('#cellB .player-section').appendChild(players.B.video); // Restore back to panel B
        players.B.video.controls = true; 
        
        toggleOverlayBtn.textContent = "Toggle Visual Matrix Difference Overlay";
        window.writeToConsole("Matrix Shift: Difference layer terminated. Side-by-side layout restored.", "system");
    }
});

globalPresetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const presetType = btn.getAttribute('data-target');
        window.writeToConsole(`Executing Matrix Preset Macro configuration routine: [${presetType.toUpperCase()}]`, "action");
        
        if (presetType === 'both-hls') {
            players.A.urlInput.value = "https://mux.dev";
            players.B.urlInput.value = "https://mux.dev";
        } else if (presetType === 'both-mp4') {
            players.A.urlInput.value = "https://googleapis.com";
            players.B.urlInput.value = "https://googleapis.com";
        }
        
        deployStreamRoute('A');
        deployStreamRoute('B');
    });
});

// Orchestrate recurring analytics computing loops using telemetry module functions
setInterval(() => {
    window.updateChannelTelemetry('A', players.A);
    window.updateChannelTelemetry('B', players.B);
}, 500);

// Auto-boot configuration routes immediately upon dashboard load execution lines
deployStreamRoute('A');
deployStreamRoute('B');
