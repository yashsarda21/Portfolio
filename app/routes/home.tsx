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
    <main>
      <p>THE ARENA</p>
      <h1>YASH SARDA</h1>
    </main>
  );
}
