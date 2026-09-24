import { useState, type FormEvent } from 'react'
import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: new URL(
          'reset-password',
          `${window.location.origin}${import.meta.env.BASE_URL}`,
        ).toString(),
      },
    )
    if (resetError) setError(resetError.message)
    else setSent(true)
    setSubmitting(false)
  }
  return (
    <Box
      mih="100vh"
      display="flex"
      style={{ alignItems: 'center', justifyContent: 'center' }}
      p="md"
    >
      <Paper withBorder shadow="sm" p="xl" w="100%" maw={420}>
        <form onSubmit={handleSubmit}>
          <Stack>
            <div>
              <Title order={1}>Reset password</Title>
              <Text c="dimmed" size="sm">
                We’ll email you a secure reset link.
              </Text>
            </div>
            {error && (
              <Alert color="red" title="Could not send reset link">
                {error}
              </Alert>
            )}
            {sent ? (
              <Alert color="green" title="Check your email">
                If this address has an account, a reset link is on its way.
              </Alert>
            ) : (
              <>
                <TextInput
                  required
                  type="email"
                  label="Email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.currentTarget.value)}
                />
                <Button type="submit" loading={submitting}>
                  Send reset link
                </Button>
              </>
            )}
            <Text ta="center" size="sm">
              <Link to="/login">Back to sign in</Link>
            </Text>
          </Stack>
        </form>
      </Paper>
    </Box>
  )
}
export default ForgotPasswordPage
