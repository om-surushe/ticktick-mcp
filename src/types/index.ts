/**
 * TickTick API types and LLM-optimized response formats
 */

export interface TickTickConfig {
  token: string;
  baseUrl?: string;
  timezone?: string;
}

export interface TickTickTask {
  id: string;
  projectId: string;
  title: string;
  content?: string;
  desc?: string;
  startDate?: string;
  dueDate?: string;
  timeZone?: string;
  isAllDay?: boolean;
  priority: number;
  status: number;
  repeatFlag?: string;
  parentId?: string;
  childIds?: string[];
  sortOrder: number;
  etag: string;
  kind: string;
}

export interface TickTickProject {
  id: string;
  name: string;
  sortOrder: number;
  viewMode: string;
  kind: string;
  color?: string;
}

export interface TickTickProjectData {
  project: TickTickProject;
  tasks: TickTickTask[];
  columns: any[];
}

/**
 * LLM-optimized response formats
 */

export interface TimeContext {
  iso: string;
  relative: string;
  userLocal: string;
  timestamp: number;
}

export interface EnrichedTask {
  id: string;
  title: string;
  content?: string;
  project: {
    id: string;
    name: string;
  };
  dueDate?: TimeContext;
  startDate?: TimeContext;
  isOverdue: boolean;
  isDueToday: boolean;
  isDueSoon: boolean; // Within 48h
  priority: 'none' | 'low' | 'medium' | 'high';
  status: 'active' | 'completed';
  context?: string; // Parent task or additional context
  hasSubtasks: boolean;
  isSubtask: boolean;
  repeatInfo?: string;
}

export interface TaskSuggestion {
  task: EnrichedTask;
  reason: string;
  estimatedMinutes?: number;
}

export interface TimeWindow {
  availableMinutes: number;
  context?: string; // "morning", "evening", "weekend", etc.
  location?: string;
}
