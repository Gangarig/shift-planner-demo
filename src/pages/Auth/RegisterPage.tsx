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
  Title,
} from '@mantine/core'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName.trim() },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    })
    if (signUpError) setError(signUpError.message)
    else setSuccess(true)
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
              <Title order={1}>Create account</Title>
              <Text c="dimmed" size="sm">
                New accounts start with worker access.
              </Text>
            </div>
            {error && (
              <Alert color="red" title="Could not create account">
                {error}
              </Alert>
            )}
            {success ? (
              <Alert color="green" title="Check your email">
                Open the confirmation link, then return here to sign in.
              </Alert>
            ) : (
              <>
                <TextInput
                  required
                  label="Name"
                  autoComplete="name"
                  value={fullName}
                  onChange={(event) => setFullName(event.currentTarget.value)}
                />
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
                  minLength={8}
                  label="Password"
                  description="Use at least 8 characters."
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.currentTarget.value)}
                />
                <Button type="submit" loading={submitting}>
                  Create account
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

export default RegisterPage
