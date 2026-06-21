import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { carregar, salvar } from '../utils/storage';
import { AppTema, PdfTema, TEMA_PADRAO, PDF_TEMA_PADRAO, TEMAS_PRESET, PDF_TEMAS_PRESET } from '../utils/temas';

type ThemeContexto = {
  tema: AppTema;
  pdfTema: PdfTema;
  setTema: (tema: AppTema) => Promise<void>;
  setPdfTema: (tema: PdfTema) => Promise<void>;
  carregando: boolean;
};

const ThemeContext = createContext<ThemeContexto>({
  tema: TEMA_PADRAO,
  pdfTema: PDF_TEMA_PADRAO,
  setTema: async () => {},
  setPdfTema: async () => {},
  carregando: true,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTemaState] = useState<AppTema>(TEMA_PADRAO);
  const [pdfTema, setPdfTemaState] = useState<PdfTema>(PDF_TEMA_PADRAO);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function init() {
      const savedTema = await carregar<AppTema>('appTema');
      const savedPdfTema = await carregar<PdfTema>('pdfTema');
      if (savedTema) {
        // Garante que temas antigos recebem campos novos se houver
        const base = TEMAS_PRESET.find((t) => t.id === savedTema.id) ?? TEMA_PADRAO;
        setTemaState({ ...base, ...savedTema });
      }
      if (savedPdfTema) {
        const base = PDF_TEMAS_PRESET.find((t) => t.id === savedPdfTema.id) ?? PDF_TEMA_PADRAO;
        setPdfTemaState({ ...base, ...savedPdfTema });
      }
      setCarregando(false);
    }
    init();
  }, []);

  async function setTema(novoTema: AppTema) {
    setTemaState(novoTema);
    await salvar('appTema', novoTema);
  }

  async function setPdfTema(novoTema: PdfTema) {
    setPdfTemaState(novoTema);
    await salvar('pdfTema', novoTema);
  }

  const value = useMemo(
    () => ({ tema, pdfTema, setTema, setPdfTema, carregando }),
    [tema, pdfTema, carregando]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThema() {
  return useContext(ThemeContext).tema;
}

export function usePdfTema() {
  return useContext(ThemeContext).pdfTema;
}

export function useThemeContext() {
  return useContext(ThemeContext);
}
