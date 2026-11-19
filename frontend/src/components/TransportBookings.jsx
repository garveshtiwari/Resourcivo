import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Inbox, XCircle } from 'lucide-react';
import transportService from '../services/transport.service';
import { Loading, ErrorState, EmptyState, Badge } from './ui/States';
import { fmtDate, titleCase } from '../utils/format';
import { getErrorMessage } from '../utils/errors';
import { useToast } from '../context/ToastContext';

// Admin / transport manager overview of every booking.
const TransportBookings = () => {
    const toast = useToast();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('ACTIVE');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            setRows(await transportService.getAllBookings());
        } catch (err) {
            setError(getErrorMessage(err, 'Could not load bookings'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const cancel = async (booking) => {
        if (!window.confirm('Cancel this booking and free the seat?')) return;
        try {
            await transportService.cancelBookingById(booking.id);
            toast.success('Booking cancelled');
            load();
        } catch (err) {
            toast.error(getErrorMessage(err, 'Could not cancel the booking'));
        }
    };

    const visible = filter === 'ALL' ? rows : rows.filter((r) => r.status === filter);

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/5">
                    {['ACTIVE', 'CANCELLED', 'ALL'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === f ? 'bg-primary text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            {titleCase(f)}
                        </button>
                    ))}
                </div>
                <button onClick={load} className="btn-secondary !py-2 text-sm flex items-center gap-2">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </button>
            </div>

            {loading ? (
                <Loading />
            ) : error ? (
                <div className="grid"><ErrorState message={error} onRetry={load} /></div>
            ) : visible.length === 0 ? (
                <div className="grid"><EmptyState icon={Inbox} text="No bookings to show." /></div>
            ) : (
                <div className="glass-panel overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-left text-xs text-slate-400 uppercase tracking-wider">
                            <tr>
                                <th className="p-4">Vehicle</th>
                                <th className="p-4">Route</th>
                                <th className="p-4">Passenger</th>
                                <th className="p-4">Pickup</th>
                                <th className="p-4">Booked</th>
                                <th className="p-4">Status</th>
                                <th className="p-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {visible.map((b) => (
                                <tr key={b.id} className="hover:bg-white/5">
                                    <td className="p-4 font-medium">{b.transport?.vehicleName}</td>
                                    <td className="p-4 text-slate-400">{b.transport?.routes}</td>
                                    <td className="p-4 text-slate-300">{titleCase((b.userType || '').replace('ROLE_', ''))} · user #{b.userId}</td>
                                    <td className="p-4 text-slate-400">{b.pickupPoint || '—'}</td>
                                    <td className="p-4 text-slate-400">{fmtDate(b.bookingDate)}</td>
                                    <td className="p-4"><Badge tone={b.status === 'ACTIVE' ? 'green' : 'slate'}>{titleCase(b.status)}</Badge></td>
                                    <td className="p-4 text-right">
                                        {b.status === 'ACTIVE' && (
                                            <button onClick={() => cancel(b)} className="text-slate-400 hover:text-red-300 inline-flex items-center gap-1 text-xs">
                                                <XCircle className="w-4 h-4" /> Cancel
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default TransportBookings;
