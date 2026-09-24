import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.108.2'

const roles = ['worker', 'manager', 'admin', 'owner', 'accountant'] as const
type AppRole = (typeof roles)[number]
const allowedInvitationRedirects = new Set([
  'https://gangarig.github.io/shift-planner/reset-password?invite=1',
  'http://localhost:5173/reset-password?invite=1',
])

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function isRole(value: unknown): value is AppRole {
  return typeof value === 'string' && roles.includes(value as AppRole)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS')
    return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST')
    return response({ error: 'Method not allowed' }, 405)

  try {
    const url = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!url || !serviceKey)
      return response({ error: 'Server configuration is incomplete' }, 500)

    const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
    if (!token) return response({ error: 'Sign in is required' }, 401)

    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data: authData, error: authError } = await admin.auth.getUser(token)
    if (authError || !authData.user)
      return response({ error: 'Your session is no longer valid' }, 401)

    const callerId = authData.user.id
    const { data: caller, error: callerError } = await admin
      .from('profiles')
      .select('role, disabled_at')
      .eq('id', callerId)
      .single()
    if (callerError || caller?.role !== 'owner' || caller.disabled_at)
      return response({ error: 'Active owner access is required' }, 403)

    const body = await req.json()
    const action = body?.action

    if (action === 'list') {
      const users = []
      let page = 1
      while (true) {
        const { data, error } = await admin.auth.admin.listUsers({
          page,
          perPage: 1000,
        })
        if (error) throw error
        users.push(...data.users)
        if (data.users.length < 1000) break
        page += 1
      }
      const { data: profiles, error: profilesError } = await admin
        .from('profiles')
        .select('id, full_name, role, worker_id, disabled_at')
      if (profilesError) throw profilesError
      const byId = new Map(
        (profiles ?? []).map((profile) => [profile.id, profile]),
      )
      const now = Date.now()
      const members = users
        .map((user) => {
          const profile = byId.get(user.id)
          const banned = user.banned_until
            ? new Date(user.banned_until).getTime() > now
            : false
          return {
            id: user.id,
            email: user.email ?? '',
            fullName:
              profile?.full_name ||
              user.user_metadata?.full_name ||
              user.email?.split('@')[0] ||
              'User',
            role: isRole(profile?.role) ? profile.role : 'worker',
            status:
              banned || !!profile?.disabled_at
                ? 'disabled'
                : user.email_confirmed_at
                  ? 'active'
                  : 'invited',
            workerId: profile?.worker_id ?? null,
            createdAt: user.created_at,
          }
        })
        .sort((a, b) => a.fullName.localeCompare(b.fullName))
      return response({ members })
    }

    if (action === 'invite') {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      const { data: recentInvites, error: rateError } = await admin
        .from('security_audit_log')
        .select('created_at')
        .eq('action', 'invite')
        .gte('created_at', oneHourAgo)
        .order('created_at', { ascending: true })
      if (rateError) throw rateError
      if ((recentInvites?.length ?? 0) >= 2) {
        const retryAt = new Date(
          new Date(recentInvites![0].created_at).getTime() + 60 * 60 * 1000,
        )
        return response(
          {
            error: `Supabase Free email limit reached (2 emails per hour). Try again after ${retryAt.toISOString()}.`,
          },
          429,
        )
      }
      const email =
        typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
      const fullName =
        typeof body.fullName === 'string' ? body.fullName.trim() : ''
      const role = body.role
      const workerId =
        typeof body.workerId === 'string' && body.workerId
          ? body.workerId
          : null
      const redirectTo =
        typeof body.redirectTo === 'string' &&
        allowedInvitationRedirects.has(body.redirectTo)
          ? body.redirectTo
          : undefined
      if (!email || !fullName || !isRole(role))
        return response(
          { error: 'Email, name, and a valid role are required' },
          400,
        )
      if (!redirectTo)
        return response(
          { error: 'The invitation return address is not allowed' },
          400,
        )

      const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
        data: { full_name: fullName },
        redirectTo,
      })
      if (error) throw error
      const userId = data.user.id
      let resolvedWorkerId = role === 'owner' ? null : workerId
      if (role !== 'owner' && !resolvedWorkerId) {
        const { data: existingWorker, error: findError } = await admin
          .from('workers')
          .select('id')
          .ilike('email', email)
          .limit(1)
          .maybeSingle()
        if (findError) throw findError
        if (existingWorker) resolvedWorkerId = existingWorker.id
        else {
          const { data: createdWorker, error: createError } = await admin
            .from('workers')
            .insert({ name: fullName, email, role, status: 'available' })
            .select('id')
            .single()
          if (createError) {
            await admin.auth.admin.deleteUser(userId)
            throw createError
          }
          resolvedWorkerId = createdWorker.id
        }
      }
      const { error: profileError } = await admin.from('profiles').upsert({
        id: userId,
        full_name: fullName,
        role,
        worker_id: resolvedWorkerId,
      })
      if (profileError) {
        await admin.auth.admin.deleteUser(userId)
        throw profileError
      }
      await admin.from('security_audit_log').insert({
        actor_id: callerId,
        action: 'invite',
        entity_type: 'profile',
        entity_id: userId,
      })
      return response(
        {
          member: {
            id: userId,
            email,
            fullName,
            role,
            status: 'invited',
            workerId: resolvedWorkerId,
            createdAt: data.user.created_at,
          },
        },
        201,
      )
    }

    const userId = typeof body.userId === 'string' ? body.userId : ''
    if (!userId) return response({ error: 'A user is required' }, 400)
    if (userId === callerId)
      return response(
        { error: 'You cannot change or disable your own owner access' },
        400,
      )

    if (action === 'update') {
      const role = body.role
      let workerId =
        typeof body.workerId === 'string' && body.workerId
          ? body.workerId
          : null
      if (!isRole(role)) return response({ error: 'Choose a valid role' }, 400)
      if (role === 'owner') workerId = null
      if (role !== 'owner' && !workerId) {
        const { data: authUser, error: authUserError } =
          await admin.auth.admin.getUserById(userId)
        if (authUserError) throw authUserError
        const email = authUser.user.email?.trim().toLowerCase() ?? ''
        const fullName =
          authUser.user.user_metadata?.full_name ||
          email.split('@')[0] ||
          'Worker'
        const { data: existingWorker, error: findError } = await admin
          .from('workers')
          .select('id')
          .ilike('email', email)
          .limit(1)
          .maybeSingle()
        if (findError) throw findError
        if (existingWorker) workerId = existingWorker.id
        else {
          const { data: createdWorker, error: createError } = await admin
            .from('workers')
            .insert({ name: fullName, email, role, status: 'available' })
            .select('id')
            .single()
          if (createError) throw createError
          workerId = createdWorker.id
        }
      }
      const { data: profile, error: profileError } = await admin
        .from('profiles')
        .update({ role, worker_id: workerId })
        .eq('id', userId)
        .select('id')
        .single()
      if (profileError || !profile)
        throw profileError ?? new Error('Profile was not found')
      await admin.from('security_audit_log').insert({
        actor_id: callerId,
        action: 'access_update',
        entity_type: 'profile',
        entity_id: userId,
      })
      return response({ success: true })
    }

    if (action === 'set-disabled') {
      if (typeof body.disabled !== 'boolean')
        return response({ error: 'Disabled state is required' }, 400)
      const { error: profileError } = await admin
        .from('profiles')
        .update({
          disabled_at: body.disabled ? new Date().toISOString() : null,
        })
        .eq('id', userId)
      if (profileError) throw profileError
      const { error } = await admin.auth.admin.updateUserById(userId, {
        ban_duration: body.disabled ? '876000h' : 'none',
      })
      if (error) throw error
      await admin.from('security_audit_log').insert({
        actor_id: callerId,
        action: body.disabled ? 'disable' : 'restore',
        entity_type: 'profile',
        entity_id: userId,
      })
      return response({ success: true })
    }

    if (action === 'cancel-invitation') {
      const { data, error: userError } =
        await admin.auth.admin.getUserById(userId)
      if (userError) throw userError
      if (data.user.email_confirmed_at)
        return response(
          { error: 'Only pending invitations can be cancelled' },
          400,
        )
      const { error } = await admin.auth.admin.deleteUser(userId)
      if (error) throw error
      await admin.from('security_audit_log').insert({
        actor_id: callerId,
        action: 'cancel_invitation',
        entity_type: 'profile',
        entity_id: userId,
      })
      return response({ success: true })
    }

    if (action === 'delete-account') {
      const { data, error: userError } =
        await admin.auth.admin.getUserById(userId)
      if (userError) throw userError
      const { error } = await admin.auth.admin.deleteUser(userId)
      if (error) throw error
      await admin.from('security_audit_log').insert({
        actor_id: callerId,
        action: 'delete_account',
        entity_type: 'profile',
        entity_id: data.user.id,
      })
      return response({ success: true })
    }

    return response({ error: 'Unknown action' }, 400)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unexpected server error'
    return response({ error: message }, 400)
  }
})
