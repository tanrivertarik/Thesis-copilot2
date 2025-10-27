import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

// --- HELPER COMPONENTS (ICONS) ---

const GoogleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C37.406 38.807 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
);


// --- TYPE DEFINITIONS ---

export interface Testimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

interface SignInPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  heroImageSrc?: string;
  testimonials?: Testimonial[];
  onSignIn?: (event: React.FormEvent<HTMLFormElement>) => void;
  onGoogleSignIn?: () => void;
  onDemoSignIn?: () => void;
  onResetPassword?: () => void;
  onCreateAccount?: () => void;
  showDemoButton?: boolean;
  isLoading?: boolean;
}

// --- SUB-COMPONENTS ---

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-border bg-foreground/5 backdrop-blur-sm transition-colors focus-within:border-violet-400/70 focus-within:bg-violet-500/10">
    {children}
  </div>
);

const TestimonialCard = ({ testimonial, delay }: { testimonial: Testimonial, delay: string }) => (
  <div className={`animate-testimonial ${delay} flex items-start gap-3 rounded-3xl bg-card/40 dark:bg-zinc-800/40 backdrop-blur-xl border border-white/10 p-5 w-64`}>
    <img src={testimonial.avatarSrc} className="h-10 w-10 object-cover rounded-2xl" alt="avatar" />
    <div className="text-sm leading-snug">
      <p className="flex items-center gap-1 font-medium">{testimonial.name}</p>
      <p className="text-muted-foreground">{testimonial.handle}</p>
      <p className="mt-1 text-foreground/80">{testimonial.text}</p>
    </div>
  </div>
);

// --- MAIN COMPONENT ---

export const SignInPage: React.FC<SignInPageProps> = ({
  title = <span className="font-light text-foreground tracking-tighter">Welcome</span>,
  description = "Access your account and continue your journey with us",
  heroImageSrc,
  testimonials = [],
  onSignIn,
  onGoogleSignIn,
  onDemoSignIn,
  onResetPassword,
  onCreateAccount,
  showDemoButton = false,
  isLoading = false,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  
  console.log('SignInPage rendering', { showDemoButton, isLoading, testimonials: testimonials.length });

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'row',
      width: '100vw', 
      height: '100vh',
      fontFamily: 'Inter, sans-serif',
      backgroundColor: '#F8F8F7'
    }}>
      {/* Left column: sign-in form */}
      <section style={{ 
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <div style={{ width: '100%', maxWidth: '28rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h1 style={{ 
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              fontWeight: 600,
              lineHeight: 1.2,
              margin: 0,
              color: '#2D3748'
            }}>{title}</h1>
            <p style={{ 
              color: '#6B7280',
              fontSize: '1rem',
              lineHeight: 1.5
            }}>{description}</p>

            <form style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} onSubmit={onSignIn}>
              <div>
                <label style={{ 
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#6B7280',
                  marginBottom: '0.5rem'
                }}>Email Address</label>
                <input 
                  name="email" 
                  type="email" 
                  placeholder="Enter your email address" 
                  style={{
                    width: '100%',
                    padding: '1rem',
                    fontSize: '0.875rem',
                    borderRadius: '1rem',
                    border: '1px solid #E5E7EB',
                    backgroundColor: 'rgba(255,255,255,0.5)',
                    backdropFilter: 'blur(8px)',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#6B7280',
                  marginBottom: '0.5rem'
                }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    name="password" 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="Enter your password" 
                    style={{
                      width: '100%',
                      padding: '1rem',
                      paddingRight: '3rem',
                      fontSize: '0.875rem',
                      borderRadius: '1rem',
                      border: '1px solid #E5E7EB',
                      backgroundColor: 'rgba(255,255,255,0.5)',
                      backdropFilter: 'blur(8px)',
                      outline: 'none'
                    }}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {showPassword ? <EyeOff style={{ width: '1.25rem', height: '1.25rem', color: '#6B7280' }} /> : <Eye style={{ width: '1.25rem', height: '1.25rem', color: '#6B7280' }} />}
                  </button>
                </div>
              </div>

              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                fontSize: '0.875rem'
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" name="rememberMe" style={{ width: '1rem', height: '1rem' }} />
                  <span style={{ color: '#2D3748' }}>Keep me signed in</span>
                </label>
                <a 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); onResetPassword?.(); }} 
                  style={{ color: '#8B5CF6', textDecoration: 'none' }}
                >
                  Reset password
                </a>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '1rem',
                  fontSize: '1rem',
                  fontWeight: 500,
                  borderRadius: '1rem',
                  border: 'none',
                  backgroundColor: '#607A94',
                  color: 'white',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.5 : 1,
                  transition: 'all 0.2s'
                }}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            <div style={{ 
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0.5rem 0'
            }}>
              <span style={{ 
                position: 'absolute',
                width: '100%',
                height: '1px',
                backgroundColor: '#E5E7EB'
              }}></span>
              <span style={{ 
                position: 'relative',
                padding: '0 1rem',
                fontSize: '0.875rem',
                color: '#6B7280',
                backgroundColor: '#F8F8F7'
              }}>Or continue with</span>
            </div>

            <button 
              onClick={onGoogleSignIn} 
              disabled={isLoading}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                padding: '1rem',
                fontSize: '1rem',
                fontWeight: 500,
                borderRadius: '1rem',
                border: '1px solid #E5E7EB',
                backgroundColor: 'white',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.5 : 1,
                transition: 'all 0.2s'
              }}
            >
              <GoogleIcon />
              Continue with Google
            </button>

            {showDemoButton && (
              <button 
                onClick={onDemoSignIn} 
                disabled={isLoading}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  padding: '1rem',
                  fontSize: '1rem',
                  fontWeight: 500,
                  borderRadius: '1rem',
                  border: '2px solid rgba(139, 92, 246, 0.5)',
                  backgroundColor: 'rgba(139, 92, 246, 0.05)',
                  color: '#8B5CF6',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.5 : 1,
                  transition: 'all 0.2s'
                }}
              >
                Continue as Demo Account
              </button>
            )}

            <p style={{ 
              textAlign: 'center',
              fontSize: '0.875rem',
              color: '#6B7280'
            }}>
              New to our platform? <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); onCreateAccount?.(); }} 
                style={{ color: '#8B5CF6', textDecoration: 'none' }}
              >
                Create Account
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Right column: hero image + testimonials */}
      {heroImageSrc && (
        <section style={{ 
          flex: 1,
          position: 'relative',
          padding: '1rem',
          display: window.innerWidth < 768 ? 'none' : 'block'
        }}>
          <div style={{ 
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            bottom: '1rem',
            left: '1rem',
            borderRadius: '1.5rem',
            backgroundImage: `url(${heroImageSrc})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}></div>
          {testimonials.length > 0 && (
            <div style={{ 
              position: 'absolute',
              bottom: '2rem',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '1rem',
              padding: '0 2rem',
              width: '100%',
              justifyContent: 'center'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'start',
                gap: '0.75rem',
                borderRadius: '1.5rem',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                padding: '1.25rem',
                width: '16rem'
              }}>
                <img 
                  src={testimonials[0].avatarSrc} 
                  style={{ 
                    height: '2.5rem',
                    width: '2.5rem',
                    objectFit: 'cover',
                    borderRadius: '1rem'
                  }} 
                  alt="avatar" 
                />
                <div style={{ fontSize: '0.875rem', lineHeight: 1.4 }}>
                  <p style={{ margin: 0, fontWeight: 500 }}>{testimonials[0].name}</p>
                  <p style={{ margin: 0, color: '#6B7280' }}>{testimonials[0].handle}</p>
                  <p style={{ margin: '0.25rem 0 0 0', color: '#2D3748' }}>{testimonials[0].text}</p>
                </div>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

