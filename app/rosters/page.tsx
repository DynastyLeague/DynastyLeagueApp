"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RostersPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new unified roster page
    router.replace('/roster');
  }, [router]);

  return (
    <div className="p-4 bg-white pb-32">
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Redirecting to roster page...</div>
      </div>
    </div>
  );
}