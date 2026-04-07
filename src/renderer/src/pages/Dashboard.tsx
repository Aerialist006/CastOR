import Preview from '@/components/Sections/Preview'
import Schedule from '@/components/Sections/Schedule'
import { BiblePanel } from '@/components/BiblePanel/BiblePanel'
import { useTranslation } from 'react-i18next'

const Dashboard = () => {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col w-full h-full text-sm">
      <div className="w-full flex flex-1 min-h-0">
        <Preview />
        <Schedule />
      </div>
      <section className="lg:h-1/3 border-b flex shrink-0">
        <div className="border-r lg:w-1/4">
          <BiblePanel/>
        </div>
        <div>Section2</div>
      </section>
    </div>
  )
}

export default Dashboard
