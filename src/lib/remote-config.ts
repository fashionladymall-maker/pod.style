import { app } from "./firebase";
import { logger } from "@/utils/logger";
import type { RemoteConfig, Value as RemoteConfigValue } from "firebase/remote-config";

const REMOTE_CONFIG_FETCH_TIMEOUT_MS = 10_000;
const REMOTE_CONFIG_MIN_FETCH_INTERVAL_MS =
  process.env.NODE_ENV === "development" ? 0 : 60_000;

type RemoteConfigModule = typeof import("firebase/remote-config");

let remoteConfigModulePromise: Promise<RemoteConfigModule> | null = null;
let remoteConfigInstancePromise: Promise<RemoteConfig | null> | null = null;
let remoteConfigInstance: RemoteConfig | null = null;

const loadRemoteConfigModule = async (): Promise<RemoteConfigModule> => {
  if (!remoteConfigModulePromise) {
    remoteConfigModulePromise = import("firebase/remote-config");
  }
  return remoteConfigModulePromise;
};

const initialiseRemoteConfig = async (): Promise<RemoteConfig | null> => {
  if (typeof window === "undefined") {
    return null;
  }

  if (!app) {
    logger.warn("remoteConfig.initialise.missing_app");
    return null;
  }

  try {
    const remoteConfigModule = await loadRemoteConfigModule();
    const rc = remoteConfigModule.getRemoteConfig(app);
    rc.settings = {
      fetchTimeoutMillis: REMOTE_CONFIG_FETCH_TIMEOUT_MS,
      minimumFetchIntervalMillis: REMOTE_CONFIG_MIN_FETCH_INTERVAL_MS,
    };

    rc.defaultConfig = rc.defaultConfig ?? {};

    try {
      await remoteConfigModule.fetchAndActivate(rc);
    } catch (error) {
      logger.warn("remoteConfig.fetch_activate_failed", {
        error: error instanceof Error ? error.message : error,
      });
      try {
        await remoteConfigModule.activate(rc);
      } catch (activateError) {
        logger.warn("remoteConfig.activate_failed", {
          error: activateError instanceof Error ? activateError.message : activateError,
        });
      }
    }

    remoteConfigInstance = rc;
    return rc;
  } catch (error) {
    logger.error("remoteConfig.initialise_failed", {
      error: error instanceof Error ? error.message : error,
    });
    return null;
  }
};

const getRemoteConfig = async (): Promise<RemoteConfig | null> => {
  if (remoteConfigInstance) {
    return remoteConfigInstance;
  }

  if (!remoteConfigInstancePromise) {
    remoteConfigInstancePromise = initialiseRemoteConfig();
  }

  return remoteConfigInstancePromise;
};

const coerceTruthy = (value: RemoteConfigValue, fallback?: boolean): boolean | undefined => {
  const stringValue = value.asString();
  if (stringValue === "true" || stringValue === "1") {
    return true;
  }
  if (stringValue === "false" || stringValue === "0") {
    return false;
  }
  const boolValue = value.asBoolean();
  if (boolValue !== undefined) {
    return boolValue;
  }
  return fallback;
};

export const getRemoteConfigString = async (key: string): Promise<string | null> => {
  const rc = await getRemoteConfig();
  if (!rc) {
    return null;
  }

  const remoteConfigModule = await loadRemoteConfigModule();
  const value = remoteConfigModule.getValue(rc, key);
  const resolved = value.asString();
  return resolved === "" ? null : resolved;
};

export const getRemoteConfigBoolean = async (
  key: string,
  fallback?: boolean,
): Promise<boolean | undefined> => {
  const rc = await getRemoteConfig();
  if (!rc) {
    return fallback;
  }

  const remoteConfigModule = await loadRemoteConfigModule();
  const value = remoteConfigModule.getValue(rc, key);
  return coerceTruthy(value, fallback);
};

export const getRemoteConfigJSON = async <T>(
  key: string,
): Promise<T | null> => {
  const stringValue = await getRemoteConfigString(key);
  if (!stringValue) {
    return null;
  }

  try {
    return JSON.parse(stringValue) as T;
  } catch (error) {
    logger.warn("remoteConfig.json_parse_failed", {
      key,
      error: error instanceof Error ? error.message : error,
    });
    return null;
  }
};

export const resetRemoteConfigForTests = () => {
  remoteConfigInstance = null;
  remoteConfigInstancePromise = null;
  remoteConfigModulePromise = null;
};
