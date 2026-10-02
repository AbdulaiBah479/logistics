export function RatingDisplay({
  rating,
  comment,
}: {
  rating: number;
  comment?: string | null;
}) {
  return (
    <div>
      <div aria-label={`${rating} out of 5 stars`} className="text-lg leading-none text-amber-500">
        {"★".repeat(rating)}
        <span className="text-zinc-300 dark:text-zinc-700">{"★".repeat(5 - rating)}</span>
      </div>
      {comment && <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{comment}</p>}
    </div>
  );
}
