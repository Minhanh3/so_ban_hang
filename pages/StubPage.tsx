
import React from 'react';
// @fix: Corrected useLocation and Link imports from react-router-dom
import { useLocation, Link } from "react-router-dom";
import { ArrowLeft } from 'lucide-react';

const StubPage: React.FC = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const statusFilter = searchParams.get('status') || searchParams.get('stock') || searchParams.get('remind') || searchParams.get('collect');

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <Link to="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-8">
        <ArrowLeft size={18} />
        Quay lại Việc cần làm
      </Link>
      
      <div className="bg-white rounded-2xl p-10 border border-gray-100 shadow-sm text-center">
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl font-bold text-blue-600 uppercase">
            {location.pathname.replace('/', '')[0]}
          </span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Trang {location.pathname}</h1>
        <p className="text-gray-500 max-w-md mx-auto">
          Đây là màn hình stub mô phỏng chức năng chi tiết cho mục tiêu điều hướng. 
          {statusFilter && (
            <span className="block mt-4 p-2 bg-yellow-50 text-yellow-700 rounded-lg font-mono text-sm border border-yellow-100">
              Filter: {statusFilter}
            </span>
          )}
        </p>
        <div className="mt-10 grid grid-cols-1 gap-4 max-w-xs mx-auto">
          <div className="h-4 bg-gray-100 rounded-full w-full"></div>
          <div className="h-4 bg-gray-100 rounded-full w-3/4 mx-auto"></div>
          <div className="h-4 bg-gray-100 rounded-full w-full"></div>
        </div>
      </div>
    </div>
  );
};

export default StubPage;
