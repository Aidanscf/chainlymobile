// Compatibility wrapper requested by the prompt.
//
// The app already uses /services/apiClient.js broadly. For incremental changes,
// we keep that as the implementation and re-export from here.

export { apiFetch, logEvent } from "@/services/apiClient";
