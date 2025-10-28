import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/providers/firebase/AuthProvider';
import { SignInPage, type Testimonial } from '../../components/ui/sign-in';

const testimonials: Testimonial[] = [
  {
    avatarSrc: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    name: "Sarah Chen",
    handle: "@sarahphd",
    text: "Thesis Copilot helped me finish my dissertation 3 months ahead of schedule. The AI drafting is a game-changer!"
  },
  {
    avatarSrc: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    name: "Marcus Johnson",
    handle: "@marcusresearch",
    text: "Finally, an AI tool that respects academic integrity. Every claim is properly sourced and traceable."
  },
  {
    avatarSrc: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
    name: "David Martinez",
    handle: "@davidacademic",
    text: "The Constitution feature gave me a clear roadmap. I always knew what to write next. Highly recommended!"
  },
];

export function Login() {
  const { user, loading, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isEmulatorMode = import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';

  useEffect(() => {
    console.log('🔀 Login component mounted');

    if (user && !loading) {
      const redirectTo = (location.state as { from?: Location })?.from?.pathname ?? '/dashboard';
      console.log('🎯 Navigating authenticated user to:', redirectTo);
      navigate(redirectTo, { replace: true });
    }
  }, [user, loading, navigate, location.state]);

  const handleSignIn = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());
    console.log("Email/Password Sign In submitted:", data);
    alert("Email/password authentication is not yet implemented. Please use Google Sign In.");
  };

  const handleGoogleSignIn = () => {
    console.log("Google Sign In clicked");
    signInWithGoogle();
  };

  const handleDemoSignIn = () => {
    console.log("Demo Sign In clicked");
    signInWithGoogle();
  };

  const handleResetPassword = () => {
    alert("Password reset is not yet implemented.");
  };

  const handleCreateAccount = () => {
    alert("Account creation is not yet implemented. Please use Google Sign In.");
  };

  console.log('🎨 Rendering Login component');

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#F8F8F7' }}>
      <SignInPage
        title={
          <span style={{ fontWeight: 300, letterSpacing: '-0.02em' }}>
            Welcome to <br />
            <span style={{ fontWeight: 600, color: '#607A94' }}>Thesis Copilot</span>
          </span>
        }
        description={
          isEmulatorMode 
            ? "Development mode: Sign in as demo user to access your projects, sources, and drafting workspace."
            : "Access your account and continue your academic journey with AI-powered thesis writing."
        }
        heroImageSrc="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=2160&q=80"
        testimonials={testimonials}
        onSignIn={handleSignIn}
        onGoogleSignIn={handleGoogleSignIn}
        onDemoSignIn={handleDemoSignIn}
        onResetPassword={handleResetPassword}
        onCreateAccount={handleCreateAccount}
        showDemoButton={isEmulatorMode}
        isLoading={loading}
      />
    </div>
  );
}
