export type CentralProductCode = "multiplus" | "toygo";

export type ToygoCentralModuleStatus = "active" | "reserved" | "beta" | "disabled";

export type ToygoCentralPlan = "starter" | "professional" | "enterprise";

export type ToygoCentralMenuSlot =
  | "daily_operation"
  | "commercial"
  | "safety"
  | "hardware"
  | "administration"
  | "analytics";

export interface ToygoCentralModuleDefinition {
  code: string;
  productCode: "toygo";
  name: string;
  description: string;
  minimumPlan: ToygoCentralPlan;
  status: ToygoCentralModuleStatus;
  menuSlot: ToygoCentralMenuSlot;
  permissions: string[];
  dependsOn?: string[];
}

export interface ToygoProductRegistry {
  productCode: "toygo";
  displayName: "ToyGo!";
  contractVersion: string;
  installationTypes: string[];
  modules: ToygoCentralModuleDefinition[];
  telemetryEvents: string[];
}

export const toygoProductRegistry: ToygoProductRegistry = {
  productCode: "toygo",
  displayName: "ToyGo!",
  contractVersion: "2026.09",
  installationTypes: [
    "toygo_desktop",
    "frontdesk_terminal",
    "self_checkin_kiosk",
    "gate_controller",
    "manager_console"
  ],
  telemetryEvents: [
    "toygo.installation.heartbeat",
    "toygo.capacity.warning",
    "toygo.cart.return_overdue",
    "toygo.device.offline",
    "toygo.backup.completed",
    "toygo.sync.failed"
  ],
  modules: [
    {
      code: "toygo.units",
      productCode: "toygo",
      name: "Unidades e ambientes",
      description: "Cadastro administrativo de unidades, ambientes, zonas e capacidade base.",
      minimumPlan: "starter",
      status: "active",
      menuSlot: "administration",
      permissions: ["toygo.units.read", "toygo.units.manage"]
    },
    {
      code: "toygo.frontdesk",
      productCode: "toygo",
      name: "Recepcao diaria",
      description: "Entrada, saida, fila, sessoes abertas, retirada segura e fechamento operacional.",
      minimumPlan: "starter",
      status: "active",
      menuSlot: "daily_operation",
      permissions: ["toygo.frontdesk.read", "toygo.frontdesk.operate"]
    },
    {
      code: "toygo.cart_rental",
      productCode: "toygo",
      name: "Aluguel de carrinhos",
      description: "Controle de retirada, tempo de uso, devolucao, vistoria, dano e manutencao.",
      minimumPlan: "starter",
      status: "active",
      menuSlot: "daily_operation",
      permissions: ["toygo.carts.read", "toygo.carts.operate", "toygo.carts.inspect"]
    },
    {
      code: "toygo.playground_sessions",
      productCode: "toygo",
      name: "Playground",
      description: "Sessoes por tempo, visitante, responsavel, pacote e check-out.",
      minimumPlan: "starter",
      status: "active",
      menuSlot: "daily_operation",
      permissions: ["toygo.playground.read", "toygo.playground.operate"]
    },
    {
      code: "toygo.cross_sell",
      productCode: "toygo",
      name: "Venda cruzada",
      description: "Ofertas contextuais por entrada, devolucao, festa, recorrencia e vertical.",
      minimumPlan: "starter",
      status: "active",
      menuSlot: "commercial",
      permissions: ["toygo.cross_sell.read", "toygo.cross_sell.manage"]
    },
    {
      code: "toygo.capacity_zones",
      productCode: "toygo",
      name: "Zonas e lotacao",
      description: "Capacidade por zona, alerta, idade minima, regras de acesso e ocupacao agregada.",
      minimumPlan: "professional",
      status: "reserved",
      menuSlot: "safety",
      permissions: ["toygo.zones.read", "toygo.zones.manage"]
    },
    {
      code: "toygo.waivers",
      productCode: "toygo",
      name: "Waivers e LGPD",
      description: "Termos, consentimentos, versoes, revogacao e trilha de auditoria.",
      minimumPlan: "professional",
      status: "reserved",
      menuSlot: "safety",
      permissions: ["toygo.waivers.read", "toygo.waivers.manage"]
    },
    {
      code: "toygo.parties",
      productCode: "toygo",
      name: "Festas e reservas",
      description: "Agenda, sala, pacote, convidados, adicionais, sinal e pagamentos.",
      minimumPlan: "professional",
      status: "reserved",
      menuSlot: "commercial",
      permissions: ["toygo.parties.read", "toygo.parties.manage"]
    },
    {
      code: "toygo.memberships",
      productCode: "toygo",
      name: "Memberships",
      description: "Planos recorrentes, banco de horas, vouchers e beneficios por familia.",
      minimumPlan: "professional",
      status: "reserved",
      menuSlot: "commercial",
      permissions: ["toygo.memberships.read", "toygo.memberships.manage"]
    },
    {
      code: "toygo.jump_park",
      productCode: "toygo",
      name: "Jump park",
      description: "Sessoes por horario, atracoes, regras por idade, meias e grupos.",
      minimumPlan: "enterprise",
      status: "reserved",
      menuSlot: "daily_operation",
      permissions: ["toygo.jump_park.read", "toygo.jump_park.manage"],
      dependsOn: ["toygo.capacity_zones"]
    },
    {
      code: "toygo.shopping_reporting",
      productCode: "toygo",
      name: "Integracao shopping",
      description: "Reporte de faturamento, fechamento e conciliacao por quiosque ou unidade.",
      minimumPlan: "enterprise",
      status: "reserved",
      menuSlot: "administration",
      permissions: ["toygo.shopping.read", "toygo.shopping.manage"]
    },
    {
      code: "toygo.devices",
      productCode: "toygo",
      name: "Dispositivos",
      description: "QR, RFID, NFC, catraca, leitor, totem e controladores homologados.",
      minimumPlan: "professional",
      status: "reserved",
      menuSlot: "hardware",
      permissions: ["toygo.devices.read", "toygo.devices.manage"]
    },
    {
      code: "toygo.analytics",
      productCode: "toygo",
      name: "Relatorios e indicadores",
      description: "Faturamento, ticket medio, conversao de venda cruzada, ocupacao e manutencao.",
      minimumPlan: "professional",
      status: "reserved",
      menuSlot: "analytics",
      permissions: ["toygo.analytics.read"]
    }
  ]
};

