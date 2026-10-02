import { RiderForm } from "@/components/riders/RiderForm";

export default function NewRiderPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">New rider</h1>
      <RiderForm />
    </div>
  );
}
