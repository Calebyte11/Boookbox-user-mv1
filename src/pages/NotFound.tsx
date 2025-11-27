import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-4xl font-bold text-primary font-mono">404</h1>
      <p className="text-lg text-gray-600">Page Not Found</p>
      <Link to="/" className="mt-4 px-4 py-2 text-white rounded hover:bg-primary">
        Go Home
      </Link>
    </div>
  );
};

export default NotFound;
