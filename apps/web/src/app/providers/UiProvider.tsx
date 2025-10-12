import type { PropsWithChildren } from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { FirebaseProvider } from './firebase/FirebaseProvider';
import { AuthProvider } from './firebase/AuthProvider';
import { theme } from '../../theme';

export function UiProvider({ children }: PropsWithChildren) {
  return (
    <FirebaseProvider>
      <AuthProvider>
        <ChakraProvider theme={theme}>{children}</ChakraProvider>
      </AuthProvider>
    </FirebaseProvider>
  );
}
