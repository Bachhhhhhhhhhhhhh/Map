
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';

const API_KEY = process.env.API_KEY || '';

// Audio utils
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const LiveAudio: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const sessionRef = useRef<any>(null);
  const audioContextInRef = useRef<AudioContext | null>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const stopLive = () => {
    setIsActive(false);
    if (sessionRef.current) {
      sessionRef.current.close?.();
      sessionRef.current = null;
    }
    audioContextInRef.current?.close();
    audioContextOutRef.current?.close();
  };

  const startLive = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const ctxIn = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const ctxOut = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextInRef.current = ctxIn;
      audioContextOutRef.current = ctxOut;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            const source = ctxIn.createMediaStreamSource(stream);
            const scriptProcessor = ctxIn.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(ctxIn.destination);
          },
          onmessage: async (message) => {
            if (message.serverContent?.outputTranscription) {
                setTranscript(prev => prev + ' ' + message.serverContent.outputTranscription.text);
            }

            const audioBase64 = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioBase64) {
              const audioBuffer = await decodeAudioData(decode(audioBase64), ctxOut, 24000, 1);
              const source = ctxOut.createBufferSource();
              source.buffer = audioBuffer;
              const outputNode = ctxOut.createGain();
              source.connect(outputNode);
              outputNode.connect(ctxOut.destination);
              
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctxOut.currentTime);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => console.error("Live API Error", e),
          onclose: () => setIsActive(false),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: "You are a Hanoi local expert. Speak naturally in Vietnamese or English. Help user find eating and play spots in Hanoi.",
          outputAudioTranscription: {},
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error("Failed to start Live session", err);
    }
  };

  useEffect(() => {
    return () => { stopLive(); };
  }, []);

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <div className={`p-4 rounded-3xl shadow-2xl transition-all duration-500 bg-white border-2 ${isActive ? 'w-64 border-red-500 scale-105' : 'w-16 border-transparent'}`}>
        {isActive ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="w-1 bg-red-500 animate-bounce" style={{ height: '20px', animationDelay: `${i * 0.1}s` }}></div>
              ))}
            </div>
            <p className="text-xs text-center text-gray-500 italic">"{transcript.slice(-50) || 'Listening...'}"</p>
            <button 
              onClick={stopLive}
              className="bg-red-500 text-white px-6 py-2 rounded-full font-bold hover:bg-red-600 w-full"
            >
              Stop Talk
            </button>
          </div>
        ) : (
          <button 
            onClick={startLive}
            className="w-8 h-8 flex items-center justify-center bg-red-600 rounded-full text-white hover:bg-red-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default LiveAudio;
