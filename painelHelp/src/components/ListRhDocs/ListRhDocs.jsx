import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase'; // Certifique-se de que o caminho está correto
import { useAuth } from '../../context/AuthContext'; // Importando o contexto de autenticação
import MyModal from '../MyModal/MyModal'; // Certifique-se de que o caminho está correto

const ListRhDocs = () => {
  const { currentUser } = useAuth(); // Pegando o usuário logado
  const [docs, setDocs] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null); // Estado para controlar o documento selecionado
  const [isModalOpen, setIsModalOpen] = useState(false); // Controla o estado do modal

  const handlePrint = (selectedDoc) => {
    const printContent = `
      <style>
       @page {
          size: A4 portrait; /* Força a orientação para retrato */
          margin: 20mm;
        }
        @media print {
          body {
            background-size: 200px 200px;
          }
          .print-container {
            padding: 20px;
            font-family: Arial, sans-serif;
          }
          h2 {
            font-size: 24px;
            margin-bottom: 20px;
          }
          p {
            font-size: 16px;
            margin: 5px 0;
          }
          img {
            width: 200px;
            height: auto;
            margin-bottom: 20px;
          }
        }
      </style>
      <div class="print-container">
        <div style="display: flex;justify-content: space-between;border-bottom: solid; padding-bottom: 10px;">
          <img src="https://media.licdn.com/dms/image/v2/C4D0BAQHZAAtje7VwKg/company-logo_200_200/company-logo_200_200/0/1630572500619/rede_drogalira_logo?e=2147483647&v=beta&t=crf7UHQ8hcFvHNLgJ99iR11P-Hoe_05CfeHdAR7TYus" alt="Logo Rede Drogalira" style="width: 80px;" />       
            <p style="font-size: x-large;">${printData.titulo}</p>    
            <p style="font-size: x-large;">Segunda Via</p>   
          <h2>${printData.idDocumento}</h2> 
        </div>
        
        <div style="display: flex; justify-content: space-between;">
          <div style="display: flex;">
            <p style="font-weight: bold;">Tipo de Documento:</p>
            <p>${printData.tipoDocumento}</p>
          </div>
          <div>
            <p><strong>Cidade:</strong> ${printData.cidade}</p>
          </div>
          <div>
            <p><strong>Loja:</strong> ${printData.loja}</p>
          </div>
          <div style="display: flex;">
            <p style="font-weight: bold;">Data:</p> 
            <p>${new Date(printData.dataInicio).toLocaleDateString()}</p>
          </div> 
        </div>
        <p><strong>Destinatário:</strong> ${printData.responsavel.destinatario}</p>
        <p><strong>Remetente:</strong> ${printData.responsavel.remetente}</p>
        <p><strong>Transporte:</strong> ${printData.responsavel.transporte}</p>

        <div style="display: flex;">
        <p style="font-weight: bold;">Observação:</p>
        <p> ${printData.observacao}</p> 
        </div>
        
      <div>
          <div style="font-weight: bold; font-size: xx-large;">
          Documentos
        </div>
        <ol>
          ${printData.documento.map(doc => `<li style="margin-bottom: 4px;">${doc}</li>`).join('')}
        </ol>
        </div>


      <div>
        <div style="border: solid; padding: 10px; border-top: dotted; border-bottom: dotted;">
        <div style="display: flex; justify-content: space-between;">
        <p style="font-weight: bold; font-size: x-large;">Canhoto Destinatario</p>
        <h2 style="font-size: large;">${printData.idDocumento}</h2> 
        </div>
        <div style="display: flex; justify-content: space-between;">

        <div>
         <p style="margin-top: 50px; text-align: center; border-top: solid;width: 220px; margin-right: 8px;">${printData.responsavel.destinatario}</p>
        <p style="text-align: center; margin-top: 20px;">Data:____/____/_____</p>
        </div>
       
         <div>
         <p style="margin-top: 50px; text-align: center; border-top: solid;width: 220px; margin-right: 8px;">${printData.responsavel.transporte}</p>
        <p style="text-align: center; margin-top: 20px;">Data:____/____/_____</p>
        </div>
       
        <div>
        <p style="margin-top: 50px; text-align: center; border-top: solid;width: 220px;">${printData.responsavel.remetente}</p>
        <p style="text-align: center; margin-top: 20px;">Data:____/____/_____</p>
        </div>
        </div>
        </div>

        <div style="border: solid; padding: 10px; border-top: none; border-bottom: dotted;">
        <div style="display: flex; justify-content: space-between;">
            <p style="font-weight: bold; font-size: x-large;">Canhoto Transporte</p>
           <h2 style="font-size: large;">${printData.idDocumento}</h2> 
          </div>
          <div style="display: flex; justify-content: space-between;">
          <div>
          <p style="margin-top: 50px; text-align: center; border-top: solid;width: 220px; margin-right: 8px;">${printData.responsavel.transporte}</p>
           <p style="text-align: center; margin-top: 20px;">Data:____/____/_____</p>
          </div>
          <div>
         <p style="margin-top: 50px; text-align: center; border-top: solid;width: 220px; margin-right: 8px;">${printData.responsavel.remetente}</p>
           <p style="text-align: center; margin-top: 20px;">Data:____/____/_____</p>
          </div>
          <div>
          <p style="margin-top: 50px; text-align: center; border-top: solid;width: 220px;">${printData.responsavel.destinatario}</p>
          <p style="text-align: center; margin-top: 20px;">Data:____/____/_____</p>
          </div>
         </div>
        </div>

        <div style="border: solid; padding: 10px; border-top: none;">
       <div style="display: flex; justify-content: space-between;">
            <p style="font-weight: bold; font-size: x-large;">Canhoto Remetente</p>
             <h2 style="font-size: large;">${printData.idDocumento}</h2> 
          </div>
          <div>
          </div>
          <div style="display: flex; justify-content: space-between;">
          <div>
              <p style="margin-top: 50px; text-align: center; border-top: solid;width: 220px; margin-right: 8px;">${printData.responsavel.remetente}</p>
              <p style="text-align: center; margin-top: 20px;">Data:____/____/_____</p>
          </div>

              
          <div>
              <p style="margin-top: 50px; text-align: center; border-top: solid;width: 220px; margin-right: 8px;">${printData.responsavel.transporte}</p>
              <p style="text-align: center; margin-top: 20px;">Data:____/____/_____</p>
          </div>
        </div>
        </div>
        </div>
      </div>
    `;

    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write('<html><head><title>Impressão</title></head><body>');
    printWindow.document.write(printContent);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();

    setCanCloseModal(true); // Permite fechar o modal após o clique no botão Imprimir
  };

  // Função para buscar os dados do documento RhDocs
  const fetchRhDocs = async () => {
    try {
      const docRef = doc(db, 'gerenciaRh', 'RhDocs'); // Referência ao documento RhDocs
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const docsList = Object.keys(data).map((key) => ({ id: key, ...data[key] }));

        // Se o cargo for 'RH', mostrar todos os documentos, caso contrário, filtrar pelo usuário logado
        const filteredDocs = currentUser.cargo === 'RH'
          ? docsList // Mostrar todos os documentos se for RH
          : docsList.filter((doc) => doc.user === currentUser.user); // Filtrar pelo usuário logado

        setDocs(filteredDocs);
      } else {
        console.error('Documento RhDocs não encontrado!');
      }
    } catch (error) {
      console.error('Erro ao buscar documentos:', error);
    }
  };

  // Chama a função quando o componente for montado
  useEffect(() => {
    if (currentUser) {
      fetchRhDocs(); // Buscar documentos apenas quando o usuário logado estiver disponível
    }
  }, [currentUser]);

  // Função para abrir o modal com os detalhes do documento
  const handleViewDetails = (doc) => {
    setSelectedDoc(doc); // Define o documento selecionado
    setIsModalOpen(true); // Abre o modal
  };

  return (
    <div className='pt-20'>
      <h1 className="text-2xl font-bold mb-4">Documentos RH</h1>
      {docs.length > 0 ? (
        <ul>
          {docs.map((doc) => (
            <li key={doc.id} className="mb-4 p-4 border rounded">
              <strong>ID Documento:</strong> {doc.idDocumento} <br />
              <strong>Data Início:</strong> {new Date(doc.dataInicio.seconds * 1000).toLocaleString()} <br />
              <strong>Tipo Documento:</strong> {doc.tipoDocumento} <br />
              <button
                onClick={() => handleViewDetails(doc)}
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
              >
                Visualizar
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>Nenhum documento encontrado.</p>
      )}

      {/* Modal para exibir os detalhes completos do documento */}
      <MyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} showCloseButton={true}>
  {selectedDoc && (
    <div>
      <h2 className="text-xl mb-4">Detalhes do Documento</h2>
      <p><strong>ID Documento:</strong> {selectedDoc.idDocumento}</p>
      <p><strong>Cidade:</strong> {selectedDoc.cidade}</p>
      <p><strong>Loja:</strong> {selectedDoc.loja}</p>
      <p><strong>Destinatário:</strong> {selectedDoc.responsavel?.destinatario}</p>
      <p><strong>Remetente:</strong> {selectedDoc.responsavel?.remetente}</p>
      <p><strong>Transporte:</strong> {selectedDoc.responsavel?.transporte}</p>
      <p><strong>Tipo Documento:</strong> {selectedDoc.tipoDocumento}</p>
      <p><strong>Título:</strong> {selectedDoc.titulo}</p>
      <p><strong>Observação:</strong> {selectedDoc.observacao}</p>
      
      {/* Exibir documentos como lista */}
      <div>
        <strong>Documentos:</strong>
        <ul>
          {selectedDoc.documento?.map((doc, index) => (
            <li key={index}>{doc}</li>
          ))}
        </ul>
      </div>
      
      <p><strong>Data Início:</strong> {new Date(selectedDoc.dataInicio.seconds * 1000).toLocaleString()}</p>

      {/* Botão para imprimir */}
      <button
        onClick={() => handlePrint(selectedDoc)}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Imprimir
      </button>
    </div>
  )}
</MyModal>

    </div>
  );
};

export default ListRhDocs;
