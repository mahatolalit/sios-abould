import { TaskStatus } from '@prisma/client';

// Simple native fetch implementation for webhooks
export class WebhookService {
  static async fireWebhook(url: string, payload: { taskId: number; title: string; newStatus: TaskStatus; [key: string]: any }) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'SmartInternalOps/1.0',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error(`Webhook failed for Task ${payload.taskId} with Status ${response.status}`);
      } else {
        console.log(`Webhook successfully fired for Task ${payload.taskId}`);
      }
    } catch (error) {
      console.error(`Webhook network error for Task ${payload.taskId}:`, error);
    }
  }
}
