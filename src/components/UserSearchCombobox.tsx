import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, User, X } from "lucide-react";
import { useSearchUsers } from "@/hooks/useUserQueries";
import { type UserSearchResult } from "@/services/usersService";

interface UserSearchComboboxProps {
  value: string;
  onChange: (value: string) => void;
  onUserSelect?: (user: UserSearchResult) => void;
  placeholder?: string;
  error?: string;
  className?: string;
  disabled?: boolean;
}

// Custom debounce hook
function useDebouncedValue(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export const UserSearchCombobox: React.FC<UserSearchComboboxProps> = ({
  value,
  onChange,
  onUserSelect,
  placeholder = "Search for a user...",
  error,
  className = "",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Debounce the search query to avoid too many API calls
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);
  
  // Use the search hook with debounced query
  const { data: searchResponse, isLoading } = useSearchUsers(
    debouncedSearchQuery,
    { enabled: debouncedSearchQuery.length >= 2 }
  );

  const searchResults = searchResponse?.data || [];

  // Update search query when value prop changes (for controlled component behavior)
  useEffect(() => {
    setSearchQuery(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    onChange(newValue);
    
    // Open dropdown when user starts typing
    if (newValue.length >= 2) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const handleUserSelection = (user: UserSearchResult) => {
    // If this is an organization account prefer the organization name as the
    // value shown in the input. Also prefer contactEmail when present.
    const displayName =
      user.accountType === "organization" && user.organizationName
        ? user.organizationName
        : user.fullName;

    setSearchQuery(displayName);
    onChange(displayName);
    setIsOpen(false);

    // Use organization contact email if available, otherwise fall back to email
    const emailToUse =
      user.accountType === "organization" && user.organizationName
        ? user.contactEmail || user.email
        : user.email;

    // Send a normalized user object to the parent: override fullName with
    // the displayName (so parent components get the org name when relevant)
    onUserSelect?.({ ...user, email: emailToUse, fullName: displayName });
  };



  const handleClearInput = () => {
    setSearchQuery("");
    onChange("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const showDropdown = isOpen && searchQuery.length >= 2 && (searchResults.length > 0 || isLoading);

  return (
    <div className={`shadow rounded-2xl !mt-6 !mb-4 relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => {
            if (searchQuery.length >= 2) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full px-3 py-4 pr-20 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
            ${error ? "border-red-500" : "border-gray-300"}
            ${disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white"}
          `}
        />
        
        {/* Clear button */}
        {searchQuery && !disabled && (
          <button
            type="button"
            onClick={handleClearInput}
            className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        )}
        
        {/* Dropdown indicator */}
        <ChevronDown 
          size={16} 
          className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </div>

      {/* Error message */}
      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}

      {/* Search Results Dropdown */}
      {showDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {isLoading && (
            <div className="px-4 py-3 text-gray-500 text-sm">
              Searching users...
            </div>
          )}
          
          {!isLoading && searchResults.length === 0 && (
            <div className="px-4 py-3 text-gray-500 text-sm">
              No users found
            </div>
          )}
          
          {!isLoading && searchResults.map((user, index) => (
            <button
              key={`${user.email}-${index}`}
              type="button"
              onClick={() => handleUserSelection(user)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-center space-x-3">
                {/* User Avatar */}
                <div className="flex-shrink-0">
                  {user.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={user.fullName}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <User size={16} className="text-gray-500" />
                    </div>
                  )}
                </div>
                
                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {user.organizationName || user.fullName}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {user.contactEmail ||user.email}
                  </div>
                  {user.organizationName && (
                    <div className="text-xs text-gray-400 truncate">
                      {user.organizationName}
                    </div>
                  )}
                </div>
                
                {/* Account Type Badge */}
                <div className="flex-shrink-0">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    user.accountType === 'organization' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {user.accountType === 'organization' ? 'Org' : 'User'}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserSearchCombobox;