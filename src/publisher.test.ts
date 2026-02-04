import { RollbarPublisher } from "./publisher";
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

describe("RollbarPublisher", () => {
  const originalWindow = global.window;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.window = originalWindow;
  });

  describe("configuration validation", () => {
    it("should throw when no token and no rollbarInstance provided", () => {
      expect(() => {
        new RollbarPublisher({} as RollbarPluginOptions);
      }).toThrow(
        "Either ACCESS_TOKEN, SERVER_ACCESS_TOKEN, CLIENT_ACCESS_TOKEN, or rollbarInstance must be provided",
      );
    });

    it("should not throw when only ACCESS_TOKEN provided", () => {
      Object.defineProperty(global, "window", { value: {}, writable: true });
      expect(() => {
        new RollbarPublisher({
          ACCESS_TOKEN: "fallback-token",
        } as RollbarPluginOptions);
      }).not.toThrow();
    });

    it("should not throw when only SERVER_ACCESS_TOKEN provided", () => {
      expect(() => {
        new RollbarPublisher({
          SERVER_ACCESS_TOKEN: "server-token",
        } as RollbarPluginOptions);
      }).not.toThrow();
    });

    it("should not throw when only CLIENT_ACCESS_TOKEN provided", () => {
      Object.defineProperty(global, "window", { value: {}, writable: true });
      expect(() => {
        new RollbarPublisher({
          CLIENT_ACCESS_TOKEN: "client-token",
        } as RollbarPluginOptions);
      }).not.toThrow();
    });

    it("should not throw when rollbarInstance provided and no token", () => {
      expect(() => {
        new RollbarPublisher({
          rollbarInstance: mockRollbar,
        } as RollbarPluginOptions);
      }).not.toThrow();
    });

    it("should not initialize Rollbar when only SERVER_ACCESS_TOKEN and running in browser", () => {
      Object.defineProperty(global, "window", { value: {}, writable: true });
      const publisher = new RollbarPublisher({
        SERVER_ACCESS_TOKEN: "server-only-token",
      } as RollbarPluginOptions);
      expect(publisher.rollbar).toBeUndefined();
    });

    it("should report isAvailable false when only SERVER_ACCESS_TOKEN and in browser", async () => {
      Object.defineProperty(global, "window", { value: {}, writable: true });
      const publisher = new RollbarPublisher({
        SERVER_ACCESS_TOKEN: "server-only-token",
      } as RollbarPluginOptions);
      const available = await publisher.isAvailable();
      expect(available).toBe(false);
    });
  });

  describe("pre-initialized instance", () => {
    it("should use provided rollbarInstance", () => {
      const publisher = new RollbarPublisher({
        rollbarInstance: mockRollbar,
      } as RollbarPluginOptions);
      expect(publisher.rollbar).toBe(mockRollbar);
    });

    it("should be available when using pre-initialized instance", async () => {
      const publisher = new RollbarPublisher({
        rollbarInstance: mockRollbar,
      } as RollbarPluginOptions);
      const available = await publisher.isAvailable();
      expect(available).toBe(true);
    });
  });

  describe("configuration-based initialization", () => {
    it("should initialize with ACCESS_TOKEN and merge config", () => {
      Object.defineProperty(global, "window", { value: {}, writable: true });
      const Rollbar = require("rollbar").default;
      new RollbarPublisher({
        ACCESS_TOKEN: "test-token",
        config: {
          environment: "test",
          payload: { context: "my-app" },
        },
      } as RollbarPluginOptions);
      expect(Rollbar).toHaveBeenCalledWith(
        expect.objectContaining({
          accessToken: "test-token",
          environment: "test",
          payload: { context: "my-app" },
        }),
      );
    });

    it("should merge clientConfig when in browser", () => {
      Object.defineProperty(global, "window", { value: {}, writable: true });
      const Rollbar = require("rollbar").default;
      new RollbarPublisher({
        CLIENT_ACCESS_TOKEN: "client-token",
        config: { environment: "shared" },
        clientConfig: { captureUncaught: true },
      } as RollbarPluginOptions);
      expect(Rollbar).toHaveBeenCalledWith(
        expect.objectContaining({
          accessToken: "client-token",
          environment: "shared",
          captureUncaught: true,
        }),
      );
    });

    it("should merge serverConfig when in Node", () => {
      delete (global as any).window;
      const Rollbar = require("rollbar").default;
      new RollbarPublisher({
        SERVER_ACCESS_TOKEN: "server-token",
        config: { environment: "shared" },
        serverConfig: { captureUncaught: false },
      } as RollbarPluginOptions);
      expect(Rollbar).toHaveBeenCalledWith(
        expect.objectContaining({
          accessToken: "server-token",
          environment: "shared",
          captureUncaught: false,
        }),
      );
    });
  });

  describe("getEventOutput", () => {
    it("should extract RollbarPlugin data from snapshot pluginData", () => {
      const publisher = new RollbarPublisher({
        rollbarInstance: mockRollbar,
      } as RollbarPluginOptions);
      const snapshot = {
        event: { id: "TEST_EVENT" },
        eventOptions: {
          pluginData: {
            RollbarPlugin: {
              properties: { key: "value" },
            },
          },
        },
      };
      const event = { item: { eventType: "info" } };
      const output = publisher.getEventOutput(event as any, snapshot as any);
      expect(output).toEqual({
        eventName: "TEST_EVENT",
        properties: { key: "value" },
        eventType: "info",
      });
    });

    it("should fall back to eventOptions.data.properties when pluginData missing", () => {
      const publisher = new RollbarPublisher({
        rollbarInstance: mockRollbar,
      } as RollbarPluginOptions);
      const snapshot = {
        event: { id: "OTHER_EVENT" },
        eventOptions: {
          data: { properties: { fallback: true } },
        },
      };
      const event = { item: { eventType: "warning" } };
      const output = publisher.getEventOutput(event as any, snapshot as any);
      expect(output).toEqual({
        eventName: "OTHER_EVENT",
        properties: { fallback: true },
        eventType: "warning",
      });
    });

    it("should return empty properties when no pluginData or data", () => {
      const publisher = new RollbarPublisher({
        rollbarInstance: mockRollbar,
      } as RollbarPluginOptions);
      const snapshot = {
        event: { id: "MINIMAL" },
        eventOptions: {},
      };
      const event = { item: { eventType: "debug" } };
      const output = publisher.getEventOutput(event as any, snapshot as any);
      expect(output).toEqual({
        eventName: "MINIMAL",
        properties: {},
        eventType: "debug",
      });
    });

    it("should return empty properties when eventOptions is undefined", () => {
      const publisher = new RollbarPublisher({
        rollbarInstance: mockRollbar,
      } as RollbarPluginOptions);
      const snapshot = {
        event: { id: "NO_OPTIONS" },
      };
      const event = { item: { eventType: "info" } };
      const output = publisher.getEventOutput(event as any, snapshot as any);
      expect(output).toEqual({
        eventName: "NO_OPTIONS",
        properties: {},
        eventType: "info",
      });
    });
  });

  describe("publish", () => {
    beforeEach(() => {
      Object.defineProperty(global, "window", { value: {}, writable: true });
    });

    afterEach(() => {
      delete (global as any).window;
    });

    it("should not call Rollbar when content is null", async () => {
      const publisher = new RollbarPublisher({
        rollbarInstance: mockRollbar,
      } as RollbarPluginOptions);
      await publisher.publish(null, {} as any);
      expect(mockRollbar.critical).not.toHaveBeenCalled();
      expect(mockRollbar.error).not.toHaveBeenCalled();
      expect(mockRollbar.info).not.toHaveBeenCalled();
    });

    it("should not call Rollbar when content is undefined", async () => {
      const publisher = new RollbarPublisher({
        rollbarInstance: mockRollbar,
      } as RollbarPluginOptions);
      await publisher.publish(undefined, {} as any);
      expect(mockRollbar.info).not.toHaveBeenCalled();
    });

    it("should warn and not call Rollbar when rollbar is not initialized", async () => {
      const warnSpy = jest.spyOn(console, "warn").mockImplementation();
      const publisher = new RollbarPublisher({
        ACCESS_TOKEN: "token",
      } as RollbarPluginOptions);
      publisher.rollbar = undefined;
      await publisher.publish(
        {
          eventName: "EV",
          properties: {},
          eventType: "info",
        },
        {} as any,
      );
      expect(warnSpy).toHaveBeenCalledWith(
        "Rollbar plugin: Rollbar not initialized",
      );
      expect(mockRollbar.info).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it("should call critical with message and extra", async () => {
      const publisher = new RollbarPublisher({
        rollbarInstance: mockRollbar,
      } as RollbarPluginOptions);
      await publisher.publish(
        {
          eventName: "CRITICAL_MSG",
          properties: { detail: "x" },
          eventType: "critical",
        },
        {} as any,
      );
      expect(mockRollbar.critical).toHaveBeenCalledWith(
        "CRITICAL_MSG",
        expect.objectContaining({ detail: "x", originalEvent: "CRITICAL_MSG" }),
      );
    });

    it("should call error with message and extra", async () => {
      const publisher = new RollbarPublisher({
        rollbarInstance: mockRollbar,
      } as RollbarPluginOptions);
      await publisher.publish(
        {
          eventName: "ERR_MSG",
          properties: { code: 500 },
          eventType: "error",
        },
        {} as any,
      );
      expect(mockRollbar.error).toHaveBeenCalledWith(
        "ERR_MSG",
        expect.objectContaining({ code: 500, originalEvent: "ERR_MSG" }),
      );
    });

    it("should call error with Error instance and extra when properties.error is Error", async () => {
      const publisher = new RollbarPublisher({
        rollbarInstance: mockRollbar,
      } as RollbarPluginOptions);
      const err = new Error("Something broke");
      await publisher.publish(
        {
          eventName: "API_ERROR",
          properties: { error: err, path: "/api" },
          eventType: "error",
        },
        {} as any,
      );
      expect(mockRollbar.error).toHaveBeenCalledWith("API_ERROR", err, {
        path: "/api",
        originalEvent: "API_ERROR",
      });
    });

    it("should call critical with Error instance and extra when properties.error is Error", async () => {
      const publisher = new RollbarPublisher({
        rollbarInstance: mockRollbar,
      } as RollbarPluginOptions);
      const err = new Error("Fatal");
      await publisher.publish(
        {
          eventName: "FATAL",
          properties: { error: err, component: "auth" },
          eventType: "critical",
        },
        {} as any,
      );
      expect(mockRollbar.critical).toHaveBeenCalledWith("FATAL", err, {
        component: "auth",
        originalEvent: "FATAL",
      });
    });

    it("should call warning with message and extra", async () => {
      const publisher = new RollbarPublisher({
        rollbarInstance: mockRollbar,
      } as RollbarPluginOptions);
      await publisher.publish(
        {
          eventName: "WARN_MSG",
          properties: { rate: 0.9 },
          eventType: "warning",
        },
        {} as any,
      );
      expect(mockRollbar.warning).toHaveBeenCalledWith(
        "WARN_MSG",
        expect.objectContaining({ rate: 0.9, originalEvent: "WARN_MSG" }),
      );
    });

    it("should call info with message and extra", async () => {
      const publisher = new RollbarPublisher({
        rollbarInstance: mockRollbar,
      } as RollbarPluginOptions);
      await publisher.publish(
        {
          eventName: "INFO_MSG",
          properties: { userId: "u1" },
          eventType: "info",
        },
        {} as any,
      );
      expect(mockRollbar.info).toHaveBeenCalledWith(
        "INFO_MSG",
        expect.objectContaining({ userId: "u1", originalEvent: "INFO_MSG" }),
      );
    });

    it("should call debug with message and extra", async () => {
      const publisher = new RollbarPublisher({
        rollbarInstance: mockRollbar,
      } as RollbarPluginOptions);
      await publisher.publish(
        {
          eventName: "DEBUG_MSG",
          properties: {},
          eventType: "debug",
        },
        {} as any,
      );
      expect(mockRollbar.debug).toHaveBeenCalledWith(
        "DEBUG_MSG",
        expect.objectContaining({ originalEvent: "DEBUG_MSG" }),
      );
    });

    it("should call configure with person for identify event type", async () => {
      const publisher = new RollbarPublisher({
        rollbarInstance: mockRollbar,
      } as RollbarPluginOptions);
      await publisher.publish(
        {
          eventName: "USER_SIGNED_IN",
          properties: {
            id: "user-42",
            username: "jane",
            email: "jane@example.com",
          },
          eventType: "identify",
        },
        {} as any,
      );
      expect(mockRollbar.configure).toHaveBeenCalledWith({
        payload: {
          person: {
            id: "user-42",
            username: "jane",
            email: "jane@example.com",
          },
        },
      });
    });

    it("should resolve person id from distinct_id when id missing for identify", async () => {
      const publisher = new RollbarPublisher({
        rollbarInstance: mockRollbar,
      } as RollbarPluginOptions);
      await publisher.publish(
        {
          eventName: "IDENTIFY",
          properties: { distinct_id: "anon-123", email: "a@b.com" },
          eventType: "identify",
        },
        {} as any,
      );
      expect(mockRollbar.configure).toHaveBeenCalledWith({
        payload: {
          person: {
            id: "anon-123",
            username: undefined,
            email: "a@b.com",
          },
        },
      });
    });

    it("should resolve person id from user_id when id and distinct_id missing for identify", async () => {
      const publisher = new RollbarPublisher({
        rollbarInstance: mockRollbar,
      } as RollbarPluginOptions);
      await publisher.publish(
        {
          eventName: "IDENTIFY",
          properties: { user_id: "usr-99" },
          eventType: "identify",
        },
        {} as any,
      );
      expect(mockRollbar.configure).toHaveBeenCalledWith({
        payload: {
          person: {
            id: "usr-99",
            username: undefined,
            email: undefined,
          },
        },
      });
    });

    it("should call configure for identify even when person id is missing (id undefined)", async () => {
      const publisher = new RollbarPublisher({
        rollbarInstance: mockRollbar,
      } as RollbarPluginOptions);
      await publisher.publish(
        {
          eventName: "IDENTIFY_NO_ID",
          properties: {},
          eventType: "identify",
        },
        {} as any,
      );
      expect(mockRollbar.configure).toHaveBeenCalledWith({
        payload: {
          person: {
            id: undefined,
            username: undefined,
            email: undefined,
          },
        },
      });
    });

    it("should call configure with person id null for clear_person", async () => {
      const publisher = new RollbarPublisher({
        rollbarInstance: mockRollbar,
      } as RollbarPluginOptions);
      await publisher.publish(
        {
          eventName: "USER_SIGNED_OUT",
          properties: {},
          eventType: "clear_person",
        },
        {} as any,
      );
      expect(mockRollbar.configure).toHaveBeenCalledWith({
        payload: { person: { id: null } },
      });
    });

    it("should use info for unknown event type", async () => {
      const publisher = new RollbarPublisher({
        rollbarInstance: mockRollbar,
      } as RollbarPluginOptions);
      await publisher.publish(
        {
          eventName: "CUSTOM",
          properties: { x: 1 },
          eventType: "unknown_type",
        },
        {} as any,
      );
      expect(mockRollbar.info).toHaveBeenCalledWith(
        "CUSTOM",
        expect.objectContaining({ x: 1, originalEvent: "CUSTOM" }),
      );
    });

    it("should not treat non-Error property named error as Error", async () => {
      const publisher = new RollbarPublisher({
        rollbarInstance: mockRollbar,
      } as RollbarPluginOptions);
      await publisher.publish(
        {
          eventName: "ERR_STR",
          properties: { error: "string message", code: 400 },
          eventType: "error",
        },
        {} as any,
      );
      expect(mockRollbar.error).toHaveBeenCalledWith(
        "ERR_STR",
        expect.objectContaining({
          error: "string message",
          code: 400,
          originalEvent: "ERR_STR",
        }),
      );
    });
  });

  describe("shouldPublishEvent", () => {
    it("should return true", () => {
      const publisher = new RollbarPublisher({
        rollbarInstance: mockRollbar,
      } as RollbarPluginOptions);
      expect(publisher.shouldPublishEvent()).toBe(true);
    });
  });

  describe("shutdown", () => {
    it("should resolve without error", async () => {
      const publisher = new RollbarPublisher({
        rollbarInstance: mockRollbar,
      } as RollbarPluginOptions);
      await expect(publisher.shutdown()).resolves.toBeUndefined();
    });
  });
});
