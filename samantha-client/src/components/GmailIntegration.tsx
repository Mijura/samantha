import React, { useState } from 'react';

interface GmailIntegrationProps {
  apiUrl: string;
}

export const GmailIntegration: React.FC<GmailIntegrationProps> = ({ apiUrl }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEmail, setLastEmail] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const connectGmail = async () => {
    try {
      const response = await fetch(`${apiUrl}/gmail/auth`);
      const data = await response.json();
      window.location.href = data.authUrl;
    } catch (err) {
      setError('Failed to initiate Gmail connection');
    }
  };

  const getLastEmail = async () => {
    try {
      const response = await fetch(`${apiUrl}/gmail/last-email`);
      const data = await response.json();
      if (response.ok) {
        setLastEmail(data.message);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch last email');
      }
    } catch (err) {
      setError('Failed to fetch last email');
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Gmail Integration</h2>
      
      {!isConnected ? (
        <button
          onClick={connectGmail}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
        >
          Connect Gmail
        </button>
      ) : (
        <div>
          <button
            onClick={getLastEmail}
            className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded mb-4"
          >
            Get Last Email
          </button>

          {lastEmail && (
            <div className="mt-4 p-4 bg-gray-50 rounded">
              <h3 className="font-semibold mb-2">Last Email:</h3>
              <pre className="whitespace-pre-wrap text-sm">
                {JSON.stringify(lastEmail, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded">
          {error}
        </div>
      )}
    </div>
  );
}; 