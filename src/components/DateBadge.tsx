export default function DateBadge({ date }: { date: string | null }) {
  if (!date) return <span className="dbadge"><i className="fa-solid fa-calendar-days" /></span>;
  const d = new Date(date + 'T00:00:00Z');
  return (
    <span className="dbadge"><b>{d.toLocaleDateString('en-PH', { month: 'short', timeZone: 'UTC' })}</b><strong>{d.getUTCDate()}</strong></span>
  );
}
