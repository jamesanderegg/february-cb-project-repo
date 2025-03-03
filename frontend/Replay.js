// Socket connection setup
const socket = io.connect('YOUR_NGROK_URL_HERE');

// UI Elements
const startRecordingBtn = document.getElementById('startRecording');
const stopRecordingBtn = document.getElementById('stopRecording');
const saveReplayBtn = document.getElementById('saveReplay');
const loadReplayBtn = document.getElementById('loadReplay');
const replayToAgentBtn = document.getElementById('replayToAgent');
const replayFilenameInput = document.getElementById('replayFilename');
const replayStatusDiv = document.getElementById('replayStatus');

// Recording status
let isRecording = false;

// Event handlers
startRecordingBtn.addEventListener('click', () => {
  socket.emit('replay_control', { command: 'start' });
});

stopRecordingBtn.addEventListener('click', () => {
  socket.emit('replay_control', { command: 'stop' });
});

saveReplayBtn.addEventListener('click', () => {
  const filename = replayFilenameInput.value || `replay_${Date.now()}.json`;
  socket.emit('replay_control', { 
    command: 'save',
    filename: filename
  });
});

loadReplayBtn.addEventListener('click', () => {
  const filename = replayFilenameInput.value;
  if (filename) {
    socket.emit('replay_control', { 
      command: 'load',
      filename: filename
    });
  } else {
    replayStatusDiv.textContent = 'Please enter a filename to load';
  }
});

replayToAgentBtn.addEventListener('click', () => {
  socket.emit('replay_control', { command: 'replay' });
});

// Socket event listeners
socket.on('replay_status', (data) => {
  console.log('Replay status update:', data);
  
  switch(data.status) {
    case 'recording':
      isRecording = true;
      replayStatusDiv.textContent = `Recording episode ${data.episode}...`;
      replayStatusDiv.className = 'status-recording';
      break;
      
    case 'stopped':
      isRecording = false;
      replayStatusDiv.textContent = `Recording stopped. ${data.episode} episodes recorded.`;
      replayStatusDiv.className = 'status-stopped';
      break;
      
    case 'saved':
      replayStatusDiv.textContent = `Saved ${data.episodes} episodes (${data.steps} steps).`;
      replayStatusDiv.className = 'status-saved';
      break;
      
    case 'loaded':
      replayStatusDiv.textContent = `Loaded ${data.episodes} episodes successfully.`;
      replayStatusDiv.className = 'status-loaded';
      break;
      
    case 'error':
      replayStatusDiv.textContent = 'Error processing replay request.';
      replayStatusDiv.className = 'status-error';
      break;
      
    case 'replayed':
      replayStatusDiv.textContent = `Added ${data.experiences} experiences to agent memory.`;
      replayStatusDiv.className = 'status-replayed';
      break;
  }
});