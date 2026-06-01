import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { CssBaseline, ThemeProvider } from '@mui/material'

import { getAppTheme } from '../style/theme.js'

const THEME_STORAGE_KEY = 'spend-wise-theme-mode'

const ThemeModeContext = createContext({
	mode: 'light',
	toggleColorMode: () => {},
})

function getInitialMode() {
	if (typeof window === 'undefined') {
		return 'light'
	}

	const storedMode = window.localStorage.getItem(THEME_STORAGE_KEY)
	if (storedMode === 'light' || storedMode === 'dark') {
		return storedMode
	}

	const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
	return prefersDark ? 'dark' : 'light'
}

export function ThemeModeProvider({ children }) {
	const [mode, setMode] = useState(getInitialMode)

	useEffect(() => {
		window.localStorage.setItem(THEME_STORAGE_KEY, mode)
	}, [mode])

	const toggleColorMode = () => {
		setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'))
	}

	const theme = useMemo(() => getAppTheme(mode), [mode])

	const value = useMemo(
		() => ({
			mode,
			toggleColorMode,
		}),
		[mode],
	)

	return (
		<ThemeModeContext.Provider value={value}>
			<ThemeProvider theme={theme}>
				<CssBaseline />
				{children}
			</ThemeProvider>
		</ThemeModeContext.Provider>
	)
}

export function useThemeMode() {
	return useContext(ThemeModeContext)
}
