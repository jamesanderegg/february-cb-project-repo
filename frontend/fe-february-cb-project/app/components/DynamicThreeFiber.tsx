"use client";

import dynamic from "next/dynamic";

const ThreeFiber = dynamic(() => import("./ThreeFiber"), {
  ssr: false,
  loading: () => <div>Loading 3D Scene...</div>,
});

export default function DynamicThreeFiber() {
  return (
    <div className="w-full h-[500px] relative">
      <ThreeFiber />
    </div>
  );
}
