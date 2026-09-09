export type ToygoOperationalVertical =
  | "cart_rental"
  | "indoor_playground"
  | "shopping_kiosk"
  | "party_event"
  | "jump_park";

export type RentalAssetCategory =
  | "electric_cart"
  | "ride_on_toy"
  | "locker"
  | "wristband"
  | "playground_resource"
  | "jump_park_resource";

export type RentalAssetStatus =
  | "available"
  | "reserved"
  | "in_use"
  | "inspection_due"
  | "maintenance"
  | "retired";

export interface RentalAsset {
  id: string;
  tenantId: string;
  operationalUnitId: string;
  category: RentalAssetCategory;
  code: string;
  displayName: string;
  status: RentalAssetStatus;
  currentSessionId?: string;
  batteryPercent?: number;
  lastInspectionAt?: string;
  metadata?: Record<string, unknown>;
}

export type VisitSessionStatus =
  | "queued"
  | "checked_in"
  | "active"
  | "return_pending"
  | "closed"
  | "cancelled";

export interface VisitSession {
  id: string;
  tenantId: string;
  operationalUnitId: string;
  vertical: ToygoOperationalVertical;
  guardianId: string;
  visitorIds: string[];
  status: VisitSessionStatus;
  startsAt: string;
  expectedEndsAt?: string;
  closedAt?: string;
  zoneIds: string[];
  packageId?: string;
  waiverId?: string;
  metadata?: Record<string, unknown>;
}

export type RentalSessionStatus =
  | "assigned"
  | "in_use"
  | "returned"
  | "closed_with_damage"
  | "closed"
  | "cancelled";

export interface RentalSession {
  id: string;
  visitSessionId: string;
  assetId: string;
  status: RentalSessionStatus;
  checkedOutAt: string;
  expectedReturnAt?: string;
  returnedAt?: string;
  inspectionId?: string;
  priceCents: number;
  overtimeCents?: number;
}

export type ReturnInspectionOutcome = "ok" | "dirty" | "damaged" | "lost" | "maintenance_required";

export interface ReturnInspection {
  id: string;
  rentalSessionId: string;
  inspectedAt: string;
  inspectedByUserId: string;
  outcome: ReturnInspectionOutcome;
  notes?: string;
  chargeCents?: number;
  maintenanceTicketId?: string;
}

export type CrossSellTrigger =
  | "check_in"
  | "active_session"
  | "return"
  | "checkout"
  | "party_booking"
  | "repeat_visit";

export type CrossSellOfferKind =
  | "snack"
  | "drink"
  | "anti_slip_socks"
  | "extra_time"
  | "photo"
  | "locker"
  | "party_addon"
  | "membership"
  | "voucher"
  | "retail_item";

export interface CrossSellOffer {
  id: string;
  tenantId: string;
  operationalUnitId?: string;
  verticals: ToygoOperationalVertical[];
  trigger: CrossSellTrigger;
  kind: CrossSellOfferKind;
  title: string;
  description?: string;
  priceCents?: number;
  itemId?: string;
  packageId?: string;
  active: boolean;
}

