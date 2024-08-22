import React, { useState, useEffect } from 'react';
import { doc, setDoc, onSnapshot, getDoc, deleteField } from 'firebase/firestore';
import { db } from '../../firebase';
import Modal from '../../components/Modal/Modal';
import { useAuth } from '../../context/AuthContext';
import { MdDeleteForever } from "react-icons/md";
import { SiGithubactions } from "react-icons/si";

const EstoqueViewer = () => {
    const { currentUser } = useAuth();
    const [categorias, setCategorias] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [deleteModalIsOpen, setDeleteModalIsOpen] = useState(false);
    const [actionType, setActionType] = useState('');
    const [quantityChange, setQuantityChange] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [errorModalIsOpen, setErrorModalIsOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [initialItemState, setInitialItemState] = useState(null);

    useEffect(() => {
        const estoqueRef = doc(db, 'estoqueCompras', 'estoque');

        const unsubscribe = onSnapshot(estoqueRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
                setCategorias(docSnapshot.data());
            }
        });

        return () => unsubscribe();
    }, []);

    const filteredCategorias = Object.keys(categorias).reduce((acc, categoria) => {
        const filteredItems = Object.keys(categorias[categoria]).filter(itemName =>
            itemName.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (filteredItems.length > 0) {
            acc[categoria] = filteredItems.map(itemName => ({
                ...categorias[categoria][itemName],
                categoria
            }));
        }
        return acc;
    }, {});

    const handleAction = async () => {
        if (!selectedItem || !currentUser) return;

        setIsSaving(true);

        const estoqueRef = doc(db, 'estoqueCompras', 'estoque');
        const fullReportRef = doc(db, 'relatorioCompras', 'fullReport');
        const fullReportDoc = await getDoc(fullReportRef);
        const fullReportData = fullReportDoc.exists() ? fullReportDoc.data() : {};
        const timestamp = new Date().toISOString();

        const updatedItem = { ...selectedItem };
        let reportEntry = {};

        if (actionType === 'entrada') {
            updatedItem.trueAmount += quantityChange;
            reportEntry = {
                item: updatedItem.title,
                data: new Date().toISOString(),
                quantidade: quantityChange,
                usuario: currentUser.user
            };
        } else if (actionType === 'saida') {
            if (quantityChange > updatedItem.trueAmount) {
                setErrorMessage('Erro: Não é possível subtrair mais do que o disponível em Quantidade Real.');
                setErrorModalIsOpen(true);
                setIsSaving(false);
                return;
            }
            updatedItem.trueAmount -= quantityChange;
            reportEntry = {
                item: updatedItem.title,
                data: new Date().toISOString(),
                quantidade: -quantityChange,
                usuario: currentUser.user
            };
        } else if (actionType === 'alteracao') {
            const changes = {};
            if (updatedItem.amount !== initialItemState.amount) {
                changes.quantidade = updatedItem.amount;
            }
            if (updatedItem.quantityLimit !== initialItemState.quantityLimit) {
                changes.limiteQuantidade = updatedItem.quantityLimit;
            }
            if (updatedItem.price !== initialItemState.price) {
                changes.preco = updatedItem.price;
            }
            if (updatedItem.trueAmount !== initialItemState.trueAmount) {
                changes.quantidadeReal = updatedItem.trueAmount;
            }

            if (Object.keys(changes).length > 0) {
                reportEntry = {
                    item: updatedItem.title,
                    data: new Date().toISOString(),
                    usuario: currentUser.user,
                    ...changes
                };
            }
        }

        if (actionType !== 'alteracao' || Object.keys(reportEntry).length > 3) {
            await setDoc(fullReportRef, {
                ...fullReportData,
                [timestamp]: {
                    [actionType]: reportEntry
                }
            });
        }

        await setDoc(estoqueRef, {
            ...categorias,
            [selectedItem.categoria]: {
                ...categorias[selectedItem.categoria],
                [selectedItem.title]: updatedItem
            }
        });

        setIsSaving(false);
        setModalIsOpen(false);
        setQuantityChange(0);
    };

    const handleDelete = async () => {
        if (!selectedItem || !currentUser) return;
    
        setIsSaving(true);
    
        const estoqueRef = doc(db, 'estoqueCompras', 'estoque');
        const fullReportRef = doc(db, 'relatorioCompras', 'fullReport');
        const fullReportDoc = await getDoc(fullReportRef);
        const fullReportData = fullReportDoc.exists() ? fullReportDoc.data() : {};
        const timestamp = new Date().toISOString();
    
        // Gravação no relatório para exclusão
        const reportEntry = {
            item: selectedItem.title,
            data: new Date().toISOString(),
            usuario: currentUser.user,
        };
    
        await setDoc(fullReportRef, {
            ...fullReportData,
            [timestamp]: {
                Exclusão: reportEntry
            }
        });
    
        // Remoção do item do estoque
        await setDoc(estoqueRef, {
            ...categorias,
            [selectedItem.categoria]: {
                ...categorias[selectedItem.categoria],
                [selectedItem.title]: deleteField(),
            }
        }, { merge: true });
    
        setIsSaving(false);
        setDeleteModalIsOpen(false);
    };
    

    const openModal = (item) => {
        setSelectedItem(item);
        setInitialItemState({ ...item });
        setModalIsOpen(true);
    };

    const openDeleteModal = (item) => {
        setSelectedItem(item);
        setDeleteModalIsOpen(true);
    };

    return (
        <div className="lg:p-5 p-3 bg-white border  lg:min-w-[400px] m-1 border-gray-300 rounded-xl shadow-lg">
            <div className='bg-white w-full px-4'>
                <h2 className="text-xl font-bold mb-4 text-gray-700">Visualizar Estoque</h2>
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Buscar itens..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full border border-gray-300 p-2 mr-3 rounded focus:ring focus:ring-blue-200"
                    />
                </div>
            </div>
            <div>
                <div className='max-h-[320px] lg:max-h-[320px] overflow-auto px-2'>
                    {Object.keys(filteredCategorias).map(categoria => (
                        <div key={categoria} className="mb-4 ">
                            <h3 className="text-lg font-semibold text-gray-800">{categoria}</h3>
                            <ul className="pl-4">
                                {filteredCategorias[categoria].map(item => (
                                    <li key={item.title} className="mb-2">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-1 border-b-2">
                                                <div className='mr-1'>
                                                    <button
                                                        className="bg-primaryBlueDark text-white p-1 rounded"
                                                        onClick={() => openModal(item)}
                                                    >
                                                        <p className='text-xl'><SiGithubactions /></p>
                                                    </button>
                                                </div>
                                                <div className=''>
                                                    <div className='mr-1'>
                                                        <span className="font-medium">{item.title}</span>
                                                    </div>
                                                    <div className='flex gap-1'>
                                                        <div>
                                                            <div className='flex'>
                                                                <p className='font-semibold'>Qtd:</p>
                                                                {item.amount}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className='flex'>
                                                                <p className='font-semibold'>Qtd. Real:</p>
                                                                {item.trueAmount}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className='flex'>
                                                                <p className='font-semibold'>R$</p>
                                                                {item.price.toFixed(2)}
                                                            </div>
                                                        </div>
                                                      
                                                    </div>
                                                </div>
                                            </div>
                                            <div className='ml-1'>
                                                <MdDeleteForever
                                                    onClick={() => openDeleteModal(item)}
                                                    className="text-red-500 cursor-pointer hover:scale-110 transition-transform"
                                                    size={24}
                                                />
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
            {Object.keys(filteredCategorias).length === 0 && (
                <p className="text-gray-500">Nenhum item encontrado.</p>
            )}

            <Modal isOpen={modalIsOpen} onClose={() => setModalIsOpen(false)}>
                {selectedItem && (
                    <div>
                        <h3 className="text-lg font-bold mb-2">{selectedItem.categoria} - {selectedItem.title}</h3>
                        <div className="flex justify-between mb-4">
                            <button
                                className="bg-green-500 text-white p-2 rounded"
                                onClick={() => setActionType('entrada')}
                            >
                                Entrada
                            </button>
                            <button
                                className="bg-yellow-500 text-white p-2 rounded"
                                onClick={() => setActionType('alteracao')}
                            >
                                Alteração
                            </button>
                            <button
                                className="bg-red-500 text-white p-2 rounded"
                                onClick={() => setActionType('saida')}
                            >
                                Saída
                            </button>
                        </div>

                        {actionType === 'entrada' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Adicionar Quantidade</label>
                                <input
                                    type="number"
                                    value={quantityChange}
                                    onChange={(e) => setQuantityChange(Number(e.target.value))}
                                    className="w-full border border-gray-300 p-2 rounded focus:ring focus:ring-blue-200"
                                />
                                <button
                                    className="bg-blue-500 text-white p-2 mt-4 rounded w-full"
                                    onClick={handleAction}
                                >
                                    Confirmar Entrada
                                </button>
                            </div>
                        )}

                        {actionType === 'saida' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Subtrair Quantidade</label>
                                <input
                                    type="number"
                                    value={quantityChange}
                                    onChange={(e) => setQuantityChange(Number(e.target.value))}
                                    className="w-full border border-gray-300 p-2 rounded focus:ring focus:ring-blue-200"
                                />
                                <button
                                    className="bg-blue-500 text-white p-2 mt-4 rounded w-full"
                                    onClick={handleAction}
                                >
                                    Confirmar Saída
                                </button>
                            </div>
                        )}

                        {actionType === 'alteracao' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Quantidade</label>
                                <input
                                    type="number"
                                    value={selectedItem.amount}
                                    onChange={(e) => setSelectedItem({ ...selectedItem, amount: Number(e.target.value) })}
                                    className="w-full border border-gray-300 p-2 rounded focus:ring focus:ring-blue-200"
                                />
                                <label className="block text-sm font-medium text-gray-700 mt-2">Preço</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={selectedItem.price}
                                    onChange={(e) => setSelectedItem({ ...selectedItem, price: Number(e.target.value) })}
                                    className="w-full border border-gray-300 p-2 rounded focus:ring focus:ring-blue-200"
                                />
                                <label className="block text-sm font-medium text-gray-700 mt-2">Limite de Quantidade</label>
                                <input
                                    type="number"
                                    value={selectedItem.quantityLimit}
                                    onChange={(e) => setSelectedItem({ ...selectedItem, quantityLimit: Number(e.target.value) })}
                                    className="w-full border border-gray-300 p-2 rounded focus:ring focus:ring-blue-200"
                                />
                                <label className="block text-sm font-medium text-gray-700 mt-2">Quantidade Real</label>
                                <input
                                    type="number"
                                    value={selectedItem.trueAmount}
                                    onChange={(e) => setSelectedItem({ ...selectedItem, trueAmount: Number(e.target.value) })}
                                    className="w-full border border-gray-300 p-2 rounded focus:ring focus:ring-blue-200"
                                />
                                <button
                                    className="bg-blue-500 text-white p-2 mt-4 rounded w-full"
                                    onClick={handleAction}
                                >
                                    Confirmar Alteração
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* Modal de confirmação de exclusão */}
            <Modal isOpen={deleteModalIsOpen} onClose={() => setDeleteModalIsOpen(false)}>
                <div className="p-4">
                    <h3 className="text-lg font-bold mb-2">Confirmar Exclusão</h3>
                    <p>Tem certeza de que deseja excluir o item <strong>{selectedItem?.title}</strong>?</p>
                    <div className="flex justify-end mt-4">
                        <button
                            className="bg-gray-300 text-gray-800 p-2 rounded mr-2"
                            onClick={() => setDeleteModalIsOpen(false)}
                        >
                            Cancelar
                        </button>
                        <button
                            className="bg-red-500 text-white p-2 rounded"
                            onClick={handleDelete}
                        >
                            Excluir
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Modal para exibir mensagens de erro */}
            <Modal isOpen={errorModalIsOpen} onClose={() => setErrorModalIsOpen(false)}>
                <div className="p-4">
                    <h3 className="text-lg font-bold mb-2">Erro</h3>
                    <p>{errorMessage}</p>
                    <button
                        className="bg-red-500 text-white p-2 mt-4 rounded w-full"
                        onClick={() => setErrorModalIsOpen(false)}
                    >
                        Fechar
                    </button>
                </div>
            </Modal>

            <Modal isOpen={isSaving} onClose={() => { }}>
                <div className="flex items-center justify-center">
                    <p className="text-lg font-medium">Salvando informação...</p>
                </div>
            </Modal>
        </div>
    );
};

export default EstoqueViewer;