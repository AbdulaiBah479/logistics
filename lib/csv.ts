import Papa from "papaparse";
import { createOrderSchema, type CreateOrderInput } from "@/lib/validations";

export const CSV_TEMPLATE_HEADER = [
  "customerName",
  "customerPhone",
  "packageDescription",
  "codAmount",
  "deliveryFee",
  "scheduledFor",
  "pickupAddress",
  "pickupLat",
  "pickupLng",
  "dropoffAddress",
  "dropoffLat",
  "dropoffLng",
] as const;

export interface ParsedOrdersCsv {
  rows: CreateOrderInput[];
  errors: { row: number; message: string }[];
}

export function parseOrdersCsv(text: string): ParsedOrdersCsv {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transform: (value) => value.trim(),
  });

  const rows: CreateOrderInput[] = [];
  const errors: { row: number; message: string }[] = [];

  parsed.data.forEach((raw, index) => {
    const rowNumber = index + 2; // +1 for header row, +1 for 1-based
    const candidate = {
      customerName: raw.customerName,
      customerPhone: raw.customerPhone,
      packageDescription: raw.packageDescription,
      codAmount: raw.codAmount || undefined,
      deliveryFee: raw.deliveryFee || undefined,
      scheduledFor: raw.scheduledFor || undefined,
      pickupAddress: raw.pickupAddress,
      pickupLat: raw.pickupLat,
      pickupLng: raw.pickupLng,
      dropoffAddress: raw.dropoffAddress,
      dropoffLat: raw.dropoffLat,
      dropoffLng: raw.dropoffLng,
    };

    const result = createOrderSchema.safeParse(candidate);
    if (result.success) {
      rows.push(result.data);
    } else {
      const message = result.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ");
      errors.push({ row: rowNumber, message });
    }
  });

  return { rows, errors };
}
