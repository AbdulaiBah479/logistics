import type { NotificationChannel, OrderStatus } from "@/lib/generated/prisma/client";

interface NotificationContext {
  customerName: string;
  trackingCode: string;
  failureReason?: string | null;
}

export function buildNotificationMessage(status: OrderStatus, ctx: NotificationContext): string {
  switch (status) {
    case "PENDING":
      return `Hi ${ctx.customerName}, we've received your order ${ctx.trackingCode} and are preparing it for dispatch.`;
    case "ASSIGNED":
      return `Hi ${ctx.customerName}, a rider has been assigned to your order ${ctx.trackingCode}.`;
    case "PICKED_UP":
      return `Hi ${ctx.customerName}, your order ${ctx.trackingCode} has been picked up and will be on its way shortly.`;
    case "IN_TRANSIT":
      return `Hi ${ctx.customerName}, your order ${ctx.trackingCode} is on its way!`;
    case "DELIVERED":
      return `Hi ${ctx.customerName}, your order ${ctx.trackingCode} has been delivered. Thank you for your business!`;
    case "FAILED":
      return `Hi ${ctx.customerName}, we were unable to deliver your order ${ctx.trackingCode} (${ctx.failureReason ?? "delivery attempt failed"}). Our team will be in touch shortly.`;
    case "CANCELLED":
      return `Hi ${ctx.customerName}, your order ${ctx.trackingCode} has been cancelled.`;
  }
}

export function pickRandomChannel(): NotificationChannel {
  return Math.random() < 0.5 ? "SMS" : "WHATSAPP";
}
