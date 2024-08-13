import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { FaCity, FaUser, FaStoreAlt, FaWhatsapp, FaFilter } from "react-icons/fa";
import { SiReasonstudios } from "react-icons/si";
import 'react-responsive-carousel/lib/styles/carousel.min.css'; // Importando o CSS padrão do Carousel
import Dropdown from '../Dropdown/Dropdown';
import Modal from '../Modal/Modal';

const ListaSolicitCompras = () => {
    const { currentUser } = useAuth();
    const [solicitacoes, setSolicitacoes] = useState([]);
    const [error, setError] = useState(null);
    const [slidesToShow, setSlidesToShow] = useState(1);
    const [statusFilter, setStatusFilter] = useState('Todos');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSolicitacao, setSelectedSolicitacao] = useState(null);
    const [buttonDisabled, setButtonDisabled] = useState(false);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [cities, setCities] = useState([]);
    const [cityFilter, setCityFilter] = useState('Todos');
    const [storeFilter, setStoreFilter] = useState('Todos');

    const openModal = (solicitacao) => {
        setSelectedSolicitacao(solicitacao);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedSolicitacao(null);
    };

    const openFilterModal = () => setIsFilterModalOpen(true);
    const closeFilterModal = () => setIsFilterModalOpen(false);

    const handleConfirmReceived = async () => {
        if (!selectedSolicitacao) return;

        try {
            const solicitacaoRef = doc(db, 'solicitCompras', selectedSolicitacao.id);
            await updateDoc(solicitacaoRef, {
                dateReceived: new Date(),
                status: 'Concluído'  // Atualize o status para 'concluído'
            });
            setButtonDisabled(true);
            closeModal();
        } catch (error) {
            console.error('Erro ao atualizar solicitação:', error);
        }
    };

    const handleResize = useCallback(() => {
        if (window.innerWidth >= 1024) {
            setSlidesToShow(3);
        } else {
            setSlidesToShow(1);
        }
    }, []);

    useEffect(() => {
        handleResize();
        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, [handleResize]);

    useEffect(() => {
        const fetchCitiesAndStores = async () => {
            const citiesRef = doc(db, 'ordersControl', 'cidades');
            const citiesSnapshot = await getDoc(citiesRef);
            if (citiesSnapshot.exists()) {
                const citiesData = citiesSnapshot.data();
                const citiesArray = Object.keys(citiesData).map(city => ({
                    name: city,
                    stores: citiesData[city]
                }));
                setCities(citiesArray);
            } else {
                console.error("Documento 'cidades' não encontrado!");
            }
        };

        fetchCitiesAndStores();
    }, []);

    useEffect(() => {
        if (!currentUser) {
            setError('Usuário não autenticado');
            return;
        }

        const solicitacoesRef = collection(db, 'solicitCompras');
        let q;

        if (currentUser.cargo === 'Supervisor') {
            q = query(solicitacoesRef);
        } else {
            q = query(solicitacoesRef, where('user', '==', currentUser.user));
        }

        if (statusFilter !== 'Todos') {
            q = query(q, where('status', '==', statusFilter));
        }

        if (cityFilter !== 'Todos') {
            q = query(q, where('cidade', '==', cityFilter));
        }

        if (storeFilter !== 'Todos') {
            q = query(q, where('loja', '==', storeFilter));
        }

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const solicitacoesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setSolicitacoes(solicitacoesData);
        }, (error) => {
            setError('Erro ao buscar solicitações');
            console.error('Erro ao buscar solicitações:', error);
        });

        return () => unsubscribe();
    }, [currentUser, statusFilter, cityFilter, storeFilter]);

    if (error) {
        return <div className="text-center mt-4 text-lg font-semibold text-red-500">{error}</div>;
    }

    return (
        <div className="flex flex-col w-full lg:h-screen min-w-[370px] bg-primary lg:pt-16 text-white p-4 lg:overflow-y-scroll">

            <div className='mb-4'>
                <div className="flex flex-col justify-center items-center gap-4 mb-4">
                    <h2 className="text-2xl font-bold">
                        Minhas Solicitações
                    </h2>
                    {currentUser.cargo === 'Supervisor' && (
                        <button
                            onClick={openFilterModal}
                            className="bg-primary flex justify-center items-center hover:bg-secondary text-white px-4 py-2 rounded"
                        >
                            <FaFilter className='text-xl' /> Filtrar
                        </button>
                    )}
                    <div className={`flex-row w-full ${currentUser.cargo === 'Supervisor' ? 'hidden' : ''}`}>
                        <p className="-mb-2">
                            Filtrar
                        </p>
                        <Dropdown
                            label=""
                            options={['Todos', 'Pendente', 'Progresso', 'Concluído']}
                            selected={statusFilter}
                            onSelectedChange={(option) => setStatusFilter(option)}
                        />
                    </div>
                </div>

                {solicitacoes.length === 0 ? (
                    <div className="text-center text-gray-500">Nenhuma solicitação encontrada</div>
                ) : (
                    <div className="space-y-4 lg:max-w-4xl lg:overflow-hidden">
                        {solicitacoes.map(solicitacao => (
                            <div key={solicitacao.id} className="p-6 lg:block max-w-[370px] bg-white text-black border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
                                <h3 className="text-xl font-semibold mb-2">
                                    {solicitacao.numSolicite}
                                </h3>
                                <div className="flex flex-col gap-4 mb-2">
                                    <div className='flex gap-4'>
                                        <p className="flex items-center">
                                            <FaCity className="mr-2" />
                                            {solicitacao.cidade}
                                        </p>
                                        <p className="flex items-center">
                                            <FaStoreAlt className="mr-2" />
                                            {solicitacao.loja}
                                        </p>
                                    </div>
                                    <div className="flex gap-4 ">
                                        <p className="flex items-center"><FaUser className="mr-2" />
                                            {solicitacao.user}
                                        </p>
                                        <a className='flex items-center bg-green-600 p-2 rounded-2xl shadow-lg' target='_blank' href={`https://wa.me/${solicitacao.whatsapp}`}>
                                            <FaWhatsapp className="text-white text-2xl" />
                                        </a>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-4 mb-2 p-4">
                                    <div className='flex gap-4'>
                                        <p className="text-gray-700 ">
                                            <strong>Tipo: </strong>
                                            {solicitacao.tipo}
                                        </p>
                                        <p className="text-gray-700 ">
                                            <strong>Item: </strong>
                                            {solicitacao.nomeItem}
                                        </p>
                                    </div>
                                    <p className="flex items-center">
                                        <SiReasonstudios className="mr-2" />
                                        Motivo: {solicitacao.motivo}
                                    </p>
                                    <p className={`text-gray-700 ${solicitacao.status === 'Concluído' ? 'text-green-500' : solicitacao.status === 'Progresso' ? 'text-yellow-500' : 'text-red-500'}`}>
                                        <strong>Status: </strong>
                                        {solicitacao.status}
                                    </p>
                                    <p className="text-gray-700">
                                        <strong>Data: </strong>
                                        {new Date(solicitacao.data.toDate()).toLocaleDateString()}
                                    </p>
                                    {solicitacao.dateSend && (
                                        <p className="text-gray-700">
                                            <strong>Enviado: </strong>
                                            {new Date(solicitacao.dateSend.toDate()).toLocaleDateString()}
                                        </p>
                                    )}

                                    {solicitacao.dateSend && (
                                        <p className="text-gray-700">
                                            <strong>Envio: </strong>
                                            {solicitacao.send}
                                        </p>
                                    )}
                                </div>
                                {solicitacao.status === 'Enviado' && (
                                    <button
                                        onClick={() => openModal(solicitacao)}
                                        disabled={solicitacao.status === 'Concluído' || buttonDisabled}
                                        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
                                    >
                                        Recebido
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <Modal isOpen={isFilterModalOpen} onClose={closeFilterModal}>
                <div className="flex flex-col gap-4">
                    <h2 className="text-xl font-semibold">Filtrar Solicitações</h2>
                    <Dropdown
                        label="Status"
                        options={['Todos', 'Pendente', 'Progresso', 'Concluído']}
                        selected={statusFilter}
                        onSelectedChange={(option) => setStatusFilter(option)}
                    />
                    <Dropdown
                        label="Cidade"
                        options={['Todos', ...cities.map(city => city.name)]}
                        selected={cityFilter}
                        onSelectedChange={(option) => setCityFilter(option)}
                    />
                    {cityFilter !== 'Todos' && (
                        <Dropdown
                            label="Loja"
                            options={['Todos', ...(cities.find(city => city.name === cityFilter)?.stores || [])]}
                            selected={storeFilter}
                            onSelectedChange={(option) => setStoreFilter(option)}
                        />
                    )}
                    <button
                        onClick={closeFilterModal}
                        className="bg-primary hover:bg-primaryOpaci text-white px-4 py-2 rounded mt-4"
                    >
                        Aplicar Filtros
                    </button>
                </div>
            </Modal>

            <Modal isOpen={isModalOpen} onClose={closeModal}>
                <div className="text-center text-gray-700">
                    <p>Você realmente recebeu?</p>
                    <div className="flex justify-center mt-4">
                        <button
                            onClick={handleConfirmReceived}
                            className="bg-green-500 text-white px-4 py-2 rounded mr-2"
                        >
                            Sim
                        </button>
                        <button
                            onClick={closeModal}
                            className="bg-red-500 text-white px-4 py-2 rounded"
                        >
                            Não
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ListaSolicitCompras;
