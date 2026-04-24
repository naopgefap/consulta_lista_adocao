import { useState, ChangeEvent } from "react";
import { Search, Info, User, FileText, Phone, MapPin, PawPrint, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Papa from "papaparse";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface FilaAdocaoData {
  cpf: string;
  nome: string;
  posicao: number;
  processo: string;
  contato: string;
  obs: string;
}

export default function App() {
  const [documento, setDocumento] = useState("");
  const [result, setResult] = useState<FilaAdocaoData | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatDocument = (value: string) => {
    const digits = value.replace(/\D/g, "");
    
    if (digits.length <= 11) {
      // Máscara de CPF
      return digits
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})/, "$1-$2")
        .replace(/(-\d{2})\d+?$/, "$1");
    } else {
      // Máscara de CNPJ
      return digits
        .replace(/(\d{2})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2")
        .replace(/(-\d{2})\d+?$/, "$1");
    }
  };

  const handleDocumentChange = (e: ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDocument(e.target.value);
    if (formatted.length <= 18) {
      setDocumento(formatted);
      setError(null);
    }
  };

  const handleSearch = async () => {
    if (documento.length !== 14 && documento.length !== 18) {
      setError("Por favor, insira um CPF ou CNPJ válido.");
      return;
    }

    setIsSearching(true);
    setResult(null);
    setError(null);

    try {
      const SHEET_URL = "https://docs.google.com/spreadsheets/d/1Hb-XF5rezGLJwhMRX8lY7WKiNIhYpsEj7FnIoEUn1EU/export?format=csv";
      const response = await fetch(SHEET_URL);
      
      if (!response.ok) {
        throw new Error("Não foi possível acessar a planilha.");
      }

      let csvText = await response.text();

      // A planilha tem um título na primeira linha, precisamos removê-la para o PapaParse entender o cabeçalho real
      const lines = csvText.split('\n');
      if (lines[0].toLowerCase().includes('lista de adotantes')) {
        lines.shift();
      }
      csvText = lines.join('\n');

      const parseResult = Papa.parse(csvText, { 
        header: true, 
        skipEmptyLines: true 
      });

      const rows: any[] = parseResult.data;
      const found = rows.find(row => row['CPF'] === documento);

      if (found) {
        setResult({
          cpf: found['CPF'],
          nome: found['Nome do Demandante'],
          posicao: parseInt(found['Posíção'], 10),
          processo: found['N° do Processo'],
          contato: found['Tentativa de Contato'],
          obs: found['Observações'] || 'Sem observações'
        });
      } else {
        setError("Nenhum registro encontrado para este documento na fila de espera.");
      }
    } catch (err) {
      console.error("Erro ao buscar dados:", err);
      setError("Ocorreu um erro ao conectar à planilha. Tente novamente mais tarde.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 md:p-8 relative">
      {/* Header Section */}
      <header className="w-full max-w-4xl mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-stretch gap-4 md:gap-5">
          <div className="w-[100px] h-[100px] md:w-[128px] md:h-[128px] shrink-0 bg-seagri-primary rounded-2xl md:rounded-[24px] flex items-center justify-center text-white shadow-lg shadow-seagri-primary/20 p-3 md:p-5">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/e/e0/Bras%C3%A3o_do_Distrito_Federal_%28Brasil%29.svg" 
              alt="Brasão do Distrito Federal" 
              className="w-full h-full object-contain drop-shadow-sm"
            />
          </div>
          <div className="flex flex-col justify-between py-1">
            <div>
              <h1 className="text-[22px] md:text-[32px] font-display font-bold text-[#05234D] tracking-tight leading-none mb-1">
                Secretaria de Agricultura
              </h1>
              <h2 className="text-xs md:text-[17px] text-slate-800 font-normal tracking-wide leading-none mb-3.5">
                Abastecimento e Desenvolvimento Rural
              </h2>
              <p className="text-xs md:text-[16px] font-bold text-[#05234D] tracking-tight">
                SUPROA - Subsecretaria de Proteção aos Animais de Produção
              </p>
            </div>
            <div className="mt-auto pt-2">
              <div className="inline-flex items-center gap-2 bg-seagri-primary/10 text-seagri-primary px-3 py-1.5 rounded-full text-xs md:text-[13px] font-bold w-fit">
                <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-seagri-primary animate-pulse" />
                Lista de Espera: Adoção de Animais
              </div>
            </div>
          </div>
        </div>
        <div className="hidden md:block text-right">
          <p className="text-xs text-slate-400 font-mono uppercase tracking-widest">Governo do Distrito Federal</p>
        </div>
      </header>

      <main className="w-full max-w-4xl space-y-6">
        {/* Search Card */}
        <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-seagri-dark via-seagri-secondary to-seagri-primary" />
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-display flex items-center gap-2">
              <Search className="text-seagri-primary" size={20} />
              Consulta de Posição
            </CardTitle>
            <CardDescription>
              Digite o CPF ou CNPJ para verificar a situação na fila de espera.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="documento" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  CPF / CNPJ do Requerente
                </Label>
                <Input
                  id="documento"
                  value={documento}
                  onChange={handleDocumentChange}
                  className="text-lg h-12 border-slate-200 focus:ring-seagri-primary focus:border-seagri-primary"
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={isSearching}
                className="md:self-end h-12 px-8 bg-seagri-primary hover:bg-seagri-secondary text-white font-semibold transition-all duration-300 shadow-lg shadow-seagri-primary/20"
              >
                {isSearching ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Buscando...
                  </div>
                ) : (
                  "Consultar Agora"
                )}
              </Button>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-600 text-sm"
                >
                  <AlertCircle size={16} />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <Card className="border-none shadow-2xl shadow-seagri-primary/5 overflow-hidden">
                <div className="bg-gradient-to-br from-seagri-dark to-seagri-secondary p-8 text-white">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-1">
                      <p className="text-white/70 text-xs font-bold uppercase tracking-[0.2em]">Nome do Candidato</p>
                      <h2 className="text-2xl md:text-4xl font-display font-bold leading-tight uppercase">
                        {result.nome}
                      </h2>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 flex flex-col items-center min-w-[140px]">
                      <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1">Posição na Fila</p>
                      <span className="text-5xl font-display font-black tracking-tighter">
                        #{result.posicao}
                      </span>
                    </div>
                  </div>
                </div>

                <CardContent className="p-0">
                  <div className="grid grid-cols-1 md:grid-cols-2">
                    <div className="p-6 md:p-8 space-y-6 border-b md:border-b-0 md:border-r border-slate-100">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-slate-100 rounded-lg text-seagri-secondary">
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Número do Processo</p>
                          <p className="text-slate-700 font-semibold font-mono">{result.processo}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-slate-100 rounded-lg text-seagri-secondary">
                          <Phone size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Status do Contato</p>
                          <Badge variant="secondary" className="bg-seagri-primary/10 text-seagri-primary border-none font-semibold">
                            {result.contato}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 md:p-8 bg-slate-50/50 space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-slate-100 rounded-lg text-seagri-secondary">
                          <Info size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Observações</p>
                          <p className="text-slate-600 leading-relaxed italic">
                            "{result.obs}"
                          </p>
                        </div>
                      </div>

                      <div className="pt-4">
                        <div className="p-4 bg-seagri-primary/5 border border-seagri-primary/10 rounded-xl flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-seagri-primary/20 flex items-center justify-center text-seagri-primary">
                            <MapPin size={18} />
                          </div>
                          <p className="text-xs text-seagri-secondary font-medium">
                            Local: Secretaria de Agricultura, Abastecimento e Desenvolvimento Rural - DF
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : !isSearching && !error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-slate-300"
            >
              <div className="w-24 h-24 rounded-full border-4 border-dashed border-slate-200 flex items-center justify-center mb-4">
                <User size={40} />
              </div>
              <p className="text-center max-w-xs font-medium">
                Aguardando consulta. Insira o CPF ou CNPJ acima para ver os detalhes.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="mt-auto pt-12 pb-6 text-center">
        <Separator className="mb-6 w-24 mx-auto bg-slate-200" />
        <p className="text-xs text-slate-400 font-medium tracking-wide">
          © 2026 SEAGRI-DF • Sistema de Gestão de Adoção
        </p>
      </footer>
    </div>
  );
}
