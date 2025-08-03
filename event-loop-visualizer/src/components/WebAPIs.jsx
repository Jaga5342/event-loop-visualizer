import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TASK_STATUS, ANIMATION_STATES } from '../store/eventLoopSlice';

const WebAPIs = ({ tasks, onTaskClick, onTaskHover, onTaskLeave, selectedTask }) => {
  const [executingTasks, setExecutingTasks] = useState(new Set());

  useEffect(() => {
    const executing = new Set();
    tasks.forEach(task => {
      if (task.status === TASK_STATUS.EXECUTING) {
        executing.add(task.id);
      }
    });
    setExecutingTasks(executing);
  }, [tasks]);

  const getTaskColor = (task) => {
    switch (task.status) {
      case TASK_STATUS.EXECUTING:
        return '#28a745';
      case TASK_STATUS.COMPLETED:
        return '#6c757d';
      case TASK_STATUS.ERROR:
        return '#dc3545';
      case TASK_STATUS.WAITING:
        return '#ffc107';
      default:
        return '#17a2b8';
    }
  };

  const getTaskIcon = (task) => {
    switch (task.type) {
      case 'setTimeout':
        return '⏰';
      case 'setInterval':
        return '🔄';
      case 'fetch':
        return '🌐';
      case 'promise':
        return '🔮';
      case 'asyncAwait':
        return '⚡';
      default:
        return '📝';
    }
  };

  const getProgressPercentage = (task) => {
    if (task.type === 'setTimeout' && task.delay) {
      const elapsed = Date.now() - (task.startTime || Date.now());
      return Math.min((elapsed / task.delay) * 100, 100);
    }
    return 0;
  };

  const getAnimationVariants = (task, index) => ({
    initial: { 
      opacity: 0, 
      y: 50, 
      scale: 0.8,
      x: 100,
      rotateY: -90,
      zIndex: 0
    },
    animate: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      x: 0,
      rotateY: 0,
      backgroundColor: getTaskColor(task),
      zIndex: tasks.length - index
    },
    exit: { 
      opacity: 0, 
      y: -50, 
      scale: 0.8,
      x: -100,
      rotateY: 90,
      zIndex: 0
    },
    waiting: {
      scale: [1, 1.02, 1],
      boxShadow: [
        "0 2px 10px rgba(0,0,0,0.1)",
        "0 4px 15px rgba(255, 193, 7, 0.3)",
        "0 2px 10px rgba(0,0,0,0.1)"
      ],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    executing: {
      scale: [1, 1.05, 1],
      boxShadow: [
        "0 2px 10px rgba(0,0,0,0.1)",
        "0 4px 20px rgba(40, 167, 69, 0.3)",
        "0 2px 10px rgba(0,0,0,0.1)"
      ],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  });

  return (
    <div className="web-apis-container">
      <div className="component-header">
        <h3>Web APIs</h3>
        <div className="component-description">
          Browser APIs for async operations
        </div>
      </div>
      
      <div className="web-apis-area">
        <AnimatePresence>
          {tasks.map((task, index) => (
            <motion.div
              key={task.id}
              className={`task-item ${selectedTask?.id === task.id ? 'selected' : ''}`}
              variants={getAnimationVariants(task, index)}
              initial="initial"
              animate={task.status === TASK_STATUS.WAITING ? "waiting" : 
                      task.status === TASK_STATUS.EXECUTING ? "executing" : "animate"}
              exit="exit"
              transition={{ 
                duration: 0.5, 
                ease: "easeInOut",
                delay: index * 0.1 
              }}
              whileHover={{ 
                scale: 1.02,
                boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                zIndex: 100
              }}
              onClick={() => onTaskClick(task)}
              onMouseEnter={(e) => onTaskHover(task, e)}
              onMouseLeave={onTaskLeave}
              style={{
                backgroundColor: getTaskColor(task),
                transform: `translateX(${index * 15}px)`,
                zIndex: tasks.length - index,
                position: 'relative'
              }}
            >
              <div className="task-icon">{getTaskIcon(task)}</div>
              <div className="task-content">
                <div className="task-title">{task.description}</div>
                <div className="task-details">
                  <span className="task-type">{task.type}</span>
                  <span className="task-id">#{task.id}</span>
                  {task.delay && (
                    <span className="task-delay">{task.delay}ms</span>
                  )}
                  <span className="api-position">#{index + 1}</span>
                </div>
                {task.status === TASK_STATUS.WAITING && task.delay && (
                  <div className="progress-bar">
                    <motion.div
                      className="progress-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${getProgressPercentage(task)}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                )}
              </div>
              {task.status === TASK_STATUS.WAITING && (
                <motion.div
                  className="waiting-indicator"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{ 
                    duration: 1.5,
                    repeat: Infinity 
                  }}
                >
                  ⏳
                </motion.div>
              )}
              {task.status === TASK_STATUS.EXECUTING && (
                <motion.div
                  className="executing-indicator"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{ 
                    duration: 1,
                    repeat: Infinity 
                  }}
                >
                  ▶️
                </motion.div>
              )}
              {task.status === TASK_STATUS.COMPLETED && (
                <div className="completed-indicator">✅</div>
              )}
              {task.status === TASK_STATUS.ERROR && (
                <div className="error-indicator">❌</div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        
        {tasks.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🌐</div>
            <div className="empty-text">No Web API tasks</div>
            <div className="empty-subtext">setTimeout, fetch, etc. will appear here</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebAPIs; 