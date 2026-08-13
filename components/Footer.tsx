"use client";

import {
  FaXTwitter,
  FaDiscord,
  FaTelegram,
  FaFacebook,
  FaTiktok,
} from "react-icons/fa6";


export default function Footer() {

  return (

    <footer
      className="
      border-t
      border-emerald-900
      bg-black
      px-8
      py-16
      "
    >

      <div className="mx-auto max-w-7xl">


        {/* Main Footer */}

        <div
          className="
          grid
          gap-12
          md:grid-cols-3
          "
        >



          {/* Brand */}

          <div>

            <h2
              className="
              text-4xl
              font-extrabold
              text-emerald-400
              "
            >
              NovaGaia 🤖🌍
            </h2>


            <p
              className="
              mt-5
              max-w-sm
              text-gray-400
              "
            >
              A community-driven cryptocurrency project exploring
              Artificial Intelligence, Blockchain Technology,
              Collective Intelligence, and sustainable innovation.
            </p>

          </div>






          {/* Navigation */}

          <div>

            <h3
              className="
              text-xl
              font-bold
              text-emerald-400
              "
            >
              Explore
            </h3>


            <ul
              className="
              mt-5
              space-y-3
              text-gray-300
              "
            >

              <li>
                <a
                  href="#about"
                  className="transition hover:text-emerald-400"
                >
                  About NovaGaia
                </a>
              </li>


              <li>
                <a
                  href="#tokenomics"
                  className="transition hover:text-emerald-400"
                >
                  Tokenomics
                </a>
              </li>


              <li>
                <a
                  href="#roadmap"
                  className="transition hover:text-emerald-400"
                >
                  Roadmap
                </a>
              </li>


              <li>
                <a
                  href="#community"
                  className="transition hover:text-emerald-400"
                >
                  Community
                </a>
              </li>


            </ul>


          </div>








          {/* Social Media */}


          <div>

            <h3
              className="
              text-xl
              font-bold
              text-emerald-400
              "
            >
              Join NovaGaia
            </h3>



            <p
              className="
              mt-5
              text-gray-400
              "
            >
              Connect with our global community and help build
              the future of AI, blockchain, and innovation.
            </p>




            <div
              className="
              mt-6
              flex
              flex-wrap
              gap-4
              "
            >


              <SocialIcon href="https://x.com/NovaGaia_NVGAI">
                <FaXTwitter />
              </SocialIcon>


              <SocialIcon href="#">
                <FaDiscord />
              </SocialIcon>


              <SocialIcon href="#">
                <FaTelegram />
              </SocialIcon>


              <SocialIcon href="#">
                <FaFacebook />
              </SocialIcon>


              <SocialIcon href="https://www.tiktok.com/@novagaia_nvgai">
                <FaTiktok />
              </SocialIcon>

            <a
              href="mailto:novagaiaofficial@gmail.com"
              className="
              mt-5
              inline-block
              text-gray-300
              transition
              hover:text-emerald-400
              "
            >
              novagaiaofficial@gmail.com
            </a>
            </div>


          </div>


        </div>









        {/* Bottom Section */}


        <div
          className="
          mt-14
          border-t
          border-emerald-900
          pt-8
          text-center
          "
        >


          <p
            className="
            text-sm
            text-gray-500
            "
          >
            © {new Date().getFullYear()} NovaGaia (NVGAI).
            All rights reserved.
          </p>



          <p
            className="
            mt-2
            text-xs
            text-gray-600
            "
          >
            NovaGaia is a community-driven cryptocurrency project
            created for education, participation, and technology
            exploration. Cryptocurrency involves risks.
            Always conduct your own research.
          </p>


        </div>



      </div>


    </footer>

  );

}





function SocialIcon({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {


  return (

    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"

      className="
      flex
      h-12
      w-12
      items-center
      justify-center
      rounded-xl
      border
      border-emerald-700
      text-xl
      text-emerald-400
      transition
      hover:bg-emerald-900
      "
    >

      {children}

    </a>

  );

}