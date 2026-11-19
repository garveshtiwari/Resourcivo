import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * Password input with a show / hide toggle.
 * Drop-in replacement for <input type="password" ...>: every prop is passed to the input.
 * Render it inside a `relative` wrapper (as the other form inputs here already are);
 * the eye button is positioned on the right edge of that wrapper.
 */
const PasswordInput = ({ className = '', ...props }) => {
    const [visible, setVisible] = useState(false);

    return (
        <>
            <input {...props} type={visible ? 'text' : 'password'} className={`${className} !pr-12`} />
            <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-white transition-colors"
                aria-label={visible ? 'Hide password' : 'Show password'}
                title={visible ? 'Hide password' : 'Show password'}
            >
                {visible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
        </>
    );
};

export default PasswordInput;
