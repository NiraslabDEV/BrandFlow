'use client';

import { useEffect, useState } from 'react';
import { loadGTM } from '@/lib/analytics/track';
import { getPublicTracking } from '@/lib/supabase';

/**
 * Banner de consentimento GDPR em português
 * Cookie: dl_consent (365 dias)
 */
export default function ConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verifica se já tem consentimento
    const consent = document.cookie
      .split('; ')
      .find((row) => row.startsWith('dl_consent='))
      ?.split('=')[1];

    if (consent === 'true') {
      // Já aceitou - carrega scripts
      loadTrackingScripts();
      setIsVisible(false);
    } else if (consent === 'false') {
      // Já rejeitou - não mostra banner
      setIsVisible(false);
    } else {
      // Ainda não decidiu - mostra banner
      setIsVisible(true);
    }
    
    setIsLoading(false);
  }, []);

  const loadTrackingScripts = async () => {
    try {
      const tracking = await getPublicTracking();
      if (tracking) {
        await loadGTM({
          gtmContainerId: tracking.gtm_container_id || null,
          metaPixelId: tracking.meta_pixel_id || null,
          ga4MeasurementId: tracking.ga4_measurement_id || null,
          gadsConversionId: tracking.gads_conversion_id || null,
          gadsConversionLabel: tracking.gads_conversion_label || null,
        });
      }
    } catch (error) {
      console.error('[ConsentBanner] Falha ao carregar tracking:', error);
    }
  };

  const handleAccept = () => {
    // Define cookie por 365 dias
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 365);
    document.cookie = `dl_consent=true; expires=${expiry.toUTCString()}; path=/; SameSite=Lax`;
    
    setIsVisible(false);
    loadTrackingScripts();
  };

  const handleReject = () => {
    // Define cookie por 365 dias
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 365);
    document.cookie = `dl_consent=false; expires=${expiry.toUTCString()}; path=/; SameSite=Lax`;
    
    setIsVisible(false);
  };

  if (isLoading || !isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Privacidade
            </h3>
            <p className="text-xs text-gray-600">
              Usamos cookies e tecnologias de tracking para medir o funil de aquisição
              e melhorar a nossa experiência. Ao aceitar, concorda com o uso de GTM,
              GA4, Meta Pixel e Google Ads.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleReject}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              Rejeitar
            </button>
            <button
              onClick={handleAccept}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-sm"
            >
              Aceitar tudo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}