import { isTauri } from "@tauri-apps/api/core";

export interface RuntimeInfo {
  productName: string;
  isDesktop: boolean;
}

export function getRuntimeInfo(): RuntimeInfo {
  return {
    productName: "TrustExam Pro",
    isDesktop: isTauri(),
  };
}
