import { Bus, Clock, MapPin, Users, Edit2, Trash2, User, Power } from 'lucide-react';
import { motion } from 'framer-motion';
import { fmtTime } from '../utils/format';

const TransportCard = ({ transport, onBook, canBook, isAdmin, hasBooking, isBooked, onEdit, onDelete, onToggleActive }) => {
    const {
        vehicleName, registrationNumber, routes, driverName,
        departureTime, returnTime, availableSeats, totalSeats, isActive,
    } = transport;

    const isFull = availableSeats === 0;
    const inactive = isActive === false;

    let label = 'Book seat';
    if (isBooked) label = 'Your booking';
    else if (inactive) label = 'Not running';
    else if (isFull) label = 'Sold out';
    else if (hasBooking) label = 'You already have a booking';
    const disabled = isBooked || inactive || isFull || hasBooking;

    return (
        <motion.div whileHover={{ y: -5 }} className={`glass-panel p-6 flex flex-col justify-between h-full group relative ${isBooked ? 'ring-1 ring-primary/60' : ''}`}>
            {isAdmin && (
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={onToggleActive} className="p-2 bg-slate-700/70 hover:bg-amber-500/20 hover:text-amber-300 rounded-lg transition-colors" title={inactive ? 'Activate' : 'Deactivate'}>
                        <Power className="w-4 h-4" />
                    </button>
                    <button onClick={onEdit} className="p-2 bg-slate-700/70 hover:bg-primary/20 hover:text-primary rounded-lg transition-colors" title="Edit">
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={onDelete} className="p-2 bg-slate-700/70 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            )}

            <div>
                <div className="flex justify-between items-start mb-4">
                    <div className="bg-primary/20 p-3 rounded-xl">
                        <Bus className="w-8 h-8 text-primary" />
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${inactive ? 'bg-slate-600/40 text-slate-300' : isFull ? 'bg-red-500/20 text-red-200' : 'bg-green-500/20 text-green-200'}`}>
                        {inactive ? 'Inactive' : isFull ? 'Full' : `${availableSeats} seats left`}
                    </span>
                </div>

                <h3 className="text-xl font-bold mb-1">{vehicleName}</h3>
                <p className="text-sm text-slate-400 mb-4">{registrationNumber}</p>

                <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                        <MapPin className="w-4 h-4 text-primary shrink-0" />
                        <span>{routes}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                        <Clock className="w-4 h-4 text-primary shrink-0" />
                        <span>{fmtTime(departureTime)} – {fmtTime(returnTime)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                        <Users className="w-4 h-4 text-primary shrink-0" />
                        <span>Capacity: {totalSeats}</span>
                    </div>
                    {driverName && (
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                            <User className="w-4 h-4 text-primary shrink-0" />
                            <span>Driver: {driverName}</span>
                        </div>
                    )}
                </div>
            </div>

            {canBook && (
                <button
                    onClick={() => onBook(transport)}
                    disabled={disabled}
                    className={`w-full py-2 rounded-lg font-bold shadow-lg transition-all ${disabled ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'btn-primary'}`}
                >
                    {label}
                </button>
            )}
        </motion.div>
    );
};

export default TransportCard;
