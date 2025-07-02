"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, Heart, Eye } from 'lucide-react';
import Navbar from './components/Navbar';
import Modal from './components/Modal';
import AuthForm from './components/AuthForm';
import DogCard from './components/DogCard';
import DogDetailModal from './components/DogDetailModal';

interface UserInfo {
  email: string;
  role: string;
  name: string;
}

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

interface FilterState {
  breed: string;
  type: string;
  temperament: string;
  status: string;
}

const API_BASE = 'http://localhost:4000';

export default function Home() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    breed: '',
    type: '',
    temperament: '',
    status: 'AVAILABLE,PENDING,REHOMED',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDog, setSelectedDog] = useState<Dog | null>(null);
  const [breeds, setBreeds] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [screeningStatus, setScreeningStatus] = useState<'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED'>('NOT_SUBMITTED');
  const [showScreeningModal, setShowScreeningModal] = useState(false);
  const [showScreeningBanner, setShowScreeningBanner] = useState(false);
  const [applications, setApplications] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [appsError, setAppsError] = useState<string | null>(null);
  const [favoritesError, setFavoritesError] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState('');
  const [withdrawTargetId, setWithdrawTargetId] = useState<number | null>(null);
  const [withdrawError, setWithdrawError] = useState('');
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const router = useRouter();

  // Fetch user info and check if buyer is approved
  useEffect(() => {
    if (token) {
      fetchUserInfo();
    }
  }, [token]);

  // Fetch dogs and filter options
  useEffect(() => {
    fetchDogs();
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    const storedToken =
      typeof window !== 'undefined'
        ? localStorage.getItem('pawmart_token') || sessionStorage.getItem('pawmart_token')
        : null;
    setToken(storedToken);
  }, []);

  useEffect(() => {
    if (
      user?.role === 'BUYER' &&
      (screeningStatus === 'NOT_SUBMITTED' || screeningStatus === 'REJECTED') &&
      !sessionStorage.getItem('screeningModalDismissed')
    ) {
      setShowScreeningModal(true);
    } else {
      setShowScreeningModal(false);
    }
    if (
      user?.role === 'BUYER' &&
      (screeningStatus === 'NOT_SUBMITTED' || screeningStatus === 'REJECTED') &&
      !sessionStorage.getItem('screeningBannerDismissed')
    ) {
      setShowScreeningBanner(true);
    } else {
      setShowScreeningBanner(false);
    }
  }, [user, screeningStatus]);

  // Fetch applications and favorites for buyers
  useEffect(() => {
    if (user?.role === 'BUYER' && token) {
      setAppsLoading(true);
      fetch(`${API_BASE}/api/applications/my`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          setApplications(data?.applications || []);
          setAppsLoading(false);
        })
        .catch(() => {
          setAppsError('Failed to load applications');
          setAppsLoading(false);
        });
      setFavoritesLoading(true);
      fetch(`${API_BASE}/api/favorites/my`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          setFavorites(data?.favorites || []);
          setFavoritesLoading(false);
        })
        .catch(() => {
          setFavoritesError('Failed to load favorites');
          setFavoritesLoading(false);
        });
      // Fetch screening rejection reason if needed
      fetch(`${API_BASE}/api/screening/my-status`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          setRejectionReason(data?.adminNote || null);
        });
    }
  }, [user, token]);

  // Fetch unread messages for badge
  useEffect(() => {
    if (user?.role === 'BUYER' && token) {
      fetch(`${API_BASE}/api/messages/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          setHasUnreadMessages((data?.unread || 0) > 0);
        })
        .catch(() => setHasUnreadMessages(false));
    }
  }, [user, token]);

  const fetchUserInfo = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const userInfo = { email: data.user.email, role: data.user.role, name: data.user.name };
        setUser(userInfo);
        
        // Check if buyer is approved
        if (data.user.role === 'BUYER') {
          fetch(`${API_BASE}/api/screening/my-status`, {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then(res => res.ok ? res.json() : null)
            .then(data => {
              setScreeningStatus(data?.status || 'NOT_SUBMITTED');
            });
        } else {
          setScreeningStatus('NOT_SUBMITTED');
        }
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  const fetchDogs = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        ...(filters.status !== 'ALL' ? { status: filters.status } : {}),
        ...(filters.breed && { breed: filters.breed }),
        ...(filters.type && { type: filters.type }),
        ...(filters.temperament && { temperament: filters.temperament }),
      });
      const res = await fetch(`${API_BASE}/api/dogs?${queryParams}`);
      if (res.ok) {
        const data = await res.json();
        setDogs(data.dogs);
      }
    } catch (error) {
      console.error('Error fetching dogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const [breedsRes, typesRes] = await Promise.all([
        fetch(`${API_BASE}/api/dogs/breeds/available`),
        fetch(`${API_BASE}/api/dogs/types/available`)
      ]);

      if (breedsRes.ok) {
        const breedsData = await breedsRes.json();
        setBreeds(breedsData.breeds);
      }

      if (typesRes.ok) {
        const typesData = await typesRes.json();
        setTypes(typesData.types);
      }
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const handleLoginSuccess = (token: string, user: UserInfo) => {
    setToken(token);
    setUser({ ...user, name: user.name });
    setAuthModalOpen(false);
    if (user.role === 'ADMIN' || user.role === 'STAFF') {
      router.push('/dashboard');
    } else {
      fetch(`${API_BASE}/api/screening/my-status`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          setScreeningStatus(data?.status || 'NOT_SUBMITTED');
        });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('pawmart_token');
    sessionStorage.removeItem('pawmart_token');
    setToken(null);
    setUser(null);
    setScreeningStatus('NOT_SUBMITTED');
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchDogs();
  };

  const clearFilters = () => {
    setFilters({
      breed: '',
      type: '',
      temperament: '',
      status: 'AVAILABLE,PENDING,REHOMED',
    });
    fetchDogs();
  };

  const filteredDogs = dogs.filter(dog => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        dog.name.toLowerCase().includes(searchLower) ||
        dog.breed.toLowerCase().includes(searchLower) ||
        dog.temperament.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const handleRequestRehoming = (dog: Dog) => {
    if (!token) {
      setAuthModalOpen(true);
      return;
    }
    if (screeningStatus === 'NOT_SUBMITTED' || screeningStatus === 'REJECTED') {
      alert('You must complete and submit the screening form before you can request to rehome a pet.');
      router.push('/screening');
      return;
    }
    setSelectedDog(dog);
    // Open the DogDetailModal or application modal for this dog
  };

  const handleFavoriteToggle = async (dogId: number, newState: boolean) => {
    if (!token) {
      setAuthModalOpen(true);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/favorites${newState ? '' : `/${dogId}`}`, {
        method: newState ? 'POST' : 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: newState ? JSON.stringify({ dogId }) : undefined,
      });

      if (res.ok) {
        // Update favorites list
        if (newState) {
          // Add to favorites
          const dog = dogs.find(d => d.id === dogId);
          if (dog) {
            setFavorites(prev => [...prev, { id: Date.now(), dog }]);
          }
        } else {
          // Remove from favorites
          setFavorites(prev => prev.filter(fav => fav.dog.id !== dogId));
        }
      } else {
        console.error('Failed to toggle favorite');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const isDogFavorited = (dogId: number) => {
    return favorites.some(fav => fav.dog.id === dogId);
  };

  return (
    <>
      <Navbar
        onAuthClick={() => setAuthModalOpen(true)}
        loggedIn={!!token}
        onLogout={handleLogout}
        user={user}
      />
      <div className="flex min-h-screen bg-gray-50">
        {/* Sidebar for buyers */}
        {user?.role === 'BUYER' && (
          <aside className="w-full max-w-xs bg-white border-r shadow-lg p-6 flex flex-col gap-8 min-h-screen sticky top-0 rounded-r-2xl">
            {/* Screening Status */}
            <div className="rounded-xl shadow-sm bg-gray-50 p-4 mb-2">
              <h2 className="text-lg font-bold mb-2 text-blue-700">Screening Status</h2>
              {screeningStatus === 'APPROVED' && (
                <div className="bg-green-100 border border-green-400 text-green-800 rounded p-3 font-semibold text-center">
                  Approved – You can now request to rehome a dog!
                </div>
              )}
              {screeningStatus === 'REJECTED' && (
                <div className="bg-red-100 border border-red-400 text-red-800 rounded p-3 font-semibold text-center">
                  Rejected
                  {rejectionReason && (
                    <div className="bg-red-50 border-l-4 border-red-400 p-2 text-red-800 rounded my-2">
                      <b>Reason:</b> {rejectionReason}
                    </div>
                  )}
                  <button
                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 font-semibold mt-2"
                    onClick={() => router.push('/screening')}
                  >
                    Edit and Resubmit
                  </button>
                </div>
              )}
              {screeningStatus === 'PENDING' && (
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 rounded p-3 font-semibold text-center">
                  Pending – Waiting for admin review.
                </div>
              )}
              {screeningStatus === 'NOT_SUBMITTED' && (
                <div className="bg-blue-100 border border-blue-400 text-blue-800 rounded p-3 font-semibold text-center">
                  {(() => {
                    const rejectionReason = typeof window !== 'undefined' ? localStorage.getItem('pawmart_rejection_reason') : null;
                    if (rejectionReason) {
                      return (
                        <>
                          <div className="bg-red-50 border-l-4 border-red-400 p-2 text-red-800 rounded mb-2">
                            <b>Your previous application was rejected.</b><br />
                            <span>Reason: {rejectionReason}</span>
                          </div>
                          <button
                            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 font-semibold mt-2 ml-2"
                            onClick={() => router.push('/screening')}
                          >
                            Complete Screening
                          </button>
                        </>
                      );
                    }
                    return (
                      <>
                        Not submitted
                        <button
                          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 font-semibold mt-2 ml-2"
                          onClick={() => router.push('/screening')}
                        >
                          Complete Screening
                        </button>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
            {/* My Applications */}
            <div className="rounded-xl shadow-sm bg-gray-50 p-4 mb-2">
              <h2 className="text-lg font-bold mb-2 text-blue-700">My Applications</h2>
              {appsLoading ? (
                <div className="text-gray-500">Loading...</div>
              ) : appsError ? (
                <div className="text-red-600">{appsError}</div>
              ) : applications.length === 0 ? (
                <div className="text-gray-500">No applications yet.</div>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {applications.map((app) => (
                    <div key={app.id} className="border rounded p-2 bg-white flex flex-col gap-1 shadow-sm">
                      <div className="font-semibold text-sm">{app.dog.name}</div>
                      <div className="text-xs text-gray-600">Status: <span className={`font-bold ${app.status === 'APPROVED' ? 'text-green-700' : app.status === 'REJECTED' ? 'text-red-700' : app.status === 'WITHDRAWN' ? 'text-gray-700' : 'text-yellow-700'}`}>{app.status}</span></div>
                      {app.status === 'PENDING' && (
                        <button
                          className="bg-red-600 text-white px-2 py-0.5 rounded hover:bg-red-700 text-xs font-semibold mt-1"
                          onClick={() => {
                            setWithdrawTargetId(app.id);
                            setWithdrawModalOpen(true);
                            setWithdrawReason('');
                            setWithdrawError('');
                          }}
                        >
                          Withdraw
                        </button>
                      )}
                      {app.status === 'WITHDRAWN' && app.withdrawNote && (
                        <div className="text-xs text-gray-500 mt-1"><b>Withdrawn Reason:</b> {app.withdrawNote}</div>
                      )}
                      {app.status === 'REJECTED' && app.adminNote && (
                        <div className="text-xs text-red-700 mt-1"><b>Rejection Reason:</b> {app.adminNote}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* My Favorites */}
            <div className="rounded-xl shadow-sm bg-gray-50 p-4 mb-2">
              <h2 className="text-lg font-bold mb-2 text-pink-700 flex items-center gap-1">My Favorites <Heart className="w-4 h-4 text-pink-500" /></h2>
              {favoritesLoading ? (
                <div className="text-gray-500">Loading...</div>
              ) : favoritesError ? (
                <div className="text-red-600">{favoritesError}</div>
              ) : favorites.length === 0 ? (
                <div className="text-gray-500">No favorites yet.</div>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {favorites.map((fav) => (
                    <div key={fav.id} className="flex items-center gap-2 border rounded p-2 bg-white shadow-sm">
                      <img
                        src={fav.dog.images && fav.dog.images.length > 0 ? `${API_BASE}/${fav.dog.images[0]}` : '/placeholder-dog.jpg'}
                        alt={fav.dog.name}
                        className="w-8 h-8 object-cover rounded-md border"
                      />
                      <div className="flex-1 text-xs font-semibold">{fav.dog.name}</div>
                      <button
                        className="bg-blue-600 text-white px-2 py-0.5 rounded hover:bg-blue-700 text-xs font-semibold"
                        onClick={() => setSelectedDog(fav.dog)}
                      >
                        View
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Messages */}
            <div className="relative">
              <button
                className="w-full flex items-center gap-2 px-4 py-2 mt-4 bg-blue-50 text-blue-800 rounded-lg font-semibold hover:bg-blue-100 transition-colors justify-center relative shadow"
                onClick={() => router.push('/messages')}
              >
                <span>Messages</span>
                {hasUnreadMessages && (
                  <span className="absolute top-2 right-6 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                )}
              </button>
            </div>
          </aside>
        )}
        {/* Main content area */}
        <main className="flex-1 px-4 py-8">
          {/* Auth Modal */}
          <Modal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)}>
            <AuthForm onLoginSuccess={handleLoginSuccess} />
          </Modal>

          {/* Screening Prompt Modal */}
          <Modal isOpen={showScreeningModal} onClose={() => {
            setShowScreeningModal(false);
            sessionStorage.setItem('screeningModalDismissed', '1');
          }}>
            <div className="p-4 max-w-md mx-auto">
              <h2 className="text-2xl font-bold mb-2 text-blue-800">Complete Your Screening</h2>
              <p className="mb-4 text-gray-700">Complete your screening now to become eligible to rehome a pet! You can browse listings, but you'll need to finish this step to request to rehome.</p>
              <div className="flex gap-3 mt-4">
                <button
                  className="flex-1 bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700"
                  onClick={() => { setShowScreeningModal(false); sessionStorage.setItem('screeningModalDismissed', '1'); router.push('/screening'); }}
                >
                  Complete Screening Now
                </button>
                <button
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded font-semibold hover:bg-gray-400"
                  onClick={() => { setShowScreeningModal(false); sessionStorage.setItem('screeningModalDismissed', '1'); }}
                >
                  Skip for Now
                </button>
              </div>
            </div>
          </Modal>

          {/* Screening Banner */}
          {showScreeningBanner && (
            <div className="fixed top-0 left-0 w-full z-40 bg-blue-100 border-b border-blue-300 text-blue-900 flex items-center justify-between px-4 py-2 text-sm shadow">
              <span>Complete your screening to become eligible to rehome a pet.</span>
              <div className="flex gap-2 items-center">
                <button
                  className="bg-blue-600 text-white px-3 py-1 rounded font-semibold hover:bg-blue-700 text-xs"
                  onClick={() => router.push('/screening')}
                >
                  Complete Screening
                </button>
                <button
                  className="text-blue-900 hover:text-blue-700 text-lg font-bold px-2"
                  onClick={() => { setShowScreeningBanner(false); sessionStorage.setItem('screeningBannerDismissed', '1'); }}
                  aria-label="Dismiss"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Hero Section */}
          <section className="mt-16 text-center max-w-4xl mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-gray-900">
              Every Dog Deserves a Loving Home.<br />
              <span className="text-yellow-500">Adopt</span> a Dog Today
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Browse our available dogs and learn more about the adoption process. Together, we can <span className="font-semibold">rescue, rehabilitate, and rehome</span> dogs in need.
            </p>
            
            {/* Search Bar */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-8">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search dogs by name, breed, or temperament..."
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                <Filter className="w-5 h-5" />
                Filters
              </button>
            </div>
          </section>

          {/* Filters Section */}
          {showFilters && (
            <section className="max-w-6xl mx-auto px-4 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Breed</label>
                    <select
                      className="appearance-none w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={filters.breed}
                      onChange={(e) => handleFilterChange('breed', e.target.value)}
                    >
                      <option value="">All Breeds</option>
                      {breeds.map(breed => (
                        <option key={breed} value={breed}>{breed}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <select
                      className="appearance-none w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={filters.type}
                      onChange={(e) => handleFilterChange('type', e.target.value)}
                    >
                      <option value="">All Types</option>
                      {types.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Temperament</label>
                    <select
                      className="appearance-none w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={filters.temperament}
                      onChange={(e) => handleFilterChange('temperament', e.target.value)}
                    >
                      <option value="">All Temperaments</option>
                      <option value="friendly">Friendly</option>
                      <option value="energetic">Energetic</option>
                      <option value="calm">Calm</option>
                      <option value="aggressive">Aggressive</option>
                      <option value="good with kids">Good with Kids</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={filters.status}
                      onChange={e => handleFilterChange('status', e.target.value)}
                      className="appearance-none w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="AVAILABLE">Available</option>
                      <option value="PENDING">Pending</option>
                      <option value="REHOMED">Rehomed</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex gap-4 mt-4">
                  <button
                    onClick={applyFilters}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-blue-700 transition"
                  >
                    Apply Filters
                  </button>
                  <button
                    onClick={clearFilters}
                    className="bg-gray-500 text-white px-6 py-2 rounded-md font-semibold hover:bg-gray-600 transition"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Dog Detail Modal */}
          {selectedDog && (
            <DogDetailModal
              dog={selectedDog}
              onClose={() => setSelectedDog(null)}
              onRequestRehoming={() => handleRequestRehoming(selectedDog)}
              userRole={user?.role}
              screeningStatus={screeningStatus}
            />
          )}

          {/* Dog Listings */}
          <section className="max-w-7xl mx-auto px-4 mb-16">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Dogs Available for Adoption
              </h2>
              <div className="text-gray-600">
                {loading ? 'Loading...' : `${filteredDogs.length} dogs found`}
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="text-xl text-gray-600">Loading dogs...</div>
              </div>
            ) : filteredDogs.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-xl text-gray-600 mb-4">No dogs found matching your criteria</div>
                <button
                  onClick={clearFilters}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-blue-700 transition"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredDogs.map((dog) => (
                  <DogCard
                    key={dog.id}
                    dog={dog}
                    onViewDetails={() => {
                      if (!token) {
                        setAuthModalOpen(true);
                      } else {
                        setSelectedDog(dog);
                      }
                    }}
                    onRequestRehoming={() => handleRequestRehoming(dog)}
                    userRole={user?.role}
                    screeningStatus={screeningStatus}
                    favorited={isDogFavorited(dog.id)}
                    onFavoriteToggle={handleFavoriteToggle}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Footer */}
          <footer className="bg-gray-800 text-white py-12 mt-16">
            <div className="max-w-7xl mx-auto px-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <h3 className="text-xl font-bold text-blue-400 mb-4">PawMart</h3>
                  <p className="text-gray-300 mb-4">
                    Connecting loving homes with dogs in need. Every dog deserves a second chance at happiness.
                  </p>
                  <div className="flex space-x-4">
                    <a 
                      href="https://www.facebook.com/profile.php?id=61559944062409"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-300 hover:text-blue-400 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </a>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-blue-400 mb-4">Quick Links</h3>
                  <ul className="space-y-2">
                    <li>
                      <a 
                        href="/screening" 
                        className="text-gray-300 hover:text-blue-400 transition-colors"
                      >
                        Screening Process
                      </a>
                    </li>
                    <li>
                      <a 
                        href="/faq" 
                        className="text-gray-300 hover:text-blue-400 transition-colors"
                      >
                        FAQ
                      </a>
                    </li>
                    <li>
                      <a 
                        href="/about" 
                        className="text-gray-300 hover:text-blue-400 transition-colors"
                      >
                        About Us
                      </a>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-blue-400 mb-4">Contact Info</h3>
                  <div className="space-y-2 text-gray-300">
                    <p>
                      <strong>Email:</strong><br />
                      <a 
                        href="mailto:vomhauseyoiinu@gmail.com" 
                        className="hover:text-blue-400 transition-colors"
                      >
                        vomhauseyoiinu@gmail.com
                      </a>
                    </p>
                    <p>
                      <strong>Hours:</strong><br />
                      9:00 AM - 5:00 PM<br />
                      Monday - Saturday
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
                <p>&copy; 2024 PawMart. All rights reserved.</p>
              </div>
            </div>
          </footer>

          {/* Withdraw Application Modal */}
          <Modal isOpen={withdrawModalOpen} onClose={() => setWithdrawModalOpen(false)}>
            <div className="p-4 max-w-md mx-auto">
              <h2 className="text-xl font-bold mb-2 text-blue-800">Withdraw Application</h2>
              <p className="mb-2 text-gray-700">Please provide a reason for withdrawing your application. This will be sent to the admin.</p>
              <textarea
                className="w-full border rounded-lg p-2 mb-4 text-gray-900"
                rows={4}
                value={withdrawReason}
                onChange={e => setWithdrawReason(e.target.value)}
                placeholder="Enter reason for withdrawal..."
                required
                disabled={false}
              />
              {withdrawError && <div className="text-red-600 text-sm mb-2">{withdrawError}</div>}
              <div className="flex gap-2 justify-end">
                <button
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded font-semibold hover:bg-gray-400"
                  onClick={() => setWithdrawModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="bg-red-600 text-white px-4 py-2 rounded font-semibold hover:bg-red-700"
                  onClick={async () => {
                    if (!withdrawReason.trim()) {
                      setWithdrawError('Reason is required');
                      return;
                    }
                    setWithdrawError('');
                    if (withdrawTargetId) {
                      const token = localStorage.getItem('pawmart_token') || sessionStorage.getItem('pawmart_token');
                      const res = await fetch(`${API_BASE}/api/applications/${withdrawTargetId}/withdraw`, {
                        method: 'PATCH',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ reason: withdrawReason.trim() }),
                      });
                      if (res.ok) {
                        const data = await res.json();
                        setApplications((prev) => prev.map((a) => a.id === withdrawTargetId ? data.application : a));
                        setWithdrawModalOpen(false);
                      } else {
                        const data = await res.json().catch(() => ({}));
                        setWithdrawError(data.error || 'Failed to withdraw application');
                      }
                    }
                  }}
                  disabled={!withdrawReason.trim()}
                >
                  Withdraw
                </button>
              </div>
            </div>
          </Modal>
        </main>
      </div>
    </>
  );
}
