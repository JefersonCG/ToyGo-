import { useEffect, useState } from "react";
import { toygoSkins, type ToygoSkin } from "@toygo/ui-skins";
import { LoginScreen } from "./LoginScreen";
import { MainMonitoringPanel } from "./MainMonitoringPanel";

export function App() {
  const [skin, setSkin] = useState<ToygoSkin>(() => (localStorage.getItem("toygo.skin") as ToygoSkin) || "dark");
  const [screen, setScreen] = useState<"login" | "monitoring">("login");

  useEffect(() => {
    localStorage.setItem("toygo.skin", skin);
    document.documentElement.className = toygoSkins[skin].rootClass;
  }, [skin]);

  if (screen === "monitoring") {
    return <MainMonitoringPanel skin={skin} onSkinChange={setSkin} onReturnToLogin={() => setScreen("login")} />;
  }

  return <LoginScreen skin={skin} onSkinChange={setSkin} onOpenOperation={() => setScreen("monitoring")} />;
}
