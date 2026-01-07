
import React, { useState } from 'react';
import { editImage } from '../services/geminiService';

const ImageEditor: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = async () => {
    if (!selectedImage || !prompt) return;
    setLoading(true);
    try {
      const base64Data = selectedImage.split(',')[1];
      const edited = await editImage(base64Data, prompt);
      if (edited) setResult(edited);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white rounded-3xl shadow-sm">
      <h2 className="text-3xl font-bold text-gray-900 mb-8">AI Magic Photo Editor</h2>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="aspect-square bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 relative">
            {selectedImage ? (
              <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-400">Upload a Hanoi photo</span>
            )}
            <input 
              type="file" 
              className="absolute inset-0 opacity-0 cursor-pointer" 
              onChange={handleFileChange} 
              accept="image/*"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">What to change?</label>
            <input 
              type="text" 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Add a retro film filter, make it sunset..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none"
            />
          </div>

          <button 
            onClick={handleEdit}
            disabled={loading || !selectedImage}
            className="w-full py-4 bg-red-600 text-white rounded-xl font-bold disabled:bg-gray-400 flex items-center justify-center"
          >
            {loading ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Apply AI Edit'}
          </button>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800">Result</h3>
          <div className="aspect-square bg-gray-50 rounded-2xl flex items-center justify-center overflow-hidden shadow-inner border border-gray-100">
            {result ? (
              <img src={result} alt="Edited Result" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center p-8 text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-2 opacity-20" fill="currentColor" viewBox="0 0 20 20"><path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"/></svg>
                Waiting for magic...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;
