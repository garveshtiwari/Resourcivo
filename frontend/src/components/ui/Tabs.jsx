const Tabs = ({ tabs, active, onChange }) => (
    <div className="flex flex-wrap bg-slate-900/50 p-1 rounded-xl border border-white/5">
        {tabs.map(({ id, label, icon: Icon, badge }) => (
            <button
                key={id}
                onClick={() => onChange(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${active === id
                    ? 'bg-primary text-white shadow-lg shadow-primary/25'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
            >
                {Icon && <Icon className="w-4 h-4" />}
                {label}
                {badge > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-secondary text-white text-[10px] leading-none font-bold">
                        {badge}
                    </span>
                )}
            </button>
        ))}
    </div>
);

export default Tabs;
