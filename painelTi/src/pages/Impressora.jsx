import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { collection, getDocs, doc, getDoc, addDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { format, differenceInDays, parseISO } from 'date-fns';

Modal.setAppElement('#root');

const Impressora = () => {
  const [impressoras, setImpressoras] = useState({});
  const [selectedImpressora, setSelectedImpressora] = useState("");
  const [quantidade, setQuantidade] = useState(0);
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [relatorio, setRelatorio] = useState([]);
  const [contagemInicial, setContagemInicial] = useState(0);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [mediaDiaria, setMediaDiaria] = useState(0);
  const [mediaMensal, setMediaMensal] = useState(0);
  const [impressorasSemContagem, setImpressorasSemContagem] = useState([]);
  const [showMessage, setShowMessage] = useState(false);
  const [exibirRelatorio, setExibirRelatorio] = useState(null);

  useEffect(() => {
    const fetchImpressoras = async () => {
      const docRef = doc(db, "impressoras", "list");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const impressorasData = docSnap.data();
        setImpressoras(impressorasData);

        // Verificar impressoras sem contagem inicial
        const semContagem = [];
        Object.keys(impressorasData).forEach(loja => {
          Object.keys(impressorasData[loja]).forEach(impressora => {
            if (!impressorasData[loja][impressora].contagem) {
              semContagem.push({ loja, impressora });
            }
          });
        });
        setImpressorasSemContagem(semContagem);
        setShowMessage(semContagem.length > 0);
      } else {
        console.log("No such document!");
      }
    };

    fetchImpressoras();
  }, []);

  const handleAddImpressao = async (e) => {
    e.preventDefault();
    if (selectedImpressora && quantidade && data) {
      const [loja, impressora] = selectedImpressora.split('.');

      const relatorioRef = collection(db, `impressoras/relatorios/${loja}/${impressora}/relatorios`);
      const novoRelatorio = { quantidade: Number(quantidade), data: new Date(data) };
      await addDoc(relatorioRef, novoRelatorio);

      setSelectedImpressora("");
      setQuantidade(0);
      setData(new Date().toISOString().split('T')[0]);

      // Recarregar os relatórios para a impressora selecionada
      await handleSelectImpressora(loja, impressora);
    }
  };

  const handleSelectImpressora = async (loja, impressora) => {
    const impressoraData = impressoras[loja][impressora];
    const impressoraId = `${loja}.${impressora}`;

    if (exibirRelatorio === impressoraId) {
      setExibirRelatorio(null);
      return;
    }

    setSelectedImpressora(impressoraId);
    setExibirRelatorio(impressoraId);

    if (!impressoraData.contagem) {
      setShowMessage(true);
    } else {
      setContagemInicial(impressoraData.contagem);
      await fetchRelatorio(loja, impressora, impressoraData.contagem);
    }
  };

  const fetchRelatorio = async (loja, impressora, contagemInicial) => {
    const relatorioRef = collection(db, `impressoras/relatorios/${loja}/${impressora}/relatorios`);
    const querySnapshot = await getDocs(relatorioRef);
    const historico = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Ordenar por data
    historico.sort((a, b) => a.data.toDate() - b.data.toDate());

    // Calcular consumo mensal baseado na diferença entre os totais registrados
    const consumoMensal = historico.map((entry, index, arr) => {
      if (index === 0) {
        return {
          ...entry,
          consumo: entry.quantidade - contagemInicial
        };
      } else {
        return {
          ...entry,
          consumo: entry.quantidade - arr[index - 1].quantidade
        };
      }
    });

    setRelatorio(consumoMensal);

    // Calcular médias corrigidas
    const totalConsumo = consumoMensal.reduce((acc, entry) => acc + entry.consumo, 0);
    const totalDias = historico.length > 1 ? differenceInDays(new Date(), historico[0].data.toDate()) : 1;
    const mediaDiaria = totalConsumo / totalDias;
    const mediaMensal = mediaDiaria * 30;

    setMediaDiaria(mediaDiaria);
    setMediaMensal(mediaMensal);
  };

  const handleSetContagemInicial = async () => {
    if (selectedImpressora && contagemInicial) {
      const [loja, impressora] = selectedImpressora.split('.');
      const impressoraData = impressoras[loja][impressora];
      impressoraData.contagem = contagemInicial;

      const impressoraRef = doc(db, "impressoras", "list");
      const docSnap = await getDoc(impressoraRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        data[loja][impressora] = impressoraData;
        await setDoc(impressoraRef, data);
      }

      setModalIsOpen(false);
      setContagemInicial(0);
      setSelectedImpressora("");

      // Recarregar os relatórios para a impressora selecionada
      await handleSelectImpressora(loja, impressora);

      // Atualizar impressoras sem contagem inicial
      const updatedSemContagem = impressorasSemContagem.filter(item => !(item.loja === loja && item.impressora === impressora));
      setImpressorasSemContagem(updatedSemContagem);
      if (updatedSemContagem.length === 0) {
        setShowMessage(false);
      }
    }
  };

  const handleShowModal = () => {
    setModalIsOpen(true);
    setShowMessage(false);
  };

  return (
    <div className="container mx-auto p-4 pt-20">
      <h1 className="text-2xl font-bold mb-4">Controle de Impressoras</h1>

      <form onSubmit={handleAddImpressao} className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block mb-1 font-semibold">Selecionar Impressora</label>
            <select
              value={selectedImpressora}
              onChange={(e) => handleSelectImpressora(...e.target.value.split('.'))}
              className="w-full border border-gray-300 p-2 rounded focus:ring focus:ring-blue-200"
              required
            >
              <option value="">Selecione uma Impressora</option>
              {Object.keys(impressoras).map((loja) =>
                Object.keys(impressoras[loja]).map((impressora) => (
                  <option key={`${loja}.${impressora}`} value={`${loja}.${impressora}`}>
                    {impressora} ({loja})
                  </option>
                ))
              )}
            </select>
          </div>
          <div>
            <label className="block mb-1 font-semibold">Quantidade de Impressões</label>
            <input
              type="number"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded focus:ring focus:ring-blue-200"
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Data</label>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded focus:ring focus:ring-blue-200"
              required
            />
          </div>
        </div>
        <button
          type="submit"
          className="mt-4 w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 focus:outline-none focus:ring focus:ring-blue-200"
        >
          Adicionar Impressão
        </button>
      </form>

      {showMessage && (
        <div className="mb-4 p-4 bg-yellow-100 text-yellow-800 border border-yellow-300 rounded cursor-pointer" onClick={handleShowModal}>
          <p>Algumas impressoras estão sem contagem inicial</p>
        </div>
      )}

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => setModalIsOpen(false)}
        contentLabel="Definir Contagem Inicial"
        className="modal-content p-8 bg-white border border-gray-300 rounded shadow-lg max-w-md mx-auto"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
      >
        <h2 className="text-xl font-bold mb-4">Definir Contagem Inicial</h2>
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Selecionar Impressora</label>
          <select
            value={selectedImpressora}
            onChange={(e) => setSelectedImpressora(e.target.value)}
            className="w-full border border-gray-300 p-2 rounded focus:ring focus:ring-blue-200"
            required
          >
            <option value="">Selecione uma Impressora</option>
            {impressorasSemContagem.map(({ loja, impressora }) => (
              <option key={`${loja}.${impressora}`} value={`${loja}.${impressora}`}>
                {impressora} ({loja})
              </option>
            ))}
          </select>
        </div>
        <input
          type="number"
          value={contagemInicial}
          onChange={(e) => setContagemInicial(e.target.value)}
          className="w-full border border-gray-300 p-2 rounded mb-4 focus:ring focus:ring-blue-200"
          placeholder="Insira a contagem inicial"
          required
        />
        <button
          onClick={handleSetContagemInicial}
          className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 focus:outline-none focus:ring focus:ring-green-200"
        >
          Salvar
        </button>
      </Modal>

      <div>
        {Object.keys(impressoras).map((loja) =>
          Object.keys(impressoras[loja]).map((impressora) => (
            <div key={`${loja}.${impressora}`} className="mb-4">
              <button
                onClick={() => handleSelectImpressora(loja, impressora)}
                className="w-full bg-gray-200 text-black p-2 rounded hover:bg-gray-300 focus:outline-none focus:ring focus:ring-gray-200"
              >
                {impressora} ({loja})
              </button>
              {exibirRelatorio === `${loja}.${impressora}` && (
                <div className="mt-4 p-4 bg-white border border-gray-300 rounded">
                  <h3 className="text-lg font-bold mb-2">Relatório de Consumo</h3>
                  {relatorio.length > 0 ? (
                    relatorio.map((entry, index) => (
                      <div key={index} className="mb-2">
                        <p className="text-sm font-bold">Data: {format(entry.data.toDate(), 'dd/MM/yyyy')}</p>
                        <p className="text-sm">Total: {entry.quantidade}</p>
                        <p className="text-sm">Consumo: {entry.consumo}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">Sem registros de consumo.</p>
                  )}
                  <div className="mt-2">
                    <p className="text-sm font-semibold">Média de Consumo Diário: {mediaDiaria.toFixed(2)}</p>
                    <p className="text-sm font-semibold">Média de Consumo Mensal: {mediaMensal.toFixed(2)}</p>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Impressora;
