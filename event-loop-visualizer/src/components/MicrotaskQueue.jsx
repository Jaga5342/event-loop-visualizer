import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TASK_STATUS, ANIMATION_STATES } from '../store/eventLoopSlice';

const MicrotaskQueue = ({ tasks, onTaskClick, onTaskHover, onTaskLeave, selectedTask }) => {
  const getTaskColor = (task) => {
    switch (task.status) {
      case TASK_STATUS.EXECUTING:
        return '#28a745';
      case TASK_STATUS.COMPLETED:
        return '#6c757d';
      case TASK_STATUS.ERROR:
        return '#dc3545';
      default:
        return '#20c997';
    }
  };

  const getTaskIcon = (task) => {
    switch (task.type) {
      case 'promise':
        return '🔮';
      case 'asyncAwait':
        return '🔄';
      case 'queueMicrotask':
        return '⚡';
      case 'mutationObserver':
        return '👁️';
      default:
        return '📝';
    }
  };

  const getAnimationVariants = (task, index) => ({
    initial: { 
      opacity: 0, 
      y: 50, 
      scale: 0.8,
      x: 100,
      rotateZ: -90,
      zIndex: 0
    },
    animate: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      x: 0,
      rotateZ: 0,
      backgroundColor: getTaskColor(task),
      zIndex: tasks.length - index
    },
    exit: { 
      opacity: 0, 
      y: -50, 
      scale: 0.8,
      x: -100,
      rotateZ: 90,
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
    queued: {
      scale: [1, 1.02, 1],
      boxShadow: [
        "0 2px 10px rgba(0,0,0,0.1)",
        "0 4px 15px rgba(32, 201, 151, 0.3)",
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
    <div className="microtask-queue-container">
      <div className="component-header">
        <h3>Microtask Queue</h3>
        <div className="component-description">
          High-priority tasks (Promise, async/await)
        </div>
      </div>
      
      <div className="microtask-queue-area">
        <AnimatePresence>
          {tasks.map((task, index) => (
            <motion.div
              key={task.id}
              className={`task-item ${selectedTask?.id === task.id ? 'selected' : ''}`}
              variants={getAnimationVariants(task, index)}
              initial="initial"
              animate={task.status === TASK_STATUS.EXECUTING ? "executing" : 
                      task.status === TASK_STATUS.PENDING ? "queued" : "animate"}
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
                  <span className="queue-position">#{index + 1}</span>
                </div>
                {task.status === TASK_STATUS.EXECUTING && (
                  <div className="progress-bar">
                    <motion.div
                      className="progress-fill"
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 1, ease: "easeOut" }}
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
              {task.status === TASK_STATUS.PENDING && (
                <motion.div
                  className="pending-indicator"
                  animate={{ 
                    scale: [1, 1.1, 1],
                    opacity: [0.7, 1, 0.7]
                  }}
                  transition={{ 
                    duration: 1.5,
                    repeat: Infinity 
                  }}
                >
                  ⏳
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
            <div className="empty-icon">🔮</div>
            <div className="empty-text">No tasks in microtask queue</div>
            <div className="empty-subtext">Promise and async tasks appear here</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MicrotaskQueue; 