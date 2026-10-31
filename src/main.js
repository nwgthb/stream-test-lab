import { writeToConsole, updateChannelTelemetry } from './telemetry.js';
import { captureVideoFrame } from './utilities.js';
import { initOfflineDatabase, saveVideoToOfflineCache, loadOfflineCachedVideo } from './offline.js';

const clearConsoleBtn = document.getElementById('clearConsoleBtn');
const masterPlayPauseBtn = document.getElementById('masterPlayPauseBtn');
const masterLatencySyncBtn = document.getElementById('masterLatencySyncBtn');
const toggleOverlayBtn = document.getElementById('toggleOverlayBtn');
const workbenchGrid = document.getElementById('workbenchGrid');
const playerContainerA = document.getElementById('playerContainerA');
const globalPresetBtns = document.querySelectorAll('.preset-btn:not(.master-sync-btn):not(.master-latency-btn):not(.master-overlay-btn)');

const players = {
  A: {
    video: document.getElementById('videoPlayerA'),
    urlInput: document.getElementById('streamUrlA'),
    loadBtn: document.getElementById('loadBtnA'),
    playPauseBtn: document.getElementById('playPauseBtnA'),
    qualitySelect: document.getElementById('qualitySelectA'),
    snapshotBtn: document.getElementById('snapshotBtnA'),
    pipBtn: document.getElementById('pipBtnA'),
    dropzone: document.getElementById('dropzoneA'),
    statBuffer: document.getElementById('statBufferA'),
    statDropped: document.getElementById('statDroppedA'),
    statFps: document.getElementById('statFpsA'),
    hlsInstance: null,
    lastDecodedFrames: 0,
    lastTime: performance.now(),
  },
  B: {
    video: document.getElementById('videoPlayerB'),
    urlInput: document.getElementById('streamUrlB'),
    loadBtn: document.getElementById('loadBtnB'),
    playPauseBtn: document.getElementById('playPauseBtnB'),
    qualitySelect: document.getElementById('qualitySelectB'),
    snapshotBtn: document.getElementById('snapshotBtnB'),
    pipBtn: document.getElementById('pipBtnB'),
    dropzone: document.getElementById('dropzoneB'),
    statBuffer: document.getElementById('statBufferB'),
    statDropped: document.getElementById('statDroppedB'),
    statFps: document.getElementById('statFpsB'),
    hlsInstance: null,
    lastDecodedFrames: 0,
    lastTime: performance.now(),
  },
};

let isOverlayModeActive = false;

window.writeToConsole = writeToConsole;
window.updateChannelTelemetry = updateChannelTelemetry;
window.captureVideoFrame = captureVideoFrame;
window.saveVideoToOfflineCache = saveVideoToOfflineCache;
window.loadOfflineCachedVideo = loadOfflineCachedVideo;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(() => console.log('[System]: Service worker caching hooks armed successfully.'))
      .catch((err) => console.error('[System Fail]: Worker initialization dropped:', err));
  });
}

clearConsoleBtn.addEventListener('click', () => {
  document.getElementById('consoleTerminal').innerHTML = '';
  writeToConsole('Terminal workspace logs reset.', 'system');
});

function deployStreamRoute(key) {
  const p = players[key];
  const targetUrl = p.urlInput.value.trim();
  p.qualitySelect.innerHTML = '<option value="-1">Auto Quality</option>';

  if (!targetUrl) {
    writeToConsole(`Pipeline ${key} Cancelled: Target input path string is empty.`, 'error');
    return;
  }

  if (p.hlsInstance) {
    writeToConsole(`Tearing down active HLS processor instance inside Core ${key}...`, 'system');
    p.hlsInstance.destroy();
    p.hlsInstance = null;
  }

  if (targetUrl.includes('.m3u8')) {
    if (window.Hls && window.Hls.isSupported()) {
      writeToConsole(`Deploying Hls.js extension engine pipeline down Channel ${key}...`, 'system');
      p.hlsInstance = new window.Hls();
      p.hlsInstance.loadSource(targetUrl);
      p.hlsInstance.attachMedia(p.video);

      p.hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, (_event, data) => {
        writeToConsole(`Core ${key}: Adaptive tracks successfully initialized: ${data.levels.length}`, 'state');
        data.levels.forEach((level, index) => {
          const option = document.createElement('option');
          option.value = index;
          option.textContent = level.name || `${level.height}p (${Math.round(level.bitrate / 1000)}kbps)`;
          p.qualitySelect.appendChild(option);
        });
        p.video.play().catch((e) => writeToConsole(`Core ${key} Playback notice: ${e.message}`, 'warn'));
      });

      p.hlsInstance.on(window.Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          writeToConsole(`Core ${key} Critical Stream Exception: ${data.details}`, 'error');
        }
      });
    } else if (p.video.canPlayType('application/vnd.apple.mpegurl')) {
      writeToConsole(`Core ${key}: Routing using browser native HLS handler framework.`, 'system');
      p.video.src = targetUrl;
    } else {
      writeToConsole(`Fatal Error: HLS unsupported on channel ${key}`, 'error');
    }
  } else {
    writeToConsole(`Core ${key}: Binding native HTML5 progressive frame decoder path...`, 'system');
    p.video.src = targetUrl;
    p.video.load();
    p.video.play().catch((e) => writeToConsole(`Core ${key} Playback note: ${e.message}`, 'warn'));
  }
}

['A', 'B'].forEach((key) => {
  const p = players[key];

  p.loadBtn.addEventListener('click', () => deployStreamRoute(key));

  p.playPauseBtn.addEventListener('click', () => {
    if (p.video.paused) {
      p.video.play();
      writeToConsole(`Manual Action: Resumed window viewport ${key}.`, 'action');
    } else {
      p.video.pause();
      writeToConsole(`Manual Action: Suspended window viewport ${key}.`, 'action');
    }
  });

  p.qualitySelect.addEventListener('change', (e) => {
    const selectedIdx = parseInt(e.target.value, 10);
    if (p.hlsInstance) {
      p.hlsInstance.currentLevel = selectedIdx;
      writeToConsole(`Core ${key}: Track variant execution shifted ➔ Track Option Index: ${selectedIdx}`, 'action');
    }
  });

  p.snapshotBtn.addEventListener('click', () => captureVideoFrame(key, p.video));

  p.pipBtn.addEventListener('click', async () => {
    if (!document.pictureInPictureEnabled) {
      writeToConsole('Picture-in-Picture mode is unsupported inside your browser environment configurations.', 'error');
      return;
    }

    try {
      if (document.pictureInPictureElement === p.video) {
        await document.exitPictureInPicture();
        writeToConsole(`PiP Core Intercept: Deactivated detached canvas window ${key}.`, 'system');
      } else {
        await p.video.requestPictureInPicture();
        writeToConsole(`PiP Core Intercept: Spawned detached floating frame layer for Player ${key}.`, 'state');
      }
    } catch (pipError) {
      writeToConsole(`PiP execution blocker: ${pipError.message}`, 'error');
    }
  });

  p.dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    p.dropzone.classList.add('drag-over');
  });
  p.dropzone.addEventListener('dragleave', () => p.dropzone.classList.remove('drag-over'));

  p.dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    p.dropzone.classList.remove('drag-over');

    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.includes('video/mp4')) {
      writeToConsole(`Ingress storage upload detected on channel ${key}. Committing blob asset onto disk database...`, 'action');
      saveVideoToOfflineCache(key, files[0]);
    } else {
      writeToConsole('Storage Aborted: Dropped item must be a standard valid progressive local .mp4 file.', 'error');
    }
  });

  p.dropzone.addEventListener('click', () => {
    writeToConsole(`Storage Call: Querying binary cache indexes down partition pipeline ${key}...`, 'action');
    loadOfflineCachedVideo(key, p.video);
  });

  p.video.addEventListener('waiting', () => writeToConsole(`Core ${key}: Buffering network resources...`, 'warn'));
  p.video.addEventListener('playing', () => writeToConsole(`Core ${key}: Rendering running frames.`, 'state'));
});

masterPlayPauseBtn.addEventListener('click', () => {
  const targetState = players.A.video.paused || players.B.video.paused;
  if (targetState) {
    players.A.video.play().catch(() => {});
    players.B.video.play().catch(() => {});
  } else {
    players.A.video.pause();
    players.B.video.pause();
  }
});

masterLatencySyncBtn.addEventListener('click', () => {
  players.B.video.currentTime = players.A.video.currentTime;
  writeToConsole('Calibration complete. Timeline clocks forced to match Player A position.', 'state');
});

toggleOverlayBtn.addEventListener('click', () => {
  isOverlayModeActive = !isOverlayModeActive;
  if (isOverlayModeActive) {
    workbenchGrid.classList.add('overlay-active');
    players.B.video.classList.add('embedded-overlay-player');
    playerContainerA.appendChild(players.B.video);
    players.B.video.currentTime = players.A.video.currentTime;
    players.B.video.controls = false;
    toggleOverlayBtn.textContent = 'Exit Visual Difference Overlay Mode';
    writeToConsole('Visual Difference Layer active. Black frames indicate identical compressed tracking markers.', 'warn');
  } else {
    workbenchGrid.classList.remove('overlay-active');
    players.B.video.classList.remove('embedded-overlay-player');
    document.querySelector('#cellB .player-section').appendChild(players.B.video);
    players.B.video.controls = true;
    toggleOverlayBtn.textContent = 'Toggle Visual Matrix Difference Overlay';
  }
});

globalPresetBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    const type = btn.getAttribute('data-target');
    if (type === 'both-hls') {
      players.A.urlInput.value = 'https://mux.dev';
      players.B.urlInput.value = 'https://mux.dev';
    } else if (type === 'both-mp4') {
      players.A.urlInput.value = 'https://googleapis.com';
      players.B.urlInput.value = 'https://googleapis.com';
    }
    deployStreamRoute('A');
    deployStreamRoute('B');
  });
});

setInterval(() => {
  updateChannelTelemetry('A', players.A);
  updateChannelTelemetry('B', players.B);
}, 500);

deployStreamRoute('A');
deployStreamRoute('B');

initOfflineDatabase().catch((error) => {
  console.error('Offline DB init failed:', error);
});

window.__streamTestLab = {
  players,
  deployStreamRoute,
  isOverlayModeActive: () => isOverlayModeActive,
};

writeToConsole('Modular telemetry engine initialization sequence success.', 'system');
