import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { z } from "zod";
import { signInSchema, signUpSchema, resetPasswordSchema, type AuthView, type AuthErrors } from "./schemas";

export const useAuthPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<AuthErrors>({});
  const [inviteCode, setInviteCode] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [authView, setAuthView] = useState<AuthView>("default");
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (error) {
        toast.error(error.message || "Failed to sign in with Google");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in with Google");
    } finally {
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    let didRedirect = false;

    const redirectTo = (url: string) => {
      if (didRedirect) return;
      didRedirect = true;
      window.location.href = url;
    };

    const bounceIfAlreadySignedIn = (session: any | null) => {
      if (!session || authView === "update-password") return;
      if (returnUrl) {
        redirectTo(returnUrl);
      } else {
        navigate("/");
      }
    };

    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get("type");
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");

    if (type === "recovery") {
      setAuthView("update-password");
      return;
    }

    if (type === "signup" && accessToken && refreshToken) {
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }).then(({ data, error }) => {
        if (!error && data.session) {
          window.history.replaceState(null, '', window.location.pathname);
          toast.success("Email confirmed! Welcome to Xcrol!");
          setShowWelcomeModal(true);
        } else {
          console.error("Failed to set session from email confirmation:", error);
          toast.error("Email confirmed but there was an issue signing you in. Please try logging in.");
        }
      });
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setAuthView("update-password");
        return;
      }

      if (event === "INITIAL_SESSION") {
        bounceIfAlreadySignedIn(session);
        return;
      }

      if (event === "SIGNED_IN" && session && authView !== "update-password") {
        if (returnUrl) {
          redirectTo(returnUrl);
        } else {
          setShowWelcomeModal(true);
        }
      }
    });

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        bounceIfAlreadySignedIn(session);
      })
      .catch(() => {});

    return () => subscription.unsubscribe();
  }, [navigate, authView, returnUrl]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = signUpSchema.safeParse({ displayName, email, password, inviteCode, agreedToTerms });
    if (!result.success) {
      const fieldErrors: AuthErrors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof AuthErrors;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (!result.data.inviteCode) {
      setErrors({ inviteCode: "An invite code is required to sign up" });
      return;
    }

    setLoading(true);
    try {
      const { data: isValid, error: checkError } = await supabase
        .rpc('check_invite_code', { p_invite_code: result.data.inviteCode });

      if (checkError || !isValid) {
        setErrors({ inviteCode: "Invalid or already used invite code" });
        setLoading(false);
        return;
      }

      const { data: signUpData, error } = await supabase.auth.signUp({
        email: result.data.email,
        password: result.data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            display_name: result.data.displayName,
            invite_code: result.data.inviteCode || null,
          }
        }
      });

      if (error) throw error;

      if (signUpData.user) {
        await supabase.rpc('use_invite_code', {
          p_invite_code: result.data.inviteCode,
          p_user_id: signUpData.user.id,
          p_email: result.data.email
        });
      }

      if (signUpData.user) {
        try {
          await supabase.functions.invoke('send-welcome-email', {
            body: {
              email: result.data.email,
              displayName: result.data.displayName,
            }
          });
        } catch (emailError) {
          console.error('Failed to send welcome email:', emailError);
        }
      }

      setShowEmailConfirmation(true);
      toast.success("Check your email to verify your account!");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = signInSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: AuthErrors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof AuthErrors;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: result.data.email,
        password: result.data.password,
      });

      if (error) {
        if (error.message.toLowerCase().includes("email not confirmed") ||
            error.message.toLowerCase().includes("email_not_confirmed")) {
          setAuthView("email-not-confirmed");
          return;
        }
        throw error;
      }
      toast.success("Signed in successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
        }
      });

      if (error) throw error;
      toast.success("Confirmation email sent! Check your inbox.");
    } catch (error: any) {
      toast.error(error.message || "Failed to resend confirmation email");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const emailValidation = z.string().trim().email({ message: "Please enter a valid email address" });
    const result = emailValidation.safeParse(email);

    if (!result.success) {
      setErrors({ email: result.error.errors[0].message });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(result.data, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;
      setAuthView("reset-password-sent");
      toast.success("Password reset email sent!");
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = resetPasswordSchema.safeParse({ password, confirmPassword });
    if (!result.success) {
      const fieldErrors: AuthErrors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof AuthErrors;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: result.data.password,
      });

      if (error) throw error;
      toast.success("Password updated successfully!");
      setAuthView("default");
      window.history.replaceState(null, '', window.location.pathname);
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  const handleResendResetEmail = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) throw error;
      toast.success("Reset email resent!");
    } catch (error: any) {
      toast.error(error.message || "Failed to resend email");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        }
      });
      if (error) throw error;
      toast.success("Verification email resent!");
    } catch (error: any) {
      toast.error(error.message || "Failed to resend email");
    } finally {
      setLoading(false);
    }
  };

  return {
    email, setEmail,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    displayName, setDisplayName,
    loading,
    errors,
    inviteCode, setInviteCode,
    agreedToTerms, setAgreedToTerms,
    showEmailConfirmation, setShowEmailConfirmation,
    authView, setAuthView,
    showWelcomeModal, setShowWelcomeModal,
    googleLoading,
    navigate,
    handleGoogleSignIn,
    handleSignUp,
    handleSignIn,
    handleResendConfirmation,
    handleForgotPassword,
    handleUpdatePassword,
    handleResendResetEmail,
    handleResendVerification,
  };
};
