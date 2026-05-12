'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faChevronLeft, faChevronRight, faLocationDot, faCalendarAlt, faCheckCircle, faHeart } from '@fortawesome/free-solid-svg-icons';

const heroEvents = [
  { id: 1, name: 'World Cup', date: 'Jun 11 - Jul 19', image: 'https://media.stubhubstatic.com/stubhub-v2-catalog/d_vgg-defaultLogo.jpg/f_auto,g_center,w_272,h_352,c_pad,b_auto/categories/278322/6579691', path: '/world-cup' },
  { id: 2, name: 'BTS', date: 'May 09 - Oct 31', image: 'https://media.stubhubstatic.com/stubhub-v2-catalog/d_vgg-defaultLogo.jpg/f_auto,g_center,w_272,h_352,c_fill/categories/33253/6563719', path: '/bts' },
  { id: 3, name: 'Olivia Rodrigo', date: 'Sep 25 - May 10 2027', image: 'https://media.stubhubstatic.com/stubhub-v2-catalog/d_vgg-defaultLogo.jpg/f_auto,g_center,w_272,h_352,c_fill/categories/398697/6582850', path: '/olivia-rodrigo' },
  { id: 4, name: 'Morgan Wallen', date: 'May 09 - Aug 01', image: 'https://media.stubhubstatic.com/stubhub-v2-catalog/d_vgg-defaultLogo.jpg/f_auto,g_center,w_272,h_352,c_fill/categories/58950/6437782', path: '/morgan-wallen' },
  { id: 5, name: 'Bruno Mars', date: 'May 09 - Dec 08', image: 'https://media.stubhubstatic.com/stubhub-v2-catalog/d_vgg-defaultLogo.jpg/f_auto,g_center,w_272,h_352,c_fill/categories/20519/6583095', path: '/bruno-mars' },
  { id: 6, name: 'New York Knicks', date: 'May 10 - Jun 19', image: 'https://media.stubhubstatic.com/stubhub-v2-catalog/d_vgg-defaultLogo.jpg/f_auto,g_center,w_272,h_352,c_fill/categories/5662/6428579', path: '/knicks' },
  { id: 7, name: 'Usher', date: 'Jun 26 - Dec 12', image: 'https://media.stubhubstatic.com/stubhub-v2-catalog/d_vgg-defaultLogo.jpg/f_auto,g_center,w_272,h_352,c_fill/categories/12062/6395622', path: '/usher' },
  { id: 8, name: 'UFC', date: 'May 09 - Aug 15', image: 'https://media.stubhubstatic.com/stubhub-v2-catalog/d_vgg-defaultLogo.jpg/f_auto,g_center,w_272,h_352,c_fill/categories/4911/6485995', path: '/ufc' },
];

const categories = [
  { name: 'All types', active: true },
  { name: 'Sports', active: false },
  { name: 'Concerts', active: false },
  { name: 'Theater', active: false },
  { name: 'Comedy', active: false },
];

const recommendedEvents = [
  { id: 101, name: 'World Cup', date: 'Jun 13 - Jul 19', events: '21 events near you', image: 'https://media.stubhubstatic.com/stubhub-v2-catalog/d_vgg-defaultLogo.jpg/t_f-fs-0fv,q_auto:low,f_auto,c_fill,w_280,h_180/categories/278322/6579691' },
  { id: 102, name: 'Bruno Mars', date: 'Aug 21 - Sep 06', events: '8 events near you', image: 'https://media.stubhubstatic.com/stubhub-v2-catalog/d_vgg-defaultLogo.jpg/t_f-fs-0fv,q_auto:low,f_auto,c_fill,w_280,h_180/categories/20519/6583095' },
  { id: 103, name: 'Radio City Christmas Spectacular', date: 'Nov 04 - Jan 04', events: '233 events near you', image: 'https://media.stubhubstatic.com/stubhub-v2-catalog/d_vgg-defaultLogo.jpg/t_f-fs-0fv,q_auto:low,f_auto,c_fill,w_280,h_180/categories/7898/6318395' },
  { id: 104, name: 'Karol G', date: 'Sep 12 - Sep 18', events: '3 events near you', image: 'https://media.stubhubstatic.com/stubhub-v2-catalog/d_vgg-defaultLogo.jpg/t_f-fs-0fv,q_auto:low,f_auto,c_fill,w_280,h_180/categories/64013/6424506' },
  { id: 105, name: 'New York Yankees', date: 'May 18 - Sep 27', events: '73 events near you', image: 'https://media.stubhubstatic.com/stubhub-v2-catalog/d_vgg-defaultLogo.jpg/t_f-fs-0fv,q_auto:low,f_auto,c_fill,w_280,h_180/categories/6017/6319682' },
];

const trendingEvents = [
  { id: 201, name: 'Wicked The Musical', date: 'May 08 - Dec 20', events: '288 events near you', image: 'https://media.stubhubstatic.com/stubhub-v2-catalog/d_vgg-defaultLogo.jpg/t_f-fs-0fv,q_auto:low,f_auto,c_fill,w_280,h_180/categories/3682/6381205' },
  { id: 202, name: 'Usher', date: 'Aug 07 - Aug 17', events: '3 events near you', image: 'https://media.stubhubstatic.com/stubhub-v2-catalog/d_vgg-defaultLogo.jpg/t_f-fs-0fv,q_auto:low,f_auto,c_fill,w_280,h_180/categories/12062/6395622' },
  { id: 203, name: 'Morgan Wallen', date: 'Jul 17 - Aug 01', events: '4 events near you', image: 'https://media.stubhubstatic.com/stubhub-v2-catalog/d_vgg-defaultLogo.jpg/t_f-fs-0fv,q_auto:low,f_auto,c_fill,w_280,h_180/categories/58950/6437782' },
  { id: 204, name: 'New York Knicks', date: 'May 12 - Jun 19', events: '13 events near you', image: 'https://media.stubhubstatic.com/stubhub-v2-catalog/d_vgg-defaultLogo.jpg/t_f-fs-0fv,q_auto:low,f_auto,c_fill,w_280,h_180/categories/5662/6428579' },
  { id: 205, name: 'Mac DeMarco', date: 'Oct 24 - Oct 26', events: '3 events near you', image: 'https://media.stubhubstatic.com/stubhub-v2-catalog/d_vgg-defaultLogo.jpg/t_f-fs-0fv,q_auto:low,f_auto,c_fill,w_280,h_180/categories/29341/6582004' },
];

const concertEvents = [
  { id: 301, name: 'Ed Sheeran', date: 'Sep 04 - Sep 26', events: '5 events near you', image: 'https://media.stubhubstatic.com/stubhub-v2-catalog/d_vgg-defaultLogo.jpg/t_f-fs-0fv,q_auto:low,f_auto,c_fill,w_280,h_180/categories/21043/6573413' },
  { id: 302, name: 'Zach Bryan', date: 'Sep 18 - Oct 03', events: '4 events near you', image: 'https://media.stubhubstatic.com/stubhub-v2-catalog/d_vgg-defaultLogo.jpg/t_f-fs-0fv,q_auto:low,f_auto,c_fill,w_280,h_180/categories/351612/6416377' },
  { id: 303, name: 'Kid Cudi', date: 'May 30 - Jun 05', events: '4 events near you', image: 'https://media.stubhubstatic.com/stubhub-v2-catalog/d_vgg-defaultLogo.jpg/t_f-fs-0fv,q_auto:low,f_auto,c_fill,w_280,h_180/categories/14710/6579056' },
  { id: 304, name: 'Teddy Swims', date: 'Jun 04 - Oct 10', events: '3 events near you', image: 'https://media.stubhubstatic.com/stubhub-v2-catalog/d_vgg-defaultLogo.jpg/t_f-fs-0fv,q_auto:low,f_auto,c_fill,w_280,h_180/categories/174983/6586853' },
];

function CarouselSection({ title, events, isHero = false }: { title?: string, events: any[], isHero?: boolean }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <section className={`relative group/section overflow-hidden ${isHero ? 'mb-6 py-6' : 'mb-12'}`}>
      <div className="container mx-auto px-4">
        {title && (
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-[#001B41]">{title}</h2>
            <button className="text-[#89CF28] font-bold text-sm hover:underline">View All</button>
          </div>
        )}

        <div className="relative">
          <div
            ref={scrollRef}
            className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4 snap-x"
          >
            {events.map((event) => (
              <Link
                key={event.id}
                href={isHero ? event.path : `/ticket-details/${event.id}`}
                className={`${isHero ? 'min-w-[220px] md:min-w-[272px]' : 'min-w-[260px] md:min-w-[300px]'} bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-100 flex-shrink-0 group/card snap-start relative`}
              >
                <div className={`relative ${isHero ? 'h-[280px] md:h-[352px]' : 'aspect-[16/10]'} overflow-hidden`}>
                  <img
                    src={event.image}
                    alt={event.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                  {isHero ? (
                    <div className="absolute bottom-6 left-6 right-6 text-white">
                      <h3 className="text-xl md:text-2xl font-bold mb-1 leading-tight">{event.name}</h3>
                      <p className="text-xs md:text-sm font-medium opacity-90">{event.date}</p>
                    </div>
                  ) : (
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-[#001B41]">
                      <FontAwesomeIcon icon={faHeart} className="mr-1.5" />
                      Follow
                    </div>
                  )}

                  {isHero && (
                    <button className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/40 transition-colors">
                      <FontAwesomeIcon icon={faHeart} className="text-lg" />
                    </button>
                  )}
                </div>
                {!isHero && (
                  <div className="p-4">
                    <h3 className="font-bold text-[#001B41] text-lg mb-1 truncate">{event.name}</h3>
                    <p className="text-gray-500 text-sm mb-2">{event.date}</p>
                    <div className="flex items-center text-[#89CF28] font-bold text-xs uppercase tracking-tight">
                      <span className="bg-[#89CF28]/10 px-2 py-0.5 rounded mr-2">{event.events}</span>
                    </div>
                  </div>
                )}
              </Link>
            ))}
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={() => scroll('left')}
            className="absolute -left-4 top-[45%] -translate-y-1/2 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center text-[#001B41] opacity-0 group-hover/section:opacity-100 transition-opacity z-10 border border-gray-100"
          >
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <button
            onClick={() => scroll('right')}
            className="absolute -right-4 top-[45%] -translate-y-1/2 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center text-[#001B41] opacity-0 group-hover/section:opacity-100 transition-opacity z-10 border border-gray-100"
          >
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      </div>
    </section>
  );
}

export default function ViagogoHome() {
  return (
    <main className="pt-[140px] lg:pt-[170px] bg-white min-h-screen pb-12">
      {/* Hero Carousel Section - The slidable content on top of filter */}
      <CarouselSection events={heroEvents} isHero={true} />

      {/* Filter Bar */}
      <section className="bg-[#f8f9fa] border-y border-gray-100 py-5 mb-12">
        <div className="container mx-auto px-4 flex flex-wrap items-center justify-between gap-6">
          <div className="flex space-x-3 overflow-x-auto scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.name}
                className={`px-6 py-2.5 rounded-full text-[13px] font-bold whitespace-nowrap transition-all ${cat.active
                  ? 'bg-[#001B41] text-white'
                  : 'bg-white border border-gray-200 text-[#53575A] hover:bg-gray-50 shadow-sm'
                  }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            <button className="flex items-center bg-white border border-gray-200 px-5 py-2.5 rounded-full text-sm font-bold text-[#53575A] hover:border-black transition-colors shadow-sm">
              <FontAwesomeIcon icon={faLocationDot} className="mr-3 text-[#001B41]" />
              New York
            </button>
            <button className="flex items-center bg-white border border-gray-200 px-5 py-2.5 rounded-full text-sm font-bold text-[#53575A] hover:border-black transition-colors shadow-sm">
              <FontAwesomeIcon icon={faCalendarAlt} className="mr-3 text-[#001B41]" />
              All dates
            </button>
          </div>
        </div>
      </section>

      {/* Spotify Sync */}
      <section className="container mx-auto px-4 mb-16">
        <div className="bg-[#f2f3f5] rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between">
          <div className="flex flex-col md:flex-row items-center">
            <img src="https://img.vggcdn.net/img/spotify/Spotify_Logo_RGB_Green.png" alt="Spotify" className="h-10 mb-6 md:mb-0 md:mr-10" />
            <div className="text-center md:text-left max-w-lg">
              <h3 className="text-xl md:text-2xl font-bold text-black mb-2">Connect your Spotify account and sync your favorite artists</h3>
              <p className="text-[#53575A] font-medium">Discover events from who you actually listen to</p>
            </div>
          </div>
          <button className="mt-8 md:mt-0 bg-[#1DB954] text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-[#1ed760] transition-all shadow-lg shadow-[#1DB954]/20 active:scale-95">
            Connect Spotify
          </button>
        </div>
      </section>

      {/* Main Carousels */}
      <CarouselSection title="Recommended for you" events={recommendedEvents} />
      <CarouselSection title="Trending Events near you" events={trendingEvents} />
      <CarouselSection title="Concerts" events={concertEvents} />
      <CarouselSection title="Sports" events={recommendedEvents.filter(e => e.name.includes('World') || e.name.includes('Yankees'))} />
      <CarouselSection title="Theater & Comedy" events={trendingEvents.filter(e => e.name.includes('Wicked') || e.name.includes('Mac'))} />

      {/* Download App */}
      <section className="container mx-auto px-4 mb-16">
        <div className="bg-[#001B41] rounded-3xl p-12 md:p-20 flex flex-col md:flex-row items-center justify-between text-white overflow-hidden relative">
          <div className="md:w-1/2 relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Download the viagogo app</h2>
            <p className="text-white/70 text-lg mb-10 max-w-md">Discover your favourite events with ease. Get real-time updates and exclusive offers.</p>
            <div className="flex flex-wrap gap-6">
              <a href="#" className="h-12"><img src="https://img.vggcdn.net/img/apple-app-store-badge/en.svg" alt="App Store" className="h-full" /></a>
              <a href="#" className="h-12"><img src="https://img.vggcdn.net/img/google-play-store-badge/en.png" alt="Google Play" className="h-full" /></a>
            </div>
          </div>
          <div className="md:w-1/3 mt-16 md:mt-0 relative">
            <img
              src="https://img.vggcdn.net/img/assets/home/app-phone-en.png"
              className="w-full max-w-[300px] mx-auto relative z-10"
              alt="Viagogo App"
            />
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-white py-20 border-t border-gray-100">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold text-black mb-10 text-left md:text-center">Get hot events and deals delivered straight to your inbox</h2>
          <form className="flex flex-col md:flex-row gap-4">
            <input
              type="email"
              placeholder="Email address"
              className="flex-1 bg-[#f2f3f5] border-none px-8 py-5 rounded-xl outline-none focus:ring-2 focus:ring-[#89CF28] transition-all text-lg"
            />
            <button className="bg-[#001B41] text-white px-12 py-5 rounded-xl font-bold text-lg hover:bg-black transition-all shadow-xl active:scale-95 whitespace-nowrap">
              Join the List
            </button>
          </form>
          <p className="mt-8 text-[12px] text-gray-400 font-medium text-left md:text-center leading-relaxed">
            By signing in or creating an account, you agree to our <span className="underline cursor-pointer">user agreement</span> and acknowledge our <span className="underline cursor-pointer">privacy policy</span>. You may receive SMS notifications from us and can opt out at any time.
          </p>
        </div>
      </section>
    </main>
  );
}
