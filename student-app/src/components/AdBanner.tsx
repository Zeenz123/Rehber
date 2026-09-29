import React, { useEffect } from 'react';

interface AdBannerProps {
  className?: string;
  format?: 'banner' | 'rectangle';
  adSlot?: string;
}

export function AdBanner({ className = '', format = 'banner', adSlot }: AdBannerProps) {
  const containerClass = format === 'banner' ? 'w-full min-h-[100px]' : 'w-full max-w-[300px] min-h-[250px] mx-auto';
  
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense error", e);
    }
  }, []);

  return (
    <div className={`relative overflow-hidden bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-center text-center shadow-sm ${containerClass} ${className}`}>
      {/* Ad Label */}
      <div className="absolute top-0 left-0 bg-slate-200 text-slate-500 text-[9px] font-bold px-2 py-0.5 rounded-br-lg uppercase tracking-wider z-10">
        Advertisement
      </div>
      
      {/* Google AdSense */}
      <ins 
        className="adsbygoogle" 
        style={{ display: 'block', minWidth: '100%', minHeight: '100%' }} 
        data-ad-client="ca-pub-7978539936370287" 
        {...(adSlot ? { 'data-ad-slot': adSlot } : {})}
        data-ad-format="auto" 
        data-full-width-responsive="true"
      />
    </div>
  );
}
