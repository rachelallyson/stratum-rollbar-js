import { RollbarEventTypes } from "../types";

export const catalog = {
  LOADED: {
    id: "LOADED",
    description: "App loaded",
    eventType: RollbarEventTypes.INFO,
    properties: {
      loadedAt: "string",
    },
  },
  GENERIC_ERROR: {
    id: "GENERIC_ERROR",
    description: "Generic error occurred",
    eventType: RollbarEventTypes.ERROR,
    properties: {
      error: "object",
      message: "string",
    },
  },
  CRITICAL_FAILURE: {
    id: "CRITICAL_FAILURE",
    description: "Critical failure",
    eventType: RollbarEventTypes.CRITICAL,
    properties: {
      error: "object",
      component: "string",
    },
  },
  RATE_LIMIT_WARNING: {
    id: "RATE_LIMIT_WARNING",
    description: "Rate limit warning",
    eventType: RollbarEventTypes.WARNING,
    properties: {
      limit: "number",
      current: "number",
    },
  },
  USER_LOGIN: {
    id: "USER_LOGIN",
    description: "User logged in",
    eventType: RollbarEventTypes.INFO,
    properties: {
      login_method: "string",
      user_id: "string",
    },
  },
  USER_LOGOUT: {
    id: "USER_LOGOUT",
    description: "User logged out",
    eventType: RollbarEventTypes.INFO,
    properties: {
      user_id: "string",
      session_duration: "string",
    },
  },
  BUTTON_CLICK: {
    id: "BUTTON_CLICK",
    description: "Button clicked",
    eventType: RollbarEventTypes.INFO,
    properties: {
      button_name: "string",
      page: "string",
      user_logged_in: "string",
    },
  },
  USER_SIGNED_IN: {
    id: "USER_SIGNED_IN",
    description: "User signed in and identified for Rollbar",
    eventType: RollbarEventTypes.IDENTIFY,
    properties: {
      id: "string",
      username: "string",
      email: "string",
    },
  },
  USER_SIGNED_OUT: {
    id: "USER_SIGNED_OUT",
    description: "User signed out and clear Rollbar person",
    eventType: RollbarEventTypes.CLEAR_PERSON,
    properties: {},
  },
  DEBUG_ACTION: {
    id: "DEBUG_ACTION",
    description: "Debug-level action",
    eventType: RollbarEventTypes.DEBUG,
    properties: {
      action: "string",
    },
  },
};

export const EVENT_ID = {
  LOADED: "LOADED",
  GENERIC_ERROR: "GENERIC_ERROR",
  CRITICAL_FAILURE: "CRITICAL_FAILURE",
  RATE_LIMIT_WARNING: "RATE_LIMIT_WARNING",
  USER_LOGIN: "USER_LOGIN",
  USER_LOGOUT: "USER_LOGOUT",
  BUTTON_CLICK: "BUTTON_CLICK",
  USER_SIGNED_IN: "USER_SIGNED_IN",
  USER_SIGNED_OUT: "USER_SIGNED_OUT",
  DEBUG_ACTION: "DEBUG_ACTION",
} as const;
