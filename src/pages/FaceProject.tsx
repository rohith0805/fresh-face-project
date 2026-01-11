import { useState } from "react";
import { HeroSection } from "@/components/HeroSection";
import { FaceScanner } from "@/components/FaceScanner";
import { FaceResults } from "@/components/FaceResults";

interface DetectedFace {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

const FaceProject = () => {
  const [detectedFaces, setDetectedFaces] = useState<DetectedFace[]>([]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-glow-secondary/5 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_hsl(var(--background))_70%)]" />
      </div>

      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        <HeroSection />
        
        <div className="space-y-8 mt-8">
          <FaceScanner onFacesDetected={setDetectedFaces} />
          <FaceResults faces={detectedFaces} />
        </div>

        {/* Footer */}
        <footer className="text-center py-12 mt-12">
          <p className="text-sm text-muted-foreground font-mono">
            FACE<span className="text-primary">DETECT</span> v1.0
          </p>
        </footer>
      </div>
    </div>
  );
};

export default FaceProject;
