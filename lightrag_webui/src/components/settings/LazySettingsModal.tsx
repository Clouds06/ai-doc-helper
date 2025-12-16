import { lazy, Suspense } from 'react'

const SettingsModal = lazy(() => import('./SettingsModal'))

interface LazySettingsModalProps {
  isOpen: boolean
  onClose: () => void
  showToast: (message: string, type: 'success' | 'warning' | 'info') => void
}

export const LazySettingsModal = (props: LazySettingsModalProps) => {
  if (!props.isOpen) return null

  return (
    <Suspense fallback={null}>
      <SettingsModal {...props} />
    </Suspense>
  )
}

export default LazySettingsModal

