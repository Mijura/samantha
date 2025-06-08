import React from 'react';
import { GmailIntegration } from './components/GmailIntegration';

const App: React.FC = () => {
	return (
		<div className="min-h-screen bg-gray-100 py-8">
			<div className="max-w-4xl mx-auto px-4">
				<h1 className="text-3xl font-bold mb-8">Samantha</h1>
				<GmailIntegration apiUrl={import.meta.env.VITE_API_URL || 'http://localhost:3000'} />
			</div>
		</div>
	);
};

export default App;
