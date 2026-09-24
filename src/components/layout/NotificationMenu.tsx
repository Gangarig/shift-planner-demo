import { useEffect, useState } from 'react'
import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Menu,
  Stack,
  Text,
} from '@mantine/core'
import { notifications as toast } from '@mantine/notifications'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { errorMessage } from '../../lib/plannerRules'
import {
  loadNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../services/notificationService'
import type { AppNotification } from '../../types/AppNotification'

export default function NotificationMenu() {
  const { user } = useAuth()
  const [items, setItems] = useState<AppNotification[]>([])
  async function refresh() {
    try {
      setItems(await loadNotifications())
    } catch (error) {
      toast.show({
        color: 'red',
        title: 'Notifications failed',
        message: errorMessage(error),
      })
    }
  }
  useEffect(() => {
    if (!user) return
    let active = true
    void loadNotifications()
      .then((data) => {
        if (active) setItems(data)
      })
      .catch((error) => {
        if (active)
          toast.show({
            color: 'red',
            title: 'Notifications failed',
            message: errorMessage(error),
          })
      })
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${user.id}`,
        },
        () => {
          void refresh()
        },
      )
      .subscribe()
    return () => {
      active = false
      void supabase.removeChannel(channel)
    }
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!user) return null
  const unread = items.filter((item) => !item.read_at).length
  return (
    <Menu width={320} position="bottom-end" shadow="md">
      <Menu.Target>
        <ActionIcon
          variant="subtle"
          size="lg"
          aria-label={`${unread} unread notifications`}
          className="notification-button"
        >
          🔔
          {unread > 0 && (
            <Badge size="xs" circle className="notification-count">
              {unread > 9 ? '9+' : unread}
            </Badge>
          )}
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown className="notification-menu">
        <Group justify="space-between" px="xs" py={4}>
          <Text fw={700}>Notifications</Text>
          {unread > 0 && (
            <Button
              size="compact-xs"
              variant="subtle"
              onClick={() => void markAllNotificationsRead().then(refresh)}
            >
              Mark all read
            </Button>
          )}
        </Group>
        <Menu.Divider />
        {items.length ? (
          items.map((item) => (
            <Menu.Item
              key={item.id}
              className={item.read_at ? '' : 'notification-unread'}
              onClick={() => {
                if (!item.read_at)
                  void markNotificationRead(item.id).then(refresh)
              }}
            >
              <Stack gap={1}>
                <Text size="sm" fw={item.read_at ? 500 : 700}>
                  {item.title}
                </Text>
                <Text size="xs" c="dimmed">
                  {item.body}
                </Text>
                <Text size="xs" c="dimmed">
                  {new Date(item.created_at).toLocaleString()}
                </Text>
              </Stack>
            </Menu.Item>
          ))
        ) : (
          <Text size="sm" c="dimmed" p="md" ta="center">
            No notifications yet.
          </Text>
        )}
      </Menu.Dropdown>
    </Menu>
  )
}
