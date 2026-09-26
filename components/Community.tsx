"use client";

import { motion } from "framer-motion";


export default function Community() {


  const communities = [

    {
      icon: "𝕏",
      title: "X (Twitter)",
      description:
        "Follow NovaGaia updates, announcements, AI discussions, and community news.",
      button:
        "Follow X",
      link:
        "https://x.com/NovaGaia_NVGAI",
    },


    {
      icon: "💬",
      title: "Discord",
      description:
        "Join the NovaGaia community hub and connect with supporters worldwide.",
      button:
        "Coming Soon",
      link:
        "#",
    },


    {
      icon: "📱",
      title: "Telegram",
      description:
        "Receive NovaGaia updates and participate in community discussions.",
      button:
        "Join",
      link:
        "https://t.me/NovaGaiaCommunity",
    },


  ];



  return (


    <section

      id="community"

      className="
      px-6
      py-24
      bg-black/40
      "

    >


      <div className="mx-auto max-w-6xl">



        <h2

          className="
          text-center
          text-5xl
          font-bold
          text-emerald-400
          "

        >

          Join The NovaGaia Community

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

          Become part of a global community exploring
          artificial intelligence, blockchain technology,
          and collective intelligence.

        </p>







        <div

          className="
          mt-16
          grid
          gap-8
          md:grid-cols-3
          "

        >



          {communities.map((community,index)=>(



            <motion.div

              key={index}

              whileHover={{
                y:-10,
              }}

              className="
              rounded-2xl
              border
              border-emerald-800
              bg-emerald-500/10
              p-8
              text-center
              "

            >



              <div className="text-6xl">

                {community.icon}

              </div>




              <h3

                className="
                mt-5
                text-2xl
                font-bold
                text-emerald-400
                "

              >

                {community.title}

              </h3>





              <p

                className="
                mt-4
                text-gray-300
                "

              >

                {community.description}

              </p>





              <a

                href={community.link}

                target="_blank"

                rel="noopener noreferrer"

                className="
                mt-6
                inline-block
                rounded-xl
                bg-emerald-400
                px-6
                py-3
                font-bold
                text-black
                transition
                hover:bg-emerald-300
                "

              >

                {community.button}

              </a>





            </motion.div>



          ))}



        </div>







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
            text-white
            "

          >

            Together We Build The Future 🌎🤖

          </h3>




          <p

            className="
            mt-4
            text-gray-300
            "

          >

            NovaGaia grows through people, ideas,
            innovation, and collective intelligence.

          </p>



        </div>



      </div>



    </section>


  );


}