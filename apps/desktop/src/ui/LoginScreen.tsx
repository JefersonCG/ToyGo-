import { AlertTriangle, CheckCircle2, Database, KeyRound, Loader2, Lock, LogIn, MonitorDot, ShieldCheck, WifiOff } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { toygoSkins, type ToygoSkin } from "@toygo/ui-skins";
import { SkinSwitcher } from "./SkinSwitcher";

interface LoginScreenProps {
  skin: ToygoSkin;
  onSkinChange: (skin: ToygoSkin) => void;
  onOpenOperation: () => void;
}

export function LoginScreen({ skin, onSkinChange, onOpenOperation }: LoginScreenProps) {
  const [runtime, setRuntime] = useState<ToygoRuntimeStatus | null>(null);
  const [pairingCode, setPairingCode] = useState("");
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

  // O painel de carrinhos/playground so pode abrir com licenca ativa ou em
  // carencia -- "inactive"/"blocked" bloqueiam a operacao, nao so exibem um aviso.
  const canOpenOperation = runtime?.license.status === "active" || runtime?.license.status === "grace";

  async function refreshStatus() {
    setError(null);
    try {
      setRuntime(await window.toygo.getRuntimeStatus());
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Falha ao ler status local.");
    }
  }

  async function pairInstallation() {
    if (!pairingCode.trim()) {
      setError("Informe o codigo de pareamento emitido pela Central.");
      return;
    }

    setIsActivating(true);
    setError(null);
    try {
      await window.toygo.pairInstallation(pairingCode.trim());
      await refreshStatus();
    } catch (activationError) {
      setError(activationError instanceof Error ? activationError.message : "Nao foi possivel ativar a licenca.");
    } finally {
      setIsActivating(false);
    }
  }

  return (
    <main className="min-h-screen bg-app text-app transition-colors duration-300">
      <section className="grid min-h-screen grid-cols-[260px_minmax(0,1fr)]">
        <aside className="flex min-h-screen flex-col border-r border-panel-strong bg-sidebar px-5 py-6 text-white">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-lg bg-accent text-accent-contrast shadow-control">
              <MonitorDot className="h-7 w-7" />
            </div>
            <div>
              <p className="text-lg font-black">ToyGo!</p>
              <p className="text-xs font-bold uppercase text-slate-300">Desktop PDV</p>
            </div>
          </div>

          <nav className="mt-8 space-y-2 text-sm font-bold text-slate-300">
            <SideNavItem icon={<ShieldCheck className="h-4 w-4" />} label="Terminal" active />
            <SideNavItem icon={<Database className="h-4 w-4" />} label="Banco local" />
            <SideNavItem icon={<KeyRound className="h-4 w-4" />} label="Licenca" />
            <SideNavItem icon={<WifiOff className="h-4 w-4" />} label="Offline" />
          </nav>

          <div className="mt-auto space-y-3">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase text-slate-300">Skin atual</p>
              <p className="mt-1 text-lg font-black">{toygoSkins[skin].label}</p>
            </div>
            <SkinSwitcher skin={skin} onSkinChange={onSkinChange} showLabel={false} />
          </div>
        </aside>

        <div className="min-w-0 px-6 py-5">
          <header className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase text-muted">Console local</p>
              <h1 className="text-3xl font-black tracking-normal">Operacao pronta para abrir caixa</h1>
            </div>
            <button
              type="button"
              onClick={onOpenOperation}
              disabled={!canOpenOperation}
              title={canOpenOperation ? undefined : "Licenca inativa ou bloqueada -- pareie ou regularize antes de abrir o painel."}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-accent px-5 text-sm font-black text-accent-contrast shadow-control transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100 focus:outline-none focus:ring-4 focus:ring-accent/30"
            >
              <LogIn className="h-5 w-5" />
              Abrir painel
            </button>
          </header>

          {runtime && !canOpenOperation && (
            <div className="mb-5 flex items-start gap-2 rounded-md border border-danger/50 bg-danger/10 p-3 text-sm font-bold text-danger">
              <AlertTriangle className="mt-0.5 h-4 w-4" />
              Carrinhos e playground ficam bloqueados sem licenca ativa (status atual:{" "}
              {runtime.license.status}
              {runtime.license.blockedReason ? ` -- ${runtime.license.blockedReason}` : ""}). Pareie a
              instalacao ou regularize a assinatura na Central para liberar o painel.
            </div>
          )}

          {runtime && runtime.supportSessions.some((session) => session.status === "active") && (
            <div className="mb-5 flex items-start gap-2 rounded-md border border-warning/50 bg-warning/10 p-3 text-sm font-bold text-warning">
              <ShieldCheck className="mt-0.5 h-4 w-4" />
              Sessao de suporte remoto ativa concedida pela Central (
              {runtime.supportSessions
                .filter((session) => session.status === "active")
                .map((session) => session.reason)
                .join("; ")}
              ). O suporte tem acesso aos escopos autorizados ate a expiracao ou o fechamento da sessao.
            </div>
          )}

          <div className="grid grid-cols-[minmax(0,1fr)_390px] gap-5">
            <div className="space-y-5">
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

              <section className="rounded-lg border border-panel bg-panel p-6 shadow-panel">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase text-muted">Ativacao</p>
                    <h2 className="text-2xl font-black">Terminal da unidade</h2>
                  </div>
                  <div className="inline-flex h-10 items-center gap-2 rounded-md border border-panel-strong bg-input px-3 text-xs font-bold text-muted">
                    <Lock className="h-4 w-4" />
                    Ledger imutavel
                  </div>
                </div>

                <label className="block text-sm font-bold text-muted" htmlFor="pairing-code">Codigo de pareamento</label>
                <div className="mt-2 grid grid-cols-[minmax(0,1fr)_150px] gap-3">
                  <input
                    id="pairing-code"
                    className="h-12 rounded-md border border-panel-strong bg-input px-4 text-base text-app outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/30"
                    value={pairingCode}
                    onChange={(event) => setPairingCode(event.target.value)}
                    placeholder="Codigo emitido para esta instalacao"
                  />
                  <button
                    type="button"
                    onClick={pairInstallation}
                    disabled={isActivating}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-accent px-5 font-black text-accent-contrast transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-4 focus:ring-accent/30"
                  >
                    {isActivating ? <Loader2 className="h-5 w-5 animate-spin" /> : <KeyRound className="h-5 w-5" />}
                    Ativar
                  </button>
                </div>

                {error && (
                  <div className="mt-4 flex items-start gap-2 rounded-md border border-danger/50 bg-danger/10 p-3 text-sm font-bold text-danger">
                    <AlertTriangle className="mt-0.5 h-4 w-4" />
                    {error}
                  </div>
                )}
              </section>

              <div className="grid grid-cols-3 gap-3">
                <ReadinessCard label="Caixa" value="Fechado" detail="Aguardando operador" />
                <ReadinessCard label="Sincronizacao" value="Local" detail="Sem bloqueio de rede" />
                <ReadinessCard label="PDV" value="Seguro" detail="Dados sensiveis isolados" />
              </div>
            </div>

            <aside className="space-y-4">
              <section className="rounded-lg border border-panel bg-panel p-5 shadow-panel">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase text-muted">Identidade</p>
                    <h2 className="text-xl font-black">Terminal local</h2>
                  </div>
                  <ShieldCheck className="h-6 w-6 text-success" />
                </div>
                <dl className="space-y-3 text-sm">
                  <InfoRow label="Machine ID" value={runtime?.machineId ?? "Carregando"} />
                  <InfoRow label="Versao" value={runtime?.appVersion ?? "0.1.0"} />
                  <InfoRow label="Instalacao" value={runtime?.license.installationId ?? "Nao pareada"} />
                  <InfoRow label="Expiracao" value={runtime?.license.expiresAt ?? "Nao ativada"} />
                  <InfoRow label="Bloqueio" value={runtime?.license.blockedReason ?? "Sem bloqueio local"} />
                </dl>
              </section>

              <SkinSwitcher skin={skin} onSkinChange={onSkinChange} density="roomy" />

            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}

function SideNavItem(props: { icon: ReactNode; label: string; active?: boolean }) {
  return (
    <div className={`flex h-10 items-center gap-3 rounded-md px-3 ${props.active ? "bg-white/10 text-white" : "text-slate-300"}`}>
      {props.icon}
      {props.label}
    </div>
  );
}

function StatusTile(props: { icon: ReactNode; label: string; value: string; tone: "ok" | "warning" | "danger" | "loading" }) {
  const icon = props.tone === "ok" ? <CheckCircle2 className="h-5 w-5" /> : props.icon;
  return (
    <div className={`rounded-lg border bg-panel p-4 shadow-panel status-${props.tone}`}>
      <div className="flex items-center gap-2 text-sm font-black text-muted">{icon}{props.label}</div>
      <p className="mt-3 min-h-12 text-lg font-black leading-tight">{props.value}</p>
    </div>
  );
}

function ReadinessCard(props: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg border border-panel bg-panel p-4 shadow-panel">
      <p className="text-xs font-black uppercase text-muted">{props.label}</p>
      <p className="mt-2 text-2xl font-black">{props.value}</p>
      <p className="mt-1 text-sm text-muted">{props.detail}</p>
    </div>
  );
}

function InfoRow(props: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-md bg-input p-3">
      <dt className="font-bold text-muted">{props.label}</dt>
      <dd className="max-w-56 break-words text-right font-mono text-xs">{props.value}</dd>
    </div>
  );
}
