'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface BackButtonProps {
  className?: string
  variant?: 'outline' | 'ghost' | 'default'
  label?: string
}

export function BackButton({ className, variant = 'ghost', label = 'Back' }: BackButtonProps) {
  const router = useRouter()

  return (
    <Button
      variant={variant}
      size="sm"
      className={className}
      onClick={() => router.back()}
    >
      <ArrowLeft className="mr-2 h-4 w-4" />
      {label}
    </Button>
  )
}
