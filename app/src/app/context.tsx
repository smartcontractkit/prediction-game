'use client'

import { createContext, useContext, useState } from 'react'
import { liveGameStatuses } from '@/config/api'
import { Prediction } from '@/types'

export const LocalStateContext = createContext<{
  predictions: Prediction[]
  error: string
  setPredictions: (predictions: Prediction[]) => void
  tab: string
  setTab: (tab: string) => void
}>({
  predictions: [],
  error: '',
  setPredictions: () => null,
  tab: 'betslip',
  setTab: () => null,
})

export const LocalStateContextProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [predictions, setPredictionsState] = useState<Prediction[]>([])
  const [error, setError] = useState('')
  const [tab, setTab] = useState('betslip')

  const setPredictions = (predictions: Prediction[]) => {
    if (predictions.some((p) => liveGameStatuses.includes(p.game.status))) {
      setError('You cannot make predictions for live Games')
      setTimeout(() => setError(''), 5000)
      return
    }
    setPredictionsState(predictions)
  }

  return (
    <LocalStateContext.Provider
      value={{ predictions, error, setPredictions, tab, setTab }}
    >
      {children}
    </LocalStateContext.Provider>
  )
}

export const useLocalStateContext = () => useContext(LocalStateContext)
