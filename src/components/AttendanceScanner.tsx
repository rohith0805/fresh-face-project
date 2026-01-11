import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, Scan, Camera, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Class {
  id: string;
  name: string;
}

interface Student {
  id: string;
  name: string;
  student_id: string;
  photo_url: string | null;
}

interface RecognitionResult {
  detected_faces: number;
  present_students: Array<{
    student_id: string;
    name: string;
    confidence: number;
  }>;
  analysis: string;
}

export function AttendanceScanner() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [image, setImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Fetch classes on mount
  useEffect(() => {
    const fetchClasses = async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("id, name")
        .order("name");
      
      if (error) {
        toast({ title: "Error", description: "Failed to load classes", variant: "destructive" });
      } else {
        setClasses(data || []);
      }
    };
    fetchClasses();
  }, [toast]);

  // Fetch students when class changes
  useEffect(() => {
    if (!selectedClass) {
      setStudents([]);
      return;
    }
    
    const fetchStudents = async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id, name, student_id, photo_url")
        .eq("class_id", selectedClass);
      
      if (error) {
        toast({ title: "Error", description: "Failed to load students", variant: "destructive" });
      } else {
        setStudents(data || []);
      }
    };
    fetchStudents();
  }, [selectedClass, toast]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        setResult(null);
        setAttendanceMarked(false);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const recognizeFaces = async () => {
    if (!image || !selectedClass || students.length === 0) {
      toast({ 
        title: "Cannot scan", 
        description: "Please select a class with registered students and upload an image",
        variant: "destructive"
      });
      return;
    }

    setIsScanning(true);
    setResult(null);

    try {
      const response = await supabase.functions.invoke("recognize-faces", {
        body: {
          classPhotoBase64: image,
          studentPhotos: students.map(s => ({
            name: s.name,
            student_id: s.student_id,
            photo_url: s.photo_url
          }))
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setResult(response.data);
      toast({ title: "Scan complete", description: `Detected ${response.data.detected_faces} face(s)` });
    } catch (error) {
      console.error("Recognition error:", error);
      toast({ 
        title: "Recognition failed", 
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsScanning(false);
    }
  };

  const markAttendance = async () => {
    if (!result || !selectedClass) return;

    try {
      // Create attendance session
      const { data: session, error: sessionError } = await supabase
        .from("attendance_sessions")
        .insert({
          class_id: selectedClass,
          session_date: new Date().toISOString().split("T")[0],
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Mark all students from the class
      const attendanceRecords = students.map(student => {
        const presentStudent = result.present_students.find(
          p => p.student_id === student.student_id
        );
        return {
          session_id: session.id,
          student_id: student.id,
          status: presentStudent ? "present" : "absent",
          confidence: presentStudent?.confidence || null
        };
      });

      const { error: recordsError } = await supabase
        .from("attendance_records")
        .insert(attendanceRecords);

      if (recordsError) throw recordsError;

      setAttendanceMarked(true);
      toast({ title: "Success", description: "Attendance marked successfully!" });
    } catch (error) {
      console.error("Mark attendance error:", error);
      toast({ 
        title: "Failed to mark attendance", 
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  const reset = useCallback(() => {
    setImage(null);
    setResult(null);
    setAttendanceMarked(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Class Selector */}
      <div className="glass-panel p-4">
        <label className="text-sm font-medium text-muted-foreground mb-2 block">
          Select Class
        </label>
        <Select value={selectedClass} onValueChange={setSelectedClass}>
          <SelectTrigger className="w-full bg-secondary/50">
            <SelectValue placeholder="Choose a class..." />
          </SelectTrigger>
          <SelectContent>
            {classes.map((cls) => (
              <SelectItem key={cls.id} value={cls.id}>
                {cls.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedClass && (
          <p className="text-xs text-muted-foreground mt-2">
            {students.length} student(s) registered
          </p>
        )}
      </div>

      {/* Scanner */}
      <div className="glass-panel glow-border p-6">
        {!image ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative border-2 border-dashed border-primary/30 rounded-xl p-12 cursor-pointer hover:border-primary/60 transition-colors group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Camera className="w-10 h-10 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-lg font-medium text-foreground">
                  Take or upload class photo
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Capture the entire class for face detection
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="relative rounded-xl overflow-hidden bg-background/50">
              <img
                src={image}
                alt="Class photo"
                className="w-full h-auto max-h-[400px] object-contain"
              />
              
              {isScanning && (
                <div className="absolute inset-0 overflow-hidden">
                  <div className="scan-line absolute inset-x-0 h-1 animate-scan" />
                  <div className="absolute inset-0 bg-primary/5 animate-pulse-glow" />
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-center flex-wrap">
              {!result && !isScanning && (
                <Button
                  variant="glow"
                  size="lg"
                  onClick={recognizeFaces}
                  disabled={!selectedClass || students.length === 0}
                  className="gap-2"
                >
                  <Scan className="w-5 h-5" />
                  Recognize Faces
                </Button>
              )}
              
              {isScanning && (
                <Button variant="glass" size="lg" disabled className="gap-2">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Analyzing...
                </Button>
              )}

              {result && !attendanceMarked && (
                <Button variant="glow" size="lg" onClick={markAttendance} className="gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Mark Attendance
                </Button>
              )}

              <Button variant="outline" size="lg" onClick={reset} className="gap-2">
                <RefreshCw className="w-5 h-5" />
                New Photo
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="glass-panel p-6 animate-fade-in-up">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Scan className="w-5 h-5 text-primary" />
            Detection Results
          </h3>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-secondary/50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-gradient">{result.detected_faces}</div>
              <div className="text-xs text-muted-foreground">Faces Detected</div>
            </div>
            <div className="bg-secondary/50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-gradient">{result.present_students.length}</div>
              <div className="text-xs text-muted-foreground">Students Matched</div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Attendance Status</h4>
            {students.map((student) => {
              const present = result.present_students.find(
                p => p.student_id === student.student_id
              );
              return (
                <div
                  key={student.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    present 
                      ? "bg-primary/10 border-primary/30" 
                      : "bg-destructive/10 border-destructive/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {present ? (
                      <CheckCircle className="w-5 h-5 text-primary" />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive" />
                    )}
                    <div>
                      <div className="font-medium">{student.name}</div>
                      <div className="text-xs text-muted-foreground">{student.student_id}</div>
                    </div>
                  </div>
                  <div className="text-sm">
                    {present ? (
                      <span className="text-primary font-mono">{present.confidence.toFixed(0)}%</span>
                    ) : (
                      <span className="text-destructive">Absent</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {attendanceMarked && (
            <div className="mt-4 p-4 bg-primary/20 rounded-lg text-center">
              <CheckCircle className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="font-medium">Attendance saved successfully!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
