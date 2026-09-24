import { useState, type FormEvent } from 'react'
import {
  Alert,
  Box,
  Button,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import BrandLogo from '../../components/layout/BrandLogo'
function LoginPage() {
  const { user, loading, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  if (!loading && user) return <Navigate to="/" replace />
  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await signIn(email.trim(), password)
      const destination =
        (location.state as { from?: { pathname?: string } } | null)?.from
          ?.pathname ?? '/'
      navigate(destination, { replace: true })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Login failed')
    } finally {
      setSubmitting(false)
    }
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
              <BrandLogo placement="login" />
              <Text c="dimmed" size="sm" ta="center">
                Explore a fictional ShiftPlanner workspace.
              </Text>
            </div>
            {error && (
              <Alert color="red" title="Could not sign in">
                {error}
              </Alert>
            )}
            <TextInput
              required
              type="email"
              label="Email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.currentTarget.value)}
            />
            <PasswordInput
              required
              label="Password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.currentTarget.value)}
            />
            <Button type="submit" loading={submitting}>
              Sign in
            </Button>
            <Text ta="center" size="sm">
              <Link to="/forgot-password">Forgot password?</Link>
            </Text>
            <Text ta="center" size="sm">
              <Link to="/register">Create a demo account</Link>
            </Text>
          </Stack>
        </form>
      </Paper>
    </Box>
  )
}
export default LoginPage
