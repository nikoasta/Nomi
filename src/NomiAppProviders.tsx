import React from 'react'
import { MantineProvider } from '@mantine/core'
import { ModalsProvider } from '@mantine/modals'
import { Notifications } from '@mantine/notifications'
import { RootErrorBoundary } from './ui/ErrorBoundary'
import { buildNomiTheme } from './theme/nomiTheme'
import { useNomiColorScheme } from './theme/colorScheme'
import { I18nProvider } from './i18n/I18nProvider'

const nomiTheme = buildNomiTheme()

export function NomiAppProviders({ children }: { children: React.ReactNode }): JSX.Element {
  const { colorScheme } = useNomiColorScheme()

  return (
    <MantineProvider theme={nomiTheme} forceColorScheme={colorScheme} defaultColorScheme={colorScheme}>
      <I18nProvider>
        <ModalsProvider>
          <Notifications position="top-right" zIndex={2000} />
          <RootErrorBoundary>
            {children}
          </RootErrorBoundary>
        </ModalsProvider>
      </I18nProvider>
    </MantineProvider>
  )
}
