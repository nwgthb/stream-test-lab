/**
 * STREAM MATRIX TOOLKIT — TELEMETRY & CONSOLE MODULE
 * Isolates data computation loops to prevent script overflow.
 */

const consoleTerminal = document.getElementById('consoleTerminal');

// ============================================================================
// 1. DYNAMIC SYSTEM ENGINE LOG CONSOLE
// ============================================================================
window.writeToConsole = function(message, logType = 'system') {
    if (!consoleTerminal) return;
    
    const timestamp = new Date().toLocaleTimeString();
    const logWrapper = document.createElement('div');
    logWrapper.className = `log-entry ${logType}`;
    logWrapper.textContent = `[${timestamp}] ${message}`;
    
    consoleTerminal.appendChild(logWrapper);
    
    // Smooth auto-scroll behavior tracking the newest logs at the bottom
    consoleTerminal.scrollTop = consoleTerminal.scrollHeight;
};

// ============================================================================
// 2. REAL-TIME DATA CALCULATOR & POLLING LOOP
// ============================================================================
window.updateChannelTelemetry = function(key, playerObj) {
    // A. Track Buffer Pipeline Length Configuration
    let activeBufferAhead = 0;
    const currentVideoTime = playerObj.video.currentTime;
    const bufferedTimeRanges = playerObj.video.buffered;
    
    for (let i = 0; i < bufferedTimeRanges.length; i++) {
        if (currentVideoTime >= bufferedTimeRanges.start(i) && currentVideoTime <= bufferedTimeRanges.end(i)) {
            activeBufferAhead = bufferedTimeRanges.end(i) - currentVideoTime;
            break;
        }
    }
    playerObj.statBuffer.textContent = `${activeBufferAhead.toFixed(2)}s`;

    // B. Parse Dropped Frames & Dynamic Rendering FPS Metrics
    if (playerObj.video.getVideoPlaybackQuality) {
        const qualityData = playerObj.video.getVideoPlaybackQuality();
        playerObj.statDropped.textContent = qualityData.droppedVideoFrames;
        
        const currentSystemTime = performance.now();
        const deltaSeconds = (currentSystemTime - playerObj.lastTime) / 1000;
        
        if (deltaSeconds > 0) {
            const framesDiff = qualityData.totalVideoFrames - playerObj.lastDecodedFrames;
            
            // Mute active calculations if the video rendering canvas is paused
            playerObj.statFps.textContent = playerObj.video.paused ? "0 FPS" : `${Math.round(framesDiff / deltaSeconds)} FPS`;
        }
        
        playerObj.lastDecodedFrames = qualityData.totalVideoFrames;
        playerObj.lastTime = currentSystemTime;
    } else {
        // Fallback states if the browser engine hides core quality objects
        playerObj.statDropped.textContent = "N/A";
        playerObj.statFps.textContent = "N/A";
    }
};

// Initialize the terminal logger footprint instantly upon dependency resolution
window.writeToConsole("Modular telemetry engine initialization sequence success.", "system");
