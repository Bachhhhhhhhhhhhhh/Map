
import React, { useState, useEffect } from 'react';
import { AppMode, Place } from './types';
import { searchPlacesInHanoi } from './services/geminiService';
import PlaceCard from './components/PlaceCard';
import LiveAudio from './components/LiveAudio';
import ImageEditor from './components/ImageEditor';
import VideoCreator from './components/VideoCreator';
import MapView from './components/MapView';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.FEED);
  const [places, setPlaces] = useState<Place[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [groundingLinks, setGroundingLinks] = useState<any[]>([]);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setLoadingStep('Searching for real spots in Hanoi...');
    try {
      // Small timeout to show the first step
      await new Promise(r => setTimeout(r, 500));
      setLoadingStep('Finding specific details for each place...');
      
      const { places: result, groundings } = await searchPlacesInHanoi(searchQuery || 'Top trending spots');
      
      setLoadingStep('Generating high-quality specific photos...');
      setPlaces(result);
      setGroundingLinks(groundings);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  useEffect(() => {
    handleSearch();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Pinterest-style Sticky Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md px-4 md:px-8 py-4 flex items-center space-x-4 border-b border-gray-100">
        <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white font-bold cursor-pointer shrink-0" onClick={() => setMode(AppMode.FEED)}>
          H
        </div>
        
        <nav className="hidden md:flex space-x-2 font-semibold">
          <button 
            onClick={() => setMode(AppMode.FEED)}
            className={`px-4 py-2 rounded-full transition-colors ${mode === AppMode.FEED ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-800'}`}
          >
            Explore
          </button>
          <button 
            onClick={() => setMode(AppMode.MAP)}
            className={`px-4 py-2 rounded-full transition-colors ${mode === AppMode.MAP ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-800'}`}
          >
            Map
          </button>
          <button 
            onClick={() => setMode(AppMode.IMAGE_EDIT)}
            className={`px-4 py-2 rounded-full transition-colors ${mode === AppMode.IMAGE_EDIT ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-800'}`}
          >
            AI Editor
          </button>
          <button 
            onClick={() => setMode(AppMode.VIDEO_GEN)}
            className={`px-4 py-2 rounded-full transition-colors ${mode === AppMode.VIDEO_GEN ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-800'}`}
          >
            Cinema
          </button>
        </nav>

        <form className="flex-grow max-w-2xl relative" onSubmit={handleSearch}>
          <button 
            type="submit" 
            disabled={loading}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
            title="Search"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </button>
          <input 
            type="text" 
            placeholder="Search for Bun Cha, Cafes in West Lake..."
            className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-full border-2 border-transparent focus:border-gray-200 focus:bg-white outline-none transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        <div className="flex items-center space-x-3 shrink-0">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200">
            <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          </div>
          <img src="https://picsum.photos/100" className="w-10 h-10 rounded-full cursor-pointer" alt="Profile" />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="px-4 md:px-8 py-8">
        {mode === AppMode.FEED && (
          <>
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-center">
                  <p className="text-gray-800 font-bold text-lg animate-pulse">{loadingStep}</p>
                  <p className="text-gray-400 text-sm">Please wait, creating your visual guide...</p>
                </div>
              </div>
            ) : (
              <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-6 masonry-grid animate-in fade-in slide-in-from-bottom-4 duration-1000">
                {places.map((place) => (
                  <PlaceCard key={place.id} place={place} />
                ))}
              </div>
            )}
          </>
        )}

        {mode === AppMode.MAP && (
          <div className="animate-in fade-in duration-500">
            <MapView places={places} />
          </div>
        )}

        {mode === AppMode.IMAGE_EDIT && <ImageEditor />}
        {mode === AppMode.VIDEO_GEN && <VideoCreator />}

        {/* Grounding Sources (Shown in Feed and Map) */}
        {!loading && (mode === AppMode.FEED || mode === AppMode.MAP) && groundingLinks.length > 0 && (
          <div className="mt-12 p-6 bg-white rounded-3xl border border-gray-100">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
              Verified Sources & Maps
            </h3>
            <div className="flex flex-wrap gap-3">
              {groundingLinks.map((link, idx) => (
                <a 
                  key={idx} 
                  href={link.maps?.uri || link.web?.uri} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs bg-gray-50 hover:bg-gray-100 text-blue-600 px-4 py-2 rounded-full border border-gray-100 transition-colors flex items-center space-x-2"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/></svg>
                  <span>{link.maps?.title || link.web?.title || 'Location Source'}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Persistent Voice Assistant */}
      <LiveAudio />

      {/* Floating Bottom Navigation for Mobile */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 md:hidden bg-white px-6 py-3 rounded-full shadow-2xl flex items-center space-x-8 border border-gray-100 z-50">
        <button onClick={() => setMode(AppMode.FEED)} className={`p-2 ${mode === AppMode.FEED ? 'text-red-600' : 'text-gray-400'}`}>
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg>
        </button>
        <button onClick={() => setMode(AppMode.MAP)} className={`p-2 ${mode === AppMode.MAP ? 'text-red-600' : 'text-gray-400'}`}>
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/></svg>
        </button>
        <button onClick={() => setMode(AppMode.IMAGE_EDIT)} className={`p-2 ${mode === AppMode.IMAGE_EDIT ? 'text-red-600' : 'text-gray-400'}`}>
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/></svg>
        </button>
        <button onClick={() => setMode(AppMode.VIDEO_GEN)} className={`p-2 ${mode === AppMode.VIDEO_GEN ? 'text-red-600' : 'text-gray-400'}`}>
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.5 9a.5.5 0 00-.5.5v1a.5.5 0 00.5.5h1a.5.5 0 00.5-.5v-1a.5.5 0 00-.5-.5h-1z"/></svg>
        </button>
      </nav>
    </div>
  );
};

export default App;
