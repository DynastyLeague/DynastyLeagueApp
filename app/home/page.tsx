"use client";

import { useAuth } from "@/lib/auth";

export default function HomePage() {
  const { currentTeam } = useAuth();

  return (
    <div className="p-4 bg-white">
      {currentTeam ? (
        <>
          {/* Dynasty League Logo for logged-in users */}
          <div className="text-center mb-8">
            <img
              src={`/api/image?url=${encodeURIComponent("https://drive.google.com/uc?export=view&id=1hOy_hcD3zCKG4ajLx9fSgZcF4Wp1Rfqo")}`}
              alt="Dynasty League"
              className="mx-auto h-48 object-contain"
            />
          </div>
          
          <div className="text-center">
            <h1 className="heading-1 mb-4">The Greatest League on Earth</h1>
            <p className="body-text text-lg">Dynasties aren&apos;t given, there built!</p>
          </div>
        </>
      ) : (
        <div className="text-center">
          <img
            src={`/api/image?url=${encodeURIComponent("https://drive.google.com/uc?export=view&id=1hOy_hcD3zCKG4ajLx9fSgZcF4Wp1Rfqo")}`}
            alt="Dynasty League"
            className="mx-auto h-48 object-contain mb-8"
          />
          <h1 className="heading-1 mb-4">Dynasty League</h1>
          <p className="body-text text-lg">Please log in to access your team</p>
        </div>
      )}
    </div>
  );
}
