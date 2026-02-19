import { Event, Task } from '../types';

const API_URL = '/api';

export const api = {
  events: {
    list: async (): Promise<Event[]> => {
      const res = await fetch(`${API_URL}/events`);
      return res.json();
    },
    create: async (event: Omit<Event, 'id'>): Promise<Event> => {
      const res = await fetch(`${API_URL}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
      return res.json();
    },
    update: async (id: number, event: Partial<Event>): Promise<Event> => {
      const res = await fetch(`${API_URL}/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
      return res.json();
    },
    delete: async (id: number): Promise<void> => {
      await fetch(`${API_URL}/events/${id}`, { method: 'DELETE' });
    },
  },
  tasks: {
    list: async (): Promise<Task[]> => {
      const res = await fetch(`${API_URL}/tasks`);
      return res.json();
    },
    create: async (task: Omit<Task, 'id' | 'status'>): Promise<Task> => {
      const res = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      });
      return res.json();
    },
    update: async (id: number, task: Partial<Task>): Promise<Task> => {
      const res = await fetch(`${API_URL}/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      });
      return res.json();
    },
    delete: async (id: number): Promise<void> => {
      await fetch(`${API_URL}/tasks/${id}`, { method: 'DELETE' });
    },
  },
};
