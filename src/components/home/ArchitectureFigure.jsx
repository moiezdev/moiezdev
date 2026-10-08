import { lazy } from 'react';
import WindowChrome from '../ui/WindowChrome';
import WhenNear from '../ui/WhenNear';
import { useContent } from '../../i18n/content';

// the diagram's code loads only as it approaches the viewport
const ArchitectureGraph = lazy(() => import('./ArchitectureGraph'));

/** TWLM's system architecture in a window frame, lazy-loaded near the viewport. */
const ArchitectureFigure = ({ className = '' }) => {
  const { t } = useContent();
  return (
    <WindowChrome title="system-architecture.ts" meta={t('process.live')} className={className}>
      <div className="blueprint p-5 md:p-10">
        <WhenNear minHeight={420}>
          <ArchitectureGraph
            titles={{
              clients: t('process.layers.clients'),
              api: t('process.layers.api'),
              services: t('process.layers.services'),
              data: t('process.layers.data'),
            }}
          />
        </WhenNear>
        <div className="mt-10 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] text-label-2 max-w-2xl">{t('process.caption')}</p>
          <p className="text-[12px] text-label-3">
            <span className="hidden [@media(hover:hover)]:inline">{t('process.hint')}</span>
            <span className="[@media(hover:hover)]:hidden">{t('process.hintTouch')}</span>
          </p>
        </div>
      </div>
    </WindowChrome>
  );
};

export default ArchitectureFigure;
