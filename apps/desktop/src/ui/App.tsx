import { useEffect, useState } from "react";
import { toygoSkins, type ToygoSkin } from "@toygo/ui-skins";
import { LoginScreen } from "./LoginScreen";

export function App() {
  const [skin, setSkin] = useState<ToygoSkin>(() => (localStorage.getItem("toygo.skin") as ToygoSkin) || "dark");

  useEffect(() => {
    localStorage.setItem("toygo.skin", skin);
    document.documentElement.className = toygoSkins[skin].rootClass;
  }, [skin]);

  return <LoginScreen skin={skin} onSkinChange={setSkin} />;
}
