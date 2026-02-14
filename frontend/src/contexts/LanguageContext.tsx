import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "pt-BR" | "en-US";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, any> = {
  "pt-BR": {
    "common": {
      "loading": "Carregando...",
      "save": "Salvar",
      "cancel": "Cancelar",
      "back": "Voltar",
      "logout": "Sair",
      "upgrade": "Fazer upgrade",
      "soon": "Em breve",
      "yes": "Sim",
      "no": "Não"
    },
    "profile": {
      "title": "Perfil",
      "photoTitle": "Foto de perfil",
      "changePhoto": "Alterar foto",
      "removePhoto": "Remover",
      "accountInfo": "Informações da conta",
      "name": "Nome",
      "currentPlan": "Plano atual",
      "analysesCompleted": "Análises realizadas",
      "statistics": "Estatísticas",
      "accountStatus": "Status da conta",
      "active": "Ativa",
      "lastAccess": "Último acesso",
      "preferences": "Preferências",
      "theme": "Tema",
      "themeDark": "Escuro",
      "themeLight": "Claro",
      "themeSystem": "Sistema",
      "language": "Idioma",
      "languagePortuguese": "Português (BR)",
      "languageEnglish": "English (US)",
      "savePreferences": "Salvar preferências",
      "saving": "Salvando...",
      "preferencesSaved": "Preferências salvas com sucesso! ✓",
      "preferencesSaveError": "Erro ao salvar preferências ✗"
    },
    "home": {
      "planFree": "Free",
      "planPro": "Pro 💎",
      "planBusiness": "Business 🚀"
    }
  },
  "en-US": {
    "common": {
      "loading": "Loading...",
      "save": "Save",
      "cancel": "Cancel",
      "back": "Back",
      "logout": "Logout",
      "upgrade": "Upgrade",
      "soon": "Coming soon",
      "yes": "Yes",
      "no": "No"
    },
    "profile": {
      "title": "Profile",
      "photoTitle": "Profile photo",
      "changePhoto": "Change photo",
      "removePhoto": "Remove",
      "accountInfo": "Account information",
      "name": "Name",
      "currentPlan": "Current plan",
      "analysesCompleted": "Completed analyses",
      "statistics": "Statistics",
      "accountStatus": "Account status",
      "active": "Active",
      "lastAccess": "Last access",
      "preferences": "Preferences",
      "theme": "Theme",
      "themeDark": "Dark",
      "themeLight": "Light",
      "themeSystem": "System",
      "language": "Language",
      "languagePortuguese": "Português (BR)",
      "languageEnglish": "English (US)",
      "savePreferences": "Save preferences",
      "saving": "Saving...",
      "preferencesSaved": "Preferences saved successfully! ✓",
      "preferencesSaveError": "Error saving preferences ✗"
    },
    "home": {
      "planFree": "Free",
      "planPro": "Pro 💎",
      "planBusiness": "Business 🚀"
    }
  }
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("pt-BR");

  useEffect(() => {
    const saved = localStorage.getItem("language") as Language;
    if (saved && (saved === "pt-BR" || saved === "en-US")) {
      setLanguageState(saved);
    }
  }, []);

  function setLanguage(lang: Language) {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
  }

  function t(key: string, params?: Record<string, string | number>): string {
    const keys = key.split(".");
    let value: any = translations[language];

    for (const k of keys) {
      value = value?.[k];
    }

    if (typeof value !== "string") {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }

    if (params) {
      return value.replace(/\{\{(\w+)\}\}/g, (_, paramKey) => {
        return String(params[paramKey] ?? `{{${paramKey}}}`);
      });
    }

    return value;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within LanguageProvider");
  }
  return context;
}
