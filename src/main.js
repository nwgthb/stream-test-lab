import { writeToConsole, updateChannelTelemetry } from './telemetry.js';
import { captureVideoFrame } from './utilities.js';
import { initOfflineDatabase, saveVideoToOfflineCache, loadOfflineCachedVideo } from './offline.js';

const ui = {
  clearConsoleBtn: document.getElementById('clearConsoleBtn'),
  masterPlayPauseBtn: document.getElementById('masterPlayPauseBtn'),
  masterLatencySyncBtn: document.getElementById('masterLatencySyncBtn'),
  toggleOverlayBtn: document.getElementById('toggleOverlayBtn'),
  workbenchGrid: document.getElementById('workbenchGrid'),
  playerContainerA: document.getElementById('playerContainerA'),
  globalPresetBtns: document.querySelectorAll('.preset-btn:not(.master-sync-btn):not(.master-latency-btn):not(.master-overlay-btn)')
};

const playerRefs = {
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
    statFps: document.getElementById('statFpsA')
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
    statFps: document.getElementById('statFpsB')
  }
};

const state = {
  overlayActive: false,
  players: {
    A: {
      url: 'https://mux.dev',
      hlsInstance: null,
      lastDecodedFrames: 0,
      lastTime: performance.now(),
      playing: false,
      sourceType: 'hls'
    },
    B: {
      url: 'https://mux.dev',
      hlsInstance: null,
      lastDecodedFrames: 0,
      lastTime: performance.now(),
      playing: false,
      sourceType: 'hls'
    }
  }
};

function applyPlayerState(key, patch) {
  Object.assign(state.players[key], patch);
}

function setPlayerUrl(key, value) {
  const nextUrl = value.trim();
  state.players[key].url = nextUrl;
  playerRefs[key].urlInput.value = nextUrl;
}

function renderOverlayView() {
  const { overlayActive } = state;
  ui.workbenchGrid.classList.toggle('overlay-active', overlayActive);
  playerRefs.B.video.classList.toggle('embedded-overlay-player', overlayActive);
  ui.toggleOverlayBtn.textContent = overlayActive
    ? 'Exit Visual Difference Overlay Mode'
    : 'Toggle Visual Matrix Difference Overlay';
}

function syncPlayerVideoLocation(key) {
  const player = playerRefs[key];
  const container = key === 'A' ? ui.playerContainerA : document.querySelector('#cellB .player-section');

  if (state.overlayActive && key === 'B') {
    ui.playerContainerA.appendChild(player.video);
  } else {
    document.querySelector('#cellB .player-section').appendChild(player.video);
  }
}

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

ui.clearConsoleBtn.addEventListener('click', () => {
  document.getElementById('consoleTerminal').innerHTML = '';
  writeToConsole('Terminal workspace logs reset.', 'system');
});

function deployStreamRoute(key) {
  const player = playerRefs[key];
  const appPlayer = state.players[key];
  const targetUrl = appPlayer.url;

  player.qualitySelect.innerHTML = '<option value="-1">Auto Quality</option>';

  if (!targetUrl) {
    writeToConsole(`Pipeline ${key} Cancelled: Target input path string is empty.`, 'error');
    return;
  }

  if (appPlayer.hlsInstance) {
    writeToConsole(`Tearing down active HLS processor instance inside Core ${key}...`, 'system');
    appPlayer.hlsInstance.destroy();
    appPlayer.hlsInstance = null;
  }

  if (targetUrl.includes('.m3u8')) {
    if (window.Hls && window.Hls.isSupported()) {
      writeToConsole(`Deploying Hls.js extension engine pipeline down Channel ${key}...`, 'system');
      appPlayer.hlsInstance = new window.Hls();
      appPlayer.hlsInstance.loadSource(targetUrl);
      appPlayer.hlsInstance.attachMedia(player.video);
      appPlayer.sourceType = 'hls';

      appPlayer.hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, (_event, data) => {
        writeToConsole(`Core ${key}: Adaptive tracks successfully initialized: ${data.levels.length}`, 'state');
        data.levels.forEach((level, index) => {
          const option = document.createElement('option');
          option.value = index;
          option.textContent = level.name || `${level.height}p (${Math.round(level.bitrate / 1000)}kbps)`;
          player.qualitySelect.appendChild(option);
        });
        player.video.play().catch((event) => writeToConsole(`Core ${key} Playback notice: ${event.message}`, 'warn'));
      });

      appPlayer.hlsInstance.on(window.Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          writeToConsole(`Core ${key} Critical Stream Exception: ${data.details}`, 'error');
        }
      });
    } else if (player.video.canPlayType('application/vnd.apple.mpegurl')) {
      writeToConsole(`Core ${key}: Routing using browser native HLS handler framework.`, 'system');
      player.video.src = targetUrl;
      appPlayer.sourceType = 'hls';
    } else {
      writeToConsole(`Fatal Error: HLS unsupported on channel ${key}`, 'error');
    }
  } else {
    writeToConsole(`Core ${key}: Binding native HTML5 progressive frame decoder path...`, 'system');
    player.video.src = targetUrl;
    player.video.load();
    appPlayer.sourceType = 'mp4';
    player.video.play().catch((event) => writeToConsole(`Core ${key} Playback note: ${event.message}`, 'warn'));
  }
}

['A', 'B'].forEach((key) => {
  const player = playerRefs[key];
  const appPlayer = state.players[key];

  player.urlInput.value = appPlayer.url;

  player.loadBtn.addEventListener('click', () => {
    setPlayerUrl(key, player.urlInput.value);
    deployStreamRoute(key);
  });

  player.playPauseBtn.addEventListener('click', () => {
    if (player.video.paused) {
      player.video.play();
      applyPlayerState(key, { playing: true });
      writeToConsole(`Manual Action: Resumed window viewport ${key}.`, 'action');
    } else {
      player.video.pause();
      applyPlayerState(key, { playing: false });
      writeToConsole(`Manual Action: Suspended window viewport ${key}.`, 'action');
    }
  });

  player.qualitySelect.addEventListener('change', (event) => {
    const selectedIdx = parseInt(event.target.value, 10);
    if (appPlayer.hlsInstance) {
      appPlayer.hlsInstance.currentLevel = selectedIdx;
      writeToConsole(`Core ${key}: Track variant execution shifted ➔ Track Option Index: ${selectedIdx}`, 'action');
    }
  });

  player.snapshotBtn.addEventListener('click', () => captureVideoFrame(key, player.video));

  player.pipBtn.addEventListener('click', async () => {
    if (!document.pictureInPictureEnabled) {
      writeToConsole('Picture-in-Picture mode is unsupported inside your browser environment configurations.', 'error');
      return;
    }

    try {
      if (document.pictureInPictureElement === player.video) {
        await document.exitPictureInPicture();
        writeToConsole(`PiP Core Intercept: Deactivated detached canvas window ${key}.`, 'system');
      } else {
        await player.video.requestPictureInPicture();
        writeToConsole(`PiP Core Intercept: Spawned detached floating frame layer for Player ${key}.`, 'state');
      }
    } catch (pipError) {
      writeToConsole(`PiP execution blocker: ${pipError.message}`, 'error');
    }
  });

  player.dropzone.addEventListener('dragover', (event) => {
    event.preventDefault();
    player.dropzone.classList.add('drag-over');
  });

  player.dropzone.addEventListener('dragleave', () => player.dropzone.classList.remove('drag-over'));

  player.dropzone.addEventListener('drop', (event) => {
    event.preventDefault();
    player.dropzone.classList.remove('drag-over');

    const files = event.dataTransfer.files;
    if (files.length > 0 && files[0].type.includes('video/mp4')) {
      writeToConsole(`Ingress storage upload detected on channel ${key}. Committing blob asset onto disk database...`, 'action');
      saveVideoToOfflineCache(key, files[0]);
    } else {
      writeToConsole('Storage Aborted: Dropped item must be a standard valid progressive local .mp4 file.', 'error');
    }
  });

  player.dropzone.addEventListener('click', () => {
    writeToConsole(`Storage Call: Querying binary cache indexes down partition pipeline ${key}...`, 'action');
    loadOfflineCachedVideo(key, player.video);
  });

  player.video.addEventListener('waiting', () => writeToConsole(`Core ${key}: Buffering network resources...`, 'warn'));
  player.video.addEventListener('playing', () => {
    applyPlayerState(key, { playing: true });
    writeToConsole(`Core ${key}: Rendering running frames.`, 'state');
  });

  player.video.addEventListener('pause', () => {
    applyPlayerState(key, { playing: false });
  });
});

ui.masterPlayPauseBtn.addEventListener('click', () => {
  const targetState = playerRefs.A.video.paused || playerRefs.B.video.paused;
  if (targetState) {
    playerRefs.A.video.play().catch(() => {});
    playerRefs.B.video.play().catch(() => {});
  } else {
    playerRefs.A.video.pause();
    playerRefs.B.video.pause();
  }
});

ui.masterLatencySyncBtn.addEventListener('click', () => {
  playerRefs.B.video.currentTime = playerRefs.A.video.currentTime;
  writeToConsole('Calibration complete. Timeline clocks forced to match Player A position.', 'state');
});

ui.toggleOverlayBtn.addEventListener('click', () => {
  state.overlayActive = !state.overlayActive;
  renderOverlayView();

  if (state.overlayActive) {
    playerRefs.B.video.currentTime = playerRefs.A.video.currentTime;
    playerRefs.B.video.controls = false;
    writeToConsole('Visual Difference Layer active. Black frames indicate identical compressed tracking markers.', 'warn');
  } else {
    playerRefs.B.video.controls = true;
  }
});

ui.globalPresetBtns.forEach((button) => {
  button.addEventListener('click', () => {
    const type = button.getAttribute('data-target');

    if (type === 'both-hls') {
      setPlayerUrl('A', 'https://mux.dev');
      setPlayerUrl('B', 'https://mux.dev');
    } else if (type === 'both-mp4') {
      setPlayerUrl('A', 'https://googleapis.com');
      setPlayerUrl('B', 'https://googleapis.com');
    }

    deployStreamRoute('A');
    deployStreamRoute('B');
  });
});

setInterval(() => {
  updateChannelTelemetry('A', {
    ...state.players.A,
    video: playerRefs.A.video,
    statBuffer: playerRefs.A.statBuffer,
    statDropped: playerRefs.A.statDropped,
    statFps: playerRefs.A.statFps,
    lastDecodedFrames: state.players.A.lastDecodedFrames,
    lastTime: state.players.A.lastTime
  });

  updateChannelTelemetry('B', {
    ...state.players.B,
    video: playerRefs.B.video,
    statBuffer: playerRefs.B.statBuffer,
    statDropped: playerRefs.B.statDropped,
    statFps: playerRefs.B.statFps,
    lastDecodedFrames: state.players.B.lastDecodedFrames,
    lastTime: state.players.B.lastTime
  });

  state.players.A.lastDecodedFrames = state.players.A.lastDecodedFrames;
  state.players.B.lastDecodedFrames = state.players.B.lastDecodedFrames;
}, 500);

function syncTelemetryStateFromVideo(key) {
  const appPlayer = state.players[key];
  const player = playerRefs[key];

  if (player.video.getVideoPlaybackQuality) {
    const qualityData = player.video.getVideoPlaybackQuality();
    appPlayer.lastDecodedFrames = qualityData.totalVideoFrames;
    appPlayer.lastTime = performance.now();
  }
}

window.__streamTestLab = {
  state,
  playerRefs,
  deployStreamRoute,
  setPlayerUrl,
  renderOverlayView,
  syncTelemetryStateFromVideo,
  isOverlayModeActive: () => state.overlayActive
};

renderOverlayView();
writeToConsole('Modular telemetry engine initialization sequence success.', 'system');

deployStreamRoute('A');
deployStreamRoute('B');

initOfflineDatabase().catch((error) => {
  console.error('Offline DB init failed:', error);
});
