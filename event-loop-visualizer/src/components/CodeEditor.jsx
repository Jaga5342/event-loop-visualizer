import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  setCustomCode,
  setExecutingCustomCode,
  addExecutionResult,
  addExecutionError,
  addCapturedConsoleLog,
  setExecutionStartTime,
  setExecutionEndTime,
  clearExecutionResults,
  addConsoleOutput,
  clearCodeExecutionState
} from '../store/eventLoopSlice';
import codeExecutor from '../utils/codeExecutor';

// Sample code templates
const CODE_TEMPLATES = {
  basic: `console.log('Hello, World!');
const result = 2 + 2;
console.log('Result:', result);`,

  setTimeout: `console.log('Start');
setTimeout(() => {
  console.log('Timeout executed');
}, 1000);
console.log('End');`,

  promise: `console.log('Start');
Promise.resolve().then(() => {
  console.log('Promise executed');
});
console.log('End');`,

  asyncAwait: `async function test() {
  console.log('Async start');
  await Promise.resolve();
  console.log('Async end');
}
test();
console.log('After call');`
};

const CodeEditor = () => {
  const dispatch = useDispatch();
  const {
    customCode,
    isExecutingCustomCode,
    executionResults,
    executionErrors,
    capturedConsoleLogs,
    executionStartTime,
    executionEndTime
  } = useSelector(state => state.eventLoop);

  const [localCode, setLocalCode] = useState(customCode || CODE_TEMPLATES.basic);
  const [isRunning, setIsRunning] = useState(false);
  const consoleRef = useRef(null);

  // Auto-scroll console to bottom
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [capturedConsoleLogs]);

  // Sync local code with Redux state
  useEffect(() => {
    if (customCode) {
      setLocalCode(customCode);
    }
  }, [customCode]);



  const executeCode = async () => {
    if (!localCode.trim()) {
      dispatch(addExecutionError('No code to execute'));
      return;
    }

    setIsRunning(true);
    dispatch(setExecutingCustomCode(true));
    dispatch(clearExecutionResults());
    dispatch(setExecutionStartTime(Date.now()));

    try {
      const result = await codeExecutor.executeCode(localCode);

      if (result.success) {
        if (result.result !== undefined) {
          dispatch(addExecutionResult({
            value: result.result,
            type: result.resultType,
            executionTime: result.executionTime.toFixed(2)
          }));
        }

        result.logs.forEach(log => {
          dispatch(addCapturedConsoleLog(log.message));
          dispatch(addConsoleOutput(log.message));
        });

        dispatch(setExecutionEndTime(Date.now()));
      } else {
        dispatch(addExecutionError(result.error));
        dispatch(addConsoleOutput(`Error: ${result.error}`));
        dispatch(setExecutionEndTime(Date.now()));
      }

    } catch (error) {
      const errorMessage = error.message || 'Unknown error occurred';
      dispatch(addExecutionError(errorMessage));
      dispatch(addConsoleOutput(`Error: ${errorMessage}`));
      dispatch(setExecutionEndTime(Date.now()));
    } finally {
      setIsRunning(false);
      dispatch(setExecutingCustomCode(false));
    }
  };



  const handleCodeChange = (e) => {
    const newCode = e.target.value;
    setLocalCode(newCode);
    dispatch(setCustomCode(newCode));
  };

  const handleLoadTemplate = (templateKey) => {
    const template = CODE_TEMPLATES[templateKey];
    setLocalCode(template);
    dispatch(setCustomCode(template));
  };

  const handleClearCode = () => {
    setLocalCode('');
    dispatch(setCustomCode(''));
    dispatch(clearExecutionResults());
    dispatch(clearCodeExecutionState());
  };



  const getExecutionTime = () => {
    if (executionStartTime && executionEndTime) {
      return ((executionEndTime - executionStartTime) / 1000).toFixed(3);
    }
    return null;
  };



  return (
    <div className="code-editor-container">
      <div className="component-header">
        <h3>JavaScript Code Editor</h3>
        <p className="component-description">Write and execute JavaScript code</p>
      </div>

      <div className="code-editor-main">
        {/* Code Templates */}
        <div className="code-templates-section">
          <h6>Quick Examples</h6>
          <div className="template-buttons">
                         <button
               className="btn btn-outline-primary btn-sm"
               onClick={() => handleLoadTemplate('basic')}
               disabled={isRunning}
             >
               Basic
             </button>
             <button
               className="btn btn-outline-warning btn-sm"
               onClick={() => handleLoadTemplate('setTimeout')}
               disabled={isRunning}
             >
               setTimeout
             </button>
             <button
               className="btn btn-outline-success btn-sm"
               onClick={() => handleLoadTemplate('promise')}
               disabled={isRunning}
             >
               Promise
             </button>
             <button
               className="btn btn-outline-info btn-sm"
               onClick={() => handleLoadTemplate('asyncAwait')}
               disabled={isRunning}
             >
               Async/Await
             </button>
          </div>
        </div>

        {/* Code Input Area */}
        <div className="code-input-section">
          <div className="code-input-header">
            <h5>Code Input</h5>
            <div className="code-controls">
              <button
                className={`btn btn-sm ${isRunning ? 'btn-secondary' : 'btn-success'}`}
                onClick={executeCode}
                disabled={isRunning || !localCode.trim()}
              >
                {isRunning ? 'Running...' : 'Run Code'}
              </button>

                             <button
                 className="btn btn-outline-secondary btn-sm"
                 onClick={handleClearCode}
                 disabled={isRunning}
               >
                 Clear
               </button>
            </div>
          </div>
          
                     <textarea
             className="code-textarea"
             value={localCode}
             onChange={handleCodeChange}
             placeholder="Enter your JavaScript code here..."
             disabled={isRunning}
             rows={6}
           />
        </div>



        {/* Execution Results */}
        <div className="execution-results-section">
          <div className="results-header">
            <h5>Execution Results</h5>
            {getExecutionTime() && (
              <span className="execution-time">
                Time: {getExecutionTime()}s
              </span>
            )}
          </div>

          {/* Console Output */}
          <div className="console-output-section">
            <h6>Console Output</h6>
            <div className="console-container" ref={consoleRef}>
              <AnimatePresence>
                {capturedConsoleLogs.map((log, index) => (
                  <motion.div
                    key={`${log.timestamp}-${index}`}
                    className={`console-line console-${log.type}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <span className="console-timestamp">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="console-message">{log.message}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {capturedConsoleLogs.length === 0 && (
                <div className="empty-console">
                  <div className="empty-icon">💻</div>
                  <div className="empty-text">No console output yet</div>
                  <div className="empty-subtext">Run your code to see output</div>
                </div>
              )}
            </div>
          </div>

          {/* Execution Results */}
          {executionResults.length > 0 && (
            <div className="results-section">
              <h6>Return Values</h6>
              <div className="results-list">
                {executionResults.map((result, index) => (
                  <motion.div
                    key={index}
                    className="result-item"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <span className="result-type">{result.type}:</span>
                    <span className="result-value">
                      {typeof result.value === 'object' 
                        ? JSON.stringify(result.value, null, 2)
                        : String(result.value)
                      }
                    </span>
                    <span className="result-time">({result.executionTime}ms)</span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Execution Errors */}
          {executionErrors.length > 0 && (
            <div className="errors-section">
              <h6>Errors</h6>
              <div className="errors-list">
                {executionErrors.map((error, index) => (
                  <motion.div
                    key={index}
                    className="error-item"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <span className="error-icon">❌</span>
                    <span className="error-message">{error}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}


        </div>
      </div>
    </div>
  );
};

export default CodeEditor; 