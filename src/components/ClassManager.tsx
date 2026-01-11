import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Save, X, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Class {
  id: string;
  name: string;
  description: string | null;
  schedule: string | null;
  created_at: string;
}

export function ClassManager() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "", schedule: "" });
  const { toast } = useToast();

  const fetchClasses = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("classes")
      .select("*")
      .order("name");

    if (error) {
      toast({ title: "Error", description: "Failed to load classes", variant: "destructive" });
    } else {
      setClasses(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleSubmit = async () => {
    if (!formData.name) {
      toast({ title: "Error", description: "Class name is required", variant: "destructive" });
      return;
    }

    try {
      if (editingClass) {
        const { error } = await supabase
          .from("classes")
          .update({
            name: formData.name,
            description: formData.description || null,
            schedule: formData.schedule || null
          })
          .eq("id", editingClass.id);

        if (error) throw error;
        toast({ title: "Success", description: "Class updated" });
      } else {
        const { error } = await supabase
          .from("classes")
          .insert({
            name: formData.name,
            description: formData.description || null,
            schedule: formData.schedule || null
          });

        if (error) throw error;
        toast({ title: "Success", description: "Class added" });
      }

      setDialogOpen(false);
      resetForm();
      fetchClasses();
    } catch (error) {
      console.error("Save error:", error);
      toast({ title: "Error", description: "Failed to save class", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will also delete all attendance records for this class.")) return;

    const { error } = await supabase.from("classes").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete class", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Class deleted" });
      fetchClasses();
    }
  };

  const openEditDialog = (cls: Class) => {
    setEditingClass(cls);
    setFormData({
      name: cls.name,
      description: cls.description || "",
      schedule: cls.schedule || ""
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ name: "", description: "", schedule: "" });
    setEditingClass(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Classes</h2>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button variant="glow" className="gap-2">
              <Plus className="w-4 h-4" />
              Add Class
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>{editingClass ? "Edit Class" : "Add New Class"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Computer Science 101"
                  className="mt-1 bg-secondary/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Class description..."
                  className="mt-1 bg-secondary/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Schedule</label>
                <Input
                  value={formData.schedule}
                  onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                  placeholder="e.g., Mon/Wed/Fri 9:00 AM"
                  className="mt-1 bg-secondary/50"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="glow" onClick={handleSubmit} className="flex-1 gap-2">
                  <Save className="w-4 h-4" />
                  {editingClass ? "Update" : "Add"} Class
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
      ) : classes.length === 0 ? (
        <div className="glass-panel p-12 text-center">
          <p className="text-muted-foreground">No classes created yet.</p>
          <p className="text-sm text-muted-foreground mt-1">Create a class to start organizing students.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => (
            <div key={cls.id} className="glass-panel p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(cls)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(cls.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <h3 className="font-semibold text-lg">{cls.name}</h3>
              {cls.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{cls.description}</p>
              )}
              {cls.schedule && (
                <p className="text-xs text-primary mt-2 font-mono">{cls.schedule}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
