// app/farmer/register-batch/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiImage } from 'react-icons/fi'; // Import an icon

const RegisterBatchPage = () => {
  const router = useRouter();
  // State to control input values (optional now, FormData uses 'name')
  // You can keep them if you want controlled components, but ensure the 'name' attribute is also set.
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('KG');
  // Keep image state for preview handling
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        setImageFile(file); // Keep track of the file if needed elsewhere
        // Create a preview URL
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    } else {
        setImageFile(null);
        setImagePreview(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    // Create FormData directly from the form element which triggered the event
    const formData = new FormData(event.currentTarget);

    // Optional: Log FormData entries to debug in browser console
    // console.log("FormData entries:");
    // for (let [key, value] of formData.entries()) {
    //     console.log(`${key}:`, value);
    // }

    try {
        const response = await fetch('/api/farmer/batches', {
            method: 'POST',
            // NO 'Content-Type' header - browser sets it automatically for FormData
            body: formData, // Send FormData directly
        });

        const result = await response.json(); // Still expect JSON response from backend

        if (!response.ok) {
            // Use error message from backend response if available
            throw new Error(result.error || `Failed to register batch (Status: ${response.status})`);
        }

        // Success!
        setSuccessMessage(`Batch ${result.id} registered successfully! NFT ID: ${result.nftId}`);

        // Optionally clear the form fields (resetting state)
        setProductName('');
        setQuantity('');
        setUnit('KG');
        setImageFile(null);
        setImagePreview(null);
        // Clear the file input visually if possible (can be tricky)
        // const fileInput = event.currentTarget.elements.namedItem('image') as HTMLInputElement;
        // if(fileInput) fileInput.value = '';


        // Optionally redirect after a delay
        setTimeout(() => {
            router.push('/farmer/batches'); // Redirect to batches list
            // No need for router.refresh() if revalidatePath is working correctly on backend
        }, 3000);

    } catch (err: any) {
         console.error("Registration failed:", err);
         // Display the caught error message to the user
         setError(err.message || 'An unexpected error occurred.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow border border-gray-100">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Register New Batch</h1>

      {/* Ensure form has onSubmit */}
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Product Name */}
        <div>
          <label htmlFor="productName" className="block text-sm font-medium text-gray-700">
            Product Name
          </label>
          <input
            type="text"
            id="productName"
            name="productName" // <<< --- ADDED name ATTRIBUTE ---
            value={productName} // Keep controlled if desired
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
              name="quantity" // <<< --- ADDED name ATTRIBUTE ---
              value={quantity} // Keep controlled if desired
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
              name="unit" // <<< --- ADDED name ATTRIBUTE ---
              value={unit} // Keep controlled if desired
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

        {/* --- Image Upload Input --- */}
        <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700">
                Batch Image
            </label>
            <div className="mt-1 flex items-center space-x-4">
                {/* Image Preview */}
                <span className="inline-block h-16 w-16 overflow-hidden rounded bg-gray-100 flex items-center justify-center">
                    {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                        <FiImage className="h-8 w-8 text-gray-400" />
                    )}
                </span>
                {/* File Input */}
                <input
                    type="file"
                    id="image"
                    name="image" // <<< --- name ATTRIBUTE ALREADY PRESENT AND CORRECT ---
                    accept="image/png, image/jpeg, image/gif, image/webp"
                    onChange={handleImageChange}
                    // required // Decided to make image optional on backend, remove required if not needed
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                />
            </div>
             <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF, WEBP up to 5MB recommended.</p>
        </div>
        {/* --- End Image Upload --- */}

        {/* Submit Button & Messages */}
         <div className="pt-4">
           {/* Display error message from state */}
           {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
           {/* Display success message from state */}
           {successMessage && <p className="text-sm text-green-600 mb-3">{successMessage}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'}`}
          >
            {isLoading ? 'Registering...' : 'Register Batch on Hedera'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegisterBatchPage;