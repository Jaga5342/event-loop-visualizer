import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TASK_TYPES, 
  TASK_STATUS, 
  ANIMATION_STATES,
  EXECUTION_STEPS,
  addTask,
  executeNextTask,
  executeStep,
  setSelectedTask,
  setTooltip,
  setRunning,
  setPaused,
  setSpeed,
  clearAll,
  moveFromWebAPIToCallback,
  setCurrentCodeSample,
  clearConsoleOutput,
  completeTaskExecution,
  addConsoleOutput
} from '../store/eventLoopSlice';
import CallStack from './CallStack';
import WebAPIs from './WebAPIs';
import CallbackQueue from './CallbackQueue';
import MicrotaskQueue from './MicrotaskQueue';
import ExecutionArea from './ExecutionArea';
import CodeEditor from './CodeEditor';

const EventLoopVisualizer = () => {
  const dispatch = useDispatch();
  const [customCode, setCustomCode] = useState('');
  const [selectedCodeType, setSelectedCodeType] = useState('basic');
  const [isExecuting, setIsExecuting] = useState(false);
  
  const {
    callStack,
    webAPIs,
    callbackQueue,
    microtaskQueue,
    isRunning,
    speed,
    isPaused,
    currentExecutingTask,
    selectedTask,
    tooltip,
    executionStep,
    isAnimating,
    consoleOutput
  } = useSelector(state => state.eventLoop);

  const consoleRef = useRef(null);
  const animationIntervalRef = useRef(null);
  const stepIntervalRef = useRef(null);

  // Auto-scroll console to bottom when new messages arrive
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [consoleOutput]);

  // Predefined code examples
  const codeExamples = {
    basic: `console.log('Starting execution');
const result = 2 + 2;
console.log('Result:', result);
console.log('Execution complete');`,
    
    async: `async function asyncFunction() {
  console.log('Async function start');
  await Promise.resolve();
  console.log('After await');
}
asyncFunction();
console.log('After async call');`,
    
    setTimeout: `console.log('Start');
setTimeout(() => {
  console.log('Timeout callback executed');
}, 1000);
console.log('End');`,
    
    promise: `console.log('Start');
Promise.resolve().then(() => {
  console.log('Promise microtask executed');
});
console.log('End');`,
    
    complex: `console.log('Main thread start');
setTimeout(() => {
  console.log('Timeout 1');
}, 1000);
Promise.resolve().then(() => {
  console.log('Promise 1');
  setTimeout(() => {
    console.log('Timeout 2');
  }, 500);
});
console.log('Main thread end');`,
    
    custom: customCode
  };

  // Handle code type selection
  const handleCodeTypeChange = (type) => {
    setSelectedCodeType(type);
    if (type !== 'custom') {
      setCustomCode(codeExamples[type]);
    }
  };

  // Handle custom code input
  const handleCustomCodeChange = (e) => {
    setCustomCode(e.target.value);
    setSelectedCodeType('custom');
  };

  // Execute the current code with real execution
  const executeCode = async () => {
    const codeToExecute = selectedCodeType === 'custom' ? customCode : codeExamples[selectedCodeType];
    if (codeToExecute.trim() && !isExecuting) {
      setIsExecuting(true);
      dispatch(clearAll());
      dispatch(addConsoleOutput('🚀 Starting code execution...'));
      
      try {
        // Create a safe execution environment
        const originalConsole = {
          log: console.log,
          error: console.error,
          warn: console.warn,
          info: console.info
        };

        // Override console methods to capture output
        const capturedLogs = [];
        console.log = (...args) => {
          const message = args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' ');
          capturedLogs.push({ type: 'log', message, timestamp: Date.now() });
          dispatch(addConsoleOutput(`💬 ${message}`));
          originalConsole.log(...args);
        };

        console.error = (...args) => {
          const message = args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' ');
          capturedLogs.push({ type: 'error', message, timestamp: Date.now() });
          dispatch(addConsoleOutput(`❌ ${message}`));
          originalConsole.error(...args);
        };

        console.warn = (...args) => {
          const message = args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' ');
          capturedLogs.push({ type: 'warn', message, timestamp: Date.now() });
          dispatch(addConsoleOutput(`⚠️ ${message}`));
          originalConsole.warn(...args);
        };

        console.info = (...args) => {
          const message = args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' ');
          capturedLogs.push({ type: 'info', message, timestamp: Date.now() });
          dispatch(addConsoleOutput(`ℹ️ ${message}`));
          originalConsole.info(...args);
        };

        // Parse and create tasks for visualization
        const lines = codeToExecute.split('\n');
        let taskId = 1;
        const tasks = [];

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          let task = null;
          if (line.includes('console.log') || line.includes('console.error') || 
              line.includes('console.warn') || line.includes('console.info')) {
            task = {
              id: taskId++,
              type: TASK_TYPES.CONSOLE_LOG,
              description: `Console output: ${line}`,
              status: TASK_STATUS.PENDING,
              codeSample: line,
              lineNumber: i + 1,
              queue: 'callStack'
            };
          } else if (line.includes('setTimeout')) {
            const delayMatch = line.match(/setTimeout.*?(\d+)/);
            const delay = delayMatch ? parseInt(delayMatch[1]) : 1000;
            task = {
              id: taskId++,
              type: TASK_TYPES.SET_TIMEOUT,
              description: `setTimeout callback (${delay}ms)`,
              status: TASK_STATUS.WAITING,
              codeSample: line,
              delay: delay,
              lineNumber: i + 1,
              queue: 'webAPIs'
            };
          } else if (line.includes('Promise') || line.includes('new Promise')) {
            task = {
              id: taskId++,
              type: TASK_TYPES.PROMISE,
              description: 'Promise microtask',
              status: TASK_STATUS.PENDING,
              codeSample: line,
              lineNumber: i + 1,
              queue: 'microtaskQueue'
            };
          } else if (line.includes('async') || line.includes('await')) {
            task = {
              id: taskId++,
              type: TASK_TYPES.ASYNC_AWAIT,
              description: 'Async/await operation',
              status: TASK_STATUS.PENDING,
              codeSample: line,
              lineNumber: i + 1,
              queue: 'microtaskQueue'
            };
          } else if (line.includes('const') || line.includes('let') || line.includes('var')) {
            task = {
              id: taskId++,
              type: TASK_TYPES.VARIABLE_ASSIGNMENT,
              description: `Variable assignment: ${line}`,
              status: TASK_STATUS.PENDING,
              codeSample: line,
              lineNumber: i + 1,
              queue: 'callStack'
            };
          } else if (line.includes('function') || (line.includes('(') && line.includes(')'))) {
            task = {
              id: taskId++,
              type: TASK_TYPES.FUNCTION_CALL,
              description: `Function call: ${line}`,
              status: TASK_STATUS.PENDING,
              codeSample: line,
              lineNumber: i + 1,
              queue: 'callStack'
            };
          } else {
            task = {
              id: taskId++,
              type: TASK_TYPES.SYNCHRONOUS,
              description: `Synchronous: ${line}`,
              status: TASK_STATUS.PENDING,
              codeSample: line,
              lineNumber: i + 1,
              queue: 'callStack'
            };
          }

          if (task) {
            tasks.push(task);
            dispatch(addTask(task));
            dispatch(addConsoleOutput(`📝 Created task: ${task.description}`));
          }
        }

        // Execute the code
        dispatch(addConsoleOutput('⚡ Executing JavaScript code...'));
        
        // Create a safe execution context
        const safeEval = (code) => {
          // Create a new Function to avoid eval security issues
          const func = new Function('console', code);
          return func(console);
        };

        // Execute the code
        const result = safeEval(codeToExecute);
        
        if (result !== undefined) {
          dispatch(addConsoleOutput(`📤 Return value: ${JSON.stringify(result)}`));
        }

        // Restore original console methods
        console.log = originalConsole.log;
        console.error = originalConsole.error;
        console.warn = originalConsole.warn;
        console.info = originalConsole.info;

        dispatch(addConsoleOutput('🎉 Code execution completed successfully!'));
        
      } catch (error) {
        dispatch(addConsoleOutput(`❌ Execution error: ${error.message}`));
        console.error('Code execution error:', error);
      } finally {
        setIsExecuting(false);
      }
    }
  };

  // Start/stop the event loop simulation with enhanced workflow
  useEffect(() => {
    if (isRunning && !isPaused && !isAnimating) {
      animationIntervalRef.current = setInterval(() => {
        dispatch(executeNextTask());
      }, 3000 / speed); // Increased timing for better visualization
    } else {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
        animationIntervalRef.current = null;
      }
    }

    return () => {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
      }
    };
  }, [isRunning, isPaused, speed, dispatch, isAnimating]);

  // Handle step-by-step execution
  useEffect(() => {
    if (currentExecutingTask && executionStep !== EXECUTION_STEPS.IDLE) {
      const steps = [
        EXECUTION_STEPS.ENTERING_CALL_STACK,
        EXECUTION_STEPS.EXECUTING_CODE,
        EXECUTION_STEPS.COMPLETING
      ];
      
      let stepIndex = 0;
      const executeNextStep = () => {
        if (stepIndex < steps.length) {
          dispatch(executeStep(steps[stepIndex]));
          stepIndex++;
          stepIntervalRef.current = setTimeout(executeNextStep, 2000 / speed);
        } else {
          // Task execution complete - trigger completion
          setTimeout(() => {
            dispatch(completeTaskExecution(currentExecutingTask.id));
          }, 1000 / speed);
        }
      };
      
      executeNextStep();
    }

    return () => {
      if (stepIntervalRef.current) {
        clearTimeout(stepIntervalRef.current);
      }
    };
  }, [currentExecutingTask, executionStep, speed, dispatch]);

  // Enhanced task execution with automatic completion
  useEffect(() => {
    if (currentExecutingTask && executionStep === EXECUTION_STEPS.EXECUTING_CODE) {
      // Simulate task execution time based on task type
      let executionTime = 2000; // Default 2 seconds
      
      switch (currentExecutingTask.type) {
        case TASK_TYPES.CONSOLE_LOG:
          executionTime = 1000; // Fast for console.log
          break;
        case TASK_TYPES.SET_TIMEOUT:
          executionTime = 1500; // Medium for setTimeout
          break;
        case TASK_TYPES.PROMISE:
          executionTime = 1200; // Medium for Promise
          break;
        case TASK_TYPES.ASYNC_AWAIT:
          executionTime = 1800; // Medium for async/await
          break;
        case TASK_TYPES.VARIABLE_ASSIGNMENT:
          executionTime = 800; // Fast for variable assignment
          break;
        case TASK_TYPES.FUNCTION_CALL:
          executionTime = 1500; // Medium for function calls
          break;
        case TASK_TYPES.SYNCHRONOUS:
          executionTime = 1000; // Fast for synchronous tasks
          break;
        default:
          executionTime = 2000;
      }
      
      // Complete the task after execution time
      const completionTimer = setTimeout(() => {
        dispatch(completeTaskExecution(currentExecutingTask.id));
      }, executionTime / speed);
      
      return () => clearTimeout(completionTimer);
    }
  }, [currentExecutingTask, executionStep, speed, dispatch]);

  // Simulate Web API timeouts with enhanced animation
  useEffect(() => {
    webAPIs.forEach(task => {
      if (task.type === TASK_TYPES.SET_TIMEOUT && task.status === TASK_STATUS.WAITING && !task.timeoutSet) {
        // Mark that we've set a timeout for this task
        task.timeoutSet = true;
        
        setTimeout(() => {
          dispatch(moveFromWebAPIToCallback(task.id));
        }, (task.delay || 1000) / speed);
      }
    });
  }, [webAPIs, dispatch, speed]);

  const handleTaskClick = (task) => {
    dispatch(setSelectedTask(task));
    if (task.codeSample) {
      dispatch(setCurrentCodeSample(task.codeSample));
    }
  };

  const handleTaskHover = (task, event) => {
    const tooltipContent = getTooltipContent(task);
    dispatch(setTooltip({
      content: tooltipContent,
      position: { x: event.clientX, y: event.clientY }
    }));
  };

  const handleTaskLeave = () => {
    dispatch(setTooltip(null));
  };

  const getTooltipContent = (task) => {
    switch (task.type) {
      case TASK_TYPES.SYNCHRONOUS:
        return 'Synchronous task - executes immediately in the call stack';
      case TASK_TYPES.SET_TIMEOUT:
        return 'setTimeout task - moves to Web APIs, then to callback queue after delay';
      case TASK_TYPES.PROMISE:
        return 'Promise microtask - high priority, executes before next tick';
      case TASK_TYPES.ASYNC_AWAIT:
        return 'Async/await task - creates microtasks for each await';
      case TASK_TYPES.CONSOLE_LOG:
        return 'Console.log task - synchronous logging operation';
      case TASK_TYPES.VARIABLE_ASSIGNMENT:
        return 'Variable assignment - synchronous operation';
      case TASK_TYPES.FUNCTION_CALL:
        return 'Function call - synchronous execution';
      default:
        return 'Task in the event loop';
    }
  };

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
      case 'log':
        return '💬';
      case 'warn':
        return '⚠️';
      default:
        return '💬';
    }
  };

  return (
    <div className="event-loop-visualizer">
      <div className="container-fluid h-100">
        <div className="row h-100 g-3">
          {/* Main Event Loop Grid - Based on the diagram layout */}
          <div className="col-lg-9 h-100">
            <div className="event-loop-grid h-100">
              {/* Top Row - Call Stack, Web APIs, and JS Code */}
              <div className="event-loop-row top-row">
                <div className="event-loop-cell call-stack-cell">
                  <CallStack 
                    tasks={callStack}
                    onTaskClick={handleTaskClick}
                    onTaskHover={handleTaskHover}
                    onTaskLeave={handleTaskLeave}
                    selectedTask={selectedTask}
                  />
                </div>
                <div className="event-loop-cell web-apis-cell">
                  <WebAPIs 
                    tasks={webAPIs}
                    onTaskClick={handleTaskClick}
                    onTaskHover={handleTaskHover}
                    onTaskLeave={handleTaskLeave}
                    selectedTask={selectedTask}
                  />
                </div>
                <div className="event-loop-cell js-code-cell">
                  <div className="js-code-container">
                    <div className="component-header">
                      <h3>JS Code</h3>
                      <div className="component-description">
                        Enter your code or select examples
                      </div>
                    </div>
                    
                    {/* Code Type Selector */}
                    <div className="code-type-selector">
                      <div className="code-tabs">
                        {Object.keys(codeExamples).map((type) => (
                          <button
                            key={type}
                            className={`code-tab ${selectedCodeType === type ? 'active' : ''}`}
                            onClick={() => handleCodeTypeChange(type)}
                          >
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Code Input Area */}
                    <div className="code-input-area">
                      <textarea
                        className="code-textarea"
                        value={selectedCodeType === 'custom' ? customCode : codeExamples[selectedCodeType]}
                        onChange={handleCustomCodeChange}
                        placeholder="Enter your JavaScript code here..."
                        rows={8}
                        disabled={isExecuting}
                      />
                    </div>

                    {/* Code Controls */}
                    <div className="code-controls">
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={executeCode}
                        disabled={isExecuting}
                      >
                        {isExecuting ? '⏳ Executing...' : '▶️ Execute Code'}
                      </button>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => dispatch(clearAll())}
                        disabled={isExecuting}
                      >
                        🗑️ Clear All
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Row - Microtask Queue, Callback Queue, and Console Output */}
              <div className="event-loop-row bottom-row">
                <div className="event-loop-cell microtask-cell">
                  <MicrotaskQueue 
                    tasks={microtaskQueue}
                    onTaskClick={handleTaskClick}
                    onTaskHover={handleTaskHover}
                    onTaskLeave={handleTaskLeave}
                    selectedTask={selectedTask}
                  />
                </div>
                <div className="event-loop-cell callback-cell">
                  <CallbackQueue 
                    tasks={callbackQueue}
                    onTaskClick={handleTaskClick}
                    onTaskHover={handleTaskHover}
                    onTaskLeave={handleTaskLeave}
                    selectedTask={selectedTask}
                  />
                </div>
                <div className="event-loop-cell console-cell">
                  <div className="console-output-container">
                    <div className="component-header">
                      <h3>Console Output</h3>
                      <div className="component-description">
                        Real-time execution results and logs
                      </div>
                    </div>
                    <div className="console-output-area">
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
                            <div className="empty-subtext">Execute code to see output</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Controls and Code Panel */}
          <div className="col-lg-3 h-100">
            <div className="controls-panel h-100">
              <div className="component-header">
                <h3>Event Loop Status</h3>
                <div className="component-description">
                  {isExecuting ? 'Code execution in progress' : 'Ready for execution'}
                </div>
              </div>
              
              <div className="status-info">
                <div className="status-item">
                  <span className="status-label">Status:</span>
                  <span className="status-value">
                    {isExecuting ? '🔄 Executing' : isRunning ? '🔄 Running' : '⏸️ Paused'}
                  </span>
                </div>
                
                <div className="status-item">
                  <span className="status-label">Speed:</span>
                  <span className="status-value">
                    {speed === 0.5 ? '🐌 Slow' : speed === 1 ? '⚡ Normal' : '🚀 Fast'}
                  </span>
                </div>
                
                <div className="status-item">
                  <span className="status-label">Tasks:</span>
                  <span className="status-value">
                    {callStack.length + webAPIs.length + microtaskQueue.length + callbackQueue.length} total
                  </span>
                </div>
                
                {currentExecutingTask && (
                  <div className="current-task-status">
                    <div className="status-label">Current Task:</div>
                    <div className="task-info">
                      <div className="task-type">{currentExecutingTask.type}</div>
                      <div className="task-description">{currentExecutingTask.description}</div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="simple-controls">
                <button 
                  className="btn btn-primary btn-sm w-100 mb-2"
                  onClick={() => dispatch(setRunning(!isRunning))}
                  disabled={isExecuting}
                >
                  {isRunning ? '⏸️ Pause' : '▶️ Resume'}
                </button>
                
                <button 
                  className="btn btn-secondary btn-sm w-100 mb-2"
                  onClick={() => dispatch(clearAll())}
                  disabled={isExecuting}
                >
                  🗑️ Clear All
                </button>
                
                <div className="speed-controls">
                  <label className="speed-label">Speed:</label>
                  <div className="btn-group w-100">
                    <button 
                      className={`btn btn-sm ${speed === 0.5 ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => dispatch(setSpeed(0.5))}
                      disabled={isExecuting}
                    >
                      🐌
                    </button>
                    <button 
                      className={`btn btn-sm ${speed === 1 ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => dispatch(setSpeed(1))}
                      disabled={isExecuting}
                    >
                      ⚡
                    </button>
                    <button 
                      className={`btn btn-sm ${speed === 2 ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => dispatch(setSpeed(2))}
                      disabled={isExecuting}
                    >
                      🚀
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Tooltip */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            className="enhanced-tooltip"
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{
              position: 'fixed',
              left: tooltip.position.x + 10,
              top: tooltip.position.y - 10,
              zIndex: 1000,
            }}
          >
            <div className="tooltip-content">
              {tooltip.content}
            </div>
            <div className="tooltip-arrow"></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EventLoopVisualizer; 