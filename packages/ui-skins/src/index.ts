export type ToygoSkin = "dark" | "cyberpunk" | "light";

export const toygoSkins: Record<ToygoSkin, { label: string; rootClass: string }> = {
  dark: { label: "Dark", rootClass: "skin-dark" },
  cyberpunk: { label: "Cyberpunk", rootClass: "skin-cyberpunk" },
  light: { label: "Light", rootClass: "skin-light" }
};
