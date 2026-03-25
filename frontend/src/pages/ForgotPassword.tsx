import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Mail, Lock, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function ForgotPassword() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Email, 2: Token & New Password, 3: Success
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleRequestToken = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            toast.error("Please enter your email");
            return;
        }

        setLoading(true);
        try {
            await api.post("/auth/forgot-password", { data: { email } });
            toast.success("Ready to reset your password!");
            setStep(2);
        } catch (error: any) {
            toast.error(error.message || "Failed to request reset token");
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPassword || !confirmPassword) {
            toast.error("Please fill in all fields");
            return;
        }

        if (newPassword.length < 7) {
            toast.error("Password must be at least 7 characters long");
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            await api.post("/auth/reset-password", {
                data: {
                    email,
                    newPassword
                }
            });
            toast.success("Password reset successfully!");
            setStep(3);
        } catch (error: any) {
            toast.error(error.message || "Failed to reset password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex flex-col">
            <div className="absolute top-4 right-4 animate-in fade-in slide-in-from-top-4 duration-1000">
                <ThemeToggle />
            </div>

            <main className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
                    <Card className="border-none shadow-2xl glass-card">
                        {step === 1 && (
                            <form onSubmit={handleRequestToken}>
                                <CardHeader className="space-y-1">
                                    <div className="flex justify-center mb-4">
                                        <div className="p-3 rounded-full bg-primary/10">
                                            <Mail className="h-6 w-6 text-primary" />
                                        </div>
                                    </div>
                                    <CardTitle className="text-2xl font-bold text-center gradient-text">Forgot Password</CardTitle>
                                    <CardDescription className="text-center">
                                        Enter your email address to reset your password
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="name@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="bg-background/50 border-primary/20 focus:border-primary"
                                        />
                                    </div>
                                </CardContent>
                                <CardFooter className="flex flex-col gap-4 mt-2">
                                    <Button type="submit" className="w-full btn-gradient py-6 text-lg" disabled={loading}>
                                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Continue"}
                                    </Button>
                                    <Link
                                        to="/student-login"
                                        className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors justify-center"
                                    >
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Back to Login
                                    </Link>
                                </CardFooter>
                            </form>
                        )}

                        {step === 2 && (
                            <form onSubmit={handleResetPassword}>
                                <CardHeader className="space-y-1">
                                    <div className="flex justify-center mb-4">
                                        <div className="p-3 rounded-full bg-primary/10">
                                            <Lock className="h-6 w-6 text-primary" />
                                        </div>
                                    </div>
                                    <CardTitle className="text-2xl font-bold text-center gradient-text">Reset Password</CardTitle>
                                    <CardDescription className="text-center">
                                        Enter your new password for {email}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="newPassword">New Password</Label>
                                        <div className="relative">
                                            <Input
                                                id="newPassword"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                required
                                                className="bg-background/50 border-primary/20 focus:border-primary pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground">Minimum 7 characters</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                        <div className="relative">
                                            <Input
                                                id="confirmPassword"
                                                type={showConfirmPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                                className="bg-background/50 border-primary/20 focus:border-primary pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                                            >
                                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex flex-col gap-4 mt-2">
                                    <Button type="submit" className="w-full btn-gradient py-6 text-lg" disabled={loading}>
                                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Reset Password"}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setStep(1)}
                                        className="w-full"
                                        disabled={loading}
                                    >
                                        Use different email
                                    </Button>
                                </CardFooter>
                            </form>
                        )}

                        {step === 3 && (
                            <div className="py-8 text-center animate-in fade-in zoom-in duration-500">
                                <div className="flex justify-center mb-6">
                                    <div className="p-4 rounded-full bg-green-500/10 dark:bg-green-500/20">
                                        <CheckCircle2 className="h-12 w-12 text-green-500" />
                                    </div>
                                </div>
                                <CardHeader>
                                    <CardTitle className="text-2xl font-bold gradient-text">All Set!</CardTitle>
                                    <CardDescription>
                                        Your password has been successfully reset. You can now log in with your new credentials.
                                    </CardDescription>
                                </CardHeader>
                                <CardFooter className="mt-4">
                                    <Button onClick={() => navigate("/student-login")} className="w-full btn-gradient py-6 text-lg">
                                        Go to Login
                                    </Button>
                                </CardFooter>
                            </div>
                        )}
                    </Card>
                </div>
            </main>
        </div>
    );
}
