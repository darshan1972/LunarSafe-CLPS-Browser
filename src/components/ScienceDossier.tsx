import React, { useState, useMemo } from 'react';
import {
  SCIENTIFIC_DOSSIER_DATA,
  PEER_REVIEWED_PAPERS_DATA,
  DossierSection,
  PeerReviewedPaper,
} from '../data/scientificKnowledgeData';
import {
  BookOpen,
  Search,
  CheckCircle2,
  ExternalLink,
  ArrowRight,
  Clock,
  FileText,
  Sparkles,
  ChevronRight,
  Satellite,
  Globe,
  Award,
  GraduationCap,
  Shield,
  Layers,
} from 'lucide-react';

interface ScienceDossierProps {
  onBackToAnalyzer?: () => void;
  onOpenSpaceGallery?: () => void;
}

export const ScienceDossier: React.FC<ScienceDossierProps> = ({
  onBackToAnalyzer,
  onOpenSpaceGallery,
}) => {
  const [activeTab, setActiveTab] = useState<'CHAPTERS' | 'RESEARCH_PAPERS'>('RESEARCH_PAPERS');
  const [selectedSectionId, setSelectedSectionId] = useState<string>(
    SCIENTIFIC_DOSSIER_DATA[0].id
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedPaperAgency, setSelectedPaperAgency] = useState<'ALL' | 'ISRO' | 'NASA' | 'JOINT'>('ALL');

  // Filter sections by search and category
  const filteredSections = useMemo(() => {
    return SCIENTIFIC_DOSSIER_DATA.filter((sec) => {
      if (selectedCategory !== 'ALL' && sec.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = sec.title.toLowerCase().includes(q);
        const inSummary = sec.summary.toLowerCase().includes(q);
        const inTakeaways = sec.keyTakeaways.some((k) => k.toLowerCase().includes(q));
        const inContent = sec.content.subsections.some(
          (sub) =>
            sub.heading.toLowerCase().includes(q) ||
            sub.body.toLowerCase().includes(q)
        );
        if (!inTitle && !inSummary && !inTakeaways && !inContent) {
          return false;
        }
      }
      return true;
    });
  }, [searchQuery, selectedCategory]);

  // Filter research papers by search and agency
  const filteredPapers: PeerReviewedPaper[] = useMemo(() => {
    return PEER_REVIEWED_PAPERS_DATA.filter((p) => {
      if (selectedPaperAgency === 'ISRO' && p.agency !== 'ISRO') return false;
      if (selectedPaperAgency === 'NASA' && p.agency !== 'NASA') return false;
      if (selectedPaperAgency === 'JOINT' && p.agency !== 'JOINT_ISRO_NASA') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = p.title.toLowerCase().includes(q);
        const inJournal = p.journalOrVenue.toLowerCase().includes(q);
        const inExplanation = p.plainEnglishExplanation.toLowerCase().includes(q);
        const inAuthors = p.leadScientists.some(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.roleAndAffiliation.toLowerCase().includes(q)
        );
        const inRelation =
          p.relationToLunarSafe.description.toLowerCase().includes(q) ||
          p.relationToLunarSafe.pipelineStage.toLowerCase().includes(q);

        if (!inTitle && !inJournal && !inExplanation && !inAuthors && !inRelation) {
          return false;
        }
      }
      return true;
    });
  }, [searchQuery, selectedPaperAgency]);

  const activeSection: DossierSection = useMemo(() => {
    const found = SCIENTIFIC_DOSSIER_DATA.find((s) => s.id === selectedSectionId);
    return found || filteredSections[0] || SCIENTIFIC_DOSSIER_DATA[0];
  }, [selectedSectionId, filteredSections]);

  const currentSectionIndex = useMemo(() => {
    return SCIENTIFIC_DOSSIER_DATA.findIndex((s) => s.id === activeSection.id);
  }, [activeSection]);

  const nextSection = useMemo(() => {
    if (currentSectionIndex < SCIENTIFIC_DOSSIER_DATA.length - 1) {
      return SCIENTIFIC_DOSSIER_DATA[currentSectionIndex + 1];
    }
    return null;
  }, [currentSectionIndex]);

  const getCategoryColor = (_cat: string) => {
    return 'text-zinc-300 bg-zinc-900 border-zinc-750';
  };

  const getCalloutStyles = (_type: string) => {
    return 'bg-zinc-900/70 border-zinc-750 text-zinc-200';
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-zinc-900 text-zinc-300 border border-zinc-700 flex items-center space-x-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>SCIENTIFIC KNOWLEDGE REPOSITORY</span>
              </span>
              <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-zinc-900 text-white border border-zinc-700 flex items-center space-x-1">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>9 PEER-REVIEWED PAPERS</span>
              </span>
              <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-black text-zinc-300 border border-zinc-800">
                5 ENGINEERING CHAPTERS
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight mt-2 font-mono">
              PLANETARY SCIENCE & MISSION ENGINEERING DOSSIER
            </h1>
            <p className="text-sm text-zinc-400 max-w-3xl mt-1">
              Authoritative technical reference manual documenting peer-reviewed research papers by NASA planetary scientists,
              sensor instrumentation physics, classical computer vision mathematics, and lunar regolith geotechnics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center shrink-0">
            {onOpenSpaceGallery && (
              <button
                type="button"
                onClick={onOpenSpaceGallery}
                className="px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-mono font-medium transition-colors flex items-center space-x-1.5"
              >
                <span>Space Gallery</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            {onBackToAnalyzer && (
              <button
                type="button"
                onClick={onBackToAnalyzer}
                className="px-4 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black border border-white font-mono text-xs font-bold transition-all flex items-center space-x-2 shadow-sm"
              >
                <span>Return to Hazard Analyzer</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* View Switcher: Research Papers vs Engineering Chapters */}
        <div className="mt-5 pt-3 border-t border-zinc-800 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('RESEARCH_PAPERS')}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all flex items-center space-x-2 ${
              activeTab === 'RESEARCH_PAPERS'
                ? 'bg-white text-black shadow-md'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>PEER-REVIEWED RESEARCH PAPERS ({PEER_REVIEWED_PAPERS_DATA.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('CHAPTERS')}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all flex items-center space-x-2 ${
              activeTab === 'CHAPTERS'
                ? 'bg-white text-black shadow-md'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>ENGINEERING CHAPTERS & FORMULAS ({SCIENTIFIC_DOSSIER_DATA.length})</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: PEER-REVIEWED RESEARCH PAPERS COMPENDIUM */}
      {/* ========================================================================= */}
      {activeTab === 'RESEARCH_PAPERS' && (
        <div className="space-y-5">
          {/* Research Paper Search and Agency Filter */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 min-w-[280px]">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search papers by scientist (e.g. Veeramuthuvel, Somanath, Amitabh, Robinson, Pieters), journal, or topic..."
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-black border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white font-mono"
              />
            </div>

            {/* Agency Tabs */}
            <div className="flex items-center rounded-lg bg-black border border-zinc-800 p-1 text-xs font-mono">
              <button
                type="button"
                onClick={() => setSelectedPaperAgency('ALL')}
                className={`px-3 py-1.5 rounded transition-all font-semibold ${
                  selectedPaperAgency === 'ALL'
                    ? 'bg-white text-black font-bold shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                ALL PAPERS
              </button>
              <button
                type="button"
                onClick={() => setSelectedPaperAgency('ISRO')}
                className={`px-3 py-1.5 rounded transition-all font-semibold flex items-center space-x-1.5 ${
                  selectedPaperAgency === 'ISRO'
                    ? 'bg-white text-black font-bold shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Satellite className="w-3.5 h-3.5" />
                <span>LOLA / LRO PAPERS</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedPaperAgency('NASA')}
                className={`px-3 py-1.5 rounded transition-all font-semibold flex items-center space-x-1.5 ${
                  selectedPaperAgency === 'NASA'
                    ? 'bg-white text-black font-bold shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>NASA PAPERS</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedPaperAgency('JOINT')}
                className={`px-3 py-1.5 rounded transition-all font-semibold ${
                  selectedPaperAgency === 'JOINT'
                    ? 'bg-white text-black font-bold shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                JOINT
              </button>
            </div>

            <div className="text-xs font-mono text-zinc-400">
              Showing <span className="text-white font-bold">{filteredPapers.length}</span> of{' '}
              <span className="text-white">{PEER_REVIEWED_PAPERS_DATA.length}</span> Landmark Papers
            </div>
          </div>

          {/* Research Paper Cards */}
          <div className="space-y-6">
            {filteredPapers.map((paper, idx) => {
              const isIsro = paper.agency === 'ISRO';
              const isNasa = paper.agency === 'NASA';

              return (
                <div
                  key={paper.id}
                  className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-6 lg:p-7 shadow-xl space-y-5 transition-all"
                >
                  {/* Card Header */}
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-800 pb-4">
                    <div className="space-y-1.5 max-w-3xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold tracking-wider uppercase border border-zinc-700 bg-zinc-900 text-white flex items-center space-x-1">
                          {isIsro && <Satellite className="w-3 h-3 text-white" />}
                          {isNasa && <Globe className="w-3 h-3 text-white" />}
                          <span>{paper.agency.replace('_', ' ')} SCIENTIFIC PAPER</span>
                        </span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-black text-zinc-300 border border-zinc-800">
                          {paper.publicationYear}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-black text-white border border-zinc-800">
                          {paper.journalOrVenue}
                        </span>
                      </div>

                      <h2 className="text-lg lg:text-xl font-bold text-white font-mono leading-snug">
                        {idx + 1}. {paper.title}
                      </h2>
                    </div>

                    <a
                      href={paper.doiOrUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black border border-white text-xs font-mono font-bold transition-all flex items-center space-x-1.5 shrink-0 shadow-sm"
                    >
                      <span>Read Publication / DOI</span>
                      <ExternalLink className="w-3.5 h-3.5 text-black" />
                    </a>
                  </div>

                  {/* Scientist Authorship & Ownership Panel */}
                  <div className="p-4 rounded-xl bg-black border border-zinc-800 space-y-2.5">
                    <div className="flex items-center space-x-2 text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                      <GraduationCap className="w-4 h-4 text-white" />
                      <span>Primary Scientists & Institutional Ownership</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                      {paper.leadScientists.map((scientist, si) => (
                        <div
                          key={si}
                          className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1 font-mono text-xs"
                        >
                          <div className="font-bold text-white flex items-center space-x-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                            <span>{scientist.name}</span>
                          </div>
                          <div className="text-zinc-400 text-[11px] leading-tight">
                            {scientist.roleAndAffiliation}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Direct Relation to LunarSafe Engineering */}
                  <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs font-mono font-bold text-white uppercase tracking-wider">
                        <Shield className="w-4 h-4 text-white" />
                        <span>Direct Relation to LunarSafe Engineering</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-800 text-white border border-zinc-600">
                        {paper.relationToLunarSafe.pipelineStage}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-200 font-sans leading-relaxed">
                      {paper.relationToLunarSafe.description}
                    </p>

                    <div className="p-2.5 rounded bg-black border border-zinc-800 font-mono text-xs text-zinc-300">
                      <strong className="text-white">Technical Implementation Mapping:</strong>{' '}
                      {paper.relationToLunarSafe.technicalMapping}
                    </div>
                  </div>

                  {/* Plain English Explanation */}
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center space-x-2">
                      <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
                      <span>In Simple Words: What This Research Proved</span>
                    </h4>
                    <p className="text-xs lg:text-sm text-zinc-200 font-sans leading-relaxed bg-black/60 p-4 rounded-xl border border-zinc-800">
                      {paper.plainEnglishExplanation}
                    </p>
                  </div>

                  {/* Key Scientific Findings Checklist */}
                  <div className="space-y-2 pt-1">
                    <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                      Quantifiable Scientific Findings & Metrics
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs font-mono">
                      {paper.keyScientificFindings.map((finding, fi) => (
                        <div
                          key={fi}
                          className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 flex items-start space-x-2 text-zinc-200"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0 mt-0.5" />
                          <span className="leading-snug">{finding}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Formal Citation String */}
                  <div className="pt-2 border-t border-zinc-800 text-[11px] font-mono text-zinc-400 flex items-center justify-between">
                    <span className="truncate pr-4">
                      <strong>Citation:</strong> {paper.citationString}
                    </span>
                    <span className="text-zinc-500 shrink-0">Official Verified Record</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: CHAPTERS & MATHEMATICS */}
      {/* ========================================================================= */}
      {activeTab === 'CHAPTERS' && (
        <div className="space-y-5">
          {/* Chapter Filter Toolbar */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 min-w-[280px]">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chapters by topic, formula, or term..."
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-black border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white font-mono"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
              {['ALL', 'MISSION_STANDARDS', 'INSTRUMENTATION', 'ALGORITHMS_MATH', 'GEOTECHNICAL', 'LEGAL_COMPLIANCE'].map(
                (cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded transition-all font-semibold ${
                      selectedCategory === cat
                        ? 'bg-white text-black font-bold shadow'
                        : 'bg-black text-zinc-400 hover:text-white border border-zinc-800'
                    }`}
                  >
                    {cat.replace('_', ' ')}
                  </button>
                )
              )}
            </div>
          </div>

          {/* 2-Column Layout: Chapter Selector + Reader Pane */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Sidebar */}
            <div className="lg:col-span-4 space-y-3">
              <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider px-1">
                Table of Contents ({filteredSections.length} Chapters)
              </div>

              <div className="space-y-2.5">
                {filteredSections.map((sec, idx) => {
                  const isSelected = sec.id === activeSection.id;
                  return (
                    <div
                      key={sec.id}
                      onClick={() => setSelectedSectionId(sec.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2.5 ${
                        isSelected
                          ? 'bg-zinc-900 border-zinc-500 shadow-md'
                          : 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase border ${getCategoryColor(
                            sec.category
                          )}`}
                        >
                          {sec.category.replace('_', ' ')}
                        </span>
                        <span className="flex items-center space-x-1 text-[11px] font-mono text-zinc-400">
                          <Clock className="w-3 h-3" />
                          <span>{sec.readingTimeMinutes} min</span>
                        </span>
                      </div>

                      <h3
                        className={`text-sm font-bold font-mono leading-snug transition-colors ${
                          isSelected ? 'text-white' : 'text-zinc-300'
                        }`}
                      >
                        {idx + 1}. {sec.title}
                      </h3>

                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                        {sec.summary}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reader Pane */}
            <div className="lg:col-span-8 bg-zinc-950 border border-zinc-800 rounded-xl p-6 lg:p-8 space-y-6 shadow-xl">
              <div className="space-y-3 border-b border-zinc-800 pb-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold tracking-wider uppercase border ${getCategoryColor(
                      activeSection.category
                    )}`}
                  >
                    {activeSection.category.replace('_', ' ')}
                  </span>
                  <div className="flex items-center space-x-2 text-xs font-mono text-zinc-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Estimated Reading Time: {activeSection.readingTimeMinutes} Minutes</span>
                  </div>
                </div>

                <h2 className="text-xl lg:text-2xl font-bold text-white font-mono leading-tight">
                  {activeSection.title}
                </h2>

                <p className="text-sm text-zinc-300 font-sans leading-relaxed">
                  {activeSection.content.overview}
                </p>
              </div>

              {/* Key Takeaways */}
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2.5">
                <div className="flex items-center space-x-2 text-xs font-mono font-bold text-white uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>Core Scientific & Operational Takeaways</span>
                </div>
                <ul className="space-y-1.5 pl-1">
                  {activeSection.keyTakeaways.map((takeaway, i) => (
                    <li key={i} className="flex items-start space-x-2 text-xs text-zinc-200 leading-relaxed">
                      <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0 mt-0.5" />
                      <span>{takeaway}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Subsections */}
              <div className="space-y-6 pt-2">
                {activeSection.content.subsections.map((sub, idx) => (
                  <div key={idx} className="space-y-3">
                    <h3 className="text-base font-bold text-white font-mono flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-white" />
                      <span>{sub.heading}</span>
                    </h3>

                    <p className="text-xs lg:text-sm text-zinc-200 font-sans leading-relaxed whitespace-pre-line">
                      {sub.body}
                    </p>

                    {sub.formula && (
                      <div className="p-3.5 rounded-lg bg-black border border-zinc-800 font-mono text-xs text-white overflow-x-auto shadow-inner">
                        <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
                          Mathematical Formulation:
                        </div>
                        <div className="font-semibold text-sm lg:text-base py-1 text-center font-mono">
                          {sub.formula}
                        </div>
                      </div>
                    )}

                    {sub.tableData && (
                      <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-black">
                        <table className="w-full text-left text-xs font-mono">
                          <thead className="bg-zinc-900 text-zinc-300 border-b border-zinc-800">
                            <tr>
                              {sub.tableData.headers.map((h, hi) => (
                                <th key={hi} className="p-2.5 font-bold uppercase tracking-wider">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-850 text-zinc-200">
                            {sub.tableData.rows.map((row, ri) => (
                              <tr key={ri} className="hover:bg-zinc-900/40 transition-colors">
                                {row.map((cell, ci) => (
                                  <td key={ci} className="p-2.5">
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {sub.callout && (
                      <div
                        className={`p-3.5 rounded-lg border text-xs font-mono leading-relaxed ${getCalloutStyles(
                          sub.callout.type
                        )}`}
                      >
                        <div className="font-bold uppercase tracking-wider text-[11px] mb-1 text-white">
                          [{sub.callout.type.replace('_', ' ')}]
                        </div>
                        <div>{sub.callout.text}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Citations */}
              <div className="pt-6 border-t border-zinc-800 space-y-3">
                <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-zinc-400" />
                  <span>Official Literature & Mission Citations</span>
                </h4>

                <div className="space-y-2">
                  {activeSection.references.map((ref, ri) => (
                    <div
                      key={ri}
                      className="p-3 rounded-lg bg-black border border-zinc-800 flex items-start justify-between gap-3 text-xs font-mono"
                    >
                      <div className="space-y-1">
                        <div className="font-semibold text-zinc-200">{ref.title}</div>
                        <div className="text-zinc-400 text-[11px]">{ref.citation}</div>
                      </div>

                      {ref.url && (
                        <a
                          href={ref.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 text-[11px] flex items-center space-x-1 shrink-0 transition-colors"
                        >
                          <span>Open</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {nextSection && (
                <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
                  <span className="text-xs font-mono text-zinc-400">Next Chapter in Series:</span>
                  <button
                    type="button"
                    onClick={() => setSelectedSectionId(nextSection.id)}
                    className="px-4 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black border border-white text-xs font-mono font-bold transition-all flex items-center space-x-2 shadow-sm"
                  >
                    <span>Read: {nextSection.title}</span>
                    <ArrowRight className="w-4 h-4 text-black" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
