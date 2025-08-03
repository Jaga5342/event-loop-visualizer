
import React from 'react';
import './App.css';
import EventLoopVisualizer from './components/EventLoopVisualizer';

function App() {
  return (
    <div className="App">
      <header className="app-header">
        <div className="container">
          <h1 className="app-title">
            <span className="title-icon">🔄</span>
            JavaScript Event Loop Visualizer
          </h1>
          <p className="app-subtitle">
            Interactive visualization of how the JavaScript event loop works in browsers
          </p>
        </div>
      </header>
      
      <main className="app-main">
        <EventLoopVisualizer />
      </main>
      
      <footer className="app-footer">
        <div className="container">
          <p>
            Learn how JavaScript's event loop manages synchronous and asynchronous operations
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
