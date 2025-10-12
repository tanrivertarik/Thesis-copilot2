import { extendTheme } from '@chakra-ui/react';
import type { ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false
};

const components = {
  Button: {
    baseStyle: {
      fontWeight: 'semibold',
      borderRadius: 'xl'
    }
  }
};

const fonts = {
  heading: "'Inter', system-ui, sans-serif",
  body: "'Inter', system-ui, sans-serif"
};

const semanticTokens = {
  colors: {
    surface: {
      default: '#0f1729',
      _dark: '#0f1729'
    },
    surfaceAccent: {
      default: 'rgba(63,131,248,0.12)',
      _dark: 'rgba(63,131,248,0.12)'
    }
  }
};

export const theme = extendTheme({
  config,
  fonts,
  components,
  semanticTokens
});
