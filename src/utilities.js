import { writeToConsole } from './telemetry.js';

export function captureVideoFrame(key, videoElement) {
  if (!videoElement || videoElement.readyState < 2) {
    writeToConsole(`Utility Capture Error: Player ${key} does not have active frame data loaded yet.`, 'error');
    return;
  }

  try {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    const context = canvas.getContext('2d');
    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    const fileTimestamp = new Date().toISOString().replace(/[:.]/g, '-');

    downloadLink.href = dataUrl;
    downloadLink.download = `StreamLab-Capture-${key}-${fileTimestamp}.png`;

    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    writeToConsole(`Success: Exported Player ${key} frame at native resolution (${canvas.width}x${canvas.height}px).`, 'state');
  } catch (securityError) {
    writeToConsole(`Security Blocker: Failed to snapshot Player ${key}. The streaming server lacks cross-origin authorization headers (CORS).`, 'error');
    console.error('[CORS Exception Handle]:', securityError);
  }
}

writeToConsole('Modular utilities hardware wrapper initialized successfully.', 'system');
