export interface Station {
  id: string
  name: string
  active: boolean
  defaultStartTime?: string | null
  defaultEndTime?: string | null
}

export type NewStation = Omit<Station, 'id'>
