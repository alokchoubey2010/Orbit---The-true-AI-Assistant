export interface Event {
  id: number;
  title: string;
  date: string;
  time: string;
  duration: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  recurrence: 'daily' | 'weekly' | 'monthly' | 'none';
}

export interface Task {
  id: number;
  title: string;
  due_date: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'completed';
}

export interface ActionResponse {
  action: string;
  data: any;
  response_message: string;
}
