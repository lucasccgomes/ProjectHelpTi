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


    const barcodeInputRef = useRef(null);  // Referência para o campo de input do código de barras

  

    const PRINTERLABEL_API_URL = import.meta.env.VITE_PRINTERLABEL_API_URL;






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

            <AlertModal
                isOpen={alertModalOpen}
                onRequestClose={() => setAlertModalOpen(false)}
                title={alertModalContent.title}
                message={alertModalContent.message}
                showOkButton={alertModalContent.showOkButton}
            />
        </div>
    );
};

export default CadastroEstoque;
