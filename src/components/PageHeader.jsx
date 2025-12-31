import { FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function PageHeader({ title }) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between mb-4 border-b pb-2">
      <h1 className="text-2xl font-bold">{title}</h1>

      {/* ❌ Close button */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        aria-label="Close page"
        className="p-1 text-gray-500 hover:text-red-600 transition"
      >
        <FaTimes size={18} />
      </button>
    </div>
  );
}
