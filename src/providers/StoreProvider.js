'use client'

import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { store, persistor } from '@/store/store'

export default function StoreProvider({ children }) {
  if (!persistor) {
    return <Provider store={store}>{children}</Provider>
  }

  return (
    <Provider store={store}>
      <PersistGate persistor={persistor} loading={children}>
        {children}
      </PersistGate>
    </Provider>
  )
}
