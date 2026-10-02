import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { generateTrackingCode } from "../lib/trackingCode";
import { buildNotificationMessage, pickRandomChannel } from "../lib/notifications";
import { haversineDistanceKm, estimateDurationMinutes } from "../lib/distance";
import type { OrderStatus, VehicleType } from "../lib/generated/prisma/client";
import { STATUS_TIMESTAMP_FIELD } from "../lib/orderStatus";

const now = Date.now();
const minutesAgo = (m: number) => new Date(now - m * 60_000);

interface Step {
  status: OrderStatus;
  minutesAgo: number;
  failureReason?: string;
}

interface SeedOrderInput {
  customerId: string;
  createdById: string;
  riderId?: string;
  packageDescription: string;
  codAmount?: number;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropoffAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  estimatedDurationMinutes?: number;
  proofOfDeliveryPhotoUrl?: string;
  steps: Step[];
}

async function createOrderWithHistory(input: SeedOrderInput) {
  const distanceKm = haversineDistanceKm(
    input.pickupLat,
    input.pickupLng,
    input.dropoffLat,
    input.dropoffLng,
  );
  const estimatedDurationMinutes =
    input.estimatedDurationMinutes ?? estimateDurationMinutes(distanceKm);

  const finalStep = input.steps[input.steps.length - 1];
  const timestampFields: Record<string, Date> = {};
  for (const step of input.steps) {
    const field = STATUS_TIMESTAMP_FIELD[step.status];
    if (field) timestampFields[field] = minutesAgo(step.minutesAgo);
  }

  const customer = await prisma.customer.findUniqueOrThrow({ where: { id: input.customerId } });

  const order = await prisma.order.create({
    data: {
      trackingCode: generateTrackingCode(),
      status: finalStep.status,
      customerId: input.customerId,
      createdById: input.createdById,
      riderId: input.riderId,
      packageDescription: input.packageDescription,
      codAmount: input.codAmount,
      pickupAddress: input.pickupAddress,
      pickupLat: input.pickupLat,
      pickupLng: input.pickupLng,
      dropoffAddress: input.dropoffAddress,
      dropoffLat: input.dropoffLat,
      dropoffLng: input.dropoffLng,
      estimatedDistanceKm: distanceKm,
      estimatedDurationMinutes,
      proofOfDeliveryPhotoUrl: input.proofOfDeliveryPhotoUrl,
      failureReason: finalStep.failureReason,
      createdAt: minutesAgo(input.steps[0].minutesAgo),
      ...timestampFields,
    },
  });

  for (const step of input.steps) {
    await prisma.orderEvent.create({
      data: {
        orderId: order.id,
        status: step.status,
        note: step.failureReason,
        createdById: input.createdById,
        createdAt: minutesAgo(step.minutesAgo),
      },
    });
    await prisma.notification.create({
      data: {
        orderId: order.id,
        channel: pickRandomChannel(),
        recipientPhone: customer.phone,
        message: buildNotificationMessage(step.status, {
          customerName: customer.name,
          trackingCode: order.trackingCode,
          failureReason: step.failureReason,
        }),
        createdAt: minutesAgo(step.minutesAgo),
      },
    });
  }

  return order;
}

async function main() {
  console.log("Seeding database...");

  // Clear existing data (dev-only reset)
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.orderEvent.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.rider.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("Admin123!", 10);

  const admin = await prisma.user.create({
    data: {
      name: "Aminata Sesay",
      email: "admin@example.com",
      passwordHash,
      role: "ADMIN",
      phone: "+232 76 100 001",
    },
  });

  await prisma.user.create({
    data: {
      name: "Sorie Kamara",
      email: "dispatcher@example.com",
      passwordHash,
      role: "DISPATCHER",
      phone: "+232 76 100 002",
    },
  });

  const riderDefs: { name: string; email: string; phone: string; vehicleType: VehicleType }[] = [
    { name: "Ibrahim Kamara", email: "ibrahim.rider@example.com", phone: "+232 78 200 001", vehicleType: "MOTORBIKE" },
    { name: "Fatmata Sesay", email: "fatmata.rider@example.com", phone: "+232 78 200 002", vehicleType: "TRICYCLE" },
    { name: "Mohamed Bangura", email: "mohamed.rider@example.com", phone: "+232 78 200 003", vehicleType: "CAR" },
  ];

  const riders = [];
  for (const def of riderDefs) {
    const user = await prisma.user.create({
      data: {
        name: def.name,
        email: def.email,
        passwordHash,
        role: "RIDER",
        phone: def.phone,
      },
    });
    const rider = await prisma.rider.create({
      data: {
        userId: user.id,
        phone: def.phone,
        vehicleType: def.vehicleType,
      },
    });
    riders.push(rider);
  }

  const customerDefs = [
    { name: "Aminata Conteh", phone: "+232 77 300 001" },
    { name: "John Kargbo", phone: "+232 77 300 002" },
    { name: "Isata Turay", phone: "+232 77 300 003" },
    { name: "Alusine Koroma", phone: "+232 77 300 004" },
  ];

  const customers = [];
  for (const def of customerDefs) {
    customers.push(await prisma.customer.create({ data: def }));
  }

  // Real Freetown-area landmarks
  const congoCross = { address: "Congo Cross, Freetown", lat: 8.4826, lng: -13.2571 };
  const aberdeen = { address: "Aberdeen, Freetown", lat: 8.49, lng: -13.2836 };
  const lumley = { address: "Lumley, Freetown", lat: 8.47, lng: -13.29 };
  const cityCentre = { address: "City Centre, Freetown", lat: 8.4657, lng: -13.2317 };

  // 1. PENDING - just created, unassigned
  await createOrderWithHistory({
    customerId: customers[0].id,
    createdById: admin.id,
    packageDescription: "Small electronics parcel",
    codAmount: 350000,
    pickupAddress: cityCentre.address,
    pickupLat: cityCentre.lat,
    pickupLng: cityCentre.lng,
    dropoffAddress: congoCross.address,
    dropoffLat: congoCross.lat,
    dropoffLng: congoCross.lng,
    steps: [{ status: "PENDING", minutesAgo: 5 }],
  });

  // 2. ASSIGNED - rider assigned, not yet picked up
  await createOrderWithHistory({
    customerId: customers[1].id,
    createdById: admin.id,
    riderId: riders[0].id,
    packageDescription: "Groceries and household items",
    pickupAddress: aberdeen.address,
    pickupLat: aberdeen.lat,
    pickupLng: aberdeen.lng,
    dropoffAddress: lumley.address,
    dropoffLat: lumley.lat,
    dropoffLng: lumley.lng,
    steps: [
      { status: "PENDING", minutesAgo: 20 },
      { status: "ASSIGNED", minutesAgo: 10 },
    ],
  });

  // 3. PICKED_UP - rider has the package
  await createOrderWithHistory({
    customerId: customers[2].id,
    createdById: admin.id,
    riderId: riders[1].id,
    packageDescription: "Documents envelope",
    pickupAddress: congoCross.address,
    pickupLat: congoCross.lat,
    pickupLng: congoCross.lng,
    dropoffAddress: cityCentre.address,
    dropoffLat: cityCentre.lat,
    dropoffLng: cityCentre.lng,
    steps: [
      { status: "PENDING", minutesAgo: 60 },
      { status: "ASSIGNED", minutesAgo: 45 },
      { status: "PICKED_UP", minutesAgo: 30 },
    ],
  });

  // 4. IN_TRANSIT - inTransitAt recent so the simulated marker is visibly mid-route on first view
  await createOrderWithHistory({
    customerId: customers[3].id,
    createdById: admin.id,
    riderId: riders[2].id,
    packageDescription: "Restaurant food delivery",
    codAmount: 120000,
    pickupAddress: lumley.address,
    pickupLat: lumley.lat,
    pickupLng: lumley.lng,
    dropoffAddress: aberdeen.address,
    dropoffLat: aberdeen.lat,
    dropoffLng: aberdeen.lng,
    estimatedDurationMinutes: 25,
    steps: [
      { status: "PENDING", minutesAgo: 40 },
      { status: "ASSIGNED", minutesAgo: 25 },
      { status: "PICKED_UP", minutesAgo: 15 },
      { status: "IN_TRANSIT", minutesAgo: 7 },
    ],
  });

  // 5. DELIVERED - full history + proof of delivery photo
  await createOrderWithHistory({
    customerId: customers[0].id,
    createdById: admin.id,
    riderId: riders[0].id,
    packageDescription: "Clothing package",
    pickupAddress: cityCentre.address,
    pickupLat: cityCentre.lat,
    pickupLng: cityCentre.lng,
    dropoffAddress: lumley.address,
    dropoffLat: lumley.lat,
    dropoffLng: lumley.lng,
    proofOfDeliveryPhotoUrl: "/images/sample-proof.svg",
    steps: [
      { status: "PENDING", minutesAgo: 180 },
      { status: "ASSIGNED", minutesAgo: 160 },
      { status: "PICKED_UP", minutesAgo: 140 },
      { status: "IN_TRANSIT", minutesAgo: 120 },
      { status: "DELIVERED", minutesAgo: 90 },
    ],
  });

  // 6. FAILED - delivery attempt unsuccessful
  await createOrderWithHistory({
    customerId: customers[1].id,
    createdById: admin.id,
    riderId: riders[1].id,
    packageDescription: "Spare parts package",
    pickupAddress: aberdeen.address,
    pickupLat: aberdeen.lat,
    pickupLng: aberdeen.lng,
    dropoffAddress: congoCross.address,
    dropoffLat: congoCross.lat,
    dropoffLng: congoCross.lng,
    steps: [
      { status: "PENDING", minutesAgo: 180 },
      { status: "ASSIGNED", minutesAgo: 160 },
      { status: "PICKED_UP", minutesAgo: 140 },
      { status: "IN_TRANSIT", minutesAgo: 120 },
      {
        status: "FAILED",
        minutesAgo: 100,
        failureReason: "Customer unreachable after 3 attempts",
      },
    ],
  });

  console.log("Seed complete.");
  console.log("Login as admin: admin@example.com / Admin123!");
  console.log("Login as dispatcher: dispatcher@example.com / Admin123!");
  console.log("Login as rider: ibrahim.rider@example.com / Admin123! (also fatmata.rider@, mohamed.rider@)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
