
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Place } from '../types';

interface MapViewProps {
  places: Place[];
  onPlaceClick?: (place: Place) => void;
}

const MapView: React.FC<MapViewProps> = ({ places, onPlaceClick }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        center: [21.0285, 105.8542], // Hanoi
        zoom: 13,
        zoomControl: false
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO'
      }).addTo(mapRef.current);

      L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);
      
      markersRef.current = L.layerGroup().addTo(mapRef.current);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !markersRef.current) return;

    markersRef.current.clearLayers();

    const bounds = L.latLngBounds([]);
    
    places.forEach((place) => {
      if (place.lat && place.lng) {
        const marker = L.marker([place.lat, place.lng], {
          icon: L.divIcon({
            className: 'custom-pin',
            html: `<div class="w-8 h-8 bg-red-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold transform -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-110">
              ${place.title.charAt(0)}
            </div>`,
            iconSize: [0, 0],
          })
        });

        const popupContent = `
          <div class="p-0">
            <img src="${place.imageUrl}" class="w-full h-24 object-cover" />
            <div class="p-3">
              <h4 class="font-bold text-gray-900 text-sm mb-1">${place.title}</h4>
              <p class="text-[10px] text-gray-500 line-clamp-2">${place.description}</p>
              <div class="flex items-center mt-2">
                <span class="text-[10px] font-bold text-red-600 uppercase tracking-tighter">${place.category}</span>
              </div>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent).addTo(markersRef.current!);
        bounds.extend([place.lat, place.lng]);
      }
    });

    if (places.length > 0) {
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [places]);

  return (
    <div className="w-full h-[calc(100vh-140px)] rounded-3xl overflow-hidden shadow-inner border border-gray-100 relative bg-gray-50">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur px-4 py-2 rounded-2xl shadow-sm border border-gray-100 text-xs font-semibold text-gray-600">
        Found {places.length} matching spots
      </div>
    </div>
  );
};

export default MapView;
