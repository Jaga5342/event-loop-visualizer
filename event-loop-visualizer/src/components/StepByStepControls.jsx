import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import {
  setRunning,
  setPaused,
  setSpeed,
  clearAll,
  addTask,
  TASK_TYPES,
  clearConsoleOutput
} from '../store/eventLoopSlice';

const StepByStepControls = () => {
  const dispatch = useDispatch();
  const {
    isRunning,
    isPaused,
    speed,
    currentExecutingTask
  } = useSelector(state => state.eventLoop);

  const handleToggleRunning = () => {
    dispatch(setRunning(!isRunning));
  };

  const handleTogglePause = () => {
    dispatch(setPaused(!isPaused));
  };

  const handleSpeedChange = (newSpeed) => {
    dispatch(setSpeed(newSpeed));
  };

  const handleClearAll = () => {
    dispatch(clearAll());
    dispatch(clearConsoleOutput());
  };

  const handleAddCodeSample = (sampleType) => {
    const samples = {
      synchronous: { type: TASK_TYPES.SYNCHRONOUS, desc: 'Basic synchronous code', sample: 'synchronous' },
      setTimeout: { type: TASK_TYPES.SET_TIMEOUT, desc: 'setTimeout example', sample: 'setTimeout' },
      promise: { type: TASK_TYPES.PROMISE, desc: 'Promise microtask', sample: 'promise' },
      asyncAwait: { type: TASK_TYPES.ASYNC_AWAIT, desc: 'Async/await example', sample: 'asyncAwait' }
    };
    
    const sample = samples[sampleType];
    if (sample) {
      dispatch(addTask({ type: sample.type, description: sample.desc, delay: 0, codeSample: sample.sample }));
    }
  };

  return (
    <div className="step-by-step-controls">
      <div className="component-header">
        <h4>Event Loop Controls</h4>
        <p className="component-description">
          Control the event loop simulation
        </p>
      </div>

      {/* Code Examples */}
      <div className="code-examples-section mb-3">
        <h6>Add Code Examples</h6>
        <div className="btn-group-vertical w-100 mb-2">
          <button 
            className="btn btn-primary btn-sm mb-1"
            onClick={() => handleAddCodeSample('synchronous')}
            disabled={currentExecutingTask !== null}
          >
            Add Synchronous Code
          </button>
          <button 
            className="btn btn-warning btn-sm mb-1"
            onClick={() => handleAddCodeSample('setTimeout')}
            disabled={currentExecutingTask !== null}
          >
            Add setTimeout Example
          </button>
          <button 
            className="btn btn-success btn-sm mb-1"
            onClick={() => handleAddCodeSample('promise')}
            disabled={currentExecutingTask !== null}
          >
            Add Promise Example
          </button>
          <button 
            className="btn btn-info btn-sm mb-1"
            onClick={() => handleAddCodeSample('asyncAwait')}
            disabled={currentExecutingTask !== null}
          >
            Add Async/Await Example
          </button>
        </div>
      </div>

      {/* Execution Controls */}
      <div className="execution-controls-section mb-3">
        <h6>Execution Controls</h6>
        <div className="btn-group w-100 mb-2">
          <button 
            className={`btn btn-sm ${isRunning ? 'btn-danger' : 'btn-success'}`}
            onClick={handleToggleRunning}
          >
            {isRunning ? 'Stop' : 'Start'}
          </button>
          <button 
            className={`btn btn-sm ${isPaused ? 'btn-success' : 'btn-warning'}`}
            onClick={handleTogglePause}
            disabled={!isRunning}
          >
            {isPaused ? 'Resume' : 'Pause'}
          </button>
        </div>
      </div>

      {/* Speed Control */}
      <div className="speed-control-section mb-3">
        <label className="form-label small">Speed:</label>
        <div className="btn-group w-100">
          <button 
            className={`btn btn-outline-secondary btn-sm ${speed === 0.5 ? 'active' : ''}`}
            onClick={() => handleSpeedChange(0.5)}
          >
            0.5x
          </button>
          <button 
            className={`btn btn-outline-secondary btn-sm ${speed === 1 ? 'active' : ''}`}
            onClick={() => handleSpeedChange(1)}
          >
            1x
          </button>
          <button 
            className={`btn btn-outline-secondary btn-sm ${speed === 2 ? 'active' : ''}`}
            onClick={() => handleSpeedChange(2)}
          >
            2x
          </button>
        </div>
      </div>

      {/* Clear All */}
      <button 
        className="btn btn-outline-danger btn-sm w-100"
        onClick={handleClearAll}
        disabled={currentExecutingTask !== null}
      >
        Clear All
      </button>
    </div>
  );
};

export default StepByStepControls; 