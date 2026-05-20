import { AlertTriangle, Clock3, DoorOpen, Gauge, PackagePlus, Plus, ReceiptText, ShoppingBasket, TimerReset, UserPlus } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toygoSkins, type ToygoSkin } from "@toygo/ui-skins";
import { CrossSellInventoryService, InventoryFinancePolicy, MonitoringSessionPricingPolicy, type PlaySessionPricingSnapshot } from "@toygo/application";
import { DefaultMovementIdFactory, FinanceLedgerService, InventoryEngine, InMemoryBalanceProvider, PriceNormalization, UnitConversionEngine, type FinanceLedgerEntry, type MovementWriter, type StockMovement } from "@toygo/domain";

interface MainMonitoringPanelProps {
  skin: ToygoSkin;
  onSkinChange: (skin: ToygoSkin) => void;
  onReturnToLogin: () => void;
}

interface PlayAsset {
  id: string;
  label: string;
  kind: "stay" | "cart" | "toy";
  includedMinutes: number;
  basePriceCents: number;
  extraMinuteCents: number;
}

interface CrossSellProduct {
  itemId: string;
  label: string;
  unit: string;
  unitPriceCents: number;
  stockBaseUnits: number;
}

interface SessionLine {
  id: string;
  guardianName: string;
  childName: string;
  assetId: string;
  startedAt: string;
  addOns: SessionAddOn[];
  movements: string[];
}

interface SessionAddOn {
  id: string;
  type: "asset" | "product";
  label: string;
  quantity: number;
  totalCents: number;
}

const tenantId = "tenant_demo";
const operationalUnitId = "unit_demo";
const operatorUserId = "operator_demo";

const playAssets: PlayAsset[] = [
  { id: "stay-general", label: "Estadia geral", kind: "stay", includedMinutes: 30, basePriceCents: 3500, extraMinuteCents: 150 },
  { id: "cart-mini", label: "Carrinho mini", kind: "cart", includedMinutes: 20, basePriceCents: 2800, extraMinuteCents: 180 },
  { id: "toy-vr", label: "Brinquedo VR", kind: "toy", includedMinutes: 15, basePriceCents: 3200, extraMinuteCents: 220 }
];

const crossSellProducts: CrossSellProduct[] = [
  { itemId: "snack-popcorn", label: "Pipoca", unit: "unidade", unitPriceCents: 900, stockBaseUnits: 40 },
  { itemId: "drink-water", label: "Agua", unit: "unidade", unitPriceCents: 600, stockBaseUnits: 60 },
  { itemId: "candy-combo", label: "Combo doce", unit: "unidade", unitPriceCents: 1400, stockBaseUnits: 30 }
];

export function MainMonitoringPanel({ skin, onSkinChange, onReturnToLogin }: MainMonitoringPanelProps) {
  const [now, setNow] = useState(() => new Date());
  const [guardianName, setGuardianName] = useState("Amanda Souza");
  const [childName, setChildName] = useState("Lia");
  const [assetId, setAssetId] = useState(playAssets[0].id);
  const [sessionLines, setSessionLines] = useState<SessionLine[]>(() => [createSessionLine("Amanda Souza", "Lia", "stay-general", -24), createSessionLine("Carlos Lima", "Theo", "cart-mini", -17)]);
  const [ledgerEvents, setLedgerEvents] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inventoryRuntime = useRef<MonitoringInventoryRuntime | null>(null);
  const pricingPolicy = useMemo(() => new MonitoringSessionPricingPolicy(), []);

  if (!inventoryRuntime.current) {
    inventoryRuntime.current = new MonitoringInventoryRuntime();
  }

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const snapshots = useMemo(() => {
    return new Map(sessionLines.map((line) => {
      const asset = findAsset(line.assetId);
      const snapshot = pricingPolicy.snapshot({
        startedAt: line.startedAt,
        now: now.toISOString(),
        includedMinutes: asset.includedMinutes,
        basePriceCents: asset.basePriceCents,
        extraMinuteCents: asset.extraMinuteCents,
        alertThresholdMinutes: 5
      });
      return [line.id, snapshot] as const;
    }));
  }, [now, pricingPolicy, sessionLines]);

  const activeTotalCents = sessionLines.reduce((total, line) => {
    const snapshot = snapshots.get(line.id);
    const addOnsTotal = line.addOns.reduce((sum, addOn) => sum + addOn.totalCents, 0);
    return total + (snapshot?.totalTimeCents ?? 0) + addOnsTotal;
  }, 0);

  function addSession() {
    setError(null);
    if (!guardianName.trim() || !childName.trim()) {
      setError("Informe responsavel e crianca para iniciar a linha.");
      return;
    }

    setSessionLines((current) => [createSessionLine(guardianName.trim(), childName.trim(), assetId), ...current]);
    setChildName("");
  }

  function addAssetToLine(lineId: string, nextAssetId: string) {
    const asset = findAsset(nextAssetId);
    setSessionLines((current) => current.map((line) => line.id === lineId
      ? {
        ...line,
        addOns: [
          ...line.addOns,
          { id: createUiId("addon"), type: "asset", label: asset.label, quantity: 1, totalCents: Math.round(asset.basePriceCents * 0.45) }
        ]
      }
      : line));
  }

  async function addCrossSell(lineId: string, itemId: string) {
    setError(null);
    const product = crossSellProducts.find((item) => item.itemId === itemId);
    if (!product || !inventoryRuntime.current) return;

    try {
      const movement = await inventoryRuntime.current.registerCrossSell({
        tenantId,
        operationalUnitId,
        itemId: product.itemId,
        sessionId: lineId,
        quantity: 1,
        unit: product.unit,
        totalValueCents: product.unitPriceCents,
        occurredAt: new Date().toISOString(),
        createdByUserId: operatorUserId
      });

      setSessionLines((current) => current.map((line) => line.id === lineId
        ? {
          ...line,
          movements: [...line.movements, movement.id],
          addOns: [
            ...line.addOns,
            { id: createUiId("addon"), type: "product", label: product.label, quantity: 1, totalCents: product.unitPriceCents }
          ]
        }
        : line));
      setLedgerEvents((current) => [`${product.label} baixado no ledger ${movement.id}`, ...current].slice(0, 6));
    } catch (crossSellError) {
      setError(crossSellError instanceof Error ? crossSellError.message : "Falha ao registrar venda cruzada no InventoryEngine.");
    }
  }

  function removeLine(lineId: string) {
    setSessionLines((current) => current.filter((line) => line.id !== lineId));
  }

  return (
    <main className="min-h-screen bg-app px-6 py-5 text-app">
      <header className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-accent text-accent-contrast">
            <Gauge className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">ToyGo! Desktop</p>
            <h1 className="text-2xl font-black tracking-normal">Painel operacional</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(Object.keys(toygoSkins) as ToygoSkin[]).map((option) => (
            <button key={option} type="button" onClick={() => onSkinChange(option)} className={`h-10 rounded-md border px-3 text-sm font-bold ${skin === option ? "border-accent bg-accent text-accent-contrast" : "border-panel-strong bg-input"}`}>
              {toygoSkins[option].label}
            </button>
          ))}
          <button type="button" onClick={onReturnToLogin} className="inline-flex h-10 items-center gap-2 rounded-md border border-panel-strong bg-input px-3 text-sm font-bold">
            <DoorOpen className="h-4 w-4" />
            Login
          </button>
        </div>
      </header>

      <section className="mb-4 grid grid-cols-[1fr_280px_280px_170px] gap-3 rounded-lg border border-panel bg-panel p-4 shadow-panel">
        <label className="space-y-1 text-sm font-bold text-muted">
          Responsavel
          <input value={guardianName} onChange={(event) => setGuardianName(event.target.value)} className="h-11 w-full rounded-md border border-panel-strong bg-input px-3 text-app outline-none focus:ring-4 focus:ring-accent/30" />
        </label>
        <label className="space-y-1 text-sm font-bold text-muted">
          Crianca
          <input value={childName} onChange={(event) => setChildName(event.target.value)} className="h-11 w-full rounded-md border border-panel-strong bg-input px-3 text-app outline-none focus:ring-4 focus:ring-accent/30" />
        </label>
        <label className="space-y-1 text-sm font-bold text-muted">
          Brinquedo ou carrinho
          <select value={assetId} onChange={(event) => setAssetId(event.target.value)} className="h-11 w-full rounded-md border border-panel-strong bg-input px-3 text-app outline-none focus:ring-4 focus:ring-accent/30">
            {playAssets.map((asset) => <option key={asset.id} value={asset.id}>{asset.label}</option>)}
          </select>
        </label>
        <button type="button" onClick={addSession} className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-accent px-4 font-black text-accent-contrast">
          <UserPlus className="h-5 w-5" />
          Iniciar
        </button>
      </section>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-danger/50 bg-danger/10 px-4 py-3 text-sm font-bold text-danger">
          <AlertTriangle className="h-5 w-5" />
          {error}
        </div>
      )}

      <section className="grid grid-cols-[1fr_320px] gap-4">
        <div className="space-y-3">
          <div className="grid grid-cols-[1.2fr_1fr_150px_150px_130px_220px] gap-3 px-3 text-xs font-black uppercase tracking-[0.12em] text-muted">
            <span>Responsavel / crianca</span>
            <span>Brinquedo</span>
            <span>Cronometro</span>
            <span>Status</span>
            <span>Total</span>
            <span>Acoes</span>
          </div>
          {sessionLines.map((line) => {
            const asset = findAsset(line.assetId);
            const snapshot = snapshots.get(line.id)!;
            const addOnsTotal = line.addOns.reduce((sum, addOn) => sum + addOn.totalCents, 0);
            return (
              <SessionRow
                key={line.id}
                line={line}
                asset={asset}
                snapshot={snapshot}
                totalCents={snapshot.totalTimeCents + addOnsTotal}
                onAddAsset={addAssetToLine}
                onAddCrossSell={addCrossSell}
                onRemove={removeLine}
              />
            );
          })}
        </div>

        <aside className="space-y-4">
          <MetricPanel icon={<Clock3 className="h-5 w-5" />} label="Linhas ativas" value={String(sessionLines.length)} />
          <MetricPanel icon={<ReceiptText className="h-5 w-5" />} label="Receita projetada" value={formatCurrency(activeTotalCents)} />
          <div className="rounded-lg border border-panel bg-panel p-4 shadow-panel">
            <div className="mb-3 flex items-center gap-2 font-black">
              <ShoppingBasket className="h-5 w-5 text-accent" />
              Ledger de venda cruzada
            </div>
            <div className="space-y-2 text-sm text-muted">
              {ledgerEvents.length === 0 ? <p>Nenhuma baixa registrada nesta sessao.</p> : ledgerEvents.map((event) => <p key={event} className="rounded-md bg-input p-2">{event}</p>)}
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}

function SessionRow(props: {
  line: SessionLine;
  asset: PlayAsset;
  snapshot: PlaySessionPricingSnapshot;
  totalCents: number;
  onAddAsset: (lineId: string, assetId: string) => void;
  onAddCrossSell: (lineId: string, itemId: string) => Promise<void>;
  onRemove: (lineId: string) => void;
}) {
  return (
    <div className={`grid min-h-24 grid-cols-[1.2fr_1fr_150px_150px_130px_220px] items-center gap-3 rounded-lg border bg-panel px-3 py-3 shadow-panel ${statusBorder(props.snapshot.status)}`}>
      <div>
        <p className="text-base font-black">{props.line.childName}</p>
        <p className="text-sm text-muted">{props.line.guardianName}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {props.line.addOns.map((addOn) => <span key={addOn.id} className="rounded-md bg-input px-2 py-1 text-xs font-bold text-muted">{addOn.label}</span>)}
        </div>
      </div>
      <div>
        <p className="font-bold">{props.asset.label}</p>
        <p className="text-sm text-muted">{props.asset.includedMinutes} min inclusos</p>
      </div>
      <div className="font-mono text-xl font-black">{formatDuration(props.snapshot.elapsedSeconds)}</div>
      <div>
        <p className="font-black">{statusLabel(props.snapshot)}</p>
        <p className="text-sm text-muted">{props.snapshot.overtimeMinutes > 0 ? `${props.snapshot.overtimeMinutes} min extras` : `${Math.ceil(props.snapshot.remainingSeconds / 60)} min restantes`}</p>
      </div>
      <div className="text-lg font-black">{formatCurrency(props.totalCents)}</div>
      <div className="grid grid-cols-2 gap-2">
        <MenuButton icon={<Plus className="h-4 w-4" />} label="Brinquedo" options={playAssets.filter((asset) => asset.id !== props.asset.id).map((asset) => ({ id: asset.id, label: asset.label }))} onSelect={(id) => props.onAddAsset(props.line.id, id)} />
        <MenuButton icon={<PackagePlus className="h-4 w-4" />} label="Produto" options={crossSellProducts.map((item) => ({ id: item.itemId, label: item.label }))} onSelect={(id) => void props.onAddCrossSell(props.line.id, id)} />
        <button type="button" className="col-span-2 inline-flex h-9 items-center justify-center gap-2 rounded-md border border-panel-strong bg-input px-3 text-sm font-bold" onClick={() => props.onRemove(props.line.id)}>
          <TimerReset className="h-4 w-4" />
          Encerrar linha
        </button>
      </div>
    </div>
  );
}

function MenuButton(props: { icon: ReactNode; label: string; options: Array<{ id: string; label: string }>; onSelect: (id: string) => void }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-2 top-2.5 text-accent">{props.icon}</span>
      <select aria-label={props.label} className="h-9 w-full rounded-md border border-panel-strong bg-input px-8 text-sm font-bold text-app" onChange={(event) => { if (event.target.value) props.onSelect(event.target.value); event.currentTarget.value = ""; }} defaultValue="">
        <option value="">{props.label}</option>
        {props.options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
      </select>
    </div>
  );
}

function MetricPanel(props: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-panel bg-panel p-4 shadow-panel">
      <div className="flex items-center gap-2 text-sm font-bold text-muted">{props.icon}{props.label}</div>
      <p className="mt-2 text-3xl font-black">{props.value}</p>
    </div>
  );
}

class MonitoringInventoryRuntime {
  private readonly crossSell: CrossSellInventoryService;
  private readonly balanceProvider = new InMemoryBalanceProvider();
  private readonly movementWriter = new InMemoryMovementWriter();
  private readonly financeWriter = new InMemoryFinanceWriter();
  private readonly ready: Promise<void>;

  constructor() {
    const unitConversion = new UnitConversionEngine(crossSellProducts.map((item) => ({ itemId: item.itemId, fromUnit: item.unit, toBaseUnit: item.unit, factorToBase: 1 })));
    const priceNormalization = new PriceNormalization(unitConversion);
    const idFactory = new DefaultMovementIdFactory();
    const inventoryEngine = new InventoryEngine(this.movementWriter, this.balanceProvider, priceNormalization, idFactory);
    const financeLedger = new FinanceLedgerService(this.financeWriter);
    const financePolicy = new InventoryFinancePolicy(financeLedger, idFactory);
    this.crossSell = new CrossSellInventoryService(inventoryEngine, financePolicy);
    this.ready = this.seedStock(inventoryEngine);
  }

  async registerCrossSell(input: Parameters<CrossSellInventoryService["register"]>[0]): Promise<StockMovement> {
    await this.ready;
    return this.crossSell.register(input);
  }

  private async seedStock(inventoryEngine: InventoryEngine): Promise<void> {
    await Promise.all(crossSellProducts.map((item) => inventoryEngine.registerIncomingStock({
      tenantId,
      operationalUnitId,
      itemId: item.itemId,
      source: "opening_balance",
      sourceId: "stage2_seed",
      quantity: item.stockBaseUnits,
      unit: item.unit,
      totalValueCents: item.stockBaseUnits * Math.round(item.unitPriceCents * 0.45),
      occurredAt: new Date().toISOString(),
      createdByUserId: operatorUserId
    })));
  }
}

class InMemoryMovementWriter implements MovementWriter {
  readonly movements: StockMovement[] = [];
  async appendMovement(movement: StockMovement): Promise<void> {
    this.movements.push(movement);
  }
}

class InMemoryFinanceWriter {
  readonly entries: FinanceLedgerEntry[] = [];
  async appendFinanceEntry(entry: FinanceLedgerEntry): Promise<void> {
    this.entries.push(entry);
  }
}

function createSessionLine(guardianName: string, childName: string, assetId: string, startedMinutesOffset = 0): SessionLine {
  const startedAt = new Date(Date.now() + startedMinutesOffset * 60_000).toISOString();
  return { id: createUiId("session"), guardianName, childName, assetId, startedAt, addOns: [], movements: [] };
}

function createUiId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function findAsset(assetId: string): PlayAsset {
  return playAssets.find((asset) => asset.id === assetId) ?? playAssets[0];
}

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function statusBorder(status: PlaySessionPricingSnapshot["status"]): string {
  if (status === "overtime") return "status-danger";
  if (status === "warning") return "status-warning";
  return "status-ok";
}

function statusLabel(snapshot: PlaySessionPricingSnapshot): string {
  if (snapshot.status === "overtime") return "Tempo estourado";
  if (snapshot.status === "warning") return "Atenção ao tempo";
  return "Em andamento";
}