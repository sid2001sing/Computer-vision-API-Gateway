import React, { useState } from 'react';
import { Upload, Camera, Loader2, CheckCircle, AlertCircle, Scan, Tag, X, Type, Shield } from 'lucide-react';

export default function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
  };

  const triggerAnalysis = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', selectedImage);

    try {
      const response = await fetch('http://localhost:5000/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error(`Server Error: ${response.statusText}`);
      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setError("Failed to connect to backend. Is 'node index.js' running?");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Helper to color-code safety ratings
  const getSafetyColor = (rating) => {
    if (['VERY_UNLIKELY', 'UNLIKELY'].includes(rating)) return 'text-emerald-600 bg-emerald-50';
    if (['POSSIBLE'].includes(rating)) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-6 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-600 rounded-xl shadow-lg mb-2">
            <Scan className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Computer Vision API Gateway</h1>
          <p className="text-slate-500 max-w-lg mx-auto">
            Detects Objects, Reads Text (OCR), and checks Content Safety.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          
          {/* Left Column: Upload */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 sticky top-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Camera className="w-5 h-5 text-indigo-600" />
              Input Image
            </h2>

            <div className={`
              relative border-2 border-dashed rounded-xl p-8 text-center transition-all
              ${previewUrl ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}
            `}>
              {previewUrl ? (
                <div className="relative group">
                  <img src={previewUrl} alt="Preview" className="max-h-64 mx-auto rounded-lg shadow-md object-contain"/>
                  <button onClick={clearImage} className="absolute -top-3 -right-3 bg-white text-red-500 p-1 rounded-full shadow-lg border border-slate-100 hover:bg-red-50">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange}/>
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 bg-indigo-50 rounded-full text-indigo-600"><Upload className="w-8 h-8" /></div>
                    <div>
                      <span className="text-indigo-600 font-medium hover:underline">Click to upload</span>
                      <span className="text-slate-400"> or drag and drop</span>
                    </div>
                  </div>
                </label>
              )}
            </div>

            <button
              onClick={triggerAnalysis}
              disabled={!selectedImage || isAnalyzing}
              className={`
                w-full mt-6 py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all
                ${!selectedImage || isAnalyzing ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'}
              `}
            >
              {isAnalyzing ? <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing...</> : <>Analyze Image</>}
            </button>
          </div>

          {/* Right Column: Detailed Results */}
          <div className="space-y-6">
            
            {/* 1. Labels Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5 text-indigo-600" />
                Detected Labels
              </h2>
              {result ? (
                <div className="space-y-3">
                  {result.data.labels.map((item, index) => (
                    <div key={index} className="flex justify-between p-2 bg-slate-50 rounded border border-slate-100">
                      <span className="text-slate-700">{item.description}</span>
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">{item.confidence}</span>
                    </div>
                  ))}
                </div>
              ) : <div className="text-slate-400 text-sm italic">Waiting for analysis...</div>}
            </div>

            {/* 2. OCR / Text Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Type className="w-5 h-5 text-blue-600" />
                Text Extraction (OCR)
              </h2>
              {result ? (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm font-mono text-slate-700 whitespace-pre-wrap">
                  {result.data.text}
                </div>
              ) : <div className="text-slate-400 text-sm italic">Upload an image with text to read it here.</div>}
            </div>

            {/* 3. Safety Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-600" />
                Safety Analysis
              </h2>
              {result ? (
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(result.data.safety).map(([key, val]) => (
                    <div key={key} className={`p-2 rounded-lg text-center border ${getSafetyColor(val)}`}>
                      <div className="text-xs uppercase font-bold opacity-70 mb-1">{key}</div>
                      <div className="text-xs font-bold">{val.replace('VERY_', '')}</div>
                    </div>
                  ))}
                </div>
              ) : <div className="text-slate-400 text-sm italic">Safety metrics will appear here.</div>}
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
}
