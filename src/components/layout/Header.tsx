import {
  Avatar,
  Badge,
  Button,
  Group,
  Select,
  Stack,
  Switch,
  Text,
  useMantineColorScheme,
} from '@mantine/core'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import NotificationMenu from './NotificationMenu'

function Header() {
  const { user, signOut } = useAuth()
  const { colorScheme, setColorScheme } = useMantineColorScheme()
  const { language, setLanguage, t } = useLanguage()
  if (!user) return null
  return (
    <Group className="header-actions" gap="sm" wrap="nowrap">
      <Select
        className="language-select"
        aria-label={t('language')}
        value={language}
        data={[
          { value: 'en', label: t('english') },
          { value: 'de', label: t('german') },
        ]}
        onChange={(value) => setLanguage(value === 'de' ? 'de' : 'en')}
        size="xs"
        w={88}
        allowDeselect={false}
      />
      <Switch
        checked={colorScheme === 'dark'}
        onChange={(event) =>
          setColorScheme(event.currentTarget.checked ? 'dark' : 'light')
        }
        label={colorScheme === 'dark' ? t('dark') : t('light')}
        aria-label={t('toggleColorScheme')}
      />
      <NotificationMenu />
      <Avatar visibleFrom="sm" color="blue" radius="xl">
        {user.name.slice(0, 2).toUpperCase()}
      </Avatar>
      <Stack gap={1} visibleFrom="sm">
        <Text size="sm" fw={600}>
          {user.name}
        </Text>
        <Badge size="xs" variant="light">
          {user.role}
        </Badge>
      </Stack>
      <Button
        className="logout-button"
        size="compact-sm"
        variant="subtle"
        color="gray"
        onClick={() => void signOut()}
      >
        {t('logOut')}
      </Button>
    </Group>
  )
}
export default Header
