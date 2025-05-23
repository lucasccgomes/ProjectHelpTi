import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import Dropdown from '../Dropdown/Dropdown';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


const RelatorioConsumoTi = () => {
  const [categorias, setCategorias] = useState([]);
  const [lojas, setLojas] = useState([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('');
  const [lojaSelecionada, setLojaSelecionada] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [relatorio, setRelatorio] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [itensDaCategoria, setItensDaCategoria] = useState([]);
  const [dadosFiltrados, setDadosFiltrados] = useState([]);


  // Carrega categorias e lojas disponíveis
  useEffect(() => {
    const fetchCategorias = async () => {
      const estoqueRef = doc(db, 'estoqueTi', 'estoque');
      const snapshot = await getDoc(estoqueRef);
      if (snapshot.exists()) {
        const dados = snapshot.data();
        setCategorias(Object.keys(dados));
      }
    };

    const fetchLojas = async () => {
      const cidadesRef = doc(db, 'ordersControl', 'cidades');
      const snapshot = await getDoc(cidadesRef);
      if (snapshot.exists()) {
        const data = snapshot.data();
        const todasLojas = Object.values(data).flat();
        setLojas(['Todos', ...todasLojas]);  // adiciona 'Todos' no início
      }
    };


    fetchCategorias();
    fetchLojas();
  }, []);

  // Quando uma categoria é selecionada, carrega os itens dela
  useEffect(() => {
    const fetchItensCategoria = async () => {
      if (!categoriaSelecionada) return;
      const estoqueRef = doc(db, 'estoqueTi', 'estoque');
      const snapshot = await getDoc(estoqueRef);
      if (snapshot.exists()) {
        const dados = snapshot.data();
        const itens = Object.keys(dados[categoriaSelecionada] || {});
        setItensDaCategoria(itens);
      }
    };

    fetchItensCategoria();
  }, [categoriaSelecionada]);

  const gerarRelatorio = async () => {
    if (!categoriaSelecionada || !dataInicio || !dataFim) {
      alert("Preencha todos os campos.");
      return;
    }

    if (itensDaCategoria.length === 0) {
      alert("Nenhum item encontrado nessa categoria.");
      return;
    }

    setCarregando(true);

    const inicio = new Date(dataInicio);
    const fim = new Date(`${dataFim}T23:59:59`);

    console.log('🟡 Categoria selecionada:', categoriaSelecionada);
    console.log('🟡 Itens da categoria:', itensDaCategoria);
    console.log('🟡 Loja selecionada:', lojaSelecionada);
    console.log('🟡 Período:', inicio.toISOString(), 'até', fim.toISOString());

    const solicitacoesRef = collection(db, 'solicitTi');

    let q;

    if (lojaSelecionada === 'Todos') {
      q = query(
        solicitacoesRef,
        where('status', 'in', ['Enviado', 'Concluído'])
      );
    } else {
      q = query(
        solicitacoesRef,
        where('loja', '==', lojaSelecionada),
        where('status', 'in', ['Enviado', 'Concluído'])
      );
    }

    const snapshot = await getDocs(q);

    console.log('📂 Documentos brutos retornados:');
    snapshot.docs.forEach((doc, i) => {
      console.log(`📄 Doc ${i + 1}:`, doc.id, doc.data());
    });

    const todosDados = snapshot.docs.map(doc => doc.data());

    console.log(`🔵 Total de solicitações encontradas:`, todosDados.length);

    const dadosFiltrados = todosDados.filter(item => {
      const dataSolicitacao = item.data?.toDate?.();
      const nomeItem = item.item ? Object.keys(item.item)[0] : null;
      const dentroDoPeriodo = dataSolicitacao && dataSolicitacao >= inicio && dataSolicitacao <= fim;
      const itemEstaNaCategoria = nomeItem && itensDaCategoria.includes(nomeItem);

      if (!dataSolicitacao) {
        console.warn('⚠️ Solicitação sem data válida:', item);
      }

      return itemEstaNaCategoria && dentroDoPeriodo;
    });

    console.log('🟢 Total após filtros (data + item):', dadosFiltrados.length);

    const agrupado = {};
    dadosFiltrados.forEach(item => {
      const nomeItem = item.item ? Object.keys(item.item)[0] : 'Desconhecido';

      if (!agrupado[nomeItem]) {
        agrupado[nomeItem] = {
          quantidade: 0,
          status: {
            Enviado: 0,
            Concluído: 0
          }
        };
      }

      agrupado[nomeItem].quantidade += 1;
      agrupado[nomeItem].status[item.status] += 1;
    });

    const resultado = Object.entries(agrupado).map(([nomeItem, info]) => ({
      nomeItem,
      ...info
    }));

    console.log('✅ Resultado final para exibição:', resultado);

    setRelatorio(resultado);
    setDadosFiltrados(dadosFiltrados);
    setCarregando(false);
  };


  const gerarPDF = () => {
    if (!relatorio || relatorio.length === 0) {
      alert("Nenhum dado para exportar.");
      return;
    }

    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('Relatório de Solicitações Detalhado', 14, 15);

    // Cabeçalho da tabela
    const head = [['Data', 'Nº Solicitação', 'Usuário', 'Loja', 'Item', 'Quantidade']];

    // Corpo da tabela com todos os dados filtrados
    const body = dadosFiltrados.map((item) => {
      const dataFormatada = item.data?.toDate?.().toLocaleDateString('pt-BR') || '-';
      const nomeItem = item.item ? Object.keys(item.item)[0] : 'Desconhecido';
      const qtd = item.item ? item.item[nomeItem] : 0;

      return [
        dataFormatada,
        item.numSolicite || '-',
        item.user || '-',
        item.loja || '-',
        nomeItem,
        qtd
      ];
    });

    autoTable(doc, {
      startY: 25,
      head,
      body
    });

    doc.save(`relatorio_consumo_${lojaSelecionada}.pdf`);
  };


  return (
    <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-4xl mx-auto mt-4">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Relatório de Consumo da Loja</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Dropdown
          label="Categoria"
          options={categorias}
          selected={categoriaSelecionada}
          onSelectedChange={setCategoriaSelecionada}
        />
        <Dropdown
          label="Loja"
          options={lojas}
          selected={lojaSelecionada}
          onSelectedChange={setLojaSelecionada}
        />
        <div>
          <label className="block text-sm text-gray-600">Data Início</label>
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Data Fim</label>
          <input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>
      </div>

      <button
        onClick={gerarRelatorio}
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
      >
        Gerar Relatório
      </button>
      <button
        onClick={gerarPDF}
        className="ml-4 bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
      >
        Gerar PDF
      </button>

      {carregando && <p className="mt-4 text-gray-500">Carregando...</p>}

      {!carregando && relatorio.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-2">Resultado:</h3>
          <table className="w-full border-collapse border">
            <thead>
              <tr className="bg-gray-200 text-left">
                <th className="border p-2">Item</th>
                <th className="border p-2">Total Solicitações</th>
                <th className="border p-2">Enviado</th>
                <th className="border p-2">Concluído</th>
              </tr>
            </thead>
            <tbody>
              {relatorio.map((item, index) => (
                <tr key={index} className="hover:bg-gray-100">
                  <td className="border p-2">{item.nomeItem}</td>
                  <td className="border p-2">{item.quantidade}</td>
                  <td className="border p-2">{item.status.Enviado}</td>
                  <td className="border p-2">{item.status.Concluído}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!carregando && relatorio.length === 0 && (
        <p className="mt-4 text-gray-500">Nenhum dado encontrado para os filtros aplicados.</p>
      )}
    </div>
  );
};

export default RelatorioConsumoTi;
