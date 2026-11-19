import { useState, useEffect, useCallback } from 'react';
import { MapPin, Clock, XCircle, Plus, Search } from 'lucide-react';
import transportService from '../services/transport.service';
import TransportCard from './TransportCard';
import TransportForm from './TransportForm';
import FormModal from './ui/FormModal';
import { Loading, ErrorState, EmptyState } from './ui/States';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { hasRole, ROLES } from '../utils/roles';
import { fmtDate, fmtTime } from '../utils/format';
import { getErrorMessage } from '../utils/errors';

const pickupFields = [
    { name: 'pickupPoint', label: 'Pickup point', required: true, span: 2, placeholder: 'e.g. Madhapur Metro Station', maxLength: 120 },
];

const TransportList = () => {
    const { user } = useAuth();
    const toast = useToast();

    const [transports, setTransports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [booking, setBooking] = useState(null);
    const [bookingTarget, setBookingTarget] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTransport, setEditingTransport] = useState(null);

    const isStudent = hasRole(user, ROLES.STUDENT);
    const isFaculty = hasRole(user, ROLES.FACULTY);
    const canBook = isStudent || isFaculty;
    const isAdmin = hasRole(user, ROLES.ADMIN, ROLES.TRANSPORT_MANAGER);
    const userId = user?.userId;

    // Student and faculty bookings use different endpoints but the same shape.
    const api = isStudent
        ? { get: transportService.getStudentBooking, book: transportService.bookTransportStudent, cancel: transportService.cancelStudentBooking }
        : { get: transportService.getFacultyBooking, book: transportService.bookTransportFaculty, cancel: transportService.cancelFacultyBooking };

    const fetchAll = useCallback(async () => {
        setError('');
        try {
            const [list, mine] = await Promise.all([
                transportService.getAllTransports(),
                canBook ? transportService.getMyBooking().catch(() => null) : Promise.resolve(null),
            ]);
            setTransports(list || []);
            setBooking(mine);
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to load transports'));
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canBook, isStudent, userId]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    const confirmBooking = async ({ pickupPoint }) => {
        await api.book(userId, bookingTarget.id, pickupPoint);
        toast.success('Seat booked!');
        await fetchAll();
    };

    const cancelBooking = async () => {
        if (!window.confirm('Cancel your transport booking?')) return;
        try {
            await api.cancel(userId);
            toast.success('Booking cancelled');
            await fetchAll();
        } catch (err) {
            toast.error(getErrorMessage(err, 'Could not cancel the booking'));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this transport?')) return;
        try {
            await transportService.deleteTransport(id);
            toast.success('Transport deleted');
            fetchAll();
        } catch (err) {
            toast.error(getErrorMessage(err, 'Failed to delete transport (it may have bookings)'));
        }
    };

    const toggleActive = async (transport) => {
        try {
            await transportService.setTransportActive(transport.id, transport.isActive === false);
            toast.success(transport.isActive === false ? 'Vehicle activated' : 'Vehicle deactivated');
            fetchAll();
        } catch (err) {
            toast.error(getErrorMessage(err, 'Could not change the vehicle status'));
        }
    };

    const handleFormSubmit = async (data) => {
        try {
            if (editingTransport) {
                await transportService.updateTransport(editingTransport.id, data);
            } else {
                await transportService.createTransport(data);
            }
            toast.success(editingTransport ? 'Transport updated' : 'Transport created');
            setIsModalOpen(false);
            fetchAll();
        } catch (err) {
            toast.error(getErrorMessage(err, 'Operation failed'));
        }
    };

    const q = searchTerm.toLowerCase();
    const filtered = transports.filter(
        (t) => (t.vehicleName || '').toLowerCase().includes(q) || (t.routes || '').toLowerCase().includes(q)
    );

    if (loading) return <Loading text="Loading transports…" />;

    return (
        <div>
            {canBook && booking && (
                <div className="glass-panel p-5 mb-8 border-primary/30 flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1 space-y-1">
                        <p className="text-xs uppercase tracking-wider text-primary font-bold">Your booking</p>
                        <p className="text-lg font-bold">{booking.transport?.vehicleName}</p>
                        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-400">
                            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {booking.transport?.routes}</span>
                            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {fmtTime(booking.transport?.departureTime)} departure</span>
                            <span>Pickup: {booking.pickupPoint || '—'}</span>
                            <span>Booked {fmtDate(booking.bookingDate)}</span>
                        </div>
                    </div>
                    <button onClick={cancelBooking} className="btn-secondary !py-2 text-sm flex items-center gap-2 hover:!text-red-300">
                        <XCircle className="w-4 h-4" /> Cancel booking
                    </button>
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-bold title-gradient">{isAdmin ? 'Vehicles' : 'Available Transports'}</h2>
                    <p className="text-slate-400 text-sm">{isAdmin ? 'Manage the campus fleet' : 'Pick a route and book your seat'}</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search routes..."
                            className="glass-input !pl-10 h-10 w-64 text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {isAdmin && (
                        <button
                            onClick={() => { setEditingTransport(null); setIsModalOpen(true); }}
                            className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
                        >
                            <Plus className="w-4 h-4" /> Add Vehicle
                        </button>
                    )}
                </div>
            </div>

            {error ? (
                <div className="grid"><ErrorState message={error} onRetry={fetchAll} /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((transport) => (
                        <TransportCard
                            key={transport.id}
                            transport={transport}
                            canBook={canBook}
                            isAdmin={isAdmin}
                            hasBooking={!!booking}
                            isBooked={booking?.transport?.id === transport.id}
                            onBook={setBookingTarget}
                            onEdit={() => { setEditingTransport(transport); setIsModalOpen(true); }}
                            onDelete={() => handleDelete(transport.id)}
                            onToggleActive={() => toggleActive(transport)}
                        />
                    ))}
                    {filtered.length === 0 && <EmptyState text="No transports found." />}
                </div>
            )}

            <TransportForm
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleFormSubmit}
                initialData={editingTransport}
            />

            <FormModal
                isOpen={!!bookingTarget}
                onClose={() => setBookingTarget(null)}
                title={bookingTarget ? `Book ${bookingTarget.vehicleName}` : ''}
                size="max-w-md"
                fields={pickupFields}
                submitLabel="Confirm booking"
                onSubmit={confirmBooking}
            />
        </div>
    );
};

export default TransportList;
