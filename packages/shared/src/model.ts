export type TaskStatus = 'pending' | 'in-progress' | 'done' | 'deferred' | 'cancelled' | 'blocked';

export interface Task {
  id: number | string;
  title: string;
  description?: string;
  details?: string;
  status?: TaskStatus;
  priority?: 'low' | 'medium' | 'high';
  dependencies?: Array<number | string>;
}

export interface TasksFile {
  master: {
    tasks: Task[];
    metadata?: {
      created?: string;
      updated?: string;
      description?: string;
    };
  };
}

