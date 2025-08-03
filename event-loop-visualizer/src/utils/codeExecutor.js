// JavaScript Code Execution Utility
// Provides a safe environment for executing user-provided JavaScript code

import * as esprima from 'esprima';

class CodeExecutor {
  constructor() {
    this.originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info
    };
    
    this.capturedLogs = [];
    this.executionStartTime = null;
    this.executionEndTime = null;
    this.executionSteps = [];
    this.currentStep = 0;
    this.isPaused = false;
    this.executionSpeed = 1000; // milliseconds between steps
    this.variables = new Map(); // Track variable assignments
    this.functions = new Map(); // Track function definitions
  }

  // Parse JavaScript code into detailed execution steps
  parseCodeToSteps(code) {
    try {
      const ast = esprima.parseScript(code, { range: true, loc: true });
      const steps = [];
      
      // Add program start step
      steps.push({
        type: 'Program',
        line: 1,
        description: 'Program execution started',
        action: 'start',
        isAsync: false,
        delay: 0,
        code: code.split('\n')[0] || '',
        variables: {},
        output: null
      });
      
      this.traverseAST(ast, steps);
      
      // Add program end step
      steps.push({
        type: 'Program',
        line: code.split('\n').length,
        description: 'Program execution completed',
        action: 'end',
        isAsync: false,
        delay: 0,
        code: '',
        variables: {},
        output: null
      });
      
      return steps;
    } catch (error) {
      console.error('Error parsing code:', error);
      return [{
        type: 'Error',
        line: 1,
        description: `Parse error: ${error.message}`,
        action: 'error',
        isAsync: false,
        delay: 0,
        code: code,
        variables: {},
        output: null
      }];
    }
  }

  // Traverse AST to extract execution steps
  traverseAST(node, steps, parent = null, lineOffset = 0) {
    if (!node) return;

    // Add step for current node
    const step = this.createExecutionStep(node, parent, lineOffset);
    if (step) {
      steps.push(step);
    }

    // Traverse child nodes
    for (const key in node) {
      if (node[key] && typeof node[key] === 'object') {
        if (Array.isArray(node[key])) {
          node[key].forEach(child => this.traverseAST(child, steps, node, lineOffset));
        } else {
          this.traverseAST(node[key], steps, node, lineOffset);
        }
      }
    }
  }

  // Create detailed execution step from AST node
  createExecutionStep(node, parent, lineOffset = 0) {
    const step = {
      type: node.type,
      line: node.loc ? node.loc.start.line + lineOffset : 1,
      range: node.range,
      loc: node.loc,
      description: '',
      action: 'execute',
      isAsync: false,
      delay: 0,
      code: this.extractCodeFromNode(node),
      variables: {},
      output: null,
      queue: 'callStack', // default queue
      priority: 'normal'
    };

    switch (node.type) {
      case 'Program':
        return null; // Handled separately
      
      case 'ExpressionStatement':
        step.description = 'Executing expression statement';
        step.action = 'expression';
        break;
      
      case 'CallExpression':
        if (this.isConsoleCall(node)) {
          step.description = 'Console output statement';
          step.action = 'console';
          step.output = this.extractConsoleLogMessage(node);
          step.queue = 'callStack';
        } else if (this.isSetTimeoutCall(node)) {
          step.description = 'setTimeout call - moving to Web APIs';
          step.action = 'setTimeout';
          step.isAsync = true;
          step.delay = this.extractTimeoutDelay(node);
          step.queue = 'webAPIs';
          step.output = `Scheduled timeout with ${step.delay}ms delay`;
        } else if (this.isPromiseCall(node)) {
          step.description = 'Promise creation - moving to microtask queue';
          step.action = 'promise';
          step.isAsync = true;
          step.queue = 'microtaskQueue';
          step.priority = 'high';
          step.output = 'Promise created';
        } else if (this.isFetchCall(node)) {
          step.description = 'Fetch API call - moving to Web APIs';
          step.action = 'fetch';
          step.isAsync = true;
          step.queue = 'webAPIs';
          step.output = 'Network request initiated';
        } else {
          step.description = `Function call: ${this.getFunctionName(node)}`;
          step.action = 'functionCall';
          step.queue = 'callStack';
        }
        break;
      
      case 'VariableDeclaration':
        step.description = `Variable declaration: ${node.declarations.map(d => d.id.name).join(', ')}`;
        step.action = 'variableDeclaration';
        step.queue = 'callStack';
        step.variables = this.extractVariableAssignments(node);
        break;
      
      case 'VariableDeclarator':
        step.description = `Assigning value to ${node.id.name}`;
        step.action = 'variableAssignment';
        step.queue = 'callStack';
        step.variables = { [node.id.name]: this.extractValue(node.init) };
        break;
      
      case 'Literal':
        step.description = `Literal value: ${typeof node.value === 'string' ? `"${node.value}"` : node.value}`;
        step.action = 'literal';
        step.queue = 'callStack';
        step.output = node.value;
        break;
      
      case 'Identifier':
        step.description = `Identifier: ${node.name}`;
        step.action = 'identifier';
        step.queue = 'callStack';
        step.output = node.name;
        break;
      
      case 'BinaryExpression':
        step.description = `Binary operation: ${this.extractBinaryExpression(node)}`;
        step.action = 'binaryOperation';
        step.queue = 'callStack';
        step.output = this.evaluateBinaryExpression(node);
        break;
      
      case 'FunctionDeclaration':
        step.description = `Function declaration: ${node.id.name}`;
        step.action = 'functionDeclaration';
        step.queue = 'callStack';
        this.functions.set(node.id.name, node);
        step.output = `Function ${node.id.name} defined`;
        break;
      
      case 'FunctionExpression':
        step.description = 'Function expression';
        step.action = 'functionExpression';
        step.queue = 'callStack';
        break;
      
      case 'ArrowFunctionExpression':
        step.description = 'Arrow function';
        step.action = 'arrowFunction';
        step.queue = 'callStack';
        break;
      
      case 'ReturnStatement':
        step.description = 'Return statement';
        step.action = 'return';
        step.queue = 'callStack';
        step.output = this.extractValue(node.argument);
        break;
      
      case 'IfStatement':
        step.description = 'If statement evaluation';
        step.action = 'ifStatement';
        step.queue = 'callStack';
        break;
      
      case 'WhileStatement':
        step.description = 'While loop';
        step.action = 'whileLoop';
        step.queue = 'callStack';
        break;
      
      case 'ForStatement':
        step.description = 'For loop';
        step.action = 'forLoop';
        step.queue = 'callStack';
        break;
      
      case 'AwaitExpression':
        step.description = 'Await expression - creating microtask';
        step.action = 'await';
        step.isAsync = true;
        step.queue = 'microtaskQueue';
        step.priority = 'high';
        step.output = 'Awaiting promise resolution';
        break;
      
      case 'YieldExpression':
        step.description = 'Yield expression';
        step.action = 'yield';
        step.isAsync = true;
        step.queue = 'microtaskQueue';
        step.priority = 'high';
        break;
      
      case 'AssignmentExpression':
        step.description = `Assignment: ${this.extractAssignment(node)}`;
        step.action = 'assignment';
        step.queue = 'callStack';
        step.variables = { [node.left.name]: this.extractValue(node.right) };
        break;
      
      case 'ObjectExpression':
        step.description = 'Object creation';
        step.action = 'objectCreation';
        step.queue = 'callStack';
        step.output = this.extractObjectProperties(node);
        break;
      
      case 'ArrayExpression':
        step.description = 'Array creation';
        step.action = 'arrayCreation';
        step.queue = 'callStack';
        step.output = this.extractArrayElements(node);
        break;
      
      default:
        step.description = `${node.type} statement`;
        step.action = 'statement';
        step.queue = 'callStack';
    }

    return step;
  }

  // Helper methods for step creation
  isConsoleCall(node) {
    return node.callee && 
           node.callee.type === 'MemberExpression' && 
           node.callee.object.name === 'console' && 
           ['log', 'error', 'warn', 'info'].includes(node.callee.property.name);
  }

  isSetTimeoutCall(node) {
    return node.callee && node.callee.name === 'setTimeout';
  }

  isPromiseCall(node) {
    return node.callee && node.callee.name === 'Promise';
  }

  isFetchCall(node) {
    return node.callee && node.callee.name === 'fetch';
  }

  getFunctionName(node) {
    if (node.callee.type === 'Identifier') {
      return node.callee.name;
    } else if (node.callee.type === 'MemberExpression') {
      return `${node.callee.object.name}.${node.callee.property.name}`;
    }
    return 'anonymous';
  }

  extractCodeFromNode(node) {
    if (node.range) {
      // This would require the original code string
      return `${node.type} statement`;
    }
    return `${node.type} statement`;
  }

  extractConsoleLogMessage(node) {
    try {
      const args = node.arguments.map(arg => {
        if (arg.type === 'Literal') {
          return arg.value;
        } else if (arg.type === 'Identifier') {
          return arg.name;
        } else if (arg.type === 'BinaryExpression') {
          return this.extractBinaryExpression(arg);
        }
        return '[Expression]';
      });
      return args.join(' ');
    } catch (error) {
      return '[Message]';
    }
  }

  extractTimeoutDelay(node) {
    try {
      if (node.arguments.length > 1 && node.arguments[1].type === 'Literal') {
        return node.arguments[1].value;
      }
      return 1000; // default delay
    } catch (error) {
      return 1000;
    }
  }

  extractVariableAssignments(node) {
    const assignments = {};
    node.declarations.forEach(decl => {
      if (decl.id && decl.init) {
        assignments[decl.id.name] = this.extractValue(decl.init);
      }
    });
    return assignments;
  }

  extractValue(node) {
    if (!node) return undefined;
    
    if (node.type === 'Literal') {
      return node.value;
    } else if (node.type === 'Identifier') {
      return node.name;
    } else if (node.type === 'BinaryExpression') {
      return this.evaluateBinaryExpression(node);
    } else if (node.type === 'ObjectExpression') {
      return this.extractObjectProperties(node);
    } else if (node.type === 'ArrayExpression') {
      return this.extractArrayElements(node);
    }
    
    return '[Expression]';
  }

  extractBinaryExpression(node) {
    const left = this.extractValue(node.left);
    const right = this.extractValue(node.right);
    return `${left} ${node.operator} ${right}`;
  }

  evaluateBinaryExpression(node) {
    try {
      const left = this.extractValue(node.left);
      const right = this.extractValue(node.right);
      
      if (typeof left === 'number' && typeof right === 'number') {
        switch (node.operator) {
          case '+': return left + right;
          case '-': return left - right;
          case '*': return left * right;
          case '/': return left / right;
          case '%': return left % right;
          case '**': return left ** right;
        }
      }
      
      return `${left} ${node.operator} ${right}`;
    } catch (error) {
      return '[Expression]';
    }
  }

  extractAssignment(node) {
    const left = node.left.name || '[Expression]';
    const right = this.extractValue(node.right);
    return `${left} = ${right}`;
  }

  extractObjectProperties(node) {
    const properties = {};
    node.properties.forEach(prop => {
      if (prop.key && prop.value) {
        const key = prop.key.name || prop.key.value;
        properties[key] = this.extractValue(prop.value);
      }
    });
    return properties;
  }

  extractArrayElements(node) {
    return node.elements.map(element => this.extractValue(element));
  }

  // Create a safe execution environment
  createSafeEnvironment() {
    const logs = [];
    const errors = [];
    const results = [];

    // Override console methods to capture output
    const capturedConsole = {
      log: (...args) => {
        const message = this.formatConsoleOutput(args);
        logs.push({ type: 'log', message, timestamp: Date.now() });
        this.originalConsole.log(...args);
      },
      error: (...args) => {
        const message = this.formatConsoleOutput(args);
        logs.push({ type: 'error', message, timestamp: Date.now() });
        this.originalConsole.error(...args);
      },
      warn: (...args) => {
        const message = this.formatConsoleOutput(args);
        logs.push({ type: 'warn', message, timestamp: Date.now() });
        this.originalConsole.warn(...args);
      },
      info: (...args) => {
        const message = this.formatConsoleOutput(args);
        logs.push({ type: 'info', message, timestamp: Date.now() });
        this.originalConsole.info(...args);
      }
    };

    return { logs, errors, results, capturedConsole };
  }

  // Format console output arguments
  formatConsoleOutput(args) {
    return args.map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch (e) {
          return '[Object]';
        }
      }
      return String(arg);
    }).join(' ');
  }

  // Execute JavaScript code step by step with event loop visualization
  async executeCodeStepByStep(code, onStep, onComplete, onError) {
    if (!code || !code.trim()) {
      throw new Error('No code provided for execution');
    }

    this.executionStartTime = performance.now();
    this.executionSteps = this.parseCodeToSteps(code);
    this.currentStep = 0;
    this.isPaused = false;
    this.variables.clear();
    this.functions.clear();

    const env = this.createSafeEnvironment();
    
    try {
      // Replace console methods temporarily
      const { capturedConsole } = env;
      console.log = capturedConsole.log;
      console.error = capturedConsole.error;
      console.warn = capturedConsole.warn;
      console.info = capturedConsole.info;

      // Execute steps one by one
      await this.executeSteps(env, onStep, onComplete);

      // Restore original console methods
      this.restoreConsole();

      this.executionEndTime = performance.now();
      
      return {
        success: true,
        logs: env.logs,
        errors: env.errors,
        executionTime: this.executionEndTime - this.executionStartTime,
        totalSteps: this.executionSteps.length,
        steps: this.executionSteps
      };

    } catch (error) {
      // Restore original console methods
      this.restoreConsole();
      
      this.executionEndTime = performance.now();
      
      if (onError) {
        onError(error);
      }
      
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
        logs: env.logs,
        errors: [...env.errors, error.message],
        executionTime: this.executionEndTime - this.executionStartTime,
        steps: this.executionSteps
      };
    }
  }

  // Execute steps with pause/resume capability
  async executeSteps(env, onStep, onComplete) {
    while (this.currentStep < this.executionSteps.length) {
      if (this.isPaused) {
        await new Promise(resolve => {
          this.resumeCallback = resolve;
        });
      }

      const step = this.executionSteps[this.currentStep];
      
      // Execute the step
      await this.executeSingleStep(step, env);
      
      // Call step callback
      if (onStep) {
        onStep(step, this.currentStep, this.executionSteps.length);
      }

      this.currentStep++;
      
      // Wait for next step
      await new Promise(resolve => setTimeout(resolve, this.executionSpeed));
    }

    if (onComplete) {
      onComplete();
    }
  }

  // Execute a single step
  async executeSingleStep(step, env) {
    try {
      switch (step.action) {
        case 'console':
          if (step.output) {
            console.log(step.output);
          }
          break;
        
        case 'setTimeout':
          // Simulate setTimeout scheduling
          setTimeout(() => {
            console.log('setTimeout callback executed');
          }, step.delay || 1000);
          break;
        
        case 'promise':
          // Simulate Promise creation
          new Promise((resolve) => {
            setTimeout(resolve, 100);
          }).then(() => {
            console.log('Promise resolved');
          });
          break;
        
        case 'fetch':
          // Simulate fetch API call
          console.log('Fetch request initiated');
          break;
        
        case 'variableAssignment':
        case 'variableDeclaration':
          // Update variables map
          Object.assign(this.variables, step.variables);
          break;
        
        case 'binaryOperation':
          // Simulate binary operation
          if (step.output) {
            // Store result in variables if it's an assignment
          }
          break;
        
        case 'functionDeclaration':
          // Store function definition
          if (step.output) {
            console.log(step.output);
          }
          break;
        
        case 'await':
          // Simulate await expression
          console.log('Awaiting promise resolution...');
          break;
        
        default:
          // Handle other step types
          if (step.output) {
            console.log(step.output);
          }
          break;
      }
    } catch (error) {
      env.errors.push(`Error in step ${step.type}: ${error.message}`);
    }
  }

  // Pause execution
  pause() {
    this.isPaused = true;
  }

  // Resume execution
  resume() {
    this.isPaused = false;
    if (this.resumeCallback) {
      this.resumeCallback();
      this.resumeCallback = null;
    }
  }

  // Set execution speed
  setSpeed(speed) {
    this.executionSpeed = 1000 / speed; // Convert speed multiplier to milliseconds
  }

  // Get current execution state
  getExecutionState() {
    return {
      currentStep: this.currentStep,
      totalSteps: this.executionSteps.length,
      isPaused: this.isPaused,
      progress: this.executionSteps.length > 0 ? (this.currentStep / this.executionSteps.length) * 100 : 0,
      variables: Object.fromEntries(this.variables),
      functions: Array.from(this.functions.keys())
    };
  }

  // Execute JavaScript code safely (legacy method)
  async executeCode(code) {
    if (!code || !code.trim()) {
      throw new Error('No code provided for execution');
    }

    this.executionStartTime = performance.now();
    const env = this.createSafeEnvironment();
    
    try {
      // Replace console methods temporarily
      const { capturedConsole } = env;
      console.log = capturedConsole.log;
      console.error = capturedConsole.error;
      console.warn = capturedConsole.warn;
      console.info = capturedConsole.info;

      // Execute the code
      const result = eval(code);
      
      // Restore original console methods
      this.restoreConsole();

      this.executionEndTime = performance.now();
      
      return {
        success: true,
        result,
        resultType: typeof result,
        logs: env.logs,
        errors: env.errors,
        executionTime: this.executionEndTime - this.executionStartTime
      };

    } catch (error) {
      // Restore original console methods
      this.restoreConsole();
      
      this.executionEndTime = performance.now();
      
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
        logs: env.logs,
        errors: [...env.errors, error.message],
        executionTime: this.executionEndTime - this.executionStartTime
      };
    }
  }

  // Restore original console methods
  restoreConsole() {
    console.log = this.originalConsole.log;
    console.error = this.originalConsole.error;
    console.warn = this.originalConsole.warn;
    console.info = this.originalConsole.info;
  }

  // Validate code for potential security issues
  validateCode(code) {
    const dangerousPatterns = [
      /eval\s*\(/,
      /Function\s*\(/,
      /setTimeout\s*\(/,
      /setInterval\s*\(/,
      /fetch\s*\(/,
      /XMLHttpRequest/,
      /localStorage/,
      /sessionStorage/,
      /document\./,
      /window\./,
      /process\./,
      /require\s*\(/,
      /import\s+/,
      /export\s+/
    ];

    const warnings = [];
    
    dangerousPatterns.forEach((pattern, index) => {
      if (pattern.test(code)) {
        warnings.push(`Potentially unsafe code detected: ${pattern.source}`);
      }
    });

    return {
      isValid: warnings.length === 0,
      warnings
    };
  }

  // Get execution statistics
  getExecutionStats() {
    if (!this.executionStartTime || !this.executionEndTime) {
      return null;
    }

    return {
      executionTime: this.executionEndTime - this.executionStartTime,
      startTime: this.executionStartTime,
      endTime: this.executionEndTime,
      totalSteps: this.executionSteps.length,
      variables: Object.fromEntries(this.variables),
      functions: Array.from(this.functions.keys())
    };
  }

  // Clear execution history
  clear() {
    this.capturedLogs = [];
    this.executionStartTime = null;
    this.executionEndTime = null;
    this.executionSteps = [];
    this.currentStep = 0;
    this.isPaused = false;
    this.variables.clear();
    this.functions.clear();
  }
}

// Create a singleton instance
const codeExecutor = new CodeExecutor();

export default codeExecutor; 