import { useNavigate } from "react-router-dom";
import { RiCameraAiFill } from "react-icons/ri";
import { IoMdSearch } from "react-icons/io";

const Home = () => {
  const navigate = useNavigate();
  const kcalLeft = 1500;
  const percent = 100;
  const eaten = 0;
  const burned = 0;
  const carbs = { cur: 0, total: 113 };
  const protein = { cur: 0, total: 131 };
  const fat = { cur: 0, total: 58 };

  const meals = [
    { id: "breakfast", title: "Breakfast", subtitle: "Recommended 300–450 kcal" },
    { id: "lunch", title: "Lunch", subtitle: "Recommended 380–530 kcal" },
    { id: "dinner", title: "Dinner", subtitle: "Recommended 380–530 kcal" }
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 pb-28">
      <div className="px-5 pt-6 max-w-xl mx-auto">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl md:text-3xl font-extrabold leading-tight">Hi, Muhammed</h2>
          </div>

          <button
            onClick={() => navigate("/qr")}
            className="ml-4 w-12 h-12 rounded-full bg-black/90 flex items-center justify-center text-white shadow-md"
            aria-label="scan-qr"
          >
            <RiCameraAiFill className="text-xl" />
          </button>
        </div>

        <div className="mt-6">
          <div className="relative">
            <input
              placeholder="Search calories, recipes or exercises..."
              className="w-full bg-gray-100 rounded-2xl h-14 px-5 pr-12 text-sm focus:outline-none"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              <IoMdSearch />
            </div>
          </div>
        </div>

        <div className="mt-5 bg-gradient-to-b from-gray-50 to-white rounded-2xl p-4 shadow-sm">
          <div className="text-sm text-gray-700">Hey, I'm <span className="font-semibold text-[#6C3AC9]">Sofiya</span> — your AI assistant.</div>
          <div className="mt-2 text-xs text-gray-700">
            Today your protein intake looks low and cholesterol indicators are slightly high. Try adding a small portion of lean protein (eggs, chicken), more vegetables and fiber-rich snacks. Prefer grilled or steamed options.
          </div>
        </div>

        <div className="mt-6 rounded-xl overflow-hidden p-4 shadow-sm bg-white border">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="w-28 h-28 rounded-full flex items-center justify-center relative mx-auto md:mx-0">
              <div className="absolute inset-0 rounded-full border border-gray-200"></div>
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-50 to-white flex flex-col items-center justify-center">
                <div className="text-3xl md:text-4xl font-extrabold text-blue-500">{kcalLeft}</div>
                <div className="text-[10px] md:text-xs text-gray-400">KCAL LEFT</div>
                <div className="mt-1 text-blue-500 text-sm">{percent} %</div>
              </div>
            </div>

            <div className="flex-1 w-full">
              <div className="flex justify-between gap-3">
                <div className="flex-1 bg-green-50 rounded-xl p-3 flex flex-col items-center">
                  <div className="text-2xl font-semibold">{eaten}</div>
                  <div className="text-xs text-gray-600 mt-1">EATEN</div>
                </div>

                <div className="flex-1 bg-red-50 rounded-xl p-3 flex flex-col items-center">
                  <div className="text-2xl font-semibold">{burned}</div>
                  <div className="text-xs text-gray-600 mt-1">BURNED</div>
                </div>
              </div>

              <div className="mt-4 bg-black/90 rounded-xl text-white p-3">
                <div className="flex justify-between items-center">
                  <div className="text-sm opacity-80">STATS</div>
                  <div className="text-sm">▾</div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <div className="text-xs md:text-sm">Carbs</div>
                    <div className="mt-2 h-1 bg-white/30 rounded-full overflow-hidden">
                      <div style={{ width: `${(carbs.cur / carbs.total) * 100 || 0}%` }} className="h-1 bg-white rounded-full"></div>
                    </div>
                    <div className="mt-1 text-[10px] md:text-xs">{carbs.cur}/{carbs.total}g</div>
                  </div>

                  <div className="text-center">
                    <div className="text-xs md:text-sm">Protein</div>
                    <div className="mt-2 h-1 bg-white/30 rounded-full overflow-hidden">
                      <div style={{ width: `${(protein.cur / protein.total) * 100 || 0}%` }} className="h-1 bg-white rounded-full"></div>
                    </div>
                    <div className="mt-1 text-[10px] md:text-xs">{protein.cur}/{protein.total}g</div>
                  </div>

                  <div className="text-center">
                    <div className="text-xs md:text-sm">Fat</div>
                    <div className="mt-2 h-1 bg-white/30 rounded-full overflow-hidden">
                      <div style={{ width: `${(fat.cur / fat.total) * 100 || 0}%` }} className="h-1 bg-white rounded-full"></div>
                    </div>
                    <div className="mt-1 text-[10px] md:text-xs">{fat.cur}/{fat.total}g</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-center gap-6 text-gray-600">
                <button className="p-2 rounded-full bg-gray-100">◀</button>
                <div className="text-center">
                  <div className="text-xs">JAN 26, 2026</div>
                  <div className="text-sm font-semibold">TODAY</div>
                </div>
                <button className="p-2 rounded-full bg-gray-100">▶</button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {meals.map((m) => (
            <div key={m.id} className="flex items-center justify-between bg-white border rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-yellow-300 flex items-center justify-center text-white text-sm font-semibold">
                  {m.title[0]}
                </div>
                <div>
                  <div className="text-base font-semibold">{m.title}</div>
                  <div className="text-sm text-gray-500 mt-1">{m.subtitle}</div>
                </div>
              </div>

              <button
                onClick={() => navigate("/add-meal")}
                className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600"
                aria-label={`add-${m.id}`}
              >
                +
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;