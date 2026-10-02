import { OrderForm } from "@/components/orders/OrderForm";

export default function NewOrderPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">New order</h1>
      <OrderForm />
    </div>
  );
}
