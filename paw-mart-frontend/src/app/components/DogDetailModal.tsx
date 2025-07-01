import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Heart, Calendar, MapPin } from 'lucide-react';
import Modal from './Modal';

interface Dog {
  id: number;
  name: string;
  breed: string;
  type: string;
  birthDate: string;
  temperament: string;
  healthStatus: string;
  images: string[];
  price: number;
  status: 'AVAILABLE' | 'PENDING' | 'REHOMED';
  createdAt: string;
}

interface DogDetailModalProps {
  dog: Dog;
  onClose: () => void;
  onRequestRehoming: () => void;
  userRole?: string;
  screeningStatus?: 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED';
}

const DogDetailModal: React.FC<DogDetailModalProps> = ({
  dog,
  onClose,
  onRequestRehoming,
  userRole,
  screeningStatus = 'NOT_SUBMITTED',
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showAppModal, setShowAppModal] = useState(false);
  const [appMessage, setAppMessage] = useState('');
  const [appLoading, setAppLoading] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);
  const [appSuccess, setAppSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'documents'>('details');
  const [documents, setDocuments] = useState<any[]>([]);
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDesc, setUploadDesc] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'REHOMED':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'Available';
      case 'PENDING':
        return 'Pending';
      case 'REHOMED':
        return 'Rehomed';
      default:
        return status;
    }
  };

  const canRequest = userRole === 'BUYER' && dog.status === 'AVAILABLE';
  let requestButton = null;
  let statusMessage = null;
  if (canRequest) {
    if (screeningStatus === 'NOT_SUBMITTED') {
      requestButton = (
        <button
          onClick={onRequestRehoming}
          className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 mt-4"
        >
          <Heart className="w-5 h-5" />
          Request to Rehome
        </button>
      );
      statusMessage = (
        <p className="text-sm text-yellow-800 mt-2">Complete background screening to request rehoming.</p>
      );
    } else if (screeningStatus === 'PENDING') {
      requestButton = (
        <button
          disabled
          className="w-full bg-yellow-400 text-white py-3 rounded-lg font-semibold cursor-not-allowed opacity-70 flex items-center justify-center gap-2 mt-4"
        >
          <Heart className="w-5 h-5" />
          Pending Approval
        </button>
      );
      statusMessage = (
        <p className="text-sm text-yellow-800 mt-2">Your application is pending admin review.</p>
      );
    } else if (screeningStatus === 'REJECTED') {
      requestButton = (
        <button
          disabled
          className="w-full bg-red-500 text-white py-3 rounded-lg font-semibold cursor-not-allowed opacity-70 flex items-center justify-center gap-2 mt-4"
        >
          <Heart className="w-5 h-5" />
          Rejected
        </button>
      );
      statusMessage = (
        <p className="text-sm text-red-700 mt-2">Your application was rejected. Please contact support.</p>
      );
    } else if (screeningStatus === 'APPROVED') {
      requestButton = (
        <button
          onClick={() => setShowAppModal(true)}
          className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 mt-4"
        >
          <Heart className="w-5 h-5" />
          Request to Rehome
        </button>
      );
    }
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === (dog.images?.length || 1) - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? (dog.images?.length || 1) - 1 : prev - 1
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    const ageInMonths = (today.getFullYear() - birth.getFullYear()) * 12 + 
                       (today.getMonth() - birth.getMonth());
    
    if (ageInMonths < 12) {
      return `${ageInMonths} month${ageInMonths !== 1 ? 's' : ''}`;
    } else {
      const years = Math.floor(ageInMonths / 12);
      const months = ageInMonths % 12;
      if (months === 0) {
        return `${years} year${years !== 1 ? 's' : ''}`;
      } else {
        return `${years} year${years !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''}`;
      }
    }
  };

  const fetchDocuments = async () => {
    setDocLoading(true);
    setDocError('');
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('pawmart_token') || sessionStorage.getItem('pawmart_token') : null;
      const res = await fetch(`http://localhost:4000/api/dogs/${dog.id}/documents`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed to load documents');
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch (err: any) {
      setDocError(err.message || 'Failed to load documents');
    } finally {
      setDocLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'documents') fetchDocuments();
    // eslint-disable-next-line
  }, [activeTab]);

  const handleUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('pawmart_token') || sessionStorage.getItem('pawmart_token') : null;
      const formData = new FormData();
      formData.append('file', uploadFile);
      if (uploadDesc) formData.append('description', uploadDesc);
      const res = await fetch(`http://localhost:4000/api/dogs/${dog.id}/documents`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        setUploadFile(null);
        setUploadDesc('');
        fetchDocuments();
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDoc = async (docId: number) => {
    if (!window.confirm('Delete this document?')) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('pawmart_token') || sessionStorage.getItem('pawmart_token') : null;
    const res = await fetch(`http://localhost:4000/api/dogs/${dog.id}/documents/${docId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) fetchDocuments();
  };

  const handleDownloadDoc = async (docId: number) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('pawmart_token') || sessionStorage.getItem('pawmart_token') : null;
    const res = await fetch(`http://localhost:4000/api/dogs/${dog.id}/documents/${docId}/download`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = documents.find(d => d.id === docId)?.fileName || 'document';
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">{dog.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex gap-4 border-b mb-6">
            <button className={`py-2 px-4 font-semibold ${activeTab === 'details' ? 'border-b-2 border-blue-600 text-blue-700' : 'text-gray-600'}`} onClick={() => setActiveTab('details')}>Details</button>
            <button className={`py-2 px-4 font-semibold ${activeTab === 'documents' ? 'border-b-2 border-blue-600 text-blue-700' : 'text-gray-600'}`} onClick={() => setActiveTab('documents')}>Documents</button>
          </div>
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Image Gallery */}
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={dog.images && dog.images.length > 0 
                      ? `http://localhost:4000/${dog.images[currentImageIndex]}` 
                      : 'https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&w=400&q=80'
                    }
                    alt={`${dog.name} - Image ${currentImageIndex + 1}`}
                    className="w-full h-80 object-cover rounded-lg"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&w=400&q=80';
                    }}
                  />
                  
                  {/* Navigation arrows */}
                  {dog.images && dog.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 rounded-full p-2 hover:bg-opacity-100 transition-all"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 rounded-full p-2 hover:bg-opacity-100 transition-all"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnail navigation */}
                {dog.images && dog.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto">
                    {dog.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 ${
                          index === currentImageIndex ? 'border-blue-500' : 'border-gray-200'
                        }`}
                      >
                        <img
                          src={`http://localhost:4000/${image}`}
                          alt={`${dog.name} thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&w=400&q=80';
                          }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Dog Information */}
              <div className="space-y-6">
                {/* Status */}
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(dog.status)}`}>
                    {getStatusText(dog.status)}
                  </span>
                </div>

                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Basic Information</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Breed:</span>
                        <span className="font-medium">{dog.breed}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-medium">{dog.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Age:</span>
                        <span className="font-medium">{calculateAge(dog.birthDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Birth Date:</span>
                        <span className="font-medium">{formatDate(dog.birthDate)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Temperament & Health */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Characteristics</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Temperament:</span>
                        <span className="font-medium">{dog.temperament}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Health Status:</span>
                        <span className="font-medium">{dog.healthStatus}</span>
                      </div>
                    </div>
                  </div>

                  {/* Price (only for approved buyers) */}
                  {userRole === 'BUYER' && dog.status === 'AVAILABLE' && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Pricing</h3>
                      <div className="text-2xl font-bold text-blue-600">
                        ₱{dog.price.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 italic">
                        Disclaimer: This price is not final and does not include rehoming fees. The final amount will be discussed during the adoption process.
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Contact admin for detailed cost breakdown and agreement
                      </p>
                    </div>
                  )}

                  {/* Request to Rehome Button */}
                  {userRole === 'BUYER' && dog.status === 'AVAILABLE' && requestButton}
                  {userRole === 'BUYER' && dog.status === 'AVAILABLE' && statusMessage}

                  {/* Additional Info */}
                  <div className="text-sm text-gray-500">
                    <p>• All dogs come with health records and vaccination history</p>
                    <p>• Background screening required for all potential adopters</p>
                    <p>• Contact admin for detailed adoption process</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'documents' && (
            <div>
              {userRole === 'ADMIN' && (
                <div className="mb-4 flex flex-col md:flex-row gap-2 items-end">
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setUploadFile(e.target.files?.[0] || null)} className="border rounded px-2 py-1" />
                  <input type="text" placeholder="Description (optional)" value={uploadDesc} onChange={e => setUploadDesc(e.target.value)} className="border rounded px-2 py-1 flex-1" />
                  <button className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700" onClick={handleUpload} disabled={uploading || !uploadFile}>{uploading ? 'Uploading...' : 'Upload'}</button>
                </div>
              )}
              {docLoading ? (
                <div className="text-gray-500">Loading documents...</div>
              ) : docError ? (
                <div className="text-red-600">{docError}</div>
              ) : (
                <table className="min-w-full text-sm border">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-2 px-4">File Name</th>
                      <th className="py-2 px-4">Type</th>
                      <th className="py-2 px-4">Description</th>
                      <th className="py-2 px-4">Uploaded</th>
                      <th className="py-2 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map(doc => (
                      <tr key={doc.id} className="border-b">
                        <td className="py-2 px-4">{doc.fileName}</td>
                        <td className="py-2 px-4">{doc.fileType}</td>
                        <td className="py-2 px-4">{doc.description || '-'}</td>
                        <td className="py-2 px-4">{new Date(doc.createdAt).toLocaleDateString()}</td>
                        <td className="py-2 px-4 flex gap-2">
                          <button className="text-indigo-600 hover:underline" onClick={() => handleDownloadDoc(doc.id)}>Download</button>
                          {userRole === 'ADMIN' && (
                            <button className="text-red-600 hover:underline" onClick={() => handleDeleteDoc(doc.id)}>Delete</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
        {/* Application Modal */}
        <Modal isOpen={showAppModal} onClose={() => setShowAppModal(false)}>
          <h3 className="text-lg font-bold mb-2">Request to Rehome {dog.name}</h3>
          {appSuccess ? (
            <div className="text-green-700 font-semibold py-4">Application submitted successfully!</div>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setAppLoading(true);
                setAppError(null);
                try {
                  const token = localStorage.getItem('pawmart_token') || sessionStorage.getItem('pawmart_token');
                  const res = await fetch('/api/applications', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ dogId: dog.id, message: appMessage })
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error || 'Failed to apply');
                  setAppSuccess(true);
                } catch (err: any) {
                  setAppError(err.message);
                } finally {
                  setAppLoading(false);
                }
              }}
              className="space-y-4"
            >
              <label className="block text-sm font-medium text-gray-700">Message to Admin</label>
              <textarea
                className="w-full border rounded-md p-2 min-h-[80px]"
                value={appMessage}
                onChange={e => setAppMessage(e.target.value)}
                required
                maxLength={500}
                placeholder="Tell us why you'd be a great match for {dog.name}..."
                disabled={appLoading}
              />
              {appError && <div className="text-red-600 text-sm">{appError}</div>}
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                  onClick={() => setShowAppModal(false)}
                  disabled={appLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-60"
                  disabled={appLoading || !appMessage.trim()}
                >
                  {appLoading ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default DogDetailModal; 