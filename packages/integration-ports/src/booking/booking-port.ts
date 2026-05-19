export interface BookingSlot {
  id: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  reservedCount: number;
}

export interface BookingPort {
  listAvailableSlots(input: { operationalUnitId: string; date: string }): Promise<BookingSlot[]>;
  reserveSlot(input: { slotId: string; guardianId: string; childrenCount: number; packageId?: string }): Promise<{ bookingId: string }>;
  cancelBooking(input: { bookingId: string; reason: string }): Promise<void>;
}
