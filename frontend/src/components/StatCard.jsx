export default function StatCard({ title, value }) {
  return (
    <div className="bg-white rounded-xl shadow p-5">
      <p className="text-gray-500 text-sm">{title}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
