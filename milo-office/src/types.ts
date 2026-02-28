export type RoomId = 'office' | 'break';

export type AgentStatus = 'idle' | 'working' | 'blocked';

export type AgentState = {
  id: string;
  name: string;
  emoji?: string;
  room: RoomId;
  status: AgentStatus;
  taskId?: string;
  progress: number;
  updatedAt: number;
};

export type TaskStatus = 'queued' | 'assigned' | 'done' | 'canceled';

export type Task = {
  id: string;
  title: string;
  details?: string;
  status: TaskStatus;
  assignedTo?: string;
  createdAt: number;
  updatedAt: number;
};

export type Artifact = {
  id: string;
  title: string;
  body: string;
  createdAt: number;
};

export type Store = {
  agents: AgentState[];
  tasks: Task[];
  artifacts: Artifact[];
};
