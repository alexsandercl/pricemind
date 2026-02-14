type Strength = "weak" | "medium" | "strong" | null;

export default function PasswordStrength({
  password,
}: {
  password: string;
}) {
  function calculateStrength(pwd: string): Strength {
    if (!pwd) return null;

    let strength = 0;

    if (pwd.length >= 8) strength += 20;
    if (pwd.length >= 12) strength += 20;
    if (/[a-z]/.test(pwd)) strength += 15;
    if (/[A-Z]/.test(pwd)) strength += 15;
    if (/[0-9]/.test(pwd)) strength += 15;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) strength += 15;

    if (strength <= 40) return "weak";
    if (strength <= 70) return "medium";
    return "strong";
  }

  const strength = calculateStrength(password);

  if (!strength) return null;

  const config = {
    weak: {
      label: "Fraca",
      color: "bg-red-500",
      width: "w-1/3",
    },
    medium: {
      label: "Média",
      color: "bg-yellow-500",
      width: "w-2/3",
    },
    strong: {
      label: "Forte",
      color: "bg-green-500",
      width: "w-full",
    },
  };

  const current = config[strength];

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2 mb-1">
        <div className="flex-1 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${current.color} transition-all duration-300 ${current.width}`}
          />
        </div>
        <span className={`text-xs font-medium ${
          strength === "weak"
            ? "text-red-400"
            : strength === "medium"
            ? "text-yellow-400"
            : "text-green-400"
        }`}>
          {current.label}
        </span>
      </div>
    </div>
  );
}