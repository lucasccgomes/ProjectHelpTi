import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import Dropdown from '../../components/Dropdown/Dropdown';
import { IoIosSend } from "react-icons/io";
import AlertModal from '../../components/AlertModal/AlertModal';
import { useAuth } from '../../context/AuthContext';

const CadastroEstoque = () => {
    const { currentUser, isAuthenticated, loading } = useAuth(); // Obtém o usuário atual e o estado de autenticação
    const [categorias, setCategorias] = useState([]);
    const [novaCategoria, setNovaCategoria] = useState('');
    const [categoriaSelecionada, setCategoriaSelecionada] = useState('');
    const [nomeItem, setNomeItem] = useState('');
    const [amount, setAmount] = useState(0);
    const [price, setPrice] = useState(0);
    const [trueAmount, setTrueAmount] = useState(0);
    const [quantityLimit, setQuantityLimit] = useState(0);
    const [saving, setSaving] = useState(false);
    const [alertModalOpen, setAlertModalOpen] = useState(false);
    const [alertModalContent, setAlertModalContent] = useState({ title: '', message: '', showOkButton: true });

    useEffect(() => {
        const fetchCategorias = async () => {
            const estoqueRef = doc(db, 'estoqueCompras', 'estoque');
            const estoqueDoc = await getDoc(estoqueRef);
            if (estoqueDoc.exists()) {
                setCategorias(Object.keys(estoqueDoc.data()));
            }
        };
        fetchCategorias();
    }, []);

    const handleSave = async () => {
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
            const tipoCategoria = novaCategoria ? "Nova Categoria" : "Categoria Existente";
            const estoqueRef = doc(db, 'estoqueCompras', 'estoque');
            const estoqueDoc = await getDoc(estoqueRef);
            const estoqueData = estoqueDoc.exists() ? estoqueDoc.data() : {};

            const newItem = {
                amount,
                category: categoria,
                lastUserChanged: currentUser.user, // Usa o nome do usuário armazenado
                price,
                quantityLimit,
                title: nomeItem,
                trueAmount,
                dateAdded: new Date() // Data de criação do item
            };

            const updatedCategoria = {
                ...estoqueData[categoria],
                [nomeItem]: newItem,
            };

            await setDoc(estoqueRef, {
                ...estoqueData,
                [categoria]: updatedCategoria,
            });

            // Gravar no relatório completo (relatorioCompras -> fullReport)
            const fullReportRef = doc(db, 'relatorioCompras', 'fullReport');
            const fullReportDoc = await getDoc(fullReportRef);
            const fullReportData = fullReportDoc.exists() ? fullReportDoc.data() : {};

            const reportEntry = {
                categoria: categoria,
                item: nomeItem,
                quantidadeReal: trueAmount,
                preco: price,
                limiteQuantidade: quantityLimit,
                quantidade: amount,
                usuario: currentUser.user, // Usa o nome do usuário armazenado
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

            // Resetar campos
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

    return (
        <div className="p-5 bg-white border min-w-[400px] lg:ml-[13rem] m-4 lg:m-0 border-gray-300 rounded-xl shadow-lg">
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
                        options={['Nova Categoria', ...categorias]} // Adicione a opção "Nova Categoria"
                        selected={categoriaSelecionada}
                        onSelectedChange={(option) => {
                            if (option === 'Nova Categoria') {
                                setCategoriaSelecionada('');
                                setNovaCategoria(''); // Limpa o campo de nova categoria para entrada do usuário
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
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            className="w-full border border-gray-300 p-2 rounded focus:ring focus:ring-blue-200"
                        />
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">Preço</label>
                        <input
                            type="number"
                            step="0.01"
                            value={price}
                            onChange={(e) => setPrice(Number(e.target.value))}
                            className="w-full border border-gray-300 p-2 rounded focus:ring focus:ring-blue-200"
                        />
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">Limite de Quantidade</label>
                        <input
                            type="number"
                            value={quantityLimit}
                            onChange={(e) => setQuantityLimit(Number(e.target.value))}
                            className="w-full border border-gray-300 p-2 rounded focus:ring focus:ring-blue-200"
                        />
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">Quantidade Real</label>
                        <input
                            type="number"
                            value={trueAmount}
                            onChange={(e) => setTrueAmount(Number(e.target.value))}
                            className="w-full border border-gray-300 p-2 rounded focus:ring focus:ring-blue-200"
                        />
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
