import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { UserCircleIcon, ShieldCheckIcon, BellIcon, ArrowRightIcon, XMarkIcon } from '../icons/Icons';

const AccountSettingsScreen: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [notificationEmail, setNotificationEmail] = useState(true);
  const [notificationSMS, setNotificationSMS] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');

  // Password Change State
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');

  const handleSave = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      alert("Changes saved successfully.");
    }, 1000);
  };

  const handleLogout = () => {
    if (confirm("Are you sure you want to log out?")) {
        window.location.reload(); // Simple reload to simulate logout for demo
    }
  };

  const handleSubmitPasswordChange = (e: React.FormEvent) => {
      e.preventDefault();
      setPasswordError('');

      if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
          setPasswordError("All fields are required.");
          return;
      }
      if (passwordForm.new !== passwordForm.confirm) {
          setPasswordError("New passwords do not match.");
          return;
      }
      if (passwordForm.new.length < 8) {
          setPasswordError("Password must be at least 8 characters long.");
          return;
      }

      // Simulate API call
      setIsLoading(true);
      setTimeout(() => {
          setIsLoading(false);
          setIsChangePasswordOpen(false);
          setPasswordForm({ current: '', new: '', confirm: '' });
          alert("Password updated successfully.");
      }, 1500);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 relative">
      
      {/* Change Password Modal */}
      {isChangePasswordOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all scale-100">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                      <h3 className="font-bold text-lg text-neutral-dark">Change Password</h3>
                      <button 
                        onClick={() => {
                            setIsChangePasswordOpen(false);
                            setPasswordForm({ current: '', new: '', confirm: '' });
                            setPasswordError('');
                        }} 
                        className="text-gray-400 hover:text-gray-600 rounded-full p-1 hover:bg-gray-200 transition-colors"
                      >
                          <XMarkIcon className="h-6 w-6" />
                      </button>
                  </div>
                  
                  <form onSubmit={handleSubmitPasswordChange} className="p-6 space-y-4">
                      {passwordError && (
                          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                              {passwordError}
                          </div>
                      )}
                      
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                          <input 
                              type="password"
                              value={passwordForm.current}
                              onChange={(e) => setPasswordForm(prev => ({ ...prev, current: e.target.value }))}
                              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary transition-shadow bg-white text-neutral-black"
                              placeholder="Enter current password"
                          />
                      </div>
                      
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                          <input 
                              type="password"
                              value={passwordForm.new}
                              onChange={(e) => setPasswordForm(prev => ({ ...prev, new: e.target.value }))}
                              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary transition-shadow bg-white text-neutral-black"
                              placeholder="Min. 8 characters"
                          />
                      </div>

                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                          <input 
                              type="password"
                              value={passwordForm.confirm}
                              onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm: e.target.value }))}
                              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary transition-shadow bg-white text-neutral-black"
                              placeholder="Re-enter new password"
                          />
                      </div>

                      <div className="pt-4 flex justify-end gap-3">
                          <button 
                            type="button"
                            onClick={() => setIsChangePasswordOpen(false)}
                            className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                          >
                              Cancel
                          </button>
                          <button 
                            type="submit"
                            disabled={isLoading}
                            className="bg-brand-primary hover:bg-brand-secondary text-white px-6 py-2 rounded-lg font-bold shadow-sm disabled:opacity-70 transition-all flex items-center"
                          >
                            {isLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>}
                            Update Password
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      <div>
        <h1 className="text-3xl font-bold text-neutral-dark">Account Settings</h1>
        <p className="text-gray-500 mt-1">Manage your profile and preferences.</p>
      </div>

      {/* Profile Section */}
      <Card>
        <div className="flex items-center space-x-4 mb-6 border-b border-gray-100 pb-4">
            <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center text-gray-400">
                <UserCircleIcon className="h-12 w-12" />
            </div>
            <div>
                <h2 className="text-xl font-semibold text-neutral-dark">Alex Johnson</h2>
                <p className="text-sm text-gray-500">Senior Adjuster • TrueManifest ID: ADJ-8821</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input 
                    type="text" 
                    defaultValue="Alex Johnson" 
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white text-neutral-black"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input 
                    type="email" 
                    defaultValue="alex.johnson@insuranceco.com" 
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white text-neutral-black"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <input 
                    type="text" 
                    defaultValue="Senior Adjuster (Level 3)" 
                    disabled
                    className="w-full border border-gray-200 bg-gray-50 text-gray-500 rounded-lg px-4 py-2 cursor-not-allowed"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Office Location</label>
                <input 
                    type="text" 
                    defaultValue="Boston, MA" 
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white text-neutral-black"
                />
            </div>
        </div>
      </Card>

      {/* Notifications & Security */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
            <div className="flex items-center space-x-2 mb-4 text-brand-primary">
                <BellIcon className="h-6 w-6" />
                <h3 className="font-bold text-lg">Notifications</h3>
            </div>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium text-neutral-dark">Email Alerts</p>
                        <p className="text-xs text-gray-500">Receive daily summaries</p>
                    </div>
                    <button 
                        onClick={() => setNotificationEmail(!notificationEmail)}
                        className={`w-12 h-6 rounded-full p-1 transition-colors ${notificationEmail ? 'bg-brand-primary' : 'bg-gray-300'}`}
                    >
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${notificationEmail ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </button>
                </div>
                
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-neutral-dark">SMS Alerts</p>
                            <p className="text-xs text-gray-500">High priority fraud flags</p>
                        </div>
                         <button 
                            onClick={() => setNotificationSMS(!notificationSMS)}
                            className={`w-12 h-6 rounded-full p-1 transition-colors ${notificationSMS ? 'bg-brand-primary' : 'bg-gray-300'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${notificationSMS ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </button>
                    </div>
                    
                    {notificationSMS && (
                        <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Mobile Phone Number</label>
                            <input 
                                type="tel" 
                                placeholder="(555) 123-4567"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white text-neutral-black"
                            />
                        </div>
                    )}
                </div>
            </div>
        </Card>

        <Card>
            <div className="flex items-center space-x-2 mb-4 text-status-green">
                <ShieldCheckIcon className="h-6 w-6" />
                <h3 className="font-bold text-lg">Security</h3>
            </div>
            <div className="space-y-4">
                <button 
                    onClick={() => setIsChangePasswordOpen(true)}
                    className="w-full text-left flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <span className="text-sm font-medium">Change Password</span>
                    <ArrowRightIcon className="h-4 w-4 text-gray-400" />
                </button>
                <button className="w-full text-left flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <span className="text-sm font-medium">Two-Factor Auth (2FA)</span>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-bold">Enabled</span>
                </button>
            </div>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <button 
            onClick={handleLogout}
            className="text-red-600 font-medium hover:text-red-800 text-sm px-4 py-2"
          >
            Log Out
          </button>
          <div className="space-x-4">
              <button className="text-gray-600 hover:text-gray-900 font-medium">Cancel</button>
              <button 
                onClick={handleSave}
                disabled={isLoading}
                className="bg-brand-primary hover:bg-brand-secondary text-white px-6 py-2 rounded-lg font-bold shadow-sm disabled:opacity-50 transition-all"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
          </div>
      </div>
    </div>
  );
};

export default AccountSettingsScreen;