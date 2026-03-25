import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { GraduationCap, Loader2, Shield, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function StudentLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Sign in with email and password
      const response = await api.post("/auth/login", {
        data: {
          email,
          password
        }
      });

      if (response.user) {
        // Verify registration number matches the user's profile
        const profileData = response.user.profile;

        if (!profileData) {
          localStorage.removeItem("token");
          toast.error("Profile not found");
          setLoading(false);
          return;
        }

        if (profileData.registration_number !== registrationNumber) {
          localStorage.removeItem("token");
          toast.error("Invalid registration number");
          setLoading(false);
          return;
        }

        // Save session
        localStorage.setItem("token", response.access_token);
        localStorage.setItem("user", JSON.stringify(response.user));

        // Check if user is admin
        const roles = response.user.roles || [];
        const isAdmin = roles.some((r: any) => r.role === "admin");

        if (isAdmin) {
          navigate("/admin");
        } else {
          navigate("/student-dashboard");
        }
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="absolute top-4 left-4 flex gap-2">
        <Button variant="outline" onClick={() => navigate("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md p-8 card-elegant">
        <div className="flex items-center justify-center mb-6">
          <GraduationCap className="h-12 w-12 text-primary mr-3" />
          <h1 className="text-3xl font-bold gradient-text">Student Login</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="registrationNumber">Registration Number</Label>
            <Input
              id="registrationNumber"
              type="text"
              placeholder="e.g., 2201297001"
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-primary hover:underline transition-all"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full btn-gradient" size="lg" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Login
          </Button>

          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => navigate("/admin-login")}
            >
              <Shield className="mr-2 h-4 w-4" />
              Admin Login
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
