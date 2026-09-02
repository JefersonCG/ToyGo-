import { Check, Palette } from "lucide-react";
import type { CSSProperties } from "react";
import { toygoSkinOrder, toygoSkins, type ToygoSkin } from "@toygo/ui-skins";

interface SkinSwitcherProps {
  skin: ToygoSkin;
  onSkinChange: (skin: ToygoSkin) => void;
  density?: "compact" | "roomy";
  className?: string;
  showLabel?: boolean;
}

export function SkinSwitcher({ skin, onSkinChange, density = "compact", className = "", showLabel = true }: SkinSwitcherProps) {
  const isRoomy = density === "roomy";

  return (
    <div className={`${isRoomy ? "rounded-lg p-3" : "rounded-md px-2 py-2"} border border-panel bg-panel shadow-control ${className}`}>
      {showLabel && (
        <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase text-muted">
          <Palette className="h-4 w-4 text-accent" />
          Skins
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {toygoSkinOrder.map((option) => {
          const definition = toygoSkins[option];
          const selected = option === skin;
          const style = {
            background: `linear-gradient(135deg, ${definition.surface} 0 46%, ${definition.accent} 46% 74%, ${definition.success} 74% 100%)`
          } satisfies CSSProperties;

          return (
            <button
              key={option}
              type="button"
              title={`${definition.label}: ${definition.description}`}
              aria-label={`Selecionar skin ${definition.label}`}
              aria-pressed={selected}
              onClick={() => onSkinChange(option)}
              className={`relative grid h-9 w-9 place-items-center rounded-md border transition hover:-translate-y-0.5 hover:border-accent focus:outline-none focus:ring-4 focus:ring-accent/30 ${selected ? "border-accent shadow-control" : "border-panel-strong"}`}
              style={style}
            >
              {selected && (
                <span className="grid h-5 w-5 place-items-center rounded-full bg-panel text-accent shadow-control">
                  <Check className="h-3.5 w-3.5" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}