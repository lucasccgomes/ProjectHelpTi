import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import Dropdown from '../Dropdown/Dropdown';
import { IoIosSend } from "react-icons/io";
import AlertModal from '../AlertModal/AlertModal';
import { useAuth } from '../../context/AuthContext';
import JsBarcode from 'jsbarcode';
import MyModal from '../MyModal/MyModal';

const CadastroEstoque = () => {
    const { currentUser, isAuthenticated, loading } = useAuth();
    const [categorias, setCategorias] = useState([]);
    const [novaCategoria, setNovaCategoria] = useState('');
    const [categoriaSelecionada, setCategoriaSelecionada] = useState('');
    const [nomeItem, setNomeItem] = useState('');
    const [amount, setAmount] = useState('');
    const [price, setPrice] = useState('');
    const [trueAmount, setTrueAmount] = useState('');
    const [quantityLimit, setQuantityLimit] = useState('');
    const [saving, setSaving] = useState(false);
    const [alertModalOpen, setAlertModalOpen] = useState(false);
    const [alertModalContent, setAlertModalContent] = useState({ title: '', message: '', showOkButton: true });
    const [barcode, setBarcode] = useState(''); // Estado para armazenar o código de barras
    const barcodeRef = useRef(null); // Referência para o elemento canvas
    const tipoCategoria = novaCategoria || categoriaSelecionada;
    const [scannedBarcode, setScannedBarcode] = useState('');
    const [modalTimer, setModalTimer] = useState(null);
    const [typingTimeout, setTypingTimeout] = useState(null);
    const [barcodeInput, setBarcodeInput] = useState('');
    const debounceTimeout = useRef(null);
    const [isWaitingForBarcode, setIsWaitingForBarcode] = useState(false);
    const [myModalOpen, setMyModalOpen] = useState(false);  // Estado para controlar o MyModal
    const [modalMessage, setModalMessage] = useState('');  // Mensagem a ser exibida no MyModal
    const [isBaixaConcluida, setIsBaixaConcluida] = useState(false);  // Controle para saber se a baixa foi concluída
    const [isEntrada, setIsEntrada] = useState(false); // Estado para controlar se é entrada ou baixa


    const barcodeInputRef = useRef(null);  // Referência para o campo de input do código de barras

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

    const PRINTERLABEL_API_URL = import.meta.env.VITE_PRINTERLABEL_API_URL;

    const handleBaixaClick = () => {
        setIsEntrada(false);  // Define que é uma baixa
        setIsWaitingForBarcode(true);
        setBarcodeInput('');
        setModalMessage('Aguardando leitura do código de barras...');
        setMyModalOpen(true);
    };

    const handleEntradaClick = () => {
        setIsEntrada(true);  // Define que é uma entrada
        setIsWaitingForBarcode(true);
        setBarcodeInput('');
        setModalMessage('Aguardando leitura do código de barras para dar entrada...');
        setMyModalOpen(true);
    };


    // useEffect para buscar as categorias existentes ao carregar o componente
    useEffect(() => {
        const fetchCategorias = async () => {
            const estoqueRef = doc(db, 'estoqueTi', 'estoque');
            const estoqueDoc = await getDoc(estoqueRef);
            if (estoqueDoc.exists()) {
                setCategorias(Object.keys(estoqueDoc.data()));
            }
        };
        fetchCategorias();
    }, []);

    // useEffect para gerar o código de barras quando "barcode" mudar
    useEffect(() => {
        if (barcode && barcodeRef.current) {
            JsBarcode(barcodeRef.current, barcode, {
                format: 'CODE128',
                width: 2,
                height: 50,
                displayValue: true
            });
        }
    }, [barcode]);

    const handleSave = async () => {
        // Validações
        if (loading) {
            setAlertModalContent({ title: 'Aguarde', message: 'Carregando dados do usuário. Por favor, aguarde...', showOkButton: true });
            setAlertModalOpen(true);
            return;
        }

        if (!nomeItem || (!novaCategoria && !categoriaSelecionada)) {
            setAlertModalContent({ title: 'Atenção', message: 'Por favor, preencha todos os campos obrigatórios.', showOkButton: true });
            setAlertModalOpen(true);
            return;
        }

        if (!isAuthenticated || !currentUser) {
            setAlertModalContent({ title: 'Erro', message: 'Usuário não autenticado. Por favor, faça login novamente.', showOkButton: true });
            setAlertModalOpen(true);
            return;
        }

        setSaving(true);
        try {
            const categoria = novaCategoria || categoriaSelecionada;
            const estoqueRef = doc(db, 'estoqueTi', 'estoque');
            const estoqueDoc = await getDoc(estoqueRef);
            const estoqueData = estoqueDoc.exists() ? estoqueDoc.data() : {};

            // Verificar se o item já existe em qualquer categoria
            for (const [cat, items] of Object.entries(estoqueData)) {
                if (items && items[nomeItem]) {
                    setAlertModalContent({
                        title: 'Item Já Existe',
                        message: `O item "${nomeItem}" já existe na categoria "${cat}".`,
                        showOkButton: true
                    });
                    setAlertModalOpen(true);
                    setSaving(false);
                    return;
                }
            }

            // Gerar um código de barras único
            const generatedBarcode = `PROD-${Date.now()}`;
            setBarcode(generatedBarcode); // Define o código de barras gerado

            // Criar novo item
            const newItem = {
                amount: Number(amount) || 0,
                category: categoria, // Aqui usamos o valor correto de categoria
                lastUserChanged: currentUser.user,
                price: Number(String(price).replace(',', '.')) || 0, // Formatar o preço
                quantityLimit: Number(quantityLimit) || 0,
                title: nomeItem,
                trueAmount: Number(trueAmount) || 0,
                dateAdded: new Date(),
                barcode: generatedBarcode // Adiciona o código de barras gerado
            };

            // Atualizar o Firestore
            const updatedCategoria = {
                ...estoqueData[categoria],
                [nomeItem]: newItem,
            };

            await setDoc(estoqueRef, {
                ...estoqueData,
                [categoria]: updatedCategoria,
            });

            // Gravar no relatório completo
            const fullReportRef = doc(db, 'relatorioTi', 'fullReport');
            const fullReportDoc = await getDoc(fullReportRef);
            const fullReportData = fullReportDoc.exists() ? fullReportDoc.data() : {};

            const reportEntry = {
                categoria: categoria,
                item: nomeItem,
                quantidadeReal: trueAmount,
                preco: Number(String(price).replace(',', '.')) || 0,
                limiteQuantidade: quantityLimit,
                quantidade: amount,
                usuario: currentUser.user,
            };

            const timestamp = new Date().toISOString();

            const updatedFullReport = {
                ...fullReportData,
                [timestamp]: {
                    ...fullReportData[timestamp],
                    [tipoCategoria]: {
                        ...fullReportData[timestamp]?.[tipoCategoria],
                        [categoria]: {
                            ...fullReportData[timestamp]?.[tipoCategoria]?.[categoria],
                            [nomeItem]: reportEntry,
                        },
                    },
                },
            };

            await setDoc(fullReportRef, updatedFullReport);

            setAlertModalContent({ title: 'Sucesso', message: 'Item cadastrado com sucesso!', showOkButton: true });
            setAlertModalOpen(true);

            // Chama a função de impressão após o código de barras ter sido gerado e item salvo
            await handlePrintEtiquetas(newItem);

            // Resetar campos após salvar
            setCategoriaSelecionada('');
            setNovaCategoria('');
            setNomeItem('');
            setAmount(0);
            setPrice(0);
            setTrueAmount(0);
            setQuantityLimit(0);
        } catch (error) {
            console.error('Erro ao cadastrar item: ', error);
            setAlertModalContent({ title: 'Erro', message: 'Erro ao cadastrar item.', showOkButton: true });
            setAlertModalOpen(true);
        } finally {
            setSaving(false);
        }
    };

    const handlePrintEtiquetas = async (item) => {
        const { categoria, title, barcode, trueAmount } = item;

        try {
            // Log de verificação antes de iniciar o processo de impressão
            console.log('Iniciando processo de impressão de múltiplas etiquetas...');
            console.log(`Quantidade de etiquetas a imprimir: ${trueAmount}`);

            // Laço para enviar múltiplas requisições, conforme o valor de trueAmount
            for (let i = 0; i < trueAmount; i++) {
                console.log(`Imprimindo etiqueta ${i + 1} de ${trueAmount}`);

                // Envia os dados para o backend para impressão de uma única etiqueta
                const response = await fetch(PRINTERLABEL_API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        categoria: categoria,
                        nomeItem: title,
                        barcode: barcode,
                        quantidadeEtiquetas: 1, // Aqui, imprimimos uma etiqueta por requisição
                    }),
                });

                if (response.ok) {
                    const responseData = await response.json();
                    console.log(`Etiqueta ${i + 1} de ${trueAmount} enviada com sucesso. Resposta:`, responseData);
                } else {
                    const errorData = await response.json();
                    console.error(`Erro ao imprimir etiqueta ${i + 1}:`, errorData);
                    setAlertModalContent({
                        title: 'Erro',
                        message: `Erro ao imprimir etiqueta ${i + 1}: ${errorData.message || 'Erro desconhecido'}`,
                        showOkButton: true
                    });
                    setAlertModalOpen(true);
                    return; // Para o processo de impressão em caso de erro
                }
            }

            // Exibe mensagem de sucesso após todas as etiquetas serem impressas
            setAlertModalContent({
                title: 'Sucesso',
                message: `Todas as ${trueAmount} etiquetas foram enviadas para impressão com sucesso!`,
                showOkButton: true
            });
            setAlertModalOpen(true);
            // Limpar o campo de código de barras após a impressão
            setBarcode('');

        } catch (error) {
            console.error('Erro ao enviar impressão:', error);
            setAlertModalContent({
                title: 'Erro',
                message: 'Erro ao imprimir etiquetas.',
                showOkButton: true
            });
            setAlertModalOpen(true);
        }
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

            console.log(`Baixa realizada no item "${itemName}". Quantidade atual: ${updatedItem.amount}, Quantidade real atual: ${updatedItem.trueAmount}`);
        } catch (error) {
            console.error('Erro ao dar baixa no item:', error);
            throw new Error('Erro ao dar baixa no item.');
        }
    };

    useEffect(() => {
        return () => {
            if (typingTimeout) {
                clearTimeout(typingTimeout);
            }
        };
    }, [typingTimeout]);

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
                    const foundItem = await processBarcode(barcode, isEntrada);  // Agora `isEntrada` é passado corretamente
                    if (foundItem) {
                        setIsBaixaConcluida(true);
                    } else {
                        setIsBaixaConcluida(false);
                    }
                } catch (error) {
                    console.error('Erro ao processar o código de barras:', error);
                    setModalMessage('Erro ao processar o código de barras.');
                }

                setIsWaitingForBarcode(false);
            }
        }, 300); // Atraso de 300ms para garantir a leitura completa
    };


    const processBarcode = async (barcode, isEntrada = false) => {
        if (!barcode) {
            console.log('Código de barras vazio'); // Log para verificar se o código está vazio
            return null;
        }

        console.log('Processando código de barras:', barcode); // Log ao iniciar o processamento do código
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
                        console.log('Item correspondente encontrado:', foundItem); // Log quando o item é encontrado
                        break;
                    }
                }
                if (foundItem) break;
            }

            if (foundItem) {
                if (isEntrada) {
                    await handleEntrada(foundItem);  // Lida com a entrada no estoque
                    console.log(`Entrada no item "${foundItem.title}" concluída com sucesso!`); // Log para entrada concluída
                } else {
                    if (foundItem.trueAmount === 0) {
                        console.log(`Estoque zerado para o item "${foundItem.title}"`); // Log se o estoque está zerado
                        setModalMessage(`Impossível dar baixa no item "${foundItem.title}", pois o estoque está zerado!`);
                        return null;
                    }

                    await handleBaixa(foundItem);  // Dá baixa no item encontrado
                    console.log(`Baixa no item "${foundItem.title}" concluída com sucesso!`); // Log para baixa concluída

                    if (foundItem.amount < 2) {
                        setModalMessage(`Baixa no item "${foundItem.title}" concluída com sucesso! Atenção: o estoque está acabando.`);
                    } else {
                        setModalMessage(`Baixa no item "${foundItem.title}" concluída com sucesso!`);
                    }
                }

                return foundItem;  // Retorna o item encontrado
            } else {
                console.log('Nenhum item correspondente encontrado para o código de barras:', barcode); // Log se nenhum item for encontrado
                return null;
            }
        } catch (error) {
            console.error('Erro ao processar o código de barras:', error); // Log para capturar o erro
            throw error;
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

            console.log(`Entrada realizada no item "${itemName}". Quantidade atual: ${updatedItem.amount}, Quantidade real atual: ${updatedItem.trueAmount}`);
        } catch (error) {
            console.error('Erro ao dar entrada no item:', error);
            throw new Error('Erro ao dar entrada no item.');
        }
    };

    return (
        <div className="p-5 bg-white border lg:min-w-[400px] flex flex-row justify-between m-4 lg:m-0 border-gray-300 rounded-xl shadow-lg">
            <div className='flex flex-col justify-between'>
                <div className='flex justify-between'>
                    <h2 className="text-xl font-bold mb-4 block text-gray-700">Cadastro de Novo Item</h2>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="max-w-20 gap-1 flex justify-center items-center bg-primaryBlueDark text-white p-2 rounded hover:bg-primaryOpaci focus:outline-none focus:ring focus:ring-gray-200"
                        disabled={saving}
                    >
                        <p>{saving ? 'Salvando...' : 'Salvar'}</p>
                        <IoIosSend />
                    </button>
                </div>

                <div className="space-y-2">
                    <div className="">
                        <Dropdown
                            label="Categoria"
                            options={['Nova Categoria', ...categorias]}
                            selected={categoriaSelecionada}
                            onSelectedChange={(option) => {
                                if (option === 'Nova Categoria') {
                                    setCategoriaSelecionada('');
                                    setNovaCategoria('');
                                } else {
                                    setCategoriaSelecionada(option);
                                    setNovaCategoria('');
                                }
                            }}
                        />
                        {categoriaSelecionada === '' && (
                            <input
                                type="text"
                                placeholder="Digite o nome da nova categoria"
                                value={novaCategoria}
                                onChange={(e) => setNovaCategoria(e.target.value)}
                                className="w-full border border-gray-300 p-2 rounded focus:ring focus:ring-blue-200 mt-2"
                            />
                        )}
                    </div>
                    <div className="">
                        <label className="block mb-1 text-sm font-medium text-gray-700">Nome do Item</label>
                        <input
                            type="text"
                            value={nomeItem}
                            onChange={(e) => setNomeItem(e.target.value)}
                            className="w-full border border-gray-300 p-2 rounded focus:ring focus:ring-blue-200"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">Quantidade</label>
                            <input
                                type="text"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full border border-gray-300 p-2 rounded focus:ring focus:ring-blue-200"
                            />
                        </div>
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">Preço</label>
                            <input
                                type="text"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="w-full border border-gray-300 p-2 rounded focus:ring focus:ring-blue-200"
                            />
                        </div>
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">Limite de Quantidade</label>
                            <input
                                type="text"
                                value={quantityLimit}
                                onChange={(e) => setQuantityLimit(e.target.value)}
                                className="w-full border border-gray-300 p-2 rounded focus:ring focus:ring-blue-200"
                            />
                        </div>
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">Quantidade Real</label>
                            <input
                                type="text"
                                value={trueAmount}
                                onChange={(e) => setTrueAmount(e.target.value)}
                                className="w-full border border-gray-300 p-2 rounded focus:ring focus:ring-blue-200"
                            />
                        </div>
                    </div>
                    <div className="flex flex-col justify-center items-center">
                        <h4 className="text-sm font-medium text-gray-700">Código de Barras Gerado:</h4>
                        <canvas className='h-14' ref={barcodeRef}></canvas>
                    </div>
                </div>
            </div>
            <div className='ml-5'>
                <div className="flex flex-col justify-between gap-3">
                    <button
                        type="button"
                        onClick={handleBaixaClick}
                        className="max-w-20 gap-1 flex justify-center items-center bg-red-800 text-white p-2 rounded hover:bg-red-900 focus:outline-none focus:ring focus:ring-gray-200"
                    >
                        <div className=''>
                            <p>B</p>
                            <p>A</p>
                            <p>I</p>
                            <p>X</p>
                            <p>A</p>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={handleEntradaClick}
                        className="max-w-20 gap-1 flex justify-center items-center bg-green-600 text-white p-2 rounded hover:bg-green-500 focus:outline-none focus:ring focus:ring-gray-200"
                    >
                         <div className=''>
                            <p>E</p>
                            <p>N</p>
                            <p>T</p>
                            <p>R</p>
                            <p>A</p>
                            <p>D</p>
                            <p>A</p>
                        </div>
                    </button>
                </div>
            </div>
            <AlertModal
                isOpen={alertModalOpen}
                onRequestClose={() => setAlertModalOpen(false)}
                title={alertModalContent.title}
                message={alertModalContent.message}
                showOkButton={alertModalContent.showOkButton}
            />

            <MyModal
                isOpen={myModalOpen}
                onClose={() => setMyModalOpen(false)}  // Fecha o modal
                showCloseButton={!isWaitingForBarcode}  // Exibe o botão de fechar somente quando não está aguardando o código
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

export default CadastroEstoque;
