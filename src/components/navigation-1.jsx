"use client";
import React from "react";



export default function Index() {
  return (function MainComponent({ 
  userName = "", 
  profilePicture = null, 
  onBack, 
  onProfile, 
  onLogout,
  showBack = true,
  title = ""
}) {
  const [error, setError] = useState(null);
  
  const getInitialBgColor = useCallback(() => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 
      'bg-red-500', 'bg-yellow-500', 'bg-pink-500'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }, []);

  const [bgColor] = useState(getInitialBgColor());

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
    } else if (typeof window !== 'undefined') {
      window.history.back();
    }
  }, [onBack]);

  const handleLogout = useCallback(async () => {
    try {
      const response = await fetch('/api/logout', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error('Logout failed');
      }
      
      if (onLogout) {
        onLogout();
      }
      
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    } catch (err) {
      console.error('Logout error:', err);
      setError('Failed to logout. Please try again.');
    }
  }, [onLogout]);

  return (
    <nav className="bg-white shadow-lg px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-4">
          {showBack && (
            <button
              onClick={handleBack}
              className="text-gray-600 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100"
              aria-label="Go back"
            >
              <i className="fas fa-arrow-left text-xl"></i>
            </button>
          )}
          
          {title && (
            <h1 className="text-xl font-bold text-gray-900 font-roboto">
              {title}
            </h1>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}
          
          <button
            onClick={onProfile}
            className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100"
          >
            {profilePicture ? (
              <img
                src={profilePicture}
                alt={`${userName}'s profile`}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className={`w-8 h-8 rounded-full ${bgColor} flex items-center justify-center`}>
                <span className="text-white font-semibold">
                  {userName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </button>

          <button
            onClick={handleLogout}
            className="text-gray-600 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100"
            aria-label="Logout"
          >
            <i className="fas fa-sign-out-alt text-xl"></i>
          </button>
        </div>
      </div>
    </nav>
  );
}

function StoryComponent() {
  const [isLoggedOut, setIsLoggedOut] = useState(false);
  
  const mockHandleProfile = () => {
    console.log('Profile clicked');
  };

  const mockHandleBack = () => {
    console.log('Back clicked');
  };

  const mockHandleLogout = () => {
    setIsLoggedOut(true);
    console.log('Logout clicked');
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-4">Default Navigation</h2>
        <MainComponent
          userName="John Doe"
          onProfile={mockHandleProfile}
          onBack={mockHandleBack}
          onLogout={mockHandleLogout}
          title="Dashboard"
        />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">With Profile Picture</h2>
        <MainComponent
          userName="Jane Smith"
          profilePicture="https://example.com/profile.jpg"
          onProfile={mockHandleProfile}
          onBack={mockHandleBack}
          onLogout={mockHandleLogout}
          title="Profile"
        />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Without Back Button</h2>
        <MainComponent
          userName="Bob Wilson"
          onProfile={mockHandleProfile}
          onLogout={mockHandleLogout}
          showBack={false}
          title="Home"
        />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Without Title</h2>
        <MainComponent
          userName="Alice Brown"
          onProfile={mockHandleProfile}
          onBack={mockHandleBack}
          onLogout={mockHandleLogout}
        />
      </div>

      {isLoggedOut && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl">
            <p>Logged out successfully!</p>
          </div>
        </div>
      )}
    </div>
  );
});
}