import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TASK_STATUS, ANIMATION_STATES } from '../store/eventLoopSlice';

const CallStack = ({ tasks, onTaskClick, onTaskHover, onTaskLeave, selectedTask }) => {
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
      case TASK_STATUS.PENDING:
        return '#007bff';
      default:
        return '#17a2b8';
    }
  };

  const getTaskIcon = (task) => {
    switch (task.type) {
      case 'synchronous':
        return '⚡';
      case 'setTimeout':
        return '⏰';
      case 'promise':
        return '🔮';
      case 'asyncAwait':
        return '🔄';
      case 'functionCall':
        return '📞';
      case 'consoleLog':
        return '📝';
      default:
        return '📝';
    }
  };

  const getAnimationVariants = (task, index) => ({
    initial: { 
      opacity: 0, 
      y: 50, 
      scale: 0.8,
      x: -100,
      rotateX: -90,
      zIndex: 0
    },
    animate: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      x: 0,
      rotateX: 0,
      backgroundColor: getTaskColor(task),
      zIndex: tasks.length - index
    },
    exit: { 
      opacity: 0, 
      y: -50, 
      scale: 0.8,
      x: 100,
      rotateX: 90,
      zIndex: 0
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
    },
    stack: {
      y: index * -8,
      z: index * -10,
      transition: {
        duration: 0.3,
        ease: "easeInOut"
      }
    }
  });

  const getExecutionProgress = (task) => {
    if (task.status === TASK_STATUS.EXECUTING) {
      // Simulate execution progress based on task type
      const progress = Math.min(100, (Date.now() - (task.startTime || Date.now())) / 1000 * 50);
      return Math.max(0, progress);
    }
    return task.status === TASK_STATUS.COMPLETED ? 100 : 0;
  };

  return (
    <div className="call-stack-container">
      <div className="component-header">
        <h3>Call Stack</h3>
        <div className="component-description">
          LIFO stack of executing functions
        </div>
      </div>
      
      <div className="call-stack-area">
        <AnimatePresence>
          {tasks.map((task, index) => (
            <motion.div
              key={task.id}
              className={`task-item ${selectedTask?.id === task.id ? 'selected' : ''}`}
              variants={getAnimationVariants(task, index)}
              initial="initial"
              animate={task.status === TASK_STATUS.EXECUTING ? "executing" : "animate"}
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
                transform: `translateY(${index * -8}px)`,
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
                  <span className="stack-position">#{index + 1}</span>
                </div>
                {task.status === TASK_STATUS.EXECUTING && (
                  <div className="progress-bar">
                    <motion.div
                      className="progress-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${getExecutionProgress(task)}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                )}
              </div>
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
            <div className="empty-icon">📚</div>
            <div className="empty-text">Call stack is empty</div>
            <div className="empty-subtext">Functions will appear here when executing</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CallStack; 