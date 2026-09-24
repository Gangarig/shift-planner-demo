import Sidebar from '../components/layout/Sidebar'
import Header from '../components/layout/Header'
import TopNavigation from '../components/layout/TopNavigation'
import BrandLogo from '../components/layout/BrandLogo'
import { AppShell, Burger, Drawer, Group } from '@mantine/core'
import { Outlet } from 'react-router-dom'
import { useDisclosure } from '@mantine/hooks'
import { useLanguage } from '../context/LanguageContext'

function AppLayout() {
  const [opened, { toggle, close }] = useDisclosure()
  const { t } = useLanguage()
  return (
    <AppShell header={{ height: 58 }} padding={{ base: 'xs', sm: 'sm' }}>
      <AppShell.Header>
        <Group
          className="app-header-inner"
          h="100%"
          px={{ base: 'md', sm: 'xl' }}
          justify="space-between"
          wrap="nowrap"
        >
          <Group className="app-header-brand" wrap="nowrap">
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="md"
              size="sm"
            />
            <BrandLogo />
          </Group>
          <TopNavigation />
          <Header />
        </Group>
      </AppShell.Header>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
      <Drawer
        opened={opened}
        onClose={close}
        title={t('navigation')}
        size="xs"
        hiddenFrom="md"
      >
        <Sidebar onNavigate={close} />
      </Drawer>
    </AppShell>
  )
}
export default AppLayout
