/**
 * TickTick API client
 */

import type { TickTickConfig, TickTickProject, TickTickProjectData, TickTickTask } from '../types';

export class TickTickClient {
  private config: TickTickConfig;
  private baseUrl: string;

  constructor(config: TickTickConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://api.ticktick.com/open/v1';
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.config.token}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`TickTick API error: ${response.status} ${error}`);
    }

    return response.json() as T;
  }

  /**
   * Get all projects
   */
  async getProjects(): Promise<TickTickProject[]> {
    return this.request<TickTickProject[]>('/project');
  }

  /**
   * Get project with tasks
   */
  async getProjectData(projectId: string): Promise<TickTickProjectData> {
    return this.request<TickTickProjectData>(`/project/${projectId}/data`);
  }

  /**
   * Get all tasks from all projects
   */
  async getAllTasks(): Promise<Map<string, TickTickProjectData>> {
    const projects = await this.getProjects();
    const taskMap = new Map<string, TickTickProjectData>();

    await Promise.all(
      projects.map(async (project) => {
        try {
          const data = await this.getProjectData(project.id);
          taskMap.set(project.id, data);
        } catch (err) {
          console.error(`Failed to fetch project ${project.name}:`, err);
        }
      })
    );

    return taskMap;
  }

  /**
   * Create a new task
   */
  async createTask(task: Partial<TickTickTask> & { title: string; projectId: string }): Promise<TickTickTask> {
    return this.request<TickTickTask>('/task', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  }

  /**
   * Update an existing task
   */
  async updateTask(taskId: string, updates: Partial<TickTickTask>): Promise<TickTickTask> {
    return this.request<TickTickTask>(`/task/${taskId}`, {
      method: 'POST',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Complete a task
   */
  async completeTask(taskId: string, projectId: string): Promise<void> {
    await this.request(`/project/${projectId}/task/${taskId}/complete`, {
      method: 'POST',
    });
  }

  /**
   * Delete a task
   */
  async deleteTask(taskId: string, projectId: string): Promise<void> {
    await this.request(`/project/${projectId}/task/${taskId}`, {
      method: 'DELETE',
    });
  }
}
