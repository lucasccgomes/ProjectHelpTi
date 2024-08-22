import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

const RelatorioCompras = () => {
  const [relatorio, setRelatorio] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredRelatorio, setFilteredRelatorio] = useState({});

  useEffect(() => {
    const fetchRelatorio = async () => {
      const relatorioRef = collection(db, 'relatorioCompras');
      const querySnapshot = await getDocs(relatorioRef);

      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setRelatorio(data);
    };

    fetchRelatorio();
  }, []);

  useEffect(() => {
    const filterAndGroupRelatorio = () => {
      const filtered = relatorio.filter(entry => {
        const entryDate = new Date(entry.id);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        const matchesDate = (!start || entryDate >= start) && (!end || entryDate <= end);
        const matchesSearch = searchTerm
          ? JSON.stringify(entry).toLowerCase().includes(searchTerm.toLowerCase())
          : true;
        return matchesDate && matchesSearch;
      });

      const groupedByDate = filtered.reduce((acc, entry) => {
        const date = new Date(entry.id).toLocaleDateString();
        if (!acc[date]) acc[date] = [];
        acc[date].push(entry);
        return acc;
      }, {});

      setFilteredRelatorio(groupedByDate);
    };

    filterAndGroupRelatorio();
  }, [startDate, endDate, searchTerm, relatorio]);

  const handlePrint = () => {
    window.print();
  };

  const formatObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    return Object.entries(obj)
      .map(([key, value]) => `${key}: ${formatObject(value)}`)
      .join(' ');
  };

  const renderEntryLine = (entry) => {
    const lines = [];

    Object.entries(entry).forEach(([key, value]) => {
      if (key !== 'id') {
        if (typeof value === 'object') {
          Object.entries(value).forEach(([subKey, subValue]) => {
            const details = formatObject(subValue);
            lines.push(
              <div key={subKey} className="mb-1">
                <strong>{key} - {subKey}:</strong> {details}
              </div>
            );
          });
        } else {
          lines.push(
            <div key={key} className="mb-1">
              <strong>{key}:</strong> {value}
            </div>
          );
        }
      }
    });

    return lines;
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
