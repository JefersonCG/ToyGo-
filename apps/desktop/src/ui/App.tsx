import { useEffect, useState } from "react";
import { defaultToygoSkin, isToygoSkin, toygoSkins, type ToygoSkin } from "@toygo/ui-skins";
import { LoginScreen } from "./LoginScreen";
import { MainMonitoringPanel } from "./MainMonitoringPanel";

export function App() {
  const [skin, setSkin] = useState<ToygoSkin>(() => {
    const savedSkin = localStorage.getItem("toygo.skin");
    return isToygoSkin(savedSkin) ? savedSkin : defaultToygoSkin;
  });
  const [screen, setScreen] = useState<"login" | "monitoring">("login");

  useEffect(() => {
    localStorage.setItem("toygo.skin", skin);
    document.documentElement.className = toygoSkins[skin].rootClass;
    document.documentElement.dataset.skin = skin;
    document.documentElement.style.colorScheme = toygoSkins[skin].mode;
  }, [skin]);

  if (screen === "monitoring") {
    return <MainMonitoringPanel skin={skin} onSkinChange={setSkin} onReturnToLogin={() => setScreen("login")} />;
  }

  return <LoginScreen skin={skin} onSkinChange={setSkin} onOpenOperation={() => setScreen("monitoring")} />;
}
