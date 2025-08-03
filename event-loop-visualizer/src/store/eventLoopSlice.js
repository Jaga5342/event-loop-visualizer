import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Helper functions for console messages
const getTaskStartMessage = (task) => {
  const timestamp = new Date().toLocaleTimeString();
  switch (task.type) {
    case TASK_TYPES.CONSOLE_LOG:
      return `📝 [${timestamp}] Executing console.log: ${task.description}`;
    case TASK_TYPES.SET_TIMEOUT:
      return `⏰ [${timestamp}] Executing setTimeout callback (${task.delay}ms)`;
    case TASK_TYPES.PROMISE:
      return `🔮 [${timestamp}] Executing Promise microtask`;
    case TASK_TYPES.ASYNC_AWAIT:
      return `🔄 [${timestamp}] Executing async/await operation`;
    case TASK_TYPES.VARIABLE_ASSIGNMENT:
      return `📊 [${timestamp}] Executing variable assignment`;
    case TASK_TYPES.FUNCTION_CALL:
      return `📞 [${timestamp}] Executing function call`;
    case TASK_TYPES.SYNCHRONOUS:
      return `⚡ [${timestamp}] Executing synchronous task`;
    default:
      return `🔄 [${timestamp}] Executing: ${task.description}`;
  }
};

const getTaskCompletionMessage = (task) => {
  const timestamp = new Date().toLocaleTimeString();
  switch (task.type) {
    case TASK_TYPES.CONSOLE_LOG:
      return `✅ [${timestamp}] Console.log completed: ${task.description}`;
    case TASK_TYPES.SET_TIMEOUT:
      return `✅ [${timestamp}] setTimeout callback completed (${task.delay}ms)`;
    case TASK_TYPES.PROMISE:
      return `✅ [${timestamp}] Promise microtask completed`;
    case TASK_TYPES.ASYNC_AWAIT:
      return `✅ [${timestamp}] Async/await operation completed`;
    case TASK_TYPES.VARIABLE_ASSIGNMENT:
      return `✅ [${timestamp}] Variable assignment completed`;
    case TASK_TYPES.FUNCTION_CALL:
      return `✅ [${timestamp}] Function call completed`;
    case TASK_TYPES.SYNCHRONOUS:
      return `✅ [${timestamp}] Synchronous task completed`;
    default:
      return `✅ [${timestamp}] Task completed: ${task.description}`;
  }
};

const getTaskExecutionResult = (task) => {
  const timestamp = new Date().toLocaleTimeString();
  switch (task.type) {
    case TASK_TYPES.CONSOLE_LOG:
      // Extract the actual console.log message
      const logMatch = task.description.match(/Console\.log: (.+)/);
      if (logMatch) {
        return `📤 [${timestamp}] Output: ${logMatch[1]}`;
      }
      return null;
    case TASK_TYPES.VARIABLE_ASSIGNMENT:
      // Extract variable assignment result
      const varMatch = task.description.match(/Variable assignment: (.+)/);
      if (varMatch) {
        return `📊 [${timestamp}] Result: ${varMatch[1]}`;
      }
      return null;
    case TASK_TYPES.FUNCTION_CALL:
      // Extract function call result
      const funcMatch = task.description.match(/Function call: (.+)/);
      if (funcMatch) {
        return `📞 [${timestamp}] Function executed: ${funcMatch[1]}`;
      }
      return null;
    case TASK_TYPES.SET_TIMEOUT:
      return `⏰ [${timestamp}] Callback executed after ${task.delay}ms delay`;
    case TASK_TYPES.PROMISE:
      return `🔮 [${timestamp}] Promise resolved successfully`;
    case TASK_TYPES.ASYNC_AWAIT:
      return `🔄 [${timestamp}] Async operation resolved`;
    default:
      return null;
  }
};

// Task types
export const TASK_TYPES = {
  SYNCHRONOUS: 'synchronous',
  SET_TIMEOUT: 'setTimeout',
  PROMISE: 'promise',
  ASYNC_AWAIT: 'asyncAwait',
  SET_INTERVAL: 'setInterval',
  FETCH: 'fetch',
  CONSOLE_LOG: 'consoleLog',
  VARIABLE_ASSIGNMENT: 'variableAssignment',
  FUNCTION_CALL: 'functionCall',
};

// Task status
export const TASK_STATUS = {
  PENDING: 'pending',
  EXECUTING: 'executing',
  COMPLETED: 'completed',
  ERROR: 'error',
  WAITING: 'waiting',
};

// Animation states
export const ANIMATION_STATES = {
  IDLE: 'idle',
  MOVING: 'moving',
  EXECUTING: 'executing',
  TRANSITIONING: 'transitioning',
};

// Execution steps for dynamic workflow
export const EXECUTION_STEPS = {
  IDLE: 'idle',
  ENTERING_CALL_STACK: 'entering_call_stack',
  EXECUTING_CODE: 'executing_code',
  CREATING_PROMISE: 'creating_promise',
  AWAITING_RESOLUTION: 'awaiting_resolution',
  MOVING_TO_QUEUE: 'moving_to_queue',
  COMPLETING: 'completing',
};

// Code execution steps
export const CODE_EXECUTION_STEPS = {
  PARSING: 'parsing',
  EXECUTING: 'executing',
  COMPLETED: 'completed',
  ERROR: 'error',
};

const initialState = {
  // Event loop components
  callStack: [],
  webAPIs: [],
  callbackQueue: [],
  microtaskQueue: [],
  
  // Animation and control
  isRunning: false,
  speed: 1, // 0.5, 1, 2
  isPaused: false,
  
  // Task management
  nextTaskId: 1,
  currentExecutingTask: null,
  
  // UI state
  selectedTask: null,
  tooltip: null,
  
  // Code panel with dynamic execution
  codeSamples: {
    synchronous: `console.log('Starting execution');
const result = 2 + 2;
console.log('Result:', result);
console.log('Execution complete');`,
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
    asyncAwait: `async function asyncFunction() {
  console.log('Async function start');
  await Promise.resolve();
  console.log('After await');
}
asyncFunction();
console.log('After async call');`,
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
  },
  
  // Dynamic execution state
  currentCodeLine: 0,
  currentCodeSample: 'synchronous',
  executionStep: EXECUTION_STEPS.IDLE,
  consoleOutput: [],
  
  // Animation queue
  animationQueue: [],
  isAnimating: false,
  
  // Custom code execution
  customCode: '',
  isExecutingCustomCode: false,
  executionResults: [],
  executionErrors: [],
  capturedConsoleLogs: [],
  executionStartTime: null,
  executionEndTime: null,
  
  // Enhanced code execution workflow
  codeExecutionSteps: [],
  currentCodeStep: 0,
  codeExecutionState: CODE_EXECUTION_STEPS.PARSING,
  codeExecutionProgress: 0,
  codeExecutionVariables: {},
  codeExecutionFunctions: [],
  isCodeExecuting: false,
  codeExecutionSpeed: 1000,
  codeExecutionPaused: false,
};

// Async thunk for parsing and executing custom code
export const executeCustomCode = createAsyncThunk(
  'eventLoop/executeCustomCode',
  async (code, { getState, dispatch }) => {
    const state = getState();
    
    // Import the code executor
    const codeExecutor = (await import('../utils/codeExecutor')).default;
    
    // Parse code into steps
    const steps = codeExecutor.parseCodeToSteps(code);
    
    // Clear previous execution state
    dispatch(clearCodeExecutionState());
    
    // Set execution steps
    dispatch(setCodeExecutionSteps(steps));
    dispatch(setCodeExecutionState(CODE_EXECUTION_STEPS.EXECUTING));
    
    return { steps, code };
  }
);

// Async thunk for executing next code step
export const executeNextCodeStep = createAsyncThunk(
  'eventLoop/executeNextCodeStep',
  async (_, { getState, dispatch }) => {
    const state = getState();
    const { codeExecutionSteps, currentCodeStep, isCodeExecuting } = state.eventLoop;
    
    if (!isCodeExecuting || currentCodeStep >= codeExecutionSteps.length) {
      return null;
    }
    
    const step = codeExecutionSteps[currentCodeStep];
    
    // Execute the step based on its type
    switch (step.queue) {
      case 'callStack':
        dispatch(addToCallStack({
          id: Date.now() + Math.random(),
          type: getTaskTypeFromStep(step),
          description: step.description,
          delay: step.delay || 0,
          status: TASK_STATUS.PENDING,
          timestamp: Date.now(),
          animationState: ANIMATION_STATES.MOVING,
          codeSample: 'custom',
          executionSteps: [step],
          currentStep: 0,
        }));
        break;
        
      case 'webAPIs':
        dispatch(addToWebAPIs({
          id: Date.now() + Math.random(),
          type: getTaskTypeFromStep(step),
          description: step.description,
          delay: step.delay || 0,
          status: TASK_STATUS.WAITING,
          timestamp: Date.now(),
          animationState: ANIMATION_STATES.MOVING,
          codeSample: 'custom',
          executionSteps: [step],
          currentStep: 0,
        }));
        break;
        
      case 'microtaskQueue':
        dispatch(addToMicrotaskQueue({
          id: Date.now() + Math.random(),
          type: getTaskTypeFromStep(step),
          description: step.description,
          delay: step.delay || 0,
          status: TASK_STATUS.PENDING,
          timestamp: Date.now(),
          animationState: ANIMATION_STATES.MOVING,
          codeSample: 'custom',
          executionSteps: [step],
          currentStep: 0,
        }));
        break;
    }
    
    // Add console output if present
    if (step.output) {
      dispatch(addConsoleOutput(step.output));
    }
    
    // Update variables
    if (Object.keys(step.variables).length > 0) {
      dispatch(updateCodeExecutionVariables(step.variables));
    }
    
    return step;
  }
);

// Helper function to get task type from execution step
const getTaskTypeFromStep = (step) => {
  switch (step.action) {
    case 'console':
      return TASK_TYPES.CONSOLE_LOG;
    case 'setTimeout':
      return TASK_TYPES.SET_TIMEOUT;
    case 'promise':
      return TASK_TYPES.PROMISE;
    case 'fetch':
      return TASK_TYPES.FETCH;
    case 'await':
      return TASK_TYPES.ASYNC_AWAIT;
    case 'variableAssignment':
    case 'variableDeclaration':
      return TASK_TYPES.VARIABLE_ASSIGNMENT;
    case 'functionCall':
    case 'functionDeclaration':
      return TASK_TYPES.FUNCTION_CALL;
    default:
      return TASK_TYPES.SYNCHRONOUS;
  }
};

// Async thunk for adding tasks with dynamic workflow
export const addTask = createAsyncThunk(
  'eventLoop/addTask',
  async ({ type, delay = 0, description, codeSample = 'synchronous' }, { getState, dispatch }) => {
    const state = getState();
    const taskId = state.eventLoop.nextTaskId;
    
    const task = {
      id: taskId,
      type,
      description,
      delay,
      status: TASK_STATUS.PENDING,
      timestamp: Date.now(),
      animationState: ANIMATION_STATES.IDLE,
      codeSample,
      executionSteps: [],
      currentStep: 0,
    };
    
    return task;
  }
);

// Async thunk for executing tasks with step-by-step workflow
export const executeNextTask = createAsyncThunk(
  'eventLoop/executeNextTask',
  async (_, { getState, dispatch }) => {
    const state = getState();
    
    // Check microtask queue first (higher priority)
    if (state.eventLoop.microtaskQueue.length > 0) {
      const task = state.eventLoop.microtaskQueue[0];
      dispatch(executeMicrotaskWithSteps(task));
      return { task, type: 'microtask' };
    }
    
    // Then check callback queue
    if (state.eventLoop.callbackQueue.length > 0) {
      const task = state.eventLoop.callbackQueue[0];
      dispatch(executeCallbackWithSteps(task));
      return { task, type: 'callback' };
    }
    
    // Finally check call stack
    if (state.eventLoop.callStack.length > 0) {
      const task = state.eventLoop.callStack[0];
      dispatch(executeSynchronousTaskWithSteps(task));
      return { task, type: 'synchronous' };
    }
    
    return null;
  }
);

// Async thunk for step-by-step execution
export const executeStep = createAsyncThunk(
  'eventLoop/executeStep',
  async (step, { getState, dispatch }) => {
    const state = getState();
    const currentTask = state.eventLoop.currentExecutingTask;
    
    if (!currentTask) return null;
    
    // Execute the specific step
    switch (step) {
      case EXECUTION_STEPS.ENTERING_CALL_STACK:
        dispatch(setExecutionStep(EXECUTION_STEPS.ENTERING_CALL_STACK));
        break;
      case EXECUTION_STEPS.EXECUTING_CODE:
        dispatch(setExecutionStep(EXECUTION_STEPS.EXECUTING_CODE));
        dispatch(addConsoleOutput(`Executing: ${currentTask.description}`));
        break;
      case EXECUTION_STEPS.CREATING_PROMISE:
        dispatch(setExecutionStep(EXECUTION_STEPS.CREATING_PROMISE));
        dispatch(addConsoleOutput('Creating Promise...'));
        break;
      case EXECUTION_STEPS.AWAITING_RESOLUTION:
        dispatch(setExecutionStep(EXECUTION_STEPS.AWAITING_RESOLUTION));
        dispatch(addConsoleOutput('Awaiting Promise resolution...'));
        break;
      case EXECUTION_STEPS.MOVING_TO_QUEUE:
        dispatch(setExecutionStep(EXECUTION_STEPS.MOVING_TO_QUEUE));
        break;
      case EXECUTION_STEPS.COMPLETING:
        dispatch(setExecutionStep(EXECUTION_STEPS.COMPLETING));
        dispatch(addConsoleOutput(`Completed: ${currentTask.description}`));
        break;
    }
    
    return step;
  }
);

const eventLoopSlice = createSlice({
  name: 'eventLoop',
  initialState,
  reducers: {
    // Task management with enhanced workflow
    addToCallStack: (state, action) => {
      const task = action.payload;
      task.status = TASK_STATUS.PENDING;
      task.animationState = ANIMATION_STATES.MOVING;
      state.callStack.push(task);
      state.nextTaskId += 1;
    },
    
    addToWebAPIs: (state, action) => {
      const task = action.payload;
      task.status = TASK_STATUS.WAITING;
      task.animationState = ANIMATION_STATES.MOVING;
      state.webAPIs.push(task);
      state.nextTaskId += 1;
    },
    
    addToCallbackQueue: (state, action) => {
      const task = action.payload;
      task.status = TASK_STATUS.PENDING;
      task.animationState = ANIMATION_STATES.MOVING;
      state.callbackQueue.push(task);
    },
    
    addToMicrotaskQueue: (state, action) => {
      const task = action.payload;
      task.status = TASK_STATUS.PENDING;
      task.animationState = ANIMATION_STATES.MOVING;
      state.microtaskQueue.push(task);
      state.nextTaskId += 1;
    },
    
    // Enhanced task execution with console output
    executeSynchronousTaskWithSteps: (state, action) => {
      const task = action.payload;
      task.status = TASK_STATUS.EXECUTING;
      task.animationState = ANIMATION_STATES.EXECUTING;
      state.currentExecutingTask = task;
      state.executionStep = EXECUTION_STEPS.ENTERING_CALL_STACK;
      
      // Add console output for task start
      const startMessage = getTaskStartMessage(task);
      state.consoleOutput.push({
        message: startMessage,
        timestamp: Date.now(),
        type: 'info'
      });
      
      // Remove from call stack
      state.callStack = state.callStack.filter(t => t.id !== task.id);
    },
    
    executeCallbackWithSteps: (state, action) => {
      const task = action.payload;
      task.status = TASK_STATUS.EXECUTING;
      task.animationState = ANIMATION_STATES.EXECUTING;
      state.currentExecutingTask = task;
      state.executionStep = EXECUTION_STEPS.EXECUTING_CODE;
      
      // Add console output for callback execution
      const startMessage = getTaskStartMessage(task);
      state.consoleOutput.push({
        message: startMessage,
        timestamp: Date.now(),
        type: 'info'
      });
      
      // Remove from callback queue
      state.callbackQueue = state.callbackQueue.filter(t => t.id !== task.id);
    },
    
    executeMicrotaskWithSteps: (state, action) => {
      const task = action.payload;
      task.status = TASK_STATUS.EXECUTING;
      task.animationState = ANIMATION_STATES.EXECUTING;
      state.currentExecutingTask = task;
      state.executionStep = EXECUTION_STEPS.EXECUTING_CODE;
      
      // Add console output for microtask execution
      const startMessage = getTaskStartMessage(task);
      state.consoleOutput.push({
        message: startMessage,
        timestamp: Date.now(),
        type: 'info'
      });
      
      // Remove from microtask queue
      state.microtaskQueue = state.microtaskQueue.filter(t => t.id !== task.id);
    },
    
    // Complete task execution
    completeTaskExecution: (state, action) => {
      const taskId = action.payload;
      const task = state.currentExecutingTask;
      
      if (task && task.id === taskId) {
        task.status = TASK_STATUS.COMPLETED;
        task.animationState = ANIMATION_STATES.IDLE;
        
        // Add console output for task completion
        const completionMessage = getTaskCompletionMessage(task);
        state.consoleOutput.push({
          message: completionMessage,
          timestamp: Date.now(),
          type: 'success'
        });
        
        // Add execution result based on task type
        const executionResult = getTaskExecutionResult(task);
        if (executionResult) {
          state.consoleOutput.push({
            message: executionResult,
            timestamp: Date.now(),
            type: 'result'
          });
        }
        
        state.currentExecutingTask = null;
        state.executionStep = EXECUTION_STEPS.IDLE;
        
        // Keep only last 20 console outputs
        if (state.consoleOutput.length > 20) {
          state.consoleOutput = state.consoleOutput.slice(-20);
        }
      }
    },
    
    // Enhanced task error handling
    setTaskError: (state, action) => {
      const { taskId, error } = action.payload;
      const task = state.currentExecutingTask;
      
      if (task && task.id === taskId) {
        task.status = TASK_STATUS.ERROR;
        task.animationState = ANIMATION_STATES.IDLE;
        
        // Add error message to console
        state.consoleOutput.push({
          message: `❌ Error in ${task.description}: ${error}`,
          timestamp: Date.now(),
          type: 'error'
        });
        
        state.currentExecutingTask = null;
        state.executionStep = EXECUTION_STEPS.IDLE;
        
        // Keep only last 20 console outputs
        if (state.consoleOutput.length > 20) {
          state.consoleOutput = state.consoleOutput.slice(-20);
        }
      }
    },
    
    // Animation and control
    setRunning: (state, action) => {
      state.isRunning = action.payload;
    },
    
    setSpeed: (state, action) => {
      state.speed = action.payload;
    },
    
    setPaused: (state, action) => {
      state.isPaused = action.payload;
    },
    
    // UI state
    setSelectedTask: (state, action) => {
      state.selectedTask = action.payload;
    },
    
    setTooltip: (state, action) => {
      state.tooltip = action.payload;
    },
    
    // Execution state management
    setExecutionStep: (state, action) => {
      state.executionStep = action.payload;
    },
    
    setCurrentCodeLine: (state, action) => {
      state.currentCodeLine = action.payload;
    },
    
    setCurrentCodeSample: (state, action) => {
      state.currentCodeSample = action.payload;
    },
    
    addConsoleOutput: (state, action) => {
      state.consoleOutput.push({
        message: action.payload,
        timestamp: Date.now(),
        type: 'log'
      });
      
      // Keep only last 20 console outputs
      if (state.consoleOutput.length > 20) {
        state.consoleOutput = state.consoleOutput.slice(-20);
      }
    },
    
    clearConsoleOutput: (state) => {
      state.consoleOutput = [];
    },
    
    // Clear all queues
    clearAll: (state) => {
      state.callStack = [];
      state.webAPIs = [];
      state.callbackQueue = [];
      state.microtaskQueue = [];
      state.currentExecutingTask = null;
      state.selectedTask = null;
      state.tooltip = null;
      state.executionStep = EXECUTION_STEPS.IDLE;
      state.currentCodeLine = 0;
      // Clear custom code execution results
      state.customCode = '';
      state.isExecutingCustomCode = false;
      state.executionResults = [];
      state.executionErrors = [];
      state.capturedConsoleLogs = [];
      state.executionStartTime = null;
      state.executionEndTime = null;
      // Clear enhanced code execution state
      state.codeExecutionSteps = [];
      state.currentCodeStep = 0;
      state.codeExecutionState = CODE_EXECUTION_STEPS.PARSING;
      state.codeExecutionProgress = 0;
      state.codeExecutionVariables = {};
      state.codeExecutionFunctions = [];
      state.isCodeExecuting = false;
      state.codeExecutionPaused = false;
    },
    
    // Move task from Web APIs to callback queue (simulating timeout completion)
    moveFromWebAPIToCallback: (state, action) => {
      const taskId = action.payload;
      const taskIndex = state.webAPIs.findIndex(t => t.id === taskId);
      
      if (taskIndex !== -1) {
        const task = state.webAPIs[taskIndex];
        task.animationState = ANIMATION_STATES.MOVING;
        state.webAPIs.splice(taskIndex, 1);
        state.callbackQueue.push(task);
      }
    },
    
    // Animation state management
    setAnimating: (state, action) => {
      state.isAnimating = action.payload;
    },
    
    // Custom code execution
    setCustomCode: (state, action) => {
      state.customCode = action.payload;
    },
    
    setExecutingCustomCode: (state, action) => {
      state.isExecutingCustomCode = action.payload;
    },
    
    addExecutionResult: (state, action) => {
      state.executionResults.push(action.payload);
    },
    
    addExecutionError: (state, action) => {
      state.executionErrors.push(action.payload);
    },
    
    addCapturedConsoleLog: (state, action) => {
      state.capturedConsoleLogs.push({
        message: action.payload,
        timestamp: Date.now(),
        type: 'log'
      });
    },
    
    setExecutionStartTime: (state, action) => {
      state.executionStartTime = action.payload;
    },
    
    setExecutionEndTime: (state, action) => {
      state.executionEndTime = action.payload;
    },
    
    clearExecutionResults: (state) => {
      state.executionResults = [];
      state.executionErrors = [];
      state.capturedConsoleLogs = [];
      state.executionStartTime = null;
      state.executionEndTime = null;
    },
    
    // Enhanced code execution workflow
    setCodeExecutionSteps: (state, action) => {
      state.codeExecutionSteps = action.payload;
      state.currentCodeStep = 0;
      state.codeExecutionProgress = 0;
    },
    
    setCurrentCodeStep: (state, action) => {
      state.currentCodeStep = action.payload;
      state.codeExecutionProgress = state.codeExecutionSteps.length > 0 
        ? (action.payload / state.codeExecutionSteps.length) * 100 
        : 0;
    },
    
    setCodeExecutionState: (state, action) => {
      state.codeExecutionState = action.payload;
    },
    
    updateCodeExecutionVariables: (state, action) => {
      state.codeExecutionVariables = { ...state.codeExecutionVariables, ...action.payload };
    },
    
    setCodeExecutionFunctions: (state, action) => {
      state.codeExecutionFunctions = action.payload;
    },
    
    setIsCodeExecuting: (state, action) => {
      state.isCodeExecuting = action.payload;
    },
    
    setCodeExecutionSpeed: (state, action) => {
      state.codeExecutionSpeed = action.payload;
    },
    
    setCodeExecutionPaused: (state, action) => {
      state.codeExecutionPaused = action.payload;
    },
    
    clearCodeExecutionState: (state) => {
      state.codeExecutionSteps = [];
      state.currentCodeStep = 0;
      state.codeExecutionState = CODE_EXECUTION_STEPS.PARSING;
      state.codeExecutionProgress = 0;
      state.codeExecutionVariables = {};
      state.codeExecutionFunctions = [];
      state.isCodeExecuting = false;
      state.codeExecutionPaused = false;
    },
    
    // Legacy methods for backward compatibility
    executeSynchronousTask: (state, action) => {
      const task = action.payload;
      task.status = TASK_STATUS.EXECUTING;
      task.animationState = ANIMATION_STATES.EXECUTING;
      state.currentExecutingTask = task;
      
      // Remove from call stack
      state.callStack = state.callStack.filter(t => t.id !== task.id);
      
      // Mark as completed immediately for synchronous tasks
      task.status = TASK_STATUS.COMPLETED;
      task.animationState = ANIMATION_STATES.IDLE;
      state.currentExecutingTask = null;
    },
    
    executeCallback: (state, action) => {
      const task = action.payload;
      task.status = TASK_STATUS.EXECUTING;
      task.animationState = ANIMATION_STATES.EXECUTING;
      state.currentExecutingTask = task;
      
      // Remove from callback queue
      state.callbackQueue = state.callbackQueue.filter(t => t.id !== task.id);
      
      // Mark as completed immediately for callback tasks
      task.status = TASK_STATUS.COMPLETED;
      task.animationState = ANIMATION_STATES.IDLE;
      state.currentExecutingTask = null;
    },
    
    executeMicrotask: (state, action) => {
      const task = action.payload;
      task.status = TASK_STATUS.EXECUTING;
      task.animationState = ANIMATION_STATES.EXECUTING;
      state.currentExecutingTask = task;
      
      // Remove from microtask queue
      state.microtaskQueue = state.microtaskQueue.filter(t => t.id !== task.id);
      
      // Mark as completed immediately for microtask tasks
      task.status = TASK_STATUS.COMPLETED;
      task.animationState = ANIMATION_STATES.IDLE;
      state.currentExecutingTask = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(addTask.fulfilled, (state, action) => {
        const task = action.payload;
        
        // Add to appropriate queue based on type
        if (task.type === TASK_TYPES.SYNCHRONOUS || task.type === TASK_TYPES.CONSOLE_LOG || task.type === TASK_TYPES.VARIABLE_ASSIGNMENT || task.type === TASK_TYPES.FUNCTION_CALL) {
          state.callStack.push(task);
        } else if (task.type === TASK_TYPES.PROMISE || task.type === TASK_TYPES.ASYNC_AWAIT) {
          state.microtaskQueue.push(task);
        } else {
          state.webAPIs.push(task);
        }
        
        state.nextTaskId += 1;
      })
      .addCase(executeStep.fulfilled, (state, action) => {
        // Step execution completed
        state.isAnimating = false;
      })
      .addCase(executeCustomCode.fulfilled, (state, action) => {
        // Code parsing completed, ready for execution
        state.isCodeExecuting = true;
        state.codeExecutionPaused = false;
      })
      .addCase(executeNextCodeStep.fulfilled, (state, action) => {
        if (action.payload) {
          // Move to next step
          state.currentCodeStep += 1;
          state.codeExecutionProgress = state.codeExecutionSteps.length > 0 
            ? (state.currentCodeStep / state.codeExecutionSteps.length) * 100 
            : 0;
          
          // Check if execution is complete
          if (state.currentCodeStep >= state.codeExecutionSteps.length) {
            state.isCodeExecuting = false;
            state.codeExecutionState = CODE_EXECUTION_STEPS.COMPLETED;
          }
        }
      });
  },
});

export const {
  addToCallStack,
  addToWebAPIs,
  addToCallbackQueue,
  addToMicrotaskQueue,
  executeSynchronousTaskWithSteps,
  executeCallbackWithSteps,
  executeMicrotaskWithSteps,
  completeTaskExecution,
  setRunning,
  setSpeed,
  setPaused,
  setSelectedTask,
  setTooltip,
  setExecutionStep,
  setCurrentCodeLine,
  setCurrentCodeSample,
  addConsoleOutput,
  clearConsoleOutput,
  clearAll,
  moveFromWebAPIToCallback,
  setAnimating,
  // Custom code execution exports
  setCustomCode,
  setExecutingCustomCode,
  addExecutionResult,
  addExecutionError,
  addCapturedConsoleLog,
  setExecutionStartTime,
  setExecutionEndTime,
  clearExecutionResults,
  // Enhanced code execution exports
  setCodeExecutionSteps,
  setCurrentCodeStep,
  setCodeExecutionState,
  updateCodeExecutionVariables,
  setCodeExecutionFunctions,
  setIsCodeExecuting,
  setCodeExecutionSpeed,
  setCodeExecutionPaused,
  clearCodeExecutionState,
  // Legacy exports
  executeSynchronousTask,
  executeCallback,
  executeMicrotask,
  setTaskError,
} = eventLoopSlice.actions;

export default eventLoopSlice.reducer; 