import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

const RelatorioCompras = () => {
  const [relatorio, setRelatorio] = useState([]); // Estado para armazenar os dados do relatório de compras
  const [startDate, setStartDate] = useState(''); // Estado para armazenar a data de início do filtro
  const [endDate, setEndDate] = useState(''); // Estado para armazenar a data de término do filtro
  const [searchTerm, setSearchTerm] = useState(''); // Estado para armazenar o termo de busca para filtro
  const [filteredRelatorio, setFilteredRelatorio] = useState({}); // Estado para armazenar os dados filtrados e agrupados do relatório

  useEffect(() => {
    const fetchRelatorio = async () => {
      const relatorioRef = collection(db, 'relatorioCompras'); // Referência à coleção 'relatorioCompras' no Firestore
      const querySnapshot = await getDocs(relatorioRef); // Busca todos os documentos da coleção

      const data = querySnapshot.docs.map(doc => ({
        id: doc.id, // Armazena o ID do documento
        ...doc.data(), // Armazena os dados do documento
      }));

      setRelatorio(data); // Atualiza o estado com os dados do relatório
    };

    fetchRelatorio(); // Chama a função para buscar o relatório de compras
  }, []);

  useEffect(() => {
    const filterAndGroupRelatorio = () => {
      const filtered = relatorio.filter(entry => {
        const entryDate = new Date(entry.id); // Converte o ID (presumivelmente uma data) para um objeto Date
        const start = startDate ? new Date(startDate) : null; // Converte a data de início para um objeto Date, se definida
        const end = endDate ? new Date(endDate) : null; // Converte a data de término para um objeto Date, se definida
        const matchesDate = (!start || entryDate >= start) && (!end || entryDate <= end); // Verifica se a data da entrada está dentro do intervalo
        const matchesSearch = searchTerm
          ? JSON.stringify(entry).toLowerCase().includes(searchTerm.toLowerCase()) // Verifica se a entrada corresponde ao termo de busca
          : true;
        return matchesDate && matchesSearch; // Retorna true se a entrada corresponder à data e à busca
      });

      const groupedByDate = filtered.reduce((acc, entry) => {
        const date = new Date(entry.id).toLocaleDateString(); // Formata a data da entrada
        if (!acc[date]) acc[date] = []; // Cria um novo array para a data se ainda não existir
        acc[date].push(entry); // Adiciona a entrada ao array correspondente à data
        return acc;
      }, {});

      setFilteredRelatorio(groupedByDate); // Atualiza o estado com os dados filtrados e agrupados por data
    };

    filterAndGroupRelatorio(); // Chama a função para filtrar e agrupar o relatório
  }, [startDate, endDate, searchTerm, relatorio]); // Executa o efeito quando qualquer um desses estados mudar

  const handlePrint = () => {
    window.print(); // Função para imprimir a página
  };

  const formatObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj; // Retorna o objeto se não for um objeto ou for nulo
    return Object.entries(obj)
      .map(([key, value]) => `${key}: ${formatObject(value)}`) // Formata as chaves e valores do objeto em uma string
      .join(' '); // Junta todas as strings formatadas em uma única string
  };

  const renderEntryLine = (entry) => {
    const lines = []; // Array para armazenar as linhas renderizadas

    Object.entries(entry).forEach(([key, value]) => {
      if (key !== 'id') { // Ignora a chave 'id' ao renderizar
        if (typeof value === 'object') { // Verifica se o valor é um objeto
          Object.entries(value).forEach(([subKey, subValue]) => {
            const details = formatObject(subValue); // Formata o objeto para exibição
            lines.push(
              <div key={subKey} className="mb-1">
                <strong>{key} - {subKey}:</strong> {details} {/* Exibe a chave, subchave e os detalhes formatados */}
              </div>
            );
          });
        } else {
          lines.push(
            <div key={key} className="mb-1">
              <strong>{key}:</strong> {value} {/* Exibe a chave e o valor se não for um objeto */}
            </div>
          );
        }
      }
    });

    return lines; // Retorna as linhas renderizadas
  };

  return (
    <div className="p-5 pt-20 bg-white border min-w-[400px] m-4 border-gray-300 rounded-xl shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-gray-700">Relatório de Compras</h2>

      <div className="gap-4 mb-4 hidden">
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">Data Início</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-gray-300 p-2 rounded focus:ring focus:ring-blue-200"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">Data Fim</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-gray-300 p-2 rounded focus:ring focus:ring-blue-200"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">Buscar</label>
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 p-2 rounded focus:ring focus:ring-blue-200"
          />
        </div>
      </div>

      <button
        onClick={handlePrint}
        className="bg-primaryBlueDark text-white p-2 rounded mb-4 hover:bg-primaryOpaci focus:outline-none focus:ring focus:ring-gray-200"
      >
        Imprimir Relatório
      </button>

      <div>
        {Object.keys(filteredRelatorio).length > 0 ? (
          Object.keys(filteredRelatorio).map(date => (
            <div key={date} className="mb-6 text-xs">
              <div className="pl-4">
                {filteredRelatorio[date].map((entry, idx) => (
                  <div key={idx} className="mb-2">
                    {renderEntryLine(entry)}
                  </div>
                ))}
              </div>
              <hr className="my-4" />
            </div>
          ))
        ) : (
          <p className="text-gray-500">Nenhum relatório encontrado no período selecionado ou com o termo de busca.</p>
        )}
      </div>
    </div>
  );
};

export default RelatorioCompras;
