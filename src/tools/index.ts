/**
 * LLM-optimized MCP tools for TickTick
 */

import type { EnrichedTask, TaskSuggestion, TimeWindow } from '../types';
import type { TickTickClient } from '../lib/ticktick-client';
import type { TaskEnricher } from '../lib/task-enrichment';
import { parseFlexibleDate } from '../utils/time';

export class TickTickTools {
  constructor(
    private client: TickTickClient,
    private enricher: TaskEnricher
  ) {}

  /**
   * Refresh task cache
   */
  private async refreshCache() {
    const data = await this.client.getAllTasks();
    this.enricher.loadData(data);
    return data;
  }

  /**
   * Get all active tasks
   */
  private async getActiveTasks(): Promise<EnrichedTask[]> {
    const data = await this.refreshCache();
    const allTasks: EnrichedTask[] = [];

    data.forEach((projectData) => {
      const activeTasks = projectData.tasks.filter((t) => t.status === 0);
      allTasks.push(...this.enricher.enrichTasks(activeTasks));
    });

    return allTasks;
  }

  /**
   * Get tasks due today
   */
  async getTasksDueToday(): Promise<EnrichedTask[]> {
    const tasks = await this.getActiveTasks();
    return tasks.filter((t) => t.isDueToday);
  }

  /**
   * Get overdue tasks
   */
  async getOverdueTasks(): Promise<EnrichedTask[]> {
    const tasks = await this.getActiveTasks();
    return tasks
      .filter((t) => t.isOverdue)
      .sort((a, b) => {
        // Sort by how overdue they are
        const aTime = a.dueDate?.timestamp || 0;
        const bTime = b.dueDate?.timestamp || 0;
        return aTime - bTime;
      });
  }

  /**
   * Get floating tasks (no deadline)
   */
  async getFloatingTasks(): Promise<EnrichedTask[]> {
    const tasks = await this.getActiveTasks();
    return tasks.filter((t) => !t.dueDate);
  }

  /**
   * Get tasks by project name
   */
  async getTasksByProject(projectName: string): Promise<EnrichedTask[]> {
    const tasks = await this.getActiveTasks();
    return tasks.filter((t) => 
      t.project.name.toLowerCase().includes(projectName.toLowerCase())
    );
  }

  /**
   * Get upcoming tasks (next 7 days)
   */
  async getUpcomingTasks(days: number = 7): Promise<EnrichedTask[]> {
    const tasks = await this.getActiveTasks();
    const maxTime = Date.now() + days * 24 * 60 * 60 * 1000;

    return tasks
      .filter((t) => {
        if (!t.dueDate) return false;
        return t.dueDate.timestamp > Date.now() && t.dueDate.timestamp <= maxTime;
      })
      .sort((a, b) => {
        const aTime = a.dueDate?.timestamp || 0;
        const bTime = b.dueDate?.timestamp || 0;
        return aTime - bTime;
      });
  }

  /**
   * Search tasks by keyword
   */
  async searchTasks(keyword: string): Promise<EnrichedTask[]> {
    const tasks = await this.getActiveTasks();
    const lower = keyword.toLowerCase();

    return tasks.filter((t) =>
      t.title.toLowerCase().includes(lower) ||
      t.content?.toLowerCase().includes(lower)
    );
  }

  /**
   * Suggest next task based on context
   */
  async suggestNextTask(window?: TimeWindow): Promise<TaskSuggestion | null> {
    const tasks = await this.getActiveTasks();

    // Priority order: overdue → due today → due soon → high priority floating
    const overdue = tasks.filter((t) => t.isOverdue);
    if (overdue.length > 0) {
      return {
        task: overdue[0],
        reason: `Overdue by ${overdue[0].dueDate?.relative}`,
      };
    }

    const dueToday = tasks.filter((t) => t.isDueToday);
    if (dueToday.length > 0) {
      return {
        task: dueToday[0],
        reason: 'Due today',
      };
    }

    const dueSoon = tasks.filter((t) => t.isDueSoon);
    if (dueSoon.length > 0) {
      return {
        task: dueSoon[0],
        reason: `Due ${dueSoon[0].dueDate?.relative}`,
      };
    }

    // High priority floating tasks
    const highPriority = tasks.filter(
      (t) => !t.dueDate && t.priority === 'high'
    );
    if (highPriority.length > 0) {
      return {
        task: highPriority[0],
        reason: 'High priority task with no deadline',
      };
    }

    // If we have a time window, suggest accordingly
    if (window?.availableMinutes) {
      const suitable = tasks.filter((t) => !t.hasSubtasks); // Simple tasks
      if (suitable.length > 0) {
        return {
          task: suitable[0],
          reason: `Fits your ${window.availableMinutes} minute window`,
          estimatedMinutes: window.availableMinutes,
        };
      }
    }

    return null;
  }

  /**
   * Create a new task
   */
  async createTask(params: {
    title: string;
    project?: string;
    dueDate?: string;
    content?: string;
    priority?: 'none' | 'low' | 'medium' | 'high';
  }): Promise<EnrichedTask> {
    // Find project by name
    const data = await this.refreshCache();
    let projectId: string | undefined;

    if (params.project) {
      for (const [id, projectData] of data.entries()) {
        if (projectData.project.name.toLowerCase().includes(params.project.toLowerCase())) {
          projectId = id;
          break;
        }
      }
    }

    // Use first project if not specified
    if (!projectId) {
      projectId = Array.from(data.keys())[0];
    }

    if (!projectId) {
      throw new Error('No projects found');
    }

    const priorityMap = {
      none: 0,
      low: 1,
      medium: 3,
      high: 5,
    };

    const task = await this.client.createTask({
      title: params.title,
      projectId,
      content: params.content,
      priority: params.priority ? priorityMap[params.priority] : 0,
      dueDate: params.dueDate ? parseFlexibleDate(params.dueDate) : undefined,
    });

    return this.enricher.enrichTask(task);
  }

  /**
   * Complete a task
   */
  async completeTask(taskId: string): Promise<void> {
    const data = await this.refreshCache();
    
    // Find the task to get its projectId
    for (const projectData of data.values()) {
      const task = projectData.tasks.find((t) => t.id === taskId);
      if (task) {
        await this.client.completeTask(taskId, task.projectId);
        return;
      }
    }

    throw new Error(`Task not found: ${taskId}`);
  }

  /**
   * Get task summary (batch context)
   */
  async getTaskSummary(): Promise<{
    overdue: number;
    dueToday: number;
    dueSoon: number;
    floating: number;
    total: number;
  }> {
    const tasks = await this.getActiveTasks();

    return {
      overdue: tasks.filter((t) => t.isOverdue).length,
      dueToday: tasks.filter((t) => t.isDueToday).length,
      dueSoon: tasks.filter((t) => t.isDueSoon).length,
      floating: tasks.filter((t) => !t.dueDate).length,
      total: tasks.length,
    };
  }
}
