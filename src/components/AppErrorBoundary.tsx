import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Alert, Button, Container, Stack, Text, Title } from '@mantine/core'

interface Props {
  children: ReactNode
}
interface State {
  failed: boolean
}

export default class AppErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }
  static getDerivedStateFromError(): State {
    return { failed: true }
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ShiftPlanner failed to render', error, info.componentStack)
  }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <Container size="sm" py={80}>
        <Stack>
          <Title>Something went wrong</Title>
          <Alert color="red" title="The page could not be displayed">
            <Text size="sm">
              Your saved schedule has not been changed. Reload the app and try
              again.
            </Text>
          </Alert>
          <Button onClick={() => window.location.reload()}>
            Reload ShiftPlanner
          </Button>
        </Stack>
      </Container>
    )
  }
}
