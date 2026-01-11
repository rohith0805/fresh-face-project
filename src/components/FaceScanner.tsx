import { useState, useRef, useCallback } from "react";
import { Upload, Scan, Camera, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DetectedFace {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

interface FaceScannerProps {
  onFacesDetected?: (faces: DetectedFace[]) => void;
}

export function FaceScanner({ onFacesDetected }: FaceScannerProps) {
  const [image, setImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [detectedFaces, setDetectedFaces] = useState<DetectedFace[]>([]);
  const [scanComplete, setScanComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        setDetectedFaces([]);
        setScanComplete(false);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const simulateFaceDetection = useCallback(() => {
    if (!imageRef.current) return;

    setIsScanning(true);
    setScanComplete(false);

    // Simulate AI face detection with random faces
    setTimeout(() => {
      const numFaces = Math.floor(Math.random() * 3) + 1;
      const faces: DetectedFace[] = [];
      
      for (let i = 0; i < numFaces; i++) {
        faces.push({
          id: i + 1,
          x: 15 + Math.random() * 40,
          y: 10 + Math.random() * 30,
          width: 25 + Math.random() * 20,
          height: 30 + Math.random() * 20,
          confidence: 85 + Math.random() * 14,
        });
      }

      setDetectedFaces(faces);
      setIsScanning(false);
      setScanComplete(true);
      onFacesDetected?.(faces);
    }, 2500);
  }, [onFacesDetected]);

  const resetScanner = useCallback(() => {
    setImage(null);
    setDetectedFaces([]);
    setScanComplete(false);
    setIsScanning(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="glass-panel glow-border p-6 space-y-6">
        {/* Upload Area */}
        {!image ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative border-2 border-dashed border-primary/30 rounded-xl p-12 cursor-pointer hover:border-primary/60 transition-colors group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Upload className="w-10 h-10 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-lg font-medium text-foreground">
                  Upload an image
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  PNG, JPG or WEBP up to 10MB
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Image Preview with Face Detection */}
            <div className="relative rounded-xl overflow-hidden bg-background/50">
              <img
                ref={imageRef}
                src={image}
                alt="Uploaded face"
                className="w-full h-auto max-h-[400px] object-contain"
              />
              
              {/* Scanning Animation */}
              {isScanning && (
                <div className="absolute inset-0 overflow-hidden">
                  <div className="scan-line absolute inset-x-0 h-1 animate-scan" />
                  <div className="absolute inset-0 bg-primary/5 animate-pulse-glow" />
                </div>
              )}

              {/* Face Detection Boxes */}
              {detectedFaces.map((face) => (
                <div
                  key={face.id}
                  className="absolute border-2 border-primary rounded-lg animate-fade-in-up"
                  style={{
                    left: `${face.x}%`,
                    top: `${face.y}%`,
                    width: `${face.width}%`,
                    height: `${face.height}%`,
                    boxShadow: "0 0 20px hsl(var(--primary) / 0.4)",
                  }}
                >
                  <div className="absolute -top-7 left-0 bg-primary px-2 py-1 rounded text-xs font-mono text-primary-foreground">
                    Face #{face.id}
                  </div>
                  <div className="absolute -bottom-6 left-0 bg-card/90 backdrop-blur px-2 py-0.5 rounded text-xs font-mono text-primary">
                    {face.confidence.toFixed(1)}%
                  </div>
                  {/* Corner markers */}
                  <div className="absolute -top-0.5 -left-0.5 w-3 h-3 border-t-2 border-l-2 border-primary" />
                  <div className="absolute -top-0.5 -right-0.5 w-3 h-3 border-t-2 border-r-2 border-primary" />
                  <div className="absolute -bottom-0.5 -left-0.5 w-3 h-3 border-b-2 border-l-2 border-primary" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 border-b-2 border-r-2 border-primary" />
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center">
              {!scanComplete && !isScanning && (
                <Button
                  variant="glow"
                  size="lg"
                  onClick={simulateFaceDetection}
                  className="gap-2"
                >
                  <Scan className="w-5 h-5" />
                  Start Face Detection
                </Button>
              )}
              
              {isScanning && (
                <Button variant="glass" size="lg" disabled className="gap-2">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Scanning...
                </Button>
              )}

              {scanComplete && (
                <Button variant="glass" size="lg" onClick={simulateFaceDetection} className="gap-2">
                  <RefreshCw className="w-5 h-5" />
                  Rescan
                </Button>
              )}

              <Button variant="outline" size="lg" onClick={resetScanner} className="gap-2">
                <Camera className="w-5 h-5" />
                New Image
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
