import FlaskData from "./components/FlaskData";
import ThreeScene from "./components/ThreeScene"; // ✅ Import the Three.js component

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        {/* ✅ Add the Three.js Scene Below */}
        <div className="w-full h-[500px] relative">
          {" "}
          {/* Adjust height as needed */}
          <ThreeScene />
        </div>
        <FlaskData />
      </main>
    </div>
  );
}
