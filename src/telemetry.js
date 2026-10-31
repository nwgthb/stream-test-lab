export function writeToConsole(message, logType = 'system') {
  const consoleTerminal = document.getElementById('consoleTerminal');
  if (!consoleTerminal) return;

  const timestamp = new Date().toLocaleTimeString();
  const logWrapper = document.createElement('div');
  logWrapper.className = `log-entry ${logType}`;
  logWrapper.textContent = `[${timestamp}] ${message}`;

  consoleTerminal.appendChild(logWrapper);
  consoleTerminal.scrollTop = consoleTerminal.scrollHeight;
}

export function updateChannelTelemetry(key, playerObj) {
  let activeBufferAhead = 0;
  const currentVideoTime = playerObj.video.currentTime;
  const bufferedTimeRanges = playerObj.video.buffered;

  for (let i = 0; i < bufferedTimeRanges.length; i += 1) {
    if (currentVideoTime >= bufferedTimeRanges.start(i) && currentVideoTime <= bufferedTimeRanges.end(i)) {
      activeBufferAhead = bufferedTimeRanges.end(i) - currentVideoTime;
      break;
    }
  }
  playerObj.statBuffer.textContent = `${activeBufferAhead.toFixed(2)}s`;

  if (playerObj.video.getVideoPlaybackQuality) {
    const qualityData = playerObj.video.getVideoPlaybackQuality();
    playerObj.statDropped.textContent = qualityData.droppedVideoFrames;

    const currentSystemTime = performance.now();
    const deltaSeconds = (currentSystemTime - playerObj.lastTime) / 1000;

    if (deltaSeconds > 0) {
      const framesDiff = qualityData.totalVideoFrames - playerObj.lastDecodedFrames;
      playerObj.statFps.textContent = playerObj.video.paused ? '0 FPS' : `${Math.round(framesDiff / deltaSeconds)} FPS`;
    }

    playerObj.lastDecodedFrames = qualityData.totalVideoFrames;
    playerObj.lastTime = currentSystemTime;
  } else {
    playerObj.statDropped.textContent = 'N/A';
    playerObj.statFps.textContent = 'N/A';
  }
}
