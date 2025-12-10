'use client'
import * as React from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

// Next and Mui aren't playing well.
// AI thinks that we should use AppRouterCacheProvider
// but this doesn't work - I still need to restart the server
// for changes to take effect.
// import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';

const theme = createTheme({
    colorSchemes: {
        dark: true
    }
})

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
    </ThemeProvider>
}
