import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '@/components/language-switcher'
import { BibleSettings } from '@/components/Settings/BibleSettings'
import { DisplaySettings } from '@/components/Settings/DisplaySettings'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BookOpen, Monitor, Globe } from 'lucide-react'

const Settings = () => {
  const { t } = useTranslation()

  return (
    <div className="h-full flex flex-col">
      {/* Fixed header */}
      <div className="shrink-0 border-b px-6 py-4">
        <h1 className="text-2xl font-bold">{t('nav.settings')}</h1>
        <p className="text-muted-foreground text-sm">
          {t('settings.subtitle', 'Manage your application preferences')}
        </p>
      </div>

      <Tabs defaultValue="display" className="flex flex-col flex-1 min-h-0">
        {/* Sticky tab bar */}
        <div className="shrink-0 px-6 pt-4 pb-0">
          <TabsList>
            <TabsTrigger value="display" className="gap-2">
              <Monitor className="h-4 w-4" />
              {t('settings.tabDisplay', 'Display')}
            </TabsTrigger>
            <TabsTrigger value="bible" className="gap-2">
              <BookOpen className="h-4 w-4" />
              {t('settings.tabBible', 'Bible')}
            </TabsTrigger>
            <TabsTrigger value="language" className="gap-2">
              <Globe className="h-4 w-4" />
              {t('settings.tabLanguage', 'Language')}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Scrollable content — each TabsContent scrolls independently */}
        <div className="min-h-0">
          <TabsContent value="display" className="mt-0 p-6 w-full">
            <DisplaySettings />
          </TabsContent>

          <TabsContent value="bible" className="mt-0 p-6 max-w-3xl">
            <div className="space-y-6">
              <div className="rounded-lg border bg-card p-6">
                <h3 className="text-lg font-semibold mb-4">
                  {t('settings.bibleTranslation', 'Bible Translation')}
                </h3>
                <BibleSettings />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="language" className="mt-0 p-6 max-w-3xl">
            <div className="space-y-6">
              <div className="rounded-lg border bg-card p-6">
                <h3 className="text-lg font-semibold mb-4">
                  {t('settings.languageTitle', 'Interface Language')}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t(
                    'settings.languageDesc',
                    'Choose your preferred language for the application interface'
                  )}
                </p>
                <LanguageSwitcher />
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

export default Settings
