import { redirect } from "next/navigation";

export const metadata = {
  title: "Timeline | Strat X Advisory Portal",
};

export default async function TimelinePage() {
  redirect("/calendar");
}
