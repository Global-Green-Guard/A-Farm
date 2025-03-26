// app/farmer/register-batch/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiImage } from 'react-icons/fi'; // Import an icon

const RegisterBatchPage = () => {
  const router = useRouter();
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('KG');
  const [imageFile, setImageFile] = useState<File | null>(null); // State for the image file
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null); // State for image preview URL

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        setImageFile(file);
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
    if (!imageFile) { // Make image required for this example
        setError("Please select an image for the batch.");
        return;
    }
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    console.log("Submitting batch data with image:", { productName, quantity, unit, imageName: imageFile.name });

    // Use FormData to send multipart data (including file)
    const formData = new FormData();
    formData.append('productName', productName);
    formData.append('quantity', quantity);
    formData.append('unit', unit);
    formData.append('image', imageFile); // Append the file object

    try {
      const response = await fetch('/api/farmer/batches', {
        method: 'POST',
        // Don't set Content-Type header when using FormData; browser sets it automatically with boundary
        body: formData,
      });
      console.log("Backend Response Status:", response.status);

      const result = await response.json(); // Try parsing JSON regardless of status for error details

      if (!response.ok) {
        console.error("Backend returned error:", response.status, result);
        throw new Error(result.error || `Failed to register batch (Status: ${response.status})`);
      }

      // --- Success Path ---
      console.log("Backend JSON Result:", result);
      setSuccessMessage(`Batch ${result.id} registered! NFT: ${result.nftId}, Image IPFS: ${result.imageUrl}`);
      console.log("Success message set.");

      // Clear form
      setProductName('');
      setQuantity('');
      setUnit('KG');
      setImageFile(null);
      setImagePreview(null);
      // Clear the file input visually (slightly hacky)
      const fileInput = document.getElementById('image') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      console.log("Form cleared.");

      setTimeout(() => {
        console.log("Initiating redirect...");
        router.push('/farmer/batches');
      }, 3000);

    } catch (err: any) {
      console.error("!!!!!! Error caught in handleSubmit !!!!!!:", err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      console.log("Setting isLoading to false.");
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow border border-gray-100">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Register New Batch</h1>

      {/* Changed onSubmit handler */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Product Name, Quantity, Unit inputs (unchanged) ... */}
        <div>
          <label htmlFor="productName" className="block text-sm font-medium text-gray-700">
            Product Name
          </label>
          <input type="text" id="productName" value={productName} onChange={(e) => setProductName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm" />
        </div>
        <div className="flex space-x-4">
          <div className="flex-1">
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantity</label>
            <input type="number" id="quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} required min="1" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm" />
          </div>
          <div className="flex-1">
            <label htmlFor="unit" className="block text-sm font-medium text-gray-700">Unit</label>
            <select id="unit" value={unit} onChange={(e) => setUnit(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm" > <option>KG</option> <option>Tonnes</option> <option>Units</option> <option>Boxes</option> <option>Heads</option> </select>
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
                    name="image"
                    accept="image/png, image/jpeg, image/gif, image/webp" // Accept common image types
                    onChange={handleImageChange}
                    required // Make image required
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                />
            </div>
             <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF, WEBP up to 5MB recommended.</p>
        </div>
        {/* --- End Image Upload --- */}

        {/* Submit Button & Messages (unchanged) ... */}
         <div className="pt-4">
           {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
           {successMessage && <p className="text-sm text-green-600 mb-3">{successMessage}</p>}
          <button type="submit" disabled={isLoading} className={`w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'}`} > {isLoading ? 'Registering...' : 'Register Batch on Hedera'} </button>
        </div>
      </form>
    </div>
  );
};

export default RegisterBatchPage;