import { t } from "../lib/messages";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
      <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-teal-800">
        {t("title")}
      </p>
      <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
        {t("heading")}
      </h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
        {t("description")}
      </p>
    </main>
  );
}
