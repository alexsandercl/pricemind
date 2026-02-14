import { useState, useEffect } from "react";
import { api } from "../services/api";

export default function ResetPassword({
  onSuccess,
}: {
  onSuccess: () => void;
}) {
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Pegar token da URL
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get("token");
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setError("Token inválido ou ausente");
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!newPassword || !confirmPassword) {
      setError("Preencha todos os campos");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    if (newPassword.length < 8) {
      setError("A senha deve ter no mínimo 8 caracteres");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/reset-password", {
        token,
        newPassword,
      });

      onSuccess();
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Erro ao redefinir senha"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="gold-bg" />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-8 text-white">
        <div className="w-full max-w-md">
          <div className="bg-zinc-900/80 rounded-2xl border border-yellow-500/30 p-8">
            <h2 className="text-2xl text-yellow-400 font-semibold mb-2">
              Nova senha
            </h2>
            <p className="text-zinc-400 text-sm mb-6">
              Digite sua nova senha abaixo.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">
                  Nova senha
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-black border border-zinc-700 focus:border-yellow-500 outline-none transition"
                  placeholder="Mínimo 8 caracteres"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">
                  Confirmar nova senha
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  className="w-full px-4 py-3 rounded-lg bg-black border border-zinc-700 focus:border-yellow-500 outline-none transition"
                  placeholder="Digite a senha novamente"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !token}
                className="w-full py-3 rounded-lg bg-yellow-500 text-black font-semibold hover:bg-yellow-400 transition disabled:opacity-50"
              >
                {loading ? "Redefinindo..." : "Redefinir senha"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}