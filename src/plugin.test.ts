import { RollbarPlugin, RollbarPluginFactory } from "./plugin";
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

describe("RollbarPlugin", () => {
  let plugin: RollbarPlugin;
  let options: RollbarPluginOptions;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(global, "window", { value: {}, writable: true });
    options = {
      ACCESS_TOKEN: "test-token",
      config: { environment: "test" },
    };
    plugin = new RollbarPlugin(options);
  });

  afterEach(() => {
    delete (global as any).window;
  });

  describe("constructor", () => {
    it("should create plugin with name RollbarPlugin", () => {
      expect(plugin.name).toBe("RollbarPlugin");
    });

    it("should store options on plugin", () => {
      expect(plugin.options).toBe(options);
    });

    it("should register exactly one publisher", () => {
      expect(plugin.publishers).toHaveLength(1);
    });

    it("should create plugin with pre-initialized rollbar instance", () => {
      const preInitOptions: RollbarPluginOptions = {
        rollbarInstance: mockRollbar,
      };
      const preInitPlugin = new RollbarPlugin(preInitOptions);
      expect(preInitPlugin.options).toBe(preInitOptions);
      expect(preInitPlugin.publishers).toHaveLength(1);
    });

    it("should throw when factory is called with undefined options", () => {
      expect(() => RollbarPluginFactory(undefined as any)).toThrow(
        "RollbarPluginOptions are required",
      );
    });

    it("should throw when factory is called with null options", () => {
      expect(() => RollbarPluginFactory(null as any)).toThrow(
        "RollbarPluginOptions are required",
      );
    });
  });

  describe("isAvailable", () => {
    it("should return true when Rollbar is initialized", async () => {
      const result = await plugin.isAvailable();
      expect(result).toBe(true);
    });

    it("should return false when Rollbar is set to undefined", async () => {
      plugin._setRollbarUndefined();
      const result = await plugin.isAvailable();
      expect(result).toBe(false);
    });
  });

  describe("_setRollbarUndefined", () => {
    it("should set publisher rollbar to undefined", () => {
      expect(plugin.publishers).toBeDefined();
      expect(plugin.publishers!.length).toBeGreaterThan(0);
      plugin._setRollbarUndefined();
      const publisher = plugin.publishers![0] as { rollbar?: unknown };
      expect(publisher.rollbar).toBeUndefined();
    });
  });

  describe("RollbarPluginFactory", () => {
    it("should return an instance of RollbarPlugin", () => {
      const created = RollbarPluginFactory(options);
      expect(created).toBeInstanceOf(RollbarPlugin);
    });

    it("should pass options to the created plugin", () => {
      const created = RollbarPluginFactory(options);
      expect(created.options).toBe(options);
    });
  });

  describe("eventTypes registration", () => {
    it("should register all Rollbar event types with models", () => {
      expect(plugin.eventTypes).toBeDefined();
      expect(plugin.eventTypes.critical).toBeDefined();
      expect(plugin.eventTypes.error).toBeDefined();
      expect(plugin.eventTypes.warning).toBeDefined();
      expect(plugin.eventTypes.info).toBeDefined();
      expect(plugin.eventTypes.debug).toBeDefined();
      expect(plugin.eventTypes.identify).toBeDefined();
      expect(plugin.eventTypes.clear_person).toBeDefined();
    });

    it("should map critical to RollbarCriticalEventModel", () => {
      const { RollbarCriticalEventModel } = require("./model");
      expect(plugin.eventTypes.critical).toBe(RollbarCriticalEventModel);
    });

    it("should map error to RollbarErrorEventModel", () => {
      const { RollbarErrorEventModel } = require("./model");
      expect(plugin.eventTypes.error).toBe(RollbarErrorEventModel);
    });

    it("should map warning to RollbarWarningEventModel", () => {
      const { RollbarWarningEventModel } = require("./model");
      expect(plugin.eventTypes.warning).toBe(RollbarWarningEventModel);
    });

    it("should map info to RollbarInfoEventModel", () => {
      const { RollbarInfoEventModel } = require("./model");
      expect(plugin.eventTypes.info).toBe(RollbarInfoEventModel);
    });

    it("should map debug to RollbarDebugEventModel", () => {
      const { RollbarDebugEventModel } = require("./model");
      expect(plugin.eventTypes.debug).toBe(RollbarDebugEventModel);
    });

    it("should map identify and clear_person to BaseRollbarEventModel", () => {
      const { BaseRollbarEventModel } = require("./model");
      expect(plugin.eventTypes.identify).toBe(BaseRollbarEventModel);
      expect(plugin.eventTypes.clear_person).toBe(BaseRollbarEventModel);
    });
  });
});
