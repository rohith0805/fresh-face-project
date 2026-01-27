import { Navigation } from "@/components/Navigation";
import { SubjectManager } from "@/components/SubjectManager";

const Subjects = () => {
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
        <SubjectManager />
      </main>
    </div>
  );
};

export default Subjects;
