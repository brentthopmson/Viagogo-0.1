"use client";

import { useSearchParams } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimesCircle, faExclamationTriangle, faHome } from '@fortawesome/free-solid-svg-icons';

const PLATFORM_CONFIG: Record<string, { url: string; name: string }> = {
  ticketmaster: { url: 'https://www.ticketmaster.com', name: 'Ticketmaster' },
  uefa: { url: 'https://www.uefa.com', name: 'UEFA' },
  viagogo: { url: 'https://www.viagogo.com', name: 'Viagogo' },
};

const DEFAULT = 'viagogo';

export default function InvalidPage() {
  const searchParams = useSearchParams();
  const platform = searchParams.get('platform');
  const config = PLATFORM_CONFIG[platform || DEFAULT] || PLATFORM_CONFIG[DEFAULT];

  return (
    <main className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden text-center p-8 md:p-12 border border-gray-100">
          <div className="mb-8 relative inline-block">
             <div className="bg-red-50 text-red-500 w-24 h-24 rounded-full flex items-center justify-center mx-auto shadow-inner">
               <FontAwesomeIcon icon={faTimesCircle} className="text-5xl" />
             </div>
             <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-white w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-md">
               <FontAwesomeIcon icon={faExclamationTriangle} className="text-sm" />
             </div>
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold text-[#001B41] mb-4 tracking-tight">
            Invalid Transfer Link
          </h2>
          
          <div className="space-y-6">
            <p className="text-gray-600 font-medium leading-relaxed">
              The ticket transfer link you're trying to access is either invalid, has expired, or has already been claimed.
            </p>
            
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
               <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-1">Recommended Action</p>
               <p className="text-sm text-gray-700">Please contact the sender and request a new secure transfer link via {config.name}.</p>
            </div>

            <div className="pt-4 space-y-3">
              <a
                href={config.url}
                target="_blank"
                rel="noopener noreferrer"
                className="viagogo-button-primary w-full flex items-center justify-center shadow-lg"
              >
                <FontAwesomeIcon icon={faHome} className="mr-2" />
                Visit {config.name}
              </a>
              
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                Protected by {config.name} FanProtect Guarantee
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
           <img src="/logo.svg" alt="Viagogo" className="h-6 mx-auto opacity-30 grayscale" />
        </div>
      </div>
    </main>
  );
}
