import type { AppRole } from '../context/AuthContext'
import type { MessageKey } from '../context/LanguageContext'

export interface NavLink {
  labelKey: MessageKey
  to: string
  roles: AppRole[]
}

const navLinks: NavLink[] = [
  {
    labelKey: 'dashboard',
    to: '/',
    roles: ['worker', 'manager', 'admin', 'owner', 'accountant'],
  },
  {
    labelKey: 'planner',
    to: '/planner',
    roles: ['worker', 'manager', 'admin', 'owner', 'accountant'],
  },
  {
    labelKey: 'payroll',
    to: '/payroll',
    roles: ['worker', 'accountant', 'admin', 'owner'],
  },
  { labelKey: 'workers', to: '/workers', roles: ['manager', 'admin', 'owner'] },
  {
    labelKey: 'stations',
    to: '/stations',
    roles: ['manager', 'admin', 'owner'],
  },
  { labelKey: 'team', to: '/team', roles: ['owner'] },
  { labelKey: 'audit', to: '/audit', roles: ['owner'] },
  { labelKey: 'settings', to: '/settings', roles: ['admin', 'owner'] },
]

export default navLinks
