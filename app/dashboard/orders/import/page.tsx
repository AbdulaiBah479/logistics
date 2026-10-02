"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { CSV_TEMPLATE_HEADER } from "@/lib/csv";

const TEMPLATE_EXAMPLE_ROW = [
  "Aminata Conteh",
  "+232 77 300 001",
  "Small electronics parcel",
  "350000",
  "8000",
  "",
  "City Centre, Freetown",
  "8.4657",
  "-13.2317",
  "Congo Cross, Freetown",
  "8.4826",
  "-13.2571",
];

function downloadTemplate() {
  const csv = [CSV_TEMPLATE_HEADER.join(","), TEMPLATE_EXAMPLE_ROW.join(",")].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "orders-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

interface ImportResult {
  created: string[];
  errors: { row: number; message: string }[];
}

export default function ImportOrdersPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;

    setIsSubmitting(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.set("file", file);

    const res = await fetch("/api/orders/import", { method: "POST", body: formData });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to import orders.");
      setIsSubmitting(false);
      return;
    }

    setResult(await res.json());
    setIsSubmitting(false);
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Import orders from CSV
      </h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Dispatch many orders at once. Download the template, fill one row per order, then upload
        it below.
      </p>

      <button
        type="button"
        onClick={downloadTemplate}
        className="w-fit rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
      >
        Download CSV template
      </button>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
      >
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm"
        />
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={!file || isSubmitting}
          className="w-fit rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {isSubmitting ? "Importing..." : "Import orders"}
        </button>
      </form>

      {result && (
        <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
            {result.created.length} order{result.created.length === 1 ? "" : "s"} created
          </p>
          {result.created.length > 0 && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {result.created.join(", ")}
            </p>
          )}
          {result.errors.length > 0 && (
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-400">
                {result.errors.length} row{result.errors.length === 1 ? "" : "s"} failed
              </p>
              <ul className="mt-1 flex flex-col gap-1">
                {result.errors.map((e, i) => (
                  <li key={i} className="text-sm text-red-600 dark:text-red-400">
                    Row {e.row}: {e.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Link href="/dashboard/orders" className="text-sm font-medium text-zinc-900 underline dark:text-zinc-50">
            View orders →
          </Link>
        </div>
      )}
    </div>
  );
}
