import React from 'react';
import { useApp } from '../context/AppContext';
import { Calendar, CheckSquare, Clock, Trash2, CheckCircle, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Dashboard: React.FC = () => {
  const { events, tasks, executeAction } = useApp();

  const handleCompleteTask = (id: number) => {
    executeAction('COMPLETE_TASK', { id });
  };

  const handleDeleteTask = (id: number) => {
    executeAction('DELETE_TASK', { id });
  };

  const handleDeleteEvent = (id: number) => {
    executeAction('DELETE_EVENT', { id });
  };

  return (
    <div className="flex flex-col h-full gap-8 p-8 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
      >
        {/* Events Section */}
        <div className="bg-[var(--bg-secondary)] rounded-3xl p-6 border border-[var(--bg-tertiary)] shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-[var(--accent-primary)]/10 rounded-2xl">
              <Calendar className="w-6 h-6 text-[var(--accent-primary)]" />
            </div>
            <h2 className="text-2xl font-display font-semibold tracking-tight text-[var(--text-primary)]">Upcoming Events</h2>
          </div>
          
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {events.length === 0 ? (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[var(--text-secondary)] text-sm italic p-4 text-center bg-[var(--bg-tertiary)]/50 rounded-xl"
                >
                  No upcoming events. Time to relax! 🌴
                </motion.p>
              ) : (
                events.map((event, index) => (
                  <motion.div 
                    key={event.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.1 }}
                    className="group flex items-start justify-between p-4 rounded-2xl bg-[var(--bg-primary)] hover:bg-[var(--bg-tertiary)] transition-colors border border-[var(--bg-tertiary)] hover:border-[var(--accent-primary)]/20"
                  >
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center justify-center w-12 h-12 bg-[var(--bg-secondary)] rounded-xl border border-[var(--bg-tertiary)] shadow-sm">
                         <span className="text-[10px] font-bold text-[var(--accent-primary)] uppercase">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                         <span className="text-lg font-bold text-[var(--text-primary)]">{new Date(event.date).getDate()}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-[var(--text-primary)] text-lg leading-tight">{event.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mt-1.5 font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{event.time}</span>
                          {event.duration && <span className="px-1.5 py-0.5 bg-[var(--bg-tertiary)] rounded-md text-xs">{event.duration}</span>}
                        </div>
                        {event.description && <p className="text-sm text-[var(--text-secondary)] mt-2 leading-relaxed">{event.description}</p>}
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeleteEvent(event.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/10 hover:text-red-500 text-[var(--text-secondary)] rounded-xl transition-all duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Tasks Section */}
        <div className="bg-[var(--bg-secondary)] rounded-3xl p-6 border border-[var(--bg-tertiary)] shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-[var(--accent-secondary)]/10 rounded-2xl">
              <CheckSquare className="w-6 h-6 text-[var(--accent-secondary)]" />
            </div>
            <h2 className="text-2xl font-display font-semibold tracking-tight text-[var(--text-primary)]">Tasks</h2>
          </div>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {tasks.length === 0 ? (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[var(--text-secondary)] text-sm italic p-4 text-center bg-[var(--bg-tertiary)]/50 rounded-xl"
                >
                  All caught up! You're a productivity machine. 🚀
                </motion.p>
              ) : (
                tasks.map((task, index) => (
                  <motion.div 
                    key={task.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.1 }}
                    className={`group flex items-center justify-between p-4 rounded-2xl transition-all duration-300 border ${
                      task.status === 'completed' 
                        ? 'bg-[var(--bg-tertiary)]/30 border-transparent opacity-60' 
                        : 'bg-[var(--bg-primary)] border-[var(--bg-tertiary)] hover:border-[var(--accent-secondary)]/20 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => handleCompleteTask(task.id)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                          task.status === 'completed' 
                            ? 'bg-[var(--accent-tertiary)] border-[var(--accent-tertiary)] text-white scale-110' 
                            : 'border-[var(--text-secondary)]/30 hover:border-[var(--accent-tertiary)] text-transparent hover:scale-110'
                        }`}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                      </button>
                      <div>
                        <h3 className={`font-medium text-[var(--text-primary)] text-base transition-all ${task.status === 'completed' ? 'line-through text-[var(--text-secondary)]' : ''}`}>
                          {task.title}
                        </h3>
                        {task.due_date && (
                          <p className={`text-xs mt-1 font-medium ${task.status === 'completed' ? 'text-[var(--text-secondary)]/50' : 'text-[var(--text-secondary)]'}`}>
                            Due: {task.due_date}
                          </p>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/10 hover:text-red-500 text-[var(--text-secondary)] rounded-xl transition-all duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
