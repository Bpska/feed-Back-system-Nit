import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, LogOut, Loader2, Users, BookOpen, Star, TrendingUp, Eye, Download, Mail, ArrowLeft, Plus, Filter, Trash2, Edit, BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon, UserPlus, FileSpreadsheet, Search, Upload, Trash, Settings, Home } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { AddFacultyDialog } from "@/components/AddFacultyDialog";
import { EditFacultyDialog } from "@/components/EditFacultyDialog";
import { StudentsDialog } from "@/components/StudentsDialog";
import { AddStudentDialog } from "@/components/AddStudentDialog";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface FacultyWithRatings {
  id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  assignmentCount: number;
  ratingCount: number;
  averageRating: number;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [faculty, setFaculty] = useState<FacultyWithRatings[]>([]);
  const [allAssignments, setAllAssignments] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalFaculty: 0,
    totalRatings: 0,
    averageRating: 0,
    responseRate: 0
  });
  const [filters, setFilters] = useState(() => {
    const saved = sessionStorage.getItem("adminFilters");
    return saved ? JSON.parse(saved) : {
      semester: "all",
      section: "all",
      subject: "all",
      branch: "all",
      minRating: "0"
    };
  });
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyWithRatings | null>(null);
  const [showStudentsDialog, setShowStudentsDialog] = useState(false);
  const [showAddStudentDialog, setShowAddStudentDialog] = useState(false);
  const [availableSemesters, setAvailableSemesters] = useState<string[]>([]);
  const [availableSections, setAvailableSections] = useState<string[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState(() => {
    return sessionStorage.getItem("adminSearchQuery") || "";
  });
  const [currentPage, setCurrentPage] = useState(() => {
    const saved = sessionStorage.getItem("adminPage");
    return saved ? parseInt(saved) : 1;
  });
  const itemsPerPage = 10;
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [selectedFacultyIds, setSelectedFacultyIds] = useState<Set<string>>(new Set());
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(false);

  useEffect(() => {
    checkAdminAccess();
    loadDashboardData();
    loadSettings();
    // Realtime subscription removed for local API
  }, []);

  useEffect(() => {
    sessionStorage.setItem("adminFilters", JSON.stringify(filters));
  }, [filters]);

  useEffect(() => {
    sessionStorage.setItem("adminSearchQuery", searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    sessionStorage.setItem("adminPage", currentPage.toString());
  }, [currentPage]);

  const checkAdminAccess = async () => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        navigate("/admin-login");
        return;
      }

      const user = JSON.parse(userStr);
      // Backend login should have returned roles in user object
      const isAdmin = user.roles && user.roles.some((r: any) => r.role === "admin");

      if (!isAdmin) {
        // Fallback check via API if roles arguably not populated in local storage
        try {
          const profile = await api.get("/users/profile");
          // If this succeeds, check roles if available or assume valid user
          // But we need explicit admin check. 
          // The backend Login response is the source of truth for now.
          // If we are here, we trust the token scopes or we should have an /admin/me endpoint.
          // For now, relying on local storage roles or Profile fetch
        } catch (e) {
          navigate("/admin-login");
          return;
        }
      }

      setIsSuperAdmin(user.email === "bpskar2@gmail.com");
    } catch (error) {
      navigate("/admin-login");
    }
  };

  const loadDashboardData = async () => {
    try {
      // Load all faculty
      const facultyData = await api.get("/users/faculty");

      // Load all assignments
      const assignmentsData = await api.get("/ratings/assignments/all");
      setAllAssignments(assignmentsData || []);

      // Extract unique filter values
      const semesters = [...new Set(assignmentsData?.map((a: any) => a.semester.toString()).filter((s: string) => s && s.trim() !== '') || [])] as string[];
      const sections = [...new Set(assignmentsData?.map((a: any) => a.section).filter((s: string) => s && s.trim() !== '') || [])] as string[];
      const subjects = [...new Set(assignmentsData?.map((a: any) => a.subject).filter((s: string) => s && s.trim() !== '') || [])] as string[];

      setAvailableSemesters(semesters.sort());
      setAvailableSections(sections.sort());
      setAvailableSubjects(subjects.sort());

      // Load ratings
      const ratingsData = await api.get("/ratings/all");
      const ratingsCount = ratingsData.length;

      // Load students (using admin endpoint)
      const studentsData = await api.get("/admin/students-with-emails");
      const studentsCount = studentsData.length;

      // Calculate stats for each faculty
      const facultyWithRatings = facultyData.map((f: any) => {
        const assignments = assignmentsData?.filter((a: any) => (a.faculty?.id || a.faculty_id) === f.id) || [];
        const facultyRatings = ratingsData?.filter((r: any) => r.faculty.id === f.id) || []; // Attention: API relation structure might differ

        const avgRating = facultyRatings.length > 0
          ? facultyRatings.reduce((sum: number, r: any) => {
            return sum + (
              r.engagement_level +
              r.concept_understanding +
              r.content_depth +
              r.application_teaching +
              r.pedagogy_tools +
              r.communication_skills +
              r.class_decorum +
              r.teaching_aids
            ) / 8;
          }, 0) / facultyRatings.length
          : 0;

        return {
          ...f,
          assignmentCount: assignments.length,
          ratingCount: facultyRatings.length,
          averageRating: avgRating,
          branch: assignments[0]?.branch || "N/A" // Use first assignment branch as fallback
        };
      });

      setFaculty(facultyWithRatings);

      // Calculate overall stats
      const totalRatings = ratingsCount || 0;
      const overallAvg = facultyWithRatings.reduce((sum: number, f: any) => sum + f.averageRating, 0) / (facultyWithRatings.length || 1);

      setStats({
        totalStudents: studentsCount || 0,
        totalFaculty: facultyData.length,
        totalRatings,
        averageRating: overallAvg,
        responseRate: studentsCount ? (totalRatings / studentsCount) * 100 : 0
      });

    } catch (error: any) {
      console.error("Error loading dashboard:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/admin-login");
  };

  const handleExportExcel = async () => {
    try {
      // Prepare faculty data
      const facultyData = faculty.map(f => ({
        "Faculty Name": f.name,
        "Email": f.email,
        "Department": f.department,
        "Designation": f.designation || "N/A",
        "Assignments": f.assignmentCount,
        "Total Ratings": f.ratingCount,
        "Average Rating": f.averageRating.toFixed(2)
      }));

      // Fetch ratings data via API
      const ratingsData = await api.get("/ratings/all");

      const ratingsExport = ratingsData?.map((r: any) => ({
        "Student Name": r.student?.full_name || "N/A",
        "Registration Number": r.student?.registration_number || "N/A",
        "Engagement": r.engagement_level,
        "Concept Understanding": r.concept_understanding,
        "Content Depth": r.content_depth,
        "Application Teaching": r.application_teaching,
        "Pedagogy Tools": r.pedagogy_tools,
        "Communication Skills": r.communication_skills,
        "Class Decorum": r.class_decorum,
        "Teaching Aids": r.teaching_aids,
        "Feedback": r.feedback_message || "N/A",
        "Date": new Date(r.created_at).toLocaleDateString()
      })) || [];

      // Create workbook
      const wb = XLSX.utils.book_new();
      const ws1 = XLSX.utils.json_to_sheet(facultyData);
      const ws2 = XLSX.utils.json_to_sheet(ratingsExport);

      XLSX.utils.book_append_sheet(wb, ws1, "Faculty Summary");
      XLSX.utils.book_append_sheet(wb, ws2, "Student Ratings");

      XLSX.writeFile(wb, "faculty-performance-report.xlsx");
      toast.success("Excel report exported successfully!");
    } catch (error: any) {
      console.error("Error exporting Excel:", error);
      toast.error("Failed to export Excel report");
    }
  };

  const handleExportPDF = async () => {
    try {
      const doc = new jsPDF();

      // Title
      doc.setFontSize(18);
      doc.text("Faculty Performance Report", 14, 20);
      doc.setFontSize(11);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);

      // Faculty summary table
      const facultyTableData = faculty.map(f => [
        f.name,
        f.department,
        f.assignmentCount.toString(),
        f.ratingCount.toString(),
        f.averageRating.toFixed(2)
      ]);

      autoTable(doc, {
        head: [["Faculty Name", "Department", "Assignments", "Ratings", "Avg Rating"]],
        body: facultyTableData,
        startY: 35,
        theme: 'grid',
        styles: { fontSize: 9 }
      });

      doc.save("faculty-performance-report.pdf");
      toast.success("PDF report exported successfully!");
    } catch (error: any) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to export PDF report");
    }
  };

  const handleExportBelow4Excel = async () => {
    try {
      // Filter faculty with ratings below 4.0 (and with at least 1 rating)
      const below4Faculty = faculty.filter(f => f.averageRating > 0 && f.averageRating < 4);

      if (below4Faculty.length === 0) {
        toast.info("No faculty found with ratings below 4.0");
        return;
      }

      // Fetch all ratings
      const ratingsData = await api.get("/ratings/all");

      const detailedData: any[] = [];

      below4Faculty.forEach(f => {
        // Get ratings for this faculty
        const facultyRatings = ratingsData?.filter((r: any) => r.faculty?.id === f.id) || [];

        facultyRatings.forEach((r: any) => {
          const avgScore = (
            r.engagement_level +
            r.concept_understanding +
            r.content_depth +
            r.application_teaching +
            r.pedagogy_tools +
            r.communication_skills +
            r.class_decorum +
            r.teaching_aids
          ) / 8;

          detailedData.push({
            "Faculty Name": f.name,
            "Department": f.department,
            "Faculty Avg Rating": f.averageRating.toFixed(2),
            "Student Name": r.student?.full_name || "N/A",
            "Reg Number": r.student?.registration_number || "N/A",
            "Subject": r.assignment?.subject || "N/A",
            "Branch": r.assignment?.branch || "N/A",
            "Semester": r.assignment?.semester || "N/A",
            "Section": r.assignment?.section || "N/A",
            "Year": r.assignment?.year || "N/A",
            "Rating Score": avgScore.toFixed(2),
            "Engagement": r.engagement_level,
            "Concept Understanding": r.concept_understanding,
            "Content Depth": r.content_depth,
            "Application Teaching": r.application_teaching,
            "Pedagogy Tools": r.pedagogy_tools,
            "Communication Skills": r.communication_skills,
            "Class Decorum": r.class_decorum,
            "Teaching Aids": r.teaching_aids,
            "Feedback/Comments": r.feedback_message || "No comment",
            "Date": new Date(r.created_at).toLocaleDateString()
          });
        });
      });

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Faculty summary sheet
      const summaryData = below4Faculty.map(f => ({
        "Faculty Name": f.name,
        "Email": f.email,
        "Department": f.department,
        "Designation": f.designation || "N/A",
        "Average Rating": f.averageRating.toFixed(2),
        "Total Ratings": f.ratingCount
      }));
      const ws1 = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, ws1, "Below 4.0 Faculty Summary");

      // Detailed ratings sheet
      const ws2 = XLSX.utils.json_to_sheet(detailedData);
      XLSX.utils.book_append_sheet(wb, ws2, "Detailed Ratings");

      XLSX.writeFile(wb, "below-4-faculty-detailed-report.xlsx");
      toast.success("Below 4.0 detailed Excel report exported!");
    } catch (error: any) {
      console.error("Error exporting Below 4.0 Excel:", error);
      toast.error("Failed to export report");
    }
  };

  const handleExportBelow4PDF = async () => {
    try {
      // Filter faculty with ratings below 4.0 (and with at least 1 rating)
      const below4Faculty = faculty.filter(f => f.averageRating > 0 && f.averageRating < 4);

      if (below4Faculty.length === 0) {
        toast.info("No faculty found with ratings below 4.0");
        return;
      }

      // Fetch all ratings
      const ratingsData = await api.get("/ratings/all");

      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("Below 4.0 Faculty - Detailed Report", 14, 20);
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);
      doc.text(`Total Faculty Below 4.0: ${below4Faculty.length}`, 14, 34);

      let yPos = 45;

      below4Faculty.forEach((f, idx) => {
        // Get ratings for this faculty
        const facultyRatings = ratingsData?.filter((r: any) => r.faculty?.id === f.id) || [];

        // Check if we need a new page
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        // Faculty header
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(`${idx + 1}. ${f.name}`, 14, yPos);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(`Dept: ${f.department} | Avg Rating: ${f.averageRating.toFixed(2)} | Total Ratings: ${f.ratingCount}`, 14, yPos + 5);
        yPos += 12;

        // Ratings table for this faculty
        if (facultyRatings.length > 0) {
          const tableData = facultyRatings.map((r: any) => {
            const avgScore = (
              r.engagement_level +
              r.concept_understanding +
              r.content_depth +
              r.application_teaching +
              r.pedagogy_tools +
              r.communication_skills +
              r.class_decorum +
              r.teaching_aids
            ) / 8;
            return [
              r.student?.full_name || "N/A",
              `Sem ${r.assignment?.semester || "-"}, Sec ${r.assignment?.section || "-"}`,
              r.assignment?.branch || "N/A",
              avgScore.toFixed(1),
              (r.feedback_message || "No comment").substring(0, 40) + (r.feedback_message?.length > 40 ? "..." : "")
            ];
          });

          autoTable(doc, {
            head: [["Student", "Sem/Sec", "Branch", "Score", "Feedback"]],
            body: tableData,
            startY: yPos,
            theme: 'striped',
            styles: { fontSize: 7, cellPadding: 1 },
            headStyles: { fillColor: [100, 100, 100] },
            margin: { left: 14, right: 14 }
          });

          yPos = (doc as any).lastAutoTable.finalY + 10;
        } else {
          doc.text("  No individual ratings found.", 14, yPos);
          yPos += 8;
        }
      });

      doc.save("below-4-faculty-detailed-report.pdf");
      toast.success("Below 4.0 detailed PDF report exported!");
    } catch (error: any) {
      console.error("Error exporting Below 4.0 PDF:", error);
      toast.error("Failed to export report");
    }
  };

  const handleSendEmail = async (facultyMember: FacultyWithRatings) => {
    navigate(`/admin/faculty/${facultyMember.id}/send-email`);
  };

  const handleDeleteFaculty = async (facultyId: string) => {
    if (!confirm("Are you sure you want to delete this faculty member? This will also delete all their assignments and ratings.")) {
      return;
    }

    try {
      await api.delete(`/users/faculty/${facultyId}`);
      toast.success("Faculty member deleted successfully");
      loadDashboardData();
    } catch (error: any) {
      console.error("Error deleting faculty:", error);
      toast.error("Failed to delete faculty member");
    }
  };

  const handleDeleteAllRatings = async (facultyId: string) => {
    if (!confirm("Are you sure you want to delete ALL ratings for this faculty member? This action cannot be undone.")) {
      return;
    }

    try {
      await api.delete(`/ratings/faculty/${facultyId}/all`);
      toast.success("All ratings for this faculty member deleted successfully");
      loadDashboardData();
    } catch (error: any) {
      console.error("Error deleting all ratings:", error);
      toast.error("Failed to delete all ratings");
    }
  };

  const handleBulkDeleteFaculty = async () => {
    if (selectedFacultyIds.size === 0) {
      toast.error("Please select faculty members to delete");
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedFacultyIds.size} faculty member(s)? This will also delete all their assignments and ratings.`)) {
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const facultyId of selectedFacultyIds) {
      try {
        await api.delete(`/users/faculty/${facultyId}`);
        successCount++;
      } catch (error) {
        failCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`Successfully deleted ${successCount} faculty member(s)`);
    }
    if (failCount > 0) {
      toast.error(`Failed to delete ${failCount} faculty member(s)`);
    }

    setSelectedFacultyIds(new Set());
    loadDashboardData();
  };

  const toggleSelectAllFaculty = () => {
    if (selectedFacultyIds.size === paginatedFaculty.length) {
      setSelectedFacultyIds(new Set());
    } else {
      setSelectedFacultyIds(new Set(paginatedFaculty.map(f => f.id)));
    }
  };

  const toggleSelectFaculty = (facultyId: string) => {
    const newSelected = new Set(selectedFacultyIds);
    if (newSelected.has(facultyId)) {
      newSelected.delete(facultyId);
    } else {
      newSelected.add(facultyId);
    }
    setSelectedFacultyIds(newSelected);
  };

  const loadSettings = async () => {
    try {
      // API call placeholder for settings
      // const settings = await api.get("/admin/settings");
      // setRegistrationEnabled(settings.registration_enabled);
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const toggleRegistration = async (enabled: boolean) => {
    setLoadingSettings(true);
    try {
      // Placeholder for settings update
      // await api.put("/admin/settings", { data: { registration_enabled: enabled } });
      setRegistrationEnabled(enabled);
      toast.success(`Student registration ${enabled ? "enabled" : "disabled"}`);
    } catch (error: any) {
      console.error("Error updating settings:", error);
      toast.error("Failed to update settings");
    } finally {
      setLoadingSettings(false);
    }
  };

  const handleBulkImport = async () => {
    if (!confirm("This will import 3 students from the Excel file (Demo). Continue?")) {
      return;
    }

    try {
      setLoading(true);
      // Dummy import for now as file upload backend/frontend not fully set up
      toast.info("Bulk import demo - Backend implementation requires file upload");

      loadDashboardData();
    } catch (error: any) {
      console.error("Error importing students:", error);
      toast.error(error.message || "Failed to import students");
    } finally {
      setLoading(false);
    }
  };

  // Filter faculty based on selected filters and search query
  const filteredFaculty = faculty.filter(f => {
    const facultyAssignments = allAssignments.filter(a => (a.faculty?.id || a.faculty_id) === f.id);

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        f.name.toLowerCase().includes(query) ||
        f.email.toLowerCase().includes(query) ||
        f.department.toLowerCase().includes(query) ||
        (f.designation && f.designation.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }

    if (filters.semester !== "all") {
      const hasSemester = facultyAssignments.some(a => a.semester.toString() === filters.semester);
      if (!hasSemester) return false;
    }

    if (filters.section !== "all") {
      const hasSection = facultyAssignments.some(a => a.section === filters.section);
      if (!hasSection) return false;
    }

    if (filters.subject !== "all") {
      const hasSubject = facultyAssignments.some(a => a.subject === filters.subject);
      if (!hasSubject) return false;
    }

    if (filters.branch !== "all") {
      const hasBranch = facultyAssignments.some(a => a.branch === filters.branch);
      if (!hasBranch) return false;
    }

    if (filters.minRating === "below4") {
      if (f.averageRating >= 4 || f.averageRating === 0) return false;
    } else if (filters.minRating !== "0") {
      if (f.averageRating < parseFloat(filters.minRating)) return false;
    }

    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredFaculty.length / itemsPerPage);
  const paginatedFaculty = filteredFaculty.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Prepare chart data
  const facultyPerformanceData = filteredFaculty.slice(0, 4).map(f => ({
    name: f.name.split(' ')[0] + ' ' + f.name.split(' ')[1]?.charAt(0) || '',
    Overall: f.averageRating,
    Engagement: f.ratingCount > 0 ? 4 : 0,
    Communication: f.ratingCount > 0 ? 4 : 0,
    Pedagogy: f.ratingCount > 0 ? 4 : 0
  }));

  const performanceDistributionData = [
    { name: 'Excellent (4-5)', value: filteredFaculty.filter(f => f.averageRating >= 4).length },
    { name: 'Good (3-4)', value: filteredFaculty.filter(f => f.averageRating >= 3 && f.averageRating < 4).length },
    { name: 'Average (2-3)', value: filteredFaculty.filter(f => f.averageRating >= 2 && f.averageRating < 3).length },
    { name: 'Needs Improvement (<2)', value: filteredFaculty.filter(f => f.averageRating > 0 && f.averageRating < 2).length }
  ];

  const departmentData = [...new Set(filteredFaculty.map(f => f.department))].map(dept => ({
    name: dept,
    average: filteredFaculty
      .filter(f => f.department === dept)
      .reduce((sum, f) => sum + f.averageRating, 0) /
      filteredFaculty.filter(f => f.department === dept).length || 0
  }));

  const monthlyTrendsData = [
    { month: 'Jan', ratings: 25, participation: 40 },
    { month: 'Feb', ratings: 32, participation: 45 },
    { month: 'Mar', ratings: 28, participation: 42 },
    { month: 'Apr', ratings: 35, participation: 48 },
    { month: 'May', ratings: 42, participation: 50 },
    { month: 'Jun', ratings: 38, participation: 46 }
  ];

  const chartColors = ["hsl(221, 83%, 53%)", "hsl(142, 76%, 36%)", "hsl(36, 95%, 55%)", "hsl(346, 77%, 49%)"];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <header className="bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold">Faculty Performance Analytics Dashboard</h1>
                <p className="text-sm text-muted-foreground">Real-time Faculty Rating System - 2025</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => navigate("/")} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Home
              </Button>
              <Button onClick={() => setShowAddDialog(true)} variant="default">
                <Plus className="mr-2 h-4 w-4" />
                Add Faculty
              </Button>
              {isSuperAdmin && (
                <>
                  <Button onClick={() => setShowAddStudentDialog(true)} variant="default">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Student
                  </Button>
                  <Button onClick={handleBulkImport} variant="secondary">
                    <Upload className="mr-2 h-4 w-4" />
                    Import Excel Data
                  </Button>
                  <Button onClick={handleExportExcel} variant="outline">
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Export Excel
                  </Button>
                  <Button onClick={handleExportPDF} variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export PDF
                  </Button>
                  <Button onClick={handleExportBelow4Excel} variant="outline" className="border-orange-500 text-orange-500 hover:bg-orange-500/10">
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Below 4★ Excel
                  </Button>
                  <Button onClick={handleExportBelow4PDF} variant="outline" className="border-orange-500 text-orange-500 hover:bg-orange-500/10">
                    <Download className="mr-2 h-4 w-4" />
                    Below 4★ PDF
                  </Button>
                </>
              )}
              <ThemeToggle />
              <Button onClick={handleLogout} variant="outline">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Registration Toggle Card */}
        <Card className="p-4 mb-6 card-elegant">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-semibold">Student Registration</h3>
                <p className="text-sm text-muted-foreground">
                  Control whether students can register on the home page
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">
                {registrationEnabled ? "Enabled" : "Disabled"}
              </span>
              <Switch
                checked={registrationEnabled}
                onCheckedChange={toggleRegistration}
                disabled={loadingSettings}
              />
            </div>
          </div>
        </Card>

        {/* Hostel Ratings Button */}
        <Card className="p-4 mb-6 card-elegant">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Home className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-semibold">Hostel Ratings</h3>
                <p className="text-sm text-muted-foreground">
                  View hostel feedback from students
                </p>
              </div>
            </div>
            <Button onClick={() => navigate("/admin/hostel-ratings")} variant="outline">
              <Eye className="mr-2 h-4 w-4" />
              View Hostel Ratings
            </Button>
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card
            className="p-6 card-elegant cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setShowStudentsDialog(true)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-3xl font-bold text-primary">{stats.totalStudents}</p>
                <p className="text-xs text-muted-foreground mt-1">Click to view details</p>
              </div>
              <Users className="h-10 w-10 text-primary/20" />
            </div>
          </Card>

          <Card className="p-6 card-elegant">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Faculty</p>
                <p className="text-3xl font-bold text-primary">{stats.totalFaculty}</p>
                <p className="text-xs text-muted-foreground mt-1">Registered faculty</p>
              </div>
              <BookOpen className="h-10 w-10 text-primary/20" />
            </div>
          </Card>

          <Card className="p-6 card-elegant">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Ratings</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.totalRatings}</p>
                <p className="text-xs text-muted-foreground mt-1">Faculty ratings submitted</p>
              </div>
              <Star className="h-10 w-10 text-yellow-600/20" />
            </div>
          </Card>

          <Card className="p-6 card-elegant">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Rating</p>
                <p className="text-3xl font-bold">{stats.averageRating.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground mt-1">Out of 5.0</p>
              </div>
              <TrendingUp className="h-10 w-10 text-green-600/20" />
            </div>
          </Card>

          <Card className="p-6 card-elegant">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Response Rate</p>
                <p className="text-3xl font-bold text-blue-600">{stats.responseRate.toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground mt-1">Student participation</p>
              </div>
              <Eye className="h-10 w-10 text-blue-600/20" />
            </div>
          </Card>
        </div>

        {/* Filter Section */}
        <Card className="p-6 card-elegant">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold gradient-text">Filter Faculty Data</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Filter faculty by semester, section, and subject to view specific performance data
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Semester</Label>
              <Select value={filters.semester} onValueChange={(value) => setFilters({ ...filters, semester: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Semesters" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  {availableSemesters.map(sem => (
                    <SelectItem key={sem} value={sem}>Semester {sem}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Section</Label>
              <Select value={filters.section} onValueChange={(value) => setFilters({ ...filters, section: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Sections" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  {availableSections.map(sec => (
                    <SelectItem key={sec} value={sec}>Section {sec}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Subject</Label>
              <Select value={filters.subject} onValueChange={(value) => setFilters({ ...filters, subject: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {availableSubjects.map(subj => (
                    <SelectItem key={subj} value={subj}>{subj}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Branch</Label>
              <Select value={filters.branch} onValueChange={(value) => setFilters({ ...filters, branch: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  <SelectItem value="CSE">CSE</SelectItem>
                  <SelectItem value="ME">ME</SelectItem>
                  <SelectItem value="EE">EE</SelectItem>
                  <SelectItem value="CIVIL">CIVIL</SelectItem>
                  <SelectItem value="BCA">BCA</SelectItem>
                  <SelectItem value="MCA">MCA</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Minimum Rating</Label>
              <Select value={filters.minRating} onValueChange={(value) => setFilters({ ...filters, minRating: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Ratings" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All Ratings</SelectItem>
                  <SelectItem value="below4">Below 4.0 ★</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Faculty Performance Comparison */}
          <Card className="p-6 card-elegant">
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Faculty Performance Comparison
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Sample faculty performance data {filteredFaculty.length === 0 && "(no data available yet)"}
            </p>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={facultyPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Overall" fill={chartColors[0]} />
                <Bar dataKey="Engagement" fill={chartColors[1]} />
                <Bar dataKey="Communication" fill={chartColors[2]} />
                <Bar dataKey="Pedagogy" fill={chartColors[3]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Performance Distribution */}
          <Card className="p-6 card-elegant">
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-primary" />
              Performance Distribution
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Sample performance distribution {performanceDistributionData.every(d => d.value === 0) && "(no data available yet)"}
            </p>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={performanceDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => percent > 0 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''}
                >
                  {performanceDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Department Performance */}
          <Card className="p-6 card-elegant">
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Department Performance
            </h3>
            <p className="text-sm text-muted-foreground mb-4">Average performance by department</p>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Bar dataKey="average" fill={chartColors[0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Monthly Trends */}
          <Card className="p-6 card-elegant">
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
              <LineChartIcon className="h-5 w-5 text-primary" />
              Monthly Trends
            </h3>
            <p className="text-sm text-muted-foreground mb-4">Ratings and participation over time</p>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyTrendsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="ratings" stroke={chartColors[1]} strokeWidth={2} />
                <Line type="monotone" dataKey="participation" stroke={chartColors[0]} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Faculty List */}
        <Card className="p-6 card-elegant">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold gradient-text mb-2">Faculty Performance Data</h2>
              <p className="text-sm text-muted-foreground">
                Real-time faculty performance data
                {filters.semester !== "all" || filters.section !== "all" || filters.subject !== "all"
                  ? ` (Filtered: ${filteredFaculty.length} of ${faculty.length} faculty)`
                  : `(${faculty.length} total faculty)`}
              </p>
            </div>

            <div className="flex gap-2 items-center">
              {selectedFacultyIds.size > 0 && (
                <Button
                  variant="destructive"
                  onClick={handleBulkDeleteFaculty}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Delete ({selectedFacultyIds.size})
                </Button>
              )}
              <div className="w-72">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, department..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">
                    <Checkbox
                      checked={selectedFacultyIds.size === paginatedFaculty.length && paginatedFaculty.length > 0}
                      onCheckedChange={toggleSelectAllFaculty}
                    />
                  </th>
                  <th className="text-left py-3 px-4">Faculty</th>
                  <th className="text-left py-3 px-4">Overall Rating</th>
                  <th className="text-left py-3 px-4">Total Ratings</th>
                  <th className="text-left py-3 px-4">Assignments</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedFaculty.length > 0 ? (
                  paginatedFaculty.map((f) => (
                    <tr key={f.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-4 px-4">
                        <Checkbox
                          checked={selectedFacultyIds.has(f.id)}
                          onCheckedChange={() => toggleSelectFaculty(f.id)}
                        />
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-semibold">{f.name}</p>
                          <p className="text-sm text-muted-foreground">{f.designation || f.department}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {f.ratingCount > 0 ? (
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            <span className="font-semibold">{f.averageRating.toFixed(1)}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No ratings yet</span>
                        )}
                      </td>
                      <td className="py-4 px-4">{f.ratingCount}</td>
                      <td className="py-4 px-4">{f.assignmentCount} assignments</td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${f.ratingCount === 0
                          ? "bg-muted text-muted-foreground"
                          : f.averageRating >= 4
                            ? "bg-green-100 text-green-700"
                            : f.averageRating >= 3
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}>
                          {f.ratingCount === 0 ? "Not Rated" : f.averageRating >= 4 ? "Excellent" : f.averageRating >= 3 ? "Good" : "Needs Improvement"}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/admin/faculty/${f.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedFaculty(f);
                              setShowEditDialog(true);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendEmail(f)}
                          >
                            <Mail className="h-4 w-4 mr-1" />
                            Send Report
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteFaculty(f.id)}
                            title="Delete Faculty"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="bg-red-800 hover:bg-red-900"
                            onClick={() => handleDeleteAllRatings(f.id)}
                            title="Delete All Ratings"
                          >
                            <Trash className="h-4 w-4 mr-1" />
                            Purge Ratings
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      No faculty found matching your criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </Card>
      </main>

      <AddFacultyDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={loadDashboardData}
      />
      {selectedFaculty && (
        <EditFacultyDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onSuccess={loadDashboardData}
          facultyId={selectedFaculty.id}
          facultyData={{
            name: selectedFaculty.name,
            email: selectedFaculty.email,
            department: selectedFaculty.department,
            designation: selectedFaculty.designation
          }}
        />
      )}
      <StudentsDialog
        open={showStudentsDialog}
        onOpenChange={setShowStudentsDialog}
      />
      <AddStudentDialog
        open={showAddStudentDialog}
        onOpenChange={setShowAddStudentDialog}
        onSuccess={loadDashboardData}
      />
    </div>
  );
}
