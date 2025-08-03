# JavaScript Event Loop Visualizer

An interactive web application that helps you understand JavaScript's execution model and the Event Loop through real-time visualization and code execution.

## 🎯 Features

### ✨ Real Code Execution
- **Live JavaScript execution** - Your code actually runs and produces real output
- **Real-time console capture** - See actual console.log, console.error, console.warn, console.info output
- **Safe execution environment** - Uses secure code execution methods
- **Error handling** - Comprehensive error reporting and debugging

### 🔄 Event Loop Visualization
- **Interactive visualization** of JavaScript's Event Loop components:
  - **Call Stack** - Where synchronous code executes
  - **Web APIs** - Browser APIs like setTimeout, fetch, etc.
  - **Callback Queue** - Stores callbacks from Web APIs
  - **Microtask Queue** - Higher priority queue for Promises and async/await
- **Real-time task movement** through the event loop
- **Step-by-step execution** with visual feedback

### 🎨 User Experience
- **Terminal-style console** with green text on black background
- **Animated task transitions** with smooth visual effects
- **Color-coded messages** for different console types
- **Auto-scrolling console** to keep latest output visible
- **Responsive design** that works on all devices

### 📚 Educational Examples
- **Pre-built code examples** demonstrating different concepts:
  - Basic synchronous execution
  - Async/await operations
  - setTimeout and callbacks
  - Promise microtasks
  - Complex event loop scenarios
- **Custom code input** - Write and execute your own JavaScript

## 🚀 Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/javascript-event-loop-visualizer.git
   cd javascript-event-loop-visualizer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173` to see the application

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## 🎮 How to Use

### 1. Select Code Example
Choose from predefined examples or write your own code:
- **Basic** - Simple synchronous operations
- **Async** - Async/await examples
- **setTimeout** - Timer-based callbacks
- **Promise** - Promise microtasks
- **Complex** - Mixed synchronous and asynchronous operations
- **Custom** - Write your own JavaScript code

### 2. Execute Code
Click the "Execute Code" button to:
- Run your JavaScript code in real-time
- See actual console output
- Watch tasks move through the event loop
- Understand execution order

### 3. Observe the Event Loop
Watch as tasks flow through:
1. **Call Stack** - Synchronous code execution
2. **Web APIs** - Asynchronous operations (setTimeout, fetch, etc.)
3. **Microtask Queue** - Promise callbacks and async/await
4. **Callback Queue** - Timer and event callbacks

### 4. Control Execution
- **Play/Pause** - Control the visualization speed
- **Speed Controls** - Adjust execution speed (Slow, Normal, Fast)
- **Clear All** - Reset the visualization

## 🛠️ Technology Stack

- **Frontend Framework**: React 18
- **State Management**: Redux Toolkit
- **Build Tool**: Vite
- **Styling**: CSS3 with custom animations
- **Animations**: Framer Motion
- **Code Execution**: Safe JavaScript evaluation

## 📁 Project Structure

```
event-loop-visualizer/
├── src/
│   ├── components/
│   │   ├── CallStack.jsx
│   │   ├── WebAPIs.jsx
│   │   ├── CallbackQueue.jsx
│   │   ├── MicrotaskQueue.jsx
│   │   ├── EventLoopVisualizer.jsx
│   │   └── ...
│   ├── store/
│   │   └── eventLoopSlice.js
│   ├── utils/
│   │   └── codeExecutor.js
│   └── ...
├── public/
├── package.json
└── README.md
```

## 🎓 Learning JavaScript Event Loop

This visualizer helps you understand:

### Core Concepts
- **Single-threaded nature** of JavaScript
- **Non-blocking I/O** operations
- **Event-driven programming** model
- **Asynchronous execution** patterns

### Event Loop Phases
1. **Execute synchronous code** in the call stack
2. **Process microtasks** (Promises, queueMicrotask)
3. **Process macrotasks** (setTimeout, setInterval, I/O)
4. **Render UI updates** (if needed)
5. **Repeat**

### Common Patterns
- **setTimeout vs setImmediate**
- **Promise vs setTimeout** execution order
- **Async/await** transformation to Promises
- **Event loop blocking** and performance implications

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by Philip Roberts' "What the heck is the event loop anyway?" talk
- Built with modern React and Redux patterns
- Designed for educational purposes

## 🔗 Live Demo

[Add your deployed URL here]

---

**Happy Learning! 🚀**

Understanding the JavaScript Event Loop is crucial for writing efficient, non-blocking code. This visualizer makes complex concepts accessible through interactive examples and real-time execution.
