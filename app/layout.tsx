import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {

  metadataBase: new URL(
    "https://novagaia-jade.vercel.app"
  ),


  title:
    "NovaGaia | Protect. Research. Learn.",


  description:
    "NovaGaia is a community-driven crypto intelligence and education ecosystem focused on research, transparency, collective intelligence, and scam awareness.",


  keywords: [
    "NovaGaia",
    "NVGAI",
    "Solana",
    "crypto",
    "Web3",
    "crypto intelligence",
    "crypto education",
    "scam awareness",
    "threat intelligence",
    "blockchain research",
    "NovaGaia Risk Score",
    "Operation Blacklist",
  ],


  authors: [
    {
      name: "NovaGaia",
    },
  ],


  creator:
    "NovaGaia",


  publisher:
    "NovaGaia",



  openGraph: {

    title:
      "NovaGaia | Protect. Research. Learn.",


    description:
      "A community-driven crypto intelligence and education ecosystem focused on research, transparency, and scam awareness.",


    type:
      "website",


    locale:
      "en_US",


    url:
      "https://novagaia-jade.vercel.app",


    siteName:
      "NovaGaia",


    images: [
      {
        url:
          "/opengraph-image.png",

        width:
          1200,

        height:
          630,

        alt:
          "NovaGaia - One Planet. One Intelligence. One Community.",
      },
    ],

  },



  twitter: {

    card:
      "summary_large_image",


    title:
      "NovaGaia | Protect. Research. Learn.",


    description:
      "Protect. Research. Learn. Join a community building collective crypto intelligence.",


    images:
      [
        "/opengraph-image.png",
      ],

  },


};



export default function RootLayout({

  children,

}: Readonly<{

  children:
    React.ReactNode;

}>) {


  return (

    <html lang="en">

      <body>

        {children}

      </body>

    </html>

  );

}