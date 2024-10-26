// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://54ea232fdc95f40c8ea4880e024180d8@o4508179630260224.ingest.de.sentry.io/4508179644809296",

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});
