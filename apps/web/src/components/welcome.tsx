import { Button } from "@trustexam/ui";

export function Welcome() {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-start gap-4 px-6 py-24">
      <h1 className="text-3xl font-semibold">TrustExam Pro</h1>
      <p className="text-neutral-700">
        Build exams, invite candidates and review integrity reports. A person always makes the final
        decision.
      </p>
      <Button>Sign in</Button>
    </section>
  );
}
