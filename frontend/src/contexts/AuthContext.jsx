import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "@/lib/api";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on mount
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error("Error parsing saved user:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      const { token, user } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      setUser(user);

      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Login failed",
      };
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await authAPI.register({ username, email, password });
      return {
        success: true,
        requiresVerification: true,
        email: response.data?.email || email,
        devOtp: response.data?.devOtp,
      };
    } catch (error) {
      console.error("Registration error:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Registration failed",
      };
    }
  };

  const verifyRegisterOtp = async (email, otp) => {
    try {
      const response = await authAPI.verifyRegisterOtp({ email, otp });
      const { token, user } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      setUser(user);

      return { success: true };
    } catch (error) {
      console.error("OTP verification error:", error);
      return {
        success: false,
        error: error.response?.data?.error || "OTP verification failed",
      };
    }
  };

  const resendRegisterOtp = async (email) => {
    try {
      const response = await authAPI.resendRegisterOtp({ email });
      return {
        success: true,
        devOtp: response.data?.devOtp,
      };
    } catch (error) {
      console.error("Resend OTP error:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to resend OTP",
      };
    }
  };

  const loginWithGoogle = async (idToken) => {
    try {
      const response = await authAPI.googleAuth({ idToken });
      const { token, user } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      setUser(user);

      return { success: true };
    } catch (error) {
      console.error("Google login error:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Google login failed",
      };
    }
  };

  const requestPasswordResetOtp = async (email) => {
    try {
      const response = await authAPI.requestPasswordResetOtp({ email });
      return {
        success: true,
        devOtp: response.data?.devOtp,
      };
    } catch (error) {
      console.error("Request reset OTP error:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to send reset OTP",
      };
    }
  };

  const resetPasswordWithOtp = async (email, otp, newPassword) => {
    try {
      await authAPI.resetPasswordWithOtp({ email, otp, newPassword });
      return { success: true };
    } catch (error) {
      console.error("Reset password error:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to reset password",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        verifyRegisterOtp,
        resendRegisterOtp,
        loginWithGoogle,
        requestPasswordResetOtp,
        resetPasswordWithOtp,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
