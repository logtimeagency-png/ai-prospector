export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight">AI Prospector</h1>
          <p className="text-sm text-muted-foreground mt-1">by LogTime</p>
        </div>
        {children}
      </div>
    </div>
  )
}
