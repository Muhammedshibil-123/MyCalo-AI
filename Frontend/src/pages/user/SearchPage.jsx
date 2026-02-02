import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { IoMdArrowBack, IoMdSearch } from "react-icons/io";
import api from "../../lib/axios";

const SearchPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // State for search
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [searchType, setSearchType] = useState("foods"); // Default to 'foods'
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Trigger search when query or type changes
  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const response = await api.get("/api/search/", {
          params: {
            q: query,
            type: searchType,
          },
        });
        setResults(response.data);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search to avoid too many API calls while typing
    const timeoutId = setTimeout(() => {
      fetchResults();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [query, searchType]);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Top Bar */}
      <div className="bg-white px-4 pt-6 pb-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3 max-w-xl mx-auto">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <IoMdArrowBack className="text-xl text-gray-700" />
          </button>
          
          <div className="flex-1 relative">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${searchType}...`}
              className="w-full bg-gray-100 rounded-xl h-12 px-4 pl-11 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <IoMdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400" />
          </div>
        </div>

        {/* Type Toggles */}
        <div className="flex mt-4 p-1 bg-gray-100 rounded-xl max-w-xl mx-auto">
          <button
            onClick={() => setSearchType("foods")}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              searchType === "foods"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Foods
          </button>
          <button
            onClick={() => setSearchType("exercises")}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              searchType === "exercises"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Exercises
          </button>
        </div>
      </div>

      {/* Results Area */}
      <div className="max-w-xl mx-auto px-4 mt-4">
        {loading ? (
          <div className="text-center py-10 text-gray-500 text-sm">Searching...</div>
        ) : results.length === 0 && query ? (
          <div className="text-center py-10 text-gray-500 text-sm">No results found.</div>
        ) : (
          <div className="space-y-3">
            {searchType === "foods" ? (
              // Foods Table/List
              results.map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    <p className="text-xs text-gray-500">{item.brand ? `${item.brand} • ` : ""}{item.serving_size}</p>
                    <div className="mt-2 flex gap-3 text-xs text-gray-600">
                      <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded">Cal: {item.calories}</span>
                      <span>P: {item.protein}g</span>
                      <span>C: {item.carbohydrates}g</span>
                      <span>F: {item.fat}g</span>
                    </div>
                  </div>
                  <button className="w-8 h-8 flex items-center justify-center bg-blue-50 text-blue-600 rounded-full text-lg">
                    +
                  </button>
                </div>
              ))
            ) : (
              // Exercises Table/List
              results.map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">Intensity (MET): {item.met_value}</p>
                  </div>
                  <button className="w-8 h-8 flex items-center justify-center bg-green-50 text-green-600 rounded-full text-lg">
                    +
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;