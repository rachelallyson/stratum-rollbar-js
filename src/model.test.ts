import { Injector } from "@capitalone/stratum-observability";
import {
  BaseRollbarEventModel,
  RollbarInfoEventModel,
} from "./model";
import type { RollbarEvent, RollbarSnapshot } from "./types";
import { RollbarEventTypes } from "./types";

describe("BaseRollbarEventModel", () => {
  let injector: Injector;
  const catalogId = "test-catalog";

  beforeEach(() => {
    injector = new Injector("test-app", "1.0.0");
  });

  const itemWithSchema: RollbarEvent = {
    id: "EVENT_WITH_FOO",
    description: "Event with foo property",
    eventType: RollbarEventTypes.INFO,
    properties: { foo: "string" },
  };

  const itemNoProps: RollbarEvent = {
    id: "MINIMAL_EVENT",
    description: "Minimal event",
    eventType: RollbarEventTypes.DEBUG,
  };

  const itemLevel: RollbarEvent = {
    id: "INFO_LEVEL_EVENT",
    description: "Info",
    eventType: RollbarEventTypes.INFO,
    properties: { level: "string" },
  };

  function createModel(
    ModelClass: typeof BaseRollbarEventModel,
    key: string,
    item: RollbarEvent,
  ): BaseRollbarEventModel {
    return new ModelClass(key, item, catalogId, injector);
  }

  describe("id getter", () => {
    it("should return item id", () => {
      const model = createModel(
        BaseRollbarEventModel,
        "EVENT_WITH_FOO",
        itemWithSchema,
      );
      expect(model.id).toBe("EVENT_WITH_FOO");
    });
  });

  describe("getData", () => {
    it("should return merged item when options have properties matching catalog schema types", () => {
      const model = createModel(
        BaseRollbarEventModel,
        "EVENT_WITH_FOO",
        itemWithSchema,
      );
      const options = {
        event: { id: "EVENT_WITH_FOO" },
        eventOptions: {
          data: { properties: { foo: "bar" } },
        },
      } as unknown as RollbarSnapshot;
      const result = model.getData(options);
      expect(result).toBeDefined();
      expect(result.id).toBe("EVENT_WITH_FOO");
      expect(result.properties).toEqual({ foo: "string" });
    });

    it("should return item when options have no eventOptions.data.properties", () => {
      const model = createModel(
        BaseRollbarEventModel,
        "EVENT_WITH_FOO",
        itemWithSchema,
      );
      const result = model.getData({} as unknown as RollbarSnapshot);
      expect(result).toBeDefined();
      expect(result.id).toBe("EVENT_WITH_FOO");
      expect(result.properties).toEqual({ foo: "string" });
    });

    it("should throw when runtime property type does not match catalog schema type", () => {
      const model = createModel(
        BaseRollbarEventModel,
        "EVENT_WITH_FOO",
        itemWithSchema,
      );
      const options = {
        event: { id: "EVENT_WITH_FOO" },
        eventOptions: {
          data: { properties: { foo: 123 } },
        },
      } as unknown as RollbarSnapshot;
      expect(() => model.getData(options)).toThrow(
        /Property foo is not a type of/,
      );
    });

    it("should throw when catalog has property but options.properties omit it", () => {
      const model = createModel(
        BaseRollbarEventModel,
        "EVENT_WITH_FOO",
        itemWithSchema,
      );
      const options = {
        event: { id: "EVENT_WITH_FOO" },
        eventOptions: {
          data: { properties: {} },
        },
      } as unknown as RollbarSnapshot;
      expect(() => model.getData(options)).toThrow(
        /Property foo is not defined in the properties/,
      );
    });

    it("should not throw when catalog properties is empty and options has no properties", () => {
      const model = createModel(
        BaseRollbarEventModel,
        "MINIMAL_EVENT",
        itemNoProps,
      );
      const result = model.getData({} as RollbarSnapshot);
      expect(result).toBeDefined();
      expect(result.id).toBe("MINIMAL_EVENT");
    });
  });

  describe("subclass RollbarInfoEventModel", () => {
    it("should inherit getData behavior and validate correctly", () => {
      const model = createModel(
        RollbarInfoEventModel,
        "INFO_LEVEL_EVENT",
        itemLevel,
      );
      const options = {
        event: { id: "INFO_LEVEL_EVENT" },
        eventOptions: {
          data: { properties: { level: "high" } },
        },
      } as unknown as RollbarSnapshot;
      const result = model.getData(options);
      expect(result).toBeDefined();
      expect(result.eventType).toBe("info");
    });
  });
});
