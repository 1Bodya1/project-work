import { Link, isRouteErrorResponse, useRouteError } from 'react-router';

export default function RouteError() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : 'Something went wrong.';

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-white border border-black/10 rounded-lg p-8 text-center">
        <h1 className="text-3xl mb-3">Something went wrong</h1>
        <p className="text-[#1A1A1A] mb-6">{message}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/cart"
            className="px-6 py-3 bg-[#7A1F2A] text-white rounded hover:bg-[#5A1520] transition-colors"
          >
            Back to cart
          </Link>
          <Link
            to="/"
            className="px-6 py-3 border border-black rounded hover:bg-black hover:text-white transition-colors"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
