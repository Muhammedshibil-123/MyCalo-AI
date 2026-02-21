import React, { useState, useEffect } from 'react';
import { FiSearch, FiEdit2, FiTrash2, FiCheckCircle, FiXCircle, FiX, FiFilter, FiImage, FiPlus, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import api from '../../lib/axios';

const AdminFoods = () => {
    const [foods, setFoods] = useState([]);
    
    // Loading States
    const [initialLoading, setInitialLoading] = useState(true);
    const [isFetching, setIsFetching] = useState(false);
    
    // Filters & Pagination
    const [searchInput, setSearchInput] = useState('');
    const [activeSearch, setActiveSearch] = useState('');
    const [sortOrder, setSortOrder] = useState('-votes');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Accordion State
    const [expandedRow, setExpandedRow] = useState(null);

    // Modal States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addStep, setAddStep] = useState(1); 
    const [newFoodId, setNewFoodId] = useState(null);
    const [verifyNewFood, setVerifyNewFood] = useState(false);
    
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedFood, setSelectedFood] = useState(null);
    
    const [formData, setFormData] = useState({});
    const [selectedImages, setSelectedImages] = useState([]);
    const [isSaving, setIsSaving] = useState(false);

    // --- LIVE SEARCH (DEBOUNCED) ---
    // This waits 500ms after you stop typing before it automatically searches
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (activeSearch !== searchInput) {
                setActiveSearch(searchInput);
                setCurrentPage(1); // Reset to page 1 on new search
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchInput, activeSearch]);

    useEffect(() => {
        fetchFoods('initial');
    }, []); 

    useEffect(() => {
        if (!initialLoading) {
            fetchFoods('fetching');
        }
    }, [currentPage, activeSearch, sortOrder]); 

    const fetchFoods = async (mode = 'fetching') => {
        if (mode === 'initial') setInitialLoading(true);
        if (mode === 'fetching') setIsFetching(true);
        
        try {
            const res = await api.get(`/api/foods/admin/manage/?page=${currentPage}&search=${activeSearch}&sort=${sortOrder}`, { skipLoading: true });
            setFoods(res.data.results);
            setTotalPages(Math.ceil(res.data.count / 10));
        } catch (error) {
            console.error('Error fetching foods:', error);
        } finally {
            if (mode === 'initial') setInitialLoading(false);
            if (mode === 'fetching') setIsFetching(false);
        }
    };

    // If user presses "Enter", search immediately without waiting for debounce
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setActiveSearch(searchInput);
        setCurrentPage(1);
    };

    const toggleVerification = async (id) => {
        setFoods(prev => prev.map(food => food.id === id ? { ...food, is_verified: !food.is_verified } : food));
        
        try {
            await api.patch(`/api/foods/admin/manage/${id}/verify/`, {}, { skipLoading: true });
        } catch (error) {
            console.error('Error verifying food:', error);
            setFoods(prev => prev.map(food => food.id === id ? { ...food, is_verified: !food.is_verified } : food));
        }
    };

    const toggleRow = (id) => {
        setExpandedRow(expandedRow === id ? null : id);
    };

    const deleteExistingImage = async (imageId) => {
        try {
            await api.delete(`/api/foods/admin/manage/images/${imageId}/`, { skipLoading: true });
            setFormData(prev => ({ ...prev, images: prev.images.filter(img => img.id !== imageId) }));
            setFoods(prev => prev.map(food => {
                if(food.id === selectedFood.id) return { ...food, images: food.images.filter(img => img.id !== imageId) };
                return food;
            }));
        } catch (error) {
            console.error('Error deleting image:', error);
        }
    };

    const openAddModal = () => {
        setFormData({ serving_size: "100g" }); 
        setSelectedImages([]);
        setAddStep(1);
        setNewFoodId(null);
        setVerifyNewFood(false);
        setIsAddModalOpen(true);
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => { if (key !== 'serving_size') data.append(key, formData[key]); });
            data.append('serving_size', '100g'); 
            selectedImages.forEach(img => data.append('images', img));

            const res = await api.post('/api/foods/admin/manage/', data, { 
                headers: { 'Content-Type': 'multipart/form-data' },
                skipLoading: true
            });
            setNewFoodId(res.data.id);
            setAddStep(2); 
        } catch (error) {
            console.error('Error adding food:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleFinishAdd = async () => {
        setIsSaving(true);
        if (verifyNewFood && newFoodId) {
            try { await api.patch(`/api/foods/admin/manage/${newFoodId}/verify/`, {}, { skipLoading: true }); } 
            catch (error) { console.error("Failed to verify:", error); }
        }
        setIsSaving(false);
        setIsAddModalOpen(false);
        fetchFoods('silent'); 
    };

    const openEditModal = (food) => {
        setSelectedFood(food);
        setFormData({ ...food, serving_size: "100g" }); 
        setSelectedImages([]);
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                if (key !== 'images' && key !== 'serving_size') data.append(key, formData[key]);
            });
            data.append('serving_size', '100g');
            selectedImages.forEach(img => data.append('images', img));

            const res = await api.put(`/api/foods/admin/manage/${selectedFood.id}/`, data, { 
                headers: { 'Content-Type': 'multipart/form-data' },
                skipLoading: true
            });
            
            setFoods(prev => prev.map(food => food.id === selectedFood.id ? res.data : food));
            setIsEditModalOpen(false);
        } catch (error) {
            console.error('Error updating food:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const openDeleteModal = (food) => {
        setSelectedFood(food);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        const idToDelete = selectedFood.id;
        setIsDeleteModalOpen(false);
        
        setFoods(prev => prev.filter(food => food.id !== idToDelete));
        
        try {
            await api.delete(`/api/foods/admin/manage/${idToDelete}/`, { skipLoading: true });
            fetchFoods('silent'); 
        } catch (error) {
            console.error('Error deleting food:', error);
            fetchFoods('silent'); 
        }
    };

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        setSelectedImages(Array.from(e.target.files));
    };

    const SkeletonRow = () => (
        <tr className="animate-pulse bg-zinc-800/20">
            <td className="px-6 py-4"><div className="h-10 w-10 bg-zinc-800 rounded-md"></div></td>
            <td className="px-6 py-4"><div className="h-4 w-32 bg-zinc-800 rounded mb-2"></div><div className="h-3 w-20 bg-zinc-800 rounded"></div></td>
            <td className="px-6 py-4"><div className="h-4 w-16 bg-zinc-800 rounded"></div></td>
            <td className="px-6 py-4"><div className="h-4 w-16 bg-zinc-800 rounded"></div></td>
            <td className="px-6 py-4"><div className="h-6 w-12 bg-zinc-800 rounded"></div></td>
            <td className="px-6 py-4"><div className="h-6 w-20 bg-zinc-800 rounded-full"></div></td>
            <td className="px-6 py-4 text-right"><div className="h-8 w-24 bg-zinc-800 rounded ml-auto"></div></td>
        </tr>
    );

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-white">Food Database</h1>
                    <p className="mt-1 text-sm text-zinc-400">Manage, verify, and edit food items.</p>
                </div>
                <button onClick={openAddModal} className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg font-medium text-sm hover:bg-zinc-200 transition-colors shadow-lg">
                    <FiPlus /> Add Food
                </button>
            </div>

            {/* Top Bar: Search and Sort */}
            <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-center">
                <form onSubmit={handleSearchSubmit} className="w-full md:w-1/2 relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search foods by name..."
                        className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-zinc-500 transition-colors"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                </form>

                <div className="w-full md:w-auto flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2">
                    <FiFilter className="text-zinc-500" />
                    <select
                        className="bg-transparent text-white text-sm focus:outline-none cursor-pointer"
                        value={sortOrder}
                        onChange={(e) => { setSortOrder(e.target.value); setCurrentPage(1); }}
                    >
                        <option value="-votes" className="bg-zinc-900">Votes: High to Low</option>
                        <option value="votes" className="bg-zinc-900">Votes: Low to High</option>
                    </select>
                </div>
            </div>

            {/* Food Table */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden min-h-[500px]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-900/50 border-b border-zinc-800 text-zinc-400">
                            <tr>
                                <th className="px-6 py-4 font-medium w-16">Photo</th>
                                <th className="px-6 py-4 font-medium">Food Name</th>
                                <th className="px-6 py-4 font-medium">Serving Size</th>
                                <th className="px-6 py-4 font-medium">Calories</th>
                                <th className="px-6 py-4 font-medium">Votes</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        
                        <tbody className={`divide-y divide-zinc-800 transition-opacity duration-300 ${isFetching ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                            {initialLoading ? (
                                <> <SkeletonRow /><SkeletonRow /><SkeletonRow /><SkeletonRow /><SkeletonRow /> </>
                            ) : foods.length === 0 ? (
                                <tr><td colSpan="7" className="px-6 py-12 text-center text-zinc-500">No foods found.</td></tr>
                            ) : (
                                foods.map((food) => (
                                    <React.Fragment key={food.id}>
                                        <tr onClick={() => toggleRow(food.id)} className="hover:bg-zinc-800/30 transition-colors cursor-pointer group">
                                            <td className="px-6 py-4">
                                                {food.images && food.images.length > 0 ? (
                                                    <img src={food.images[0].image} alt="food" className="w-10 h-10 rounded-md object-cover border border-zinc-700" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-md bg-zinc-800 flex items-center justify-center border border-zinc-700">
                                                        <FiImage className="text-zinc-500" />
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-white font-medium">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 flex justify-center text-zinc-600 group-hover:text-zinc-400 transition-colors">
                                                        {expandedRow === food.id ? <FiChevronUp /> : <FiChevronDown />}
                                                    </div>
                                                    <div>
                                                        {food.name}
                                                        {food.brand && <span className="block text-xs text-zinc-500 font-normal">{food.brand}</span>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-zinc-400">{food.serving_size}</td>
                                            <td className="px-6 py-4 text-zinc-400">{food.calories} kcal</td>
                                            <td className="px-6 py-4 text-zinc-400">
                                                <span className="bg-zinc-800 px-2 py-1 rounded text-white">{food.votes}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {food.is_verified ? (
                                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-400 bg-green-400/10 px-2 py-1 rounded-full border border-green-400/20">
                                                        <FiCheckCircle /> Verified
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 bg-zinc-800 px-2 py-1 rounded-full border border-zinc-700">
                                                        Unverified
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                                                    <button onClick={() => toggleVerification(food.id)} className={`p-2 rounded-lg transition-colors ${food.is_verified ? 'text-green-400 hover:bg-green-400/10' : 'text-zinc-400 hover:bg-zinc-800'}`} title={food.is_verified ? "Unverify" : "Verify"}>
                                                        {food.is_verified ? <FiXCircle /> : <FiCheckCircle />}
                                                    </button>
                                                    <button onClick={() => openEditModal(food)} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors" title="Edit">
                                                        <FiEdit2 />
                                                    </button>
                                                    <button onClick={() => openDeleteModal(food)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Delete">
                                                        <FiTrash2 />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        
                                        {/* EXPANDABLE ROW CONTENT */}
                                        {expandedRow === food.id && (
                                            <tr className="bg-black/40 border-t border-zinc-800/50">
                                                <td colSpan="7" className="px-6 py-6 animate-in slide-in-from-top-2 fade-in duration-200">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pl-8 border-l-2 border-zinc-800 ml-4">
                                                        <div>
                                                            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Macronutrients</h4>
                                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                                <div className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800/50"><p className="text-zinc-500 text-[10px] uppercase mb-1">Protein</p><p className="text-white font-medium text-sm">{food.protein}g</p></div>
                                                                <div className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800/50"><p className="text-zinc-500 text-[10px] uppercase mb-1">Carbs</p><p className="text-white font-medium text-sm">{food.carbohydrates}g</p></div>
                                                                <div className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800/50"><p className="text-zinc-500 text-[10px] uppercase mb-1">Fat</p><p className="text-white font-medium text-sm">{food.fat}g</p></div>
                                                                <div className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800/50"><p className="text-zinc-500 text-[10px] uppercase mb-1">Fiber</p><p className="text-white font-medium text-sm">{food.fiber}g</p></div>
                                                                <div className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800/50"><p className="text-zinc-500 text-[10px] uppercase mb-1">Sugar</p><p className="text-white font-medium text-sm">{food.sugar}g</p></div>
                                                                <div className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800/50"><p className="text-zinc-500 text-[10px] uppercase mb-1">Sat Fat</p><p className="text-white font-medium text-sm">{food.saturated_fat}g</p></div>
                                                                <div className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800/50"><p className="text-zinc-500 text-[10px] uppercase mb-1">Sodium</p><p className="text-white font-medium text-sm">{food.sodium}mg</p></div>
                                                                <div className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800/50"><p className="text-zinc-500 text-[10px] uppercase mb-1">Cholest.</p><p className="text-white font-medium text-sm">{food.cholesterol}mg</p></div>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Photos</h4>
                                                            {food.images && food.images.length > 0 ? (
                                                                <div className="flex flex-wrap gap-3">
                                                                    {food.images.map(img => (
                                                                        <a key={img.id} href={img.image} target="_blank" rel="noopener noreferrer">
                                                                            <img src={img.image} alt="Food" className="w-16 h-16 rounded-lg object-cover border border-zinc-700 hover:opacity-80 transition-opacity" />
                                                                        </a>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center justify-center h-16 bg-zinc-900/50 border border-zinc-800/50 rounded-lg text-zinc-600 text-xs">
                                                                    No additional photos
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {!initialLoading && totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                    <p className="text-sm text-zinc-400">Page <span className="font-medium text-white">{currentPage}</span> of <span className="font-medium text-white">{totalPages}</span></p>
                    <div className="flex gap-2">
                        <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm">Previous</button>
                        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm">Next</button>
                    </div>
                </div>
            )}

            {/* ADD / EDIT MODAL */}
            {(isAddModalOpen || isEditModalOpen) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-2xl overflow-hidden animate-in slide-in-from-bottom-4 zoom-in-95 duration-300 my-8 shadow-2xl">
                        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-900/50">
                            <h2 className="text-lg font-semibold text-white">
                                {isAddModalOpen ? (addStep === 1 ? 'Add New Food' : 'Verification Step') : 'Edit Food Item'}
                            </h2>
                            <button onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
                                <FiX size={20} />
                            </button>
                        </div>
                        
                        {isAddModalOpen && addStep === 2 ? (
                            <div className="p-8 text-center">
                                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4 animate-in zoom-in duration-500 delay-100">
                                    <FiCheckCircle className="text-green-500" size={32} />
                                </div>
                                <h3 className="text-xl font-medium text-white mb-2">Food Added Successfully!</h3>
                                <p className="text-zinc-400 mb-6 text-sm">You can choose to verify this food item right now, marking it as trusted in the database.</p>
                                
                                <label className="flex items-center justify-center gap-3 cursor-pointer mb-8 hover:bg-zinc-800/50 p-3 rounded-lg transition-colors w-fit mx-auto">
                                    <input 
                                        type="checkbox" 
                                        className="w-5 h-5 accent-white cursor-pointer rounded bg-zinc-800 border-zinc-700"
                                        checked={verifyNewFood}
                                        onChange={(e) => setVerifyNewFood(e.target.checked)}
                                    />
                                    <span className="text-white font-medium">Verify this food item</span>
                                </label>

                                <button 
                                    onClick={handleFinishAdd} 
                                    disabled={isSaving}
                                    className="w-full max-w-xs mx-auto flex justify-center items-center px-4 py-3 text-sm font-medium text-black bg-white rounded-lg hover:bg-zinc-200 transition-colors shadow-lg"
                                >
                                    {isSaving ? <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></span> : 'Finish'}
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={isAddModalOpen ? handleAddSubmit : handleEditSubmit} className="p-5 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-1">Name</label>
                                    <input required type="text" name="name" value={formData.name || ''} onChange={handleFormChange} className="w-full bg-black border border-zinc-800 text-white rounded-lg px-4 py-2 focus:border-zinc-500 outline-none transition-colors" placeholder="e.g. Grilled Chicken Breast" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-400 mb-1">Serving Size</label>
                                        <input required type="text" name="serving_size" value="100g" disabled className="w-full bg-zinc-800/50 border border-zinc-800 text-zinc-500 rounded-lg px-4 py-2 cursor-not-allowed outline-none select-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-400 mb-1">Brand (Optional)</label>
                                        <input type="text" name="brand" value={formData.brand || ''} onChange={handleFormChange} className="w-full bg-black border border-zinc-800 text-white rounded-lg px-4 py-2 focus:border-zinc-500 outline-none transition-colors" />
                                    </div>
                                </div>

                                <div className="bg-black/40 p-4 rounded-xl border border-zinc-800/50 mt-4">
                                    <h3 className="text-sm font-medium text-white mb-3">Macronutrients (per 100g)</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        <div><label className="block text-xs text-zinc-400 mb-1">Calories (kcal)</label><input required type="number" name="calories" value={formData.calories || ''} onChange={handleFormChange} className="w-full bg-black border border-zinc-800 text-white rounded-lg px-3 py-1.5 outline-none focus:border-zinc-500 text-sm transition-colors" /></div>
                                        <div><label className="block text-xs text-zinc-400 mb-1">Protein (g)</label><input required type="number" step="0.01" name="protein" value={formData.protein || ''} onChange={handleFormChange} className="w-full bg-black border border-zinc-800 text-white rounded-lg px-3 py-1.5 outline-none focus:border-zinc-500 text-sm transition-colors" /></div>
                                        <div><label className="block text-xs text-zinc-400 mb-1">Carbs (g)</label><input required type="number" step="0.01" name="carbohydrates" value={formData.carbohydrates || ''} onChange={handleFormChange} className="w-full bg-black border border-zinc-800 text-white rounded-lg px-3 py-1.5 outline-none focus:border-zinc-500 text-sm transition-colors" /></div>
                                        <div><label className="block text-xs text-zinc-400 mb-1">Fat (g)</label><input required type="number" step="0.01" name="fat" value={formData.fat || ''} onChange={handleFormChange} className="w-full bg-black border border-zinc-800 text-white rounded-lg px-3 py-1.5 outline-none focus:border-zinc-500 text-sm transition-colors" /></div>
                                        <div><label className="block text-xs text-zinc-400 mb-1">Fiber (g)</label><input type="number" step="0.01" name="fiber" value={formData.fiber || 0} onChange={handleFormChange} className="w-full bg-black border border-zinc-800 text-white rounded-lg px-3 py-1.5 outline-none focus:border-zinc-500 text-sm transition-colors" /></div>
                                        <div><label className="block text-xs text-zinc-400 mb-1">Sugar (g)</label><input type="number" step="0.01" name="sugar" value={formData.sugar || 0} onChange={handleFormChange} className="w-full bg-black border border-zinc-800 text-white rounded-lg px-3 py-1.5 outline-none focus:border-zinc-500 text-sm transition-colors" /></div>
                                        <div><label className="block text-xs text-zinc-400 mb-1">Sat Fat (g)</label><input type="number" step="0.01" name="saturated_fat" value={formData.saturated_fat || 0} onChange={handleFormChange} className="w-full bg-black border border-zinc-800 text-white rounded-lg px-3 py-1.5 outline-none focus:border-zinc-500 text-sm transition-colors" /></div>
                                        <div><label className="block text-xs text-zinc-400 mb-1">Sodium (mg)</label><input type="number" step="0.01" name="sodium" value={formData.sodium || 0} onChange={handleFormChange} className="w-full bg-black border border-zinc-800 text-white rounded-lg px-3 py-1.5 outline-none focus:border-zinc-500 text-sm transition-colors" /></div>
                                    </div>
                                </div>

                                {/* Images Section */}
                                <div className="mt-4 pt-2">
                                    <label className="block text-sm font-medium text-zinc-400 mb-2">Photos</label>
                                    
                                    {isEditModalOpen && formData.images && formData.images.length > 0 && (
                                        <div className="mb-4 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">
                                            <p className="text-xs text-zinc-500 mb-2 font-medium">Existing Uploads</p>
                                            <div className="flex flex-wrap gap-3">
                                                {formData.images.map(img => (
                                                    <div key={img.id} className="relative group">
                                                        <img src={img.image} alt="Existing" className="w-16 h-16 object-cover rounded-lg border border-zinc-700" />
                                                        <button type="button" onClick={() => deleteExistingImage(img.id)} className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                                                            <FiX size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <input type="file" multiple accept="image/*" onChange={handleImageChange} className="w-full bg-black border border-zinc-800 text-zinc-400 rounded-lg px-4 py-2 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-zinc-800 file:text-white hover:file:bg-zinc-700 transition-colors" />
                                    {selectedImages.length > 0 && <p className="text-xs font-medium text-green-400 mt-2 flex items-center gap-1"><FiCheckCircle size={12}/> {selectedImages.length} new file(s) ready</p>}
                                </div>

                                <div className="pt-4 flex justify-end gap-3 border-t border-zinc-800 mt-6">
                                    <button type="button" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors">Cancel</button>
                                    <button type="submit" disabled={isSaving} className="flex justify-center items-center w-32 px-4 py-2 text-sm font-medium text-black bg-white rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-70 shadow-lg">
                                        {isSaving ? <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span> : (isAddModalOpen ? 'Log Food' : 'Save Changes')}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-sm overflow-hidden p-6 text-center animate-in zoom-in-95 duration-300 shadow-2xl">
                        <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                            <FiTrash2 className="text-red-500" size={28} />
                        </div>
                        <h2 className="text-lg font-semibold text-white mb-2">Delete Food Item?</h2>
                        <p className="text-sm text-zinc-400 mb-6">
                            Are you sure you want to delete <span className="text-white font-medium">"{selectedFood?.name}"</span>? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors shadow-sm">Cancel</button>
                            <button onClick={handleDelete} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminFoods;