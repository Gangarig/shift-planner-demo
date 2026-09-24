import { supabase } from '../lib/supabase'
import type {
  LeaveRequest,
  LeaveRequestDocument,
  LeaveRequestStatus,
  LeaveRequestType,
  OvertimeEntry,
  PayslipDocument,
} from '../types/Payroll'

export async function loadOvertimeEntries(from: string, to: string) {
  const { data, error } = await supabase
    .from('overtime_entries')
    .select('id,worker_id,work_date,hours,note,created_at')
    .gte('work_date', from)
    .lte('work_date', to)
    .order('work_date', { ascending: false })
  if (error) throw error
  return (data ?? []).map((item) => ({
    ...item,
    hours: Number(item.hours),
  })) as OvertimeEntry[]
}

export async function createOvertimeEntry(value: {
  workerId: string
  date: string
  hours: number
  note: string | null
}) {
  const { error } = await supabase
    .from('overtime_entries')
    .insert({
      worker_id: value.workerId,
      work_date: value.date,
      hours: value.hours,
      note: value.note,
    })
    .select('id')
    .single()
  if (error) throw error
}

export async function removeOvertimeEntry(id: string) {
  const { error } = await supabase
    .from('overtime_entries')
    .delete()
    .eq('id', id)
    .select('id')
    .single()
  if (error) throw error
}

export async function loadLeaveRequests() {
  const { data, error } = await supabase
    .from('leave_requests')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as LeaveRequest[]
}

export async function createLeaveRequest(value: {
  workerId: string
  type: LeaveRequestType
  startDate: string
  endDate: string
  startTime: string | null
  endTime: string | null
  note: string | null
}) {
  const { error } = await supabase
    .from('leave_requests')
    .insert({
      worker_id: value.workerId,
      request_type: value.type,
      start_date: value.startDate,
      end_date: value.endDate,
      start_time: value.startTime,
      end_time: value.endTime,
      note: value.note,
    })
    .select('id')
    .single()
  if (error) throw error
}

export async function reviewLeaveRequest(
  id: string,
  status: Exclude<LeaveRequestStatus, 'pending'>,
  scheduleStatus: 'late' | 'sick' | 'holiday' | null,
  note: string | null,
) {
  const { data, error: userError } = await supabase.auth.getUser()
  if (userError || !data.user)
    throw userError ?? new Error('Sign in is required')
  const { error } = await supabase
    .from('leave_requests')
    .update({
      status,
      schedule_status: status === 'approved' ? scheduleStatus : null,
      review_note: note,
      reviewed_by: data.user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('id')
    .single()
  if (error) throw error
}

export async function loadPayslips() {
  const { data, error } = await supabase
    .from('payslip_documents')
    .select('*')
    .order('payroll_month', { ascending: false })
  if (error) throw error
  return (data ?? []) as PayslipDocument[]
}
export async function loadLeaveDocuments() {
  const { data, error } = await supabase
    .from('leave_request_documents')
    .select('*')
    .order('created_at')
  if (error) throw error
  return (data ?? []) as LeaveRequestDocument[]
}
async function uploadPrivate(path: string, file: File) {
  const { error } = await supabase.storage
    .from('shiftplanner-private')
    .upload(path, file, { contentType: file.type, upsert: false })
  if (error) throw error
}
export async function uploadPayslip(
  workerId: string,
  month: string,
  file: File,
) {
  const id = crypto.randomUUID(),
    path = `payslips/${workerId}/${month}/${id}`
  const { error } = await supabase.from('payslip_documents').insert({
    id,
    worker_id: workerId,
    payroll_month: `${month}-01`,
    object_path: path,
    original_name: file.name,
    mime_type: file.type,
  })
  if (error) throw error
  try {
    await uploadPrivate(path, file)
  } catch (reason) {
    await supabase.from('payslip_documents').delete().eq('id', id)
    throw reason
  }
}
export async function uploadLeaveDocument(requestId: string, file: File) {
  const id = crypto.randomUUID(),
    path = `leave/${requestId}/${id}`
  const { error } = await supabase.from('leave_request_documents').insert({
    id,
    request_id: requestId,
    object_path: path,
    original_name: file.name,
    mime_type: file.type,
  })
  if (error) throw error
  try {
    await uploadPrivate(path, file)
  } catch (reason) {
    await supabase.from('leave_request_documents').delete().eq('id', id)
    throw reason
  }
}
export async function openPrivateDocument(path: string) {
  const { data, error } = await supabase.storage
    .from('shiftplanner-private')
    .createSignedUrl(path, 60)
  if (error) throw error
  window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
}
export async function verifyLeaveDocument(
  id: string,
  status: 'verified' | 'rejected',
) {
  const { data, error: userError } = await supabase.auth.getUser()
  if (userError || !data.user)
    throw userError ?? new Error('Sign in is required')
  const { error } = await supabase
    .from('leave_request_documents')
    .update({
      verification_status: status,
      reviewed_by: data.user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw error
}
