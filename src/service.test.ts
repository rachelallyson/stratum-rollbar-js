import {
  RollbarService,
  RollbarPluginFactory,
  RollbarEventTypes,
} from "./index";
import { RollbarPluginOptions } from "./types";

const mockRollbar = {
  critical: jest.fn(),
  error: jest.fn(),
  warning: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  log: jest.fn(),
  configure: jest.fn(),
} as any;

jest.mock("rollbar", () => ({
  __esModule: true,
  default: jest.fn(() => mockRollbar),
}));

describe("RollbarService integration", () => {
  let service: RollbarService;
  let options: RollbarPluginOptions;

  const catalog = {
    BUTTON_CLICK: {
      id: "BUTTON_CLICK",
      description: "Button clicked",
      eventType: RollbarEventTypes.INFO,
      properties: { button_name: "string", page: "string" },
    },
    API_ERROR: {
      id: "API_ERROR",
      description: "API request failed",
      eventType: RollbarEventTypes.ERROR,
      properties: { error: "object", path: "string", status: "number" },
    },
    CRITICAL_FAILURE: {
      id: "CRITICAL_FAILURE",
      description: "Critical failure",
      eventType: RollbarEventTypes.CRITICAL,
      properties: { error: "object", component: "string" },
    },
    RATE_LIMIT: {
      id: "RATE_LIMIT",
      description: "Rate limit warning",
      eventType: RollbarEventTypes.WARNING,
      properties: { limit: "number", current: "number" },
    },
    USER_ACTION: {
      id: "USER_ACTION",
      description: "User action",
      eventType: RollbarEventTypes.DEBUG,
      properties: { action: "string" },
    },
    USER_SIGNED_IN: {
      id: "USER_SIGNED_IN",
      description: "User identified for Rollbar",
      eventType: RollbarEventTypes.IDENTIFY,
      properties: { id: "string", username: "string", email: "string" },
    },
    USER_SIGNED_OUT: {
      id: "USER_SIGNED_OUT",
      description: "Clear Rollbar person",
      eventType: RollbarEventTypes.CLEAR_PERSON,
      properties: {},
    },
    SIMPLE_EVENT: {
      id: "SIMPLE_EVENT",
      description: "Event with no required properties",
      eventType: RollbarEventTypes.INFO,
      properties: {},
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(global, "window", { value: {}, writable: true });
    options = {
      ACCESS_TOKEN: "test-token",
      config: { environment: "test" },
      DEBUG: false,
    };
    service = new RollbarService({
      catalog: { items: catalog },
      plugins: [RollbarPluginFactory(options)],
      productName: "test-app",
      productVersion: "1.0.0",
    });
  });

  afterEach(() => {
    delete (global as any).window;
  });

  describe("event publishing integration", () => {
    it("should publish info events with properties", async () => {
      await service.publish("BUTTON_CLICK", {
        pluginData: {
          RollbarPlugin: {
            properties: { button_name: "submit", page: "checkout" },
          },
        },
      });
      expect(mockRollbar.info).toHaveBeenCalledWith(
        "BUTTON_CLICK",
        expect.objectContaining({
          button_name: "submit",
          page: "checkout",
          originalEvent: "BUTTON_CLICK",
        }),
      );
    });

    it("should publish error events with properties", async () => {
      await service.publish("API_ERROR", {
        pluginData: {
          RollbarPlugin: {
            properties: {
              error: "Connection refused",
              path: "/api/users",
              status: 503,
            },
          },
        },
      });
      expect(mockRollbar.error).toHaveBeenCalledWith(
        "API_ERROR",
        expect.objectContaining({
          error: "Connection refused",
          path: "/api/users",
          status: 503,
          originalEvent: "API_ERROR",
        }),
      );
    });

    it("should publish error events with Error instance in properties", async () => {
      const err = new Error("Network timeout");
      await service.publish("API_ERROR", {
        pluginData: {
          RollbarPlugin: {
            properties: {
              error: err,
              path: "/api/orders",
              status: 504,
            },
          },
        },
      });
      expect(mockRollbar.error).toHaveBeenCalledWith(
        "API_ERROR",
        err,
        expect.objectContaining({
          path: "/api/orders",
          status: 504,
          originalEvent: "API_ERROR",
        }),
      );
    });

    it("should publish critical events with Error instance", async () => {
      const err = new Error("Database unreachable");
      await service.publish("CRITICAL_FAILURE", {
        pluginData: {
          RollbarPlugin: {
            properties: { error: err, component: "db" },
          },
        },
      });
      expect(mockRollbar.critical).toHaveBeenCalledWith(
        "CRITICAL_FAILURE",
        err,
        expect.objectContaining({
          component: "db",
          originalEvent: "CRITICAL_FAILURE",
        }),
      );
    });

    it("should publish warning events", async () => {
      await service.publish("RATE_LIMIT", {
        pluginData: {
          RollbarPlugin: {
            properties: { limit: 100, current: 95 },
          },
        },
      });
      expect(mockRollbar.warning).toHaveBeenCalledWith(
        "RATE_LIMIT",
        expect.objectContaining({
          limit: 100,
          current: 95,
          originalEvent: "RATE_LIMIT",
        }),
      );
    });

    it("should publish debug events", async () => {
      await service.publish("USER_ACTION", {
        pluginData: {
          RollbarPlugin: {
            properties: { action: "open_modal" },
          },
        },
      });
      expect(mockRollbar.debug).toHaveBeenCalledWith(
        "USER_ACTION",
        expect.objectContaining({
          action: "open_modal",
          originalEvent: "USER_ACTION",
        }),
      );
    });

    it("should publish identify and call configure with person", async () => {
      await service.publish("USER_SIGNED_IN", {
        pluginData: {
          RollbarPlugin: {
            properties: {
              id: "user-123",
              username: "alice",
              email: "alice@example.com",
            },
          },
        },
      });
      expect(mockRollbar.configure).toHaveBeenCalledWith({
        payload: {
          person: {
            id: "user-123",
            username: "alice",
            email: "alice@example.com",
          },
        },
      });
    });

    it("should publish clear_person and call configure with person id null", async () => {
      await service.publish("USER_SIGNED_OUT", {
        pluginData: { RollbarPlugin: { properties: {} } },
      });
      expect(mockRollbar.configure).toHaveBeenCalledWith({
        payload: { person: { id: null } },
      });
    });

    it("should publish events with minimal plugin data", async () => {
      await service.publish("SIMPLE_EVENT", {
        pluginData: { RollbarPlugin: {} },
      });
      expect(mockRollbar.info).toHaveBeenCalledWith(
        "SIMPLE_EVENT",
        expect.objectContaining({ originalEvent: "SIMPLE_EVENT" }),
      );
    });

    it("should publish events with no plugin data", async () => {
      await service.publish("SIMPLE_EVENT", {});
      expect(mockRollbar.info).toHaveBeenCalledWith(
        "SIMPLE_EVENT",
        expect.objectContaining({ originalEvent: "SIMPLE_EVENT" }),
      );
    });
  });

  describe("service methods", () => {
    it("should return true from isRollbarAvailable when plugin and Rollbar are present", async () => {
      const available = await service.isRollbarAvailable();
      expect(available).toBe(true);
    });

    it("should return false from isRollbarAvailable when no RollbarPlugin in options", async () => {
      const serviceWithoutPlugin = new RollbarService({
        catalog: { items: catalog },
        plugins: [],
        productName: "test-app",
        productVersion: "1.0.0",
      });
      const available = await serviceWithoutPlugin.isRollbarAvailable();
      expect(available).toBe(false);
    });

    it("should find RollbarPlugin and publish when plugins is single plugin not array", async () => {
      const serviceSinglePlugin = new RollbarService({
        catalog: { items: catalog },
        plugins: RollbarPluginFactory(options),
        productName: "test-app",
        productVersion: "1.0.0",
      });
      const available = await serviceSinglePlugin.isRollbarAvailable();
      expect(available).toBe(true);
      await serviceSinglePlugin.publish("SIMPLE_EVENT", {
        pluginData: { RollbarPlugin: { properties: {} } },
      });
      expect(mockRollbar.info).toHaveBeenCalledWith(
        "SIMPLE_EVENT",
        expect.objectContaining({ originalEvent: "SIMPLE_EVENT" }),
      );
    });
  });

  describe("real-world flows", () => {
    it("should handle identify then event then clear_person flow", async () => {
      await service.publish("USER_SIGNED_IN", {
        pluginData: {
          RollbarPlugin: {
            properties: {
              id: "usr-1",
              username: "bob",
              email: "bob@example.com",
            },
          },
        },
      });
      expect(mockRollbar.configure).toHaveBeenNthCalledWith(1, {
        payload: {
          person: {
            id: "usr-1",
            username: "bob",
            email: "bob@example.com",
          },
        },
      });

      await service.publish("BUTTON_CLICK", {
        pluginData: {
          RollbarPlugin: {
            properties: { button_name: "save", page: "settings" },
          },
        },
      });
      expect(mockRollbar.info).toHaveBeenCalledWith(
        "BUTTON_CLICK",
        expect.objectContaining({
          button_name: "save",
          page: "settings",
          originalEvent: "BUTTON_CLICK",
        }),
      );

      await service.publish("USER_SIGNED_OUT", {
        pluginData: { RollbarPlugin: { properties: {} } },
      });
      expect(mockRollbar.configure).toHaveBeenLastCalledWith({
        payload: { person: { id: null } },
      });
    });

    it("should handle API error with Error object then info", async () => {
      const err = new Error("Service unavailable");
      await service.publish("API_ERROR", {
        pluginData: {
          RollbarPlugin: {
            properties: { error: err, path: "/api/health", status: 503 },
          },
        },
      });
      expect(mockRollbar.error).toHaveBeenCalledWith(
        "API_ERROR",
        err,
        expect.objectContaining({
          path: "/api/health",
          status: 503,
          originalEvent: "API_ERROR",
        }),
      );

      await service.publish("SIMPLE_EVENT", {
        pluginData: { RollbarPlugin: { properties: {} } },
      });
      expect(mockRollbar.info).toHaveBeenLastCalledWith(
        "SIMPLE_EVENT",
        expect.objectContaining({ originalEvent: "SIMPLE_EVENT" }),
      );
    });
  });
});
