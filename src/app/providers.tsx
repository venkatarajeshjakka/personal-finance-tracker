'use client';

import { Provider } from 'react-redux';
import { store } from '@/lib/redux/store';
import { ThemeProvider } from '@/components/navigation/theme-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </Provider>
  );
}