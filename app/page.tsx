import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Intelligence from "@/components/Intelligence";
import Learn from "@/components/Learn";
import ReportThreat from "@/components/ReportThreat";
import OperationBlacklist from "@/components/OperationBlacklist";
import QA from "@/components/QA";
import Tokenomics from "@/components/Tokenomics";
import Roadmap from "@/components/Roadmap";
import Mascot from "@/components/Mascot";
import Community from "@/components/Community";
import Footer from "@/components/Footer";


export default function Home() {
  return (

    <main
      className="
      min-h-screen
      overflow-hidden
      bg-gradient-to-b
      from-slate-950
      via-black
      to-emerald-950
      text-white
      "
    >

      {/* Navigation */}
      <Navbar />


      {/* NovaGaia Introduction */}
      <Hero />



      {/* Vision & Mission */}
      <About />


      {/* Crypto Intelligence */}
      <Intelligence />


      {/* NVGAI Token Information */}
      <div id="nvgai"><Tokenomics /></div>


      {/* Learning */}
      <Learn />


      {/* Roadmap */}
      <Roadmap />


      {/* Nova Mascot */}
      <div id="novapx1"><Mascot /></div>


      {/* Community */}
      <Community />


      {/* Report a Threat */}
      <ReportThreat />

      {/* Operation Blacklist */}
      <OperationBlacklist />

      {/* Q&A */}
      <QA />

      {/* Footer */}
      <Footer />

    </main>

  );
}