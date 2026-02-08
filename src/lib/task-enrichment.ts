/**
 * Task enrichment - convert raw TickTick tasks to LLM-friendly format
 */

import type { TickTickTask, TickTickProject, EnrichedTask, TickTickProjectData } from '../types';
import { toTimeContext, isOverdue, isDueToday, isDueSoon } from '../utils/time';

export class TaskEnricher {
  private timezone: string;
  private projectMap: Map<string, TickTickProject>;
  private taskMap: Map<string, TickTickTask>;

  constructor(timezone: string = 'Asia/Kolkata') {
    this.timezone = timezone;
    this.projectMap = new Map();
    this.taskMap = new Map();
  }

  /**
   * Load project and task data for enrichment context
   */
  loadData(projectData: Map<string, TickTickProjectData>) {
    this.projectMap.clear();
    this.taskMap.clear();

    projectData.forEach((data) => {
      this.projectMap.set(data.project.id, data.project);
      data.tasks.forEach((task) => {
        this.taskMap.set(task.id, task);
      });
    });
  }

  /**
   * Enrich a single task with LLM-friendly context
   */
  enrichTask(task: TickTickTask): EnrichedTask {
    const project = this.projectMap.get(task.projectId);
    
    if (!project) {
      throw new Error(`Project not found for task: ${task.id}`);
    }

    const enriched: EnrichedTask = {
      id: task.id,
      title: task.title,
      content: task.content,
      project: {
        id: project.id,
        name: project.name,
      },
      isOverdue: isOverdue(task.dueDate),
      isDueToday: isDueToday(task.dueDate, this.timezone),
      isDueSoon: isDueSoon(task.dueDate),
      priority: this.mapPriority(task.priority),
      status: task.status === 0 ? 'active' : 'completed',
      hasSubtasks: (task.childIds?.length || 0) > 0,
      isSubtask: !!task.parentId,
    };

    // Add time contexts
    if (task.dueDate) {
      enriched.dueDate = toTimeContext(task.dueDate, this.timezone);
    }

    if (task.startDate) {
      enriched.startDate = toTimeContext(task.startDate, this.timezone);
    }

    // Add parent task context if applicable
    if (task.parentId) {
      const parent = this.taskMap.get(task.parentId);
      if (parent) {
        enriched.context = `Subtask of: ${parent.title}`;
      }
    }

    // Add repeat info
    if (task.repeatFlag) {
      enriched.repeatInfo = this.parseRepeatFlag(task.repeatFlag);
    }

    return enriched;
  }

  /**
   * Enrich multiple tasks
   */
  enrichTasks(tasks: TickTickTask[]): EnrichedTask[] {
    return tasks.map((task) => this.enrichTask(task));
  }

  /**
   * Map numeric priority to human-readable
   */
  private mapPriority(priority: number): 'none' | 'low' | 'medium' | 'high' {
    if (priority === 0) return 'none';
    if (priority === 1) return 'low';
    if (priority === 3) return 'medium';
    if (priority === 5) return 'high';
    return 'none';
  }

  /**
   * Parse TickTick repeat flag to human-readable format
   */
  private parseRepeatFlag(flag: string): string {
    if (!flag || !flag.startsWith('RRULE:')) return flag;

    const parts = flag.replace('RRULE:', '').split(';');
    const rules: Record<string, string> = {};

    parts.forEach((part) => {
      const [key, value] = part.split('=');
      rules[key] = value;
    });

    const freq = rules.FREQ?.toLowerCase();
    const interval = rules.INTERVAL || '1';

    if (freq === 'daily') {
      return interval === '1' ? 'Every day' : `Every ${interval} days`;
    }

    if (freq === 'weekly') {
      const days = rules.BYDAY || '';
      return interval === '1' 
        ? `Weekly${days ? ` on ${days}` : ''}`
        : `Every ${interval} weeks${days ? ` on ${days}` : ''}`;
    }

    if (freq === 'monthly') {
      return interval === '1' ? 'Monthly' : `Every ${interval} months`;
    }

    if (freq === 'yearly') {
      return interval === '1' ? 'Yearly' : `Every ${interval} years`;
    }

    return flag;
  }
}
