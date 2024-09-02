import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import Dropdown from '../Dropdown/Dropdown';
import { IoIosSend } from "react-icons/io";
import AlertModal from '../AlertModal/AlertModal';
import { useAuth } from '../../context/AuthContext';

// Componente principal para o cadastro de itens no estoque
const CadastroEstoque = () => {
    const { currentUser, isAuthenticated, loading } = useAuth(); // Obtenção do usuário autenticado e estado de autenticação
    const [categorias, setCategorias] = useState([]); // Estado para armazenar as categorias existentes
    const [novaCategoria, setNovaCategoria] = useState(''); // Estado para uma nova categoria, se o usuário quiser adicionar uma
    const [categoriaSelecionada, setCategoriaSelecionada] = useState(''); // Estado para a categoria selecionada
    const [nomeItem, setNomeItem] = useState(''); // Estado para o nome do item a ser cadastrado
    const [amount, setAmount] = useState(''); // Estado para a quantidade do item
    const [price, setPrice] = useState(''); // Estado para o preço do item
    const [trueAmount, setTrueAmount] = useState(''); // Estado para a quantidade real do item
    const [quantityLimit, setQuantityLimit] = useState(''); // Estado para o limite de quantidade do item
    const [saving, setSaving] = useState(false); // Estado para indicar se os dados estão sendo salvos
    const [alertModalOpen, setAlertModalOpen] = useState(false); // Estado para controlar a abertura do modal de alerta
    const [alertModalContent, setAlertModalContent] = useState({ title: '', message: '', showOkButton: true }); // Estado para o conteúdo do modal de alerta
    const tipoCategoria = novaCategoria || categoriaSelecionada; // Determina o tipo de categoria (nova ou selecionada)

    // useEffect para buscar as categorias existentes ao carregar o componente
    useEffect(() => {
        const fetchCategorias = async () => {
            const estoqueRef = doc(db, 'estoqueTi', 'estoque'); // Referência ao documento de estoque no Firestore
            const estoqueDoc = await getDoc(estoqueRef); // Obtém o documento de estoque
            if (estoqueDoc.exists()) {
                setCategorias(Object.keys(estoqueDoc.data())); // Define as categorias com base nos dados do documento
            }
        };
        fetchCategorias(); // Chama a função de busca
    }, []);

    // Função para salvar um novo item no estoque
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

        setSaving(true); // Indica que o processo de salvar está em andamento
        try {
            const categoria = novaCategoria || categoriaSelecionada; // Determina a categoria a ser usada
            const estoqueRef = doc(db, 'estoqueTi', 'estoque'); // Referência ao documento de estoque no Firestore
            const estoqueDoc = await getDoc(estoqueRef); // Obtém o documento de estoque
            const estoqueData = estoqueDoc.exists() ? estoqueDoc.data() : {}; // Verifica se os dados do estoque existem

            // Verificar se o item já existe em qualquer categoria
            for (const [cat, items] of Object.entries(estoqueData)) {
                if (items && items[nomeItem]) {
                    setAlertModalContent({
                        title: 'Item Já Existe',
                        message: `O item "${nomeItem}" já existe na categoria "${cat}".`,
                        showOkButton: true
                    });
                    setAlertModalOpen(true);
                    setSaving(false); // Para de salvar se o item já existe
                    return;
                }
            }

            // Convertendo vírgula para ponto no preço, garantindo que `price` seja uma string
            const formattedPrice = String(price).replace(',', '.');

            // Criar novo item
            const newItem = {
                amount: Number(amount) || 0,
                category: categoria,
                lastUserChanged: currentUser.user,
                price: Number(formattedPrice) || 0, // Usando o preço formatado
                quantityLimit: Number(quantityLimit) || 0,
                title: nomeItem,
                trueAmount: Number(trueAmount) || 0,
                dateAdded: new Date() // Data atual
            };

            // Atualização no Firestore
            const updatedCategoria = {
                ...estoqueData[categoria],
                [nomeItem]: newItem,
            };

            await setDoc(estoqueRef, {
                ...estoqueData,
                [categoria]: updatedCategoria,
            });

            // Gravar no relatório completo (relatorioTi -> fullReport)
            const fullReportRef = doc(db, 'relatorioTi', 'fullReport'); // Referência ao relatório completo no Firestore
            const fullReportDoc = await getDoc(fullReportRef); // Obtém o documento de relatório completo
            const fullReportData = fullReportDoc.exists() ? fullReportDoc.data() : {}; // Verifica se os dados do relatório completo existem

            const reportEntry = {
                categoria: categoria,
                item: nomeItem,
                quantidadeReal: trueAmount,
                preco: Number(formattedPrice) || 0, // Usando o preço formatado
                limiteQuantidade: quantityLimit,
                quantidade: amount,
                usuario: currentUser.user, // Usa o nome do usuário autenticado
            };

            const timestamp = new Date().toISOString(); // Timestamp atual

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

            await setDoc(fullReportRef, updatedFullReport); // Salva o relatório completo atualizado no Firestore

            setAlertModalContent({ title: 'Sucesso', message: 'Item cadastrado com sucesso!', showOkButton: true });
            setAlertModalOpen(true);

            // Resetar campos após salvar
            setCategoriaSelecionada('');
            setNovaCategoria('');
            setNomeItem('');
            setAmount(0);
            setPrice(0);
            setTrueAmount(0);
            setQuantityLimit(0);
        } catch (error) {
            console.error('Erro ao cadastrar item: ', error); // Loga o erro, se ocorrer
            setAlertModalContent({ title: 'Erro', message: 'Erro ao cadastrar item.', showOkButton: true });
            setAlertModalOpen(true);
        } finally {
            setSaving(false); // Indica que o processo de salvar foi concluído
        }
    };

    return (
        <div className="p-5 bg-white border lg:min-w-[400px] flex justify-between flex-col m-4 lg:m-0 border-gray-300 rounded-xl shadow-lg">
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
