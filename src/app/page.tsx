import HomeClient from "./home-client";

type PageProps = {
  searchParams: Promise<{ mode?: string }>;
};

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const initialMode = params.mode === "feedback" ? "feedback" : "ask";

  return <HomeClient initialMode={initialMode} />;
}
