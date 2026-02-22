function Exp() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex items-center justify-center min-h-screen">
        <div className="card max-w-md w-full mx-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Service Center Stock Management
          </h1>
          <p className="text-gray-600 mb-6">
            Frontend foundation ready. Tailwind CSS working!
          </p>
          
          {/* Test category badges */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Category Badges:</p>
            <div className="flex flex-wrap gap-2">
              <span className="badge-in-stock">In Stock</span>
              <span className="badge-spu-pending">SPU Pending</span>
              <span className="badge-spu-cleared">SPU Cleared</span>
              <span className="badge-amc">AMC</span>
              <span className="badge-og">OG</span>
              <span className="badge-return">Return</span>
              <span className="badge-received-others">Received</span>
            </div>
          </div>

          {/* Test buttons */}
          <div className="mt-6 space-y-2">
            <p className="text-sm font-medium text-gray-700">Buttons:</p>
            <div className="flex flex-wrap gap-2">
              <button className="btn-primary">Primary</button>
              <button className="btn-secondary">Secondary</button>
              <button className="btn-success">Success</button>
              <button className="btn-danger">Danger</button>
            </div>
          </div>

          {/* Test input */}
          <div className="mt-6">
            <label className="label">Test Input</label>
            <input type="text" className="input" placeholder="Enter text..." />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Exp;