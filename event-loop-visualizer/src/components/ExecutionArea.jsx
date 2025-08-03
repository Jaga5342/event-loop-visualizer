import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  EXECUTION_STEPS,
  setCurrentCodeLine,
  completeTaskExecution,
  addConsoleOutput
} from '../store/eventLoopSlice';

const ExecutionArea = ({ currentTask }) => {
  const dispatch = useDispatch();
  const {
    executionStep,
    currentCodeLine,
    currentCodeSample,
    codeSamples,
    consoleOutput
  } = useSelector(state => state.eventLoop);

  const consoleRef = useRef(null);

  // Auto-scroll console to bottom
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [consoleOutput]);

  // Simulate code execution steps
  useEffect(() => {
    if (currentTask && executionStep === EXECUTION_STEPS.EXECUTING_CODE) {
      const codeLines = codeSamples[currentCodeSample].split('\n');
      
      // Simulate line-by-line execution
      let lineIndex = 0;
      const executeLine = () => {
        if (lineIndex < codeLines.length) {
          dispatch(setCurrentCodeLine(lineIndex));
          
          const line = codeLines[lineIndex].trim();
          
          // Enhanced line parsing with better console.log extraction
          if (line.includes('console.log')) {
            // Extract the message from console.log with better regex
            const match = line.match(/console\.log\(['"`]([^'"`]+)['"`]\)/);
            if (match) {
              dispatch(addConsoleOutput(match[1]));
            } else {
              dispatch(addConsoleOutput('Console output'));
            }
          } else if (line.includes('setTimeout')) {
            dispatch(addConsoleOutput('setTimeout scheduled - moving to Web APIs'));
          } else if (line.includes('Promise')) {
            dispatch(addConsoleOutput('Promise created - moving to microtask queue'));
          } else if (line.includes('await')) {
            dispatch(addConsoleOutput('Awaiting Promise resolution...'));
          } else if (line.includes('const') || line.includes('let') || line.includes('var')) {
            const varMatch = line.match(/(?:const|let|var)\s+(\w+)/);
            if (varMatch) {
              dispatch(addConsoleOutput(`Variable '${varMatch[1]}' declared`));
            } else {
              dispatch(addConsoleOutput('Variable assigned'));
            }
          } else if (line.includes('function') || line.includes('=>')) {
            dispatch(addConsoleOutput('Function defined'));
          } else if (line.includes('async')) {
            dispatch(addConsoleOutput('Async function declared'));
          } else if (line.includes('return')) {
            dispatch(addConsoleOutput('Return statement executed'));
          } else if (line.includes('if') || line.includes('else')) {
            dispatch(addConsoleOutput('Conditional statement evaluated'));
          } else if (line.includes('for') || line.includes('while')) {
            dispatch(addConsoleOutput('Loop iteration'));
          } else if (line.trim()) {
            dispatch(addConsoleOutput('Expression executed'));
          }
          
          lineIndex++;
          setTimeout(executeLine, 1000); // 1 second delay between lines
        } else {
          // Execution complete
          setTimeout(() => {
            dispatch(completeTaskExecution(currentTask.id));
          }, 500);
        }
      };
      
      executeLine();
    }
  }, [currentTask, executionStep, dispatch, currentCodeSample, codeSamples]);

  const getCurrentCode = () => {
    return codeSamples[currentCodeSample] || '';
  };

  const getCodeLines = () => {
    return getCurrentCode().split('\n');
  };

  const getExecutionStatus = () => {
    switch (executionStep) {
      case EXECUTION_STEPS.ENTERING_CALL_STACK:
        return { status: 'Entering Call Stack', color: '#007bff' };
      case EXECUTION_STEPS.EXECUTING_CODE:
        return { status: 'Executing Code', color: '#28a745' };
      case EXECUTION_STEPS.CREATING_PROMISE:
        return { status: 'Creating Promise', color: '#ffc107' };
      case EXECUTION_STEPS.AWAITING_RESOLUTION:
        return { status: 'Awaiting Resolution', color: '#fd7e14' };
      case EXECUTION_STEPS.MOVING_TO_QUEUE:
        return { status: 'Moving to Queue', color: '#6f42c1' };
      case EXECUTION_STEPS.COMPLETING:
        return { status: 'Completing', color: '#6c757d' };
      default:
        return { status: 'Idle', color: '#6c757d' };
    }
  };

  const executionStatus = getExecutionStatus();

  const getConsoleMessageIcon = (type) => {
    switch (type) {
      case 'info':
        return 'ℹ️';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'result':
        return '🔗';
      default:
        return '📝';
    }
  };

  return (
    <div className="execution-area">
      <div className="component-header">
        <h3>Code Execution</h3>
        <div className="execution-status">
          <motion.div
            className="status-indicator"
            animate={{ 
              backgroundColor: executionStatus.color,
              scale: currentTask ? [1, 1.1, 1] : 1
            }}
            transition={{ 
              duration: 1,
              repeat: currentTask ? Infinity : 0
            }}
          />
          <span className="status-text">{executionStatus.status}</span>
        </div>
      </div>

      <div className="execution-container">
        <div className="row">
          {/* Code Display */}
          <div className="col-md-6">
            <div className="code-display">
              <h5>Current Code</h5>
              <div className="code-editor">
                <pre className="code-block">
                  {getCodeLines().map((line, index) => (
                    <motion.div
                      key={index}
                      className={`code-line ${index === currentCodeLine ? 'highlighted' : ''}`}
                      animate={{
                        backgroundColor: index === currentCodeLine ? 'rgba(40, 167, 69, 0.2)' : 'transparent',
                        borderLeft: index === currentCodeLine ? '3px solid #28a745' : '3px solid transparent'
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <span className="line-number">{index + 1}</span>
                      <span className="line-content">{line}</span>
                      {index === currentCodeLine && currentTask && (
                        <motion.div
                          className="execution-cursor"
                          animate={{ opacity: [1, 0, 1] }}
                          transition={{ duration: 0.8, repeat: Infinity }}
                        >
                          ▶
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </pre>
              </div>
            </div>
          </div>

          {/* Console Output */}
          <div className="col-md-6">
            <div className="console-output">
              <h5>Console Output</h5>
              <div className="console-container" ref={consoleRef}>
                <AnimatePresence>
                  {consoleOutput.map((output, index) => (
                    <motion.div
                      key={output.timestamp}
                      className={`console-line console-${output.type || 'log'}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <span className="console-timestamp">
                        {new Date(output.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="console-message">
                        {getConsoleMessageIcon(output.type)} {output.message}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {consoleOutput.length === 0 && (
                  <div className="empty-console">
                    <div className="empty-icon">💻</div>
                    <div className="empty-text">No console output yet</div>
                    <div className="empty-subtext">Start execution to see output</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Current Task Info */}
        {currentTask && (
          <div className="current-task-info">
            <motion.div
              className="task-execution-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <div className="task-header">
                <h6>Currently Executing</h6>
                <div className="task-type-badge">{currentTask.type}</div>
              </div>
              <div className="task-description">{currentTask.description}</div>
              <div className="task-progress">
                <motion.div
                  className="progress-bar"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 3, ease: 'easeInOut' }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExecutionArea; 