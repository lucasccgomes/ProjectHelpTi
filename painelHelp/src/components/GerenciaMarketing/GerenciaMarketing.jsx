import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase'; // Certifique-se de que o caminho está correto
import { useAuth } from '../../context/AuthContext'; // Importando o contexto de autenticação
import 'react-quill/dist/quill.snow.css';
import MyModal from '../MyModal/MyModal'
import AlertModal from '../AlertModal/AlertModal'; // Certifique-se de que o caminho está correto


const GerenciaMarketing = () => {
  const { currentUser, setCurrentUser } = useAuth(); // Adiciona setCurrentUser para poder atualizar o usuário

  const [tituloDocs, setTituloDocs] = useState(''); // Título do documento
  const [tipoDoc, setTipoDoc] = useState([]); // Tipos de documento do Firestore
  const [selectedTipoDoc, setSelectedTipoDoc] = useState(''); // Tipo de documento selecionado
  const [documentFields, setDocumentFields] = useState(['']); // Campos do documento dinâmicos
  const [responsaveis, setResponsaveis] = useState([]); // Lista de destinatários (timeRh)
  const [selectedResponsavel, setSelectedResponsavel] = useState(''); // Responsável selecionado
  const [observacao, setObservacao] = useState(''); // Observação (ReactQuill)
  const [controlDocNumber, setControlDocNumber] = useState(''); // Número do documento controlado
  const [isModalOpen, setIsModalOpen] = useState(false); // Controla o estado do modal
  const [transporte, setTransporte] = useState(''); // Armazena o nome da pessoa que vai levar o documento
  const [isNameModalOpen, setIsNameModalOpen] = useState(false); // Controla o estado do modal para o nome completo
  const [fullName, setFullName] = useState(currentUser.fullName || ''); // Armazena o nome completo do usuário, se existir
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false); // Controla o modal de impressão
  const [printData, setPrintData] = useState({}); // Armazena os dados para impressão  
  const [isAlertOpen, setIsAlertOpen] = useState(false); // Controla se o modal está aberto
  const [alertMessage, setAlertMessage] = useState(''); // Armazena a mensagem do alerta
  const [isAlertOpenSucesso, setIsAlertOpenSucesso] = useState(false); // Controla se o AlertModal está aberto
  const [canCloseModal, setCanCloseModal] = useState(false); // Controla se o modal pode ser fechado


  useEffect(() => {
    if (currentUser && currentUser.fullName) {
      setFullName(currentUser.fullName); // Sincroniza o nome completo quando o currentUser mudar
    }
  }, [currentUser]);

  // Busca o título e os tipos de documento do Firestore
  useEffect(() => {
    const fetchData = async () => {
      const docRef = doc(db, 'gerenciaMK', 'admMK');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setTituloDocs(docSnap.data().tituloDocs);
        setTipoDoc(docSnap.data().tipoDoc);
      }
    };
    fetchData();
  }, []);

  // Função para buscar os destinatários com base no cargo do usuário logado
  useEffect(() => {
    const fetchResponsaveis = async () => {
      try {
        const usuariosRef = collection(db, 'usuarios'); // Referência à coleção de usuários no Firestore
        const querySnapshot = await getDocs(usuariosRef);
        const responsaveis = [];

        querySnapshot.forEach((doc) => {
          const userData = doc.data();

          Object.keys(userData).forEach((key) => {
            const user = userData[key];

            // Se o usuário logado for Marketing, busca os Gerentes
            if (currentUser.cargo === 'Marketing' && user.cargo === 'Gerente' && user.fullName) {
              responsaveis.push(user.fullName);
            }
            // Se o usuário logado não for Marketing, busca todos os Marketing
            else if (currentUser.cargo !== 'Marketing' && user.cargo === 'Marketing' && user.fullName) {
              responsaveis.push(user.fullName);
            }
          });
        });

        setResponsaveis(responsaveis); // Define a lista de responsáveis de acordo com o cargo do usuário logado
      } catch (error) {
        console.error("Erro ao buscar destinatários:", error);
      }
    };

    fetchResponsaveis();
  }, [currentUser]);


  // Busca o último número de documento e gera o próximo
  const fetchLastDocumentNumber = async () => {
    try {
      const docRef = doc(db, 'gerenciaMK', 'controlDoc'); // Referência ao documento controlDoc
      const docSnap = await getDoc(docRef); // Tenta buscar o documento

      if (docSnap.exists()) {
        const lastDocNumber = docSnap.data().numberDoc; // Acessa o campo numberDoc
        console.log("Número do documento anterior:", lastDocNumber); // Verifica o número anterior

        // Gera o próximo número de documento
        const nextDocNumber = generateNextDocNumber(lastDocNumber);
        console.log("Próximo número de documento gerado:", nextDocNumber);

        // Retorna o próximo número gerado
        return nextDocNumber;
      } else {
        console.error("O documento controlDoc não existe!");
        return null;
      }
    } catch (error) {
      console.error("Erro ao buscar o último número de documento:", error);
      return null;
    }
  };

  // Função para gerar o próximo número do documento
  const generateNextDocNumber = (lastDocNumber) => {
    let letter = lastDocNumber.charAt(3); // Pega a letra após "RHD"
    let number = parseInt(lastDocNumber.substring(4)); // Pega o número após a letra
    number += 1;

    if (number > 999) {
      letter = String.fromCharCode(letter.charCodeAt(0) + 1); // Muda para a próxima letra
      number = 1;
    }

    // Gera o próximo número, sempre com 3 dígitos
    return `MKD${letter}${number.toString().padStart(3, '0')}`;
  };

  // Função para adicionar um novo campo de documento dinâmico
  const addDocumentField = () => {
    if (documentFields.length < 8) {
      setDocumentFields([...documentFields, '']);
    } else {
      alert('Você atingiu o número máximo de 8 documentos.');
    }
  };

  // Função para remover um campo de documento dinâmico
  const removeDocumentField = (index) => {
    const updatedFields = [...documentFields];
    updatedFields.splice(index, 1);
    setDocumentFields(updatedFields);
  };

  // Função para gravar os dados no Firestore
  const handleSubmit = () => {
    if (!selectedTipoDoc || documentFields.some(field => field.trim() === '') || !selectedResponsavel) {
      alert('Preencha todos os campos obrigatórios.');
      return;
    }

    // Verifica se o campo fullName existe e não está vazio
    if (!fullName || fullName.trim() === '') {
      setIsNameModalOpen(true); // Abre o modal para solicitar o nome completo
    } else {
      setIsModalOpen(true); // Se o fullName já estiver definido, abre diretamente o modal para transporte
    }
  };

  const handleNameSave = async () => {
    try {
      // Atualize o currentUser com o nome completo fornecido
      const updatedUser = { ...currentUser, fullName };

      // Atualiza o Firestore com o nome completo do usuário
      const userRef = doc(db, 'usuarios', currentUser.cidade); // Atualiza o campo no documento do usuário
      await updateDoc(userRef, {
        [`${currentUser.user}.fullName`]: fullName,
      });

      // Atualiza o estado do currentUser com o novo nome completo
      setCurrentUser(updatedUser);

      setIsNameModalOpen(false); // Fecha o modal do nome
      setIsModalOpen(true); // Abre o modal para inserir quem vai transportar o documento
    } catch (error) {
      console.error('Erro ao salvar o nome completo:', error);
    }
  };

  const resetFields = () => {
    setSelectedTipoDoc(''); // Limpa o campo Tipo de Documento
    setDocumentFields(['']); // Limpa os campos do documento dinâmicos
    setSelectedResponsavel(''); // Limpa o campo Destinatário
    setObservacao(''); // Limpa a observação
    setTransporte(''); // Limpa o nome da pessoa que vai levar o documento
  };

  const handleSave = async () => {
    try {
      console.log("Buscando último número de documento...");

      const nextDocNumber = await fetchLastDocumentNumber();

      if (!nextDocNumber) {
        console.error('Erro: Número do documento não gerado!');
        return;
      }

      const newDocumentMap = {
        cidade: currentUser.cidade,
        loja: currentUser.loja,
        dataInicio: new Date(),
        documento: documentFields,
        idDocumento: nextDocNumber,
        responsavel: {
          remetente: fullName,
          destinatario: selectedResponsavel,
          transporte: transporte,
        },
        tipoDocumento: selectedTipoDoc,
        titulo: tituloDocs,
        observacao: observacao,
        user: currentUser.user, // Aqui você grava o nome ou ID do usuário
      };

      const documentRef = doc(db, 'gerenciaMK', 'MKDocs');
      await updateDoc(documentRef, {
        [nextDocNumber]: newDocumentMap
      });

      console.log("Campo map salvo com sucesso no caminho: ", documentRef.path);

      await updateDoc(doc(db, 'gerenciaMK', 'controlDoc'), {
        numberDoc: nextDocNumber,
      });

      console.log("Número de controle atualizado com sucesso!");

      resetFields(); // Limpa todos os campos

      // Preenche os dados para impressão
      setPrintData(newDocumentMap);

      setIsModalOpen(false); // Fecha o modal de transporte
      setIsPrintModalOpen(true); // Abre o modal de impressão

      // Exibe o AlertModal com a mensagem de sucesso
      setAlertMessage('Documento registrado com sucesso!');
      setIsAlertOpenSucesso(true);

      // Fecha o AlertModal após 3 segundos
      setTimeout(() => {
        setIsAlertOpenSucesso(false);
      }, 3000);

    } catch (error) {
      console.error('Erro ao registrar o documento:', error);
    }
  };


  const handlePrint = () => {
    const printContent = `
      <style>
       @page {
          size: A4 portrait; /* Força a orientação para retrato */
          margin: 0mm;
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


  return (
    <div className="lg:p-20 p-8 bg-altBlue pt-24">
      <h1 className="text-2xl font-bold mb-4 text-white text-center ">Envio de Documentos RH</h1>

      {/* Selecionar Tipo de Documento */}
      <div className="mb-4">
        <label className="block text-white">Tipo de Documento:</label>
        <select
          className="mt-2 p-2 border rounded w-full"
          value={selectedTipoDoc}
          onChange={(e) => setSelectedTipoDoc(e.target.value)}
        >
          <option value="">Selecione o tipo de documento</option>
          {tipoDoc.map((tipo, index) => (
            <option key={index} value={tipo}>{tipo}</option>
          ))}
        </select>
      </div>

      {/* Campos Dinâmicos para Documento */}
      <div className="mb-4">
        <label className="block text-white">Documentos:</label>
        {documentFields.map((field, index) => (
          <div key={index} className="flex items-center mb-2">
            <input
              type="text"
              value={field}
              onChange={(e) => {
                const updatedFields = [...documentFields];
                updatedFields[index] = e.target.value;
                setDocumentFields(updatedFields);
              }}
              className="p-2 border rounded w-full"
            />
            {index === documentFields.length - 1 && documentFields.length < 8 && (
              <button
                type="button"
                onClick={addDocumentField}
                className="ml-2 px-4 py-2 bg-blue-500 text-white rounded"
              >
                +
              </button>
            )}
            {index > 0 && (
              <button
                type="button"
                onClick={() => removeDocumentField(index)}
                className="ml-2 px-4 py-2 bg-red-500 text-white rounded"
              >
                -
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Selecionar Responsável */}
      <div className="mb-4">
        <label className="block text-white">Destinatário:</label>
        <select
          className="mt-2 p-2 border rounded w-full"
          value={selectedResponsavel}
          onChange={(e) => setSelectedResponsavel(e.target.value)}
        >
          <option value="">Selecione o destinatário</option>
          {responsaveis.map((fullName, index) => (
            <option key={index} value={fullName}>{fullName}</option>
          ))}
        </select>
      </div>


      {/* Observação (ReactQuill) */}
      <div className="mb-4">
        <label className="block text-white">Observação:</label>
        <textarea
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          className="mt-2 p-2 bg-white w-full rounded-lg"
          maxLength={120}
        />
      </div>

      {/* Botão de Registrar */}
      <button
        type="button"
        onClick={handleSubmit} // Abre o modal ao invés de salvar diretamente
        className="px-4 py-2 bg-primaryBlueDark w-full hover:bg-primaryOpaci text-white rounded"
      >
        Registrar
      </button>



      <MyModal
        isOpen={isPrintModalOpen}
        onClose={() => {
          if (!canCloseModal) {
            setAlertMessage('Você precisa imprimir antes de fechar.');
            setIsAlertOpen(true); // Abre o AlertModal
          } else {
            setIsPrintModalOpen(false); // Fecha o modal se já tiver imprimido
          }
        }}
      >
        <div>
          <h2 className="text-xl mb-4">Documento salvo com sucesso</h2>
          <button
            onClick={handlePrint}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Imprimir
          </button>
        </div>
      </MyModal>



      <MyModal isOpen={isNameModalOpen} onClose={() => setIsNameModalOpen(false)}>
        <div>
          <h2 className="text-xl mb-4">Por favor, insira seu nome completo</h2>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Nome completo"
          />
          <button
            onClick={handleNameSave} // Chama a função para salvar o nome completo
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Confirmar
          </button>
        </div>
      </MyModal>

      <MyModal isOpen={isModalOpen} showCloseButton={false} onClose={() => setIsModalOpen(false)}>
        <div>
          <h2 className="text-xl mb-4">Nome completo de quem vai levar o documento</h2>
          <input
            type="text"
            value={transporte}
            onChange={(e) => setTransporte(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Nome completo"
          />
          <button
            onClick={() => {
              if (transporte.trim() === '') {
                setAlertMessage('Por favor, preencha o nome completo de quem vai levar o documento.');
                setIsAlertOpen(true); // Exibe o AlertModal
                return;
              }
              handleSave(); // Chama a função para salvar no Firebase
            }}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Confirmar
          </button>
        </div>
      </MyModal>


      <AlertModal
        isOpen={isAlertOpen}
        onRequestClose={() => setIsAlertOpen(false)}
        title="Alerta"
        message={alertMessage}
      />

      <AlertModal
        isOpen={isAlertOpenSucesso}
        onRequestClose={() => setIsAlertOpenSucesso(false)} // Mesmo que seja automático, o usuário pode fechá-lo manualmente
        title="Sucesso"
        message={alertMessage}
        showOkButton={false} // Remove o botão OK
      />


    </div>
  );
};

export default GerenciaMarketing;
