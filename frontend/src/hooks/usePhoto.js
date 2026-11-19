import { useEffect, useState } from 'react';
import { loadPhoto, subscribePhotos } from '../services/photo.service';

// The blob URL of a user's profile picture (null while loading or when they have none)
export const usePhoto = (userId) => {
    const [url, setUrl] = useState(null);

    useEffect(() => {
        let alive = true;
        const load = () => {
            if (!userId) {
                setUrl(null);
                return;
            }
            loadPhoto(userId).then((u) => alive && setUrl(u));
        };
        load();
        const unsubscribe = subscribePhotos((changedId) => {
            if (changedId === userId) {
                setUrl(null);
                load();
            }
        });
        return () => {
            alive = false;
            unsubscribe();
        };
    }, [userId]);

    return url;
};
