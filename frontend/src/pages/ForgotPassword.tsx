import { useState } from "react";
import { api } from "../services/api";

export default function ForgotPassword({
  onBack,
}: {
  onBack: () => void;
}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!email) {
      setError("Digite seu email");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/forgot-password", { email });
      setSuccess(true);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Erro ao enviar email de recuperação"
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
            {!success ? (
              <>
                <h2 className="text-2xl text-yellow-400 font-semibold mb-2">
                  Recuperar senha
                </h2>
                <p className="text-zinc-400 text-sm mb-6">
                  Digite seu email e enviaremos instruções para
                  redefinir sua senha.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-black border border-zinc-700 focus:border-yellow-500 outline-none transition"
                      placeholder="seu@email.com"
                    />
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                      <p className="text-red-400 text-sm">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-lg bg-yellow-500 text-black font-semibold hover:bg-yellow-400 transition disabled:opacity-50"
                  >
                    {loading
                      ? "Enviando..."
                      : "Enviar email de recuperação"}
                  </button>
                </form>

                <button
                  onClick={onBack}
                  className="w-full mt-4 text-sm text-zinc-400 hover:text-white transition"
                >
                  ← Voltar para login
                </button>
              </>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">✓</span>
                </div>

                <h2 className="text-2xl font-semibold mb-3">
                  Email enviado!
                </h2>

                <p className="text-zinc-400 text-sm mb-6">
                  Verifique sua caixa de entrada e siga as
                  instruções para redefinir sua senha.
                </p>

                <button
                  onClick={onBack}
                  className="w-full py-3 rounded-lg bg-yellow-500 text-black font-semibold hover:bg-yellow-400 transition"
                >
                  Voltar para login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}