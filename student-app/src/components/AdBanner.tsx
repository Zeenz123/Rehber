import React from 'react';
import { Sparkles, ExternalLink } from 'lucide-react';

interface AdBannerProps {
  className?: string;
  format?: 'banner' | 'rectangle';
}

export function AdBanner({ className = '', format = 'banner' }: AdBannerProps) {
  const containerClass = format === 'banner' ? 'w-full min-h-[100px]' : 'w-full max-w-[300px] min-h-[250px] mx-auto';
  
  return (
    <div className={`relative overflow-hidden bg-slate-100 border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-sm ${containerClass} ${className}`}>
      {/* Ad Label */}
      <div className="absolute top-0 left-0 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-br-lg uppercase tracking-wider">
        Advertisement
      </div>
      
      <div className="mt-2 flex flex-col items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
        <div className="bg-sky-100 p-2 rounded-full text-sky-600">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-slate-700 text-sm">Sponsored: Learn Coding Fast</h4>
          <p className="text-xs text-slate-500 max-w-[250px]">
            Master React, Node, and Python with our comprehensive online bootcamp.
          </p>
        </div>
        <button className="mt-1 flex items-center gap-1 text-xs font-semibold text-sky-600 bg-sky-50 px-3 py-1.5 rounded-full hover:bg-sky-100 transition-colors cursor-pointer">
          Learn More <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      {/* Placeholder for actual Google AdSense / AdMob scripts later */}
      {/* <ins className="adsbygoogle" style={{ display: 'block' }} data-ad-client="ca-pub-XXXXXX" data-ad-slot="XXXXXX" data-ad-format="auto" data-full-width-responsive="true"></ins> */}
    </div>
  );
}
