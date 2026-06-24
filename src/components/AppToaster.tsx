import { Toaster } from 'react-hot-toast'

export function AppToaster() {
  return (
    <Toaster
      position="top-center"
      containerClassName="!top-[max(0.75rem,env(safe-area-inset-top))]"
      toastOptions={{
        duration: 3500,
        style: {
          borderRadius: '14px',
          background: '#ffffff',
          color: '#0f172a',
          boxShadow: '0 20px 40px rgba(15, 23, 42, 0.12)',
          border: '1px solid rgba(148, 163, 184, 0.35)',
          maxWidth: '22rem',
        },
      }}
    />
  )
}
