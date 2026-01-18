import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Fetch free models from OpenRouter API once a day at midnight UTC
crons.daily(
  "fetch free OpenRouter models",
  { hourUTC: 0, minuteUTC: 0 },
  internal.modelsSync.fetchFreeModels
);

export default crons;
