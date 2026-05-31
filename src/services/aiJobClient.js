import { apiFetch } from "@/services/apiClient";
import useAIJobsStore from "@/store/aiJobs";

export async function startAIJob({ type, input }) {
  const res = await apiFetch("/api/ai/job", {
    method: "POST",
    body: JSON.stringify({ type, input }),
  });

  const job = res?.job || null;
  try {
    if (job?.id) {
      await useAIJobsStore.getState().rememberJob(job);
    }
  } catch (e) {
    // no-op
  }

  return {
    job,
    cached: Boolean(res?.cached),
  };
}

export async function getAIJob(jobId) {
  const id = String(jobId || "");
  if (!id) {
    throw new Error("Missing jobId");
  }

  const res = await apiFetch(`/api/ai/job/${id}`, { method: "GET" });
  const job = res?.job || null;

  try {
    if (job?.id) {
      await useAIJobsStore.getState().updateJob(job);
    }
  } catch (e) {
    // no-op
  }

  return job;
}

export function waitForAIJob({
  jobId,
  onProgress,
  pollIntervalMs = 650,
  timeoutMs = 20000,
}) {
  let cancelled = false;
  let timer = null;

  const cancel = () => {
    cancelled = true;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const done = new Promise((resolve, reject) => {
    const startAt = Date.now();

    const tick = async () => {
      if (cancelled) {
        reject(new Error("Cancelled"));
        return;
      }

      const elapsed = Date.now() - startAt;
      if (elapsed > timeoutMs) {
        reject(new Error("Timed out"));
        return;
      }

      try {
        const job = await getAIJob(jobId);

        try {
          if (typeof onProgress === "function") {
            onProgress(job);
          }
        } catch (e) {
          // ignore progress handler errors
        }

        if (!job) {
          reject(new Error("Job not found"));
          return;
        }

        const status = String(job.status || "");
        if (status === "completed") {
          resolve(job);
          return;
        }
        if (status === "failed") {
          reject(new Error("Job failed"));
          return;
        }

        timer = setTimeout(tick, pollIntervalMs);
      } catch (error) {
        // Keep retrying a couple times (offline / flaky network)
        timer = setTimeout(tick, pollIntervalMs);
      }
    };

    tick();
  });

  return { cancel, done };
}
