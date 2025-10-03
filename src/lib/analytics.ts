import { app } from "./firebase";
import { logger } from "@/utils/logger";
import type { Analytics } from "firebase/analytics";

let analyticsModulePromise: Promise<typeof import("firebase/analytics")> | null = null;
let analyticsInstancePromise: Promise<Analytics | null> | null = null;
let analyticsInstance: Analytics | null = null;

const loadAnalyticsModule = async (): Promise<typeof import("firebase/analytics")> => {
  if (!analyticsModulePromise) {
    analyticsModulePromise = import("firebase/analytics");
  }
  return analyticsModulePromise;
};

const initialiseAnalytics = async (): Promise<Analytics | null> => {
  if (typeof window === "undefined") {
    return null;
  }

  if (!app) {
    logger.warn("analytics.initialise.missing_app");
    return null;
  }

  try {
    const analyticsModule = await loadAnalyticsModule();
    const supported = await analyticsModule.isSupported();
    if (!supported) {
      logger.warn("analytics.unsupported_runtime");
      return null;
    }

    analyticsInstance = analyticsModule.getAnalytics(app);
    return analyticsInstance;
  } catch (error) {
    logger.error("analytics.initialise_failed", {
      error: error instanceof Error ? error.message : error,
    });
    return null;
  }
};

export const getAnalyticsInstance = async (): Promise<Analytics | null> => {
  if (analyticsInstance) {
    return analyticsInstance;
  }

  if (!analyticsInstancePromise) {
    analyticsInstancePromise = initialiseAnalytics();
  }

  return analyticsInstancePromise;
};

export const logAnalyticsEvent = async (
  eventName: string,
  params?: Record<string, unknown>,
): Promise<boolean> => {
  const analytics = await getAnalyticsInstance();
  if (!analytics) {
    return false;
  }

  const analyticsModule = await loadAnalyticsModule();
  try {
    analyticsModule.logEvent(analytics, eventName, params);
    return true;
  } catch (error) {
    logger.error("analytics.log_failed", {
      eventName,
      error: error instanceof Error ? error.message : error,
    });
    return false;
  }
};

export const resetAnalyticsForTests = () => {
  analyticsInstance = null;
  analyticsInstancePromise = null;
  analyticsModulePromise = null;
};

