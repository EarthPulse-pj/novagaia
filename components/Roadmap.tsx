"use client";

import { motion } from "framer-motion";


export default function Roadmap() {


  const phases = [

    {
      phase: "Phase 1",
      title: "Foundation & Launch",
      icon: "🌱",
      items: [
        "Launch NovaGaia official website",
        "Release NovaGaia whitepaper",
        "Build X, Discord, and Telegram communities",
        "Grow early NVGAI supporters",
        "Introduce NovaGaia AI vision",
      ],
    },


    {
      phase: "Phase 2",
      title: "Community Growth",
      icon: "🌍",
      items: [
        "Expand global NovaGaia community",
        "Community campaigns and events",
        "AI education initiatives",
        "Creator and technology collaborations",
        "Prepare community governance framework",
      ],
    },


    {
      phase: "Phase 3",
      title: "AI & Blockchain Ecosystem",
      icon: "🤖",
      items: [
        "Explore AI-powered community tools",
        "Develop future Web3 utilities",
        "Create NFT and digital identity concepts",
        "Showcase AI innovation projects",
        "Expand blockchain ecosystem opportunities",
      ],
    },


    {
      phase: "Phase 4",
      title: "Global Intelligence Network",
      icon: "🚀",
      items: [
        "Build AI and blockchain partnerships",
        "Support sustainable technology initiatives",
        "Create global innovation programs",
        "Grow decentralized ecosystem",
        "Establish NovaGaia long-term vision",
      ],
    },

  ];



  return (

    <section
      id="roadmap"
      className="
      px-6
      py-24
      bg-black/40
      "
    >

      <div className="mx-auto max-w-6xl">


        {/* HEADER */}

        <h2
          className="
          text-center
          text-5xl
          font-bold
          text-emerald-400
          "
        >
          NovaGaia Roadmap
        </h2>



        <p
          className="
          mx-auto
          mt-6
          max-w-3xl
          text-center
          text-xl
          text-gray-300
          "
        >
          The journey of NovaGaia from a community vision
          into a global AI and blockchain ecosystem.
        </p>





        {/* ROADMAP CARDS */}


        <div
          className="
          mt-16
          grid
          gap-8
          md:grid-cols-2
          "
        >


          {phases.map((phase,index)=>(


            <motion.div

              key={index}

              whileHover={{
                y:-10,
              }}

              transition={{
                duration:0.3,
              }}

              className="
              rounded-2xl
              border
              border-emerald-800
              bg-emerald-500/10
              p-8
              "

            >


              <div
                className="
                flex
                items-center
                gap-5
                "
              >


                <div className="text-5xl">
                  {phase.icon}
                </div>



                <div>

                  <p className="text-cyan-300">
                    {phase.phase}
                  </p>


                  <h3
                    className="
                    text-2xl
                    font-bold
                    text-white
                    "
                  >
                    {phase.title}
                  </h3>


                </div>


              </div>





              <ul
                className="
                mt-6
                space-y-3
                text-gray-300
                "
              >

                {phase.items.map((item,i)=>(

                  <li key={i}>
                    ✓ {item}
                  </li>

                ))}

              </ul>



            </motion.div>


          ))}


        </div>





        {/* FINAL MESSAGE */}


        <div
          className="
          mt-16
          rounded-2xl
          border
          border-cyan-500/30
          bg-black/50
          p-8
          text-center
          "
        >

          <h3
            className="
            text-3xl
            font-bold
            text-emerald-400
            "
          >
            One Planet. One Intelligence. One Community. 🌎
          </h3>


          <p
            className="
            mt-4
            text-gray-300
            "
          >
            NovaGaia grows together with the community by
            combining AI, blockchain technology, and collective
            intelligence to build the future.
          </p>


        </div>



      </div>


    </section>


  );

}