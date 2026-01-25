import { useState, useEffect, useRef } from "react";
import { CalendarIcon, Users, CheckCircle, XCircle, BarChart3, Upload, Image } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Class {
  id: string;
  name: string;
}

interface AttendanceRecord {
  id: string;
  status: string;
  confidence: number | null;
  student: {
    name: string;
    student_id: string;
  };
}

export function AttendanceReports() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState({ total: 0, present: 0, absent: 0, late: 0 });
  const [loading, setLoading] = useState(false);
  const [sessionPhotoUrl, setSessionPhotoUrl] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchClasses = async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("id, name")
        .order("name");
      
      if (!error) setClasses(data || []);
    };
    fetchClasses();
  }, []);

  useEffect(() => {
    if (!selectedClass || !selectedDate) {
      setRecords([]);
      setStats({ total: 0, present: 0, absent: 0, late: 0 });
      setSessionPhotoUrl(null);
      setSessionId(null);
      return;
    }

    const fetchRecords = async () => {
      setLoading(true);
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      
      // First find the session for this class and date
      const { data: sessionData, error: sessionError } = await supabase
        .from("attendance_sessions")
        .select("id, photo_url")
        .eq("class_id", selectedClass)
        .eq("session_date", dateStr)
        .maybeSingle();
      
      if (sessionError) {
        toast({ title: "Error", description: "Failed to find session", variant: "destructive" });
        setLoading(false);
        return;
      }

      if (!sessionData) {
        setRecords([]);
        setStats({ total: 0, present: 0, absent: 0, late: 0 });
        setSessionPhotoUrl(null);
        setSessionId(null);
        setLoading(false);
        return;
      }

      setSessionId(sessionData.id);
      setSessionPhotoUrl(sessionData.photo_url);

      // Fetch attendance records for this session
      const { data, error } = await supabase
        .from("attendance_records")
        .select(`
          id,
          status,
          confidence,
          student:students(name, student_id)
        `)
        .eq("session_id", sessionData.id);
      
      if (error) {
        toast({ title: "Error", description: "Failed to load records", variant: "destructive" });
      } else {
        const formattedRecords = (data || []).map((r: any) => ({
          id: r.id,
          status: r.status,
          confidence: r.confidence,
          student: r.student
        }));
        setRecords(formattedRecords);
        
        const present = formattedRecords.filter(r => r.status === "present").length;
        const absent = formattedRecords.filter(r => r.status === "absent").length;
        const late = formattedRecords.filter(r => r.status === "late").length;
        setStats({ total: formattedRecords.length, present, absent, late });
      }
      setLoading(false);
    };
    fetchRecords();
  }, [selectedClass, selectedDate, toast]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !sessionId) return;

    setUploading(true);
    try {
      const fileName = `${sessionId}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('session-photos')
        .upload(fileName, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      // Create signed URL (valid for 1 year)
      const { data: signedData, error: signedError } = await supabase.storage
        .from('session-photos')
        .createSignedUrl(fileName, 31536000);
      
      if (signedError || !signedData) {
        throw new Error("Failed to create signed URL");
      }
      
      const photoUrl = signedData.signedUrl;
      
      // Update session with photo URL
      await supabase
        .from("attendance_sessions")
        .update({ photo_url: photoUrl })
        .eq("id", sessionId);
      
      setSessionPhotoUrl(photoUrl);
      toast({ title: "Success", description: "Photo uploaded successfully!" });
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: "Error", description: "Failed to upload photo", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <BarChart3 className="w-6 h-6 text-primary" />
        Attendance Reports
      </h2>

      {/* Filters */}
      <div className="glass-panel p-4 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium text-muted-foreground mb-2 block">Class</label>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="bg-secondary/50">
              <SelectValue placeholder="Select class..." />
            </SelectTrigger>
            <SelectContent>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium text-muted-foreground mb-2 block">Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal bg-secondary/50",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Session Photo */}
      {sessionId && (
        <div className="glass-panel p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Image className="w-5 h-5 text-primary" />
              Session Photo
            </h3>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                {uploading ? "Uploading..." : sessionPhotoUrl ? "Replace Photo" : "Upload Photo"}
              </Button>
            </div>
          </div>
          {sessionPhotoUrl ? (
            <div className="rounded-xl overflow-hidden bg-background/50">
              <img
                src={sessionPhotoUrl}
                alt="Session photo"
                className="w-full h-auto max-h-[400px] object-contain"
              />
            </div>
          ) : (
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
              <Image className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No photo uploaded for this session</p>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      {selectedClass && selectedDate && records.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-panel p-4 text-center">
            <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total Students</div>
          </div>
          <div className="glass-panel p-4 text-center">
            <CheckCircle className="w-8 h-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold text-primary">{stats.present}</div>
            <div className="text-xs text-muted-foreground">Present</div>
          </div>
          <div className="glass-panel p-4 text-center">
            <XCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
            <div className="text-2xl font-bold text-destructive">{stats.absent}</div>
            <div className="text-xs text-muted-foreground">Absent</div>
          </div>
          <div className="glass-panel p-4 text-center">
            <CalendarIcon className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-yellow-500">{stats.late}</div>
            <div className="text-xs text-muted-foreground">Late</div>
          </div>
        </div>
      )}

      {/* Records */}
      {loading ? (
        <div className="glass-panel p-12 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : selectedClass && selectedDate && records.length > 0 ? (
        <div className="glass-panel p-4">
          <h3 className="font-semibold mb-4">Attendance Details</h3>
          <div className="space-y-2">
            {records.map((record) => (
              <div
                key={record.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  record.status === "present" 
                    ? "bg-primary/10 border-primary/30" 
                    : record.status === "late"
                    ? "bg-yellow-500/10 border-yellow-500/30"
                    : "bg-destructive/10 border-destructive/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  {record.status === "present" ? (
                    <CheckCircle className="w-5 h-5 text-primary" />
                  ) : record.status === "late" ? (
                    <CalendarIcon className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-destructive" />
                  )}
                  <div>
                    <div className="font-medium">{record.student.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{record.student.student_id}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium capitalize ${
                    record.status === "present" ? "text-primary" : 
                    record.status === "late" ? "text-yellow-500" : "text-destructive"
                  }`}>
                    {record.status}
                  </div>
                  {record.confidence && (
                    <div className="text-xs text-muted-foreground font-mono">
                      {record.confidence.toFixed(0)}% confidence
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : selectedClass && selectedDate ? (
        <div className="glass-panel p-12 text-center">
          <p className="text-muted-foreground">No attendance records for this class and date.</p>
        </div>
      ) : (
        <div className="glass-panel p-12 text-center">
          <p className="text-muted-foreground">Select a class and date to view attendance records.</p>
        </div>
      )}
    </div>
  );
}
