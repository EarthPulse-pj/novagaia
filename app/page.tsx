import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
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


      {/* AI + Blockchain + Community */}
      <section id="solution">
        <div
          className="
          px-6
          py-20
          text-center
          "
        >
          <h2
            className="
            text-4xl
            md:text-5xl
            font-bold
            "
          >
            Building The Future Through Technology & Community
          </h2>

          <p
            className="
            mt-6
            max-w-3xl
            mx-auto
            text-gray-300
            "
          >
            NovaGaia combines Artificial Intelligence,
            Blockchain Technology, and Collective Intelligence
            to create a smarter, safer, and more connected future.
          </p>

        </div>
      </section>


      {/* NVGAI Token Information */}
      <Tokenomics />


      {/* Future Ecosystem */}
      <section id="ecosystem">

        <div
          className="
          px-6
          py-20
          text-center
          "
        >

          <h2
            className="
            text-4xl
            md:text-5xl
            font-bold
            "
          >
            NovaGaia Ecosystem
          </h2>


          <p
            className="
            mt-6
            max-w-3xl
            mx-auto
            text-gray-300
            "
          >
            Exploring AI education, blockchain awareness,
            community governance, innovation programs,
            and sustainable initiatives.
          </p>

        </div>

      </section>


      {/* Roadmap */}
      <Roadmap />


      {/* Nova Mascot */}
      <Mascot />


      {/* Community */}
      <Community />


      {/* Footer */}
      <Footer />

    </main>

  );
}