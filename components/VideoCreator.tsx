
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { checkVeoKey, openVeoKeySelector } from '../services/geminiService';

const VideoCreator: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState(true);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    const keySelected = await checkVeoKey();
    if (!keySelected) {
      await openVeoKeySelector();
      setHasKey(true);
      return;
    }

    if (!selectedImage || !prompt) return;
    setLoading(true);
    setVideoUrl(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64Data = selectedImage.split(',')[1];

      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        image: {
          imageBytes: base64Data,
          mimeType: 'image/png',
        },
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        const blob = await response.blob();
        setVideoUrl(URL.createObjectURL(blob));
      }
    } catch (err) {
      console.error(err);
      if (err.message?.includes('Requested entity was not found')) {
          await openVeoKeySelector();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white rounded-3xl shadow-sm">
      <h2 className="text-3xl font-bold text-gray-900 mb-8">Animate Your Hanoi Memories</h2>
      
      <div className="flex flex-col space-y-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="aspect-video bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 relative">
              {selectedImage ? (
                <img src={selectedImage} alt="Base" className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-400">Start with a photo</span>
              )}
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Describe the animation</label>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. People walking in the old quarter, motorbikes passing by with motion blur..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 h-32 outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <button 
              onClick={handleGenerate}
              disabled={loading || !selectedImage}
              className="w-full py-4 bg-red-600 text-white rounded-xl font-bold disabled:bg-gray-400 flex flex-col items-center"
            >
              {loading ? (
                <>
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mb-2"></div>
                  <span className="text-xs">Generating masterpiece... This takes ~1 min</span>
                </>
              ) : 'Generate AI Video'}
            </button>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">Cinematic Result</h3>
            <div className="aspect-video bg-gray-900 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center">
              {videoUrl ? (
                <video src={videoUrl} controls autoPlay loop className="w-full h-full object-contain" />
              ) : (
                <div className="text-gray-500 text-center p-8">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-10" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.5 9a.5.5 0 00-.5.5v1a.5.5 0 00.5.5h1a.5.5 0 00.5-.5v-1a.5.5 0 00-.5-.5h-1z"/></svg>
                  Your video will appear here
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start space-x-3">
          <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/></svg>
          <div className="text-xs text-blue-700">
            Veo requires a paid API key from a billing-enabled GCP project. <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="underline font-bold">Learn more</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCreator;
