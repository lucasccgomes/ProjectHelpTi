import React, { useState, useEffect } from 'react';
import { db } from '../../firebase'; // Importe a instância do Firestore configurada
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { FaTrash } from 'react-icons/fa';

const TipoDocRh = () => {
    const [novoItem, setNovoItem] = useState(''); // Estado para armazenar o novo item a ser adicionado
    const [tipoDocs, setTipoDocs] = useState([]); // Estado para armazenar os itens do array tipoDoc

    // Função para buscar os itens do array tipoDoc ao carregar o componente
    const fetchTipoDocs = async () => {
        try {
            const docRef = doc(db, 'gerenciaRh', 'admRh');
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setTipoDocs(docSnap.data().tipoDoc || []); // Atualiza o estado com os itens de tipoDoc
            } else {
                //console.log('Documento não encontrado!');
            }
        } catch (error) {
            console.error('Erro ao buscar itens tipoDoc:', error);
        }
    };

    useEffect(() => {
        fetchTipoDocs(); // Chama a função para buscar os itens ao carregar o componente
    }, []);

    // Função para adicionar um novo item ao array tipoDoc
    const handleAddItem = async () => {
        if (!novoItem.trim()) return;

        try {
            const docRef = doc(db, 'gerenciaRh', 'admRh');

            await updateDoc(docRef, {
                tipoDoc: arrayUnion(novoItem)
            });

            setTipoDocs((prevDocs) => [...prevDocs, novoItem]); // Atualiza o estado local
            setNovoItem(''); // Limpa o campo de entrada após adicionar o item
        } catch (error) {
            console.error('Erro ao adicionar item ao array tipoDoc:', error);
        }
    };

    // Função para excluir um item do array tipoDoc
    const handleDeleteItem = async (item) => {
        try {
            const docRef = doc(db, 'gerenciaRh', 'admRh');

            await updateDoc(docRef, {
                tipoDoc: arrayRemove(item)
            });

            setTipoDocs((prevDocs) => prevDocs.filter((doc) => doc !== item)); // Atualiza o estado local
        } catch (error) {
            console.error('Erro ao excluir item do array tipoDoc:', error);
        }
    };

    return (
        <div className='mt-28'>
            <div className='p-8 bg-white m-8 rounded-2xl'>
                <input
                    type="text"
                    value={novoItem}
                    onChange={(e) => setNovoItem(e.target.value)}
                    placeholder="Novo tipo Doc"
                    className="px-2 py-1 border rounded"
                />
                <button onClick={handleAddItem} className="ml-2 px-4 py-1 bg-blue-500 text-white rounded">
                    Adicionar
                </button>

                <ul className="mt-4">
                    {tipoDocs.map((item, index) => (
                        <li key={index} className="flex justify-between items-center py-2 border-b">
                            <span>{item}</span>
                            <button onClick={() => handleDeleteItem(item)} className="text-red-500 hover:text-red-700">
                                <FaTrash />
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default TipoDocRh;
