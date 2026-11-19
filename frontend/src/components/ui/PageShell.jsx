import { motion } from 'framer-motion';
import Navbar from '../Navbar';

const PageShell = ({ title, subtitle, actions, children, width = 'max-w-7xl' }) => (
    <div className="min-h-screen">
        <Navbar />
        <main className={`${width} mx-auto px-6 md:px-8 pb-8 pt-24`}>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {title && (
                    <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold title-gradient">{title}</h1>
                            {subtitle && <p className="text-slate-400">{subtitle}</p>}
                        </div>
                        {actions}
                    </div>
                )}
                {children}
            </motion.div>
        </main>
    </div>
);

export default PageShell;
