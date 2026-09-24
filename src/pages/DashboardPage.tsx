import Dashboard from '../components/dashboard/Dashboard'
import WorkerAvailability from '../components/workers/WorkerAvailbility'
import { Stack } from '@mantine/core'
import { useAuth } from '../context/AuthContext'
import WorkerDashboard from '../components/dashboard/WorkerDashboard'

function DashBoardPage() {
  const { user } = useAuth()
  if (user?.role === 'worker')
    return (
      <Stack gap="sm" className="page-container dashboard-page">
        <WorkerDashboard />
      </Stack>
    )
  return (
    <Stack gap="sm" className="page-container dashboard-page">
      <Dashboard />
      <WorkerAvailability />
    </Stack>
  )
}

export default DashBoardPage
