import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRequestPackageParam } from '@/hooks/useRequestPackageParam';

const FriendRequestRedirect = () => {
  const navigate = useNavigate();
  const { packageId, restaurantId, source } = useRequestPackageParam();

  useEffect(() => {
    console.log('🎁 Friend Request Redirect Page Loaded');
    console.log('📦 Package ID:', packageId);
    console.log('🏪 Restaurant ID:', restaurantId);
    console.log('🔗 Source:', source);

    if (packageId && restaurantId && source === 'friend_request') {
      // Build the redirect URL
      const redirectUrl = `/restaurants/${restaurantId}/meals/${packageId}`;
      
      console.log('🚀 Redirecting to:', redirectUrl);
      
      // Small delay to ensure everything is ready
      setTimeout(() => {
        navigate(redirectUrl, { 
          replace: true,
          state: { fromFriendRequest: true }
        });
      }, 100);
    } else {
      // No valid params, redirect to home
      console.log('❌ Invalid params, redirecting to home');
      navigate('/', { replace: true });
    }
  }, [packageId, restaurantId, source, navigate]);

  // Show a nice loading screen while redirecting
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-purple-50 to-pink-50">
      <div className="text-center">
        <div className="mb-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto"></div>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          🎁 Loading your friend's request...
        </h2>
        <p className="text-gray-600">
          Taking you to the package details
        </p>
      </div>
    </div>
  );
};

export default FriendRequestRedirect;