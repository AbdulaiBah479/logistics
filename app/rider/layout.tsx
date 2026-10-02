import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { SignOutButton } from "@/components/ui/SignOutButton";

export default async function RiderLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "RIDER") {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-zinc-50 dark:bg-black">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center gap-5">
          <Link href="/rider" className="font-semibold text-zinc-900 dark:text-zinc-50">
            My Deliveries
          </Link>
          <Link
            href="/rider/earnings"
            className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Earnings
          </Link>
        </div>
        <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
          <span>{session.user.name}</span>
          <SignOutButton />
        </div>
      </header>
      <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
