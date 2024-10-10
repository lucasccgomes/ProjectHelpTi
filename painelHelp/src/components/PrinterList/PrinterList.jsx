import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase'; // Certifique-se de que o caminho está correto
import MyModal from '../MyModal/MyModal'; // Certifique-se de que o caminho está correto

const PrinterList = () => {
  const [stores, setStores] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  const [newCount, setNewCount] = useState('');
  const [newDate, setNewDate] = useState('');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printDate, setPrintDate] = useState('');

  // Função para calcular o consumo para impressão
  const calculateConsumoForPrint = (printerData, contagem, index) => {
    let consumo = 0;

    if (index === 0) {
      // Primeiro item: subtrai o valor inicial
      consumo = contagem.numero - printerData.contagemInicial[0].numero;
    } else {
      // Para os demais itens: subtrai o valor da contagem anterior
      consumo = contagem.numero - printerData.contagem[index - 1].numero;
    }

    return consumo;
  };

  const handlePrintReport = () => {
    console.log('Iniciando geração do relatório...');
    const filteredReport = [];

    // Pega o mês e ano da data selecionada
    const [year, month] = printDate.split('-'); // Separando o ano e mês do printDate
    const selectedDate = new Date(year, month - 1, 1); // Criando uma data com o primeiro dia do mês correto    
    const selectedMonth = selectedDate.getMonth() + 1;
    const selectedYear = selectedDate.getFullYear();

    // Adicionando log para verificar a data selecionada
    console.log('Data selecionada:', printDate);
    console.log('Data processada:', selectedDate);
    console.log('Mês selecionado:', selectedMonth);
    console.log('Ano selecionado:', selectedYear);

    Object.entries(stores).forEach(([storeName, storeData]) => {
      Object.entries(storeData).forEach(([printerName, printerData]) => {
        console.log(`Processando loja: ${storeName}, impressora: ${printerName}`);

        // Verifica se contagem existe e não é vazia
        if (printerData.contagem && printerData.contagem.length > 0) {
          printerData.contagem.forEach((contagem, index) => {
            // Verifica se contagem.data é um timestamp válido
            if (contagem.data && contagem.data.seconds) {
              const contagemDate = new Date(contagem.data.seconds * 1000);
              const contagemMonth = contagemDate.getMonth() + 1;
              const contagemYear = contagemDate.getFullYear();

              console.log(`Comparando datas: contagem ${contagemMonth}/${contagemYear}, selecionada ${selectedMonth}/${selectedYear}`);

              // Comparar mês e ano como números inteiros
              if (contagemMonth === selectedMonth && contagemYear === selectedYear) {
                const consumo = calculateConsumoForPrint(printerData, contagem, index);
                filteredReport.push(`Loja: ${storeName} | Impressora: ${printerName} | Consumo (${contagemDate.toLocaleDateString()}): ${consumo} | Total - Contagem: ${contagem.numero}`);
              }
            } else {
              console.log('Contagem inválida ou sem data:', contagem);
            }
          });
        } else {
          console.log('Contagem não encontrada ou vazia para:', printerName);
        }
      });
    });

    console.log('Itens filtrados para o relatório:', filteredReport);

    // Se não houver itens para imprimir, mostre um alerta ou mensagem de erro
    if (filteredReport.length === 0) {
      alert('Nenhum dado encontrado para o mês/ano selecionado.');
      return;
    }

    // Imprime o relatório filtrado
    const printContent = `
      <div>
        <h1>Relatório de Impressões</h1>
        <ul>
          ${filteredReport.map(line => `<li>${line}</li>`).join('')}
        </ul>
      </div>
    `;

    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write('<html><head><title>Impressão</title></head><body>');
    printWindow.document.write(printContent);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();

    // Fecha o modal após a impressão
    setIsPrintModalOpen(false);
  };
  ;

  // Função para buscar os dados das lojas
  const fetchStores = async () => {
    try {
      const docRef = doc(db, 'impressoras', 'list'); // Referência ao documento 'list'
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setStores(docSnap.data());
      } else {
        console.error('Documento não encontrado!');
      }
    } catch (error) {
      console.error('Erro ao buscar documentos:', error);
    }
  };

  useEffect(() => {
    fetchStores(); // Buscar informações ao montar o componente
  }, []);

  // Função para abrir o modal com a loja selecionada
  const handleNewCount = (storeName) => {
    setSelectedStore(storeName);
    setIsModalOpen(true);
  };

  // Função para salvar a nova contagem
  const handleSaveCount = async () => {
    if (!newCount || !newDate) return;

    try {
      const docRef = doc(db, 'impressoras', 'list');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        // Separar o selectedStore em duas partes: loja e impressora
        const [storeName, printerName] = selectedStore.split('.');

        // Log para verificar a separação
        console.log('Loja:', storeName);
        console.log('Impressora:', printerName);

        const storeData = docSnap.data()[storeName][printerName];

        // Adicionar verificação de storeData
        if (!storeData) {
          console.error(`storeData para ${storeName}.${printerName} não encontrada!`);
          return; // Parar a execução se não encontrar os dados
        }

        console.log('storeData encontrada:', storeData);

        let consumoDoMes = 0;

        // Usando a lógica da função calculateConsumo para calcular o consumo
        if (storeData.contagemInicial && storeData.contagemInicial.length > 0 && storeData.contagem && storeData.contagem.length > 0) {
          // Contagem inicial e última contagem para calcular o consumo
          const contagemInicial = storeData.contagemInicial[0].numero;
          const lastContagem = storeData.contagem[storeData.contagem.length - 1].numero;
          consumoDoMes = Number(newCount) - lastContagem;
        } else if (storeData.contagemInicial && storeData.contagemInicial.length > 0) {
          // Se não houver contagem, calcula o consumo baseado na contagem inicial
          const contagemInicial = storeData.contagemInicial[0].numero;
          consumoDoMes = Number(newCount) - contagemInicial;
        }

        console.log('Consumo Calculado para Gravar:', consumoDoMes);

        // Atualiza a contagem para a loja e impressora selecionadas
        await updateDoc(docRef, {
          [`${storeName}.${printerName}.contagem`]: arrayUnion({
            numero: Number(newCount),
            data: Timestamp.fromDate(new Date(newDate)),
            consumoDoMes: consumoDoMes !== null ? consumoDoMes : 0, // Adiciona o consumo calculado ou 0 caso não consiga calcular
          }),
        });

        // Fecha o modal e reseta os campos
        setIsModalOpen(false);
        setNewCount('');
        setNewDate('');
        fetchStores(); // Atualiza a lista de lojas
      } else {
        console.error('Documento não encontrado!');
      }
    } catch (error) {
      console.error('Erro ao salvar contagem:', error);
    }
  };


  // Função para calcular e mostrar apenas o último consumo
  const calculateConsumo = (printerData) => {
    if (!printerData.contagemInicial || printerData.contagemInicial.length === 0 || !printerData.contagem || printerData.contagem.length === 0) {
      return null;
    }

    const contagemInicial = printerData.contagemInicial[0].numero;
    const lastIndex = printerData.contagem.length - 1; // Pegar o índice do último elemento

    let consumo;
    let dataLabel;

    // Consumo para o último array, com base na contagem inicial ou anterior
    if (lastIndex === 0) {
      // Caso seja o primeiro registro, calcula com base na contagemInicial
      consumo = printerData.contagem[lastIndex].numero - contagemInicial;
    } else {
      // Caso contrário, calcula com base na última contagem registrada
      const consumoAnterior = printerData.contagem[lastIndex - 1].numero;
      consumo = printerData.contagem[lastIndex].numero - consumoAnterior;
    }

    dataLabel = new Date(printerData.contagem[lastIndex].data.seconds * 1000).toLocaleDateString();

    return (
      <li key={lastIndex}>
        <strong>Consumo ({dataLabel}):</strong> {consumo}
      </li>
    );
  };


  return (
    <div className="p-4 pt-20 bg-altBlue">
      <div>
        <h1 className="text-2xl font-bold mb-4">Lista de Impressoras por Loja</h1>
        <button
          onClick={() => setIsPrintModalOpen(true)}
          className="mt-4 px-4 py-2 bg-gray-600 text-white rounded"
        >
          Imprimir Relatório
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(stores).map(([storeName, storeData]) => (
            <div key={storeName} className="p-4  bg-white shadow-md rounded flex justify-center items-center flex-col ">
              <h2 className="text-xl font-semibold mb-2">{storeName}</h2>

              <div className="grid grid-cols-1 gap-4">
                {Object.entries(storeData).map(([printerName, printerData]) => (
                  <div key={printerName} className="p-4 border rounded bg-gray-50">
                    <h3 className="text-lg font-semibold">{printerName}</h3>
                    <p><strong>Host:</strong> {printerData.host || 'N/A'}</p>

                    {/* Exibindo contagem inicial */}
                    {printerData.contagemInicial && printerData.contagemInicial.length > 0 && (
                      <div>
                        <p><strong>Contagem Inicial:</strong> {printerData.contagemInicial[0].numero}</p>
                        <p><strong>Data Inicial:</strong> {new Date(printerData.contagemInicial[0].data.seconds * 1000).toLocaleDateString()}</p>
                      </div>
                    )}

                    {/* Adicionando botão para nova contagem */}
                    <button
                      onClick={() => handleNewCount(`${storeName}.${printerName}`)}
                      className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
                    >
                      NOVA CONTAGEM
                    </button>

                    {/* Exibindo as contagens adicionais e o consumo */}
                    {printerData.contagem && printerData.contagem.length > 0 && (
                      <ul className="mt-2">
                        {calculateConsumo(printerData)}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal para inserir nova contagem */}
      <MyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div>
          <h2 className="text-xl font-bold mb-4">Nova Contagem</h2>
          <div className="mb-4">
            <label className="block text-gray-700">Número:</label>
            <input
              type="number"
              value={newCount}
              onChange={(e) => setNewCount(e.target.value)}
              className="mt-1 p-2 border rounded w-full"
              placeholder="Insira o número"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Data:</label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="mt-1 p-2 border rounded w-full"
            />
          </div>
          <button
            onClick={handleSaveCount}
            className="px-4 py-2 bg-green-500 text-white rounded"
          >
            SALVAR
          </button>
        </div>
      </MyModal>

      <MyModal isOpen={isPrintModalOpen} onClose={() => setIsPrintModalOpen(false)}>
        <div>
          <h2 className="text-xl font-bold mb-4">Selecionar Data para o Relatório</h2>
          <div className="mb-4">
            <label className="block text-gray-700">Mês/Ano:</label>
            <input
              type="month"
              value={printDate}
              onChange={(e) => setPrintDate(e.target.value)}
              className="mt-1 p-2 border rounded w-full"
            />
          </div>
          <button
            onClick={handlePrintReport}
            className="px-4 py-2 bg-green-500 text-white rounded"
          >
            Ok
          </button>
        </div>
      </MyModal>

    </div>
  );
};

export default PrinterList;
