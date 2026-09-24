import { useState, type FormEvent } from 'react'
import {
  Alert,
  Box,
  Button,
  Paper,
  PasswordInput,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const invited = searchParams.get('invite') === '1'
  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (password !== confirmation) {
      setError('The passwords do not match.')
      return
    }
    setSubmitting(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) setError(updateError.message)
    else navigate('/login', { replace: true })
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
              <Title order={1}>
                {invited ? 'Finish your account' : 'Choose a new password'}
              </Title>
              <Text c="dimmed" size="sm">
                {invited
                  ? 'Create a password to accept your Shift Planner invitation.'
                  : 'Use the secure link from your email.'}
              </Text>
            </div>
            {error && (
              <Alert color="red" title="Could not update password">
                {error}
              </Alert>
            )}
            <PasswordInput
              required
              minLength={8}
              label="New password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.currentTarget.value)}
            />
            <PasswordInput
              required
              minLength={8}
              label="Confirm password"
              autoComplete="new-password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.currentTarget.value)}
            />
            <Button type="submit" loading={submitting}>
              {invited ? 'Accept invitation' : 'Update password'}
            </Button>
            <Text ta="center" size="sm">
              <Link to="/login">Back to sign in</Link>
            </Text>
          </Stack>
        </form>
      </Paper>
    </Box>
  )
}
export default ResetPasswordPage
