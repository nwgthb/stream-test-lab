/**
 * STREAM MATRIX TOOLKIT — UTILITIES & CAPTURE MODULE
 * Processes high-resolution offscreen canvas frame rendering snapshots.
 */

window.captureVideoFrame = function(key, videoElement) {
    // Safety check: verify the video instance possesses initialized frame buffers
    if (!videoElement || videoElement.readyState < 2) {
        window.writeToConsole(`Utility Capture Error: Player ${key} does not have active frame data loaded yet.`, "error");
        return;
    }

    try {
        // 1. Initialize an isolated offscreen canvas workbench layout matching native video size
        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        
        const context = canvas.getContext('2d');
        
        // 2. Rasterize the frame bitmap directly into the canvas context environment
        context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        
        // 3. Extract raster bitmap bytes into a safe PNG base64 string block
        const dataUrl = canvas.toDataURL('image/png');
        
        // 4. Construct a programmatic anchor link to trigger simulated browser download
        const downloadLink = document.createElement('a');
        const fileTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        downloadLink.href = dataUrl;
        downloadLink.download = `StreamLab-Capture-${key}-${fileTimestamp}.png`;
        
        // Perform safe script-driven download execution loop
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        window.writeToConsole(`Success: Exported Player ${key} frame at native resolution (${canvas.width}x${canvas.height}px).`, "state");
    } catch (securityError) {
        // Handle cross-origin configuration failures gracefully
        window.writeToConsole(`Security Blocker: Failed to snapshot Player ${key}. The streaming server lacks cross-origin authorization headers (CORS).`, "error");
        console.error("[CORS Exception Handle]:", securityError);
    }
};

window.writeToConsole("Modular utilities hardware wrapper initialized successfully.", "system");
