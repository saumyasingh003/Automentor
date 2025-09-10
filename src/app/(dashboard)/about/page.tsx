import React from "react";

const features = [
  {
    title: "AI-powered video calls",
    desc: "Experience smarter, high-quality video calls with built-in AI assistance.",
    img: "/1.jpg",
  },
  {
    title: "Custom real-time agents",
    desc: "Deploy agents that adapt in real-time to enhance productivity.",
    img: "/2.webp",
  },
  {
    title: "Summaries, transcripts, recordings",
    desc: "Never miss a detail with automatic summaries and transcripts.",
    img: "/3.webp",
  },
  {
    title: "Meeting history & statuses",
    desc: "Track past meetings and check current statuses with ease.",
    img: "/4.jpg",
  },
  {
    title: "Better Auth login",
    desc: "Enjoy secure and fast authentication with Better Auth integration.",
    img: "/5.avif",
  },
  {
    title: "Subscriptions",
    desc: "Flexible subscription plans tailored for your needs.",
    img: "/6.webp",
  },
  {
    title: "Stream Chat SDK",
    desc: "Engage in real-time chat with seamless SDK integration.",
    img: "/7.jpeg",
  },
  {
    title: "Transcript search",
    desc: "Quickly find key moments with powerful transcript search.",
    img: "/8.jpg",
  },
];

const AboutPage = () => {
  return (
    <div className="mx-32 py-12">
      <h1 className="text-4xl font-bold mb-2 text-center">Automentor</h1>
      <p className="text-lg text-gray-600 mb-12 text-center">
        Empowering conversations with AI-driven communication
      </p>

      <div className="space-y-16">
        {features.map((feature, index) => (
          <div
            key={index}
            className={`flex flex-col md:flex-row items-center gap-8 ${
              index % 2 === 1 ? "md:flex-row-reverse" : ""
            }`}
          >
            {/* Image */}
            <div className="flex-shrink-0 w-64 h-64 relative">
              <img
                src={feature.img}
                alt={feature.title}
                className="w-full h-full object-cover rounded-xl shadow-md"
              />
              {/* Number badge */}
              <span className="absolute -top-4 -left-4 bg-blue-600 text-white font-bold text-lg w-10 h-10 flex items-center justify-center rounded-full shadow-lg">
                {index + 1}
              </span>
            </div>

            {/* Text */}
            <div className="flex-1">
              <h2 className="text-2xl font-semibold mb-4">{feature.title}</h2>
              <p className="text-gray-600">{feature.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AboutPage;

