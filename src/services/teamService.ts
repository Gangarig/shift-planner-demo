import { supabase } from '../lib/supabase'
import type { AppRole } from '../context/AuthContext'

export interface TeamMember {
  id: string
  email: string
  fullName: string
  role: AppRole
  status: 'active' | 'invited' | 'disabled'
  workerId: string | null
  createdAt: string
}

type TeamAction =
  | { action: 'list' }
  | {
      action: 'invite'
      email: string
      fullName: string
      role: AppRole
      workerId: string | null
      redirectTo: string
    }
  | { action: 'update'; userId: string; role: AppRole; workerId: string | null }
  | { action: 'set-disabled'; userId: string; disabled: boolean }
  | { action: 'cancel-invitation'; userId: string }
  | { action: 'delete-account'; userId: string }

async function invoke<T>(body: TeamAction): Promise<T> {
  const { data, error } = await supabase.functions.invoke('manage-team', {
    body,
  })
  if (error) {
    let message = error.message
    const context = 'context' in error ? error.context : null
    if (context instanceof Response) {
      const details = (await context.json().catch(() => null)) as {
        error?: string
      } | null
      if (details?.error) message = details.error
    }
    throw new Error(message)
  }
  if (data?.error) throw new Error(data.error)
  return data as T
}

export async function loadTeam() {
  const data = await invoke<{ members: TeamMember[] }>({ action: 'list' })
  return data.members
}

export async function inviteTeamMember(
  input: Omit<Extract<TeamAction, { action: 'invite' }>, 'action'>,
) {
  return invoke<{ member: TeamMember }>({ action: 'invite', ...input })
}

export async function updateTeamMember(
  userId: string,
  role: AppRole,
  workerId: string | null,
) {
  return invoke<{ success: true }>({
    action: 'update',
    userId,
    role,
    workerId,
  })
}

export async function setTeamMemberDisabled(userId: string, disabled: boolean) {
  return invoke<{ success: true }>({
    action: 'set-disabled',
    userId,
    disabled,
  })
}

export async function cancelInvitation(userId: string) {
  return invoke<{ success: true }>({ action: 'cancel-invitation', userId })
}

export async function deleteTeamMemberAccount(userId: string) {
  return invoke<{ success: true }>({ action: 'delete-account', userId })
}
