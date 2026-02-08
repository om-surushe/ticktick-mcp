#!/usr/bin/env node

/**
 * TickTick MCP Server
 * LLM-optimized task management with intelligent time handling
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { TickTickClient } from './lib/ticktick-client.js';
import { TaskEnricher } from './lib/task-enrichment.js';
import { TickTickTools } from './tools/index.js';

const TICKTICK_TOKEN = process.env.TICKTICK_TOKEN;
const TIMEZONE = process.env.TIMEZONE || 'Asia/Kolkata';

if (!TICKTICK_TOKEN) {
  console.error('Error: TICKTICK_TOKEN environment variable is required');
  process.exit(1);
}

// Initialize clients
const client = new TickTickClient({ token: TICKTICK_TOKEN, timezone: TIMEZONE });
const enricher = new TaskEnricher(TIMEZONE);
const tools = new TickTickTools(client, enricher);

// Create MCP server
const server = new Server(
  {
    name: '@om-surushe/efficient-ticktick',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_tasks_today',
        description: 'Get all tasks due today with full time context (relative, local time, ISO)',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_overdue_tasks',
        description: 'Get all overdue tasks, sorted by how overdue they are',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_floating_tasks',
        description: 'Get tasks without deadlines, grouped by project',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_upcoming_tasks',
        description: 'Get tasks due in the next N days',
        inputSchema: {
          type: 'object',
          properties: {
            days: {
              type: 'number',
              description: 'Number of days to look ahead (default: 7)',
              default: 7,
            },
          },
        },
      },
      {
        name: 'get_tasks_by_project',
        description: 'Get all tasks in a specific project',
        inputSchema: {
          type: 'object',
          properties: {
            projectName: {
              type: 'string',
              description: 'Project name or partial match',
            },
          },
          required: ['projectName'],
        },
      },
      {
        name: 'search_tasks',
        description: 'Search tasks by keyword in title or content',
        inputSchema: {
          type: 'object',
          properties: {
            keyword: {
              type: 'string',
              description: 'Search keyword',
            },
          },
          required: ['keyword'],
        },
      },
      {
        name: 'suggest_next_task',
        description: 'AI-powered suggestion for what task to work on next, considering deadlines and priorities',
        inputSchema: {
          type: 'object',
          properties: {
            availableMinutes: {
              type: 'number',
              description: 'How many minutes the user has available (optional)',
            },
            context: {
              type: 'string',
              description: 'Current context (e.g., "morning", "evening", "at office")',
            },
          },
        },
      },
      {
        name: 'get_task_summary',
        description: 'Get high-level task summary (counts of overdue, today, soon, floating)',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'create_task',
        description: 'Create a new task with flexible date parsing (accepts "today", "tomorrow", "next week", ISO dates)',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Task title',
            },
            project: {
              type: 'string',
              description: 'Project name (partial match supported)',
            },
            dueDate: {
              type: 'string',
              description: 'Due date (flexible: "today", "tomorrow", "next week", or ISO date)',
            },
            content: {
              type: 'string',
              description: 'Task description/content',
            },
            priority: {
              type: 'string',
              enum: ['none', 'low', 'medium', 'high'],
              description: 'Task priority',
            },
          },
          required: ['title'],
        },
      },
      {
        name: 'complete_task',
        description: 'Mark a task as completed',
        inputSchema: {
          type: 'object',
          properties: {
            taskId: {
              type: 'string',
              description: 'Task ID to complete',
            },
          },
          required: ['taskId'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  try {
    let result;

    switch (name) {
      case 'get_tasks_today':
        result = await tools.getTasksDueToday();
        break;

      case 'get_overdue_tasks':
        result = await tools.getOverdueTasks();
        break;

      case 'get_floating_tasks':
        result = await tools.getFloatingTasks();
        break;

      case 'get_upcoming_tasks':
        result = await tools.getUpcomingTasks((args.days as number) || 7);
        break;

      case 'get_tasks_by_project':
        if (!args.projectName) {
          throw new Error('projectName is required');
        }
        result = await tools.getTasksByProject(args.projectName as string);
        break;

      case 'search_tasks':
        if (!args.keyword) {
          throw new Error('keyword is required');
        }
        result = await tools.searchTasks(args.keyword as string);
        break;

      case 'suggest_next_task':
        result = await tools.suggestNextTask({
          availableMinutes: args.availableMinutes as number,
          context: args.context as string,
        });
        break;

      case 'get_task_summary':
        result = await tools.getTaskSummary();
        break;

      case 'create_task':
        if (!args.title) {
          throw new Error('title is required');
        }
        result = await tools.createTask({
          title: args.title as string,
          project: args.project as string,
          dueDate: args.dueDate as string,
          content: args.content as string,
          priority: args.priority as 'none' | 'low' | 'medium' | 'high',
        });
        break;

      case 'complete_task':
        if (!args.taskId) {
          throw new Error('taskId is required');
        }
        await tools.completeTask(args.taskId as string);
        result = { success: true };
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: error instanceof Error ? error.message : 'Unknown error',
          }),
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Efficient TickTick MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
