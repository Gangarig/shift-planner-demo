import { Text, Title } from '@mantine/core'

function Unauthorized() {
  return (
    <>
      <Title order={1}>403</Title>
      <Text>You don't have permission.</Text>
    </>
  )
}

export default Unauthorized
