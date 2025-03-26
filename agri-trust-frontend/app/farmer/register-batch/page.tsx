// app/farmer/register-batch/page.tsx
'use client'; // This marks it as a Client Component

import React, { useState } from 'react';
import { useRouter } from 'next/navigation'; // Use App Router's router

const RegisterBatchPage = () => {
  const router = useRouter();
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('KG'); // Default unit
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/farmer/batches', { // Relative URL works fine from client-side fetch
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add Authorization header with JWT token when auth is implemented
        },
        body: JSON.stringify({
          productName,
          quantity: parseInt(quantity, 10), // Ensure quantity is a number
          unit,
          // TODO: Add fields for uploading images/docs -> requires different handling (multipart/form-data)
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle API errors (e.g., validation, Hedera errors)
        throw new Error(result.error || `Failed to register batch (Status: ${response.status})`);
      }

      // Success!
      setSuccessMessage(`Batch ${result.id} registered successfully! NFT ID: ${result.nftId}`);
      // Optionally clear the form
      setProductName('');
      setQuantity('');
      setUnit('KG');
      // Optionally redirect after a delay
      setTimeout(() => {
        router.push('/farmer/batches'); // Redirect to batches list
        router.refresh(); // Ensure the batches page re-fetches data
      }, 3000);


    } catch (err: any) {
      console.error("Registration failed:", err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow border border-gray-100">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Register New Batch</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Product Name */}
        <div>
          <label htmlFor="productName" className="block text-sm font-medium text-gray-700">
            Product Name
          </label>
          <input
            type="text"
            id="productName"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
          />
        </div>

        {/* Quantity and Unit */}
        <div className="flex space-x-4">
          <div className="flex-1">
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
              Quantity
            </label>
            <input
              type="number"
              id="quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              min="1"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="unit" className="block text-sm font-medium text-gray-700">
              Unit
            </label>
            <select
              id="unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
            >
              <option>KG</option>
              <option>Tonnes</option>
              <option>Units</option>
              <option>Boxes</option>
              <option>Heads</option>
              {/* Add more units as needed */}
            </select>
          </div>
        </div>

        {/* TODO: Add file input for images/docs */}
        {/* <div >
             <label htmlFor="files" className="block text-sm font-medium text-gray-700">
                Initial Photos/Documents (Optional)
             </label>
             <input type="file" id="files" multiple className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"/>
        </div> */}


        {/* Submit Button & Messages */}
        <div className="pt-4">
           {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
           {successMessage && <p className="text-sm text-green-600 mb-3">{successMessage}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white 
              ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'}`}
          >
            {isLoading ? 'Registering...' : 'Register Batch on Hedera'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegisterBatchPage;
