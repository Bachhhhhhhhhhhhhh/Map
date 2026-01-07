
export interface Place {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: 'food' | 'coffee' | 'play' | 'sightseeing';
  rating?: number;
  location?: string;
  lat?: number;
  lng?: number;
  sources?: Array<{ title: string; uri: string }>;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
}

export enum AppMode {
  FEED = 'FEED',
  IMAGE_EDIT = 'IMAGE_EDIT',
  VIDEO_GEN = 'VIDEO_GEN',
  MAP = 'MAP'
}
