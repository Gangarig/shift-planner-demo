import { Center, Loader } from '@mantine/core'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth, type AppRole } from '../../context/AuthContext'
interface ProtectedRouteProps {
  allowedRoles: AppRole[]
}
function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading)
    return (
      <Center mih="60vh">
        <Loader />
      </Center>
    )
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  if (!allowedRoles.includes(user.role))
    return <Navigate to="/unauthorized" replace />
  return <Outlet />
}
export default ProtectedRoute
