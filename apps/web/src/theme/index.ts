import { extendTheme } from '@chakra-ui/react';
import type { ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false
};

const colors = {
  brand: {
    50: '#f0f4ff',
    100: '#e5ecff',
    200: '#d0deff',
    300: '#b0c5ff',
    400: '#7fa3ff',
    500: '#5b82f5',
    600: '#3f52d9',
    700: '#2d3fb5',
    800: '#1f2d8b',
    900: '#162060'
  },
  surface: {
    light: '#ffffff',
    lighter: '#fafbfc',
    card: '#f8f9fb',
    cardHover: '#f0f3f7',
    border: 'rgba(91, 130, 245, 0.15)',
    borderLight: 'rgba(91, 130, 245, 0.08)'
  },
  accent: {
    primary: '#5b82f5',
    secondary: '#8b5cf6',
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
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      _hover: {
        transform: 'translateY(-2px)',
        boxShadow: '0 10px 20px rgba(0, 0, 0, 0.3)'
      }
    },
    variants: {
      solid: {
        bg: 'linear-gradient(135deg, #5b82f5 0%, #8b5cf6 100%)',
        color: 'white',
        _hover: {
          bg: 'linear-gradient(135deg, #4f6fdc 0%, #7a45d9 100%)',
          _disabled: {
            bg: 'linear-gradient(135deg, #5b82f5 0%, #8b5cf6 100%)'
          }
        }
      },
      outline: {
        borderColor: 'surface.border',
        color: 'brand.200',
        _hover: {
          bg: 'rgba(95, 130, 245, 0.1)',
          borderColor: 'brand.400'
        }
      },
      ghost: {
        color: 'blue.200',
        _hover: {
          bg: 'rgba(95, 130, 245, 0.1)'
        }
      }
    }
  },
  Input: {
    defaultProps: {
      focusBorderColor: 'brand.400'
    },
    variants: {
      outline: {
        field: {
          bg: 'surface.card',
          borderColor: 'surface.border',
          color: 'gray.800',
          _hover: {
            borderColor: 'surface.border'
          },
          _focus: {
            borderColor: 'brand.400',
            boxShadow: '0 0 0 1px rgba(95, 130, 245, 0.3)'
          },
          _placeholder: {
            color: 'gray.400'
          }
        }
      }
    }
  },
  Textarea: {
    defaultProps: {
      focusBorderColor: 'brand.400'
    },
    variants: {
      outline: {
        bg: 'surface.card',
        borderColor: 'surface.border',
        color: 'gray.800',
        _hover: {
          borderColor: 'surface.border'
        },
        _focus: {
          borderColor: 'brand.400',
          boxShadow: '0 0 0 1px rgba(95, 130, 245, 0.3)'
        },
        _placeholder: {
          color: 'gray.400'
        }
      }
    }
  },
  Card: {
    baseStyle: {
      container: {
        bg: 'surface.card',
        borderColor: 'surface.border',
        _hover: {
          borderColor: 'surface.border',
          bg: 'surface.cardHover',
          transition: 'all 0.2s'
        }
      }
    }
  }
};

const fonts = {
  heading: "'Inter', system-ui, sans-serif",
  body: "'Inter', system-ui, sans-serif"
};

const styles = {
  global: {
    body: {
      bg: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
      color: 'gray.800'
    },
    html: {
      scrollBehavior: 'smooth'
    },
    '::selection': {
      bg: 'brand.100',
      color: 'brand.900'
    },
    '::-webkit-scrollbar': {
      width: '8px',
      height: '8px'
    },
    '::-webkit-scrollbar-track': {
      bg: 'surface.light'
    },
    '::-webkit-scrollbar-thumb': {
      bg: 'brand.300',
      borderRadius: 'md',
      _hover: {
        bg: 'brand.400'
      }
    }
  }
};

const semanticTokens = {
  colors: {
    surface: {
      default: '#f8f9fb',
      _light: '#f8f9fb'
    },
    surfaceAccent: {
      default: 'rgba(95, 130, 245, 0.06)',
      _light: 'rgba(95, 130, 245, 0.06)'
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
    glow: '0 0 30px rgba(95, 130, 245, 0.2)',
    elevated: '0 20px 40px rgba(0, 0, 0, 0.3)',
    card: '0 10px 30px rgba(0, 0, 0, 0.2)'
  }
});
