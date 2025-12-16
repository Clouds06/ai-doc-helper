import { useState, useEffect } from 'react'
import { IconCheckCircle2, IconAlertCircle, IconInfo } from '@/components/icons'

interface ToastProps {
  message: string
  type: 'success' | 'warning' | 'info'
  onClose: () => void
}

export const Toast = ({ message, type, onClose }: ToastProps) => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onClose, 300)
    }, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  const styles = {
    success: 'bg-green-50 text-green-700 border-green-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200'
  }

  const icons = {
    success: <IconCheckCircle2 className="h-5 w-5" />,
    warning: <IconAlertCircle className="h-5 w-5" />,
    info: <IconInfo className="h-5 w-5" />
  }

  return (
    <div
      className={`fixed top-20 left-1/2 z-[9999] -translate-x-1/2 transform transition-all duration-500 ${visible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`}
    >
      <div
        className={`flex items-center gap-3 rounded-full border-2 px-6 py-3 shadow-2xl ${styles[type]} min-w-[320px] justify-center bg-white/95 backdrop-blur-md`}
      >
        {icons[type]}
        <span className="text-sm font-bold">{message}</span>
      </div>
    </div>
  )
}
