import React from 'react';
import Modal from './Modal';

interface DogFormModalProps {
  isOpen: boolean;
  mode: 'add' | 'edit';
  initialValues: any;
  loading: boolean;
  errors: any;
  imagePreviews: string[];
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (idx: number) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  images: File[];
  successMsg?: string;
  errorMsg?: string;
}

const DogFormModal: React.FC<DogFormModalProps> = ({
  isOpen,
  mode,
  initialValues,
  loading,
  errors,
  imagePreviews,
  onChange,
  onImageChange,
  onRemoveImage,
  onSubmit,
  onCancel,
  images,
  successMsg,
  errorMsg,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onCancel}>
      <div className="p-6 max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{mode === 'add' ? 'Add New Dog' : `Edit Dog: ${initialValues.name}`}</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        {errorMsg && <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg mb-4 border border-red-200">{errorMsg}</div>}
        {successMsg && <div className="bg-green-100 text-green-700 px-4 py-3 rounded-lg mb-4 border border-green-200">{successMsg}</div>}
        <form className="space-y-6" onSubmit={onSubmit} encType="multipart/form-data">
          {/* Basic Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input 
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 ${errors.name ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="Dog's name"
                  name="name" 
                  value={initialValues.name} 
                  onChange={onChange} 
                  required 
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Breed *</label>
                <input 
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 ${errors.breed ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="e.g. Poodle"
                  name="breed" 
                  value={initialValues.breed} 
                  onChange={onChange} 
                  required 
                />
                {errors.breed && <p className="text-red-500 text-xs mt-1">{errors.breed}</p>}
              </div>
              {/* Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                <select
                  name="size"
                  value={initialValues.size}
                  onChange={onChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 mb-2"
                >
                  <option value="UNKNOWN">Unknown</option>
                  <option value="SMALL">Small</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LARGE">Large</option>
                </select>
              </div>
              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  name="gender"
                  value={initialValues.gender}
                  onChange={onChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 mb-2"
                >
                  <option value="UNKNOWN">Unknown</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age Category *</label>
                <select
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 ${errors.ageCategory ? 'border-red-300' : 'border-gray-300'}`}
                  name="ageCategory"
                  value={initialValues.ageCategory}
                  onChange={onChange}
                  required
                >
                  <option value="">Choose...</option>
                  <option value="PUPPY">Puppy (0-1 years)</option>
                  <option value="YOUNG">Young (1-3 years)</option>
                  <option value="ADULT">Adult (3-7 years)</option>
                  <option value="SENIOR">Senior (7+ years)</option>
                </select>
                {errors.ageCategory && <p className="text-red-500 text-xs mt-1">{errors.ageCategory}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Birth Date</label>
                <input 
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 ${errors.birthDate ? 'border-red-300' : 'border-gray-300'}`}
                  type="date" 
                  name="birthDate" 
                  value={initialValues.birthDate} 
                  onChange={onChange} 
                  placeholder="YYYY-MM-DD (optional)"
                />
                <span className="text-xs text-gray-500">Optional. If unknown, leave blank.</span>
                {errors.birthDate && <p className="text-red-500 text-xs mt-1">{errors.birthDate}</p>}
              </div>
            </div>
          </div>
          {/* Characteristics */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Characteristics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Temperament *</label>
                <select
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 ${errors.temperament ? 'border-red-300' : 'border-gray-300'}`}
                  name="temperament"
                  value={initialValues.temperament}
                  onChange={onChange}
                  required
                >
                  <option value="">Choose...</option>
                  <option value="Friendly">Friendly</option>
                  <option value="Calm">Calm</option>
                  <option value="Active">Active</option>
                  <option value="Shy">Shy</option>
                  <option value="Aggressive">Aggressive</option>
                  <option value="Other">Other</option>
                </select>
                {errors.temperament && <p className="text-red-500 text-xs mt-1">{errors.temperament}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Health Status *</label>
                <select
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 ${errors.healthStatus ? 'border-red-300' : 'border-gray-300'}`}
                  name="healthStatus"
                  value={initialValues.healthStatus}
                  onChange={onChange}
                  required
                >
                  <option value="">Choose...</option>
                  <option value="Healthy">Healthy</option>
                  <option value="Special Needs">Special Needs</option>
                  <option value="Medical Attention">Medical Attention</option>
                  <option value="Other">Other</option>
                </select>
                {errors.healthStatus && <p className="text-red-500 text-xs mt-1">{errors.healthStatus}</p>}
              </div>
            </div>
          </div>
          {/* Pricing */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Pricing</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (₱) *</label>
                <input 
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 ${errors.price ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="0.00"
                  type="number" 
                  step="0.01"
                  min="0"
                  name="price" 
                  value={initialValues.price} 
                  onChange={onChange} 
                  required 
                />
                {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select 
                  className="appearance-none w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  name="status" 
                  value={initialValues.status} 
                  onChange={onChange} 
                  required
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="PENDING">Pending</option>
                  <option value="REHOMED">Rehomed</option>
                </select>
              </div>
            </div>
          </div>
          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
            <select
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 ${errors.type ? 'border-red-300' : 'border-gray-300'}`}
              name="type"
              value={initialValues.type}
              onChange={onChange}
              required
            >
              <option value="">Choose...</option>
              <option value="Purebred">Purebred</option>
              <option value="Mixed">Mixed</option>
              <option value="Rescue">Rescue</option>
              <option value="Other">Other</option>
            </select>
            {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
          </div>
          {/* Images */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Images</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Images (max 3, JPG/PNG) - {images.length}/3
              </label>
              <label htmlFor="dog-image-upload" className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold cursor-pointer hover:bg-blue-700 transition mb-2">
                Browse...
                <input
                  id="dog-image-upload"
                  type="file"
                  accept="image/jpeg,image/png"
                  multiple
                  onChange={onImageChange}
                  disabled={loading}
                  className="hidden"
                />
              </label>
              <span className="ml-2 text-gray-600 text-sm align-middle">{images.length === 0 ? 'No files selected.' : `${images.length} file(s) selected.`}</span>
              {imagePreviews.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">Preview:</p>
                  <div className="flex gap-3">
                    {imagePreviews.map((src, idx) => (
                      <div key={idx} className="relative">
                        <img 
                          src={src} 
                          alt={`Preview ${idx + 1}`} 
                          className="w-24 h-24 object-cover rounded-lg border border-gray-300" 
                        />
                        <button
                          type="button"
                          onClick={() => onRemoveImage(idx)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button 
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button 
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50" 
              type="submit" 
              disabled={loading}
            >
              {loading ? (mode === 'add' ? 'Saving...' : 'Updating...') : (mode === 'add' ? 'Add Dog' : 'Update Dog')}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default DogFormModal;