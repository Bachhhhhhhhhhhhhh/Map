
import React from 'react';
import { Place } from '../types';

interface PlaceCardProps {
  place: Place;
  onClick?: (place: Place) => void;
}

const PlaceCard: React.FC<PlaceCardProps> = ({ place, onClick }) => {
  return (
    <div 
      className="masonry-item group relative overflow-hidden rounded-2xl bg-white shadow-sm cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1"
      onClick={() => onClick?.(place)}
    >
      <img 
        src={place.imageUrl} 
        alt={place.title}
        className="w-full h-auto object-cover rounded-2xl"
        loading="lazy"
      />
      
      {/* Overlay on hover */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
        <button className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-full font-semibold hover:bg-red-700 transition-colors">
          Save
        </button>
        <div className="text-white">
          <h3 className="font-bold text-lg">{place.title}</h3>
          <p className="text-xs opacity-90 line-clamp-2">{place.description}</p>
        </div>
      </div>
      
      {/* Footer Info (Pinterest style) */}
      <div className="p-3">
        <h4 className="font-semibold text-gray-800 text-sm truncate">{place.title}</h4>
        <div className="flex items-center mt-1 space-x-2">
          <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold">
            {place.title.charAt(0)}
          </div>
          <span className="text-xs text-gray-500">{place.category}</span>
        </div>
      </div>
    </div>
  );
};

export default PlaceCard;
