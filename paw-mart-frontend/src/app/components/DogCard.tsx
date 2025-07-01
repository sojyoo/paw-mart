import React from 'react';
import { Eye, Heart as HeartIcon, Edit, Trash2 } from 'lucide-react';

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

interface DogCardProps {
  dog: Dog;
  onViewDetails: () => void;
  onRequestRehoming: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  userRole?: string;
  screeningStatus?: 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED';
  favorited?: boolean;
  onFavoriteToggle?: (dogId: number, newState: boolean) => void;
}

const DogCard: React.FC<DogCardProps> = ({
  dog,
  onViewDetails,
  onRequestRehoming,
  onEdit,
  onDelete,
  userRole,
  screeningStatus = 'NOT_SUBMITTED',
  favorited,
  onFavoriteToggle,
}) => {
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
          className="flex-1 bg-green-600 text-white py-2 px-3 rounded-md text-sm font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
        >
          <HeartIcon className="w-4 h-4" />
          Request to Rehome
        </button>
      );
      statusMessage = (
        <p className="text-xs text-yellow-800 mt-2">Complete background screening to request rehoming.</p>
      );
    } else if (screeningStatus === 'PENDING') {
      requestButton = (
        <button
          disabled
          className="flex-1 bg-yellow-400 text-white py-2 px-3 rounded-md text-sm font-semibold cursor-not-allowed opacity-70 flex items-center justify-center gap-1"
        >
          <HeartIcon className="w-4 h-4" />
          Pending Approval
        </button>
      );
      statusMessage = (
        <p className="text-xs text-yellow-800 mt-2">Your application is pending admin review.</p>
      );
    } else if (screeningStatus === 'REJECTED') {
      requestButton = (
        <button
          disabled
          className="flex-1 bg-red-500 text-white py-2 px-3 rounded-md text-sm font-semibold cursor-not-allowed opacity-70 flex items-center justify-center gap-1"
        >
          <HeartIcon className="w-4 h-4" />
          Rejected
        </button>
      );
      statusMessage = (
        <p className="text-xs text-red-700 mt-2">Your application was rejected. Please contact support.</p>
      );
    } else if (screeningStatus === 'APPROVED') {
      requestButton = (
        <button
          onClick={onRequestRehoming}
          className="flex-1 bg-green-600 text-white py-2 px-3 rounded-md text-sm font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
        >
          <HeartIcon className="w-4 h-4" />
          Request to Rehome
        </button>
      );
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Dog Image */}
      <div className="relative h-60 overflow-hidden">
        <img
          src={dog.images && dog.images.length > 0 ? `http://localhost:4000/${dog.images[0]}` : '/placeholder-dog.jpg'}
          alt={dog.name}
          className="w-full h-full object-cover object-center md:object-[center_top]"
          style={{ objectPosition: 'center top' }}
          onError={(e) => {
            e.currentTarget.src = 'https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&w=400&q=80';
          }}
        />
        {/* Favorite Heart Icon */}
        {userRole === 'BUYER' && (
          <button
            className={`absolute top-2 left-2 z-10 rounded-full p-1 bg-white/80 hover:bg-pink-100 transition-colors border ${favorited ? 'text-pink-600' : 'text-gray-400'}`}
            title={favorited ? 'Remove from favorites' : 'Add to favorites'}
            onClick={e => {
              e.stopPropagation();
              onFavoriteToggle && onFavoriteToggle(dog.id, !favorited);
            }}
          >
            <HeartIcon fill={favorited ? '#ec4899' : 'none'} className="w-6 h-6" />
          </button>
        )}
        {/* Gradient overlay for readability */}
        <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(dog.status)}`}>
            {getStatusText(dog.status)}
          </span>
        </div>
      </div>

      {/* Dog Info */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-gray-900">{dog.name}</h3>
        </div>
        
        <p className="text-gray-600 font-medium mb-1">{dog.breed}</p>
        <p className="text-sm text-gray-500 mb-2">{dog.type}</p>
        
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm text-gray-600">Temperament:</span>
          <span className="text-sm font-medium text-gray-800">{dog.temperament}</span>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-gray-600">Health:</span>
          <span className="text-sm font-medium text-gray-800">{dog.healthStatus}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onViewDetails}
            className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-md text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
          >
            <Eye className="w-4 h-4" />
            View Details
          </button>
          {userRole === 'BUYER' && dog.status === 'AVAILABLE' && requestButton}
        </div>
        {userRole === 'BUYER' && dog.status === 'AVAILABLE' && statusMessage}

        {/* Admin Actions */}
        {(userRole === 'ADMIN' || userRole === 'STAFF') && (
          <div className="flex gap-2 mt-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="flex-1 bg-yellow-500 text-white py-2 px-3 rounded-md text-sm font-semibold hover:bg-yellow-600 transition-colors flex items-center justify-center gap-1"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="flex-1 bg-red-500 text-white py-2 px-3 rounded-md text-sm font-semibold hover:bg-red-600 transition-colors flex items-center justify-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DogCard; 