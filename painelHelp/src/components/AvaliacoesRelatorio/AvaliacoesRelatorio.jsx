import React, { useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase";
import MyModal from "../MyModal/MyModal";

const AvaliacoesRelatorio = () => {
  const [lojaSelecionada, setLojaSelecionada] = useState("Drogalira 02");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [resultados, setResultados] = useState(null);
  const [avaliacoesDetalhadas, setAvaliacoesDetalhadas] = useState([]); // Estado para avaliações completas
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedObservacao, setSelectedObservacao] = useState("");
  const [mensagemWhatsApp, setMensagemWhatsApp] = useState("");
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);

  const handleVerTudo = (observacao) => {
    setSelectedObservacao(observacao);
    setIsModalOpen(true);
  };

  const buscarAvaliacoes = async () => {
    if (!dataInicio || !dataFim) {
      alert("Por favor, selecione o período de datas.");
      console.log("Erro: Período de datas não informado.");
      return;
    }

    console.log("Buscando avaliações...");
    console.log("Loja selecionada:", lojaSelecionada);
    console.log("Período:", dataInicio, "até", dataFim);

    try {
      const inicio = new Date(dataInicio).toISOString();
      const fim = new Date(dataFim).toISOString();

      const colecaoRef = collection(db, "webPanfleto", "gerenciadorAvaliacao", lojaSelecionada);
      const q = query(
        colecaoRef,
        where("dados.data", ">=", inicio),
        where("dados.data", "<=", fim)
      );

      const querySnapshot = await getDocs(q);

      let totalAvaliacoes = 0;
      let somaAtendente = 0;
      let somaCaixa = 0;
      let somaLoja = 0;

      const distribuicaoNotas = {};
      const avaliacoes = []; // Array para armazenar avaliações completas

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const { avaliacaoAtendente, avaliacaoCaixa, avaliacaoLoja } = data.avaliacao.loja;
        const observacao = data.avaliacao.loja.observacao || "Sem observação"; // Corrige o acesso        
        const { nome, telefone, data: dataRegistro } = data.dados;

        totalAvaliacoes++;
        somaAtendente += avaliacaoAtendente;
        somaCaixa += avaliacaoCaixa;
        somaLoja += avaliacaoLoja;

        [avaliacaoAtendente, avaliacaoCaixa, avaliacaoLoja].forEach((nota) => {
          distribuicaoNotas[nota] = (distribuicaoNotas[nota] || 0) + 1;
        });

        avaliacoes.push({
          nome,
          telefone,
          loja: lojaSelecionada,
          avaliacaoAtendente,
          avaliacaoCaixa,
          avaliacaoLoja,
          data: new Date(dataRegistro).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
          observacao,
        });
      });

      const mediaAtendente = somaAtendente / totalAvaliacoes || 0;
      const mediaCaixa = somaCaixa / totalAvaliacoes || 0;
      const mediaLoja = somaLoja / totalAvaliacoes || 0;

      setResultados({
        totalAvaliacoes,
        mediaAtendente,
        mediaCaixa,
        mediaLoja,
        distribuicaoNotas,
      });

      setAvaliacoesDetalhadas(avaliacoes); // Define avaliações completas no estado
    } catch (error) {
      console.error("Erro ao buscar avaliações:", error);
      alert("Erro ao buscar avaliações. Verifique o console para mais detalhes.");
    }
  };

  return (
    <div className="p-4 pt-16 min-h-screen bg-altBlue">
      <div className="bg-primaryBlueDark rounded-2xl shadow-xl">
        <h2 className="text-2xl font-semibold mb-4 text-center text-white">Consulta de Avaliações</h2>

        {/* Filtros */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-4 mb-6 pb-2">
          <div className="flex flex-col">
            <label className="font-medium text-center text-white">Selecione a loja</label>
            <select
              value={lojaSelecionada}
              onChange={(e) => setLojaSelecionada(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg"
            >
              <option value="Drogalira 01">Drogalira 01</option>
              <option value="Drogalira 02">Drogalira 02</option>
              <option value="Drogalira 03">Drogalira 03</option>
              <option value="Drogalira 04">Drogalira 04</option>
              <option value="Drogalira 05">Drogalira 05</option>
              <option value="Drogalira 06">Drogalira 06</option>
              <option value="Drogalira 07">Drogalira 07</option>
              <option value="Drogalira 08">Drogalira 08</option>
              <option value="Drogalira 09">Drogalira 09</option>
              <option value="Drogalira 10">Drogalira 10</option>
              <option value="Drogalira 11">Drogalira 11</option>
              <option value="Drogalira 12">Drogalira 12</option>
              <option value="Drogalira 13">Drogalira 13</option>
              <option value="Drogalira 14">Drogalira 14</option>
              <option value="Drogalira 16">Drogalira 16</option>
              <option value="Drogalira 17">Drogalira 17</option>
              <option value="Drogalira 18">Drogalira 18</option>
              <option value="Drogalira 19">Drogalira 19</option>
              <option value="Drogalira 20">Drogalira 20</option>
              <option value="Drogalira 21">Drogalira 21</option>
              <option value="Drogalira 22">Drogalira 22</option>
              <option value="Drogalira 23">Drogalira 23</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="font-medium text-center text-white">Data de Início</label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="flex flex-col">
            <label className="font-medium text-center text-white">Data de Fim</label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="flex items-center mt-6">
            <button
              onClick={buscarAvaliacoes}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
            >
              Buscar
            </button>
          </div>
        
        </div>
      </div>

      {/* Resultados */}
      {resultados && (
        <div className="bg-white shadow-md rounded-lg p-4 mt-4">
          <h3 className="text-lg font-bold text-center mb-4">
            Resultados da {lojaSelecionada}
          </h3>
          <div className="flex justify-center gap-4">
            <p className="mb-2 bg-primaryBlueDark text-white p-2 rounded-md">
              <strong>Total de Avaliações:</strong> {resultados.totalAvaliacoes}
            </p>
            <p className="mb-2 bg-purple-700 text-white p-2 rounded-md">
              <strong>Média de Atendente:</strong> {resultados.mediaAtendente.toFixed(2)}
            </p>
            <p className="mb-2 bg-orange-600 text-white p-2 rounded-md">
              <strong>Média de Caixa:</strong> {resultados.mediaCaixa.toFixed(2)}
            </p>
            <p className="mb-2 bg-green-800 text-white p-2 rounded-md">
              <strong>Média de Loja:</strong> {resultados.mediaLoja.toFixed(2)}
            </p>
          </div>
          <h4 className="font-bold mt-4">Avaliações Detalhadas:</h4>
          <table className="w-full text-sm text-left text-gray-700 mt-4 border">
            <thead>
              <tr className="bg-gray-200">
                <th className="px-4 py-2">Nome</th>
                <th className="px-4 py-2">Telefone</th>
                <th className="px-4 py-2">Loja</th>
                <th className="px-4 py-2">Atendente</th>
                <th className="px-4 py-2">Caixa</th>
                <th className="px-4 py-2">Loja</th>
                <th className="px-4 py-2">Data</th>
                <th className="px-4 py-2">Observação</th>
              </tr>
            </thead>
            <tbody>
              {avaliacoesDetalhadas.map((avaliacao, index) => {
                        return (
                  <tr key={index} className="border-t">
                    <td className="px-4 py-2">{avaliacao.nome}</td>
                    <td className="px-4 py-2 flex gap-2 items-center">
                      {avaliacao.telefone}
                      
                    </td>
                    <td className="px-4 py-2">{avaliacao.loja}</td>
                    <td className="px-4 py-2">{avaliacao.avaliacaoAtendente}</td>
                    <td className="px-4 py-2">{avaliacao.avaliacaoCaixa}</td>
                    <td className="px-4 py-2">{avaliacao.avaliacaoLoja}</td>
                    <td className="px-4 py-2">{avaliacao.data}</td>
                    <td className="px-4 max-w-[200px] py-2 truncate whitespace-nowrap overflow-hidden">
                      {avaliacao.observacao.length > 20 ? (
                        <>
                          {avaliacao.observacao.substring(0, 20)}...
                          <button
                            className="text-blue-500 underline ml-2"
                            onClick={() => handleVerTudo(avaliacao.observacao)}
                          >
                            Ver tudo
                          </button>
                        </>
                      ) : (
                        avaliacao.observacao
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <MyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h3 className="text-lg font-semibold mb-4">Observação Completa</h3>
        <p className="text-gray-700 py-2 break-words overflow-hidden text-ellipsis">{selectedObservacao}</p>
      </MyModal>
      <MyModal isOpen={isWhatsAppModalOpen} onClose={() => setIsWhatsAppModalOpen(false)}>
        <h3 className="text-lg font-semibold mb-4">
          
        </h3>
      
        <textarea
          className="w-full p-2 border border-gray-300 rounded-lg mb-4"
          rows="4"
          placeholder="Escreva sua mensagem..."
          value={mensagemWhatsApp}
          onChange={(e) => setMensagemWhatsApp(e.target.value)}
        />
        <button
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
          
        >
          Enviar Mensagem
        </button>
      </MyModal>
    </div>
  );
};

export default AvaliacoesRelatorio;
