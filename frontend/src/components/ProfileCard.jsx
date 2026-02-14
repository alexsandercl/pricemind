export default function ProfileCard({ profile, credits }) {
  return (
    <div className="bg-white rounded-xl shadow p-5 flex flex-col gap-2">
      <h2 className="text-lg font-semibold">Perfil</h2>

      <p><strong>Nome:</strong> {profile?.name}</p>
      <p><strong>Plano:</strong> {profile?.plan}</p>
      <p><strong>Créditos:</strong> {credits}</p>
    </div>
  );
}
