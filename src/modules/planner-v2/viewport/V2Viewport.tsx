import React, { Suspense, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { RoomRenderer } from "../scene/RoomRenderer";
import { FurnitureRenderer } from "../scene/FurnitureRenderer";
import { DiorisEnvironment } from "../scene/Environment";
import { usePlannerV2Store } from "../core/store";

const SceneContent: React.FC = () => {
  const { roomResult, roomSpec, viewMode } = usePlannerV2Store();

  return (
    <>
      <DiorisEnvironment />

      <RoomRenderer
        result={roomResult}
        mode={viewMode}
        showCeiling={roomSpec.showCeiling}
        showBaseboard={roomSpec.showBaseboard}
        baseboardHeight={roomSpec.baseboardHeightMm}
        baseboardThickness={roomSpec.baseboardThicknessMm}
      />

      <FurnitureRenderer />
    </>
  );
};

export const V2Viewport: React.FC = () => {
  return (
    <div className="w-full h-full bg-[#121214]">
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-full text-muted-foreground">
            CARREGANDO...
          </div>
        }
      >
        <Canvas
          shadows
          gl={{ antialias: false, preserveDrawingBuffer: true, powerPreference: "low-power" }}
        >
          <SceneContent />
        </Canvas>
      </Suspense>
    </div>
  );
};
