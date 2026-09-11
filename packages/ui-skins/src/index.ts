export type ToygoSkin = "dark" | "light" | "midnight" | "emerald" | "ocean" | "sunset" | "graphite" | "candy";

export interface ToygoSkinDefinition {
  label: string;
  description: string;
  rootClass: string;
  mode: "dark" | "light";
  surface: string;
  accent: string;
  success: string;
}

export const defaultToygoSkin: ToygoSkin = "dark";

export const toygoSkinOrder: ToygoSkin[] = ["dark", "light", "midnight", "emerald", "ocean", "sunset", "graphite", "candy"];

export const toygoSkins: Record<ToygoSkin, ToygoSkinDefinition> = {
  dark: {
    label: "Slate Blue",
    description: "Dark padrao com slate-900, azul e verde operacional.",
    rootClass: "skin-dark",
    mode: "dark",
    surface: "#0f172a",
    accent: "#3b82f6",
    success: "#22c55e"
  },
  light: {
    label: "Light Desk",
    description: "Tema claro para ambientes muito iluminados.",
    rootClass: "skin-light",
    mode: "light",
    surface: "#f8fafc",
    accent: "#2563eb",
    success: "#16a34a"
  },
  midnight: {
    label: "Midnight",
    description: "Azul profundo com leitura alta para operacao noturna.",
    rootClass: "skin-midnight",
    mode: "dark",
    surface: "#07111f",
    accent: "#38bdf8",
    success: "#22c55e"
  },
  emerald: {
    label: "Emerald",
    description: "Base escura com verde forte para status e caixa.",
    rootClass: "skin-emerald",
    mode: "dark",
    surface: "#081c15",
    accent: "#22c55e",
    success: "#84cc16"
  },
  ocean: {
    label: "Ocean",
    description: "Azul limpo com apoio ciano para paineis analiticos.",
    rootClass: "skin-ocean",
    mode: "dark",
    surface: "#082f49",
    accent: "#0ea5e9",
    success: "#10b981"
  },
  sunset: {
    label: "Sunset",
    description: "Contraste quente para alertas comerciais sem perder foco.",
    rootClass: "skin-sunset",
    mode: "dark",
    surface: "#1f1308",
    accent: "#f59e0b",
    success: "#22c55e"
  },
  graphite: {
    label: "Graphite",
    description: "Neutro profissional para operacao administrativa.",
    rootClass: "skin-graphite",
    mode: "dark",
    surface: "#111827",
    accent: "#60a5fa",
    success: "#34d399"
  },
  candy: {
    label: "Candy",
    description: "Claro e amigavel para recepcao infantil.",
    rootClass: "skin-candy",
    mode: "light",
    surface: "#fff7ed",
    accent: "#ec4899",
    success: "#22c55e"
  }
};

export function isToygoSkin(value: string | null): value is ToygoSkin {
  return value !== null && Object.prototype.hasOwnProperty.call(toygoSkins, value);
}
