import { Toaster } from 'react-hot-toast'

export function AppToaster() {
  return (
    <Toaster
      position="top-center"
      containerClassName="!top-[max(0.75rem,env(safe-area-inset-top))]"
      toastOptions={{
        duration: 3500,
        style: {
          borderRadius: '12px',
          background: '#ffffff',
          color: '#070b13',
          boxShadow: '0 20px 40px -18px rgba(7, 11, 19, 0.22)',
          border: '1px solid #e4ebf1',
          maxWidth: '22rem',
          fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif',
        },
      }}
    />
  )
}
