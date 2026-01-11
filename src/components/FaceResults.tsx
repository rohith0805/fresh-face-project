import { User, Shield, Fingerprint, Activity } from "lucide-react";

interface DetectedFace {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

interface FaceResultsProps {
  faces: DetectedFace[];
}

export function FaceResults({ faces }: FaceResultsProps) {
  if (faces.length === 0) return null;

  const averageConfidence = faces.reduce((acc, f) => acc + f.confidence, 0) / faces.length;

  return (
    <div className="w-full max-w-2xl mx-auto animate-fade-in-up">
      <div className="glass-panel p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Detection Results</h3>
            <p className="text-sm text-muted-foreground">Analysis complete</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-secondary/50 rounded-xl p-4 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div className="text-3xl font-bold text-gradient">{faces.length}</div>
            <div className="text-xs text-muted-foreground mt-1">Faces Detected</div>
          </div>

          <div className="bg-secondary/50 rounded-xl p-4 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div className="text-3xl font-bold text-gradient">{averageConfidence.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground mt-1">Avg Confidence</div>
          </div>

          <div className="bg-secondary/50 rounded-xl p-4 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Fingerprint className="w-6 h-6 text-primary" />
            </div>
            <div className="text-3xl font-bold text-gradient">
              {Math.max(...faces.map(f => f.confidence)).toFixed(0)}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">Best Match</div>
          </div>
        </div>

        {/* Individual Face Details */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Individual Detections
          </h4>
          {faces.map((face) => (
            <div
              key={face.id}
              className="flex items-center justify-between bg-background/50 rounded-lg p-4 border border-border/50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center font-mono text-primary font-bold">
                  #{face.id}
                </div>
                <div>
                  <div className="font-medium text-foreground">Face Detection #{face.id}</div>
                  <div className="text-xs text-muted-foreground font-mono">
                    Position: ({face.x.toFixed(0)}%, {face.y.toFixed(0)}%)
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-primary">{face.confidence.toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">confidence</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
