import type { ReactNode } from "react";
import "./styles.css";

export const metadata = {
  title: "ToyGo! Central",
  description: "Gestao central de clientes, licencas e financeiro ToyGo!."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
