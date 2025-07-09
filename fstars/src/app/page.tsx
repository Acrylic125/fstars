import Image from "next/image";

const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const rows = 20;

export default function Home() {
  return (
    <div className="flex flex-col h-screen max-w-ui mx-auto px-12 py-8 md:px-20 md:py-12 gap-4">
      <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">
        Timetable
      </h1>
      <div className="w-full h-fit overflow-hidden border border-gray-700 rounded-lg">
        <div className="w-full h-fit overflow-x-auto max-w-ui flex flex-col">
          <div className="grid grid-cols-7 min-w-5xl">
            {days.map((day) => (
              <div
                key={day}
                className="flex flex-col items-center justify-center bg-gray-800 border border-gray-700 p-4"
              >
                <h3 className="text-base md:text-lg lg:text-xl font-medium text-white">
                  {day}
                </h3>
              </div>
            ))}
            {days.map((day) => {
              return Array.from({ length: rows }).map((_, index) => (
                <div
                  key={day + index}
                  className="flex flex-col items-center justify-center bg-gray-900 border border-gray-700 p-4"
                >
                  <h3 className="text-base md:text-lg lg:text-xl font-medium text-white">
                    {index + 1}
                  </h3>
                </div>
              ));
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
