export function updateDiagnosticsPanel({ players, state, refs }) {
  const summaryEl = document.getElementById('diagnosticSummary');
  const playerAEl = document.getElementById('diagnosticPlayerA');
  const playerBEl = document.getElementById('diagnosticPlayerB');

  if (!summaryEl || !playerAEl || !playerBEl) return;

  const snapshotA = snapshotPlayer(refs.A, state.players.A);
  const snapshotB = snapshotPlayer(refs.B, state.players.B);

  const drift = Math.abs(snapshotA.currentTime - snapshotB.currentTime).toFixed(2);
  const qualityDelta = snapshotA.sourceType === snapshotB.sourceType ? 'matched' : 'mixed';
  const issues = [];

  if (snapshotA.buffer < 0.5) issues.push('A low buffer');
  if (snapshotB.buffer < 0.5) issues.push('B low buffer');
  if (Number(drift) > 1.5) issues.push('sync drift');
  if (snapshotA.dropped > 0 || snapshotB.dropped > 0) issues.push('frame loss');

  playerAEl.textContent = `A: ${snapshotA.sourceType.toUpperCase()} • buffer ${snapshotA.buffer}s • dropped ${snapshotA.dropped} • FPS ${snapshotA.fps}`;
  playerBEl.textContent = `B: ${snapshotB.sourceType.toUpperCase()} • buffer ${snapshotB.buffer}s • dropped ${snapshotB.dropped} • FPS ${snapshotB.fps}`;
  summaryEl.textContent = `Sync drift ${drift}s • ${qualityDelta} sources • ${issues.length ? issues.join(', ') : 'healthy'}`;
}

function snapshotPlayer(playerRef, playerState) {
  const video = playerRef.video;
  const buffer = getBufferedAhead(video);
  const dropped = Number(video.getVideoPlaybackQuality ? video.getVideoPlaybackQuality().droppedVideoFrames || 0 : 0);
  const fps = video.getVideoPlaybackQuality ? (() => {
    const quality = video.getVideoPlaybackQuality();
    const currentTime = performance.now();
    const delta = Math.max((currentTime - playerState.lastTime) / 1000, 0.001);
    const frames = quality.totalVideoFrames - playerState.lastDecodedFrames;
    return video.paused ? 0 : Math.round(frames / delta);
  })() : 0;

  return {
    sourceType: playerState.sourceType || 'mp4',
    currentTime: Number.isFinite(video.currentTime) ? video.currentTime : 0,
    buffer,
    dropped,
    fps
  };
}

function getBufferedAhead(video) {
  const ranges = video.buffered;
  const currentTime = video.currentTime;

  for (let i = 0; i < ranges.length; i += 1) {
    if (currentTime >= ranges.start(i) && currentTime <= ranges.end(i)) {
      return Number((ranges.end(i) - currentTime).toFixed(2));
    }
  }

  return 0;
}
