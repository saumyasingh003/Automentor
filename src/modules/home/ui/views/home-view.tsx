"use client";


export const HomeView = () => {


  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] w-full p-4 gap-y-6">
      <img
        src="/bot.png"
        alt="AutoMentor Logo"
        className="w-40 h-40 sm:w-56 sm:h-56 object-contain drop-shadow-lg mb-4"
        draggable={false}
      />
      <h1 className="text-3xl sm:text-4xl font-extrabold text-center text-gray-800 mb-2">AutoMentor</h1>
      <p className="text-lg sm:text-xl text-center text-gray-600 max-w-2xl">
        Your AI-powered mentor for meetings: record, transcribe, summarize, and collaborate—all in one seamless platform.
      </p>
    </div>
  );
};

export default HomeView;
