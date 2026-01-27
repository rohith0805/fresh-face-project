import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Save, X, BookMarked } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Subject {
  id: string;
  name: string;
  code: string | null;
  created_at: string;
}

export function SubjectManager() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState({ name: "", code: "" });
  const { toast } = useToast();

  const fetchSubjects = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("subjects")
      .select("*")
      .order("name");

    if (error) {
      toast({ title: "Error", description: "Failed to load subjects", variant: "destructive" });
    } else {
      setSubjects(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleSubmit = async () => {
    if (!formData.name) {
      toast({ title: "Error", description: "Subject name is required", variant: "destructive" });
      return;
    }

    try {
      if (editingSubject) {
        const { error } = await supabase
          .from("subjects")
          .update({
            name: formData.name,
            code: formData.code || null
          })
          .eq("id", editingSubject.id);

        if (error) throw error;
        toast({ title: "Success", description: "Subject updated" });
      } else {
        const { error } = await supabase
          .from("subjects")
          .insert({
            name: formData.name,
            code: formData.code || null
          });

        if (error) throw error;
        toast({ title: "Success", description: "Subject added" });
      }

      setDialogOpen(false);
      resetForm();
      fetchSubjects();
    } catch (error: any) {
      console.error("Save error:", error);
      toast({ title: "Error", description: error.message || "Failed to save subject", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will also remove this subject from all class schedules.")) return;

    const { error } = await supabase.from("subjects").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete subject", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Subject deleted" });
      fetchSubjects();
    }
  };

  const openEditDialog = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code || ""
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ name: "", code: "" });
    setEditingSubject(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Subjects</h2>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button variant="glow" className="gap-2">
              <Plus className="w-4 h-4" />
              Add Subject
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>{editingSubject ? "Edit Subject" : "Add New Subject"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Mathematics"
                  className="mt-1 bg-secondary/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Code</label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., MATH101"
                  className="mt-1 bg-secondary/50"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="glow" onClick={handleSubmit} className="flex-1 gap-2">
                  <Save className="w-4 h-4" />
                  {editingSubject ? "Update" : "Add"} Subject
                </Button>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : subjects.length === 0 ? (
        <div className="glass-panel p-12 text-center">
          <p className="text-muted-foreground">No subjects created yet.</p>
          <p className="text-sm text-muted-foreground mt-1">Create subjects to assign them to class schedules.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => (
            <div key={subject.id} className="glass-panel p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BookMarked className="w-6 h-6 text-primary" />
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(subject)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(subject.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <h3 className="font-semibold text-lg">{subject.name}</h3>
              {subject.code && (
                <p className="text-xs text-primary mt-2 font-mono">{subject.code}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
