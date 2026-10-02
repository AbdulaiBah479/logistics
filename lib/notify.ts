import type { OrderStatus } from "@/lib/generated/prisma/client";
import { buildNotificationMessage, pickRandomChannel } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { sendRealNotification } from "@/lib/smsProvider";

/**
 * Builds the status message, attempts a real send (best-effort, never throws), and logs one
 * Notification row reflecting what actually happened. Call this after the order's own DB
 * transaction commits — sending is an external call and shouldn't block or roll back order state.
 */
export async function recordAndSendNotification(
  orderId: string,
  status: OrderStatus,
  customer: { name: string; phone: string },
  trackingCode: string,
  failureReason?: string | null,
) {
  const channel = pickRandomChannel();
  const message = buildNotificationMessage(status, {
    customerName: customer.name,
    trackingCode,
    failureReason,
  });

  const deliveryMode = await sendRealNotification(channel, customer.phone, message);

  return prisma.notification.create({
    data: {
      orderId,
      channel,
      recipientPhone: customer.phone,
      message,
      deliveryMode,
    },
  });
}
