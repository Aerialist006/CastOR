import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Languages } from 'lucide-react'

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
]

export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  const handleChange = (code: string) => {
    i18n.changeLanguage(code)
    localStorage.setItem('language', code)
  }

  return (
    <div className="flex items-center gap-2">
      <Languages className="h-4 w-4 text-muted-foreground" />
      {LANGUAGES.map(({ code, label }) => (
        <Button
          key={code}
          variant={i18n.language === code ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => handleChange(code)}
        >
          {label}
        </Button>
      ))}
    </div>
  )
}