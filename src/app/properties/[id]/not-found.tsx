import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-brand-500">404</h1>
        <h2 className="text-2xl font-semibold text-gray-900 mt-4">Property Not Found</h2>
        <p className="text-gray-500 mt-2 mb-8">The property you&apos;re looking for doesn&apos;t exist or has been removed.</p>
        <Link
          href="/properties"
          className="inline-flex px-6 py-3 bg-brand-500 text-white font-semibold rounded-xl hover:bg-brand-600 transition-colors"
        >
          Browse Properties
        </Link>
      </div>
    </div>
  );
}
