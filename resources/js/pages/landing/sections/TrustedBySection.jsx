import SectionWrapper from '../components/SectionWrapper';
import StatsCounter from '../components/StatsCounter';

const defaultModules = ['Inventory', 'Production', 'POS', 'Accounting', 'Sales', 'Purchases', 'Payroll', 'HR', 'Audit', 'Reports'];

export default function TrustedBySection({ eyebrow, stats, modules }) {
    const moduleList = (modules && modules.length > 0) ? modules : defaultModules;
    return (
        <SectionWrapper id="trusted-by" className="!py-16 md:!py-20 bg-slate-50">
            <p className="text-center text-xs font-semibold tracking-[0.2em] text-slate-400 mb-12">
                {eyebrow}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                {stats.map((stat, i) => (
                    <StatsCounter key={i} {...stat} />
                ))}
            </div>

            {/* Module badges */}
            <div className="mt-14 flex flex-wrap justify-center gap-3">
                {moduleList.map((module) => (
                    <span
                        key={module}
                        className="px-4 py-1.5 text-xs font-medium text-slate-500 bg-white rounded-full border border-slate-200 shadow-sm hover:border-blue-300 hover:text-blue-600 hover:shadow-md transition-all duration-300 cursor-default"
                    >
                        {module}
                    </span>
                ))}
            </div>
        </SectionWrapper>
    );
}
