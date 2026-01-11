import { Scan, Sparkles, Zap } from "lucide-react";

export function HeroSection() {
  return (
    <div className="text-center space-y-6 py-12">
      {/* Logo/Icon */}
      <div className="relative inline-block">
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-glow-secondary flex items-center justify-center mx-auto animate-float">
          <Scan className="w-12 h-12 text-primary-foreground" />
        </div>
        <div className="absolute -right-2 -top-2 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
      </div>

      {/* Title */}
      <div className="space-y-3">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
          <span className="text-foreground">Face</span>
          <span className="text-gradient">Detect</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-lg mx-auto">
          Advanced face detection powered by AI. Upload an image and discover faces in milliseconds.
        </p>
      </div>

      {/* Feature Pills */}
      <div className="flex flex-wrap justify-center gap-3 pt-4">
        {[
          { icon: Zap, text: "Fast Detection" },
          { icon: Sparkles, text: "AI Powered" },
          { icon: Scan, text: "High Accuracy" },
        ].map((feature, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border/50 text-sm text-muted-foreground"
          >
            <feature.icon className="w-4 h-4 text-primary" />
            {feature.text}
          </div>
        ))}
      </div>
    </div>
  );
}
