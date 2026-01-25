import { useState, useEffect, useRef } from "react";
import { Plus, Upload, Trash2, Edit2, Save, X, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface Student {
  id: string;
  name: string;
  student_id: string;
  photo_url: string | null;
  class_id: string | null;
}

interface Class {
  id: string;
  name: string;
}

interface CSVImportResult {
  success: number;
  failed: number;
  errors: string[];
}

export function StudentManager() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({ name: "", student_id: "", class_id: "" });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<CSVImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    const [studentsRes, classesRes] = await Promise.all([
      supabase.from("students").select("*").order("name"),
      supabase.from("classes").select("id, name").order("name")
    ]);

    if (studentsRes.error) {
      toast({ title: "Error", description: "Failed to load students", variant: "destructive" });
    } else {
      setStudents(studentsRes.data || []);
    }

    if (!classesRes.error) {
      setClasses(classesRes.data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (event) => setPhotoPreview(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadPhoto = async (studentId: string): Promise<string | null> => {
    if (!photoFile) return null;

    const fileExt = photoFile.name.split(".").pop();
    const fileName = `${studentId}-${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("student-photos")
      .upload(fileName, photoFile, { upsert: true });

    if (error) {
      console.error("Upload error:", error);
      return null;
    }

    // Create signed URL (valid for 1 year)
    const { data: signedData, error: signedError } = await supabase.storage
      .from("student-photos")
      .createSignedUrl(fileName, 31536000);

    if (signedError || !signedData) {
      console.error("Signed URL error:", signedError);
      return null;
    }

    return signedData.signedUrl;
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.student_id) {
      toast({ title: "Error", description: "Name and Student ID are required", variant: "destructive" });
      return;
    }

    try {
      if (editingStudent) {
        let photo_url = editingStudent.photo_url;
        if (photoFile) {
          photo_url = await uploadPhoto(editingStudent.id);
        }

        const { error } = await supabase
          .from("students")
          .update({
            name: formData.name,
            student_id: formData.student_id,
            class_id: formData.class_id || null,
            photo_url
          })
          .eq("id", editingStudent.id);

        if (error) throw error;
        toast({ title: "Success", description: "Student updated" });
      } else {
        const { data: newStudent, error } = await supabase
          .from("students")
          .insert({
            name: formData.name,
            student_id: formData.student_id,
            class_id: formData.class_id || null
          })
          .select()
          .single();

        if (error) throw error;

        if (photoFile && newStudent) {
          const photo_url = await uploadPhoto(newStudent.id);
          if (photo_url) {
            await supabase
              .from("students")
              .update({ photo_url })
              .eq("id", newStudent.id);
          }
        }

        toast({ title: "Success", description: "Student added" });
      }

      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Save error:", error);
      toast({ title: "Error", description: "Failed to save student", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this student?")) return;

    const { error } = await supabase.from("students").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete student", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Student deleted" });
      fetchData();
    }
  };

  const openEditDialog = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      student_id: student.student_id,
      class_id: student.class_id || ""
    });
    setPhotoPreview(student.photo_url);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ name: "", student_id: "", class_id: "" });
    setPhotoFile(null);
    setPhotoPreview(null);
    setEditingStudent(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const getClassName = (classId: string | null) => {
    if (!classId) return "No class";
    return classes.find(c => c.id === classId)?.name || "Unknown";
  };

  const parseCSV = (text: string): { headers: string[]; rows: string[][] } => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
    const rows = lines.slice(1).map(line => {
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      return values;
    });
    
    return { headers, rows };
  };

  const handleCSVSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCsvFile(file);
      setImportResult(null);
    }
  };

  const handleCSVImport = async () => {
    if (!csvFile) return;

    setIsImporting(true);
    setImportProgress(0);
    setImportResult(null);

    try {
      const text = await csvFile.text();
      const { headers, rows } = parseCSV(text);

      // Find column indices
      const nameIdx = headers.findIndex(h => h === 'name' || h === 'student_name' || h === 'student name');
      const idIdx = headers.findIndex(h => h === 'student_id' || h === 'studentid' || h === 'id' || h === 'roll' || h === 'roll_number');
      const classIdx = headers.findIndex(h => h === 'class' || h === 'class_name' || h === 'class name');

      if (nameIdx === -1 || idIdx === -1) {
        toast({
          title: "Invalid CSV format",
          description: "CSV must have 'name' and 'student_id' columns",
          variant: "destructive"
        });
        setIsImporting(false);
        return;
      }

      const result: CSVImportResult = { success: 0, failed: 0, errors: [] };
      const total = rows.filter(r => r.length > 0 && r[nameIdx]).length;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row.length === 0 || !row[nameIdx]) continue;

        const name = row[nameIdx]?.trim();
        const studentId = row[idIdx]?.trim();
        const className = classIdx !== -1 ? row[classIdx]?.trim() : null;

        if (!name || !studentId) {
          result.failed++;
          result.errors.push(`Row ${i + 2}: Missing name or student ID`);
          continue;
        }

        // Find class by name if provided
        let classId: string | null = null;
        if (className) {
          const foundClass = classes.find(c => c.name.toLowerCase() === className.toLowerCase());
          if (foundClass) {
            classId = foundClass.id;
          }
        }

        // Insert student
        const { error } = await supabase
          .from("students")
          .insert({ name, student_id: studentId, class_id: classId });

        if (error) {
          result.failed++;
          if (error.code === '23505') {
            result.errors.push(`Row ${i + 2}: Student ID "${studentId}" already exists`);
          } else {
            result.errors.push(`Row ${i + 2}: ${error.message}`);
          }
        } else {
          result.success++;
        }

        setImportProgress(Math.round(((i + 1) / total) * 100));
      }

      setImportResult(result);
      
      if (result.success > 0) {
        toast({
          title: "Import complete",
          description: `${result.success} students imported successfully${result.failed > 0 ? `, ${result.failed} failed` : ''}`
        });
        fetchData();
      } else {
        toast({
          title: "Import failed",
          description: "No students were imported",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("CSV import error:", error);
      toast({
        title: "Error",
        description: "Failed to parse CSV file",
        variant: "destructive"
      });
    }

    setIsImporting(false);
  };

  const resetCSVImport = () => {
    setCsvFile(null);
    setImportResult(null);
    setImportProgress(0);
    if (csvInputRef.current) csvInputRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Students</h2>
        <div className="flex gap-2">
          <Dialog open={csvDialogOpen} onOpenChange={(open) => { setCsvDialogOpen(open); if (!open) resetCSVImport(); }}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                Import CSV
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Import Students from CSV</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="p-4 rounded-lg bg-secondary/30 border border-border">
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>Required columns:</strong> name, student_id
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Optional:</strong> class (must match existing class name)
                  </p>
                </div>
                
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  {csvFile ? (
                    <div className="space-y-2">
                      <FileSpreadsheet className="w-10 h-10 mx-auto text-primary" />
                      <p className="font-medium">{csvFile.name}</p>
                      <Button variant="ghost" size="sm" onClick={resetCSVImport}>
                        Choose different file
                      </Button>
                    </div>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Click to select a CSV file
                      </p>
                      <Button variant="outline" onClick={() => csvInputRef.current?.click()}>
                        Select CSV File
                      </Button>
                    </>
                  )}
                  <input
                    ref={csvInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleCSVSelect}
                    className="hidden"
                  />
                </div>

                {isImporting && (
                  <div className="space-y-2">
                    <Progress value={importProgress} className="h-2" />
                    <p className="text-sm text-center text-muted-foreground">
                      Importing... {importProgress}%
                    </p>
                  </div>
                )}

                {importResult && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span>{importResult.success} students imported</span>
                    </div>
                    {importResult.failed > 0 && (
                      <>
                        <div className="flex items-center gap-2 text-sm text-destructive">
                          <AlertCircle className="w-4 h-4" />
                          <span>{importResult.failed} failed</span>
                        </div>
                        <div className="max-h-32 overflow-y-auto text-xs text-muted-foreground bg-secondary/50 rounded p-2">
                          {importResult.errors.map((err, i) => (
                            <p key={i}>{err}</p>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="glow"
                    onClick={handleCSVImport}
                    disabled={!csvFile || isImporting}
                    className="flex-1 gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Import Students
                  </Button>
                  <Button variant="outline" onClick={() => setCsvDialogOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button variant="glow" className="gap-2">
                <Plus className="w-4 h-4" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>{editingStudent ? "Edit Student" : "Add New Student"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Student name"
                  className="mt-1 bg-secondary/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Student ID *</label>
                <Input
                  value={formData.student_id}
                  onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                  placeholder="e.g., STU001"
                  className="mt-1 bg-secondary/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Class</label>
                <Select value={formData.class_id} onValueChange={(v) => setFormData({ ...formData, class_id: v })}>
                  <SelectTrigger className="mt-1 bg-secondary/50">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Photo</label>
                <div className="mt-2 flex items-center gap-4">
                  {photoPreview && (
                    <img src={photoPreview} alt="Preview" className="w-20 h-20 rounded-lg object-cover" />
                  )}
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    {photoPreview ? "Change Photo" : "Upload Photo"}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="glow" onClick={handleSubmit} className="flex-1 gap-2">
                  <Save className="w-4 h-4" />
                  {editingStudent ? "Update" : "Add"} Student
                </Button>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : students.length === 0 ? (
        <div className="glass-panel p-12 text-center">
          <p className="text-muted-foreground">No students registered yet.</p>
          <p className="text-sm text-muted-foreground mt-1">Add students to start taking attendance.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {students.map((student) => (
            <div key={student.id} className="glass-panel p-4 flex items-center gap-4">
              {student.photo_url ? (
                <img
                  src={student.photo_url}
                  alt={student.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-secondary flex items-center justify-center text-2xl font-bold text-muted-foreground">
                  {student.name.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{student.name}</h3>
                <p className="text-sm text-muted-foreground font-mono">{student.student_id}</p>
                <p className="text-xs text-primary">{getClassName(student.class_id)}</p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEditDialog(student)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(student.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
