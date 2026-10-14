export function statusBadge(status) {
  const map = {
    placed: 'badge-blue', processing: 'badge-yellow', shipped: 'badge-purple',
    delivered: 'badge-green', cancelled: 'badge-red',
    paid: 'badge-green', pending: 'badge-yellow', failed: 'badge-red', refunded: 'badge-orange',
    preparing: 'badge-gray', in_transit: 'badge-blue', returned: 'badge-red',
    requested: 'badge-blue', approved: 'badge-green', rejected: 'badge-red',
    received: 'badge-purple', completed: 'badge-green', processed: 'badge-green',
    active: 'badge-green', checked_out: 'badge-gray', abandoned: 'badge-red',
  };
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{status?.replace('_', ' ')}</span>;
}

export function Stars({ rating }) {
  return (
    <span>
      {[1,2,3,4,5].map(i => (
        <span key={i} className="star">{i <= rating ? '★' : '☆'}</span>
      ))}
    </span>
  );
}

export function fmt(val) {
  return Number(val).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
}
