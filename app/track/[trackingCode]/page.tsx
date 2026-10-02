import { notFound } from "next/navigation";
import { TrackingView } from "@/components/track/TrackingView";
import { getPublicTrackingPayload } from "@/lib/trackingPayload";

export default async function PublicTrackingPage({
  params,
}: {
  params: Promise<{ trackingCode: string }>;
}) {
  const { trackingCode } = await params;
  const data = await getPublicTrackingPayload(trackingCode);

  if (!data) notFound();

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-10 dark:bg-black">
      <TrackingView trackingCode={trackingCode} initialData={data} />
    </div>
  );
}
