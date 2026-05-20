import { AlertTriangle, CheckCircle2, Database, KeyRound, Loader2, Lock, LogIn, MonitorDot, Palette, WifiOff } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { toygoSkins, type ToygoSkin } from "@toygo/ui-skins";

interface LoginScreenProps {
  skin: ToygoSkin;
  onSkinChange: (skin: ToygoSkin) => void;
  onOpenOperation: () => void;
}

export function LoginScreen({ skin, onSkinChange, onOpenOperation }: LoginScreenProps) {
  const [runtime, setRuntime] = useState<ToygoRuntimeStatus | null>(null);
  const [licenseKey, setLicenseKey] = useState("");
  const [isActivating, setIsActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void refreshStatus();
  }, []);

  const licenseTone = useMemo(() => {
    if (!runtime) return "loading";
    if (runtime.license.status === "active") return "ok";
    if (runtime.license.status === "grace") return "warning";
    return "danger";
  }, [runtime]);

  async function refreshStatus() {
    setError(null);
    try {
      setRuntime(await window.toygo.getRuntimeStatus());
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Falha ao ler status local.");
    }
  }

  async function activateLicense() {
    if (!licenseKey.trim()) {
      setError("Informe uma chave de licenca para ativar este terminal.");
      return;
    }

    setIsActivating(true);
    setError(null);
    try {
      await window.toygo.activateLicense(licenseKey.trim());
      await refreshStatus();
    } catch (activationError) {
      setError(activationError instanceof Error ? activationError.message : "Nao foi possivel ativar a licenca.");
    } finally {
      setIsActivating(false);
    }
  }

  return (
    <main className="min-h-screen bg-app text-app transition-colors duration-300">
      <section className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-[1.05fr_0.95fr] items-center gap-10 px-10 py-8">
        <div className="space-y-8">
          <header className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-lg bg-accent text-accent-contrast shadow-panel">
              <MonitorDot className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">ToyGo! Desktop</p>
              <h1 className="text-5xl font-black tracking-normal">Operacao offline-first para parquinhos indoor</h1>
            </div>
          </header>

          <div className="grid grid-cols-3 gap-3">
            <StatusTile
              icon={<Database className="h-5 w-5" />}
              label="MariaDB local"
              value={runtime?.mysql.message ?? "Verificando banco"}
              tone={runtime?.mysql.ok ? "ok" : runtime ? "danger" : "loading"}
            />
            <StatusTile
              icon={<KeyRound className="h-5 w-5" />}
              label="Licenca"
              value={runtime?.license.status ?? "Carregando"}
              tone={licenseTone}
            />
            <StatusTile
              icon={<WifiOff className="h-5 w-5" />}
              label="Modo"
              value="Offline-first"
              tone="ok"
            />
          </div>

          <div className="rounded-lg border border-panel bg-panel/90 p-6 shadow-panel backdrop-blur">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Ativacao do terminal</h2>
                <p className="mt-1 text-sm text-muted">A comunicacao com o Central usa apenas Machine ID, ativacao, bloqueio e PIX/Boleto.</p>
              </div>
              <div className="flex items-center gap-2 rounded-md border border-panel-strong px-3 py-2 text-xs text-muted">
                <Lock className="h-4 w-4" />
                Ledger imutavel
              </div>
            </div>

            <label className="block text-sm font-semibold text-muted" htmlFor="license-key">Chave de licenca</label>
            <div className="mt-2 flex gap-3">
              <input
                id="license-key"
                className="h-12 flex-1 rounded-md border border-panel-strong bg-input px-4 text-base outline-none ring-accent/30 transition focus:ring-4"
                value={licenseKey}
                onChange={(event) => setLicenseKey(event.target.value)}
                placeholder="TG-CLIENTE-UNIDADE-XXXX"
              />
              <button
                type="button"
                onClick={activateLicense}
                disabled={isActivating}
                className="inline-flex h-12 min-w-40 items-center justify-center gap-2 rounded-md bg-accent px-5 font-bold text-accent-contrast transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isActivating ? <Loader2 className="h-5 w-5 animate-spin" /> : <KeyRound className="h-5 w-5" />}
                Ativar
              </button>
            </div>

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-md border border-danger/50 bg-danger/10 p-3 text-sm text-danger">
                <AlertTriangle className="mt-0.5 h-4 w-4" />
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={onOpenOperation}
              className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md border border-accent bg-accent/10 px-5 font-bold text-accent transition hover:bg-accent hover:text-accent-contrast"
            >
              <LogIn className="h-5 w-5" />
              Abrir painel operacional
            </button>
          </div>
        </div>

        <aside className="rounded-lg border border-panel bg-panel p-6 shadow-panel">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black">Console local</h2>
              <p className="mt-1 text-sm text-muted">Status operacional antes de abrir o caixa.</p>
            </div>
            <Palette className="h-6 w-6 text-accent" />
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2">
            {(Object.keys(toygoSkins) as ToygoSkin[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onSkinChange(option)}
                className={`rounded-md border px-3 py-2 text-sm font-bold transition ${skin === option ? "border-accent bg-accent text-accent-contrast" : "border-panel-strong bg-input hover:border-accent"}`}
              >
                {toygoSkins[option].label}
              </button>
            ))}
          </div>

          <dl className="mt-8 space-y-4 text-sm">
            <InfoRow label="Machine ID" value={runtime?.machineId ?? "Carregando"} />
            <InfoRow label="Versao" value={runtime?.appVersion ?? "0.1.0"} />
            <InfoRow label="Expiracao" value={runtime?.license.expiresAt ?? "Nao ativada"} />
            <InfoRow label="Bloqueio" value={runtime?.license.blockedReason ?? "Sem bloqueio local"} />
          </dl>

          {runtime?.license.payment && (
            <div className="mt-6 rounded-md border border-accent/40 bg-accent/10 p-4 text-sm">
              <p className="font-bold">Cobranca disponivel: {runtime.license.payment.type.toUpperCase()}</p>
              <p className="mt-1 text-muted">Valor: {(runtime.license.payment.amountCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}

function StatusTile(props: { icon: ReactNode; label: string; value: string; tone: "ok" | "warning" | "danger" | "loading" }) {
  const icon = props.tone === "ok" ? <CheckCircle2 className="h-5 w-5" /> : props.icon;
  return (
    <div className={`rounded-lg border bg-panel p-4 shadow-panel status-${props.tone}`}>
      <div className="flex items-center gap-2 text-sm font-bold text-muted">{icon}{props.label}</div>
      <p className="mt-3 min-h-12 text-lg font-black leading-tight">{props.value}</p>
    </div>
  );
}

function InfoRow(props: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-md bg-input p-3">
      <dt className="font-semibold text-muted">{props.label}</dt>
      <dd className="max-w-72 break-words text-right font-mono text-xs">{props.value}</dd>
    </div>
  );
}
