import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Event, Task } from '../types';
import { api } from '../services/api';

interface AppContextType {
  events: Event[];
  tasks: Task[];
  loading: boolean;
  refreshData: () => Promise<void>;
  executeAction: (action: string, data: any) => Promise<string>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const [eventsData, tasksData] = await Promise.all([
        api.events.list(),
        api.tasks.list(),
      ]);
      setEvents(eventsData);
      setTasks(tasksData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const executeAction = async (action: string, data: any): Promise<string> => {
    console.log('Executing Action:', action, data);
    try {
      switch (action) {
        case 'CREATE_EVENT':
          await api.events.create(data);
          await refreshData();
          return `Event "${data.title}" created.`;
        case 'UPDATE_EVENT':
          if (!data.id) return 'Error: Event ID missing for update.';
          await api.events.update(data.id, data);
          await refreshData();
          return `Event "${data.title}" updated.`;
        case 'DELETE_EVENT':
          // We need to find the ID if not provided, maybe by title? 
          // For now assume ID is provided or handled by the AI context logic (which is hard without ID).
          // The AI might return title to delete.
          // Let's assume the AI can find the ID if we feed it the list, but we aren't feeding it the list yet.
          // For this MVP, we might struggle with DELETE by name.
          // Let's just try to delete by ID if present, or warn.
          if (data.id) {
            await api.events.delete(data.id);
            await refreshData();
            return `Event deleted.`;
          }
          return 'Please specify which event to delete (ID required).'; // AI needs context to know IDs.
        case 'LIST_EVENTS':
          // The UI shows the list, so we just confirm.
          return `Here are your events.`;
        case 'CREATE_TASK':
          await api.tasks.create(data);
          await refreshData();
          return `Task "${data.title}" created.`;
        case 'UPDATE_TASK':
          if (!data.id) return 'Error: Task ID missing.';
          await api.tasks.update(data.id, data);
          await refreshData();
          return `Task updated.`;
        case 'DELETE_TASK':
          if (data.id) {
            await api.tasks.delete(data.id);
            await refreshData();
            return `Task deleted.`;
          }
          return 'Please specify which task to delete.';
        case 'COMPLETE_TASK':
           if (data.id) {
            await api.tasks.update(data.id, { status: 'completed' });
            await refreshData();
            return `Task marked as complete.`;
          }
          return 'Please specify which task to complete.';
        case 'LIST_TASKS':
          return `Here are your tasks.`;
        case 'SET_REMINDER':
           // Treat as task for now
           await api.tasks.create({ ...data, title: `Reminder: ${data.title || data.description}` });
           await refreshData();
           return `Reminder set.`;
        default:
          return 'Action not recognized.';
      }
    } catch (error) {
      console.error('Action execution error:', error);
      return 'Failed to execute action.';
    }
  };

  return (
    <AppContext.Provider value={{ events, tasks, loading, refreshData, executeAction }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
