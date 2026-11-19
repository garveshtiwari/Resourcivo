import { usePhoto } from '../hooks/usePhoto';

/** Round profile picture, falling back to the person's initial. */
const Avatar = ({
    userId,
    name = '',
    size = 'w-10 h-10',
    text = 'text-sm',
    fallback = 'bg-gradient-to-br from-primary to-purple-600',
    className = '',
}) => {
    const url = usePhoto(userId);
    const initial = (name.trim().charAt(0) || '?').toUpperCase();

    return url ? (
        <img src={url} alt={name || 'Profile picture'} className={`${size} shrink-0 rounded-full object-cover ${className}`} />
    ) : (
        <div className={`${size} ${text} ${fallback} shrink-0 rounded-full flex items-center justify-center font-bold text-white ${className}`}>
            {initial}
        </div>
    );
};

export default Avatar;
