import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Loader2, Users, UserX, Star, MessageSquare, CalendarIcon, X, Trash2, Filter } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2 } from "lucide-react";

interface HostelRatingWithStudent {
  id: string;
  student_id: string;
  accommodation_rooms: number;
  washrooms_hygiene: number;
  mess_food_quality: number;
  safety_security: number;
  hostel_staff_behaviour: number;
  maintenance_facilities: number;
  wifi_connectivity: number;
  discipline_rules: number;
  medical_facilities: number;
  overall_living_experience: number;
  feedback_message: string | null;
  created_at: string;
  student_name: string;
  registration_number: string;
  branch: string;
}

interface StudentWithoutRating {
  id: string;
  full_name: string;
  registration_number: string;
  branch: string;
  section: string;
}

export default function HostelRatings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState<HostelRatingWithStudent[]>([]);
  const [studentsWithoutRatings, setStudentsWithoutRatings] = useState<StudentWithoutRating[]>([]);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [filters, setFilters] = useState(() => {
    const saved = sessionStorage.getItem("hostelFilters");
    return saved ? JSON.parse(saved) : { branch: "all", minRating: "0" };
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    checkAdminAndLoadData();
  }, []);

  useEffect(() => {
    sessionStorage.setItem("hostelFilters", JSON.stringify(filters));
  }, [filters]);

  const checkAdminAndLoadData = async () => {
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
        // Fallback verification
        try {
          // If profile endpoint works, user is authenticated, but for admin portal
          // we strictly need admin role.
          navigate("/student-login");
          return;
        } catch {
          navigate("/admin-login");
          return;
        }
      }

      await loadData();
    } catch (error) {
      navigate("/admin-login");
    }
  };

  const handleDeleteRating = async (ratingId: string) => {
    if (!confirm("Are you sure you want to delete this hostel rating?")) {
      return;
    }

    try {
      await api.delete(`/ratings/hostel/${ratingId}`);
      toast.success("Rating deleted successfully");
      loadData();
    } catch (error: any) {
      console.error("Error deleting rating:", error);
      toast.error("Failed to delete rating");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected ratings?`)) return;

    setDeleting(true);
    try {
      await api.delete("/ratings/hostel/bulk", { data: { ids: selectedIds } });
      toast.success(`${selectedIds.length} ratings deleted successfully`);
      setSelectedIds([]);
      loadData();
    } catch (error: any) {
      console.error("Error bulk deleting:", error);
      toast.error("Failed to delete selected ratings");
    } finally {
      setDeleting(false);
    }
  };

  const loadData = async () => {
    try {
      // Load all hostel ratings (includes student profiles now)
      const ratingsData = await api.get("/ratings/hostel/all");

      // Load all students (for "not rated" calculation)
      // Needs admin endpoint for all students
      const studentsData = await api.get("/admin/students-with-emails");

      // Match ratings with student info
      // ratingsData already has student.profile (via relations)
      const ratingsWithStudents: HostelRatingWithStudent[] = (ratingsData || []).map((rating: any) => {
        // rating.student is User, rating.student.profile is Profile
        const profile = rating.student?.profile;
        if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
          // console.log("Rating:", rating);
        }

        return {
          ...rating,
          student_name: profile?.full_name || "Unknown",
          registration_number: profile?.registration_number || "N/A",
          branch: profile?.branch || "N/A"
        };
      });

      setRatings(ratingsWithStudents);

      // Find students without ratings
      const ratedStudentIds = new Set(ratingsData?.map((r: any) => r.student?.id) || []);
      const withoutRatings = (studentsData || []).filter((s: any) => !ratedStudentIds.has(s.id));

      // Map student data format if needed (admin endpoint returns user/profile objects)
      // Assuming admin/students-with-emails returns array of { id, email, ...? } 
      // Actually AdminService.getStudentsWithEmails returns profiles join user. 
      // Let's assume it returns adequate data or we map what we have.
      // AdminService: return this.profileRepository.find({ relations: ['user'] });
      // So it returns Profile[] with user relation.

      const mappedStudentsWithoutRatings = withoutRatings.map((s: any) => ({
        id: s.user?.id || s.id, // Profile ID or User ID? r.student_id is User ID.
        // In Rating entity, student_id is User ID.
        // In Profile entity, user_id is User ID.
        // Profiles fetched via admin service are Profile objects. 
        // So s.user.id is the User ID we need to compare with rating.student.id.
        full_name: s.full_name,
        registration_number: s.registration_number,
        branch: s.branch,
        section: s.section
      }));

      // Wait, ratedStudentIds are UserIDs (rating.student.id).
      // withoutRatings are Profile objects. s.user.id should be used.
      // I need to filter properly.

      const ratedUserIds = new Set(ratingsData?.map((r: any) => r.student?.id) || []);
      const studentsWithoutRatingsFiltered = (studentsData || []).filter((s: any) => !ratedUserIds.has(s.user?.id));

      setStudentsWithoutRatings(studentsWithoutRatingsFiltered.map((s: any) => ({
        id: s.user?.id,
        full_name: s.full_name,
        registration_number: s.registration_number,
        branch: s.branch,
        section: s.section
      })));

    } catch (error: any) {
      console.error("Error loading data:", error);
      toast.error("Failed to load hostel ratings data");
    } finally {
      setLoading(false);
    }
  };

  // Filter ratings by date range
  const filteredRatings = useMemo(() => {
    return ratings.filter(rating => {
      const ratingDate = new Date(rating.created_at);
      if (startDate && ratingDate < startDate) return false;
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (ratingDate > endOfDay) return false;
      }

      if (filters.branch !== "all" && rating.branch !== filters.branch) return false;
      if (filters.minRating !== "0" && rating.overall_living_experience < parseFloat(filters.minRating)) return false;

      return true;
    });
  }, [ratings, startDate, endDate]);

  // Calculate average ratings based on filtered data
  const averageRatings = useMemo(() => {
    if (filteredRatings.length === 0) return {};

    const avgRatings: Record<string, number> = {
      accommodation_rooms: 0,
      washrooms_hygiene: 0,
      mess_food_quality: 0,
      safety_security: 0,
      hostel_staff_behaviour: 0,
      maintenance_facilities: 0,
      wifi_connectivity: 0,
      discipline_rules: 0,
      medical_facilities: 0,
      overall_living_experience: 0,
    };

    filteredRatings.forEach(r => {
      avgRatings.accommodation_rooms += r.accommodation_rooms;
      avgRatings.washrooms_hygiene += r.washrooms_hygiene;
      avgRatings.mess_food_quality += r.mess_food_quality;
      avgRatings.safety_security += r.safety_security;
      avgRatings.hostel_staff_behaviour += r.hostel_staff_behaviour;
      avgRatings.maintenance_facilities += r.maintenance_facilities;
      avgRatings.wifi_connectivity += r.wifi_connectivity;
      avgRatings.discipline_rules += r.discipline_rules;
      avgRatings.medical_facilities += r.medical_facilities;
      avgRatings.overall_living_experience += r.overall_living_experience;
    });

    Object.keys(avgRatings).forEach(key => {
      avgRatings[key] = avgRatings[key] / filteredRatings.length;
    });

    return avgRatings;
  }, [filteredRatings]);

  const clearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setFilters({ branch: "all", minRating: "0" });
  };

  const criteriaLabels: Record<string, string> = {
    accommodation_rooms: "Accommodation & Rooms",
    washrooms_hygiene: "Washrooms & Hygiene",
    mess_food_quality: "Mess & Food Quality",
    safety_security: "Safety & Security",
    hostel_staff_behaviour: "Hostel Staff Behaviour",
    maintenance_facilities: "Maintenance & Facilities",
    wifi_connectivity: "Wi-Fi & Connectivity",
    discipline_rules: "Discipline & Rules",
    medical_facilities: "Medical Facilities",
    overall_living_experience: "Overall Living Experience",
  };

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
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Star className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold">Hostel Ratings</h1>
              <p className="text-sm text-muted-foreground">View all hostel feedback</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/admin")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Date Filter */}
          <Card className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Filter by Date:</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-[180px] justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus className="pointer-events-auto" />
                  </PopoverContent>
                </Popover>
                <span className="text-muted-foreground">to</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-[180px] justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "End date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus className="pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              {(startDate || endDate) && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear Filter
                </Button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-4 border-t mt-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Additional Filters:</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Branch:</Label>
                  <Select value={filters.branch} onValueChange={(value) => setFilters({ ...filters, branch: value })}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="CSE">CSE</SelectItem>
                      <SelectItem value="ME">ME</SelectItem>
                      <SelectItem value="EE">EE</SelectItem>
                      <SelectItem value="CIVIL">CIVIL</SelectItem>
                      <SelectItem value="BCA">BCA</SelectItem>
                      <SelectItem value="MCA">MCA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Label className="text-sm">Min Rating:</Label>
                  <Select value={filters.minRating} onValueChange={(value) => setFilters({ ...filters, minRating: value })}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">All</SelectItem>
                      <SelectItem value="4.5">4.5+ ★</SelectItem>
                      <SelectItem value="4">4.0+ ★</SelectItem>
                      <SelectItem value="3.5">3.5+ ★</SelectItem>
                      <SelectItem value="3">3.0+ ★</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {selectedIds.length > 0 && (
              <div className="flex items-center justify-between pt-4 border-t mt-4 bg-destructive/5 p-3 rounded-lg animate-in fade-in slide-in-from-top-2">
                <span className="text-sm font-medium text-destructive">
                  {selectedIds.length} items selected
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={deleting}
                >
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                  Delete Selected
                </Button>
              </div>
            )}
          </Card>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Students Rated</p>
                  <p className="text-2xl font-bold">{filteredRatings.length}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <UserX className="h-8 w-8 text-destructive" />
                <div>
                  <p className="text-sm text-muted-foreground">Not Rated Yet</p>
                  <p className="text-2xl font-bold">{studentsWithoutRatings.length}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Star className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Overall Average</p>
                  <p className="text-2xl font-bold">
                    {averageRatings.overall_living_experience?.toFixed(1) || "N/A"}/5
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Average Ratings by Criteria */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Average Ratings by Criteria</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
              {Object.entries(criteriaLabels).map(([key, label]) => (
                <div key={key} className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">{label}</p>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-bold">
                      {averageRatings[key]?.toFixed(1) || "N/A"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Tabs defaultValue="ratings" className="w-full">
            <TabsList>
              <TabsTrigger value="ratings">
                <Users className="h-4 w-4 mr-2" />
                Students Who Rated ({filteredRatings.length})
              </TabsTrigger>
              <TabsTrigger value="not-rated">
                <UserX className="h-4 w-4 mr-2" />
                Not Rated ({studentsWithoutRatings.length})
              </TabsTrigger>
              <TabsTrigger value="messages">
                <MessageSquare className="h-4 w-4 mr-2" />
                Feedback Messages
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ratings">
              <Card className="p-4">
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">
                          <Checkbox
                            checked={selectedIds.length === filteredRatings.length && filteredRatings.length > 0}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedIds(filteredRatings.map(r => r.id));
                              } else {
                                setSelectedIds([]);
                              }
                            }}
                          />
                        </TableHead>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Reg. No.</TableHead>
                        <TableHead>Accommodation</TableHead>
                        <TableHead>Washrooms</TableHead>
                        <TableHead>Food</TableHead>
                        <TableHead>Security</TableHead>
                        <TableHead>Staff</TableHead>
                        <TableHead>Maintenance</TableHead>
                        <TableHead>Wi-Fi</TableHead>
                        <TableHead>Discipline</TableHead>
                        <TableHead>Medical</TableHead>
                        <TableHead>Overall</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRatings.map((rating) => (
                        <TableRow key={rating.id} className={cn(selectedIds.includes(rating.id) && "bg-muted/50")}>
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.includes(rating.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedIds([...selectedIds, rating.id]);
                                } else {
                                  setSelectedIds(selectedIds.filter(id => id !== rating.id));
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{rating.student_name}</TableCell>
                          <TableCell>{rating.registration_number}</TableCell>
                          <TableCell>{rating.accommodation_rooms}</TableCell>
                          <TableCell>{rating.washrooms_hygiene}</TableCell>
                          <TableCell>{rating.mess_food_quality}</TableCell>
                          <TableCell>{rating.safety_security}</TableCell>
                          <TableCell>{rating.hostel_staff_behaviour}</TableCell>
                          <TableCell>{rating.maintenance_facilities}</TableCell>
                          <TableCell>{rating.wifi_connectivity}</TableCell>
                          <TableCell>{rating.discipline_rules}</TableCell>
                          <TableCell>{rating.medical_facilities}</TableCell>
                          <TableCell className="font-bold">{rating.overall_living_experience}</TableCell>
                          <TableCell>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteRating(rating.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredRatings.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={14} className="text-center text-muted-foreground">
                            No hostel ratings submitted yet
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </Card>
            </TabsContent>

            <TabsContent value="not-rated">
              <Card className="p-4">
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Registration Number</TableHead>
                        <TableHead>Branch</TableHead>
                        <TableHead>Section</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentsWithoutRatings.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.full_name}</TableCell>
                          <TableCell>{student.registration_number}</TableCell>
                          <TableCell>{student.branch}</TableCell>
                          <TableCell>{student.section}</TableCell>
                        </TableRow>
                      ))}
                      {studentsWithoutRatings.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground">
                            All students have submitted hostel ratings
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </Card>
            </TabsContent>

            <TabsContent value="messages">
              <Card className="p-4">
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    {filteredRatings
                      .filter(r => r.feedback_message)
                      .map((rating) => (
                        <Card key={rating.id} className="p-4 bg-muted/30">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-semibold">{rating.student_name}</p>
                              <p className="text-sm text-muted-foreground">
                                Reg. No: {rating.registration_number}
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {new Date(rating.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <p className="text-sm mt-2 bg-background p-3 rounded-md">
                            "{rating.feedback_message}"
                          </p>
                        </Card>
                      ))}
                    {filteredRatings.filter(r => r.feedback_message).length === 0 && (
                      <div className="text-center text-muted-foreground py-8">
                        No feedback messages submitted yet
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
