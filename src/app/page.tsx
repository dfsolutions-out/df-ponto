export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-400">
          DF Solutions
        </p>

        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
          DF Ponto
        </h1>

        <p className="mt-4 text-base text-slate-300 sm:text-lg">
          Sistema digital de controle de jornada.
        </p>

        <div className="mx-auto mt-8 h-1 w-20 rounded-full bg-blue-500" />
      </div>
    </main>
  );
}