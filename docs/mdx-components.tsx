import { useMDXComponents as getThemeComponents } from "nextra-theme-docs";

const themeComponents = getThemeComponents();

export function getMDXComponents() {
  return { ...themeComponents };
}

export function useMDXComponents(components: Record<string, unknown>) {
  return {
    ...themeComponents,
    ...components,
  };
}
