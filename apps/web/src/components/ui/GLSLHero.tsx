import { GLSLHills } from "@/components/ui/glsl-hills";
import { Button } from "@chakra-ui/react";
import { MoveRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../app/providers/firebase/AuthProvider";

export default function GLSLHero() {
  const { user } = useAuth();
  const isAuthenticated = Boolean(user);
  const navigate = useNavigate();

  const handleCTAClick = () => {
    console.log("Button clicked!", isAuthenticated ? "Going to dashboard" : "Going to login");
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  };

  return (
    <div style={{ 
      position: 'relative', 
      height: '100vh', 
      width: '100%', 
      overflow: 'hidden',
      backgroundColor: '#F8F8F7'
    }}>
      {/* Layer 1: GLSL Background - Lowest layer */}
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%',
        zIndex: 1,
        pointerEvents: 'none'
      }}>
        <GLSLHills />
      </div>
      
      {/* Layer 2: Semi-transparent overlay */}
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%',
        zIndex: 2,
        background: 'linear-gradient(to bottom, rgba(248,248,247,0.2), transparent, rgba(248,248,247,0.3))',
        pointerEvents: 'none'
      }}></div>
      
      {/* Layer 3: Text Content - No pointer events */}
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%',
        zIndex: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 1rem',
        pointerEvents: 'none'
      }}>
        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2rem',
          textAlign: 'center',
          maxWidth: '80rem'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h1 style={{
              fontFamily: 'Lora, serif',
              fontSize: 'clamp(2rem, 6vw, 4.5rem)',
              fontWeight: 'normal',
              lineHeight: '1.2',
              margin: 0,
              animation: 'fadeSlideIn 1s ease-out forwards',
              opacity: 0
            }}>
              <span style={{ 
                display: 'block',
                fontSize: 'clamp(1.75rem, 5vw, 3.75rem)',
                fontWeight: '300',
                fontStyle: 'italic',
                color: '#607A94',
                marginBottom: '0.5rem',
                textShadow: '0 2px 8px rgba(255,255,255,0.95)'
              }}>
                Your Thesis Journey
              </span>
              <span style={{ 
                display: 'block',
                fontWeight: '600',
                color: '#2D3748',
                textShadow: '0 2px 8px rgba(255,255,255,0.95)'
              }}>
                Guided by AI
              </span>
            </h1>
            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 'clamp(1rem, 2vw, 1.125rem)',
              lineHeight: '1.75',
              color: '#4A5568',
              maxWidth: '42rem',
              margin: '0 auto',
              padding: '0 1rem',
              textShadow: '0 1px 4px rgba(255,255,255,0.95)',
              animation: 'fadeSlideIn 1s ease-out 0.3s forwards',
              opacity: 0
            }}>
              From blank page to polished draft. Thesis Copilot combines AI assistance
              with academic rigor, helping you write faster while maintaining full
              control and ensuring every claim is grounded in your sources.
            </p>
          </div>
        </div>
      </div>
      
      {/* Layer 4: Button - HIGHEST layer with pointer events enabled */}
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 1rem',
        pointerEvents: 'none'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2rem',
          textAlign: 'center',
          maxWidth: '80rem',
          paddingTop: '26rem' // Push button down below text
        }}>
          <div style={{ 
            animation: 'fadeSlideIn 1s ease-out 0.6s forwards',
            opacity: 0,
            pointerEvents: 'auto'
          }}>
            <Button 
              size="lg"
              onClick={handleCTAClick}
              bg="#607A94"
              color="white"
              px={8}
              py={6}
              fontSize="lg"
              boxShadow="0 4px 12px rgba(96, 122, 148, 0.3)"
              _hover={{
                bg: "#506580",
                transform: 'translateY(-2px)',
                boxShadow: "0 6px 16px rgba(96, 122, 148, 0.4)"
              }}
              transition="all 0.3s"
              rightIcon={<MoveRight size={20} />}
            >
              {isAuthenticated ? "Go to Dashboard" : "Sign in to begin"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
