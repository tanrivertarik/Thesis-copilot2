import { extendTheme } from '@chakra-ui/react';
import type { ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false
};

// Academic Blue Color Palette
const colors = {
  // Primary Academic Colors
  academic: {
    background: '#F8F8F7',      // Light Off-White
    paper: '#FFFFFF',           // Pure White
    primaryText: '#2D3748',     // Charcoal
    secondaryText: '#718096',   // Slate Gray
    accent: '#607A94',          // Dusty Blue
    accentHover: '#4F6780',     // Darker Dusty Blue
    border: '#D1D5DB',          // Light Gray
    borderLight: '#E5E7EB'      // Very Light Gray
  },
  // Keep brand colors for backward compatibility but update values
  brand: {
    50: '#F8F9FB',
    100: '#E8EDF3',
    200: '#D1DBEA',
    300: '#A8BACE',
    400: '#8099B5',
    500: '#607A94',
    600: '#4F6780',
    700: '#3F5266',
    800: '#2F3E4D',
    900: '#1F2933'
  },
  surface: {
    dark: '#F8F8F7',
    darker: '#FFFFFF',
    card: '#FFFFFF',
    cardHover: '#F8F8F7',
    border: '#D1D5DB',
    borderLight: '#E5E7EB'
  },
  accent: {
    primary: '#607A94',
    secondary: '#4F6780',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  }
};

const components = {
  Button: {
    baseStyle: {
      fontWeight: 'semibold',
      borderRadius: 'lg',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
    },
    variants: {
      solid: {
        bg: 'academic.accent',
        color: 'white',
        _hover: {
          bg: 'academic.accentHover',
          transform: 'translateY(-1px)',
          boxShadow: '0 4px 12px rgba(96, 122, 148, 0.25)',
          _disabled: {
            bg: 'academic.accent',
            transform: 'none'
          }
        }
      },
      outline: {
        borderColor: 'academic.border',
        color: 'academic.primaryText',
        _hover: {
          bg: 'rgba(96, 122, 148, 0.05)',
          borderColor: 'academic.accent'
        }
      },
      ghost: {
        color: 'academic.secondaryText',
        _hover: {
          bg: 'rgba(96, 122, 148, 0.05)',
          color: 'academic.accent'
        }
      },
      link: {
        color: 'academic.secondaryText',
        fontWeight: 'normal',
        _hover: {
          color: 'academic.accent',
          textDecoration: 'none'
        }
      }
    }
  },
  Input: {
    defaultProps: {
      focusBorderColor: 'academic.accent'
    },
    variants: {
      outline: {
        field: {
          bg: 'academic.paper',
          borderColor: 'academic.border',
          color: 'academic.primaryText',
          transition: 'border-color 0.2s',
          _hover: {
            borderColor: 'academic.border'
          },
          _focus: {
            borderColor: 'academic.accent',
            boxShadow: 'none'
          },
          _placeholder: {
            color: 'academic.secondaryText'
          }
        }
      }
    }
  },
  Textarea: {
    defaultProps: {
      focusBorderColor: 'academic.accent'
    },
    variants: {
      outline: {
        bg: 'academic.paper',
        borderColor: 'academic.border',
        color: 'academic.primaryText',
        transition: 'border-color 0.2s',
        _hover: {
          borderColor: 'academic.border'
        },
        _focus: {
          borderColor: 'academic.accent',
          boxShadow: 'none'
        },
        _placeholder: {
          color: 'academic.secondaryText'
        }
      }
    }
  },
  Card: {
    baseStyle: {
      container: {
        bg: 'academic.paper',
        borderColor: 'academic.border',
        _hover: {
          borderColor: 'academic.border',
          bg: 'academic.paper',
          transition: 'all 0.2s'
        }
      }
    }
  },
  FormLabel: {
    baseStyle: {
      color: 'academic.primaryText',
      fontWeight: 'medium'
    }
  }
};

const fonts = {
  heading: "'Lora', 'Georgia', serif",
  body: "'Inter', system-ui, sans-serif"
};

const styles = {
  global: {
    body: {
      bg: 'academic.background',
      color: 'academic.primaryText'
    },
    html: {
      scrollBehavior: 'smooth'
    },
    '::selection': {
      bg: 'academic.accent',
      color: 'white'
    },
    '::-webkit-scrollbar': {
      width: '8px',
      height: '8px'
    },
    '::-webkit-scrollbar-track': {
      bg: 'academic.borderLight'
    },
    '::-webkit-scrollbar-thumb': {
      bg: 'academic.accent',
      borderRadius: 'md',
      _hover: {
        bg: 'academic.accentHover'
      }
    }
  }
};

const semanticTokens = {
  colors: {
    surface: {
      default: '#FFFFFF',
      _light: '#FFFFFF'
    },
    surfaceAccent: {
      default: 'rgba(96, 122, 148, 0.08)',
      _light: 'rgba(96, 122, 148, 0.08)'
    }
  }
};

export const theme = extendTheme({
  config,
  colors,
  fonts,
  components,
  styles,
  semanticTokens,
  shadows: {
    glow: '0 0 20px rgba(96, 122, 148, 0.15)',
    elevated: '0 4px 12px rgba(0, 0, 0, 0.05)',
    card: '0 2px 8px rgba(0, 0, 0, 0.04)',
    soft: '0 4px 12px rgba(0, 0, 0, 0.05)'
  }
});
