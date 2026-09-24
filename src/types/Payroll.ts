export interface OvertimeEntry {
  id: string
  worker_id: string
  work_date: string
  hours: number
  note: string | null
  created_at: string
}

export type LeaveRequestType =
  'vacation' | 'sick_leave' | 'doctor_appointment' | 'other_absence'
export type LeaveRequestStatus = 'pending' | 'approved' | 'rejected'
export interface LeaveRequest {
  id: string
  worker_id: string
  request_type: LeaveRequestType
  start_date: string
  end_date: string
  start_time: string | null
  end_time: string | null
  note: string | null
  status: LeaveRequestStatus
  schedule_status: 'late' | 'sick' | 'holiday' | null
  review_note: string | null
  created_at: string
  updated_at: string
}
export interface PrivateDocument {
  id: string
  object_path: string
  original_name: string
  mime_type: string
  created_at: string
}
export interface PayslipDocument extends PrivateDocument {
  worker_id: string
  payroll_month: string
}
export interface LeaveRequestDocument extends PrivateDocument {
  request_id: string
  verification_status: 'pending' | 'verified' | 'rejected'
}
