const messages = {
  productName: "TrustExam Pro",
  heading: "Candidate app foundation",
  description: "The secure assessment experience will be built here.",
  desktopMode: "Running in the desktop shell.",
  previewMode: "Running in browser preview mode.",
} as const;

export type MessageKey = keyof typeof messages;

export function t(key: MessageKey): string {
  return messages[key];
}
