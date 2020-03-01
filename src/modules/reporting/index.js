import * as Sentry from '@sentry/electron';
import { init as rendererInit } from '@sentry/electron/dist/renderer';
import { init as mainInit } from '@sentry/electron/dist/main';

import config from './sentry.config';

// https://github.com/getsentry/sentry-electron/issues/142

const reporterConfiguration = {
  ...config,
  defaultIntegrations: false,
};

export function initializeReporterRenderer() {
  if (process.env.NODE_ENV === 'production') rendererInit(reporterConfiguration);
}

export function initializeReporterMain() {
  if (process.env.NODE_ENV === 'production') mainInit(reporterConfiguration);
}

function isSentryInitialized() {
  return !!Sentry.getCurrentHub().getClient();
}

export function ReportProblem(title, body, logs, email, extra) {
  const suffix = isSentryInitialized() ? '' : `-${process.env.NODE_ENV}`;

  const eventId = Sentry.captureEvent({
    message: title,
    logger: logs,
    user: {
      email,
    },
    extra: {
      body,
      ...extra,
    },
  });

  return eventId + suffix;
}
