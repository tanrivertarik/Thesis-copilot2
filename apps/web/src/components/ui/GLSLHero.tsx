import { GLSLHills } from "@/components/ui/glsl-hills";
import { Button } from "@chakra-ui/react";
import { MoveRight, BookOpen } from "lucide-react";
import { Link as RouterLink } from "react-router-dom";
import { useAuth } from "../../app/providers/firebase/AuthProvider";

export default function GLSLHero() {
  const { user } = useAuth();
  const isAuthenticated = Boolean(user);

  return (
    <div style={{ 
      position: 'relative', 
      height: '100vh', 
      width: '100%', 
      overflow: 'hidden',
      backgroundColor: '#F8F8F7'
    }}>
      {/* GLSL Background */}
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%',
        zIndex: 1
      }}>
        <GLSLHills />
      </div>
      
      {/* Semi-transparent overlay for better text contrast */}
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%',
        zIndex: 2,
        background: 'linear-gradient(to bottom, rgba(248,248,247,0.2), transparent, rgba(248,248,247,0.3))'
      }}></div>
      
      {/* Content Overlay */}
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 1rem'
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
              margin: 0
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
              textShadow: '0 1px 4px rgba(255,255,255,0.95)'
            }}>
              From blank page to polished draft. Thesis Copilot combines AI assistance
              with academic rigor, helping you write faster while maintaining full
              control and ensuring every claim is grounded in your sources.
            </p>
          </div>
          
          {/* CTA Buttons */}
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '1rem' 
          }}>
            <Button 
              variant="outline" 
              size="lg"
              as={RouterLink}
              to="#features"
              borderColor="#607A94"
              color="#607A94"
              bg="rgba(255,255,255,0.95)"
              backdropFilter="blur(8px)"
              boxShadow="0 4px 6px rgba(0,0,0,0.1)"
              _hover={{
                bg: "#607A94",
                color: "white"
              }}
              rightIcon={<BookOpen size={16} />}
            >
              Learn more
            </Button>
            <Button 
              size="lg"
              as={RouterLink}
              to={isAuthenticated ? "/onboarding" : "/login"}
              bg="#607A94"
              color="white"
              boxShadow="0 4px 6px rgba(0,0,0,0.1)"
              _hover={{
                bg: "#506580"
              }}
              rightIcon={<MoveRight size={16} />}
            >
              {isAuthenticated ? "Start writing" : "Sign in to begin"}
            </Button>
          </div>
        </div>
      </div> 
    </div>
  );
}

