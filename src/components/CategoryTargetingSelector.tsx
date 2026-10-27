import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  X, 
  Check, 
  Layers, 
  Plus, 
  Sparkles, 
  Users, 
  ChevronDown, 
  CheckCircle2,
  Target,
  BarChart3,
  Zap,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { 
  MASTER_PLATFORM_CATEGORIES, 
  PlatformCategory, 
  CATEGORY_GROUPS, 
  searchCategories,
  DEMOGRAPHIC_TARGETS,
  BEHAVIORAL_TARGETS,
  DetailedTargetingPillarItem
} from '../constants/categories';

interface CategoryTargetingSelectorProps {
  selectedCategoryIds: string[];
  onChange: (ids: string[]) => void;
  isRtl?: boolean;
}

type MetaPillarTab = 'interests' | 'demographics' | 'behaviors';

export const CategoryTargetingSelector: React.FC<CategoryTargetingSelectorProps> = ({
  selectedCategoryIds,
  onChange,
  isRtl = true
}) => {
  const [query, setQuery] = useState('');
  const [activePillar, setActivePillar] = useState<MetaPillarTab>('interests');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [interestSuggestions, setInterestSuggestions] = useState<PlatformCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close popover on click outside
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Fetch categories from API with debounce & local fallback
  useEffect(() => {
    let isCancelled = false;
    const fetchCats = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (query.trim()) params.append('q', query.trim());
        if (selectedGroup !== 'all') params.append('group', selectedGroup);
        params.append('limit', '50');

        const res = await fetch(`/api/bulletin/categories?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled && Array.isArray(data.categories)) {
            setInterestSuggestions(data.categories);
            setIsLoading(false);
            return;
          }
        }
      } catch {
        // Fallback silently
      }
      if (!isCancelled) {
        setInterestSuggestions(searchCategories(query, selectedGroup, 50));
        setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchCats, 120);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [query, selectedGroup]);

  // Handle toggle selection
  const handleToggle = (id: string) => {
    if (selectedCategoryIds.includes(id)) {
      onChange(selectedCategoryIds.filter(item => item !== id));
    } else {
      onChange([...selectedCategoryIds, id]);
    }
  };

  const handleRemove = (id: string) => {
    onChange(selectedCategoryIds.filter(item => item !== id));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  // Helper to map selected ID to human readable label
  const getItemLabel = (id: string): { title: string; category: string; pillar: MetaPillarTab } => {
    // 1. Check Interest categories
    const cat = MASTER_PLATFORM_CATEGORIES.find(c => c.id === id);
    if (cat) return { title: isRtl ? cat.nameAr : cat.nameEn, category: isRtl ? cat.groupAr : cat.groupEn, pillar: 'interests' };

    // 2. Check Demographics
    const demo = DEMOGRAPHIC_TARGETS.find(d => d.id === id);
    if (demo) return { title: isRtl ? demo.titleAr : demo.titleEn, category: isRtl ? demo.categoryAr : demo.categoryEn, pillar: 'demographics' };

    // 3. Check Behaviors
    const beh = BEHAVIORAL_TARGETS.find(b => b.id === id);
    if (beh) return { title: isRtl ? beh.titleAr : beh.titleEn, category: isRtl ? beh.categoryAr : beh.categoryEn, pillar: 'behaviors' };

    // Legacy fallback mapping
    if (id === 'ecommerce') return { title: isRtl ? 'المتاجر الإلكترونية والتسوق' : 'E-Commerce', category: isRtl ? 'التجارة والتجزئة' : 'Retail', pillar: 'interests' };
    if (id === 'tech') return { title: isRtl ? 'تطوير البرمجيات والتطبيقات' : 'Tech & Apps', category: isRtl ? 'التكنولوجيا' : 'Technology', pillar: 'interests' };
    if (id === 'services') return { title: isRtl ? 'التسويق الرقمي وإدارة الإعلانات' : 'Digital Marketing', category: isRtl ? 'الخدمات والأعمال' : 'Business', pillar: 'interests' };

    return {
      title: id.replace('custom_', ''),
      category: isRtl ? 'استهداف مخصص' : 'Custom Targeting',
      pillar: 'interests'
    };
  };

  // Filter Demographics & Behaviors based on search query
  const filteredDemographics = DEMOGRAPHIC_TARGETS.filter(d => {
    if (!query.trim()) return true;
    const q = query.toLowerCase().trim();
    return (
      d.titleAr.toLowerCase().includes(q) ||
      d.titleEn.toLowerCase().includes(q) ||
      d.categoryAr.toLowerCase().includes(q) ||
      d.keywords.some(k => k.toLowerCase().includes(q))
    );
  });

  const filteredBehaviors = BEHAVIORAL_TARGETS.filter(b => {
    if (!query.trim()) return true;
    const q = query.toLowerCase().trim();
    return (
      b.titleAr.toLowerCase().includes(q) ||
      b.titleEn.toLowerCase().includes(q) ||
      b.categoryAr.toLowerCase().includes(q) ||
      b.keywords.some(k => k.toLowerCase().includes(q))
    );
  });

  // Calculate estimated total target audience based on selected categories
  const totalAudienceEstimate = selectedCategoryIds.reduce((acc, id) => {
    const item = MASTER_PLATFORM_CATEGORIES.find(c => c.id === id) ||
                 DEMOGRAPHIC_TARGETS.find(d => d.id === id) ||
                 BEHAVIORAL_TARGETS.find(b => b.id === id);
    return acc + (item ? item.audienceReach : 150000);
  }, 0);

  const formattedAudience = totalAudienceEstimate > 1000000
    ? `${(totalAudienceEstimate / 1000000).toFixed(1)}M`
    : `${Math.round(totalAudienceEstimate / 1000)}K`;

  return (
    <div ref={containerRef} className="space-y-3 relative">
      {/* Header with Title and Reach Badge */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <label className="block text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
            <SlidersHorizontal size={14} className="text-purple-600 dark:text-purple-400" />
            <span>{isRtl ? 'الاستهداف التفصيلي والمحركات الفئات' : 'Detailed Targeting & Categories'}</span>
          </label>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
            {isRtl
              ? 'توجيه الإعلان بدقة عالية اعتماداً على الاهتمامات، البيانات الديموغرافية، وسلوكيات محرك الاستكشاف'
              : 'Target users precisely based on Interests, Demographics, and Discovery Engine Behaviors'}
          </p>
        </div>

        {selectedCategoryIds.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-shape-xs bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 flex items-center gap-1.5 shadow-2xs">
              <Users size={13} className="text-purple-600 dark:text-purple-400" />
              <span>{isRtl ? `جمهور تقديري: ~${formattedAudience}` : `Reach: ~${formattedAudience}`}</span>
            </span>
            <button
              type="button"
              onClick={handleClearAll}
              className="h-7 px-2.5 rounded-shape-xs text-[11px] font-semibold text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-theme inline-flex items-center cursor-pointer"
            >
              <span className="h-[23px] leading-[23px] inline-flex items-center">{isRtl ? 'تفريغ الكل' : 'Clear all'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Trigger Input Bar */}
      <div className="relative">
        <div 
          onClick={() => setIsPopoverOpen(true)}
          className="w-full min-h-[42px] px-3 py-1.5 rounded-shape-md bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] border border-[var(--border-main)] focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500/30 flex items-center justify-between cursor-pointer transition-theme"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Search size={15} className="text-purple-600 dark:text-purple-400 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (!isPopoverOpen) setIsPopoverOpen(true);
              }}
              onFocus={() => setIsPopoverOpen(true)}
              placeholder={
                isRtl
                  ? 'انقر لتصفح الفئات أو ابحث عن اهتمام، مهنة، سلوك شراء...'
                  : 'Click to browse or search interests, professions, buying behaviors...'
              }
              className="w-full bg-transparent text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-hidden font-medium"
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ms-2">
            {query && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setQuery('');
                }}
                className="w-6 h-6 rounded-shape-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-card)] flex items-center justify-center cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsPopoverOpen(!isPopoverOpen);
              }}
              className="h-7 px-2 rounded-shape-xs bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-[11px] font-bold flex items-center gap-1 cursor-pointer hover:bg-purple-500/20 transition-theme"
            >
              <span>{isRtl ? 'تصفح الفئات' : 'Browse'}</span>
              <ChevronDown size={13} className={`transition-transform duration-200 ${isPopoverOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Foreground Overlay Layer Popover Modal (z-[100] backdrop-blur-md) */}
        {isPopoverOpen && (
          <>
            {/* Dark Backdrop for 'Front Layer' feel */}
            <div 
              className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200"
              onClick={() => setIsPopoverOpen(false)}
            />
            
            <div className="absolute top-full start-0 end-0 mt-3 z-[100] rounded-shape-lg bg-[var(--surface-card)]/98 backdrop-blur-md border border-[var(--border-main)] shadow-2xl overflow-hidden flex flex-col ring-1 ring-black/10 dark:ring-white/10 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-150 max-h-[500px] w-full lg:min-w-[480px]">
              
              {/* Meta 3-Pillars Navigation Tab Header */}
              <div className="p-3 bg-[var(--surface-subtle)] border-b border-[var(--border-main)] grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setActivePillar('interests')}
                  className={`h-9 rounded-shape-sm text-xs font-bold transition-theme flex items-center justify-center gap-1.5 cursor-pointer border ${
                    activePillar === 'interests'
                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                      : 'bg-[var(--surface-card)] text-[var(--text-secondary)] border-[var(--border-main)] hover:border-purple-300'
                  }`}
                >
                  <Target size={14} />
                  <span className="truncate">{isRtl ? '🎯 الاهتمامات' : '🎯 Interests'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActivePillar('demographics')}
                  className={`h-9 rounded-shape-sm text-xs font-bold transition-theme flex items-center justify-center gap-1.5 cursor-pointer border ${
                    activePillar === 'demographics'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-[var(--surface-card)] text-[var(--text-secondary)] border-[var(--border-main)] hover:border-blue-300'
                  }`}
                >
                  <BarChart3 size={14} />
                  <span className="truncate">{isRtl ? '📊 الديموغرافيا' : '📊 Demographics'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActivePillar('behaviors')}
                  className={`h-9 rounded-shape-sm text-xs font-bold transition-theme flex items-center justify-center gap-1.5 cursor-pointer border ${
                    activePillar === 'behaviors'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                      : 'bg-[var(--surface-card)] text-[var(--text-secondary)] border-[var(--border-main)] hover:border-amber-300'
                  }`}
                >
                  <Zap size={14} />
                  <span className="truncate">{isRtl ? '⚡ السلوكيات' : '⚡ Behaviors'}</span>
                </button>
              </div>

              <div className="flex-1 overflow-hidden flex flex-col">
                {/* PILLAR 1: INTERESTS CONTENT */}
                {activePillar === 'interests' && (
                  <div className="flex flex-col flex-1 min-h-0">
                    {/* Sector Groups Quick Filters Bar */}
                    <div className="p-2 border-b border-[var(--border-main)]/60 bg-[var(--surface-card)] overflow-x-auto flex gap-1.5 scrollbar-none items-center sticky top-0 z-10">
                      <button
                        type="button"
                        onClick={() => setSelectedGroup('all')}
                        className={`h-7 px-3 rounded-shape-xs text-[11px] font-bold whitespace-nowrap transition-theme flex items-center cursor-pointer border ${
                          selectedGroup === 'all'
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-main)]'
                        }`}
                      >
                        <span>{isRtl ? 'كافة الاهتمامات' : 'All Interests'}</span>
                      </button>
                      {CATEGORY_GROUPS.map((g) => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => setSelectedGroup(g.id)}
                          className={`h-7 px-3 rounded-shape-xs text-[11px] font-bold whitespace-nowrap transition-theme flex items-center border cursor-pointer ${
                            selectedGroup === g.id
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'bg-[var(--surface-subtle)] text-[var(--text-secondary)] border-[var(--border-main)] hover:border-purple-300'
                          }`}
                        >
                          <span>{isRtl ? g.nameAr : g.nameEn}</span>
                        </button>
                      ))}
                    </div>

                    {/* Suggestions List */}
                    <div className="overflow-y-auto flex-1 p-2 space-y-1 custom-scrollbar">
                      {isLoading ? (
                        <div className="py-12 text-center text-xs text-[var(--text-muted)] flex flex-col items-center justify-center gap-3">
                          <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                          <span>{isRtl ? 'جاري استخراج اهتمامات مطابقة...' : 'Extracting matched interests...'}</span>
                        </div>
                      ) : interestSuggestions.length === 0 ? (
                        <div className="py-12 text-center space-y-3">
                          <p className="text-xs text-[var(--text-secondary)]">
                            {isRtl ? 'لم يتم العثور على اهتمامات مطابقة لحقل البحث' : 'No matching interests found'}
                          </p>
                          {query.trim() && (
                            <button
                              type="button"
                              onClick={() => {
                                const customId = `custom_${encodeURIComponent(query.trim().toLowerCase())}`;
                                handleToggle(customId);
                                setQuery('');
                              }}
                              className="h-9 px-4 rounded-shape-sm bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 cursor-pointer inline-flex items-center gap-2 shadow-sm"
                            >
                              <Plus size={14} />
                              <span>{isRtl ? `إضافة "${query.trim()}" كاهتمام مخصص` : `Add "${query.trim()}"`}</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        interestSuggestions.map((cat) => {
                          const isSelected = selectedCategoryIds.includes(cat.id);
                          const reachFormatted = cat.audienceReach > 1000000
                            ? `${(cat.audienceReach / 1000000).toFixed(1)}M`
                            : `${Math.round(cat.audienceReach / 1000)}K`;

                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => handleToggle(cat.id)}
                              className={`w-full p-2.5 rounded-shape-sm text-start flex items-center justify-between transition-theme border cursor-pointer ${
                                isSelected
                                  ? 'bg-purple-500/10 border-purple-500/40 text-purple-900 dark:text-purple-200'
                                  : 'bg-[var(--surface-card)] border-transparent hover:border-[var(--border-main)] hover:bg-[var(--surface-subtle)] text-[var(--text-primary)]'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div className={`w-8 h-8 rounded-shape-xs flex items-center justify-center shrink-0 ${
                                  isSelected ? 'bg-purple-600 text-white shadow-xs' : 'bg-[var(--surface-subtle)] text-purple-600 dark:text-purple-400 border border-[var(--border-main)]'
                                }`}>
                                  <Layers size={15} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-[13px] font-bold truncate flex items-center gap-2">
                                    <span>{isRtl ? cat.nameAr : cat.nameEn}</span>
                                    {cat.isFeatured && (
                                      <span className="text-[9px] px-1.5 py-0.2 rounded-shape-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20">
                                        {isRtl ? 'شائع' : 'Popular'}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1.5 mt-0.5">
                                    <span className="text-purple-600 dark:text-purple-400 font-semibold">{isRtl ? cat.groupAr : cat.groupEn}</span>
                                    <span>•</span>
                                    <span>{isRtl ? `الجمهور: ~${reachFormatted}` : `Reach: ~${reachFormatted}`}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="ms-2 shrink-0">
                                {isSelected ? (
                                  <span className="w-6 h-6 rounded-shape-xs bg-purple-600 text-white flex items-center justify-center shadow-xs">
                                    <Check size={14} />
                                  </span>
                                ) : (
                                  <span className="w-6 h-6 rounded-shape-xs border border-[var(--border-main)] flex items-center justify-center text-[var(--text-muted)] group-hover:border-purple-500 group-hover:text-purple-600 transition-theme bg-[var(--surface-card)]">
                                    <Plus size={14} />
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* PILLAR 2: DEMOGRAPHICS CONTENT */}
                {activePillar === 'demographics' && (
                  <div className="overflow-y-auto flex-1 p-2 space-y-1 custom-scrollbar">
                    <div className="p-2.5 rounded-shape-sm bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-[11px] font-bold flex items-center gap-2 mb-2">
                      <Info size={14} className="shrink-0" />
                      <span>{isRtl ? 'استهداف تقني حسب المهن، المستويات التعليمية، والحالة الاجتماعية' : 'Technical targeting by occupation, education, and social status'}</span>
                    </div>

                    {filteredDemographics.map((demo) => {
                      const isSelected = selectedCategoryIds.includes(demo.id);
                      const reachFormatted = demo.audienceReach > 1000000
                        ? `${(demo.audienceReach / 1000000).toFixed(1)}M`
                        : `${Math.round(demo.audienceReach / 1000)}K`;

                      return (
                        <button
                          key={demo.id}
                          type="button"
                          onClick={() => handleToggle(demo.id)}
                          className={`w-full p-2.5 rounded-shape-sm text-start flex items-center justify-between transition-theme border cursor-pointer ${
                            isSelected
                              ? 'bg-blue-500/10 border-blue-500/40 text-blue-900 dark:text-blue-200'
                              : 'bg-[var(--surface-card)] border-transparent hover:border-[var(--border-main)] hover:bg-[var(--surface-subtle)] text-[var(--text-primary)]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className={`w-8 h-8 rounded-shape-xs flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-blue-600 text-white shadow-xs' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                            }`}>
                              <BarChart3 size={15} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-[13px] font-bold truncate">
                                {isRtl ? demo.titleAr : demo.titleEn}
                              </div>
                              <p className="text-[10px] text-[var(--text-muted)] truncate mt-0.5">
                                {isRtl ? demo.descriptionAr : demo.descriptionEn}
                              </p>
                              <div className="text-[9.5px] text-blue-600 dark:text-blue-400 font-bold mt-1">
                                {isRtl ? demo.categoryAr : demo.categoryEn} • {isRtl ? `الجمهور: ~${reachFormatted}` : `Reach: ~${reachFormatted}`}
                              </div>
                            </div>
                          </div>

                          <div className="ms-2 shrink-0">
                            {isSelected ? (
                              <span className="w-6 h-6 rounded-shape-xs bg-blue-600 text-white flex items-center justify-center shadow-xs">
                                <Check size={14} />
                              </span>
                            ) : (
                              <span className="w-6 h-6 rounded-shape-xs border border-[var(--border-main)] flex items-center justify-center text-[var(--text-muted)] hover:border-blue-500 transition-theme bg-[var(--surface-card)]">
                                <Plus size={14} />
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* PILLAR 3: BEHAVIORS (DISCOVERY ENGINE) CONTENT */}
                {activePillar === 'behaviors' && (
                  <div className="overflow-y-auto flex-1 p-2 space-y-1 custom-scrollbar">
                    <div className="p-2.5 rounded-shape-sm bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] font-bold flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Zap size={14} className="shrink-0 text-amber-600" />
                        <span>{isRtl ? 'سلوكيات مستخرجة من محرك الاستكشاف والتوصيات' : 'Behaviors extracted from Discovery Recommendation Engine'}</span>
                      </div>
                      <span className="text-[9px] font-black px-2 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-500/20">
                        ENGINE V2
                      </span>
                    </div>

                    {filteredBehaviors.map((beh) => {
                      const isSelected = selectedCategoryIds.includes(beh.id);
                      const reachFormatted = beh.audienceReach > 1000000
                        ? `${(beh.audienceReach / 1000000).toFixed(1)}M`
                        : `${Math.round(beh.audienceReach / 1000)}K`;

                      return (
                        <button
                          key={beh.id}
                          type="button"
                          onClick={() => handleToggle(beh.id)}
                          className={`w-full p-2.5 rounded-shape-sm text-start flex items-center justify-between transition-theme border cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500/10 border-amber-500/40 text-amber-900 dark:text-amber-200'
                              : 'bg-[var(--surface-card)] border-transparent hover:border-[var(--border-main)] hover:bg-[var(--surface-subtle)] text-[var(--text-primary)]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className={`w-8 h-8 rounded-shape-xs flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-amber-600 text-white shadow-xs' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            }`}>
                              <Zap size={15} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-[13px] font-bold truncate flex items-center justify-between">
                                <span>{isRtl ? beh.titleAr : beh.titleEn}</span>
                                {beh.discoveryEngineScore && (
                                  <span className="text-[9px] font-mono font-black text-amber-600 dark:text-amber-400 px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/20 ms-2">
                                    {isRtl ? `مطابقة ${beh.discoveryEngineScore}%` : `${beh.discoveryEngineScore}% match`}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-[var(--text-muted)] truncate mt-0.5">
                                {isRtl ? beh.descriptionAr : beh.descriptionEn}
                              </p>
                              <div className="text-[9.5px] text-amber-600 dark:text-amber-400 font-bold mt-1">
                                {isRtl ? beh.categoryAr : beh.categoryEn} • {isRtl ? `الجمهور: ~${reachFormatted}` : `Reach: ~${reachFormatted}`}
                              </div>
                            </div>
                          </div>

                          <div className="ms-2 shrink-0">
                            {isSelected ? (
                              <span className="w-6 h-6 rounded-shape-xs bg-amber-600 text-white flex items-center justify-center shadow-xs">
                                <Check size={14} />
                              </span>
                            ) : (
                              <span className="w-6 h-6 rounded-shape-xs border border-[var(--border-main)] flex items-center justify-center text-[var(--text-muted)] hover:border-amber-500 transition-theme bg-[var(--surface-card)]">
                                <Plus size={14} />
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Popover Modal Footer Bar */}
              <div className="p-3 border-t border-[var(--border-main)] bg-[var(--surface-subtle)] flex items-center justify-between text-xs">
                <span className="text-[var(--text-secondary)] font-bold text-[11px]">
                  {isRtl ? `المحدد حالياً: ${selectedCategoryIds.length} فئة` : `${selectedCategoryIds.length} selected`}
                </span>
                <button
                  type="button"
                  onClick={() => setIsPopoverOpen(false)}
                  className="h-9 px-5 rounded-shape-sm bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 shadow-sm transition-theme flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <CheckCircle2 size={15} />
                  <span>{isRtl ? 'اعتماد وإغلاق' : 'Apply & Close'}</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Selected Items Badges List */}
      {selectedCategoryIds.length > 0 && (
        <div className="space-y-2">
          <div className="text-[11px] font-bold text-[var(--text-secondary)] flex items-center justify-between">
            <span>{isRtl ? 'شريحة الاستهداف النشطة للحملة:' : 'Active Targeting Parameters:'}</span>
            <span className="font-bold text-purple-600 dark:text-purple-400 font-mono text-xs">
              ({selectedCategoryIds.length})
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 p-2.5 rounded-shape-md bg-[var(--surface-subtle)] border border-[var(--border-main)] max-h-40 overflow-y-auto custom-scrollbar">
            {selectedCategoryIds.map((id) => {
              const meta = getItemLabel(id);
              const isInterests = meta.pillar === 'interests';
              const isDemo = meta.pillar === 'demographics';

              return (
                <span
                  key={id}
                  className={`h-8 px-2.5 rounded-shape-xs text-[11px] font-bold border shadow-2xs inline-flex items-center gap-1.5 transition-theme animate-in fade-in zoom-in-95 duration-100 ${
                    isInterests
                      ? 'bg-purple-500/10 border-purple-500/30 text-purple-800 dark:text-purple-200'
                      : isDemo
                      ? 'bg-blue-500/10 border-blue-500/30 text-blue-800 dark:text-blue-200'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-200'
                  }`}
                >
                  {isInterests ? <Target size={12} /> : isDemo ? <BarChart3 size={12} /> : <Zap size={12} />}
                  <span>{meta.title}</span>
                  <span className="text-[9px] opacity-75 font-normal px-1.5 py-0.2 rounded bg-black/5 dark:bg-white/10">
                    {meta.category}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemove(id)}
                    className="w-4.5 h-4.5 rounded-full hover:bg-red-500/20 hover:text-red-600 flex items-center justify-center cursor-pointer ms-0.5 transition-colors"
                    title={isRtl ? 'إزالة' : 'Remove'}
                  >
                    <X size={11} />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Featured Suggestions Bar */}
      {selectedCategoryIds.length < 5 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-secondary)]">
            <Sparkles size={12} className="text-amber-500" />
            <span>{isRtl ? 'سلوكيات واهتمامات شائعة لتعزيز استهدافك بنقرة واحدة:' : 'Popular quick targeting criteria:'}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {BEHAVIORAL_TARGETS.slice(0, 3).concat(DEMOGRAPHIC_TARGETS.slice(0, 2)).map((item) => {
              if (selectedCategoryIds.includes(item.id)) return null;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleToggle(item.id)}
                  className="h-7 px-2 text-[11px] font-bold rounded-shape-xs bg-[var(--surface-card)] border border-[var(--border-main)] hover:border-purple-500 text-[var(--text-secondary)] hover:text-purple-600 transition-theme inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  <Plus size={11} className="text-purple-500" />
                  <span>{isRtl ? item.titleAr : item.titleEn}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
