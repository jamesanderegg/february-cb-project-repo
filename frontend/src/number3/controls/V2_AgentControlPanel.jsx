import React, { useState, useEffect } from 'react';

export default function AgentControlPanel() {
  const [trainingMode, setTrainingMode] = useState('replay');
  const [modelList, setModelList] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    // Fetch list of models from backend
    fetch("http://localhost:5001/list_models")
      .then(res => res.json())
      .then(data => {
        setModelList(data.models || []);
        if (data.models && data.models.length > 0) {
          setSelectedModel(data.models[0]);
        }
      })
      .catch(err => console.error("Error fetching model list:", err));
  }, []);

  const handleTrain = () => {
    fetch(`http://localhost:5001/train_model?mode=${trainingMode}`, { method: 'POST' })
      .then(res => res.json())
      .then(data => setStatusMessage(data.message || 'Training started.'))
      .catch(err => setStatusMessage('Error starting training'));
  };

  const handleStartAgent = () => {
    fetch(`http://localhost:5001/start_agent?model=${selectedModel}`, { method: 'POST' })
      .then(res => res.json())
      .then(data => setStatusMessage(data.message || 'Agent started.'))
      .catch(err => setStatusMessage('Error starting agent'));
  };

  const handleStopAgent = () => {
    fetch("http://localhost:5001/stop_agent", { method: 'POST' })
      .then(res => res.json())
      .then(data => setStatusMessage(data.message || 'Agent stopped.'))
      .catch(err => setStatusMessage('Error stopping agent'));
  };

  return (
    <div className="agent-control-panel">
      <h3>Agent Controls</h3>

      <label>Training Mode:</label>
      <select value={trainingMode} onChange={e => setTrainingMode(e.target.value)}>
        <option value="replay">Replay Only</option>
        <option value="training">Training Only</option>
        <option value="both">Replay + Training</option>
      </select>
      <button onClick={handleTrain}>Train Model</button>

      <hr />

      <label>Select Trained Model:</label>
      <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)}>
        {modelList.map(model => (
          <option key={model} value={model}>{model}</option>
        ))}
      </select>
      <button onClick={handleStartAgent}>Start Agent</button>
      <button onClick={handleStopAgent}>Stop Agent</button>

      {statusMessage && <p className="status-message">{statusMessage}</p>}
    </div>
  );
}
