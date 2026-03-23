'use client';
import { useState, ChangeEvent, FormEvent } from 'react';
import { useUser } from '@clerk/nextjs';
import MapSelector from '@/components/MapSelector';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '');

interface FormData {
  itemName: string;
  category: string;
  locationName: string;
  locationDescription: string;
  dateLost: string;
  notes: string;
}

interface UploadedImage {
  file: File;
  previewUrl: string;
  cloudinaryUrl?: string;
  publicId?: string;
}

export default function FileReport() {
  const { user, isLoaded } = useUser();

  const [evidenceImages, setEvidenceImages] = useState<UploadedImage[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('');

  // Form state
  const [formData, setFormData] = useState<FormData>({
    itemName: '',
    category: '',
    locationName: '',
    locationDescription: '',
    dateLost: '',
    notes: ''
  });

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages: UploadedImage[] = Array.from(e.target.files).map(file => ({
        file,
        previewUrl: URL.createObjectURL(file)
      }));
      setEvidenceImages(prev => [...prev, ...newImages]);
    }
    e.target.value = '';
  };

  const removeImage = (indexToRemove: number) => {
    setEvidenceImages(prev => {
      const removed = prev[indexToRemove];
      URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((_, index) => index !== indexToRemove);
    });
  };

  const uploadImageToCloudinary = async (image: UploadedImage): Promise<{ url: string; publicId: string }> => {
    const formData = new FormData();
    formData.append('file', image.file);
    formData.append('folder', 'sherlostholmes/inquiries');
    formData.append('tags', 'inquiry,lost-item');
    formData.append('create_blur', 'false');

    const response = await fetch(`${API_BASE_URL}/api/images/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to upload image');
    }

    const data = await response.json();
    return {
      url: data.clear_url,
      publicId: data.public_id
    };
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      // Validate required fields
      if (!formData.itemName.trim()) {
        throw new Error('Please enter an item name or description');
      }
      if (!formData.category) {
        throw new Error('Please select a category');
      }

      // Step 1: Upload all images to Cloudinary
      const uploadedUrls: string[] = [];
      const uploadedPublicIds: string[] = [];

      for (const image of evidenceImages) {
        const result = await uploadImageToCloudinary(image);
        uploadedUrls.push(result.url);
        uploadedPublicIds.push(result.publicId);
      }

      // Step 2: Submit the item to the database
      const itemData = {
        item_name: formData.itemName,
        description: formData.notes || null,
        category: formData.category,
        date_found: formData.dateLost ? new Date(formData.dateLost).toISOString() : null,
        location_name: selectedLocation || formData.locationName || null,
        location_description: formData.locationDescription || null,
        notes: formData.notes || null,
        image_urls: uploadedUrls.length > 0 ? uploadedUrls : null,
        image_public_ids: uploadedPublicIds.length > 0 ? uploadedPublicIds : null,
        user_id: user?.id || null,
        contact_email: user?.primaryEmailAddress?.emailAddress || null,
      };

      const response = await fetch(`${API_BASE_URL}/api/items/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to submit report');
      }

      // Success!
      setSubmitSuccess(true);

      // Reset form
      setFormData({
        itemName: '',
        category: '',
        locationName: '',
        locationDescription: '',
        dateLost: '',
        notes: ''
      });
      setSelectedLocation('');
      setEvidenceImages([]);

    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-wood-light min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">

      {/* Background Decor - Ink Stain */}
      <div className="absolute top-10 left-10 w-32 h-32 opacity-80 pointer-events-none hidden lg:block transform -rotate-12 mix-blend-multiply">
        <img
          alt="Ink stain"
          className="w-full h-full drop-shadow-sm opacity-60"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBbf-2kcPGC_RhxY4qh5wDaapNd4l5k0Rq30ILOJ350L2xzn-nYw8Vf_9G8a57kCkdN3JRbQ1_m__u3XzGKn5dnxgyP60YnIRAoSxtmp-RzyJBNC4taHg3xVBV16JVlKHH3A3EYdwM56XWvhhu0taplU6k8UFdNug8ZYq3KrqYsXronlFYq2I7W-1fUzU8_ve_5CpHfWwwMuDcOaLOvwowBH1AA76O8LcgUsVygrjl2oxwXaKGTY5Szq1Kume_x8RRexlyD4jiTzg0"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>

      {/* Background Decor - Pipe */}
      <div className="absolute bottom-5 right-10 w-48 h-32 pointer-events-none hidden lg:block">
        <img
          alt="Pixel art of a detective's pipe"
          className="w-full h-full drop-shadow-xl transform rotate-6"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-bI6DpLsLoO2IRZ74e_k2Isn95kxH-I6kGbjEzWblUgh3GOuJkw2RrAF0a7y06XFe7Q3z4kTpoDkq6Ra0umq8azx8aMBH0bxP6eCauZazv2NK_3KWWmKb4fsUqzWLRyltEy_7IxSmDPnJJQF3x2yKK-BK9RrbiYIPrxDq2r-Zn-8NFDLKHn7CtQKe72wJA5WYgFpaycrzBOJwNnIa6xMuqZjOuRnLUlPyB5wlX__O5JOEkXZQG5s25QviZx37yUKpeJWEbvFlh_I"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>

      <main className="relative z-10 w-full max-w-4xl">
        <div className="flex justify-between items-end px-4">
          <div className="bg-primary text-white px-6 py-2 rounded-t-lg border-x-4 border-t-4 border-wood-dark shadow-pixel transform translate-y-1">
            <h2 className="font-display text-xs md:text-sm tracking-widest uppercase">Case File #882</h2>
          </div>
        </div>

        <div className="bg-paper-light border-4 border-wood-dark rounded-lg shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]"></div>
          <div className="absolute inset-0 pointer-events-none hidden scanlines opacity-20"></div>

          <div className="p-8 md:p-12 relative">
            <div className="absolute top-4 right-6 transform rotate-12 opacity-80 border-4 border-burgundy rounded-full p-2 w-24 h-24 flex items-center justify-center text-center">
              <span className="font-display text-[10px] text-burgundy leading-tight">OFFICIAL<br/>SHERLOST<br/>HOLMES<br/>AGENCY</span>
            </div>

            <div className="text-center mb-10 border-b-4 border-dashed border-wood-dark pb-4">
              <h1 className="font-display text-2xl md:text-4xl text-wood-dark mb-2 text-shadow">LOST ITEM REPORT</h1>
              <p className="font-handwriting text-xl text-gray-600">Please fill out the details with utmost precision.</p>
            </div>

            {/* Success Message */}
            {submitSuccess && (
              <div className="mb-6 p-4 bg-green-100 border-2 border-green-500 rounded-lg text-center">
                <span className="material-symbols-outlined text-green-600 text-2xl">check_circle</span>
                <p className="font-display text-green-700 mt-2">Case filed successfully! Our detectives are on the case.</p>
              </div>
            )}

            {/* Error Message */}
            {submitError && (
              <div className="mb-6 p-4 bg-red-100 border-2 border-red-500 rounded-lg text-center">
                <span className="material-symbols-outlined text-red-600 text-2xl">error</span>
                <p className="font-display text-red-700 mt-2">{submitError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div
                className="bg-lined-paper rounded shadow-inner-pixel bg-opacity-30 flex flex-col"
                style={{ backgroundSize: '100% 32px', backgroundPositionY: '0px' }}
              >
                <div className="relative flex flex-col justify-end" style={{ height: '64px' }}>
                  <label className="absolute top-1 left-2 font-display text-[10px] text-wood-dark uppercase tracking-widest opacity-70" htmlFor="itemName">Item Name / Description</label>
                  <input
                    className="pixel-input w-full px-2 text-ink placeholder-gray-400 bg-transparent font-handwriting"
                    id="itemName"
                    placeholder="e.g. Grandma's Emerald Ring"
                    type="text"
                    value={formData.itemName}
                    onChange={handleInputChange}
                    style={{ height: '32px', lineHeight: '26px', fontSize: '1.25rem', paddingBottom: '2px' }}
                  />
                </div>
                <div className="relative flex flex-col justify-end" style={{ height: '64px' }}>
                  <label className="absolute top-1 left-2 font-display text-[10px] text-wood-dark uppercase tracking-widest opacity-70" htmlFor="category">Item Category</label>
                  <select
                    className="pixel-input w-full px-2 text-ink bg-transparent font-handwriting cursor-pointer"
                    id="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    style={{ height: '32px', lineHeight: '26px', fontSize: '1.25rem', paddingBottom: '2px' }}
                  >
                    <option value="">Select a category...</option>
                    <option value="electronics">Electronics (Phone, Laptop, Charger)</option>
                    <option value="clothing">Clothing & Accessories</option>
                    <option value="jewelry">Jewelry & Watches</option>
                    <option value="bags">Bags & Wallets</option>
                    <option value="keys">Keys & Keycards</option>
                    <option value="books">Books & Documents</option>
                    <option value="sports">Sports Equipment</option>
                    <option value="food">Food & Drink Containers</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="relative flex flex-col justify-end" style={{ height: '64px' }}>
                  <label className="absolute top-1 left-2 font-display text-[10px] text-wood-dark uppercase tracking-widest opacity-70" htmlFor="lastSeen">Last Seen Location</label>
                  <button
                    type="button"
                    onClick={() => setIsMapOpen(true)}
                    className="pixel-input w-full px-2 text-left bg-transparent font-handwriting flex items-center justify-between group hover:bg-primary/5 transition-colors rounded"
                    style={{ height: '32px', lineHeight: '26px', fontSize: '1.25rem', paddingBottom: '2px' }}
                  >
                    <span className={selectedLocation ? 'text-ink' : 'text-gray-400'}>
                      {selectedLocation || 'Click to select on campus map...'}
                    </span>
                    <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">map</span>
                  </button>
                </div>
                <div className="relative flex flex-col justify-end" style={{ height: '64px' }}>
                  <label className="absolute top-1 left-2 font-display text-[10px] text-wood-dark uppercase tracking-widest opacity-70" htmlFor="locationDescription">Location Details</label>
                  <input
                    className="pixel-input w-full px-2 text-ink placeholder-gray-400 bg-transparent font-handwriting"
                    id="locationDescription"
                    placeholder="e.g. Near the vending machines on 2nd floor"
                    type="text"
                    value={formData.locationDescription}
                    onChange={handleInputChange}
                    style={{ height: '32px', lineHeight: '26px', fontSize: '1.25rem', paddingBottom: '2px' }}
                  />
                </div>
                <div className="relative flex flex-col justify-end" style={{ height: '64px' }}>
                  <label className="absolute top-1 left-2 font-display text-[10px] text-wood-dark uppercase tracking-widest opacity-70" htmlFor="dateLost">Date of Incident</label>
                  <input
                    className="pixel-input w-full px-2 text-ink bg-transparent uppercase font-handwriting"
                    id="dateLost"
                    type="date"
                    value={formData.dateLost}
                    onChange={handleInputChange}
                    style={{ height: '32px', lineHeight: '26px', fontSize: '1.25rem', paddingBottom: '2px' }}
                  />
                </div>
                <div className="relative flex flex-col justify-end" style={{ height: '128px' }}>
                  <label className="absolute top-1 left-2 font-display text-[10px] text-wood-dark uppercase tracking-widest opacity-70" htmlFor="notes">Witnesses / Notes</label>
                  <textarea
                    className="pixel-input w-full px-2 text-ink placeholder-gray-400 bg-transparent resize-none font-handwriting"
                    id="notes"
                    placeholder="Describe any suspicious NPCs..."
                    value={formData.notes}
                    onChange={handleInputChange}
                    style={{ height: '96px', lineHeight: '32px', fontSize: '1.25rem', paddingTop: '6px' }}
                  ></textarea>
                </div>
              </div>

              <div className="flex flex-col items-center justify-start space-y-6 pt-8">
                 <div
                  className="relative w-48 h-48 md:w-56 md:h-56 flex items-center justify-center cursor-pointer group perspective-1000"
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                >
                    {/* Image Stack Logic */}
                     {evidenceImages.length === 0 && (
                        <div className="absolute inset-0 border-4 border-dashed border-gray-400 bg-gray-100 rounded-lg flex flex-col items-center justify-center text-gray-500 transition-colors group-hover:bg-gray-200 z-10 shadow-md transform -rotate-2 hover:rotate-0 transition-transform duration-300">
                          <span className="material-symbols-outlined text-4xl mb-2">add_a_photo</span>
                          <span className="font-display text-[10px]">UPLOAD EVIDENCE</span>
                          <input
                            className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
                            type="file"
                            onChange={handleImageUpload}
                            accept="image/*"
                            multiple
                          />
                        </div>
                      )}
                    {evidenceImages.length > 0 && (
                        <>
                             {!isHovered && (
                                 <input
                                    className="opacity-0 absolute inset-0 z-[100] cursor-pointer w-full h-full"
                                    type="file"
                                    onChange={handleImageUpload}
                                    accept="image/*"
                                    multiple
                                />
                            )}
                            {evidenceImages.map((img, index) => {
                                const totalItems = evidenceImages.length + 1;
                                const centerOffset = index - (totalItems - 1) / 2;
                                const stackRotate = ((index * 7) % 10) - 5;
                                const spreadX = centerOffset * 50;
                                const spreadRotate = centerOffset * 5;
                                const isFocused = focusedIndex === index;
                                return (
                                    <div
                                        key={img.previewUrl}
                                        className="absolute bg-white p-2 pb-8 shadow-xl border border-gray-300 transition-all duration-300 ease-out origin-bottom"
                                        onMouseEnter={(e) => { e.stopPropagation(); setFocusedIndex(index); }}
                                        onMouseLeave={(e) => { e.stopPropagation(); setFocusedIndex(null); }}
                                        style={{
                                            width: '180px',
                                            height: '220px',
                                            transform: isHovered
                                                ? (isFocused
                                                    ? `translateX(${spreadX}px) translateY(-40px) scale(1.1) rotate(0deg)`
                                                    : `translateX(${spreadX}px) rotate(${spreadRotate}deg) scale(0.9)`
                                                  )
                                                : `rotate(${stackRotate}deg) scale(0.9)`,
                                            zIndex: isFocused ? 300 : (isHovered ? 10 + index : index),
                                        }}
                                    >
                                        <div className="w-full h-36 bg-gray-200 overflow-hidden mb-2 relative pointer-events-none">
                                            <img src={img.previewUrl} alt="Evidence" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="font-handwriting text-black text-center text-lg leading-none transform rotate-1 opacity-80 pointer-events-none">
                                            Exhibit #{index + 1}
                                        </div>
                                         <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                removeImage(index);
                                            }}
                                            className={`absolute -top-3 -left-3 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-700 transition-all duration-200 z-50 ${isHovered ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}
                                            title="Remove Evidence"
                                        >
                                            <span className="material-symbols-outlined text-sm font-bold">close</span>
                                        </button>
                                    </div>
                                );
                            })}
                             {/* The "Add New" Card */}
                            <div
                                className="absolute bg-gray-100 p-2 pb-8 shadow-xl border-2 border-dashed border-gray-400 transition-all duration-500 ease-out origin-bottom flex flex-col items-center justify-center"
                                style={{
                                    width: '180px',
                                    height: '220px',
                                    transform: isHovered
                                        ? `translateX(${((evidenceImages.length - (evidenceImages.length) / 2) * 50)}px) rotate(${((evidenceImages.length - (evidenceImages.length) / 2) * 5)}deg) scale(0.9)`
                                        : `rotate(5deg) scale(0.9) translateZ(-10px)`,
                                    zIndex: isHovered ? 10 + evidenceImages.length : -1,
                                    opacity: isHovered ? 1 : 0,
                                }}
                            >
                                <div className="flex flex-col items-center justify-center text-gray-500 h-full w-full">
                                    <span className="material-symbols-outlined text-4xl mb-2">add_photo_alternate</span>
                                    <span className="font-display text-xs text-center">ADD MORE<br/>EVIDENCE</span>
                                </div>
                                <input
                                    className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
                                    type="file"
                                    onChange={handleImageUpload}
                                    accept="image/*"
                                    multiple
                                />
                            </div>
                        </>
                    )}
                </div>
                <div className="flex items-center space-x-2 bg-gray-200 px-3 py-1 rounded border-2 border-dashed border-gray-400 mt-8">
                  <span className="material-symbols-outlined text-primary animate-pulse text-sm">auto_awesome</span>
                  <span className="font-display text-[10px] text-gray-600">AI DETECTIVE STANDING BY</span>
                </div>
              </div>

              {/* Submit Section - Full Width */}
              <div className="md:col-span-2 mt-8 flex justify-between items-center border-t-4 border-wood-dark pt-8">
                <div className="hidden md:block">
                  <p className="font-display text-[10px] text-gray-500 max-w-xs leading-relaxed">
                      By affixing your seal, you agree to the Sherlockian terms of deduction. The game is afoot.
                  </p>
                </div>
                <button
                  type="submit"
                  className="relative group"
                  disabled={isSubmitting}
                >
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center shadow-lg border-4 group-hover:scale-105 transition-transform duration-200 ${
                    isSubmitting
                      ? 'bg-gray-400 border-gray-500'
                      : 'bg-burgundy border-burgundy-dark'
                  }`}>
                    <div className={`w-20 h-20 border-2 border-dashed rounded-full flex items-center justify-center ${
                      isSubmitting ? 'border-gray-500' : 'border-burgundy-dark'
                    }`}>
                      {isSubmitting ? (
                        <span className="material-symbols-outlined text-white animate-spin">sync</span>
                      ) : (
                        <span className="font-display text-xs text-red-100 drop-shadow-md">SUBMIT</span>
                      )}
                    </div>
                  </div>
                  <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 -z-10 flex space-x-1">
                    <div className={`w-6 h-12 clip-ribbon ${isSubmitting ? 'bg-gray-400' : 'bg-burgundy'}`}></div>
                    <div className={`w-6 h-10 clip-ribbon ${isSubmitting ? 'bg-gray-500' : 'bg-burgundy-dark'}`}></div>
                  </div>
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <div className="absolute -right-2 top-20 hidden md:block">
        <div className="w-8 h-24 bg-paper-light border-2 border-wood-dark shadow-pixel flex flex-col items-center justify-around py-2">
            <div className="w-4 h-4 rounded-full bg-primary"></div>
            <div className="w-4 h-4 rounded-full bg-primary opacity-50"></div>
            <div className="w-4 h-4 rounded-full bg-primary opacity-50"></div>
        </div>
      </div>

      {/* Map Selector Popup */}
      <MapSelector
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onSelectLocation={(location) => setSelectedLocation(location)}
      />
    </div>
  );
}
