import { useState, useEffect } from 'react';
import { getLandingContent, updateLandingContent } from '../../services/adminAPI';
import { useAdminTheme } from '../../contexts/AdminThemeContext';

const TABS = [
    { id: 'hero', label: 'Hero' },
    { id: 'trustedBy', label: 'Trusted By' },
    { id: 'features', label: 'Features' },
    { id: 'howItWorks', label: 'How It Works' },
    { id: 'dashboardPreview', label: 'Dashboard' },
    { id: 'pricing', label: 'Pricing Copy' },
    { id: 'testimonials', label: 'Testimonials' },
    { id: 'cta', label: 'CTA' },
    { id: 'nav', label: 'Nav' },
    { id: 'footer', label: 'Footer' },
];

export default function LandingPageEditor() {
    const { t } = useAdminTheme();
    const [content, setContent] = useState({});
    const [activeTab, setActiveTab] = useState('hero');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        loadContent();
    }, []);

    const loadContent = async () => {
        setLoading(true);
        try {
            const res = await getLandingContent();
            setContent(res?.data?.content || {});
        } catch (err) {
            console.error('Failed to load landing content:', err);
        } finally {
            setLoading(false);
        }
    };

    // Update a top-level field in a section object: content.hero.badge = value
    const updateField = (section, field, value) => {
        setContent((prev) => ({
            ...prev,
            [section]: { ...prev[section], [field]: value },
        }));
    };

    // Update a nested object field: content.hero.ctaPrimary.label = value
    const updateNestedObject = (section, key, field, value) => {
        setContent((prev) => ({
            ...prev,
            [section]: {
                ...prev[section],
                [key]: { ...(prev[section]?.[key] || {}), [field]: value },
            },
        }));
    };

    // Update an item in a top-level array: content.features[i].title = value
    const updateNestedField = (section, index, field, value) => {
        setContent((prev) => {
            const arr = [...(Array.isArray(prev[section]) ? prev[section] : [])];
            arr[index] = { ...arr[index], [field]: value };
            return { ...prev, [section]: arr };
        });
    };

    // Update an item in a nested array: content.howItWorks.steps[i].title = value
    const updateArrayField = (section, arrayKey, index, field, value) => {
        setContent((prev) => {
            const sectionData = { ...prev[section] };
            const arr = [...(sectionData[arrayKey] || [])];
            arr[index] = { ...arr[index], [field]: value };
            sectionData[arrayKey] = arr;
            return { ...prev, [section]: sectionData };
        });
    };

    // Add item to a nested array
    const addArrayItem = (section, arrayKey, template) => {
        setContent((prev) => {
            const sectionData = { ...prev[section] };
            sectionData[arrayKey] = [...(sectionData[arrayKey] || []), template];
            return { ...prev, [section]: sectionData };
        });
    };

    // Remove item from a nested array
    const removeArrayItem = (section, arrayKey, index) => {
        setContent((prev) => {
            const sectionData = { ...prev[section] };
            sectionData[arrayKey] = (sectionData[arrayKey] || []).filter((_, i) => i !== index);
            return { ...prev, [section]: sectionData };
        });
    };

    // Add item to a top-level array: content.features.push(template)
    const addTopLevelArrayItem = (section, template) => {
        setContent((prev) => ({
            ...prev,
            [section]: [...(Array.isArray(prev[section]) ? prev[section] : []), template],
        }));
    };

    // Remove item from a top-level array
    const removeTopLevelArrayItem = (section, index) => {
        setContent((prev) => ({
            ...prev,
            [section]: (Array.isArray(prev[section]) ? prev[section] : []).filter((_, i) => i !== index),
        }));
    };

    // Update a nested array within footer columns
    const updateFooterColumnLink = (colIdx, linkIdx, field, value) => {
        setContent((prev) => {
            const footer = { ...prev.footer };
            const columns = [...(footer.columns || [])];
            const col = { ...columns[colIdx] };
            const links = [...(col.links || [])];
            links[linkIdx] = { ...links[linkIdx], [field]: value };
            col.links = links;
            columns[colIdx] = col;
            footer.columns = columns;
            return { ...prev, footer };
        });
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage('');
        try {
            await updateLandingContent({ content });
            setMessage('Content saved successfully');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage('Failed to save content');
        } finally {
            setSaving(false);
        }
    };

    const inputClass = `w-full px-3 py-2 rounded-lg border text-sm ${t.inputBg} ${t.inputText} ${t.inputPlaceholder} ${t.inputFocus}`;
    const labelClass = `block text-sm font-medium mb-1 ${t.textLabel}`;

    if (loading) {
        return <div className={`p-12 text-center ${t.textSecondary}`}>Loading...</div>;
    }

    const renderHero = () => {
        const hero = content.hero || {};
        const ctaPrimary = hero.ctaPrimary || {};
        const ctaSecondary = hero.ctaSecondary || {};
        return (
            <div className="space-y-4">
                <div>
                    <label className={labelClass}>Badge</label>
                    <input type="text" value={hero.badge || ''} onChange={(e) => updateField('hero', 'badge', e.target.value)} className={inputClass} />
                </div>
                <div>
                    <label className={labelClass}>Headline</label>
                    <input type="text" value={hero.headline || ''} onChange={(e) => updateField('hero', 'headline', e.target.value)} className={inputClass} />
                </div>
                <div>
                    <label className={labelClass}>Subtext</label>
                    <textarea value={hero.subtext || ''} onChange={(e) => updateField('hero', 'subtext', e.target.value)} rows={3} className={inputClass} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Primary CTA Label</label>
                        <input type="text" value={ctaPrimary.label || ''} onChange={(e) => updateNestedObject('hero', 'ctaPrimary', 'label', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Primary CTA Link</label>
                        <input type="text" value={ctaPrimary.href || ''} onChange={(e) => updateNestedObject('hero', 'ctaPrimary', 'href', e.target.value)} className={inputClass} />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Secondary CTA Label</label>
                        <input type="text" value={ctaSecondary.label || ''} onChange={(e) => updateNestedObject('hero', 'ctaSecondary', 'label', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Secondary CTA Link</label>
                        <input type="text" value={ctaSecondary.href || ''} onChange={(e) => updateNestedObject('hero', 'ctaSecondary', 'href', e.target.value)} className={inputClass} />
                    </div>
                </div>
                <div>
                    <label className={labelClass}>Trust Note</label>
                    <input type="text" value={hero.trustNote || ''} onChange={(e) => updateField('hero', 'trustNote', e.target.value)} className={inputClass} />
                </div>
            </div>
        );
    };

    const renderTrustedBy = () => {
        const tb = content.trustedBy || {};
        const stats = tb.stats || [];
        const modules = tb.modules || [];
        return (
            <div className="space-y-4">
                <div>
                    <label className={labelClass}>Eyebrow</label>
                    <input type="text" value={tb.eyebrow || ''} onChange={(e) => updateField('trustedBy', 'eyebrow', e.target.value)} className={inputClass} />
                </div>

                <div className="flex items-center justify-between">
                    <h3 className={`text-sm font-semibold ${t.textPrimary}`}>Stats</h3>
                    <button type="button" onClick={() => addArrayItem('trustedBy', 'stats', { value: 0, suffix: '+', label: '' })} className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        + Add Stat
                    </button>
                </div>
                {stats.map((stat, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <input type="number" value={stat.value ?? ''} onChange={(e) => updateArrayField('trustedBy', 'stats', i, 'value', Number(e.target.value))} placeholder="Value" className={`w-28 ${inputClass}`} />
                        <input type="text" value={stat.suffix || ''} onChange={(e) => updateArrayField('trustedBy', 'stats', i, 'suffix', e.target.value)} placeholder="Suffix" className={`w-20 ${inputClass}`} />
                        <input type="text" value={stat.label || ''} onChange={(e) => updateArrayField('trustedBy', 'stats', i, 'label', e.target.value)} placeholder="Label" className={`flex-1 ${inputClass}`} />
                        <button type="button" onClick={() => removeArrayItem('trustedBy', 'stats', i)} className="text-red-500 text-xs hover:text-red-400">Remove</button>
                    </div>
                ))}

                <div className="flex items-center justify-between mt-6">
                    <h3 className={`text-sm font-semibold ${t.textPrimary}`}>Module Badges</h3>
                    <button type="button" onClick={() => {
                        setContent((prev) => ({
                            ...prev,
                            trustedBy: {
                                ...prev.trustedBy,
                                modules: [...(prev.trustedBy?.modules || []), ''],
                            },
                        }));
                    }} className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        + Add Module
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {modules.map((mod, i) => (
                        <div key={i} className="flex items-center gap-1">
                            <input type="text" value={mod} onChange={(e) => {
                                setContent((prev) => {
                                    const mods = [...(prev.trustedBy?.modules || [])];
                                    mods[i] = e.target.value;
                                    return { ...prev, trustedBy: { ...prev.trustedBy, modules: mods } };
                                });
                            }} className={`w-28 ${inputClass}`} />
                            <button type="button" onClick={() => {
                                setContent((prev) => ({
                                    ...prev,
                                    trustedBy: {
                                        ...prev.trustedBy,
                                        modules: (prev.trustedBy?.modules || []).filter((_, j) => j !== i),
                                    },
                                }));
                            }} className="text-red-500 text-xs hover:text-red-400">x</button>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderFeatures = () => {
        const items = Array.isArray(content.features) ? content.features : [];
        const section = content.featuresSection || {};
        return (
            <div className="space-y-4">
                <div>
                    <label className={labelClass}>Section Eyebrow</label>
                    <input type="text" value={section.eyebrow || ''} onChange={(e) => updateField('featuresSection', 'eyebrow', e.target.value)} className={inputClass} placeholder="EVERYTHING YOU NEED" />
                </div>
                <div>
                    <label className={labelClass}>Section Headline</label>
                    <input type="text" value={section.headline || ''} onChange={(e) => updateField('featuresSection', 'headline', e.target.value)} className={inputClass} placeholder="One Platform. Complete Control." />
                </div>
                <div>
                    <label className={labelClass}>Section Subtext</label>
                    <textarea value={section.subtext || ''} onChange={(e) => updateField('featuresSection', 'subtext', e.target.value)} rows={2} className={inputClass} placeholder="From raw materials to finished goods..." />
                </div>
                <div className="flex items-center justify-between">
                    <h3 className={`text-sm font-semibold ${t.textPrimary}`}>Feature Items</h3>
                    <button type="button" onClick={() => addTopLevelArrayItem('features', { icon: 'Zap', title: '', description: '', color: 'blue' })} className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        + Add
                    </button>
                </div>
                {items.map((item, i) => (
                    <div key={i} className={`p-4 rounded-lg border space-y-3 ${t.inputBg}`}>
                        <div className="flex items-center justify-between">
                            <span className={`text-xs font-medium ${t.textMuted}`}>Feature {i + 1}</span>
                            <button type="button" onClick={() => removeTopLevelArrayItem('features', i)} className="text-red-500 text-xs hover:text-red-400">Remove</button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelClass}>Title</label>
                                <input type="text" value={item.title || ''} onChange={(e) => updateNestedField('features', i, 'title', e.target.value)} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Icon</label>
                                <input type="text" value={item.icon || ''} onChange={(e) => updateNestedField('features', i, 'icon', e.target.value)} className={inputClass} />
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>Description</label>
                            <textarea value={item.description || ''} onChange={(e) => updateNestedField('features', i, 'description', e.target.value)} rows={2} className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Color</label>
                            <input type="text" value={item.color || ''} onChange={(e) => updateNestedField('features', i, 'color', e.target.value)} placeholder="blue, emerald, purple..." className={inputClass} />
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderHowItWorks = () => {
        const how = content.howItWorks || {};
        const steps = how.steps || [];
        return (
            <div className="space-y-4">
                <div>
                    <label className={labelClass}>Eyebrow</label>
                    <input type="text" value={how.eyebrow || ''} onChange={(e) => updateField('howItWorks', 'eyebrow', e.target.value)} className={inputClass} />
                </div>
                <div>
                    <label className={labelClass}>Headline</label>
                    <input type="text" value={how.headline || ''} onChange={(e) => updateField('howItWorks', 'headline', e.target.value)} className={inputClass} />
                </div>
                <div className="flex items-center justify-between">
                    <h3 className={`text-sm font-semibold ${t.textPrimary}`}>Steps</h3>
                    <button type="button" onClick={() => addArrayItem('howItWorks', 'steps', { step: steps.length + 1, title: '', description: '' })} className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        + Add Step
                    </button>
                </div>
                {steps.map((step, i) => (
                    <div key={i} className={`p-4 rounded-lg border space-y-3 ${t.inputBg}`}>
                        <div className="flex items-center justify-between">
                            <span className={`text-xs font-medium ${t.textMuted}`}>Step {i + 1}</span>
                            <button type="button" onClick={() => removeArrayItem('howItWorks', 'steps', i)} className="text-red-500 text-xs hover:text-red-400">Remove</button>
                        </div>
                        <div>
                            <label className={labelClass}>Title</label>
                            <input type="text" value={step.title || ''} onChange={(e) => updateArrayField('howItWorks', 'steps', i, 'title', e.target.value)} className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Description</label>
                            <textarea value={step.description || ''} onChange={(e) => updateArrayField('howItWorks', 'steps', i, 'description', e.target.value)} rows={2} className={inputClass} />
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderDashboardPreview = () => {
        const dp = content.dashboardPreview || {};
        return (
            <div className="space-y-4">
                <p className={`text-xs ${t.textMuted}`}>Controls the section header text above the dashboard mockup. The mockup itself is visual-only.</p>
                <div>
                    <label className={labelClass}>Eyebrow</label>
                    <input type="text" value={dp.eyebrow || ''} onChange={(e) => updateField('dashboardPreview', 'eyebrow', e.target.value)} className={inputClass} />
                </div>
                <div>
                    <label className={labelClass}>Title</label>
                    <input type="text" value={dp.title || ''} onChange={(e) => updateField('dashboardPreview', 'title', e.target.value)} className={inputClass} />
                </div>
                <div>
                    <label className={labelClass}>Subtitle</label>
                    <textarea value={dp.subtitle || ''} onChange={(e) => updateField('dashboardPreview', 'subtitle', e.target.value)} rows={2} className={inputClass} />
                </div>
            </div>
        );
    };

    const renderTestimonials = () => {
        const items = Array.isArray(content.testimonials) ? content.testimonials : [];
        const section = content.testimonialsSection || {};
        return (
            <div className="space-y-4">
                <div>
                    <label className={labelClass}>Section Eyebrow</label>
                    <input type="text" value={section.eyebrow || ''} onChange={(e) => updateField('testimonialsSection', 'eyebrow', e.target.value)} className={inputClass} placeholder="WHAT OUR CUSTOMERS SAY" />
                </div>
                <div>
                    <label className={labelClass}>Section Headline</label>
                    <input type="text" value={section.headline || ''} onChange={(e) => updateField('testimonialsSection', 'headline', e.target.value)} className={inputClass} placeholder="Trusted by Factory Leaders" />
                </div>
                <div className="flex items-center justify-between">
                    <h3 className={`text-sm font-semibold ${t.textPrimary}`}>Testimonials</h3>
                    <button type="button" onClick={() => addTopLevelArrayItem('testimonials', { quote: '', author: '', role: '', company: '', initials: '' })} className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        + Add
                    </button>
                </div>
                {items.map((item, i) => (
                    <div key={i} className={`p-4 rounded-lg border space-y-3 ${t.inputBg}`}>
                        <div className="flex items-center justify-between">
                            <span className={`text-xs font-medium ${t.textMuted}`}>Testimonial {i + 1}</span>
                            <button type="button" onClick={() => removeTopLevelArrayItem('testimonials', i)} className="text-red-500 text-xs hover:text-red-400">Remove</button>
                        </div>
                        <div>
                            <label className={labelClass}>Quote</label>
                            <textarea value={item.quote || ''} onChange={(e) => updateNestedField('testimonials', i, 'quote', e.target.value)} rows={3} className={inputClass} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelClass}>Author</label>
                                <input type="text" value={item.author || ''} onChange={(e) => updateNestedField('testimonials', i, 'author', e.target.value)} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Initials</label>
                                <input type="text" value={item.initials || ''} onChange={(e) => updateNestedField('testimonials', i, 'initials', e.target.value)} className={inputClass} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelClass}>Role</label>
                                <input type="text" value={item.role || ''} onChange={(e) => updateNestedField('testimonials', i, 'role', e.target.value)} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Company</label>
                                <input type="text" value={item.company || ''} onChange={(e) => updateNestedField('testimonials', i, 'company', e.target.value)} className={inputClass} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderPricing = () => {
        const pricing = content.pricing || {};
        return (
            <div className="space-y-4">
                <p className={`text-xs ${t.textMuted}`}>Plan cards are managed in the Plans section. This controls only the pricing section copy.</p>
                <div>
                    <label className={labelClass}>Eyebrow</label>
                    <input type="text" value={pricing.eyebrow || ''} onChange={(e) => updateField('pricing', 'eyebrow', e.target.value)} className={inputClass} />
                </div>
                <div>
                    <label className={labelClass}>Headline</label>
                    <input type="text" value={pricing.headline || ''} onChange={(e) => updateField('pricing', 'headline', e.target.value)} className={inputClass} />
                </div>
                <div>
                    <label className={labelClass}>Subtext</label>
                    <textarea value={pricing.subtext || ''} onChange={(e) => updateField('pricing', 'subtext', e.target.value)} rows={2} className={inputClass} />
                </div>
            </div>
        );
    };

    const renderCta = () => {
        const cta = content.cta || {};
        const ctaPrimary = cta.ctaPrimary || {};
        const ctaSecondary = cta.ctaSecondary || {};
        return (
            <div className="space-y-4">
                <div>
                    <label className={labelClass}>Headline</label>
                    <input type="text" value={cta.headline || ''} onChange={(e) => updateField('cta', 'headline', e.target.value)} className={inputClass} />
                </div>
                <div>
                    <label className={labelClass}>Subtext</label>
                    <textarea value={cta.subtext || ''} onChange={(e) => updateField('cta', 'subtext', e.target.value)} rows={2} className={inputClass} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Primary CTA Label</label>
                        <input type="text" value={ctaPrimary.label || ''} onChange={(e) => updateNestedObject('cta', 'ctaPrimary', 'label', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Primary CTA Link</label>
                        <input type="text" value={ctaPrimary.href || ''} onChange={(e) => updateNestedObject('cta', 'ctaPrimary', 'href', e.target.value)} className={inputClass} />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Secondary CTA Label</label>
                        <input type="text" value={ctaSecondary.label || ''} onChange={(e) => updateNestedObject('cta', 'ctaSecondary', 'label', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Secondary CTA Link</label>
                        <input type="text" value={ctaSecondary.href || ''} onChange={(e) => updateNestedObject('cta', 'ctaSecondary', 'href', e.target.value)} className={inputClass} />
                    </div>
                </div>
            </div>
        );
    };

    const renderNav = () => {
        const nav = content.nav || {};
        const links = nav.links || [];
        const ctaPrimary = nav.ctaPrimary || {};
        const ctaSecondary = nav.ctaSecondary || {};
        return (
            <div className="space-y-4">
                <h3 className={`text-sm font-semibold ${t.textPrimary}`}>Primary CTA</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Label</label>
                        <input type="text" value={ctaPrimary.label || ''} onChange={(e) => updateNestedObject('nav', 'ctaPrimary', 'label', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Link</label>
                        <input type="text" value={ctaPrimary.href || ''} onChange={(e) => updateNestedObject('nav', 'ctaPrimary', 'href', e.target.value)} className={inputClass} />
                    </div>
                </div>
                <h3 className={`text-sm font-semibold ${t.textPrimary}`}>Secondary CTA</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Label</label>
                        <input type="text" value={ctaSecondary.label || ''} onChange={(e) => updateNestedObject('nav', 'ctaSecondary', 'label', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Link</label>
                        <input type="text" value={ctaSecondary.href || ''} onChange={(e) => updateNestedObject('nav', 'ctaSecondary', 'href', e.target.value)} className={inputClass} />
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <h3 className={`text-sm font-semibold ${t.textPrimary}`}>Navigation Links</h3>
                    <button type="button" onClick={() => addArrayItem('nav', 'links', { label: '', href: '' })} className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        + Add Link
                    </button>
                </div>
                {links.map((link, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <input type="text" value={link.label || ''} onChange={(e) => updateArrayField('nav', 'links', i, 'label', e.target.value)} placeholder="Label" className={`flex-1 ${inputClass}`} />
                        <input type="text" value={link.href || ''} onChange={(e) => updateArrayField('nav', 'links', i, 'href', e.target.value)} placeholder="Link" className={`flex-1 ${inputClass}`} />
                        <button type="button" onClick={() => removeArrayItem('nav', 'links', i)} className="text-red-500 text-xs hover:text-red-400">Remove</button>
                    </div>
                ))}
            </div>
        );
    };

    const renderFooter = () => {
        const footer = content.footer || {};
        const columns = footer.columns || [];
        return (
            <div className="space-y-4">
                <div>
                    <label className={labelClass}>Description</label>
                    <textarea value={footer.description || ''} onChange={(e) => updateField('footer', 'description', e.target.value)} rows={2} className={inputClass} />
                </div>
                <div>
                    <label className={labelClass}>Copyright</label>
                    <input type="text" value={footer.copyright || ''} onChange={(e) => updateField('footer', 'copyright', e.target.value)} className={inputClass} />
                </div>
                <div>
                    <label className={labelClass}>Tagline</label>
                    <input type="text" value={footer.tagline || ''} onChange={(e) => updateField('footer', 'tagline', e.target.value)} className={inputClass} />
                </div>

                <div className="flex items-center justify-between mt-6">
                    <h3 className={`text-sm font-semibold ${t.textPrimary}`}>Link Columns</h3>
                    <button type="button" onClick={() => {
                        setContent((prev) => ({
                            ...prev,
                            footer: {
                                ...prev.footer,
                                columns: [...(prev.footer?.columns || []), { title: '', links: [{ label: '', href: '' }] }],
                            },
                        }));
                    }} className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        + Add Column
                    </button>
                </div>
                {columns.map((col, ci) => (
                    <div key={ci} className={`p-4 rounded-lg border space-y-3 ${t.inputBg}`}>
                        <div className="flex items-center justify-between">
                            <input type="text" value={col.title || ''} onChange={(e) => {
                                setContent((prev) => {
                                    const f = { ...prev.footer };
                                    const cols = [...(f.columns || [])];
                                    cols[ci] = { ...cols[ci], title: e.target.value };
                                    f.columns = cols;
                                    return { ...prev, footer: f };
                                });
                            }} placeholder="Column Title" className={`font-semibold ${inputClass}`} style={{ maxWidth: 200 }} />
                            <button type="button" onClick={() => {
                                setContent((prev) => ({
                                    ...prev,
                                    footer: {
                                        ...prev.footer,
                                        columns: (prev.footer?.columns || []).filter((_, j) => j !== ci),
                                    },
                                }));
                            }} className="text-red-500 text-xs hover:text-red-400">Remove Column</button>
                        </div>
                        {(col.links || []).map((link, li) => (
                            <div key={li} className="flex items-center gap-2">
                                <input type="text" value={link.label || ''} onChange={(e) => updateFooterColumnLink(ci, li, 'label', e.target.value)} placeholder="Label" className={`flex-1 ${inputClass}`} />
                                <input type="text" value={link.href || ''} onChange={(e) => updateFooterColumnLink(ci, li, 'href', e.target.value)} placeholder="Link" className={`flex-1 ${inputClass}`} />
                                <button type="button" onClick={() => {
                                    setContent((prev) => {
                                        const f = { ...prev.footer };
                                        const cols = [...(f.columns || [])];
                                        cols[ci] = { ...cols[ci], links: (cols[ci].links || []).filter((_, j) => j !== li) };
                                        f.columns = cols;
                                        return { ...prev, footer: f };
                                    });
                                }} className="text-red-500 text-xs hover:text-red-400">x</button>
                            </div>
                        ))}
                        <button type="button" onClick={() => {
                            setContent((prev) => {
                                const f = { ...prev.footer };
                                const cols = [...(f.columns || [])];
                                cols[ci] = { ...cols[ci], links: [...(cols[ci].links || []), { label: '', href: '' }] };
                                f.columns = cols;
                                return { ...prev, footer: f };
                            });
                        }} className={`text-xs ${t.textSecondary} hover:text-blue-500`}>+ Add Link</button>
                    </div>
                ))}
            </div>
        );
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'hero': return renderHero();
            case 'trustedBy': return renderTrustedBy();
            case 'features': return renderFeatures();
            case 'howItWorks': return renderHowItWorks();
            case 'dashboardPreview': return renderDashboardPreview();
            case 'testimonials': return renderTestimonials();
            case 'pricing': return renderPricing();
            case 'cta': return renderCta();
            case 'nav': return renderNav();
            case 'footer': return renderFooter();
            default: return null;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className={`text-2xl font-bold ${t.textPrimary}`}>Landing Page Editor</h1>
                    <p className={`text-sm mt-1 ${t.textSecondary}`}>Manage landing page content</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {message && (
                <div className={`p-3 rounded-lg text-sm ${
                    message.includes('success') ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'
                }`}>
                    {message}
                </div>
            )}

            {/* Tabs */}
            <div className={`border-b ${t.tableBorder}`}>
                <div className="flex gap-1 overflow-x-auto">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${
                                activeTab === tab.id ? t.tabActive : t.tabInactive
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className={`rounded-xl border p-6 ${t.cardBg}`}>
                {renderContent()}
            </div>
        </div>
    );
}
