/**
 * Identity of the running deployment, used to tell an installed app that a
 * newer build is live (see components/app/AppUpdater.tsx).
 *
 * The same expression is set as `deploymentId` in next.config.ts, which stamps
 * it onto <html data-dpl-id>. Keep the two in step: the client reads the HTML
 * attribute, the server reads this, and a mismatch means a new deploy.
 *
 * 'dev' locally, so the updater stays out of the way during development.
 */
export const BUILD_ID =
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.VERCEL_DEPLOYMENT_ID ||
  process.env.NEXT_DEPLOYMENT_ID ||
  'dev';
