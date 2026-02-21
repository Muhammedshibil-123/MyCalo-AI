import React, { useState, useEffect } from 'react';
import { FiSearch, FiEdit2, FiTrash2, FiCheckCircle, FiXCircle, FiX, FiFilter, FiPlus, FiActivity } from 'react-icons/fi';
import api from '../../lib/axios';

const AdminExercises = () => {
    const [exercises, setExercises] = useState([]);
    
    // Loading States
    const [initialLoading, setInitialLoading] = useState(true);
    const [isFetching, setIsFetching] = useState(false);
    
    // Filters & Pagination
    const [searchInput, setSearchInput] = useState('');
    const [activeSearch, setActiveSearch] = useState('');
    const [sortOrder, setSortOrder] = useState('-id');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Modal States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addStep, setAddStep] = useState(1); 
    const [newExerciseId, setNewExerciseId] = useState(null);
    const [verifyNewExercise, setVerifyNewExercise] = useState(false);
    
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedExercise, setSelectedExercise] = useState(null);
    
    const [formData, setFormData] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    // --- LIVE SEARCH (DEBOUNCED) ---
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (activeSearch !== searchInput) {
                setActiveSearch(searchInput);
                setCurrentPage(1);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchInput, activeSearch]);

    useEffect(() => {
        fetchExercises('initial');
    }, []); 

    useEffect(() => {
        if (!initialLoading) {
            fetchExercises('fetching');
        }
    }, [currentPage, activeSearch, sortOrder]); 

    const fetchExercises = async (mode = 'fetching') => {
        if (mode === 'initial') setInitialLoading(true);
        if (mode === 'fetching') setIsFetching(true);
        
        try {
            const res = await api.get(`/api/exercises/admin/manage/?page=${currentPage}&search=${activeSearch}&sort=${sortOrder}`, { skipLoading: true });
            setExercises(res.data.results);
            setTotalPages(Math.ceil(res.data.count / 10));
        } catch (error) {
            console.error('Error fetching exercises:', error);
        } finally {
            if (mode === 'initial') setInitialLoading(false);
            if (mode === 'fetching') setIsFetching(false);
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setActiveSearch(searchInput);
        setCurrentPage(1);
    };

    // --- OPTIMISTIC UI: Toggle Verification ---
    const toggleVerification = async (id) => {
        setExercises(prev => prev.map(ex => ex.id === id ? { ...ex, is_verified: !ex.is_verified } : ex));
        try {
            await api.patch(`/api/exercises/admin/manage/${id}/verify/`, {}, { skipLoading: true });
        } catch (error) {
            console.error('Error verifying exercise:', error);
            setExercises(prev => prev.map(ex => ex.id === id ? { ...ex, is_verified: !ex.is_verified } : ex));
        }
    };

    // --- ADD Logic ---
    const openAddModal = () => {
        setFormData({}); 
        setAddStep(1);
        setNewExerciseId(null);
        setVerifyNewExercise(false);
        setIsAddModalOpen(true);
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const res = await api.post('/api/exercises/admin/manage/', formData, { skipLoading: true });
            setNewExerciseId(res.data.id);
            setAddStep(2); 
        } catch (error) {
            console.error('Error adding exercise:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleFinishAdd = async () => {
        setIsSaving(true);
        if (verifyNewExercise && newExerciseId) {
            try { await api.patch(`/api/exercises/admin/manage/${newExerciseId}/verify/`, {}, { skipLoading: true }); } 
            catch (error) { console.error("Failed to verify:", error); }
        }
        setIsSaving(false);
        setIsAddModalOpen(false);
        fetchExercises('silent'); 
    };

    // --- EDIT Logic ---
    const openEditModal = (exercise) => {
        setSelectedExercise(exercise);
        setFormData(exercise); 
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const res = await api.put(`/api/exercises/admin/manage/${selectedExercise.id}/`, formData, { skipLoading: true });
            setExercises(prev => prev.map(ex => ex.id === selectedExercise.id ? res.data : ex));
            setIsEditModalOpen(false);
        } catch (error) {
            console.error('Error updating exercise:', error);
        } finally {
            setIsSaving(false);
        }
    };

    // --- DELETE Logic ---
    const openDeleteModal = (exercise) => {
        setSelectedExercise(exercise);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        const idToDelete = selectedExercise.id;
        setIsDeleteModalOpen(false);
        
        setExercises(prev => prev.filter(ex => ex.id !== idToDelete));
        
        try {
            await api.delete(`/api/exercises/admin/manage/${idToDelete}/`, { skipLoading: true });
            fetchExercises('silent'); 
        } catch (error) {
            console.error('Error deleting exercise:', error);
            fetchExercises('silent'); 
        }
    };

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const SkeletonRow = () => (
        <tr className="animate-pulse bg-zinc-800/20">
            <td className="px-6 py-4"><div className="h-10 w-10 bg-zinc-800 rounded-md"></div></td>
            <td className="px-6 py-4"><div className="h-4 w-32 bg-zinc-800 rounded"></div></td>
            <td className="px-6 py-4"><div className="h-4 w-16 bg-zinc-800 rounded"></div></td>
            <td className="px-6 py-4"><div className="h-6 w-20 bg-zinc-800 rounded-full"></div></td>
            <td className="px-6 py-4 text-right"><div className="h-8 w-24 bg-zinc-800 rounded ml-auto"></div></td>
        </tr>
    );

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-white">Exercise Database</h1>
                    <p className="mt-1 text-sm text-zinc-400">Manage, verify, and edit activities.</p>
                </div>
                <button onClick={openAddModal} className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg font-medium text-sm hover:bg-zinc-200 transition-colors shadow-lg">
                    <FiPlus /> Add Exercise
                </button>
            </div>

            {/* Top Bar: Search and Sort */}
            <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-center">
                <form onSubmit={handleSearchSubmit} className="w-full md:w-1/2 relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search exercises by name..."
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
                        <option value="-id" className="bg-zinc-900">Newest Added</option>
                        <option value="-met_value" className="bg-zinc-900">MET: High to Low</option>
                        <option value="met_value" className="bg-zinc-900">MET: Low to High</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden min-h-[500px]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-900/50 border-b border-zinc-800 text-zinc-400">
                            <tr>
                                <th className="px-6 py-4 font-medium w-16">Icon</th>
                                <th className="px-6 py-4 font-medium">Activity Name</th>
                                <th className="px-6 py-4 font-medium">MET Value</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        
                        <tbody className={`divide-y divide-zinc-800 transition-opacity duration-300 ${isFetching ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                            {initialLoading ? (
                                <> <SkeletonRow /><SkeletonRow /><SkeletonRow /><SkeletonRow /><SkeletonRow /> </>
                            ) : exercises.length === 0 ? (
                                <tr><td colSpan="5" className="px-6 py-12 text-center text-zinc-500">No exercises found.</td></tr>
                            ) : (
                                exercises.map((exercise) => (
                                    <tr key={exercise.id} className="hover:bg-zinc-800/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="w-10 h-10 rounded-md bg-zinc-800 flex items-center justify-center border border-zinc-700">
                                                <FiActivity className="text-zinc-500" />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-white font-medium">
                                            {exercise.name}
                                        </td>
                                        <td className="px-6 py-4 text-zinc-400">
                                            <span className="bg-zinc-800 px-2 py-1 rounded text-white">{exercise.met_value}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {exercise.is_verified ? (
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
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => toggleVerification(exercise.id)} className={`p-2 rounded-lg transition-colors ${exercise.is_verified ? 'text-green-400 hover:bg-green-400/10' : 'text-zinc-400 hover:bg-zinc-800'}`} title={exercise.is_verified ? "Unverify" : "Verify"}>
                                                    {exercise.is_verified ? <FiXCircle /> : <FiCheckCircle />}
                                                </button>
                                                <button onClick={() => openEditModal(exercise)} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors" title="Edit">
                                                    <FiEdit2 />
                                                </button>
                                                <button onClick={() => openDeleteModal(exercise)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Delete">
                                                    <FiTrash2 />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
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
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-4 zoom-in-95 duration-300 shadow-2xl">
                        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-900/50">
                            <h2 className="text-lg font-semibold text-white">
                                {isAddModalOpen ? (addStep === 1 ? 'Add New Exercise' : 'Verification Step') : 'Edit Exercise'}
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
                                <h3 className="text-xl font-medium text-white mb-2">Exercise Added Successfully!</h3>
                                <p className="text-zinc-400 mb-6 text-sm">You can choose to verify this activity right now, marking it as trusted in the database.</p>
                                
                                <label className="flex items-center justify-center gap-3 cursor-pointer mb-8 hover:bg-zinc-800/50 p-3 rounded-lg transition-colors w-fit mx-auto">
                                    <input 
                                        type="checkbox" 
                                        className="w-5 h-5 accent-white cursor-pointer rounded bg-zinc-800 border-zinc-700"
                                        checked={verifyNewExercise}
                                        onChange={(e) => setVerifyNewExercise(e.target.checked)}
                                    />
                                    <span className="text-white font-medium">Verify this exercise</span>
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
                                    <label className="block text-sm font-medium text-zinc-400 mb-1">Activity Name</label>
                                    <input required type="text" name="name" value={formData.name || ''} onChange={handleFormChange} className="w-full bg-black border border-zinc-800 text-white rounded-lg px-4 py-2 focus:border-zinc-500 outline-none transition-colors" placeholder="e.g. Running, 5mph" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-1">MET Value</label>
                                    <input required type="number" step="0.1" name="met_value" value={formData.met_value || ''} onChange={handleFormChange} className="w-full bg-black border border-zinc-800 text-white rounded-lg px-4 py-2 focus:border-zinc-500 outline-none transition-colors" placeholder="e.g. 8.0" />
                                    <p className="text-xs text-zinc-500 mt-1">Metabolic Equivalent of Task (energy expenditure)</p>
                                </div>

                                <div className="pt-4 flex justify-end gap-3 border-t border-zinc-800 mt-6">
                                    <button type="button" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors">Cancel</button>
                                    <button type="submit" disabled={isSaving} className="flex justify-center items-center w-32 px-4 py-2 text-sm font-medium text-black bg-white rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-70 shadow-lg">
                                        {isSaving ? <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span> : (isAddModalOpen ? 'Save Activity' : 'Save Changes')}
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
                        <h2 className="text-lg font-semibold text-white mb-2">Delete Activity?</h2>
                        <p className="text-sm text-zinc-400 mb-6">
                            Are you sure you want to delete <span className="text-white font-medium">"{selectedExercise?.name}"</span>? This action cannot be undone.
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

export default AdminExercises;