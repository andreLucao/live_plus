import { createContext, useContext, useState } from 'react'

const FinanceContext = createContext({})

export function FinanceProvider({ children, tenant }) {
  const [data, setData] = useState({
    incomes: [],
    bills: [],
    appointments: [],
    doctors: [],
    patients: [],
    users: [],
    procedures: [],
    isLoading: true,
    error: null
  })

  const fetchAllData = async () => {
    try {
      const [
        incomesResponse,
        billsResponse,
        appointmentsResponse,
        doctorsResponse,
        patientsResponse,
        usersResponse,
        proceduresResponse
      ] = await Promise.all([
        fetch(`/api/${tenant}/income`),
        fetch(`/api/${tenant}/bills`),
        fetch(`/api/${tenant}/appointments`),
        fetch(`/api/${tenant}/users?role=doctor`),
        fetch(`/api/${tenant}/patients`),
        fetch(`/api/${tenant}/users?role=user`),
        fetch(`/api/${tenant}/procedures`)
      ])

      if (!incomesResponse.ok || !billsResponse.ok || !appointmentsResponse.ok || 
          !doctorsResponse.ok || !patientsResponse.ok || !usersResponse.ok || !proceduresResponse.ok) {
        throw new Error('Failed to fetch data')
      }

      const [incomes, bills, appointments, doctors, patients, users, procedures] = await Promise.all([
        incomesResponse.json(),
        billsResponse.json(),
        appointmentsResponse.json(),
        doctorsResponse.json(),
        patientsResponse.json(),
        usersResponse.json(),
        proceduresResponse.json()
      ])

      setData({
        incomes,
        bills,
        appointments,
        doctors,
        patients,
        users,
        procedures,
        isLoading: false,
        error: null
      })
    } catch (error) {
      console.error('Error fetching finance data:', error)
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load financial data'
      }))
    }
  }

  return (
    <FinanceContext.Provider value={{ ...data, fetchAllData }}>
      {children}
    </FinanceContext.Provider>
  )
}

export function useFinance() {
  const context = useContext(FinanceContext)
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider')
  }
  return context
} 