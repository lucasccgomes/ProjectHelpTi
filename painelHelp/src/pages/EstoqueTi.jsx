import CadastroEstoqueTi from "../components/CadastroEstoqueTi/CadastroEstoqueTi";
import EstoqueViewerTi from "../components/EstoqueViewerTi/EstoqueViewerTi";
import Modal from 'react-modal';
import { useTransition, animated } from '@react-spring/web';
import MyModal from "../components/MyModal/MyModal";
import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';


const EstoqueTi = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWaitingForBarcode, setIsWaitingForBarcode] = useState(false);
  const [myModalOpen, setMyModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isEntrada, setIsEntrada] = useState(false);
  const barcodeInputRef = useRef(null);
  const debounceTimeout = useRef(null);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const transitions = useTransition(isModalOpen, {
    from: { opacity: 0, transform: 'translateY(-50%)' },
    enter: { opacity: 1, transform: 'translateY(0%)' },
    leave: { opacity: 0, transform: 'translateY(-50%)' },
  });

  const handleBarcodeInput = (e) => {
    const barcode = e.target.value;
    setBarcodeInput(barcode);  // Salva o código lido

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(async () => {
      if (isWaitingForBarcode) {
        setModalMessage(`Código de barras lido: ${barcode}`);

        try {
          const foundItem = await processBarcode(barcode, isEntrada);  // Passa o valor de `isEntrada` corretamente
          if (foundItem) {
            setModalMessage(`Operação concluída com sucesso para o item: ${foundItem.title}`);
          } else {
            setModalMessage('Item não encontrado ou erro ao processar.');
          }
        } catch (error) {
          console.error('Erro ao processar o código de barras:', error);
          setModalMessage('Erro ao processar o código de barras.');
        }

        setIsWaitingForBarcode(false);
      }
    }, 300); // Atraso de 300ms para garantir a leitura completa
  };

  const handleEntradaClick = () => {
    setIsEntrada(true);  // Define que é uma entrada
    setIsWaitingForBarcode(true);
    setBarcodeInput('');
    setModalMessage('Aguardando leitura do código de barras para dar entrada...');
    setMyModalOpen(true);
  };

  const handleBaixaClick = () => {
    setIsEntrada(false);  // Define que é uma baixa
    setIsWaitingForBarcode(true);
    setBarcodeInput('');
    setModalMessage('Aguardando leitura do código de barras...');
    setMyModalOpen(true);
  };

  // Função para dar baixa no item
  const handleBaixa = async (item) => {
    const { category, itemName, amount, trueAmount } = item;

    try {
      const estoqueRef = doc(db, 'estoqueTi', 'estoque');
      const estoqueDoc = await getDoc(estoqueRef);

      if (!estoqueDoc.exists()) {
        throw new Error('Estoque não encontrado');
      }

      const estoqueData = estoqueDoc.data();

      // Atualiza a quantidade de amount e trueAmount, subtraindo 1
      const updatedItem = {
        ...estoqueData[category][itemName],
        amount: Math.max(0, amount - 1), // Garante que não fique negativo
        trueAmount: Math.max(0, trueAmount - 1), // Garante que não fique negativo
      };

      const updatedCategory = {
        ...estoqueData[category],
        [itemName]: updatedItem,
      };

      // Atualiza o Firestore com os novos valores
      await setDoc(estoqueRef, {
        ...estoqueData,
        [category]: updatedCategory,
      });

      //console.log(`Baixa realizada no item "${itemName}". Quantidade atual: ${updatedItem.amount}, Quantidade real atual: ${updatedItem.trueAmount}`);
    } catch (error) {
      console.error('Erro ao dar baixa no item:', error);
      throw new Error('Erro ao dar baixa no item.');
    }
  };

  const handleEntrada = async (item) => {
    const { category, itemName, amount, trueAmount } = item;

    try {
      const estoqueRef = doc(db, 'estoqueTi', 'estoque');
      const estoqueDoc = await getDoc(estoqueRef);

      if (!estoqueDoc.exists()) {
        throw new Error('Estoque não encontrado');
      }

      const estoqueData = estoqueDoc.data();

      // Atualiza a quantidade de amount e trueAmount, adicionando 1
      const updatedItem = {
        ...estoqueData[category][itemName],
        amount: amount + 1,  // Aumenta o valor de amount
        trueAmount: trueAmount + 1,  // Aumenta o valor de trueAmount
      };

      const updatedCategory = {
        ...estoqueData[category],
        [itemName]: updatedItem,
      };

      // Atualiza o Firestore com os novos valores
      await setDoc(estoqueRef, {
        ...estoqueData,
        [category]: updatedCategory,
      });

      //console.log(`Entrada realizada no item "${itemName}". Quantidade atual: ${updatedItem.amount}, Quantidade real atual: ${updatedItem.trueAmount}`);
    } catch (error) {
      console.error('Erro ao dar entrada no item:', error);
      throw new Error('Erro ao dar entrada no item.');
    }
  };

  useEffect(() => {
    if (myModalOpen && barcodeInputRef.current) {
      barcodeInputRef.current.focus();  // Define o foco no input quando o modal abrir
    }
  }, [myModalOpen]);

  const handleInputBlur = () => {
    if (myModalOpen && barcodeInputRef.current) {
      barcodeInputRef.current.focus();  // Redefine o foco para o input se ele perder o foco
    }
  };

  const processBarcode = async (barcode, isEntrada = false) => {
    if (!barcode) {
      //console.log('Código de barras vazio'); // Log para verificar se o código está vazio
      return null;
    }

    //console.log('Processando código de barras:', barcode); // Log ao iniciar o processamento do código
    try {
      const estoqueRef = doc(db, 'estoqueTi', 'estoque');
      const estoqueDoc = await getDoc(estoqueRef);

      if (!estoqueDoc.exists()) {
        throw new Error('Estoque não encontrado');
      }

      const estoqueData = estoqueDoc.data();
      let foundItem = null;

      // Procura o item com o código de barras correspondente
      for (const [cat, items] of Object.entries(estoqueData)) {
        for (const [itemNome, itemData] of Object.entries(items)) {
          if (itemData.barcode === barcode) {
            foundItem = { ...itemData, category: cat, itemName: itemNome };
            //console.log('Item correspondente encontrado:', foundItem); // Log quando o item é encontrado
            break;
          }
        }
        if (foundItem) break;
      }

      if (foundItem) {
        if (isEntrada) {
          await handleEntrada(foundItem);  // Lida com a entrada no estoque
          //console.log(`Entrada no item "${foundItem.title}" concluída com sucesso!`); // Log para entrada concluída
        } else {
          if (foundItem.trueAmount === 0) {
            //console.log(`Estoque zerado para o item "${foundItem.title}"`); // Log se o estoque está zerado
            setModalMessage(`Impossível dar baixa no item "${foundItem.title}", pois o estoque está zerado!`);
            return null;
          }

          await handleBaixa(foundItem);  // Dá baixa no item encontrado
          //console.log(`Baixa no item "${foundItem.title}" concluída com sucesso!`); // Log para baixa concluída

          if (foundItem.amount < 2) {
            setModalMessage(`Baixa no item "${foundItem.title}" concluída com sucesso! Atenção: o estoque está acabando.`);
          } else {
            setModalMessage(`Baixa no item "${foundItem.title}" concluída com sucesso!`);
          }
        }

        return foundItem;  // Retorna o item encontrado
      } else {
        //console.log('Nenhum item correspondente encontrado para o código de barras:', barcode); // Log se nenhum item for encontrado
        return null;
      }
    } catch (error) {
      console.error('Erro ao processar o código de barras:', error); // Log para capturar o erro
      throw error;
    }
  };


  return (
    <div className="flex-col min-h-screen flex lg:flex-row items-center lg:justify-between justify-center bg-primary text-gray-900 p-4">
      <div className="hidden mt-11 lg:flex">
        <CadastroEstoqueTi />
      </div>

      <div className="lg:hidden w-full pt-8">
        <div className=" p-2 rounded-xl">
          <button
            type="button"
            onClick={openModal}
            className="w-full shadow-xl border border-gray-500 font-semibold flex justify-center items-center bg-primaryBlueDark text-white p-2 rounded hover:bg-primaryOpaci focus:outline-none focus:ring focus:ring-gray-200"
          >
            <p>Cadastro de Novo Item</p>
          </button>
        </div>
      </div>
      <div className='ml-5'>
        <div className="flex lg:flex-col justify-between gap-3">
          <button
            type="button"
            onClick={handleBaixaClick}
            className="max-w-20 gap-1 flex justify-center items-center bg-red-800 text-white p-2 rounded hover:bg-red-900 focus:outline-none focus:ring focus:ring-gray-200"
          >
            <div className=''>
              <p>SAIDA</p>
            </div>
          </button>
          <button
            type="button"
            onClick={handleEntradaClick}
            className="max-w-20 gap-1 flex justify-center items-center bg-green-600 text-white p-2 rounded hover:bg-green-500 focus:outline-none focus:ring focus:ring-gray-200"
          >
            <div className=''>
              <p>ENTRADA</p>
            </div>
          </button>
        </div>
      </div>
      <div className="mt-4">
        <EstoqueViewerTi />
      </div>
      {transitions(
        (styles, item) => item && (
          <Modal isOpen={isModalOpen}
            onRequestClose={() => setIsModalOpen(false)}
            className="modal flex items-center justify-center"
            overlayClassName="overlay"
            style={{
              overlay: { backgroundColor: 'rgba(0, 0, 0, 0.5)' },
              content: { transition: 'opacity 0.3s ease-in-out' }
            }}>
            <animated.div style={styles}>
              <div>
                <CadastroEstoqueTi />
              </div>
            </animated.div>
          </Modal>
        )
      )}
      <MyModal
        isOpen={myModalOpen}
        onClose={() => setMyModalOpen(false)}  // Fecha o modal
        showCloseButton={true}  // Exibe o botão de fechar somente quando não está aguardando o código
      >
        <div>
          <h2>Leitura de Código de Barras</h2>
          <p>{modalMessage}</p>  {/* Exibe a mensagem no modal */}

          {/* Input para capturar o código de barras */}
          {isWaitingForBarcode && (
            <input
              ref={barcodeInputRef}  // Atribui a referência ao input
              type="text"
              value={barcodeInput}
              onChange={handleBarcodeInput}
              onBlur={handleInputBlur}  // Garante que o foco volte para o input se perdido
              autoFocus  // Foca automaticamente no input quando o modal estiver aberto
            />
          )}
        </div>
      </MyModal>
    </div>
  );
};

export default EstoqueTi;
