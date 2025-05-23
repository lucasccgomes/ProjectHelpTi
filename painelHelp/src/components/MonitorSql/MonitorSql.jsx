import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, getDocs } from "firebase/firestore";

// Gera lista de datas no formato "YYYY-MM-DD"
const gerarDatasUltimosDias = (dias = 60) => {
  const hoje = new Date();
  const datas = [];
  for (let i = 0; i < dias; i++) {
    const data = new Date();
    data.setDate(hoje.getDate() - i);
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");
    datas.push(`${ano}-${mes}-${dia}`);
  }
  return datas;
};

export default function MonitorSql() {
  const [servidores, setServidores] = useState([]);
  const [datas, setDatas] = useState([]);
  const [mensagens, setMensagens] = useState([]);
  const [servidorSelecionado, setServidorSelecionado] = useState(null);
  const [dataSelecionada, setDataSelecionada] = useState(null);
  const [carregandoDatas, setCarregandoDatas] = useState(false);

  useEffect(() => {
    const buscarServidores = async () => {
      const snapshot = await getDocs(collection(db, "logs_mysql"));
      setServidores(snapshot.docs.map((doc) => doc.id));
    };
    buscarServidores();
  }, []);

  const buscarDatas = async (servidor) => {
    setServidorSelecionado(servidor);
    setMensagens([]);
    setDataSelecionada(null);
    setDatas([]);
    setCarregandoDatas(true);

    const datasEncontradas = new Set();
    const datasParaVerificar = gerarDatasUltimosDias(60);

    for (const data of datasParaVerificar) {
      try {
        const snapshot = await getDocs(collection(db, "logs_mysql", servidor, data));
        if (!snapshot.empty) {
          datasEncontradas.add(data);
        }
      } catch (err) {
        // Ignora erros
      }
    }

    setDatas(Array.from(datasEncontradas).sort().reverse());
    setCarregandoDatas(false);
  };

  const buscarMensagens = async (servidor, data) => {
    setDataSelecionada(data);
    const snapshot = await getDocs(collection(db, "logs_mysql", servidor, data));
    const todasMsgs = [];

    snapshot.forEach((doc) => {
      const dados = doc.data();
      if (Array.isArray(dados.mensagens)) {
        dados.mensagens.forEach((msg) => {
          if (
            !msg.includes("Permission denied") &&
            !msg.includes("inotify cannot be used")
          ) {
            todasMsgs.push(`[${doc.id}] ${msg}`);
          }
        });
      }
    });

    setMensagens(todasMsgs);
  };

  return (
    <div className="min-h-screen bg-[#021d6c] text-white p-4 mt-10">
      <h1 className="text-4xl font-bold text-center mb-8">Monitoramento de Logs MySQL</h1>

      {/* Lista de servidores */}
      <div className="mb-6">
        <h2 className="text-2xl mb-2">Servidores:</h2>
        <div className="flex flex-wrap gap-3">
          {servidores.map((srv) => (
            <button
              key={srv}
              onClick={() => buscarDatas(srv)}
              className={`px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 transition ${
                srv === servidorSelecionado ? "ring-2 ring-white" : ""
              }`}
            >
              {srv}
            </button>
          ))}
        </div>
      </div>

      {/* Carregando datas */}
      {carregandoDatas && (
        <div className="flex justify-center items-center mt-10">
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-lg">Buscando datas...</span>
        </div>
      )}

      {/* Lista de datas */}
      {!carregandoDatas && datas.length > 0 && (
        <div className="mb-6 mt-6">
          <h2 className="text-2xl mb-2">Datas:</h2>
          <div className="flex flex-wrap gap-3">
            {datas.map((dt) => (
              <button
                key={dt}
                onClick={() => buscarMensagens(servidorSelecionado, dt)}
                className={`px-4 py-2 rounded bg-green-500 hover:bg-green-600 transition ${
                  dt === dataSelecionada ? "ring-2 ring-white" : ""
                }`}
              >
                {dt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Exibição dos logs */}
      {mensagens.length > 0 && (
        <div className="bg-black p-4 rounded shadow-md overflow-y-auto max-h-[500px] font-mono text-sm whitespace-pre-wrap">
          {mensagens.map((msg, index) => (
            <div key={index} className="text-green-400">{msg}</div>
          ))}
        </div>
      )}
    </div>
  );
}
