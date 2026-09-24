import { Divider, NavLink, Stack, Text } from '@mantine/core'
import { Link, useLocation } from 'react-router-dom'
import { Fragment } from 'react/jsx-runtime'
import navLinks from '../../data/navigation'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'

interface SidebarProps {
  onNavigate?: () => void
}

function Sidebar({ onNavigate }: SidebarProps) {
  const location = useLocation()
  const { user } = useAuth()
  const { language, t } = useLanguage()
  if (!user) return null
  const items = navLinks
    .filter((link) => link.roles.includes(user.role))
    .map((link) => (
      <Fragment key={link.to}>
        {link.labelKey === 'settings' ? <Divider my="sm" size="sm" /> : null}
        <NavLink
          variant="light"
          component={Link}
          to={link.to}
          label={t(link.labelKey)}
          active={location.pathname === link.to}
          onClick={onNavigate}
        />
      </Fragment>
    ))
  return (
    <Stack gap="xs">
      <Text c="dimmed" fw={700} size="xs" tt="uppercase" px="sm" mt="sm">
        {t('workspace')}
      </Text>
      <Divider my="xs" />
      {items}
      <Divider my="sm" />
      <NavLink
        component="a"
        href={`${import.meta.env.BASE_URL}${language === 'de' ? 'guide-de.html' : 'guide.html'}`}
        target="_blank"
        rel="noopener noreferrer"
        label={t('guide')}
        onClick={onNavigate}
      />
    </Stack>
  )
}

export default Sidebar
