import { Button } from "@trustexam/ui";

export function App() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-4 px-6">
      <h1 className="text-2xl font-semibold">TrustExam</h1>
      <p className="text-neutral-700">
        Before your exam starts, we will check your computer and explain what is monitored and why.
      </p>
      <Button>Enter exam code</Button>
    </main>
  );
}
