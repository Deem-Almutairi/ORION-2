import { SiteHeader } from "@/components/SiteHeader";
import { Hero } from "@/components/hero/Hero";
import { Capabilities, Contact, Hardware, Pipeline, Roadmap, SiteFooter, Statement } from "@/components/Sections";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <Statement />
        <Capabilities />
        <Pipeline />
        <Hardware />
        <Roadmap />
        <Contact />
      </main>
      <SiteFooter />
    </>
  );
}
