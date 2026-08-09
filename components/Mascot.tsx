"use client";

import Image from "next/image";
import { motion } from "framer-motion";


export default function Hero() {

  return (

    <section
      id="home"
      className="
      min-h-screen
      flex
      items-center
      px-6
      py-24
      "
    >

      <div
        className="
        mx-auto
        grid
        max-w-7xl
        items-center
        gap-12
        md:grid-cols-2
        "
      >


        {/* LEFT CONTENT */}

        <motion.div

          initial={{
            opacity:0,
            x:-50,
          }}

          animate={{
            opacity:1,
            x:0,
          }}

          transition={{
            duration:0.8,
          }}

        >


          <p
            className="
            mb-5
            inline-block
            rounded-full
            border
            border-cyan-400
            bg-cyan-400/10
            px-5
            py-2
            text-sm
            text-cyan-300
            "
          >
            🚀 Building The Future With AI & Blockchain
          </p>




          <h1
            className="
            text-5xl
            font-extrabold
            text-emerald-400
            sm:text-6xl
            md:text-7xl
            "
          >
            NovaGaia
          </h1>



          <h2
            className="
            mt-4
            text-2xl
            font-semibold
            text-white
            sm:text-3xl
            "
          >
            One Planet. One Intelligence. One Community.
          </h2>




          <p
            className="
            mt-6
            max-w-xl
            text-lg
            leading-8
            text-gray-300
            "
          >

            NovaGaia is a global community combining
            Artificial Intelligence, Blockchain Technology,
            and Collective Intelligence to build a smarter,
            safer, and more sustainable future.

          </p>





          <div
            className="
            mt-10
            flex
            flex-col
            gap-4
            sm:flex-row
            "
          >



            <a
              href="/NovaGaia-Whitepaper-v1.2.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="
              rounded-xl
              bg-emerald-400
              px-8
              py-4
              text-center
              font-bold
              text-black
              transition
              hover:bg-emerald-300
              "
            >
              📄 View Whitepaper
            </a>




            <a
              href="#community"
              className="
              rounded-xl
              border
              border-cyan-400
              px-8
              py-4
              text-center
              text-white
              transition
              hover:bg-cyan-900/40
              "
            >
              🌐 Join NovaGaia
            </a>


          </div>





          <div
            className="
            mt-12
            grid
            grid-cols-1
            gap-4
            sm:grid-cols-3
            "
          >

            <StatCard
              title="NVGAI"
              text="Solana Token"
            />


            <StatCard
              title="🤖 AI"
              text="Future Technology"
            />


            <StatCard
              title="🌍"
              text="Global Community"
            />


          </div>



        </motion.div>









        {/* RIGHT IMAGE */}


        <motion.div

          initial={{
            opacity:0,
            scale:0.8,
          }}

          animate={{
            opacity:1,
            scale:1,
          }}

          transition={{
            duration:0.8,
          }}

          className="
          flex
          justify-center
          "

        >


          <div
            className="
            relative
            h-[400px]
            w-[400px]
            sm:h-[500px]
            sm:w-[500px]
            "
          >


            <Image

              src="/nova-mascot.png"

              alt="NovaGaia AI Mascot"

              fill

              priority

              sizes="
              (max-width:768px) 90vw,
              500px
              "

              className="
              object-contain
              drop-shadow-[0_0_50px_rgba(34,211,238,0.5)]
              "

            />


          </div>



        </motion.div>



      </div>


    </section>

  );

}





function StatCard({

  title,

  text,

}: {

  title:string;

  text:string;

}) {


  return (

    <div
      className="
      rounded-xl
      border
      border-emerald-800
      bg-black/40
      p-5
      text-center
      "
    >


      <h3
        className="
        text-2xl
        font-bold
        text-emerald-400
        "
      >

        {title}

      </h3>


      <p
        className="
        text-sm
        text-gray-300
        "
      >

        {text}

      </p>


    </div>

  );


}
