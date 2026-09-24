import { Button, Group, Text } from '@mantine/core'
import useApp from '../../hooks/useApp'
export default function PlannerWeekControls() {
  const { monday, weekDays, setSelectedWeekDate } = useApp()
  const move = (days: number) => {
    const date = new Date(monday)
    date.setDate(date.getDate() + days)
    setSelectedWeekDate(date)
  }
  return (
    <Group mb="md">
      <Button
        variant="default"
        aria-label="Previous week"
        onClick={() => move(-7)}
      >
        ←
      </Button>
      <Text size="sm" fw={600}>
        {monday.toLocaleDateString()} – {weekDays[4].date.toLocaleDateString()}
      </Text>
      <Button variant="default" aria-label="Next week" onClick={() => move(7)}>
        →
      </Button>
      <Button variant="subtle" onClick={() => setSelectedWeekDate(new Date())}>
        This week
      </Button>
    </Group>
  )
}
