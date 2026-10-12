const messages = {
  title: "TrustExam Pro",
  heading: "A clearer way to run trusted assessments",
  description: "Your workspace for building exams and reviewing results will be ready here.",
} as const;

export type MessageKey = keyof typeof messages;

export function t(key: MessageKey): string {
  return messages[key];
}
