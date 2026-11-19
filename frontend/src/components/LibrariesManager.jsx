import { useEffect, useMemo, useState } from 'react';
import { Library as LibraryIcon, MapPin, UserCog } from 'lucide-react';
import CrudGrid from './ui/CrudGrid';
import { libraryApi, getLibrarianOptions } from '../services/resource.service';
import profileService from '../services/profile.service';
import { useAuth } from '../context/AuthContext';
import { hasRole, ROLES } from '../utils/roles';

// Name and location are both required; the librarian is chosen from the registered librarians.
export const libraryFields = (librarians) => [
    { name: 'name', label: 'Library name', required: true, maxLength: 100, span: 2 },
    { name: 'location', label: 'Location', required: true, minLength: 2, maxLength: 150, span: 2, placeholder: 'e.g. Main Block, Ground Floor' },
    {
        name: 'librarianId',
        label: 'Librarian in charge',
        type: 'select',
        cast: 'number',
        placeholder: 'No librarian assigned',
        span: 2,
        options: librarians.map((l) => ({
            value: l.id,
            label: l.libraryName ? `${l.name} (currently at ${l.libraryName})` : l.name,
        })),
        hint: 'A librarian manages one library. Choosing someone who already manages another library moves them here.',
    },
];

const renderLibrary = (l) => (
    <>
        <div className="bg-blue-500/20 p-3 rounded-xl text-blue-300 w-fit mb-4">
            <LibraryIcon className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold mb-2 pr-16">{l.name}</h3>
        <p className="text-sm text-slate-400 flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 shrink-0" /> {l.location || 'No location set'}
        </p>
        <p className={`text-sm flex items-center gap-2 mt-auto pt-3 border-t border-white/5 ${l.librarianName ? 'text-slate-300' : 'text-amber-300'}`}>
            <UserCog className="w-4 h-4 shrink-0" /> {l.librarianName ? `Managed by ${l.librarianName}` : 'No librarian assigned'}
        </p>
    </>
);

/** The list of libraries with create / edit (and delete for admins). */
const LibrariesManager = ({ canDelete = false }) => {
    const { user } = useAuth();
    const [librarians, setLibrarians] = useState([]);
    const [version, setVersion] = useState(0); // reload the dropdown after every change
    const [me, setMe] = useState(null);

    useEffect(() => {
        getLibrarianOptions().then(setLibrarians).catch(() => setLibrarians([]));
    }, [version]);

    // A librarian creating a library is preselected as its librarian, unless they already manage another one
    useEffect(() => {
        if (hasRole(user, ROLES.LIBRARIAN)) profileService.librarian.get().then(setMe).catch(() => setMe(null));
    }, [user]);

    const fields = useMemo(() => libraryFields(librarians), [librarians]);
    const createValues = useMemo(() => (me && !me.libraryId ? { librarianId: me.id } : null), [me]);

    return (
        <CrudGrid
            entity="library"
            load={libraryApi.getAll}
            renderCard={renderLibrary}
            searchKeys={['name', 'location', 'librarianName']}
            searchPlaceholder="Search libraries…"
            fields={fields}
            createValues={createValues}
            canManage
            addLabel="Create library"
            onCreate={async (payload) => {
                await libraryApi.create(payload);
                setVersion((v) => v + 1);
            }}
            onUpdate={async (library, payload, values) => {
                const body = { ...payload };
                if (!values.librarianId && library.librarianId) body.clearLibrarian = true;
                await libraryApi.update(library.id, body);
                setVersion((v) => v + 1);
            }}
            onDelete={canDelete ? (l) => libraryApi.remove(l.id) : undefined}
            emptyIcon={LibraryIcon}
            emptyText="No libraries yet. Create the first one."
            formSize="max-w-lg"
        />
    );
};

export default LibrariesManager;
