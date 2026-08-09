export default function Tokenomics() {
  const allocations = [
    {
      name: "Public Launch & Liquidity",
      percentage: "60%",
      amount: "600,000,000 NVGAI",
      color: "bg-cyan-500",
      purpose:
        "Supports fair public distribution, decentralized exchange liquidity, trading accessibility, and launch stability.",
    },

    {
      name: "Ecosystem",
      percentage: "20%",
      amount: "200,000,000 NVGAI",
      color: "bg-green-500",
      purpose:
        "Supports community rewards, AI & blockchain education, innovation initiatives, ecosystem expansion, and future utilities.",
    },

    {
      name: "Treasury",
      percentage: "10%",
      amount: "100,000,000 NVGAI",
      color: "bg-yellow-500",
      purpose:
        "Reserved for strategic partnerships, ecosystem expansion, emergency funding, and community-approved initiatives.",
    },

    {
      name: "Marketing",
      percentage: "5%",
      amount: "50,000,000 NVGAI",
      color: "bg-pink-500",
      purpose:
        "Supports content creation, partnerships, educational campaigns, brand awareness, and community growth.",
    },

    {
      name: "Team",
      percentage: "5%",
      amount: "50,000,000 NVGAI",
      color: "bg-purple-500",
      purpose:
        "Reserved for the long-term development and maintenance of the NovaGaia ecosystem with a transparent vesting schedule.",
    },
  ];

  const vesting = [
    {
      title: "Public Launch & Liquidity",
      lock: "100% available at launch",
      release:
        "Supports fair public trading, decentralized liquidity, and healthy market price discovery.",
    },

    {
      title: "Ecosystem",
      lock: "50% unlocked at launch",
      release:
        "Remaining 50% released gradually over 24 months through community rewards, educational programs, innovation initiatives, and ecosystem development.",
    },

    {
      title: "Treasury",
      lock: "100% locked at launch",
      release:
        "Reserved for strategic partnerships, ecosystem expansion, emergency funding, and future opportunities.",
    },

    {
      title: "Marketing",
      lock: "100% unlocked at launch",
      release:
        "Available at launch to support awareness campaigns, partnerships, content creation, and community growth.",
    },

    {
      title: "Team",
      lock: "Locked at launch",
      release:
        "Gradually vested over 24 months to demonstrate the team's long-term commitment to the NovaGaia ecosystem.",
    },
  ];

  return (
    <section
      id="tokenomics"
      className="
      bg-black/40
      px-6
      py-24
      text-white
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
          NovaGaia Tokenomics
        </h2>

        <p
          className="
          mx-auto
          mt-6
          max-w-3xl
          text-center
          text-gray-300
          "
        >
          NVGAI is designed to support long-term ecosystem growth,
          transparency, community participation, and sustainable development.
        </p>

        {/* Token Information */}

        <div
          className="
          mt-12
          grid
          gap-6
          md:grid-cols-3
          "
        >
          <InfoCard
            title="Blockchain"
            value="Solana"
          />

          <InfoCard
            title="Decimals"
            value="9"
          />

          <InfoCard
            title="Maximum Supply"
            value="1B NVGAI"
          />
        </div>

        <h3
          className="
          mt-16
          text-3xl
          font-bold
          "
        >
          Token Allocation
        </h3>

        <div className="mt-8 space-y-6">

          {allocations.map((item) => (

            <div
              key={item.name}
              className="
              rounded-xl
              bg-white/5
              p-5
              "
            >

              <div
                className="
                flex
                justify-between
                "
              >

                <h4 className="font-bold">
                  {item.name}
                </h4>

                <span
                  className="
                  font-bold
                  text-emerald-400
                  "
                >
                  {item.percentage}
                </span>

              </div>

              <div
                className="
                mt-3
                h-3
                rounded-full
                bg-gray-800
                "
              >

                <div
                  className={`
                  h-3
                  rounded-full
                  ${item.color}
                  `}
                  style={{
                    width: item.percentage,
                  }}
                />

              </div>

              <p className="mt-3 text-gray-300">
                {item.amount}
              </p>

              <p className="text-sm text-gray-400">
                {item.purpose}
              </p>

            </div>

          ))}

        </div>

        {/* Vesting */}

        <h3
          className="
          mt-20
          text-3xl
          font-bold
          "
        >
          Vesting & Transparency
        </h3>

        <p className="mt-4 max-w-3xl text-gray-400">
          Token allocations are structured to support long-term ecosystem
          development, responsible treasury management, and transparent
          team commitment. Applicable vesting schedules extend over 24 months.
        </p>

        <div
          className="
          mt-8
          grid
          gap-6
          md:grid-cols-2
          "
        >

          {vesting.map((item) => (

            <div
              key={item.title}
              className="
              rounded-xl
              border
              border-emerald-500/20
              bg-black/40
              p-6
              "
            >

              <h4
                className="
                text-xl
                font-bold
                text-emerald-400
                "
              >
                {item.title}
              </h4>

              <p className="mt-3 text-gray-300">
                🔒 {item.lock}
              </p>

              <p className="text-gray-300">
                📅 {item.release}
              </p>

            </div>

          ))}

        </div>

        {/* Philosophy */}

        <div
          className="
          mt-20
          rounded-2xl
          border
          border-cyan-500/30
          bg-black/60
          p-8
          "
        >

          <h3
            className="
            text-3xl
            font-bold
            text-cyan-400
            "
          >
            Tokenomics Philosophy
          </h3>

          <p className="mt-4 text-gray-300">
            NovaGaia focuses on transparency, community participation,
            and long-term ecosystem growth through responsible token
            management.
          </p>

        </div>

      </div>
    </section>
  );
}

function InfoCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div
      className="
      rounded-xl
      border
      border-emerald-800
      bg-black/40
      p-6
      text-center
      "
    >

      <h4 className="text-gray-400">
        {title}
      </h4>

      <p
        className="
        mt-2
        text-2xl
        font-bold
        text-emerald-400
        "
      >
        {value}
      </p>

    </div>
  );
}