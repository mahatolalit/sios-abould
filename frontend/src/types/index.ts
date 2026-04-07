export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
export type UserRole = 'ADMIN' | 'MANAGER' | 'USER';

export interface User {
  id: number;
  email: string;
  role: UserRole;
}

export interface PlaybookSummary {
  id: number;
  title: string;
}

export interface PlaybookFull {
  id: number;
  title: string;
  contentMarkdown: string;
  webhookUrl: string;
  triggerState: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TaskType {
  id: number;
  title: string;
  description?: string;
  status: TaskStatus;
  creatorId: number;
  assignedTo?: number;
  creator?: { id: number; email: string };
  assignee?: { id: number; email: string } | null;
  playbook?: PlaybookSummary | null;
  createdAt?: string;
  updatedAt?: string;
}
