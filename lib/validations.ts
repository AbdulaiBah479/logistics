import { z } from "zod";

export const createOrderSchema = z.object({
  customerName: z.string().min(2).max(120),
  customerPhone: z.string().min(6).max(20),
  packageDescription: z.string().min(2).max(500),
  codAmount: z.coerce.number().int().nonnegative().optional(),
  deliveryFee: z.coerce.number().int().nonnegative().optional(),
  scheduledFor: z.coerce.date().optional(),
  pickupAddress: z.string().min(2).max(300),
  pickupLat: z.coerce.number().min(-90).max(90),
  pickupLng: z.coerce.number().min(-180).max(180),
  dropoffAddress: z.string().min(2).max(300),
  dropoffLat: z.coerce.number().min(-90).max(90),
  dropoffLng: z.coerce.number().min(-180).max(180),
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const assignRiderSchema = z.object({
  riderId: z.string().min(1),
});

export const createRiderSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  phone: z.string().min(6).max(20),
  vehicleType: z.enum(["BICYCLE", "MOTORBIKE", "TRICYCLE", "CAR", "VAN"]),
});
export type CreateRiderInput = z.infer<typeof createRiderSchema>;

export const statusTransitionSchema = z.object({
  toStatus: z.enum([
    "PICKED_UP",
    "IN_TRANSIT",
    "DELIVERED",
    "FAILED",
    "CANCELLED",
  ]),
  note: z.string().max(500).optional(),
  failureReason: z.string().max(500).optional(),
});

export const ratingSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

export const messageSchema = z.object({
  body: z.string().min(1).max(1000),
});
