import { useState } from "react";
import { api } from "../services/api";
import { Eye, EyeOff } from "lucide-react";
import PasswordStrength from "../components/PasswordStrength";

export default function Register({
  onSuccess,
}: {
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [marketingAccepted, setMarketingAccepted] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validações frontend
    if (!name || !email || !password || !confirmPassword) {
      setError("Preencha todos os campos obrigatórios");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    if (!termsAccepted || !privacyAccepted) {
      setError("Você deve aceitar os Termos de Uso e a Política de Privacidade");
      return;
    }

    setLoading(true);

    try {
      // 🔥 CRIAR CONTA
      const response = await api.post("/auth/register", {
        name,
        email,
        password,
        confirmPassword,
        phone: phone || null,
        termsAccepted,
        privacyAccepted,
        marketingAccepted,
      });

      // 🔥 SALVAR TOKEN AUTOMATICAMENTE
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        console.log("✅ Token salvo, usuário logado automaticamente");
      }

      // 🔥 IR PARA ONBOARDING (JÁ LOGADO)
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  }

  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  return (
    <>
      <div className="gold-bg" />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-8 text-white">
        <div className="w-full max-w-md">
          <div className="bg-zinc-900/80 rounded-2xl border border-yellow-500/30 p-8">
            <h2 className="text-2xl text-yellow-400 font-semibold mb-6">
              Criar conta gratuita
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* NOME */}
              <div>
                <label className="block text-sm text-zinc-400 mb-1">
                  Nome completo *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-black border border-zinc-700 focus:border-yellow-500 outline-none transition"
                  placeholder="Seu nome"
                />
              </div>

              {/* EMAIL */}
              <div>
                <label className="block text-sm text-zinc-400 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-black border border-zinc-700 focus:border-yellow-500 outline-none transition"
                  placeholder="seu@email.com"
                />
              </div>

              {/* TELEFONE */}
              <div>
                <label className="block text-sm text-zinc-400 mb-1">
                  Telefone/WhatsApp
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-black border border-zinc-700 focus:border-yellow-500 outline-none transition"
                  placeholder="+55 (11) 99999-9999"
                />
              </div>

              {/* SENHA */}
              <div>
                <label className="block text-sm text-zinc-400 mb-1">
                  Senha *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 rounded-lg bg-black border border-zinc-700 focus:border-yellow-500 outline-none transition"
                    placeholder="Mínimo 8 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <PasswordStrength password={password} />
              </div>

              {/* CONFIRMAR SENHA */}
              <div>
                <label className="block text-sm text-zinc-400 mb-1">
                  Confirmar senha *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 rounded-lg bg-black border border-zinc-700 focus:border-yellow-500 outline-none transition"
                    placeholder="Digite a senha novamente"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
                {confirmPassword && (
                  <p
                    className={`text-xs mt-1 ${
                      passwordsMatch ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {passwordsMatch ? "✓ As senhas coincidem" : "✗ As senhas não coincidem"}
                  </p>
                )}
              </div>

              {/* ACEITES */}
              <div className="space-y-3 pt-2">
                <label className="flex items-start gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-1 accent-yellow-500"
                  />
                  <span className="text-sm text-zinc-300 group-hover:text-white transition">
                    Aceito os{" "}
                    <a href="#" className="text-yellow-400 hover:underline">
                      Termos de Uso
                    </a>{" "}
                    *
                  </span>
                </label>

                <label className="flex items-start gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={privacyAccepted}
                    onChange={(e) => setPrivacyAccepted(e.target.checked)}
                    className="mt-1 accent-yellow-500"
                  />
                  <span className="text-sm text-zinc-300 group-hover:text-white transition">
                    Aceito a{" "}
                    <a href="#" className="text-yellow-400 hover:underline">
                      Política de Privacidade
                    </a>{" "}
                    *
                  </span>
                </label>

                <label className="flex items-start gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={marketingAccepted}
                    onChange={(e) => setMarketingAccepted(e.target.checked)}
                    className="mt-1 accent-yellow-500"
                  />
                  <span className="text-sm text-zinc-300 group-hover:text-white transition">
                    Quero receber novidades e ofertas por email
                  </span>
                </label>
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
                {loading ? "Criando conta..." : "Criar conta gratuita"}
              </button>
            </form>

            <p className="text-center text-sm text-zinc-400 mt-6">
              Já tem conta?{" "}
              <button className="text-yellow-400 hover:underline">
                Entrar
              </button>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}