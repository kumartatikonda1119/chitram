import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  Film,
  Mail,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
} from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Register = () => {
  const hasGoogleAuth = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { register, verifyRegisterOtp, resendRegisterOtp, loginWithGoogle } =
    useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    const result = await register(name, email, password);
    setLoading(false);

    if (result.success) {
      const emailToVerify = result.email || email;
      setPendingEmail(emailToVerify);
      setIsOtpStep(true);
      toast.success("OTP sent to your email. Verify to complete signup.");
    } else {
      toast.error(result.error || "Registration failed");
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (!otp || otp.length < 4) {
      toast.error("Enter a valid OTP");
      return;
    }

    setLoading(true);
    const result = await verifyRegisterOtp(pendingEmail, otp);
    setLoading(false);

    if (result.success) {
      toast.success("Email verified. Account created successfully!");
      navigate("/profile");
    } else {
      toast.error(result.error || "OTP verification failed");
    }
  };

  const handleResendOtp = async () => {
    if (!pendingEmail) return;

    setLoading(true);
    const result = await resendRegisterOtp(pendingEmail);
    setLoading(false);

    if (result.success) {
      toast.success("OTP resent successfully");
    } else {
      toast.error(result.error || "Failed to resend OTP");
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      toast.error("Google signup failed. Please try again.");
      return;
    }

    setGoogleLoading(true);
    const result = await loginWithGoogle(credentialResponse.credential);
    setGoogleLoading(false);

    if (result.success) {
      toast.success("Signed in with Google successfully!");
      navigate("/profile");
    } else {
      toast.error(result.error || "Google signup failed");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center overflow-x-hidden w-full">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Link to="/" className="flex items-center justify-center gap-2 mb-10">
          <Film className="h-8 w-8 text-primary" />
          <span className="text-3xl font-display font-bold text-primary">
            Chitram
          </span>
        </Link>

        <div className="p-8 rounded-2xl bg-card border border-border shadow-lg">
          <h2 className="text-2xl font-display font-bold text-foreground text-center mb-2">
            {isOtpStep ? "Verify Your Email" : "Join Chitram"}
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-8">
            {isOtpStep
              ? `Enter the OTP sent to ${pendingEmail}`
              : "Start your cinematic journey today"}
          </p>

          {!isOtpStep ? (
            <>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-md shadow-primary/20 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? "Sending OTP..." : "Create Account"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>

              {hasGoogleAuth && (
                <>
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-3 text-muted-foreground">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    {googleLoading ? (
                      <div className="text-sm text-muted-foreground">
                        Signing up with Google...
                      </div>
                    ) : (
                      <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => toast.error("Google signup failed")}
                        theme="filled_black"
                        shape="pill"
                        text="signup_with"
                      />
                    )}
                  </div>
                </>
              )}
            </>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  OTP
                </label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="Enter 6-digit OTP"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-md shadow-primary/20 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify OTP"}
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                className="w-full py-3 rounded-xl border border-border text-foreground font-semibold text-sm hover:bg-secondary transition-colors disabled:opacity-50"
                disabled={loading}
              >
                Resend OTP
              </button>
            </form>
          )}

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary hover:underline font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
