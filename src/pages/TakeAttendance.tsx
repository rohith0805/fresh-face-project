import { Navigation } from "@/components/Navigation";
import { AttendanceScanner } from "@/components/AttendanceScanner";
import { Scan, Sparkles, Users } from "lucide-react";

const TakeAttendance = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-glow-secondary/5 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_hsl(var(--background))_70%)]" />
      </div>

      <Navigation />

      <main className="relative z-10 container mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center space-y-4 py-8">
          <div className="relative inline-block">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-glow-secondary flex items-center justify-center mx-auto animate-float">
              <Scan className="w-10 h-10 text-primary-foreground" />
            </div>
            <div className="absolute -right-2 -top-2 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
              <Sparkles className="w-3 h-3 text-primary" />
            </div>
          </div>

          <h1 className="text-4xl font-bold">
            <span className="text-foreground">Take </span>
            <span className="text-gradient">Attendance</span>
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Select a class, take a photo, and AI will automatically detect and mark present students.
          </p>

          <div className="flex justify-center gap-3 pt-2">
            {[
              { icon: Scan, text: "Face Detection" },
              { icon: Users, text: "Auto Mark" },
              { icon: Sparkles, text: "AI Powered" },
            ].map((feature, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border/50 text-xs text-muted-foreground"
              >
                <feature.icon className="w-3 h-3 text-primary" />
                {feature.text}
              </div>
            ))}
          </div>
        </div>

        <AttendanceScanner />
      </main>
    </div>
  );
};

export default TakeAttendance;
