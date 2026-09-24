import { Button, Center, Stack, Text, Title } from '@mantine/core'
import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <Center mih="65vh">
      <Stack align="center">
        <Text size="xs" tt="uppercase" fw={700} c="dimmed">
          404
        </Text>
        <Title order={1}>Page not found</Title>
        <Text c="dimmed">The address may be old or incomplete.</Text>
        <Button component={Link} to="/">
          Return to dashboard
        </Button>
      </Stack>
    </Center>
  )
}
