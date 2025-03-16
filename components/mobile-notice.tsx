import React from 'react';

const MobileNotice = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-black p-6 text-center lg:hidden">
      <img src="/logo.svg" alt="samantha" className="w-32 h-32 object-cover mb-6" />
      <h1 className="text-2xl font-bold mb-4">samantha</h1>
      <p className="text-lg mb-6">samantha is currently in alpha and only available on desktop.</p>
    </div>
  );
};

export default MobileNotice; 