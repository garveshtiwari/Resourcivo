import { useState } from 'react';
import { Bus, ClipboardList } from 'lucide-react';
import PageShell from '../components/ui/PageShell';
import Tabs from '../components/ui/Tabs';
import TransportList from '../components/TransportList';
import TransportBookings from '../components/TransportBookings';
import { useAuth } from '../context/AuthContext';
import { hasRole, ROLES } from '../utils/roles';

const Transport = () => {
    const { user } = useAuth();
    const isStaff = hasRole(user, ROLES.ADMIN, ROLES.TRANSPORT_MANAGER);
    const [tab, setTab] = useState('vehicles');

    return (
        <PageShell
            title="Transport Services"
            subtitle="Campus commute management and scheduling"
            actions={
                isStaff ? (
                    <Tabs
                        tabs={[
                            { id: 'vehicles', label: 'Vehicles', icon: Bus },
                            { id: 'bookings', label: 'Bookings', icon: ClipboardList },
                        ]}
                        active={tab}
                        onChange={setTab}
                    />
                ) : null
            }
        >
            {tab === 'vehicles' ? <TransportList /> : <TransportBookings />}
        </PageShell>
    );
};

export default Transport;
