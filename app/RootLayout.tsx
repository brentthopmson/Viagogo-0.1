"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPhone, faLock, faTicketAlt, faUser, faSearch, faBell, faHome, faHeart, faTag } from '@fortawesome/free-solid-svg-icons';
import { library } from '@fortawesome/fontawesome-svg-core';
import { UserProvider, useUser } from './UserContext';
import { useEffect, useState } from 'react';

library.add(faPhone, faLock, faTicketAlt, faUser, faSearch, faBell, faHome, faHeart, faTag);

export default function RootLayoutWrapper({
  children,
  inter,
}: {
  children: React.ReactNode;
  inter: { className: string };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { admin, loading } = useUser();
  const [searchQuery, setSearchQuery] = useState('');

  const openViagogoLink = (path: string) => {
    const viagogoBase = 'https://www.viagogo.com';
    const fullUrl = `${viagogoBase}${path}`;
    window.open(fullUrl, '_self');
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query !== '') {
      const searchUrl = `https://www.viagogo.com/search?q=${encodeURIComponent(query)}`;
      window.open(searchUrl, '_self');
    }
  };

  const handleSignOut = () => {
    sessionStorage.removeItem("loggedInAdmin");
    sessionStorage.removeItem("adminData");
    window.location.href = '/login';
  };

  const shouldShowHeaderFooter =
    pathname !== '/account' &&
    pathname !== '/invalid' &&
    pathname !== '/login' &&
    !pathname?.startsWith('/secure/myaccount');

  return (
    <>
      {shouldShowHeaderFooter && (
        <div className="flex flex-col min-h-screen">
          <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
            {/* Top navigation bar */}
            <div className="bg-[#001B41] text-white py-1.5 px-4 hidden lg:block border-b border-white/5">
              <div className="container mx-auto flex justify-end items-center text-[10px] font-bold uppercase tracking-widest">
                <button
                  onClick={() => openViagogoLink('/help')}
                  className="mr-8 hover:text-[#89CF28] transition-colors"
                >
                  Help
                </button>
                
                <button 
                  onClick={() => admin ? router.push('/secure/myaccount/tickets') : openViagogoLink('/member')} 
                  className="flex items-center hover:text-[#89CF28] transition-colors"
                >
                  <FontAwesomeIcon icon={faUser} className="mr-2 text-[12px]" />
                  {admin ? `Hi, ${admin.username}` : 'My Account'}
                </button>
              </div>
            </div>

            {/* Main header */}
            <div className="container mx-auto px-4 py-2 flex items-center bg-white h-[60px] md:h-[70px]">
              {/* Logo */}
              <div className="flex-shrink-0 mr-10">
                <Link href="/" className="flex items-center">
                  <img src="/logo.png" alt="viagogo logo" className="h-[24px] w-auto md:h-[28px]" />
                </Link>
              </div>

              {/* Desktop Nav Links */}
              <div className="hidden lg:flex items-center space-x-8 text-[#53575A] font-bold text-[14px]">
                {['Sports', 'Concerts', 'Theater', 'Top Cities'].map((item) => (
                  <button
                    key={item}
                    onClick={() => openViagogoLink(`/${item.toLowerCase().replace(' ', '-')}`)}
                    className="hover:text-black transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="flex-1"></div>

              {/* Desktop Right Links */}
              <div className="hidden lg:flex items-center space-x-6 text-[#53575A] font-bold text-[14px]">
                <button onClick={() => openViagogoLink('/explore')} className="hover:text-black">Explore</button>
                <button onClick={() => openViagogoLink('/selltickets')} className="hover:text-black">Sell</button>
                <button onClick={() => openViagogoLink('/favorites')} className="hover:text-black">Favorites</button>
                
                {admin ? (
                  <>
                    <button onClick={() => router.push('/secure/myaccount/tickets')} className="hover:text-black">My Tickets</button>
                    <button onClick={handleSignOut} className="hover:text-black text-[#008000]">Sign Out</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => router.push('/login')} className="hover:text-black">My Tickets</button>
                    <button onClick={() => router.push('/login')} className="hover:text-black">Sign In</button>
                  </>
                )}

                <div className="relative">
                  <button className="text-[#53575A] p-2 hover:bg-gray-100 rounded-full transition-colors relative">
                    <FontAwesomeIcon icon={faBell} className="text-xl" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#89CF28] rounded-full border-2 border-white"></span>
                  </button>
                </div>
              </div>

              {/* Mobile Actions */}
              <div className="flex lg:hidden items-center space-x-4">
                <button className="text-black p-2 hover:bg-gray-100 rounded-full transition-colors">
                   <FontAwesomeIcon icon={faSearch} className="text-xl" />
                </button>
                <button className="text-black p-2 hover:bg-gray-100 rounded-full transition-colors relative">
                  <FontAwesomeIcon icon={faBell} className="text-xl" />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-[#89CF28] rounded-full border-2 border-white"></span>
                </button>
                <button 
                  onClick={() => admin ? router.push('/secure/myaccount/tickets') : router.push('/login')}
                  className="text-black p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <FontAwesomeIcon icon={faUser} className="text-xl" />
                </button>
              </div>
            </div>

            {/* Desktop Search Section - Under Header */}
            <div className="hidden lg:block bg-white border-t border-gray-100 py-3">
              <div className="container mx-auto px-4 max-w-2xl">
                <form onSubmit={handleSearchSubmit}>
                  <div className="relative group">
                    <input
                      type="text"
                      placeholder="Search events, artists, teams and more"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#f2f3f5] border-none py-3.5 pl-12 pr-6 rounded-xl text-[15px] font-medium focus:ring-2 focus:ring-[#89CF28] transition-all outline-none"
                    />
                    <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg group-focus-within:text-black" />
                  </div>
                </form>
              </div>
            </div>
            
            {/* Mobile Search Bar */}
            <div className="lg:hidden px-4 pb-3 bg-white">
                <form onSubmit={handleSearchSubmit}>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search events..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#f2f3f5] border-none py-2.5 pl-10 pr-4 rounded-lg text-sm outline-none"
                    />
                    <FontAwesomeIcon icon={faSearch} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </form>
            </div>
          </header>

          <main className={`flex-grow ${shouldShowHeaderFooter ? 'pb-[70px] lg:pb-0' : ''}`}>
            {children}
          </main>

          {/* Mobile Bottom Navigation */}
          <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center z-[100] shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
            <Link href="/" className={`flex flex-col items-center space-y-1 ${pathname === '/' ? 'text-[#89CF28]' : 'text-gray-400'}`}>
              <FontAwesomeIcon icon={faHome} className="text-xl" />
              <span className="text-[10px] font-bold">Home</span>
            </Link>
            <button 
              onClick={() => admin ? router.push('/secure/myaccount/tickets') : router.push('/login')} 
              className={`flex flex-col items-center space-y-1 ${pathname?.startsWith('/secure/myaccount/tickets') ? 'text-[#89CF28]' : 'text-gray-400'}`}
            >
              <FontAwesomeIcon icon={faTicketAlt} className="text-xl" />
              <span className="text-[10px] font-bold">My Tickets</span>
            </button>
            <button onClick={() => openViagogoLink('/favorites')} className="flex flex-col items-center space-y-1 text-gray-400">
              <FontAwesomeIcon icon={faHeart} className="text-xl" />
              <span className="text-[10px] font-bold">Favorites</span>
            </button>
            <button onClick={() => openViagogoLink('/selltickets')} className="flex flex-col items-center space-y-1 text-gray-400">
              <FontAwesomeIcon icon={faTag} className="text-xl" />
              <span className="text-[10px] font-bold">Sell</span>
            </button>
            <button 
              onClick={() => admin ? router.push('/secure/myaccount/tickets') : router.push('/login')}
              className={`flex flex-col items-center space-y-1 ${pathname?.startsWith('/secure/myaccount') && !pathname?.includes('tickets') ? 'text-[#89CF28]' : 'text-gray-400'}`}
            >
              <FontAwesomeIcon icon={faUser} className="text-xl" />
              <span className="text-[10px] font-bold">{admin ? 'Profile' : 'Sign In'}</span>
            </button>
          </nav>

          <footer className="bg-[#001B41] text-white py-16 hidden lg:block">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
                <div>
                  <h4 className="font-bold mb-8 text-[12px] uppercase tracking-widest text-white/50">Buy and Sell</h4>
                  <ul className="space-y-4 text-[14px] font-medium">
                    <li><button onClick={() => openViagogoLink('/help')} className="hover:text-[#89CF28] transition-colors">Help Center</button></li>
                    <li>
                      <button 
                        onClick={() => admin ? handleSignOut() : router.push('/login')} 
                        className="hover:text-[#89CF28] transition-colors"
                      >
                        {admin ? 'Sign Out' : 'Sign In'}
                      </button>
                    </li>
                    <li><button onClick={() => openViagogoLink('/selltickets')} className="hover:text-[#89CF28] transition-colors">Sell Tickets</button></li>
                    <li><button onClick={() => openViagogoLink('/favorites')} className="hover:text-[#89CF28] transition-colors">Favorites</button></li>
                    <li>
                      <button 
                        onClick={() => admin ? router.push('/secure/myaccount/tickets') : openViagogoLink('/secure/myaccount')} 
                        className="hover:text-[#89CF28] transition-colors"
                      >
                        My Tickets
                      </button>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold mb-8 text-[12px] uppercase tracking-widest text-white/50">Popular Events</h4>
                  <ul className="space-y-4 text-[14px] font-medium">
                    <li><button onClick={() => openViagogoLink('/concert-tickets')} className="hover:text-[#89CF28] transition-colors">Concerts</button></li>
                    <li><button onClick={() => openViagogoLink('/sports-tickets')} className="hover:text-[#89CF28] transition-colors">Sports</button></li>
                    <li><button onClick={() => openViagogoLink('/theater-tickets')} className="hover:text-[#89CF28] transition-colors">Theater</button></li>
                    <li><button onClick={() => openViagogoLink('/festival-tickets')} className="hover:text-[#89CF28] transition-colors">Festivals</button></li>
                    <li><button onClick={() => openViagogoLink('/comedy-tickets')} className="hover:text-[#89CF28] transition-colors">Comedy</button></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold mb-8 text-[12px] uppercase tracking-widest text-white/50">About Us</h4>
                  <ul className="space-y-4 text-[14px] font-medium">
                    <li><button onClick={() => openViagogoLink('/about')} className="hover:text-[#89CF28] transition-colors">About viagogo</button></li>
                    <li><button onClick={() => openViagogoLink('/careers')} className="hover:text-[#89CF28] transition-colors">Careers</button></li>
                    <li><button onClick={() => openViagogoLink('/press')} className="hover:text-[#89CF28] transition-colors">Press</button></li>
                    <li><button onClick={() => openViagogoLink('/blog')} className="hover:text-[#89CF28] transition-colors">Blog</button></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold mb-8 text-[12px] uppercase tracking-widest text-white/50">Legal</h4>
                  <ul className="space-y-4 text-[14px] font-medium">
                    <li><button onClick={() => openViagogoLink('/legal/user-agreement')} className="hover:text-[#89CF28] transition-colors">User Agreement</button></li>
                    <li><button onClick={() => openViagogoLink('/legal/privacy-policy')} className="hover:text-[#89CF28] transition-colors">Privacy Policy</button></li>
                    <li><button onClick={() => openViagogoLink('/legal/cookie-policy')} className="hover:text-[#89CF28] transition-colors">Cookie Policy</button></li>
                    <li><button onClick={() => openViagogoLink('/legal/accessibility')} className="hover:text-[#89CF28] transition-colors">Accessibility</button></li>
                  </ul>
                </div>
              </div>
              <div className="border-t border-white/10 pt-10 flex flex-col md:flex-row justify-between items-center text-[12px] text-white/40">
                <div className="flex items-center space-x-6 mb-6 md:mb-0">
                  <p>© 2024 viagogo Entertainment Inc. All rights reserved.</p>
                </div>
                <div className="flex flex-wrap justify-center md:justify-end gap-x-6 gap-y-2">
                   <span>Use of this website constitutes acceptance of the User Agreement and Privacy Policy.</span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      )}
      {!shouldShowHeaderFooter && (
        <div className="pb-[70px] lg:pb-0">
          {children}
          {/* Also show bottom nav on secure account pages for better navigation */}
          {pathname?.startsWith('/secure/myaccount') && (
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center z-[100] shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
              <Link href="/" className={`flex flex-col items-center space-y-1 ${pathname === '/' ? 'text-[#89CF28]' : 'text-gray-400'}`}>
                <FontAwesomeIcon icon={faHome} className="text-xl" />
                <span className="text-[10px] font-bold">Home</span>
              </Link>
              <Link href="/secure/myaccount/tickets" className={`flex flex-col items-center space-y-1 ${pathname?.startsWith('/secure/myaccount/tickets') ? 'text-[#89CF28]' : 'text-gray-400'}`}>
                <FontAwesomeIcon icon={faTicketAlt} className="text-xl" />
                <span className="text-[10px] font-bold">My Tickets</span>
              </Link>
              <button onClick={() => openViagogoLink('/favorites')} className="flex flex-col items-center space-y-1 text-gray-400">
                <FontAwesomeIcon icon={faHeart} className="text-xl" />
                <span className="text-[10px] font-bold">Favorites</span>
              </button>
              <button onClick={() => openViagogoLink('/selltickets')} className="flex flex-col items-center space-y-1 text-gray-400">
                <FontAwesomeIcon icon={faTag} className="text-xl" />
                <span className="text-[10px] font-bold">Sell</span>
              </button>
              <Link href="/secure/myaccount/tickets" className={`flex flex-col items-center space-y-1 ${pathname?.startsWith('/secure/myaccount') && !pathname?.includes('tickets') ? 'text-[#89CF28]' : 'text-gray-400'}`}>
                <FontAwesomeIcon icon={faUser} className="text-xl" />
                <span className="text-[10px] font-bold">Profile</span>
              </Link>
            </nav>
          )}
        </div>
      )}
    </>
  );
}
