'use client'

import { useState, useEffect } from "react";
import { MatchRequestSchema, type MatchRequest, defaultUserData } from "../../src/types/user";
import { getAuthToken, useDynamicContext } from '@dynamic-labs/sdk-react-core'
import Popup from '../user/popup'

export default function UserForm() {
  const { user } = useDynamicContext();
  const [data, setData] = useState<MatchRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<string | null>(null);
  const [tempCurrencyValue, setTempCurrencyValue] = useState<string>('');
  const [currencyOrder, setCurrencyOrder] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState<string>('');

  // Fetch initial data when wallet is connected
  useEffect(() => {
    if (!user) {
      // Clear data when user disconnects
      setData(null);
      setError(null);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    const token = getAuthToken()
    console.log('User token', token)
    
    const fetchUser = async () => {
      console.log('fetching user')
      try {
        const response = await fetch('http://localhost:3000/api/user', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        console.log('fetching user', response)
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const responseData = await response.json()
        
        if (responseData.success) {
          console.log('responseData', responseData)
          if (responseData.data) {
            setData(responseData.data as MatchRequest)
            setCurrencyOrder(Object.keys(responseData.data.walletBalance))
          } else {
            setData(defaultUserData)
            setCurrencyOrder(Object.keys(defaultUserData.walletBalance))
          }
        } else {
          setError(responseData.error)
        }
      } catch (err) {
        setError("Failed to fetch user data");
        console.error('Error fetching user:', err);
        // Set default data on error to prevent hooks issues
        setData(defaultUserData)
        setCurrencyOrder(Object.keys(defaultUserData.walletBalance))
      } finally {
        setLoading(false);
      }
    }
    
    fetchUser()
    
  }, [user]); // Use stable user identifier instead of entire user object


  if (!user) {
    return (
      <div className="card">
        <div className="text-center py-12">
          <div className="text-gray-500">Please connect your wallet to manage settings.</div>
        </div>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <div className="spinner"></div>
          <span className="ml-3 text-gray-600">Loading user settings...</span>
        </div>
      </div>
    );
  }

  const updateWallet = (currency: string, value: number) => {
    setData(prev => ({
      ...prev!,
      walletBalance: { ...prev!.walletBalance, [currency]: value },
    }));
  };

  const addWalletRow = () => {
    setData(prev => ({
      ...prev!,
      walletBalance: { ...prev!.walletBalance, NEW: 0 },
    }));
    setCurrencyOrder(prev => [...prev, 'NEW']);
  };

  const removeWalletRow = (currency: string) => {
    const { [currency]: _, ...rest } = data.walletBalance;
    setData({ ...data, walletBalance: rest });
    setCurrencyOrder(prev => prev.filter(c => c !== currency));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSaveStatus('idle');
      
      const parsed = MatchRequestSchema.parse(data); // ✅ frontend validation

      const res = await fetch("http://localhost:3000/api/user", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(parsed),
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.error || "Failed to save settings");
      }

      setSaveStatus('success');
      setSaveMessage('Settings saved successfully!');
      
      // Close modal after 2 seconds on success
      setTimeout(() => {
        setShowModal(false);
        setSaveStatus('idle');
        setSaveMessage('');
      }, 2000);

    } catch (e: any) {
      setSaveStatus('error');
      setSaveMessage(e.message || 'An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="responsive-table-card">
      <div className="table-header-section">
        <div className="table-title-group">
          <h3 className="text-lg font-semibold text-gray-900">
            User Match Settings
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Configure your investment preferences and wallet balances
          </p>
        </div>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Wallet Balance Section */}
        <div className="space-y-4">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '1rem' }}>
            <h4 className="text-md font-semibold text-gray-900">Wallet Balances</h4>
            <button
              className="btn btn-secondary text-sm"
              onClick={addWalletRow}
            >
              + Add Currency
            </button>
          </div>
          
          <div className="space-y-0">
            {currencyOrder.map((currency, index) => {
              const value = data.walletBalance[currency];
              if (value === undefined) return null;
              return (
              <div key={`wallet-${index}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border mb-4">
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700 ">
                    Currency
                  </label>
                  <input
                    className="input-field"
                    value={editingCurrency === currency ? tempCurrencyValue : currency}
                    onFocus={() => {
                      setEditingCurrency(currency);
                      setTempCurrencyValue(currency);
                    }}
                    onChange={e => {
                      setTempCurrencyValue(e.target.value);
                    }}
                    onBlur={() => {
                      if (editingCurrency && tempCurrencyValue.trim() && tempCurrencyValue !== editingCurrency) {
                        const { [editingCurrency]: old, ...rest } = data.walletBalance;
                        setData({
                          ...data,
                          walletBalance: { ...rest, [tempCurrencyValue.trim()]: old },
                        });
                        // Update the order to replace the old currency name with the new one
                        setCurrencyOrder(prev => 
                          prev.map(c => c === editingCurrency ? tempCurrencyValue.trim() : c)
                        );
                      }
                      setEditingCurrency(null);
                      setTempCurrencyValue('');
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur();
                      }
                    }}
                    placeholder="e.g., USDC, ETH"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Balance
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    value={value}
                    onChange={e => updateWallet(currency, parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div className="flex items-center justify-center">
                  <button
                    className="btn bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md text-sm text-center"
                    onClick={() => removeWalletRow(currency)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
            })}
          </div>
        </div>

        {/* Investment Preferences Section */}
        <div className="space-y-4">
          <h4 className="text-md font-semibold text-gray-900">Investment Preferences</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Risk Tolerance (1-10)
              </label>
              <input
                type="number"
                value={data.riskTolerance}
                onChange={e => setData({ ...data, riskTolerance: +e.target.value })}
                className="input-field"
                min="1"
                max="10"
                placeholder="5"
              />
              <p className="text-xs text-gray-500 mt-1">1 = Conservative, 10 = Aggressive</p>
            </div>

            <div>
              <div className="block text-sm font-medium text-gray-700 mb-2">
                Max Allocation %
              </div>
              <input
                type="number"
                value={data.maxAllocationPct}
                onChange={e => setData({ ...data, maxAllocationPct: +e.target.value })}
                className="input-field"
                min="1"
                max="100"
                placeholder="20"
              />
              <p className="text-xs text-gray-500 mt-1">Maximum % per opportunity</p>
            </div>

            <div>
              <div className="block text-sm font-medium text-gray-700 mb-2">
                Investment Horizon (days)
              </div>
              <input
                type="number"
                value={data.investmentHorizon}
                onChange={e =>
                  setData({ ...data, investmentHorizon: +e.target.value })
                }
                className="input-field"
                min="1"
                placeholder="365"
              />
              <p className="text-xs text-gray-500 mt-1">How long you plan to invest</p>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="text-red-800 text-sm">{error}</div>
          </div>
        )}

        <Popup open={showModal} onClose={() => {setShowModal(false);setSaveStatus('idle');setSaveMessage('')}} title="Confirm Save">
          {saveStatus === 'idle' && (
            <>
              <p className="text-sm text-gray-600">Are you sure you want to save your settings?</p>
              <div className="flex justify-end gap-3 mt-4">
                <button onClick={() => setShowModal(false)} className="btn btn-secondary text-sm">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving} className="btn btn-primary text-sm">
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </>
          )}
          
          {saveStatus === 'success' && (
            <div className="text-center">
              <div className="text-green-600 text-lg mb-2">✓</div>
              <p className="text-sm text-gray-600">{saveMessage}</p>
            </div>
          )}
          
          {saveStatus === 'error' && (
            <div className="text-center">
              <div className="text-red-600 text-lg mb-2">✗</div>
              <p className="text-sm text-red-600">{saveMessage}</p>
              <div className="flex justify-end gap-3 mt-4">
                <button onClick={() => {setShowModal(false);setSaveStatus('idle');setSaveMessage('')}} className="btn btn-secondary text-sm">
                  Close
                </button>
                <button onClick={handleSave} disabled={saving} className="btn btn-primary text-sm">
                  {saving ? 'Saving...' : 'Try Again'}
                </button>
              </div>
            </div>
          )}
        </Popup>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200 mt-4">
          <button
            onClick={() => setShowModal(true)}
            disabled={saving}
            className="btn btn-primary px-6 py-2 text-sm font-medium"
          >
            {saving ? (
              <span className="flex items-center">
                <div className="spinner-small"></div>
                <span className="ml-2">Saving...</span>
              </span>
            ) : (
              'Save Settings'
            )}
          </button>
        </div> 
      </div>
    </div>
  );
}