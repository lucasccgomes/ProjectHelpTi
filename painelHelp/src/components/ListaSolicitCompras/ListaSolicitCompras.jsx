import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { FaCity, FaUser, FaStoreAlt, FaShuttleVan, FaFilter, FaCheckCircle } from "react-icons/fa";
import { RiUserReceived2Fill } from "react-icons/ri";
import { SiReasonstudios } from "react-icons/si";
import 'react-responsive-carousel/lib/styles/carousel.min.css'; // Importando o CSS padrão do Carousel
import Dropdown from '../Dropdown/Dropdown';
import { MdOutlineAddShoppingCart } from "react-icons/md";
import { GrNewWindow, GrStatusUnknown, GrInProgress } from "react-icons/gr";
import { ImCancelCircle } from "react-icons/im";
import { TbReplaceFilled } from "react-icons/tb";
import Modal from '../Modal/Modal';
import { IoCalendarNumber } from "react-icons/io5";
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

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
    const openFilterModal = () => setIsFilterModalOpen(true);
    const closeFilterModal = () => setIsFilterModalOpen(false);
    const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);
    const [canceledReason, setCanceledReason] = useState('');
    const [selectedDate, setSelectedDate] = useState(null);
    const [isOrderChangedModalOpen, setIsOrderChangedModalOpen] = useState(false);
    const [orderChangeDetails, setOrderChangeDetails] = useState(null);

    const openOrderChangedModal = (solicitacao) => {
        setOrderChangeDetails({
            reasonChange: solicitacao.reasonChange,
            originalOrder: solicitacao.originalOrder,
            item: solicitacao.item,
        });
        setIsOrderChangedModalOpen(true);
    };


    const openReasonModal = (reason) => {
        setCanceledReason(reason);
        setIsReasonModalOpen(true);
    };


    const abreviarCidade = (cidade) => {
        const palavras = cidade.split(' ');
        if (palavras.length > 1) {
            const primeiraPalavra = palavras[0].substring(0, 3); // Abrevia a primeira palavra
            const ultimaPalavra = palavras[palavras.length - 1]; // Mantém a última palavra completa
            return `${primeiraPalavra}. ${ultimaPalavra}`;
        }
        return cidade; // Se for uma única palavra, retorna sem abreviação
    };

    const openModal = (solicitacao) => {
        setSelectedSolicitacao(solicitacao);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedSolicitacao(null);
    };

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
        <div className="flex flex-col w-full lg:h-screen lg:min-w-[407px] bg-primaryBlueDark lg:pt-16 text-white p-4 lg:overflow-y-scroll">

            <div className='mb-4'>
                <div className="flex bg-primaryBlueDark lg:min-w-[378px] lg:fixed flex-col justify-center items-center gap-4 lg:-mt-3 lg:pb-3">
                    <h2 className="text-2xl font-bold">
                        Compras Solicitações
                    </h2>
                    {currentUser.cargo === 'Supervisor' && (
                        <button
                            onClick={openFilterModal}
                            className="bg-primaryBlueDark flex justify-center items-center hover:bg-secondary text-white px-4 py-2 rounded"
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
                            options={['Todos', 'Pendente', 'Separando', 'Concluído', 'Enviado', 'Cancelado']}
                            selected={statusFilter}
                            onSelectedChange={(option) => setStatusFilter(option)}
                        />
                    </div>
                </div>
                {solicitacoes.length === 0 ? (
                    <div className="text-center text-gray-500">Nenhuma solicitação encontrada</div>
                ) : (
                    <div className="space-y-4 lg:max-w-4xl lg:block !flex flex-col justify-center items-center lg:overflow-hidden lg:pt-32 pt-4">
                        {solicitacoes.map(solicitacao => (
                            <div key={solicitacao.id} className="px-4 pb-4 lg:block max-w-[324px] bg-white text-black border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
                                <div className='flex justify-between pb-3'>
                                    <h3 className="p-2 rounded-br-xl shadow-xl  -ml-5 -mt-1 text-2xl bg-primaryBlueDark text-white font-bold">
                                        {solicitacao.numSolicite}
                                    </h3>
                                    <p className="text-primaryBlueDark cursor- flex text-3xl items-center">
                                        {solicitacao.tipo === 'Reposição' && <TbReplaceFilled className="ml-2" title='Item Reposição' />}
                                        {solicitacao.tipo === 'Novo' && <GrNewWindow className="ml-2" title='Item Novo' />}
                                    </p>
                                </div>
                                <div className="flex flex-col justify-between items-center gap-4 mb-2">
                                    <div className='flex gap-4 '>
                                        <div className="flex items-center">
                                            <FaCity className="mr-2 text-primaryBlueDark text-xl" />
                                            <p className='font-semibold text-gray-700 text-xs'>
                                                {abreviarCidade(solicitacao.cidade)}
                                            </p>
                                        </div>
                                        <div className="flex items-center">
                                            <FaStoreAlt className="mr-2 text-primaryBlueDark text-xl" />
                                            <p className='font-semibold text-gray-700 text-xs'>
                                                {solicitacao.loja}
                                            </p>
                                        </div>
                                        <div className="flex items-center">
                                            <FaUser className="mr-2 text-primaryBlueDark text-xl" />
                                            <p className='font-semibold text-gray-700 text-xs'>
                                                {solicitacao.user}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-4 mb-2 p-4">
                                    {Object.entries(solicitacao.item).map(([itemNome, quantidade]) => (
                                        <div key={itemNome} className='flex justify-between gap-2 shadow-lg bg-primaryBlueDark p-2 rounded-xl text-white'>
                                            <div className='font-semibold flex justify-center items-center'>
                                                <MdOutlineAddShoppingCart className='text-xl text-white' />
                                                <p className='ml-2'>
                                                    {itemNome}
                                                </p>
                                            </div>
                                            <div className='font-semibold flex'>
                                                <p>
                                                    Qtd:
                                                </p>
                                                <p className='font-normal ml-1'>
                                                    {quantidade}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="flex flex-col items-center w-full break-all">
                                        <div className='flex justify-center items-center'>
                                            <SiReasonstudios className="mr-2 text-primaryBlueDark text-xl" />
                                            <p className='font-semibold text-gray-700'>
                                                Motivo
                                            </p>
                                        </div>
                                        <p>
                                            {solicitacao.motivo}
                                        </p>
                                    </div>

                                    <div className="flex justify-between items-center gap-2 text-gray-700">
                                        <div className="flex justify-center items-center text-gray-700">
                                            <IoCalendarNumber className="mr-2 text-primaryBlueDark text-xl" />
                                            <p className='font-semibold text-gray-700'>
                                                {new Date(solicitacao.data.toDate()).toLocaleDateString()}
                                            </p>
                                        </div>
                                        {solicitacao.status === 'Enviado' && solicitacao.dateSend && (
                                            <div className="flex justify-start items-center text-gray-700">
                                                <FaShuttleVan className="mr-2 text-primaryBlueDark text-xl" />
                                                <p className='font-semibold text-gray-700'>
                                                    {new Date(solicitacao.dateSend.toDate()).toLocaleDateString()}
                                                </p>
                                            </div>
                                        )}

                                        {solicitacao.status === 'Concluído' && solicitacao.dateReceived && (
                                            <div className="flex justify-start items-center text-gray-700">
                                                <RiUserReceived2Fill className="mr-2 text-primaryBlueDark text-xl" />
                                                <p className='font-semibold text-gray-700'>
                                                    {new Date(solicitacao.dateReceived.toDate()).toLocaleDateString()}
                                                </p>
                                            </div>
                                        )}
                                        <div className={`text-gray-700 ${solicitacao.status === 'Concluído' ? 'text-green-500' : solicitacao.status === 'Progresso' ? 'text-yellow-500' : solicitacao.status === 'Cancelado' || solicitacao.status === 'Pendente' ? 'text-red-500' : 'text-primaryBlueDark'}`}>
                                            <p className="text-primaryBlueDark flex text-3xl items-center">
                                                {solicitacao.status === 'Pendente' && <GrStatusUnknown className="ml-2 text-secRed text-3xl" title='Pendente' />}
                                                {solicitacao.status === 'Separando' && <GrInProgress className="ml-2 text-orange-600 text-3xl" title='Separando' />}
                                                {solicitacao.status === 'Cancelado' && <ImCancelCircle className="ml-2 text-secRed text-3xl" title='Cancelado' />}
                                                {solicitacao.status === 'Enviado' && <FaShuttleVan className="ml-2 text-primaryOpaci text-3xl" title='Enviado' />}
                                                {solicitacao.status === 'Concluído' && <FaCheckCircle className="ml-2 text-green-700 text-3xl" title='Concluído' />}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                {solicitacao.status === 'Cancelado' && (
                                    <div className='flex flex-col justify-center'>
                                        <p className='text-center text-gray-800'>Solicitação Cancelada</p>
                                        <button
                                            onClick={() => openReasonModal(solicitacao.canceledReason)}
                                            className="bg-red-500 text-white px-4 py-2 rounded mt-2"
                                        >
                                            Ver Motivo
                                        </button>
                                    </div>
                                )}
                                {solicitacao.status === 'Enviado' && (
                                    <button
                                        onClick={() => openModal(solicitacao)}
                                        disabled={solicitacao.status === 'Concluído' || buttonDisabled}
                                        className="bg-primaryBlueDark w-full text-white px-4 py-2 rounded disabled:opacity-50 transform transition-transform duration-500 ease-in-out hover:scale-105 animate-pulse"
                                    >
                                        Você recebeu? Clique aqui.
                                    </button>
                                )}
                                {solicitacao.reasonChange && solicitacao.reasonChange.trim() !== '' && (
                                    <div className='flex flex-col justify-center'>
                                        <p className='text-gray-800 text-center'>
                                            Teve alteração na Solicitação.
                                        </p>
                                        <button
                                            onClick={() => openOrderChangedModal(solicitacao)}
                                            className="bg-yellow-800 text-white px-4 py-2 rounded mt-2"
                                        >
                                            Pedido Alterado
                                        </button>
                                    </div>
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
                        options={['Todos', 'Pendente', 'Separando', 'Concluído', 'Enviado', 'Cancelado']}
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
                        className="bg-primaryBlueDark hover:bg-primaryOpaci text-white px-4 py-2 rounded mt-4"
                    >
                        Aplicar Filtros
                    </button>
                </div>
            </Modal>

            <Modal
                isOpen={isOrderChangedModalOpen}
                onClose={() => setIsOrderChangedModalOpen(false)}
            >
                <div className="text-center text-gray-700">
                    <h2 className="text-xl font-semibold mb-4">Seu pedido foi alterado</h2>
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold">Motivo da Alteração</h3>
                        <div dangerouslySetInnerHTML={{ __html: orderChangeDetails?.reasonChange }} />
                    </div>
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold">Pedido Original</h3>
                        {orderChangeDetails?.originalOrder && Object.entries(orderChangeDetails.originalOrder).map(([itemNome, quantidade]) => (
                            <div key={itemNome} className="flex justify-between mb-2">
                                <span>{itemNome}</span>
                                <span>Qtd: {quantidade}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold">Pedido Atualizado</h3>
                        {orderChangeDetails?.item && Object.entries(orderChangeDetails.item).map(([itemNome, quantidade]) => (
                            <div key={itemNome} className="flex justify-between mb-2">
                                <span>{itemNome}</span>
                                <span>Qtd: {quantidade}</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-center mt-4">
                        <button
                            onClick={() => setIsOrderChangedModalOpen(false)}
                            className="bg-gray-500 text-white px-4 py-2 rounded"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            </Modal>


            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    closeModal();
                    setSelectedDate(null); // Limpa a data ao fechar o modal
                }}
            >
                <div className="text-center text-gray-700">
                    <h2 className="text-xl font-semibold mb-4">Que dia você recebeu?</h2>
                    <DatePicker
                        selected={selectedDate}
                        onChange={(date) => setSelectedDate(date)}
                        className="w-full p-2 border border-gray-300 rounded mb-4"
                        placeholderText="Selecione a data"
                        dateFormat="dd/MM/yyyy"
                    />
                    <div className="flex justify-center mt-4">
                        <button
                            onClick={async () => {
                                if (!selectedDate) {
                                    alert('Por favor, selecione uma data antes de salvar.');
                                    return;
                                }
                                try {
                                    const solicitacaoRef = doc(db, 'solicitCompras', selectedSolicitacao.id);
                                    await updateDoc(solicitacaoRef, {
                                        status: 'Concluído',
                                        dateReceived: selectedDate // Grava a data selecionada
                                    });
                                    setIsModalOpen(false); // Fecha o modal após salvar
                                    setSelectedDate(null); // Limpa a data após salvar
                                } catch (error) {
                                    console.error('Erro ao atualizar solicitação:', error);
                                }
                            }}
                            className="bg-green-500 text-white px-4 py-2 rounded mr-2"
                        >
                            Salvar
                        </button>
                        <button
                            onClick={() => {
                                setIsModalOpen(false);
                                setSelectedDate(null); // Limpa a data ao cancelar
                            }}
                            className="bg-gray-500 text-white px-4 py-2 rounded"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isReasonModalOpen} onClose={() => setIsReasonModalOpen(false)}>
                <div className="text-center text-gray-700">
                    <h2 className="text-xl font-semibold mb-4">Motivo do Cancelamento</h2>
                    <div dangerouslySetInnerHTML={{ __html: canceledReason }} />
                    <div className="flex justify-center mt-4">
                        <button
                            onClick={() => setIsReasonModalOpen(false)}
                            className="bg-gray-500 text-white px-4 py-2 rounded"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            </Modal>

        </div>
    );
};

export default ListaSolicitCompras;
