import { SiteHeader } from "@/components/SiteHeader";
import { Hero } from "@/components/hero/Hero";
import { Capabilities, Engineering, Hardware, Pipeline, Roadmap, SiteFooter, Statement, Team } from "@/components/Sections";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <Statement />
        <Capabilities />
        <Engineering />
        <Pipeline />
        <Hardware />
        <Roadmap />
        <Team />
      </main>
      <SiteFooter />
    </>
  );
}
