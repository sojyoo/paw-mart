"use client";
import DogFormModal from '../components/DogFormModal';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Dog,
  Users,
  FileText,
  Mail,
  Heart
} from 'lucide-react';
import DogCard from '../components/DogCard';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';

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
  gender?: 'UNKNOWN' | 'MALE' | 'FEMALE';
  size?: 'UNKNOWN' | 'SMALL' | 'MEDIUM' | 'LARGE';
  age?: number;
}

interface Buyer {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  screeningStatus: string;
}

// Add Invoice type at the top
interface Invoice {
  id: number;
  amount: number;
  breakdown: any;
  status: 'PENDING' | 'PAID' | 'REHOMED';
  createdAt: string;
  application: {
    buyer: { name: string };
    dog: { name: string };
  };
}

const sidebarLinks = [
  { key: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-5 h-5" /> },
  { key: 'dogs', label: 'Dog Management', icon: <Dog className="w-5 h-5" /> },
  { key: 'screenings', label: 'Screening Applications', icon: <FileText className="w-5 h-5" /> },
  { key: 'applications', label: 'Dog Applications', icon: <Heart className="w-5 h-5" /> },
  { key: 'transactions', label: 'Transactions', icon: <FileText className="w-5 h-5" /> },
  { key: 'finance', label: 'Finance', icon: <FileText className="w-5 h-5" /> },
  { key: 'messages', label: 'Messages', icon: <Mail className="w-5 h-5" /> },
];

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [activePage, setActivePage] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [dogModalOpen, setDogModalOpen] = useState(false);
  const [editDogModalOpen, setEditDogModalOpen] = useState(false);
  const [editingDog, setEditingDog] = useState<Dog | null>(null);
  const [addDogForm, setAddDogForm] = useState({
    name: '',
    breed: '',
    type: '',
    birthDate: '',
    temperament: '',
    healthStatus: '',
    price: '',
    costFood: '',
    costVitamins: '',
    costVet: '',
    costVaccine: '',
    costGrooming: '',
    costAccessories: '',
    status: 'AVAILABLE',
    ageCategory: '',
    gender: 'UNKNOWN',
    size: 'UNKNOWN',
    age: '',
  });
  const [addDogLoading, setAddDogLoading] = useState(false);
  const [addDogError, setAddDogError] = useState('');
  const [addDogSuccess, setAddDogSuccess] = useState('');
  const [addDogImages, setAddDogImages] = useState<File[]>([]);
  const [addDogImagePreviews, setAddDogImagePreviews] = useState<string[]>([]);      
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [editDogForm, setEditDogForm] = useState({
    name: '',
    breed: '',
    type: '',
    birthDate: '',
    temperament: '',
    healthStatus: '',
    price: '',
    costFood: '',
    costVitamins: '',
    costVet: '',
    costVaccine: '',
    costGrooming: '',
    costAccessories: '',
    status: 'AVAILABLE',
    ageCategory: '',
    gender: 'UNKNOWN',
    size: 'UNKNOWN',
    age: '',
  });
  const [editDogLoading, setEditDogLoading] = useState(false);
  const [editDogError, setEditDogError] = useState('');
  const [editDogSuccess, setEditDogSuccess] = useState('');
  const [editDogImages, setEditDogImages] = useState<File[]>([]);
  const [editDogImagePreviews, setEditDogImagePreviews] = useState<string[]>([]);
  const [editFormErrors, setEditFormErrors] = useState<{[key: string]: string}>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('createdAt');
  const [pendingBuyers, setPendingBuyers] = useState<Buyer[]>([]);
  const [buyersLoading, setBuyersLoading] = useState(false);
  const [buyersError, setBuyersError] = useState('');
  const [screenings, setScreenings] = useState<any[]>([]);
  const [screeningsLoading, setScreeningsLoading] = useState(false);
  const [screeningsError, setScreeningsError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [screeningStatusFilter, setScreeningStatusFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING');
  const [applications, setApplications] = useState<any[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [applicationsError, setApplicationsError] = useState('');
  const [applicationsStatusFilter, setApplicationsStatusFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN' | 'ALL'>('PENDING');
  const [appActionLoading, setAppActionLoading] = useState(false);
  const [appActionError, setAppActionError] = useState('');
  const [appActionNote, setAppActionNote] = useState('');
  const [appActionId, setAppActionId] = useState<number | null>(null);
  const [applicationDogFilter, setApplicationDogFilter] = useState<number | null>(null);
  const [applicationBuyerFilter, setApplicationBuyerFilter] = useState<number | null>(null);
  const [allDogs, setAllDogs] = useState<Dog[]>([]);
  const [allBuyers, setAllBuyers] = useState<Buyer[]>([]);

  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string>('');
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'month' | 'week' | 'year'>('month');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectTargetId, setRejectTargetId] = useState<number | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveTargetId, setApproveTargetId] = useState<number | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceTargetId, setInvoiceTargetId] = useState<number | null>(null);
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [invoiceBreakdown, setInvoiceBreakdown] = useState([{ description: '', amount: '' }]);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [showDogDetailsModal, setShowDogDetailsModal] = useState(false);
  const [selectedDog, setSelectedDog] = useState<Dog | null>(null);
  const [temperamentFilter, setTemperamentFilter] = useState('');
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoiceError, setInvoiceError] = useState('');
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('ALL');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [auditLogModalOpen, setAuditLogModalOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Add at the top of the Dashboard component:
  const fixedFields = [
    { key: 'Food Cost', label: 'Food Cost' },
    { key: 'Vitamins', label: 'Vitamins' },
    { key: 'Vet Care', label: 'Vet Care' },
    { key: 'Vaccines', label: 'Vaccines' },
    { key: 'Grooming', label: 'Grooming' },
    { key: 'Accessories', label: 'Accessories' },
  ];
  const [editBreakdown, setEditBreakdown] = useState<any[]>([]);
  const [editAmount, setEditAmount] = useState<number>(0);

  useEffect(() => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('pawmart_token') || sessionStorage.getItem('pawmart_token')
        : null;
    if (!token) {
      router.replace('/');
      return;
    }
    fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        console.log('Auth response status:', res.status);
        return res.ok ? res.json() : null;
      })
      .then(data => {
        console.log('Auth response data:', data);
        if (data && data.user && (data.user.role === 'ADMIN' || data.user.role === 'STAFF')) {
          console.log('Setting user:', data.user);
          setUser({ email: data.user.email, role: data.user.role, name: data.user.name });
        } else {
          console.log('Auth failed - redirecting to home');
          router.replace('/');
        }
        setLoading(false);
      })
      .catch(error => {
        console.error('Auth check error:', error);
        router.replace('/');
        setLoading(false);
      });
  }, [router]);

  useEffect(() => {
    if (activePage === 'dogs') {
      fetchDogs();
    }
  }, [activePage]);

  const fetchDogs = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/dogs?status=AVAILABLE,PENDING,REHOMED`);
      if (res.ok) {
        const data = await res.json();
        setDogs(data.dogs);
      }
    } catch (error) {
      console.error('Error fetching dogs:', error);
    }
  };

  const filteredAndSortedDogs = dogs
    .filter(dog =>
      (statusFilter === 'ALL' || dog.status === statusFilter) &&
      (!searchTerm ||
        dog.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dog.breed.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dog.type.toLowerCase().includes(searchTerm.toLowerCase())
      ) &&
      (!temperamentFilter || dog.temperament === temperamentFilter)
    )
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'breed') return a.breed.localeCompare(b.breed);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const handleAddDogChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setAddDogForm({ ...addDogForm, [e.target.name]: e.target.value });
  };

  const handleAddDogImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    const currentCount = addDogImages.length;
    const remainingSlots = 3 - currentCount;
    
    if (remainingSlots <= 0) {
      alert('Maximum 3 images allowed');
      return;
    }
    
    const filesToAdd = newFiles.slice(0, remainingSlots);
    const updatedFiles = [...addDogImages, ...filesToAdd];
    const updatedPreviews = updatedFiles.map(file => URL.createObjectURL(file));
    
    setAddDogImages(updatedFiles);
    setAddDogImagePreviews(updatedPreviews);
  };

  const resetAddDogForm = () => {
    setAddDogForm({
      name: '', breed: '', type: '', birthDate: '', temperament: '', healthStatus: '', 
      price: '', costFood: '', costVitamins: '', costVet: '', costVaccine: '', 
      costGrooming: '', costAccessories: '', status: 'AVAILABLE', ageCategory: '',
      gender: 'UNKNOWN', size: 'UNKNOWN', age: '',
    });
    setAddDogImages([]);
    setAddDogImagePreviews([]);
    setFormErrors({});
    setAddDogError('');
    setAddDogSuccess('');
  };

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    // Name: only letters and spaces
    if (!addDogForm.name.trim()) errors.name = 'Name is required';
    else if (!/^[A-Za-z\s]+$/.test(addDogForm.name.trim())) errors.name = 'Name must only contain letters and spaces';
    // Breed: only letters and spaces
    if (!addDogForm.breed.trim()) errors.breed = 'Breed is required';
    else if (!/^[A-Za-z\s]+$/.test(addDogForm.breed.trim())) errors.breed = 'Breed must only contain letters and spaces';
    // Type
    if (!addDogForm.type.trim()) errors.type = 'Type is required';
    // Age Category
    if (!addDogForm.ageCategory.trim()) errors.ageCategory = 'Age category is required';
    // Temperament
    if (!addDogForm.temperament.trim()) errors.temperament = 'Temperament is required';
    // Health Status
    if (!addDogForm.healthStatus.trim()) errors.healthStatus = 'Health status is required';
    // Age: if provided, must be a valid number >= 0
    if (addDogForm.age && (isNaN(Number(addDogForm.age)) || parseInt(addDogForm.age) < 0)) {
      errors.age = 'Age must be a valid number (≥0)';
    }
    // Price: valid number, >=500, max 2 decimals
    if (!addDogForm.price || isNaN(Number(addDogForm.price))) errors.price = 'Valid price is required';
    else if (parseFloat(addDogForm.price) < 500) errors.price = 'Price must be at least ₱500';
    else if (!/^\d+(\.\d{1,2})?$/.test(addDogForm.price)) errors.price = 'Max 2 decimal places allowed';
    // Cost fields: valid number, >=0, max 2 decimals
    const costFields: (keyof typeof addDogForm)[] = ['costFood','costVitamins','costVet','costVaccine','costGrooming','costAccessories'];
    costFields.forEach(field => {
      const val = addDogForm[field];
      if (val && (isNaN(Number(val)) || parseFloat(val) < 0 || !/^\d*(\.\d{1,2})?$/.test(val))) {
        errors[field] = 'Must be a valid number (max 2 decimals, ≥0)';
      }
    });
    // Birth date: if present, not in the future
    if (addDogForm.birthDate && new Date(addDogForm.birthDate) > new Date()) {
      errors.birthDate = 'Birth date cannot be in the future';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddDog = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      setAddDogError('Please fix the errors above');
      return;
    }
    
    setAddDogLoading(true);
    setAddDogError('');
    setAddDogSuccess('');
    try {
      const token = localStorage.getItem('pawmart_token') || sessionStorage.getItem('pawmart_token');
      const formData = new FormData();
      Object.entries(addDogForm).forEach(([key, value]) => {
        formData.append(key, value);
      });
      // Append images
      addDogImages.forEach((file, idx) => {
        formData.append('images', file);
      });
      const res = await fetch(`${API_BASE}/api/dogs`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add dog');
      }
      setAddDogSuccess('Dog added successfully!');
      resetAddDogForm();
      fetchDogs();
    } catch (err: any) {
      setAddDogError(err.message || 'Failed to add dog');
    } finally {
      setAddDogLoading(false);
    }
  };

  const handleEditDog = (dog: Dog) => {
    setEditingDog(dog);
    setEditDogForm({
      name: dog.name,
      breed: dog.breed,
      type: dog.type,
      birthDate: dog.birthDate,
      temperament: dog.temperament,
      healthStatus: dog.healthStatus,
      price: dog.price.toString(),
      costFood: '', // These would need to be fetched from backend
      costVitamins: '',
      costVet: '',
      costVaccine: '',
      costGrooming: '',
      costAccessories: '',
      status: dog.status,
      ageCategory: '',
      gender: dog.gender || 'UNKNOWN',
      size: dog.size || 'UNKNOWN',
      age: dog.age ? dog.age.toString() : '',
    });
    setEditDogImages([]);
    setEditDogImagePreviews([]);
    setEditDogError('');
    setEditDogSuccess('');
    setEditFormErrors({});
    setEditDogModalOpen(true);
  };

  const handleEditDogChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditDogForm({ ...editDogForm, [e.target.name]: e.target.value });
  };

  const handleEditDogImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    const currentCount = editDogImages.length;
    const remainingSlots = 3 - currentCount;
    
    if (remainingSlots <= 0) {
      alert('Maximum 3 images allowed');
      return;
    }
    
    const filesToAdd = newFiles.slice(0, remainingSlots);
    const updatedFiles = [...editDogImages, ...filesToAdd];
    const updatedPreviews = updatedFiles.map(file => URL.createObjectURL(file));
    
    setEditDogImages(updatedFiles);
    setEditDogImagePreviews(updatedPreviews);
  };

  const validateEditForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!editDogForm.name.trim()) errors.name = 'Name is required';
    if (!editDogForm.breed.trim()) errors.breed = 'Breed is required';
    if (!editDogForm.birthDate) errors.birthDate = 'Birth date is required';
    if (!editDogForm.temperament.trim()) errors.temperament = 'Temperament is required';
    if (!editDogForm.healthStatus.trim()) errors.healthStatus = 'Health status is required';
    if (!editDogForm.price || parseFloat(editDogForm.price) <= 0) errors.price = 'Valid price is required';
    
    // Age: if provided, must be a valid number >= 0
    if (editDogForm.age && (isNaN(Number(editDogForm.age)) || parseInt(editDogForm.age) < 0)) {
      errors.age = 'Age must be a valid number (≥0)';
    }
    
    // Validate birth date is not in the future
    if (editDogForm.birthDate && new Date(editDogForm.birthDate) > new Date()) {
      errors.birthDate = 'Birth date cannot be in the future';
    }
    
    // Validate price is reasonable
    if (editDogForm.price && parseFloat(editDogForm.price) > 10000) {
      errors.price = 'Price seems too high';
    }
    
    setEditFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateDog = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingDog) return;
    
    // Validate form before submission
    if (!validateEditForm()) {
      setEditDogError('Please fix the errors above');
      return;
    }
    
    setEditDogLoading(true);
    setEditDogError('');
    setEditDogSuccess('');
    
    try {
      const token = localStorage.getItem('pawmart_token') || sessionStorage.getItem('pawmart_token');
      const formData = new FormData();
      Object.entries(editDogForm).forEach(([key, value]) => {
        formData.append(key, value);
      });
      // Append new images
      editDogImages.forEach((file, idx) => {
        formData.append('images', file);
      });
      
      const res = await fetch(`${API_BASE}/api/dogs/${editingDog.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update dog');
      }
      
      setEditDogSuccess('Dog updated successfully!');
      setEditDogModalOpen(false);
      setEditingDog(null);
      fetchDogs();
    } catch (err: any) {
      setEditDogError(err.message || 'Failed to update dog');
    } finally {
      setEditDogLoading(false);
    }
  };

  const handleDeleteDog = async (dog: Dog) => {
    if (!confirm(`Are you sure you want to delete ${dog.name}? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const token = localStorage.getItem('pawmart_token') || sessionStorage.getItem('pawmart_token');
      const res = await fetch(`${API_BASE}/api/dogs/${dog.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete dog');
      }
      
      setAddDogSuccess(`${dog.name} has been deleted successfully!`);
      fetchDogs();
    } catch (err: any) {
      setAddDogError(err.message || 'Failed to delete dog');
    }
  };

  const fetchPendingBuyers = async () => {
    setBuyersLoading(true);
    setBuyersError('');
    try {
      const token = localStorage.getItem('pawmart_token') || sessionStorage.getItem('pawmart_token');
      const res = await fetch(`${API_BASE}/api/users?role=BUYER&status=inactive`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch buyers');
      const data = await res.json();
      setPendingBuyers(
        data.users.map((u: any) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          createdAt: u.createdAt,
          screeningStatus: u.backgroundScreening?.status || 'NOT_SUBMITTED',
        }))
      );
    } catch (err: any) {
      setBuyersError(err.message || 'Failed to fetch buyers');
    } finally {
      setBuyersLoading(false);
    }
  };

  useEffect(() => {
    if (activePage === 'buyers') fetchPendingBuyers();
  }, [activePage]);

  const handleApproveBuyer = async (buyer: Buyer) => {
    if (!window.confirm(`Approve ${buyer.name || buyer.email}?`)) return;
    try {
      setBuyersLoading(true);
      setBuyersError('');
      const token = localStorage.getItem('pawmart_token') || sessionStorage.getItem('pawmart_token');
      const res = await fetch(`${API_BASE}/api/users/${buyer.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: true }),
      });
      if (!res.ok) throw new Error('Failed to approve buyer');
      fetchPendingBuyers();
    } catch (err: any) {
      setBuyersError(err.message || 'Failed to approve buyer');
      setBuyersLoading(false);
    }
  };

  const handleRejectBuyer = async (buyer: Buyer) => {
    if (!window.confirm(`Reject (delete) ${buyer.name || buyer.email}? This cannot be undone.`)) return;
    try {
      setBuyersLoading(true);
      setBuyersError('');
      const token = localStorage.getItem('pawmart_token') || sessionStorage.getItem('pawmart_token');
      const res = await fetch(`${API_BASE}/api/users/${buyer.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to reject buyer');
      fetchPendingBuyers();
    } catch (err: any) {
      setBuyersError(err.message || 'Failed to reject buyer');
      setBuyersLoading(false);
    }
  };

  const fetchScreenings = async () => {
    setScreeningsLoading(true);
    setScreeningsError('');
    try {
      const token = localStorage.getItem('pawmart_token') || sessionStorage.getItem('pawmart_token');
              let url = `${API_BASE}/api/screening/all?limit=50`;
        if (screeningStatusFilter !== 'ALL') url += `&status=${screeningStatusFilter}`;
        const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch screenings');
      const data = await res.json();
      setScreenings(data.screenings);
    } catch (e) {
      setScreeningsError('Failed to load screening applications.');
    }
    setScreeningsLoading(false);
  };

  const handleApproveScreening = async (id: number) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('pawmart_token') || sessionStorage.getItem('pawmart_token');
      const res = await fetch(`${API_BASE}/api/screening/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'APPROVED' }),
      });
      if (!res.ok) throw new Error('Failed to approve screening');
      fetchScreenings();
      setShowApproveModal(false);
      setApproveTargetId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to approve screening');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectScreening = async (id: number, reason: string) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('pawmart_token') || sessionStorage.getItem('pawmart_token');
      const res = await fetch(`${API_BASE}/api/screening/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'REJECTED', adminNote: reason }),
      });
      if (!res.ok) throw new Error('Failed to reject screening');
      fetchScreenings();
      setShowRejectModal(false);
      setRejectReason('');
      setRejectTargetId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to reject screening');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    if (activePage === 'screenings') {
      fetchScreenings();
    }
  }, [activePage, screeningStatusFilter]);

  useEffect(() => {
    if (activePage === 'applications') {
      // Fetch all dogs
      fetch(`${API_BASE}/api/dogs?status=AVAILABLE,PENDING,REHOMED`)
        .then(res => res.ok ? res.json() : null)
        .then(data => setAllDogs(data?.dogs || []));
      // Fetch all buyers
      const token = localStorage.getItem('pawmart_token') || sessionStorage.getItem('pawmart_token');
      fetch(`${API_BASE}/api/users?role=BUYER`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => setAllBuyers(data?.users || []));
    }
  }, [activePage]);

  const fetchApplications = async () => {
    setApplicationsLoading(true);
    setApplicationsError('');
    try {
      let url = `${API_BASE}/api/applications`;
      const params = [];
      if (applicationsStatusFilter !== 'ALL') params.push(`status=${applicationsStatusFilter}`);
      if (applicationDogFilter) params.push(`dogId=${applicationDogFilter}`);
      if (applicationBuyerFilter) params.push(`buyerId=${applicationBuyerFilter}`);
      if (params.length > 0) url += `?${params.join('&')}`;
      const token = localStorage.getItem('pawmart_token') || sessionStorage.getItem('pawmart_token');
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch applications');
      const data = await res.json();
      setApplications(data.applications || []);
    } catch (err: any) {
      setApplicationsError(err.message || 'Failed to fetch applications');
    } finally {
      setApplicationsLoading(false);
    }
  };

  useEffect(() => {
    if (activePage === 'applications') {
      fetchApplications();
    }
  }, [activePage, applicationsStatusFilter, applicationDogFilter, applicationBuyerFilter]);

  const handleAppAction = async (id: number, status: 'APPROVED' | 'REJECTED') => {
    setAppActionLoading(true);
    setAppActionError('');
    setAppActionId(id);
    try {
      const token = localStorage.getItem('pawmart_token') || sessionStorage.getItem('pawmart_token');
      const res = await fetch(`${API_BASE}/api/applications/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, adminNote: appActionNote }),
      });
      if (!res.ok) throw new Error('Failed to update application');
      setAppActionNote('');
      fetchApplications();
    } catch (err: any) {
      setAppActionError(err.message || 'Failed to update application');
    } finally {
      setAppActionLoading(false);
      setAppActionId(null);
    }
  };

  const handleGenerateInvoice = async () => {
    if (!invoiceTargetId || !invoiceAmount || invoiceBreakdown.some(item => !item.description || !item.amount)) {
      alert('Please fill in all invoice details');
      return;
    }

    setInvoiceLoading(true);
    try {
      const token = localStorage.getItem('pawmart_token') || sessionStorage.getItem('pawmart_token');
      const breakdown = invoiceBreakdown.map(item => ({
        description: item.description,
        amount: parseFloat(item.amount)
      }));

      const res = await fetch(`${API_BASE}/api/invoices/generate/${invoiceTargetId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          amount: parseFloat(invoiceAmount),
          breakdown 
        }),
      });
      
      if (!res.ok) throw new Error('Failed to generate invoice');
      
      setShowInvoiceModal(false);
      setInvoiceTargetId(null);
      setInvoiceAmount('');
      setInvoiceBreakdown([{ description: '', amount: '' }]);
      fetchApplications();
      alert('Invoice generated successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to generate invoice');
    } finally {
      setInvoiceLoading(false);
    }
  };

  const addBreakdownItem = () => {
    setInvoiceBreakdown([...invoiceBreakdown, { description: '', amount: '' }]);
  };

  const removeBreakdownItem = (index: number) => {
    if (invoiceBreakdown.length > 1) {
      setInvoiceBreakdown(invoiceBreakdown.filter((_, i) => i !== index));
    }
  };

  const updateBreakdownItem = (index: number, field: 'description' | 'amount', value: string) => {
    const updated = [...invoiceBreakdown];
    updated[index][field] = value;
    setInvoiceBreakdown(updated);
  };

  const handleViewDogDetails = (dog: Dog) => {
    setSelectedDog(dog);
    setShowDogDetailsModal(true);
  };

  useEffect(() => {
    setActivePage('overview');
  }, []);

  useEffect(() => {
    if (activePage === 'overview') {
      setAnalyticsLoading(true);
      setAnalyticsError('');
      fetch(`${API_BASE}/api/dashboard/overview?period=${analyticsPeriod}`)
        .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch analytics'))
        .then(data => setAnalytics(data))
        .catch(err => setAnalyticsError(err.toString()))
        .finally(() => setAnalyticsLoading(false));
    }
  }, [activePage, analyticsPeriod]);

  useEffect(() => {
    if (user && (user.role === 'ADMIN' || user.role === 'STAFF')) {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('pawmart_token') || sessionStorage.getItem('pawmart_token')
          : null;
      if (!token) return;
      fetch(`${API_BASE}/api/messages/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          setHasUnreadMessages((data?.unread || 0) > 0);
        })
        .catch(() => setHasUnreadMessages(false));
    }
  }, [user]);

  useEffect(() => {
    if (activePage === 'transactions') {
      fetchInvoices();
    }
  }, [activePage, invoiceSearch, invoiceStatusFilter]);

  const fetchInvoices = async () => {
    setInvoiceLoading(true);
    setInvoiceError('');
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('pawmart_token') || sessionStorage.getItem('pawmart_token') : null;
      let url = `${API_BASE}/api/invoices?`;
      if (invoiceStatusFilter !== 'ALL') url += `status=${invoiceStatusFilter}&`;
      if (invoiceSearch) url += `search=${encodeURIComponent(invoiceSearch)}&`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed to load invoices');
      const data = await res.json();
      setInvoices(data.invoices || []);
    } catch (err: any) {
      setInvoiceError(err.message || 'Failed to load invoices');
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setEditAmount(invoice.amount);
    // Split breakdown into fixed and custom
    const fixed = fixedFields.map(f => {
      const found = invoice.breakdown.find((b: any) => b.description === f.key);
      return { description: f.key, amount: found ? found.amount : 0 };
    });
    const custom = invoice.breakdown.filter((b: any) => !fixedFields.some(f => f.key === b.description));
    setEditBreakdown([...fixed, ...custom]);
    setEditModalOpen(true);
  };

  const handleAuditLog = async (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setAuditLogModalOpen(true);
    // Fetch audit log
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('pawmart_token') || sessionStorage.getItem('pawmart_token') : null;
      const res = await fetch(`${API_BASE}/api/invoices/${invoice.id}/audit-log`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed to load audit log');
      const data = await res.json();
      setAuditLogs(data.logs || []);
    } catch (err) {
      setAuditLogs([]);
    }
  };
  const handleDownloadPDF = async (invoice: Invoice) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('pawmart_token') || sessionStorage.getItem('pawmart_token') : null;
    const res = await fetch(`${API_BASE}/api/invoices/${invoice.id}/pdf`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice.id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };
  const handleDeleteInvoice = async (invoice: Invoice) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('pawmart_token') || sessionStorage.getItem('pawmart_token') : null;
    const res = await fetch(`${API_BASE}/api/invoices/${invoice.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) fetchInvoices();
  };
  const handleMarkPaid = async (invoice: Invoice) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('pawmart_token') || sessionStorage.getItem('pawmart_token') : null;
    const res = await fetch(`${API_BASE}/api/invoices/${invoice.id}/mark-paid`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) fetchInvoices();
  };
  const handleMarkPending = async (invoice: Invoice) => {
    // Use edit endpoint to revert to pending
    const token = typeof window !== 'undefined' ? localStorage.getItem('pawmart_token') || sessionStorage.getItem('pawmart_token') : null;
    const res = await fetch(`${API_BASE}/api/invoices/${invoice.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ status: 'PENDING' }) });
    if (res.ok) fetchInvoices();
  };

  // Update breakdown item
  const updateEditBreakdown = (index: number, field: 'description' | 'amount', value: string | number) => {
    setEditBreakdown(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };
  // Add custom line item
  const addCustomBreakdown = () => {
    setEditBreakdown(prev => [...prev, { description: '', amount: 0 }]);
  };
  // Remove custom line item
  const removeCustomBreakdown = (index: number) => {
    setEditBreakdown(prev => prev.filter((_, i) => i !== index));
  };
  // Save edit
  const saveEditInvoice = async () => {
    const breakdown = editBreakdown.filter(b => b.description && b.amount > 0);
    const amount = breakdown.reduce((sum, b) => sum + Number(b.amount), 0);
    const token = typeof window !== 'undefined' ? localStorage.getItem('pawmart_token') || sessionStorage.getItem('pawmart_token') : null;
    const res = await fetch(`${API_BASE}/api/invoices/${selectedInvoice?.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ amount, breakdown }),
    });
    if (res.ok) {
      setEditModalOpen(false);
      fetchInvoices();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="text-xl text-blue-700 font-bold">Loading dashboard...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex bg-blue-50">
      <aside className="w-64 bg-white shadow-lg flex flex-col p-6">
        <div className="text-2xl font-bold text-blue-700 mb-8">PawMart Admin</div>
        <nav className="flex-1 space-y-2">
          <Link href="/dashboard"
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left font-semibold transition-colors ${activePage === 'overview' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-blue-50'}`}
            onClick={() => setActivePage('overview')}
          >
            <LayoutDashboard className="w-5 h-5" />
            Overview
          </Link>
          {sidebarLinks.filter(link => link.key !== 'overview' && link.key !== 'messages').map(link => (
            <button
              key={link.key}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left font-semibold transition-colors ${
                activePage === link.key
                  ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-blue-50'
              }`}
              onClick={() => setActivePage(link.key)}
            >
              {link.icon}
              {link.label}
            </button>
          ))}
          <Link
            href="/dashboard/messages"
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left font-semibold transition-colors ${
              typeof window !== 'undefined' && window.location.pathname.startsWith('/dashboard/messages')
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-700 hover:bg-blue-50'
            } relative`}
          >
            <Mail className="w-5 h-5" />
            Messages
            {hasUnreadMessages && (
              <span className="absolute top-2 right-6 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
            )}
          </Link>
        </nav>
        <button
          className="mt-8 w-full bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors"
          onClick={() => {
            localStorage.removeItem('pawmart_token');
            sessionStorage.removeItem('pawmart_token');
            router.replace('/');
          }}
        >
          Logout
        </button>
        <div className="mt-4 text-xs text-gray-500">{user?.email} ({user?.role})</div>
      </aside>
      <main className="flex-1 p-10">
        {activePage === 'overview' && (
          <div>
            <h1 className="text-3xl font-bold mb-6 text-blue-800">Dashboard Overview</h1>
            <div className="mb-4 flex gap-2 items-center">
              <span className="font-semibold">Period:</span>
              {['week', 'month', 'year'].map(p => (
                <button
                  key={p}
                  className={`px-4 py-2 rounded font-semibold border transition-colors ${analyticsPeriod === p ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'}`}
                  onClick={() => setAnalyticsPeriod(p as any)}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
            {analyticsLoading ? (
              <div className="text-gray-600">Loading analytics...</div>
            ) : (typeof analyticsError === 'string' && analyticsError) ? (
              <div className="text-red-500">{analyticsError}</div>
            ) : (analytics && typeof analytics === 'object' && analytics !== null && analytics.overview) ? (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white rounded-lg shadow p-6 text-center">
                    <div className="text-2xl font-bold text-blue-700">{analytics.overview.totalUsers}</div>
                    <div className="text-gray-600">Total Buyers</div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6 text-center">
                    <div className="text-2xl font-bold text-blue-700">{analytics.overview.totalDogs}</div>
                    <div className="text-gray-600">Total Dogs</div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6 text-center">
                    <div className="text-2xl font-bold text-blue-700">{analytics.overview.totalTransactions}</div>
                    <div className="text-gray-600">Adoptions</div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6 text-center">
                    <div className="text-2xl font-bold text-blue-700">₱{analytics.overview.totalSales.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                    <div className="text-gray-600">Total Sales</div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6 text-center">
                    <div className="text-2xl font-bold text-blue-700">₱{analytics.overview.totalProfit.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                    <div className="text-gray-600">Total Profit</div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6 text-center">
                    <div className="text-2xl font-bold text-blue-700">{analytics.overview.pendingScreenings}</div>
                    <div className="text-gray-600">Pending Screenings</div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6 text-center">
                    <div className="text-2xl font-bold text-blue-700">{analytics.overview.unreadMessages}</div>
                    <div className="text-gray-600">Unread Messages</div>
                  </div>
                </div>
                {/* Dog Status Breakdown */}
                {analytics.dogStats && typeof analytics.dogStats === 'object' && (
                  <div className="mb-8">
                    <h2 className="text-lg font-semibold mb-2 text-gray-800">Dog Status</h2>
                    <div className="flex gap-4">
                      {Object.entries(analytics.dogStats).map(([status, count]) => (
                        (typeof count === 'string' || typeof count === 'number') && (
                          <div key={status} className="bg-blue-50 rounded-lg px-4 py-2 text-center">
                            <div className="font-bold text-blue-700">{count}</div>
                            <div className="text-xs text-gray-600">{status}</div>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}
                {/* Screening Status Breakdown */}
                {analytics.screeningStats && typeof analytics.screeningStats === 'object' && (
                  <div className="mb-8">
                    <h2 className="text-lg font-semibold mb-2 text-gray-800">Screening Status</h2>
                    <div className="flex gap-4">
                      {Object.entries(analytics.screeningStats).map(([status, count]) => (
                        (typeof count === 'string' || typeof count === 'number') && (
                          <div key={status} className="bg-green-50 rounded-lg px-4 py-2 text-center">
                            <div className="font-bold text-green-700">{count}</div>
                            <div className="text-xs text-gray-600">{status}</div>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}
                {/* Recent Transactions */}
                <div className="mb-8">
                  <h2 className="text-lg font-semibold mb-2 text-gray-800">Recent Adoptions</h2>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="py-2 px-4 text-gray-900 font-semibold">Date</th>
                        <th className="py-2 px-4 text-gray-900 font-semibold">Dog</th>
                        <th className="py-2 px-4 text-gray-900 font-semibold">Buyer</th>
                        <th className="py-2 px-4 text-gray-900 font-semibold">Processed By</th>
                        <th className="py-2 px-4 text-gray-900 font-semibold">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(analytics.recentTransactions) && analytics.recentTransactions.map((t: any) => (
                        <tr key={t.id} className="border-b">
                          <td className="py-2 px-4">{new Date(t.date).toLocaleDateString()}</td>
                          <td className="py-2 px-4">{t.dog}</td>
                          <td className="py-2 px-4">{t.buyer}</td>
                          <td className="py-2 px-4">{t.processedBy}</td>
                          <td className="py-2 px-4">₱{t.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : null}
          </div>
        )}
        {activePage === 'dogs' && (
          <div>
            <h1 className="text-3xl font-bold mb-6 text-blue-800 flex items-center justify-between">
              Dog Management
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 transition"
                onClick={() => setDogModalOpen(true)}
              >
                + Add Dog
              </button>
            </h1>
            
            {/* Success/Error Messages */}
            {addDogError && (
              <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg mb-4 border border-red-200">
                {addDogError}
              </div>
            )}
            {addDogSuccess && (
              <div className="bg-green-100 text-green-700 px-4 py-3 rounded-lg mb-4 border border-green-200">
                {addDogSuccess}
              </div>
            )}
            
            {/* Search and Filter Controls */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                  <input
                    type="text"
                    placeholder="Search by name, breed, or type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="appearance-none w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="AVAILABLE">Available</option>
                    <option value="PENDING">Pending</option>
                    <option value="REHOMED">Rehomed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Temperament</label>
                  <select
                    value={temperamentFilter}
                    onChange={e => setTemperamentFilter(e.target.value)}
                    className="appearance-none w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Temperaments</option>
                    <option value="Friendly">Friendly</option>
                    <option value="Calm">Calm</option>
                    <option value="Active">Active</option>
                    <option value="Shy">Shy</option>
                    <option value="Aggressive">Aggressive</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="createdAt">Date Added</option>
                    <option value="name">Name</option>
                    <option value="breed">Breed (A-Z)</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('ALL');
                      setSortBy('createdAt');
                    }}
                    className="w-full bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                Showing {filteredAndSortedDogs.length} of {dogs.length} dogs
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredAndSortedDogs.map((dog) => (
                <DogCard
                  key={dog.id}
                  dog={dog}
                  onViewDetails={() => handleViewDogDetails(dog)}
                  onRequestRehoming={() => {}}
                  userRole={user.role}
                  onEdit={() => handleEditDog(dog)}
                  onDelete={() => handleDeleteDog(dog)}
                />
              ))}
            </div>
            
            {filteredAndSortedDogs.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🐕</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No dogs found</h3>
                <p className="text-gray-500">
                  {dogs.length === 0 
                    ? "No dogs have been added yet. Click 'Add Dog' to get started!"
                    : "Try adjusting your search or filter criteria."
                  }
                </p>
              </div>
            )}
            <DogFormModal
              isOpen={dogModalOpen}
              mode="add"
              initialValues={addDogForm}
              loading={addDogLoading}
              errors={formErrors}
              imagePreviews={addDogImagePreviews}
              onChange={handleAddDogChange}
              onImageChange={handleAddDogImageChange}
              onRemoveImage={idx => {
                const newFiles = addDogImages.filter((_, i) => i !== idx);
                setAddDogImages(newFiles);
                setAddDogImagePreviews(newFiles.map(file => URL.createObjectURL(file)));
              }}
              onSubmit={handleAddDog}
              onCancel={() => {
                setDogModalOpen(false);
                resetAddDogForm();
              }}
              images={addDogImages}
              successMsg={addDogSuccess}
              errorMsg={addDogError}
            />
            
            {/* Edit Dog Modal */}
            <DogFormModal
              isOpen={editDogModalOpen}
              mode="edit"
              initialValues={editDogForm}
              loading={editDogLoading}
              errors={editFormErrors}
              imagePreviews={editDogImagePreviews}
              onChange={handleEditDogChange}
              onImageChange={handleEditDogImageChange}
              onRemoveImage={idx => {
                const newFiles = editDogImages.filter((_, i) => i !== idx);
                setEditDogImages(newFiles);
                setEditDogImagePreviews(newFiles.map(file => URL.createObjectURL(file)));
              }}
              onSubmit={handleUpdateDog}
              onCancel={() => {
                setEditDogModalOpen(false);
                setEditingDog(null);
              }}
              images={editDogImages}
              successMsg={editDogSuccess}
              errorMsg={editDogError}
            />
          </div>
        )}
        {activePage === 'screenings' && (
          <div>
            <h1 className="text-3xl font-bold mb-6 text-blue-800">Screening Applications</h1>
            <div className="mb-4 flex gap-2 items-center">
              {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map(status => (
                <button
                  key={status}
                  className={`px-4 py-2 rounded font-semibold border transition-colors ${screeningStatusFilter === status ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'}`}
                  onClick={() => setScreeningStatusFilter(status as any)}
                >
                  {status.charAt(0) + status.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
            <div className="bg-white rounded-lg shadow p-8">
              {screeningsLoading ? (
                <div className="text-gray-600">Loading screening applications...</div>
              ) : screeningsError ? (
                <div className="text-red-500">{screeningsError}</div>
              ) : screenings.length === 0 ? (
                <div className="text-gray-600">No pending screening applications.</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-2 px-4 text-gray-900 font-semibold">Buyer</th>
                      <th className="py-2 px-4 text-gray-900 font-semibold">Submitted</th>
                      <th className="py-2 px-4 text-gray-900 font-semibold">Experience</th>
                      <th className="py-2 px-4 text-gray-900 font-semibold">Living Conditions</th>
                      <th className="py-2 px-4 text-gray-900 font-semibold">Household</th>
                      <th className="py-2 px-4 text-gray-900 font-semibold">Time Commitment</th>
                      <th className="py-2 px-4 text-gray-900 font-semibold">ID Document</th>
                      <th className="py-2 px-4 text-gray-900 font-semibold">Proof of Residence</th>
                      <th className="py-2 px-4 text-gray-900 font-semibold">Letter</th>
                      <th className="py-2 px-4 text-gray-900 font-semibold">Interested Breed</th>
                      {['REJECTED', 'ALL'].includes(screeningStatusFilter) && (
                        <th className="py-2 px-4 text-gray-900 font-semibold">Rejection Reason</th>
                      )}
                      <th className="py-2 px-4 text-gray-900 font-semibold">Actions</th>
                    </tr>
                  </thead>
                                      <tbody>
                      {screenings.map((s) => (
                        <tr key={s.id} className="border-b align-top">
                          <td className="py-2 px-4">
                            <div className="font-semibold">{s.user.name}</div>
                            <div className="text-xs text-gray-600">{s.user.email}</div>
                          </td>
                          <td className="py-2 px-4">{new Date(s.createdAt).toLocaleString()}</td>
                          <td className="py-2 px-4">{s.experience}</td>
                          <td className="py-2 px-4 max-w-xs whitespace-pre-line">{s.livingConditions}</td>
                          <td className="py-2 px-4 max-w-xs whitespace-pre-line">{s.household}</td>
                          <td className="py-2 px-4 max-w-xs whitespace-pre-line">{s.timeCommitment}</td>
                          <td className="py-2 px-4">
                            <a href={`${API_BASE}/${s.idDocument}`} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">View</a>
                          </td>
                          <td className="py-2 px-4">
                            <a href={`${API_BASE}/${s.proofOfResidence}`} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">View</a>
                          </td>
                          <td className="py-2 px-4 max-w-xs whitespace-pre-line">{s.letter}</td>
                          <td className="py-2 px-4">{s.interestedBreed || <span className="text-gray-400 italic">N/A</span>}</td>
                          {['REJECTED', 'ALL'].includes(screeningStatusFilter) && (
                            <td className="py-2 px-4 max-w-xs whitespace-pre-line">
                              {s.status === 'REJECTED' && s.adminNote ? s.adminNote : <span className="text-gray-400">-</span>}
                            </td>
                          )}
                                                      <td className="py-2 px-4">
                              {s.status === 'PENDING' ? (
                                <>
                                  <button
                                    className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 mb-2 w-full"
                                    onClick={() => {
                                      setApproveTargetId(s.id);
                                      setShowApproveModal(true);
                                    }}
                                    disabled={actionLoading}
                                  >
                                    Approve
                                  </button>
                                  <button
                                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 w-full"
                                    onClick={() => {
                                      setRejectTargetId(s.id);
                                      setShowRejectModal(true);
                                      setRejectReason('');
                                    }}
                                    disabled={actionLoading}
                                  >
                                    Reject
                                  </button>
                                </>
                              ) : s.status === 'REJECTED' ? (
                                <>
                                  <button
                                    className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 mb-2 w-full"
                                    onClick={() => handleApproveScreening(s.id)}
                                    disabled={actionLoading}
                                  >
                                    Reconsider
                                  </button>

                                </>
                              ) : s.status === 'APPROVED' ? (
                                <button
                                  className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 w-full"
                                  onClick={() => {
                                    setRejectTargetId(s.id);
                                    setShowRejectModal(true);
                                    setRejectReason('');
                                  }}
                                  disabled={actionLoading}
                                >
                                  Reject
                                </button>
                              ) : null}
                            </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
        {activePage === 'buyers' && (
          <div>
            <h1 className="text-3xl font-bold mb-6 text-blue-800">Pending Buyers</h1>
            <div className="bg-white rounded-lg shadow p-8">
              {buyersLoading ? (
                <div className="text-gray-600">Loading buyers...</div>
              ) : buyersError ? (
                <div className="text-red-500">{buyersError}</div>
              ) : pendingBuyers.length === 0 ? (
                <div className="text-gray-600">No pending buyers.</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-2 px-4 text-gray-900 font-semibold">Name</th>
                      <th className="py-2 px-4 text-gray-900 font-semibold">Email</th>
                      <th className="py-2 px-4 text-gray-900 font-semibold">Screening Status</th>
                      <th className="py-2 px-4 text-gray-900 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingBuyers.map((buyer) => (
                      <tr key={buyer.id} className="border-b align-top">
                        <td className="py-2 px-4">{buyer.name}</td>
                        <td className="py-2 px-4">{buyer.email}</td>
                        <td className="py-2 px-4">{buyer.screeningStatus}</td>
                        <td className="py-2 px-4">
                          <button
                            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                            onClick={() => handleApproveBuyer(buyer)}
                          >
                            Approve
                          </button>
                          <button
                            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 ml-2"
                            onClick={() => handleRejectBuyer(buyer)}
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
        {activePage === 'applications' && (
          <div>
            <h1 className="text-3xl font-bold mb-6 text-blue-800">Dog Applications</h1>
            <div className="mb-4 flex gap-2 items-center">
              {['PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN', 'ALL'].map(status => (
                <button
                  key={status}
                  className={`px-4 py-2 rounded font-semibold border transition-colors ${applicationsStatusFilter === status ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'}`}
                  onClick={() => setApplicationsStatusFilter(status as any)}
                >
                  {status.charAt(0) + status.slice(1).toLowerCase()}
                </button>
                            ))}
            </div>
            <div className="bg-white rounded-lg shadow p-8">
              {applicationsLoading ? (
                <div className="text-gray-600">Loading dog applications...</div>
              ) : applicationsError ? (
                <div className="text-red-500">{applicationsError}</div>
              ) : applications.length === 0 ? (
                <div className="text-gray-600">No pending dog applications.</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-2 px-4 text-gray-900 font-semibold">Dog</th>
                      <th className="py-2 px-4 text-gray-900 font-semibold">Buyer</th>
                      <th className="py-2 px-4 text-gray-900 font-semibold">Status</th>
                      <th className="py-2 px-4 text-gray-900 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => (
                      <tr key={app.id} className="border-b align-top">
                        <td className="py-2 px-4">{app.dog.name}</td>
                        <td className="py-2 px-4">{app.buyer.name}</td>
                        <td className="py-2 px-4">{app.status}</td>
                        <td className="py-2 px-4">
                          {app.status === 'PENDING' ? (
                            <>
                              <button
                                className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 mb-2 w-full"
                                onClick={() => handleAppAction(app.id, 'APPROVED')}
                                disabled={appActionLoading}
                              >
                                Approve
                              </button>
                              <button
                                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 w-full"
                                onClick={() => handleAppAction(app.id, 'REJECTED')}
                                disabled={appActionLoading}
                              >
                                Reject
                              </button>
                            </>
                          ) : app.status === 'APPROVED' ? (
                            <>
                              <button
                                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 mb-2 w-full"
                                onClick={() => {
                                  setInvoiceTargetId(app.id);
                                  setShowInvoiceModal(true);
                                  setInvoiceAmount('');
                                  setInvoiceBreakdown([{ description: '', amount: '' }]);
                                }}
                                disabled={invoiceLoading}
                              >
                                Generate Invoice
                              </button>
                              <button
                                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 w-full"
                                onClick={() => handleAppAction(app.id, 'REJECTED')}
                                disabled={appActionLoading}
                              >
                                Reject
                              </button>
                            </>
                          ) : app.status === 'REJECTED' ? (
                            <button
                              className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 w-full"
                              onClick={() => handleAppAction(app.id, 'REJECTED')}
                              disabled={appActionLoading}
                            >
                              Reject
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
        {activePage === 'transactions' && (
          <div>
            <h1 className="text-3xl font-bold mb-6 text-blue-800 flex items-center justify-between">Invoices</h1>
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Search by buyer, dog, or invoice #..."
                  value={invoiceSearch}
                  onChange={e => setInvoiceSearch(e.target.value)}
                  className="w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
                <select
                  value={invoiceStatusFilter}
                  onChange={e => setInvoiceStatusFilter(e.target.value)}
                  className="appearance-none w-full md:w-1/4 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="PAID">Paid</option>
                </select>
              </div>
              {invoiceLoading ? (
                <div className="text-gray-500">Loading invoices...</div>
              ) : invoiceError ? (
                <div className="text-red-600">{invoiceError}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="py-2 px-4">Invoice #</th>
                        <th className="py-2 px-4">Buyer</th>
                        <th className="py-2 px-4">Dog</th>
                        <th className="py-2 px-4">Amount</th>
                        <th className="py-2 px-4">Status</th>
                        <th className="py-2 px-4">Date</th>
                        <th className="py-2 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map(inv => (
                        <tr key={inv.id} className="border-b">
                          <td className="py-2 px-4 font-semibold">{inv.id}</td>
                          <td className="py-2 px-4">{inv.application?.buyer?.name}</td>
                          <td className="py-2 px-4">{inv.application?.dog?.name}</td>
                          <td className="py-2 px-4">₱{inv.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                          <td className="py-2 px-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${inv.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{inv.status}</span>
                          </td>
                          <td className="py-2 px-4">{new Date(inv.createdAt).toLocaleDateString()}</td>
                          <td className="py-2 px-4 flex gap-2 flex-wrap">
                            <button className="text-blue-600 hover:underline" onClick={() => handleEditInvoice(inv)} disabled={inv.status !== 'PENDING'}>Edit</button>
                            <button className="text-red-600 hover:underline" onClick={() => handleDeleteInvoice(inv)} disabled={inv.status !== 'PENDING'}>Delete</button>
                            {inv.status === 'PENDING' ? (
                              <button className="text-green-600 hover:underline" onClick={() => handleMarkPaid(inv)}>Mark Paid</button>
                            ) : (
                              <button className="text-yellow-600 hover:underline" onClick={() => handleMarkPending(inv)}>Revert Pending</button>
                            )}
                            <button className="text-indigo-600 hover:underline" onClick={() => handleDownloadPDF(inv)}>Download PDF</button>
                            <button className="text-gray-600 hover:underline" onClick={() => handleAuditLog(inv)}>Audit Log</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            {/* Edit Invoice Modal */}
            {editModalOpen && selectedInvoice && (
              <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)}>
                <div className="p-4 max-w-lg mx-auto">
                  <h2 className="text-xl font-bold mb-4 text-blue-800">Edit Invoice #{selectedInvoice.id}</h2>
                  <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {fixedFields.map((f, idx) => (
                      <div key={f.key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border rounded"
                          value={editBreakdown[idx]?.amount || 0}
                          onChange={e => updateEditBreakdown(idx, 'amount', Number(e.target.value))}
                          min={0}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-700">Custom Line Items</span>
                      <button className="text-blue-600 hover:underline text-sm" onClick={addCustomBreakdown}>+ Add Item</button>
                    </div>
                    {editBreakdown.slice(fixedFields.length).map((item, i) => (
                      <div key={i} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          className="flex-1 px-3 py-2 border rounded"
                          placeholder="Description"
                          value={item.description}
                          onChange={e => updateEditBreakdown(fixedFields.length + i, 'description', e.target.value)}
                        />
                        <input
                          type="number"
                          className="w-32 px-3 py-2 border rounded"
                          placeholder="Amount"
                          value={item.amount}
                          onChange={e => updateEditBreakdown(fixedFields.length + i, 'amount', Number(e.target.value))}
                          min={0}
                        />
                        <button className="text-red-600 hover:underline" onClick={() => removeCustomBreakdown(fixedFields.length + i)}>Remove</button>
                      </div>
                    ))}
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border rounded bg-gray-100"
                      value={editBreakdown.reduce((sum, b) => sum + Number(b.amount), 0)}
                      readOnly
                    />
                  </div>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700" onClick={saveEditInvoice}>Save</button>
                </div>
              </Modal>
            )}
            {/* Audit Log Modal */}
            {auditLogModalOpen && selectedInvoice && (
              <Modal isOpen={auditLogModalOpen} onClose={() => setAuditLogModalOpen(false)}>
                <div className="p-4 max-w-lg mx-auto">
                  <h2 className="text-xl font-bold mb-4 text-blue-800">Audit Log for Invoice #{selectedInvoice.id}</h2>
                  {auditLogs.length === 0 ? (
                    <div className="text-gray-500">No audit log entries.</div>
                  ) : (
                    <ul className="space-y-2">
                      {auditLogs.map(log => (
                        <li key={log.id} className="border-b pb-2">
                          <div className="text-sm font-semibold">{log.user.name} ({log.user.email})</div>
                          <div className="text-xs text-gray-600">{log.action} - {new Date(log.createdAt).toLocaleString()}</div>
                          <div className="text-xs text-gray-800">{JSON.stringify(log.changes)}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Modal>
            )}
          </div>
        )}
        {showRejectModal && (
          <Modal isOpen={showRejectModal} onClose={() => setShowRejectModal(false)}>
            <div className="p-4 max-w-md mx-auto">
              <h2 className="text-xl font-bold mb-2 text-blue-800">Reject Screening Application</h2>
              <p className="mb-2 text-gray-700">Please provide a reason for rejection. This will be sent to the buyer.</p>
              <textarea
                className="w-full border rounded-lg p-2 mb-4 text-gray-900"
                rows={4}
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                required
                disabled={actionLoading}
              />
              <div className="flex gap-2 justify-end">
                <button
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded font-semibold hover:bg-gray-400"
                  onClick={() => setShowRejectModal(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  className="bg-red-600 text-white px-4 py-2 rounded font-semibold hover:bg-red-700"
                  onClick={() => {
                    if (rejectTargetId && rejectReason.trim()) {
                      handleRejectScreening(rejectTargetId, rejectReason.trim());
                    }
                  }}
                  disabled={actionLoading || !rejectReason.trim()}
                >
                  Reject
                </button>
              </div>
            </div>
          </Modal>
        )}
        <ConfirmModal
          isOpen={showApproveModal}
          onClose={() => setShowApproveModal(false)}
          onConfirm={() => approveTargetId && handleApproveScreening(approveTargetId)}
          title="Approve Screening Application"
          message="Are you sure you want to approve this screening application?"
          confirmText="Approve"
          confirmColor="bg-green-600 hover:bg-green-700"
          loading={actionLoading}
        />
        
        {/* Invoice Generation Modal */}
        {showInvoiceModal && (
          <Modal isOpen={showInvoiceModal} onClose={() => setShowInvoiceModal(false)}>
            <div className="p-6 max-w-2xl mx-auto">
              <h2 className="text-xl font-bold mb-4 text-blue-800">Generate Invoice</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Amount (₱)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full border rounded-lg p-2 text-gray-900"
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(e.target.value)}
                  placeholder="0.00"
                  disabled={invoiceLoading}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Breakdown
                </label>
                <div className="space-y-2">
                  {invoiceBreakdown.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        className="flex-1 border rounded-lg p-2 text-gray-900"
                        placeholder="Description (e.g., Adoption Fee)"
                        value={item.description}
                        onChange={(e) => updateBreakdownItem(index, 'description', e.target.value)}
                        disabled={invoiceLoading}
                      />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-32 border rounded-lg p-2 text-gray-900"
                        placeholder="Amount"
                        value={item.amount}
                        onChange={(e) => updateBreakdownItem(index, 'amount', e.target.value)}
                        disabled={invoiceLoading}
                      />
                      {invoiceBreakdown.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeBreakdownItem(index)}
                          className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600"
                          disabled={invoiceLoading}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addBreakdownItem}
                  className="mt-2 bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 text-sm"
                  disabled={invoiceLoading}
                >
                  + Add Item
                </button>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded font-semibold hover:bg-gray-400"
                  onClick={() => setShowInvoiceModal(false)}
                  disabled={invoiceLoading}
                >
                  Cancel
                </button>
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700"
                  onClick={handleGenerateInvoice}
                  disabled={invoiceLoading || !invoiceAmount || invoiceBreakdown.some(item => !item.description || !item.amount)}
                >
                  {invoiceLoading ? 'Generating...' : 'Generate Invoice'}
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Dog Details Modal */}
        {showDogDetailsModal && selectedDog && (
          <Modal isOpen={showDogDetailsModal} onClose={() => setShowDogDetailsModal(false)}>
            <div className="p-6 max-w-4xl mx-auto">
              <h2 className="text-xl font-bold mb-4 text-blue-800">Dog Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Images */}
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">Images</h3>
                  <div className="space-y-2">
                    {selectedDog.images && selectedDog.images.length > 0 ? (
                      selectedDog.images.map((image, index) => (
                        <img
                          key={index}
                          src={`${API_BASE}/${image}`}
                          alt={`${selectedDog.name} - Image ${index + 1}`}
                          className="w-full h-48 object-cover rounded-lg border"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&w=400&q=80';
                          }}
                        />
                      ))
                    ) : (
                      <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
                        No images available
                      </div>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-800">Basic Information</h3>
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium text-gray-700">Name:</span>
                        <span className="ml-2 text-gray-900">{selectedDog.name}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Breed:</span>
                        <span className="ml-2 text-gray-900">{selectedDog.breed}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Type:</span>
                        <span className="ml-2 text-gray-900">{selectedDog.type}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Status:</span>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                          selectedDog.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' :
                          selectedDog.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {selectedDog.status}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Price:</span>
                        <span className="ml-2 text-gray-900">₱{selectedDog.price.toLocaleString()}</span>
                      </div>
                      {selectedDog.age && (
                        <div>
                          <span className="font-medium text-gray-700">Age:</span>
                          <span className="ml-2 text-gray-900">{selectedDog.age} months</span>
                        </div>
                      )}
                      {selectedDog.gender && selectedDog.gender !== 'UNKNOWN' && (
                        <div>
                          <span className="font-medium text-gray-700">Gender:</span>
                          <span className="ml-2 text-gray-900">{selectedDog.gender}</span>
                        </div>
                      )}
                      {selectedDog.size && selectedDog.size !== 'UNKNOWN' && (
                        <div>
                          <span className="font-medium text-gray-700">Size:</span>
                          <span className="ml-2 text-gray-900">{selectedDog.size}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-800">Health & Behavior</h3>
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium text-gray-700">Temperament:</span>
                        <span className="ml-2 text-gray-900">{selectedDog.temperament}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Health Status:</span>
                        <span className="ml-2 text-gray-900">{selectedDog.healthStatus}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Birth Date:</span>
                        <span className="ml-2 text-gray-900">{new Date(selectedDog.birthDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-800">Additional Information</h3>
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium text-gray-700">Date Added:</span>
                        <span className="ml-2 text-gray-900">{new Date(selectedDog.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end mt-6">
                <button
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded font-semibold hover:bg-gray-400"
                  onClick={() => setShowDogDetailsModal(false)}
                >
                  Close
                </button>
                <button
                  className="bg-yellow-500 text-white px-4 py-2 rounded font-semibold hover:bg-yellow-600"
                  onClick={() => {
                    setShowDogDetailsModal(false);
                    handleEditDog(selectedDog);
                  }}
                >
                  Edit Dog
                </button>
              </div>
            </div>
          </Modal>
        )}
      </main>
    </div>
  );
}