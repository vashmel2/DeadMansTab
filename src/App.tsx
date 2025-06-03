import React from 'react';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import EmailForm from './components/EmailForm';

function App() {
  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: 'white',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: 'white',
            },
          },
        }}
      />
      <Layout>
        <EmailForm />
      </Layout>
    </>
  );
}

export default App;