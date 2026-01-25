'use client';

import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import { useUser } from '@clerk/nextjs';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Types
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface LineupSuspect {
  suspect_id: string;
  suspect_letter: string;
  blurred_image: string | null;
  teaser: string;
  blur_reason: string;
  character_name: string;
}

interface MatchResult {
  score: number;
  status: string;
  trust_score: number;
}

type Stage = 'intake' | 'filtering' | 'searching' | 'lineup' | 'interrogation' | 'verification' | 'complete';

// Evidence intake form data
interface EvidenceFormData {
  category: string;
  date_lost: string;
  time_lost: string;
  location_name: string;
  description: string;
  color: string;
  brand: string;
  unique_features: string;
}

const CATEGORY_OPTIONS = ['electronics', 'clothing', 'jewelry', 'bags', 'keys', 'books', 'sports', 'food', 'other'];

const LOCATION_OPTIONS = [
  'Hall Building', 'EV Building', 'Library', 'MB Building', 'GM Building',
  'Faubourg', 'LB Building', 'CCA', 'Loyola Campus', 'SP Building', 'Vanier Library', 'Other'
];

export default function EvidenceBoard() {
  const { user } = useUser();
  
  // Session state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [interrogationId, setInterrogationId] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>('intake');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Evidence form state (for visual intake)
  const [formData, setFormData] = useState<EvidenceFormData>({
    category: '',
    date_lost: '',
    time_lost: '',
    location_name: '',
    description: '',
    color: '',
    brand: '',
    unique_features: ''
  });
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Verification image state (separate from evidence image)
  const [verificationImage, setVerificationImage] = useState<File | null>(null);
  const [verificationPreview, setVerificationPreview] = useState<string | null>(null);
  const verificationInputRef = useRef<HTMLInputElement>(null);
  
  // Chat state (for interrogation)
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  
  // Lineup state
  const [lineup, setLineup] = useState<LineupSuspect[]>([]);
  const [selectedSuspect, setSelectedSuspect] = useState<LineupSuspect | null>(null);
  
  // Interrogation state
  const [characterName, setCharacterName] = useState<string>('');
  const [trustScore, setTrustScore] = useState<number>(0);
  const [secretVerified, setSecretVerified] = useState(false);
  const [, setVerificationRequested] = useState(false);
  
  // Match result
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  
  // Chat scroll ref
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // System logs
  const [systemLogs, setSystemLogs] = useState<string[]>([
    '[System] Evidence Board initialized...',
    '[System] Pin your evidence to the board...'
  ]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Add system log
  const addLog = (message: string) => {
    setSystemLogs(prev => [...prev.slice(-4), message]);
  };

  // Handle form input changes
  const handleFormChange = (field: keyof EvidenceFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle evidence image upload (for intake)
  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedImage(file);
      setImagePreview(URL.createObjectURL(file));
      addLog('[System] Evidence photo pinned');
    }
  };

  // Handle verification image upload (for verification stage)
  const handleVerificationUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setVerificationImage(file);
      setVerificationPreview(URL.createObjectURL(file));
      addLog('[System] Verification photo added');
    }
  };

  // Submit the evidence board and start matching
  const submitEvidence = async () => {
    // Validate required fields
    if (!formData.category || !formData.date_lost || !formData.location_name || !formData.description || !formData.unique_features) {
      setError('Please fill in all required evidence fields');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    addLog('[System] Submitting evidence to the bureau...');
    
    try {
      // Start session
      const startResponse = await fetch(`${API_BASE_URL}/api/matching/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: user?.id || null,
          initial_category: formData.category
        })
      });
      
      if (!startResponse.ok) throw new Error('Failed to start session');
      
      const startData = await startResponse.json();
      const newSessionId = startData.session_id;
      setSessionId(newSessionId);
      
      // Submit all intake data at once via a special bulk endpoint
      const intakeData = {
        category: formData.category,
        date_lost: `${formData.date_lost}${formData.time_lost ? ' ' + formData.time_lost : ''}`,
        location_name: formData.location_name,
        description: formData.description,
        color: formData.color || 'Not specified',
        brand: formData.brand || 'Unknown',
        unique_features: formData.unique_features
      };
      
      // Upload image if present
      let imageUrl = null;
      if (uploadedImage) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', uploadedImage);
        formDataUpload.append('folder', 'sherlostholmes/evidence');
        
        const uploadResponse = await fetch(`${API_BASE_URL}/api/images/upload`, {
          method: 'POST',
          body: formDataUpload
        });
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          imageUrl = uploadData.clear_url;
        }
      }
      
      // Submit intake data directly
      const submitResponse = await fetch(`${API_BASE_URL}/api/matching/${newSessionId}/submit-intake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intake_data: intakeData,
          image_url: imageUrl
        })
      });
      
      if (!submitResponse.ok) throw new Error('Failed to submit evidence');
      
      const data = await submitResponse.json();
      
      // Update stage and handle response
      if (data.stage) {
        setStage(data.stage);
        addLog(`[Holmes_AI] ${data.stage === 'lineup' ? 'Suspects identified!' : 'Processing evidence...'}`);
      }
      
      // Handle lineup
      if (data.lineup && data.lineup.length > 0) {
        setLineup(data.lineup);
        addLog(`[Holmes_AI] ${data.lineup.length} suspects ready for lineup`);
      }
      
      // If no matches
      if (data.stage === 'complete' && data.match_result) {
        setMatchResult(data.match_result);
        addLog('[System] No matches found in database');
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit evidence');
      addLog('[Error] Submission failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Select suspect from lineup
  const selectSuspect = async (suspect: LineupSuspect) => {
    if (!sessionId || isLoading) return;
    
    setSelectedSuspect(suspect);
    setIsLoading(true);
    addLog(`[System] Suspect ${suspect.suspect_letter} selected for interrogation`);
    
    try {
      // First, tell the matching agent about the selection
      await fetch(`${API_BASE_URL}/api/matching/${sessionId}/select-suspect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suspect_letter: suspect.suspect_letter })
      });
      
      // Then start interrogation
      const response = await fetch(`${API_BASE_URL}/api/matching/${sessionId}/interrogation/start`, {
        method: 'POST'
      });
      
      if (!response.ok) throw new Error('Failed to start interrogation');
      
      const data = await response.json();
      setInterrogationId(data.interrogation_id);
      setCharacterName(data.character_name);
      setTrustScore(data.trust_score);
      setStage('interrogation');
      setMessages([{ role: 'assistant', content: data.message }]);
      addLog(`[Holmes_AI] Entering interrogation room with ${data.character_name}`);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start interrogation');
      addLog('[Error] Interrogation room malfunction');
    } finally {
      setIsLoading(false);
    }
  };

  // Send interrogation message
  const sendInterrogationMessage = async () => {
    if (!sessionId || !interrogationId || !inputValue.trim() || isLoading) return;
    
    const userMessage = inputValue.trim();
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/matching/${sessionId}/interrogation/${interrogationId}/message`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userMessage })
        }
      );
      
      if (!response.ok) throw new Error('Failed to send message');
      
      const data = await response.json();
      
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
      setTrustScore(data.trust_score);
      
      if (data.secret_verified) {
        setSecretVerified(true);
        addLog('[Holmes_AI] "The truth reveals itself!"');
      }
      
      if (data.verification_requested) {
        setVerificationRequested(true);
        setStage('verification');
        addLog('[System] Photo verification requested');
      }
      
      if (data.status === 'complete') {
        setMatchResult({
          score: data.match_score,
          status: data.match_status,
          trust_score: data.trust_score
        });
        setStage('complete');
        addLog(`[System] Case closed: ${data.match_status}`);
      }
      
      if (data.status === 'locked') {
        addLog('[Warning] Too many failed attempts. Case flagged for review.');
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit verification photo
  const submitVerification = async () => {
    if (!sessionId || !interrogationId || !verificationImage) return;
    
    setIsLoading(true);
    addLog('[System] Uploading verification photo...');
    
    try {
      // First upload to Cloudinary
      const uploadFormData = new FormData();
      uploadFormData.append('file', verificationImage);
      uploadFormData.append('folder', 'sherlostholmes/verification');
      uploadFormData.append('create_blur', 'false');
      
      const uploadResponse = await fetch(`${API_BASE_URL}/api/images/upload`, {
        method: 'POST',
        body: uploadFormData
      });
      
      if (!uploadResponse.ok) throw new Error('Failed to upload image');
      
      const uploadData = await uploadResponse.json();
      
      // Submit for verification
      const verifyResponse = await fetch(
        `${API_BASE_URL}/api/matching/${sessionId}/interrogation/${interrogationId}/verify`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photo_url: uploadData.clear_url })
        }
      );
      
      if (!verifyResponse.ok) throw new Error('Verification failed');
      
      const data = await verifyResponse.json();
      
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
      setMatchResult({
        score: data.match_score,
        status: data.match_status,
        trust_score: data.trust_score
      });
      setStage('complete');
      addLog(`[Holmes_AI] Verification complete: ${data.match_status}`);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
      addLog('[Error] Verification system failure');
    } finally {
      setIsLoading(false);
    }
  };

  // Skip verification
  const skipVerification = async () => {
    if (!sessionId || !interrogationId) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/matching/${sessionId}/interrogation/${interrogationId}/skip-verification`,
        { method: 'POST' }
      );
      
      if (!response.ok) throw new Error('Failed to skip verification');
      
      const data = await response.json();
      
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
      setMatchResult({
        score: data.match_score,
        status: data.match_status,
        trust_score: data.trust_score
      });
      setStage('complete');
      addLog('[System] Case submitted for manual review');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to skip verification');
    } finally {
      setIsLoading(false);
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed_match': return 'text-green-400';
      case 'probable_match': return 'text-yellow-400';
      case 'needs_review': return 'text-orange-400';
      default: return 'text-red-400';
    }
  };

  // Render stage content
  const renderStageContent = () => {
    switch (stage) {
      case 'intake':
        return renderIntakeBoard();
      case 'filtering':
      case 'searching':
        return renderProcessing();
      case 'lineup':
        return renderLineup();
      case 'interrogation':
      case 'verification':
        return renderInterrogation();
      case 'complete':
        return renderComplete();
      default:
        return renderIntakeBoard();
    }
  };

  // Render visual evidence board for intake
  const renderIntakeBoard = () => (
    <div className="h-full overflow-y-auto p-4 bg-cork-pattern">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Main Evidence Card - Description */}
        <div className="lg:col-span-2 relative">
          <div className="w-6 h-6 rounded-full bg-red-600 absolute -top-3 left-8 shadow-md border-2 border-red-800 z-20"></div>
          <div className="bg-paper-light p-4 shadow-pixel-lg border-2 border-ink transform -rotate-1">
            <h3 className="font-display text-sm text-gray-600 mb-3 border-b border-gray-300 pb-2">📋 CASE DESCRIPTION</h3>
            <textarea
              value={formData.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              placeholder="Describe your lost item in detail... What does it look like? Any distinguishing features?"
              className="w-full h-32 bg-transparent font-handwriting text-xl text-gray-800 resize-none focus:outline-none"
            />
            <div className="text-xs text-gray-500 font-display mt-2">* REQUIRED</div>
          </div>
        </div>

        {/* Photo Evidence */}
        <div className="relative">
          <div className="w-6 h-6 rounded-full bg-yellow-500 absolute -top-3 right-8 shadow-md border-2 border-yellow-700 z-20"></div>
          <div className="bg-white p-3 shadow-pixel-lg border border-gray-300 transform rotate-2">
            <div 
              className="bg-gray-800 h-40 w-full mb-2 relative overflow-hidden flex items-center justify-center cursor-pointer hover:bg-gray-700 transition-colors border-4 border-white"
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Evidence" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center">
                  <span className="text-4xl">📷</span>
                  <p className="text-gray-400 font-handwriting text-lg mt-2">Click to add photo</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <p className="font-handwriting text-lg text-gray-600 text-center">Evidence Photo</p>
          </div>
        </div>

        {/* Category Sticky Note */}
        <div className="relative">
          <div className="w-5 h-5 rounded-full bg-blue-500 absolute -top-2 left-1/2 transform -translate-x-1/2 shadow-md border border-blue-700 z-20"></div>
          <div className="bg-yellow-200 p-4 shadow-md transform rotate-1">
            <h3 className="font-display text-xs text-gray-700 mb-2">ITEM TYPE</h3>
            <select
              value={formData.category}
              onChange={(e) => handleFormChange('category', e.target.value)}
              className="w-full bg-transparent font-handwriting text-xl text-gray-800 border-b-2 border-yellow-400 focus:outline-none focus:border-primary"
            >
              <option value="">Select category...</option>
              {CATEGORY_OPTIONS.map(cat => (
                <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
              ))}
            </select>
            <div className="text-xs text-gray-500 font-display mt-2">* REQUIRED</div>
          </div>
        </div>

        {/* Location Note */}
        <div className="relative">
          <div className="w-5 h-5 rounded-full bg-green-500 absolute -top-2 right-4 shadow-md border border-green-700 z-20"></div>
          <div className="bg-blue-100 p-4 shadow-md transform -rotate-2">
            <h3 className="font-display text-xs text-gray-700 mb-2">📍 LAST SEEN LOCATION</h3>
            <select
              value={formData.location_name}
              onChange={(e) => handleFormChange('location_name', e.target.value)}
              className="w-full bg-transparent font-handwriting text-xl text-gray-800 border-b-2 border-blue-300 focus:outline-none focus:border-primary"
            >
              <option value="">Where did you lose it?</option>
              {LOCATION_OPTIONS.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
            <div className="text-xs text-gray-500 font-display mt-2">* REQUIRED</div>
          </div>
        </div>

        {/* Date/Time Card */}
        <div className="relative">
          <div className="w-5 h-5 rounded-full bg-purple-500 absolute -top-2 left-4 shadow-md border border-purple-700 z-20"></div>
          <div className="bg-pink-100 p-4 shadow-md transform rotate-1">
            <h3 className="font-display text-xs text-gray-700 mb-2">📅 WHEN LOST</h3>
            <input
              type="date"
              value={formData.date_lost}
              onChange={(e) => handleFormChange('date_lost', e.target.value)}
              className="w-full bg-transparent font-handwriting text-lg text-gray-800 border-b-2 border-pink-300 focus:outline-none focus:border-primary mb-2"
            />
            <input
              type="time"
              value={formData.time_lost}
              onChange={(e) => handleFormChange('time_lost', e.target.value)}
              className="w-full bg-transparent font-handwriting text-lg text-gray-800 border-b-2 border-pink-300 focus:outline-none focus:border-primary"
              placeholder="Approximate time"
            />
            <div className="text-xs text-gray-500 font-display mt-2">* DATE REQUIRED</div>
          </div>
        </div>

        {/* Color Tag */}
        <div className="relative">
          <div className="w-5 h-5 rounded-full bg-orange-500 absolute -top-2 left-1/2 transform -translate-x-1/2 shadow-md border border-orange-700 z-20"></div>
          <div className="bg-green-100 p-4 shadow-md transform -rotate-1">
            <h3 className="font-display text-xs text-gray-700 mb-2">🎨 COLOR</h3>
            <input
              type="text"
              value={formData.color}
              onChange={(e) => handleFormChange('color', e.target.value)}
              placeholder="e.g., Black, Red, Blue..."
              className="w-full bg-transparent font-handwriting text-xl text-gray-800 border-b-2 border-green-300 focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Brand Tag */}
        <div className="relative">
          <div className="w-5 h-5 rounded-full bg-red-500 absolute -top-2 right-4 shadow-md border border-red-700 z-20"></div>
          <div className="bg-orange-100 p-4 shadow-md transform rotate-2">
            <h3 className="font-display text-xs text-gray-700 mb-2">🏷️ BRAND</h3>
            <input
              type="text"
              value={formData.brand}
              onChange={(e) => handleFormChange('brand', e.target.value)}
              placeholder="e.g., Apple, Nike, Samsung..."
              className="w-full bg-transparent font-handwriting text-xl text-gray-800 border-b-2 border-orange-300 focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Secret Knowledge - Unique Features */}
        <div className="lg:col-span-2 relative">
          <div className="w-6 h-6 rounded-full bg-primary absolute -top-3 left-1/2 transform -translate-x-1/2 shadow-md border-2 border-primary-dark z-20"></div>
          <div className="bg-paper-light p-4 shadow-pixel-lg border-4 border-primary transform rotate-0">
            <h3 className="font-display text-sm text-primary mb-2">🔐 SECRET KNOWLEDGE</h3>
            <p className="font-handwriting text-sm text-gray-600 mb-3">
              What unique marks, scratches, stickers, or details would ONLY the true owner know?
            </p>
            <textarea
              value={formData.unique_features}
              onChange={(e) => handleFormChange('unique_features', e.target.value)}
              placeholder="e.g., 'Small scratch on the bottom left corner', 'Has a sticker of a cat inside'..."
              className="w-full h-20 bg-gray-50 border-2 border-dashed border-gray-300 p-2 font-handwriting text-xl text-gray-800 resize-none focus:outline-none focus:border-primary"
            />
            <div className="text-xs text-gray-500 font-display mt-2">* REQUIRED - This helps verify ownership</div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-end justify-center">
          <button
            onClick={submitEvidence}
            disabled={isLoading}
            className="bg-primary hover:bg-primary-dark text-white font-display text-lg py-4 px-8 border-b-4 border-[#561521] active:border-b-0 active:translate-y-1 transition-all shadow-pixel-lg disabled:opacity-50 w-full"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3 h-3 bg-white rounded-full animate-bounce"></span>
                <span className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                <span className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
              </span>
            ) : (
              '🔍 START INVESTIGATION'
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // Render processing stage
  const renderProcessing = () => (
    <div className="h-full flex flex-col items-center justify-center p-8 bg-cork-pattern">
      <div className="bg-paper-light border-4 border-ink shadow-pixel-lg p-8 max-w-md w-full text-center relative">
        <div className="w-8 h-8 rounded-full bg-primary absolute -top-4 left-1/2 transform -translate-x-1/2 shadow-md border-2 border-primary-dark animate-pulse"></div>
        
        <div className="mb-6">
          <span className="text-6xl animate-pulse">🔍</span>
        </div>
        
        <h2 className="font-display text-xl text-primary mb-4">
          {stage === 'filtering' ? 'SEARCHING DATABASE...' : 'ANALYZING MATCHES...'}
        </h2>
        
        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden mb-4">
          <div className="h-full bg-primary animate-pulse" style={{ width: stage === 'filtering' ? '40%' : '70%' }}></div>
        </div>
        
        <p className="font-handwriting text-xl text-gray-700">
          {stage === 'filtering' 
            ? 'Applying filters to narrow down suspects...' 
            : 'Comparing descriptions and features...'}
        </p>
      </div>
    </div>
  );

  // Render lineup
  const renderLineup = () => (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-4 bg-wood-dark border-b-4 border-ink text-center">
        <h2 className="font-display text-2xl text-primary-dark">🔦 THE BLIND LINEUP</h2>
        <p className="font-handwriting text-lg text-paper-light mt-1">
          Study each suspect. Who feels most familiar?
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 bg-cork-pattern">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {lineup.map((suspect) => (
            <div
              key={suspect.suspect_id}
              onClick={() => selectSuspect(suspect)}
              className="bg-paper-light border-4 border-ink shadow-pixel-lg p-4 cursor-pointer hover:scale-105 transition-transform hover:border-primary group relative"
            >
              {/* Pin */}
              <div className="w-6 h-6 rounded-full bg-red-600 absolute -top-3 left-1/2 transform -translate-x-1/2 shadow-md border-2 border-red-800 z-20 group-hover:bg-primary"></div>
              
              {/* Suspect Letter */}
              <div className="text-center mb-3">
                <span className="font-display text-4xl text-primary">
                  {suspect.suspect_letter}
                </span>
                <p className="font-display text-sm text-gray-600">{suspect.character_name}</p>
              </div>
              
              {/* Blurred Image */}
              <div className="bg-gray-800 h-32 w-full mb-3 relative overflow-hidden flex items-center justify-center border-2 border-gray-600">
                {suspect.blurred_image ? (
                  <img 
                    src={suspect.blurred_image} 
                    alt={`Suspect ${suspect.suspect_letter}`}
                    className="w-full h-full object-cover blur-md opacity-60"
                  />
                ) : (
                  <span className="text-6xl text-gray-600">❓</span>
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white font-display text-xs bg-black/60 px-2 py-1">
                    {suspect.blur_reason}
                  </span>
                </div>
              </div>
              
              {/* Teaser */}
              <p className="font-handwriting text-lg text-gray-800 italic text-center">
                &quot;{suspect.teaser}&quot;
              </p>
              
              <button className="w-full mt-4 bg-wood-dark hover:bg-primary text-paper-light font-display text-sm py-2 border-b-2 border-black active:border-b-0 active:translate-y-0.5 transition-all">
                INTERROGATE
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Render interrogation
  const renderInterrogation = () => (
    <div className="flex flex-col h-full">
      {/* Header with suspect info */}
      <div className="p-4 bg-wood-dark border-b-4 border-ink">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl text-primary-dark">
              🕵️ INTERROGATION: {characterName}
            </h2>
            <p className="font-handwriting text-lg text-paper-light">
              Suspect {selectedSuspect?.suspect_letter}
            </p>
          </div>
          <div className="text-right">
            <div className="font-display text-xs text-paper-light">TRUST LEVEL</div>
            <div className="w-32 h-4 bg-black/40 rounded-sm overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  trustScore > 70 ? 'bg-green-500' : trustScore > 40 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${trustScore}%` }}
              />
            </div>
            <div className="font-display text-sm text-paper-light">{trustScore.toFixed(0)}%</div>
          </div>
        </div>
        {secretVerified && (
          <div className="mt-2 bg-green-600/20 border border-green-500 p-2 text-center">
            <span className="text-green-400 font-display text-sm">✓ SECRET KNOWLEDGE VERIFIED</span>
          </div>
        )}
      </div>
      
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/30">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-sm shadow-pixel ${
              msg.role === 'user' 
                ? 'bg-primary text-white' 
                : 'bg-paper-light text-gray-900 border-2 border-ink'
            }`}>
              {msg.role === 'assistant' && (
                <div className="text-xs text-primary font-display mb-1">
                  🎭 {characterName}
                </div>
              )}
              <p className="font-handwriting text-lg whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-paper-light p-3 rounded-sm shadow-pixel border-2 border-ink">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      
      {/* Verification Upload (if requested) */}
      {stage === 'verification' && (
        <div className="p-4 bg-wood-light border-t-4 border-ink">
          <div className="text-center mb-4">
            <span className="font-display text-sm text-gray-800">📸 PHOTO VERIFICATION REQUESTED</span>
          </div>
          
          {verificationPreview ? (
            <div className="flex items-center gap-4 justify-center mb-4">
              <img src={verificationPreview} alt="Verification" className="w-24 h-24 object-cover border-2 border-ink" />
              <div className="flex flex-col gap-2">
                <button
                  onClick={submitVerification}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700 text-white font-display px-4 py-2 border-b-2 border-green-900"
                >
                  SUBMIT PROOF
                </button>
                <button
                  onClick={() => { setVerificationImage(null); setVerificationPreview(null); }}
                  className="text-gray-600 font-handwriting text-sm underline"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <input
                ref={verificationInputRef}
                type="file"
                accept="image/*"
                onChange={handleVerificationUpload}
                className="hidden"
              />
              <button
                onClick={() => verificationInputRef.current?.click()}
                className="bg-primary hover:bg-primary-dark text-white font-display px-6 py-3 border-b-4 border-[#561521]"
              >
                📷 UPLOAD PHOTO
              </button>
              <button
                onClick={skipVerification}
                disabled={isLoading}
                className="text-gray-600 font-handwriting text-lg underline hover:text-gray-800"
              >
                I don&apos;t have a photo...
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Input (hide during verification) */}
      {stage === 'interrogation' && (
        <div className="p-4 bg-wood-dark border-t-4 border-ink">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendInterrogationMessage()}
              placeholder="Prove you know this item..."
              className="flex-1 bg-paper-light border-2 border-ink p-3 font-handwriting text-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isLoading}
            />
            <button
              onClick={sendInterrogationMessage}
              disabled={isLoading || !inputValue.trim()}
              className="bg-primary hover:bg-primary-dark text-white font-display px-6 py-3 border-b-4 border-[#561521] active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50"
            >
              SPEAK
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // Render complete
  const renderComplete = () => (
    <div className="flex flex-col h-full items-center justify-center p-8 bg-cork-pattern">
      <div className="bg-paper-light border-4 border-ink shadow-pixel-lg p-8 max-w-md w-full text-center relative">
        {/* Pin */}
        <div className="w-8 h-8 rounded-full bg-primary absolute -top-4 left-1/2 transform -translate-x-1/2 shadow-md border-2 border-primary-dark"></div>
        
        {/* Status Icon */}
        <div className="mb-6">
          {matchResult?.status === 'confirmed_match' && (
            <span className="text-8xl">🎉</span>
          )}
          {matchResult?.status === 'probable_match' && (
            <span className="text-8xl">✅</span>
          )}
          {matchResult?.status === 'needs_review' && (
            <span className="text-8xl">🔍</span>
          )}
          {matchResult?.status === 'rejected' && (
            <span className="text-8xl">😔</span>
          )}
        </div>
        
        {/* Title */}
        <h2 className={`font-display text-2xl mb-4 ${getStatusColor(matchResult?.status || '')}`}>
          {matchResult?.status?.replace('_', ' ').toUpperCase()}
        </h2>
        
        {/* Score */}
        <div className="bg-wood-dark p-4 mb-6">
          <div className="font-display text-sm text-paper-light mb-2">MATCH SCORE</div>
          <div className="text-5xl font-display text-primary-dark">
            {matchResult?.score.toFixed(0)}%
          </div>
          <div className="mt-2 font-handwriting text-paper-light">
            Trust Level: {matchResult?.trust_score.toFixed(0)}%
          </div>
        </div>
        
        {/* Last messages */}
        <div className="text-left bg-gray-100 p-4 border-l-4 border-primary mb-6 max-h-40 overflow-y-auto">
          {messages.slice(-2).map((msg, idx) => (
            <p key={idx} className="font-handwriting text-lg text-gray-800 mb-2">
              {msg.content.substring(0, 200)}...
            </p>
          ))}
        </div>
        
        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="bg-primary hover:bg-primary-dark text-white font-display py-3 px-6 border-b-4 border-[#561521] w-full"
          >
            RETURN TO DASHBOARD
          </button>
          <button
            onClick={() => {
              setSessionId(null);
              setMessages([]);
              setLineup([]);
              setSelectedSuspect(null);
              setMatchResult(null);
              setFormData({
                category: '',
                date_lost: '',
                time_lost: '',
                location_name: '',
                description: '',
                color: '',
                brand: '',
                unique_features: ''
              });
              setUploadedImage(null);
              setImagePreview(null);
              setStage('intake');
            }}
            className="text-primary font-handwriting text-lg underline hover:text-primary-dark"
          >
            Start New Case
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-background-light font-handwriting min-h-screen text-gray-900 overflow-x-hidden selection:bg-primary selection:text-white transition-colors duration-300">
      <style jsx global>{`
        .pixel-border {
          border-style: solid;
          border-width: 4px;
          border-image-slice: 4;
          border-image-width: 4px;
          border-image-outset: 0;
          border-image-source: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAH0lEQVQYV2NkQAKM+Cwkw4gsihEuh6wIJs7AwEA6AAAjCgIZN+uOkAAAAABJRU5ErkJggg==');
          border-color: #3e2723;
        }
        .yarn-line {
          position: absolute;
          height: 4px;
          background-color: #912338;
          transform-origin: 0 50%;
          z-index: 10;
          box-shadow: 2px 2px 0px rgba(0,0,0,0.3);
        }
        .scanlines::before {
          content: " ";
          display: block;
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          right: 0;
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.1) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03));
          z-index: 2;
          background-size: 100% 2px, 3px 100%;
          pointer-events: none;
        }
        .bg-cork-pattern {
           background-image: url('https://www.transparenttextures.com/patterns/cork-board.png');
        }
      `}</style>
      
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 px-4 py-3 pointer-events-none">
        <div className="max-w-7xl mx-auto flex justify-between items-start pointer-events-auto">
          <a href="/" className="bg-wood-dark border-4 border-ink p-2 shadow-pixel text-paper-light flex items-center gap-4 hover:bg-wood-light transition-colors">
            <div className="flex flex-col">
              <span className="font-display text-xs text-accent-gold mb-1">SHERLOST HOLMES</span>
              <div className="flex items-center gap-2 text-xl leading-none">
                <span className="text-green-400 text-base">🔍</span>
                <span>EVIDENCE BOARD</span>
              </div>
            </div>
          </a>
          <div className="flex gap-4">
            <div className="bg-wood-dark border-4 border-ink p-2 shadow-pixel text-paper-light">
              <span className="font-display text-xs text-gray-400">STAGE</span>
              <div className="text-sm uppercase">{stage}</div>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative w-full min-h-screen flex items-center justify-center pt-24 pb-32 px-4 scanlines bg-cork-pattern">
        <div className="relative w-full max-w-4xl h-[700px] bg-wood-dark border-[12px] border-wood-face shadow-2xl rounded-sm overflow-hidden flex flex-col">
          <div className="absolute inset-0 bg-black/10 pointer-events-none z-0"></div>
          
          {/* Header Note */}
          <div className="relative z-10 bg-paper-light px-6 py-3 shadow-pixel border-b-4 border-ink">
            <div className="w-4 h-4 rounded-full bg-primary absolute -top-2 left-1/2 transform -translate-x-1/2 shadow-sm border border-black"></div>
            <h1 className="font-display text-lg sm:text-2xl text-primary uppercase tracking-widest text-center">
              {sessionId ? `Case #${sessionId.split('_')[1]?.toUpperCase() || 'NEW'}` : 'NEW INVESTIGATION'}
            </h1>
            <p className="text-center text-base sm:text-lg text-gray-700 italic font-handwriting">
              {stage === 'intake' && 'Pin your evidence to the board...'}
              {stage === 'filtering' && 'Searching the evidence locker...'}
              {stage === 'searching' && 'Analyzing matches...'}
              {stage === 'lineup' && 'Identify your item from the suspects'}
              {stage === 'interrogation' && 'Prove your ownership'}
              {stage === 'verification' && 'Final verification required'}
              {stage === 'complete' && 'Case closed'}
            </p>
          </div>
          
          {/* Main Content */}
          <div className="flex-1 relative z-10 overflow-hidden">
            {renderStageContent()}
          </div>
          
          {/* Error display */}
          {error && (
            <div className="absolute bottom-20 left-4 right-4 bg-red-600 text-white p-3 font-display text-sm z-50 border-2 border-red-800">
              ⚠️ {error}
              <button onClick={() => setError(null)} className="float-right">✕</button>
            </div>
          )}
        </div>
      </main>

      {/* Footer System Log */}
      <div className="fixed bottom-0 left-0 w-full z-40 px-4 pb-4 pointer-events-none">
        <div className="max-w-4xl mx-auto pointer-events-auto">
          <div className="bg-wood-dark border-4 border-wood-face p-1 shadow-pixel-lg relative">
            <div className="border-2 border-wood-dark bg-black/80 p-3 h-24 overflow-y-auto font-handwriting text-xl text-green-400">
              {systemLogs.map((log, idx) => (
                <p key={idx} className={
                  log.includes('[Error]') ? 'text-red-400' :
                  log.includes('[Warning]') ? 'text-yellow-400' :
                  log.includes('[Holmes_AI]') ? 'text-blue-400' :
                  'text-green-400'
                }>
                  {log}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
