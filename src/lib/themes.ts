export type ThemeId = "national" | "fluent" | "fluent-dark" | "colorful";

export type ThemeMeta = {
  id: ThemeId;
  label: string;
  blurb: string;
  mode: "light" | "dark";
  swatch: [string, string, string, string];
};

export const THEMES: ThemeMeta[] = [
  {
    id: "national",
    label: "National",
    blurb: "Institutional green & gold",
    mode: "light",
    swatch: ["#F7F8F5", "#0B5C3B", "#1A1A1A", "#C4A35A"],
  },
  {
    id: "fluent",
    label: "Fluent",
    blurb: "Office light canvas",
    mode: "light",
    swatch: ["#FAF9F8", "#0F6CBD", "#242424", "#FFFFFF"],
  },
  {
    id: "fluent-dark",
    label: "Fluent Dark",
    blurb: "Office dark canvas",
    mode: "dark",
    swatch: ["#1F1F1F", "#479EF5", "#FFFFFF", "#292929"],
  },
  {
    id: "colorful",
    label: "Colorful",
    blurb: "Classic Office accent",
    mode: "light",
    swatch: ["#FAF9F8", "#C43E1C", "#242424", "#FFFFFF"],
  },
];

export const DEFAULT_THEME: ThemeId = "national";

export function isThemeId(value: string | null | undefined): value is ThemeId {
  return (
    value === "national" ||
    value === "fluent" ||
    value === "fluent-dark" ||
    value === "colorful"
  );
}

export function normalizeThemeId(value: string | null | undefined): ThemeId {
  if (isThemeId(value)) return value;
  if (
    value === "evening" ||
    value === "noir" ||
    value === "midnight" ||
    value === "dark"
  ) {
    return "fluent-dark";
  }
  if (value === "slate") return "colorful";
  return DEFAULT_THEME;
}
