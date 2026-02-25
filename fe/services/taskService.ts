const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class TaskService {
  /**
   * Poll task result until completion
   */
  static async pollTaskResult(
    taskId: string,
    token: string,
    intervalMs: number = 3000
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const res = await fetch(`${API_BASE}/api/tasks/${taskId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!res.ok) {
            throw new Error("Failed to fetch task status");
          }

          const data = await res.json();

          if (data.status === "SUCCESS") {
            resolve(data.result);
          } else if (data.status === "FAILURE") {
            reject(new Error(data.error || "Task failed"));
          } else {
            // Still pending, poll again
            setTimeout(poll, intervalMs);
          }
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  }
}