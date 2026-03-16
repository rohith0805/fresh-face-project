import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Clock, Calendar, Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

interface ClassSubject {
  id: string;
  class_id: string;
  subject_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  subject: { name: string; code: string | null } | null;
}

interface Subject {
  id: string;
  name: string;
  code: string | null;
}

interface Class {
  id: string;
  name: string;
}

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function ClassScheduleManager() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [schedules, setSchedules] = useState<ClassSubject[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    subject_id: "",
    day_of_week: "",
    start_time: "",
    end_time: ""
  });
  const { toast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    
    const [classesRes, subjectsRes] = await Promise.all([
      supabase.from("classes").select("id, name").order("name"),
      supabase.from("subjects").select("id, name, code").order("name")
    ]);

    if (classesRes.error) {
      toast({ title: "Error", description: "Failed to load classes", variant: "destructive" });
    } else {
      setClasses(classesRes.data || []);
      if (classesRes.data && classesRes.data.length > 0 && !selectedClass) {
        setSelectedClass(classesRes.data[0].id);
      }
    }

    if (subjectsRes.error) {
      toast({ title: "Error", description: "Failed to load subjects", variant: "destructive" });
    } else {
      setSubjects(subjectsRes.data || []);
    }
    
    setIsLoading(false);
  };

  const fetchSchedules = async () => {
    if (!selectedClass) return;
    
    const { data, error } = await supabase
      .from("class_subjects")
      .select("*, subject:subjects(name, code)")
      .eq("class_id", selectedClass)
      .order("day_of_week")
      .order("start_time");

    if (error) {
      toast({ title: "Error", description: "Failed to load schedules", variant: "destructive" });
    } else {
      setSchedules(data || []);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [selectedClass]);

  const handleSubmit = async () => {
    if (!formData.subject_id || !formData.day_of_week || !formData.start_time || !formData.end_time) {
      toast({ title: "Error", description: "All fields are required", variant: "destructive" });
      return;
    }

    if (formData.start_time >= formData.end_time) {
      toast({ title: "Error", description: "End time must be after start time", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase
        .from("class_subjects")
        .insert({
          class_id: selectedClass,
          subject_id: formData.subject_id,
          day_of_week: formData.day_of_week,
          start_time: formData.start_time,
          end_time: formData.end_time
        });

      if (error) throw error;
      
      toast({ title: "Success", description: "Schedule added" });
      setDialogOpen(false);
      resetForm();
      fetchSchedules();
    } catch (error: any) {
      console.error("Save error:", error);
      toast({ title: "Error", description: error.message || "Failed to save schedule", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this schedule entry?")) return;

    const { error } = await supabase.from("class_subjects").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete schedule", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Schedule removed" });
      fetchSchedules();
    }
  };

  const resetForm = () => {
    setFormData({ subject_id: "", day_of_week: "", start_time: "", end_time: "" });
  };

  // CSV Import logic
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importResults, setImportResults] = useState<{ success: number; errors: string[] } | null>(null);
  const [importing, setImporting] = useState(false);

  const csvRowSchema = z.object({
    subject: z.string().trim().min(1, "Subject is required").max(200),
    day_of_week: z.string().trim().min(1, "Day is required"),
    start_time: z.string().regex(/^\d{2}:\d{2}$/, "Start time must be HH:MM"),
    end_time: z.string().regex(/^\d{2}:\d{2}$/, "End time must be HH:MM"),
    class_name: z.string().trim().optional(),
  });

  const parseCSV = (text: string) => {
    const sep = text.includes(";") ? ";" : ",";
    const lines = text.trim().split("\n").filter(l => l.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(sep).map(h => h.trim().toLowerCase().replace(/\s+/g, "_"));
    return lines.slice(1).map((line, idx) => {
      const values = line.split(sep).map(v => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((h, i) => { row[h] = values[i] || ""; });
      return { ...row, _line: idx + 2 };
    });
  };

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      toast({ title: "Error", description: "File too large (max 1MB)", variant: "destructive" });
      return;
    }

    setImporting(true);
    setImportResults(null);
    setImportDialogOpen(true);

    try {
      const text = await file.text();
      const rows = parseCSV(text);
      
      if (rows.length === 0) {
        setImportResults({ success: 0, errors: ["CSV file is empty or has no data rows."] });
        setImporting(false);
        return;
      }

      // Validate required columns
      const firstRow = rows[0];
      const hasSubject = "subject" in firstRow || "subject_name" in firstRow || "subject_code" in firstRow;
      const hasDay = "day_of_week" in firstRow || "day" in firstRow;
      const hasTime = "start_time" in firstRow && "end_time" in firstRow;

      if (!hasSubject || !hasDay || !hasTime) {
        setImportResults({ 
          success: 0, 
          errors: ["CSV must have columns: subject (or subject_name/subject_code), day_of_week (or day), start_time, end_time. Optionally: class_name."] 
        });
        setImporting(false);
        return;
      }

      const errors: string[] = [];
      let success = 0;

      // Build lookup maps
      const subjectByName = new Map(subjects.map(s => [s.name.toLowerCase(), s]));
      const subjectByCode = new Map(subjects.filter(s => s.code).map(s => [s.code!.toLowerCase(), s]));
      const classByName = new Map(classes.map(c => [c.name.toLowerCase(), c]));

      const inserts: { class_id: string; subject_id: string; day_of_week: string; start_time: string; end_time: string }[] = [];

      for (const row of rows) {
        const lineNum = (row as any)._line;
        const subjectKey = (row as any).subject || (row as any).subject_name || (row as any).subject_code || "";
        const dayKey = (row as any).day_of_week || (row as any).day || "";
        const startTime = (row as any).start_time || "";
        const endTime = (row as any).end_time || "";
        const className = (row as any).class_name || "";

        // Validate day
        const normalizedDay = DAYS_OF_WEEK.find(d => d.toLowerCase() === dayKey.toLowerCase());
        if (!normalizedDay) {
          errors.push(`Row ${lineNum}: Invalid day "${dayKey}". Use: ${DAYS_OF_WEEK.join(", ")}`);
          continue;
        }

        // Validate times
        const timeRegex = /^\d{2}:\d{2}$/;
        if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
          errors.push(`Row ${lineNum}: Invalid time format. Use HH:MM (e.g., 09:00)`);
          continue;
        }
        if (startTime >= endTime) {
          errors.push(`Row ${lineNum}: End time must be after start time`);
          continue;
        }

        // Match subject
        const matchedSubject = subjectByName.get(subjectKey.toLowerCase()) || subjectByCode.get(subjectKey.toLowerCase());
        if (!matchedSubject) {
          errors.push(`Row ${lineNum}: Subject "${subjectKey}" not found. Create it first.`);
          continue;
        }

        // Determine class
        let classId = selectedClass;
        if (className) {
          const matchedClass = classByName.get(className.toLowerCase());
          if (!matchedClass) {
            errors.push(`Row ${lineNum}: Class "${className}" not found.`);
            continue;
          }
          classId = matchedClass.id;
        }

        if (!classId) {
          errors.push(`Row ${lineNum}: No class selected and no class_name column.`);
          continue;
        }

        inserts.push({
          class_id: classId,
          subject_id: matchedSubject.id,
          day_of_week: normalizedDay,
          start_time: startTime,
          end_time: endTime,
        });
      }

      // Batch insert
      if (inserts.length > 0) {
        const { error } = await supabase.from("class_subjects").insert(inserts);
        if (error) {
          errors.push(`Database error: ${error.message}`);
        } else {
          success = inserts.length;
        }
      }

      setImportResults({ success, errors });
      if (success > 0) fetchSchedules();
    } catch (err: any) {
      setImportResults({ success: 0, errors: [`Failed to parse CSV: ${err.message}`] });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const groupedSchedules = DAYS_OF_WEEK.reduce((acc, day) => {
    acc[day] = schedules.filter(s => s.day_of_week === day);
    return acc;
  }, {} as Record<string, ClassSubject[]>);

  const selectedClassName = classes.find(c => c.id === selectedClass)?.name || "";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold">Class Schedule</h2>
        <div className="flex items-center gap-4 flex-wrap">
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-48 bg-secondary/50">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border z-50">
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* CSV Import */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleCSVImport}
          />
          <Button
            variant="outline"
            className="gap-2"
            disabled={!selectedClass || subjects.length === 0}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-4 h-4" />
            Import CSV
          </Button>

          {/* Import Results Dialog */}
          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogContent className="bg-card border-border max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-primary" />
                  CSV Import Results
                </DialogTitle>
              </DialogHeader>
              {importing ? (
                <div className="text-center py-8">
                  <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-muted-foreground">Importing schedule data...</p>
                </div>
              ) : importResults ? (
                <div className="space-y-4 pt-2">
                  {importResults.success > 0 && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 text-green-400">
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                      <span className="font-medium">{importResults.success} schedule(s) imported successfully</span>
                    </div>
                  )}
                  {importResults.errors.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span className="font-medium">{importResults.errors.length} issue(s)</span>
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-1 p-3 rounded-lg bg-destructive/10 text-sm">
                        {importResults.errors.map((err, i) => (
                          <p key={i} className="text-destructive">{err}</p>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="p-3 rounded-lg bg-secondary/50 text-sm text-muted-foreground">
                    <p className="font-medium mb-1">Expected CSV format:</p>
                    <code className="text-xs block">subject,day_of_week,start_time,end_time,class_name</code>
                    <code className="text-xs block mt-1">Mathematics,Monday,09:00,10:00,CS-A</code>
                    <p className="text-xs mt-2">• <strong>class_name</strong> is optional (uses selected class if omitted)</p>
                    <p className="text-xs">• Subject must match an existing subject name or code</p>
                  </div>
                </div>
              ) : null}
            </DialogContent>
          </Dialog>
          
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button variant="glow" className="gap-2" disabled={!selectedClass || subjects.length === 0}>
                <Plus className="w-4 h-4" />
                Add Schedule
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Add Schedule for {selectedClassName}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Subject *</label>
                  <Select value={formData.subject_id} onValueChange={(val) => setFormData({ ...formData, subject_id: val })}>
                    <SelectTrigger className="mt-1 bg-secondary/50">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border z-50">
                      {subjects.map((sub) => (
                        <SelectItem key={sub.id} value={sub.id}>
                          {sub.name} {sub.code && `(${sub.code})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Day *</label>
                  <Select value={formData.day_of_week} onValueChange={(val) => setFormData({ ...formData, day_of_week: val })}>
                    <SelectTrigger className="mt-1 bg-secondary/50">
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border z-50">
                      {DAYS_OF_WEEK.map((day) => (
                        <SelectItem key={day} value={day}>{day}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Start Time *</label>
                    <Input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      className="mt-1 bg-secondary/50"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">End Time *</label>
                    <Input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      className="mt-1 bg-secondary/50"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button variant="glow" onClick={handleSubmit} className="flex-1 gap-2">
                    <Plus className="w-4 h-4" />
                    Add Schedule
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : !selectedClass ? (
        <div className="glass-panel p-12 text-center">
          <p className="text-muted-foreground">Select a class to view its schedule.</p>
        </div>
      ) : subjects.length === 0 ? (
        <div className="glass-panel p-12 text-center">
          <p className="text-muted-foreground">No subjects available.</p>
          <p className="text-sm text-muted-foreground mt-1">Create subjects first to add schedules.</p>
        </div>
      ) : schedules.length === 0 ? (
        <div className="glass-panel p-12 text-center">
          <p className="text-muted-foreground">No schedule entries for {selectedClassName}.</p>
          <p className="text-sm text-muted-foreground mt-1">Add subjects with timings to create the timetable.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {DAYS_OF_WEEK.map((day) => {
            const daySchedules = groupedSchedules[day];
            if (daySchedules.length === 0) return null;
            
            return (
              <div key={day} className="glass-panel p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold">{day}</h3>
                </div>
                <div className="space-y-2">
                  {daySchedules.map((schedule) => (
                    <div key={schedule.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                        </div>
                        <div>
                          <span className="font-medium">{schedule.subject?.name}</span>
                          {schedule.subject?.code && (
                            <span className="ml-2 text-xs text-primary font-mono">({schedule.subject.code})</span>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(schedule.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
