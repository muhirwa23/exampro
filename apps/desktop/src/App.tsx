import { getRuntimeInfo } from "./lib/native";
import { t } from "./messages";

export function App() {
  const runtime = getRuntimeInfo();

  return (
    <main className="shell" aria-labelledby="app-title">
      <p className="eyebrow">{t("productName")}</p>
      <h1 id="app-title">{t("heading")}</h1>
      <p>{t("description")}</p>
      <p className="runtime" role="status">
        {runtime.isDesktop ? t("desktopMode") : t("previewMode")}
      </p>
    </main>
  );
}
