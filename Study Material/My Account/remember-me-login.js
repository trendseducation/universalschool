// ============================================================
// 🔐 STANDALONE REMEMBER ME LOGIN SCRIPT
// ============================================================
// Usage: Place this script in your HTML file and call checkLoginStatus()
// ============================================================

(function() {
    'use strict';

    // ============================================================
    // SESSION KEYS
    // ============================================================
    const SESSION_KEYS = {
        USER: 'ujjwal_user',
        USER_DATA: 'ujjwal_user_data',
        USER_TYPE: 'ujjwal_user_type',
        REMEMBER_ME: 'ujjwal_remember_me',
        SESSION_EXPIRY: 'ujjwal_session_expiry'
    };

    // ============================================================
    // SESSION MANAGEMENT FUNCTIONS
    // ============================================================

    /**
     * Get session data from localStorage or sessionStorage
     * @param {string} key - The storage key
     * @returns {any} - The stored value or null
     */
    function getSessionData(key) {
        // Check localStorage first (Remember Me)
        const localData = localStorage.getItem(key);
        if (localData) {
            try {
                const parsed = JSON.parse(localData);
                // Check if it's a Remember Me session with expiry
                if (parsed.value && parsed.expiry && Date.now() < parsed.expiry) {
                    return parsed.value;
                }
                // If it's just a direct value
                if (parsed.value !== undefined) return parsed.value;
                return parsed;
            } catch (e) {
                // If not JSON, return as is
                return localData;
            }
        }
        
        // Check sessionStorage
        const sessionData = sessionStorage.getItem(key);
        if (sessionData) {
            try {
                return JSON.parse(sessionData);
            } catch (e) {
                return sessionData;
            }
        }
        
        return null;
    }

    /**
     * Check if Remember Me is active
     * @returns {boolean} - True if Remember Me is active
     */
    function isRememberMeActive() {
        const rememberMeData = localStorage.getItem(SESSION_KEYS.REMEMBER_ME);
        if (rememberMeData) {
            try {
                const parsed = JSON.parse(rememberMeData);
                return parsed.value === true && Date.now() < parsed.expiry;
            } catch(e) {
                return false;
            }
        }
        return false;
    }

    /**
     * Sync session from localStorage (Remember Me) to sessionStorage
     */
    function syncSessionFromRememberMe() {
        if (isRememberMeActive()) {
            const userData = getSessionData(SESSION_KEYS.USER_DATA);
            const userType = getSessionData(SESSION_KEYS.USER_TYPE);
            const email = getSessionData(SESSION_KEYS.USER);
            
            if (email && userData) {
                sessionStorage.setItem(SESSION_KEYS.USER, JSON.stringify(email));
                sessionStorage.setItem(SESSION_KEYS.USER_DATA, JSON.stringify(userData));
                if (userType) {
                    sessionStorage.setItem(SESSION_KEYS.USER_TYPE, JSON.stringify(userType));
                }
                console.log('🔄 Synced session from Remember Me to sessionStorage');
                return true;
            }
        }
        return false;
    }

    /**
     * Get current user from session
     * @returns {object|null} - User object or null if not logged in
     */
    function getCurrentUser() {
        let savedUser = getSessionData(SESSION_KEYS.USER);
        let savedUserData = getSessionData(SESSION_KEYS.USER_DATA);
        
        // Fallback to direct access
        if (!savedUser) {
            savedUser = sessionStorage.getItem(SESSION_KEYS.USER) || localStorage.getItem(SESSION_KEYS.USER);
            if (savedUser) {
                try {
                    savedUser = JSON.parse(savedUser);
                } catch(e) {}
            }
        }
        
        if (!savedUserData) {
            savedUserData = sessionStorage.getItem(SESSION_KEYS.USER_DATA) || localStorage.getItem(SESSION_KEYS.USER_DATA);
            if (savedUserData) {
                try {
                    savedUserData = JSON.parse(savedUserData);
                } catch(e) {}
            }
        }
        
        if (!savedUser || !savedUserData) {
            return null;
        }

        try {
            if (typeof savedUserData === 'string') {
                savedUserData = JSON.parse(savedUserData);
            }
            
            return {
                email: savedUser,
                data: savedUserData,
                fullName: `${savedUserData['First Name'] || ''} ${savedUserData['Last Name'] || ''}`.trim() || 'User'
            };
        } catch (e) {
            console.error('Error parsing user data:', e);
            return null;
        }
    }

    /**
     * Check if user is logged in
     * @returns {boolean} - True if logged in
     */
    function isLoggedIn() {
        // Try to sync from Remember Me first
        syncSessionFromRememberMe();
        
        const user = getCurrentUser();
        return user !== null;
    }

    /**
     * Get current user data
     * @returns {object|null} - User data or null
     */
    function getCurrentUserData() {
        return getCurrentUser();
    }

    /**
     * Clear all session data (logout)
     */
    function clearSession() {
        Object.values(SESSION_KEYS).forEach(key => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        });
        console.log('🗑️ Session cleared');
    }

    // ============================================================
    // ⭐ MAIN FUNCTION - Check Login and Redirect
    // ============================================================

    /**
     * Check login status and redirect if not logged in
     * @param {string} redirectUrl - URL to redirect to if not logged in (default: 'myaccount.html')
     * @param {function} onSuccess - Optional callback when logged in
     * @returns {boolean} - True if logged in, false otherwise
     */
    function checkLoginStatus(redirectUrl = 'myaccount.html', onSuccess = null) {
        // Try to sync from Remember Me
        syncSessionFromRememberMe();
        
        // Get current user
        const user = getCurrentUser();
        
        if (!user) {
            console.warn('⚠️ No session found, redirecting to login');
            window.location.href = redirectUrl;
            return false;
        }

        console.log(`✅ User authenticated: ${user.fullName} (${user.email})`);
        
        // Check if Remember Me is active
        const isRememberMe = isRememberMeActive();
        console.log(`📌 Session source: ${isRememberMe ? 'Remember Me (10 days)' : 'Session'}`);
        
        // Call onSuccess callback if provided
        if (onSuccess && typeof onSuccess === 'function') {
            onSuccess(user);
        }
        
        return true;
    }

    /**
     * Get expiry time remaining for Remember Me session
     * @returns {object|null} - { days, hours, minutes, total } or null
     */
    function getSessionExpiry() {
        const expiryData = localStorage.getItem(SESSION_KEYS.SESSION_EXPIRY);
        if (expiryData) {
            try {
                const parsed = JSON.parse(expiryData);
                if (Date.now() < parsed.expiry) {
                    const remaining = parsed.expiry - Date.now();
                    const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
                    const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
                    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
                    return { days, hours, minutes, total: remaining };
                }
            } catch(e) {}
        }
        return null;
    }

    // ============================================================
    // EXPOSE FUNCTIONS TO GLOBAL SCOPE
    // ============================================================

    window.RememberMe = {
        checkLoginStatus: checkLoginStatus,
        isLoggedIn: isLoggedIn,
        getCurrentUser: getCurrentUserData,
        getCurrentUserData: getCurrentUserData,
        clearSession: clearSession,
        isRememberMeActive: isRememberMeActive,
        getSessionExpiry: getSessionExpiry,
        syncSession: syncSessionFromRememberMe
    };

    console.log('🔐 Remember Me Login Script loaded');
    console.log('📖 Usage: RememberMe.checkLoginStatus("myaccount.html")');

})();