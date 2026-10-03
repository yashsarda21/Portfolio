import type { Route } from "./+types/home";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Yash Sarda — The Arena" },
    {
      name: "description",
      content: "Software Engineer Yash Sarda's portfolio, built as a night-time sports arena.",
    },
  ];
}

export default function Home() {
  return (
    <main className="grid min-h-dvh place-items-center bg-night">
      <div className="flex flex-col items-center gap-4">
        <p className="type-mono-brand text-scout">THE ARENA</p>
        <h1 className="type-d1 text-floodlight">YASH SARDA</h1>
        <a className="type-mono-md text-volt hover:text-volt-hover" href="#top">
          PORTFOLIO COMING SOON
        </a>
      </div>
    </main>
  );
}
